/**
 * 自定义事件命令-战斗和角色相关指令
 * Created by 黑暗之神KDS on 2023-08-22 16:28:43.
 */
module CommandExecute {
    //------------------------------------------------------------------------------------------------------
    // 战斗相关指令
    //------------------------------------------------------------------------------------------------------
    // 记录玩家战斗前的状态
    let recordBeforeBattleState: {
        avatarID: number,
        moveAutoChangeAction: boolean,
        moveSpeed: number,
        through: boolean,
        selectEnabled: boolean,
        layerLevel: number,
        shadowVisible: boolean,
        moveToGridCenter: boolean,
        lastBgmURL: string,
        lastBGMPitch: number,
        lastBGMVolume: number,
        lastBgsURL: string,
        lastBGSPitch: number,
        lastBGSVolume: number,
        battleTriggerID: number,
        battleSceneID: number,
        // 用于记录战斗所在的事件触发器，以便读档时恢复
        battleTriggerMainType: number,
        battleTriggerIndexType: number,
        battleTriggerFrom: any
    } = {} as any;

    if (!Config.BEHAVIOR_EDIT_MODE) {
        // 恢复触发线的时候：恢复记录触发器ID，以便战斗结束能够正确地继续执行后续事件
        EventUtils.addEventListener(SinglePlayerGame, SinglePlayerGame.EVENT_RECOVER_TRIGGER, Callback.New((trigger: CommandTrigger) => {
            let o = recordBeforeBattleState;
            if (!o) return;
            if (trigger.mainType == o.battleTriggerMainType && trigger.indexType == o.battleTriggerIndexType && trigger.from == o.battleTriggerFrom) {
                recordBeforeBattleState.battleTriggerID = trigger.id;
            }
        }, null));
        // 追加存档时额外储存战斗前玩家的状态
        SinglePlayerGame.regSaveCustomData("recordBeforeBattleState", Callback.New(() => {
            return recordBeforeBattleState;
        }, null));
        // 监听读档恢复数据，恢复储存的自定义数据-战斗前玩家的状态
        EventUtils.addEventListener(SinglePlayerGame, SinglePlayerGame.EVENT_ON_BEFORE_RECOVERY_DATA, Callback.New(() => {
            let saveRecordBeforeBattleState = SinglePlayerGame.getSaveCustomData("recordBeforeBattleState");
            if (saveRecordBeforeBattleState) recordBeforeBattleState = saveRecordBeforeBattleState;
        }, null));
    }
    let preloadBattleSceneIDs: number[] = [];
    let preloadAnis: number[] = [];
    let preloadAvatars: number[] = [];
    /**
     * 开始进入战斗
     */
    export function customCommand_9001(commandPage: CommandPage, cmd: Command, trigger: CommandTrigger, triggerPlayer: ClientPlayer, playerInput: any[], cp: CustomCommandParams_9001): void {
        // 已在战斗的话则忽略该指令
        if (GameBattle.state != 0) {
            return;
        }
        // 记录主角的战斗隐藏状态，存档也需要追加记录
        let cursor = Game.player.sceneObject;
        // -- 变为光标前玩家的场景对象记录
        recordBeforeBattleState.avatarID = cursor.avatarID;
        recordBeforeBattleState.moveAutoChangeAction = cursor.moveAutoChangeAction;
        recordBeforeBattleState.through = cursor.through;
        recordBeforeBattleState.layerLevel = cursor.layerLevel;
        recordBeforeBattleState.shadowVisible = cursor.shadow.visible;
        recordBeforeBattleState.moveToGridCenter = WorldData.moveToGridCenter;
        recordBeforeBattleState.selectEnabled = cursor.selectEnabled;
        recordBeforeBattleState.moveSpeed = cursor.moveSpeed;
        // -- 记录当前的背景音乐和环境音效
        recordBeforeBattleState.lastBgmURL = GameAudio.lastBgmURL;
        recordBeforeBattleState.lastBGMPitch = GameAudio.lastBGMPitch;
        recordBeforeBattleState.lastBGMVolume = GameAudio.lastBGMVolume;
        recordBeforeBattleState.lastBgsURL = GameAudio.lastBgsURL;
        recordBeforeBattleState.lastBGSPitch = GameAudio.lastBGSPitch;
        recordBeforeBattleState.lastBGSVolume = GameAudio.lastBGSVolume;
        // -- 记录当前场景和事件触发器ID
        recordBeforeBattleState.battleTriggerID = trigger.id;
        recordBeforeBattleState.battleSceneID = Game.currentScene.id;
        recordBeforeBattleState.battleTriggerMainType = trigger.mainType;
        recordBeforeBattleState.battleTriggerIndexType = trigger.indexType;
        recordBeforeBattleState.battleTriggerFrom = trigger.from;
        // 停止移动
        Game.player.sceneObject.stopMove();
        // 事件中断
        trigger.offset(1);
        trigger.pause = true;
        // 预载入战斗资源（如有）
        preloadSceneBattleAssets(cp.preloadAssets, () => {
            // 如果是场景相关事件需要提前开启控制器
            if (trigger.mainType == CommandTrigger.COMMAND_MAIN_TYPE_SCENE) {
                Controller.start();
            }
            // 战斗初始化
            GameBattle.init(cp);
            // 设定由玩家设定的角色上场前的默认朝向
            GUI_BattleReady.ACTOR_DEFAULT_ORI = [8, 2, 4, 6][cp.defaultOri];
            // 执行进入战斗前事件处理
            GameCommand.startCommonCommand(14020, [], Callback.New(() => {
                // 变为光标
                Game.player.sceneObject.avatarID = 0;
                Game.player.sceneObject.moveAutoChangeAction = false;
                Game.player.sceneObject.playAnimation(WorldData.battleCursorAni, true, true);
                Game.player.sceneObject.shadow.visible = false;
                Game.player.sceneObject.through = true;
                Game.player.sceneObject.layerLevel = 0;
                Game.player.sceneObject.selectEnabled = false;
                Game.player.sceneObject.moveSpeed = WorldData.cursorSpeedByPlayerControl;
                // 必须移动至格子中心点
                WorldData.moveToGridCenter = true;
                // 所有战斗者坐标校准位置（格子中心点）
                for (let i = 0; i < Game.currentScene.sceneObjects.length; i++) {
                    let so = Game.currentScene.sceneObjects[i];
                    if (GameBattleHelper.isBattler(so)) {
                        let gridCenter = GameUtils.getGridCenter(new Point(so.x, so.y));
                        so.setTo(gridCenter.x, gridCenter.y);
                    }
                }
            }, this), trigger.trigger as ClientSceneObject, trigger.executor as ClientSceneObject);
        }, cp);
    }
    /**
     * 结束战斗
     */
    export function customCommand_9002(commandPage: CommandPage, cmd: Command, trigger: CommandTrigger, triggerPlayer: ClientPlayer, playerInput: any[], cp: CustomCommandParams_9002): void {
        // 未在战斗中则忽略
        if (GameBattle.state == 0) return;
        // 胜利标识
        let isWin: boolean;
        let isBreak: boolean = false;
        // -- 默认：根据实际战斗胜败 
        if (cp.battleOverMode == 0) {
            isWin = GameBattle.resultIsWin;
        }
        // -- 根据设定
        else if (cp.battleOverMode == 1) {
            GameBattle.resultIsWin = isWin = true;
        }
        else if (cp.battleOverMode == 2) {
            GameBattle.resultIsWin = isWin = false;
        }
        else if (cp.battleOverMode == 3) {
            isBreak = true;
            isWin = false;
        }
        // 胜利开关修改
        if (GameBattle.setting.battleResultSwitch) Game.player.variable.setSwitch(GameBattle.setting.battleResultSwitch, isWin ? 1 : 0);
        // 停止战斗
        GameBattle.stop(() => {
            // 恢复战前的状态
            let playerSo: ProjectClientSceneObject = Game.player.sceneObject;
            playerSo.avatarID = recordBeforeBattleState.avatarID;
            playerSo.moveAutoChangeAction = recordBeforeBattleState.moveAutoChangeAction;
            playerSo.through = recordBeforeBattleState.through;
            playerSo.layerLevel = recordBeforeBattleState.layerLevel;
            playerSo.shadow.visible = recordBeforeBattleState.shadowVisible;
            playerSo.stopAnimation(WorldData.battleCursorAni);
            playerSo.selectEnabled = recordBeforeBattleState.selectEnabled;
            playerSo.moveSpeed = recordBeforeBattleState.moveSpeed;
            WorldData.moveToGridCenter = recordBeforeBattleState.moveToGridCenter;
            if (recordBeforeBattleState.lastBgmURL) GameAudio.playBGM(recordBeforeBattleState.lastBgmURL, recordBeforeBattleState.lastBGMVolume, 99999, true, 500, recordBeforeBattleState.lastBGMPitch)
            else GameAudio.stopBGM(true, 500);
            if (recordBeforeBattleState.lastBgsURL) GameAudio.playBGS(recordBeforeBattleState.lastBgsURL, recordBeforeBattleState.lastBGSVolume, 99999, true, 500, recordBeforeBattleState.lastBGSPitch)
            else GameAudio.stopBGS(true, 500);
            // 战斗结束时事件（使用Game.player.sceneObject触发以便保证不会由于战斗者被销毁掉了而失效）
            GameCommand.startCommonCommand(14023, [], Callback.New(() => {
                // -- 卸载相关资源
                if (cp.disposePreloadAssets) disposeSceneBattleAssets();
                // 肉鸽战斗由节点导演独立推进，不恢复场景中的主线事件。
                if (RogueRunManager.active) {
                    GameCommand.startCommonCommand(15013, []);
                    setFrameout(() => RogueSceneDirector.onBattleStopped(isWin), 1);
                    return;
                }
                // -- 如果仍然是战斗前的场景的话则恢复事件执行
                if (recordBeforeBattleState.battleSceneID == Game.currentScene.id) {
                    let delayFrame = isBreak ? 1 : 0;
                    GameCommand.inputMessageAndContinueExecute([], true, delayFrame, recordBeforeBattleState.battleTriggerID);
                    // -- 关闭所有战斗界面
                    setFrameout(() => { GameCommand.startCommonCommand(15013, []); }, delayFrame);
                }
            }, this), Game.player.sceneObject, Game.player.sceneObject)
        }, isBreak);
    }
    /**
     * 预载入战斗资源
     * -- 战斗画面（如有）
     * -- 战斗者的角色技能
     */
    function preloadSceneBattleAssets(needLoad: boolean, onFin: Function, cp: CustomCommandParams_9001): void {
        if (!needLoad) {
            onFin.apply(this);
            return;
        }
        // -- 场景上的战斗者技能以及玩家的角色技能和可能存在的战斗者行走图
        let actors: Module_Actor[] = [];
        for (let i = 0; i < Game.currentScene.sceneObjects.length; i++) {
            let so = Game.currentScene.sceneObjects[i];
            if (GameBattleHelper.isBattler(so)) {
                if (so.battlerSetting.actor) actors.push(so.battlerSetting.actor);
            }
        }
        for (let i = 0; i < Game.player.data.party.length; i++) {
            let actor = Game.player.data.party[i]?.actor;
            if (actor) actors.push(actor);
        }
        let aniIDs = [];
        let battlerAvatarIDs = [];
        for (let i = 0; i < actors.length; i++) {
            let actor = actors[i];
            if (WorldData.battleSceneEnabled) {
                battlerAvatarIDs = battlerAvatarIDs.concat(actor.battlerAvatar);
            }
            for (var s = 0; s < actor.skills.length; s++) {
                let skill = actor.skills[s];
                aniIDs = aniIDs.concat([skill.releaseAnimation, skill.hitAnimation, skill.bulletAnimation, skill.targetGridAnimation]);
            }
        }
        // -- 追加可能存在的战斗画面
        let sceneIDs = WorldData.battleSceneEnabled && WorldData.battleScene ? [WorldData.battleScene] : [];
        // 记录
        preloadBattleSceneIDs = preloadBattleSceneIDs.concat(sceneIDs);
        preloadAnis = preloadAnis.concat(aniIDs);
        preloadAvatars = preloadAvatars.concat(battlerAvatarIDs);
        // 如果存在需要显示加载进度效果的话则准备显示
        let displayProgressComp: UIBase = null;
        let loadingUI: GUI_BASE = null;
        if (cp.isShowLoadingUI && cp.bindingUI && cp.bindingUI.uiID) {
            loadingUI = GameUI.show(cp.bindingUI.uiID);
        }
        if (loadingUI && cp.bindingUI && cp.bindingUI.uiID && cp.bindingUI.compName && cp.bindingUI.varName) {
            displayProgressComp = loadingUI[cp.bindingUI.compName];
            if (!displayProgressComp) {
                trace(`error:can not find component:${cp.bindingUI.compName}`);
            }
        }
        // 执行预加载
        AssetManager.batchPreLoadAsset(Callback.New(() => {
            if (cp.isShowLoadingUI && cp.bindingUI) GameUI.dispose(cp.bindingUI.uiID);
            onFin.apply(this);
        }, this), Callback.New((current: number, count: number) => {
            // 显示加载进度效果
            if (!displayProgressComp) return;
            let progressStr = Math.floor(current * 100 / count).toString();
            setProgressUI.apply(this, [displayProgressComp, progressStr]);
        }, this), [], sceneIDs, battlerAvatarIDs, [], aniIDs, [], [], [], [], true, false, true);
        // 进度条
        function setProgressUI(displayProgressComp: UIBase, v: number) {
            if (!displayProgressComp) return;
            v = MathUtils.int(v);
            Tween.clearAll(displayProgressComp);
            let attrObj = {};
            attrObj[cp.bindingUI.varName] = v;
            Tween.to(displayProgressComp, attrObj, 100);
        }
    }
    /**
     * 卸载战斗资源
     */
    function disposeSceneBattleAssets(): void {
        AssetManager.batchDisposeAsset([], preloadBattleSceneIDs, preloadAvatars, [], preloadAnis);
        preloadBattleSceneIDs = [];
        preloadAvatars = [];
        preloadAnis = [];
    }
    //------------------------------------------------------------------------------------------------------
    //  
    //------------------------------------------------------------------------------------------------------
    /**
     * 战斗参数设定
     */
    export function customCommand_9003(commandPage: CommandPage, cmd: Command, trigger: CommandTrigger, triggerPlayer: ClientPlayer, playerInput: any[], cp: CustomCommandParams_9003): void {
        let bool = cp.value == 0 ? true : false;
        switch (cp.paramType) {
            case 0:
                WorldData.deadPlayerActorLeaveParty = bool;
                return;
            case 1:
                WorldData.standbyStepChangeOriEnabled = bool;
                return;
            case 2:
                WorldData.readyStepChangeOriEnabled = bool;
                return;
            case 3:
                WorldData.fullStateWhenBattleStart = bool;
                return;
        }
    }
    /**
     * 增减战斗者的生命
     */
    export function customCommand_9004(commandPage: CommandPage, cmd: Command, trigger: CommandTrigger, triggerPlayer: ClientPlayer, playerInput: any[], cp: CustomCommandParams_9004): void {
        let soc = ProjectClientScene.getSceneObjectBySetting(cp.soType + 1, cp.no, cp.soUseVar, cp.noVarID, trigger);
        if (!soc || !GameBattleHelper.isBattler(soc) || !GameBattleHelper.isInBattle) return;
        let value = MathUtils.int(cp.valueUseVar ? Game.player.variable.getVariable(cp.valueVarID) : cp.value);
        let actor = soc.battlerSetting.actor;
        actor.hp += cp.symbol == 0 ? value : -value;
        actor.hp = Math.max(Math.min(actor.hp, actor.MaxHP), 0);
    }
    /**
     * 增减战斗者的魔法
     */
    export function customCommand_9005(commandPage: CommandPage, cmd: Command, trigger: CommandTrigger, triggerPlayer: ClientPlayer, playerInput: any[], cp: CustomCommandParams_9005): void {
        let soc = ProjectClientScene.getSceneObjectBySetting(cp.soType + 1, cp.no, cp.soUseVar, cp.noVarID, trigger);
        if (!soc || !GameBattleHelper.isBattler(soc) || !GameBattleHelper.isInBattle) return;
        let value = MathUtils.int(cp.valueUseVar ? Game.player.variable.getVariable(cp.valueVarID) : cp.value);
        let actor = soc.battlerSetting.actor;
        actor.sp += cp.symbol == 0 ? value : -value;
        actor.sp = Math.max(Math.min(actor.sp, actor.MaxSP), 0);
    }
    /**
     * 增减战斗者的状态
     */
    export function customCommand_9006(commandPage: CommandPage, cmd: Command, trigger: CommandTrigger, triggerPlayer: ClientPlayer, playerInput: any[], cp: CustomCommandParams_9006): void {
        let soc = ProjectClientScene.getSceneObjectBySetting(cp.soType + 1, cp.no, cp.soUseVar, cp.noVarID, trigger);
        if (!soc || !GameBattleHelper.isBattler(soc) || !GameBattleHelper.isInBattle) return;
        let statusID = MathUtils.int(cp.statusUseVar ? Game.player.variable.getVariable(cp.statusIDVarID) : cp.statusID);
        let actor = soc.battlerSetting.actor;
        if (cp.symbol == 0) {
            GameBattleData.addStatus(soc, statusID, soc, cp.force);
        }
        else if (cp.symbol == 1) {
            GameBattleData.removeStatus(soc, statusID);
        }
        else if (cp.symbol == 2) {
            GameBattleData.removeAllStatus(soc);
        }
        let level = GameBattleHelper.getLevelByActor(actor);
        Game.refreshActorAttribute(actor, level);
    }
    /**
     * 显示伤害
     */
    export function customCommand_9007(commandPage: CommandPage, cmd: Command, trigger: CommandTrigger, triggerPlayer: ClientPlayer, playerInput: any[], cp: CustomCommandParams_9007): void {
        let soc = ProjectClientScene.getSceneObjectBySetting(cp.soType + 1, cp.no, cp.soUseVar, cp.noVarID, trigger);
        if (!soc) return;
        let actor = soc.battlerSetting.actor;
        let value = MathUtils.int(cp.valueUseVar ? Game.player.variable.getVariable(cp.valueVarID) : cp.value);
        if (cp.type <= 2) value = -value;
        GameBattleAction.showDamage(soc, cp.type, value, cp.isCrit);
    }
    /**
     * 生成战斗者
     */
    export function customCommand_9008(commandPage: CommandPage, cmd: Command, trigger: CommandTrigger, triggerPlayer: ClientPlayer, playerInput: any[], cp: CustomCommandParams_9008): void {
        let actorID = MathUtils.int(cp.useVar ? Game.player.variable.getVariable(cp.actorIDVarID) : cp.actorID);
        let actorData: Module_Actor = GameData.getModuleData(6, actorID);
        if (!actorData) return;
        if (!GameBattleHelper.isInBattle) return;
        // 如果与触发者阵营相同则判断触发者是否是战斗者
        if (cp.camp == 2 && !GameBattleHelper.isBattler(trigger.trigger as ProjectClientSceneObject)) return;
        // 如果与执行者阵营相同则判断执行者是否是战斗者
        if (cp.camp == 3 && !GameBattleHelper.isBattler(trigger.executor as ProjectClientSceneObject)) return;
        let gridX: number;
        let gridY: number;
        if (cp.gridUseVar) {
            gridX = MathUtils.int(Game.player.variable.getVariable(cp.xVarID));
            gridY = MathUtils.int(Game.player.variable.getVariable(cp.yVarID));
        }
        else {
            gridX = MathUtils.int(cp.x);
            gridY = MathUtils.int(cp.y);
        }
        let posGridP = new Point(gridX, gridY);
        let posP = GameUtils.getGridCenterByGrid(posGridP);
        let persetSceneObject = {
            x: posP.x,
            y: posP.y,
            avatarID: actorData.avatar,
            avatarOri: GUI_BattleReady.ACTOR_DEFAULT_ORI
        }
        let soc = Game.currentScene.addNewSceneObject(1, persetSceneObject) as ProjectClientSceneObject;
        let battlerModule = new SoModule_Battler(null, soc);
        battlerModule.id = 6;
        soc.addModule(battlerModule);

        soc.moveSpeed = actorData.moveSpeed;
        // 战斗者设定
        battlerModule.actor = GameData.newModuleData(6, actorID);
        battlerModule.actorInit();
        battlerModule.usePlayerActors = false;
        battlerModule.mustInBattle = false;
        battlerModule.playerCantCtrl = !cp.playerCtrlEnabled;
        switch (cp.camp) {
            case 0:
                battlerModule.battleCamp = 0;
                break;
            case 1:
                battlerModule.battleCamp = 1;
                break;
            case 2:
                battlerModule.battleCamp = (trigger.trigger as ProjectClientSceneObject).battlerSetting.battleCamp;
                break;
            case 3:
                battlerModule.battleCamp = (trigger.executor as ProjectClientSceneObject).battlerSetting.battleCamp;
                break;
        }
        let lv = MathUtils.int(cp.lvUseVar ? Game.player.variable.getVariable(cp.lvVarID) : cp.lv);
        lv = Math.max(1, Math.min(lv, battlerModule.actor.MaxLv));
        soc.battlerSetting.level = lv;
        // Event-based summon skills create the battler before the next normal
        // camp refresh. Bind the source immediately so a summon kill can never
        // lose its roguelike reward because the transient skill context moved on.
        let summonOwner: ProjectClientSceneObject = null;
        if (cp.camp == 2 && GameBattleHelper.isBattler(trigger.trigger as ProjectClientSceneObject)) {
            summonOwner = trigger.trigger as ProjectClientSceneObject;
        }
        else if (cp.camp == 3 && GameBattleHelper.isBattler(trigger.executor as ProjectClientSceneObject)) {
            summonOwner = trigger.executor as ProjectClientSceneObject;
        }
        else if (typeof GameBattleAction !== "undefined" && GameBattleHelper.isBattler(GameBattleAction.fromBattler)) {
            summonOwner = GameBattleAction.fromBattler;
        }
        if (summonOwner && typeof RogueKillProgress !== "undefined") {
            RogueKillProgress.attachSummonOwnerAtSpawn(soc, summonOwner);
        }
        // 刷新阵营
        GameBattleData.refreshCampAndNewBattles();
        // 储存至数值变量
        if (cp.saveNewSoIndex) {
            Game.player.variable.setVariable(cp.newSoIndexVarID, soc.index);
        }
    }
    /**
     * 更改战斗特写设定
     * @param commandPage 事件页
     * @param cmd 当前的事件命令
     * @param trigger 触发器
     * @param triggerPlayer 触发器对应的玩家
     * @param playerInput 玩家输入值，用于暂停执行该触发器事件并等待玩家输入后获得的值，执行完该函数后会被清空
     * @param p 自定义命令参数 1表示对应1号命令的参数
     */
    export function customCommand_9009(commandPage: CommandPage, cmd: Command, trigger: CommandTrigger, triggerPlayer: ClientPlayer, playerInput: any[], p: CustomCommandParams_9009): void {
        trigger.pause = true;
        WorldData.battleScene = p.battleScene;
        WorldData.battleSceneBGM = p.battleSceneBGM;
        AssetManager.preLoadSceneAsset(p.battleScene, Callback.New(() => {
            trigger.offset(1);
            CommandPage.executeEvent(trigger);
        }, this), true);
    }
    //------------------------------------------------------------------------------------------------------
    //  角色
    //------------------------------------------------------------------------------------------------------
    /**
     * 增减装备
     */
    export function customCommand_10001(commandPage: CommandPage, cmd: Command, trigger: CommandTrigger, triggerPlayer: ClientPlayer, playerInput: any[], p: CustomCommandParams_10001): void {
        let equipID = p.useVar1 ? Game.player.variable.getVariable(p.equipIDVarID) : p.equipID;
        let num = p.useVar2 ? Game.player.variable.getVariable(p.numVarID) : p.num;
        // 找不到预设装备的话则忽略
        if (!GameData.getModuleData(9, equipID)) return;
        // 浮动装备设定
        if (p.attributeRand && p.equipRandSetting.length > 0 && p.symbol == 0) {
            let equipAttributeNames = ["maxHP", "maxSP", "atk", "def", "mag", "magDef", "dod", "moveGrid", "hit", "crit", "magCrit"];
            // 生成装备
            for (let n = 0; n < num; n++) {
                let newEquip: Module_Equip = GameData.newModuleData(9, equipID, true);
                for (let i = 0; i < p.equipRandSetting.length; i++) {
                    let thisSetting = p.equipRandSetting[i];
                    let thisPer = thisSetting.probability;
                    if (MathUtils.rand(100) < thisPer) {
                        // 全属性变化（已有属性）
                        if (thisSetting.type == 12) {
                            // -- 固定属性
                            for (let s = 0; s < equipAttributeNames.length; s++) {
                                if (thisSetting.usePer) {
                                    let per = (MathUtils.rand(thisSetting.maxValue - thisSetting.minValue) + thisSetting.minValue) / 100;
                                    let newValue = newEquip[equipAttributeNames[s]] * per;
                                    newEquip[equipAttributeNames[s]] = Math.ceil(newValue);
                                }
                                else {
                                    if (newEquip[equipAttributeNames[s]]) {
                                        let newValue = MathUtils.rand(thisSetting.maxFixValue - thisSetting.minFixValue) + thisSetting.minFixValue;
                                        newEquip[equipAttributeNames[s]] += Math.ceil(newValue);
                                    }
                                }
                            }
                            // -- 扩展属性
                            for (let s = 0; s < newEquip.customAttributes.length; s++) {
                                let equipCustomAttribute: DataStructure_customAttribute = newEquip.customAttributes[s];
                                if (thisSetting.usePer) {
                                    let per = (MathUtils.rand(thisSetting.maxValue - thisSetting.minValue) + thisSetting.minValue) / 100;
                                    if (equipCustomAttribute) {
                                        let newValue = equipCustomAttribute.value * per;
                                        equipCustomAttribute.value = Math.ceil(newValue);
                                    }
                                }
                                else {
                                    if (equipCustomAttribute) {
                                        let newValue = MathUtils.rand(thisSetting.maxFixValue - thisSetting.minFixValue) + thisSetting.minFixValue;
                                        equipCustomAttribute.value += Math.ceil(newValue);
                                    }
                                }
                            }
                        }
                        // 单属性变化
                        else {
                            // -- 扩展属性
                            if (thisSetting.type == 11) {
                                let equipCustomAttribute: DataStructure_customAttribute = ArrayUtils.matchAttributes(newEquip.customAttributes, { attribute: thisSetting.extAttribute }, true)[0];
                                if (!equipCustomAttribute) {
                                    equipCustomAttribute = new DataStructure_customAttribute;
                                    equipCustomAttribute.attribute = thisSetting.extAttribute;
                                    equipCustomAttribute.type = 0;
                                    equipCustomAttribute.value = 0;
                                    newEquip.customAttributes.push(equipCustomAttribute);
                                }
                                if (thisSetting.usePer) {
                                    let per = (MathUtils.rand(thisSetting.maxValue - thisSetting.minValue) + thisSetting.minValue) / 100;
                                    let newValue = equipCustomAttribute.value * per;
                                    equipCustomAttribute.value = Math.ceil(newValue);
                                }
                                else {
                                    let newValue = MathUtils.rand(thisSetting.maxFixValue - thisSetting.minFixValue) + thisSetting.minFixValue;
                                    equipCustomAttribute.value += Math.ceil(newValue);
                                }
                            }
                            // -- 固定属性
                            else {
                                if (thisSetting.usePer) {
                                    let per = (MathUtils.rand(thisSetting.maxValue - thisSetting.minValue) + thisSetting.minValue) / 100;
                                    let newValue = newEquip[equipAttributeNames[thisSetting.type]] * per;
                                    newEquip[equipAttributeNames[thisSetting.type]] = Math.ceil(newValue);
                                }
                                else {
                                    let newValue = MathUtils.rand(thisSetting.maxFixValue - thisSetting.minFixValue) + thisSetting.minFixValue;
                                    newEquip[equipAttributeNames[thisSetting.type]] += Math.ceil(newValue);
                                }
                            }
                        }
                    }
                }
                ProjectPlayer.addEquipByInstance(newEquip);
            }
        }
        else {
            ProjectPlayer.changeItemNumber(equipID, p.symbol == 0 ? num : -num, true, true);
        }
    }
    /**
     * 替换队伍角色
     */
    export function customCommand_10002(commandPage: CommandPage, cmd: Command, trigger: CommandTrigger, triggerPlayer: ClientPlayer, playerInput: any[], cp: CustomCommandParams_10002): void {
        let actorID = MathUtils.int(cp.useVar ? Game.player.variable.getVariable(cp.actorIDVarID) : cp.actorID);
        if (!GameData.getModuleData(6, actorID)) return;
        if (cp.type == 0) {
            if (cp.isRestoreActor) {
                let restoreActor: DataStructure_inPartyActor = Game.player.data.actorRecords[CustomCompData.getSuperNumber(cp.actorStoreIndex)];
                if (restoreActor) {
                    ProjectPlayer.addPlayerActorByDS(restoreActor, true, false);
                }
            }
            else {
                let lv = MathUtils.int(cp.lvUseVar ? Game.player.variable.getVariable(cp.lvVarID) : cp.lv);
                ProjectPlayer.addPlayerActorByActorID(actorID, lv);
            }
        }
        else {
            if (Game.player.data.party.length <= 1) return;
            let inPartyIndex: number;
            if (cp.awayType == 0) {
                inPartyIndex = ProjectPlayer.getPlayerActorFirstPositionByActorID(actorID);
            }
            else {
                inPartyIndex = CustomCompData.getSuperNumber(cp.inPartyIndex);
            }
            if (inPartyIndex <= 0 || inPartyIndex >= Game.player.data.party.length) return;
            let awayActor = ProjectPlayer.getPlayerActorDSByInPartyIndex(inPartyIndex);
            if (!awayActor) return;
            ProjectPlayer.removePlayerActorByInPartyIndex(inPartyIndex);
            // 记录离开的角色
            if (awayActor && cp.isSaveActor) {
                Game.player.data.actorRecords[CustomCompData.getSuperNumber(cp.saveTo)] = awayActor;
            }
        }
    }
    /**
     * 替换角色的技能
     */
    export function customCommand_10003(commandPage: CommandPage, cmd: Command, trigger: CommandTrigger, triggerPlayer: ClientPlayer, playerInput: any[], cp: CustomCommandParams_10003): void {
        // 获取角色
        let actor: Module_Actor;
        if (cp.actorCheckType <= 1) {
            let actorDS = ProjectGame.getPlayerActorByCheckType(cp.actorCheckType, cp.useVar, cp.actorID, cp.actorIDVarID,
                cp.actorInPartyIndexVarIDUseVar, cp.actorInPartyIndex, cp.actorInPartyIndexVarID,
                cp.soType, cp.soUseVar, cp.no, cp.noVarID, trigger);
            if (!actorDS) return;
            actor = actorDS.actor;
        }
        else {
            actor = ProjectGame.getActorBySceneObjectIndex(cp.soType, cp.soUseVar, cp.no, cp.noVarID, trigger);
        }
        if (!actor) return;
        // 获取技能编号
        let skillID = MathUtils.int(cp.skillUseVar ? Game.player.variable.getVariable(cp.skillIDVarID) : cp.skillID);
        // 学习技能
        if (cp.symbol == 0) {
            Game.actorLearnSkill(actor, skillID);
        }
        // 忘记技能
        else if (cp.symbol == 1) {
            Game.actorForgetSkill(actor, skillID);
        }
        // 忘记全部技能
        else if (cp.symbol == 2) {
            Game.actorForgetAllSkills(actor);
        }
        // 随机忘记一个技能
        else if (cp.symbol == 3) {
            let skill = actor.skills[MathUtils.rand(actor.skills.length)];
            if (skill) {
                let skillID = skill.id;
                Game.actorForgetSkill(actor, skillID);
            }
        }
        // 替换普通技能
        else if (cp.symbol == 4) {
            Game.actorReplaceAttackSkill(actor, skillID);
        }
        // 恢复普通攻击
        else if (cp.symbol == 5) {
            actor.atkMode = 0;
            actor.atkSkill = null;
        }
        // 刷新角色属性
        Game.refreshActorAttribute(actor, GameBattleHelper.getLevelByActor(actor));
    }
    /**
     * 替换角色的装备
     */
    export function customCommand_10004(commandPage: CommandPage, cmd: Command, trigger: CommandTrigger, triggerPlayer: ClientPlayer, playerInput: any[], cp: CustomCommandParams_10004): void {
        // 获取角色
        let actor: Module_Actor;
        let actorDS = ProjectGame.getPlayerActorByCheckType(cp.actorCheckType, cp.useVar, cp.actorID, cp.actorIDVarID,
            cp.actorInPartyIndexVarIDUseVar, cp.actorInPartyIndex, cp.actorInPartyIndexVarID,
            null, null, null, null, trigger);
        if (!actorDS) return;
        actor = actorDS.actor;
        if (!actor) return;
        // 获取装备编号
        let equipID = MathUtils.int(cp.equipUseVar ? Game.player.variable.getVariable(cp.equipIDVarID) : cp.equipID);
        // 判断是否是玩家的角色
        let inPartyActorDS: DataStructure_inPartyActor = ProjectPlayer.getPlayerActorDSByActor(actor);
        let inPartyActorIndex = ProjectPlayer.getPlayerActorIndexByActor(actor);
        // 记录卸下的装备
        let takeOffEquip: Module_Equip;
        // 穿戴
        if (cp.symbol == 0) {
            if (inPartyActorDS && cp.fromPlayerPackage) {
                // -- 如果该装备存在于玩家的背包的话则穿戴
                let fromPackageEquip = ProjectPlayer.getItemDS(equipID, true, true);
                if (fromPackageEquip) ProjectPlayer.wearPlayerActorEquip(inPartyActorIndex, fromPackageEquip.equip);
            }
            else {
                // 新建一件装备进行穿戴
                if (GameData.getModuleData(9, equipID)) {
                    let newEquip = GameData.newModuleData(9, equipID);
                    Game.wearActorEquip(actor, newEquip);
                }
            }
        }
        // 卸下/移除
        else if (cp.symbol == 1 || cp.symbol == 3) {
            // 使用部件卸下
            if (cp.usePartID) {
                if (inPartyActorDS && cp.symbol == 1) takeOffEquip = ProjectPlayer.takeOffPlayerActorEquipByPartID(inPartyActorIndex, cp.partID);
                else takeOffEquip = Game.takeOffActorEquipByPartID(actor, cp.partID);
            }
            // 否则查找该件装备是否已经穿戴上了
            else {
                let thisEquip = Game.getActorEquipByEquipID(actor, equipID);
                if (thisEquip) {
                    let thisEquipPartID = thisEquip.partID;
                    if (inPartyActorDS && cp.symbol == 1) takeOffEquip = ProjectPlayer.takeOffPlayerActorEquipByPartID(inPartyActorIndex, thisEquipPartID);
                    else takeOffEquip = Game.takeOffActorEquipByPartID(actor, thisEquipPartID);
                }
            }
        }
        // 卸下/移除全部装备
        else if (cp.symbol == 2 || cp.symbol == 4) {
            if (inPartyActorDS && cp.symbol == 2) ProjectPlayer.takeOffPlayerActorAllEquips(inPartyActorIndex);
            else Game.takeOffActorAllEquips(actor);
        }
        // 刷新属性
        Game.refreshActorAttribute(actor, GameBattleHelper.getLevelByActor(actor));
        // 记录卸下的装备编号
        if (cp.isTakeOffEquipSaveToVar) {
            let takeOffEquipID = takeOffEquip ? takeOffEquip.id : -1;
            Game.player.variable.setVariable(cp.takeOffEquipSaveToVar, takeOffEquipID);
        }
    }
    /**
     * 增减角色属性
     */
    export function customCommand_10005(commandPage: CommandPage, cmd: Command, trigger: CommandTrigger, triggerPlayer: ClientPlayer, playerInput: any[], cp: CustomCommandParams_10005): void {
        // 获取角色
        let actor: Module_Actor;
        if (cp.actorCheckType <= 1) {
            let actorDS = ProjectGame.getPlayerActorByCheckType(cp.actorCheckType, cp.useVar, cp.actorID, cp.actorIDVarID,
                cp.actorInPartyIndexVarIDUseVar, cp.actorInPartyIndex, cp.actorInPartyIndexVarID,
                cp.soType, cp.soUseVar, cp.no, cp.noVarID, trigger);
            if (!actorDS) return;
            actor = actorDS.actor;
        }
        else {
            actor = ProjectGame.getActorBySceneObjectIndex(cp.soType, cp.soUseVar, cp.no, cp.noVarID, trigger);
        }
        if (!actor) return;
        let value = MathUtils.int(cp.valueUseVar ? Game.player.variable.getVariable(cp.valueVarID) : cp.value);
        // 判断是否是玩家的角色
        let inPartyActorDS: DataStructure_inPartyActor = ProjectPlayer.getPlayerActorDSByActor(actor);
        let inPartyActorIndex = ProjectPlayer.getPlayerActorIndexByActor(actor);
        // 增加永久属性
        switch (cp.attributeType) {
            case 0:
                actor.increaseMaxHP += value;
                break;
            case 1:
                actor.increaseMaxSP += value;
                break;
            case 2:
                actor.increaseATK += value;
                break;
            case 3:
                actor.increaseMag += value;
                break;
            case 4:
                actor.increaseDEF += value;
                break;
            case 5:
                actor.increaseMagDef += value;
                break;
            case 6:
                if (inPartyActorIndex != -1) {
                    ProjectPlayer.increaseExpByIndex(inPartyActorIndex, value);
                }
                break;
            case 7:
                if (inPartyActorIndex != -1) {
                    inPartyActorDS.lv += value;
                    ProjectPlayer.initPlayerActor(inPartyActorIndex);
                    EventUtils.happen(ProjectPlayer, ProjectPlayer.EVENT_PLAYER_ACTOR_CHANGE_LEVEL, [inPartyActorIndex, inPartyActorDS.lv]);
                    if (value > 0) {
                        if (actor.levelUpEvent) CommandPage.startTriggerFragmentEvent(actor.levelUpEvent, Game.player.sceneObject, Game.player.sceneObject);
                        let actorClass: Module_Class = GameData.getModuleData(7, actor.class);
                        if (actorClass && actorClass.levelUpEvent) CommandPage.startTriggerFragmentEvent(actorClass.levelUpEvent, Game.player.sceneObject, Game.player.sceneObject);
                    }
                }
                break;
            case 8:
                if (inPartyActorIndex != -1) {
                    inPartyActorDS.lv -= value;
                    ProjectPlayer.initPlayerActor(inPartyActorIndex);
                    EventUtils.happen(ProjectPlayer, ProjectPlayer.EVENT_PLAYER_ACTOR_CHANGE_LEVEL, [inPartyActorIndex, inPartyActorDS.lv]);
                }
                break;
            case 9:
                if (!GameBattleHelper.isInBattle) return;
                actor.hp += value;
                if (actor.hp <= 0) {
                    if (cp.allowDead) {
                        actor.hp = 0;
                    }
                    else {
                        actor.hp = 1;
                    }
                }
                break;
            case 10:
                if (!GameBattleHelper.isInBattle) return;
                actor.sp += value;
                break;
            case 11:
                actor.increaseMoveGrid += value;
                break;
            case 12:
                actor.increaseDod += value;
                break;
            case 13:
                if (!actor.increaseExtendAttributes[cp.extAttribute]) actor.increaseExtendAttributes[cp.extAttribute] = 0;
                actor.increaseExtendAttributes[cp.extAttribute] += value;
                break;
        }
        // 刷新属性
        Game.refreshActorAttribute(actor, GameBattleHelper.getLevelByActor(actor));
    }
    /**
     * 更改角色的名称
     */
    let changeActorNameInfo: { [actorID: number]: string } = {};
    export function customCommand_10006(commandPage: CommandPage, cmd: Command, trigger: CommandTrigger, triggerPlayer: ClientPlayer, playerInput: any[], cp: CustomCommandParams_10006): void {
        // 获取角色
        let actor: Module_Actor;
        let actorDS = ProjectGame.getPlayerActorByCheckType(cp.actorCheckType, cp.useVar, cp.actorID, cp.actorIDVarID,
            cp.actorInPartyIndexVarIDUseVar, cp.actorInPartyIndex, cp.actorInPartyIndexVarID,
            null, null, null, null, trigger);
        if (!actorDS) return;
        actor = actorDS.actor;
        if (!actor) return;
        // 更改该角色的名称
        let newName = cp.valueUseVar ? Game.player.variable.getString(cp.valueVarID) : cp.value;
        for (let i = 0; i < Game.player.data.party.length; i++) {
            let inPartyActor = Game.player.data.party[i];
            let actorID = inPartyActor.actor.id;
            if (actorID == actor.id) {
                inPartyActor.actor.name = newName;
            }
        }
        // 记录更改项以便恢复存档时重新需要设置该值
        changeActorNameInfo[actor.id] = newName;
    }
    /**
     * 更改角色的职业
     */
    export function customCommand_10007(commandPage: CommandPage, cmd: Command, trigger: CommandTrigger, triggerPlayer: ClientPlayer, playerInput: any[], cp: CustomCommandParams_10007): void {
        // 获取角色
        let actor: Module_Actor;
        let actorDS = ProjectGame.getPlayerActorByCheckType(cp.actorCheckType, cp.useVar, cp.actorID, cp.actorIDVarID,
            cp.actorInPartyIndexVarIDUseVar, cp.actorInPartyIndex, cp.actorInPartyIndexVarID,
            null, null, null, null, trigger);
        if (!actorDS) return;
        actor = actorDS.actor;
        if (!actor) return;
        // 更改职业
        let classID = cp.valueUseVar ? Game.player.variable.getVariable(cp.valueVarID) : cp.value;
        actor.class = classID;
        // 清理缓存
        for (let i in actor) {
            if (i.indexOf("_cache") != -1) {
                delete actor[i];
            }
        }
        // 刷新属性
        Game.refreshActorAttribute(actor, GameBattleHelper.getLevelByActor(actor));
    }
    /**
     * 替换角色的道具
     */
    export function customCommand_10008(commandPage: CommandPage, cmd: Command, trigger: CommandTrigger, triggerPlayer: ClientPlayer, playerInput: any[], cp: CustomCommandParams_10008): void {
        // 获取角色
        let actor: Module_Actor;
        let actorDS = ProjectGame.getPlayerActorByCheckType(cp.actorCheckType, cp.useVar, cp.actorID, cp.actorIDVarID,
            cp.actorInPartyIndexVarIDUseVar, cp.actorInPartyIndex, cp.actorInPartyIndexVarID,
            null, null, null, null, trigger);
        if (!actorDS) return;
        actor = actorDS.actor;
        if (!actor) return;
        // 获取道具编号
        let itemID = MathUtils.int(cp.itemUseVar ? Game.player.variable.getVariable(cp.itemIDVarID) : cp.itemID);
        // 判断是否是玩家的角色
        let inPartyActorDS: DataStructure_inPartyActor = ProjectPlayer.getPlayerActorDSByActor(actor);
        let inPartyActorIndex = ProjectPlayer.getPlayerActorIndexByActor(actor);
        // 记录卸下的道具
        let takeOffItem: Module_Item;
        // 穿戴
        if (cp.symbol == 0) {
            if (inPartyActorDS && cp.fromPlayerPackage) {
                let wearIndex = ProjectPlayer.getPlayerActorItemEmptyPostion(inPartyActorIndex);
                if (wearIndex == null) return;
                // -- 如果该道具存在于玩家的背包的话则携带
                let fromPackageItem = ProjectPlayer.getItemDS(itemID, false);
                if (fromPackageItem) ProjectPlayer.carryPlayerActorItemFromPakcage(inPartyActorIndex, fromPackageItem.item, wearIndex);
            }
            else {
                // 新建一件道具进行佩戴
                if (GameData.getModuleData(1, itemID)) {
                    let wearIndex = Game.getPlayerActorItemEmptyPostion(actorDS.actor);
                    if (wearIndex == null) return;
                    let newItem = GameData.newModuleData(1, itemID);
                    Game.carryActorItem(actorDS.actor, newItem, wearIndex);
                }
            }
        }
        // 卸下/移除
        else if (cp.symbol == 1 || cp.symbol == 3) {
            let thisItem = Game.getActorItemByItemID(actor, itemID);
            if (thisItem) {
                let itemIndex = actor.items.indexOf(thisItem);
                if (inPartyActorDS && cp.symbol == 1) takeOffItem = ProjectPlayer.unPlayerActorItemByItemIndex(inPartyActorIndex, itemIndex);
                else takeOffItem = Game.unActorItemByItemIndex(actor, itemIndex);
            }
        }
        // 卸下/移除全部道具
        else if (cp.symbol == 2 || cp.symbol == 4) {
            if (inPartyActorDS && cp.symbol == 2) ProjectPlayer.unPlayerActorAllItems(inPartyActorIndex);
            else Game.unActorAllItems(actor);
        }
        // 刷新属性
        Game.refreshActorAttribute(actor, GameBattleHelper.getLevelByActor(actor));
        // 记录卸下的道具编号
        if (cp.isTakeOffItemSaveToVar) {
            let takeOffItemID = takeOffItem ? takeOffItem.id : -1;
            Game.player.variable.setVariable(cp.takeOffItemSaveToVar, takeOffItemID);
        }
    }
    /**
    * 修改角色的技能
    */
    export function customCommand_10010(commandPage: CommandPage, cmd: Command, trigger: CommandTrigger, triggerPlayer: ClientPlayer, playerInput: any[], cp: CustomCommandParams_10010): void {
        // 获取角色
        let actor: Module_Actor;
        if (cp.actorCheckType <= 1) {
            let actorDS = ProjectGame.getPlayerActorByCheckType(cp.actorCheckType, cp.useVar, cp.actorID, cp.actorIDVarID,
                cp.actorInPartyIndexVarIDUseVar, cp.actorInPartyIndex, cp.actorInPartyIndexVarID,
                cp.soType, cp.soUseVar, cp.no, cp.noVarID, trigger);
            if (!actorDS) return;
            actor = actorDS.actor;
        }
        else {
            actor = ProjectGame.getActorBySceneObjectIndex(cp.soType, cp.soUseVar, cp.no, cp.noVarID, trigger);
        }
        if (!actor) return;
        // 获取技能编号
        let skillID = MathUtils.int(cp.skillUseVar ? Game.player.variable.getVariable(cp.skillIDVarID) : cp.skillID);
        // 获取角色的技能
        let skills = actor.skills.concat(actor.atkSkill);
        let skill: Module_Skill = ArrayUtils.matchAttributes(skills, { id: skillID }, true)[0];
        // 升级技能
        if (skill) {
            CustomCompData.setData(skill, cp.attributes);
        }
        // 刷新角色属性
        Game.refreshActorAttribute(actor, GameBattleHelper.getLevelByActor(actor));
    }
    /**
    * 修改角色的属性
    */
    export function customCommand_10009(commandPage: CommandPage, cmd: Command, trigger: CommandTrigger, triggerPlayer: ClientPlayer, playerInput: any[], cp: CustomCommandParams_10009): void {
        // 获取角色
        let actor: Module_Actor;
        if (cp.actorCheckType <= 1) {
            let actorDS = ProjectGame.getPlayerActorByCheckType(cp.actorCheckType, cp.useVar, cp.actorID, cp.actorIDVarID,
                cp.actorInPartyIndexVarIDUseVar, cp.actorInPartyIndex, cp.actorInPartyIndexVarID,
                cp.soType, cp.soUseVar, cp.no, cp.noVarID, trigger);
            if (!actorDS) return;
            actor = actorDS.actor;
        }
        else {
            actor = ProjectGame.getActorBySceneObjectIndex(cp.soType, cp.soUseVar, cp.no, cp.noVarID, trigger);
        }
        if (!actor) return;
        //
        let varName: string;
        if (cp.attrInfo.selectMode == 1) {
            let mode = cp.attrInfo.inputModeInfo.mode;
            let constName = cp.attrInfo.inputModeInfo.constName;
            let varNameIndex = cp.attrInfo.inputModeInfo.varNameIndex;
            varName = mode == 0 ? constName : Game.player.variable.getString(varNameIndex);
        }
        else {
            varName = cp.attrInfo.varName;
        }
        if (actor[varName] == undefined) return;
        let count = (oldValue: number, value: number) => {
            if (typeof oldValue != "number" || typeof value != "number") return value;
            let v: number;
            //@ts-ignore
            if (!cp.attrInfo.operationType) v = value;
            //@ts-ignore
            switch (cp.attrInfo.operationType) {
                case 1: v = oldValue + value; break;//加
                case 2: v = oldValue - value; break;//减
                case 3: v = oldValue * value; break;//乘
                case 4: v = oldValue / value; break;//除
                case 5: v = oldValue % value; break;//余
                case 6: v = Math.pow(oldValue, value); break;//幂
            }
            //@ts-ignore
            return cp.attrInfo.isRounded ? MathUtils.int(v) : v;
        }
        if (cp.attrInfo.valueType == 0) {
            let v = cp.attrInfo.value;
            if (v) {
                //object类型
                if (cp.attrInfo.selectMode == 1 && cp.attrInfo.inputModeInfo.typeIndex == 3) {
                    try {
                        v.value = JSON.parse(v.value as any);
                    } catch (e) {
                        (v.value as any) = {};
                    }
                }
                actor[varName] = count(actor[varName], v.value);
            }
        }
        else {
            let v = cp.attrInfo.value;
            if (v && v.value) {
                let varID: number = v.value;
                switch (v.varType) {
                    case 0:
                        actor[varName] = count(actor[varName], Game.player.variable.getVariable(varID));
                        break;
                    case 1:
                        actor[varName] = Game.player.variable.getString(varID);
                        break;
                    case 2:
                        actor[varName] = Game.player.variable.getSwitch(varID);
                        break;
                }
            }
        }
        // 刷新角色属性
        Game.refreshActorAttribute(actor, GameBattleHelper.getLevelByActor(actor));
    }
    //------------------------------------------------------------------------------------------------------
    //  
    //------------------------------------------------------------------------------------------------------
    /**
     * 使用SinglePlayerGame需要在非行为编辑器模式下
     */
    if (!Config.BEHAVIOR_EDIT_MODE) {
        SinglePlayerGame.regSaveCustomData("___changeActorName", Callback.New(() => {
            return changeActorNameInfo;
        }, null));
        EventUtils.addEventListener(ClientWorld, ClientWorld.EVENT_INITED, Callback.New(() => {
            EventUtils.addEventListener(GameGate, GameGate.EVENT_IN_SCENE_STATE_CHANGE, Callback.New(() => {
                if (GameGate.gateState == GameGate.STATE_3_IN_SCENE_COMPLETE) {
                    let restoryChangeActorNameInfo = SinglePlayerGame.getSaveCustomData("___changeActorName");
                    if (restoryChangeActorNameInfo) {
                        changeActorNameInfo = restoryChangeActorNameInfo;
                        for (let i = 0; i < Game.player.data.party.length; i++) {
                            let actorID = Game.player.data.party[i].actor.id;
                            if (changeActorNameInfo[actorID]) {
                                Game.player.data.party[i].actor.name = changeActorNameInfo[actorID];
                            }
                        }
                    }
                }
            }, null));
        }, null), true);
    }
}
