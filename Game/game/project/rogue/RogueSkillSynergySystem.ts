/** Runtime rules shared by the roguelike blood and elemental skill families. */
class RogueSkillSynergySystem {
    static readonly STATUS_BLOOD_RAGE: number = 27;
    static readonly STATUS_BLOOD_DOMAIN: number = 28;
    static readonly STATUS_UNDYING_MARK: number = 29;
    static readonly STATUS_BARRIER: number = 37;
    static readonly STATUS_CORROSION: number = 38;
    static readonly STATUS_TACTICAL_MARK: number = 39;
    static readonly STATUS_EMBER_ECHO: number = 40;
    static readonly STATUS_SWORD_MOMENTUM: number = 41;
    static readonly STATUS_WIND_DOMAIN: number = 42;
    static readonly STATUS_DRUNK_MOMENTUM: number = 43;
    static readonly STATUS_DRUNK_STATE: number = 44;
    static readonly STATUS_STAGGER: number = 45;
    private static readonly SWORD_SKILLS: number[] = [61, 62, 63, 64, 65, 66];
    private static readonly NEGATIVE_STATUSES: number[] = [1, 2, 3, 4, 5, 6, 9, 11, 13, 15, 17, 18, 19, 20, 23, 38, 39, 40];
    private static actionSerial: number = 0;

    static onBattleStart(): void {
        if (!RogueRunManager.active || !Game.currentScene) return;
        this.actionSerial = 0;
        for (let i = 0; i < Game.currentScene.sceneObjects.length; i++) {
            let battler = Game.currentScene.sceneObjects[i] as ProjectClientSceneObject;
            if (!GameBattleHelper.isBattler(battler)) continue;
            let module = battler.getModule(6) as SoModule_Battler;
            module["__rogueUndyingUsed"] = false;
            module["__rogueBloodDomainUsed"] = false;
            module["__rogueBloodHealAction"] = 0;
            module["__rogueBloodHealValue"] = 0;
            module["__rogueBloodRageAction"] = 0;
            module["__rogueReactionRound"] = -1;
            module["__rogueExplosionCount"] = 0;
            module["__rogueSwordTargets"] = [];
            module["__rogueSwordHeartUsed"] = false;
            module["__rogueSwordCooldownReady"] = false;
            module["__rogueSwordDamageReady"] = false;
            module["__rogueEmberRound"] = -1;
            module["__rogueEmberCount"] = 0;
            module["__rogueKillRound"] = -1;
            module["__rogueKillTriggered"] = false;
            if (GameBattleHelper.isInPlayerParty(battler) && this.hasSkill(module.actor, 47)) {
                GameBattleData.addStatus(battler, this.STATUS_UNDYING_MARK, battler, true);
            }
        }
    }

    static onBattleStop(): void {
        if (!Game.currentScene) return;
        for (let i = 0; i < Game.currentScene.sceneObjects.length; i++) {
            let battler = Game.currentScene.sceneObjects[i] as ProjectClientSceneObject;
            if (!GameBattleHelper.isBattler(battler)) continue;
            for (let statusID = this.STATUS_BLOOD_RAGE; statusID <= this.STATUS_STAGGER; statusID++) {
                GameBattleData.removeStatus(battler, statusID);
            }
        }
    }

    static beginAction(battler: ProjectClientSceneObject): void {
        if (!RogueRunManager.active || !battler) return;
        let module = battler.getModule(6) as SoModule_Battler;
        this.actionSerial++;
        module["__rogueActionID"] = this.actionSerial;
        module["__rogueBloodHealAction"] = this.actionSerial;
        module["__rogueBloodHealValue"] = 0;
        module["__rogueBloodRageAction"] = 0;
        module["__rogueSwordTargets"] = [];
        if (module["__rogueEmberRound"] !== GameBattle.battleRound) {
            module["__rogueEmberRound"] = GameBattle.battleRound;
            module["__rogueEmberCount"] = 0;
        }
    }

    static canUseItem(battler: ProjectClientSceneObject, item: Module_Item): boolean {
        if (!item || item.id < 22 || item.id > 25) return true;
        if (!RogueRunManager.active || !battler || !GameBattleHelper.isInPlayerParty(battler)) return false;
        return true;
    }

    static isSelfTargetItem(item: Module_Item): boolean {
        return !!item && item.id >= 23 && item.id <= 25;
    }

    static canUseItemOnTarget(fromBattler: ProjectClientSceneObject, targetBattler: ProjectClientSceneObject, item: Module_Item): boolean {
        if (!fromBattler || !targetBattler || !item) return false;
        if (this.isSelfTargetItem(item)) return fromBattler === targetBattler;
        if (item.id !== 22) return true;
        if (!RogueRunManager.active || !GameBattleHelper.isInPlayerParty(targetBattler)) return false;
        let module = targetBattler.getModule(6) as SoModule_Battler;
        return !module["__rogueUndyingUsed"] && !GameBattleHelper.isIncludeStatus(targetBattler, this.STATUS_UNDYING_MARK);
    }

