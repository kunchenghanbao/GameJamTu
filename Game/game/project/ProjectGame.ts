/**
 * 项目层游戏管理器实现类
 * -- 为了让系统API属性的类别直接指向项目层的实现类
 *    游戏内会经常用到Game.player以及Game.currentScene，实现此类可指向项目层自定义的「玩家类」和「场景类」
 *    
 * 
 * Created by 黑暗之神KDS on 2020-09-08 17:00:46.
 */
class ProjectGame extends GameBase {
    /**
     * 四件套配置。装备副本保留模板 ID，因此随机属性装备也能触发套装效果。
     */
    private static readonly EQUIP_SET_BONUSES = [
        {
            equipIDs: [1007, 2005, 3009, 4005],
            maxHP: 100, maxSP: 0, atk: 20, def: 0, mag: 0, magDef: 30,
            hit: 0, dod: 0, crit: 0, magCrit: 0, moveGrid: 1
        },
        {
            equipIDs: [1008, 2006, 3010, 4006],
            maxHP: 200, maxSP: 0, atk: 20, def: 50, mag: 0, magDef: 0,
            hit: 0, dod: 0, crit: 5, magCrit: 0, moveGrid: 0
        },
        {
            equipIDs: [1009, 2007, 3011, 4007],
            maxHP: 0, maxSP: 0, atk: 0, def: 0, mag: 0, magDef: 0,
            hit: 20, dod: 15, crit: 10, magCrit: 10, moveGrid: 1
        }
    ];
    //------------------------------------------------------------------------------------------------------
    // 事件：角色
    //------------------------------------------------------------------------------------------------------
    /**
     * 事件：卸下了角色的道具 onRemoveActorItem(actor: Module_Actor, itemIndex: number, item: Module_Item);
     */
    EVENT_REMOVE_ACTOR_ITEM: string = "GameEVENT_REMOVE_ACTOR_ITEM";
    /**
     * 事件：安装了角色的道具 onCarryActorItem(actor: Module_Actor, itemIndex: number, removeItem: Module_Item, newItem: Module_Item);
     */
    EVENT_CARRY_ACTOR_ITEM: string = "GameEVENT_CARRY_ACTOR_ITEM";
    /**
     * 事件：学习了技能 onLearnSkill(actor: Module_Actor, newSkill: Module_Skill);
     */
    EVENT_LEARN_SKILL: string = "GameEVENT_LEARN_SKILL";
    /**
     * 事件：忘记了技能 onForgetSkill(actor: Module_Actor, forgetSkill: Module_Skill);
     */
    EVENT_FORGET_SKILL: string = "GameEVENT_FORGET_SKILL";
    /**
     * 事件：替换普通攻击 onReplaceAttackSkill(actor: Module_Actor, skill: Module_Skill);
     */
    EVENT_REPLACE_ATTACK_SKILL: string = "GameEVENT_REPLACE_ATTACK_SKILL";
    /**
     * 事件：穿戴了装备 onWearActorEquip(actor: Module_Actor, partID: number, takeOffEquip: Module_Equip, newEquip: Module_Equip);
     */
    EVENT_WEAR_ACTOR_EQUIP: string = "GameEVENT_WEAR_ACTOR_EQUIP";
    /**
     * 事件：卸下了装备 onTakeOffActorEquip(actor: Module_Actor, partID: number, takeOffEquip: Module_Equip);
     */
    EVENT_TAKE_OFF_ACTOR_EQUIP: string = "GameEVENT_TAKE_OFF_ACTOR_EQUIP";
    //------------------------------------------------------------------------------------------------------
    //  
    //------------------------------------------------------------------------------------------------------
    /**
     * 游戏开始时间（新游戏时记录，读档后记录档案的时间会计算差值以便获得游戏总游玩时间）
     */
    static gameStartTime: Date;
    private static gamePauseStartTime: Date;
    /**
    * 当前的场景对象：重写，以便类别能够对应项目层自定义的子类
    */
    declare currentScene: ProjectClientScene;
    /**
     * 玩家对象：重写，便类别能够对应项目层自定义的子类
     */
    declare player: ProjectPlayer;
    /**
     * 扩展属性设定
     */
    extendAttributeSettings: DataStructure_customAttributeSetting[] = [];
    /**
     * 构造函数
     */
    constructor() {
        super();
        EventUtils.addEventListenerFunction(GameGate, GameGate.EVENT_IN_SCENE_STATE_CHANGE, this.onInSceneStateChange, this);
    }
    /**
     * 初始化
     */
    init() {
        // 创建的玩家是这个项目层自定义类的实例
        this.player = new ProjectPlayer();
        EventUtils.addEventListenerFunction(Game, Game.EVENT_PAUSE_CHANGE, this.onPauseChange, this);
    }
    /**
     * 获取游戏时间
     */
    get gameTime(): number {
        let gameStartTime: Date;
        if (ProjectGame.gamePauseStartTime) {
            let dTime = Date.now() - ProjectGame.gamePauseStartTime.getTime();
            gameStartTime = new Date(ProjectGame.gameStartTime.getTime() + dTime);
        }
        else {
            gameStartTime = ProjectGame.gameStartTime;
        }
        return new Date().getTime() - gameStartTime.getTime();
    }
    //------------------------------------------------------------------------------------------------------
    // 角色
    //------------------------------------------------------------------------------------------------------
    /**
     * 根据场景对象（战斗者）的编号获取其对应的角色数据
     * @param soIndex 场景对象编号
     * @return [Module_Actor] 
     */
    getActorBySceneObjectIndex(soIndex: number): Module_Actor {
        var soc = Game.currentScene.sceneObjects[soIndex];
        if (GameBattleHelper.isBattler(soc)) {
            let soBattler = soc.getModule(6) as SoModule_Battler;
            return soBattler.actor;
        }
    }
    /**
     * 获取玩家的角色
     * @param actorCheckType 检查类别 0-通过角色编号获取玩家队伍的角色 1-通过角色所在队伍的位置 2-通过场景对象编号查找
     * @param actorIDUseVar  检查类别0的参数：指定角色编号的模式 0-常量 1-变量
     * @parma actorID        检查类别0的参数：角色编号
     * @param actorIDVarID   检查类别0的参数：记录角色编号的数值变量编号
     * @param actorInPartyIndexVarIDUseVar 检查类别1的参数：指定角色所在队伍位置的模式 0-常量 1-变量
     * @param actorInPartyIndex            检查类别1的参数：角色所在队伍的位置
     * @param actorInPartyIndexVarID       检查类别1的参数：记录角色所在队伍位置的数值变量编号
     * @param soType        检查类别2的参数：指定场景对象的方式 0-触发者 1-执行者 2-指定编号
     * @param soIndexUseVar 检查类别2的参数：指定场景对象编号的模式 0-常量 1-变量
     * @param soIndex       检查类别2的参数：场景对象编号
     * @param soIndexVarID  检查类别2的参数：记录场景对象编号的数值变量编号
     * @param trigger       检查类别2的参数：触发器，如在事件执行时调用该函数则可传递触发器过来使用，以便判定触发者、执行者
     */
    static getPlayerActorByCheckType(actorCheckType: number, actorIDUseVar: number, actorID: number, actorIDVarID: number,
        actorInPartyIndexVarIDUseVar: number, actorInPartyIndex: number, actorInPartyIndexVarID: number,
        soType: number, soIndexUseVar: number, soIndex: number, soIndexVarID: number, trigger: CommandTrigger): DataStructure_inPartyActor {
        // 通过角色编号获取玩家队伍的角色
        if (actorCheckType == 0) {
            var pActorID = MathUtils.int(actorIDUseVar ? Game.player.variable.getVariable(actorIDVarID) : actorID);
            return ProjectPlayer.getPlayerActorDSByActorID(pActorID);
        }
        // 通过角色所在队伍的位置
        else if (actorCheckType == 1) {
            var pActorInPartyIndex = MathUtils.int(actorInPartyIndexVarIDUseVar ? Game.player.variable.getVariable(actorInPartyIndexVarID) : actorInPartyIndex);
            return ProjectPlayer.getPlayerActorDSByInPartyIndex(pActorInPartyIndex);
        }
        // 通过场景对象编号查找
        else if (actorCheckType == 2) {
            var soc = ProjectClientScene.getSceneObjectBySetting(soType + 1, soIndex, soIndexUseVar, soIndexVarID, trigger);
            // -- 如果是战斗者且是玩家拥有的角色的话则返回角色数据
            if (GameBattleHelper.isBattler(soc)) {
                var inPlayerActorIndex = ProjectPlayer.getPlayerActorIndexByActor(soc.battlerSetting.actor);
                return ProjectPlayer.getPlayerActorDSByInPartyIndex(inPlayerActorIndex);
            }
        }
    }
    /**
     * 根据场景对象获取角色
     * @param soType 类别 0-触发者 1-执行者 2-指定编号
     * @param soIndexUseVar 指定场景对象编号的模式 0-常量 1-变量
     * @param soIndex 指定的编号
     * @param soIndexVarID 使用的变量ID
     * @param trigger 触发器，如在事件执行时调用该函数则可传递触发器过来使用，以便判定触发者、执行者
     * @return [Module_Actor] 
     */
    static getActorBySceneObjectIndex(soType: number, soIndexUseVar: number, soIndex: number, soIndexVarID: number, trigger: CommandTrigger): Module_Actor {
        // 根据设定获取场景对象
        var soc = ProjectClientScene.getSceneObjectBySetting(soType + 1, soIndex, soIndexUseVar, soIndexVarID, trigger);
        // 如果是战斗者的话则返回对应的角色数据
        if (GameBattleHelper.isBattler(soc)) {
            return (soc.getModule(6) as SoModule_Battler).actor;
        }
        return null;
    }
    //------------------------------------------------------------------------------------------------------
    // 角色的技能
    //------------------------------------------------------------------------------------------------------
    /**
     * 初始化成长角色的技能，根据登记
     * @param actor 
     * @param lv 
     */
    initGrowUpActorSkill(actor: Module_Actor, lv: number): void {
        if (actor.growUpEnabled) {
            lv = Math.max(1, Math.min(lv, actor.MaxLv));
            var classData: Module_Class = GameData.getModuleData(7, actor.class);
            for (var i = 0; i < classData.lvUpAutoGetSkills.length; i++) {
                var lvUpAutoGetSkill = classData.lvUpAutoGetSkills[i];
                if (lv >= lvUpAutoGetSkill.lv) {
                    this.actorLearnSkill(actor, lvUpAutoGetSkill.skill);
                }
            }
        }
    }
    /**
     * 获取角色的技能：根据技能编号
     * @param actor 角色
     * @param skillID 技能编号
     * @return [Module_Skill] 
     */
    getActorSkillBySkillID(actor: Module_Actor, skillID: number): Module_Skill {
        return ArrayUtils.matchAttributes(actor.skills, { id: skillID }, true)[0];
    }
    /**
     * 角色学习技能
     * @param actor 角色
     * @param skillID 技能编号
     * @param happenEvent [可选] 默认值=true 是否派发事件
     * @return [Module_Skill] 
     */
    actorLearnSkill(actor: Module_Actor, skillID: number, happenEvent: boolean = true): Module_Skill {
        var skill = this.getActorSkillBySkillID(actor, skillID);
        if (skill || !GameData.getModuleData(8, skillID)) return;
        var newSkill = GameData.newModuleData(8, skillID);
        actor.skills.push(newSkill);
        if (happenEvent) EventUtils.happen(Game, Game.EVENT_LEARN_SKILL, [actor, newSkill]);
        return newSkill;
    }
    /**
     * 角色忘记技能
     * @param actor 角色
     * @param skillID 技能编号
     * @param happenEvent [可选] 默认值=true 是否派发事件
     * @return [Module_Skill] 忘却的技能
     */
    actorForgetSkill(actor: Module_Actor, skillID: number, happenEvent: boolean = true): Module_Skill {
        var skill = this.getActorSkillBySkillID(actor, skillID);
        if (!skill || !GameData.getModuleData(8, skillID)) return;
        actor.skills.splice(actor.skills.indexOf(skill), 1);
        if (happenEvent) EventUtils.happen(Game, Game.EVENT_FORGET_SKILL, [actor, skill]);
        return skill;
    }
    /**
     * 角色忘记全部技能
     * @param actor 角色
     * @param happenEvent [可选] 默认值=true 是否派发事件
     * @return [Module_Skill] 忘却的技能集合
     */
    actorForgetAllSkills(actor: Module_Actor, happenEvent: boolean = true): Module_Skill[] {
        var forgetSkills = actor.skills.concat();
        actor.skills.length = 0;
        for (var i = 0; i < forgetSkills.length; i++) {
            if (happenEvent) EventUtils.happen(Game, Game.EVENT_FORGET_SKILL, [actor, forgetSkills[i]]);
        }
        return forgetSkills;
    }
    /**
     * 替换普通技能
     * @param actor 角色
     * @param skillID 技能编号
     * @return [Module_Skill] 
     */
    actorReplaceAttackSkill(actor: Module_Actor, skillID: number, happenEvent: boolean = true): Module_Skill[] {
        if (!GameData.getModuleData(8, skillID)) return;
        let newSkill = GameData.newModuleData(8, skillID);
        actor.atkSkill = newSkill;
        actor.atkMode = 1;
        if (happenEvent) EventUtils.happen(Game, Game.EVENT_REPLACE_ATTACK_SKILL, [actor, newSkill]);
        return newSkill;
    }
    //------------------------------------------------------------------------------------------------------
    // 角色的装备
    //------------------------------------------------------------------------------------------------------
    /**
     * 获取角色的装备：根据装备部位
     * @param actor 角色
     * @param partID 装备部位
     * @return [Module_Equip] 
     */
    getActorEquipByPartID(actor: Module_Actor, partID: number): Module_Equip {
        return ArrayUtils.matchAttributes(actor.equips, { partID: partID }, true)[0];
    }
    /**
     * 获取角色的装备：根据装备的编号
     * @param actor 角色
     * @param equipID 装备编号
     * @return [Module_Equip] 
     */
    getActorEquipByEquipID(actor: Module_Actor, equipID: number): Module_Equip {
        return ArrayUtils.matchAttributes(actor.equips, { id: equipID }, true)[0];
    }
    /**
     * 穿戴角色装备
     * @param actor 角色数据
     * @param newEquip 新的装备
     * @param happenEvent [可选] 默认值=true 是否派发事件
     * @return success=是否更换成功 removeEquip=更换下来的装备
     */
    wearActorEquip(actor: Module_Actor, newEquip: Module_Equip, happenEvent: boolean = true): { success: boolean, takeOffEquip: Module_Equip } {
        if (newEquip) {
            var takeOffEquip = this.takeOffActorEquipByPartID(actor, newEquip.partID);
            actor.equips.push(newEquip);
            if (happenEvent) EventUtils.happen(Game, Game.EVENT_WEAR_ACTOR_EQUIP, [actor, newEquip.partID, takeOffEquip, newEquip]);
            return { success: true, takeOffEquip: takeOffEquip };
        }
    }
    /**
     * 卸下装备
     * @param actor 角色
     * @param partID 部位
     * @param happenEvent [可选] 默认值=true 是否派发事件
     * @return [Module_Equip] 
     */
    takeOffActorEquipByPartID(actor: Module_Actor, partID: number, happenEvent: boolean = true): Module_Equip {
        var idx = ArrayUtils.matchAttributes(actor.equips, { partID: partID }, true, "==", true)[0];
        if (idx == null) return null;
        var takeOffEquip = actor.equips.splice(idx, 1)[0];
        if (takeOffEquip && happenEvent) EventUtils.happen(Game, Game.EVENT_TAKE_OFF_ACTOR_EQUIP, [actor, partID, takeOffEquip]);
        return takeOffEquip;
    }
    /**
     * 卸下全部装备
     * @param actor 角色
     * @param happenEvent [可选] 默认值=true 是否派发事件
     * @return [Module_Equip] 
     */
    takeOffActorAllEquips(actor: Module_Actor, happenEvent: boolean = true): Module_Equip[] {
        var takeOffEquipArr = actor.equips.concat();
        actor.equips.length = 0;
        for (var i = 0; i < takeOffEquipArr.length; i++) {
            var takeOffEquip = takeOffEquipArr[i];
            if (happenEvent) EventUtils.happen(Game, Game.EVENT_TAKE_OFF_ACTOR_EQUIP, [actor, takeOffEquip.partID, takeOffEquip]);
        }
        return takeOffEquipArr;
    }
    //------------------------------------------------------------------------------------------------------
    // 角色的道具
    //------------------------------------------------------------------------------------------------------
    /**
     * 获取角色的道具：根据道具所在的位置，如果不存在则为null
     * @param actor 角色
     * @param partID 道具位置
     */
    getActorItemByItemIndex(actor: Module_Actor, itemIndex: number): Module_Item {
        return actor.items[itemIndex];
    }
    /**
     * 获取角色的道具：根据道具编号，如果不存在则为null
     * @param actor 角色
     * @param itemID 道具编号
     * @return [Module_Item] 
     */
    getActorItemByItemID(actor: Module_Actor, itemID: number): Module_Item {
        return ArrayUtils.matchAttributes(actor.items, { id: itemID }, true)[0];
    }
    /**
     * 卸下角色的道具
     * @param inPartyIndex 该角色所在队伍的索引
     * @param itemIndex 道具位置
     * @param happenEvent [可选] 默认值=true 是否派发事件
     * @return [Module_Item] 卸下的道具
     */
    unActorItemByItemIndex(actor: Module_Actor, itemIndex: number, happenEvent: boolean = true): Module_Item {
        var item = actor.items[itemIndex];
        if (item == null) return null;
        actor.items[itemIndex] = null;
        if (happenEvent) EventUtils.happen(Game, Game.EVENT_REMOVE_ACTOR_ITEM, [actor, itemIndex, item]);
        return item;
    }
    /**
     * 卸下角色的全部道具
     * @param inPartyIndex 该角色所在队伍的索引
     * @param happenEvent [可选] 默认值=true 是否派发事件
     * @return [Module_Item] 卸下的道具
     */
    unActorAllItems(actor: Module_Actor, happenEvent: boolean = true): void {
        for (let i = 0; i < WorldData.actorItemMax; i++) {
            this.unActorItemByItemIndex(actor, i, happenEvent);
        }
    }
    /**
     * 角色携带道具
     * @param inPartyIndex 该角色所在队伍的索引
     * @param newItem 新的道具
     * @param happenEvent [可选] 默认值=true 是否派发事件
     * @return 更换下来的装备
     */
    carryActorItem(actor: Module_Actor, newItem: Module_Item, itemIndex: number, happenEvent: boolean = true): Module_Item {
        var removeItem = this.unActorItemByItemIndex(actor, itemIndex, happenEvent);
        actor.items[itemIndex] = newItem;
        if (happenEvent) EventUtils.happen(Game, Game.EVENT_CARRY_ACTOR_ITEM, [actor, itemIndex, removeItem, newItem]);
        return removeItem;
    }
    /**
     * 获取角色的道具空位置
     * @param inPartyIndex 角色所在队伍编号
     * @return [number] 0~N null表示无
     */
    getPlayerActorItemEmptyPostion(actor: Module_Actor): number {
        for (let i = 0; i < WorldData.actorItemMax; i++) {
            if (!Game.getActorItemByItemIndex(actor, i)) {
                return i;
            }
        }
        return null;
    }
    //------------------------------------------------------------------------------------------------------
    // 角色的属性
    //------------------------------------------------------------------------------------------------------
    /**
     * 获取下一等级所需经验值
     * @param actor 角色数据
     * @param lv 当前等级
     * @return [number] 
     */
    getLevelUpNeedExp(actor: Module_Actor, lv: number): number {
        return Math.floor(this.getGrowValueByLv(actor, "needEXPGrow", lv));
    }
    /**
     * 刷新角色属性
     * -- 基础属性
     * -- 加点属性
     * -- 装备加成
     * -- 状态加成
     */
    refreshActorAttribute(actor: Module_Actor, lv: number): void {
        // 获取数据库预设的数据
        var res = this.clacActorAttribute(actor, lv);
        RogueSceneDirector.applyEnemyAttributeBalance(actor, res);
        RogueSceneDirector.applyPlayerAttributeBalance(actor, res);
        // 写入属性至该角色数据里
        if (res) {
            // 记录原始生命值
            actor.MaxHP = Math.floor(res.MaxHP);
            actor.MaxSP = Math.floor(res.MaxSP);
            actor.ATK = Math.floor(res.ATK);
            actor.DEF = Math.floor(res.DEF);
            actor.MAG = Math.floor(res.MAG);
            actor.MagDef = Math.floor(res.MagDef);
            actor.HIT = Math.floor(res.HIT);
            actor.DOD = Math.floor(res.DOD);
            actor.CRIT = Math.floor(res.CRIT);
            actor.MagCrit = Math.floor(res.MagCrit);
            actor.extendAttributes = res.extendAttributes;
            actor.MoveGrid = Math.floor(res.MoveGrid);
            // 因为状态而增加的最大生命值，当前生命值应增加上
            let statusMaxHP = Math.floor(res.statusAddMaxHP);
            if (statusMaxHP > 0) {
                actor.hp += statusMaxHP;
            }
        }
        // 血量修正
        if (actor.hp > actor.MaxHP) actor.hp = actor.MaxHP;
        if (actor.sp > actor.MaxSP) actor.sp = actor.MaxSP;
    }
    /**
     * 计算角色属性
     * @param actor 角色
     * @param lv 等级
     * @param previewChangeMode [可选] 默认值=0 0=无预览 1-预览技能 2-预览装备
     * @param previewChangeEquipIndex [可选] 默认值=0 预览替换的装备部位
     * @param previewChangeEquip [可选] 默认值=null 预览替换的装备属性
     */
    clacActorAttribute(actor: Module_Actor, lv: number, previewChangeMode: number = 0,
        previewChangeEquipIndex: number = 0, previewChangeEquip: Module_Equip = null,
        previewChangeSkillIndex: number = 0, previewChangeSkill: Module_Skill = null) {
        // 获取数据库预设的数据
        let systemActor = GameData.getModuleData(6, actor.id) as Module_Actor;
        if (!systemActor) return;
        // 获取职业
        let actorClass: Module_Class = GameData.getModuleData(7, actor.class);
        // 获取原始属性
        let fromStatusMaxHP: number = 0;
        let fromStatusMaxHPper_BUFF: number = 1.0;
        let fromStatusMaxHPper_DEBUFF: number = 1.0;
        let maxhp: number;
        let maxsp: number;
        let mag: number;
        let agi: number;
        let pow: number;
        let end: number;
        let magDef: number;
        let hit: number;
        let crit: number;
        let magCrit: number;
        let atk: number;
        let def: number;
        let dod: number;
        let moveGrid: number;
        // -- 扩展属性
        let extendAttributesFixed: number[] = [];
        let extendAttributesAdditionPercentage: number[] = [];
        let extendAttributesMultiplicationPercentage: number[] = [];
        let extendAttributeLen = GameData.getLength(14);
        for (let i = 1; i <= extendAttributeLen; i++) {
            extendAttributesFixed[i] = 0;
            extendAttributesAdditionPercentage[i] = 0;
            extendAttributesMultiplicationPercentage[i] = 1;
        }
        // -- 成长型的角色
        if (actor.growUpEnabled) {
            maxhp = Math.floor(this.getGrowValueByLv(actor, "MaxHPGrow", lv) + actor.increaseMaxHP);
            maxsp = Math.floor(this.getGrowValueByLv(actor, "MaxSPGrow", lv) + actor.increaseMaxSP);
            atk = Math.floor(this.getGrowValueByLv(actor, "ATKGrow", lv, actorClass) + actor.increaseATK);
            def = Math.floor(this.getGrowValueByLv(actor, "DEFGrow", lv, actorClass) + actor.increaseDEF);
            mag = Math.floor(this.getGrowValueByLv(actor, "MAGGrow", lv, actorClass) + actor.increaseMag);
            magDef = Math.floor(this.getGrowValueByLv(actor, "MAGDEFGrow", lv, actorClass) + actor.increaseMagDef);
            dod = Math.floor(this.getGrowValueByLv(actor, "DODGrow", lv, actorClass) + actor.increaseDod);
            crit = actor.increaseCRIT;
            magCrit = actor.increaseMagCrit;
            // -- extendAttributes
            if (actorClass.isCustomAttribute) {
                for (let i = 0; i < actorClass.customAttributes.length; i++) {
                    let customAttribute = actorClass.customAttributes[i];
                    extendAttributesFixed[customAttribute.attribute] = Math.floor(this.getGrowValueByLv(actor, "", lv, actorClass, customAttribute));
                }
            }
        }
        // -- 非成长型角色（固定值）
        else {
            maxhp = this.getActorInitAttirubte(actor, `MaxHP`) + actor.increaseMaxHP;
            maxsp = this.getActorInitAttirubte(actor, `MaxSP`) + actor.increaseMaxSP;
            mag = this.getActorInitAttirubte(actor, `MAG`) + actor.increaseMag;
            magDef = this.getActorInitAttirubte(actor, `MagDef`) + actor.increaseMagDef;
            atk = this.getActorInitAttirubte(actor, `ATK`) + actor.increaseATK;
            def = this.getActorInitAttirubte(actor, `DEF`) + actor.increaseDEF;
            dod = this.getActorInitAttirubte(actor, `DOD`) + actor.increaseDod;
            crit = this.getActorInitAttirubte(actor, `CRIT`) + actor.increaseCRIT;
            magCrit = this.getActorInitAttirubte(actor, `MagCrit`) + actor.increaseMagCrit;
            // -- extendAttributes
            this.slotExtendAttributes(actor, extendAttributesFixed, extendAttributesAdditionPercentage, extendAttributesMultiplicationPercentage);
        }
        // -- 增加的扩展属性值
        for (let i = 1; i <= actor.increaseExtendAttributes.length; i++) {
            let increaseExtendAttribute = actor.increaseExtendAttributes[i];
            if (increaseExtendAttribute) extendAttributesFixed[i] += increaseExtendAttribute;
        }
        // 其他战斗属性（通用固定值）
        hit = this.getActorInitAttirubte(actor, `HIT`);
        moveGrid = this.getActorInitAttirubte(actor, `MoveGrid`) + actor.increaseMoveGrid;
        // 刷新装备和技能以及状态，剔除相同的元素
        ArrayUtils.removeSameObjectD2(actor.equips, "id", false);
        ArrayUtils.removeSameObjectD2(actor.skills, "id", false);
        ArrayUtils.removeSameObjectD2(actor.status, "id", false);
        // 被动状态初始化
        if (actor.passiveStatus) {
            actor.selfStatus = actor.selfStatus1.concat();
            actor.selfImmuneStatus = actor.selfImmuneStatus1.concat();
            actor.hitTargetStatus = actor.hitTargetStatus1.concat();
            actor.hitTargetSelfAddStatus = actor.hitTargetSelfAddStatus1.concat();
        }
        else {
            actor.selfStatus.length = 0;
            actor.selfImmuneStatus.length = 0;
            actor.hitTargetStatus.length = 0;
            actor.hitTargetSelfAddStatus.length = 0;
        }
        // + 职业被动状态
        if (actorClass && actorClass.passiveStatus) {
            actor.selfStatus = actor.selfStatus.concat(actorClass.selfStatus);
            actor.selfImmuneStatus = actor.selfImmuneStatus.concat(actorClass.selfImmuneStatus);
            actor.hitTargetStatus = actor.hitTargetStatus.concat(actorClass.hitTargetStatus);
            actor.hitTargetSelfAddStatus = actor.hitTargetSelfAddStatus.concat(actorClass.hitTargetSelfAddStatus);
        }
        // 追加来自装备的属性和状态：加法
        let equipPartsLength = GameData.getLength(19);
        let equippedEquips: Module_Equip[] = [];
        for (let i = 1; i <= equipPartsLength; i++) {
            let equip: Module_Equip;
            // 预览模式下该部件使用指定的装备（可能无装备）
            if (previewChangeMode == 2 && previewChangeEquipIndex == i) {
                equip = previewChangeEquip;
            }
            // 否则使用当前该部位上已佩戴的装备
            else {
                equip = Game.getActorEquipByPartID(actor, i);
            }
            // 存在装备的话，属性加成
            if (equip) {
                equippedEquips.push(equip);
                // -- 装备被动属性
                maxhp += equip.maxHP;
                maxsp += equip.maxSP;
                atk += equip.atk;
                def += equip.def;
                mag += equip.mag;
                magDef += equip.magDef;
                hit += equip.hit;
                dod += equip.dod;
                crit += equip.crit;
                magCrit += equip.magCrit;
                moveGrid += equip.moveGrid;
                // 状态刷新
                if (equip.passiveStatus) {
                    actor.selfStatus = actor.selfStatus.concat(equip.selfStatus);
                    actor.selfImmuneStatus = actor.selfImmuneStatus.concat(equip.selfImmuneStatus);
                    actor.hitTargetStatus = actor.hitTargetStatus.concat(equip.hitTargetStatus);
                    actor.hitTargetSelfAddStatus = actor.hitTargetSelfAddStatus.concat(equip.hitTargetSelfAddStatus);
                }
                // extendAttributes
                this.slotExtendAttributes(equip, extendAttributesFixed, extendAttributesAdditionPercentage, extendAttributesMultiplicationPercentage);
            }
        }
        // 四件套效果。预览模式下 equippedEquips 也包含预览后的完整穿戴结果。
        let equipSetBonus = this.getEquipSetBonus(equippedEquips);
        maxhp += equipSetBonus.maxHP;
        maxsp += equipSetBonus.maxSP;
        atk += equipSetBonus.atk;
        def += equipSetBonus.def;
        mag += equipSetBonus.mag;
        magDef += equipSetBonus.magDef;
        hit += equipSetBonus.hit;
        dod += equipSetBonus.dod;
        crit += equipSetBonus.crit;
        magCrit += equipSetBonus.magCrit;
        moveGrid += equipSetBonus.moveGrid;
        // 追加来自技能的属性和状态
        let skills = actor.skills;
        if (actor.atkMode == 1 && actor.atkSkill) skills = skills.concat(actor.atkSkill);
        for (let i = 0; i < skills.length; i++) {
            let actorSkill: Module_Skill;
            if (previewChangeMode == 1 && previewChangeSkillIndex == i) {
                actorSkill = previewChangeSkill;
            }
            else {
                actorSkill = skills[i];
            }
            if (actorSkill.passiveAttribute) {
                maxhp += actorSkill.maxHP;
                maxsp += actorSkill.maxSP;
                atk += actorSkill.atk;
                def += actorSkill.def;
                mag += actorSkill.mag;
                magDef += actorSkill.magDef;
                hit += actorSkill.hit1;
                dod += actorSkill.dod;
                crit += actorSkill.crit;
                magCrit += actorSkill.magCrit;
                moveGrid += actorSkill.moveGrid;
                // extendAttributes
                this.slotExtendAttributes(actorSkill, extendAttributesFixed, extendAttributesAdditionPercentage, extendAttributesMultiplicationPercentage);
            }
            // 状态刷新
            if (actorSkill.passiveStatus) {
                actor.selfStatus = actor.selfStatus.concat(actorSkill.selfStatus);
                actor.selfImmuneStatus = actor.selfImmuneStatus.concat(actorSkill.selfImmuneStatus);
                actor.hitTargetStatus = actor.hitTargetStatus.concat(actorSkill.hitTargetStatus);
                actor.hitTargetSelfAddStatus = actor.hitTargetSelfAddStatus.concat(actorSkill.hitTargetSelfAddStatus);
            }
        }
        // 追加来自状态的属性 %
        let stHPPer_BUFF = 1.0;
        let stHPPer_DEBUFF = 1.0;
        let stSPPer_BUFF = 1.0;
        let stSPPer_DEBUFF = 1.0;
        let stATKPer_BUFF = 1.0;
        let stATKPer_DEBUFF = 1.0;
        let stDEFPer_BUFF = 1.0;
        let stDEFPer_DEBUFF = 1.0;
        let stMAGPer_BUFF = 1.0;
        let stMAGPer_DEBUFF = 1.0;
        let stMagDefPer_BUFF = 1.0;
        let stMagDefPer_DEBUFF = 1.0;
        let stHitPer_BUFF = 1.0;
        let stHitPer_DEBUFF = 1.0;
        let stCritPer_BUFF = 1.0;
        let stCritPer_DEBUFF = 1.0
        let stMagCritPer_BUFF = 1.0;
        let stMagCritPer_DEBUFF = 1.0;
        let stMoveGridPer_BUFF = 1.0;
        let stMoveGridPer_DEBUFF = 1.0;
        for (let i = 0; i < actor.status.length; i++) {
            let status = actor.status[i];
            // 比例
            if (status.maxHPPer > 100) stHPPer_BUFF *= ((status.maxHPPer - 100) * status.currentLayer + 100) * 0.01;
            else if (status.maxHPPer < 100) stHPPer_DEBUFF *= Math.pow(status.maxHPPer / 100, status.currentLayer);
            if (status.maxSPPer > 100) stSPPer_BUFF *= ((status.maxSPPer - 100) * status.currentLayer + 100) * 0.01;
            else if (status.maxSPPer < 100) stSPPer_DEBUFF *= Math.pow(status.maxSPPer / 100, status.currentLayer);
            if (status.atkPer > 100) stATKPer_BUFF *= ((status.atkPer - 100) * status.currentLayer + 100) * 0.01;
            else if (status.atkPer < 100) stATKPer_DEBUFF *= Math.pow(status.atkPer / 100, status.currentLayer);
            if (status.defPer > 100) stDEFPer_BUFF *= ((status.defPer - 100) * status.currentLayer + 100) * 0.01;
            else if (status.defPer < 100) stDEFPer_DEBUFF *= Math.pow(status.defPer / 100, status.currentLayer);
            if (status.magPer > 100) stMAGPer_BUFF *= ((status.magPer - 100) * status.currentLayer + 100) * 0.01;
            else if (status.magPer < 100) stMAGPer_DEBUFF *= Math.pow(status.magPer / 100, status.currentLayer);
            if (status.magDefPer > 100) stMagDefPer_BUFF *= ((status.magDefPer - 100) * status.currentLayer + 100) * 0.01;
            else if (status.magDefPer < 100) stMagDefPer_DEBUFF *= Math.pow(status.magDefPer / 100, status.currentLayer);
            if (status.moveGridPer > 100) stMoveGridPer_BUFF *= ((status.moveGridPer - 100) * status.currentLayer + 100) * 0.01;
            else if (status.moveGridPer < 100) stMoveGridPer_DEBUFF *= Math.pow(status.moveGridPer / 100, status.currentLayer);
            if (status.hitPer > 100) stHitPer_BUFF *= ((status.hitPer - 100) * status.currentLayer + 100) * 0.01;
            else if (status.hitPer < 100) stHitPer_DEBUFF *= Math.pow(status.hitPer / 100, status.currentLayer);
            if (status.critPer > 100) stCritPer_BUFF *= ((status.critPer - 100) * status.currentLayer + 100) * 0.01;
            else if (status.critPer < 100) stCritPer_DEBUFF *= Math.pow(status.critPer / 100, status.currentLayer);
            if (status.magCritPer > 100) stMagCritPer_BUFF *= ((status.magCritPer - 100) * status.currentLayer + 100) * 0.01;
            else if (status.magCritPer < 100) stMagCritPer_DEBUFF *= Math.pow(status.magCritPer / 100, status.currentLayer);
            maxhp += status.maxHP * status.currentLayer;
            maxsp += status.maxSP * status.currentLayer;
            atk += status.atk * status.currentLayer;
            def += status.def * status.currentLayer;
            mag += status.mag * status.currentLayer;
            magDef += status.magDef * status.currentLayer;
            moveGrid += status.moveGrid * status.currentLayer;
            hit += status.hit * status.currentLayer;
            crit += status.crit * status.currentLayer;
            magCrit += status.magCrit * status.currentLayer;
            // 记录由状态变更的最大生命值（永续的不会恢复生命值）
            if (status.totalDuration != 0 && !status.addMaxHPUsed) {
                fromStatusMaxHP += status.maxHP * status.currentLayer;
                if (status.maxHPPer > 100) fromStatusMaxHPper_BUFF *= ((status.maxHPPer - 100) * status.currentLayer + 100) * 0.01;
                else if (status.maxHPPer < 100) fromStatusMaxHPper_DEBUFF *= Math.pow(status.maxHPPer / 100, status.currentLayer);
                status.addMaxHPUsed = true;
            }
        }
        let fromStatusMaxHPper = fromStatusMaxHPper_BUFF * fromStatusMaxHPper_DEBUFF;
        fromStatusMaxHP += maxhp * fromStatusMaxHPper - maxhp;
        // 比例变更
        maxhp *= stHPPer_BUFF * stHPPer_DEBUFF;
        maxsp *= stSPPer_BUFF * stSPPer_DEBUFF;
        atk *= stATKPer_BUFF * stATKPer_DEBUFF;
        def *= stDEFPer_BUFF * stDEFPer_DEBUFF;
        mag *= stMAGPer_BUFF * stMAGPer_DEBUFF;
        magDef *= stMagDefPer_BUFF * stMagDefPer_DEBUFF;
        hit *= stHitPer_BUFF * stHitPer_DEBUFF;
        crit *= stCritPer_BUFF * stCritPer_DEBUFF;
        magCrit *= stMagCritPer_BUFF * stMagCritPer_DEBUFF;
        moveGrid *= stMoveGridPer_BUFF * stMoveGridPer_DEBUFF;
        // 限制
        atk = Math.max(atk, 0);
        def = Math.max(def, 0);
        agi = Math.max(agi, 0);
        dod = Math.max(dod, 0);
        maxhp = Math.max(maxhp, 0);
        maxsp = Math.max(maxsp, 0);
        pow = Math.max(pow, 0);
        end = Math.max(end, 0);
        mag = Math.max(mag, 0);
        magDef = Math.max(magDef, 0);
        hit = Math.max(hit, 0);
        crit = Math.max(Math.min(crit, 100), 0);
        magCrit = Math.max(Math.min(magCrit, 100), 0);
        moveGrid = Math.max(moveGrid, 0);
        // 扩展属性
        let actorExtendAttributes = extendAttributesFixed;
        for (let i = 1; i <= extendAttributeLen; i++) {
            actorExtendAttributes[i] *= 1 + extendAttributesAdditionPercentage[i] * 0.01;
        }
        for (let i = 1; i <= extendAttributeLen; i++) {
            actorExtendAttributes[i] *= extendAttributesMultiplicationPercentage[i];
        }
        // --- limit && integer
        for (let i = 1; i <= extendAttributeLen; i++) {
            let extendAttributeSetting = this.extendAttributeSettings[i];
            if (extendAttributeSetting) {
                let extValue = actorExtendAttributes[i];
                extValue = Math.max(Math.min(extValue, extendAttributeSetting.upperLimit), extendAttributeSetting.lowerLimit);
                if (extendAttributeSetting.isinteger) extValue = Math.floor(extValue);
                actorExtendAttributes[i] = extValue;
            }
        }
        // 返回结果
        return {
            ATK: Math.floor(atk),
            DEF: Math.floor(def),
            AGI: Math.floor(agi),
            DOD: Math.floor(dod),
            MaxHP: Math.floor(maxhp),
            MaxSP: Math.floor(maxsp),
            POW: Math.floor(pow),
            END: Math.floor(end),
            MAG: Math.floor(mag),
            MagDef: Math.floor(magDef),
            HIT: Math.floor(hit),
            CRIT: Math.floor(crit),
            MagCrit: Math.floor(magCrit),
            MoveGrid: Math.floor(moveGrid),
            statusAddMaxHP: Math.floor(fromStatusMaxHP),
            extendAttributes: actorExtendAttributes.concat()
        }
    }
    /**
     * 汇总当前完整穿戴的四件套效果。
     */
    private getEquipSetBonus(equips: Module_Equip[]) {
        let result = {
            maxHP: 0, maxSP: 0, atk: 0, def: 0, mag: 0, magDef: 0,
            hit: 0, dod: 0, crit: 0, magCrit: 0, moveGrid: 0
        };
        let equippedIDs: number[] = [];
        for (let i = 0; i < equips.length; i++) {
            equippedIDs.push(equips[i].id);
        }
        for (let i = 0; i < ProjectGame.EQUIP_SET_BONUSES.length; i++) {
            let setBonus = ProjectGame.EQUIP_SET_BONUSES[i];
            let completed = true;
            for (let s = 0; s < setBonus.equipIDs.length; s++) {
                if (equippedIDs.indexOf(setBonus.equipIDs[s]) == -1) {
                    completed = false;
                    break;
                }
            }
            if (!completed) continue;
            result.maxHP += setBonus.maxHP;
            result.maxSP += setBonus.maxSP;
            result.atk += setBonus.atk;
            result.def += setBonus.def;
            result.mag += setBonus.mag;
            result.magDef += setBonus.magDef;
            result.hit += setBonus.hit;
            result.dod += setBonus.dod;
            result.crit += setBonus.crit;
            result.magCrit += setBonus.magCrit;
            result.moveGrid += setBonus.moveGrid;
        }
        return result;
    }
    /**
     * 指定装备是否全部穿戴。
     */
    static isEquipSetCompleted(equips: Module_Equip[], equipIDs: number[]): boolean {
        if (!equips) return false;
        for (let i = 0; i < equipIDs.length; i++) {
            let equipped = false;
            for (let s = 0; s < equips.length; s++) {
                if (equips[s].id == equipIDs[i]) {
                    equipped = true;
                    break;
                }
            }
            if (!equipped) return false;
        }
        return true;
    }
    static hasWarmMountainSet(actor: Module_Actor): boolean {
        return actor && this.isEquipSetCompleted(actor.equips, [1007, 2005, 3009, 4005]);
    }
    static hasTaiyueSet(actor: Module_Actor): boolean {
        return actor && this.isEquipSetCompleted(actor.equips, [1008, 2006, 3010, 4006]);
    }
    //------------------------------------------------------------------------------------------------------
    // 私有实现
    //------------------------------------------------------------------------------------------------------
    /**
     * 监听事件：进入场景的状态改变时派发事件
     * @param inNewSceneState 0-切换游戏场景 1-新游戏 2-读取存档
     */
    private onInSceneStateChange(inNewSceneState: number) {
        // 状态：离开场景时（标题时视为离开空场景）
        if (GameGate.gateState == GameGate.STATE_0_START_EXECUTE_LEAVE_SCENE_EVENT) {
            // 兼容旧版新游戏模板和旧存档中嵌入的初始角色副本。
            if (inNewSceneState == 1 || inNewSceneState == 2) {
                ProjectPlayer.migrateLegacyPlayerActors();
                ProjectPlayer.migrateCharacterBaseBalance();
                ProjectPlayer.syncPlayerActorAutoSkills();
            }
            // 新游戏的话：记录当前时间为启动时间
            if (inNewSceneState == 1) {
                ProjectGame.gameStartTime = new Date();
                // 新游戏默认可操纵角色：狼女（玩家版）、小美、艾露恩、萧酉歌、岚绫。
                // 角色数据库中虽然已经定义了这些角色，但旧模板的 party
                // 只包含前四名主角，因此这里补入，读档流程不会重复加入。
                let defaultNewGameActorIDs = [5, 6, 7, 8, 9];
                for (let i = 0; i < defaultNewGameActorIDs.length; i++) {
                    let actorID = defaultNewGameActorIDs[i];
                    if (ProjectPlayer.getPlayerActorFirstPositionByActorID(actorID) < 0) {
                        ProjectPlayer.addPlayerActorByActorID(actorID, 1, false);
                    }
                }
                ProjectPlayer.init();
                this.initExtendAttributeSetting();
            }
            // 读取存档的情况：以当前的时间减去已游戏时间来记录
            else if (inNewSceneState == 2) {
                ProjectGame.gameStartTime = new Date((Date.now() - GUI_SaveFileManager.currentSveFileIndexInfo.indexInfo.gameTime));
            }
            // 新游戏角色和旧存档角色均使用当前的小美技能基础伤害。
            if (inNewSceneState == 1 || inNewSceneState == 2) {
                ProjectPlayer.syncXiaomeiSkillBalance();
            }
        }
        // 状态：加载场景完毕
        else if (GameGate.gateState == GameGate.STATE_3_IN_SCENE_COMPLETE) {
            MiniMapControl.ensureDesktop();
            // -- 新游戏：创建队友的场景对象以及战斗者和角色的数据
            if (inNewSceneState == 1 || inNewSceneState == 2) {
                // 将角色转为副本模式，以便支持存档
                for (var i = 0; i < Game.player.data.party.length; i++) {
                    var actorDS = Game.player.data.party[i];
                    if (actorDS == null) continue;
                    GameData.changeModuleDataToCopyMode(actorDS.actor, 6);
                }
            }
        }
    }
    private onPauseChange(): void {
        if (Game.pause) {
            ProjectGame.gamePauseStartTime = new Date();
        }
        else {
            if (ProjectGame.gamePauseStartTime) {
                let dTime = Date.now() - ProjectGame.gamePauseStartTime.getTime();
                ProjectGame.gameStartTime = new Date(ProjectGame.gameStartTime.getTime() + dTime);
                ProjectGame.gamePauseStartTime = null;
            }
        }
    }
    /**
     * 获取成长数据根据等级
     * @param actor 角色数据 
     * @param growAttrName 属性名称 
     * @param lv 等级
     * @return [number] 
     */
    private getGrowValueByLv(actor: Module_Actor, growAttrName: string, lv: number, actorClass: Module_Class = null, customAttribute: DataStructure_customAttributeGrow = null): number {
        // -- 获取职业
        if (!actorClass) actorClass = GameData.getModuleData(7, actor.class);
        if (!actorClass) return 0;
        // -- 获取属性
        let growData: any[];
        if (customAttribute) {
            let cacheGrowName = "__extCache_" + customAttribute.attribute;
            growData = actor[cacheGrowName];
            if (!actor[cacheGrowName]) growData = actor[cacheGrowName] = GameUtils.getCurveData(customAttribute.value);
        }
        else {
            let cacheGrowName = growAttrName + "_cache";
            growData = actor[cacheGrowName];
            if (!actor[cacheGrowName]) growData = actor[cacheGrowName] = GameUtils.getCurveData(actorClass[growAttrName]);
        }
        let per = lv == 0 ? 0 : (lv - 1) / (actor.MaxLv - 1); // 转为0-1的空间
        return GameUtils.getBezierPoint2ByGroupValue(growData, per);
    }
    /**
     * 装入扩展属性
     * @param element 元素
     * @param extendAttributesFixed 固定值
     * @param extendAttributesAdditionPercentage 百分比加法
     * @param extendAttributesMultiplicationPercentage 百分比乘法
     */
    slotExtendAttributes(element: Module_Actor | Module_Skill | Module_Equip | Module_Status, extendAttributesFixed: number[] = null, extendAttributesAdditionPercentage: number[] = null, extendAttributesMultiplicationPercentage: number[] = null): {
        extendAttributesFixed: number[],
        extendAttributesAdditionPercentage: number[],
        extendAttributesMultiplicationPercentage: number[]
    } {
        if (!element.isCustomAttribute) return;
        // 默认值
        if (!extendAttributesFixed) {
            extendAttributesFixed = [];
            extendAttributesAdditionPercentage = [];
            extendAttributesMultiplicationPercentage = [];
            let extendAttributeLen = GameData.getLength(14);
            for (let i = 1; i <= extendAttributeLen; i++) {
                extendAttributesFixed[i] = 0;
                extendAttributesAdditionPercentage[i] = 0;
                extendAttributesMultiplicationPercentage[i] = 1;
            }
        }
        for (let i = 0; i < element.customAttributes.length; i++) {
            let customAttribute = element.customAttributes[i];
            if (customAttribute.type == 0) {
                extendAttributesFixed[customAttribute.attribute] += customAttribute.value;
            }
            else if (customAttribute.type == 1) {
                extendAttributesAdditionPercentage[customAttribute.attribute] += customAttribute.value;
            }
            else if (customAttribute.type == 2) {
                extendAttributesMultiplicationPercentage[customAttribute.attribute] *= customAttribute.value * 0.01;
            }
        }
        return {
            extendAttributesFixed: extendAttributesFixed,
            extendAttributesAdditionPercentage: extendAttributesAdditionPercentage,
            extendAttributesMultiplicationPercentage: extendAttributesMultiplicationPercentage
        }
    }
    /**
     * 获取角色初始属性（以避免重复计算）
     * -- 首次获取时会记录最初的值，记录值会存档。（利用属性initAttrs存档）
     * @param actor 
     * @param attrName 
     * @return [number]
     */
    private getActorInitAttirubte(actor: Module_Actor, attrName: string): number {
        let cacheInitName = `__init_${attrName}`;
        let initValue = actor.initAttrs[cacheInitName];
        if (initValue == null) {
            actor.initAttrs[cacheInitName] = initValue = actor[attrName];
        }
        return initValue;
    }
    /**
     * 初始化扩展属性设定
     */
    private initExtendAttributeSetting(): void {
        for (let i = 0; i < WorldData.extendsAttributeSetting.length; i++) {
            let s = WorldData.extendsAttributeSetting[i];
            this.extendAttributeSettings[s.attribute] = s;
        }
    }
}
