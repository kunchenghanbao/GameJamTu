/**
 * #1 道具
 */
class Module_Item {
    id: number;
    name: string;
    icon: string; // = ""; 图标
    intro: string; // = "";
    sell: number; // = 0; 商店售价
    isUse: boolean; // = false; 可使用
    sellEnabled: boolean; // = false; 允许出售给商店
    isConsumables: boolean; // = false; 消耗品
    se: string; // = ""; 非战斗时音效
    callEvent: string; // = ""; 使用后执行的事件
    useType: number; // = 0; 使用的场合
    isSingleTarget: boolean; // = true; 指定单个目标
    releaseAnimation: number; // = 1; 释放动画
    recoveryHP: number; // = 0; 恢复生命值
    recoverySP: number; // = 0; 恢复魔法值
    costActionPower: boolean; // = true; 消耗行动力
    addStatus: number[]; // = [];
    removeStatus: number[]; // = [];
}
/**
 * #2 预留
 */
class Module_reserve2 {
    id: number;
    name: string;
}
/**
 * #3 预留
 */
class Module_reserve3 {
    id: number;
    name: string;
}
/**
 * #4 预留
 */
class Module_reserve4 {
    id: number;
    name: string;
}
/**
 * #5 预留
 */
class Module_reserve5 {
    id: number;
    name: string;
}
/**
 * #6 角色
 */
class Module_Actor {
    id: number;
    name: string;
    face: string; // = ""; 大头像
    class: number; // = 1; 职业
    growUpEnabled: boolean; // = false; 可成长角色
    dropEnabled: boolean; // = false; 死亡后掉落设定
    avatar: number; // = 0; 行走图
    moveSpeed: number; // = 250; 移动速度
    battlerAvatar: number; // = 0; 战斗图
    takeSetting: boolean; // = false; 初始携带设定
    aiSetting: boolean; // = false; 电脑控制设定
    eventSetting: boolean; // = false; 事件设定
    battlerAvatarStyleSetting: boolean; // = false; 战斗图样式
    flyUnit: boolean; // = false; 飞行单位
    targetType: number; // = 0;
    btAvatarScale: number; // = 1; 体型
    btAvatarHue: number; // = 0; 色相
    MoveGrid: number; // = 5; 移动力
    HIT: number; // = 100; 命中率
    DEF: number; // = 0; 防御力
    MAG: number; // = 0; 魔力
    MagDef: number; // = 0; 魔法防御力
    ATK: number; // = 0; 攻击力
    MaxHP: number; // = 100; 生命值
    MaxSP: number; // = 100; 魔法值
    DOD: number; // = 0; 回避
    CRIT: number; // = 0; 暴击率
    MagCrit: number; // = 0; 魔法暴击率
    isCustomAttribute: boolean; // = false; 扩展属性
    customAttributes: DataStructure_customAttribute[]; // = [];
    MaxLv: number; // = 100; 最大等级
    levelUpEvent: string; // = ""; 升级后执行的事件
    atkMode: number; // = 0; 普通攻击使用技能代替
    atkSkill: Module_Skill; // = 1; 攻击技能
    hitFrame: number; // = 1; 击中帧
    hitAnimation: number; // = 1; 击中动画
    isMelee: boolean; // = true; 是否近战
    isThroughObstacle: boolean; // = false; 穿透障碍
    skills: Module_Skill[]; // = [];
    equips: Module_Equip[]; // = [];
    items: Module_Item[]; // = [];
    aiType: number; // = 0; 行动类别
    aiVigilance: boolean; // = false; 警戒
    aiVigilanceRange: number; // = 10; 警戒范围
    aiGetTargetMode: number; // = 0; 获取目标的方式
    moveType: number; // = 0; 移动方式
    dropGold: number; // = 0; 掉落金币
    dropExp: number; // = 0; 掉落经验值
    dropEquips: DataStructure_dropEquip[]; // = [];
    dropItems: DataStructure_dropItem[]; // = [];
    useEvent: string; // = ""; 使用技能时事件
    releaseEvent: string; // = ""; 释放技能时事件
    hitEvent: string; // = ""; 击中目标事件
    dieEvent: string; // = ""; 死亡时事件
    moveEvent: string; // = ""; 移动时事件（持续）
    releaseAtkEvent: string; // = ""; 释放攻击时事件
    useAtkEvent: string; // = ""; 使用攻击时事件
    hitByEvent: string; // = ""; 被击中时事件
    passiveStatus: boolean; // = false; 被动状态
    specialAbility: boolean; // = false; 特殊能力
    selfStatus1: number[]; // = [];
    selfImmuneStatus1: number[]; // = [];
    hitTargetStatus1: number[]; // = [];
    hitTargetSelfAddStatus1: number[]; // = [];
    specialBattleEffect: DataStructure_specialBattleEffect[]; // = [];
    currentEXP: number; // = 0; 当前经验值
    increaseMaxHP: number; // = 0; 增加的最大生命值
    increaseMaxSP: number; // = 0; 增加的最大魔法值
    increaseATK: number; // = 0; 增加的攻击力
    increaseDEF: number; // = 0; 增加的防御力
    increaseMag: number; // = 0; 增加的魔力
    increaseMagDef: number; // = 0; 增加的魔法防御力
    increaseDod: number; // = 0; 增加的回避
    increaseCRIT: number; // = 0; 增加的暴击率
    increaseMagCrit: number; // = 0; 增加魔法暴击率
    increaseMoveGrid: number; // = 0; 增加行动速度
    increaseExtendAttributes: number[]; // = [];
    status: Module_Status[]; // = [];
    AI: boolean; // = false;
    AIRecord: number; // = 0;
    hp: number; // = 1;
    sp: number; // = 1;
    selfStatus: number[]; // = [];
    selfImmuneStatus: number[]; // = [];
    hitTargetStatus: number[]; // = [];
    hitTargetSelfAddStatus: number[]; // = [];
    initAttrs: any; // 记录初始属性
    extendAttributes: number[]; // = [];
}
/**
 * #7 职业
 */
