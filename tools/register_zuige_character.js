const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const moduleRoot = path.join(root, "asset/json/custom/customModule");

const ACTOR_ID = 8;
const CLASS_ID = 8;
const WALK_ID = 91;
const BATTLER_ID = 11044;
const SKILL_IDS = [76, 77, 78, 79, 80, 81];
const STATUS_IDS = [43, 44, 45];
const NAME = "萧酉歌";

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

function setAttr(data, key, value) {
    if (!data.attrs[key]) throw new Error(`Missing attribute ${key} on module ${data.id}`);
    data.attrs[key].value = value;
}

function skillEntry(skillID) {
    const skill = readJSON(`asset/json/custom/customModule/8/cm${skillID}.json`);
    return { id: skillID, data: clone(skill.attrs) };
}

function configureSkill(templateID, id, values) {
    const skill = clone(readJSON(`asset/json/custom/customModule/8/cm${templateID}.json`));
    skill.id = id;
    for (const [key, value] of Object.entries(values)) setAttr(skill, key, value);
    writeJSON(`asset/json/custom/customModule/8/cm${id}.json`, skill);
    return skill;
}

function configureStatus(templateID, id, values) {
    const status = clone(readJSON(`asset/json/custom/customModule/10/cm${templateID}.json`));
    status.id = id;
    for (const [key, value] of Object.entries(values)) setAttr(status, key, value);
    writeJSON(`asset/json/custom/customModule/10/cm${id}.json`, status);
    return status;
}

function registerWalkingAvatar() {
    const avatar = clone(readJSON("asset/json/avatar/data/avatar90.json"));
    avatar.id = WALK_ID;
    avatar.picUrls = [
        "asset/image/avatar/character/zuige/Zuige_standby.png",
        "asset/image/avatar/character/zuige/Zuige_walk.png"
    ];
    for (const action of avatar.actionListArr) {
        for (const direction of action.frameImageInfo) {
            for (const frame of direction) frame.picUrlIndex = action === avatar.actionListArr[0] ? 0 : 1;
        }
    }
    writeJSON(`asset/json/avatar/data/avatar${WALK_ID}.json`, avatar);
}

function registerBattlerAvatar() {
    const avatar = clone(readJSON("asset/json/avatar/data/avatar11043.json"));
    avatar.id = BATTLER_ID;
    avatar.picUrls = [
        "asset/image/avatar/battler/zuige/Zuige_standby.png",
        "asset/image/avatar/battler/zuige/Zuige_attack.png",
        "asset/image/avatar/battler/zuige/Zuige_release.png",
        "asset/image/avatar/battler/zuige/Zuige_die.png",
        "asset/image/avatar/battler/zuige/Zuige_hit.png",
        "asset/image/avatar/battler/zuige/Zuige_defense.png"
    ];
    writeJSON(`asset/json/avatar/data/avatar${BATTLER_ID}.json`, avatar);
}

function registerAvatarLists() {
    const avatarList = readJSON("asset/json/avatar/avatarList.json");
    avatarList.list["1"][WALK_ID] = NAME;
    avatarList.list["12"][BATTLER_ID - 11000] = NAME;
    const tree = avatarList.typeTreeNode.children;
    if (!tree.some(item => item && item.id === WALK_ID)) tree.push({ id: WALK_ID, name: NAME, children: [] });
    const battlerTree = findEntryArray(tree, BATTLER_ID);
    if (battlerTree) battlerTree.name = NAME;
    else tree.push({ id: BATTLER_ID, name: NAME, children: [] });
    writeJSON("asset/json/avatar/avatarList.json", avatarList);
}

function findEntryArray(value, targetID) {
    if (Array.isArray(value)) {
        if (value.some(entry => entry && entry.id === targetID)) return value;
        for (const item of value) {
            const found = findEntryArray(item, targetID);
            if (found) return found;
        }
    }
    else if (value && typeof value === "object") {
        for (const key of Object.keys(value)) {
            const found = findEntryArray(value[key], targetID);
            if (found) return found;
        }
    }
    return null;
}

