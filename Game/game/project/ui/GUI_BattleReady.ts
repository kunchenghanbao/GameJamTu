/**
 * 战斗准备界面，用于人物出场的控制
 * Created by 黑暗之神KDS on 2021-01-13 05:34:38.
 */
class GUI_BattleReady extends GUI_21 {
    /**
     * 默认朝向 2-下 4-左 6-右 8-上
     */
    static ACTOR_DEFAULT_ORI: number;
    /**
     * 角色出场的人数
     */
    static readyBattleActorCount: number = 0;
    /**
     * 角色出场状态 [角色列表Index] = 出场的角色的场景对象
     */
    private actorInSceneBattlers: ProjectClientSceneObject[] = [];
    /**
     * 记录当前更换位置的战斗者
     */
    private currentChangePostionBattler: ProjectClientSceneObject;
    /**
     * 准备出场场景动画集
     */
    private readyInBattleAreaAniArr: GCAnimation[] = [];
    /**
     * 更改朝向阶段
     */
    private changeOriState: boolean = false;
    /**
     * 需要更改朝向的场景对象集
     */
    private needChangeOriSceneObjects: ProjectClientSceneObject[];
    /**
     * 当前更改朝向的场景对象索引
     */
    private currentChangeOriSceneObjectIndex: number;
    /**
     * 当前更改朝向的场景对象
     */
    private currentChangeOriSceneObject: ProjectClientSceneObject;
    /**
     * 更改场景对象朝向
     */
    private isInChangeSceneObjectOri: boolean;
    //------------------------------------------------------------------------------------------------------
    // 接口
    //------------------------------------------------------------------------------------------------------
    /**
     * 准备完毕
     */
    static readyStageComplete(): void {
        // 忽略非准备阶段
        if (GameBattle.state != 1) {
            return;
        }
        // 玩家无法操控
        WorldData.playCtrlEnabled = false;
        let ui = GameUI.get(21) as GUI_BattleReady;
        ui.actorList.mouseEnabled = false;
        // 如果存在更换中的情况，停止更换
        if (ui.currentChangePostionBattler) {
            ui.stopChangeBattlerPostion(ui.currentChangePostionBattler);
        }
        // 如果存在更改朝向阶段的话
        if (WorldData.readyStepChangeOriEnabled) {
            // 设置阶段：更换朝向
            ui.setReadyStep(2);
            // 更改朝向的标识以及记录可以让玩家更改的角色
            ui.changeOriState = true;
            ui.currentChangeOriSceneObjectIndex = 0;
            ui.needChangeOriSceneObjects = [];
            for (let i in Game.currentScene.sceneObjects) {
                let so = Game.currentScene.sceneObjects[i];
                // 是否玩家可控制的战斗角色
                if (GameBattleHelper.isPlayerControlEnabledBattler(so)) {
                    ui.needChangeOriSceneObjects.push(so);
                }
            }
            // 控制下一个角色朝向
            ui.nextSceneObjectCtrlOri();
        }
        // 否则，进入战斗阶段
        else {
            GameBattle.start();
        }
    }
    //------------------------------------------------------------------------------------------------------
    // 初始化
    //------------------------------------------------------------------------------------------------------
    /**
     * 构造函数
     */
    constructor() {
        super();
        // 标准化角色列表
        GUI_Manager.standardList(this.actorList);
        // 当界面显示时
        this.on(EventObject.DISPLAY, this, this.onDisplay);
        // 当界面移除时
        this.on(EventObject.UNDISPLAY, this, this.onUnDisplay);
        // 当创建角色列表项时
        this.actorList.onCreateItem = Callback.New(this.onCreateActorItem, this);
        // 当角色列表中项点击时
        this.actorList.on(UIList.ITEM_CLICK, this, this.onActorListItemClick);
        // 按键事件
        stage.on(EventObject.KEY_DOWN, this, this.onKeyDown);
        // 鼠标操作
        Game.layer.sceneLayer.on(Browser.onMobile ? EventObject.CLICK : EventObject.MOUSE_DOWN, this, this.onMouseDown);
        stage.on(EventObject.RIGHT_MOUSE_DOWN, this, this.onRightMouseDown);
    }
    /**
     * 当战斗准备界面显示时
     */
    private onDisplay() {
        // 暂时禁用键盘操作
        UIList.KEY_BOARD_ENABLED = false;
        // 初始化数据
        this.actorInSceneBattlers = [];
        GUI_BattleReady.readyBattleActorCount = 0;
        // 初始化预置的战斗者
        this.initScenePresetBattler();
        // 当角色列表选项更改时
        this.actorList.on(EventObject.CHANGE, this, this.onActorListChange);
        // 刷新角色列表
        this.refreshPlayerActorList();
        this.actorList.selectedIndex = 0;
        this.onActorListChange(0);
        // 列表组件的焦点指向该列表
        UIList.focus = this.actorList;
        // 创建出场标志动画
        this.createReadyInBattleAreaSignAnimations();
        // 设置阶段：角色出场
        this.setReadyStep(0);
        // 初始化更改朝向阶段
        this.changeOriState = false;
        // 允许角色列表鼠标操作
        this.actorList.mouseEnabled = true;
        // 镜头不锁定光标
        Game.currentScene.camera.sceneObject = null;
        // 注册逐帧更新事件
        os.add_ENTERFRAME(this.onEnterFrame, this);

    }
    /**
     * 当战斗准备界面显示时
     */
    private onUnDisplay() {
        // 当角色列表选项更改时
        this.actorList.selectedIndex = -1;
        this.actorList.items = [];
        this.actorList.off(EventObject.CHANGE, this, this.onActorListChange);
        this.actorInfo.setActor(null);
        // 卸载出场地格子标记动画
        this.disposeReadyInBattleAreaSignAnimations();
        // 取消注册逐帧更新事件
        os.remove_ENTERFRAME(this.onEnterFrame, this);
    }
    /**
     * 镜头修正
     */
    private onEnterFrame(): void {
        if (GameUI.isOpened(33) || GameDialog.isInDialog) return;
        // 镜头修正，以便镜头能够跟随到光标的位置
        GameBattleHelper.cameraCorrect();
    }
    /**
     * 初始化预置的出场角色
     * -- 绑定我方角色数据，以便通过战斗者找到所在玩家队伍的位置
     * -- 记录至列表actorInSceneBattlers
     */
    private initScenePresetBattler() {
        GameBattleData.initScenePresetBattler();
        for (let i = 0; i < Game.currentScene.sceneObjects.length; i++) {
            let so = Game.currentScene.sceneObjects[i];
            if (GameBattleHelper.isBattler(so)) {
                let battlerModule = so.getModule(6) as SoModule_Battler;
                let inPlayerActorIndex = ProjectPlayer.getPlayerActorIndexByActor(battlerModule.actor);
                if (inPlayerActorIndex != -1) {
                    if (!this.actorInSceneBattlers[inPlayerActorIndex]) GUI_BattleReady.readyBattleActorCount++;
                    this.actorInSceneBattlers[inPlayerActorIndex] = so;
                }
            }
        }
    }
    //------------------------------------------------------------------------------------------------------
    // 出场格子光标动画
    //------------------------------------------------------------------------------------------------------
    /**
     * 创建出场格子光标动画
     */
    private createReadyInBattleAreaSignAnimations() {
        // 获取当前地图的网格数据层-3
        let readyInBattleAreaSignArr = Game.currentScene.dataLayers[3];
        // 遍历地图所有格子，找到有出场地标识的创建对应的格子标记动画
        let gridWidth = Game.currentScene.gridWidth;
        let gridHeight = Game.currentScene.gridHeight;
        for (let x = 0; x < gridWidth; x++) {
            let readyInBattleAreaSignArrX = readyInBattleAreaSignArr[x];
            if (!readyInBattleAreaSignArrX) continue;
            for (let y = 0; y < gridHeight; y++) {
                if (readyInBattleAreaSignArrX[y]) {
                    let effectGrid = GameBattleHelper.createEffectGrid(x, y, 0, null);
                    this.readyInBattleAreaAniArr.push(effectGrid);
                }
            }
        }
    }
    /**
     * 销毁出场格子标志动画
     */
    private disposeReadyInBattleAreaSignAnimations() {
        for (let i = 0; i < this.readyInBattleAreaAniArr.length; i++) {
            this.readyInBattleAreaAniArr[i].dispose();
        }
        this.readyInBattleAreaAniArr.length = 0;
    }
    //------------------------------------------------------------------------------------------------------
    // 通常功能
    //------------------------------------------------------------------------------------------------------
    /**
     * 设置准备阶段的流程
     * step 0-角色出场 1-更换位置 2-更换朝向
     */
    private setReadyStep(step: number): void {
        let task = "battleReadyStageTask";
        new SyncTask(task, function (step: number) {
            let fragmentEvent = [14024, 14025, 14026][step];
            Callback.CallLaterBeforeRender(() => {
                GameCommand.startCommonCommand(fragmentEvent, [], Callback.New(() => {
                    SyncTask.taskOver(task);
                }, this), Game.player.sceneObject, Game.player.sceneObject);
            }, this);
        }, [step]);
    }
    //------------------------------------------------------------------------------------------------------
    // 拥有的角色列表
    //------------------------------------------------------------------------------------------------------
    /**
     * 当创建角色列表项时
     * @param ui 项界面 
     * @param data 项数据
     * @param index 所在位置索引
     */
    private onCreateActorItem(ui: GUI_1032, data: ListItem_1032, index: number): void {
        // 获取角色数据
        let actorDS: DataStructure_inPartyActor = data.data;
        if (!actorDS) return;
        // 是否AI标志
        ui.ai.visible = actorDS.actor.AI ? true : false;
        // 显示出场标识
        ui.inScene.visible = this.actorInSceneBattlers[index] ? true : false;
    }
    /**
     * 刷新角色列表
     */
    private refreshPlayerActorList() {
        let arr = [];
        // 遍历玩家拥有的角色
        for (let i = 0; i < Game.player.data.party.length; i++) {
            // 获取角色的DS结构数据
            let actorDS = Game.player.data.party[i];
            // 初始化角色数据
            let actor = actorDS.actor;
            Game.refreshActorAttribute(actor, actorDS.lv);
            if (WorldData.fullStateWhenBattleStart) {
                actor.hp = actor.MaxHP;
                actor.sp = actor.MaxSP;
            }
            else if (actor.hp <= 0) {
                actor.hp = 1;
            }
            // 未在预设出场者清空状态
            if (!this.actorInSceneBattlers[i]) {
                actorDS.actor.status.length = 0;
            }
            // 创建列表的项数据（对应列表的项模型）
            let d = new ListItem_1032;
            // 项数据绑定角色数据，以便通过项数据找到对应的角色数据
            d.data = actorDS;
            // 设定行走图，系统会自动根据该数值变更行走图，详情参考UIList.api头部注释
            d.avatar = actorDS.actor.avatar;
            // 添加到数组
            arr.push(d);
        }
        this.actorList.items = arr;
    }
    /**
     * 当角色列表选项改变时
     * @param state state=0 表示selectedIndex改变，否则是overIndex
     */
    private onActorListChange(state: number): void {
        if (state == 0) {
            // 获取角色列表选中的角色数据
            let selectedPlayerActorData = this.selectedPlayerActorData;
            if (!selectedPlayerActorData) return;
            let actor = selectedPlayerActorData.actor;
            // 选中玩家的角色时刷新角色的基本信息
            (this.actorInfo as GUI_BattlerBriefInfo).setActor(actor);
        }
    }
    /**
     * 当角色列表项点击时
     */
    private onActorListItemClick() {
        // 更换战斗者位置的阶段时忽略该操作
        if (this.currentChangePostionBattler) return;
        // 光标指定的场景对象
        let overCursorSceneObject = this.deploymentCursorSceneObject;
        // 如果已出场的角色，切换至该角色上
        let actorInSceneBattler = this.actorInSceneBattlers[this.actorList.selectedIndex];
        if (actorInSceneBattler) {
            // 列表项已定位到该角色时再次点击，直接撤回角色。
            // 这是移动端无法稳定拖出部署区时的明确撤回入口；首次点击仍只负责定位。
            if (overCursorSceneObject == actorInSceneBattler) {
                let battlerModule = actorInSceneBattler.getModule(6) as SoModule_Battler;
                let actorIndex = ProjectPlayer.getPlayerActorIndexByActor(battlerModule.actor);
                if (actorIndex >= 0 && battlerModule.usePlayerActors && !battlerModule.mustInBattle) {
                    this.backActorFromScene(actorIndex, actorInSceneBattler);
                    GameBattleHelper.cursor.stopMove();
                    MouseControl.unselectOneSceneObject(actorInSceneBattler);
                    return;
                }
            }
            GameBattleHelper.cursor.stopMove();
            GameBattleHelper.cursor.setTo(actorInSceneBattler.x, actorInSceneBattler.y);
            // 镜头看向光标所在位置
            GameFunction.cameraMove(0, GameBattleHelper.cursor.x, GameBattleHelper.cursor.y, 0, true, WorldData.cameraTweenFrame);
        }
        // 否则如果未选中场上角色时，则尝试出场角色
        else if (!overCursorSceneObject) {
            this.addBattlerOrRmoveBattle();
        }
    }
    //------------------------------------------------------------------------------------------------------
    // 获取数据
    //------------------------------------------------------------------------------------------------------
    /**
     * 获取角色出场列表选中的角色数据
     */
    private get selectedPlayerActorData(): DataStructure_inPartyActor {
        let selectedItem = this.actorList.selectedItem;
        if (!selectedItem) return;
        let actorDS: DataStructure_inPartyActor = selectedItem.data;
        return actorDS;
    }
    /**
     * 获取剩余可上场的角色数
     */
    private get canInBattleActorLength(): number {
        let s = 0;
        for (let i = 0; i < Game.player.data.party.length; i++) {
            let actorDS = Game.player.data.party[i];
            if (actorDS && !this.actorInSceneBattlers[i]) s++;
        }
        return s;
    }
    /**
     * 获取部署光标所在的实际场景对象。
     * 肉鸽出生点是透明的辅助标记，不应阻止角色放置或换位。
     */
    private get deploymentCursorSceneObject(): ProjectClientSceneObject {
        let cursor = GameBattleHelper.cursor;
        let cursorGrid = cursor && cursor.posGrid;
        if (!cursorGrid || Game.currentScene.sceneUtils.isOutsideByGrid(cursorGrid)) return null;
        let sceneObjects = Game.currentScene.sceneUtils.gridSceneObjects[cursorGrid.x][cursorGrid.y];
        if (!sceneObjects) return null;
        for (let i = 0; i < sceneObjects.length; i++) {
            let sceneObject = sceneObjects[i];
            if (!sceneObject || sceneObject === cursor || sceneObject.name === "肉鸽出生点") continue;
            return sceneObject;
        }
        return null;
    }
    //------------------------------------------------------------------------------------------------------
    // 摆放角色
    //------------------------------------------------------------------------------------------------------
    /**
     * 放入角色到场景上：调用此函数前应确保该位置上没有任何场景对象
     * @param actorIndex 所在角色列表位置
     * @param soc 场景对象
     */
    private putActorInScene(actorIndex: number, grid: Point, actorDS: DataStructure_inPartyActor): void {
        // 创建到坐标
        let posGridP = new Point(grid.x, grid.y);
        let posP = GameUtils.getGridCenterByGrid(posGridP);
        let persetSceneObject = {
            x: posP.x,
            y: posP.y,
            avatarID: actorDS.actor.avatar,
            avatarOri: GUI_BattleReady.ACTOR_DEFAULT_ORI
        }
        // 以出厂默认创建创建对象
        let soc = Game.currentScene.addNewSceneObject(1, persetSceneObject) as ProjectClientSceneObject;
        if (!this.actorInSceneBattlers[actorIndex]) GUI_BattleReady.readyBattleActorCount++;
        this.actorInSceneBattlers[actorIndex] = soc;
        // 模块设定
        let battlerModule = new SoModule_Battler(null, soc);
        battlerModule.id = 6;
        soc.addModule(battlerModule);
        // 战斗者设定
        battlerModule.battleCamp = 0;
        battlerModule.actor = actorDS.actor;
        battlerModule.actorInit();
        battlerModule.usePlayerActors = true;
        battlerModule.mustInBattle = false;
        // 执行战斗者初始化事件
        GameBattleData.onBattlerAppear(soc);
        // 刷新列表项中的出场显示，此处为优化，无需刷新整个列表
        let actorItemUI: GUI_1032 = this.actorList.getItemUI(actorIndex) as any;
        actorItemUI.inScene.visible = true;
        // 全部角色上场完毕时提示是否出战
        if (this.canInBattleActorLength == 0) {
            GUI_Manager.setWarning(2);
        }
    }
    /**
     * 回收角色从场景上，已确定了角色以及其对应的场景对象
     * @param actorIndex 所在角色列表位置
     * @param soc 场景对象
     */
    private backActorFromScene(actorIndex: number, soc: ProjectClientSceneObject): void {
        // 清理已上场记录
        if (this.actorInSceneBattlers[actorIndex]) GUI_BattleReady.readyBattleActorCount--;
        this.actorInSceneBattlers[actorIndex] = null;
        // 销毁场景对象
        soc.dispose();
        // 刷新列表项中的出场显示，此处为优化，无需刷新整个列表
        let actorItemUI: GUI_1032 = this.actorList.getItemUI(actorIndex) as any;
        actorItemUI.inScene.visible = false;
        // 重新选中该角色对象
        this.actorList.selectedIndex = actorIndex;
    }
    //------------------------------------------------------------------------------------------------------
    // 更换位置
    //------------------------------------------------------------------------------------------------------
    /**
     * 开始改变战斗者位置
     * @param soc 已上场的战斗者
     */
    private startChangeBattlerPostion(soc: ProjectClientSceneObject) {
        // 设置阶段:更换位置
        this.setReadyStep(1);
        // 记录当前更改位置的对象
        this.currentChangePostionBattler = soc;
        // 调用事件片段：开始更换战斗者位置时事件
        GameCommand.startCommonCommand(14027, [], null, soc, soc);
    }
    /**
     * 停止改变战斗者位置
     * @param soc 已上场的战斗者
     */
    private stopChangeBattlerPostion(soc: ProjectClientSceneObject) {
        // 设置阶段:角色出场
        this.setReadyStep(0);
        // 清空当前更改位置的对象
        this.currentChangePostionBattler = null;
        // 调用事件片段：停止更换战斗者位置时事件
        GameCommand.startCommonCommand(14028, [], null, soc, soc);
    }
    //------------------------------------------------------------------------------------------------------
    // 放置角色逻辑
    //------------------------------------------------------------------------------------------------------
    /**
     * 添加或移除战斗者
     */
    private addBattlerOrRmoveBattle() {
        // 获取选中的角色列表索引
        let selectedIndex = this.actorList.selectedIndex;
        if (selectedIndex < 0) return;
        // 光标指定的场景对象
        let overCursorSceneObject = this.deploymentCursorSceneObject;
        // 光标位置
        let cursorGridPoint = GameBattleHelper.cursorGridPoint;
        let cursorPoint = GameUtils.getGridCenterByGrid(cursorGridPoint);
        // 是否出场地
        let isReadyGrid = Game.currentScene.getDataGridState(3, cursorGridPoint.x, cursorGridPoint.y) == 1;
        // 获取角色列表中选中的角色
        let actorInSceneBattler = this.actorInSceneBattlers[selectedIndex];
        // 获取当前选中的出场角色（角色列表中）
        let selectedPlayerActorData = this.selectedPlayerActorData;
        // 处于「更改战斗者位置阶段」时
        if (this.currentChangePostionBattler) {
            // 同位置的话：回收角色
            if (overCursorSceneObject == this.currentChangePostionBattler) {
                let overCursorBatterModule = overCursorSceneObject.getModule(6) as SoModule_Battler;
                this.stopChangeBattlerPostion(overCursorSceneObject);
                let inPlayerActorIndex = ProjectPlayer.getPlayerActorIndexByActor(overCursorBatterModule.actor);
                // 如果该场景对象是玩家角色的话且非必须出场的话才允许回收
                if (inPlayerActorIndex >= 0 && overCursorBatterModule.usePlayerActors && !overCursorBatterModule.mustInBattle) {
                    this.backActorFromScene(inPlayerActorIndex, overCursorSceneObject);
                }
                else {
                    GUI_Manager.setWarning(0);
                    GameAudio.playSE(ClientWorld.data.disalbeSE);
                }
            }
            // 否则：更换位置
            else {
                // -- 在出场地时更换位置
                if (isReadyGrid) {
                    // -- 该位置上已有战斗角色则与它更换位置
                    if (overCursorSceneObject) {
                        // -- 非玩家阵营
                        if (!GameBattleHelper.isPlayerCamp(overCursorSceneObject)) {
                            GameAudio.playSE(ClientWorld.data.disalbeSE);
                            return;
                        }
                        overCursorSceneObject.setTo(this.currentChangePostionBattler.x, this.currentChangePostionBattler.y);
                    }
                    this.currentChangePostionBattler.setTo(cursorPoint.x, cursorPoint.y);
                    // 退出更改战斗者位置阶段
                    this.stopChangeBattlerPostion(this.currentChangePostionBattler);
                }
                else {
                    GameAudio.playSE(ClientWorld.data.disalbeSE);
                }
            }
        }
        // 处于「选择出场角色阶段」时
        else {
            // 存在选中的场景对象时
            if (overCursorSceneObject) {
                // 如果该场景对象是玩家拥有的战斗角色时（玩家阵营）：进入「更改战斗者位置阶段」
                if (isReadyGrid && GameBattleHelper.isPlayerCamp(overCursorSceneObject)) {
                    let overCursorBatterModule = overCursorSceneObject.getModule(6) as SoModule_Battler;
                    let inPlayerActorIndex = ProjectPlayer.getPlayerActorIndexByActor(overCursorBatterModule.actor);
                    // -- 如果是玩家拥有的角色则列表中选中该角色
                    if (inPlayerActorIndex != -1) this.actorList.selectedIndex = inPlayerActorIndex;
                    // -- 开始更换战斗者位置
                    this.startChangeBattlerPostion(overCursorSceneObject);
                }
                // 否则不允许操作
                else {
                    GameAudio.playSE(ClientWorld.data.disalbeSE);
                }
            }
            // 否则需要允许出场的空地且该角色未能出场时才可以上场
            else if (isReadyGrid && !actorInSceneBattler) {
                this.putActorInScene(selectedIndex, cursorGridPoint, selectedPlayerActorData);
                // 角色索引选中下一个允许出场的角色
                for (let i = selectedIndex; i < this.actorList.length; i++) {
                    if (!this.actorInSceneBattlers[i]) {
                        this.actorList.selectedIndex = i;
                        break;
                    }
                }
            }
            else {
                GameAudio.playSE(ClientWorld.data.disalbeSE);
            }
        }
    }
    //------------------------------------------------------------------------------------------------------
    // 键盘操作
    //------------------------------------------------------------------------------------------------------
    /**
     * 当按键按下时处理
     * @param e 
     */
    private onKeyDown(e: EventObject) {
        // 不在显示列表上时候则忽略
        if (!this.stage) return;
        // 对话框开启时候忽略
        if (GameDialog.isInDialog) return;
        // 非准备阶段忽略
        if (GameBattle.state != 1) return;
        // 选择出场角色
        let selectedIndex = this.actorList.selectedIndex;
        if (GUI_Setting.IS_KEY(e.keyCode, GUI_Setting.KEY_BOARD.L1)) {
            if (this.changeOriState) return;
            selectedIndex--;
            if (selectedIndex < 0) selectedIndex = 0;
            this.actorList.selectedIndex = selectedIndex;
        }
        else if (GUI_Setting.IS_KEY(e.keyCode, GUI_Setting.KEY_BOARD.R1)) {
            if (this.changeOriState) return;
            selectedIndex++;
            if (selectedIndex >= this.actorList.length) selectedIndex = this.actorList.length - 1;
            this.actorList.selectedIndex = selectedIndex;
        }
        // 方向键：更改朝向
        else if (GUI_Setting.IS_KEY(e.keyCode, GUI_Setting.KEY_BOARD.UP)) {
            if (this.changeOriState) this.currentChangeOriSceneObject.avatarOri = 8;
        }
        else if (GUI_Setting.IS_KEY(e.keyCode, GUI_Setting.KEY_BOARD.DOWN)) {
            if (this.changeOriState) this.currentChangeOriSceneObject.avatarOri = 2;
        }
        else if (GUI_Setting.IS_KEY(e.keyCode, GUI_Setting.KEY_BOARD.LEFT)) {
            if (this.changeOriState) this.currentChangeOriSceneObject.avatarOri = 4;
        }
        else if (GUI_Setting.IS_KEY(e.keyCode, GUI_Setting.KEY_BOARD.RIGHT)) {
            if (this.changeOriState) this.currentChangeOriSceneObject.avatarOri = 6;
        }
        // 确定键
        else if (GUI_Setting.IS_KEY(e.keyCode, GUI_Setting.KEY_BOARD.A)) {
            // 更改朝向阶段的情况
            if (this.changeOriState) {
                this.nextSceneObjectCtrlOri();
            }
            // 否则操作角色上场
            else {
                this.addBattlerOrRmoveBattle();
            }
        }
        // 取消键
        else if (GUI_Setting.IS_KEY(e.keyCode, GUI_Setting.KEY_BOARD.B)) {
            // 如果处于调整位置的情况则更改位置，否则退出
            if (this.currentChangePostionBattler) {
                this.stopChangeBattlerPostion(this.currentChangePostionBattler);
            }
            // 否则不在更改朝向阶段时，提示是否准备完毕
            else if (!this.changeOriState) {
                GUI_Manager.setWarning(1);
            }
        }
    }
    //------------------------------------------------------------------------------------------------------
    // 鼠标操作
    //------------------------------------------------------------------------------------------------------
    /**
     * 当鼠标按下时处理
     * @param e 
     */
    private onMouseDown(e: EventObject): void {
        if (TouchCameraControl.isPinching) return;
        // 不在显示列表上时候则忽略
        if (!this.stage) return;
        // 非准备阶段忽略
        if (GameBattle.state != 1) return;
        // 更改朝向的阶段忽略
        if (this.changeOriState) return;
        // 电脑端换位使用拖拽，手机端由下方的轻点确认逻辑处理。
        if (this.currentChangePostionBattler && !Browser.onMobile) return;
        // 手机端轻点场景时直接确认当前部署操作。
        // 移动端通常不会先派发 MOUSE_MOVE，必须先按本次触摸刷新命中
        // 状态，再同步光标并执行放置/换位，否则只能看到光标移动。
        if (Browser.onMobile) {
            MouseControl.updateSelectSceneObject();
            let mobileMouseGridPoint = GameBattleHelper.inSceneMouseGridPoint;
            GameBattleAction.cursorJumpToGridPoint(mobileMouseGridPoint);
            this.addBattlerOrRmoveBattle();
            return;
        }
        // 存在鼠标选取的场景对象
        if (MouseControl.selectSceneObject) {
            // 是否出场地
            let cursorGridPoint = MouseControl.selectSceneObject.posGrid;
            let isReadyGrid = Game.currentScene.getDataGridState(3, cursorGridPoint.x, cursorGridPoint.y) == 1;
            // 如果该对象是允许操作的情况：
            if (isReadyGrid && GameBattleHelper.isPlayerCamp(MouseControl.selectSceneObject)) {
                MouseControl.selectSceneObject.root.startDrag();
                MouseControl.selectSceneObject.root.on(EventObject.DRAG_MOVE, this, this.onDragSceneObjectMove, [MouseControl.selectSceneObject]);
                stage.once(EventObject.MOUSE_UP, this, this.onMouseUp, [MouseControl.selectSceneObject, MouseControl.selectSceneObject.x, MouseControl.selectSceneObject.y]);
                return;
            }
        }
        // 光标设置位置
        let inSceneMouseGridPoint = GameBattleHelper.inSceneMouseGridPoint;
        GameBattleAction.cursorJumpToGridPoint(inSceneMouseGridPoint);
    }
    /**
     * 鼠标弹起时
     * @param selectSceneObject 当前拖拽的角色的场景对象
     */
    private onMouseUp(selectSceneObject: ProjectClientSceneObject, oldX: number, oldY: number) {
        let cursorPoint = new Point(selectSceneObject.root.x, selectSceneObject.root.y);
        let cursorGridPoint = GameUtils.getGridPostion(cursorPoint);
        cursorPoint = GameUtils.getGridCenter(cursorPoint);
        let isReadyGrid = Game.currentScene.getDataGridState(3, cursorGridPoint.x, cursorGridPoint.y) == 1;
        // -- 在出场地时更换位置
        if (isReadyGrid) {
            // 目标格子
            let targetSceneObjects = Game.currentScene.sceneUtils.gridSceneObjects[cursorGridPoint.x][cursorGridPoint.y].concat();
            // 排除光标本身
            ArrayUtils.remove(targetSceneObjects, GameBattleHelper.cursor);
            // 排除当前拖拽的对象本身
            ArrayUtils.remove(targetSceneObjects, selectSceneObject);
            let overCursorSceneObject: ProjectClientSceneObject = null;
            for (let i = 0; i < targetSceneObjects.length; i++) {
                let targetSceneObject = targetSceneObjects[i];
                if (targetSceneObject && targetSceneObject.name !== "肉鸽出生点") {
                    overCursorSceneObject = targetSceneObject;
                    break;
                }
            }
            // -- 该位置上已有战斗角色则与它更换位置
            if (overCursorSceneObject) {
                // 不是我方阵营战斗者的话不允许
                if (!GameBattleHelper.isPlayerCamp(overCursorSceneObject)) {
                    GameAudio.playSE(ClientWorld.data.disalbeSE);
                    selectSceneObject.setTo(oldX, oldY);
                    return;
                }
                overCursorSceneObject.setTo(selectSceneObject.x, selectSceneObject.y);
            }
            selectSceneObject.setTo(cursorPoint.x, cursorPoint.y);
        }
        else {
            // 回收角色
            let selectBatterModule = selectSceneObject.getModule(6) as SoModule_Battler;
            let inPlayerActorIndex = ProjectPlayer.getPlayerActorIndexByActor(selectBatterModule.actor);
            // 如果该场景对象是玩家角色的话且非必须出场的话才允许回收
            if (inPlayerActorIndex >= 0 && selectBatterModule.usePlayerActors && !selectBatterModule.mustInBattle) {
                this.backActorFromScene(inPlayerActorIndex, selectSceneObject);
                MouseControl.selectSceneObject = null;
            }
            else {
                GUI_Manager.setWarning(0);
                GameAudio.playSE(ClientWorld.data.disalbeSE);
                selectSceneObject.setTo(oldX, oldY);
            }
        }
        selectSceneObject.root.stopDrag();
    }
    /**
     * 右键
     */
    private onRightMouseDown(e: EventObject): void {
        // 不在显示列表上时候则忽略
        if (!this.stage) return;
        // 对话框开启时候忽略
        if (GameDialog.isInDialog) return;
        // 非准备阶段忽略
        if (GameBattle.state != 1) return;
        // 如果处于调整位置的情况则更改位置，否则退出
        if (this.currentChangePostionBattler) {
            this.stopChangeBattlerPostion(this.currentChangePostionBattler);
        }
        // 否则不在更改朝向阶段时，提示是否准备完毕
        else if (!this.changeOriState) {
            GUI_Manager.setWarning(1);
        }
    }
    /**
     * 当拖拽场景对象时：刷新坐标
     * @param selectSceneObject 
     */
    private onDragSceneObjectMove(selectSceneObject: ProjectClientSceneObject) {
        selectSceneObject.refreshCoordinate(false, false, false);
    }
    //------------------------------------------------------------------------------------------------------
    // 阶段：更改角色朝向
    //------------------------------------------------------------------------------------------------------
    /**
     * 下一个控制的角色更改朝向
     */
    nextSceneObjectCtrlOri(): void {
        if (this.isInChangeSceneObjectOri) return;
        this.isInChangeSceneObjectOri = true;
        let doNextSceneObjectCtrlOri = () => {
            this.isInChangeSceneObjectOri = false;
            // 全部操作完毕的情况
            let targetSo = this.needChangeOriSceneObjects[this.currentChangeOriSceneObjectIndex];
            if (targetSo == null) {
                GameBattle.start();
                return;
            }
            // 记录当前需要操作更改朝向的角色
            this.currentChangeOriSceneObject = targetSo;
            // 如果是玩家拥有的角色则选择他
            let targetBattlerModule = targetSo.getModule(6) as SoModule_Battler;
            let targetSoinPlayerActorIndex = ProjectPlayer.getPlayerActorIndexByActor(targetBattlerModule.actor);
            if (targetSoinPlayerActorIndex >= 0) {
                this.actorList.selectedIndex = targetSoinPlayerActorIndex;
            }
            // 否则仅查看数据
            else {
                (this.actorInfo as GUI_BattlerBriefInfo).setActor(targetBattlerModule.actor);
            }
            // 开始更改战斗者朝向时事件
            GameCommand.startCommonCommand(14029, [], null, targetSo, targetSo);
            // 光标设置位置
            GameBattleHelper.cursor.setTo(targetSo.x, targetSo.y);
            this.currentChangeOriSceneObjectIndex++;
        }
        // 停止更换战斗者朝向时事件
        if (this.currentChangeOriSceneObject) {
            GameCommand.startCommonCommand(14030, [], Callback.New(() => {
                MouseControl.unselectOneSceneObject(this.currentChangeOriSceneObject)
                doNextSceneObjectCtrlOri.apply(this);
            }, this), this.currentChangeOriSceneObject, this.currentChangeOriSceneObject);
        }
        else {
            doNextSceneObjectCtrlOri.apply(this);
        }
    }
}
