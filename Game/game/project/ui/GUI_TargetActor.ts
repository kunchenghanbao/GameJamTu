/**
 * 菜单中选择的目标角色界面
 * Created by 黑暗之神KDS on 2022-10-04 06:16:03.
 */
class GUI_TargetActor extends GUI_17 {
    constructor() {
        super();
        // 事件监听：当角色窗口创建时
        this.actorList.on(UIList.ITEM_CREATE, this, this.onActorItemCreate);
    }
    /**
     * 刷新
     */
    refreshTargetPanel() {
        // 创建队伍成员界面
        let items = [];
        // 刷新队伍成员界面的信息
        for (let i = 0; i < Game.player.data.party.length; i++) {
            let d = new ListItem_1017;
            let actorDS = Game.player.data.party[i];
            let actor = actorDS.actor;
            d.data = actorDS;
            let actorClass: Module_Class = GameData.getModuleData(7, actor.class);
            Game.refreshActorAttribute(actor, actorDS.lv);
            d.actorFace = actor.face;
            d.classText = actorClass?.name;
            d.actorName = actor.name;
            d.classIcon = actorClass?.icon;
            d.actorLv = actorDS.actor.growUpEnabled ? actorDS.lv.toString() : "--";
            d.hpText = actor.hp.toString();
            d.spText = actor.sp.toString();
            d.hpSlider = actor.hp * 100 / actor.MaxHP;
            d.spSlider = actor.sp * 100 / actor.MaxSP;
            items.push(d);
        }
        this.actorList.items = items;
    }
    /**
     * 当角色项创建时
     */
    private onActorItemCreate(ui: GUI_1017, data: ListItem_1017, index: number): void {
       
    }
}