    static onUseSkill(fromBattler: ProjectClientSceneObject, skill: Module_Skill, targets: ProjectClientSceneObject[], firstUse: boolean): void {
        if (!RogueRunManager.active || !firstUse || !fromBattler || !skill) return;
        this.beginAction(fromBattler);
        let module = fromBattler.getModule(6) as SoModule_Battler;
        let percent = ({ 41: 10, 42: 15, 43: 12, 48: 35, 60: 15 } as any)[skill.id] || 0;
        if (percent > 0) {
            let cost = Math.max(1, Math.floor(module.actor.hp * percent * 0.01));
            module.actor.hp = Math.max(1, module.actor.hp - cost);
        }
        if (skill.id === 42 && targets && targets.length >= 2) this.addBloodRage(fromBattler, 1);
        if (skill.id === 48) {
            let rage = this.getStatus(module.actor, this.STATUS_BLOOD_RAGE);
            skill["__rogueBloodRageSnapshot"] = rage ? rage.currentLayer : 0;
            if (rage) {
                GameBattleData.removeStatus(fromBattler, this.STATUS_BLOOD_RAGE);
                this.refreshActor(fromBattler);
            }
        }
        if (skill.id === 65) {
            let momentum = this.getStatus(module.actor, this.STATUS_SWORD_MOMENTUM);
            skill["__rogueSwordMomentumSnapshot"] = momentum ? momentum.currentLayer : 0;
            GameBattleData.removeStatus(fromBattler, this.STATUS_SWORD_MOMENTUM);
            this.refreshActor(fromBattler);
        }
        this.updateBloodDomain(fromBattler);
        if (firstUse && this.isSwordSkill(skill) && module["__rogueSwordCooldownReady"]) {
            module["__rogueSwordCooldownReady"] = false;
            skill["__rogueCooldownReduction"] = 1;
        }
    }

    static captureHitState(targetBattler: ProjectClientSceneObject): any {
        if (!RogueRunManager.active || !targetBattler) return null;
        return {
            frozen: GameBattleHelper.isIncludeStatus(targetBattler, 4),
            burning: GameBattleHelper.isIncludeStatus(targetBattler, 3)
        };
    }

    static getDamageMultiplier(fromBattler: ProjectClientSceneObject, skill: Module_Skill, targetBattler: ProjectClientSceneObject = null, actionType: number = 1): number {
        if (!RogueRunManager.active || !fromBattler) return 1;
        let holder = this.resolveRootOwner(fromBattler);
        let actor = holder && holder.getModule(6) ? (holder.getModule(6) as SoModule_Battler).actor : null;
        let multiplier = 1;
        if (skill && skill.id === 48) multiplier *= 1 + (skill["__rogueBloodRageSnapshot"] || 0) * 0.1;
        if (skill && this.isSwordSkill(skill)) {
            let holderModule = holder && holder.getModule(6) ? holder.getModule(6) as SoModule_Battler : null;
            if (holderModule && holderModule["__rogueSwordDamageReady"] && holderModule["__rogueSwordHeartActionID"] !== holderModule["__rogueActionID"]) {
                multiplier *= 1.2;
                holderModule["__rogueSwordDamageReady"] = false;
            }
            let momentum = actor ? this.getStatus(actor, this.STATUS_SWORD_MOMENTUM) : null;
            if (momentum && this.hasSkill(actor, 63)) {
                let per = this.getSkillLevelBonus(actor, 63, 0.06, 0.08);
                multiplier *= 1 + momentum.currentLayer * per;
            }
            if (skill.id === 65 && skill["__rogueSwordMomentumSnapshot"]) multiplier *= 1 + skill["__rogueSwordMomentumSnapshot"] * 0.1;
            if (skill.id === 61 && targetBattler && GameBattleHelper.isIncludeStatus(targetBattler, 4)) multiplier *= this.getSkillLevel(actor, 61) >= 2 ? 1.5 : 1.35;
            if (skill.id === 67 && targetBattler && GameBattleHelper.isIncludeStatus(targetBattler, 4) && this.getSkillLevel(actor, 67) >= 3) multiplier *= 1.25;
            if (skill.id === 64 && targetBattler && this.hasTacticalMarkFromSide(targetBattler, holder)) multiplier *= 1.15;
            if (skill.id === 65 && targetBattler && this.hasTacticalMarkFromSide(targetBattler, holder)) multiplier *= 1.15;
        }
        let holderRuntimeModule = holder && holder.getModule(6) ? holder.getModule(6) as SoModule_Battler : null;
        if (targetBattler && actionType <= 1 && holderRuntimeModule && holderRuntimeModule["__rogueKillDamageReady"] && holderRuntimeModule["__rogueKillDamageActionID"] !== holderRuntimeModule["__rogueActionID"]) {
            multiplier *= 1.2;
            holderRuntimeModule["__rogueKillDamageReady"] = false;
        }
        if (targetBattler && actionType <= 1 && actor && this.hasSkill(actor, 73) && this.hasNegativeStatus(targetBattler)) {
            let module = holder.getModule(6) as SoModule_Battler;
            let actionID = module["__rogueActionID"] || 0;
            let targetModule = targetBattler.getModule(6) as SoModule_Battler;
            if (targetModule["__rogueInsightAction"] !== actionID) {
                targetModule["__rogueInsightAction"] = actionID;
                let level = this.getSkillLevel(actor, 73);
                multiplier *= 1 + (level >= 2 ? 0.15 : 0.1);
                if (level >= 3) {
                    let statuses = (targetBattler.getModule(6) as SoModule_Battler).actor.status || [];
                    let negativeCount = 0;
                    for (let i = 0; i < statuses.length; i++) if (this.hasNegativeStatusID(statuses[i].id)) negativeCount++;
                    multiplier *= 1 + Math.min(3, Math.max(0, negativeCount - 1)) * 0.05;
                }
            }
        }
        if (targetBattler && actionType === 1 && skill && skill.elementType !== 1 && GameBattleHelper.isIncludeStatus(targetBattler, this.STATUS_EMBER_ECHO)) {
            multiplier *= this.getSkillLevel(actor, 72) >= 2 ? 1.45 : 1.3;
            targetBattler["__rogueConsumeEmberEcho"] = true;
        }
        return multiplier;
    }

