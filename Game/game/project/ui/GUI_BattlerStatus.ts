/**
 * 战斗者的状态
 * Created by 黑暗之神KDS on 2021-01-26 14:30:15.
 */
class GUI_BattlerStatus extends GUI_27 {
    constructor() {
        super();
        this.on(EventObject.DISPLAY, this, this.onDisplay);
    }

    private onDisplay() {
        this.refreshActorDataPanel();
        this.refreshStatus();
    }

    /**
     * 刷新角色数据面板
     */
    private refreshActorDataPanel() {
        let battler = GameBattleHelper.overCursorNoDeadBattler;
        if (!battler) return;
        let battlerModule = battler.getModule(6) as SoModule_Battler;
        let selectedActor = battlerModule.actor;
        let lv = GameBattleHelper.getLevelByActor(selectedActor);
        // 基本信息
        this.actorFace.image = selectedActor.face;
        this.actorName.text = selectedActor.name;
        this.smallAvatar.avatarID = selectedActor.avatar;
        let classData: Module_Class = GameData.getModuleData(7, selectedActor.class);
        this.actorClass.text = classData?.name;
        this.actorClassIcon.image = classData?.icon;
        // 等级和经验
        if (selectedActor.growUpEnabled) {
            this.LevelRoot.visible = true;
            let nextExp = Game.getLevelUpNeedExp(selectedActor, lv);
            this.actorExpSlider.value = selectedActor.currentEXP * 100 / nextExp;
        }
        else {
            this.LevelRoot.visible = false;
            this.actorExpSlider.value = 100;
        }
    }
    /**
     * 刷新状态栏
     */
    private refreshStatus() {
        let battler = GameBattleHelper.overCursorNoDeadBattler;
        if (!battler) return;
        let battlerModule = battler.getModule(6) as SoModule_Battler;
        let selectedActor = battlerModule.actor;
        let arr = [];
        for (let i = 0; i < selectedActor.status.length; i++) {
            let status = selectedActor.status[i];
            if (!status.icon) continue;
            let d = new ListItem_1028;
            d.icon = status.icon;
            d.tipsLabel = GUI_Manager.statusDesc(status);
            arr.push(d);
        }
        this.statusList.items = arr;
    }
}