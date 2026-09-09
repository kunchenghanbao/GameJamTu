const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const characters = [
    { actorID: 7, walkID: 90, battlerID: 11043, name: "艾露恩", folder: "elune", prefix: "Elune" },
    { actorID: 1012, walkID: 79, battlerID: 11032, name: "魔虚罗", folder: "mahoraga_rogue", prefix: "Mahoraga" },
    { actorID: 1013, walkID: 80, battlerID: 11033, name: "绯刃·铃", folder: "feiren_ling", prefix: "FeirenLing" },
    { actorID: 1014, walkID: 81, battlerID: 11034, name: "赤尾·娑罗", folder: "chiwei_saluo", prefix: "ChiweiSaluo" },
    { actorID: 1015, walkID: 82, battlerID: 11035, name: "织母·罗涅", folder: "zhimu_luonie", prefix: "ZhimuLuonie" },
    { actorID: 1016, walkID: 83, battlerID: 11036, name: "森角·芙萝", folder: "senjiao_fuluo", prefix: "SenjiaoFuluo" },
    { actorID: 1017, walkID: 84, battlerID: 11037, name: "岩角·可可", folder: "yanjiao_keke", prefix: "YanjiaoKeke" },
    { actorID: 1018, walkID: 85, battlerID: 11038, name: "月兔·茉白", folder: "yuetu_mobai", prefix: "YuetuMobai" },
    { actorID: 1019, walkID: 86, battlerID: 11039, name: "潮歌·澜", folder: "chaoge_lan", prefix: "ChaogeLan" },
    { actorID: 1020, walkID: 87, battlerID: 11040, name: "星典·墨羽", folder: "xingdian_moyu", prefix: "XingdianMoyu" },
    { actorID: 1021, walkID: 88, battlerID: 11041, name: "影弦·凛", folder: "yingxian_lin", prefix: "YingxianLin" },
    { actorID: 1022, walkID: 89, battlerID: 11042, name: "风袖·千鹤", folder: "fengxiu_qianhe", prefix: "FengxiuQianhe" }
];

function readJSON(relativePath) {
    return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function writeJSON(relativePath, value) {
    fs.writeFileSync(path.join(root, relativePath), JSON.stringify(value, null, 4) + "\n");
}

function normalizeRegularWalkingAvatar(value) {
    let frameCount = 0;
    function visit(entry) {
        if (Array.isArray(entry)) {
            for (const item of entry) visit(item);
        }
        else if (entry && typeof entry === "object") {
            if (Array.isArray(entry.rect) && "width" in entry && "height" in entry) {
                entry.x = -48;
                entry.y = -88;
                entry.width = 96;
                entry.height = 96;
                frameCount++;
            }
            else {
                for (const key of Object.keys(entry)) visit(entry[key]);
            }
        }
    }
    visit(value);
    return frameCount;
}

function findEntryArray(value, targetID) {
    if (Array.isArray(value)) {
        if (value.some(entry => entry && entry.id === targetID)) return value;
        for (const entry of value) {
            const found = findEntryArray(entry, targetID);
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

const template = readJSON("asset/json/avatar/data/avatar11031.json");
const avatarList = readJSON("asset/json/avatar/avatarList.json");
const battlerEntries = findEntryArray(avatarList, 11031);
if (!battlerEntries) throw new Error("Could not locate battler avatar list containing 11031");
const walkNames = avatarList.list && avatarList.list["1"];
const battlerNames = avatarList.list && avatarList.list["12"];
if (!Array.isArray(walkNames) || !Array.isArray(battlerNames)) throw new Error("Avatar legacy index lists are missing");
battlerNames[31] = "小美";

for (const character of characters) {
    const base = `asset/image/avatar/battler/${character.folder}/${character.prefix}`;
    const requiredImages = ["standby", "attack", "release", "die", "hit", "defense"].map(action => `${base}_${action}.png`);
    for (const imagePath of requiredImages) {
        if (!fs.existsSync(path.join(root, imagePath))) throw new Error(`Missing battler image: ${imagePath}`);
    }

    const avatar = JSON.parse(JSON.stringify(template));
    avatar.id = character.battlerID;
    avatar.picUrls = requiredImages;
    writeJSON(`asset/json/avatar/data/avatar${character.battlerID}.json`, avatar);

    const existingEntry = battlerEntries.find(entry => entry && entry.id === character.battlerID);
    if (existingEntry) existingEntry.name = character.name;
    else battlerEntries.push({ id: character.battlerID, name: character.name, children: [] });

    const actorPath = `asset/json/custom/customModule/6/cm${character.actorID}.json`;
    const actor = readJSON(actorPath);
    if (!actor.attrs || !actor.attrs.avatar || !actor.attrs.battlerAvatar) throw new Error(`Actor lacks avatar fields: ${character.actorID}`);
    const walkingAvatarPath = `asset/json/avatar/data/avatar${character.walkID}.json`;
    if (!fs.existsSync(path.join(root, walkingAvatarPath))) {
        throw new Error(`Missing walking avatar config: ${character.walkID}`);
    }
    if (character.walkID >= 80 && character.walkID <= 89) {
        const walkingAvatar = readJSON(walkingAvatarPath);
        const frameCount = normalizeRegularWalkingAvatar(walkingAvatar);
        if (!frameCount) throw new Error(`Walking avatar has no frames: ${character.walkID}`);
        writeJSON(walkingAvatarPath, walkingAvatar);
    }
    actor.attrs.avatar.value = character.walkID;
    actor.attrs.battlerAvatar.value = character.battlerID;
    writeJSON(actorPath, actor);

    walkNames[character.walkID] = character.name;
    battlerNames[character.battlerID - 11000] = character.name;
}

battlerEntries.sort((a, b) => a.id - b.id);
writeJSON("asset/json/avatar/avatarList.json", avatarList);
console.log(`Registered ${characters.length} battler avatars (${characters[0].battlerID}-${characters[characters.length - 1].battlerID}).`);
