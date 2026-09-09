class RogueSceneDirector {
    private static readonly SPAWN_MARKER_NAME: string = "肉鸽出生点";
    private static readonly SCENE_GRID_SIZE: number = 48;
    private static readonly NODE_ORDER: string[] = ["battle-a", "battle-b", "boss", "battle-c", "battle-d", "boss-2", "battle-e", "battle-f", "boss-3"];
    private static readonly NODE_SCENES: any = {
        "battle-a": 17,
        "battle-b": 18,
        "battle-c": 20,
        "battle-d": 21,
        "battle-e": 22,
        "battle-f": 17,
        "boss": 19,
        "boss-2": 23,
        "boss-3": 24
    };
    private static readonly SCENE_POSITIONS: any = {
        17: { x: 840, y: 1032 },
        18: { x: 120, y: 1032 },
        19: { x: 840, y: 1176 },
        20: { x: 936, y: 1032 },
        21: { x: 552, y: 984 },
        22: { x: 936, y: 1032 },
        23: { x: 936, y: 1032 },
        24: { x: 936, y: 1032 }
    };
    private static readonly BOSS_NODES: string[] = ["boss", "boss-2", "boss-3"];

    static enterCurrentNode(): boolean {
        if (!RogueRunManager.active) return false;
        let sceneID = this.getSceneID(RogueRunManager.state, RogueRunManager.state.currentNodeID);
        if (!sceneID) return false;
        // Scene objects are authored in the server scene data while the map
        // transition happens before the target scene is loaded. Resolve the
        // marker from the already-loaded scene list first so regenerated maps
        // can move their spawn without requiring a code change. Older maps
        // without a marker fall back to their first deployment cell and then
        // to the historical coordinate table.
        let position = this.getSpawnPosition(sceneID);
        if (position) this.setPlayerPosition(position.x, position.y);
        if (RogueRunManager.state.visitedSceneIDs.indexOf(sceneID) < 0) RogueRunManager.state.visitedSceneIDs.push(sceneID);
        EventUtils.happen(ClientScene, ClientScene.EVENT_IN_NEW_SCENE, [sceneID, 0]);
        return true;
    }

    /**
     * Resolve a map's player entry point from authored data.
     *
     * `sceneObjectData` is the server-side scene payload used by
     * `ClientScene.getPresetSceneObjectDatas`, so it is available through
     * `Game.data.sceneList` even before `GameGate` loads the target map.
     * Deployment cells provide a safe fallback for maps that predate the
     * hidden marker convention.
     */
    private static getSpawnPosition(sceneID: number): any {
        let sceneEntry: any = null;
        let gameData: any = typeof Game !== "undefined" ? (Game as any).data : null;
        if (gameData && gameData.sceneList && gameData.sceneList.data) {
            sceneEntry = gameData.sceneList.data[sceneID];
        }
        let mapData = sceneEntry && sceneEntry.mapData;
        let sceneObjectData = sceneEntry && sceneEntry.sceneObjectData;
        let objects = sceneObjectData && sceneObjectData.sceneObjects;
        if (Array.isArray(objects)) {
            for (let i = 0; i < objects.length; i++) {
                let object = objects[i];
                if (!object || object.name !== this.SPAWN_MARKER_NAME) continue;
                let markerPosition = { x: Number(object.x), y: Number(object.y) };
                if (this.isSpawnPositionUsable(markerPosition, mapData)) return markerPosition;
            }
        }
        // Deployment is stored as [column][row] and uses the same 48px grid
        // as all project maps. Prefer its first authored cell over a stale
        // hard-coded location when a marker is missing.
        let deployment = mapData && mapData.dataLayers && mapData.dataLayers[3];
        if (Array.isArray(deployment)) {
            for (let x = 0; x < deployment.length; x++) {
                let column = deployment[x];
                if (!Array.isArray(column)) continue;
                for (let y = 0; y < column.length; y++) {
                    if (column[y] === 1) {
                        let deploymentPosition = {
                            x: x * this.SCENE_GRID_SIZE + this.SCENE_GRID_SIZE / 2,
                            y: y * this.SCENE_GRID_SIZE + this.SCENE_GRID_SIZE / 2
                        };
                        if (this.isSpawnPositionUsable(deploymentPosition, mapData)) return deploymentPosition;
                    }
                }
            }
        }
        return this.SCENE_POSITIONS[sceneID];
    }

    private static isSpawnPositionUsable(position: any, mapData: any): boolean {
        if (!position || !isFinite(position.x) || !isFinite(position.y)) return false;
        if (!mapData) return true;
        if (typeof mapData.width === "number" && (position.x < 0 || position.x >= mapData.width)) return false;
        if (typeof mapData.height === "number" && (position.y < 0 || position.y >= mapData.height)) return false;
        let gridX = Math.floor(position.x / this.SCENE_GRID_SIZE);
        let gridY = Math.floor(position.y / this.SCENE_GRID_SIZE);
        let obstacle = mapData.dataLayers && mapData.dataLayers[0];
        return !(obstacle && obstacle[gridX] && obstacle[gridX][gridY] === 1);
    }

    static completeCurrentNode(): void {
        if (!RogueRunManager.active) return;
        // 战斗停止流程可能由原生胜利事件提前推进。节点 UI 出现前再次
        // 接管所有未确认卡牌，确保最后一击奖励不会被地图或结算覆盖。
        if (RogueRewardPresenter.presentPending(() => this.completeCurrentNode(), "node-complete")) return;
        let state = RogueRunManager.state;
        let order = state.nodeOrder && state.nodeOrder.length ? state.nodeOrder : this.NODE_ORDER;
        let currentIndex = order.indexOf(state.currentNodeID);
        let isFinalNode = currentIndex >= 0 && currentIndex >= order.length - 1;
        // The final scene keeps its node ID until the result window is closed.
        // Native and custom battle-stop paths can therefore report the same
        // victory more than once; settle that node only once per run.
        if (isFinalNode && state.finalNodeCompleted) return;
        // 地图关卡结算奖励：当前队伍中的每名角色固定提升 1 级。
        // 放在奖励卡确认之后，避免结算 UI 被打断；死亡且已离队的角色
        // 不在当前 party 中，因此不会被重复处理。
        let party = typeof Game !== "undefined" && Game.player && Game.player.data && Game.player.data.party;
        if (currentIndex >= 0 && Array.isArray(party) && typeof ProjectPlayer !== "undefined" && typeof ProjectPlayer.increaseLevelByIndex === "function") {
            if (isFinalNode) state.finalNodeCompleted = true;
            for (let i = 0; i < party.length; i++) {
                ProjectPlayer.increaseLevelByIndex(i, 1);
            }
        }
        else if (isFinalNode) {
            state.finalNodeCompleted = true;
        }
        if (currentIndex >= 0 && currentIndex < order.length - 1) {
            state.currentNodeID = order[currentIndex + 1];
            state.floorIndex = currentIndex + 1;
            GameUI.show(41);
        }
        else {
            GUI_RogueResult.result = "completed";
            GameUI.show(42);
        }
        RogueRunManager.syncRuntimeState();
        // Persist the node transition and the per-party level settlement even
        // when this node produced no reward card and no other save was queued.
        if (typeof RogueRunManager.saveProgress === "function") RogueRunManager.saveProgress();
    }

    static onBattleStopped(isWin: boolean): void {
        if (!RogueRunManager.active) return;
        if (RogueRunManager.state.finalNodeCompleted) return;
        // Copied scenes may report battle-stop more than once. A callback may
        // only resolve the node that belongs to the scene still being played.
        let expectedSceneID = this.getSceneID(RogueRunManager.state, RogueRunManager.state.currentNodeID);
        if (!Game.currentScene || Game.currentScene.id !== expectedSceneID) return;
        if (isWin) this.completeCurrentNode();
        else {
            GUI_RogueResult.result = "failed";
            GameUI.show(42);
        }
    }

    static returnToEntryScene(): void {
        this.setPlayerPosition(840, 504);
        EventUtils.happen(ClientScene, ClientScene.EVENT_IN_NEW_SCENE, [2, 0]);
    }

    private static setPlayerPosition(x: number, y: number): void {
        if (!Game.player) return;
        if (Game.player.sceneObject) {
            Game.player.sceneObject.x = x;
            Game.player.sceneObject.y = y;
        }
        // GameGate rebuilds the entity position from the persisted player data.
        if (Game.player.data && Game.player.data.sceneObject) {
            Game.player.data.sceneObject.x = x;
            Game.player.data.sceneObject.y = y;
        }
    }

    static getSceneID(state: RogueRunState, nodeID: string): number {
        if (state && state.nodeSceneIDs && state.nodeSceneIDs[nodeID]) return state.nodeSceneIDs[nodeID];
        return this.NODE_SCENES[nodeID];
    }

    static applyEnemyLevel(battlerModule: SoModule_Battler): void {
        if (!battlerModule || battlerModule.battleCamp !== 1) return;
        if (!RogueRunManager.active) {
            // Clear run-only flags when a shared actor instance returns to a
            // normal stage, preventing a previous Boss run from leaking its
            // enlarged-boss marker into campaign encounters.
            if (battlerModule.actor) {
                battlerModule.actor["__rogueEnemyBoss"] = false;
                battlerModule.actor["__rogueEnemyFloor"] = null;
            }
            return;
        }
        let state = RogueRunManager.state;
        let sceneID = this.getSceneID(state, state.currentNodeID);
        if (!Game.currentScene || Game.currentScene.id !== sceneID) return;
        let baseLevel = battlerModule["__rogueBaseLevel"];
        if (baseLevel == null) {
            baseLevel = battlerModule.level > 0 ? battlerModule.level : 1;
            battlerModule["__rogueBaseLevel"] = baseLevel;
        }
        battlerModule.level = baseLevel + Math.max(0, state.floorIndex) * 3;
        if (battlerModule.actor) {
            battlerModule.actor["__rogueEnemyFloor"] = Math.max(0, state.floorIndex);
            // Boss maps can contain ordinary reinforcements. Only the actual
            // boss actor receives boss durability scaling.
            battlerModule.actor["__rogueEnemyBoss"] =
                this.BOSS_NODES.indexOf(state.currentNodeID) >= 0 && battlerModule.actor.id === 1008;
        }
    }

    /**
     * Enemy presets are authored for story battles and are much stronger than
     * the level-one roguelike party. Apply the run balance after every actor
     * refresh so status changes cannot restore the unscaled database values.
     */
    static applyEnemyAttributeBalance(actor: Module_Actor, attributes: any): void {
        if (!actor || !attributes) return;
        // Story battles use the same enemy presets as the original campaign,
        // which are tuned well above the current level-one party. Apply a
        // meaningful global reduction to ordinary enemy encounters while keeping
        // rogue floor scaling as its own path below.
        if (!RogueRunManager.active && actor["__normalEnemyBalance"] === true) {
            attributes.MaxHP = Math.max(1, Math.floor(attributes.MaxHP * 0.30));
            attributes.ATK = Math.max(1, Math.floor(attributes.ATK * 0.30));
            attributes.MAG = Math.max(0, Math.floor(attributes.MAG * 0.30));
            attributes.DEF = Math.max(0, Math.floor(attributes.DEF * 0.50));
            attributes.MagDef = Math.max(0, Math.floor(attributes.MagDef * 0.50));
            this.applyEnemySkillBalance(actor.atkSkill, 0.30);
            for (let i = 0; i < actor.skills.length; i++) this.applyEnemySkillBalance(actor.skills[i], 0.30);
            return;
        }
        if (!RogueRunManager.active || actor["__rogueEnemyFloor"] == null) return;
        let floor = Math.min(8, Math.max(0, actor["__rogueEnemyFloor"]));
        let isBoss = actor["__rogueEnemyBoss"] === true;
        let hpScale = isBoss ? 0.32 + floor * 0.025 : 0.45 + floor * 0.035;
        let offenseScale = 0.16 + floor * 0.025;
        let defenseScale = 0.50 + floor * 0.03;
        attributes.MaxHP = Math.max(1, Math.floor(attributes.MaxHP * hpScale));
        attributes.ATK = Math.max(1, Math.floor(attributes.ATK * offenseScale));
        attributes.MAG = Math.max(0, Math.floor(attributes.MAG * offenseScale));
        attributes.DEF = Math.max(0, Math.floor(attributes.DEF * defenseScale));
        attributes.MagDef = Math.max(0, Math.floor(attributes.MagDef * defenseScale));
        this.applyEnemySkillBalance(actor.atkSkill, offenseScale);
        for (let i = 0; i < actor.skills.length; i++) this.applyEnemySkillBalance(actor.skills[i], offenseScale);
    }

    /**
     * Double the base combat attributes of the controllable character roster.
     * The multiplier is applied to freshly calculated attributes, so growth,
     * equipment and status bonuses remain additive and are not permanently
     * mutated in the database.
     */
    static applyPlayerAttributeBalance(actor: Module_Actor, attributes: any): void {
        if (!actor || !attributes || actor.id < 1 || actor.id > 7 || actor["__normalEnemyBalance"] === true) return;
        attributes.MaxHP = Math.max(1, Math.floor(attributes.MaxHP * 2));
        attributes.MaxSP = Math.max(1, Math.floor(attributes.MaxSP * 2));
        attributes.ATK = Math.max(0, Math.floor(attributes.ATK * 2));
        attributes.DEF = Math.max(0, Math.floor(attributes.DEF * 2));
        attributes.MAG = Math.max(0, Math.floor(attributes.MAG * 2));
        attributes.MagDef = Math.max(0, Math.floor(attributes.MagDef * 2));
    }

    private static applyEnemySkillBalance(skill: Module_Skill, offenseScale: number): void {
        if (!skill || !skill.useDamage || skill.damageType > 2) return;
        let baseDamage = skill["__rogueBaseDamageValue"];
        if (baseDamage == null) {
            baseDamage = skill.damageValue;
            skill["__rogueBaseDamageValue"] = baseDamage;
        }
        skill.damageValue = Math.max(0, Math.floor(baseDamage * offenseScale));
    }
}