    static getCritBonus(fromBattler: ProjectClientSceneObject, targetBattler: ProjectClientSceneObject, actionType: number, skill: Module_Skill): number {
        if (!RogueRunManager.active || actionType > 1 || !fromBattler || !targetBattler) return 0;
        let holder = this.resolveRootOwner(fromBattler);
        let actor = holder && holder.getModule(6) ? (holder.getModule(6) as SoModule_Battler).actor : null;
        return actor && this.hasSkill(actor, 73) && this.hasNegativeStatus(targetBattler) ? (this.getSkillLevel(actor, 73) >= 2 ? 20 : 15) : 0;
    }

    static getDodgeBonus(targetBattler: ProjectClientSceneObject): number {
        return RogueRunManager.active && targetBattler && GameBattleHelper.isIncludeStatus(targetBattler, this.STATUS_WIND_DOMAIN) ? 10 : 0;
    }

    static absorbDamage(targetBattler: ProjectClientSceneObject, hpChangeValue: number, secondary: boolean = false): number {
        if (secondary || !RogueRunManager.active || !targetBattler || hpChangeValue >= 0 || !GameBattleHelper.isIncludeStatus(targetBattler, this.STATUS_BARRIER)) return hpChangeValue;
        let actor = (targetBattler.getModule(6) as SoModule_Battler).actor;
        let barrier = this.getStatus(actor, this.STATUS_BARRIER);
        if (!barrier) return hpChangeValue;
        let absorb = Math.min(-hpChangeValue, Math.floor(actor.MaxHP * (barrier["__rogueBarrierPercent"] || 0.2)));
        GameBattleData.removeStatus(targetBattler, this.STATUS_BARRIER);
        return hpChangeValue + absorb;
    }

    static consumeCooldownReduction(battler: ProjectClientSceneObject, skill: Module_Skill): number {
        if (!skill || !this.isSwordSkill(skill)) return 0;
        let value = skill["__rogueCooldownReduction"] || 0;
        skill["__rogueCooldownReduction"] = 0;
        return value;
    }

    static getSkillLevelForBattler(battler: ProjectClientSceneObject, skillID: number): number {
        let holder = this.resolveRootOwner(battler);
        let actor = holder && holder.getModule(6) ? (holder.getModule(6) as SoModule_Battler).actor : null;
        return this.getSkillLevel(actor, skillID);
    }

    static onAttributedKill(owner: ProjectClientSceneObject, deadBattler: ProjectClientSceneObject, skillID: number = 0, secondary: boolean = false): void {
        if (secondary || !RogueRunManager.active || !owner) return;
        let holder = this.resolveRootOwner(owner);
        let module = holder && holder.getModule(6) ? holder.getModule(6) as SoModule_Battler : null;
        let actor = module && module.actor;
        if (!actor) return;
        let actionID = module["__rogueActionID"] || 0;
        if (this.hasSkill(actor, 66) && this.isSwordSkill({ id: skillID } as Module_Skill) && !module["__rogueSwordHeartUsed"]) {
            this.triggerSwordHeart(holder);
        }
        if (this.hasSkill(actor, 75) && module["__rogueKillRound"] !== GameBattle.battleRound) {
            module["__rogueKillRound"] = GameBattle.battleRound;
            this.restoreSP(holder, this.getSkillLevel(actor, 75) >= 2 ? 0.1 : 0.08);
            this.reduceOneActiveCooldown(holder);
            if (this.getSkillLevel(actor, 75) >= 3) { module["__rogueKillDamageReady"] = true; module["__rogueKillDamageActionID"] = module["__rogueActionID"]; }
        }
        if (deadBattler && deadBattler["__rogueTacticalMarkerOwnerIndex"] != null) {
            let markedOwner = Game.currentScene && Game.currentScene.sceneObjects[deadBattler["__rogueTacticalMarkerOwnerIndex"]] as ProjectClientSceneObject;
            markedOwner = markedOwner ? this.resolveRootOwner(markedOwner) : null;
            if (markedOwner && this.hasSkill((markedOwner.getModule(6) as SoModule_Battler).actor, 74)) {
                let markedActor = (markedOwner.getModule(6) as SoModule_Battler).actor;
                this.restoreSP(markedOwner, this.getSkillLevel(markedActor, 74) >= 2 ? 0.15 : 0.1);
            }
        }
        if (deadBattler && deadBattler["__rogueCorrosionOwnerIndex"] != null && Game.currentScene) {
            let corrosionOwner = Game.currentScene.sceneObjects[deadBattler["__rogueCorrosionOwnerIndex"]] as ProjectClientSceneObject;
            corrosionOwner = corrosionOwner ? this.resolveRootOwner(corrosionOwner) : null;
            let corrosionModule = corrosionOwner && corrosionOwner.getModule(6) ? corrosionOwner.getModule(6) as SoModule_Battler : null;
            if (corrosionModule && this.hasSkill(corrosionModule.actor, 70) && this.getSkillLevel(corrosionModule.actor, 70) >= 3 && corrosionModule["__rogueCorrosionKillRound"] !== GameBattle.battleRound) {
                corrosionModule["__rogueCorrosionKillRound"] = GameBattle.battleRound;
                this.restoreSP(corrosionOwner, 0.05);
            }
        }
    }

