/**
 * Converts each attributed enemy death into one independent reward group.
 */
class RogueKillProgress {
    /** Summon skills whose spawned actor can repair missing runtime ownership. */
    private static readonly SUMMON_SKILL_ACTOR_IDS: any = {
        17: 1011,
        35: 1011,
        36: 1009,
        37: 1010,
        39: 1012,
        1016: 1009,
        1017: 1010,
        1018: 1011
    };

    /**
     * Records the active caster for battlers created by a summon skill.
     * Nested summons point at the root party battler so rewards never belong
     * to a temporary scene object.
     */
    static attachSummonOwner(battler: ProjectClientSceneObject, explicitOwner: ProjectClientSceneObject = null): void {
        if (!RogueRunManager.active || !battler || GameBattle.state !== 2) return;
        let owner = explicitOwner || GameBattleAction.fromBattler;
        if (!owner || owner === battler || (!explicitOwner && !GameBattleAction.fromBattlerSkill)) return;
        if (!GameBattleHelper.isBattler(owner) || !GameBattleHelper.isBattler(battler)) return;
        let battlerModule = battler.getModule(6) as SoModule_Battler;
        let ownerModule = owner.getModule(6) as SoModule_Battler;
        if (!battlerModule || !ownerModule || battlerModule.battleCamp !== ownerModule.battleCamp) return;
        if (GameBattleHelper.isInPlayerParty(battler)) return;
        if (battlerModule["__rogueOwnerIndex"] != null) {
            battler["__rogueOwnerIndex"] = battlerModule["__rogueOwnerIndex"];
            return;
        }
        let rootOwner = this.resolveRootOwner(owner);
        battlerModule["__rogueOwnerIndex"] = rootOwner.index;
        // A status-page change replaces module 6. Keep ownership on the map
        // object as well so the summon continues to credit its summoner.
        battler["__rogueOwnerIndex"] = rootOwner.index;
    }

    /**
     * Bind a summon at the exact moment an event creates it. This avoids
     * relying on the transient active-skill fields during the next camp scan.
     * Generic event-spawned actors are ignored unless their actor ID is one of
     * the registered summon definitions.
     */
    static attachSummonOwnerAtSpawn(battler: ProjectClientSceneObject, owner: ProjectClientSceneObject): void {
        if (!battler || !owner) return;
        let battlerModule = battler.getModule(6) as SoModule_Battler;
        if (!battlerModule || !battlerModule.actor || !this.isSummonActorID(battlerModule.actor.id)) return;
        this.attachSummonOwner(battler, owner);
    }

    static markDamageSource(target: ProjectClientSceneObject, owner: ProjectClientSceneObject, skill: Module_Skill = null, secondary: boolean = false): void {
        if (!RogueRunManager.active || !target || !owner) return;
        let targetModule = target.getModule(6) as SoModule_Battler;
        if (!targetModule) return;
        let rootOwner = this.resolveRootOwner(owner);
        let ownerIndex = rootOwner ? rootOwner.index : owner.index;
        targetModule["__rogueLastDamageOwnerIndex"] = ownerIndex;
        targetModule["__rogueLastDamageSkillID"] = skill ? skill.id : 0;
        targetModule["__rogueLastDamageSecondary"] = secondary;
        // Death can be resolved against an old module after a status-page
        // switch. The scene object is the stable attribution record.
        target["__rogueLastDamageOwnerIndex"] = ownerIndex;
        target["__rogueLastDamageSkillID"] = skill ? skill.id : 0;
        target["__rogueLastDamageSecondary"] = secondary;
        // Preserve the mark owner before die() clears all statuses.
        let statuses = targetModule.actor && targetModule.actor.status || [];
        for (let i = 0; i < statuses.length; i++) if (statuses[i].id === 39) {
            targetModule["__rogueTacticalMarkerOwnerIndex"] = statuses[i].fromBattlerID;
            target["__rogueTacticalMarkerOwnerIndex"] = statuses[i].fromBattlerID;
            break;
        }
        for (let i = 0; i < statuses.length; i++) if (statuses[i].id === 38) {
            targetModule["__rogueCorrosionOwnerIndex"] = statuses[i].fromBattlerID;
            target["__rogueCorrosionOwnerIndex"] = statuses[i].fromBattlerID;
            break;
        }
    }

