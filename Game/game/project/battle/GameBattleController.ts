/**
 * 战斗控制器
 * Created by 黑暗之神KDS on 2021-01-14 15:08:03.
 */
class GameBattleController {
    //------------------------------------------------------------------------------------------------------
    // 用以枚举
    //------------------------------------------------------------------------------------------------------
    /**
     * 阶段:开启了移动指示器
     */
    private static OPEN_MOVE_INDICATOR: number = 1;
    /**
     * 阶段:待机等待更换朝向
     */
    private static WAIT_CHANGE_ORI: number = 3;
    /**
     * 阶段:开启了攻击指示器
     */
    private static OPEN_ATK_INDICATOR: number = 4;
    /**
     * 阶段:开启了技能指示器
     */
    private static OPEN_SKILL_INDICATOR: number = 5;
    /**
     * 阶段:开启了道具指示器
     */
    private static OPEN_ITEM_INDICATOR: number = 6;
    /**
     * 阶段:开启了道具交换指示器
     */
    private static OPEN_ITEM_EXCHANGE_INDICATOR: number = 7;
    //------------------------------------------------------------------------------------------------------
    // 
    //------------------------------------------------------------------------------------------------------
    /**
     * 记录移动角色前的位置，并以此作为标识允许撤回
     */
    private static recordBattlerPostion: Point;
    /**
     * 记录移动过的战斗者
     */
    private static recordMovedBattler: ProjectClientSceneObject;
    /**
     * 记录移动者原面向
     */
    private static recordBattlerOldOri: number;
    /**
     * 玩家控制角色的阶段
     */
    private static playerControlBattlerStage: number = 0;
    /**
      * 当前玩家操作的战斗角色
      */
    static currentOperationBattler: ProjectClientSceneObject;
    /**
     * 当前控制角色的战斗方式 0-普通攻击 1-使用技能 2-使用道具 3-交换道具
     */
    private static currentBattleType: number = 0;
    /**
     * 当前控制角色的技能
     */
    private static currentBattleSkill: Module_Skill;
    /**
     * 当前控制角色的道具
     */
    private static currentBattleItem: Module_Item;
    /**
     * 是否正在战斗中打开队伍装备界面。
     * 打开期间冻结战斗流程，关闭后恢复当前战斗者菜单。
     */
    private static battleEquipmentOpened: boolean = false;
    //------------------------------------------------------------------------------------------------------
    // 实现用的变量
    //------------------------------------------------------------------------------------------------------
    private static cursorPosGrid: Point;
    private static sceneMoveFrame: number;
    //------------------------------------------------------------------------------------------------------
    // 
    //------------------------------------------------------------------------------------------------------
    /**
     * 初始化
     */
    static init(): void {

    }
    /**
     * 启动
     */
    static start(): void {
        // 初始化
        this.currentOperationBattler = null;
        this.playerControlBattlerStage = 0;
        this.cursorPosGrid = new Point(-1, -1);
        // 取消选中
        MouseControl.unselectOneSceneObject(MouseControl.selectSceneObject)
        // 鼠标事件
        Game.layer.sceneLayer.on(this.sceneActionEvent, this, this.onMouseDown);
        stage.on(EventObject.RIGHT_MOUSE_DOWN, this, this.onRightMouseUp);
        Game.layer.sceneLayer.on(EventObject.MOUSE_MOVE, this, this.onMouseMove);
        // 键盘事件
        stage.on(EventObject.KEY_DOWN, this, this.onKeyDown);
        // 监听技能选择
        EventUtils.addEventListenerFunction(GUI_BattleSkill, GUI_BattleSkill.EVENT_SELECT_SKILL, this.battleCommand_onSkillSelect, this);
        // 监听道具选择
        EventUtils.addEventListenerFunction(GUI_BattleItem, GUI_BattleItem.EVENT_SELECT_ITEM, this.battleCommand_onItemSelect, this);
        // 帧刷函数
        os.add_ENTERFRAME(this.onEnterFrame, this);
    }
    /**
     * 停止
     */
    static stop(): void {
        // 取消鼠标事件
        Game.layer.sceneLayer.off(this.sceneActionEvent, this, this.onMouseDown);
        stage.off(EventObject.RIGHT_MOUSE_DOWN, this, this.onRightMouseUp);
        Game.layer.sceneLayer.off(EventObject.MOUSE_MOVE, this, this.onMouseMove);
        // 取消键盘事件
        stage.off(EventObject.KEY_DOWN, this, this.onKeyDown);
        // 帧数
        os.remove_ENTERFRAME(this.onEnterFrame, this);
        // 取消监听
        EventUtils.removeEventListenerFunction(GUI_BattleSkill, GUI_BattleSkill.EVENT_SELECT_SKILL, this.battleCommand_onSkillSelect, this);
        EventUtils.removeEventListenerFunction(GUI_BattleItem, GUI_BattleItem.EVENT_SELECT_ITEM, this.battleCommand_onItemSelect, this);
        EventUtils.removeEventListenerFunction(GameBattleAction, GameBattleAction.EVENT_ONCE_ACTION_COMPLETE, this.reOpenBattleMenu, this);
        // 关闭窗口
        GameBattleAction.closeCurrentBattlerWindow();
        GameBattleAction.closeTargetBattlerWindow();
    }
    //------------------------------------------------------------------------------------------------------
    // 菜单接口
    //------------------------------------------------------------------------------------------------------
    /**
     * 待机：当前玩家可控角色对象进入待机
     */
    static battleCommand_standby() {
        // 不存在当前操作的角色或已行动过则忽略
        let battler = this.currentOperationBattler;
        if (!battler) return;
        // 清除允许撤回移动的标识
        this.recordMovedBattler = null;
        // 允许待机更换战斗者朝向时
        if (WorldData.standbyStepChangeOriEnabled) {
            // 待机等待更换朝向的状态
            GameBattleController.playerControlBattlerStage = GameBattleController.WAIT_CHANGE_ORI;
            WorldData.playCtrlEnabled = false;
            // 执行片段事件：开始更改战斗者朝向时事件
            GameCommand.startCommonCommand(14029, [], null, battler, battler);
        }
        // 否则直接待机
        else {
            // 待机效果
            let standby = GameBattleData.setBattlerStandby(battler);
            // 暖山再动触发后立即重新打开该角色的操作。
            if (!standby) {
                GameBattle.nextPlayerControl();
                return;
            }
            // 如果不存在任何可控制角色的话立刻跳到下一个阶段
            if (!GameBattleHelper.nextPlayerControlBattler) {
                GameBattle.nextPlayerControl();
            }
        }
    }
    /**
     * 操作完成
     * -- 结束控制角色行动
     * -- 结束回合且略过AI行动
     * @param skipAIOperaction 是否跳过我方AI操作
     */
    static battleCommand_controlComplete(skipAIOperaction: boolean) {
        let nextPlayerControlBattler: ProjectClientSceneObject;
        while (nextPlayerControlBattler = GameBattleHelper.nextPlayerControlBattler) {
            GameBattleData.setBattlerStandby(nextPlayerControlBattler);
        }
        // 跳过电脑操作
        if (skipAIOperaction) {
            GameBattle.nextStep();
        }
        else {
            GameBattle.nextPlayerControl();
        }
    }
    /**
     * 开启移动指示器：当前玩家可控角色对象开启移动范围显示
     */
    static battleCommand_openMoveIndicator(): void {
        // 不存在当前操作的角色或已行动过则忽略
        let battler = this.currentOperationBattler;
        if (!battler) return;
        // 忽略无法移动的场合
        if (!GameBattleHelper.canMove(battler)) return;
        // 设置玩家控制角色的阶段
        this.playerControlBattlerStage = GameBattleController.OPEN_MOVE_INDICATOR;
        // 打开移动范围显示
        GameBattleAction.openMoveIndicator(battler);
        // 禁止操作
        MouseControl.stop();
    }
    /**
     * 开启攻击指示器：当前玩家可控角色对象开启攻击范围显示
     */
    static battleCommand_openAtkIndicator(): void {
        // 不存在当前操作的角色或已行动过则忽略
        let battler = this.currentOperationBattler;
        if (!battler) return;
        // 忽略无法攻击的场合
        if (!GameBattleHelper.canAttack(battler)) return;
        // 设置玩家控制角色的阶段
        this.playerControlBattlerStage = GameBattleController.OPEN_ATK_INDICATOR;
        // 玩家控制开启了攻击指示器
        let battlerModule = battler.getModule(6) as SoModule_Battler;
        let isAtkUseSkill = battlerModule.actor.atkMode != 0;
        let atkSkill: Module_Skill = battlerModule.actor.atkSkill;
        if (isAtkUseSkill && atkSkill) {
            // 如果是全体技能则直接释放技能
            if (atkSkill.targetType >= 3 && atkSkill.targetType <= 4) {
                this.currentBattleSkill = atkSkill;
                this.selectBattleTargetOrArea();
                return;
            }
            // 设定为使用技能
            this.currentBattleType = 1;
            this.currentBattleSkill = battlerModule.actor.atkSkill;
            // 打开技能指示器
            GameBattleAction.openSkillIndicator(battler, battlerModule.actor.atkSkill);
        }
        else {
            // 设定为攻击
            this.currentBattleType = 0;
            // 打开攻击指示器
            GameBattleAction.openAtkIndicator(battler);
        }
    }
    /**
     * 开启技能指示器：当前玩家可控角色对象开启攻击范围显示
     * @param battler 战斗者
     * @param skill 技能
     */
    private static battleCommand_onSkillSelect(skill: Module_Skill) {
        let battler = this.currentOperationBattler;
        // 关闭战斗菜单
        this.closeBattlerMenu();
        // 记录当前选中的道具
        this.currentBattleSkill = skill;
        // 设置玩家控制角色的阶段
        this.playerControlBattlerStage = GameBattleController.OPEN_SKILL_INDICATOR;
        // 如果是全体技能则直接释放技能
        if (skill.targetType >= 3 && skill.targetType <= 4) {
            this.selectBattleTargetOrArea();
        }
        else {
            // 打开技能指示器
            GameBattleAction.openSkillIndicator(battler, skill);
        }
    }
    /**
     * 当道具选择时
     * @param battler 战斗者
     * @param item 道具
     */
    private static battleCommand_onItemSelect(item: Module_Item): void {
        let battler = this.currentOperationBattler;
        // 关闭战斗菜单
        this.closeBattlerMenu();
        // 记录当前选中的道具
        this.currentBattleItem = item;
        // 打开道具指示器
        GameBattleAction.openItemIndicator(battler, item);
        // 设置玩家控制角色的阶段
        this.playerControlBattlerStage = GameBattleController.OPEN_ITEM_INDICATOR;
    }
    /**
     * 打开道具交换指示器
     */
    static battleCommand_openItemExchangeIndicator(): void {
        // 不存在当前操作的角色或已行动过则忽略
        let battler = this.currentOperationBattler;
        if (!battler) return;
        // 设置玩家控制角色的阶段
        this.playerControlBattlerStage = GameBattleController.OPEN_ITEM_EXCHANGE_INDICATOR;
        // 设定为攻击
        this.currentBattleType = 3;
        // 打开攻击指示器
        GameBattleAction.openExchangeIndicator(battler);
    }
    /**
     * 确认更改朝向
     */
    static applyChangeBattlerOri() {
        // 准备阶段
        if (GameBattle.state == 1) {
            let readyUI: GUI_BattleReady = GameUI.get(21) as any;
            readyUI.nextSceneObjectCtrlOri();
        }
        // 战斗阶段
        else if (GameBattle.state == 2) {
            this.applyBattleStandByOri();
        }
    }
    //------------------------------------------------------------------------------------------------------
    // 呼出和关闭菜单
    //------------------------------------------------------------------------------------------------------
    /**
     * 打开战斗者菜单
     * @param battler 
     */
    static openBattlerMenu(battler: ProjectClientSceneObject) {
        // 记录当前的操作对象
        GameBattleController.currentOperationBattler = battler;
        // 打开战斗者菜单
        GameCommand.startCommonCommand(15014);
        // 显示当前操作者
        GameBattleAction.showCurrentBattlerWindow(battler);
        GameBattleAction.closeTargetBattlerWindow();
        // 关闭可能存在的移动指示器
        GameBattleAction.closeMoveIndicator();
        this.updateBattleActionCountUI();
    }
    /**
     * 玩家回合自由选择一个尚未完成行动的我方角色。
     * 默认的 nextPlayerControl() 顺序不受影响；该入口只处理玩家主动点击切换。
     */
    static selectPlayerBattlerForAction(battler: ProjectClientSceneObject): boolean {
        if (!GameBattle.freePlayerTurnOrderEnabled || !GameBattle.isPlayerTurn ||
            !GameBattle.playerControlEnabled || GameDialog.isInDialog ||
            this.playerControlBattlerStage != 0 || !battler) return false;
        if (!GameBattleHelper.isPlayerControlEnabledBattler(battler)) return false;
        let battlerModule = battler.getModule(6) as SoModule_Battler;
        if (!battlerModule || battlerModule.isDead || battlerModule.operationComplete) return false;

        // 点击当前角色只是重新聚焦菜单，不应丢失该角色刚完成移动后的撤回记录。
        if (this.currentOperationBattler == battler) {
            GameBattleHelper.cursor.setTo(battler.x, battler.y);
            GameBattleAction.cameraMoveToBattler(battler);
            this.openBattlerMenu(battler);
            return true;
        }

        // 切换角色后不再允许把之前角色的移动撤回记录误用于新角色。
        this.recordBattlerPostion = null;
        this.recordMovedBattler = null;
        this.recordBattlerOldOri = 0;
        this.playerControlBattlerStage = 0;

        let menuOpened = GameBattleHelper.isOpendBattleMenu;
        if (menuOpened && this.currentOperationBattler != battler) this.closeBattlerMenu();
        GameBattleHelper.cursor.setTo(battler.x, battler.y);
        GameBattleAction.cameraMoveToBattler(battler);
        this.openBattlerMenu(battler);
        return true;
    }
    /**
     * 更新战斗菜单中的剩余行动次数提示。旧版资源没有对应文本组件时安全忽略。
     */
    private static updateBattleActionCountUI(): void {
        let remaining = GameBattle.remainingPlayerActionCount;
        let battlerMenu = GameUI.get(22) as GUI_22;
        if (battlerMenu && battlerMenu.文本) battlerMenu.文本.text = `余${remaining}次`;
        let commonMenu = GameUI.get(23) as GUI_23;
        if (commonMenu && commonMenu.战斗菜单文本) commonMenu.战斗菜单文本.text = `剩余可行动角色：${remaining}`;
    }
    /**
     * 关闭战斗者菜单
     */
    static closeBattlerMenu() {
        GameCommand.startCommonCommand(15015);
    }
    /**
     * 打开通用菜单
     */
    static openBattleCommonMenu() {
        GameCommand.startCommonCommand(15016);
        this.updateBattleActionCountUI();
    }
    /**
     * 关闭通用菜单
     */
    static closeBattleCommonMenu() {
        GameCommand.startCommonCommand(15017);
    }
    /**
     * 重新打开技能栏
     */
    static reOpenSkillMenu() {
        GameCommand.startCommonCommand(15020);
    }
    /**
     * 关闭技能栏
     */
    static closeSkillMenu() {
        GameCommand.startCommonCommand(15019);
    }
    /**
     * 重新打开道具栏
     */
    static reOpenItemMenu() {
        GameCommand.startCommonCommand(15023);
    }
    /**
     * 关闭道具栏
     */
    static closeItemMenu() {
        GameCommand.startCommonCommand(15022);
    }
    /**
     * 打开状态栏
     */
    static openStatusMenu() {
        GameCommand.startCommonCommand(15024);
    }
    /**
     * 关闭状态栏
     */
    static closeStatusMenu() {
        GameCommand.startCommonCommand(15025);
    }
    /**
     * 战斗中打开装备界面。
     * 只允许在玩家自由操作阶段打开，避免敌方回合或行动演出期间修改属性。
     */
    static openBattleEquipmentMenu(): void {
        if (this.battleEquipmentOpened) return;
        if (!GameBattle.playerControlEnabled || GameDialog.isInDialog) return;
        if (this.playerControlBattlerStage != 0) return;
        let battler = this.currentOperationBattler;
        if (!battler || !GameBattleHelper.isPlayerControlEnabledBattler(battler)) return;
        let battlerModule = battler.getModule(6) as SoModule_Battler;
        if (!battlerModule || battlerModule.isDead) return;
        let inPartyIndex = ProjectPlayer.getPlayerActorIndexByActor(battlerModule.actor);
        if (inPartyIndex < 0) return;

        // 先关闭战斗者菜单和战斗者信息窗，避免其与装备界面叠加。
        this.closeBattlerMenu();
        GameBattleAction.closeCurrentBattlerWindow();
        GameBattleAction.closeTargetBattlerWindow();
        this.playerControlBattlerStage = 0;
        this.battleEquipmentOpened = true;
        GameBattle.playerControlEnabled = WorldData.playCtrlEnabled = false;

        let partyUI = GameUI.show(16) as GUI_Party;
        if (!partyUI) {
            this.battleEquipmentOpened = false;
            GameBattle.playerControlEnabled = WorldData.playCtrlEnabled = true;
            this.openBattlerMenu(battler);
            return;
        }
        partyUI.openBattleEquipmentTab(inPartyIndex);
    }
    /**
     * 战斗装备界面关闭后的恢复处理。
     */
    static onBattleEquipmentClosed(): void {
        if (!this.battleEquipmentOpened) return;
        this.battleEquipmentOpened = false;
        let battler = this.currentOperationBattler;
        // 无论战斗是否已经结束，都要解除打开装备页时设置的输入冻结。
        // 结算/切场景期间不再重开战斗者菜单，但不能把全局控制状态留在 false。
        GameBattle.playerControlEnabled = WorldData.playCtrlEnabled = true;
        if (GameBattle.state != 2 || !battler) return;
        let battlerModule = battler.getModule(6) as SoModule_Battler;
        if (!battlerModule || battlerModule.isDead) {
            GameBattle.nextPlayerControl();
            return;
        }
        GameBattleAction.cameraMoveToBattler(battler);
        this.openBattlerMenu(battler);
    }
    //------------------------------------------------------------------------------------------------------
    // 关闭菜单
    //------------------------------------------------------------------------------------------------------
    /**
     * 关闭战斗相关的菜单
     * @return [boolean] 是否关闭了菜单
     */
    private static closeMenu(): boolean {
        // 按照检查以下界面是否打开，打开的话则关闭掉
        let battleMenus = [[16, () => GameUI.hide(16)], [27, this.closeStatusMenu], [25, this.closeSkillMenu], [26, this.closeItemMenu], [22, this.closeBattlerMenu], [23, this.closeBattleCommonMenu]];
        for (let i = 0; i < battleMenus.length; i++) {
            let battleMenuInfo = battleMenus[i];
            let uiID = battleMenuInfo[0] as number;
            let closeFunction: Function = battleMenuInfo[1] as any;
            let battlerMenu = GameUI.get(uiID);
            if (battlerMenu && battlerMenu.stage) {
                closeFunction.apply(this);
                return true;
            }
        }
        return false;
    }
    //------------------------------------------------------------------------------------------------------
    // 鼠标键盘操作
    //------------------------------------------------------------------------------------------------------
    /**
     * 当按键按下时
     * @param e 
     */
    static onKeyDown(e: EventObject): void {
        // 非玩家自由行动阶段时不允许操作
        if (!GameBattle.playerControlEnabled || GameDialog.isInDialog) return;
        // 退出按键
        if (GUI_Setting.IS_KEY(e.keyCode, GUI_Setting.KEY_BOARD.B)) {
            this.onControllerBack();
        }
        // 确定键
        else if (GUI_Setting.IS_KEY(e.keyCode, GUI_Setting.KEY_BOARD.A)) {
            // 开启了战斗者菜单的话不允许操作
            if (GameBattleHelper.isOpendBattleMenu) return;
            this.onControllerSure();
        }
        // 方向键：更改朝向
        else if (GUI_Setting.IS_KEY(e.keyCode, GUI_Setting.KEY_BOARD.UP)) {
            if (this.playerControlBattlerStage == GameBattleController.WAIT_CHANGE_ORI) GameBattleController.currentOperationBattler.avatarOri = 8;
        }
        else if (GUI_Setting.IS_KEY(e.keyCode, GUI_Setting.KEY_BOARD.DOWN)) {
            if (this.playerControlBattlerStage == GameBattleController.WAIT_CHANGE_ORI) GameBattleController.currentOperationBattler.avatarOri = 2;
        }
        else if (GUI_Setting.IS_KEY(e.keyCode, GUI_Setting.KEY_BOARD.LEFT)) {
            if (this.playerControlBattlerStage == GameBattleController.WAIT_CHANGE_ORI) GameBattleController.currentOperationBattler.avatarOri = 4;
        }
        else if (GUI_Setting.IS_KEY(e.keyCode, GUI_Setting.KEY_BOARD.RIGHT)) {
            if (this.playerControlBattlerStage == GameBattleController.WAIT_CHANGE_ORI) GameBattleController.currentOperationBattler.avatarOri = 6;
        }
    }
    //------------------------------------------------------------------------------------------------------
    // 鼠标操作
    //------------------------------------------------------------------------------------------------------
    /**
     * 当鼠标点击时
     * @param e 
     */
    static onMouseDown(e: EventObject): void {
        if (TouchCameraControl.isPinching) return;
        // 非玩家自由行动阶段时不允许操作
        if (!GameBattle.playerControlEnabled || GameDialog.isInDialog) return;
        // 已打开技能栏、道具栏、状态栏：忽略
        if (GameUI.isOpened(25) || GameUI.isOpened(26) || GameUI.isOpened(27)) return;
        // 已打开通用菜单的情况
        if (GameUI.isOpened(23)) return;
        // 手机端轻点场景时通常不会先派发 MOUSE_MOVE，导致鼠标控制器
        // 仍保留上一次的场景对象和战斗光标位置。先按本次轻点刷新选中
        // 对象并把战斗光标同步到被点击的格子，这样角色和移动范围格子
        // 都可以直接触屏确认，不再依赖虚拟键盘的 A 键。
        MouseControl.updateSelectSceneObject();
        let inSceneMouseGridPoint = GameBattleHelper.inSceneMouseGridPoint;
        let inSceneMouseGridCenter = GameBattleHelper.inSceneMouseGridCenter;
        // 战斗中战斗者的 selectEnabled 会被关闭，不能依赖 MouseControl 的对象命中结果。
        // 用本次点击的格子同步光标，保证打开菜单时仍能点击切换其他我方角色。
        GameBattleHelper.cursor.setTo(inSceneMouseGridCenter.x, inSceneMouseGridCenter.y);
        // 获取鼠标选中的战斗者
        let mouseSelectedBattler = MouseControl.selectSceneObject;
        let mouseSelectedBattlerModule = mouseSelectedBattler?.getModule(6) as SoModule_Battler;
        if (!GameBattleHelper.isBattler(mouseSelectedBattler) || mouseSelectedBattlerModule.isDead) mouseSelectedBattler = null;
        // 获取光标所在位置
        // 已打开指示器
        if (this.playerControlBattlerStage > 0) {
            this.onControllerSure(true);
        }
        // 未打开指示器的情况
        else {
            // 未选中目标时还需要判断当前格子是否存在战斗者
            if (!mouseSelectedBattler) {
                let currentGridPos = new Point(inSceneMouseGridPoint.x, inSceneMouseGridPoint.y);
                let target = GameBattleHelper.getNoDeadBattlerByGrid(currentGridPos);
                if (target) mouseSelectedBattler = target;
            }
            // 存在选中目标的情况
            if (mouseSelectedBattler) {
                let isAlreadySelected = GameBattleHelper.overCursorNoDeadBattler == mouseSelectedBattler;
                // 我方阵营
                if (GameBattleHelper.isPlayerCamp(mouseSelectedBattler)) {
                    let selectedModule = mouseSelectedBattler.getModule(6) as SoModule_Battler;
                    if (GameBattleHelper.isPlayerControlEnabledBattler(mouseSelectedBattler) &&
                        selectedModule && !selectedModule.isDead && !selectedModule.operationComplete) {
                        // 开启自由行动顺序时，点击场上任意未完成角色即可切换。
                        if (this.selectPlayerBattlerForAction(mouseSelectedBattler)) return;
                        // 自由选择规则关闭时，仅允许重新聚焦当前角色，避免绕过默认顺序。
                        if (this.currentOperationBattler == mouseSelectedBattler) {
                            GameBattleController.openBattlerMenu(mouseSelectedBattler);
                        }
                        return;
                    }
                }
                // 已选中的话：查看状态
                if (isAlreadySelected) {
                    this.openStatusMenu();
                }
                // 未选中的情况则：选中
                else {
                    GameBattleController.closeBattlerMenu();
                }
            }
            // 仅移动光标
            else {
                Game.currentScene.camera.sceneObject = null;
                GameBattleAction.cursorJumpToGridPoint(inSceneMouseGridPoint);
                GameBattleController.closeBattlerMenu();
            }
            return;
        }
    }
    /**
     * 移动端在触摸结束后确认轻点，拖动和捏合由镜头控制器优先处理。
     */
    private static get sceneActionEvent(): string {
        return Browser.onMobile ? EventObject.CLICK : EventObject.MOUSE_DOWN;
    }
    /**
     * 鼠标移动
     * @param e 
     */
    static onMouseMove(e: EventObject): void {
        this.sceneMoveFrame = Game.frameCount;
        // 非玩家自由行动阶段时不允许操作
        if (!GameBattle.playerControlEnabled || GameDialog.isInDialog) return;
        // 已打开技能栏、道具栏、状态栏、更改朝向：忽略
        if (GameUI.isOpened(25) || GameUI.isOpened(26) || GameUI.isOpened(27) || GameUI.isOpened(33)) return;
        // 已打开通用菜单的情况
        if (GameUI.isOpened(23)) return;
        // 获取光标所在位置
        let inSceneMouseGridPoint = GameBattleHelper.inSceneMouseGridPoint;
        let inSceneMouseGridCenter = GameBattleHelper.inSceneMouseGridCenter;
        // 已打开指示器
        if (this.playerControlBattlerStage > 0) {
            if (this.playerControlBattlerStage == GameBattleController.OPEN_MOVE_INDICATOR ||
                this.playerControlBattlerStage == GameBattleController.OPEN_ATK_INDICATOR ||
                this.playerControlBattlerStage == GameBattleController.OPEN_SKILL_INDICATOR ||
                this.playerControlBattlerStage == GameBattleController.OPEN_ITEM_INDICATOR ||
                this.playerControlBattlerStage == GameBattleController.OPEN_ITEM_EXCHANGE_INDICATOR) {
                if (ArrayUtils.matchAttributes(GameBattleAction.battlerEffectIndicatorGridArr,
                    { x: inSceneMouseGridPoint.x, y: inSceneMouseGridPoint.y }, true).length != 0) {
                    GameBattleHelper.cursor.setTo(inSceneMouseGridCenter.x, inSceneMouseGridCenter.y);
                    let so = GameBattleHelper.overCursorNoDeadBattler;
                    if (so) this.onEnterFrame(so.posGrid, true);
                    else GameBattleAction.closeTargetBattlerWindow();
                }
            }
        }
        // 未打开指示器的情况下
        else if (!GameBattleHelper.isOpendBattleMenu) {
            let so = MouseControl.selectSceneObject;
            if (!so) so = GameBattleHelper.overCursorNoDeadBattler;
            if (so) {
                if (GameBattleHelper.isBattler(so)) {
                    let soBattlerModule = so.getModule(6) as SoModule_Battler;
                    if (!soBattlerModule.isDead) {
                        this.onEnterFrame(so.posGrid, true);
                        return;
                    }
                }
            }
            else {
                this.onEnterFrame(null, true);
            }
            this.cursorPosGrid.setTo(-1, -1);
        }
    }
    /**
     * 右键
     * @param e 
     */
    static onRightMouseUp(e: EventObject): void {
        // 非玩家自由行动阶段时不允许操作
        if (!GameBattle.playerControlEnabled || GameDialog.isInDialog) return;
        this.onControllerBack();
    }
    //------------------------------------------------------------------------------------------------------
    // 
    //------------------------------------------------------------------------------------------------------
    /**
     * 操作确定
     */
    private static onControllerSure(useMouse: boolean = false) {
        // 存在玩家控制阶段时
        if (this.playerControlBattlerStage > 0) {
            switch (this.playerControlBattlerStage) {
                case GameBattleController.OPEN_MOVE_INDICATOR:
                    // 移动操作的角色
                    this.operactionBattleMoveToCursorPostion();
                    return;
                case GameBattleController.WAIT_CHANGE_ORI:
                    // 应用待机朝向
                    if (!useMouse) this.applyBattleStandByOri();
                    return;
                case GameBattleController.OPEN_ATK_INDICATOR:
                    // 攻击：选择战斗目标或区域
                    this.selectBattleTargetOrArea();
                    return;
                case GameBattleController.OPEN_SKILL_INDICATOR:
                    // 技能：选择战斗目标或区域
                    this.selectBattleTargetOrArea();
                    return;
                case GameBattleController.OPEN_ITEM_INDICATOR:
                    // 道具：选择战斗目标或区域
                    this.selectBattleTargetOrArea();
                    return;
                case GameBattleController.OPEN_ITEM_EXCHANGE_INDICATOR:
                    // 交换道具：选择战斗目标或区域
                    this.selectBattleTargetOrArea();
                    return;
            }
        }
        // 当前光标选中的可控角色的话，显示战斗者菜单；自由顺序开启时走统一切换入口，
        // 确保键盘/手柄选择角色时也会清理上一角色的移动撤回记录。
        let cursorPlayerBattler = GameBattleHelper.overCursorPlayerCtrlEnabledBattler;
        if (cursorPlayerBattler) {
            if (this.selectPlayerBattlerForAction(cursorPlayerBattler)) return;
            if (this.currentOperationBattler == cursorPlayerBattler) {
                GameBattleController.openBattlerMenu(cursorPlayerBattler);
            }
        }
        // 否则非死亡的敌人则显示状态菜单
        else if (GameBattleHelper.overCursorNoDeadBattler) {
            this.openStatusMenu();
        }
    }
    /**
     * 操作返回
     */
    private static onControllerBack() {
        // 存在移动记录则撤回移动：未打开技能栏、道具栏、状态栏的情况下允许
        if (!(GameUI.isOpened(25) || GameUI.isOpened(26) || GameUI.isOpened(27))) {
            if (this.playerControlBattlerStage == 0 && this.recordMovedBattler) {
                this.cancelBattleMoveCommand();
                return;
            }
        }
        // 存在战斗菜单的话：关闭
        let isClosedMenu = this.closeMenu();
        if (isClosedMenu) {
            this.onEnterFrame(null, true);
            return;
        }
        // 存在玩家控制阶段时
        if (this.playerControlBattlerStage > 0) {
            switch (this.playerControlBattlerStage) {
                case GameBattleController.OPEN_MOVE_INDICATOR:
                    // 取消移动指示器
                    this.cancelBattleMoveIndicator();
                    break;
                case GameBattleController.WAIT_CHANGE_ORI:
                    // 取消待机指令
                    this.cancelBattleStandByOri();
                    break;
                case GameBattleController.OPEN_ATK_INDICATOR:
                    // 取消攻击指示器
                    this.cancelAtkIndicator();
                    break;
                case GameBattleController.OPEN_SKILL_INDICATOR:
                    // 取消技能指示器
                    this.cancelSkillIndicator();
                    break;
                case GameBattleController.OPEN_ITEM_INDICATOR:
                    // 取消道具指示器
                    this.cancelItemIndicator();
                    break;
                case GameBattleController.OPEN_ITEM_EXCHANGE_INDICATOR:
                    // 取消交换道具指示器
                    this.cancelAtkIndicator();
                    break;
            }
            return;
        }
        // 打开通用菜单
        this.openBattleCommonMenu();
    }
    /**
     * 帧刷：光标位置改变时
     * -- 刷新目标窗口
     */
    private static onEnterFrame(pointGrid: Point = null, mouseMode: boolean = false): void {
        // 鼠标模式下当未能在场景上移动鼠标时则阻止（除非触发了边缘镜头修正）
        if (ProjectUtils.lastControl == 0 && this.sceneMoveFrame != Game.frameCount) {
            if (!GameBattleHelper.cameraCorrect(true)) {
                return;
            }
        }
        if (!pointGrid) pointGrid = GameBattleHelper.cursor.posGrid;
        // 打开战斗者菜单后禁止玩家操作时忽略后续逻辑执行
        if (GameBattleHelper.isOpendBattleMenu || !WorldData.playCtrlEnabled) {
            this.cursorPosGrid.x = pointGrid.x;
            this.cursorPosGrid.y = pointGrid.y;
            return;
        }
        // 镜头修正，以便镜头能够跟随到光标的位置
        GameBattleHelper.cameraCorrect();
        // 鼠标模式下需要实时将光标位置跟随鼠标所在的格子
        if (ProjectUtils.lastControl == 0) {
            ProjectUtils.pointHelper.x = Game.currentScene.localX;
            ProjectUtils.pointHelper.y = Game.currentScene.localY;
            let mouseGrid = GameUtils.getGridPostion(ProjectUtils.pointHelper);
            if (this.playerControlBattlerStage == 0) {
                GameBattleAction.cursorJumpToGridPoint(mouseGrid);
            }
        }
        if (this.cursorPosGrid.x == pointGrid.x && this.cursorPosGrid.y == pointGrid.y) {
            return;
        }
        this.cursorPosGrid.x = pointGrid.x;
        this.cursorPosGrid.y = pointGrid.y;
        let battler = GameBattleHelper.getNoDeadBattlerByGrid(pointGrid);
        let isOpenIndicator = this.playerControlBattlerStage == GameBattleController.OPEN_MOVE_INDICATOR || this.playerControlBattlerStage == GameBattleController.OPEN_ATK_INDICATOR
            || this.playerControlBattlerStage == GameBattleController.OPEN_SKILL_INDICATOR || this.playerControlBattlerStage == GameBattleController.OPEN_ITEM_INDICATOR ||
            this.playerControlBattlerStage == GameBattleController.OPEN_ITEM_EXCHANGE_INDICATOR;
        // 如果开启了指示器：当前战斗者头像为当前控制的战斗者，目标头像则为光标指向的目标
        if (isOpenIndicator) {
            GameBattleAction.showCurrentBattlerWindow(this.currentOperationBattler);
            battler ? GameBattleAction.showTargetBattlerWindow(battler) : GameBattleAction.closeTargetBattlerWindow();
        }
        // 否则如果存在光标指向的目标时仅显示光标指向的目标
        else {
            if (mouseMode) {
                if (battler) {
                    let battlerModule = battler.getModule(6) as SoModule_Battler;
                    if (WorldData.showMoveRange) GameBattleAction.openMoveIndicator(battler);
                    if (battlerModule.battleCamp == 0) {
                        GameBattleAction.showCurrentBattlerWindow(battler);
                    }
                    else {
                        GameBattleAction.showTargetBattlerWindow(battler);
                    }
                }
                else {
                    GameBattleAction.closeMoveIndicator();
                    GameBattleAction.closeCurrentBattlerWindow();
                    GameBattleAction.closeTargetBattlerWindow();
                }
                return;
            }
            if (battler) {
                let battlerModule = battler.getModule(6) as SoModule_Battler;
                if (WorldData.showMoveRange) GameBattleAction.openMoveIndicator(battler);
                if (battlerModule.battleCamp == 0) {
                    GameBattleAction.showCurrentBattlerWindow(battler);
                    GameBattleAction.closeTargetBattlerWindow();
                }
                else {
                    GameBattleAction.showTargetBattlerWindow(battler);
                    GameBattleAction.closeCurrentBattlerWindow();
                }
            }
            else {
                GameBattleAction.closeMoveIndicator();
                GameBattleAction.closeCurrentBattlerWindow();
                GameBattleAction.closeTargetBattlerWindow();
            }
        }
    }
    //------------------------------------------------------------------------------------------------------
    // 发出行动指令
    //------------------------------------------------------------------------------------------------------
    /**
     * 操作角色到当前光标位置上移动，当开启了移动指示器
     */
    private static operactionBattleMoveToCursorPostion(inSceneMouseGridPoint: Point = null): boolean {
        // 获取光标位置
        let cursorGridPoint = inSceneMouseGridPoint;
        if (cursorGridPoint == null) cursorGridPoint = GameBattleHelper.cursor.posGrid;
        // 获取移动者
        let battler = GameBattleController.currentOperationBattler;
        // 目标点的障碍判定必须与移动指示器使用相同的阵营规则：
        // 我方可穿过队友，敌方单位彼此阻挡，飞行单位忽略动态/固定障碍。
        let battlerModule = battler.getModule(6) as SoModule_Battler;
        let obstacleMode = GameBattleHelper.getMoveObstacleMode(battlerModule.actor, battler);
        if (obstacleMode == 2) {
            if (GameBattleHelper.isHostileBattlerObstacleGrid(cursorGridPoint, battler, battler)) return false;
        }
        else {
            let ignoreFriendlyBattlers = obstacleMode == 4;
            if (Game.currentScene.sceneUtils.isObstacleGrid(cursorGridPoint, battler, battler, ignoreFriendlyBattlers)) return false;
        }
        // 同阵营单位不阻挡路径，但移动终点不能与任何战斗者重叠。
        if (GameBattleHelper.isBattlerOccupiedGrid(cursorGridPoint, battler)) return false;
        // 在允许的移动格子范围内的话
        if (ArrayUtils.matchAttributes(GameBattleAction.battlerEffectIndicatorGridArr, { x: cursorGridPoint.x, y: cursorGridPoint.y }, true).length != 0) {
            // 如果坐标相等则无法移动
            if (cursorGridPoint.x == battler.posGrid.x && cursorGridPoint.y == battler.posGrid.y) return;
            // 记录角色的原位置
            this.recordBattlerPostion = new Point(battler.x, battler.y);
            this.recordMovedBattler = battler;
            this.recordBattlerOldOri = battler.avatar.orientation;
            // 禁止玩家操作
            GameBattle.playerControlEnabled = WorldData.playCtrlEnabled = false;
            // 移动，当移动结束后恢复控制和镜头恢复锁定光标
            GameBattleAction.startMove(battler, cursorGridPoint.x, cursorGridPoint.y, Callback.New(() => {
                // 允许操作
                MouseControl.start();
                // 继续开启战斗者菜单
                this.openBattlerMenu(battler);
                // 允许玩家操作
                GameBattle.playerControlEnabled = WorldData.playCtrlEnabled = true;
            }, this));
            // 清理玩家控制角色的阶段
            this.playerControlBattlerStage = 0;
            return true;
        }
    }
    /**
     * 确定待机朝向
     */
    private static applyBattleStandByOri() {
        // 清理玩家控制角色的阶段
        this.playerControlBattlerStage = 0;
        // 获取当前操作的战斗者
        let battler = GameBattleController.currentOperationBattler;
        // 执行事件片段：停止更换战斗者朝向时事件
        GameCommand.startCommonCommand(14030, [], null, battler, battler);
        // 设置战斗角色待机效果
        GameBattleData.setBattlerStandby(GameBattleController.currentOperationBattler);
        WorldData.playCtrlEnabled = true;
        // 自动索引下一个角色
        GameBattle.nextPlayerControl();
    }
    /**
     * 选择战斗目标或区域
     */
    private static selectBattleTargetOrArea() {
        // 实际执行了行为的情况
        let doAction = () => {
            this.recordMovedBattler = null;
            this.playerControlBattlerStage = 0;
        }
        // 获取当前光标所在的格子
        let currentGridPos = new Point(GameBattleHelper.cursor.posGrid.x, GameBattleHelper.cursor.posGrid.y);
        // 获取当前的角色数据
        let currentOperationBattlerModule = this.currentOperationBattler.getModule(6) as SoModule_Battler;
        let currentActor = currentOperationBattlerModule.actor;
        // 普通攻击作为技能的话
        let atkUseSkill = false;
        if (this.playerControlBattlerStage == GameBattleController.OPEN_ATK_INDICATOR && currentActor.atkMode == 1 && currentActor.atkSkill) {
            this.currentBattleSkill = currentActor.atkSkill;
            atkUseSkill = true;
        }
        // 攻击
        if (this.playerControlBattlerStage == GameBattleController.OPEN_ATK_INDICATOR && !atkUseSkill) {
            // -- 获取指定战斗者的攻击目标，根据指定的格子位置，如果不存在则不允许攻击
            let target = GameBattleHelper.getAttackTargetOnGrid(this.currentOperationBattler, currentGridPos);
            if (!target) {
                GameAudio.playSE(WorldData.disalbeSE);
                return;
            }
            // -- 等待行为结束后重新操作角色
            this.whenBattleActionCompleteReOpenBattleMenu();
            // -- 发起攻击目标的行为
            GameBattleAction.attack(this.currentOperationBattler, target);
            // -- 实际执行了行为后的处理
            doAction.apply(this);
        }
        // 技能
        else if (this.playerControlBattlerStage == GameBattleController.OPEN_SKILL_INDICATOR || atkUseSkill) {
            // -- 获取技能范围内的作用目标
            let targetRes = GameBattleHelper.getSkillTargetOnGrid(this.currentOperationBattler, this.currentBattleSkill, currentGridPos);
            if (!targetRes || !targetRes.allow) {
                GameAudio.playSE(WorldData.disalbeSE);
                return;
            }
            // -- 当行为结束后恢复控制战斗者
            this.whenBattleActionCompleteReOpenBattleMenu();
            // -- 使用技能
            GameBattleAction.useSkill(this.currentOperationBattler, this.currentBattleSkill, currentGridPos, targetRes.targets);
            // -- 实际执行了行为后的处理
            doAction.apply(this);
        }
        // 道具
        else if (this.playerControlBattlerStage == GameBattleController.OPEN_ITEM_INDICATOR) {
            // 获取道具目标
            let target = GameBattleHelper.getItemTargetOnGrid(this.currentOperationBattler, currentGridPos);
            // 道具只能作用于自己或友军，部分战术物品还限定只能对自己使用。
            if (!target || !GameBattleHelper.isFriendlyRelationship(this.currentOperationBattler, target) ||
                !RogueSkillSynergySystem.canUseItemOnTarget(this.currentOperationBattler, target, this.currentBattleItem)) {
                GameAudio.playSE(WorldData.disalbeSE);
                return;
            }
            // -- 等待行为结束后重新操作角色
            this.whenBattleActionCompleteReOpenBattleMenu();
            // -- 使用道具
            GameBattleAction.useItem(this.currentOperationBattler, target, this.currentBattleItem);
            // -- 实际执行了行为后的处理
            doAction.apply(this);
        }
        // 交换道具
        else if (this.playerControlBattlerStage == GameBattleController.OPEN_ITEM_EXCHANGE_INDICATOR) {
            // 获取道具目标
            let target = GameBattleHelper.getItemTargetOnGrid(this.currentOperationBattler, currentGridPos);
            // 无目标或不是队友的话忽略掉
            if (!target || target == this.currentOperationBattler || !GameBattleHelper.isFriendlyRelationship(this.currentOperationBattler, target)) {
                GameAudio.playSE(WorldData.disalbeSE);
                return;
            }
            // -- 关闭指示器
            GameBattleAction.closeBattleIndicator();
            // -- 不允许控制
            GameBattle.playerControlEnabled = WorldData.playCtrlEnabled = false;
            // -- 打开交换道具面板
            GameCommand.startCommonCommand(15033, [], null, GameBattleController.currentOperationBattler, target);
            // -- 清理并返回
            this.recordMovedBattler = null;
            this.playerControlBattlerStage = 0;
            GameBattleHelper.cursor.setTo(GameBattleController.currentOperationBattler.x, GameBattleController.currentOperationBattler.y);
        }
    }
    //------------------------------------------------------------------------------------------------------
    // 行动完毕后处理
    //------------------------------------------------------------------------------------------------------
    /**
     * 当一次战斗行为结束后重新打开菜单
     */
    private static whenBattleActionCompleteReOpenBattleMenu() {
        GameBattle.playerControlEnabled = WorldData.playCtrlEnabled = false;
        EventUtils.addEventListenerFunction(GameBattleAction, GameBattleAction.EVENT_ONCE_ACTION_COMPLETE, this.reOpenBattleMenu, this, null, true);
    }
    /**
     * 重新打开战斗者菜单
     */
    private static reOpenBattleMenu() {
        // 允许玩家操作
        GameBattle.playerControlEnabled = WorldData.playCtrlEnabled = true;
        // 如果当前操作者已经死亡的话
        let currentOperationBattlerModule = this.currentOperationBattler.getModule(6) as SoModule_Battler;
        if (currentOperationBattlerModule.isDead) {
            // 操控下一个角色
            GameBattle.nextPlayerControl();
        }
        else {
            // 镜头给到战斗者
            GameBattleAction.cameraMoveToBattler(this.currentOperationBattler)
            // 继续开启战斗者菜单
            this.openBattlerMenu(GameBattleController.currentOperationBattler);
        }
    }
    //------------------------------------------------------------------------------------------------------
    // 撤回
    //------------------------------------------------------------------------------------------------------
    /**
     * 撤回待机选择朝向
     */
    private static cancelBattleStandByOri(): void {
        this.playerControlBattlerStage = 0;
        WorldData.playCtrlEnabled = true;
        let battler = GameBattleController.currentOperationBattler;
        // 执行事件片段：停止更换战斗者朝向时事件
        GameCommand.startCommonCommand(14030, [], null, battler, battler);
        this.openBattlerMenu(battler);
    }
    /**
     * 撤回移动指示器
     */
    private static cancelBattleMoveIndicator(): void {
        this.playerControlBattlerStage = 0;
        MouseControl.start();
        GameBattleAction.closeMoveIndicator();
        GameBattleHelper.cursor.setTo(GameBattleController.currentOperationBattler.x, GameBattleController.currentOperationBattler.y);
        this.openBattlerMenu(GameBattleController.currentOperationBattler);
    }
    /**
     * 撤回移动指令
     */
    private static cancelBattleMoveCommand(): void {
        let recordMovedBattlerModule = this.recordMovedBattler.getModule(6) as SoModule_Battler;
        // 设置为未移动过
        recordMovedBattlerModule.moved = false;
        // 返回到记录坐标点和朝向
        this.recordMovedBattler.setTo(this.recordBattlerPostion.x, this.recordBattlerPostion.y);
        this.recordMovedBattler.avatarOri = this.recordBattlerOldOri;
        // 镜头给到战斗者
        GameBattleAction.cameraMoveToBattler(this.recordMovedBattler)
        // 重新选中该战斗者
        GameBattleHelper.cursor.setTo(this.recordMovedBattler.x, this.recordMovedBattler.y);
        this.openBattlerMenu(this.recordMovedBattler);
        // 清理移动记录
        this.recordBattlerPostion = null;
        this.recordMovedBattler = null;
    }
    /**
     * 取消攻击指示器
     */
    private static cancelAtkIndicator(): void {
        this.playerControlBattlerStage = 0;
        GameBattleAction.closeBattleIndicator();
        GameBattleHelper.cursor.setTo(GameBattleController.currentOperationBattler.x, GameBattleController.currentOperationBattler.y);
        this.openBattlerMenu(GameBattleController.currentOperationBattler);
    }
    /**
     * 取消技能指示器
     */
    private static cancelSkillIndicator(): void {
        this.playerControlBattlerStage = 0;
        GameBattleAction.closeBattleIndicator();
        GameBattleHelper.cursor.setTo(GameBattleController.currentOperationBattler.x, GameBattleController.currentOperationBattler.y);
        // 恢复战斗技能栏
        this.reOpenSkillMenu();
    }
    /**
     * 取消道具指示器
     */
    private static cancelItemIndicator(): void {
        this.playerControlBattlerStage = 0;
        GameBattleAction.closeBattleIndicator();
        // 恢复战斗道具栏
        this.reOpenItemMenu();
    }
}
