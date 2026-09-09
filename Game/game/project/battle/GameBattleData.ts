/**
 * 战斗者数据
 * 
 * //------------------------------------------------------------------------------------------------------
 * // 关于仇恨
 * //------------------------------------------------------------------------------------------------------
 * -- 当该角色是通过仇恨方式攻击的话，按照仇恨值从高到底列表中选取敌对目标
 * -- 清理仇恨的情况包含（该战斗者的仇恨列表置空以及其他战斗者的仇恨列表清理对该战斗者的仇恨）：
 *    -- 该战斗者死亡
 *    -- 该战斗者中途改变阵营
 *    -- 该战斗者状态页发生了变更
 *    -- 销毁战斗者时
 *    -- 主动清理仇恨
 * 
 * //------------------------------------------------------------------------------------------------------
 * // 战斗者和角色初始化：当新的战斗者出现时
 * // GameBattleData.onBattlerAppear
 * //------------------------------------------------------------------------------------------------------
 *  -- 场景预先摆放的战斗者
 *  -- 玩家操作摆放的战斗者
 *  -- 中途生成的战斗者（如通过事件）
 * 
 * 【场景对象 SceneObject】 初始化
 * -- isDead = false
 * -- operationComplete = false
 * -- moved = false
 * -- actioned = false
 * -- inPlayerActorIndex 根据是否是玩家的角色而定
 * -- isInited 是否已初始化过的标识
 * -- isExecuteAppearEvent 是否执行过出现事件标识
 * -- hateList 清空
 * -- 如果是玩家的角色的话则角色数据指向玩家的角色
 * -- 片段事件： - WorldData.battlerInitEvent 战斗者出现事件
 * 
 * 【场景对象对应的战斗角色 Actor】 初始化
 * -- 清空全部状态
 * -- 刷新属性
 * -- 生命值和魔法值回满
 * 
 * //------------------------------------------------------------------------------------------------------
 * // 关于阵营变更
 * //------------------------------------------------------------------------------------------------------
 * -- hateList 清空
 * -- 片段事件：- battlerInitEvent 战斗者出现事件
 * 
 * Created by 黑暗之神KDS on 2021-02-07 21:21:56.
 */
