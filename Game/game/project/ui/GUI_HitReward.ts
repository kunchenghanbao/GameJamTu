/**
 * 击杀奖励
 * Created by 黑暗之神KDS on 2021-02-09 05:26:33.
 */
class GUI_HitReward extends GUI_30 {
    static rewardBattler: ProjectClientSceneObject;
    static rewardActor: Module_Actor;
    static increaseExpRes: { isLevelUp: boolean, fromLv: number, toLv: number, fromExp: number, toExp: number, learnSkills: Module_Skill[] };
    private _actorShowExpValue: number;
    private actorShowNextExpValue: number;
    private getExpAnimationTask = "getExpAnimationTask";
    private preSkillBlockY: number;
    /**
     * 构造函数
     */
    constructor() {
        super();
        this.preSkillBlockY = this.skillBlock.y;
        this.on(EventObject.DISPLAY, this, this.onDisplay);
        this.dropItemList.on(UIList.ITEM_CREATE, this, this.onCreateDropItemListDisplayItem);
    }
    /**
     * 当界面显示时
     */
    private onDisplay() {
        this.itemBlock.visible = false;
        this.skillBlock.visible = false;
        this.taskShowGetExp();
        this.taskShowGetItems();
        this.taskShowLearnSkills();
        this.taskCloseUI();
    }
    /**
     * 当创建掉落道具项时
     * @param ui 
     * @param data 
     * @param index 
     */
    private onCreateDropItemListDisplayItem(ui: GUI_1029, data: ListItem_1029, index: number) {
        let goodsInfo = data.data;
        let isEquip = data.data[0];
        ui.itemNumLabel.visible = !isEquip;
        ui.itemNum.visible = !isEquip;
    }
    //------------------------------------------------------------------------------------------------------
    // 
    //------------------------------------------------------------------------------------------------------
    /**
     * 任务队列方式：获取经验值显示
     */
    private taskShowGetExp(): void {
        let actor = GUI_HitReward.rewardActor;
        let increaseExpRes = GUI_HitReward.increaseExpRes;
        this.actorFace.image = GUI_HitReward.rewardActor.face;
        this.actorName.text = GUI_HitReward.rewardActor.name;
        this.getExp.text = GameBattleData.hitReward.exp.toString();
        this.getGold.text = GameBattleData.hitReward.gold.toString();
        this.lvBox.visible = true;
        // 没有经验值增长记录的话则不再播放效果（比如满等级或非成长角色）
        if (!increaseExpRes) {
            this.lv.text = GameBattleHelper.getLevelByActor(GUI_HitReward.rewardActor).toString();
            this.EXPSlider.value = 100;
            this.actorExp.text = "";
            this.lvBox.visible = GUI_HitReward.rewardActor.growUpEnabled;
            return;
        }
        this.lv.text = increaseExpRes.fromLv.toString();
        // 播放效果
        for (let lv = increaseExpRes.fromLv; lv <= increaseExpRes.toLv; lv++) {
            let thisLvStartExp: number;
            if (lv == increaseExpRes.fromLv) {
                thisLvStartExp = increaseExpRes.fromExp;
            }
            else {
                thisLvStartExp = 0;
            }
            let thisLvEndExp: number;
            let thisLvNeedExp: number = Game.getLevelUpNeedExp(actor, lv);
            if (lv == increaseExpRes.toLv) {
                thisLvEndExp = GUI_HitReward.increaseExpRes.toExp;
            }
            else {
                thisLvEndExp = thisLvNeedExp;
            }
            new SyncTask(this.getExpAnimationTask, (lv: number, thisLvStartExp: number, thisLvEndExp: number, thisLvNeedExp: number) => {
                this.lv.text = lv.toString();
                this.EXPSlider.value = thisLvStartExp * 100 / thisLvNeedExp;
                let toValue = thisLvEndExp * 100 / thisLvNeedExp;
                if (lv != increaseExpRes.fromLv) {
                    // 执行升级事件
                    GameCommand.startCommonCommand(14044, [], null, GUI_HitReward.rewardBattler, GUI_HitReward.rewardBattler);
                }
                this.actorShowExpValue = thisLvStartExp;
                this.actorShowNextExpValue = thisLvNeedExp;
                Tween.to(this.EXPSlider, { value: toValue }, 1000, null, Callback.New(() => {
                    SyncTask.taskOver(this.getExpAnimationTask);
                }, this));
                Tween.to(this, { actorShowExpValue: thisLvEndExp }, 1000, null, Callback.New(() => {

                }, this));
            }, [lv, thisLvStartExp, thisLvEndExp, thisLvNeedExp]);
        }

    }
    /**
     * 任务队列方式：获得道具显示
     */
    private taskShowGetItems(): void {
        let dropItems = GameBattleData.hitReward.items;
        let dropEquips = GameBattleData.hitReward.equips;
        if (dropItems.length == 0 && dropEquips.length == 0) {
            this.dropItemList.items = [];
            return;
        }
        let arr = [];
        for (let i = 0; i < dropItems.length; i++) {
            let dropItemInfo = dropItems[i];
            let dropItem: Module_Item = GameData.getModuleData(1, dropItemInfo.itemID);
            let d = new ListItem_1029;
            d.data = [false, dropItem];
            d.icon = dropItem.icon;
            d.itemNum = dropItemInfo.num.toString();
            d.itemName = dropItem.name;
            arr.push(d);
        }
        for (let i = 0; i < dropEquips.length; i++) {
            let dropEquip = dropEquips[i];
            let d = new ListItem_1029;
            d.data = [true, dropEquip];
            d.icon = dropEquip.icon;
            d.itemNum = "1";
            d.itemName = dropEquip.name;
            arr.push(d);
        }
        this.dropItemList.items = arr;
        new SyncTask(this.getExpAnimationTask, () => {
            this.itemBlock.visible = true;
            setTimeout(() => {
                SyncTask.taskOver(this.getExpAnimationTask);
            }, 1000);
        });
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
    /**
     * 任务队列方式：关闭界面
     */
    private taskCloseUI(): void {
        new SyncTask(this.getExpAnimationTask, () => {
            setTimeout(() => {
                SyncTask.taskOver(this.getExpAnimationTask);
                GameUI.hide(this.guiID);
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