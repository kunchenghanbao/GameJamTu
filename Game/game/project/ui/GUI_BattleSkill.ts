/**
 * 战斗技能栏
 * Created by 黑暗之神KDS on 2021-01-19 06:07:49.
 */
class GUI_BattleSkill extends GUI_25 {
    /**
     * 选择技能 onSelectSkill(skill:Module_Skill);
     */
    static EVENT_SELECT_SKILL: string = "GUI_BattleSkillEVENT_SELECT_SKILL";
    /**
     * 构造函数
     */
    constructor() {
        super();
        // 初始化列表
        GUI_Manager.standardList(this.skillList);
        // 当该界面显示时
        this.on(EventObject.DISPLAY, this, this.onDisplay);
        // 当技能栏选中项更改时
        this.skillList.on(EventObject.CHANGE, this, this.onActorSkillChange);
        // 当技能栏选中项更改时
        this.skillList.on(UIList.ITEM_CLICK, this, this.onSkillItemClick);
        // 当道具栏项创建时
        this.skillList.onCreateItem = Callback.New(this.onCreateSkillItem, this);
    }
    /**
     * 当该界面显示时
     */
    private onDisplay(): void {
        // -- 刷新技能列表
        this.refreshSkillList();
        // -- 焦点
        UIList.focus = this.skillList;
        // -- 刷新说明栏
        this.refreshDescribe();
    }
    /**
     * 刷新技能列表
     */
    private refreshSkillList(): void {
        // -- 获取当前选中的战斗者
        let battler = GameBattleController.currentOperationBattler;
        if (!battler) {
            this.skillList.items = [];
            return;
        }
        // -- 获取战斗者的角色数据
        let battlerModule = battler.getModule(6) as SoModule_Battler;
        let battlerActor = battlerModule.actor;
        // -- 列出非被动技能
        let arr = [];
        for (let i = 0; i < battlerActor.skills.length; i++) {
            let skill = battlerActor.skills[i];
            if (skill.skillType != 2) {
                if (!skill.icon) continue;
                let d = new ListItem_1033;
                d.icon = skill.icon;
                d.data = skill;
                arr.push(d);
            }
        }
        // -- 当没有携带任何道具时
        if (arr.length == 0) {
            let d = new ListItem_1033;
            arr.push(d);
        }
        this.skillList.items = arr;
    }
    /**
     * 当技能选中发生改变时处理
     */
    private onActorSkillChange(): void {
        this.refreshDescribe();
    }
    /**
     * 当技能项点击时
     */
    private onSkillItemClick(): void {
        // 获取战斗者和技能
        let battler = GameBattleController.currentOperationBattler;
        let skill: Module_Skill = this.skillList.selectedItem ? this.skillList.selectedItem.data : null;
        if (!battler || !skill) return;
        // 不允许使用的情况
        let useEnabled = GameBattleHelper.canUseOneSkill(battler, skill);
        if (!useEnabled) {
            GameAudio.playSE(WorldData.disalbeSE);
            return;
        }
        // 关闭技能界面
        GameCommand.startCommonCommand(15019);
        // 派发选择技能的事件
        Callback.CallLaterBeforeRender(() => {
            EventUtils.happen(GUI_BattleSkill, GUI_BattleSkill.EVENT_SELECT_SKILL, [skill]);
        }, this)
    }
    /**
     * 当创建项时
     * @param ui 
     * @param data 
     * @param index 
     */
    private onCreateSkillItem(ui: GUI_1033, data: ListItem_1033, index: number) {
        let skill: Module_Skill = data.data;
        ui.icon.visible = skill ? true : false;
        if (skill) {
            let battler = GameBattleController.currentOperationBattler;
            if (!battler) return;
            let useEnabled = GameBattleHelper.canUseOneSkill(battler, skill);
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
        if (!battler) return;
        let battlerModule = battler.getModule(6) as SoModule_Battler;
        let name = "";
        let desc = "";
        // 焦点在技能栏的情况下
        this.tipsUI.cdBox.visible = false;
        if (UIList.focus == this.skillList) {
            let itemData = this.skillList.selectedItem;
            let skill = itemData.data as Module_Skill;
            if (skill) {
                name = skill.name;
                desc = GUI_Manager.skillDesc(skill, battlerModule.actor);
                // 显示技能冷却时间
                let showCD = skill.currentCD != 0;
                this.tipsUI.cdBox.visible = showCD;
                if (showCD) {
                    let cd = skill.currentCD;
                    this.tipsUI.cdText.text = `${cd}${WorldData.word_turn}`;
                    this.tipsUI.cdSlider.value = (skill.totalCD - skill.currentCD) * 100 / skill.totalCD;
                }
            }
        }
        this.tipsUI.descName.text = name;
        this.tipsUI.descText.text = desc;
        this.tipsUI.descText.height = this.tipsUI.descText.textHeight;
        this.tipsUI.descTextBox.refresh();
    }
}