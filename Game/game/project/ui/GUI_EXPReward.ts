/**
 * 击中奖励
 * Created by 黑暗之神KDS on 2023-08-27 02:35:55.
 */
class GUI_EXPReward extends GUI_35 {
    private _actorShowExpValue: number;
    private actorShowNextExpValue: number;
    private getExpAnimationTask = "getExpAnimationTask";
    constructor() {
        super();
    }
    /**
     * 获得经验值效果
     */
    static getEXPEffect(battler: ProjectClientSceneObject, onFin: Callback, increasedEXP: number): void {
        let increaseExpRes = GUI_HitReward.increaseExpRes;
        // 无需升级或已满级则忽略
        if (!increaseExpRes) {
            onFin && onFin.run();
            return;
        }
        let battlerModule = GUI_HitReward.rewardBattler.getModule(6) as SoModule_Battler;
        GameCommand.startCommonCommand(14046, [], Callback.New(() => {
            if (!GameUI.isOpened(35)) {
                onFin && onFin.run();
                return;
            }
            let ui = GameUI.get(35) as GUI_EXPReward;
            ui.skillBlock.visible = false;
            ui.nameText.text = battlerModule.actor.name;
            ui.lv.text = increaseExpRes.fromLv.toString();
            ui.getExp.text = `${increasedEXP}`;
            for (let lv = increaseExpRes.fromLv; lv <= increaseExpRes.toLv; lv++) {
                let thisLvStartExp: number;
                if (lv == increaseExpRes.fromLv) {
                    thisLvStartExp = increaseExpRes.fromExp;
                }
                else {
                    thisLvStartExp = 0;
                }
                let thisLvEndExp: number;
                let thisLvNeedExp: number = Game.getLevelUpNeedExp(battlerModule.actor, lv);
                if (lv == increaseExpRes.toLv) {
                    thisLvEndExp = GUI_HitReward.increaseExpRes.toExp;
                }
                else {
                    thisLvEndExp = thisLvNeedExp;
                }
                new SyncTask(ui.getExpAnimationTask, (lv: number, thisLvStartExp: number, thisLvEndExp: number, thisLvNeedExp: number) => {
                    ui.lv.text = lv.toString();
                    ui.EXPSlider.value = thisLvStartExp * 100 / thisLvNeedExp;
                    let toValue = thisLvEndExp * 100 / thisLvNeedExp;
                    if (lv != increaseExpRes.fromLv) {
                        // 执行升级效果事件
                        GameCommand.startCommonCommand(14044, [], null, GUI_HitReward.rewardBattler, GUI_HitReward.rewardBattler);
                    }
                    ui.actorShowExpValue = thisLvStartExp;
                    ui.actorShowNextExpValue = thisLvNeedExp;
                    Tween.to(ui.EXPSlider, { value: toValue }, 1000, null, Callback.New(() => {
                        SyncTask.taskOver(ui.getExpAnimationTask);
                    }, this));
                    Tween.to(ui, { actorShowExpValue: thisLvEndExp }, 1000, null, Callback.New(() => {

                    }, this));
                }, [lv, thisLvStartExp, thisLvEndExp, thisLvNeedExp]);
            }
            ui.taskShowLearnSkills();
            new SyncTask(ui.getExpAnimationTask, () => {
                setTimeout(() => {
                    SyncTask.taskOver(ui.getExpAnimationTask);
                    GameCommand.startCommonCommand(14047, [], Callback.New(() => {
                        onFin && onFin.run();
                    }, this));
                }, 1000);
            });
        }, this));
    }
    /**
     * 任务队列方式：习得技能显示
     */
    private taskShowLearnSkills(): void {
        // 没有技能习得记录的话则不再播放效果（比如满等级或非成长角色）
        if (!GUI_HitReward.increaseExpRes) return;
        let learnSkills = GUI_HitReward.increaseExpRes.learnSkills;
        if (learnSkills.length == 0) {
            this.learnSkillList.items = [];
            return;
        }
        let arr = [];
        for (let i = 0; i < learnSkills.length; i++) {
            let learnSkill = learnSkills[i];
            let d = new ListItem_1030;
            d.data = learnSkill;
            d.icon = learnSkill.icon;
            arr.push(d);
        }
        this.learnSkillList.items = arr;
        new SyncTask(this.getExpAnimationTask, () => {
            this.skillBlock.visible = true;
            setTimeout(() => {
                SyncTask.taskOver(this.getExpAnimationTask);
            }, 1000);
        });
    }
    //------------------------------------------------------------------------------------------------------
    // 实现用
    //------------------------------------------------------------------------------------------------------
    private get actorShowExpValue(): number {
        return this._actorShowExpValue;
    }
    private set actorShowExpValue(v: number) {
        this._actorShowExpValue = v;
        this.actorExp.text = Math.floor(v) + "/" + this.actorShowNextExpValue;
    }
}