function registerStatuses() {
    configureStatus(26, 43, {
        icon: "asset/image/picture/icon/skill/Zuige_drink.png",
        intro: "酒势：每层攻击力提高6%，最多3层，持续至战斗结束。",
        totalDuration: 0,
        maxlayer: 3,
        atkPer: 106
    });
    configureStatus(34, 44, {
        icon: "asset/image/picture/icon/skill/Zuige_breaker.png",
        intro: "醉意：攻击力提高30%，防御力下降20%，移动力+1，持续2回合。",
        totalDuration: 2,
        maxlayer: 1,
        atkPer: 130,
        defPer: 80,
        magDefPer: 80,
        moveGrid: 1
    });
    configureStatus(38, 45, {
        icon: "asset/image/picture/icon/skill/Zuige_mist.png",
        intro: "踉跄：物理防御和魔法防御下降10%，移动力-1，持续1回合。",
        totalDuration: 1,
        defPer: 90,
        magDefPer: 90,
        moveGrid: -1
    });
    const list = readJSON("asset/json/custom/customModule/customModuleDataList10.json");
    list.list["1"][43] = "酒势";
    list.list["1"][44] = "醉意";
    list.list["1"][45] = "踉跄";
    writeJSON("asset/json/custom/customModule/customModuleDataList10.json", list);
}

function registerSkills() {
    configureSkill(24, 76, {
        icon: "asset/image/picture/icon/skill/Zuige_drink.png",
        intro: "饮下一口自酿烈酒，获得1层酒势。酒势每层提高攻击力，最多3层。",
        targetType: 0,
        effectRange1: 0,
        totalCD: 2,
        costSP: 12,
        costActionPower: true,
        releaseFrame: 3,
        statusSetting: true,
        useDamage: false,
        addStatus: [43]
    });
    configureSkill(18, 77, {
        icon: "asset/image/picture/icon/skill/Zuige_combo.png",
        intro: "以醉拳连打敌方单体，造成 ${Math.floor(a.ATK*s.additionMultiple*0.01+s.damageValue)} 物理伤害，并使其踉跄。",
        targetType: 2,
        effectRange1: 1,
        totalCD: 1,
        costSP: 8,
        releaseFrame: 4,
        damageType: 0,
        damageValue: 12,
        additionMultiple: 135,
        statusSetting: true,
        addStatus: [45]
    });
    configureSkill(25, 78, {
        icon: "asset/image/picture/icon/skill/Zuige_step.png",
        intro: "借力摆步，获得移动力+1与回避率+10%，持续2回合。",
        targetType: 0,
        effectRange1: 0,
        totalCD: 2,
        costSP: 14,
        costActionPower: true,
        releaseFrame: 3,
        statusSetting: true,
        useDamage: false,
        addStatus: [42]
    });
    configureSkill(68, 79, {
        icon: "asset/image/picture/icon/skill/Zuige_mist.png",
        intro: "旋壶泼酒并扫腿，对自身周围敌人造成 ${Math.floor(a.ATK*s.additionMultiple*0.01+s.damageValue)} 物理伤害，击退1格并使其踉跄。",
        targetType: 6,
        effectRange1: 0,
        totalCD: 3,
        costSP: 24,
        releaseFrame: 5,
        damageType: 0,
        damageValue: 18,
        additionMultiple: 105,
        statusSetting: true,
        addStatus: [45],
        forceMoveMode: 1,
        forceMoveDistance: 1
    });
    configureSkill(24, 80, {
        icon: "asset/image/picture/icon/skill/Zuige_breaker.png",
        intro: "进入醉意爆发姿态，攻击力提高30%、防御力下降20%、移动力+1，持续2回合；酒势越高，后续攻击越强。",
        targetType: 0,
        effectRange1: 0,
        totalCD: 3,
        costSP: 28,
        costActionPower: true,
        releaseFrame: 3,
        statusSetting: true,
        useDamage: false,
        addStatus: [44]
    });
    configureSkill(63, 81, {
        icon: "asset/image/picture/icon/skill/Zuige_mastery.png",
        intro: "【被动】普通攻击命中时获得1层酒势；酒势最多3层并持续至战斗结束。",
        skillType: 2,
        targetType: 0,
        passiveStatus: false,
        useDamage: false,
        statusSetting: false
    });
    const list = readJSON("asset/json/custom/customModule/customModuleDataList8.json");
    const names = ["引觞·入势", "醉拳·连环", "醉步·借力", "壶影·散酒", "醉意·爆发姿", "酩酊宗师"];
    for (let i = 0; i < names.length; i++) list.list["1"][76 + i] = names[i];
    writeJSON("asset/json/custom/customModule/customModuleDataList8.json", list);
}

