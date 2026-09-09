/**
 * 背包
 * Created by 黑暗之神KDS on 2020-09-17 14:56:35.
 */
class GUI_Package extends GUI_4 {
    /**
     * 当前选中的角色
     */
    static actorSelectedIndex: number;
    /**
     * 使用道具锁定状态，以便在道具的事件执行完毕前不再允许使用
     */
    private useItemLock: boolean;
    /**
     * 当选择确定目标后回调
     */
    private onSelectTargetUseItem: Function;
    /**
     * 描述名称初始颜色
     */
    private itemNameInitColor: string;
    /**
     * 构造函数
     */
    constructor() {
        super();
        // 记录初始颜色
        this.itemNameInitColor = this.itemName.color;
        // 标准化列表
        GUI_Manager.standardList(this.list, false);
        GUI_Manager.standardList(this.actorList, false);
        // 事件监听：当界面显示时
        this.on(EventObject.DISPLAY, this, this.onDisplay);
        // 事件监听：当列表选择项改变时-刷新道具描述
        this.list.on(EventObject.CHANGE, this, this.refreshItemInfo);
        // 事件监听：当项选中时-刷新道具
        this.list.on(UIList.ITEM_CLICK, this, this.onItemClick);
        // 事件监听：当道具项创建时
        this.list.on(UIList.ITEM_CREATE, this, this.onItemCreate);
        // 事件监听：当道具更改时
        EventUtils.addEventListenerFunction(ProjectPlayer, ProjectPlayer.EVENT_CHANGE_ITEM_NUMBER, this.onItemChange, this);
        // 事件监听：当创建项对象时
        this.list.on(UIList.ITEM_CREATE, this, this.onCreateItemUI);
        // 事件监听：当角色窗口点击时
        this.actorList.on(UIList.ITEM_CLICK, this, this.onActorItemClick);
    }
    //------------------------------------------------------------------------------------------------------
    //  获取
    //------------------------------------------------------------------------------------------------------
    /**
     * 目标角色列表
     * @return [UIList] 
     */
    private get actorList(): UIList {
        return this.targetUI.actorList;
    }
    //------------------------------------------------------------------------------------------------------
    // 事件
    //------------------------------------------------------------------------------------------------------
    /**
     * 当界面显示时事件
     */
    private onDisplay() {
        // 设置焦点为道具列表
        UIList.focus = this.list;
        // 刷新道具列表
        this.refreshItems(0);
        // 刷新选中的道具详情
        this.refreshItemInfo();
    }
    /**
     * 当创建项显示对象时
     */
    private onCreateItemUI(ui: GUI_1002, data: ListItem_1002, index: number) {
        let itemDS: DataStructure_packageItem = data.data;
        // 空数据透明化
        if (!itemDS) ui.alpha = 0;
        // 禁用:不可使用的道具
        // if (itemDS && (!(!itemDS.isEquip && itemDS.item.isUse))) {
        //     ui.itemName.alpha = ui.icon.alpha = ui.itemNum.alpha = 0.2;
        // }
    }
    /**
     * 当道具发生变更时
     */
    private onItemChange() {
        // 刷新道具（优化：延迟到下一帧渲染前执行，以保证连续多次更改道具后仅刷新一次而非多次）
        Callback.CallLaterBeforeRender(this.refreshItems, this, [0]);
    }
    /**
     * 当道具项创建时
     */
    private onItemCreate(ui: GUI_1002, data: ListItem_1002, index: number): void {
        let itemDS: DataStructure_packageItem = data.data;
        if (itemDS && itemDS.isEquip) {
            ui.itemName.color = GUI_Manager.getEquipNameColorByInstance(itemDS.equip);
        }
    }
    /**
     * 当道具点击时
     */
    private onItemClick() {
        // 锁定状态下时不触发使用效果
        if (this.useItemLock) return;
        // 获取当前选中的列表项
        let selectedItem = this.list.selectedItem;
        if (selectedItem && selectedItem.data) {
            // 获取道具DS格式（此结构额外追加储存了道具的数目）
            let itemDS: DataStructure_packageItem = selectedItem.data;
            // 如果是装备的话，无法使用
            if (itemDS.isEquip) {
                GameAudio.playSE(WorldData.disalbeSE);
                return;
            }
            // 获取道具
            let item = itemDS.item;
            // 可使用道具且允许在背包中使用的情况
            if (item.isUse && itemDS.number > 0 && item.useType != 2) {
                // 指定单个目标的话，弹出目标窗口以便选择目标后使用该道具
                if (item.isSingleTarget) {
                    this.startSelectTarget(() => { this.onUseItem(itemDS); });
                }
                // 否则直接使用
                else {
                    this.onUseItem(itemDS);
                }
            }
            // 否则禁止使用的场合播放禁用音效
            else {
                GameAudio.playSE(WorldData.disalbeSE);
                return;
            }
        }
    }
    /**
     * 当使用道具时
     * @param itemDS 
     */
    private onUseItem(itemDS: DataStructure_packageItem): void {
        // 如果没有该道具的情况
        if (itemDS.number <= 0) {
            GameAudio.playSE(WorldData.disalbeSE);
            return;
        }
        let item = itemDS.item;
        // 获取角色
        let targetActorDS: DataStructure_inPartyActor;
        let targetActor: Module_Actor;
        if (item.isSingleTarget) {
            targetActorDS = ProjectPlayer.getPlayerActorDSByInPartyIndex(this.actorList.selectedIndex);
            if (!targetActorDS) {
                GameAudio.playSE(WorldData.disalbeSE);
                return;
            }
            targetActor = targetActorDS.actor;
        }
        // 锁定，在执行完毕事件前不允许再次使用
        this.useItemLock = true;
        // 播放使用音效
        if (item.se) GameAudio.playSE(item.se);
        // 背包场景不会进入战斗结算，因此在这里应用道具的标准回复和状态效果。
        if (targetActor) this.applyNonBattleItemEffect(targetActor, item);
        let finishUse = () => {
            if (targetActor) Game.refreshActorAttribute(targetActor, targetActorDS.lv);
            this.targetUI.refreshTargetPanel();
            this.useItemLock = false;
        };
        // 执行片段事件
        let trigger = item.callEvent ? CommandPage.startTriggerFragmentEvent(item.callEvent, Game.player.sceneObject, Game.player.sceneObject,
            Callback.New(finishUse, this)) : null;
        if (!trigger) finishUse.apply(this);
        // 消耗品的情况：道具-1
        if (item.isConsumables) ProjectPlayer.changeItemNumber(item.id, -1, false);
    }

