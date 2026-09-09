/**
 * 战斗者简略信息栏
 * Created by 黑暗之神KDS on 2021-01-21 17:25:59.
 */
class GUI_BattlerBriefInfo extends GUI_1025 {
    /**
     * 动效时间配置
     */
    static effectTime: number = 200;
    /**
     * 角色数据
     */
    private actor: Module_Actor;
    /**
     * 战斗者数据（如有）
     */
    private battler: ProjectClientSceneObject;
    /**
     * 动效使用的记录生命值和魔法值
     */
    private _hp: number;
    private _sp: number;
    /**
     * 记录过渡效果
     */
    private tweenHP: Tween;
    private tweenSP: Tween;
    /**
     * 构造函数
     */
    constructor() {
        super();
    }
    /**
     * 设置角色数据
     */
    setActor(actor: Module_Actor, battler: ProjectClientSceneObject = null): void {
        // 当数据相同的情况下可显示动效
        var isSameActor = actor == this.actor;
        this.actor = actor;
        if (!this.actor) {
            return;
        }
        this.battler = battler;
        let battlerModule = battler?.getModule(6) as SoModule_Battler;
        this.refreshHP(isSameActor && battler && !battlerModule.isDead);
        this.refreshSP(isSameActor && battler && !battlerModule.isDead);
        this.refreshStatus();
        this.refreshLevel();
        if (!isSameActor) {
            this.actorName.text = actor.name;
            this.actorFace.image = actor.face;
            this.actorCamp.selected = battler ? (battlerModule.battleCamp == 1) : false;
            var classData: Module_Class = GameData.getModuleData(7, actor.class);
            this.actorClassName.text = classData.name;
            this.actorClassIcon.image = classData.icon;
        }
        if (battler) this.deadSign.visible = battler && battlerModule.isDead;
        else this.deadSign.visible = false;
    }
    /**
     * 设置生命值
     */
    refreshHP(showEffect: boolean = true): void {
        if (!this.actor) return;
        if (this.tweenHP) {
            Tween.clear(this.tweenHP);
            this.tweenHP = null;
        }
        if (showEffect) {
            var toHP = this.actor.hp;
            this.tweenHP = Tween.to(this, { hp: toHP }, 200);
        }
        else {
            this.hp = this.actor.hp;
        }
    }
    /**
     * 设置魔法值
     */
    refreshSP(showEffect: boolean = true): void {
        if (!this.actor) return;
        if (this.tweenSP) {
            Tween.clear(this.tweenSP);
            this.tweenSP = null;
        }
        if (showEffect) {
            this.tweenSP = Tween.to(this, { sp: this.actor.sp }, 200);
        }
        else {
            this.sp = this.actor.sp;
        }
    }
    /**
     * 刷新状态
     */
    refreshStatus(): void {
        var arr = [];
        // 遍历角色的状态
        for (var i = 0; i < this.actor.status.length; i++) {
            // 获取状态
            var status = this.actor.status[i];
            if (!status.icon) continue;
            // 创建项数据（对应项模型）
            var d = new ListItem_1026;
            d.icon = status.icon;
            d.layer = status.currentLayer == 1 ? "" : status.currentLayer.toString();
            arr.push(d);
        }
        this.statusList.items = arr;
    }
    /**
     * 刷新等级
     */
    refreshLevel(): void {
        if (!this.actor.growUpEnabled) {
            this.actorLvLabel.visible = false;
            return;
        }
        var level = GameBattleHelper.getLevelByActor(this.actor);
        this.actorLv.text = level.toString();
        this.actorLvLabel.visible = true;
    }
    //------------------------------------------------------------------------------------------------------
    // 内部实现
    //------------------------------------------------------------------------------------------------------
    /**
     * 生命值（动效使用）
     */
    private set hp(v: number) {
        this._hp = v;
        this.hpText.text = Math.floor(v).toString();
        this.hpSlider.value = v * 100 / this.actor.MaxHP;
    }
    private get hp() {
        return this._hp;
    }
    /**
     * 魔法值（动效使用）
     */
    private set sp(v: number) {
        this._sp = v;
        this.spText.text = Math.floor(v).toString();
        this.spSlider.value = v * 100 / this.actor.MaxSP;
    }
    private get sp() {
        return this._sp
    }
}