class Module_Class {
    id: number;
    name: string;
    lvUpAutoGetSkills: DataStructure_levelUpLearnSkill[]; // = [];
    icon: string; // = ""; 职业图标
    levelUpEvent: string; // = ""; 升级后执行的事件
    equipSetting: number[]; // = [];
    needEXPGrow: string; // = ""; 经验值设定
    MaxHPGrow: string; // = ""; 生命值
    MaxSPGrow: string; // = ""; 魔法值
    ATKGrow: string; // = ""; 攻击力
    DEFGrow: string; // = ""; 防御力
    MAGGrow: string; // = ""; 魔力
    DODGrow: string; // = ""; 回避
    MAGDEFGrow: string; // = ""; 魔法防御力
    passiveStatus: boolean; // = false; 被动状态
    specialAbility: boolean; // = false; 特殊能力
    isCustomAttribute: boolean; // = false; 扩展属性
    selfStatus: number[]; // = [];
    selfImmuneStatus: number[]; // = [];
    hitTargetStatus: number[]; // = [];
    hitTargetSelfAddStatus: number[]; // = [];
    specialBattleEffect: DataStructure_specialBattleEffect[]; // = [];
    customAttributes: DataStructure_customAttributeGrow[]; // = [];
}
/**
 * #8 技能
 */