    private applyNonBattleItemEffect(actor: Module_Actor, item: Module_Item): void {
        if (item.recoveryHP) actor.hp = Math.min(actor.MaxHP, actor.hp + item.recoveryHP);
        if (item.recoverySP) actor.sp = Math.min(actor.MaxSP, actor.sp + item.recoverySP);
        let removeStatus = item.removeStatus || [];
        for (let i = actor.status.length - 1; i >= 0; i--) {
            if (removeStatus.indexOf(actor.status[i].id) >= 0) actor.status.splice(i, 1);
        }
        let addStatus = item.addStatus || [];
        for (let i = 0; i < addStatus.length; i++) {
            let statusID = addStatus[i];
            if (actor.selfImmuneStatus && actor.selfImmuneStatus.indexOf(statusID) >= 0) continue;
            let status: Module_Status = null;
            for (let s = 0; s < actor.status.length; s++) {
                if (actor.status[s].id === statusID) {
                    status = actor.status[s];
                    break;
                }
            }
            if (status) status.currentLayer = Math.min(status.maxlayer, status.currentLayer + 1);
            else {
                status = GameData.newModuleData(10, statusID);
                if (!status) continue;
                status.fromBattlerID = 0;
                actor.status.push(status);
            }
            status.currentDuration = status.totalDuration;
        }
    }
    //------------------------------------------------------------------------------------------------------
    // 角色目标窗口
    //------------------------------------------------------------------------------------------------------
    /**
     * 当角色项确认时：使用道具
     */
    private onActorItemClick() {
        // 记录使用者角色索引
        GUI_Package.actorSelectedIndex = this.actorList.selectedIndex;
        // 使用道具
        this.onSelectTargetUseItem.apply(this);
    }
    /**
      * 开始选择目标
      * @param onSelectTargetUseItem 当选择角色时回调
      */
    private startSelectTarget(onSelectTargetUseItem: Function) {
        // 播放确定音效
        GameAudio.playSE(WorldData.sureSE);
        // 打开目标窗口
        this.targetUI.visible = true;
        // 刷新目标窗口数值显示
        this.targetUI.refreshTargetPanel();
        // 焦点指向目标窗口的角色列表
        UIList.focus = this.actorList;
        // 记录当选择角色时回调
        this.onSelectTargetUseItem = onSelectTargetUseItem;
    }
    //------------------------------------------------------------------------------------------------------
    // 刷新
    //------------------------------------------------------------------------------------------------------
    /**
     * 刷新道具列表
     * @param state 
     */
    private refreshItems(state: number) {
        if (state != 0) return;
        let arr: ListItem_1002[] = [];
        // 遍历玩家自定义数据-背包
        for (let i = 0; i < Game.player.data.package.length; i++) {
            // 创建对应的背包物品项数据，该项数据由系统自动生成
            let d = new ListItem_1002;
            // 获取背包的道具DS格式
            let itemDS = Game.player.data.package[i];
            // 绑定项数据，项显示对象会自动根据项数据设置对应的值，参考UIList.api头部注释（CTRL+SHIFT+R搜索UIList.api）
            d.data = itemDS; // 项数据记录对应的道具，以便能够通过项数据找到其对应的道具
            if (itemDS.isEquip) {
                d.icon = itemDS.equip.icon; // 设置图标
                d.itemName = itemDS.equip.name; // 设置名称
            }
            else {
                d.icon = itemDS.item.icon; // 设置图标
                d.itemName = itemDS.item.name; // 设置名称
            }
            // 禁用标识
            d.itemNum = "x" + itemDS.number.toString(); // 设置道具数目
            arr.push(d);
        }
        // 如果没有道具的话：追加一个空项
        if (Game.player.data.package.length == 0) {
            let emptyItem = new ListItem_1002;
            emptyItem.icon = "";
            emptyItem.itemName = "";
            emptyItem.itemNum = "";
            arr.push(emptyItem)
        }
        // 刷新排列
        arr.sort((aListItem, bListItem) => {
            let a = aListItem.data as DataStructure_packageItem;
            let b = bListItem.data as DataStructure_packageItem;
            if (!a || !b) return -1;
            // -- 道具比装备更优先
            if (a.isEquip != b.isEquip) {
                return a.isEquip ? 1 : -1;
            }
            // -- 可使用道具更优先排列，否则按照编号排列
            else if (!a.isEquip) {
                if (a.item.isUse != b.item.isUse) {
                    return a.item.isUse ? -1 : 1;
                }
                else {
                    return a.item.id < b.item.id ? -1 : 1;
                }
            }
            // -- 装备按照编号排列
            else {
                return a.equip.id < b.equip.id ? -1 : 1;
            }
        });
        // 刷新列表
        this.list.items = arr;
    }
    /**
     * 刷新道具详情
     */
    private refreshItemInfo() {
        // 获取选中的项数据
        let selectedItem = this.list.selectedItem;
        this.itemName.color = this.itemNameInitColor;
        // 未选中任何道具的情况
        if (!selectedItem || !selectedItem.data) {
            this.itemName.text = "";
            this.itemIntro.text = "";
        }
        // 已选中道具的情况：显示该道具详情
        else {
            let itemDS: DataStructure_packageItem = selectedItem.data;
            // 如果是装备，则显示为装备的名称和介绍
            if (itemDS.isEquip) {
                this.itemName.text = itemDS.equip.name;
                this.itemIntro.text = GUI_Manager.equipDesc(itemDS.equip);
                this.itemName.color = GUI_Manager.getEquipNameColorByInstance(itemDS.equip);
            }
            // 否则显示道具的名称和介绍
            else {
                this.itemName.text = itemDS.item.name;
                this.itemIntro.text = itemDS.item.intro;
            }
        }
        this.itemIntro.height = this.itemIntro.textHeight;
        this.itemIntroRoot.refresh();
    }
}
