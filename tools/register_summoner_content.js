const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const moduleRoot = path.join(projectRoot, "asset/json/custom/customModule");

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
    fs.writeFileSync(filePath, `${JSON.stringify(data, null, 4)}\n`, "utf8");
}

function setValue(data, key, value) {
    if (!data.attrs[key]) throw new Error(`Missing attribute: ${key}`);
    data.attrs[key].value = value;
}

function levelSkill(level, skill) {
    return {
        lv: { varType: 0, value: level, copy: false },
        skill: { varType: 0, value: skill, copy: false }
    };
}

function growth(initialValue, targetValue) {
    const initialPercent = targetValue > 0 ? initialValue * 100 / targetValue : 0;
    return `[[0,0,${initialPercent},99,${targetValue},0,0,0],[0,100,100]]`;
}

function diamondRange(radius) {
    const size = radius * 2 + 1;
    const gridData = Array.from({ length: size }, (_, y) =>
        Array.from({ length: size }, (_, x) => {
            const distance = Math.abs(x - radius) + Math.abs(y - radius);
            return distance > 0 && distance <= radius ? 1 : 0;
        })
    );
    return { mode: 0, size, gridData };
}

function createSummonSkill({ id, name, creatureName, creatureId, icon, intro, sp, cooldown, radius }) {
    const sourcePath = path.join(moduleRoot, "8/cm17.json");
    const skill = readJson(sourcePath);
    skill.id = id;
    setValue(skill, "icon", icon);
    setValue(skill, "intro", intro);
    setValue(skill, "releaseRange", diamondRange(radius));
    setValue(skill, "totalCD", cooldown);
    setValue(skill, "costSP", sp);
    setValue(skill, "costActionPower", true);

    let eventData = skill.attrs.hitOpenSpaceEvent.value;
    eventData = eventData.replaceAll("蘑菇精", creatureName);
    eventData = eventData.replaceAll('"55576042947_0.6316065968532683":1011', `"55576042947_0.6316065968532683":${creatureId}`);
    setValue(skill, "hitOpenSpaceEvent", eventData);
    writeJson(path.join(moduleRoot, `8/cm${id}.json`), skill);
    return name;
}

function updateBaseSummonSkill() {
    const skillPath = path.join(moduleRoot, "8/cm17.json");
    const skill = readJson(skillPath);
    setValue(skill, "intro", "【立即】召唤一只蘑菇精为你作战。场上仅可存在一只，战败后可再次召唤。");
    writeJson(skillPath, skill);
}

function createBlessingSkill() {
    const skill = readJson(path.join(moduleRoot, "8/cm33.json"));
    skill.id = 38;
    setValue(skill, "icon", "asset/image/picture/icon/skill/Summoner_blessing.png");
    setValue(skill, "intro", "以灵契祝福全体队友，回复 ${Math.floor(a.MAG*s.additionMultiple*0.01+s.damageValue)} 点生命，并施加持续恢复与魔力恢复状态。");
    setValue(skill, "totalCD", 4);
    setValue(skill, "costSP", 70);
    setValue(skill, "costActionPower", true);
    setValue(skill, "damageValue", 30);
    setValue(skill, "additionMultiple", 75);
    setValue(skill, "addStatus", [7, 21]);
    writeJson(path.join(moduleRoot, "8/cm38.json"), skill);
}

function skillEntry(skillId) {
    const skill = readJson(path.join(moduleRoot, `8/cm${skillId}.json`));
    return { id: skillId, data: skill.attrs };
}

function createAdaptationSkill() {
    const skill = readJson(path.join(moduleRoot, "8/cm3012.json"));
    skill.id = 3013;
    setValue(skill, "icon", "asset/image/picture/icon/skill/Summoner_mahoraga.png");
    setValue(skill, "intro", "轮盘持续适应战局：获得持续恢复，并免疫眩晕、冰结与催眠。");
    setValue(skill, "passiveStatus", true);
    setValue(skill, "specialAbility", false);
    setValue(skill, "selfStatus", [7]);
    setValue(skill, "selfImmuneStatus", [2, 4, 5]);
    setValue(skill, "specialBattleEffect", []);
    writeJson(path.join(moduleRoot, "8/cm3013.json"), skill);
}

