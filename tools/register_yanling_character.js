const fs = require("fs");
const path = require("path");

// 岚绫：受《街头霸王 6》亚思敏的高速近身节奏启发的原创角色。
// 本脚本只登记角色/职业/技能/状态，不改新游戏初始队伍。
const root = path.resolve(__dirname, "..");
const ACTOR_ID = 9;
const CLASS_ID = 9;
const WALK_ID = 92;
const BATTLER_ID = 11045;
const SKILL_IDS = [82, 83, 84, 85, 86, 87];
const STATUS_IDS = [46, 47, 48, 49];
const NAME = "岚绫";

function readJSON(relativePath) {
    return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function writeJSON(relativePath, value) {
    const filePath = path.join(root, relativePath);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(value, null, 4) + "\n", "utf8");
}

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

// 自定义单体技能范围：以自身为中心，允许上下左右的直线格子，不包含自身。
function crossLineRange(length) {
    const size = length * 2 + 1;
    const center = length;
    const gridData = [];
    for (let x = 0; x < size; x++) {
        gridData[x] = [];
        for (let y = 0; y < size; y++) gridData[x][y] = 0;
    }
    for (let step = 1; step <= length; step++) {
        gridData[center + step][center] = 1;
        gridData[center - step][center] = 1;
        gridData[center][center + step] = 1;
        gridData[center][center - step] = 1;
    }
    return { mode: 0, size, gridData };
}

function registerAvatarAssets() {
    const avatarRoot = "asset/json/avatar/data";
    const avatarList = readJSON("asset/json/avatar/avatarList.json");
    const walking = clone(readJSON(`${avatarRoot}/avatar91.json`));
    walking.id = WALK_ID;
    walking.oriMode = 8;
    walking.picUrls = [
        "asset/image/avatar/character/yanling/Yanling_standby_8dir.png",
        "asset/image/avatar/character/yanling/Yanling_walk_8dir.png"
    ];
    writeJSON(`${avatarRoot}/avatar${WALK_ID}.json`, walking);

    const battler = clone(readJSON(`${avatarRoot}/avatar11044.json`));
    battler.id = BATTLER_ID;
    battler.picUrls = [
        "asset/image/avatar/battler/yanling/Yanling_standby.png",
        "asset/image/avatar/battler/yanling/Yanling_attack.png",
        "asset/image/avatar/battler/yanling/Yanling_release.png",
        "asset/image/avatar/battler/yanling/Yanling_die.png",
        "asset/image/avatar/battler/yanling/Yanling_hit.png",
        "asset/image/avatar/battler/yanling/Yanling_defense.png"
    ];
    writeJSON(`${avatarRoot}/avatar${BATTLER_ID}.json`, battler);

    const walkingNames = avatarList.list["1"];
    const battlerNames = avatarList.list["12"];
    if (!Array.isArray(walkingNames) || !Array.isArray(battlerNames)) {
        throw new Error("Avatar index lists are missing");
    }
    walkingNames[WALK_ID] = NAME;
    battlerNames[BATTLER_ID - 11000] = NAME;
    const walkingTree = findEntry(avatarList, WALK_ID);
    if (walkingTree) walkingTree.name = NAME;
    else avatarList.typeTreeNode.children.push({ id: WALK_ID, name: NAME, children: [] });
    const battlerTree = findEntry(avatarList, BATTLER_ID);
    if (battlerTree) battlerTree.name = NAME;
    else avatarList.typeTreeNode.children.push({ id: BATTLER_ID, name: NAME, children: [] });
    writeJSON("asset/json/avatar/avatarList.json", avatarList);
}

function findEntry(value, id) {
    if (Array.isArray(value)) {
        for (const entry of value) {
            if (entry && entry.id === id) return entry;
            const found = findEntry(entry, id);
            if (found) return found;
        }
    }
    else if (value && typeof value === "object") {
        for (const key of Object.keys(value)) {
            const found = findEntry(value[key], id);
            if (found) return found;
        }
    }
    return null;
}

function setAttr(data, key, value) {
    if (!data.attrs[key]) throw new Error(`Missing attribute ${key} on module ${data.id}: ${key}`);
    data.attrs[key].value = value;
}

function skillEntry(skillID) {
    const skill = readJSON(`asset/json/custom/customModule/8/cm${skillID}.json`);
    return { id: skillID, data: clone(skill.attrs) };
}

function configureSkill(templateID, id, values, allowMissing = []) {
    const skill = clone(readJSON(`asset/json/custom/customModule/8/cm${templateID}.json`));
    skill.id = id;
    for (const [key, value] of Object.entries(values)) {
        if (!skill.attrs[key] && allowMissing.indexOf(key) >= 0) {
            const varType = Array.isArray(value) ? 6 : typeof value === "boolean" ? 2 :
                typeof value === "string" ? 1 : value && typeof value === "object" ? 12 : 0;
            skill.attrs[key] = { varType, value: clone(value), copy: false };
        }
        setAttr(skill, key, value);
    }
    writeJSON(`asset/json/custom/customModule/8/cm${id}.json`, skill);
}