function growth(initialValue, targetValue) {
    const initialPercent = targetValue > 0 ? initialValue * 100 / targetValue : 0;
    return `[[0,0,${initialPercent},99,${targetValue},0,0,0],[0,100,100]]`;
}

function registerClass() {
    const klass = clone(readJSON("asset/json/custom/customModule/7/cm6.json"));
    klass.id = CLASS_ID;
    setAttr(klass, "lvUpAutoGetSkills", [
        { lv: { varType: 0, value: 4, copy: false }, skill: { varType: 0, value: 78, copy: false } },
        { lv: { varType: 0, value: 6, copy: false }, skill: { varType: 0, value: 79, copy: false } },
        { lv: { varType: 0, value: 8, copy: false }, skill: { varType: 0, value: 80, copy: false } },
        { lv: { varType: 0, value: 10, copy: false }, skill: { varType: 0, value: 81, copy: false } }
    ]);
    setAttr(klass, "icon", "asset/image/picture/control/icon_occupation_8.png");
    setAttr(klass, "equipSetting", [1, 5, 6, 7, 8, 10, 11]);
    setAttr(klass, "MaxHPGrow", growth(210, 900));
    setAttr(klass, "MaxSPGrow", growth(120, 500));
    setAttr(klass, "ATKGrow", growth(42, 520));
    setAttr(klass, "DEFGrow", growth(20, 300));
    setAttr(klass, "MAGGrow", growth(0, 0));
    setAttr(klass, "MAGDEFGrow", growth(12, 180));
    setAttr(klass, "DODGrow", growth(8, 25));
    setAttr(klass, "hitTargetSelfAddStatus", [43]);
    writeJSON(`asset/json/custom/customModule/7/cm${CLASS_ID}.json`, klass);

    const list = readJSON("asset/json/custom/customModule/customModuleDataList7.json");
    list.list["1"][CLASS_ID] = "醉拳家";
    writeJSON("asset/json/custom/customModule/customModuleDataList7.json", list);
}

function registerActor() {
    const actor = clone(readJSON("asset/json/custom/customModule/6/cm6.json"));
    actor.id = ACTOR_ID;
    setAttr(actor, "face", "asset/image/picture/face/zuige/Zuige_normal.png");
    setAttr(actor, "avatar", WALK_ID);
    setAttr(actor, "battlerAvatar", BATTLER_ID);
    setAttr(actor, "class", CLASS_ID);
    setAttr(actor, "moveSpeed", 260);
    setAttr(actor, "MoveGrid", 6);
    setAttr(actor, "MaxHP", 210);
    setAttr(actor, "MaxSP", 120);
    setAttr(actor, "ATK", 42);
    setAttr(actor, "DEF", 20);
    setAttr(actor, "MAG", 0);
    setAttr(actor, "MagDef", 12);
    setAttr(actor, "HIT", 100);
    setAttr(actor, "DOD", 8);
    setAttr(actor, "CRIT", 10);
    setAttr(actor, "increaseCRIT", 10);
    setAttr(actor, "MaxLv", 100);
    setAttr(actor, "initAttrs", { __characterBaseBalanceV1: true });
    setAttr(actor, "isMelee", true);
    setAttr(actor, "skills", [skillEntry(76), skillEntry(77), skillEntry(81), skillEntry(3002)]);
    setAttr(actor, "hitTargetSelfAddStatus", [43]);
    writeJSON(`asset/json/custom/customModule/6/cm${ACTOR_ID}.json`, actor);

    const list = readJSON("asset/json/custom/customModule/customModuleDataList6.json");
    list.list["1"][ACTOR_ID] = NAME;
    const tree = list.typeTreeNode.children;
    if (!tree.some(item => item && item.id === ACTOR_ID)) tree.push({ id: ACTOR_ID, name: NAME, children: [] });
    writeJSON("asset/json/custom/customModule/customModuleDataList6.json", list);
}

registerStatuses();
registerSkills();
registerClass();
registerActor();
registerWalkingAvatar();
registerBattlerAvatar();
registerAvatarLists();
console.log(`Registered ${NAME}: actor ${ACTOR_ID}, class ${CLASS_ID}, walk ${WALK_ID}, battler ${BATTLER_ID}, skills ${SKILL_IDS.join(",")}, statuses ${STATUS_IDS.join(",")}`);