function createMahoragaActor() {
    const actor = readJson(path.join(moduleRoot, "6/cm2003.json"));
    actor.id = 1012;
    setValue(actor, "face", "asset/image/picture/face/mahoraga/Mahoraga_face.png");
    setValue(actor, "avatar", 79);
    setValue(actor, "class", 1);
    setValue(actor, "growUpEnabled", false);
    setValue(actor, "moveSpeed", 250);
    setValue(actor, "MoveGrid", 5);
    setValue(actor, "MaxHP", 750);
    setValue(actor, "MaxSP", 180);
    setValue(actor, "ATK", 115);
    setValue(actor, "DEF", 50);
    setValue(actor, "MAG", 30);
    setValue(actor, "MagDef", 40);
    setValue(actor, "HIT", 110);
    setValue(actor, "DOD", 5);
    setValue(actor, "CRIT", 10);
    setValue(actor, "MagCrit", 0);
    setValue(actor, "skills", [skillEntry(3002), skillEntry(1003), skillEntry(3013)]);
    writeJson(path.join(moduleRoot, "6/cm1012.json"), actor);
}

function registerMahoragaAvatar() {
    const avatarRoot = path.join(projectRoot, "asset/json/avatar");
    const avatar = readJson(path.join(avatarRoot, "data/avatar72.json"));
    avatar.id = 79;
    avatar.picUrls = [
        "asset/image/avatar/character/mahoraga/Mahoraga_standby.png",
        "asset/image/avatar/character/mahoraga/Mahoraga_walk.png"
    ];
    const standbyTemplate = avatar.actionListArr[0].frameImageInfo[0][0];
    const walkTemplate = avatar.actionListArr[1].frameImageInfo[0][0];
    function avatarFrame(template, picUrlIndex, frameX, directionY) {
        const frame = JSON.parse(JSON.stringify(template));
        frame.picUrlIndex = picUrlIndex;
        frame.rect = [-frameX * 96, -directionY * 192, 96, 192];
        frame.x = -48;
        frame.y = -176;
        frame.width = 96;
        frame.height = 192;
        return frame;
    }
    avatar.actionListArr[0].frameImageInfo = Array.from({ length: 4 }, (_, direction) => [
        avatarFrame(standbyTemplate, 0, 0, direction)
    ]);
    avatar.actionListArr[1].frameImageInfo = Array.from({ length: 4 }, (_, direction) =>
        Array.from({ length: 4 }, (_, frame) => avatarFrame(walkTemplate, 1, frame, direction))
    );
    writeJson(path.join(avatarRoot, "data/avatar79.json"), avatar);

    const avatarListPath = path.join(avatarRoot, "avatarList.json");
    const avatarList = readJson(avatarListPath);
    avatarList.list["1"][79] = "魔虚罗";
    const avatarChildren = avatarList.typeTreeNode.children;
    if (!avatarChildren.some(item => item.id === 79)) avatarChildren.push({ id: 79, name: "魔虚罗", children: [] });
    writeJson(avatarListPath, avatarList);
}

function registerMahoragaActor() {
    const actorListPath = path.join(moduleRoot, "customModuleDataList6.json");
    const actorList = readJson(actorListPath);
    actorList.list["2"][12] = "魔虚罗";
    const actorChildren = actorList.typeTreeNode.children;
    if (!actorChildren.some(item => item.id === 1012)) actorChildren.push({ id: 1012, name: "魔虚罗", children: [] });
    writeJson(actorListPath, actorList);
}