function configureStatus(templateID, id, values) {
    const status = clone(readJSON(`asset/json/custom/customModule/10/cm${templateID}.json`));
    status.id = id;
    for (const [key, value] of Object.entries(values)) setAttr(status, key, value);
    writeJSON(`asset/json/custom/customModule/10/cm${id}.json`, status);
}

function growth(initialValue, targetValue) {
    const initialPercent = targetValue > 0 ? initialValue * 100 / targetValue : 0;
    return `[[0,0,${initialPercent},99,${targetValue},0,0,0],[0,100,100]]`;
}

function registerStatuses() {
    configureStatus(38, 46, {
        icon: "asset/image/picture/icon/skill/Yanling_mark.png",
        intro: "锋印：物理防御和魔法防御下降5%，持续3回合。",
        totalDuration: 3,
        maxlayer: 1,
        defPer: 95,
        magDefPer: 95,
        moveGrid: 0
    });
    configureStatus(32, 47, {
        icon: "asset/image/picture/icon/skill/Yanling_footwork.png",
        intro: "折步：移动力+2，持续2回合。",
        totalDuration: 2,
        maxlayer: 1,
        moveGrid: 2,
        crit: 0
    });
    configureStatus(26, 48, {
        icon: "asset/image/picture/icon/skill/Yanling_ring.png",
        intro: "锋鸣：每层攻击力提高8%，最多3层，持续至战斗结束。",
        totalDuration: 0,
        maxlayer: 3,
        atkPer: 108
    });
    configureStatus(6, 49, {
        icon: "asset/image/picture/icon/skill/Yanling_bleed.png",
        intro: "流血：每回合受到6点物理伤害，持续1回合。",
        totalDuration: 1,
        overtime: true,
        maxlayer: 1,
        damageValue: 6,
        useAddition: false
    });
    const list = readJSON("asset/json/custom/customModule/customModuleDataList10.json");
    list.list["1"][46] = "锋印";
    list.list["1"][47] = "折步";
    list.list["1"][48] = "锋鸣";
    list.list["1"][49] = "流血";
    writeJSON("asset/json/custom/customModule/customModuleDataList10.json", list);
}

function registerSkills() {
    configureSkill(20, 82, {
        icon: "asset/image/picture/icon/skill/Yanling_probe.png",
        intro: "以短棍试探敌方单体，造成 ${Math.floor(a.ATK*s.additionMultiple*0.01+s.damageValue)} 物理伤害并施加锋印。",
        targetType: 2,
        effectRange1: 1,
        totalCD: 1,
        costSP: 6,
        releaseFrame: 4,
        damageType: 0,
        damageValue: 9,
        additionMultiple: 165,
        statusSetting: true,
        addStatus: [46]
    });
    configureSkill(25, 83, {
        icon: "asset/image/picture/icon/skill/Yanling_step.png",
        intro: "调整步法，获得移动力+2，持续2回合。友方不阻挡其路径，但落点不能重叠。",
        targetType: 0,
        effectRange1: 0,
        totalCD: 2,
        costSP: 10,
        costActionPower: true,
        releaseFrame: 2,
        useDamage: false,
        statusSetting: true,
        addStatus: [47]
    });
    configureSkill(20, 84, {
        icon: "asset/image/picture/icon/skill/Yanling_spin.png",
        intro: "用反曲短刃回旋攻击，造成 ${Math.floor(a.ATK*s.additionMultiple*0.01+s.damageValue)} 物理伤害并造成流血。",
        targetType: 2,
        effectRange1: 1,
        totalCD: 2,
        costSP: 14,
        releaseFrame: 4,
        damageType: 0,
        damageValue: 15,
        additionMultiple: 218,
        statusSetting: true,
        addStatus: [49]
    });
    configureSkill(26, 85, {
        icon: "asset/image/picture/icon/skill/Yanling_cross.png",
        intro: "从上下左右直线2格内突入至目标相邻格并连续打击，造成 ${Math.floor(a.ATK*s.additionMultiple*0.01+s.damageValue)} 物理伤害。",
        targetType: 2,
        effectRangeType: 2,
        effectRange3: crossLineRange(2),
        associationOrientation: false,
        totalCD: 3,
        costSP: 18,
        releaseFrame: 5,
        damageType: 0,
        damageValue: 12,
        additionMultiple: 188,
        useAddition: true,
        releaseTimes: 2,
        statusSetting: false
    }, ["associationOrientation"]);
    configureSkill(24, 86, {
        icon: "asset/image/picture/icon/skill/Yanling_phase.png",
        intro: "进入锋鸣姿态，攻击力提高18%，持续2回合；首次命中锋印目标后再获得1层锋鸣。",
        targetType: 0,
        effectRange1: 0,
        totalCD: 3,
        costSP: 22,
        costActionPower: true,
        releaseFrame: 3,
        useDamage: false,
        statusSetting: true,
        addStatus: [48]
    });
    configureSkill(65, 87, {
        icon: "asset/image/picture/icon/skill/Yanling_finisher.png",
        intro: "对上下左右直线3格内单体发动归刃终结，造成 ${Math.floor(a.ATK*s.additionMultiple*0.01+s.damageValue)} 物理伤害。",
        targetType: 2,
        effectRangeType: 2,
        effectRange3: crossLineRange(3),
        associationOrientation: false,
        totalCD: 3,
        costSP: 30,
        releaseFrame: 5,
        damageType: 0,
        damageValue: 27,
        additionMultiple: 278,
        statusSetting: false
    });
    const list = readJSON("asset/json/custom/customModule/customModuleDataList8.json");
    ["棱线·试探", "折步·让位", "卡刃·回旋", "交叉突入", "锋鸣·双相", "归刃·终点"].forEach((name, i) => {
        list.list["1"][SKILL_IDS[i]] = name;
    });
    writeJSON("asset/json/custom/customModule/customModuleDataList8.json", list);
}

