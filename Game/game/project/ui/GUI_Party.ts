/**
 * 队伍编成
 * Created by 黑暗之神KDS on 2021-01-09 07:08:31.
 */
class GUI_Party extends GUI_16 {
    /**
     * 是否从战斗中的装备入口打开。
     * 战斗中打开队伍界面时需要在关闭后恢复当前战斗者菜单和玩家控制。
     */
    private battleEquipmentMode: boolean = false;
    /**
     * 初始描述颜色
     */
    private descNameInitColor: string;
    /**
     * 构造函数
     */
    constructor() {
        super();
        // 记录初始描述的颜色
        this.descNameInitColor = this.descName.color;
        // 当显示该界面时触发的事件
        this.on(EventObject.DISPLAY, this, this.onDisplay);
        // 战斗中关闭装备界面时恢复战斗控制
        this.on(EventObject.UNDISPLAY, this, this.onUndisplay);
        // 当选中角色项时刷新角色数据
        this.actorList.on(EventObject.CHANGE, this, this.onActorListChange);
        // 当操作角色时
        this.actorList.on(UIList.ITEM_CLICK, this, this.onActorItemClick);
        // 标准化List
        GUI_Manager.standardList(this.actorList);
        GUI_Manager.standardList(this.actorEquipList);
        GUI_Manager.standardList(this.equipPackageList, false);
        GUI_Manager.standardList(this.actorSkillList, false);
        GUI_Manager.standardList(this.itemPackageList, false);
        // 当角色功能标签栏切换时
        this.actorPanelTab.on(EventObject.CHANGE, this, this.onActorPanelTabChange);
        // 当创建角色列表项时
        this.actorList.on(UIList.ITEM_CREATE, this, this.onCreateActorItem);
        // 当创建技能列表项时
        this.actorSkillList.on(UIList.ITEM_CREATE, this, this.onCreateActorSkillItem);
        // 当创建可装备栏项时（玩家背包中的装备）
        this.equipPackageList.on(UIList.ITEM_CREATE, this, this.onCreateEquipPackageItem);
        // 当创建可携带的道具栏项时（玩家背包中的道具）
        this.itemPackageList.on(UIList.ITEM_CREATE, this, this.onCreateItemPackageItem);
        // 当技能栏选中项更改时
        this.actorSkillList.on(EventObject.CHANGE, this, this.onActorSkillChange);
        // 当角色装备栏选中项更改时
        this.actorEquipList.on(EventObject.CHANGE, this, this.onActorEquipChange);
        // 当角色装备栏确定时
        this.actorEquipList.on(UIList.ITEM_CLICK, this, this.onActorEquipItemClick);
        // 当玩家可装备栏选中项更改时
        this.equipPackageList.on(EventObject.CHANGE, this, this.onEquipPackageChage);
        // 当玩家可装备栏确定时
        this.equipPackageList.on(UIList.ITEM_CLICK, this, this.onEquipPackageItemClick);
        // 当角色物品栏选中项更改时
        this.actorItemList.on(EventObject.CHANGE, this, this.onActorItemChange);
        // 当角色物品栏确定时
        this.actorItemList.on(UIList.ITEM_CLICK, this, this.onActorItemItemClick);
        // 当玩家背包物品栏选中项更改时
        this.itemPackageList.on(EventObject.CHANGE, this, this.onItemPackageChage);
        // 当玩家背包可物品栏确定时
        this.itemPackageList.on(UIList.ITEM_CLICK, this, this.onItemPackageItemClick);
        // 当玩家AI设定更改时
        this.ai.on(EventObject.CHANGE, this, this.onChangeActorAI);
        // 按键
        stage.on(EventObject.KEY_DOWN, this, this.onKeyDown);
        // 鼠标激活列表
        GUI_Manager.regHitAreaFocusList(this.actorPanel, this.actorList, true, FocusButtonsManager.closeFocus);
        GUI_Manager.regHitAreaFocusList(this.skillPanel, this.actorSkillList);
        GUI_Manager.regHitAreaFocusList(this.actorEquipPanel, this.actorEquipList);
        GUI_Manager.regHitAreaFocusList(this.equipPackagePanel, this.equipPackageList, false);
        GUI_Manager.regHitAreaFocusList(this.actorItemPanel, this.actorItemList);
        GUI_Manager.regHitAreaFocusList(this.itemPackagePanel, this.itemPackageList, false);
        // 当列表焦点改变时事件
        EventUtils.addEventListenerFunction(UIList, UIList.EVENT_FOCUS_CHANGE, this.onListFocusChange, this);
        // 监听数据变化刷新
        EventUtils.addEventListenerFunction(Game, Game.EVENT_LEARN_SKILL, this.refreshActorSkillPanel, this);
        EventUtils.addEventListenerFunction(Game, Game.EVENT_FORGET_SKILL, this.refreshActorSkillPanel, this);
    }
    //------------------------------------------------------------------------------------------------------
    // 接口
    //------------------------------------------------------------------------------------------------------
    /**
     * 从肉鸽地图进入时直接定位到装备页签。
     *
     * 队伍编成界面会复用同一个 UI 实例，默认页签可能停留在技能或行囊，
     * 这会让肉鸽奖励刚获得的装备看起来像是没有入口。普通入口不受影响，
     * 只有肉鸽地图会显式调用此方法。
     */
    public openEquipmentTab(inPartyIndex: number = -1): void {
        this.actorPanelTab.selectedIndex = 1;
        // 战斗入口默认定位到当前操作角色，普通入口保持原有选择。
        if (inPartyIndex >= 0 && inPartyIndex < this.actorList.length) {
            this.actorList.selectedIndex = inPartyIndex;
        }
        // selectedIndex 未变化时引擎不会派发 CHANGE，因此主动刷新焦点。
        this.refreshOperactionActorFocus();
    }