    static onBattlerDie(battler: ProjectClientSceneObject, oldModule: SoModule_Battler = null): void {
        if (!RogueRunManager.active || !battler) return;
        let currentModule = battler.getModule(6) as SoModule_Battler;
        let battlerModule = oldModule || currentModule;
        if (!battlerModule || battlerModule.battleCamp !== 1) return;
        let deathData = this.getDeathAttribution(battler, currentModule, oldModule);
        let owner = this.resolveOwner(deathData);
        if (!owner || !GameBattleHelper.isInPlayerParty(owner)) return;
        let secondary = deathData["__rogueLastDamageSecondary"] === true;
        if (typeof RogueSkillSynergySystem !== "undefined") {
            RogueSkillSynergySystem.onAttributedKill(owner, battler, deathData["__rogueLastDamageSkillID"] || 0, secondary);
        }
        // Secondary damage must not recursively trigger kill synergies, but it
        // still killed one enemy and therefore earns that enemy's reward.
        let deathUID = this.getBattlerUID(battler, battlerModule);
        let state = RogueRunManager.state;
        if (state.processedDeathIDs.indexOf(deathUID) >= 0) return;
        state.processedDeathIDs.push(deathUID);
        state.killCount++;
        state.runLevel++;
        let levelUp = this.increaseOwnerLevel(owner);
        let ownerUID = this.getBattlerUID(owner);
        let rewardGroup = RogueRewardPool.createRewardGroup(deathUID, ownerUID);
        if (rewardGroup) {
            rewardGroup.killOwnerPartyIndex = levelUp.partyIndex;
            rewardGroup.killOwnerActorID = levelUp.actorID;
            rewardGroup.killOwnerActorName = levelUp.actorName;
            rewardGroup.levelFrom = levelUp.fromLv;
            rewardGroup.levelTo = levelUp.toLv;
            rewardGroup.didLevelUp = levelUp.didLevelUp;
            state.rewardQueue.push(rewardGroup);
        }
        RogueRunManager.syncRuntimeState();
        EventUtils.happen(RogueRunManager, RogueRunManager.EVENT_RUN_STATE_CHANGED, [state]);
        // 每次击杀都把独立奖励队列和对应角色等级一起写入存档，避免
        // 奖励界面弹出前或连续多杀中途退出造成进度丢失。
        if (typeof RogueRunManager.saveProgress === "function") RogueRunManager.saveProgress();
    }

    /** Applies the run's one-kill/one-level rule to the character credited with the kill. */
    private static increaseOwnerLevel(owner: ProjectClientSceneObject): any {
        let ownerModule = owner.getModule(6) as SoModule_Battler;
        let actor = ownerModule && ownerModule.actor;
        let partyIndex = actor ? ProjectPlayer.getPlayerActorIndexByActor(actor) : -1;
        let actorDS = partyIndex >= 0 ? ProjectPlayer.getPlayerActorDSByInPartyIndex(partyIndex) : null;
        let fromLv = actorDS ? Math.max(1, actorDS.lv || 1) : 0;
        let maxLv = actor ? Math.max(fromLv, actor.MaxLv || fromLv) : fromLv;
        let toLv = actorDS ? Math.min(maxLv, fromLv + 1) : fromLv;
        let didLevelUp = !!actorDS && toLv > fromLv;
        if (didLevelUp) {
            let oldHP = actor.hp;
            let oldSP = actor.sp;
            actorDS.lv = toLv;
            // Reuse the normal actor initialization so growth attributes and
            // level-gated skills stay consistent, while preserving run HP/SP.
            ProjectPlayer.initPlayerActor(partyIndex, false);
            actor.hp = Math.max(0, Math.min(actor.MaxHP, oldHP));
            actor.sp = Math.max(0, Math.min(actor.MaxSP, oldSP));
            EventUtils.happen(ProjectPlayer, ProjectPlayer.EVENT_PLAYER_ACTOR_CHANGE_LEVEL, [partyIndex, toLv]);
            if (actor.levelUpEvent) {
                CommandPage.startTriggerFragmentEvent(actor.levelUpEvent, Game.player.sceneObject, Game.player.sceneObject);
            }
            let actorClass = GameData.getModuleData(7, actor.class) as Module_Class;
            if (actorClass && actorClass.levelUpEvent) {
                CommandPage.startTriggerFragmentEvent(actorClass.levelUpEvent, Game.player.sceneObject, Game.player.sceneObject);
            }
        }
        return {
            partyIndex: partyIndex,
            actorID: actor ? actor.id : 0,
            actorName: actor ? actor.name : "",
            fromLv: fromLv,
            toLv: toLv,
            didLevelUp: didLevelUp
        };
    }

    private static getDeathAttribution(battler: ProjectClientSceneObject, currentModule: SoModule_Battler, oldModule: SoModule_Battler): any {
        let sources: any[] = [battler, currentModule, oldModule];
        let data: any = {};
        let keys = ["__rogueLastDamageOwnerIndex", "__rogueLastDamageSkillID", "__rogueLastDamageSecondary"];
        for (let k = 0; k < keys.length; k++) {
            let key = keys[k];
            for (let i = 0; i < sources.length; i++) {
                if (sources[i] && sources[i][key] != null) {
                    data[key] = sources[i][key];
                    break;
                }
            }
        }
        return data;
    }