function registerClass() {
    const klass = clone(readJSON("asset/json/custom/customModule/7/cm6.json"));
    klass.id = CLASS_ID;
    setAttr(klass, "lvUpAutoGetSkills", [
        { lv: { varType: 0, value: 4, copy: false }, skill: { varType: 0, value: 84, copy: false } },
        { lv: { varType: 0, value: 6, copy: false }, skill: { varType: 0, value: 85, copy: false } },
        { lv: { varType: 0, value: 8, copy: false }, skill: { varType: 0, value: 86, copy: false } },
        { lv: { varType: 0, value: 10, copy: false }, skill: { varType: 0, value: 87, copy: false } }
    ]);
    setAttr(klass, "icon", "asset/image/picture/control/icon_occupation_9.png");
    setAttr(klass, "equipSetting", [1, 5, 6, 7, 8, 10, 11]);
    setAttr(klass, "MaxHPGrow", growth(175, 760));
    setAttr(klass, "MaxSPGrow", growth(115, 430));
    setAttr(klass, "ATKGrow", growth(36, 500));
    setAttr(klass, "DEFGrow", growth(15, 230));
    setAttr(klass, "MAGGrow", growth(0, 0));
    setAttr(klass, "MAGDEFGrow", growth(13, 175));
    setAttr(klass, "DODGrow", growth(14, 28));
    writeJSON(`asset/json/custom/customModule/7/cm${CLASS_ID}.json`, klass);
    const list = readJSON("asset/json/custom/customModule/customModuleDataList7.json");
    list.list["1"][CLASS_ID] = "双刃行者";
    writeJSON("asset/json/custom/customModule/customModuleDataList7.json", list);
}

function registerActor() {
    const actor = clone(readJSON("asset/json/custom/customModule/6/cm6.json"));
    actor.id = ACTOR_ID;
    setAttr(actor, "face", "asset/image/picture/face/yanling/Yanling_normal.png");
    setAttr(actor, "avatar", WALK_ID);
    setAttr(actor, "battlerAvatar", BATTLER_ID);
    setAttr(actor, "class", CLASS_ID);
    setAttr(actor, "moveSpeed", 270);
    setAttr(actor, "MoveGrid", 6);
    setAttr(actor, "MaxHP", 175);
    setAttr(actor, "MaxSP", 115);
    setAttr(actor, "ATK", 36);
    setAttr(actor, "DEF", 15);
    setAttr(actor, "MAG", 0);
    setAttr(actor, "MagDef", 13);
    setAttr(actor, "HIT", 95);
    setAttr(actor, "DOD", 14);
    setAttr(actor, "CRIT", 16);
    setAttr(actor, "increaseCRIT", 16);
    setAttr(actor, "MaxLv", 100);
    setAttr(actor, "initAttrs", { __characterBaseBalanceV1: true });
    setAttr(actor, "isMelee", true);
    setAttr(actor, "skills", [skillEntry(82), skillEntry(83), skillEntry(87)]);
    // 当前引擎支持在命中后给施法者追加状态；作为被动“锋鸣”的首版落地。
    setAttr(actor, "hitTargetSelfAddStatus", [48]);
    writeJSON(`asset/json/custom/customModule/6/cm${ACTOR_ID}.json`, actor);

    const list = readJSON("asset/json/custom/customModule/customModuleDataList6.json");
    list.list["1"][ACTOR_ID] = NAME;
    const tree = list.typeTreeNode.children;
    const existing = tree.find(item => item && item.id === ACTOR_ID);
    if (existing) existing.name = NAME;
    else tree.push({ id: ACTOR_ID, name: NAME, children: [] });
    writeJSON("asset/json/custom/customModule/customModuleDataList6.json", list);
}

registerAvatarAssets();
registerStatuses();
registerSkills();
registerClass();
registerActor();
console.log(`Registered ${NAME}: actor ${ACTOR_ID}, class ${CLASS_ID}, skills ${SKILL_IDS.join(",")}, statuses ${STATUS_IDS.join(",")}`);
