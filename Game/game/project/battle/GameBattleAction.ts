/**
 * 战斗行为
 * Created by 黑暗之神KDS on 2021-01-16 02:10:21.
 */
class GameBattleAction {
    //------------------------------------------------------------------------------------------------------
    // 事件
    //------------------------------------------------------------------------------------------------------
    /**
     * 事件：当一次行为结束时派发的事件 onOnceActionComplete();
     */
    static EVENT_ONCE_ACTION_COMPLETE: string = "GameBattleActionEVENT_AFTER_ONCE_ACTION";
    /**
     * 事件：当发起普通攻击时 onActionAttack(fromBattler:ProjectClientSceneObject, targetBattler:ProjectClientSceneObject);
     */
    static EVENT_ACTION_ATTACK: string = "GameBattleActionEVENT_ACTION_ATTACK";
    /**
     * 事件：当使用技能时 onActionUseSkill(fromBattler: ProjectClientSceneObject, skill: Module_Skill, gridPos: Point, targets: ProjectClientSceneObject[], firstUse: boolean)
     */
    static EVENT_ACTION_USE_SKILL: string = "GameBattleActionEVENT_ACTION_USE_SKILL";
    /**
     * 事件：当释放技能时 onReleaseSkill(fromBattler: ProjectClientSceneObject, skill: Module_Skill, gridPos: Point, targets: ProjectClientSceneObject[], firstUse: boolean)
     */
    static EVENT_ACTION_RELEASE_SKILL: string = "GameBattleActionEVENT_ACTION_RELEASE_SKILL";
    /**
     * 事件：当释放技能开始时 onReleaseBulletStart(fromBattler: ProjectClientSceneObject, skill: Module_Skill, gridPos: Point, targetBattler: ProjectClientSceneObject, targets: ProjectClientSceneObject[])
     */
    static EVENT_ACTION_RELEASE_BULLET_START: string = "GameBattleActionEVENT_ACTION_RELEASE_BULLET_START";
    /**
     * 事件：当释放技能结束时 onReleaseBulletOver(fromBattler: ProjectClientSceneObject, skill: Module_Skill, gridPos: Point, targetBattler: ProjectClientSceneObject, targets: ProjectClientSceneObject[])
     */
    static EVENT_ACTION_RELEASE_BULLET_OVER: string = "GameBattleActionEVENT_ACTION_RELEASE_BULLET_OVER";
    /**
     * 事件：当击中地面时 onActionHitGround(fromBattler: ProjectClientSceneObject, skill: Module_Skill, gridPos: Point, targets: ProjectClientSceneObject[])
     */
    static EVENT_ACTION_HIT_GROUND: string = "GameBattleActionEVENT_ACTION_HIT_GROUND";
    /**
     * 事件：当使用道具时 onActionUseItem(fromBattler: ProjectClientSceneObject, toBattler: ProjectClientSceneObject, item: Module_Item)
     */
    static EVENT_ACTION_USE_ITEM: string = "GameBattleActionEVENT_ACTION_USE_ITEM";
    /**
     * 事件：当结算状态时 onActionCaleStatus();
     */
    static EVENT_ACTION_CALE_STATUS: string = "GameBattleActionEVENT_ACTION_CALE_STATUS";
    /**
     * 事件：当击中目标时 onActionHitTarget(fromBattler: ProjectClientSceneObject, targetBattler: ProjectClientSceneObject, actionType: number, skill: Module_Skill, item: Module_Item, status: Module_Status)
     */
    static EVENT_ACTION_HIT_TARGET: string = "GameBattleActionEVENT_ACTION_HIT_TARGET";
    //------------------------------------------------------------------------------------------------------
    // 变量
    //------------------------------------------------------------------------------------------------------
    /**
     * 战斗者作用范围格子数据
     */
    static battlerEffectIndicatorGridArr: Point[];
    /**
     * 战斗者释放范围格子数据（相对于0,0点）
     */
    static battlerRelaseIndicatorGridArr: Point[];
    /**
     * 当前行为的战斗者
     */
    static fromBattler: ProjectClientSceneObject;
    /**
     * 当前行为的战斗者使用的技能
     */
    static fromBattlerSkill: Module_Skill;
    /**
     * 当前行为的战斗者施放的地点
     */
    static fromBattlerSkillGridPos: Point;
    /**
     * 当前行为的战斗者使用的道具
     */
    static fromBattlerItem: Module_Item;
    /**
     * 当前目标（如有）
     */
    static targetBattler: ProjectClientSceneObject;
    /**
     * 当前的行为  0-普通攻击 1-使用技能 2-使用道具
     */
    static currentActionType: number;
    /**
     * 战斗者作用范围格子集
     */
    private static battlerEffectGridAniArr: GCAnimation[] = [];
    /**
     * 战斗者作用范围格子-额外集合（如显示可能的攻击范围）
     */
    private static battlerEffectExtGridAniArr: GCAnimation[] = [];
    /**
     * 战斗者释放范围格子集
     */
    private static battlerEffectReleaseGridAniArr: GCAnimation[] = [];
    /**
     * 开启释放范围
     */
    private static _openReleaseGridCursor: boolean;
    /**
     * 当前作用目标数
     */
    private static currentHitTarget: number;
    /**
     * 作用目标的总数
     */
    private static totalHitTarget: number;
    /**
     * 当前作用次数
     */
    private static currentHitTimes: number;
    /**
     * 作用次数
     */
    private static totalHitTimes: number;
    /**
     * 显示目标窗口
     */
    private static showTargetBattleBriefWindow = false;
    /**
     * 逆转的战斗者（记录反击/反伤者，以便结算其可能获得的经验值）
     */
    static reverseBattler: ProjectClientSceneObject;
    /**
     * 特殊效果：反击
     */
    static seCounterattack: boolean;
    static seCounterattackDamagePer: number;
    //------------------------------------------------------------------------------------------------------
    // 初始化
    //------------------------------------------------------------------------------------------------------
    /**
     * 初始化
     */
    static init(): void {

    }
    /**
     * 开始
     */
    static start(): void {

    }
    /**
     * 结束
     */
    static stop(): void {
        this.reverseBattler = null;
        EventUtils.clear(GameBattleAction, GameBattleAction.EVENT_ONCE_ACTION_COMPLETE);
    }
    //------------------------------------------------------------------------------------------------------
    // 镜头和光标
    //------------------------------------------------------------------------------------------------------
    /**
     * 镜头锁定战斗者
     * @param battler 战斗者
     * @return useTweenTime=是否需要使用镜头缓动镜头时间 cameraLockChange=是否需要锁定光标的镜头
     */
    static cameraMoveToBattler(battler: ProjectClientSceneObject): { useTweenTime: boolean; cameraLockChange: boolean; } {
        // 是否使用缓动镜头效果：镜头锁定光标时，光标位置不在该战斗者上或镜头未能锁定光标时
        let cursor = GameBattleHelper.cursor;
        // 获取当前镜头位置
        let cameraPos = Game.currentScene.camera.sceneObject ? new Point(Game.currentScene.camera.sceneObject.x, Game.currentScene.camera.sceneObject.y) : new Point(Game.currentScene.camera.viewPort.x, Game.currentScene.camera.viewPort.y);
        // 是否需要使用镜头缓动镜头时间
        let useTweenTime = cameraPos.x != battler.x || cameraPos.y != battler.y;
        // 是否需要锁定光标的镜头
        let cameraLockChange = Game.currentScene.camera.sceneObject != cursor;
        // 只要需要镜头缓动时间的的，则先让镜头停止在当前，并移动光标
        if (useTweenTime) {
            Game.currentScene.camera.sceneObject = null;
            cursor.setTo(battler.x, battler.y);
        }
        // 如果需要锁定镜头为光标的话或需要缓动时间移动镜头的话则
        if (useTweenTime || cameraLockChange) GameFunction.cameraMove(1, 0, 0, cursor.index, true, useTweenTime ? WorldData.cameraTweenFrame : 1);
        return { useTweenTime: useTweenTime, cameraLockChange: cameraLockChange };
    }
    /**
     * 光标移动至指定位置上
     * @param x 相对于场景的像素坐标X
     * @param y 相对于场景的像素坐标Y
     * @param onFin 
     */
    static cursorMoveTo(x: number, y: number, onFin: Function): void {
        let pos = GameBattleHelper.cursor.pos;
        if (x == pos.x && y == pos.y) {
            onFin.apply(this);
        }
        else {
            // 使用四方向计算寻路
            let realLineArr = AstarUtils.moveTo(pos.x, pos.y, x, y, Game.currentScene.gridWidth, Game.currentScene.gridHeight, Game.currentScene, true, true, true);
            GameBattleHelper.cursor.once(ProjectClientSceneObject.MOVE_OVER, this, onFin);
            GameBattleHelper.cursor.startMove(realLineArr, 0);
        }
    }
    /**
     * 光标移动至指定位置上-格子坐标版本
     * @param grid 相对于场景的格子坐标
     * @param onFin 完成时回调
     */
    static cursorMoveToGridPoint(grid: Point, onFin: Function): void {
        let castPoint = GameUtils.getGridCenterByGrid(grid);
        this.cursorMoveTo(castPoint.x, castPoint.y, onFin);
    }
    /**
     * 光标跳跃
     * @param grid 相对于场景的格子坐标
     */
    static cursorJumpToGridPoint(grid: Point): void {
        let realPoint = GameUtils.getGridCenterByGrid(grid);
        Game.currentScene.sceneUtils.limitInside(realPoint, true);
        let cursor = GameBattleHelper.cursor;
        cursor.setTo(realPoint.x, realPoint.y);
    }
    //------------------------------------------------------------------------------------------------------
    // 界面
    //------------------------------------------------------------------------------------------------------
    /**
     * 显示当前战斗者的界面
     * @param battler 当前战斗者 
     */
    static showCurrentBattlerWindow(battler: ProjectClientSceneObject): void {
        GameCommand.startCommonCommand(15027, [], null, battler, battler);
    }
    /**
     * 显示目标战斗者的界面
     * @param battler 目标战斗者
     */
    static showTargetBattlerWindow(battler: ProjectClientSceneObject): void {
        GameCommand.startCommonCommand(15030, [], null, battler, battler);
    }
    /**
     * 关闭当前战斗者的界面
     */
    static closeCurrentBattlerWindow(): void {
        GameCommand.startCommonCommand(15028, [], null, GameBattleHelper.cursor, GameBattleHelper.cursor);
    }
    /**
     * 关闭目标战斗者的界面
     */
    static closeTargetBattlerWindow(): void {
        GameCommand.startCommonCommand(15031, [], null, GameBattleHelper.cursor, GameBattleHelper.cursor);
    }
    //------------------------------------------------------------------------------------------------------
    // 战斗者：行为
    //------------------------------------------------------------------------------------------------------
    /**
     * 开始移动
     * @param battler 战斗者
     * @param toGridX 格子坐标X
     * @param toGridY 格子坐标Y
     * @param onComplete [可选] 默认值=null 当移动完成时回调
     * @param cameraLockBattler [可选] 默认值=true 镜头是否锁定战斗者
     * 
     */
    static startMove(battler: ProjectClientSceneObject, toGridX: number, toGridY: number, onComplete: Callback = null, cameraLockBattler: boolean = true) {
        // 快速播放演出时移动加速
        let battlerModule = battler.getModule(6) as SoModule_Battler;
        // 保存调用方指定的最终格子；实际寻路会改写 toGridX/toGridY 为相对坐标。
        let destinationGrid = new Point(toGridX, toGridY);
        if (GameBattle.fastPlayMode && battlerModule.battleCamp == 1) {
            battler["__recordMoveSpeed"] = battler.moveSpeed;
            battler.moveSpeed = 800;
        }
        // 记录当前行为的战斗者
        this.fromBattler = battler;
        // 关闭移动指示器
        GameBattleAction.closeMoveIndicator();
        // 镜头锁定移动的角色
        if (cameraLockBattler) GameFunction.cameraMove(1, 0, 0, battler.index, true, WorldData.cameraTweenFrame);
        else Game.currentScene.camera.sceneObject = null;
        setFrameout(() => {
            // 指示器显示后到真正执行之间可能有其他单位移动，执行前再次禁止重叠落点。
            if (GameBattleHelper.isBattlerOccupiedGrid(destinationGrid, battler)) {
                if (battler["__recordMoveSpeed"]) {
                    battler.moveSpeed = battler["__recordMoveSpeed"];
                    battler["__recordMoveSpeed"] = null;
                }
                if (onComplete) onComplete.run();
                return;
            }
            // 获取移动范围
            let range = battlerModule.actor.MoveGrid;
            // 获取战斗者周围的range步数的地图格子数据
            let obstacleMode = GameBattleHelper.getMoveObstacleMode(battlerModule.actor, battler);
            let battlerThroughGridMap = GameBattleHelper.getDestinationThroughGridMap(battler.posGrid, range, obstacleMode, true, null, this.fromBattler);
            // 移动：优化计算，只计算以战斗者为中心range+1范围内的移动路径
            let firstGrid = battler.posGrid;
            toGridX = toGridX - firstGrid.x + range;
            toGridY = toGridY - firstGrid.y + range;
            let realLineArr = AstarUtils.routeGrid(range, range, toGridX, toGridY, range, battlerThroughGridMap.throughGridMap, new Point(firstGrid.x - range, firstGrid.y - range), true, true, true);
            let lastThrough = battler.through;
            battler.through = true;
            // 执行移动时事件
            this.execMoveEvent(battler);
            battler.startMove(realLineArr, 0, true, Callback.New(() => {
                if (battler["__recordMoveSpeed"]) {
                    battler.moveSpeed = battler["__recordMoveSpeed"];
                    battler["__recordMoveSpeed"] = null;
                }
                battler.through = lastThrough;
                onComplete.run();
            }, this));
            // 更改已移动过的标识
            battlerModule.moved = true;
        }, Math.floor(WorldData.cameraTweenFrame * 0.5));
    }
    /**
     * 普通攻击（普通攻击使用技能代替不会调用该函数）
     * 播放攻击动作，直接击中目标，无弹道效果
     * @param fromBattler 攻击者
     * @param targetBattler 目标
     * @param firstUse 首次调用
     */
    static attack(fromBattler: ProjectClientSceneObject, targetBattler: ProjectClientSceneObject, firstUse: boolean = true): void {
        if (firstUse) RogueSkillSynergySystem.beginAction(fromBattler);
        this.currentActionType = 0;
        // 记录当前行为的战斗者
        this.fromBattler = fromBattler;
        let fromBattlerModule = fromBattler.getModule(6) as SoModule_Battler;
        this.targetBattler = targetBattler;
        // 等待一次击中算作完成行为
        this.currentHitTarget = 0;
        this.totalHitTarget = 1;
        this.currentHitTimes = 0;
        this.totalHitTimes = firstUse ? GameBattleHelper.getNormalAttackTimes(this.fromBattler) : 1;
        // 关闭指示器
        GameBattleAction.closeBattleIndicator();
        // 消耗行动力
        fromBattlerModule.actioned = true;
        // 显示当前攻击者和目标的界面
        this.showTargetBattleBriefWindow = true;
        this.showCurrentBattlerWindow(fromBattler);
        this.showTargetBattlerWindow(targetBattler);
        // 未被击中的标识
        let targetBattlerModule = targetBattler.getModule(6) as SoModule_Battler;
        targetBattlerModule.hitBy = false;
        // 角色的使用攻击事件
        this.execUseAttkckEvent(fromBattler, targetBattler, () => {
            // 如果已经被击中过或死亡则跳过此次战斗行为（比如事件中制作了战斗演出等事件）
            if (targetBattlerModule.hitBy || targetBattlerModule.isDead) {
                this.actionComplete(true, true);
                return;
            }
            if (!WorldData.battleSceneEnabled) {
                GameBattleAction.releaseAction(fromBattler, 3, fromBattlerModule.actor.hitFrame, 1, () => {
                    this.execReleaseAttackEvent(fromBattler, targetBattler, () => {
                        this.hitTarget(fromBattler, targetBattler, 0);
                    });
                });
            }
        });
        // 派发事件
        EventUtils.happen(GameBattleAction, GameBattleAction.EVENT_ACTION_ATTACK, [fromBattler, targetBattler]);
    }
    /**
     * 使用技能（普通攻击使用技能代替也调用该函数）
     * @param fromBattler 技能使用者
     * @param skill 技能
     * @param gridPos 施放格子坐标点
     * @param targets [可选] 默认值=null 作用的目标集合（如没有则会动态计算）
     * @param firstUse [可选] 默认值=true 是否首次使用，否则视为连击
     */
    static useSkill(fromBattler: ProjectClientSceneObject, skill: Module_Skill, gridPos: Point, targets: ProjectClientSceneObject[] = null, firstUse: boolean = true) {
        if (firstUse && !GameBattleHelper.canUseOneSkill(fromBattler, skill)) return;
        this.currentActionType = 1;
        // 记录当前行为的战斗者
        this.fromBattler = fromBattler;
        let fromBattlerModule = fromBattler.getModule(6) as SoModule_Battler;
        this.fromBattlerSkill = skill;
        this.fromBattlerSkillGridPos = gridPos;
        // 如果不存在目标的话，获取目标
        if (!targets || targets.length == 0) {
            let targetRes = GameBattleHelper.getSkillTargetOnGrid(fromBattler, skill, gridPos);
            if (!targetRes || !targetRes.allow) {
                this.actionComplete(true, true);
                return;
            }
            targets = targetRes.targets;
        }
        RogueSkillSynergySystem.onUseSkill(fromBattler, skill, targets, firstUse);
        this.targetBattler = targets[0];
        // 显示当前攻击者和目标的界面
        this.showCurrentBattlerWindow(fromBattler);
        let onlyOneTarget: ProjectClientSceneObject = null;
        let onlyOneTargetModule: SoModule_Battler = null;
        if (targets.length == 1) {
            onlyOneTarget = targets[0];
            onlyOneTargetModule = onlyOneTarget.getModule(6) as SoModule_Battler;
            this.showTargetBattleBriefWindow = true;
            this.showTargetBattlerWindow(onlyOneTarget);
            // 未被击中的标识
            onlyOneTargetModule.hitBy = false;
        }
        else {
            this.showTargetBattleBriefWindow = false;
        }
        if (firstUse) {
            // 关闭指示器
            GameBattleAction.closeBattleIndicator();
            // 技能消耗
            fromBattlerModule.actor.sp -= skill.costSP;
            fromBattlerModule.actor.hp -= skill.costHP;
            // 技能冷却计时
            skill.currentCD = Math.max(0, skill.totalCD - RogueSkillSynergySystem.consumeCooldownReduction(fromBattler, skill));
            // 消耗行动力
            if (GameBattleHelper.consumesActionPower(fromBattler, skill)) {
                fromBattlerModule.actioned = true;
            }
        }
        // 使用技能
        let doUseSkill = () => {
            // 战斗画面模式：敌人单体技能/攻击
            if (WorldData.battleSceneEnabled && skill.targetType == 2) {
                this.actionComplete(true, true);
            }
            else {
                // 如果仅有一个目标且已经被击中过或死亡则跳过此次战斗行为（比如事件中制作了战斗演出等事件）
                if (onlyOneTarget && (onlyOneTargetModule.hitBy || onlyOneTargetModule.isDead)) {
                    this.actionComplete(true, true);
                    return;
                }
                // 播放释放动画
                let waitReleaseAnimationOver = GameBattleAction.playReleaseAnimation(fromBattler, fromBattlerModule.actor, false, skill, () => {
                    if (waitReleaseAnimationOver) this.releaseSkill(fromBattler, skill, gridPos, targets, firstUse);
                });
                // 存在释放动作的话：播放攻击释放后进入下一个阶段
                GameBattleAction.releaseAction(fromBattler, skill.releaseActionID, skill.releaseFrame, 1, () => {
                    if (!waitReleaseAnimationOver) this.releaseSkill(fromBattler, skill, gridPos, targets, firstUse);
                });
            }
        };
        if (firstUse) {
            // 使用技能事件
            this.execUseSkillEvent(skill, fromBattler, onlyOneTarget, doUseSkill);
        }
        else {
            doUseSkill.apply(this);
        }
        // 派发事件
        EventUtils.happen(GameBattleAction, GameBattleAction.EVENT_ACTION_USE_SKILL, [fromBattler, skill, gridPos, targets, firstUse]);
    }
    /**
     * 使用道具
     * @param fromBattler 来源战斗者
     * @param item 道具
     */
    static useItem(fromBattler: ProjectClientSceneObject, toBattler: ProjectClientSceneObject, item: Module_Item): void {
        this.currentActionType = 3;
        // 记录当前行为的战斗者
        let fromBattlerModule = fromBattler.getModule(6) as SoModule_Battler;
        this.fromBattler = fromBattler;
        this.fromBattlerItem = item;
        this.targetBattler = toBattler;
        // 等待一次击中算作完成行为
        this.currentHitTarget = 0;
        this.totalHitTarget = 1;
        this.currentHitTimes = 0;
        this.totalHitTimes = 1;
        // 未被击中的标识
        fromBattlerModule.hitBy = false;
        // 显示当前攻击者和目标的界面
        this.showTargetBattleBriefWindow = true;
        this.showCurrentBattlerWindow(fromBattler);
        this.showTargetBattlerWindow(toBattler);
        // 关闭指示器
        GameBattleAction.closeBattleIndicator();
        // 消耗品的话则移除掉它
        if (item.isConsumables) {
            let itemIndex = fromBattlerModule.actor.items.indexOf(item);
            Game.unActorItemByItemIndex(fromBattlerModule.actor, itemIndex);
        }
        // 消耗行动力
        if (item.costActionPower) fromBattlerModule.actioned = true;
        // 使用道具
        let doUseItem = () => {
            // 战场判定处理
            GameBattle.battlerfieldDetermineHandle(() => {
                // 如果已经被击中过或死亡则跳过此次战斗行为（比如事件中制作了战斗演出等事件）
                if ((fromBattlerModule.hitBy || fromBattlerModule.isDead)) {
                    this.actionComplete(true, true);
                    return;
                }
                // 存在释放动作的话：播放释放动作后进入下一个阶段
                let hasUseItemAction = fromBattler.avatar.hasActionID(WorldData.useItemActID);
                if (hasUseItemAction) {
                    // 监听当动作播放完毕时，恢复待机动作
                    fromBattler.avatar.once(Avatar.ACTION_PLAY_COMPLETED, this, () => {
                        if (!fromBattlerModule.isDead && fromBattlerModule.actor.hp != 0) fromBattler.avatar.actionID = 1;
                    });
                    // 切换至释放动作，从第6帧开始播放
                    fromBattler.avatar.currentFrame = 1;
                    fromBattler.avatar.actionID = WorldData.useItemActID;
                }
                this.hitTarget(fromBattler, toBattler, 2, null, item);
            });
        }
        // 执行片段事件-战斗过程：使用道具
        GameCommand.startCommonCommand(14037, [], Callback.New(doUseItem, this), fromBattler, toBattler);
        // 派发事件
        EventUtils.happen(GameBattleAction, GameBattleAction.EVENT_ACTION_USE_ITEM, [fromBattler, toBattler, item]);
    }
    //------------------------------------------------------------------------------------------------------
    // 结算阶段
    //------------------------------------------------------------------------------------------------------
    /**
     * 是否需要结算战斗者状态
     */
    static isNeedCalcBattlersStatus(): boolean {
        let allBattlers = GameBattleHelper.allBattlers;
        for (let i = 0; i < allBattlers.length; i++) {
            let battler = allBattlers[i];
            let battlerModule = battler.getModule(6) as SoModule_Battler;
            if (battlerModule.isDead) continue;
            let battlerActor = battlerModule.actor;
            for (let s = 0; s < battlerActor.status.length; s++) {
                let status = battlerActor.status[s];
                if (!status.overtime) continue;
                return true;
            }
        }
        return false;
    }
    /**
     * 结算战斗者状态
     * @param onFin 完成时回调 
     */
    static calcBattlersStatus(onFin: Callback): void {
        // 使用同步任务，每个任务逐一完成后才能进行回调
        let taskName = "playStatusAnimation";
        SyncTask.clear(taskName);
        // 遍历每个角色开始显示DOT/HOT
        let allBattlers = GameBattleHelper.allBattlers;
        for (let i = 0; i < allBattlers.length; i++) {
            let battler = allBattlers[i];
            let battlerModule = battler.getModule(6) as SoModule_Battler;
            if (battlerModule.isDead) continue;
            let battlerActor = battlerModule.actor;
            for (let s = 0; s < battlerActor.status.length; s++) {
                let status = battlerActor.status[s];
                if (!status.overtime) continue;
                new SyncTask(taskName, (battler: ProjectClientSceneObject, status: Module_Status) => {
                    this.hitByStatus(battler, status, Callback.New((battler: ProjectClientSceneObject, status: Module_Status) => {
                        if (status.whenOvertimeEvent) {
                            let fromBattler = Game.currentScene.sceneObjects[Math.max(status.fromBattlerID, 0)];
                            if (!fromBattler) fromBattler = battler;
                            CommandPage.startTriggerFragmentEvent(status.whenOvertimeEvent, fromBattler, battler, Callback.New(SyncTask.taskOver, SyncTask, [taskName]));
                        }
                        else {
                            SyncTask.taskOver(taskName);
                        }
                    }, this, [battler, status]));
                }, [battler, status]);
            }
        }
        new SyncTask(taskName, () => {
            // -- 计算击杀奖励
            GameBattleData.calcHitReward(this.fromBattler, Callback.New(() => {
                onFin.run();
                SyncTask.taskOver(taskName);
            }, this));
        });
        // 派发事件
        EventUtils.happen(GameBattleAction, GameBattleAction.EVENT_ACTION_CALE_STATUS, []);
    }
    //------------------------------------------------------------------------------------------------------
    // 内部行为流程实现
    //------------------------------------------------------------------------------------------------------
    /**
     * 释放技能
     * @param fromBattler 来源战斗者
     * @param skill 施放的技能
     * @param gridPos 施放的格子坐标
     * @param targets 包含的目标集
     */
    private static releaseSkill(fromBattler: ProjectClientSceneObject, skill: Module_Skill, gridPos: Point, targets: ProjectClientSceneObject[], firstUse: boolean) {
        // 派发事件
        EventUtils.happen(GameBattleAction, GameBattleAction.EVENT_ACTION_RELEASE_SKILL, [fromBattler, skill, gridPos, targets, firstUse]);
        // 释放技能时事件
        this.execReleaseSkillEvent(skill, fromBattler, () => {
            let fromBattlerModule = fromBattler.getModule(6) as SoModule_Battler;
            // 等待一次击中算作完成行为
            this.currentHitTarget = 0;
            this.totalHitTarget = targets.length;
            // 首次时初始化连击次数
            if (firstUse) {
                this.currentHitTimes = 0;
                // -- 普通攻击还要计算被动连击次数（乘法叠加）
                if (skill == fromBattlerModule.actor.atkSkill) {
                    this.totalHitTimes = skill.releaseTimes * GameBattleHelper.getNormalAttackTimes(this.fromBattler);
                }
                // -- 否则仅来源技能的连击次数
                else {
                    this.totalHitTimes = skill.releaseTimes;
                }
            }
            // 是否击中地面
            let isHitGround = skill.targetType >= 5 && skill.targetType <= 6;
            // -- 非地面且无作用目标时直接结束
            if (!isHitGround && targets.length == 0) {
                this.actionComplete(true, true);
                return;
            }
            // 直接
            if (skill.skillType == 0) {
                // 击中地面的情况
                if (isHitGround) {
                    this.hitGround(fromBattler, skill, gridPos, targets);
                }
                // 目标
                else {
                    for (let i = 0; i < targets.length; i++) {
                        this.hitTarget(fromBattler, targets[i], 1, skill);
                    }
                }
            }
            // 弹幕
            else if (skill.skillType == 1) {
                // 击中地面的情况
                if (isHitGround) {
                    this.releaseBullet(fromBattler, skill, gridPos, null, targets);
                }
                // 目标
                else {
                    for (let i = 0; i < targets.length; i++) {
                        this.releaseBullet(fromBattler, skill, gridPos, targets[i], targets);
                    }
                }
            }
        });
    }
    /**
     * 发射子弹
     * @param skill 技能
     * @param posGrid 目的地所在格子位置
     * @param targetBattler 战斗者
     */
    private static releaseBullet(fromBattler: ProjectClientSceneObject, skill: Module_Skill, gridPos: Point, targetBattler: ProjectClientSceneObject = null, targets: ProjectClientSceneObject[]) {
        // 是否击中地面
        let isHitGround = skill.targetType >= 5 && skill.targetType <= 6;
        // 创建子弹动画
        let bullet = new GCAnimation();
        bullet.id = skill.bulletAnimation;
        bullet.loop = true;
        bullet.play();
        Game.currentScene.animationHighLayer.addChild(bullet);
        // 子弹起始位置
        let startPoint = new Point(fromBattler.pos.x, fromBattler.pos.y);
        // 子弹位置修正，根据起始点与目的地的角度
        let destinationPoint = targetBattler ? targetBattler.pos : new Point(gridPos.x * Config.SCENE_GRID_SIZE + Config.SCENE_GRID_SIZE * 0.5, gridPos.y * Config.SCENE_GRID_SIZE + Config.SCENE_GRID_SIZE * 0.5);
        let angle = MathUtils.direction360(destinationPoint.x, destinationPoint.y, startPoint.x, startPoint.y);
        let dx = Math.sin(angle / 180 * Math.PI) * Config.SCENE_GRID_SIZE / 2;
        let dy = Math.cos(angle / 180 * Math.PI) * Config.SCENE_GRID_SIZE / 2 - Config.SCENE_GRID_SIZE / 2;
        startPoint.x += -dx;
        startPoint.y += dy;
        // 计算距离和需要的帧数
        let dis = Point.distance(startPoint, destinationPoint);
        let totalFrame = Math.max(Math.ceil(dis / skill.bulletSpeed * 60), 1);
        let currentFrame = 1;
        bullet.x = startPoint.x;
        bullet.y = startPoint.y;
        // 子弹面向
        let rotation = MathUtils.direction360(startPoint.x, startPoint.y, destinationPoint.x, destinationPoint.y);
        bullet.rotation = rotation;
        os.add_ENTERFRAME(() => {
            // 刷新子弹当前位置
            let per = currentFrame / totalFrame;
            bullet.x = (destinationPoint.x - startPoint.x) * per + startPoint.x;
            bullet.y = (destinationPoint.y - startPoint.y) * per + startPoint.y;
            // 推进1帧，当击中目标时进入下一阶段
            currentFrame++;
            if (currentFrame > totalFrame) {
                // 派发事件
                EventUtils.happen(GameBattleAction, GameBattleAction.EVENT_ACTION_RELEASE_BULLET_OVER, [fromBattler, skill, bullet, targetBattler, targets]);
                // 清除帧刷
                //@ts-ignore
                os.remove_ENTERFRAME(arguments.callee, this);
                // 清除子弹
                bullet.dispose();
                // 到下一个阶段
                if (isHitGround || !targetBattler) this.hitGround(fromBattler, skill, gridPos, targets);
                else this.hitTarget(fromBattler, targetBattler, 1, skill);
            }
        }, this);
        // 派发事件
        EventUtils.happen(GameBattleAction, GameBattleAction.EVENT_ACTION_RELEASE_BULLET_START, [fromBattler, skill, bullet, targetBattler, targets]);
    }
    /**
     * 击中地面
     * @param fromBattler 来源战斗者
     * @param skill 技能
     * @param gridPos 目的地所在格子位置
     * @param targets 击中的目标战斗者集合
     */
    private static hitGround(fromBattler: ProjectClientSceneObject, skill: Module_Skill, gridPos: Point, targets: ProjectClientSceneObject[]): void {
        // 击中后处理
        let afterHitOpenSpace = () => {
            // 如果命中目标则进入命中目标的阶段
            if (targets.length > 0) {
                for (let i = 0; i < targets.length; i++) {
                    this.hitTarget(fromBattler, targets[i], 1, skill);
                }
            }
            // 此次行为结束
            else {
                this.actionComplete(true);
            }
        }
        // 击中地面
        let doHitOpenSpace = () => {
            // 战场判定处理
            GameBattle.battlerfieldDetermineHandle(() => {
                let hitAniID = skill.targetGridAnimation;
                // 存在击中动画：显示击中动画
                if (hitAniID) {
                    // 已进入伤害显示阶段标识
                    let alreadyActionComplete = false;
                    // 播放击中动画
                    let hitAni = new GCAnimation();
                    hitAni.id = hitAniID;
                    if (skill.targetGridAniLayer == 0) Game.currentScene.animationLowLayer.addChild(hitAni);
                    else Game.currentScene.animationHighLayer.addChild(hitAni);
                    let posCenter = GameUtils.getGridCenterByGrid(gridPos);
                    hitAni.x = posCenter.x;
                    hitAni.y = posCenter.y;
                    hitAni.play();
                    hitAni.once(GCAnimation.PLAY_COMPLETED, this, () => {
                        if (!alreadyActionComplete) afterHitOpenSpace.apply(this);
                        hitAni.dispose();
                    });
                    // 监听动画抛出的信号，以便提前进入显示伤害阶段
                    hitAni.once(GCAnimation.SIGNAL, this, (signalID: number) => {
                        if (signalID == 1) {
                            alreadyActionComplete = true;
                            afterHitOpenSpace.apply(this);
                        }
                    });
                }
                // 不存在时：直接进入下一个阶段
                else {
                    afterHitOpenSpace.apply(this);
                }
            });
        };
        // 执行片段事件：击中地面的事件，执行完毕后再继续击中地面
        if (skill.mustOpenSpace && skill.hitOpenSpaceEvent) CommandPage.startTriggerFragmentEvent(skill.hitOpenSpaceEvent, fromBattler, GameBattleHelper.cursor, Callback.New(doHitOpenSpace, this));
        else doHitOpenSpace.apply(this);
        // 派发事件
        EventUtils.happen(GameBattleAction, GameBattleAction.EVENT_ACTION_HIT_GROUND, [fromBattler, skill, gridPos, targets]);
    }
    /**
     * 击中目标：攻击、技能、道具、状态
     * -- 计算命中率
     * -- 播放击中动画
     * -- 调用击中片段事件
     * -- 进入伤害结算
     * @param fromBattler 来源战斗者
     * @param targetBattler 目标战斗者
     * @param actionType 0-普通攻击 1-使用技能 2-使用道具 3-状态
     * @param skill [可选] 默认值=null 使用的技能
     * @param item [可选] 默认值=null 使用的道具
     * @param status [可选] 默认值=null 使用的状态（DOT/HOT跳伤害）
     */
    private static hitTarget(fromBattler: ProjectClientSceneObject, targetBattler: ProjectClientSceneObject, actionType: number, skill: Module_Skill = null, item: Module_Item = null, status: Module_Status = null): void {
        // 获取战斗者的角色数据
        let fromBattlerModule = fromBattler.getModule(6) as SoModule_Battler;
        let targetBattlerModule = targetBattler.getModule(6) as SoModule_Battler;
        // 是否命中标识，根据对应行为计算命中率
        let isHitSuccess = GameBattleData.getHitResult(actionType, fromBattler, targetBattler, skill);
        // 击中动画
        let hitAniID = 0;
        // 是否显示目标受伤动作
        let showTargetHurtAnimation = false;
        // 普通攻击：(攻击者命中率 - 目标躲避率)%
        if (actionType == 0) {
            hitAniID = fromBattlerModule.actor.hitAnimation;
            showTargetHurtAnimation = true;
        }
        // 使用技能：(技能命中率)%
        else if (actionType == 1) {
            hitAniID = skill.hitAnimation;
            showTargetHurtAnimation = GameBattleHelper.isHostileRelationship(fromBattler, targetBattler);
        }
        // 使用道具：100%
        else if (actionType == 2) {
            hitAniID = item.releaseAnimation;
        }
        // 状态:DOT/HOT
        else if (actionType == 3) {
            showTargetHurtAnimation = false;
        }
        // 内部函数
        let callNextStep = () => {
            // -- 已经结束战斗的情况
            if (GameBattle.state == 0 || GameBattle.state == 3 || targetBattlerModule.isDead) {
                this.actionComplete();
            }
            else {
                this.hitResult(fromBattler, targetBattler, isHitSuccess, actionType, skill, item, status);
            }
        }
        let callHitEvent = () => {
            // 执行片段事件-战斗过程：击中事件
            if (isHitSuccess && actionType <= 1) {
                this.execHitTargetEvent(skill, fromBattler, targetBattler, callNextStep);
            }
            else if (actionType == 2 && item.callEvent) CommandPage.startTriggerFragmentEvent(item.callEvent, fromBattler, targetBattler, Callback.New(callNextStep, this));
            else callNextStep.apply(this);
        }
        // 存在击中动画：显示击中动画
        if (hitAniID) {
            AssetManager.preLoadAnimationAsset(hitAniID, Callback.New(() => {
                // 已进入伤害显示阶段标识
                let alreadyInShowDamageStage = false;
                // 命中的话显示受伤动作和动画
                if (isHitSuccess && showTargetHurtAnimation) {
                    // -- 受伤动作
                    let toHurtActionID = skill?.keepHurtAction ? 11 : 9;
                    if (targetBattler.avatar.hasActionID(toHurtActionID)) {
                        targetBattler.avatar.currentFrame = 1;
                        targetBattler.avatar.once(Avatar.ACTION_PLAY_COMPLETED, this, () => {
                            if (!skill?.keepHurtAction) {
                                if (!alreadyInShowDamageStage) {
                                    alreadyInShowDamageStage = true;
                                    callHitEvent.apply(this);
                                }
                            }
                        })
                        targetBattler.avatar.actionID = toHurtActionID;
                    }
                    // -- 受伤动画
                    if (WorldData.hurtAni) targetBattler.playAnimation(WorldData.hurtAni, true, true);
                }
                // 播放击中动画
                let hitAni = targetBattler.playAnimation(hitAniID, false, isHitSuccess, null, true);
                if (hitAni) {
                    targetBattler.animationLowLayer.scaleX = 1;
                    targetBattler.animationHighLayer.scaleX = 1;
                    if (skill && skill.autoFlip) {
                        if (fromBattler != targetBattler && fromBattler.x < targetBattler.x) {
                            targetBattler.animationLowLayer.scaleX = -1;
                            targetBattler.animationHighLayer.scaleX = -1;
                        }
                    }
                    hitAni.once(GCAnimation.PLAY_COMPLETED, this, () => {
                        targetBattler.animationLowLayer.scaleX = 1;
                        targetBattler.animationHighLayer.scaleX = 1;
                        if (!alreadyInShowDamageStage) {
                            alreadyInShowDamageStage = true;
                            callHitEvent.apply(this);
                        }
                    });
                    // 监听提前进入显示伤害阶段
                    hitAni.once(GCAnimation.SIGNAL, this, (signalID: number) => {
                        if (signalID == 1) {
                            if (!alreadyInShowDamageStage) {
                                alreadyInShowDamageStage = true;
                                callHitEvent.apply(this);
                            }
                        }
                    });
                }
                else {
                    if (!alreadyInShowDamageStage) {
                        alreadyInShowDamageStage = true;
                        callHitEvent.apply(this);
                    }
                }
            }, this), true, true, false);
        }
        // 不存在时：直接进入下一个阶段
        else {
            callHitEvent.apply(this);
        }
        // 派发事件
        EventUtils.happen(GameBattleAction, GameBattleAction.EVENT_ACTION_HIT_TARGET, [fromBattler, targetBattler, actionType, skill, item, status]);
    }
    /**
     * 计算击中后的效果
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
     * @param playEffect [可选] 默认值=true 播放效果 
     */
    private static hitResult(fromBattler: ProjectClientSceneObject, targetBattler: ProjectClientSceneObject, isHitSuccess: boolean, actionType: number, skill: Module_Skill = null, item: Module_Item = null, status: Module_Status = null): void {
        let fromBattlerModule = fromBattler.getModule(6) as SoModule_Battler;
        let targetBattlerModule = targetBattler.getModule(6) as SoModule_Battler;
        let damageType = actionType == 0 ? 0 : (skill ? skill.damageType : -2);
        let isMelee = GameBattleHelper.isMeleeAction(this.fromBattler, actionType, skill);
        // 等待播放效果播放完毕后算作「行动完成」
        let animationCount = 2;
        let onAnimationCompleteCallback = Callback.New(() => {
            animationCount--;
            if (animationCount == 0) {
                if (this.currentHitTimes == this.totalHitTimes - 1) {
                    // 特殊效果：反击
                    let counterattack = this.effect_counterattack(actionType, fromBattler, targetBattler, skill, isMelee, damageType);
                    if (counterattack) return;
                }
                this.actionComplete(false, false, fromBattler, targetBattler);
            }
        }, this);
        // 计算击中结果
        let rogueHitState = RogueSkillSynergySystem.captureHitState(targetBattler);
        let targetHPBefore = targetBattlerModule.actor.hp;
        let res = GameBattleData.calculationHitResult(fromBattler, targetBattler, isHitSuccess, actionType, skill, item, status, this.seCounterattackDamagePer)
        // Tactical items can have no built-in HP/SP result, but their custom effects must still resolve.
        let synergyEffects = RogueSkillSynergySystem.afterHit(fromBattler, targetBattler, actionType, skill, res, rogueHitState, item);
        for (let i = 0; i < synergyEffects.length; i++) {
            let effect = synergyEffects[i];
            let effectDamage = RogueSkillSynergySystem.preventLethalDamage(effect.target, effect.damage);
            GameBattleData.changeBattlerHP(effect.target, effectDamage);
            RogueKillProgress.markDamageSource(effect.target, fromBattler, null, !!effect.secondary);
            this.showDamage(effect.target, effect.damageType, effectDamage, false);
            GameBattle.checkBattlerIsDead(effect.target, () => { });
        }
        if (res) {
            // 技能强制位移。碰撞伤害并入本次伤害，统一显示和结算经验。
            if (actionType == 1 && isHitSuccess && skill && targetBattlerModule.actor.hp > 0) {
                let collisionDamage = this.applySkillForceMove(fromBattler, targetBattler, skill);
                if (collisionDamage > 0) {
                    GameBattleData.changeBattlerHP(targetBattler, -collisionDamage);
                    res.damage -= collisionDamage;
                }
                if (skill.id == 68 && skill["__rogueForceMoveBlocked"]) GameBattleData.addStatus(targetBattler, 2, fromBattler, true);
            }
            // 格斗家被动：每回合首次主动造成物理伤害时叠加一层战意。
            if (!this.seCounterattack && (actionType == 0 || actionType == 1) && res.damageType == 0 && res.damage < 0) {
                this.applyFighterMomentum(fromBattler);
            }
            if (!WorldData.useCustomDamageLogic) {
                // -- 伤害类技能且造成了伤害时：记录片段经验值以及伤害类特殊效果
                if (res.damageType >= 0 && res.damageType <= 2 && res.damage < 0) {
                    GameBattleData.addEXPFragment(fromBattler, targetBattler, -res.damage / targetBattlerModule.actor.MaxHP);
                    let showSlefDmage = false;
                    let hpValue: number = 0;
                    // 特殊效果：反弹伤害
                    let returnDmagePer = GameBattleHelper.getReturnAttackDamagePer(fromBattler, targetBattler, damageType);
                    if (returnDmagePer != null) {
                        let returnDamage = MathUtils.int(res.damage * returnDmagePer * 0.01);
                        if (returnDamage != 0) {
                            this.reverseBattler = targetBattler;
                            hpValue += returnDamage;
                            GameBattleData.addEXPFragment(targetBattler, fromBattler, -returnDamage / fromBattlerModule.actor.MaxHP);
                            this.showDamage(fromBattler, res.damageType, returnDamage, false);
                            showSlefDmage = true;
                        }
                    }
                    // 特殊效果：吸取生命值-近战
                    let suckHP = GameBattleHelper.getSuckPer(fromBattler, damageType, true, isMelee);
                    if (suckHP != null) {
                        let suckHPValue = MathUtils.int(-res.damage * suckHP * 0.01);
                        if (suckHPValue != 0) {
                            hpValue += suckHPValue;
                            if (!showSlefDmage) this.showDamage(fromBattler, 3, suckHPValue, false);
                            showSlefDmage = true;
                        }
                    }
                    // 特殊效果：吸取魔法值-近战
                    let suckSP = GameBattleHelper.getSuckPer(fromBattler, damageType, false, isMelee);
                    if (suckSP != null) {
                        let spValue = MathUtils.int(-res.damage * suckSP * 0.01);
                        if (spValue != 0) {
                            GameBattleData.changeBattlerSP(fromBattler, spValue);
                            if (!showSlefDmage) this.showDamage(fromBattler, 4, spValue, false);
                            showSlefDmage = true;
                        }
                    }
                    // -- 血量增减
                    if (hpValue != 0) {
                        GameBattleData.changeBattlerHP(fromBattler, hpValue);
                    }
                }
                // 双方生命值都不为0的情况下需要等待伤害显示完毕，否则立即返回
                let animationCountZero = true;
                animationCount++;
                if (targetBattlerModule.actor.hp != 0 && fromBattlerModule.actor.hp != 0) {
                    animationCountZero = false;
                }
                this.showDamage(targetBattler, res.damageType, res.damage, res.isCrit, animationCountZero ? null : onAnimationCompleteCallback);
                if (animationCountZero) {
                    onAnimationCompleteCallback.run();
                }
            }
        }
        // 停止受伤动画
        if (WorldData.hurtAni) targetBattler.stopAnimation(WorldData.hurtAni);
        // 恢复待机动作
        if (!targetBattlerModule.isDead) targetBattler.avatar.actionID = 1;
        // 检查来源者和目标是否死亡
        // Status damage commonly resolves at the start of the enemy's own
        // turn. It is a normal attributed kill, not a reward-less secondary
        // hit. The explicit synergy-effect path above remains secondary.
        if ((res && res.damage < 0) || targetBattlerModule.actor.hp < targetHPBefore) {
            RogueKillProgress.markDamageSource(targetBattler, fromBattler, skill);
        }
        if (this.reverseBattler == targetBattler && fromBattlerModule.actor.hp == 0) {
            RogueKillProgress.markDamageSource(fromBattler, targetBattler, null);
        }
        GameBattle.checkBattlerIsDead(fromBattler, () => {
            if (fromBattlerModule.isDead) this.showCurrentBattlerWindow(fromBattler);
            onAnimationCompleteCallback.run();
        });
        GameBattle.checkBattlerIsDead(targetBattler, () => {
            if (this.showTargetBattleBriefWindow && targetBattlerModule.isDead) this.showTargetBattlerWindow(targetBattler);
            onAnimationCompleteCallback.run();
        });
        // -- 刷新头像信息
        this.showCurrentBattlerWindow(fromBattler);
        if (this.showTargetBattleBriefWindow) {
            this.showTargetBattlerWindow(targetBattler);
        }
    }
    /**
     * 应用技能配置的击退/拉近，并返回因受阻产生的固定伤害。
     */
    private static moveYanlingIntoRange(fromBattler: ProjectClientSceneObject, targetBattler: ProjectClientSceneObject): boolean {
        let fromGrid = fromBattler.posGrid;
        let targetGrid = targetBattler.posGrid;
        let offsetX = targetGrid.x - fromGrid.x;
        let offsetY = targetGrid.y - fromGrid.y;
        // 85 只从直线两格外切入；近身使用或斜向位置不改变站位。
        if (Math.abs(offsetX) + Math.abs(offsetY) != 2 || (offsetX != 0 && offsetY != 0)) return false;
        let stepX = offsetX == 0 ? 0 : (offsetX > 0 ? 1 : -1);
        let stepY = offsetY == 0 ? 0 : (offsetY > 0 ? 1 : -1);
        let nextGrid = new Point(fromGrid.x + stepX, fromGrid.y + stepY);
        let scene = fromBattler.scene as ProjectClientScene;
        if (!scene || scene.sceneUtils.isOutsideByGrid(nextGrid) ||
            scene.sceneUtils.isObstacleGrid(nextGrid, fromBattler, fromBattler, true) ||
            GameBattleHelper.isBattlerOccupiedGrid(nextGrid, fromBattler)) return false;
        let nextPoint = new Point(nextGrid.x * Config.SCENE_GRID_SIZE, nextGrid.y * Config.SCENE_GRID_SIZE);
        GameUtils.getGridCenter(nextPoint, nextPoint);
        fromBattler.setTo(nextPoint.x, nextPoint.y, true, true, false, false, false);
        return true;
    }