    /**
     * 从战斗中的战斗者菜单打开装备页。
     */
    public openBattleEquipmentTab(inPartyIndex: number = -1): void {
        this.battleEquipmentMode = true;
        this.openEquipmentTab(inPartyIndex);
    }

    /**
     * 快捷键：返回
     */
    static onBack(): boolean {
        let uiParty = GameUI.get(16) as GUI_Party;
        // 关闭界面
        if (UIList.focus == uiParty.actorList) {
            return true;
        }
        // 回到角色装备界面
        else if (UIList.focus == uiParty.equipPackageList) {
            UIList.focus = uiParty.actorEquipList;
            // 刷新装备变更时的属性差预览
            uiParty.refreshPreEquipChangeInfo();
        }
        // 回到角色道具界面
        else if (UIList.focus == uiParty.itemPackageList) {
            UIList.focus = uiParty.actorItemList;
        }
        // 回到角色界面
        else if (UIList.focus != uiParty.actorList) {
            FocusButtonsManager.closeFocus();
            UIList.focus = uiParty.actorList;
        }
        // 刷新描述
        uiParty.refreshDescribe();
        return false;
    }
    /**
     * 解散选定的角色
     */
    static dissolutionPartyActor(): void {
        let uiParty = GameUI.get(16) as GUI_Party;
        if (!uiParty) return;
        if (!uiParty.selectedActorDS) return;
        if (Game.player.data.party.length == 1 || !uiParty.selectedActorDS.dissolutionEnabled) {
            GameAudio.playSE(WorldData.disalbeSE);
            return;
        }
        GameAudio.playSE(WorldData.sureSE);
        ProjectPlayer.removePlayerActorByInPartyIndex(uiParty.actorList.selectedIndex);
        uiParty.refreshActorList();
        FocusButtonsManager.closeFocus();
        UIList.focus = uiParty.actorList;
    }
    //------------------------------------------------------------------------------------------------------
    // 通常
    //------------------------------------------------------------------------------------------------------
    /**
     * 当按键按下时
     * @param e 
     */
    private onKeyDown(e: EventObject) {
        if (!this.stage) return;
        // 战斗中装备界面由战斗控制器暂停流程，B 键只负责关闭本界面。
        if (this.battleEquipmentMode && GUI_Setting.IS_KEY(e.keyCode, GUI_Setting.KEY_BOARD.B)) {
            GameUI.hide(16);
            return;
        }
        // 切换标签按键按下时切换对应的标签
        if (GUI_Setting.IS_KEY(e.keyCode, GUI_Setting.KEY_BOARD.L1)) {
            this.actorPanelTab.selectedIndex = Math.max(this.actorPanelTab.selectedIndex - 1, 0);
        }
        else if (GUI_Setting.IS_KEY(e.keyCode, GUI_Setting.KEY_BOARD.R1)) {
            this.actorPanelTab.selectedIndex = Math.min(this.actorPanelTab.length - 1, this.actorPanelTab.selectedIndex + 1);
        }
    }