class GameBattleData {
    /**
     * 事件：计算击中结果-开始 onCalcHitResultStart(fromBattler:Battler,targetBattler:Battler,actionType:number,skill:Module_Skill,item:Module_Item,status:Module_Status);
     */
    static EVENT_CALC_HIT_RESULT_START: string = "GameBattleDataEVENT_CALC_HIT_RESULT_START";
    /**
     * 事件：计算击中结果-完成 onCalcHitResultOver(fromBattler:Battler,targetBattler:Battler,damageType: number,damage:number,isCrit:boolean);
     */
    static EVENT_CALC_HIT_RESULT_OVER: string = "GameBattleDataEVENT_CALC_HIT_RESULT_OVER";
    /**
     * 事件：战斗者死亡 onEventBattlerDead(battler:Battler);
     */
    static EVENT_BATTLER_DEAD: string = "GameBattleDataEVENT_BATTLER_DEAD";
    /**
     * 状态发生改变 onStatusChange(battler:ProjectClientSceneObject)
     */
    static EVENT_STATUS_CHANGE: string = "GameBattleDataEVENT_STATUS_CHANGE";
    /**
     * 事件：添加状态 onAddStatus(fromBattler:Battler, targetBattler:Battler, statusID:number, thisStatus:Module_Status, force:boolean);
     */
    static EVENT_ADD_STATUS: string = "GameBattleDataEVENT_ADD_STATUS";
    /**
     * 事件：移除状态 onRemoveStatus(targetBattler:Battler, statusID:number, removedStatus:Module_Status);
     */
    static EVENT_REMOVE_STATUS: string = "GameBattleDataEVENT_REMOVE_STATUS";
    /**
     * 记录击杀奖励
     */
    static hitReward: {
        gold: number,
        exp: number,
        items: { itemID: number, num: number }[],
        equips: Module_Equip[],
    } = { gold: 0, exp: 0, items: [], equips: [] };
    /**
     * 片段经验值
     */
    static dropEXPFragmentCount: number = 0;
    //------------------------------------------------------------------------------------------------------
    // 
    //------------------------------------------------------------------------------------------------------
    /**
     * 初始化
     */
    static init(): void {

    }
    /**
     * 开始
     */
    static start() {
        // 监听场景对象的状态页改变时处理
        EventUtils.addEventListenerFunction(SceneObjectEntity, SceneObjectEntity.EVENT_BEFORE_CHANGE_STATUS_PAGE, this.onChangeSceneObjectStatus, this);
        // 刷新阵营和参战者
        this.refreshCampAndNewBattles();
    }
    /**
     * 停止
     */
    static stop() {
        // 取消战斗者的待机显示效果
        this.closeAllBattlersStandbyEffect();
        // 取消监听场景对象的状态页改变时处理
        EventUtils.removeEventListenerFunction(SceneObjectEntity, SceneObjectEntity.EVENT_BEFORE_CHANGE_STATUS_PAGE, this.onChangeSceneObjectStatus, this);
    }
    //------------------------------------------------------------------------------------------------------
    // 初始化
    //------------------------------------------------------------------------------------------------------
    /**
     * 初始化场景预设的出场战斗者
     */
    static initScenePresetBattler(): void {
        for (let i in Game.currentScene.sceneObjects) {
            let so = Game.currentScene.sceneObjects[i];
            this.onBattlerAppear(so);
        }
    }
    /**
     * 初始化战斗者，如果对应的角色不存在则会销毁
     * @param battle 战斗者
     * @param forceBin
     */
    static onBattlerAppear(battler: ProjectClientSceneObject): void {
        // 忽略非战斗者
        if (!GameBattleHelper.isBattler(battler)) return;
        // 战斗时禁用允许光标选中效果
        if (GameBattle.state == 2) {
            battler[`__selectEnabledRecord`] = battler.selectEnabled;
            battler.selectEnabled = false;
        }
        // 已初始化完成的话则不再继续（但执行-出现事件）
        let battlerModule = battler.getModule(6) as SoModule_Battler;
        RogueKillProgress.attachSummonOwner(battler);
        if (battlerModule.isDead) return;
        if (battlerModule.isInited) {
            this.callBattlerInitFragmentEvent(battler);
            return;
        }
        battlerModule.isInited = true;
        RogueSceneDirector.applyEnemyLevel(battlerModule);
        // 获取战斗者的角色编号
        let battlerActorID = battlerModule.actor.id;
        // 如果不存在该战斗角色预设的话则移除掉
        if (!GameData.getModuleData(6, battlerActorID)) {
            battler.dispose();
            return;
        }
        // 如果是玩家拥有的角色的话则指向玩家的角色数据
        this.ifPlayerActorBindingPlayerActorData(battler);
        if (battler.isDisposed) return;
        // 初始化战斗者和角色属性
        let actor = battlerModule.actor;
        // Mark ordinary enemies before the first attribute refresh so the
        // shared actor calculator can apply the campaign balance once.
        actor["__normalEnemyBalance"] = battlerModule.battleCamp === 1;
        let level = GameBattleHelper.getLevelByActor(actor);
        // -- 初始化战斗者属性
        battlerModule.isDead = false;
        battlerModule.operationComplete = false;
        battlerModule.moved = false;
        battlerModule.actioned = false;
        battlerModule["__warmMountainReActionRound"] = -1;
        battlerModule.hateList = [];
        battler.moveSpeed = actor.moveSpeed;
        this.clearHateList(battler);
        // 战斗者数据初始化
        this.battlerDataInit(battler, true, true, true);
        // 执行初始化片段事件
        this.callBattlerInitFragmentEvent(battler);
        // 监听场景对象销毁事件
        battler.off(GameSprite.ON_DISPOSE, this, this.onBattlerRemoved);
        battler.once(GameSprite.ON_DISPOSE, this, this.onBattlerRemoved, [battler]);
    }
    /**
     * 当战斗者被移除时：不再是战斗者的情况
     * @param battler 战斗者
     */
    static onBattlerRemoved(battler: ProjectClientSceneObject): void {
        // -- 恢复可能存在的允许鼠标选中
        if (battler[`__selectEnabledRecord`]) battler.selectEnabled = true;
        // -- 如果是角色的话还要清理掉记录关系
        GameBattle.usedPlayerActorRecord.remove((battler.getModule(6) as SoModule_Battler).actor);
        // -- 清理来源是该状态者的状态
        GameBattleData.removeAllBattlerStatusByFromBattler(battler);
        // -- 清理战斗者的仇恨
        this.clearHateList(battler, true);
        // -- 从战斗者阵营列表中移除
        ArrayUtils.remove(GameBattle.playerBattlers, battler);
        ArrayUtils.remove(GameBattle.enemyBattlers, battler);
        // -- 执行移除事件
        GameCommand.startCommonCommand(14043, [], null, battler, battler);
    }
    /**
     * 战斗者数据初始化
     * @param battler 战斗者
     * @param initStatus 初始化状态
     * @param initXP 初始化HP/SP
     * @param initSkillCD 初始化技能冷却时间（CD）
     */
    static battlerDataInit(battler: ProjectClientSceneObject, initStatus: boolean, initXP: boolean, initSkillCD: boolean): void {
        // 初始化战斗者和角色属性
        let battlerModule = battler.getModule(6) as SoModule_Battler;
        let actor = battlerModule.actor;
        let level = GameBattleHelper.getLevelByActor(actor);
        // -- 附加自动状态
        if (initStatus) {
            GameBattleData.removeAllStatus(battler);
            Game.refreshActorAttribute(actor, level); // 刷新一次属性，以便记录自动状态以便附加这些状态
            if (actor.selfStatus.length != 0) {
                for (let i = 0; i < actor.selfStatus.length; i++) {
                    GameBattleData.addStatus(battler, actor.selfStatus[i], battler);
                }
                Game.refreshActorAttribute(actor, level);
            }
        }
        // -- 恢复满状态
        if (initXP) {
            if (WorldData.fullStateWhenBattleStart || !GameBattleHelper.isInPlayerParty(battler)) {
                actor.hp = actor.MaxHP;
                actor.sp = actor.MaxSP;
            }
            else if (actor.hp <= 0) {
                actor.hp = 1;
            }
        }
        // -- 全技能冷却
        if (initSkillCD) {
            for (let i = 0; i < actor.skills.length; i++) {
                let skill = actor.skills[i];
                skill.currentCD = 0;
            }
        }
    }
    //------------------------------------------------------------------------------------------------------
    // 
    //------------------------------------------------------------------------------------------------------
    /**
     * 取消战斗者们的待机效果
     */
    static closeAllBattlersStandbyEffect() {
        let allBattlers = GameBattleHelper.allBattlers;
        for (let i = 0; i < allBattlers.length; i++) {
            let battler = allBattlers[i];
            GameBattleData.clearBattlerStandbyEffect(battler);
        }
    }
    /**
     * 设置战斗角色待机效果
     * @param battler 战斗者
     */
    static setBattlerStandby(battler: ProjectClientSceneObject): boolean {
        let battlerModule = battler.getModule(6) as SoModule_Battler;
        // 暖山四件套：每回合首次完成有效行动时，不进入待机并刷新行动机会。
        if (battlerModule["__warmMountainReActionRound"] != GameBattle.battleRound && (battlerModule.moved || battlerModule.actioned) &&
            ProjectGame.hasWarmMountainSet(battlerModule.actor)) {
            battlerModule["__warmMountainReActionRound"] = GameBattle.battleRound;
            battlerModule.operationComplete = false;
            battlerModule.moved = false;
            battlerModule.actioned = false;
            return false;
        }
        // 当前回合行动完毕标识
        battlerModule.operationComplete = true;
        // 执行片段事件：战斗者开始待机时事件
        GameCommand.startCommonCommand(14040, [], null, battler, battler);
        return true;
    }
    /**
     * 累计经验值片段
     * @param fromBattler 来源战斗者
     * @param targetBattler 目标战斗者
     * @param percentage 百分比
     */
    static addEXPFragment(fromBattler: ProjectClientSceneObject, targetBattler: ProjectClientSceneObject, percentage: number) {
        let targetBattlerModule = targetBattler.getModule(6) as SoModule_Battler;
        let fromBattlerModule = fromBattler.getModule(6) as SoModule_Battler;
        // -- 伤害类技能且造成了伤害时：记录片段经验值
        if (WorldData.getEXPMode == 1 && targetBattlerModule.actor.hp > 0) {
            // -- 敌人存在经验值的情况
            if (targetBattlerModule.actor.dropEnabled && targetBattlerModule.actor.dropExp > 0) {
                // ---- 目标是敌人，攻击者是玩家角色的情况
                if (targetBattlerModule.battleCamp == 1 && GameBattleHelper.isInPlayerParty(fromBattler)) {
                    // ---- 允许获得经验的情况
                    if (fromBattlerModule.actor.growUpEnabled) {
                        let fromBattlerActorDS = ProjectPlayer.getPlayerActorDSByActor(fromBattlerModule.actor);
                        if (fromBattlerActorDS.lv < fromBattlerModule.actor.MaxLv) {
                            let per = Math.min(1, percentage);
                            let dropEXPFragment = Math.floor(per * targetBattlerModule.actor.dropExp);
                            if (dropEXPFragment > 0) {
                                this.dropEXPFragmentCount += dropEXPFragment;
                            }
                        }
                    }
                }
            }
        }
    }
    /**
     * 让战斗者死亡
     * @param battler 战斗者
     * @param force[可选] 默认值=false 
     * @param statusPageChange[可选] 默认值=false 
     */
    static die(battler: ProjectClientSceneObject, force: boolean = false, statusPageChange: boolean = false, oldModule: SoModule_Battler = null): void {
        let battlerModule = battler.getModule(6) as SoModule_Battler;
        if (!force && battlerModule.isDead) return;
        if (!statusPageChange) {
            // -- 死亡标记
            battlerModule.isDead = true;
            // -- 置空
            battlerModule.actor.hp = 0;
            battlerModule.actor.sp = 0;
        }
        // -- 清空全部状态
        GameBattleData.removeAllStatus(battler);
        // -- 清理仇恨
        this.clearHateList(battler, true);
        // -- 记录击杀奖励：金币、经验、道具、装备
        this.dropRecordByDie(battler, oldModule);
        // 肉鸽按死亡目标逐个结算，不能依赖一次行动共享的 hitReward。
        RogueKillProgress.onBattlerDie(battler, oldModule);
        // -- 派发战斗者死亡事件
        EventUtils.happen(GameBattleData, GameBattleData.EVENT_BATTLER_DEAD, [battler]);
    }
    /**
     * 死亡掉落
     */
    static dropRecordByDie(battler: ProjectClientSceneObject, oldModule: SoModule_Battler = null): void {
        if (RogueRunManager.active) return;
        let battlerModule = oldModule ? oldModule : battler.getModule(6) as SoModule_Battler;
        if (!battlerModule) return;
        let battleActor = battlerModule.actor;
        if (battlerModule.battleCamp == 1 && battleActor.dropEnabled) {
            this.hitReward.gold += battleActor.dropGold;
            this.hitReward.exp += battleActor.dropExp;
            for (let i = 0; i < battleActor.dropItems.length; i++) {
                let dropItemDS = battleActor.dropItems[i];
                if (MathUtils.rand(100) < dropItemDS.dropProbability) {
                    this.hitReward.items.push({ itemID: dropItemDS.item, num: dropItemDS.num });
                }
            }
            for (let i = 0; i < battleActor.dropEquips.length; i++) {
                let dropEquipDS = battleActor.dropEquips[i];
                if (MathUtils.rand(100) < dropEquipDS.dropProbability) {
                    let newEquip = ObjectUtils.depthClone(dropEquipDS.equip);
                    this.hitReward.equips.push(newEquip);
                }
            }
            // clear
            battleActor.dropGold = 0;
            battleActor.dropExp = 0;
            battleActor.dropItems.length = 0;
            battleActor.dropEquips.length = 0;
        }
    }
    /**
     * 刷新参战者所在的阵营以及检查新战斗者加入
     */
    static refreshCampAndNewBattles() {
        // 记录原有阵营
        let oldPlayerBattlers = GameBattle.playerBattlers.concat();
        let oldEnemyBattlers = GameBattle.enemyBattlers.concat();
        // 战斗成员获取（中途也可能加入新的战斗者）
        GameBattle.playerBattlers.length = 0;
        GameBattle.enemyBattlers.length = 0;
        for (let i in Game.currentScene.sceneObjects) {
            let so = Game.currentScene.sceneObjects[i];
            // 我方阵营
            if (GameBattleHelper.isPlayerCamp(so)) {
                this.onBattlerAppear(so);
                GameBattle.playerBattlers.push(so);
            }
            // 敌方阵营
            else if (GameBattleHelper.isEnemyCamp(so)) {
                this.onBattlerAppear(so);
                GameBattle.enemyBattlers.push(so);
            }
        }
        // 对比，如果已改变阵营则调用改变阵营函数（已经销毁或已不是战斗者的情况则忽略）
        for (let s = 0; s < oldPlayerBattlers.length; s++) {
            let oldPlayerBattler = oldPlayerBattlers[s];
            if (oldPlayerBattler.isDisposed || !GameBattleHelper.isBattler(oldPlayerBattler)) continue;
            let oldPlayerBattlerModule = oldPlayerBattler.getModule(6) as SoModule_Battler;
            if (oldPlayerBattlerModule.battleCamp == 1) {
                this.onChangeSceneObjectCamp(oldPlayerBattler);
            }
        }
        for (let s = 0; s < oldEnemyBattlers.length; s++) {
            let oldEnemyBattler = oldEnemyBattlers[s];
            if (oldEnemyBattler.isDisposed || !GameBattleHelper.isBattler(oldEnemyBattler)) continue;
            let oldEnemyBattlerModule = oldEnemyBattler.getModule(6) as SoModule_Battler;
            if (oldEnemyBattlerModule.battleCamp == 0) {
                this.onChangeSceneObjectCamp(oldEnemyBattler);
            }
        }
    }
    //------------------------------------------------------------------------------------------------------
    // 结算奖励
    //------------------------------------------------------------------------------------------------------
    /**
     * 击杀奖励
     * @param winner 
     * @param onFin 
     */
    static calcHitReward(winner: ProjectClientSceneObject, onFin: Callback): void {
        if (RogueRunManager.active) {
            this.hitReward = { gold: 0, exp: 0, items: [], equips: [] };
            this.dropEXPFragmentCount = 0;
            onFin.runWith([false]);
            return;
        }
        if (!winner || !GameBattleHelper.isBattler(winner) || (winner.getModule(6) as SoModule_Battler).isDead) {
            onFin.runWith([false]);
            return;
        }
        let winnerModule = winner.getModule(6) as SoModule_Battler;
        let winnerActor = winnerModule.actor;
        // 非玩家拥有的角色不结算
        let winnerInPlayerActorIndex = ProjectPlayer.getPlayerActorIndexByActor(winnerActor);
        if (winnerInPlayerActorIndex < 0) {
            // 重置记录的击杀奖励
            this.hitReward = { gold: 0, exp: 0, items: [], equips: [] };
            onFin.runWith([false]);
            return;
        }
        // 是否获得了奖励
        let isGetReward = this.hitReward.exp || this.hitReward.gold || this.hitReward.items.length != 0 || this.hitReward.equips.length != 0;
        if (!isGetReward) {
            onFin.runWith([false]);
            return;
        }
        // -- 获得金币
        if (this.hitReward.gold) {
            ProjectPlayer.increaseGold(this.hitReward.gold);
        }
        // -- 获得经验值（如果有击中经验则累加一起结算）
        let increaseExpRes = ProjectPlayer.increaseExpByIndex(winnerInPlayerActorIndex, this.hitReward.exp + GameBattleData.dropEXPFragmentCount);
        GameBattleData.dropEXPFragmentCount = 0;
        GUI_HitReward.rewardBattler = winner;
        GUI_HitReward.rewardActor = winnerActor;
        GUI_HitReward.increaseExpRes = increaseExpRes;
        if (increaseExpRes && increaseExpRes.isLevelUp) {
            Game.refreshActorAttribute(winnerActor, GameBattleHelper.getLevelByActor(winnerActor));
        }
        // -- 获得道具
        for (let i = 0; i < this.hitReward.items.length; i++) {
            let itemInfo = this.hitReward.items[i];
            ProjectPlayer.changeItemNumber(itemInfo.itemID, itemInfo.num, false);
        }
        // -- 获得装备
        for (let i = 0; i < this.hitReward.equips.length; i++) {
            let newEquip = this.hitReward.equips[i];
            GameData.changeModuleDataToCopyMode(newEquip, 9);
            ProjectPlayer.addEquipByInstance(newEquip);
        }
        // -- 执行事件
        GameCommand.startCommonCommand(14038, [], Callback.New(() => {
            // 重置记录的击杀奖励
            this.hitReward = { gold: 0, exp: 0, items: [], equips: [] };
            // 完成时回调
            onFin.runWith([true]);
        }, this), winner, winner);
    }
    /**
     * 击中奖励
     * @param battler 
     * @param dropEXPFragmentCount 片段经验值
     * @param onFin 
     */
    static calcAttackReward(battler: ProjectClientSceneObject, onFin: Callback): void {
        if (!battler || !GameBattleHelper.isBattler(battler) || (battler.getModule(6) as SoModule_Battler).isDead || this.dropEXPFragmentCount <= 0) {
            onFin.run();
            return;
        }
        let battleModule = battler.getModule(6) as SoModule_Battler;
        let battleActor = battleModule.actor;
        // 非玩家拥有的角色不结算
        let battlerPlayerActorIndex = ProjectPlayer.getPlayerActorIndexByActor(battleActor);
        if (battlerPlayerActorIndex < 0) {
            // 重置记录的击杀奖励
            this.hitReward = { gold: 0, exp: 0, items: [], equips: [] };
            onFin.run();
            return;
        }
        let increaseExpRes = ProjectPlayer.increaseExpByIndex(battlerPlayerActorIndex, this.dropEXPFragmentCount);
        GUI_HitReward.rewardBattler = battler;
        GUI_HitReward.rewardActor = battleActor;
        GUI_HitReward.increaseExpRes = increaseExpRes;
        if (increaseExpRes && increaseExpRes.isLevelUp) {
            Game.refreshActorAttribute(battleActor, GameBattleHelper.getLevelByActor(battleActor));
        }
        GUI_EXPReward.getEXPEffect(battler, onFin, this.dropEXPFragmentCount);
        this.dropEXPFragmentCount = 0;
    }
    //------------------------------------------------------------------------------------------------------
    // 仇恨系统
    //------------------------------------------------------------------------------------------------------
    /**
     * 清理指定战斗者的仇恨列表
     * @param so 
     */
    static clearHateList(battler: ProjectClientSceneObject, clearAll: boolean = false): void {
        let battlerModule = battler.getModule(6) as SoModule_Battler;
        battlerModule.hateList.length = 0;
        if (clearAll) this.removeHateTargetFromAllList(battler);
    }