    private static triggerSwordHeart(holder: ProjectClientSceneObject): void {
        let module = holder.getModule(6) as SoModule_Battler;
        module["__rogueSwordHeartUsed"] = true;
        this.restoreSP(holder, this.getSkillLevel((holder.getModule(6) as SoModule_Battler).actor, 66) >= 2 ? 0.15 : 0.12);
        module["__rogueSwordCooldownReady"] = true;
        if (this.getSkillLevel(module.actor, 66) >= 3) { module["__rogueSwordDamageReady"] = true; module["__rogueSwordHeartActionID"] = module["__rogueActionID"]; }
    }

    private static restoreSP(holder: ProjectClientSceneObject, percent: number): void {
        let actor = (holder.getModule(6) as SoModule_Battler).actor;
        actor.sp = Math.min(actor.MaxSP, actor.sp + Math.max(1, Math.floor(actor.MaxSP * percent)));
    }

    private static reduceOneActiveCooldown(holder: ProjectClientSceneObject): void {
        let actor = (holder.getModule(6) as SoModule_Battler).actor;
        let skills = actor.skills || [];
        for (let i = 0; i < skills.length; i++) {
            let skill = skills[i];
            if (skill.skillType === 2 || skill.useDamage === false || skill.currentCD <= 0) continue;
            skill.currentCD = Math.max(0, skill.currentCD - 1);
            return;
        }
    }

    static preventLethalDamage(targetBattler: ProjectClientSceneObject, hpChangeValue: number): number {
        if (!RogueRunManager.active || hpChangeValue >= 0 || !targetBattler || !GameBattleHelper.isInPlayerParty(targetBattler)) return hpChangeValue;
        let module = targetBattler.getModule(6) as SoModule_Battler;
        let skillProtection = this.hasSkill(module.actor, 47);
        let itemProtection = GameBattleHelper.isIncludeStatus(targetBattler, this.STATUS_UNDYING_MARK);
        if (module.actor.hp + hpChangeValue > 0 || module["__rogueUndyingUsed"] || (!skillProtection && !itemProtection)) return hpChangeValue;
        module["__rogueUndyingUsed"] = true;
        GameBattleData.removeStatus(targetBattler, this.STATUS_UNDYING_MARK);
        if (skillProtection) {
            GameBattleData.addStatus(targetBattler, this.STATUS_BLOOD_DOMAIN, targetBattler, true);
            this.addBloodRage(targetBattler, 2);
        }
        return 1 - module.actor.hp;
    }

