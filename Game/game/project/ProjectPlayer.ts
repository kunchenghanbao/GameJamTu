/**
 * 项目层-玩家实现类
 * 
 * Created by 黑暗之神KDS on 2020-03-03 09:04:41.
 */
class ProjectPlayer extends ClientPlayer {
    //------------------------------------------------------------------------------------------------------
    // 静态变量
    //------------------------------------------------------------------------------------------------------
    /**
      * 事件：监听道具数目改变
      */
    static EVENT_CHANGE_ITEM_NUMBER = "ProjectPlayerCHANGE_ITEM_NUMBER";
    /**
     * 事件：监听金币改变
     */
    static EVENT_CHANGE_GOLD_NUMBER = "ProjectPlayerCHANGE_GOLD_NUMBER";
    //------------------------------------------------------------------------------------------------------
    // EventUtils 事件：队伍
    //------------------------------------------------------------------------------------------------------
    /**
     * 事件：新增队伍成员 onAddPlayerActor(inPartyIndex: number,actorDS: DataStructure_inPartyActor)
     */
    static EVENT_ADD_PLAYER_ACTOR: string = "ProjectPlayerEVENT_ADD_PLAYER_ACTOR";
    /**
     * 事件：减少队伍成员 onRemovePlayerActor(inPartyIndex: number,actorDS: DataStructure_inPartyActor)
     */
    static EVENT_REMOVE_PLAYER_ACTOR: string = "ProjectPlayerEVENT_REMOVE_PLAYER_ACTOR";
    //------------------------------------------------------------------------------------------------------
    // EventUtils 事件：玩家的角色
    //------------------------------------------------------------------------------------------------------
    /**
     * 事件：卸下了角色的道具 onPlayerActorRemoveItem(inPartyIndex: number, actorDS: DataStructure_inPartyActor, itemIndex: number, item: Module_Item);
     */
    static EVENT_REMOVE_PLAYER_ACTOR_ITEM: string = "ProjectPlayerEVENT_REMOVE_PLAYER_ACTOR_ITEM";
    /**
     * 事件：安装了角色的道具 onPlayerActorCarryItem(inPartyIndex: number, actorDS: DataStructure_inPartyActor, itemIndex: number, removeItem: Module_Item, newItem: Module_Item);
     */
    static EVENT_CARRY_PLAYER_ACTOR_ITEM: string = "ProjectPlayerEVENT_CARRY_PLAYER_ACTOR_ITEM";
    /**
     * 事件：学习了技能 onPlayerActorLearnSkill(inPartyIndex: number, actorDS: DataStructure_inPartyActor, newSkill: Module_Skill);
     */
    static EVENT_LEARN_PLAYER_ACTOR_SKILL: string = "ProjectPlayerEVENT_LEARN_PLAYER_ACTOR_SKILL";
    /**
     * 事件：忘记了技能 onPlayerActorForgetSkill(inPartyIndex: number, actorDS: DataStructure_inPartyActor, forgetSkill: Module_Skill);
     */
    static EVENT_FORGET_PLAYER_ACTOR_SKILL: string = "ProjectPlayerEVENT_FORGET_PLAYER_ACTOR_SKILL";
    /**
     * 事件：穿戴了装备 onWearPlayerActorEquip(inPartyIndex: number, actorDS: DataStructure_inPartyActor, takeOffEquip: Module_Equip, newEquip: Module_Equip);
     */
    static EVENT_WEAR_PLAYER_ACTOR_EQUIP: string = "ProjectPlayerEVENT_WEAR_PLAYER_ACTOR_EQUIP";
    /**
     * 事件：卸下了装备 onTakeOffPlayerActorEquip(inPartyIndex: number, actorDS: DataStructure_inPartyActor, takeOffEquip: Module_Equip);
     */
    static EVENT_TAKE_OFF_PLAYER_ACTOR_EQUIP: string = "ProjectPlayerEVENT_TAKE_OFF_PLAYER_ACTOR_EQUIP";
    /**
     * 事件：当经验值变更时 onPlayerActorChangeEXP(inPartyIndex: number,exp:number)
     */
    static EVENT_PLAYER_ACTOR_CHANGE_EXP: string = "ProjectPlayerEVENT_PLAYER_ACTOR_CHANGE_EXP";
    /**
     * 事件：当等级发生变更时 onPlayerActorChangeLevel(inPartyIndex: number,toLv:number)
     */
    static EVENT_PLAYER_ACTOR_CHANGE_LEVEL: string = "ProjectPlayerEVENT_PLAYER_ACTOR_CHANGE_LEVEL";
    //------------------------------------------------------------------------------------------------------
    // 实例
    //------------------------------------------------------------------------------------------------------
    /**
     * 玩家的游戏对象数据：重写以便类别能够指向项目层的ProjectClientSceneObject，方便调用
     */
    declare public sceneObject: ProjectClientSceneObject;
    /**
     * 构造函数
     */
    constructor() {
        super(true);
    }
    /**
     * 初始化角色数据
     * @param actor 角色数据 
     */
    static init(): void {
        // -- 初始化角色
        for (var i = 0; i < Game.player.data.party.length; i++) {
            this.initPlayerActor(i);
        }
    }
    /**
     * 修复旧版初始队伍中保存的角色副本。
     * 仅迁移职业编号仍与角色编号相同且等级上限为60的前四名旧角色。
     */
    static migrateLegacyPlayerActors(): void {
        var legacyInitialSkills: { [actorID: number]: number[] } = {
            1: [15, 1, 16],
            2: [9],
            3: [5],
            4: [11]
        };
        for (var i = 0; i < Game.player.data.party.length; i++) {
            var actorDS: DataStructure_inPartyActor = Game.player.data.party[i];
            if (!actorDS || !actorDS.actor) continue;
            var actor = actorDS.actor;
            if (actor.id < 1 || actor.id > 4 || actor.class != actor.id || actor.MaxLv != 60) continue;
            var systemActor: Module_Actor = GameData.getModuleData(6, actor.id);
            if (!systemActor) continue;

            // 清除旧初始技能及旧职业的自动习得技能，保留玩家后来获得的其他技能。
            var obsoleteSkillIDs: { [skillID: number]: boolean } = {};
            var oldInitialSkills = legacyInitialSkills[actor.id];
            for (var s = 0; s < oldInitialSkills.length; s++) obsoleteSkillIDs[oldInitialSkills[s]] = true;
            var oldClass: Module_Class = GameData.getModuleData(7, actor.class);
            if (oldClass && oldClass.lvUpAutoGetSkills) {
                for (var s = 0; s < oldClass.lvUpAutoGetSkills.length; s++) {
                    obsoleteSkillIDs[oldClass.lvUpAutoGetSkills[s].skill] = true;
                }
            }
            for (var skillID in obsoleteSkillIDs) Game.actorForgetSkill(actor, Number(skillID), false);

            actor.class = systemActor.class;
            actor.MaxLv = systemActor.MaxLv;
            for (var s = 0; s < systemActor.skills.length; s++) {
                Game.actorLearnSkill(actor, systemActor.skills[s].id, false);
            }
            var newClass: Module_Class = GameData.getModuleData(7, actor.class);
            if (newClass && newClass.lvUpAutoGetSkills) {
                for (var s = 0; s < newClass.lvUpAutoGetSkills.length; s++) {
                    var autoSkill = newClass.lvUpAutoGetSkills[s];
                    if (actorDS.lv >= autoSkill.lv) Game.actorLearnSkill(actor, autoSkill.skill, false);
                }
            }
            actorDS.lv = Math.max(1, Math.min(actorDS.lv, actor.MaxLv));
            Game.refreshActorAttribute(actor, actorDS.lv);
        }
    }
    /** 将旧存档中的新增角色补齐到当前基础数值，仅执行一次。 */
    static migrateCharacterBaseBalance(): void {
        var migrationFlag = "__characterBaseBalanceV1";
        for (var i = 0; i < Game.player.data.party.length; i++) {
            var actorDS: DataStructure_inPartyActor = Game.player.data.party[i];
            if (!actorDS || !actorDS.actor) continue;
            var actor = actorDS.actor;
            if (!actor.initAttrs) actor.initAttrs = {};
            if (actor.initAttrs[migrationFlag]) continue;

            if (actor.id == 5) {
                actor.increaseMaxHP += 120;
                actor.increaseMaxSP += 30;
                actor.increaseATK += 10;
                actor.increaseDEF += 9;
                actor.increaseMagDef += 12;
                actor.increaseDod += 6;
            }
            else if (actor.id == 7) {
                actor.HIT = 90;
                actor.initAttrs["__init_HIT"] = 90;
            }
            else if (actor.id == 8) {
                actor.increaseCRIT += 10;
            }
            else if (actor.id == 9) {
                actor.increaseCRIT += 16;
            }
            else {
                continue;
            }
            actor.initAttrs[migrationFlag] = true;
            Game.refreshActorAttribute(actor, actorDS.lv);
        }
    }
    /** 根据当前等级静默补齐职业自动习得技能，用于兼容新增的升级技能。 */
    static syncPlayerActorAutoSkills(): void {
        for (var i = 0; i < Game.player.data.party.length; i++) {
            var actorDS: DataStructure_inPartyActor = Game.player.data.party[i];
            if (!actorDS || !actorDS.actor || !actorDS.actor.growUpEnabled) continue;
            var classData: Module_Class = GameData.getModuleData(7, actorDS.actor.class);
            if (!classData || !classData.lvUpAutoGetSkills) continue;
            for (var s = 0; s < classData.lvUpAutoGetSkills.length; s++) {
                var autoSkill = classData.lvUpAutoGetSkills[s];
                if (actorDS.lv >= autoSkill.lv) Game.actorLearnSkill(actorDS.actor, autoSkill.skill, false);
            }
        }
    }
    /**
     * 将旧存档中的小美技能同步到当前基础伤害。
     * 肉鸽强化只增加 additionMultiple，因此迁移时保留旧基础倍率以上的强化值。
     */
    static syncXiaomeiSkillBalance(): void {
        var balance: {
            [skillID: number]: {
                oldVersions: { damage: number, multiple: number }[],
                newDamage: number,
                newMultiple: number
            }
        } = {
            18: {
                oldVersions: [{ damage: 12, multiple: 130 }, { damage: 15, multiple: 145 }],
                newDamage: 30,
                newMultiple: 180
            },
            19: {
                oldVersions: [{ damage: 18, multiple: 110 }, { damage: 25, multiple: 135 }],
                newDamage: 45,
                newMultiple: 170
            }
        };
        for (var i = 0; i < Game.player.data.party.length; i++) {
            var actorDS: DataStructure_inPartyActor = Game.player.data.party[i];
            if (!actorDS || !actorDS.actor || actorDS.actor.id != 6 || !actorDS.actor.skills) continue;
            for (var s = 0; s < actorDS.actor.skills.length; s++) {
                var skill = actorDS.actor.skills[s];
                var setting = balance[skill.id];
                if (!setting) continue;
                var oldVersion: { damage: number, multiple: number } = null;
                for (var v = 0; v < setting.oldVersions.length; v++) {
                    if (skill.damageValue == setting.oldVersions[v].damage) {
                        oldVersion = setting.oldVersions[v];
                        break;
                    }
                }
                if (!oldVersion) continue;
                var upgradedMultiple = Math.max(0, (skill.additionMultiple || oldVersion.multiple) - oldVersion.multiple);
                skill.damageValue = setting.newDamage;
                skill.additionMultiple = setting.newMultiple + upgradedMultiple;
            }
        }
    }
    //------------------------------------------------------------------------------------------------------
    // 静态方法-属性
    //------------------------------------------------------------------------------------------------------
    /**
     * 增加金币
     * @param v 增加的数
     */
    static increaseGold(v: number): void {
        // 修改金币
        Game.player.data.gold = Math.max(Game.player.data.gold + v, 0);
        // 派发事件
        EventUtils.happen(ProjectPlayer, ProjectPlayer.EVENT_CHANGE_GOLD_NUMBER);
    }
    //------------------------------------------------------------------------------------------------------
    // 静态方法-背包
    //------------------------------------------------------------------------------------------------------
    /**
     * 获取背包中的道具-DS类型
     * @param itemID 道具ID
     * @param isEquip 是否装备
     * @param includeCopyMode[可选] 默认值=false  包含复制的装备（如随机属性的装备是复制体）
     * @return [DataStructure_packageItem] 
     */
    static getItemDS(itemID: number, isEquip: boolean = false, includeCopyMode: boolean = false): DataStructure_packageItem {
        let itemDSs = ArrayUtils.matchAttributes(Game.player.data.package, { isEquip: isEquip }, false);
        if (!isEquip) {
            return ArrayUtils.matchAttributesD2(itemDSs, "item", { id: itemID }, true)[0] as any;
        }
        else {
            let equipDSs: DataStructure_packageItem[] = ArrayUtils.matchAttributesD2(itemDSs, "equip", { id: itemID }, false);
            for (let i = 0; i < equipDSs.length; i++) {
                let equipDS = equipDSs[i];
                if (!GameData.isCopyModeData(equipDS.equip) || includeCopyMode) return equipDS;
            }
            return null;
        }
    }
    /**
     * 获取背包中的道具
     * @param itemID 道具编号
     * @return [Module_Item]
     */
    static getItem(itemID: number): Module_Item {
        var itemDS = this.getItemDS(itemID, false);
        if (itemDS) return itemDS.item;
        return null;
    }
    /**
     * 获取道具位置
     * @param item 道具
     * @return [number] 位置，不存在返回null
     */
    static getItemIndex(item: Module_Item): number {
        return ArrayUtils.matchAttributes(Game.player.data.package, { item: item }, true, "==", true)[0];
    }
    /**
     * 获取装备位置
     * @param equip 道具
     * @return [number] 位置，不存在返回null
     */
    static getEquipIndex(equip: Module_Equip): number {
        return ArrayUtils.matchAttributes(Game.player.data.package, { equip: equip }, true, "==", true)[0];
    }
    /**
     * 改变道具数目（增减道具）
     * @param itemID 道具ID
     * @param v 增加或减少的数目
     */
    static changeItemNumber(itemID: number, v: number, isEquip: boolean = false, happenEvent: boolean = true): void {
        // 道具不存在的情况：忽略
        let moduleID = isEquip ? 9 : 1;
        if (!GameData.getModuleData(moduleID, itemID)) return;
        // 增加的情况
        if (v > 0) {
            let itemDS = this.getItemDS(itemID, isEquip);
            // 如果不存在道具或加入的是副本装备的话则新增一个
            if (!itemDS) {
                itemDS = new DataStructure_packageItem;
                if (isEquip) {
                    itemDS.equip = GameData.newModuleData(moduleID, itemID);
                }
                else {
                    itemDS.item = GameData.newModuleData(moduleID, itemID);
                }
                itemDS.number = v;
                itemDS.isEquip = isEquip;
                Game.player.data.package.push(itemDS);
            }
            else if (itemDS) {
                itemDS.number += v;
            }
        }
        // 减少的情况
        else {
            // 优先回收普通装备，再回收复制出来的装备
            let itemDS = this.getItemDS(itemID, isEquip);
            if (!itemDS) itemDS = this.getItemDS(itemID, isEquip, true);
            if (itemDS) {
                itemDS.number += v;
                if (itemDS.number <= 0) Game.player.data.package.splice(Game.player.data.package.indexOf(itemDS), 1);
            }
        }
        // 派发事件
        if (happenEvent) EventUtils.happen(ProjectPlayer, ProjectPlayer.EVENT_CHANGE_ITEM_NUMBER);
    }
    /**
     * 改变背包中的装备数目：预设的装备
     * @param equipID 装备编号
     * @param v 数目
     * @param happenEvent [可选] 默认值=true 是否派发相关事件
     */
    static addEquip(equipID: number, v: number, happenEvent: boolean = true): void {
        this.changeItemNumber(equipID, v, true, happenEvent);
    }
    /**
     * 添加装备实例进入背包（支持非预设属性的装备，如极品装备）
     * 将该装备实例打包成DS数据格式装入背包中，一个实例仅对应一件物品
     * @param equip 装备实例
     * @param happenEvent [可选] 默认值=true 是否派发相关事件
     */
    static addEquipByInstance(equip: Module_Equip, happenEvent: boolean = true): void {
        // 如果该装备是副本装备则创建一件独有的装备放入背包
        if (GameData.isCopyModeData(equip)) {
            // 否则直接新增一件背包道具
            var equipDS = new DataStructure_packageItem;
            equipDS.equip = equip;
            equipDS.number = 1;
            equipDS.isEquip = true;
            Game.player.data.package.push(equipDS);
            if (happenEvent) EventUtils.happen(ProjectPlayer, ProjectPlayer.EVENT_CHANGE_ITEM_NUMBER);
        }
        // 如果该装备是预设则叠加至列表中
        else {
            ProjectPlayer.changeItemNumber(equip.id, 1, true, happenEvent);
        }
    }
    /**
     * 添加道具实例进入背包（支持非预设属性的道具）
     * @param item 道具实例
     * @param happenEvent [可选] 默认值=true 是否派发相关事件
     */
    static addItemByInstance(item: Module_Item, happenEvent: boolean = true): void {
        var itemDS = new DataStructure_packageItem;
        itemDS.item = item;
        itemDS.number = 1;
        itemDS.isEquip = false;
        Game.player.data.package.push(itemDS);
        if (happenEvent) EventUtils.happen(ProjectPlayer, ProjectPlayer.EVENT_CHANGE_ITEM_NUMBER);
    }
    /**
     * 移除道具根据实例
     * @param itemDS 
     * @param v 
     * @param happenEvent[可选] 默认值=true 
     */
    static removeItemByInstance(itemDS: DataStructure_packageItem, v: number, happenEvent: boolean = true) {
        let item = itemDS.isEquip ? itemDS.equip : itemDS.item;
        if (GameData.isCopyModeData(item)) {
            if (itemDS.number > v) {
                itemDS.number -= v;
            }
            else {
                Game.player.data.package.splice(Game.player.data.package.indexOf(itemDS), 1);
            }
        }
        else {
            ProjectPlayer.changeItemNumber(item.id, -v, itemDS.isEquip)
        }
        if (happenEvent) EventUtils.happen(ProjectPlayer, ProjectPlayer.EVENT_CHANGE_ITEM_NUMBER);
    }
    //------------------------------------------------------------------------------------------------------
    // 静态方法-角色
    //------------------------------------------------------------------------------------------------------
    /**
     * 获取成员-DS格式数据：根据成员所在队伍的位置 
     * @param inPartyIndex 成员位置 0~N
     * @return [DataStructure_inPartyActor]
     */
    static getPlayerActorDSByInPartyIndex(inPartyIndex: number): DataStructure_inPartyActor {
        if (inPartyIndex < 0) return null;
        var ds = Game.player.data.party[inPartyIndex];
        return ds;
    }
    /**
     * 获取成员-DS格式数据：根据角色编号，如果存在多个，则返回第一个
     * @param actorID 角色编号
     * @return [DataStructure_inPartyActor] 
     */
    static getPlayerActorDSByActorID(actorID: number): DataStructure_inPartyActor {
        return ArrayUtils.matchAttributesD2(Game.player.data.party, "actor", { id: actorID }, true)[0];
    }
    /**
     * 获取成员-DS格式数据：根据成员的角色数据
     * @param actor 角色数据 
     * @return [DataStructure_inPartyActor] 
     */
    static getPlayerActorDSByActor(actor: Module_Actor): DataStructure_inPartyActor {
        return ArrayUtils.matchAttributes(Game.player.data.party, { actor: actor }, true)[0];
    }
    /**
     * 获取成员所在队伍位置：根据成员的角色数据
     * @param actor 角色数据 
     * @return 所在队伍位置
     */
    static getPlayerActorIndexByActor(actor: Module_Actor): number {
        var actorDS = this.getPlayerActorDSByActor(actor);
        if (actorDS) return Game.player.data.party.indexOf(actorDS);
        return -1;
    }
    /**
     * 获取指定角色所在队伍的首个位置
     * @param actorID 角色编号
     * @return [number] -1表示无 0~n 表示所在位置
     */
    static getPlayerActorFirstPositionByActorID(actorID: number): number {
        var actorDS = ArrayUtils.matchAttributesD2(Game.player.data.party, "actor", { id: actorID }, true)[0];
        if (actorDS) return Game.player.data.party.indexOf(actorDS);
        return -1;
    }
    /**
     * 初始化角色数据
     * -- 修正等级上限
     * -- 根据当前等级习得对应的技能（如果已有则忽略）
     * @param actor 角色数据 
     */
    static initPlayerActor(inPartyIndex: number, isCreateActor: boolean = true): void {
        var actorDS: DataStructure_inPartyActor = Game.player.data.party[inPartyIndex];
        // 如果是成长角色的情况下需要修正
        if (actorDS) {
            if (actorDS.actor.growUpEnabled) {
                actorDS.lv = Math.max(1, Math.min(actorDS.lv, actorDS.actor.MaxLv));
                var classData: Module_Class = GameData.getModuleData(7, actorDS.actor.class);
                for (var i = 0; i < classData.lvUpAutoGetSkills.length; i++) {
                    var lvUpAutoGetSkill = classData.lvUpAutoGetSkills[i];
                    if (actorDS.lv >= lvUpAutoGetSkill.lv) {
                        this.learnSkillBySkillID(inPartyIndex, lvUpAutoGetSkill.skill);
                    }
                }
            }
            Game.refreshActorAttribute(actorDS.actor, actorDS.lv);
            if (isCreateActor || WorldData.fullStateWhenBattleStart) {
                actorDS.actor.hp = actorDS.actor.MaxHP;
                actorDS.actor.sp = actorDS.actor.MaxSP;
            }
        }
    }
    /**
     * 增加队伍成员：根据角色编号
     * 相同编号的角色也允许（即存在多名量产型角色）
     * @param actorID 角色编号
     * @param lv [可选] 默认值=1 等级
     * @param happenEvent [可选] 默认值=true 是否派发相关事件
     * @return [Module_Actor] 
     */
    static addPlayerActorByActorID(actorID: number, lv: number = 1, happenEvent: boolean = true): DataStructure_inPartyActor {
        if (lv < 1) lv = 1;
        // 新建数据，以克隆模式，即读档后数据来自存档而非数据库设定，因为角色数据通常会变化和成长
        var newActor: Module_Actor = GameData.newModuleData(6, actorID, true);
        var ds = new DataStructure_inPartyActor();
        ds.actor = newActor;
        ds.lv = Math.min(lv, newActor.MaxLv);
        return this.addPlayerActorByDS(ds, happenEvent, true);
    }
    /**
     * 增加队伍成员：根据角色DS
     * @param actorDS 角色DS
     * @param happenEvent [可选] 默认值=true 是否派发相关事件
     * @return [Module_Actor] 
     */
    static addPlayerActorByDS(actorDS: DataStructure_inPartyActor, happenEvent: boolean = true, isCreateActor: boolean = true): DataStructure_inPartyActor {
        Game.player.data.party.push(actorDS);
        this.initPlayerActor(Game.player.data.party.length - 1, isCreateActor);
        if (happenEvent) EventUtils.happen(this, this.EVENT_ADD_PLAYER_ACTOR, [Game.player.data.party.length - 1, actorDS]);
        return actorDS;
    }
    /**
     * 减少队伍成员
     * @param inPartyIndex 队伍成员所在的位置
     * @param happenEvent [可选] 默认值=true 是否派发相关事件
     * @return [DataStructure_inPartyActor] 
     */
    static removePlayerActorByActorID(actorID: number, happenEvent: boolean = true): DataStructure_inPartyActor {
        var inPartyIndex = ProjectPlayer.getPlayerActorFirstPositionByActorID(actorID);
        if (inPartyIndex != -1) {
            return ProjectPlayer.removePlayerActorByInPartyIndex(inPartyIndex, happenEvent);
        }
    }
    /**
     * 减少队伍成员
     * @param inPartyIndex 队伍成员所在的位置
     * @param happenEvent [可选] 默认值=true 是否派发相关事件
     * @return [DataStructure_inPartyActor] 
     */
    static removePlayerActorByInPartyIndex(inPartyIndex: number, happenEvent: boolean = true): DataStructure_inPartyActor {
        if (inPartyIndex >= Game.player.data.party.length || inPartyIndex < 0) return null;
        var actorDS = Game.player.data.party.splice(inPartyIndex, 1)[0]
        if (happenEvent) EventUtils.happen(this, this.EVENT_REMOVE_PLAYER_ACTOR, [inPartyIndex, actorDS]);
        return actorDS;
    }
    //------------------------------------------------------------------------------------------------------
    // 角色的技能
    //------------------------------------------------------------------------------------------------------
    /**
     * 获取玩家角色的技能：根据技能编号
     * @param inPartyIndex 所在队伍的位置
     * @param skillID 技能编号
     * @return [Module_Skill] 
     */
    static getPlayerActorSkillBySkillID(inPartyIndex: number, skillID: number): Module_Skill {
        var actorDS = this.getPlayerActorDSByActorID(inPartyIndex);
        if (actorDS) return ArrayUtils.matchAttributes(actorDS.actor.skills, { id: skillID }, true)[0];
    }
    /**
     * 学习技能
     * @param inPartyIndex 该角色所在队伍的编号
     * @param skillID 技能编号
     * @param happenEvent [可选] 默认值=true 是否派发相关事件
     * @return [boolean] 
     */
    static learnSkillBySkillID(inPartyIndex: number, skillID: number, happenEvent: boolean = true): Module_Skill {
        var actorDS: DataStructure_inPartyActor = ProjectPlayer.getPlayerActorDSByInPartyIndex(inPartyIndex);
        if (!actorDS) return;
        var newSkill = Game.actorLearnSkill(actorDS.actor, skillID);
        if (newSkill && happenEvent) EventUtils.happen(this, this.EVENT_LEARN_PLAYER_ACTOR_SKILL, [inPartyIndex, actorDS, newSkill]);
        return newSkill;
    }
    /**
     * 忘记技能
     * @param inPartyIndex 该角色所在队伍的编号
     * @param skillID 技能编号
     * @param happenEvent [可选] 默认值=true 是否派发相关事件
     * @return [boolean] 
     */
    static forgetSkillBySkillID(inPartyIndex: number, skillID: number, happenEvent: boolean = true) {
        var actorDS: DataStructure_inPartyActor = ProjectPlayer.getPlayerActorDSByInPartyIndex(inPartyIndex);
        if (!actorDS) return;
        var forgetSkill = Game.actorForgetSkill(actorDS.actor, skillID);
        if (forgetSkill && happenEvent) EventUtils.happen(this, this.EVENT_FORGET_PLAYER_ACTOR_SKILL, [inPartyIndex, actorDS, forgetSkill]);
        return forgetSkill;
    }
    /**
     * 忘记全部技能
     * @param inPartyIndex 该角色所在队伍的编号
     * @param happenEvent [可选] 默认值=true 是否派发相关事件
     * @return [Module_Skill] 忘记的技能集合
     */
    static forgetAllSkills(inPartyIndex: number, happenEvent: boolean = true): Module_Skill[] {
        var actorDS: DataStructure_inPartyActor = ProjectPlayer.getPlayerActorDSByInPartyIndex(inPartyIndex);
        if (!actorDS) return;
        var forgetSkills = actorDS.actor.skills.concat();
        for (var i = 0; i < forgetSkills.length; i++) {
            if (happenEvent) EventUtils.happen(this, this.EVENT_FORGET_PLAYER_ACTOR_SKILL, [inPartyIndex, actorDS, forgetSkills[i]]);
        }
        Game.actorForgetAllSkills(actorDS.actor, happenEvent);
        return forgetSkills;
    }
    //------------------------------------------------------------------------------------------------------
    // 角色的装备
    //------------------------------------------------------------------------------------------------------
    /**
     * 获取角色的装备：根据部位编号
     * @param inPartyIndex 该角色所在队伍的索引
     * @param partID 部位ID
     * @return [Module_Equip] 
     */
    static getPlayerActorEquipByPartID(inPartyIndex: number, partID: number): Module_Equip {
        var actorDS = this.getPlayerActorDSByInPartyIndex(inPartyIndex);
        if (actorDS) return Game.getActorEquipByPartID(actorDS.actor, partID);
    }
    /**
     * 佩戴角色装备：
     * -- 如果该部位已存在装备则会卸下至背包中
     * -- 新的装备必须已拥有（在背包中）
     * @param inPartyIndex 该角色所在队伍的索引
     * @param newEquip 新的装备
     * @param happenEvent [可选] 默认值=true 是否派发相关事件
     * @return success=是否更换成功 removeEquip=更换下来的装备
     */
    static wearPlayerActorEquip(inPartyIndex: number, newEquip: Module_Equip, happenEvent: boolean = true): { success: boolean, takeOffEquip: Module_Equip } {
        if (newEquip) {
            // -- 查找背包该装备
            var newEquipIndex = this.getEquipIndex(newEquip);
            if (newEquipIndex != null) {
                // -- 查找角色
                var actorDS = this.getPlayerActorDSByInPartyIndex(inPartyIndex);
                if (actorDS) {
                    // -- 卸载该部位上的装备
                    var takeOffEquip = this.takeOffPlayerActorEquipByPartID(inPartyIndex, newEquip.partID, happenEvent);
                    // -- 装上来自背包的装备
                    Game.wearActorEquip(actorDS.actor, newEquip);
                    // -- 背包该装备-1
                    this.removePackageItemByItemDS(Game.player.data.package[newEquipIndex], 1, happenEvent);
                    // -- 穿上装备事件
                    if (newEquip.eventSetting && newEquip.wearEvent) CommandPage.startTriggerFragmentEvent(newEquip.wearEvent, Game.player.sceneObject, Game.player.sceneObject);
                    // -- 派发事件
                    if (happenEvent) EventUtils.happen(ProjectPlayer, ProjectPlayer.EVENT_WEAR_PLAYER_ACTOR_EQUIP, [inPartyIndex, actorDS, takeOffEquip, newEquip]);
                    return { success: true, takeOffEquip: takeOffEquip };
                }
            }
        }
        return { success: false, takeOffEquip: null };
    }
    /**
     * 卸下装备:该装备将会放置回背包（如有）根据角色索引
     * @param inPartyIndex 该角色所在队伍的索引
     * @param partID 部位ID
     * @return [Module_Equip] 卸载出来的装备
     */
    static takeOffPlayerActorEquipByPartID(inPartyIndex: number, partID: number, happenEvent: boolean = true): Module_Equip {
        var actorDS = Game.player.data.party[inPartyIndex];
        if (!actorDS) return null;
        var takeOffEquip = Game.takeOffActorEquipByPartID(actorDS.actor, partID);
        if (takeOffEquip) {
            // 装备移入背包中
            this.addEquipByInstance(takeOffEquip, happenEvent);
            // 执行卸下装备的事件
            if (takeOffEquip.eventSetting && takeOffEquip.takeOffEvent) CommandPage.startTriggerFragmentEvent(takeOffEquip.takeOffEvent, Game.player.sceneObject, Game.player.sceneObject);
            if (happenEvent) EventUtils.happen(ProjectPlayer, ProjectPlayer.EVENT_TAKE_OFF_PLAYER_ACTOR_EQUIP, [inPartyIndex, actorDS, takeOffEquip]);
        }
        return takeOffEquip;
    }
    /**
     * 卸下全部装备:这些装备将会放置回背包（如有）根据角色索引
     * @param inPartyIndex 该角色所在队伍的索引
     * @return [Module_Equip] 卸载出来的装备
     */
    static takeOffPlayerActorAllEquips(inPartyIndex: number, happenEvent: boolean = true): Module_Equip[] {
        var actorDS = Game.player.data.party[inPartyIndex];
        if (!actorDS) return null;
        var takeOffEquips = Game.takeOffActorAllEquips(actorDS.actor);
        for (var i = 0; i < takeOffEquips.length; i++) {
            var takeOffEquip = takeOffEquips[i];
            this.addEquipByInstance(takeOffEquip, happenEvent);
            if (happenEvent) EventUtils.happen(ProjectPlayer, ProjectPlayer.EVENT_TAKE_OFF_PLAYER_ACTOR_EQUIP, [inPartyIndex, actorDS, takeOffEquip]);
        }
        return takeOffEquips;
    }
    //------------------------------------------------------------------------------------------------------
    // 角色的道具
    //------------------------------------------------------------------------------------------------------
    /**
     * 获取角色的道具，根据角色所在的索引
     * @param inPartyIndex 该角色所在队伍的索引
     * @param itemIndex 道具位置
     * @return [Module_Equip] 
     */
    static getPlayerActorItemByItemIndex(inPartyIndex: number, itemIndex: number): Module_Item {
        var actorDS = Game.player.data.party[inPartyIndex];
        if (!actorDS) return null;
        return Game.getActorItemByItemIndex(actorDS.actor, itemIndex);
    }
    /**
     * 携带玩家角色的道具
     * @param inPartyIndex 角色所在队伍编号
     * @param newItem 携带的道具实例
     * @param itemIndex 道具位置
     * @param happenEvent [可选] 默认值=true 是否派发相关事件
     * @return { success: boolean, removeItem: Module_Item }
     */
    static carryPlayerActorItemFromPakcage(inPartyIndex: number, newItem: Module_Item, itemIndex: number, happenEvent: boolean = true): { success: boolean, removeItem: Module_Item } {
        if (newItem) {
            // -- 查询背包该道具
            var newItemIndex = this.getItemIndex(newItem);
            if (newItemIndex != null) {
                // -- 查找角色
                var actorDS = Game.player.data.party[inPartyIndex];
                if (actorDS) {
                    // -- 卸载该位置上的道具
                    var removeItem = this.unPlayerActorItemByItemIndex(inPartyIndex, itemIndex, happenEvent);
                    // -- 装上来自背包的道具
                    Game.carryActorItem(actorDS.actor, newItem, itemIndex);
                    // -- 背包该道具-1
                    this.changeItemNumber(newItem.id, -1, false, happenEvent);
                    // -- 派发事件
                    if (happenEvent) EventUtils.happen(ProjectPlayer, ProjectPlayer.EVENT_CARRY_PLAYER_ACTOR_ITEM, [inPartyIndex, actorDS, itemIndex, removeItem, newItem]);
                    return { success: true, removeItem: removeItem };
                }
            }
        }
        return { success: false, removeItem: null };
    }
    /**
     * 卸下玩家角色的道具：根据道具位置
     * @param inPartyIndex 角色所在队伍编号
     * @param itemIndex 道具位置
     * @param happenEvent [可选] 默认值=true 是否派发相关事件
     * @return [Module_Item] 
     */
    static unPlayerActorItemByItemIndex(inPartyIndex: number, itemIndex: number, happenEvent: boolean = true): Module_Item {
        var actorDS = Game.player.data.party[inPartyIndex];
        if (!actorDS) return null;
        var item = Game.unActorItemByItemIndex(actorDS.actor, itemIndex);
        if (item) {
            // 道具移入背包中
            this.changeItemNumber(item.id, 1, false, happenEvent);
            if (happenEvent) EventUtils.happen(ProjectPlayer, ProjectPlayer.EVENT_REMOVE_PLAYER_ACTOR_ITEM, [inPartyIndex, actorDS, itemIndex, item]);
        }
        return item;
    }
    /**
     * 卸下玩家角色的全部道具
     * @param inPartyIndex 角色所在队伍编号
     * @param happenEvent [可选] 默认值=true 是否派发相关事件
     * @return [Module_Item] 卸下来的所有道具集合
     */
    static unPlayerActorAllItems(inPartyIndex: number, happenEvent: boolean = true): Module_Item[] {
        var actorDS = Game.player.data.party[inPartyIndex];
        if (!actorDS) return null;
        var arr = [];
        for (var i = 0; i < actorDS.actor.items.length; i++) {
            var unItem = this.unPlayerActorItemByItemIndex(inPartyIndex, i, happenEvent);
            if (unItem) arr.push(unItem);
        }
        return arr;
    }
    /**
     * 获取玩家角色的道具空位置
     * @param inPartyIndex 角色所在队伍编号
     * @return [number] 0~N null表示无
     */
    static getPlayerActorItemEmptyPostion(inPartyIndex: number): number {
        var actorDS = Game.player.data.party[inPartyIndex];
        if (!actorDS) return null;
        return Game.getPlayerActorItemEmptyPostion(actorDS.actor);
    }
    //------------------------------------------------------------------------------------------------------
    // 
    //------------------------------------------------------------------------------------------------------
    /**
     * 增加经验值
     */
    static increaseExpByIndex(inPartyIndex: number, exp: number): { isLevelUp: boolean, fromLv: number, toLv: number, fromExp: number, toExp: number, learnSkills: Module_Skill[] } {
        let actorDS: DataStructure_inPartyActor = ProjectPlayer.getPlayerActorDSByInPartyIndex(inPartyIndex);
        let actor: Module_Actor = actorDS.actor;
        let classData: Module_Class = GameData.getModuleData(7, actor.class);
        if (!classData) return;
        // 已经最高级则不再允许增加经验值
        if (actorDS.lv >= actor.MaxLv) return;
        // 无法成长的角色
        if (!actor.growUpEnabled) return;
        let fromExp = actor.currentEXP;
        let fromLv = actorDS.lv;
        // 增加经验值
        actor.currentEXP += exp;
        // 升级判定
        let isLevelUp = false;
        let learnSkills: Module_Skill[] = [];
        while (1) {
            if (actorDS.lv >= actor.MaxLv) break;
            let nextExp = Game.getLevelUpNeedExp(actor, actorDS.lv);
            if (actor.currentEXP >= nextExp) {
                actorDS.lv++;
                isLevelUp = true;
                actor.currentEXP -= nextExp;
                for (let i = 0; i < classData.lvUpAutoGetSkills.length; i++) {
                    let lvUpAutoGetSkill = classData.lvUpAutoGetSkills[i];
                    if (actorDS.lv >= lvUpAutoGetSkill.lv) {
                        let learnSkill = this.learnSkillBySkillID(inPartyIndex, lvUpAutoGetSkill.skill);
                        if (learnSkill) learnSkills.push(learnSkill);
                    }
                }
            }
            else {
                break;
            }
        }
        let toLv = actorDS.lv;
        let toExp = actor.currentEXP;
        EventUtils.happen(ProjectPlayer, ProjectPlayer.EVENT_PLAYER_ACTOR_CHANGE_EXP, [inPartyIndex, exp]);
        // 升级时处理
        if (isLevelUp) {
            if (actor.levelUpEvent) CommandPage.startTriggerFragmentEvent(actor.levelUpEvent, Game.player.sceneObject, Game.player.sceneObject);
            let actorClass: Module_Class = GameData.getModuleData(7, actor.class);
            if (actorClass && actorClass.levelUpEvent) CommandPage.startTriggerFragmentEvent(actorClass.levelUpEvent, Game.player.sceneObject, Game.player.sceneObject);
            EventUtils.happen(ProjectPlayer, ProjectPlayer.EVENT_PLAYER_ACTOR_CHANGE_LEVEL, [inPartyIndex, toLv]);
        }
        return { isLevelUp: isLevelUp, fromLv: fromLv, toLv: toLv, fromExp: fromExp, toExp: toExp, learnSkills: learnSkills };
    }
    /**
     * 直接增加玩家角色等级，不改变当前经验值。
     * 用于关卡结算等固定等级奖励；会沿用正常升级的技能、属性和事件处理。
     */
    static increaseLevelByIndex(inPartyIndex: number, levels: number = 1): { isLevelUp: boolean, fromLv: number, toLv: number } {
        let actorDS: DataStructure_inPartyActor = this.getPlayerActorDSByInPartyIndex(inPartyIndex);
        if (!actorDS || !actorDS.actor || levels <= 0) {
            let currentLv = actorDS && actorDS.lv ? actorDS.lv : 0;
            return { isLevelUp: false, fromLv: currentLv, toLv: currentLv };
        }
        let actor = actorDS.actor;
        let fromLv = actorDS.lv || 1;
        let toLv = fromLv + Math.max(0, Math.floor(levels));
        if (typeof actor.MaxLv === "number") toLv = Math.min(toLv, actor.MaxLv);
        if (toLv <= fromLv) return { isLevelUp: false, fromLv: fromLv, toLv: fromLv };
        actorDS.lv = toLv;
        // Refresh derived attributes and fill any class skills unlocked by the
        // new level, while preserving the current HP/SP at node settlement.
        this.initPlayerActor(inPartyIndex, false);
        EventUtils.happen(ProjectPlayer, ProjectPlayer.EVENT_PLAYER_ACTOR_CHANGE_LEVEL, [inPartyIndex, toLv]);
        if (actor.levelUpEvent) CommandPage.startTriggerFragmentEvent(actor.levelUpEvent, Game.player.sceneObject, Game.player.sceneObject);
        let actorClass: Module_Class = GameData.getModuleData(7, actor.class);
        if (actorClass && actorClass.levelUpEvent) CommandPage.startTriggerFragmentEvent(actorClass.levelUpEvent, Game.player.sceneObject, Game.player.sceneObject);
        return { isLevelUp: true, fromLv: fromLv, toLv: toLv };
    }
    //------------------------------------------------------------------------------------------------------
    // 内部实现
    //------------------------------------------------------------------------------------------------------
    /**
     * 改变背包中的道具数目（增减道具/装备）：根据指定的DS数据
     * @param itemDS 道具/装备DS格式数据
     * @param v 变更的数目
     * @param isEquip 是否装备
     * @param happenEvent [可选] 默认值=true 是否派发相关事件
     */
    private static removePackageItemByItemDS(itemDS: DataStructure_packageItem, v: number, happenEvent: boolean = true): void {
        var inPackageIdx = Game.player.data.package.indexOf(itemDS);
        if (inPackageIdx == -1) return;
        itemDS.number -= v;
        if (itemDS.number <= 0) Game.player.data.package.splice(inPackageIdx, 1);
        if (happenEvent) EventUtils.happen(ProjectPlayer, ProjectPlayer.EVENT_CHANGE_ITEM_NUMBER);
    }

}