    /**
     * 界面关闭时恢复战斗控制。普通队伍界面关闭不参与战斗流程。
     */
    private onUndisplay(): void {
        if (!this.battleEquipmentMode) return;
        this.battleEquipmentMode = false;
        GameBattleController.onBattleEquipmentClosed();
    }
    /**
     * 当列表焦点改变时事件
     * @param lastFocus 上一个焦点
     * @param currentFocus 当前焦点
     */
    private onListFocusChange(lastFocus: UIList, currentFocus: UIList) {
        if (this.stage) {
            // 刷新焦点栏显示
            this.refreshFocusBarVisible();
            // 刷新装备变更时的属性差预览
            this.refreshPreEquipChangeInfo();
            // 刷新描述栏
            this.refreshDescribe();
            // 刷新焦点按钮
            if (UIList.focus == this.actorList) {
                FocusButtonsManager.closeFocus();
            }
        }

    }
    //------------------------------------------------------------------------------------------------------
    // 角色列表
    //------------------------------------------------------------------------------------------------------
    /**
     * 当角色列表选中发生变更时
     * @param state state=0 表示selectedIndex改变，否则是overIndex
     */
    private onActorListChange(state: number) {
        // 忽略掉悬停时触发的CHANGE事件
        if (state != 0) return;
        this.refreshActorPanels(true);
    }
    /**
     * 确认操作该角色时处理
     */
    private onActorItemClick() {
        this.refreshOperactionActorFocus();
    }
    /**
     * 当角色功能标签栏切换时
     */
    private onActorPanelTabChange() {
        if (WorldData.selectSE) GameAudio.playSE(WorldData.selectSE);
        this.refreshOperactionActorFocus();
    }
    /**
     * 刷新操作角色焦点
     */
    private refreshOperactionActorFocus() {
        // 技能
        if (this.actorPanelTab.selectedIndex == 0) {
            UIList.focus = this.actorSkillList;
        }
        // 装备
        else if (this.actorPanelTab.selectedIndex == 1) {
            UIList.focus = this.actorEquipList;
        }
        // 道具
        else if (this.actorPanelTab.selectedIndex == 2) {
            UIList.focus = this.actorItemList;
        }
        // 设置
        else if (this.actorPanelTab.selectedIndex == 3) {
            UIList.focus = null;
            if (this.actorPanelTab.onChangeFragEvent)
                CommandPage.startTriggerFragmentEvent(this.actorPanelTab.onChangeFragEvent, Game.player.sceneObject, Game.player.sceneObject);
        }
        // 刷新描述
        this.refreshDescribe();
    }
    /**
     * 刷新焦点栏显示
     */
    private refreshFocusBarVisible() {
        this.actorSkillList.selectedImage.visible = UIList.focus == this.actorSkillList;
        this.actorEquipList.selectedImage.visible = UIList.focus == this.actorEquipList || UIList.focus == this.equipPackageList;
        this.equipPackageList.selectedImage.visible = UIList.focus == this.equipPackageList;
        this.actorItemList.selectedImage.visible = UIList.focus == this.actorItemList || UIList.focus == this.itemPackageList;
        this.itemPackageList.selectedImage.visible = UIList.focus == this.itemPackageList;
    }
    //------------------------------------------------------------------------------------------------------
    // 数据
    //------------------------------------------------------------------------------------------------------
    /**
     * 获取当前选中的角色DS
     * @return [DataStructure_inPartyActor] 
     */
    private get selectedActorDS(): DataStructure_inPartyActor {
        let d = this.actorList.selectedItem as ListItem_1011;
        if (!d) return;
        let actorDS: DataStructure_inPartyActor = d.data;
        if (!actorDS) return;
        return actorDS;
    }
    //------------------------------------------------------------------------------------------------------
    // 初始化
    //------------------------------------------------------------------------------------------------------
    private onDisplay() {
        // 刷新队伍成员列表
        this.refreshActorList();
        // 焦点
        UIList.focus = this.actorList;
        // 刷新描述
        this.refreshDescribe();
        // 不显示装备属性变更预览
        this.attributeChangeBox.visible = false;
        // 刷新焦点栏显示
        this.refreshFocusBarVisible();
    }
    //------------------------------------------------------------------------------------------------------
    // 队伍成员
    //------------------------------------------------------------------------------------------------------
    /**
     * 当创建可装备的道具栏项时
     */
    private onCreateActorItem(ui: GUI_1011, data: ListItem_1011, index: number) {
        let actorDS: DataStructure_inPartyActor = data.data;
        if (actorDS) {
            ui.ai.visible = actorDS.actor.AI ? true : false;
        }
    }
    /**
     * 刷新角色列表
     */
    private refreshActorList() {
        let arr = [];
        // 遍历我的队伍
        for (let i = 0; i < Game.player.data.party.length; i++) {
            // 获取角色DS格式数据
            let actorDS: DataStructure_inPartyActor = Game.player.data.party[i];
            // 获取角色模块数据
            let actor: Module_Actor = actorDS.actor;
            // 创建列表的项数据
            let d = new ListItem_1011;
            // 头像
            d.face = actor.face;
            // 绑定数据，以免后面直接访问
            d.data = actorDS;
            // 添加至数组中
            arr.push(d);
        }
        this.actorList.items = arr;
    }
    //------------------------------------------------------------------------------------------------------
    // 角色面板
    //------------------------------------------------------------------------------------------------------
    /**
     * 刷新角色面板
     * @param needRefreshPackage 需要刷新玩家背包（物品、装备）
     */
    private refreshActorPanels(needRefreshPlayerPackage: boolean) {
        // 获取角色数据
        let d = this.actorList.selectedItem as ListItem_1011;
        if (!d) return;
        let actorDS: DataStructure_inPartyActor = d.data;
        if (!actorDS) return;
        // 计算并刷新角色属性
        Game.refreshActorAttribute(actorDS.actor, actorDS.lv);
        // 刷新角色数据面板显示
        this.refreshActorDataPanel();
        // 刷新角色技能
        this.refreshActorSkillPanel();
        // 刷新角色装备
        this.refreshActorEquips();
        // 刷新角色道具
        this.refreshActorItems();
        // 刷新角色设置
        this.refreshActorSetting();
        // 需要刷新玩家背包（物品、装备）的情况
        if (needRefreshPlayerPackage) {
            // 刷新可装备栏
            this.refreshEquipPackageList();
            // 刷新可佩戴道具栏
            this.refreshItemPackageList();
        }
    }
    //------------------------------------------------------------------------------------------------------
    // 属性
    //------------------------------------------------------------------------------------------------------
    /**
     * 刷新角色数据面板
     */
    private refreshActorDataPanel() {
        let selectedActorDS = this.selectedActorDS;
        if (!selectedActorDS) return;
        let selectedActor = selectedActorDS.actor;
        // 基本信息
        this.actorBattler.avatarID = selectedActor.battlerAvatar;
        this.actorName.text = selectedActor.name;
        this.smallAvatar.avatarID = selectedActor.avatar;
        let classData: Module_Class = GameData.getModuleData(7, selectedActor.class);
        this.actorClass.text = classData ? classData.name : "";
        this.classIcon.image = classData ? classData.icon : "";
        // 等级和经验
        if (selectedActor.growUpEnabled) {
            this.LevelRoot.visible = true;
            let nextExp = Game.getLevelUpNeedExp(selectedActor, selectedActorDS.lv);
            this.actorExpSlider.value = selectedActor.currentEXP * 100 / nextExp;
        }
        else {
            this.LevelRoot.visible = false;
            this.actorExpSlider.value = 100;
        }
    }
    //------------------------------------------------------------------------------------------------------
    // 角色面板-技能
    //------------------------------------------------------------------------------------------------------
    /**
     * 当创建技能栏项时
     */
    private onCreateActorSkillItem(ui: GUI_1013, data: ListItem_1013, index: number) {

    }
    /**
     * 刷新角色技能面板
     */
    private refreshActorSkillPanel() {
        let selectedActorDS = this.selectedActorDS;
        if (!selectedActorDS) return;
        let arr = [];
        // 遍历角色的技能
        for (let i = 0; i < selectedActorDS.actor.skills.length; i++) {
            // 获取背包的道具DS格式
            let skill: Module_Skill = selectedActorDS.actor.skills[i];
            // 如果没有技能图标忽略显示
            if (!skill.icon) continue;
            // 创建对应的背包物品项数据，该项数据由系统自动生成
            let d = new ListItem_1013;
            // 绑定项数据，项显示对象会自动根据项数据设置对应的值，参考UIList.api头部注释（CTRL+SHIFT+R搜索UIList.api）
            d.data = skill; // 项数据记录对应的技能，以便能够通过项数据找到其对应的技能
            d.icon = skill.icon; // 设置图标
            d.skillName = skill.name; // 设置技能名称
            arr.push(d);
        }
        this.actorSkillList.items = arr;
    }
    /**
     * 当技能选中发生改变时处理
     */
    private onActorSkillChange() {
        this.refreshDescribe();
    }
    //------------------------------------------------------------------------------------------------------
    // 角色面板-装备
    //------------------------------------------------------------------------------------------------------
    /**
     * 当创建可装备的背包道具栏项时
     */
    private onCreateEquipPackageItem(ui: GUI_1014, data: ListItem_1014, index: number) {
        let equipDS: DataStructure_packageItem = data.data;
        if (equipDS) {
            ui.unequipBtn.visible = false;
            ui.equipBox.visible = true;
            ui.itemName.color = GUI_Manager.getEquipNameColorByInstance(equipDS.equip);
        }
        else {
            ui.unequipBtn.visible = true;
            ui.equipBox.visible = false;
        }
    }
    /**
     * 刷新角色装备
     */
    private refreshActorEquips() {
        let selectedActorDS = this.selectedActorDS;
        if (!selectedActorDS) return;
        let arr = [];
        let lastSelectedIndex = this.actorEquipList.selectedIndex;
        if (lastSelectedIndex == -1) lastSelectedIndex = 0;
        // 遍历部件
        let equipPartsLength = GameData.getLength(19, 1);
        for (let i = 1; i <= equipPartsLength; i++) {
            let equip: Module_Equip = Game.getActorEquipByPartID(selectedActorDS.actor, i);
            // 创建对应的背包物品项数据，该项数据由系统自动生成
            let d = new ListItem_1012;
            // 该部件存在装备的情况下
            if (equip) {
                d.data = equip;
                d.icon = equip.icon;
            }
            else {
                d.icon = "";
            }
            d.partName = GameData.getModuleData(19, i).name;
            arr.push(d);
        }
        this.actorEquipList.items = arr;
        this.actorEquipList.selectedIndex = lastSelectedIndex;
    }
    /**
     * 刷新可装备列表
     * -- 进入编成界面时刷新
     * -- 携带/卸下装备时刷新
     */
    private refreshEquipPackageList() {
        let selectedActorDS = this.selectedActorDS;
        if (!selectedActorDS) return;
        let equipSelectIndex = this.actorEquipList.selectedIndex;
        if (equipSelectIndex < 0) return;
        let partID = equipSelectIndex + 1;
        // 筛选出背包的全部装备
        let allEquips: DataStructure_packageItem[] = ArrayUtils.matchAttributes(Game.player.data.package, { isEquip: true }, false) as any;
        // 筛选出指定部件的装备
        let partEquips: DataStructure_packageItem[] = ArrayUtils.matchAttributesD2(allEquips, "equip", { partID: partID }, false);
        // 筛选出可职业可佩带的装备
        let classID = selectedActorDS.actor.class;
        let classData: Module_Class = GameData.getModuleData(7, classID);
        if (!classData) return;
        for (let i = 0; i < partEquips.length; i++) {
            if (classData.equipSetting.indexOf(partEquips[i].equip.type) == -1) {
                partEquips.splice(i, 1);
                i--;
            }
        }
        // 刷新可装备的列表
        let items = [new ListItem_1014];
        for (let i = 0; i < partEquips.length; i++) {
            let d = new ListItem_1014;
            let packageEquip: DataStructure_packageItem = partEquips[i];
            d.data = packageEquip;
            d.itemName = packageEquip.equip.name;
            d.icon = packageEquip.equip.icon;
            d.itemNum = "x" + packageEquip.number;
            items.push(d);
        }
        this.equipPackageList.items = items;
    }
    /**
     * 当角色装备栏选项发生改变时
     */
    private onActorEquipChange(): void {
        // 刷新可佩戴的装备列表
        this.refreshEquipPackageList();
        // 刷新描述
        this.refreshDescribe();
    }
    /**
     * 当角色装备栏确定时
     */
    private onActorEquipItemClick(): void {
        // 焦点设置为可装备栏
        UIList.focus = this.equipPackageList;
        // 刷新描述
        this.refreshDescribe();
        // 刷新装备变更时的属性差预览
        this.refreshPreEquipChangeInfo();
    }
    /**
     * 当可装备栏选项发生改变时
     */
    private onEquipPackageChage(): void {
        // 刷新描述
        this.refreshDescribe();
        // 刷新装备变更时的属性差预览
        this.refreshPreEquipChangeInfo();
    }
    /**
     * 当可装备栏确定时
     */
    private onEquipPackageItemClick(): void {
        let selectedActorDS = this.selectedActorDS;
        let actor = selectedActorDS.actor;
        let index = this.equipPackageList.selectedIndex;
        let actorInPartyIndex = this.actorList.selectedIndex;
        let equipPartID = this.actorEquipList.selectedIndex + 1;
        // 卸下
        if (index == 0) {
            let takeOffEuqip = ProjectPlayer.takeOffPlayerActorEquipByPartID(actorInPartyIndex, equipPartID);
            if (takeOffEuqip) GameAudio.playSE(ClientWorld.data.unequipSE);
            else GameAudio.playSE(ClientWorld.data.disalbeSE);
        }
        else {
            let res: { success: boolean, takeOffEquip: Module_Equip };
            let itemData = this.equipPackageList.selectedItem;
            let equipDS = itemData.data as DataStructure_packageItem;
            if (equipDS && equipDS.equip) {
                let equip = equipDS.equip;
                res = ProjectPlayer.wearPlayerActorEquip(actorInPartyIndex, equip);
            }
            if (res.success) GameAudio.playSE(ClientWorld.data.equipSE);
            else GameAudio.playSE(ClientWorld.data.disalbeSE);
        }
        // 计算并刷新角色属性
        Game.refreshActorAttribute(actor, selectedActorDS.lv);
        // 刷新角色属性显示
        this.refreshActorDataPanel();
        // 刷新列表
        this.refreshActorEquips();
        this.refreshEquipPackageList();
        // 焦点回到角色装备栏
        UIList.focus = this.actorEquipList;
        // 刷新装备更换预览
        this.refreshPreEquipChangeInfo();
        // 刷新描述
        this.refreshDescribe();
    }
    /**
     * 刷新装备变更时的属性差预览
     */
    private refreshPreEquipChangeInfo(): void {
        if (UIList.focus == this.equipPackageList) {
            let actor = this.selectedActorDS.actor;
            this.attributeChangeBox.visible = true;
            // 计算更换装备的属性变更预览
            let previewChangeEquipDS: DataStructure_packageItem = this.equipPackageList.selectedItem.data;
            let previewChangeEquip = previewChangeEquipDS ? previewChangeEquipDS.equip : null;
            let previewChangeEquipIndex = this.actorEquipList.selectedIndex;
            let previewChangeEquipID = previewChangeEquipIndex + 1;
            CustomGameNumber.attributeRes = Game.clacActorAttribute(actor, this.selectedActorDS.lv, 2, previewChangeEquipID, previewChangeEquip);
            // 属性变更显示
            this.setEquipChangePreviewAttributeLabel(this.MaxHP2, actor.MaxHP, CustomGameNumber.attributeRes.MaxHP);
            this.setEquipChangePreviewAttributeLabel(this.MaxSP2, actor.MaxSP, CustomGameNumber.attributeRes.MaxSP);
            this.setEquipChangePreviewAttributeLabel(this.ATK2, actor.ATK, CustomGameNumber.attributeRes.ATK);
            this.setEquipChangePreviewAttributeLabel(this.DEF2, actor.DEF, CustomGameNumber.attributeRes.DEF);
            this.setEquipChangePreviewAttributeLabel(this.MAG2, actor.MAG, CustomGameNumber.attributeRes.MAG);
            this.setEquipChangePreviewAttributeLabel(this.MagDef2, actor.MagDef, CustomGameNumber.attributeRes.MagDef);
            this.setEquipChangePreviewAttributeLabel(this.HIT2, actor.HIT, CustomGameNumber.attributeRes.HIT);
            this.setEquipChangePreviewAttributeLabel(this.DOD2, actor.DOD, CustomGameNumber.attributeRes.DOD);
            this.setEquipChangePreviewAttributeLabel(this.CRIT2, actor.CRIT, CustomGameNumber.attributeRes.CRIT);
            this.setEquipChangePreviewAttributeLabel(this.MagCrit2, actor.MagCrit, CustomGameNumber.attributeRes.MagCrit);
            this.setEquipChangePreviewAttributeLabel(this.MoveGrid2, actor.MoveGrid, CustomGameNumber.attributeRes.MoveGrid);
            for (let i = 1; i <= actor.extendAttributes.length; i++) {
                let attributeStr = this[`E` + i];
                if (attributeStr) this.setEquipChangePreviewAttributeLabel(attributeStr, actor.extendAttributes[i], CustomGameNumber.attributeRes.extendAttributes[i]);
            }
        }
        else {
            this.attributeChangeBox.visible = false;
        }
    }
    /**
     * 设置属性变更颜色和文本显示
     * @param attributeStr 
     * @param value 
     * @param toValue 
     */
    private setEquipChangePreviewAttributeLabel(attributeStr: UIString, value: number, toValue: number) {
        if (value == toValue) {
            attributeStr.visible = false;
        }
        else {
            attributeStr.visible = true;
            if (toValue > value) {
                attributeStr.color = this.increaseColor.color;
            }
            else {
                attributeStr.color = this.reduceColor.color;
            }
        }
    }
    //------------------------------------------------------------------------------------------------------
    // 角色面板-道具
    //------------------------------------------------------------------------------------------------------
    /**
     * 当创建可携带的道具栏项时
     */
    private onCreateItemPackageItem(ui: GUI_1016, data: ListItem_1016, index: number) {
        let itemDS: DataStructure_packageItem = data.data;
        if (itemDS) {
            ui.unitemBtn.visible = false;
            ui.itemBox.visible = true;
        }
        else {
            ui.unitemBtn.visible = true;
            ui.itemBox.visible = false;
        }
    }
    /**
     * 刷新角色道具
     */
    private refreshActorItems() {
        // 获取当前选中的角色
        let selectedActorDS = this.selectedActorDS;
        if (!selectedActorDS) return;
        // 初始化
        let arr = [];
        let lastSelectedIndex = this.actorItemList.selectedIndex;
        if (lastSelectedIndex == -1) lastSelectedIndex = 0;
        // 获取角色道具栏最大值，使用第一个预设角色的道具栏最大值作为
        let actorItemMax = WorldData.actorItemMax;
        // 遍历角色道具栏
        for (let i = 0; i < actorItemMax; i++) {
            let item: Module_Item = selectedActorDS.actor.items[i];
            // 创建对应的背包物品项数据，该项数据由系统自动生成
            let d = new ListItem_1015;
            // 该部件存在装备的情况下
            if (item) {
                d.data = item;
                d.icon = item.icon;
            }
            else {
                d.icon = "";
            }
            arr.push(d);
        }
        this.actorItemList.items = arr;
        this.actorItemList.selectedIndex = lastSelectedIndex;
    }
    /**
     * 刷新可用于携带的道具栏（玩家背包）
     * -- 进入编成界面时刷新
     * -- 携带/卸下道具时刷新
     */
    private refreshItemPackageList() {
        let selectedActorDS = this.selectedActorDS;
        if (!selectedActorDS) return;
        let itemSelectIndex = this.actorItemList.selectedIndex;
        if (itemSelectIndex < 0) return;
        // 筛选出背包的全部道具
        let allItems: DataStructure_packageItem[] = ArrayUtils.matchAttributes(Game.player.data.package, { isEquip: false }, false) as any;
        // 允许战斗中使用的才出现
        allItems = ArrayUtils.matchAttributesD2(allItems, "item", { useType: 1 }, false, "!=");
        // 刷新可装备的列表
        let items = [new ListItem_1016];
        for (let i = 0; i < allItems.length; i++) {
            let d = new ListItem_1016;
            let packageItem: DataStructure_packageItem = allItems[i];
            // 仅在非战斗中使用，不允许列出
            if (packageItem.item.useType == 1) continue;
            d.data = packageItem;
            d.itemName = packageItem.item.name;
            d.icon = packageItem.item.icon;
            d.itemNum = "x" + packageItem.number;
            items.push(d);
        }
        this.itemPackageList.items = items;
    }
    /**
     * 当角色物品栏选中项更改时
     */
    private onActorItemChange(): void {
        // 刷新描述
        this.refreshDescribe();
    }
    /**
     * 当角色物品栏确定时
     */
    private onActorItemItemClick(): void {
        // 焦点设置为玩家道具背包
        UIList.focus = this.itemPackageList;
        // 刷新描述
        this.refreshDescribe();
    }
    /**
     * 当玩家背包物品栏选中项更改时
     */
    private onItemPackageChage(): void {
        // 刷新描述
        this.refreshDescribe();
    }
    /**
     * 当玩家背包可物品栏确定时
     */
    private onItemPackageItemClick(): void {
        let selectedActorDS = this.selectedActorDS;
        let actor = selectedActorDS.actor;
        let index = this.itemPackageList.selectedIndex;
        let actorInPartyIndex = this.actorList.selectedIndex;
        let itemIndex = this.actorItemList.selectedIndex;
        // 卸下
        if (index == 0) {
            let item = ProjectPlayer.unPlayerActorItemByItemIndex(actorInPartyIndex, itemIndex);
            if (item) GameAudio.playSE(ClientWorld.data.unequipSE);
            else GameAudio.playSE(ClientWorld.data.disalbeSE);
        }
        else {
            let itemData = this.itemPackageList.selectedItem;
            let itemDS = itemData.data as DataStructure_packageItem;
            let res: { success: boolean, removeItem: Module_Item };
            if (itemDS && itemDS.item) {
                let item = itemDS.item;
                res = ProjectPlayer.carryPlayerActorItemFromPakcage(actorInPartyIndex, item, itemIndex);
            }
            if (res && res.success) GameAudio.playSE(ClientWorld.data.equipSE);
            else GameAudio.playSE(ClientWorld.data.disalbeSE);
        }
        // 刷新列表
        this.refreshActorItems();
        this.refreshItemPackageList();
        // 焦点回到角色道具栏
        UIList.focus = this.actorItemList;
        // 刷新描述
        this.refreshDescribe();
    }
    //------------------------------------------------------------------------------------------------------
    // 角色面板-设置
    //------------------------------------------------------------------------------------------------------
    /**
     * 刷新角色
     */
    refreshActorSetting() {
        let selectedActorDS = this.selectedActorDS;
        if (!selectedActorDS) return;
        this.ai.selected = selectedActorDS.actor.AI;
        this.dissolutionBox.visible = this.dissolutionBtn.visible = selectedActorDS.dissolutionEnabled;
    }
    /**
     * 更改角色AI
     */
    onChangeActorAI(): void {
        let selectedActorDS = this.selectedActorDS;
        if (!selectedActorDS) return;
        selectedActorDS.actor.AI = this.ai.selected;
        let actorItemUI = this.actorList.getItemUI(this.actorList.selectedIndex);
        // 刷新角色列表的单项（此处优化，无需刷新全部列表）
        this.onCreateActorItem(actorItemUI as GUI_1011, this.actorList.selectedItem as ListItem_1011, this.actorList.selectedIndex);
    }
    //------------------------------------------------------------------------------------------------------
    // 描述
    //------------------------------------------------------------------------------------------------------
    /**
     * 刷新描述
     */
    private refreshDescribe(): void {
        let name = "";
        let desc = "";
        this.descName.color = this.descNameInitColor;
        // 焦点在技能栏的情况下
        if (UIList.focus == this.actorSkillList) {
            let itemData = this.actorSkillList.selectedItem;
            let skill = itemData?.data as Module_Skill;
            if (skill) {
                name = skill.name;
                desc = GUI_Manager.skillDesc(skill, this.selectedActorDS.actor);
            }
        }
        // 焦点在装备栏的情况下
        else if (UIList.focus == this.actorEquipList) {
            let equip: Module_Equip = this.actorEquipList.selectedItem?.data;
            if (equip) {
                name = equip.name;
                desc = GUI_Manager.equipDesc(equip);
                this.descName.color = GUI_Manager.getEquipNameColorByInstance(equip);
            }
        }
        // 焦点在可装备栏的情况下
        else if (UIList.focus == this.equipPackageList) {
            let itemData = this.equipPackageList.selectedItem;
            let equipDS = itemData?.data as DataStructure_packageItem;
            if (equipDS && equipDS.equip) {
                let equip = equipDS.equip;
                name = equip.name;
                desc = GUI_Manager.equipDesc(equip);
                this.descName.color = GUI_Manager.getEquipNameColorByInstance(equip);
            }
        }
        // 焦点在物品栏的情况下
        else if (UIList.focus == this.actorItemList) {
            let item: Module_Item = this.actorItemList.selectedItem.data;
            if (item) {
                name = item.name;
                desc = GUI_Manager.itemDesc(item);
            }
        }
        // 焦点在可物品栏的情况下
        else if (UIList.focus == this.itemPackageList) {
            let itemData = this.itemPackageList.selectedItem;
            let itemDS = itemData.data as DataStructure_packageItem;
            if (itemDS && itemDS.item) {
                let item = itemDS.item;
                name = item.name;
                desc = GUI_Manager.itemDesc(item);
            }
        }
        this.descName.text = name;
        this.descText.text = desc;
        this.descText.height = this.descText.textHeight;
        this.descRoot.refresh();
    }
}