    static afterHit(fromBattler: ProjectClientSceneObject, targetBattler: ProjectClientSceneObject, actionType: number,
        skill: Module_Skill, result: any, hitState: any, item: Module_Item = null): any[] {
        let effects: any[] = [];
        if (actionType === 2 && item) return this.applyRogueItem(fromBattler, item);
        if (!RogueRunManager.active || !fromBattler || !targetBattler) return effects;
        let holder = this.resolveRootOwner(fromBattler);
        let holderActor = holder && holder.getModule(6) ? (holder.getModule(6) as SoModule_Battler).actor : null;
        // Non-damaging skill hooks.
        if (actionType === 1 && skill) {
            if (skill.id === 67 && holderActor && !GameBattleHelper.isIncludeStatus(targetBattler, 4) && ((targetBattler.getModule(6) as SoModule_Battler).actor.selfImmuneStatus || []).indexOf(4) >= 0) {
                GameBattleData.addStatus(targetBattler, 17, fromBattler, true);
                let slow = this.getStatus((targetBattler.getModule(6) as SoModule_Battler).actor, 17);
                if (slow) slow.currentDuration = 2;
            }
            if (skill.id === 70 && (targetBattler.getModule(6) as SoModule_Battler).actor["__rogueEnemyBoss"]) {
                let corrosion = this.getStatus((targetBattler.getModule(6) as SoModule_Battler).actor, this.STATUS_CORROSION);
                if (corrosion) corrosion.currentDuration = 1;
            }
            if (skill.id === 70) {
                let corrosion = this.getStatus((targetBattler.getModule(6) as SoModule_Battler).actor, this.STATUS_CORROSION);
                if (corrosion) {
                    targetBattler["__rogueCorrosionOwnerIndex"] = holder ? holder.index : fromBattler.index;
                    (targetBattler.getModule(6) as SoModule_Battler)["__rogueCorrosionOwnerIndex"] = holder ? holder.index : fromBattler.index;
                    if (this.getSkillLevel(holderActor, 70) >= 2) { corrosion.defPer = 80; corrosion.magDefPer = 80; this.refreshActor(targetBattler); }
                }
            }
            if (skill.id === 71) {
                let statuses = (targetBattler.getModule(6) as SoModule_Battler).actor.status;
                for (let i = 0; i < statuses.length; i++) if (this.hasNegativeStatusID(statuses[i].id)) { GameBattleData.removeStatus(targetBattler, statuses[i].id); break; }
                let barrier = this.getStatus((targetBattler.getModule(6) as SoModule_Battler).actor, this.STATUS_BARRIER);
                if (barrier && this.getSkillLevel(holderActor, 71) >= 2) barrier["__rogueBarrierPercent"] = 0.25;
            }
            if (skill.id === 69 && this.getSkillLevel(holderActor, 69) >= 2) {
                let wind = this.getStatus((targetBattler.getModule(6) as SoModule_Battler).actor, this.STATUS_WIND_DOMAIN);
                if (wind) wind.currentDuration = 3;
            }
            if (skill.id === 74) {
                targetBattler["__rogueTacticalMarkerOwnerIndex"] = holder ? holder.index : fromBattler.index;
                let mark = this.getStatus((targetBattler.getModule(6) as SoModule_Battler).actor, this.STATUS_TACTICAL_MARK);
                if (mark && this.getSkillLevel(holderActor, 74) >= 2) mark.currentDuration = 3;
            }
        }
        if (!result || result.damage >= 0) return effects;
        let directAction = actionType === 0 || actionType === 1;
        // Skill 81 is a true passive: when it is acquired by another actor,
        // normal attacks must grant 酒势 just like 萧酉歌's native actor rule.
        // 萧酉歌 already receives the status from hitTargetSelfAddStatus, so
        // skip the runtime hook there to avoid double-stacking per hit.
        if (actionType === 0 && holderActor && this.hasSkill(holderActor, 81) &&
            ((holderActor.hitTargetSelfAddStatus || []).indexOf(this.STATUS_DRUNK_MOMENTUM) < 0)) {
            GameBattleData.addStatus(holder, this.STATUS_DRUNK_MOMENTUM, holder, true);
            this.refreshActor(holder);
        }
        if (directAction) this.applyBloodOnDamage(fromBattler, targetBattler, skill, -result.damage);
        if (directAction && skill && this.isSwordSkill(skill) && result.damage < 0) this.registerSwordHit(holder, targetBattler, skill);
        if (directAction && skill && skill.id === 65 && this.getSkillLevel(holderActor, 65) >= 3 &&
            (skill["__rogueSwordMomentumSnapshot"] || 0) >= 2) {
            let targetActor = (targetBattler.getModule(6) as SoModule_Battler).actor;
            if (targetActor.hp > 0 && targetActor.hp <= targetActor.MaxHP * 0.25 && !targetActor["__rogueEnemyBoss"]) targetActor.hp = 0;
        }
        if (directAction && skill && skill.id === 61 && hitState && hitState.frozen) {
            this.addSwordMomentum(holder, 1);
            if (this.getSkillLevel(holderActor, 61) >= 3 && holder.getModule(6)["__rogueFrostMomentumRound"] !== GameBattle.battleRound) {
                holder.getModule(6)["__rogueFrostMomentumRound"] = GameBattle.battleRound;
                this.addSwordMomentum(holder, 1);
            }
        }
        if (directAction && skill && skill.id === 62 && !hitState?.burning) {
            let burn = this.getStatus((targetBattler.getModule(6) as SoModule_Battler).actor, 3);
            if (burn) burn.currentDuration = this.getSkillLevel(holderActor, 62) >= 2 ? 2 : 1;
        }
        if (directAction && skill && holderActor && this.hasSkill(holderActor, 72) && (!hitState || !hitState.burning) && GameBattleHelper.isIncludeStatus(targetBattler, 3)) {
            let holderModule = holder.getModule(6) as SoModule_Battler;
            if (holderModule["__rogueEmberRound"] !== GameBattle.battleRound) { holderModule["__rogueEmberRound"] = GameBattle.battleRound; holderModule["__rogueEmberCount"] = 0; }
            if (holderModule["__rogueEmberCount"] < 2) {
                holderModule["__rogueEmberCount"]++;
                GameBattleData.addStatus(targetBattler, this.STATUS_EMBER_ECHO, holder, true);
            }
        }
        if (targetBattler["__rogueConsumeEmberEcho"]) {
            targetBattler["__rogueConsumeEmberEcho"] = false;
            GameBattleData.removeStatus(targetBattler, this.STATUS_EMBER_ECHO);
        }
        if (actionType !== 1 || !skill || !hitState) return effects;

        let isLightning = skill.elementType === 3;
        let triggersSuperconduct = isLightning && (hitState.frozen || skill.id === 55);
        let triggersExplosion = !triggersSuperconduct && hitState.burning && (skill.id === 53 || (skill.elementType >= 2 && skill.elementType <= 8));
        if (triggersSuperconduct) {
            GameBattleData.removeStatus(targetBattler, 4);
            let damage = Math.max(1, Math.floor((fromBattler.getModule(6) as SoModule_Battler).actor.MAG * 0.6 + 15));
            let targets = this.getNearbyEnemies(fromBattler, targetBattler, 1);
            for (let i = 0; i < targets.length; i++) {
                GameBattleData.addStatus(targets[i], 13, fromBattler, true);
                GameBattleData.addStatus(targets[i], 15, fromBattler, true);
                this.refreshActor(targets[i]);
                effects.push({ target: targets[i], damage: -damage, damageType: 1, reaction: "superconduct", secondary: true });
            }
        }
        else if (triggersExplosion) {
            GameBattleData.removeStatus(targetBattler, 3);
            let module = fromBattler.getModule(6) as SoModule_Battler;
            if (module["__rogueReactionRound"] !== GameBattle.battleRound) {
                module["__rogueReactionRound"] = GameBattle.battleRound;
                module["__rogueExplosionCount"] = 0;
            }
            let enhanced = this.hasSkill(module.actor, 54) && module["__rogueExplosionCount"] < 2;
            module["__rogueExplosionCount"]++;
            let damage = Math.max(1, Math.floor(-result.damage * (enhanced ? 0.65 : 0.5)));
            let targets = this.getNearbyEnemies(fromBattler, targetBattler, enhanced ? 2 : 1);
            for (let i = 0; i < targets.length; i++) {
                if (skill.id === 62 && this.getSkillLevel(holderActor, 62) >= 3) GameBattleData.addStatus(targets[i], 3, fromBattler, true);
                effects.push({ target: targets[i], damage: -damage, damageType: 1, reaction: "explosion", secondary: true });
            }
        }
        return effects;
    }

