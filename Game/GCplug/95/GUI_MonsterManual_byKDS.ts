/**
 * 怪物图鉴
 * Created by 黑暗之神KDS on 2020-10-04 02:55:02.
 */
//------------------------------------------------------------------------------------------------------
// 界面绑定类
//------------------------------------------------------------------------------------------------------

class GUI_MonsterManual_byKDS extends GUI_15001 {
    /**
     * 怪物图鉴模块所在的类别编号
     */
    static PLUGIN_MODULE_TYPE_MONSTER_MANUAL: number = 21;
    /**
     * 该界面所在索引
     */
    static PLUGIN_GUI_MONSTER_MANUAL: number = 15001;
    /**
     * 事件：需要刷新的标记
     */
    static EVENT_NEED_REFRESH: string = "GUI_MonsterManual_byKDSEVENT_NEED_REFRESH";
    /**
     * 脏标记：用于区分是否需要刷新列表
     */
    private isDirty: boolean = true;
    /**
     * 记录大图原始尺寸，最小比例缩放
     */
    private bigPicPersetRect: Rectangle;
    /**
     * 构造函数
     */
    constructor() {
        super();
        // 标准化
        GUI_Manager.standardList(this.list);
        // 监听：界面显示时事件
        this.on(EventObject.DISPLAY, this, this.onDisplay);
        // 监听：关闭按钮点击时候事件
        this.closeBtn.on(EventObject.CLICK, this, this.onClose);
        // 监听：选中焦点改变事件
        this.list.on(EventObject.CHANGE, this, this.refreshInfo);
        // 记录大图原始尺寸
        this.bigPicPersetRect = new Rectangle(0, 0, this.bigPic.width, this.bigPic.height);
        // 监听：解锁图鉴事件
        EventUtils.addEventListener(GUI_MonsterManual_byKDS, GUI_MonsterManual_byKDS.EVENT_NEED_REFRESH, Callback.New(() => {
            this.isDirty = true;
            if (this.stage) this.refreshList();
        }, this));
    }
    /**
     * 当显示时：产生焦点，刷新列表
     */
    private onDisplay() {
        UIList.focus = this.list;
        this.refreshList();
    }
    /**
     * 当关闭按钮点击时：关闭该界面
     */
    private onClose() {
        GameUI.hide(GUI_MonsterManual_byKDS.PLUGIN_GUI_MONSTER_MANUAL);
    }
    /**
     * 刷新道具列表
     */
    private refreshList() {
        if (!this.isDirty) return;
        this.isDirty = false;
        var arr = [];
        // 遍历玩家自定义数据
        for (var s = 1; s <= 16; s++) {
            var max = GameData.getLength(GUI_MonsterManual_byKDS.PLUGIN_MODULE_TYPE_MONSTER_MANUAL, s);
            for (var i = 1; i <= max; i++) {
                // 获取怪物图鉴数据
                var monsterID = (s - 1) * 1000 + i;
                var monsterData: Module_怪物图鉴 = GameData.getModuleData(GUI_MonsterManual_byKDS.PLUGIN_MODULE_TYPE_MONSTER_MANUAL, monsterID);
                // 创建怪物图鉴的项数据，该项数据的类由系统自动生成
                var d = new ListItem_15002;
                // 判断玩家是否拥有
                var hasOwn = Game.player.data.monsterManual_byKDS.indexOf(monsterID) != -1;
                if (hasOwn) {
                    d.data = monsterData;
                    d.smallPic = monsterData.icon;
                }
                arr.push(d);
            }
        }
        // 刷新列表
        this.list.items = arr;
        // 刷新选中效果
        this.refreshInfo();
    }
    /**
     * 刷新道具详情
     */
    private refreshInfo() {
        // 获取选中的项数据
        var selectedItem = this.list.selectedItem;
        // 未选中任何道具的情况
        if (!selectedItem || !selectedItem.data) {
            this.infoRoot.visible = false;
        }
        // 已选中道具的情况：显示该道具详情
        else {
            this.infoRoot.visible = true;
            var moduleData: Module_怪物图鉴 = selectedItem.data;
            this.bigPic.once(EventObject.LOADED, this, () => {
                var tex = this.bigPic.texture;
                if (tex) {
                    var per = GameUtils.getAutoFitSizePre(new Rectangle(0, 0, tex.width, tex.height), this.bigPicPersetRect);
                    this.bigPic.width = tex.width * per;
                    this.bigPic.height = tex.height * per;
                }
            });
            this.bigPic.image = moduleData.showPic;
            this.monsterName.text = moduleData.name;
            this.monsterInfo.text = moduleData.intro;
        }
    }
}
//------------------------------------------------------------------------------------------------------
// 命令
//------------------------------------------------------------------------------------------------------
module CommandExecute {
    /**
     * 解锁图鉴
     */
    export function customCommand_15001(commandPage: CommandPage, cmd: Command, trigger: CommandTrigger, triggerPlayer: ClientPlayer, playerInput: any[], p: CustomCommandParams_15001): void {
        var hasOwn = Game.player.data.monsterManual_byKDS.indexOf(p.unlockID) != -1;
        if (!hasOwn) {
            Game.player.data.monsterManual_byKDS.push(p.unlockID);
            EventUtils.happen(GUI_MonsterManual_byKDS, GUI_MonsterManual_byKDS.EVENT_NEED_REFRESH);
        }
    }
}