class Module_Skill {
    id: number;
    name: string;
    icon: string; // = ""; 技能图标
    intro: string; // = "";  
    skillType: number; // = 0; 类别
    targetType: number; // = 2; 目标类别
    effectRange1: number; // = 4; 作用范围
    effectRange2A: number; // = 1; 最小范围
    effectRange2B: number; // = 4; 最大范围
    effectRange3: { size: number, gridData: number[][] }; // 作用范围
    releaseRange: { size: number, gridData: number[][] }; // 释放范围
    totalCD: number; // = 1; 冷却回合
    costSP: number; // = 0; 消耗魔法值
    useDamage: boolean; // = false; 计算伤害
    releaseFrame: number; // = 1; 释放帧
    releaseActionID: number; // = 1; 释放动作
    effectRangeType: number; // = 0; 范围类别
    mustOpenSpace: boolean; // = false; 必须指定空地
    costActionPower: boolean; // = true; 消耗行动力
    useHate: boolean; // = false; 造成仇恨
    releaseTimes: number; // = 1; 连击次数
    isThroughObstacle: boolean; // = false; 穿透障碍
    costHP: number; // = 0; 消耗生命值
    hit: number; // = 100; 命中率
    hitType: number; // = 0; 命中率-类别
    dodType: number; // = 0; 计算目标的回避
    associationOrientation: boolean; // = false; 关联朝向
    bulletSpeed: number; // = 500; 弹幕速度
    bulletAnimation: number; // = 0; 弹幕对象
    damageType: number; // = 0; 伤害类型
    damageValue: number; // = 0; 数值
    additionMultiple: number; // = 100; 属性加成值
    useAddition: boolean; // = false; 属性加成
    additionMultipleType: number; // = 0; 加成类别
    elementType: number; // = 1; 元素类别
    fixedHeteValue: number; // = 0; 固定仇恨值
    damageHatePer: number; // = 100; + 按伤害数值比例增加仇恨
    releaseAnimation: number; // = 0; 释放动画
    hitAnimation: number; // = 0; 击中目标的动画
    keepHurtAction: boolean; // = false; 保持受伤动作
    waitReleaseAnimationOver: boolean; // = false; 等待释放动画结束
    autoFlip: boolean; // = false; 自动水平翻转
    targetGridAnimation: number; // = 0; 目标地的动画
    targetGridAniLayer: number; // = 0; 目标地动画层次
    passiveAttribute: boolean; // = false; 被动属性
    passiveStatus: boolean; // = false; 被动状态
    specialAbility: boolean; // = false; 特殊能力
    statusSetting: boolean; // = false; 状态变更
    eventSetting: boolean; // = false; 事件设定
    isCustomAttribute: boolean; // = false; 扩展属性
    moveGrid: number; // = 0; 移动力
    maxHP: number; // = 0;
    maxSP: number; // = 0;
    atk: number; // = 0; 攻击力
    def: number; // = 0; 防御力
    mag: number; // = 0; 魔力
    magDef: number; // = 0; 魔法防御力
    hit1: number; // = 0; 命中率变更
    dod: number; // = 0; 回避
    crit: number; // = 0; 暴击率变更
    magCrit: number; // = 0; 魔法暴击率变更
    selfStatus: number[]; // = [];
    selfImmuneStatus: number[]; // = [];
    hitTargetStatus: number[]; // = [];
    hitTargetSelfAddStatus: number[]; // = [];
    forceMoveMode: number; // = 0; 强制位移
    forceMoveDistance: number; // = 0; 位移格数
    forceMoveCollisionDamage: number; // = 0; 受阻伤害/格
    specialBattleEffect: DataStructure_specialBattleEffect[]; // = [];
    customAttributes: DataStructure_customAttribute[]; // = [];
    addStatus: number[]; // = [];
    removeStatus: number[]; // = [];
    useEvent: string; // = ""; 使用技能时事件
    hitEvent: string; // = ""; 击中目标时事件
    hitOpenSpaceEvent: string; // = ""; 击中地面的事件
    releaseEvent: string; // = ""; 释放技能时事件
    currentCD: number; // = 0;
}
/**
 * #9 装备
 */
class Module_Equip {
    id: number;
    name: string;
    icon: string; // = ""; 装备图标
    intro: string; // = "";  
    sell: number; // = 0; 商店售价
    sellEnabled: boolean; // = true; 允许出售
    partID: number; // = 1; 部位
    type: number; // = 1; 类别
    quality: number; // = 2; 品质
    moveGrid: number; // = 0; 移动力
    maxHP: number; // = 0;
    maxSP: number; // = 0;
    atk: number; // = 0; 攻击力
    def: number; // = 0; 防御力
    mag: number; // = 0; 魔力
    magDef: number; // = 0; 魔法防御力
    hit: number; // = 0; 命中率变更
    dod: number; // = 0; 回避
    crit: number; // = 0; 暴击率变更
    magCrit: number; // = 0; 魔法暴击率变更
    isCustomAttribute: boolean; // = false; 扩展属性
    customAttributes: DataStructure_customAttribute[]; // = [];
    passiveStatus: boolean; // = false; 被动状态
    eventSetting: boolean; // = false; 事件设定
    specialAbility: boolean; // = false; 特殊能力
    wearEvent: string; // = ""; 佩戴时事件
    takeOffEvent: string; // = ""; 卸下时事件
    selfStatus: number[]; // = [];
    selfImmuneStatus: number[]; // = [];
    hitTargetStatus: number[]; // = [];
    hitTargetSelfAddStatus: number[]; // = [];
    specialBattleEffect: DataStructure_specialBattleEffect[]; // = [];
}
/**
 * #10 状态
 */