    private static applyRogueItem(fromBattler: ProjectClientSceneObject, item: Module_Item): any[] {
        let effects: any[] = [];
        if (!RogueRunManager.active || !fromBattler || !item || item.id < 23 || item.id > 25) return effects;
        if (!GameBattleHelper.isInPlayerParty(fromBattler)) return effects;
        this.beginAction(fromBattler);
        if (item.id === 23) {
            let targets = this.getNearbyEnemies(fromBattler, fromBattler, 1);
            for (let i = 0; i < targets.length; i++) {
                let hadBurning = GameBattleHelper.isIncludeStatus(targets[i], 3);
                GameBattleData.addStatus(targets[i], 3, fromBattler, true);
                let burning = this.getStatus((targets[i].getModule(6) as SoModule_Battler).actor, 3);
                if (!hadBurning && burning) burning.currentDuration = 2;
                effects.push({ target: targets[i], damage: -60, damageType: 1, reaction: "item-flame" });
            }
            return effects;
        }
        if (item.id === 24) {
            let targets = this.getNearbyEnemies(fromBattler, fromBattler, 2);
            let reacted: any = {};
            let reactionDamage = Math.max(1, Math.floor((fromBattler.getModule(6) as SoModule_Battler).actor.MAG * 0.6 + 15));
            for (let i = 0; i < targets.length; i++) {
                let target = targets[i];
                let frozen = GameBattleHelper.isIncludeStatus(target, 4);
                effects.push({ target: target, damage: -45, damageType: 1, reaction: "item-lightning" });
                if (!frozen) continue;
                GameBattleData.removeStatus(target, 4);
                let reactionTargets = this.getNearbyEnemies(fromBattler, target, 1);
                for (let j = 0; j < reactionTargets.length; j++) {
                    let reactionTarget = reactionTargets[j];
                    let key = String(reactionTarget.index);
                    if (reacted[key]) continue;
                    reacted[key] = true;
                    GameBattleData.addStatus(reactionTarget, 13, fromBattler, true);
                    GameBattleData.addStatus(reactionTarget, 15, fromBattler, true);
                    this.refreshActor(reactionTarget);
                    effects.push({ target: reactionTarget, damage: -reactionDamage, damageType: 1, reaction: "superconduct" });
                }
            }
            return effects;
        }
        let module = fromBattler.getModule(6) as SoModule_Battler;
        let cost = Math.max(1, Math.floor(module.actor.hp * 0.2));
        module.actor.hp = Math.max(1, module.actor.hp - cost);
        this.addBloodRage(fromBattler, 2);
        GameBattleData.addStatus(fromBattler, this.STATUS_BLOOD_DOMAIN, fromBattler, true);
        this.refreshActor(fromBattler);
        return effects;
    }

    static getRangeBonus(battler: ProjectClientSceneObject, skill: Module_Skill): number {
        if (!RogueRunManager.active || !battler || !skill || skill.skillType === 2) return 0;
        if (!GameBattleHelper.isIncludeStatus(battler, this.STATUS_BLOOD_DOMAIN)) return 0;
        if (skill.targetType === 0 || skill.targetType === 3 || skill.targetType === 4 || skill.effectRange1 <= 1) return 0;
        return 1;
    }