    static applySkillForceMove(fromBattler: ProjectClientSceneObject, targetBattler: ProjectClientSceneObject, skill: Module_Skill): number {
        let fromBattlerModule: SoModule_Battler = fromBattler ? fromBattler.getModule(6) as SoModule_Battler : null;
        if (skill && skill.id == 85 && fromBattlerModule && fromBattlerModule.actor && fromBattlerModule.actor.id == 9) {
            this.moveYanlingIntoRange(fromBattler, targetBattler);
            return 0;
        }
        let mode = MathUtils.int(skill.forceMoveMode || 0);
        let distance = Math.max(0, MathUtils.int(skill.forceMoveDistance || 0));
        if (skill.id == 68 && RogueSkillSynergySystem.getSkillLevelForBattler(fromBattler, 68) >= 2) distance = Math.max(distance, 2);
        if (mode == 0 || distance == 0 || fromBattler == targetBattler) return 0;
        let targetScene = targetBattler.scene as ProjectClientScene;
        if (!targetScene) return 0;
        let moved = 0;
        for (let i = 0; i < distance; i++) {
            let fromGrid = fromBattler.posGrid;
            let targetGrid = targetBattler.posGrid;
            let offsetX = fromGrid.x - targetGrid.x;
            let offsetY = fromGrid.y - targetGrid.y;
            if (mode == 1) {
                offsetX = -offsetX;
                offsetY = -offsetY;
            }
            let stepX = 0;
            let stepY = 0;
            if (Math.abs(offsetX) >= Math.abs(offsetY) && offsetX != 0) stepX = offsetX > 0 ? 1 : -1;
            else if (offsetY != 0) stepY = offsetY > 0 ? 1 : -1;
            if (stepX == 0 && stepY == 0) break;
            let nextGrid = new Point(targetGrid.x + stepX, targetGrid.y + stepY);
            // 强制位移时以被位移目标的阵营判断友敌：目标的敌方会形成阻挡，
            // 目标的友方可被穿过；但任何战斗者占用的格子都不能作为位移落点。
            let targetBattlerModule = targetBattler.getModule(6) as SoModule_Battler;
            let ignoreFriendlyBattlers = !targetBattlerModule || targetBattlerModule.battleCamp == 0;
            if (targetScene.sceneUtils.isOutsideByGrid(nextGrid) ||
                targetScene.sceneUtils.isObstacleGrid(nextGrid, targetBattler, targetBattler, ignoreFriendlyBattlers) ||
                GameBattleHelper.isBattlerOccupiedGrid(nextGrid, targetBattler)) break;
            let nextPoint = new Point(nextGrid.x * Config.SCENE_GRID_SIZE, nextGrid.y * Config.SCENE_GRID_SIZE);
            GameUtils.getGridCenter(nextPoint, nextPoint);
            targetBattler.setTo(nextPoint.x, nextPoint.y, true, true, false, false, false);
            moved++;
        }
        skill["__rogueForceMoveBlocked"] = moved < distance;
        let collisionDamagePerGrid = Math.max(0, MathUtils.int(skill.forceMoveCollisionDamage || 0));
        return (distance - moved) * collisionDamagePerGrid;
    }
    /** 格斗家被动“战意沸腾”：每回合最多叠加一次，战斗结束后随状态清空。 */
    private static applyFighterMomentum(fromBattler: ProjectClientSceneObject): void {
        let battlerModule = fromBattler.getModule(6) as SoModule_Battler;
        let actor = battlerModule.actor;
        let hasPassive = false;
        for (let i = 0; i < actor.skills.length; i++) {
            if (actor.skills[i].id == 3014) {
                hasPassive = true;
                break;
            }
        }
        if (!hasPassive) return;
        let runtimeModule = battlerModule as any;
        if (runtimeModule.fighterMomentumRound == GameBattle.battleRound) return;
        runtimeModule.fighterMomentumRound = GameBattle.battleRound;
        if (GameBattleData.addStatus(fromBattler, 26, fromBattler, true)) {
            Game.refreshActorAttribute(actor, GameBattleHelper.getLevelByActor(actor));
        }
    }
    /**
     * 行为结束:派发战斗行为阶段事件
     * 检查多目标完毕和连击完毕
     */
    private static actionComplete(skipHitMultipleTarget: boolean = false, skipHitTimes: boolean = false, fromBattler: ProjectClientSceneObject = null, targetBattler: ProjectClientSceneObject = null): void {
        let fromBattlerModule = this.fromBattler.getModule(6) as SoModule_Battler;
        if (!skipHitMultipleTarget) {
            this.currentHitTarget++;
        }
        // 多目标全部完毕时
        if (skipHitMultipleTarget || this.currentHitTarget == this.totalHitTarget) {
            let targetBattleCurrentStatusPageIndex = -1;
            if (targetBattler) {
                targetBattleCurrentStatusPageIndex = targetBattler.currentStatusPageIndex;
            }
            // 战场判定处理
            GameBattle.battlerfieldDetermineHandle(() => {
                this.currentHitTimes++;
                let allowMultiHit = true;
                if (targetBattler) {
                    if (targetBattleCurrentStatusPageIndex != targetBattler.currentStatusPageIndex) {
                        allowMultiHit = false;
                    }
                }
                // 多连击完毕时
                if (allowMultiHit && GameBattleHelper.isBattler(this.fromBattler) && !fromBattlerModule.isDead &&
                    !skipHitTimes && this.currentHitTimes != this.totalHitTimes) {
                    // -- 普通攻击连击
                    if (this.currentActionType == 0) {
                        this.attack(this.fromBattler, this.targetBattler, false);
                    }
                    // -- 技能连击
                    else {
                        this.useSkill(this.fromBattler, this.fromBattlerSkill, this.fromBattlerSkillGridPos, null, false);
                    }
                    return;
                }
                // 结算奖励后派发行动完成事件
                this.calcCurrentActionReward(true, null, "action-end");
            });
        }
    }
    /**
     * 计算奖励
     * @param enterEndStep 进入结束阶段
     * @param onFin[可选] 默认值=null 完成后回调
     */
    static calcCurrentActionReward(enterEndStep: boolean, onFin: Function = null, continuation: string = ""): void {
        let calcHitRewardTask = "calcHitRewardTask";
        let completeReward = () => {
            let continueAction = () => {
                if (enterEndStep) this.endAction();
                if (onFin) onFin.apply(this);
            };
            if (!RogueRewardPresenter.presentPending(continueAction, continuation)) continueAction();
        };
        // 计算反击者奖励，如有
        new SyncTask(calcHitRewardTask, () => {
            if (this.reverseBattler && this.reverseBattler != this.fromBattler) {
                let dropEXPFragmentCount = GameBattleData.dropEXPFragmentCount;
                GameBattleData.calcHitReward(this.reverseBattler, Callback.New((isGetKillReward: boolean) => {
                    if (!isGetKillReward && dropEXPFragmentCount > 0) {
                        GameBattleData.calcAttackReward(this.reverseBattler, Callback.New(() => {
                            SyncTask.taskOver(calcHitRewardTask);
                        }, this))
                    }
                    else {
                        SyncTask.taskOver(calcHitRewardTask);
                    }
                }, this));
            }
            else {
                SyncTask.taskOver(calcHitRewardTask);
            }
        });
        // 计算攻击者奖励
        new SyncTask(calcHitRewardTask, () => {
            let dropEXPFragmentCount = GameBattleData.dropEXPFragmentCount;
            GameBattleData.calcHitReward(this.fromBattler, Callback.New((isGetKillReward: boolean) => {
                if (!isGetKillReward && dropEXPFragmentCount > 0) {
                    GameBattleData.calcAttackReward(this.fromBattler, Callback.New(() => {
                        SyncTask.taskOver(calcHitRewardTask);
                        completeReward();
                    }, this))
                }
                else {
                    SyncTask.taskOver(calcHitRewardTask);
                    completeReward();
                }
            }, this));
        });
    }
    /**
     * 当次行为结束
     */
    static endAction(): void {
        this.reverseBattler = null;
        GameCommand.startCommonCommand(14018, [], Callback.New(() => {
            EventUtils.happen(GameBattleAction, GameBattleAction.EVENT_ONCE_ACTION_COMPLETE);
        }, this, []), this.fromBattler, this.targetBattler ? this.targetBattler : this.fromBattler);
    }
    //------------------------------------------------------------------------------------------------------
    // 内部实现：结算阶段
    //------------------------------------------------------------------------------------------------------
    /**
     * 来自状态的击中
     * @param battler 战斗者
     * @param status 状态
     * @param onFin 当完成时回调
     */
    private static hitByStatus(battler: ProjectClientSceneObject, status: Module_Status, onFin: Callback): void {
        this.cameraMoveToBattler(battler);
        // 这里需要播放N次DOT/HOT，而不是目前的一次性全部显示。
        EventUtils.addEventListener(GameBattleAction, GameBattleAction.EVENT_ONCE_ACTION_COMPLETE, onFin, true);
        // 等待一次击中算作完成行为
        this.currentHitTarget = 0;
        this.totalHitTarget = 1;
        this.currentHitTimes = 0;
        this.totalHitTimes = 1;
        // 获取来源者
        let fromBattler = Game.currentScene.sceneObjects[status.fromBattlerID];
        // 记录当前行为的战斗者
        if (!GameBattleHelper.isBattler(fromBattler)) fromBattler = battler;
        this.fromBattler = fromBattler;
        this.hitTarget(fromBattler, battler, 3, null, null, status);
    }
    //------------------------------------------------------------------------------------------------------
    // 其他演出效果显示
    //------------------------------------------------------------------------------------------------------
    /**
     * 显示伤害
     * @param targetBattler 目标战斗者
     * @param damageType  -2-无 -1-Miss 0-物理伤害 1-魔法伤害 2-真实伤害 3-恢复生命值 4-恢复魔法值
     * @param damage [可选] 默认值=0 伤害
     * @param isCrit [可选] 默认值=false 是否暴击
     * @param onFin [可选] 默认值=null 回调
     * @param scene [可选] 默认值=null 场景，如果存在则添加到该场景上
     */
    static showDamage(targetBattler: ProjectClientSceneObject, damageType: number, damage: number = 0, isCrit: boolean = false, onFin: Callback = null, scene: ClientScene = null, lastRelease: boolean = null): void {
        if (lastRelease == null) lastRelease = this.currentHitTimes == this.totalHitTimes - 1;
        if (scene == null) scene = targetBattler.scene;
        // 取整
        damage = Math.trunc(damage);
        // 伤害显示对应的界面
        let uiID: number;
        switch (damageType) {
            case -2:
                uiID = 0;
                break;
            case -1:
                uiID = 1041;
                break;
            default:
                uiID = 1042 + damageType;
                break;
        }
        // 显示伤害（治疗）文字效果
        if (uiID != 0) {
            let damageUI = GameUI.load(uiID, true);
            damageUI.x = targetBattler.x;
            damageUI.y = targetBattler.y;
            scene.animationHighLayer.addChild(damageUI);
            let targetUI = damageUI["target"];
            if (!targetUI) targetUI = damageUI.getChildAt(0);
            if (targetUI) {
                if (damageType >= 0) {
                    let damageLabel: UIString = damageUI["damage"];
                    if (damageLabel && damageLabel instanceof UIString) {
                        damageLabel.text = (damage > 0 ? "+" : "") + damage.toString();
                    }
                }
                let damageAni = new GCAnimation();
                damageAni.target = targetUI;
                damageAni.once(GCAnimation.PLAY_COMPLETED, this, () => {
                    damageAni.dispose();
                    damageUI.dispose();
                    if (lastRelease) {
                        onFin && onFin.run();
                    }
                });
                damageAni.id = isCrit ? 1047 : 1046;
                damageAni.play();
                if (!lastRelease) {
                    onFin && onFin.run();
                }
                return;
            }
        }
        onFin && onFin.run();
    }
    //------------------------------------------------------------------------------------------------------
    // 指示器
    //------------------------------------------------------------------------------------------------------
    /**
     * 开启移动指示器
     * @param battler 战斗者
     */
    static openMoveIndicator(battler: ProjectClientSceneObject): void {
        let battlerModule = battler.getModule(6) as SoModule_Battler;
        let atkRangeRef = WorldData.showAtkRangeRef ? GameBattleHelper.getBattlerAtkRangeReference(battler) : 0;
        let extraGridRangeThroughObs = false;
        if (atkRangeRef != 0) {
            extraGridRangeThroughObs = (battlerModule.actor.atkMode == 0 ? battlerModule.actor.isThroughObstacle : battlerModule.actor.atkSkill.isThroughObstacle);
        }
        let obstacleMode = GameBattleHelper.getMoveObstacleMode(battlerModule.actor, battler);
        // 同阵营单位可作为路径穿越对象，但移动终点不能与任何战斗者重叠。
        this.battlerEffectIndicatorGridArr = this.openBattlerEffectRangeGrid(battler, battlerModule.actor.MoveGrid, obstacleMode, 0, 0, null, atkRangeRef, true, false, extraGridRangeThroughObs, true);
    }
    /**
     * 开启攻击指示器
     */
    static openAtkIndicator(battler: ProjectClientSceneObject): void {
        let atkRange = 1;
        this.battlerEffectIndicatorGridArr = this.openBattlerEffectRangeGrid(battler, atkRange, 1, 0, 0, null, 0, false, battler.battlerSetting.actor.isThroughObstacle);
    }
    /**
     * 开启技能指示器
     */
    static openSkillIndicator(battler: ProjectClientSceneObject, skill: Module_Skill): void {
        // 被动技能
        if (skill.skillType == 2) return;
        // 打开技能指示器
        this.battlerEffectIndicatorGridArr = this.openBattlerSkillEffectRangeGird(battler, skill);
        // 多体的情况则会开启释放范围显示
        if (skill.targetType == 5 || skill.targetType == 6) {
            this.battlerRelaseIndicatorGridArr = this.openBattlerReleaseRangeGrid(skill, battler);
        }
    }
    /**
     * 打开道具指示器
     */
    static openItemIndicator(battler: ProjectClientSceneObject, item: Module_Item = null): void {
        let selfTargetOnly = RogueSkillSynergySystem.isSelfTargetItem(item);
        let itemRange = WorldData.actorItemAllowToOthers && !selfTargetOnly ? 1 : 0;
        this.battlerEffectIndicatorGridArr = this.openBattlerEffectRangeGrid(battler, itemRange, 2);
    }
    /**
     * 开启交换指示器
     */
    static openExchangeIndicator(battler: ProjectClientSceneObject): void {
        let exchangeItemRange = 1;
        this.battlerEffectIndicatorGridArr = this.openBattlerEffectRangeGrid(battler, exchangeItemRange, 1);
    }
    /**
     * 关闭移动指示器
     */
    static closeMoveIndicator(): void {
        this.closeBattlerEffectRangeGrid();
    }
    /**
     * 关闭技能指示器
     */
    static closeBattleIndicator(): void {
        this.closeBattlerEffectRangeGrid();
        this.closeBattlerReleaseRangeGrid();
    }
    /**
     * 打开战斗者的技能作用范围
     */
    private static openBattlerSkillEffectRangeGird(battler: ProjectClientSceneObject, skill: Module_Skill) {
        // 关闭作用范围
        this.closeBattlerEffectRangeGrid();
        // 获得作用范围格子数据
        let grids = GameBattleHelper.getSkillEffectRangeGrid(battler.posGrid, skill, battler);
        // 创建作用范围显示对象
        for (let i = 0; i < grids.length; i++) {
            let grid = grids[i];
            let effectGridAni = GameBattleHelper.createEffectGrid(grid.x, grid.y, 1, battler);
            this.battlerEffectGridAniArr.push(effectGridAni);
        }
        return grids;
    }
    /**
     * 打开战斗者的作用范围
     * @param battler 战斗者
     * @param range 范围格子数
     * @param obstacleMode 计算障碍的模式 默认值=0 计算障碍的模式 0-计算所有障碍 1-仅计算地图固定障碍 2-不计算障碍 3-计算所有障碍但不包括敌军（必须填入fromBattler以便区分敌军） 4-计算所有障碍但不包括友军 6-计算除飞行单位外的所有障碍
     * @param rangeMode [可选] 默认值=0 范围模式 0-普通范围 1-min-range范围 2-自定义范围
     * @param minRange [可选] 默认值=0 最短值，低于该值不允许出现
     * @param customRangeData [可选] 默认值=null 自定义范围数据
     * @param extraGridRange [可选] 默认值=0 额外的格子显示范围  
     * @param includeSelfBattler [可选] 默认值=false 包含自己
     * @param isThroughObstacle [可选] 默认值=false 是否穿透障碍（如作用范围可穿透墙壁）
     * @param extraGridRangeThroughObs [可选] 默认值=false 是否穿透障碍（如作用范围可穿透墙壁）
     */
    private static openBattlerEffectRangeGrid(battler: ProjectClientSceneObject, range: number, obstacleMode: number = 0, rangeMode: number = 0, minRange: number = 0,
        customRangeData: { size: number, gridData: number[][] } = null, extraGridRange: number = 0, includeSelfBattler: boolean = false, isThroughObstacle: boolean = false, extraGridRangeThroughObs: boolean = false, excludeBattlers: boolean = false): Point[] {
        // 关闭作用范围
        this.closeBattlerEffectRangeGrid();
        // 获得作用范围格子数据
        let addGridsList = null;
        if (includeSelfBattler) {
            addGridsList = [battler.posGrid];
        }
        let grids = GameBattleHelper.getEffectRange(battler.posGrid, range, obstacleMode, rangeMode, minRange, customRangeData, isThroughObstacle, addGridsList, battler, excludeBattlers);
        // 创建作用范围显示对象
        for (let i = 0; i < grids.length; i++) {
            let grid = grids[i];
            let effectGridAni = GameBattleHelper.createEffectGrid(grid.x, grid.y, 1, battler);
            this.battlerEffectGridAniArr.push(effectGridAni);
        }
        // 剔除掉存在grids的坐标（仅计算地图固定障碍的模式作为对比参考-计算出额外（可攻击）的范围）
        if (extraGridRange != 0) {
            // 获取指定range的范围-敌军不作为障碍计算
            let normalGrids = grids;//GameBattleHelper.getEffectRange(battler.posGrid, range, obstacleMode, rangeMode, minRange, customRangeData, false, null, battler);
            let extraGrids = GameBattleHelper.getEffectRange(battler.posGrid, range + extraGridRange, 3, rangeMode, Math.max(0, minRange - extraGridRange), customRangeData, extraGridRangeThroughObs, null, battler);
            for (let i = 0; i < extraGrids.length; i++) {
                let extraGrid = extraGrids[i];
                // -- 如果不在normalGrids的话则添加
                if (ArrayUtils.matchAttributes(normalGrids, { x: extraGrid.x, y: extraGrid.y }, true).length == 0) {
                    if (aroundHasNormalGrid(extraGrid, normalGrids)) {
                        // -- 且该格子邻近的1格内存在normalGrids
                        let effectGridAni = GameBattleHelper.createEffectGrid(extraGrid.x, extraGrid.y, 2, battler);
                        this.battlerEffectExtGridAniArr.push(effectGridAni);
                    }
                }
            }
        }
        /**
         * 游戏制作
         * @param extraGrid 
         * @param normalGrids 
         * @return [boolean] 
         */
        function aroundHasNormalGrid(extraGrid: Point, normalGrids: Point[]): boolean {
            const around = [[0, 1], [0, -1], [1, 0], [-1, 0]];
            for (let i = 0; i < 4; i++) {
                let dp = around[i];
                let tpX = extraGrid.x + dp[0];
                let tpY = extraGrid.y + dp[1];
                if (ArrayUtils.matchAttributes(normalGrids, { x: tpX, y: tpY }, true).length == 1) {
                    return true;
                }
            }
            return false;
        }

        return grids;
    }
    /**
     * 打开释放范围
     */
    private static openBattlerReleaseRangeGrid(skill: Module_Skill, battler: ProjectClientSceneObject): Point[] {
        // 关闭作用范围
        this.closeBattlerReleaseRangeGrid();
        let grids = GameBattleHelper.getSkillReleaseRangeGrid(skill, battler);
        // 创建作用范围显示对象
        for (let i = 0; i < grids.length; i++) {
            let grid = grids[i];
            let effectGridAni = GameBattleHelper.createEffectGrid(0, 0, 2, battler);
            if (effectGridAni) {
                effectGridAni.data = grid;
                this.battlerEffectReleaseGridAniArr.push(effectGridAni);
            }
        }
        // 开启释放范围
        this.openReleaseGridCursor = true;
        return grids;
    }
    /**
     * 打开释放范围光标效果（注册帧刷事件跟随光标）
     */
    private static set openReleaseGridCursor(v: boolean) {
        this._openReleaseGridCursor = v;
        if (v) {
            os.remove_ENTERFRAME(this.onUpdateReleaseGridCursor, this);
            os.add_ENTERFRAME(this.onUpdateReleaseGridCursor, this);
            this.onUpdateReleaseGridCursor();
        }
        else {
            os.remove_ENTERFRAME(this.onUpdateReleaseGridCursor, this);
        }
    }
    private static get openReleaseGridCursor(): boolean {
        return this._openReleaseGridCursor;
    }
    /**
     * 刷新释放范围光标
     */
    private static onUpdateReleaseGridCursor() {
        let cursorGridPos = GameBattleHelper.cursorGridPoint;
        let cursor = GameBattleHelper.cursor;
        // 战斗
        for (let i = 0; i < this.battlerEffectReleaseGridAniArr.length; i++) {
            let releaseAni = this.battlerEffectReleaseGridAniArr[i];
            let localGrid: Point = releaseAni.data;
            let inSceneGridX = cursorGridPos.x + localGrid.x;
            let inSceneGridY = cursorGridPos.y + localGrid.y;
            // 场景越界则忽略显示
            if (Game.currentScene.sceneUtils.isOutsideByGrid(new Point(inSceneGridX, inSceneGridY))) {
                releaseAni.visible = false;
                continue;
            }
            releaseAni.visible = true;
            let aniX = inSceneGridX * Config.SCENE_GRID_SIZE + Config.SCENE_GRID_SIZE * 0.5;
            let aniY = inSceneGridY * Config.SCENE_GRID_SIZE + Config.SCENE_GRID_SIZE * 0.5;
            // 释放函数
            releaseAni.x = aniX;
            releaseAni.y = aniY;
        }
    }
    /**
     * 关闭作用范围
     */
    private static closeBattlerEffectRangeGrid(): void {
        for (let i = 0; i < this.battlerEffectGridAniArr.length; i++) {
            let ani = this.battlerEffectGridAniArr[i];
            ani && ani.dispose();
        }
        this.battlerEffectGridAniArr.length = 0;
        for (let i = 0; i < this.battlerEffectExtGridAniArr.length; i++) {
            let ani = this.battlerEffectExtGridAniArr[i];
            ani && ani.dispose();
        }
        this.battlerEffectExtGridAniArr.length = 0;
    }
    /**
     * 关闭释放范围
     */
    private static closeBattlerReleaseRangeGrid(): void {
        for (let i = 0; i < this.battlerEffectReleaseGridAniArr.length; i++) {
            this.battlerEffectReleaseGridAniArr[i].dispose();
        }
        this.battlerEffectReleaseGridAniArr.length = 0;
        this.openReleaseGridCursor = false;
    }
    //------------------------------------------------------------------------------------------------------
    //  动作&动画
    //------------------------------------------------------------------------------------------------------
    /**
     * 释放战斗者动作
     * @param battler 战斗者
     * @param actionID 动作
     * @param releaseFrame 释放的帧数 
     * @param whenCompleteActionID 当释放完毕后恢复的动作编号 
     * @param onRelease 当释放完成时回调
     */
    static releaseAction(battler: ProjectClientSceneObject, actionID: number, releaseFrame: number, whenCompleteActionID: number, onRelease: Function): void {
        // 存在该动作的话：播放该动作后进入下一个阶段
        let avatar = battler.avatar;
        let hasAtkAction = avatar.hasActionID(actionID);
        if (hasAtkAction) {
            let isReleaseAction = false;
            let onRender = () => {
                // 超过击中帧数时则进入「击中阶段」
                if (avatar.currentFrame >= releaseFrame) {
                    //@ts-ignore
                    avatar.off(Avatar.RENDER, avatar, arguments.callee);
                    onRelease();
                    isReleaseAction = true;
                }
            }
            // 监听当动作播放完毕时，播放完毕后的动作
            avatar.once(Avatar.ACTION_PLAY_COMPLETED, this, () => {
                if (battler.isDisposed) return;
                avatar.off(Avatar.RENDER, avatar, onRender);
                // 如果其动作已经被更改了则忽略
                if (avatar.actionID != actionID) return;
                // 如果发生了一些变更
                let battlerModule = battler.getModule(6) as SoModule_Battler;
                if (!GameBattleHelper.isBattler(battler) || battlerModule.isDead) return;
                // 完成后变更的动作
                avatar.actionID = whenCompleteActionID;
                // 如果未能释放则直接释放
                if (!isReleaseAction) onRelease();
            });
            // 监听满足攻击帧数时
            avatar.on(Avatar.RENDER, avatar, onRender);
            // 切换至攻击动作，从第1帧开始播放
            avatar.currentFrame = 1;
            avatar.actionID = actionID;
        }
        // 没有攻击动作时直接进入下一个阶段
        else {
            onRelease();
        }
    }
    /**
     * 播放释放动画：等待释放完成
     * @param target 目标战斗者
     * @param targetActor 目标角色数据
     * @param isAtk 是否攻击
     * @param skill 技能
     * @param onFin[可选] 默认值=null 回调
     * @return 是否等待动画播放完毕
     */
    static playReleaseAnimation(target: ProjectClientSceneObject, targetActor: Module_Actor, isAtk: boolean, skill: Module_Skill, onFin: Function = null) {
        let releaseAnimation: number = skill?.releaseAnimation;
        let waitReleaseAnimationOver = skill?.waitReleaseAnimationOver;
        if (isAtk && targetActor.atkMode == 1 && targetActor.atkSkill) {
            releaseAnimation = targetActor.atkSkill.releaseAnimation;
            waitReleaseAnimationOver = targetActor.atkSkill.waitReleaseAnimationOver;
        }
        if (releaseAnimation != null) {
            let relaseAni = target.playAnimation(releaseAnimation, false, true);
            if (relaseAni && waitReleaseAnimationOver && onFin) {
                let nextStep = false;
                relaseAni.once(GCAnimation.PLAY_COMPLETED, this, () => {
                    if (!nextStep) {
                        nextStep = true;
                        onFin && onFin.apply(this);
                    }
                });
                relaseAni.once(GCAnimation.SIGNAL, this, (signalID: number) => {
                    if (signalID == 1) {
                        if (!nextStep) {
                            nextStep = true;
                            onFin && onFin.apply(this);
                        }
                    }
                })
                return true;
            }
            else {
                onFin && onFin.apply(this);
            }
        }
        else {
            onFin && onFin.apply(this);
        }
        return false;
    }
    //------------------------------------------------------------------------------------------------------
    //  特殊效果
    //------------------------------------------------------------------------------------------------------
    /**
     * 反击
     * @return [boolean] 是否反击
     */
    private static effect_counterattack(actionType: number, fromBattler: ProjectClientSceneObject, targetBattler: ProjectClientSceneObject, skill: Module_Skill, isMelee: boolean, damageType: number): boolean {
        // 施放者
        let fromBattlerModule = fromBattler.getModule(6) as SoModule_Battler;
        let targetBattlerModule = targetBattler.getModule(6) as SoModule_Battler;
        // 特殊效果：反击
        if (actionType <= 1 && !this.seCounterattack) {
            // -- 普通攻击或攻击类技能
            if (actionType == 0 || (actionType == 1 && GameBattleHelper.isHostileSkill(skill) && skill.targetType == 2)) {
                if (targetBattlerModule.actor.hp != 0 && fromBattlerModule.actor.hp != 0 && !targetBattlerModule.isDead && !fromBattlerModule.isDead) {
                    let counterattackDmagePer = GameBattleHelper.getCounterattackDamagePer(fromBattler, targetBattler, isMelee, damageType);
                    if (counterattackDmagePer != null) {
                        this.reverseBattler = targetBattler;
                        this.seCounterattack = true;
                        this.seCounterattackDamagePer = counterattackDmagePer;
                        let isAttack = targetBattlerModule.actor.atkMode == 0 || !targetBattlerModule.actor.atkSkill;
                        // 执行片段事件-战斗过程：普通攻击
                        setTimeout(() => {
                            if (!WorldData.battleSceneEnabled) {
                                // 光标指向攻击者
                                this.cursorMoveToGridPoint(fromBattler.posGrid, () => {
                                    // 反击对应的事件
                                    this.execUseCounterattackEvent(isAttack, targetBattlerModule.actor.atkSkill, targetBattler, fromBattler, fromBattler, () => {
                                        let doHitTarget = () => {
                                            this.execReleaseCounterattackEvent(isAttack, targetBattlerModule.actor.atkSkill, targetBattler, fromBattler, () => {
                                                if (!isAttack) {
                                                    this.hitTarget(targetBattler, fromBattler, 1, targetBattlerModule.actor.atkSkill, null, null);
                                                }
                                                else {
                                                    this.hitTarget(targetBattler, fromBattler, 0, null, null, null);
                                                }
                                            });
                                        }
                                        let waitReleaseAnimationOver = GameBattleAction.playReleaseAnimation(targetBattler, targetBattlerModule.actor, true, null, () => {
                                            if (waitReleaseAnimationOver) doHitTarget.apply(this);
                                        });
                                        GameBattleAction.releaseAction(targetBattler, 3, targetBattlerModule.actor.hitFrame, 1, () => {
                                            if (!waitReleaseAnimationOver) doHitTarget.apply(this);
                                        });
                                    });
                                });
                            }
                        }, WorldData.actionReflectionTime);
                        return true;
                    }
                }
            }
        }
        else {
            this.seCounterattack = false;
            this.seCounterattackDamagePer = null;
        }
        return false;
    }
    //------------------------------------------------------------------------------------------------------
    // 相关事件
    //------------------------------------------------------------------------------------------------------
    /**
     * 执行-使用反击事件（根据攻击或技能执行对应的使用事件）
     */
    static execUseCounterattackEvent(isAttack: boolean, skill: Module_Skill, fromBattler: ProjectClientSceneObject, targetBattler: ProjectClientSceneObject, onlyOneTarget: ProjectClientSceneObject, onFin: Function) {
        if (isAttack) {
            this.execUseAttkckEvent(fromBattler, targetBattler, onFin);
        }
        else {
            this.execUseSkillEvent(skill, fromBattler, onlyOneTarget, onFin);
        }
    }
    /**
     * 执行-释放反击事件（根据攻击或技能执行对应的使用事件）
     */
    static execReleaseCounterattackEvent(isAttack: boolean, skill: Module_Skill, fromBattler: ProjectClientSceneObject, targetBattler: ProjectClientSceneObject, onFin: Function) {
        if (isAttack) {
            this.execReleaseAttackEvent(fromBattler, targetBattler, onFin);
        }
        else {
            this.execReleaseSkillEvent(skill, fromBattler, onFin);
        }
    }
    /**
     * 执行-角色的使用攻击事件（使用技能代替攻击不调用此函数）
     * -- 事件库攻击事件 => 角色的攻击事件 
     * -- 战斗结束的情况下不再会回调
     * @param fromBattler 来源
     * @param targetBattler 目标
     * @param onFin
     */
    static execUseAttkckEvent(fromBattler: ProjectClientSceneObject, targetBattler: ProjectClientSceneObject, onFin: Function): void {
        let fromBattlerModule = fromBattler.getModule(6) as SoModule_Battler;
        // 是否进入战斗画面
        let useBattleScene = WorldData.battleSceneEnabled;
        // 角色-使用攻击事件
        function fromActorUseAttackEvent(actor: Module_Actor, onFin: Function) {
            if (!useBattleScene && actor.eventSetting && actor.useAtkEvent) {
                CommandPage.startTriggerFragmentEvent(actor.useAtkEvent, fromBattler, targetBattler, Callback.New(onFin, this));
            }
            else onFin.apply(this);
        }
        // 事件库-普通攻击事件
        function execCommonAtkEvent(onFin: Function) {
            GameCommand.startCommonCommand(14035, [], Callback.New(onFin, this), fromBattler, targetBattler);
        }
        execCommonAtkEvent(() => {
            GameBattle.battlerfieldDetermineHandle(() => {
                fromActorUseAttackEvent.call(this, fromBattlerModule.actor, () => {
                    GameBattle.battlerfieldDetermineHandle(() => {
                        onFin.apply(this);
                    });
                });
            });
        });
    }
    /**
     * 执行-角色的释放攻击事件（使用技能代替攻击不调用此函数）
     * -- 战斗结束的情况下不再会回调
     * @param skill 技能
     * @param fromBattler 来源
     * @param onFin 
     */
    static execReleaseAttackEvent(fromBattler: ProjectClientSceneObject, targetBattler: ProjectClientSceneObject, onFin: Function): void {
        let fromBattlerModule = fromBattler.getModule(6) as SoModule_Battler;
        // 角色-释放技能事件
        function fromActorReleaseAttackEvent(actor: Module_Actor, onFin: Function) {
            if (actor.eventSetting && actor.releaseAtkEvent) {
                CommandPage.startTriggerFragmentEvent(actor.releaseAtkEvent, fromBattler, targetBattler, Callback.New(onFin, this));
            }
            else onFin.apply(this);
        }
        fromActorReleaseAttackEvent.call(this, fromBattlerModule.actor, () => {
            GameBattle.battlerfieldDetermineHandle(() => {
                onFin.apply(this);
            });
        });
    }
    /**
     * 执行-角色/技能的技能使用事件
     * -- 战斗结束的情况下不再会回调
     * @param skill 技能
     * @param fromBattler 来源
     * @param onFin 
     */
    static execUseSkillEvent(skill: Module_Skill, fromBattler: ProjectClientSceneObject, onlyOneTarget: ProjectClientSceneObject, onFin: Function): void {
        let fromBattlerModule = fromBattler.getModule(6) as SoModule_Battler;
        // 是否进入战斗画面
        let useBattleScene = skill.targetType == 2 && WorldData.battleSceneEnabled;
        // 事件库-使用技能事件
        function execCommonEventUseSkillEvent(onFin: Function) {
            GameCommand.startCommonCommand(14036, [], Callback.New(onFin, this), fromBattler, onlyOneTarget ? onlyOneTarget : fromBattler);
        }
        // 角色-使用技能事件
        function fromActorUseSkillEvent(actor: Module_Actor, onFin: Function) {
            if (!useBattleScene && actor.eventSetting && actor.useEvent) {
                CommandPage.startTriggerFragmentEvent(actor.useEvent, fromBattler, onlyOneTarget ? onlyOneTarget : fromBattler, Callback.New(onFin, this));
            }
            else onFin.apply(this);
        }
        // 技能-使用技能事件
        function skillUseSkilEvent(skill: Module_Skill, onFin: Function) {
            if (!useBattleScene && skill.eventSetting && skill.useEvent) {
                CommandPage.startTriggerFragmentEvent(skill.useEvent, fromBattler, onlyOneTarget ? onlyOneTarget : fromBattler, Callback.New(onFin, this));
            }
            else onFin.apply(this);
        }
        execCommonEventUseSkillEvent(() => {
            GameBattle.battlerfieldDetermineHandle(() => {
                let onlyOneTargetModule = onlyOneTarget?.getModule(6) as SoModule_Battler;
                // 如果仅有一个目标且已经被击中过或死亡则跳过此次战斗行为（比如事件中制作了战斗演出等事件）
                if (onlyOneTarget && (onlyOneTargetModule.hitBy || onlyOneTargetModule.isDead)) {
                    this.actionComplete(true, true);
                    return;
                }
                fromActorUseSkillEvent.call(this, fromBattlerModule.actor, () => {
                    GameBattle.battlerfieldDetermineHandle(() => {
                        skillUseSkilEvent.call(this, skill, () => {
                            GameBattle.battlerfieldDetermineHandle(() => {
                                onFin.apply(this);
                            })
                        });
                    })
                });
            });
        });
    }
    /**
     * 执行-角色/技能的技能释放事件
     * -- 战斗结束的情况下不再会回调
     * @param skill 技能
     * @param fromBattler 来源
     * @param onFin 
     */
    static execReleaseSkillEvent(skill: Module_Skill, fromBattler: ProjectClientSceneObject, onFin: Function): void {
        let fromBattlerModule = fromBattler.getModule(6) as SoModule_Battler;
        // 角色-释放技能事件
        function fromActorReleaseSkillEvent(actor: Module_Actor, onFin: Function) {
            if (actor.eventSetting && actor.releaseEvent) {
                CommandPage.startTriggerFragmentEvent(actor.releaseEvent, fromBattler, fromBattler, Callback.New(onFin, this));
            }
            else onFin.apply(this);
        }
        // 技能-释放技能事件
        function skillReleaseSkilEvent(skill: Module_Skill, onFin: Function) {
            if (skill.eventSetting && skill.releaseEvent) {
                CommandPage.startTriggerFragmentEvent(skill.releaseEvent, fromBattler, fromBattler, Callback.New(onFin, this));
            }
            else onFin.apply(this);
        }
        fromActorReleaseSkillEvent.call(this, fromBattlerModule.actor, () => {
            GameBattle.battlerfieldDetermineHandle(() => {
                skillReleaseSkilEvent.call(this, skill, () => {
                    GameBattle.battlerfieldDetermineHandle(() => {
                        onFin.apply(this);
                    })
                });
            })
        });
    }
    /**
     * 执行-击中目标和被击中的事件（普通攻击/技能）
     * -- 战斗结束的情况下不再会回调
     * @param skill 技能
     * @param fromBattler 来源
     * @param onFin 
     */
    static execHitTargetEvent(skill: Module_Skill, fromBattler: ProjectClientSceneObject, targetBattler: ProjectClientSceneObject, onFin: Function): void {
        let fromBattlerModule = fromBattler.getModule(6) as SoModule_Battler;
        if (!targetBattler) targetBattler = fromBattler;
        // 角色-击中目标事件
        function fromActorHitEvent(actor: Module_Actor, onFin: Function) {
            if (actor.eventSetting && actor.hitEvent) {
                CommandPage.startTriggerFragmentEvent(actor.hitEvent, fromBattler, targetBattler, Callback.New(onFin, this));
            }
            else onFin.apply(this);
        }
        // 技能-击中目标事件
        function skillHitEvent(skill: Module_Skill, onFin: Function) {
            if (skill && skill.eventSetting && skill.hitEvent) {
                CommandPage.startTriggerFragmentEvent(skill.hitEvent, fromBattler, targetBattler, Callback.New(onFin, this));
            }
            else onFin.apply(this);
        }
        // 被击中事件
        function hitByEvent(onFin: Function) {
            let targetBattlerModule = targetBattler.getModule(6) as SoModule_Battler;
            if (GameBattleHelper.isHostileRelationship(fromBattler, targetBattler) && targetBattlerModule.actor.eventSetting && targetBattlerModule.actor.hitByEvent) {
                CommandPage.startTriggerFragmentEvent(targetBattlerModule.actor.hitByEvent, fromBattler, targetBattler, Callback.New(onFin, this));
            }
            else onFin.apply(this);
        }
        fromActorHitEvent.call(this, fromBattlerModule.actor, () => {
            GameBattle.battlerfieldDetermineHandle(() => {
                skillHitEvent.call(this, skill, () => {
                    GameBattle.battlerfieldDetermineHandle(() => {
                        hitByEvent.call(this, () => {
                            GameBattle.battlerfieldDetermineHandle(() => {
                                onFin.apply(this);
                            });
                        });
                    })
                });
            })
        });
    }
    /**
     * 执行-角色的事件库死亡事件
     */
    static execCommonDieEvent(fromBattler: ProjectClientSceneObject, onFin: Function): void {
        function execDieCommonEvent(onFin: Function) {
            GameCommand.startCommonCommand(14042, [], Callback.New(onFin, this), fromBattler, fromBattler);
        }
        execDieCommonEvent(() => {
            onFin.apply(this);
        });
    }
    /**
     * 执行-角色的死亡事件
     */
    static execActorDieEvent(fromBattler: ProjectClientSceneObject, onFin: Function): void {
        let fromBattlerModule = fromBattler.getModule(6) as SoModule_Battler;
        function execActorDieEvent(onFin: Function) {
            if (fromBattlerModule.actor.eventSetting && fromBattlerModule.actor.dieEvent) {
                CommandPage.startTriggerFragmentEvent(fromBattlerModule.actor.dieEvent, fromBattler, fromBattler, Callback.New(onFin, this));
            }
            else onFin.apply(this);
        }
        execActorDieEvent(() => {
            onFin.apply(this);
        });
    }

    /**
     * 移动时事件执行
     * @param fromBattler 
     */
    static execMoveEvent(fromBattler: ProjectClientSceneObject): void {
        let fromBattlerModule = fromBattler.getModule(6) as SoModule_Battler;
        if (fromBattlerModule.actor.eventSetting && fromBattlerModule.actor.moveEvent) {
            fromBattler.once(ProjectClientSceneObject.MOVE_START, this, () => {
                movingEvent.apply(this);
                os.add_ENTERFRAME(movingEvent, this);
            })
            fromBattler.once(ProjectClientSceneObject.MOVE_OVER, this, () => {
                os.remove_ENTERFRAME(movingEvent, this);
            })
            let isExecuting = false;
            //@ts-ignore
            function movingEvent() {
                if (isExecuting) return;
                isExecuting = true;
                CommandPage.startTriggerFragmentEvent(fromBattlerModule.actor.moveEvent, fromBattler, fromBattler, Callback.New(() => {
                    isExecuting = false;
                }, this));
            }
        }
    }
}