    private static resolveOwner(deadData: any): ProjectClientSceneObject {
        let ownerIndex = deadData && deadData["__rogueLastDamageOwnerIndex"];
        if (ownerIndex != null && Game.currentScene) {
            let owner = Game.currentScene.sceneObjects[ownerIndex] as ProjectClientSceneObject;
            if (owner && GameBattleHelper.isBattler(owner)) return this.resolveRootOwner(owner);
        }
        // A few custom damage/status paths resolve death before the normal
        // post-hit source marker runs. Try both active action participants:
        // during a counterattack/return-damage sequence `fromBattler` still
        // points at the enemy, while `reverseBattler` is the player (or their
        // summon) that actually dealt the killing damage.
        if (typeof GameBattleAction !== "undefined") {
            let fallbackOwners = [GameBattleAction.reverseBattler, GameBattleAction.fromBattler];
            for (let i = 0; i < fallbackOwners.length; i++) {
                let actionOwner = fallbackOwners[i] as ProjectClientSceneObject;
                if (!GameBattleHelper.isBattler(actionOwner)) continue;
                // Summons are not direct party entries, so resolve their root
                // owner before checking party membership.
                let resolvedOwner = this.resolveRootOwner(actionOwner);
                if (!GameBattleHelper.isInPlayerParty(resolvedOwner)) continue;
                let actionModule = resolvedOwner.getModule(6) as SoModule_Battler;
                if (actionModule && actionModule.battleCamp === 0) return resolvedOwner;
            }
        }
        return null;
    }

    private static resolveRootOwner(owner: ProjectClientSceneObject): ProjectClientSceneObject {
        if (!Game.currentScene) return owner;
        let visited: any = {};
        while (owner && !visited[owner.index]) {
            visited[owner.index] = true;
            let ownerModule = owner.getModule(6) as SoModule_Battler;
            let summonOwnerIndex = owner["__rogueOwnerIndex"];
            if (summonOwnerIndex == null) summonOwnerIndex = ownerModule && ownerModule["__rogueOwnerIndex"];
            if (summonOwnerIndex == null) {
                let inferredOwner = this.inferSummonOwner(owner, ownerModule);
                if (inferredOwner) {
                    this.attachSummonOwner(owner, inferredOwner);
                    summonOwnerIndex = inferredOwner.index;
                }
            }
            if (summonOwnerIndex == null) break;
            let summonOwner = Game.currentScene.sceneObjects[summonOwnerIndex] as ProjectClientSceneObject;
            if (!summonOwner || !GameBattleHelper.isBattler(summonOwner)) break;
            owner = summonOwner;
        }
        return owner;
    }

    /**
     * Repairs summons created by event commands before the normal appearance
     * hook could see the active skill. Only an unambiguous party summoner is
     * accepted, so friendly NPCs are never assigned by camp alone.
     */
    private static inferSummonOwner(summon: ProjectClientSceneObject, summonModule: SoModule_Battler): ProjectClientSceneObject {
        if (!summonModule || summonModule.battleCamp !== 0 || !summonModule.actor || !Game.currentScene) return null;
        if (GameBattleHelper.isInPlayerParty(summon)) return null;
        let summonActorID = summonModule.actor.id;
        let candidates: ProjectClientSceneObject[] = [];
        for (let i = 0; i < Game.currentScene.sceneObjects.length; i++) {
            let battler = Game.currentScene.sceneObjects[i] as ProjectClientSceneObject;
            if (!GameBattleHelper.isInPlayerParty(battler)) continue;
            let module = battler.getModule(6) as SoModule_Battler;
            let skills = module && module.actor && module.actor.skills || [];
            for (let s = 0; s < skills.length; s++) {
                if (this.SUMMON_SKILL_ACTOR_IDS[skills[s].id] === summonActorID) {
                    candidates.push(battler);
                    break;
                }
            }
        }
        return candidates.length === 1 ? candidates[0] : null;
    }

    private static isSummonActorID(actorID: number): boolean {
        for (let skillID in this.SUMMON_SKILL_ACTOR_IDS) {
            if (this.SUMMON_SKILL_ACTOR_IDS[skillID] === actorID) return true;
        }
        return false;
    }

    private static getBattlerUID(battler: ProjectClientSceneObject, knownModule: SoModule_Battler = null): string {
        let module = knownModule || battler.getModule(6) as SoModule_Battler;
        let incarnationUID = module && module["__rogueIncarnationUID"];
        if (!incarnationUID) {
            let state = RogueRunManager.state;
            state.battlerUIDCounter = (state.battlerUIDCounter || 0) + 1;
            incarnationUID = state.runID + ":battler:" + state.battlerUIDCounter;
            if (module) module["__rogueIncarnationUID"] = incarnationUID;
        }
        let sceneID = Game.currentScene ? Game.currentScene.id : 0;
        let nodeID = RogueRunManager.state.currentNodeID || "unknown";
        // Keep the scene-object index as the final segment for owner-to-party lookup.
        return nodeID + ":" + sceneID + ":" + incarnationUID + ":" + battler.index;
    }
}