    static getAreaBonus(battler: ProjectClientSceneObject, skill: Module_Skill): number {
        if (!RogueRunManager.active || !battler || !skill || skill.skillType === 2) return 0;
        if (skill.targetType !== 5 && skill.targetType !== 6) return 0;
        if (skill.id === 64 && GameBattleHelper.isIncludeStatus(battler, this.STATUS_WIND_DOMAIN)) return 1;
        return GameBattleHelper.isIncludeStatus(battler, this.STATUS_BLOOD_DOMAIN) ? 1 : 0;
    }

    private static registerSwordHit(holder: ProjectClientSceneObject, target: ProjectClientSceneObject, skill: Module_Skill = null): void {
        if (!holder || !target) return;
        let module = holder.getModule(6) as SoModule_Battler;
        let targets = module["__rogueSwordTargets"] || (module["__rogueSwordTargets"] = []);
        if (targets.indexOf(target.index) < 0) targets.push(target.index);
        if (targets.length >= 2 && this.hasSkill(module.actor, 66) && !module["__rogueSwordHeartUsed"]) this.triggerSwordHeart(holder);
        if (this.hasSkill(module.actor, 63) && this.hasNegativeStatus(target)) {
            let momentum = this.getStatus(module.actor, this.STATUS_SWORD_MOMENTUM);
            if (!momentum || momentum["__rogueMomentumAction"] !== module["__rogueActionID"]) {
                this.addSwordMomentum(holder, 1);
                momentum = this.getStatus(module.actor, this.STATUS_SWORD_MOMENTUM);
                if (momentum) momentum["__rogueMomentumAction"] = module["__rogueActionID"];
            }
        }
        if (skill && skill.id === 64 && this.getSkillLevel(module.actor, 64) >= 3 && this.hasTacticalMarkFromSide(target, holder)) this.addSwordMomentum(holder, 1);
    }

    private static addSwordMomentum(holder: ProjectClientSceneObject, layers: number): void {
        if (!holder || layers <= 0) return;
        let module = holder.getModule(6) as SoModule_Battler;
        for (let i = 0; i < layers; i++) {
            GameBattleData.addStatus(holder, this.STATUS_SWORD_MOMENTUM, holder, true);
            let momentum = this.getStatus(module.actor, this.STATUS_SWORD_MOMENTUM);
            if (momentum && this.getSkillLevel(module.actor, 63) >= 3) momentum.maxlayer = 4;
        }
        this.refreshActor(holder);
    }

    private static applyBloodOnDamage(fromBattler: ProjectClientSceneObject, targetBattler: ProjectClientSceneObject, skill: Module_Skill, damage: number): void {
        if (!GameBattleHelper.isInPlayerParty(fromBattler)) return;
        let module = fromBattler.getModule(6) as SoModule_Battler;
        let actor = module.actor;
        let actionID = module["__rogueActionID"] || 0;
        if (skill && skill.id === 41 && module["__rogueBloodRageAction"] !== actionID) {
            module["__rogueBloodRageAction"] = actionID;
            this.addBloodRage(fromBattler, 1);
        }
        if (this.hasSkill(actor, 46) && actor.hp < actor.MaxHP * 0.6 && module["__rogueBloodRageRound"] !== GameBattle.battleRound) {
            module["__rogueBloodRageRound"] = GameBattle.battleRound;
            let rage = this.getStatus(actor, this.STATUS_BLOOD_RAGE);
            if (rage && rage.currentLayer >= rage.maxlayer) this.heal(fromBattler, Math.floor(actor.hp * 0.08));
            else this.addBloodRage(fromBattler, 1);
        }
        if (this.hasSkill(actor, 45)) {
            let cap = Math.floor(actor.MaxHP * 0.25);
            let used = module["__rogueBloodHealValue"] || 0;
            let amount = Math.min(Math.floor(damage * 0.08), Math.max(0, cap - used));
            if (amount > 0) {
                module["__rogueBloodHealValue"] = used + amount;
                this.heal(fromBattler, amount);
            }
            let targetModule = targetBattler.getModule(6) as SoModule_Battler;
            if (targetModule.actor.hp <= 0 && targetModule["__rogueBloodKillAction"] !== actionID) {
                targetModule["__rogueBloodKillAction"] = actionID;
                let killHeal = Math.min(Math.floor(actor.MaxHP * 0.15), Math.max(0, cap - module["__rogueBloodHealValue"]));
                module["__rogueBloodHealValue"] += killHeal;
                this.heal(fromBattler, killHeal);
            }
        }
        this.updateBloodDomain(fromBattler);
    }

    private static updateBloodDomain(battler: ProjectClientSceneObject): void {
        let module = battler.getModule(6) as SoModule_Battler;
        if (!this.hasSkill(module.actor, 44) || module["__rogueBloodDomainUsed"] || module.actor.hp > module.actor.MaxHP * 0.5) return;
        module["__rogueBloodDomainUsed"] = true;
        GameBattleData.addStatus(battler, this.STATUS_BLOOD_DOMAIN, battler, true);
    }