function createSummonerClass() {
    const summoner = readJson(path.join(moduleRoot, "7/cm3.json"));
    summoner.id = 7;
    setValue(summoner, "lvUpAutoGetSkills", [
        levelSkill(2, 35),
        levelSkill(4, 36),
        levelSkill(6, 37),
        levelSkill(8, 38),
        levelSkill(10, 39)
    ]);
    setValue(summoner, "icon", "asset/image/picture/control/icon_occupation_summoner.png");
    setValue(summoner, "equipSetting", [2, 4, 5, 6, 7, 8, 9]);
    setValue(summoner, "MaxHPGrow", growth(120, 680));
    setValue(summoner, "MaxSPGrow", growth(260, 1100));
    setValue(summoner, "ATKGrow", growth(12, 90));
    setValue(summoner, "DEFGrow", growth(8, 70));
    setValue(summoner, "MAGGrow", growth(28, 180));
    setValue(summoner, "MAGDEFGrow", growth(18, 120));
    setValue(summoner, "DODGrow", growth(4, 12));
    writeJson(path.join(moduleRoot, "7/cm7.json"), summoner);
}

function registerNames() {
    const classListPath = path.join(moduleRoot, "customModuleDataList7.json");
    const classList = readJson(classListPath);
    classList.list["1"][7] = "召唤师";
    writeJson(classListPath, classList);

    const skillListPath = path.join(moduleRoot, "customModuleDataList8.json");
    const skillList = readJson(skillListPath);
    const playerSkills = skillList.list["1"];
    playerSkills[35] = "灵契召唤·蘑菇精";
    playerSkills[36] = "灵契召唤·花妖精";
    playerSkills[37] = "灵契召唤·树妖精";
    playerSkills[38] = "群灵祝福";
    playerSkills[39] = "灵契召唤·魔虚罗";
    skillList.list["4"][13] = "轮转适应";
    writeJson(skillListPath, skillList);
}

updateBaseSummonSkill();
createSummonSkill({
    id: 35,
    name: "灵契召唤·蘑菇精",
    creatureName: "蘑菇精",
    creatureId: 1011,
    icon: "asset/image/picture/icon/skill/Summoner_mushroom.png",
    intro: "在两格内的空地召唤蘑菇精协助作战。蘑菇精擅长近身攻击。场上仅可存在一只，战败后可再次召唤。",
    sp: 45,
    cooldown: 2,
    radius: 2
});
createSummonSkill({
    id: 36,
    name: "灵契召唤·花妖精",
    creatureName: "花妖精",
    creatureId: 1009,
    icon: "asset/image/picture/icon/skill/Summoner_flower.png",
    intro: "在三格内的空地召唤花妖精协助作战。花妖精擅长水系范围攻击与束缚。场上仅可存在一只，战败后可再次召唤。",
    sp: 65,
    cooldown: 3,
    radius: 3
});
createSummonSkill({
    id: 37,
    name: "灵契召唤·树妖精",
    creatureName: "树妖精",
    creatureId: 1010,
    icon: "asset/image/picture/icon/skill/Summoner_tree.png",
    intro: "在两格内的空地召唤树妖精协助作战。树妖精擅长中毒与束缚控制。场上仅可存在一只，战败后可再次召唤。",
    sp: 85,
    cooldown: 4,
    radius: 2
});
createBlessingSkill();
createSummonSkill({
    id: 39,
    name: "灵契召唤·魔虚罗",
    creatureName: "魔虚罗",
    creatureId: 1012,
    icon: "asset/image/picture/icon/skill/Summoner_mahoraga.png",
    intro: "在两格内的空地召唤顶级式神魔虚罗。魔虚罗拥有近战反击、范围震地与轮转适应。场上仅可存在一只，战败后可再次召唤。",
    sp: 160,
    cooldown: 8,
    radius: 2
});
createAdaptationSkill();
registerMahoragaAvatar();
createMahoragaActor();
registerMahoragaActor();
createSummonerClass();
registerNames();
