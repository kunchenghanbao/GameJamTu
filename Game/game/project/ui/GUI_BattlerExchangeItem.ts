/**
 * 战斗交换道具栏
 * Created by 黑暗之神KDS on 2022-03-18 16:49:25.
 */
class GUI_BattlerExchangeItem extends GUI_34 {
    /**
     * 战斗者1
     */
    private battler1: ProjectClientSceneObject;
    /**
     * 战斗者2
     */
    private battler2: ProjectClientSceneObject;
    /**
     * 战斗者1的角色
     */
    private actor1: Module_Actor;
    /**
     * 战斗者2的角色
     */
    private actor2: Module_Actor;
    private exChangeFromItemInfo: { actor: Module_Actor, itemPostion: number, fromList: UIList };
    constructor() {
        super();
        // 标准化
        GUI_Manager.standardList(this.itemPackageList1);
        GUI_Manager.standardList(this.itemPackageList2);
        // 事件：当按键按下时
        stage.on(EventObject.KEY_DOWN, this, this.onKeyDown);
        // 当鼠标在指定列表中按下时
        this.actorPanel1.on(EventObject.MOUSE_DOWN, this, this.onListMouseDown, [this.itemPackageList1]);
        this.actorPanel2.on(EventObject.MOUSE_DOWN, this, this.onListMouseDown, [this.itemPackageList2]);
        // 当项确定时
        this.itemPackageList1.on(UIList.ITEM_CLICK, this, this.onItemClick, [this.itemPackageList1]);
        this.itemPackageList2.on(UIList.ITEM_CLICK, this, this.onItemClick, [this.itemPackageList1]);
        // 鼠标右键
        stage.on(EventObject.RIGHT_CLICK, this, this.onRightMouseDown);
    }
    /**
     * 设置数据
     * @param battler1 战斗者1
     * @param battler2 战斗者2
     */
    setData(battler1: ProjectClientSceneObject, battler2: ProjectClientSceneObject): void {
        this.battler1 = battler1;
        this.battler2 = battler2;
        let battler1Module = this.battler1.getModule(6) as SoModule_Battler;
        let battler2Module = this.battler2.getModule(6) as SoModule_Battler;
        this.actor1 = battler1Module.actor;
        this.actor2 = battler2Module.actor;
        // 安装数据
        this.actorFace1.image = this.actor1.face;
        this.actorFace2.image = this.actor2.face;
        this.actorName1.text = this.actor1.name;
        this.actorName2.text = this.actor2.name;
        this.refreshItem(this.itemPackageList1, this.actor1);
        this.refreshItem(this.itemPackageList2, this.actor2);
        this.itemPackageList2.selectedIndex = -1;
        UIList.focus = this.itemPackageList1;
    }
    /**
     * 当按键按下时
     * @param e 
     */
    private onKeyDown(e: EventObject): void {
        if (!this.stage) return;
        // 左键
        if (GUI_Setting.IS_KEY(e.keyCode, GUI_Setting.KEY_BOARD.LEFT)) {
            if (this.exChangeFromItemInfo) return;
            this.itemPackageList2.selectedIndex = -1;
            UIList.focus = this.itemPackageList1;
            this.itemPackageList1.selectedIndex = 0;
            GameAudio.playSE(WorldData.selectSE);
        }
        // 右键
        else if (GUI_Setting.IS_KEY(e.keyCode, GUI_Setting.KEY_BOARD.RIGHT)) {
            if (this.exChangeFromItemInfo) return;
            this.itemPackageList1.selectedIndex = -1;
            UIList.focus = this.itemPackageList2;
            this.itemPackageList2.selectedIndex = 0;
            GameAudio.playSE(WorldData.selectSE);
        }
        // 取消键
        else if (GUI_Setting.IS_KEY(e.keyCode, GUI_Setting.KEY_BOARD.B)) {
            if (this.exChangeFromItemInfo) {
                this.cancelExChangeItem();
            }
            else {
                GameCommand.startUICommand(this.closeBtn, 0);
            }
        }
    }
    /**
     * 当鼠标右键按下
     * @param e 
     */
    private onRightMouseDown(e: EventObject): void {
        if (!this.stage) return;
        if (this.exChangeFromItemInfo) {
            this.cancelExChangeItem();
        }
        else {
            GameCommand.startUICommand(this.closeBtn, 0);
        }
    }
    /**
     * 当项点击时
     * @param e 
     */
    private onItemClick(e: EventObject): void {
        if (!this.exChangeFromItemInfo) {
            this.startExChangeItem();
        }
        else {
            this.doExChangeItem();
        }
    }
    /**
     * 列表
     */
    private onListMouseDown(list: UIList): void {
        if (this.exChangeFromItemInfo) return;
        if (UIList.focus != list) {
            UIList.focus = list;
            let anotherList = UIList.focus == this.itemPackageList1 ? this.itemPackageList2 : this.itemPackageList1;
            anotherList.selectedIndex = -1;
            GameAudio.playSE(WorldData.selectSE);
        }
    }
    //------------------------------------------------------------------------------------------------------
    //  私有实现：刷新
    //------------------------------------------------------------------------------------------------------
    /**
     * 刷新道具列表
     * @param list 列表
     * @param actor 玩家
     */
    private refreshItem(list: UIList, actor: Module_Actor): void {
        let arr = [];
        let lastSelectedIndex = list.selectedIndex;
        if (lastSelectedIndex == -1) lastSelectedIndex = 0;
        // 获取角色道具栏最大值，使用第一个预设角色的道具栏最大值作为
        let actorItemMax = WorldData.actorItemMax;
        // 遍历角色道具栏
        for (let i = 0; i < actorItemMax; i++) {
            let item: Module_Item = actor.items[i];
            // 创建对应的背包物品项数据，该项数据由系统自动生成
            let d = new ListItem_1031;
            // 该部件存在装备的情况下
            if (item) {
                d.data = item;
                d.icon = item.icon;
                d.itemName = item.name;
            }
            else {
                d.icon = "";
                d.itemName = "--------";
            }
            arr.push(d);
        }
        list.items = arr;
        list.selectedIndex = lastSelectedIndex;
    }
    //------------------------------------------------------------------------------------------------------
    //  私有实现：交换道具
    //------------------------------------------------------------------------------------------------------
    /**
     * 开始交换道具
     */
    private startExChangeItem(): void {
        let fromActor = UIList.focus == this.itemPackageList1 ? this.actor1 : this.actor2;
        let fromList = UIList.focus;
        let toList = UIList.focus == this.itemPackageList1 ? this.itemPackageList2 : this.itemPackageList1;
        let itemPostion = UIList.focus.selectedIndex;
        // 焦点不正确
        if (itemPostion < 0 || itemPostion >= WorldData.actorItemMax) return;
        // 该位置无道具
        let fromItem = fromActor.items[itemPostion];
        if (!fromItem) {
            GameAudio.playSE(WorldData.disalbeSE);
            return;
        }
        let fromItemUI = fromList.getItemUI(itemPostion) as GUI_1031;
        fromItemUI.alpha = 0.5;
        this.exChangeFromItemInfo = { actor: fromActor, itemPostion: itemPostion, fromList: fromList };
        UIList.focus = toList;
        toList.selectedIndex = 0;
    }
    /**
     * 执行交换道具
     */
    private doExChangeItem(): void {
        // 获取当前所在的列表和角色
        let toList = UIList.focus == this.itemPackageList1 ? this.itemPackageList1 : this.itemPackageList2;
        let toActor = UIList.focus == this.itemPackageList1 ? this.actor1 : this.actor2;
        // 交换道具
        let toPostion = toList.selectedIndex;
        let toItem = toActor.items[toPostion];
        let fromItem = this.exChangeFromItemInfo.actor.items[this.exChangeFromItemInfo.itemPostion];
        this.exChangeFromItemInfo.actor.items[this.exChangeFromItemInfo.itemPostion] = toItem;
        toActor.items[toPostion] = fromItem;
        // 如果非同一个列表的话取消fromList焦点
        this.refreshItem(this.itemPackageList1, this.actor1);
        this.refreshItem(this.itemPackageList2, this.actor2);
        if (toList != this.exChangeFromItemInfo.fromList) {
            this.exChangeFromItemInfo.fromList.selectedIndex = -1;
        }
        this.exChangeFromItemInfo = null;
    }
    /**
     * 取消交换道具
     */
    private cancelExChangeItem(): void {
        if (this.exChangeFromItemInfo) {
            let toList = UIList.focus == this.itemPackageList1 ? this.itemPackageList1 : this.itemPackageList2;
            toList.selectedIndex = -1;
            UIList.focus = this.exChangeFromItemInfo.fromList;
            this.exChangeFromItemInfo.fromList.getItemUI(this.exChangeFromItemInfo.itemPostion).alpha = 1;
            this.exChangeFromItemInfo = null;
            GameAudio.playSE(WorldData.cancelSE);
        }
    }

}