    private static addBloodRage(battler: ProjectClientSceneObject, layers: number): void {
        for (let i = 0; i < layers; i++) GameBattleData.addStatus(battler, this.STATUS_BLOOD_RAGE, battler, true);
        this.refreshActor(battler);
    }

    private static heal(battler: ProjectClientSceneObject, value: number): void {
        if (value <= 0) return;
        GameBattleData.changeBattlerHP(battler, value);
    }

    private static refreshActor(battler: ProjectClientSceneObject): void {
        let actor = (battler.getModule(6) as SoModule_Battler).actor;
        Game.refreshActorAttribute(actor, GameBattleHelper.getLevelByActor(actor));
    }

    private static getNearbyEnemies(fromBattler: ProjectClientSceneObject, center: ProjectClientSceneObject, radius: number): ProjectClientSceneObject[] {
        let targets: ProjectClientSceneObject[] = [];
        if (!Game.currentScene || !center.posGrid) return targets;
        for (let i = 0; i < Game.currentScene.sceneObjects.length; i++) {
            let battler = Game.currentScene.sceneObjects[i] as ProjectClientSceneObject;
            if (!GameBattleHelper.isBattler(battler) || !battler.posGrid) continue;
            let module = battler.getModule(6) as SoModule_Battler;
            if (module.isDead || module.actor.hp <= 0 || !GameBattleHelper.isHostileRelationship(fromBattler, battler)) continue;
            let distance = Math.abs(battler.posGrid.x - center.posGrid.x) + Math.abs(battler.posGrid.y - center.posGrid.y);
            if (distance <= radius) targets.push(battler);
        }
        return targets;
    }

    private static getStatus(actor: Module_Actor, statusID: number): Module_Status {
        for (let i = 0; i < actor.status.length; i++) if (actor.status[i].id === statusID) return actor.status[i];
        return null;
    }

    private static hasSkill(actor: Module_Actor, skillID: number): boolean {
        if (!actor || !actor.skills) return false;
        for (let i = 0; i < actor.skills.length; i++) if (actor.skills[i].id === skillID) return true;
        return false;
    }

    private static isSwordSkill(skill: Module_Skill): boolean { return !!skill && (skill["swordFamily"] === true || this.SWORD_SKILLS.indexOf(skill.id) >= 0); }
    private static getSkillLevel(actor: Module_Actor, skillID: number): number {
        if (!actor || !actor.skills) return 0;
        if (typeof RogueSkillUpgradeSystem !== "undefined" && typeof ProjectPlayer !== "undefined" && ProjectPlayer.getPlayerActorIndexByActor) {
            let actorIndex = ProjectPlayer.getPlayerActorIndexByActor(actor);
            let storedLevel = RogueSkillUpgradeSystem.getLevel(actorIndex, skillID);
            if (storedLevel > 0) return storedLevel;
        }
        for (let i = 0; i < actor.skills.length; i++) if (actor.skills[i].id === skillID) return actor.skills[i]["__rogueLevel"] || 1;
        return 0;
    }
    private static getSkillLevelBonus(actor: Module_Actor, skillID: number, base: number, upgraded: number): number { return this.getSkillLevel(actor, skillID) >= 2 ? upgraded : base; }
    private static hasNegativeStatus(target: ProjectClientSceneObject): boolean {
        if (!target || !target.getModule(6)) return false;
        let statuses = (target.getModule(6) as SoModule_Battler).actor.status || [];
        for (let i = 0; i < statuses.length; i++) if (this.hasNegativeStatusID(statuses[i].id)) return true;
        return false;
    }
    private static hasNegativeStatusID(id: number): boolean { return this.NEGATIVE_STATUSES.indexOf(id) >= 0; }
    private static resolveRootOwner(owner: ProjectClientSceneObject): ProjectClientSceneObject {
        if (!owner || !Game.currentScene) return owner;
        let visited: any = {};
        while (owner && !visited[owner.index]) {
            visited[owner.index] = true;
            let module = owner.getModule(6) as SoModule_Battler;
            let index = module && module["__rogueOwnerIndex"];
            if (index == null) break;
            let next = Game.currentScene.sceneObjects[index] as ProjectClientSceneObject;
            if (!next || !GameBattleHelper.isBattler(next)) break;
            owner = next;
        }
        return owner;
    }
    private static hasTacticalMarkFromSide(target: ProjectClientSceneObject, holder: ProjectClientSceneObject): boolean {
        if (!target || !holder || !GameBattleHelper.isIncludeStatus(target, this.STATUS_TACTICAL_MARK)) return false;
        let statuses = (target.getModule(6) as SoModule_Battler).actor.status || [];
        let holderRoot = this.resolveRootOwner(holder);
        let holderModule = holderRoot.getModule(6) as SoModule_Battler;
        for (let i = 0; i < statuses.length; i++) if (statuses[i].id === this.STATUS_TACTICAL_MARK) {
            let source = Game.currentScene && Game.currentScene.sceneObjects[statuses[i].fromBattlerID] as ProjectClientSceneObject;
            if (source && (source.getModule(6) as SoModule_Battler).battleCamp === holderModule.battleCamp) return true;
        }
        return false;
    }
}
