/**
 * 战斗核心流程类
 * Created by 黑暗之神KDS on 2021-01-14 09:47:28.
 */
class GameBattle {
    //------------------------------------------------------------------------------------------------------
    // 事件
    //------------------------------------------------------------------------------------------------------
    /**
     * 事件：战斗回合流程变更 onBattleTurnStageChange(stage:number)
     */
    static EVENT_BATTLE_TURN_STAGE: string = "GameBattleEVENT_BATTLE_TURN_STAGE";
    //------------------------------------------------------------------------------------------------------
    // 系统
    //------------------------------------------------------------------------------------------------------
    /**
     * 来自存档
     */
    static isFromRecorySaveData: boolean;
    /**
     * 战斗参数设定
     */
    static setting: CustomCommandParams_9001;
    /**
     * 战斗标识 0-无 1-准备阶段 2-战斗阶段 3-结束阶段
     */
    static state: number = 0;
    /**
     * 战斗加速演示
     */
    private static _fastPlayMode: boolean;
    private static fastPlayRecordInfo: number[];
    static get fastPlayMode(): boolean {
        return this._fastPlayMode;
    }
    /**
     * 是否处于允许快速演示的敌方回合。
     */
    static get fastPlayAvailable(): boolean {
        if (this.state != 2) return false;
        if (this.inTurnStage != 2 && this.inTurnStage != 3) return false;
        let isPlayerTurn = (this.firstCamp == 0 && this.inTurnStage == 2) ||
            (this.firstCamp == 1 && this.inTurnStage == 3);
        return !isPlayerTurn;
    }
    static set fastPlayMode(v: boolean) {
        if (v) {
            // 仅敌方回合允许开启，玩家回合或已处于加速状态时忽略。
            if (!this.fastPlayAvailable || this.fastPlayRecordInfo) return;
            this.fastPlayRecordInfo = [WorldData.cameraTweenFrame, WorldData.cursorSpeedByComputerControl, WorldData.actionReflectionTime, WorldData.noActionWaitTime, WorldData.aiOpenIndicator ? 1 : 0];
            WorldData.cameraTweenFrame = 0;
            WorldData.cursorSpeedByComputerControl = 2400;
            WorldData.actionReflectionTime = 0;
            WorldData.noActionWaitTime = 0;
            WorldData.aiOpenIndicator = false;
        }
        else if (this.fastPlayRecordInfo) {
            WorldData.cameraTweenFrame = this.fastPlayRecordInfo[0];
            WorldData.cursorSpeedByComputerControl = this.fastPlayRecordInfo[1];
            WorldData.actionReflectionTime = this.fastPlayRecordInfo[2];
            WorldData.noActionWaitTime = this.fastPlayRecordInfo[3];
            WorldData.aiOpenIndicator = this.fastPlayRecordInfo[4] ? true : false;
            this.fastPlayRecordInfo = null;
        }
        this._fastPlayMode = v;
    }
    //------------------------------------------------------------------------------------------------------
    // 流程相关
    //------------------------------------------------------------------------------------------------------
    /**
     * 战斗回合
     */
    static battleRound: number = 0;
    /**
     * 先行方
     */
    static firstCamp: number;
    /**
     * 回合内阶段步骤
     */
    static inTurnStage: number;
    /**
     * 玩家自由操作标识
     */
    static playerControlEnabled: boolean;
    /**
     * 是否允许玩家在自己的行动阶段自由切换尚未完成行动的角色。
     * 规则关闭或旧存档/旧世界数据没有该字段时，默认开启以保证新功能可用。
     */
    static get freePlayerTurnOrderEnabled(): boolean {
        return WorldData.freePlayerTurnOrderEnabled !== false;
    }
    /**
     * 当前是否为玩家阵营行动阶段。
     */
    static get isPlayerTurn(): boolean {
        if (this.state != 2) return false;
        return (this.firstCamp == 0 && this.inTurnStage == 2) ||
            (this.firstCamp == 1 && this.inTurnStage == 3);
    }
    /**
     * 当前玩家回合尚未完成行动的可控角色数量。
     * 该值代表仍可选择的行动次数，待机、死亡、AI 控制和不可控角色不会计入。
     */
    static get playerActionCount(): number {
        let count = 0;
        for (let i = 0; i < this.playerBattlers.length; i++) {
            let battler = this.playerBattlers[i];
            if (!battler) continue;
            let battlerModule = battler.getModule(6) as SoModule_Battler;
            if (!battlerModule || battlerModule.isDead || battlerModule.operationComplete) continue;
            if (GameBattleHelper.isPlayerControlEnabledBattler(battler)) count++;
        }
        return count;
    }
    /**
     * playerActionCount 的语义化别名，便于界面和事件脚本读取剩余行动次数。
     */
    static get remainingPlayerActionCount(): number {
        return this.playerActionCount;
    }
    /**
     * 我方战斗成员
     */
    static playerBattlers: ProjectClientSceneObject[] = [];
    /**
     * 敌方战斗成员
     */
    static enemyBattlers: ProjectClientSceneObject[] = [];
    //------------------------------------------------------------------------------------------------------
    // 结果
    //------------------------------------------------------------------------------------------------------
    /**
     * 上次战斗胜负
     */
    static resultIsWin: boolean;
    /**
     * 是否游戏结束
     */
    static resultIsGameOver: boolean;
    //------------------------------------------------------------------------------------------------------
    // 实现用变量
    //------------------------------------------------------------------------------------------------------
    /**
     * 已使用的玩家角色记录：[playerActor] => battler
     */
    static usedPlayerActorRecord: Dictionary = new Dictionary();
    /**
     * 
     */
    private static nextStepCB: Callback;
    /**
     * 结算阶段效果是否播放
     */
    private static settlementStepEffect: boolean;
    /**
     * 正在检查是否战斗结束
     */
    private static isCheckBattlerfieldDetermineHandle: boolean;
    /**
     * 本场战斗中已经成功触发过复活的战斗者
     */
    private static resurrectionUsedBattlers: ProjectClientSceneObject[] = [];
    //------------------------------------------------------------------------------------------------------
    // 开始
    //------------------------------------------------------------------------------------------------------
    /**
     * 战斗开始前处理
     */
    static init(cp: CustomCommandParams_9001): void {
        // 初始化
        this.isFromRecorySaveData = false;
        // 记录战斗参数设定
        GameBattle.setting = cp;
        // 设定为准备阶段
        GameBattle.state = 1;
        // 战斗控制器启动
        GameBattleController.init();
        // AI管理启动
        GameBattleAI.init();
        // 行为管理启动
        GameBattleAction.init();
        // 战斗者处理器启动
        GameBattleData.init();
        // 清理
        this.resultIsWin = false;
        this.resultIsGameOver = false;
        this.usedPlayerActorRecord.clear();
        this.inTurnStage = 0;
        this.battleRound = 0;
        this.isCheckBattlerfieldDetermineHandle = false;
        this.resurrectionUsedBattlers.length = 0;
        // 决定先手和后手方
        if (this.setting.firstActionCamp == 2) this.firstCamp = Math.random() < 0.5 ? 0 : 1;
        else this.firstCamp = this.setting.firstActionCamp;
    }
    /**
     * 开始战斗
     */
    static start(): void {
        if (!this.nextStepCB) this.nextStepCB = Callback.New(this.nextStep, this)
        // 战斗中标识
        GameBattle.state = 2;
        // 如果跳过了准备阶段需要初始化场上的战斗者
        if (!GameBattle.setting.isPlayerDecisionBattler) GameBattleData.initScenePresetBattler();
        // 战斗正式开始时事件
        GameCommand.startCommonCommand(14021, [], Callback.New(() => {
            // 恢复列表快捷键
            UIList.KEY_BOARD_ENABLED = WorldData.hotKeyListEnabled;
            // 战斗控制器启动
            GameBattleController.start();
            // AI管理启动
            GameBattleAI.start();
            // 行为管理启动
            GameBattleAction.start();
            // 战斗者处理器启动
            GameBattleData.start();
            RogueSkillSynergySystem.onBattleStart();
            // 镜头锁定光标
            Game.currentScene.camera.sceneObject = GameBattleHelper.cursor;
            // 进入新的回合
            this.nextStep();
        }, this), Game.player.sceneObject, Game.player.sceneObject);
    }
    //------------------------------------------------------------------------------------------------------
    // 结束
    //------------------------------------------------------------------------------------------------------
    /**
     * 停止战斗：通常来自结束战斗指令的调用（无论是主动结束战斗或是满足条件自动结束战斗）
     * -- 满足胜负条件：GameBattle.checkBattleIsComplete => WorldData.reachBattleCompelteConditionEvent => 调用结束战斗指令
     * -- 主动结束：调用结束战斗指令
     */
    static stop(onFin: Function, isBreak: boolean = false): void {
        // 清理战斗中标识
        GameBattle.state = 0;
        // 战斗控制器结束
        GameBattleController.stop();
        // AI管理结束
        GameBattleAI.stop();
        // 行为管理启动
        GameBattleAction.stop();
        RogueSkillSynergySystem.onBattleStop();
        // 战斗者处理器启动
        GameBattleData.stop();
        // 如果不是游戏结束
        if (isBreak) {
            doStop();
        }
        else if (!GameBattle.resultIsGameOver) {
            if (GameBattle.setting.isAddEvents) {
                if (GameBattle.resultIsWin && GameBattle.setting.battleStage2_beforeWin) {
                    CommandPage.startTriggerFragmentEvent(GameBattle.setting.battleStage2_beforeWin, Game.player.sceneObject, Game.player.sceneObject, Callback.New(doStop, this));
                    return;
                }
                else if (!GameBattle.resultIsWin && GameBattle.setting.battleStage3_beforeLose) {
                    CommandPage.startTriggerFragmentEvent(GameBattle.setting.battleStage3_beforeLose, Game.player.sceneObject, Game.player.sceneObject, Callback.New(doStop, this));
                    return;
                }
            }
            doStop();
        }
        else {
            // 清理数据
            clearData();
        }
        function doStop() {
            // 死亡角色离队
            GameBattle.deadActorLeaveParty();
            // 清场：清理战斗者
            GameBattle.clearBattlersSceneObject(isBreak);
            // 重置全部角色数据
            if (!isBreak) GameBattle.resetActorParty();
            // 清理数据
            clearData();
            // 回调
            onFin();
        }
        function clearData() {
            GameBattle.playerBattlers.length = 0;
            GameBattle.enemyBattlers.length = 0;
        }
    }
    //------------------------------------------------------------------------------------------------------
    // 战斗内部流程
    //------------------------------------------------------------------------------------------------------
    /**
     * 执行下一个阶段
     */
    static nextStep(): void {
        // 检查战斗结束，如果战斗已经结束则不再继续
        this.battlerfieldDetermineHandle(() => {
            // 取消战斗者们的待机效果
            GameBattleData.closeAllBattlersStandbyEffect();
            // 初始化
            this.playerControlEnabled = false;
            WorldData.playCtrlEnabled = false;
            // 战斗阶段累加，如果超出则回到第一个步骤
            let currentInTurnStage = this.inTurnStage++;
            if (this.inTurnStage > 4) this.inTurnStage = 0;
            // 流程1：新的回合阶段
            if (currentInTurnStage == 0) {
                this.newTurnStep();
            }
            // 流程2：先行方行动阶段
            else if (currentInTurnStage == 1) {
                this.firstCampStartActionStep();
            }
            // 流程3：后行方行动阶段
            else if (currentInTurnStage == 2) {
                this.secondCampStartActionStep();
            }
            // 流程4：结算阶段-1 状态结算
            else if (currentInTurnStage == 3) {
                this.settlementStep1();
            }
            // 流程5：结算阶段-2 碰触物结算
            else if (currentInTurnStage == 4) {
                this.settlementStep2();
            }
        });
    }
    //------------------------------------------------------------------------------------------------------
    // 阶段
    //------------------------------------------------------------------------------------------------------
    /**
     * 新的回合
     */
    private static newTurnStep(): void {
        // 派发事件
        EventUtils.happen(GameBattle, GameBattle.EVENT_BATTLE_TURN_STAGE, [this.inTurnStage]);
        // 回合数累加
        this.battleRound++;
        // 结算阶段标记重置
        this.settlementStepEffect = false;
        // 遍历所有战斗者
        let allBattlers = this.playerBattlers.concat(this.enemyBattlers);
        for (let i in allBattlers) {
            let battler = allBattlers[i];
            // 刷新行动
            let battlerModule = battler.getModule(6) as SoModule_Battler;
            battlerModule.operationComplete = false;
            battlerModule.moved = false;
            battlerModule.actioned = false;
            // 获取角色数据
            let actor = battlerModule.actor;
            // -- 普通攻击是技能的情况，刷新冷却时间
            if (actor.atkMode == 1 && actor.atkSkill) {
                if (actor.atkSkill.currentCD > 0) actor.atkSkill.currentCD--;
            }
            // -- 刷新技能冷却时间
            for (let s = 0; s < actor.skills.length; s++) {
                let skill = actor.skills[s];
                if (skill.currentCD > 0) skill.currentCD--;
            }
            // -- 刷新状态时间，到期解除
            let hasRemoveStatus = false;
            if (this.battleRound != 1) {
                for (let s = 0; s < actor.status.length; s++) {
                    let status = actor.status[s];
                    if (status.totalDuration == 0) continue;
                    status.currentDuration--;
                    if (status.currentDuration <= 0) {
                        let isRemove = GameBattleData.removeStatus(battler, status.id);
                        if (isRemove) {
                            hasRemoveStatus = true;
                            s--;
                        }
                    }
                }
            }
            if (hasRemoveStatus) Game.refreshActorAttribute(actor, GameBattleHelper.getLevelByActor(actor));
        }
        // -- 如果存在局部事件的话，优先执行局部事件再执行全局事件然后进入下一个阶段
        if (GameBattle.setting.isAddEvents && GameBattle.setting.battleStage1_newTurn) {
            // -- 追加执行该次战斗的额外的片段事件「战斗阶段：新的回合」
            CommandPage.startTriggerFragmentEvent(GameBattle.setting.battleStage1_newTurn, Game.player.sceneObject, Game.player.sceneObject, Callback.New(() => {
                // -- 战场判定处理
                this.battlerfieldDetermineHandle(() => {
                    // -- 执行通用的片段事件「战斗阶段：新的回合」
                    GameCommand.startCommonCommand(14031, [], Callback.New(this.nextStep, this), Game.player.sceneObject, Game.player.sceneObject);
                });
            }, this));
        }
        // -- 否则仅运行全局事件然后进入下一个阶段
        else {
            GameCommand.startCommonCommand(14031, [], Callback.New(this.nextStep, this), Game.player.sceneObject, Game.player.sceneObject);
        }
    }
    /**
     * 先行方行动
     */
    private static firstCampStartActionStep(): void {
        // 派发事件
        EventUtils.happen(GameBattle, GameBattle.EVENT_BATTLE_TURN_STAGE, [this.inTurnStage]);
        // 进入先行方行动的事件处理
        GameCommand.startCommonCommand(14032, [], Callback.New(() => {
            // 决定玩家行动或敌方行动
            if (this.firstCamp == 0) this.nextPlayerControl();
            else {
                // 敌方回合开始时才自动回正镜头，玩家回合保持玩家手动调整的位置。
                TouchCameraControl.resetCamera();
                this.nextEnemyControl();
            }
        }, this), Game.player.sceneObject, Game.player.sceneObject);
    }
    /**
     * 后行方行动
     */
    private static secondCampStartActionStep(): void {
        // 派发事件
        EventUtils.happen(GameBattle, GameBattle.EVENT_BATTLE_TURN_STAGE, [this.inTurnStage]);
        // 进入后行方行动的事件处理
        GameCommand.startCommonCommand(14033, [], Callback.New(() => {
            // 决定玩家行动或敌方行动
            if (this.firstCamp == 1) this.nextPlayerControl();
            else {
                // 敌方回合开始时才自动回正镜头，玩家回合保持玩家手动调整的位置。
                TouchCameraControl.resetCamera();
                this.nextEnemyControl();
            }
        }, this), Game.player.sceneObject, Game.player.sceneObject);
    }
    /**
     * 结算阶段-1 状态结算
     */
    private static settlementStep1(): void {
        // 派发事件
        EventUtils.happen(GameBattle, GameBattle.EVENT_BATTLE_TURN_STAGE, [this.inTurnStage]);
        // 关闭所有战斗者面板
        GameBattleAction.closeCurrentBattlerWindow();
        GameBattleAction.closeTargetBattlerWindow();
        // 不需要结算DOT/HOT的情况
        if (!GameBattleAction.isNeedCalcBattlersStatus()) {
            this.nextStep();
            return;
        }
        this.settlementStepEffect = true;
        // 进入结算阶段的事件处理
        GameCommand.startCommonCommand(14034, [], Callback.New(() => {
            // 战场判定处理
            this.battlerfieldDetermineHandle(() => {
                GameBattleAction.calcBattlersStatus(this.nextStepCB);
            })
        }, this), Game.player.sceneObject, Game.player.sceneObject);
    }
    /**
     * 结算阶段-2 碰触
     */
    private static settlementStep2(): void {
        // 派发事件
        EventUtils.happen(GameBattle, GameBattle.EVENT_BATTLE_TURN_STAGE, [this.inTurnStage]);
        let allBattlers = this.playerBattlers.concat(this.enemyBattlers);
        let taskName = "settlementStep2Task";
        let needPlaySettlementStepEffect = false;
        // 碰触测试，如果存在碰触的话才需要播放结算阶段效果，否则略过
        for (let i = 0; i < allBattlers.length; i++) {
            let battler = allBattlers[i];
            let battlerModule = battler.getModule(6) as SoModule_Battler;
            if (battlerModule.isDead) continue;
            let gridSceneObjects = Game.currentScene.sceneUtils.gridSceneObjects[battler.posGrid.x][battler.posGrid.y];
            for (let s = 0; s < gridSceneObjects.length; s++) {
                let gridSceneObject = gridSceneObjects[s];
                if (gridSceneObject == battler) continue;
                let hasTouchTargetEvent = Controller.startSceneObjectTouchEvent(battler, gridSceneObject, null, true, true);
                if (hasTouchTargetEvent) {
                    needPlaySettlementStepEffect = true;
                    break;
                }
            }
        }
        if (needPlaySettlementStepEffect && !this.settlementStepEffect) {
            new SyncTask(taskName, () => {
                GameCommand.startCommonCommand(14034, [], Callback.New(() => {
                    SyncTask.taskOver(taskName);
                }, this), Game.player.sceneObject, Game.player.sceneObject);
            }, []);
        }
        // 碰触，待所有碰触事件完成后继续，碰触事件需要逐个执行
        if (needPlaySettlementStepEffect) {
            for (let i = 0; i < allBattlers.length; i++) {
                let battler = allBattlers[i];
                let battlerModule = battler.getModule(6) as SoModule_Battler;
                if (battlerModule.isDead) continue;
                let gridSceneObjects = Game.currentScene.sceneUtils.gridSceneObjects[battler.posGrid.x][battler.posGrid.y];
                for (let s = 0; s < gridSceneObjects.length; s++) {
                    let gridSceneObject = gridSceneObjects[s];
                    if (gridSceneObject == battler) continue;
                    new SyncTask(taskName, (battler: ProjectClientSceneObject, gridSceneObject: ProjectClientSceneObject) => {
                        let hasTouchTargetEvent = Controller.startSceneObjectTouchEvent(battler, gridSceneObject, Callback.New(() => {
                            SyncTask.taskOver(taskName);
                        }, this), true, false, WorldData.cameraTweenFrame);
                        if (!hasTouchTargetEvent) {
                            SyncTask.taskOver(taskName);
                        }
                        else {
                            GameBattleAction.cameraMoveToBattler(battler);
                            GameBattleAction.showCurrentBattlerWindow(battler);
                        }
                    }, [battler, gridSceneObject], this);
                }
            }
        }
        // -- 下一阶段
        new SyncTask(taskName, () => {
            GameBattleAction.closeCurrentBattlerWindow();
            this.nextStep();
            SyncTask.taskOver(taskName);
        }, []);
    }
    //------------------------------------------------------------------------------------------------------
    // 我方行动
    //------------------------------------------------------------------------------------------------------
    /**
     * 下一个玩家控制
     */
    static nextPlayerControl(): void {
        // 玩家控制阶段
        this.fastPlayMode = false;
        // 战场判定处理
        this.battlerfieldDetermineHandle(() => {
            // 获取下一个自由控制的战斗角色，如果不存在的话则
            let nextPlayerControlBattler = GameBattleHelper.nextPlayerControlBattler;
            if (nextPlayerControlBattler) {
                // 我方自由控制的标识 & 允许控制光标
                GameBattleHelper.cursor.moveSpeed = WorldData.cursorSpeedByPlayerControl;
                this.playerControlEnabled = WorldData.playCtrlEnabled = true;
                GameBattleAction.cameraMoveToBattler(nextPlayerControlBattler);
                GameBattleController.openBattlerMenu(nextPlayerControlBattler);
            }
            else {
                GameBattleHelper.cursor.moveSpeed = WorldData.cursorSpeedByComputerControl;
                // 我方无法控制的标识 & 禁止控制光标
                this.playerControlEnabled = WorldData.playCtrlEnabled = false;
                // 获取下一个玩家阵营的电脑控制的角色开始行动，行动完毕后循环执行，直到所有角色被电脑控制完毕
                let nextPlayerCampComputerControlBattler = GameBattleHelper.nextPlayerCampComputerControlBattler;
                if (nextPlayerCampComputerControlBattler) {
                    GameBattleAI.action(nextPlayerCampComputerControlBattler, Callback.New(this.nextPlayerControl, this));
                }
                // 没有任何可供电脑操作的角色就自动进行到下一步
                else {
                    this.nextStep();
                }
            }
        });
    }
    //------------------------------------------------------------------------------------------------------
    // 敌方行动
    //------------------------------------------------------------------------------------------------------
    /**
     * 下一个敌人控制
     */
    private static nextEnemyControl(): void {
        GameBattleHelper.cursor.moveSpeed = WorldData.cursorSpeedByComputerControl;
        // 战场判定处理
        this.battlerfieldDetermineHandle(() => {
            // 获取下一个玩家阵营的电脑控制的角色开始行动，行动完毕后循环执行，直到所有角色被电脑控制完毕
            let nextEnemyControlBattler = GameBattleHelper.nextEnemyControlBattler;
            if (nextEnemyControlBattler) {
                GameBattleAI.action(nextEnemyControlBattler, Callback.New(this.nextEnemyControl, this));
            }
            // 没有任何可供电脑操作的角色就自动进行到下一步
            else {
                this.nextStep();
            }
        });
    }
    //------------------------------------------------------------------------------------------------------
    // 战场判定处理
    //------------------------------------------------------------------------------------------------------
    /**
     * 战场判定处理：如果未结束战斗才继续
     * -- 刷新参战者所在的阵营以及检查新战斗者加入
     * -- 死亡者判定
     * -- 胜负判定
     * 由于在调用片段事件时可能改变了战场相关的数据，需要进行刷新处理。如：
     * -- 变更战斗者阵营
     * -- 由于出现条件满足而改变了场景对象的状态页
     * -- 增加战斗者
     * -- 杀死战斗者
     * -- 销毁战斗者
     * -- 更换了场景
     * -- 强制结束战斗
     * -- .........
     * @param onFin 当完成时回调
     * @param checkIsDeadBattlers [可选] 默认值=null 需要检查是否死亡的战斗者集合
     */
    static battlerfieldDetermineHandle(onFin: Function): void {
        // -- 如果已经在检查，等待检查完毕后继续检查
        if (this.isCheckBattlerfieldDetermineHandle) {
            setFrameout((onFin: Function) => { this.battlerfieldDetermineHandle(onFin); }, 1, onFin);
            return;
        }
        // -- 已经结束战斗的情况忽略
        if (GameBattle.state == 0 || GameBattle.state == 3) {
            return;
        }
        this.isCheckBattlerfieldDetermineHandle = true;
        // -- 刷新参战者所在的阵营以及检查新战斗者加入
        GameBattleData.refreshCampAndNewBattles();
        // -- 死亡者判定
        let allBattlers = GameBattleHelper.allBattlers;
        let allBattlersCount = allBattlers.length;
        if (allBattlersCount > 0) {
            for (let i = 0; i < allBattlers.length; i++) {
                let battler = allBattlers[i];
                this.checkBattlerIsDead(battler, () => {
                    allBattlersCount--;
                    if (allBattlersCount == 0) {
                        this.isCheckBattlerfieldDetermineHandle = false;
                        // -- 胜负判定
                        let isComplete = GameBattle.checkBattleIsComplete();
                        if (!isComplete) onFin.apply(this);
                    }
                });
            }
        }
        else {
            // -- 胜负判定
            let isComplete = GameBattle.checkBattleIsComplete();
            if (!isComplete) onFin.apply(this);
        }
    }
    /**
     * 检查战斗者是否死亡
     * @param battler 战斗者 
     * @param onFin 
     */
    static checkBattlerIsDead(battler: ProjectClientSceneObject, onFin: Function): void {
        // 当生命值归零的时候
        let battlerModule = battler.getModule(6) as SoModule_Battler;
        if (!battlerModule[`__checkIsDead`] && !battlerModule.isDead && battlerModule.actor.hp == 0) {
            // 不再重复执行
            battlerModule[`__checkIsDead`] = true;
            // 特殊效果：复活
            let getResurrectionHealthPer = this.resurrectionUsedBattlers.indexOf(battler) < 0 ?
                GameBattleHelper.getResurrectionHealthPer(battler) : null;
            if (getResurrectionHealthPer != null) {
                let hpValue = MathUtils.int(battlerModule.actor.MaxHP * getResurrectionHealthPer * 0.01);
                if (hpValue > 0) {
                    this.resurrectionUsedBattlers.push(battler);
                    GameBattleData.removeAllStatus(battler, true);
                    GameBattleAction.execCommonDieEvent(battler, () => {
                        GameBattleData.changeBattlerHP(battler, hpValue);
                        GameBattleAction.showDamage(battler, 3, hpValue, false);
                        GameCommand.startCommonCommand(14045, [], Callback.New(() => {
                            battlerModule[`__checkIsDead`] = false;
                            onFin.apply(this);
                        }, this), battler, battler);
                    })
                    return;
                }
            }
            // 执行死亡者事件
            GameBattleAction.execCommonDieEvent(battler, () => {
                GameBattleAction.execActorDieEvent(battler, () => {
                    battlerModule[`__checkIsDead`] = false;
                    // -- 刷新参战者所在的阵营以及检查新战斗者加入
                    GameBattleData.refreshCampAndNewBattles();
                    // -- 仍然是战斗者且死亡的话则进行死亡处理
                    if (!battler.isDisposed && GameBattleHelper.isBattler(battler)) {
                        // 当前模块生命值为0时（可能发生了状态页变化）
                        if (battler.battlerSetting.actor.hp == 0) {
                            GameBattleData.die(battler, true);
                        }
                        // 此前的状态页生命值为0时（不死亡，但结算奖励）
                        else if (battler.battlerSetting != battlerModule && battlerModule.actor.hp == 0) {
                            GameBattleData.die(battler, true, true, battlerModule);
                        }
                    }
                    onFin && onFin.apply(this);
                })
            })
        }
        else {
            onFin && onFin.apply(this);
        }
    }
    //------------------------------------------------------------------------------------------------------
    // 内部实现
    //------------------------------------------------------------------------------------------------------
    /**
     * 检查战斗的结束状态，满足以下任意条件则结束战斗
     * -- 我方指定的任意角色死亡
     * -- 我方全员阵亡
     * -- 敌方全员阵亡
     * @return [number] 0-无 1-胜利 2-失败
     */
    private static getBattleCompleteState(): number {
        // 剧情关卡可以保护指定角色；肉鸽只按阵营全灭判断胜负。
        if (!RogueRunManager.active) {
            for (let i = 0; i < GameBattle.setting.addFailConditions.length; i++) {
                let actorID = GameBattle.setting.addFailConditions[i];
                let thisActorBattlers: ProjectClientSceneObject[] = ArrayUtils.matchAttributesD3(this.playerBattlers, "battlerSetting", "actor", { id: actorID }, false);
                let thisActorDeadBattlers: ProjectClientSceneObject[] = ArrayUtils.matchAttributesD2(thisActorBattlers, "battlerSetting", { isDead: true }, false);
                for (let s = 0; s < thisActorDeadBattlers.length; s++) {
                    let thisActorBattler = thisActorDeadBattlers[s];
                    if (GameBattleHelper.isInPlayerParty(thisActorBattler)) {
                        return 2;
                    }
                }
            }
        }
        // 我方全员阵亡的情况
        if (this.playerBattlers.length > 0 && ArrayUtils.matchAttributesD2(this.playerBattlers, "battlerSetting", { isDead: true }, false).length == this.playerBattlers.length) {
            return 2;
        }
        // 敌方全员阵亡的情况：阵亡或已不再是战斗者
        if (this.enemyBattlers.length > 0 && ArrayUtils.matchAttributesD2(this.enemyBattlers, "battlerSetting", { isDead: true }, false).length == this.enemyBattlers.length) {
            return 1;
        }
        return 0;
    }
    /**
     * 战斗结束后清理战斗者
     * @param isBreak[可选] 默认值=false 中断战斗
     */
    private static clearBattlersSceneObject(isBreak: boolean = false): void {
        // 重置相关标识
        for (let i = 0; i < Game.currentScene.sceneObjects.length; i++) {
            let so = Game.currentScene.sceneObjects[i];
            if (GameBattleHelper.isBattler(so)) {
                let battlerModule = so.getModule(6) as SoModule_Battler;
                if (!isBreak) {
                    battlerModule.isInited = false;
                    battlerModule.hateList.length = 0;
                    GameBattleData.removeAllStatus(so);
                }
                battlerModule.isExecuteAppearEvent = false;
            }
        }
        // 清理战场，根据战斗预设
        if (GameBattle.setting.winClearBattlefieldType != 2) {
            // 清理我方战斗者
            for (let i = 0; i < this.playerBattlers.length; i++) {
                let playerBattler = this.playerBattlers[i];
                let playerBattlerModule = playerBattler.getModule(6) as SoModule_Battler;
                // 保留阵亡者的情况，不清理
                if (GameBattle.setting.keepDeadBattler && playerBattlerModule.isDead) continue;
                playerBattler.dispose();
                i--;
            }
            // 如果需要清理全部战斗者的话则还清理敌方战斗者
            if (GameBattle.setting.winClearBattlefieldType == 0) {
                for (let i = 0; i < this.enemyBattlers.length; i++) {
                    let enemyBattler = this.enemyBattlers[i];
                    let enemyBattlerModule = enemyBattler.getModule(6) as SoModule_Battler;
                    // 保留阵亡者的情况，不清理
                    if (GameBattle.setting.keepDeadBattler && enemyBattlerModule.isDead) continue;
                    enemyBattler.dispose();
                    i--;
                }
            }
        }
        // 未能清理的战斗者直接调用片段事件：battlerClearEvent
        for (let i = 0; i < this.playerBattlers.length; i++) {
            let playerBattler = this.playerBattlers[i];
            // -- 恢复可能存在的允许鼠标选中
            if (playerBattler[`__selectEnabledRecord`]) playerBattler.selectEnabled = true;
            GameCommand.startCommonCommand(14043, [], null, playerBattler, playerBattler);
        }
        for (let i = 0; i < this.enemyBattlers.length; i++) {
            let enemyBattler = this.enemyBattlers[i];
            // -- 恢复可能存在的允许鼠标选中
            if (enemyBattler[`__selectEnabledRecord`]) enemyBattler.selectEnabled = true;
            GameCommand.startCommonCommand(14043, [], null, enemyBattler, enemyBattler);
        }
    }
    /**
     * 战斗结束后死亡的角色离开队伍
     */
    private static deadActorLeaveParty(): void {
        if (WorldData.deadPlayerActorLeaveParty) {
            for (let i = 0; i < this.playerBattlers.length; i++) {
                let playerBattler = this.playerBattlers[i];
                let playerBattlerModule = playerBattler.getModule(6) as SoModule_Battler;
                // 如果是玩家拥有的角色且死亡的话
                if (playerBattlerModule.isDead && GameBattleHelper.isInPlayerParty(playerBattler)) {
                    // 离开队伍：需要重新计算所在位置，因为可能移除后导致位置变更了
                    let inPlayerActorIndex = ProjectPlayer.getPlayerActorIndexByActor(playerBattlerModule.actor);
                    if (inPlayerActorIndex >= 0) {
                        ProjectPlayer.removePlayerActorByInPartyIndex(inPlayerActorIndex);
                        this.playerBattlers.splice(i, 1);
                        i--;
                    }
                }
            }
        }
    }
    /**
     * 战斗结束后重置角色数据：刷新属性
     */
    private static resetActorParty(): void {
        for (let i = 0; i < Game.player.data.party.length; i++) {
            let actorDS = Game.player.data.party[i];
            let actor = actorDS.actor;
            Game.refreshActorAttribute(actor, actorDS.lv);
            // -- 每场战斗恢复满状态的情况
            if (WorldData.fullStateWhenBattleStart) {
                actor.hp = actor.MaxHP;
                actor.sp = actor.MaxSP;
            }
            // -- 否则如果死亡未离开队伍的情况，生命值最低为1
            else if (!WorldData.deadPlayerActorLeaveParty) {
                if (actor.hp <= 0) actor.hp = 1;
            }
        }
    }
    /**
     * 由系统检查战斗是否完成（满足了胜负条件）
     */
    static checkBattleIsComplete(): boolean {
        // 已结束的情况
        if (GameBattle.state == 0 || GameBattle.state == 3) return true;
        // 如果需要结束的情况
        let battleOverState = this.getBattleCompleteState();
        let isBattleOver = battleOverState != 0;
        // 执行战斗结束事件
        if (isBattleOver) {
            GameBattle.state = 3;
            let isWin = battleOverState == 1
            GameBattle.resultIsWin = isWin;
            GameBattle.resultIsGameOver = !isWin;
            // 如果战败后继续的话，不视为游戏结束
            if (GameBattle.setting.battleFailHandleType == 1) {
                GameBattle.resultIsGameOver = false;
            }
            let finishBattle = () => {
                // 结算原生战斗奖励后再执行胜负满足时事件。
                GameBattleAction.calcCurrentActionReward(false, () => {
                    GameCommand.startCommonCommand(14022, [], null, Game.player.sceneObject, Game.player.sceneObject);
                });
            };
            // 最后一击产生的肉鸽卡牌必须先选完，胜利流程不能与奖励 UI 并行。
            if (!RogueRewardPresenter.presentPending(finishBattle, "battle-complete")) finishBattle();
            return true;
        }
        return false;
    }
    //------------------------------------------------------------------------------------------------------
    // 战斗存档 - 数据储存与恢复
    //------------------------------------------------------------------------------------------------------
    /**
     * 记录战斗数据
     */
    static getSaveData() {
        let o = {} as any;
        o.setting = this.setting;
        o.state = this.state;
        o.battleRound = this.battleRound;
        o.firstCamp = this.firstCamp;
        o.inTurnStage = this.inTurnStage;
        o.playerControlEnabled = this.playerControlEnabled;
        // playerBattlers
        o.playerBattlers = [];
        for (let i = 0; i < this.playerBattlers.length; i++) {
            let battler = this.playerBattlers[i];
            if (battler) o.playerBattlers.push(battler.index);
            else o.playerBattlers.push(null);
        }
        // enemyBattlers  
        o.enemyBattlers = [];
        for (let i = 0; i < this.enemyBattlers.length; i++) {
            let battler = this.enemyBattlers[i];
            if (battler) o.enemyBattlers.push(battler.index);
            else o.enemyBattlers.push(null);
        }
        //
        o.resultIsWin = this.resultIsWin;
        o.resultIsGameOver = this.resultIsGameOver;
        // usedPlayerActorRecord 
        o.usedPlayerActorRecord = [];
        let usedPlayerActorRecordKeys = this.usedPlayerActorRecord.keys;
        for (let i = 0; i < usedPlayerActorRecordKeys.length; i++) {
            let actor = usedPlayerActorRecordKeys[i];
            let battler = this.usedPlayerActorRecord.get(actor);
            let inPartyIndex = ProjectPlayer.getPlayerActorIndexByActor(actor);
            if (inPartyIndex >= 0) {
                o.usedPlayerActorRecord.push({ inPartyIndex: inPartyIndex, soIndex: battler.index });
            }
        }
        //
        o.settlementStepEffect = this.settlementStepEffect;
        o.isCheckBattlerfieldDetermineHandle = this.isCheckBattlerfieldDetermineHandle;
        o.resurrectionUsedBattlers = [];
        for (let i = 0; i < this.resurrectionUsedBattlers.length; i++) {
            let battler = this.resurrectionUsedBattlers[i];
            if (battler && battler.index >= 0) o.resurrectionUsedBattlers.push(battler.index);
        }
        return o;
    }
    /**
     * 恢复战斗数据
     * @param o 来自getSaveData()
     */
    static retorySaveData(o: any) {
        if (!this.nextStepCB) this.nextStepCB = Callback.New(this.nextStep, this)
        this.setting = o.setting;
        this.state = o.state;
        this.battleRound = o.battleRound;
        this.firstCamp = o.firstCamp;
        this.inTurnStage = o.inTurnStage;
        this.playerControlEnabled = o.playerControlEnabled;
        // playerBattlers
        this.playerBattlers = [];
        for (let i = 0; i < o.playerBattlers.length; i++) {
            let battlerIndex = o.playerBattlers[i];
            if (battlerIndex == null || battlerIndex < 0) this.playerBattlers.push(null);
            else {
                let battler = Game.currentScene.sceneObjects[battlerIndex];
                if (battler) {
                    this.playerBattlers.push(battler);
                    battler.once(GameSprite.ON_DISPOSE, GameBattleData, GameBattleData.onBattlerRemoved, [battler]);
                }
                else this.playerBattlers.push(null);
            }
        }
        // enemyBattlers  
        this.enemyBattlers = [];
        for (let i = 0; i < o.enemyBattlers.length; i++) {
            let battlerIndex = o.enemyBattlers[i];
            if (battlerIndex == null || battlerIndex < 0) this.enemyBattlers.push(null);
            else {
                let battler = Game.currentScene.sceneObjects[battlerIndex];
                if (battler) {
                    this.enemyBattlers.push(battler);
                    battler.once(GameSprite.ON_DISPOSE, GameBattleData, GameBattleData.onBattlerRemoved, [battler]);
                    retoryStatusAnimation(battler.getModule(6) as SoModule_Battler);
                }
                else this.enemyBattlers.push(null);
            }
        }
        //
        this.resultIsWin = o.resultIsWin;
        this.resultIsGameOver = o.resultIsGameOver;
        // usedPlayerActorRecord 
        this.usedPlayerActorRecord.clear();
        for (let i = 0; i < o.usedPlayerActorRecord.length; i++) {
            let inPartyIndexInfo = o.usedPlayerActorRecord[i];
            let inPartyIndex = inPartyIndexInfo.inPartyIndex;
            let soIndex = inPartyIndexInfo.soIndex;
            if (inPartyIndex != null && inPartyIndex >= 0) {
                let actorDS = ProjectPlayer.getPlayerActorDSByInPartyIndex(inPartyIndex);
                if (actorDS) {
                    let battler = Game.currentScene.sceneObjects[soIndex];
                    if (battler) {
                        let battlerModule = battler.getModule(6) as SoModule_Battler;
                        if (battlerModule) {
                            battlerModule.actor = actorDS.actor;
                            this.usedPlayerActorRecord.set(actorDS.actor, battler);
                            retoryStatusAnimation(battlerModule);
                        }
                    }
                }
            }
        }
        // 兼容旧存档：没有该字段时视为本场尚未使用复活。
        this.resurrectionUsedBattlers = [];
        let resurrectionUsedBattlerIndexes = o.resurrectionUsedBattlers || [];
        for (let i = 0; i < resurrectionUsedBattlerIndexes.length; i++) {
            let battler = Game.currentScene.sceneObjects[resurrectionUsedBattlerIndexes[i]];
            if (battler) this.resurrectionUsedBattlers.push(battler);
        }
        //
        o.settlementStepEffect = this.settlementStepEffect;
        o.isCheckBattlerfieldDetermineHandle = this.isCheckBattlerfieldDetermineHandle;
        // 恢复战斗
        if (this.state != 0) {
            // 关闭已打开的界面
            GameCommand.startCommonCommand(15013, []);
            // 控制启动
            Controller.start();
            // 战斗控制器启动
            GameBattleController.init();
            // AI管理启动
            GameBattleAI.init();
            // 行为管理启动
            GameBattleAction.init();
            // 战斗者处理器启动
            GameBattleData.init();
            // 战斗控制器启动
            GameBattleController.start();
            // AI管理启动
            GameBattleAI.start();
            // 行为管理启动
            GameBattleAction.start();
            // 战斗者处理器启动
            GameBattleData.start();
            // 光标
            Game.player.sceneObject.playAnimation(WorldData.battleCursorAni, true, true);
            Game.currentScene.camera.sceneObject = GameBattleHelper.cursor;
            // 清理标识
            GameBattle.isFromRecorySaveData = false;
            // 开始阶段
            let reStart = Callback.New(() => {
                this.inTurnStage--;
                this.nextStep();
            }, this);
            if (GameBattle.setting.battleStageX_onLoadFile) {
                let res = CommandPage.startTriggerFragmentEvent(GameBattle.setting.battleStageX_onLoadFile, Game.player.sceneObject, Game.player.sceneObject, reStart);
                if (!res) reStart.run();
            }
        }
        else {
            GameBattle.isFromRecorySaveData = false;
            this.enemyBattlers = [];
            this.playerBattlers = [];
        }
        function retoryStatusAnimation(battlerModule: SoModule_Battler) {
            if (!battlerModule || battlerModule.isDead) return;
            let actor = battlerModule.actor;
            if (actor) {
                for (let i = 0; i < actor.status.length; i++) {
                    let st = actor.status[i];
                    if (st && st.animation) {
                        battlerModule.so.playAnimation(st.animation, true, true);
                    }
                }
            }
        }
    }
}
if (!Config.BEHAVIOR_EDIT_MODE) {
    // 追加存档时额外储存战斗前玩家的状态
    SinglePlayerGame.regSaveCustomData("GameBattle", Callback.New(() => {
        return GameBattle.getSaveData();
    }, null));
    // 监听读档恢复数据，恢复储存的自定义数据-战斗前玩家的状态
    EventUtils.addEventListener(SinglePlayerGame, SinglePlayerGame.EVENT_ON_BEFORE_RECOVERY_DATA, Callback.New(() => {
        // 来自存档
        GameBattle.isFromRecorySaveData = true;
    }, null));
    // 监听读档恢复数据，恢复储存的自定义数据-战斗前玩家的状态
    EventUtils.addEventListener(SinglePlayerGame, SinglePlayerGame.EVENT_ON_AFTER_RECOVERY_DATA, Callback.New(() => {
        let GameBattleSaveData = SinglePlayerGame.getSaveCustomData("GameBattle");
        if (GameBattleSaveData) GameBattle.retorySaveData(GameBattleSaveData);
        else GameBattle.isFromRecorySaveData = false;
    }, null));
}