    /**
     * 从战斗者的仇恨列表中移除仇恨目标
     * @param so 仇恨列表的拥有者
     * @param hateTarget 仇恨目标
     */
    static removeHateTarget(battler: ProjectClientSceneObject, hateTarget: ProjectClientSceneObject): void {
        let battlerModule = battler.getModule(6) as SoModule_Battler;
        let hateIndex: number = ArrayUtils.matchAttributes(battlerModule.hateList, { targetIndex: hateTarget.index }, true, "==", true)[0];
        if (hateIndex == null) return;
        battlerModule.hateList.splice(hateIndex, 1);
    }
    /**
     * 从所有仇恨列表中清理指定对象
     * @param hateTarget 
     */
    static removeHateTargetFromAllList(hateTarget: ProjectClientSceneObject): void {
        let sceneObjects = Game.currentScene.sceneObjects;
        for (let i = 0; i < sceneObjects.length; i++) {
            let so = sceneObjects[i];
            if (!GameBattleHelper.isBattler(so)) continue;
            this.removeHateTarget(so, hateTarget);
        }
    }
    /**
     * 增加仇恨
     * @param so 仇恨列表的拥有者
     * @param hateTarget 仇恨目标
     * @param hateValue 仇恨数值
     * @param ignoreNotInHateList [可选] 默认值=false 如果当前不在仇恨列表中则不增加仇恨
     */
    static increaseHate(battler: ProjectClientSceneObject, hateTarget: ProjectClientSceneObject, hateValue: number, ignoreNotInHateList: boolean = false, refTarget: ProjectClientSceneObject = null): void {
        // 非敌对势力不允许添加到仇恨列表
        if (!GameBattleHelper.isHostileRelationship(battler, hateTarget)) return;
        // 已死亡无法增加仇恨
        let battlerModule = battler.getModule(6) as SoModule_Battler;
        if (battlerModule.isDead || battlerModule.isDead) return;
        // 如果refTarget不在仇恨列表中则不增加仇恨
        if (ignoreNotInHateList && !ArrayUtils.matchAttributes(battlerModule.hateList, { targetIndex: refTarget.index }, true)[0]) return;
        // 添加仇恨：不在列表中的话就新建一个
        let hateDS: DataStructure_battlerHate = ArrayUtils.matchAttributes(battlerModule.hateList, { targetIndex: hateTarget.index }, true)[0];
        if (hateDS) {
            hateDS.hateValue += hateValue;
        }
        else {
            if (ignoreNotInHateList) return;
            hateDS = new DataStructure_battlerHate;
            hateDS.targetIndex = hateTarget.index;
            hateDS.hateValue = hateValue;
            battlerModule.hateList.push(hateDS);
        }
        // 刷新仇恨排序
        this.hateListOrderByDESC(battler);
    }
    /**
     * 增加仇恨：根据技能预设
     * @param fromBattler 来源战斗者
     * @param targetBattler 目标战斗者
     * @param skill 技能
     * @param damageValue [可选] 默认值=0 伤害或治疗数值
     */
    static increaseHateByHit(fromBattler: ProjectClientSceneObject, targetBattler: ProjectClientSceneObject, hitFrom: Module_Skill | Module_Status, hitValue: number = 0): void {
        // 根据类型决定数值符号
        hitValue = !hitFrom || hitFrom.damageType <= 2 ? -hitValue : hitValue;
        // 伤害：直接对目标增加仇恨值
        let hateValue = !hitFrom ? Math.abs(hitValue) : (hitFrom.fixedHeteValue + Math.abs(hitValue) * hitFrom.damageHatePer / 100);
        if (hitValue < 0) {
            this.increaseHate(targetBattler, fromBattler, hateValue);
        }
        // 恢复：如果是友方的话则会增加敌方的仇恨（需要敌方已存在仇恨列表）
        else {
            if (GameBattleHelper.isFriendlyRelationship(fromBattler, targetBattler)) {
                let enemyCampBattlers: ProjectClientSceneObject[] = [];
                let allBattlers = GameBattleHelper.allBattlers;
                for (let i = 0; i < allBattlers.length; i++) {
                    let battler = allBattlers[i];
                    if (GameBattleHelper.isHostileRelationship(fromBattler, battler)) {
                        enemyCampBattlers.push(battler);
                    }
                }
                for (let i = 0; i < enemyCampBattlers.length; i++) {
                    let enemyCampBattler = enemyCampBattlers[i];
                    // -- enemyCampBattler的仇恨列表必须拥有targetBattler
                    this.increaseHate(enemyCampBattler, fromBattler, hateValue, true, targetBattler);
                    this.increaseHate(fromBattler, enemyCampBattler, 1, true, targetBattler);
                }
            }
        }
    }
    //------------------------------------------------------------------------------------------------------
    // 状态
    //------------------------------------------------------------------------------------------------------
    /**
     * 添加目标状态
     * @param targetBattler 目标战斗者
     * @param statusID 状态
     * @return [boolean] 
     */
    static addStatus(targetBattler: ProjectClientSceneObject, statusID: number, fromBattler: ProjectClientSceneObject = null, force: boolean = false): boolean {
        // 获取系统预设的该状态，如果不存在则无法添加
        let systemStatus: Module_Status = GameData.getModuleData(10, statusID);
        if (!systemStatus) return false;
        // 计算命中率
        if (!force && MathUtils.rand(100) >= systemStatus.statusHit) {
            return false;
        }
        if (fromBattler == null) fromBattler = targetBattler;
        // 如果在战斗画面则找到地图的战斗者
        if (GameUI.isOpened(36)) {
            let btScene = (GameUI.get(36) as GUI_BattleScene)
            fromBattler = btScene.getMapBattler(fromBattler);
            targetBattler = btScene.getMapBattler(targetBattler);
        }
        let targetBattlerModule = targetBattler.getModule(6) as SoModule_Battler;
        let targetBattlerActor = targetBattlerModule.actor;
        // -- 如果目标免疫该状态的话则忽略
        let targetIsImmuneThisStatus = targetBattlerActor.selfImmuneStatus.indexOf(statusID) != -1;
        if (!force && targetIsImmuneThisStatus) return false;;
        let thisStatus: Module_Status = ArrayUtils.matchAttributes(targetBattlerActor.status, { id: statusID }, true)[0];
        let firstAddStatus = false;
        if (thisStatus) {
            thisStatus.currentLayer += 1;
            if (thisStatus.currentLayer > thisStatus.maxlayer) thisStatus.currentLayer = thisStatus.maxlayer;
        }
        else {
            firstAddStatus = true;
            thisStatus = GameData.newModuleData(10, statusID);
            thisStatus.fromBattlerID = fromBattler.index;
            targetBattlerActor.status.push(thisStatus);
        }
        // -- 自动动画
        if (thisStatus.animation) targetBattler.playAnimation(thisStatus.animation, true, true);
        // -- 刷新状态的持续回合
        thisStatus.currentDuration = thisStatus.totalDuration;
        // -- 执行状态附加的事件
        if (firstAddStatus && systemStatus.eventSetting && systemStatus.whenAddEvent) CommandPage.startTriggerFragmentEvent(systemStatus.whenAddEvent, fromBattler, targetBattler);
        // -- 派发事件
        EventUtils.happen(GameBattleData, GameBattleData.EVENT_STATUS_CHANGE, [targetBattler]);
        EventUtils.happen(GameBattleData, GameBattleData.EVENT_ADD_STATUS, [fromBattler, targetBattler, statusID, thisStatus, force]);
        return true;
    }
    /**
     * 移除目标状态
     */
    static removeStatus(targetBattler: ProjectClientSceneObject, statusID: number): boolean {
        // 获取系统预设的该状态，如果不存在则无法添加
        let systemStatus: Module_Status = GameData.getModuleData(10, statusID);
        if (!systemStatus) return false;
        let targetBattlerModule = targetBattler.getModule(6) as SoModule_Battler;
        let targetBattlerActor = targetBattlerModule.actor;
        let thisStatusIdx: number = ArrayUtils.matchAttributes(targetBattlerActor.status, { id: statusID }, true, "==", true)[0];
        if (thisStatusIdx != null) {
            let removedStatus = targetBattlerActor.status.splice(thisStatusIdx, 1)[0];
            if (systemStatus.eventSetting && systemStatus.whenRemoveEvent) CommandPage.startTriggerFragmentEvent(systemStatus.whenRemoveEvent, targetBattler, targetBattler);
            // 解除动画
            if (systemStatus.animation) {
                // 如果该动画在其他状态下不存在则直接清除
                if (ArrayUtils.matchAttributes(targetBattlerActor.status, { animation: systemStatus.animation }, true, "==", true).length == 0) {
                    targetBattler.stopAnimation(systemStatus.animation);
                }
            }
            // -- 派发事件
            EventUtils.happen(GameBattleData, GameBattleData.EVENT_STATUS_CHANGE, [targetBattler]);
            EventUtils.happen(GameBattleData, GameBattleData.EVENT_REMOVE_STATUS, [targetBattler, statusID, removedStatus]);
            return true;
        }
        return false;
    }
    /**
     * 解除全部状态
     * @param battler 战斗者 
     * @param excludeSelfStatus[可选] 默认值=false 排除自动状态
     */
    static removeAllStatus(battler: ProjectClientSceneObject, excludeSelfStatus: boolean = false): void {
        // 动画效果解除
        let battlerModule = battler.getModule(6) as SoModule_Battler;
        let statusArr = battlerModule.actor.status.concat();
        for (let i = 0; i < statusArr.length; i++) {
            let status = statusArr[i];
            if (excludeSelfStatus && battlerModule.actor.selfStatus.indexOf(status.id) != -1) {
                continue;
            }
            let removeSuccess = this.removeStatus(battler, status.id);
            if (removeSuccess) i--;
        }
        // 派发事件
        EventUtils.happen(GameBattleData, GameBattleData.EVENT_STATUS_CHANGE, [battler]);
    }
    /**
     * 解除所有战斗者中来源是指定某个战斗者的状态
     * @param fromBattler 来源战斗者
     */
    static removeAllBattlerStatusByFromBattler(fromBattler: ProjectClientSceneObject): void {
        for (let i = 0; i < Game.currentScene.sceneObjects.length; i++) {
            let so = Game.currentScene.sceneObjects[i];
            if (GameBattleHelper.isBattler(so)) {
                let soBattlerModule = so.getModule(6) as SoModule_Battler;
                let statusArr = soBattlerModule.actor.status;
                for (let s = 0; s < statusArr.length; s++) {
                    let status = statusArr[s];
                    if (status.fromBattlerID == fromBattler.index) {
                        if (this.removeStatus(so, status.id)) {
                            s--;
                        }
                    }
                }
            }
        }
    }
    //------------------------------------------------------------------------------------------------------
    // 战斗计算
    //------------------------------------------------------------------------------------------------------
    /**
     * 计算是否命中
     * @param actionType 0-普通攻击 1-使用技能 2-使用道具 3-状态 
     * @param fromBattler 来源战斗者
     * @param targetBattler 目标战斗者
     * @param skill [可选] 默认值=null 使用的技能
     * @return [boolean] 
     */
    static getHitResult(actionType: number, fromBattler: ProjectClientSceneObject, targetBattler: ProjectClientSceneObject, skill: Module_Skill = null): boolean {
        // 获取战斗者的角色数据
        let fromBattlerModule = fromBattler.getModule(6) as SoModule_Battler;
        let targetBattlerModule = targetBattler.getModule(6) as SoModule_Battler;
        let fromActor = fromBattlerModule.actor;
        let targetActor = targetBattlerModule.actor;
        let isHitSuccess = true;
        // 攻击和技能
        if (actionType <= 1) {
            let hitType: number;
            let dodType: number;
            if (actionType == 0 && (fromActor.atkMode == 0 || !fromActor.atkSkill)) {
                hitType = 1;
                dodType = 1;
            }
            else if (actionType == 0 && fromActor.atkMode == 1 && fromActor.atkSkill) {
                skill = fromActor.atkSkill;
                hitType = fromActor.atkSkill.hitType;
                dodType = fromActor.atkSkill.dodType;
            }
            else if (skill) {
                hitType = skill.hitType;
                dodType = skill.dodType;
            }
            let fromHit: number, targetDod: number;
            if (hitType == 0 && skill) fromHit = skill.hit;
            else fromHit = fromActor.HIT;
            if (dodType == 0) targetDod = 0;
            else targetDod = targetActor.DOD;
            isHitSuccess = MathUtils.rand(100) < (fromHit - targetDod - RogueSkillSynergySystem.getDodgeBonus(targetBattler));
        }
        // 使用道具：100%
        else if (actionType == 2) {
            isHitSuccess = true;
        }
        return isHitSuccess;
    }
    /**
     * 计算击中结果
     * -- 状态变更
     * -- 计算伤害
     * -- 计算仇恨
     * -- 死亡判定
     * @param fromBattler 
     * @param targetBattler 
     * @param isHitSuccess 
     * @param actionType 0-普通攻击 1-使用技能 2-使用道具 3-状态
     * @param skill [可选] 默认值=null 
     * @param item [可选] 默认值=null 
     * @param status [可选] 默认值=null
     * @param damagePer [可选] 默认值=null 伤害比例 100 = 100% null=无
     * @return  damageType=伤害类别（-2-无 -1-Miss 0-物理伤害 1-魔法伤害 2-真实伤害 3-恢复生命值 4-恢复魔法值） damage=伤害 isCrit=是否暴击
    */
    static calculationHitResult(fromBattler: ProjectClientSceneObject, targetBattler: ProjectClientSceneObject, isHitSuccess: boolean, actionType: number,
        skill: Module_Skill = null, item: Module_Item = null, status: Module_Status = null, damagePer = null,
        bsFromBattler: ProjectClientSceneObject = null, bsTargetBattler: ProjectClientSceneObject = null): {
            damageType: number,
            damage: number,
            isCrit: boolean
        } {
        // 派发事件
        EventUtils.happen(GameBattleData, GameBattleData.EVENT_CALC_HIT_RESULT_START, [fromBattler, targetBattler, isHitSuccess, actionType, skill, item, status]);
        if (!bsFromBattler) bsFromBattler = fromBattler;
        if (!bsTargetBattler) bsTargetBattler = targetBattler;
        // 返回值
        let res: {
            damageType: number,
            damage: number,
            isCrit: boolean
        };
        // 来源和目标的角色数据
        let fromBattlerModule = fromBattler.getModule(6) as SoModule_Battler;
        let targetBattlerModule = targetBattler.getModule(6) as SoModule_Battler;
        let fromActor = fromBattlerModule.actor;
        let targetBattlerActor = targetBattlerModule.actor;
        // 添加的状态组
        let addTargetBattlerStatusArr: number[] = [];
        let addFromBattlerStatusArr: number[] = [];
        let removeTargetBattlerStatusArr: number[] = [];
        // 记录目标原有的状态
        let targetOriStatus = targetBattlerActor.status.concat();
        // 作用类别和相关数值 
        let damageType = -2; // -2-无 -1-MISS 0-物理伤害 1-魔法伤害 2-真实伤害 3-恢复生命值 4-恢复魔法值
        let hpChangeValue = 0;
        let spChangeValue = 0;
        let useHate = false;
        // 击中后移除状态（造成伤害才允许移除）
        let hitRemoveStatus = false;
        // 计算暴击率
        let critPer: number;
        let magCritPer: number;
        let isCrit: boolean;
        let isMagCrit: boolean;
        // 优先计算状态和刷新属性（如技能带有降低对方属性的状态，即当前立刻以降低后的属性来计算伤害）
        if (isHitSuccess) {
            let rogueCritBonus = RogueSkillSynergySystem.getCritBonus(fromBattler, targetBattler, actionType, skill);
            isCrit = MathUtils.rand(100) < fromActor.CRIT + rogueCritBonus ? true : false;
            isMagCrit = MathUtils.rand(100) < fromActor.MagCrit + rogueCritBonus ? true : false;
            critPer = isCrit ? 2 : 1;
            magCritPer = isMagCrit ? 2 : 1;

            // 普通攻击
            if (actionType == 0) {
                // 击中目标后自身附加的状态
                addFromBattlerStatusArr = addFromBattlerStatusArr.concat(fromActor.hitTargetSelfAddStatus);
                // 击中目标后目标附加的状态
                addTargetBattlerStatusArr = addTargetBattlerStatusArr.concat(fromActor.hitTargetStatus);
            }
            // 使用技能
            else if (actionType == 1) {
                if (skill.statusSetting) {
                    // -- 添加的状态
                    addTargetBattlerStatusArr = addTargetBattlerStatusArr.concat(skill.addStatus);
                    // -- 减少的状态
                    removeTargetBattlerStatusArr = removeTargetBattlerStatusArr.concat(skill.removeStatus);
                }
            }
            // 使用道具
            else if (actionType == 2) {
                // -- 添加的状态
                addTargetBattlerStatusArr = addTargetBattlerStatusArr.concat(item.addStatus);
                // -- 减少的状态
                removeTargetBattlerStatusArr = removeTargetBattlerStatusArr.concat(item.removeStatus);
            }
            // 添加目标状态
            for (let i = 0; i < addTargetBattlerStatusArr.length; i++) {
                let addStatusID = addTargetBattlerStatusArr[i];
                GameBattleData.addStatus(targetBattler, addStatusID, fromBattler);
            }
            // 移除目标状态
            for (let i = 0; i < removeTargetBattlerStatusArr.length; i++) {
                let removeStatusID = removeTargetBattlerStatusArr[i];
                GameBattleData.removeStatus(targetBattler, removeStatusID);
            }
            // 添加来源的状态
            for (let i = 0; i < addFromBattlerStatusArr.length; i++) {
                let addStatusID = addFromBattlerStatusArr[i];
                GameBattleData.addStatus(fromBattler, addStatusID, fromBattler);
            }
            // 如果目标更新了状态的话则刷新目标属性
            if (addTargetBattlerStatusArr.length > 0 || removeTargetBattlerStatusArr.length > 0) {
                let level = GameBattleHelper.getLevelByActor(targetBattlerActor);
                Game.refreshActorAttribute(targetBattlerActor, level)
            }
            // 如果来源者更新了状态的话刷新来源的属性
            if (addFromBattlerStatusArr.length > 0) {
                let level = GameBattleHelper.getLevelByActor(targetBattlerActor);
                Game.refreshActorAttribute(targetBattlerActor, level)
            }
        }
        // -- MISS
        if (!isHitSuccess) {
            damageType = -1;
            res = { damageType: -1, damage: hpChangeValue, isCrit: false };
        }
        // -- 普通攻击：(攻击者命中率 - 目标躲避率)%
        else if (actionType == 0) {
            damageType = 0;
            hpChangeValue = -Math.max(1, fromActor.ATK - targetBattlerActor.DEF) * critPer;
            res = { damageType: 0, damage: hpChangeValue, isCrit: isCrit };
            hitRemoveStatus = true;
            useHate = true;
        }
        // -- 使用技能：
        else if (actionType == 1) {
            let skillDamage = 0;
            // 使用伤害
            if (skill.useDamage) {
                let damageShowCrit: boolean = false;
                damageType = skill.damageType;
                // -- 技能固定伤害
                skillDamage = skill.damageValue;
                // -- 技能伤害加成
                if (skill.useAddition) {
                    let actorAttributeValue = skill.additionMultipleType == 0 ? fromActor.ATK : fromActor.MAG;
                    let addDamageValue = skill.additionMultiple / 100 * actorAttributeValue;
                    skillDamage += addDamageValue;
                }
                // -- 物理伤害
                if (damageType == 0) {
                    let targetDef = targetBattlerActor.DEF;
                    if (actionType == 1 && skill && skill.id == 65 && GameBattleHelper.isIncludeStatus(targetBattler, RogueSkillSynergySystem.STATUS_CORROSION)) targetDef *= 0.8;
                    hpChangeValue = -Math.max(1, skillDamage - targetDef) * critPer;
                    hitRemoveStatus = true;
                    damageShowCrit = isCrit;
                }
                // -- 魔法伤害
                else if (damageType == 1) {
                    hpChangeValue = -Math.max(1, skillDamage - targetBattlerActor.MagDef) * magCritPer;
                    // -- 元素有效度加成
                    hpChangeValue *= GameBattleHelper.getElementEffectivenessPer(targetBattler, skill.elementType) * 0.01;
                    hitRemoveStatus = true;
                    damageShowCrit = isMagCrit;
                }
                // -- 真实伤害
                else if (damageType == 2) {
                    hpChangeValue = -Math.max(1, skillDamage);
                    hitRemoveStatus = true;
                }
                // -- 恢复生命值
                else if (damageType == 3) {
                    hpChangeValue = Math.max(0, skillDamage) * magCritPer;
                    damageShowCrit = isMagCrit;
                }
                // -- 恢复魔法值
                else if (damageType == 4) {
                    spChangeValue = Math.max(0, skillDamage) * magCritPer;
                    damageShowCrit = isMagCrit;
                }
                // -- 显示伤害 
                if (hpChangeValue != 0) {
                    res = { damageType: damageType, damage: hpChangeValue, isCrit: damageShowCrit };
                }
                else if (spChangeValue != 0) {
                    res = { damageType: damageType, damage: spChangeValue, isCrit: damageShowCrit };
                }
            }
            // 造成来源技能的仇恨
            if (skill.useHate) {
                useHate = true;
            }
        }
        // -- 使用道具
        else if (actionType == 2) {
            if (item.recoveryHP) {
                damageType = 3;
                hpChangeValue = item.recoveryHP;
                res = { damageType: damageType, damage: hpChangeValue, isCrit: false };
            }
            if (item.recoverySP) {
                spChangeValue = item.recoverySP;
                if (damageType != 3) {
                    damageType = 4;
                    res = { damageType: damageType, damage: spChangeValue, isCrit: false };
                }
            }
        }
        // -- 状态:DOT/HOT
        else if (actionType == 3) {
            // 使用伤害
            damageType = status.damageType;
            let damageShowCrit: boolean = false;
            // -- 技能固定伤害
            let statusDamage = status.damageValue;
            // -- 技能伤害加成
            if (status.useAddition) {
                let actorAttributeValue = status.additionMultipleType == 0 ? fromActor.ATK : fromActor.MAG;
                let addDamageValue = status.additionMultiple / 100 * actorAttributeValue;
                statusDamage += addDamageValue;
            }
            // 状态叠加层
            statusDamage *= status.currentLayer;
            // -- 物理伤害
            if (damageType == 0) {
                hpChangeValue = -Math.max(1, statusDamage - targetBattlerActor.DEF);
                hitRemoveStatus = true;
                damageShowCrit = isCrit;
            }
            // -- 魔法伤害
            else if (damageType == 1) {
                hpChangeValue = -Math.max(1, statusDamage - targetBattlerActor.MagDef);
                // -- 元素有效度加成
                hpChangeValue *= GameBattleHelper.getElementEffectivenessPer(targetBattler, status.elementType) * 0.01;
                hitRemoveStatus = true;
                damageShowCrit = isMagCrit;
            }
            // -- 真实伤害
            else if (damageType == 2) {
                hpChangeValue = -Math.max(1, statusDamage);
                hitRemoveStatus = true;
            }
            // -- 恢复生命值
            else if (damageType == 3) {
                hpChangeValue = Math.max(0, statusDamage) * magCritPer;
                damageShowCrit = isMagCrit;
            }
            // -- 恢复魔法值
            else if (damageType == 4) {
                spChangeValue = Math.max(0, statusDamage) * magCritPer;
                damageShowCrit = isMagCrit;
            }
            // -- 显示伤害
            if (hpChangeValue != 0) {
                res = { damageType: damageType, damage: hpChangeValue, isCrit: damageShowCrit };
            }
            else if (spChangeValue != 0) {
                res = { damageType: damageType, damage: spChangeValue, isCrit: damageShowCrit };
            }
            // 造成来源状态的仇恨
            useHate = true;
        }
        // 停止受伤动画
        if (WorldData.hurtAni) targetBattler.stopAnimation(WorldData.hurtAni);
        // 恢复待机动作
        if (!targetBattlerModule.isDead && targetBattlerModule.actor.hp != 0) targetBattler.avatar.actionID = 1;
        // 伤害加成
        if (damageType <= 2) {
            if (GameBattleHelper.isHostileRelationship(fromBattler, targetBattler) && res && res.damage < 0) {
                let fromBattlerDamagePer = GameBattleHelper.getDamagePer(fromBattler);
                let targetBattlerStrikePer = GameBattleHelper.getStrikePer(targetBattler);
                res.damage = hpChangeValue = hpChangeValue * fromBattlerDamagePer * 0.01 * targetBattlerStrikePer * 0.01;
            }
            // 叠加比例
            if (damagePer != null && res) {
                res.damage = hpChangeValue = hpChangeValue * damagePer * 0.01;
            }
        }
        // 背后攻击伤害比例
        if (actionType <= 1) {
            if (GameBattleHelper.atBackward(fromBattler, targetBattler)) {
                if (res) {
                    res.damage *= WorldData.BackwardAttackDamagePer * 0.01;
                    hpChangeValue *= WorldData.BackwardAttackDamagePer * 0.01;
                }
            }
        }
        // 萧酉歌的基础输出整体提高 1.5 倍（仅限玩家方角色本体的普攻和主动技能）。
        // 放在防御、背击之后，保证普通攻击与技能都按最终实际伤害统一放大，
        // 且不会意外放大她的召唤物或持续伤害。
        if (actionType <= 1 && fromBattlerModule.battleCamp === 0 && fromActor.id === 8 && res && res.damage < 0) {
            res.damage = hpChangeValue = hpChangeValue * 1.5;
        }
        // 最小伤害值
        if (damageType >= 0 && damageType <= 2 && res && res.damage < 0) {
            let rogueDamageMultiplier = RogueSkillSynergySystem.getDamageMultiplier(fromBattler, skill, targetBattler, actionType);
            res.damage = hpChangeValue = hpChangeValue * rogueDamageMultiplier;
        }
        if (damageType >= 0 && damageType <= 2 && res && Math.abs(res.damage) < 1) {
            res.damage = hpChangeValue = -1;
        }
        if (res && res.damage != null) res.damage = Math.trunc(res.damage);
        // 使用自定义伤害计算逻辑
        if (WorldData.useCustomDamageLogic) {
            if (isHitSuccess) {
                let lastHP = targetBattlerActor.hp;
                hitRemoveStatus = false;
                CustomGameNumber.customDamageLogic_actionType = actionType;
                CustomGameNumber.customDamageLogic_skill = skill;
                CustomGameNumber.customDamageLogic_item = item;
                CustomGameNumber.customDamageLogic_status = status;
                CommandPage.startTriggerFragmentEvent(WorldData.customDamageLogicEvent, bsFromBattler, bsTargetBattler);
                if (lastHP > targetBattlerActor.hp) hitRemoveStatus = true;
            }
        }
        else {
            // 更改生命值和魔法值
            hpChangeValue = Math.trunc(hpChangeValue);
            spChangeValue = Math.trunc(spChangeValue);
            hpChangeValue = RogueSkillSynergySystem.absorbDamage(targetBattler, hpChangeValue, false);
            hpChangeValue = RogueSkillSynergySystem.preventLethalDamage(targetBattler, hpChangeValue);
            if (res && res.damageType >= 0 && res.damageType <= 2) res.damage = hpChangeValue;
            if (hpChangeValue != 0) targetBattlerActor.hp += hpChangeValue;
            if (spChangeValue != 0) targetBattlerActor.sp += spChangeValue;
        }
        // 修正生命值和魔法值范围
        targetBattlerActor.hp = Math.max(Math.min(targetBattlerActor.hp, targetBattlerActor.MaxHP), 0);
        targetBattlerActor.sp = Math.max(Math.min(targetBattlerActor.sp, targetBattlerActor.MaxSP), 0);
        // 仇恨值计算
        if (useHate && res && res.damage != null) {
            let hateValue = -res.damage;
            if (hateValue != 0) {
                let hitFrom = actionType == 0 ? null : actionType == 1 ? skill : status;
                GameBattleData.increaseHateByHit(fromBattler, targetBattler, hitFrom, hateValue);
            }
        }
        // 计算受伤害解除的状态
        if (hitRemoveStatus) {
            // 受伤解除状态
            let hitRemoveStatusSuccess = false;
            if ((actionType == 0 || actionType == 1 || actionType == 3) && damageType <= 2) {
                for (let i = 0; i < targetOriStatus.length; i++) {
                    let needRemoveStatus = targetOriStatus[i];
                    if (needRemoveStatus.removeWhenInjured && MathUtils.rand(100) < needRemoveStatus.removePer) {
                        if (GameBattleData.removeStatus(targetBattler, needRemoveStatus.id)) hitRemoveStatusSuccess = true;
                    }
                }
                if (hitRemoveStatusSuccess) {
                    let level = GameBattleHelper.getLevelByActor(targetBattlerActor);
                    Game.refreshActorAttribute(targetBattlerActor, level);
                }
            }
        }
        // 派发事件
        EventUtils.happen(GameBattleData, GameBattleData.EVENT_CALC_HIT_RESULT_OVER, [fromBattler, targetBattler, res?.damageType, res?.damage, res?.isCrit]);
        return res;
    }
    /**
     * 更改战斗者生命值
     * @param battle 
     * @param changeValue 
     */
    static changeBattlerHP(battle: ProjectClientSceneObject, changeValue: number): void {
        let battlerModule = battle.getModule(6) as SoModule_Battler;
        battlerModule.actor.hp += changeValue;
        battlerModule.actor.hp = Math.max(Math.min(battlerModule.actor.hp, battlerModule.actor.MaxHP), 0);
    }
    /**
     * 更改战斗者魔法值
     * @param battle 
     * @param changeValue 
     */
    static changeBattlerSP(battle: ProjectClientSceneObject, changeValue: number): void {
        let battlerModule = battle.getModule(6) as SoModule_Battler;
        battlerModule.actor.sp += changeValue;
        battlerModule.actor.sp = Math.max(Math.min(battlerModule.actor.sp, battlerModule.actor.MaxSP), 0);
    }
    //------------------------------------------------------------------------------------------------------
    // 内部实现
    //------------------------------------------------------------------------------------------------------
    /**
     * 如果是玩家的战斗者角色则绑定玩家的角色
     * @param battler 指定的战斗者
     * @return 是否绑定成功
     */
    private static ifPlayerActorBindingPlayerActorData(battler: ProjectClientSceneObject): boolean {
        // 如果战斗者使用玩家的角色数据
        let battlerModule = battler.getModule(6) as SoModule_Battler;
        if (battlerModule.battleCamp == 0 && battlerModule.usePlayerActors) {
            // 如果已经绑定则忽略
            let inPlayerActorIndex = ProjectPlayer.getPlayerActorIndexByActor(battlerModule.actor);
            if (inPlayerActorIndex != -1 && GameBattle.usedPlayerActorRecord.get(battlerModule.actor) == battler) return true;
            // 是否绑定玩家角色
            let isBindingPlayerActor = false;
            // -- 遍历玩家队伍的角色
            for (let s = 0; s < Game.player.data.party.length; s++) {
                // -- 获取该玩家角色
                let playerActor = Game.player.data.party[s].actor;
                // -- 查询该角色已经被其他场景对象占用的话则忽略
                if (GameBattle.usedPlayerActorRecord.get(playerActor)) continue;
                // -- 如果角色编号一致的话
                if (playerActor.id == battlerModule.actor.id) {
                    // -- 记录
                    GameBattle.usedPlayerActorRecord.set(playerActor, battler);
                    battlerModule.actor = playerActor;
                    isBindingPlayerActor = true;
                    return true;
                }
            }
            // 找不到匹配的玩家角色时，该战斗者无需存在
            battler.dispose();
        }
        return false;
    }
    /**
     * 当场景对象的状态页更改前
     * @param so 
     */
    private static onChangeSceneObjectStatus(so: ProjectClientSceneObject): void {
        // 如果是战斗者的话则调用移除
        if (GameBattleHelper.isBattler(so)) {
            this.onBattlerRemoved(so);
        }
    }
    /**
     * 当更改阵营时
     * @param soe 
     */
    private static onChangeSceneObjectCamp(soe: ProjectClientSceneObject) {
        // -- 清理仇恨
        this.clearHateList(soe, true);
        // -- 执行战斗者出现事件
        GameCommand.startCommonCommand(14039, [], null, soe, soe);
    }
    /**
     * 仇恨排序-按照仇恨值从大到小降序
     * @param battler 仇恨列表的拥有者
     */
    private static hateListOrderByDESC(battler: ProjectClientSceneObject) {
        let battlerModule = battler.getModule(6) as SoModule_Battler;
        battlerModule.hateList.sort((a: DataStructure_battlerHate, b: DataStructure_battlerHate): number => {
            return a.hateValue < b.hateValue ? 1 : -1;
        });
    }
    /**
     * 战斗角色待机效果
     * @param so 
     */
    private static clearBattlerStandbyEffect(battler: ProjectClientSceneObject): void {
        let battlerModule = battler.getModule(6) as SoModule_Battler;
        // 如果当前回合行动完毕的话
        if (battlerModule.operationComplete) {
            // 执行片段事件：战斗者结束待机时事件
            GameCommand.startCommonCommand(14041, [], null, battler, battler);
        }
    }
    /**
     * 调用战斗者初始化片段事件
     * @param battler 战斗者
     */
    private static callBattlerInitFragmentEvent(battler: ProjectClientSceneObject): void {
        let battlerModule = battler.getModule(6) as SoModule_Battler;
        if (!battlerModule.isExecuteAppearEvent && !battlerModule.isDead) {
            battlerModule.isExecuteAppearEvent = true;
            GameCommand.startCommonCommand(14039, [], null, battler, battler);
        }
    }
}
