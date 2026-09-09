/**
 * 战斗道具栏
 * Created by 黑暗之神KDS on 2021-01-19 06:07:49.
 */
class GUI_BattleItem extends GUI_26 {
    /**
     * 选择道具 onSelectItem(item:Module_Item);
     */
    static EVENT_SELECT_ITEM: string = "GUI_BattleItemEVENT_SELECT_ITEM";
    /**
     * 构造函数
     */
    constructor() {
        super();
        // 初始化列表
        GUI_Manager.standardList(this.itemList);
        // 当该界面显示时
        this.on(EventObject.DISPLAY, this, this.onDisplay);
        // 当道具栏选中项更改时
        this.itemList.on(EventObject.CHANGE, this, this.onActorItemChange);
        // 当道具栏选中项更改时
        this.itemList.on(UIList.ITEM_CLICK, this, this.onItemUIItemClick);
        // 当道具栏项创建时
        this.itemList.onCreateItem = Callback.New(this.onCreateItemUIItem, this);
    }
    /**
     * 当该界面显示时
     */
    private onDisplay(): void {
        // -- 刷新道具列表
        this.refreshItemList();
        // -- 焦点
        UIList.focus = this.itemList;
        // -- 刷新说明栏
        this.refreshDescribe();
    }
    /**
     * 刷新道具列表
     */
    private refreshItemList(): void {
        // -- 获取当前选中的战斗者
        let battler = GameBattleController.currentOperationBattler;
        if (!battler) {
            this.itemList.items = [];
            return;
        }
        // -- 获取战斗者的角色数据
        let battlerModule = battler.getModule(6) as SoModule_Battler;
        let battlerActor = battlerModule.actor;
        // -- 列出非被动道具
        let arr = [];
        for (let i = 0; i < WorldData.actorItemMax; i++) {
            let item = battlerActor.items[i];
            if (item && item.isUse) {
                let d = new ListItem_1034;
                d.icon = item.icon;
                d.data = item;
                arr.push(d);
            }
        }
        // -- 当没有携带任何道具时
        if (arr.length == 0) {
            let d = new ListItem_1034;
            arr.push(d);
        }
        this.itemList.items = arr;
    }
    /**
     * 当道具选中发生改变时处理
     */
    private onActorItemChange(): void {
        this.refreshDescribe();
    }
    /**
     * 当道具项点击时
     */
    private onItemUIItemClick(): void {
        // 获取战斗者和道具
        let battler = GameBattleController.currentOperationBattler;
        let item = this.itemList.selectedItem ? this.itemList.selectedItem.data : null;
        if (!battler || !item) return;
        // 不允许使用的情况
        let useEnabled = GameBattleHelper.canUseOneItem(battler, item);
        if (!useEnabled) {
            GameAudio.playSE(WorldData.disalbeSE);
            return;
        }
        // 暂时关闭界面
        GameCommand.startCommonCommand(15022);
        // 派发选择道具的事件
        Callback.CallLaterBeforeRender(() => {
            EventUtils.happen(GUI_BattleItem, GUI_BattleItem.EVENT_SELECT_ITEM, [item]);
        }, this)
    }
    /**
     * 当创建项时
     * @param ui 
     * @param data 
     * @param index 
     */
    private onCreateItemUIItem(ui: GUI_1034, data: ListItem_1034, index: number) {
        let item: Module_Item = data.data;
        ui.icon.visible = item ? true : false;
        if (item) {
            let battler = GameBattleController.currentOperationBattler;
            if (!battler) return;
            let useEnabled = GameBattleHelper.canUseOneItem(battler, item);
            if (!useEnabled) {
                if (WorldData.iconDisabledAni) {
                    let disabledAni = new GCAnimation;
                    disabledAni.id = WorldData.iconDisabledAni;
                    disabledAni.loop = true;
                    disabledAni.target = ui.icon;
                }
                else {
                    ui.icon.setTonal(0, 0, 0, 100);
                }
            }
            else {
                ui.icon.setTonal(0, 0, 0, 0);
            }
        }
    }
    //------------------------------------------------------------------------------------------------------
    // 描述
    //------------------------------------------------------------------------------------------------------
    /**
     * 刷新描述
     */
    private refreshDescribe(): void {
        let battler = GameBattleController.currentOperationBattler;
        if (!battler || !this.itemList.selectedItem) return;
        let name = "";
        let desc = "";
        // 焦点在道具栏的情况下
        if (UIList.focus == this.itemList) {
            let itemData = this.itemList.selectedItem;
            let item = itemData.data as Module_Item;
            if (item) {
                name = item.name;
                desc = GUI_Manager.itemDesc(item);
            }
        }
        this.tipsUI.descName.text = name;
        this.tipsUI.descText.text = desc;
        this.tipsUI.descText.height = this.tipsUI.descText.textHeight;
        this.tipsUI.descTextBox.refresh();
        this.tipsUI.cdBox.visible = false;
    }
}