class Module_Status {
    id: number;
    name: string;
    icon: string; // = ""; 图标
    intro: string; // = "";
    totalDuration: number; // = 1; 持续回合
    overtime: boolean; // = false; DOT/HOT
    statusHit: number; // = 100; 命中率%
    cantMove: boolean; // = false; 无法移动
    cantAtk: boolean; // = false; 无法攻击
    cantUseSkill: boolean; // = false; 无法使用技能
    cantUseItem: boolean; // = false; 无法使用道具
    removeWhenInjured: boolean; // = false; 受伤时解除
    maxlayer: number; // = 1; 最大叠加层
    removePer: number; // = 100; 解除概率%
    animation: number; // = 1; 状态自动动画
    turnInterval: number; // = 1; 回合间隔
    damageType: number; // = 0; 伤害类别
    damageValue: number; // = 0; 数值
    additionMultiple: number; // = 100; 属性加成值
    useAddition: boolean; // = false; 属性加成
    additionMultipleType: number; // = 0; 加成类别
    whenOvertimeEvent: string; // = ""; 执行的事件
    fixedHeteValue: number; // = 0; 固定仇恨值
    damageHatePer: number; // = 0; + 按伤害数值比例增加仇恨
    elementType: number; // = 1; 元素类别
    maxHP: number; // = 0; maxHP
    maxSP: number; // = 0; maxSP
    atk: number; // = 0; 攻击力
    def: number; // = 0; 防御力
    mag: number; // = 0; 魔力
    magDef: number; // = 0; 魔法防御力
    hit: number; // = 0; 命中率
    moveGrid: number; // = 0; 移动力
    crit: number; // = 0; 暴击率变更
    magCrit: number; // = 0; 魔法暴击率
    maxHPPer: number; // = 100; maxHP%
    maxSPPer: number; // = 100; maxSP%
    atkPer: number; // = 100; 攻击力%
    defPer: number; // = 100; 防御力%
    magPer: number; // = 100; 魔力%
    magDefPer: number; // = 100; 魔法防御力%
    hitPer: number; // = 100; 命中率%
    moveGridPer: number; // = 100; 移动力%
    critPer: number; // = 100; 暴击率%
    magCritPer: number; // = 100; 魔法暴击率%
    isCustomAttribute: boolean; // = false; 扩展属性
    customAttributes: DataStructure_customAttribute[]; // = [];
    specialAbility: boolean; // = false; 特殊能力
    eventSetting: boolean; // = false; 事件设定
    whenAddEvent: string; // = ""; 拥有该状态时处理
    whenRemoveEvent: string; // = ""; 解除该状态时处理
    specialBattleEffect: DataStructure_specialBattleEffect[]; // = [];
    currentLayer: number; // = 1; 当前层
    fromBattlerID: number; // = 0; 来源的场景对象编号
    currentDuration: number; // = 0;
    addMaxHPUsed: boolean; // = false;
}
/**
 * #11 预留
 */
class Module_reserve11 {
    id: number;
    name: string;
}
/**
 * #12 预留
 */
class Module_reserve12 {
    id: number;
    name: string;
}
/**
 * #13 预留
 */
class Module_reserve13 {
    id: number;
    name: string;
}
/**
 * #14 属性
 */
class Module_Attribute {
    id: number;
    name: string;
}
/**
 * #15 预留
 */
class Module_reserve15 {
    id: number;
    name: string;
}
/**
 * #16 预留
 */
class Module_reserve16 {
    id: number;
    name: string;
}
/**
 * #17 元素类别
 */
class Module_elementType {
    id: number;
    name: string;
}
/**
 * #18 装备类别
 */
class Module_equipType {
    id: number;
    name: string;
}
/**
 * #19 装备部位
 */
class Module_equipParts {
    id: number;
    name: string;
}
/**
 * #20 装备品质
 */
class Module_equipQuality {
    id: number;
    name: string;
}
/**
 * #21 怪物图鉴
 */
class Module_怪物图鉴 {
    id: number;
    name: string;
    icon: string; // = ""; 图标
    intro: string; // = "";
    showPic: string; // = ""; 怪物图鉴-图片
}