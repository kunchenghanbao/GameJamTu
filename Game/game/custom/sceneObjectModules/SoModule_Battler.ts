/**
 * Created by 黑暗之神KDS on 2023-08-19 16:32:54.
 */
class SoModule_Battler extends SceneObjectModule_6 {
    /**
     * 构造函数
     * @param installCB 
     */
    constructor(installCB: Callback, battler: ProjectClientSceneObject) {
        super(installCB);
        if (battler) {
            this.so = battler;
        }
        if (this.actor) this.actorInit();
        this.refreshAvatar();
        this.initActor();
    }
    /**
     * 初始化角色
     */
    actorInit(): void {
        if (!this.actor.takeSetting) {
            this.actor.items = [];
            this.actor.equips = [];
            this.actor.skills = [];
        }
    }
    /**
     * 刷新行走图
     */
    private refreshAvatar() {
        if (this.avatarDisplay == 0) {
            if (!this.actor) return;
            if (!GameBattle.isFromRecorySaveData) {
                let avatarID = this.actor.avatar;
                this.so.avatarID = avatarID;
            }
        }
    }
    /**
     * 初始化角色
     */
    private initActor(): void {
        this.initGrowActorSkill();
    }
    /**
     * 初始化成长类角色技能
     */
    private initGrowActorSkill(): void {
        // 忽略主角阵营使用玩家角色的情况
        if (this.battleCamp == 0 && this.usePlayerActors) return;
        if (this.actor) {
            Game.initGrowUpActorSkill(this.actor, this.level);
        }
    }
}