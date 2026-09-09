const fs = require("fs");

function read(path) {
    return fs.readFileSync(path, "utf8");
}

function json(path) {
    return JSON.parse(read(path));
}

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

function levelOneGrowth(classData, attributeName) {
    const curve = JSON.parse(classData.attrs[attributeName].value);
    return Math.floor(curve[0][2] * curve[0][4] / 100);
}

const gameHtmlSource = read("Game.html");
assert(gameHtmlSource.indexOf('src="Game/../out/Game.js"') >= 0 &&
    gameHtmlSource.indexOf("out/game/") < 0,
    "Game.html must use the single canonical out/Game.js entry");
const mouseControlSource = read("Game/game/project/controller/MouseControl.ts");
assert(mouseControlSource.indexOf("sceneLayer.off(MouseControl.mouseEvents") >= 0 &&
    mouseControlSource.indexOf("isStarted") >= 0,
    "mouse controller stop/start listener lifecycle is not idempotent");

function pngSize(path) {
    const data = fs.readFileSync(path);
    return { width: data.readUInt32BE(16), height: data.readUInt32BE(20) };
}

function avatarFrames(value, result) {
    result = result || [];
    if (Array.isArray(value)) {
        for (const entry of value) avatarFrames(entry, result);
    }
    else if (value && typeof value === "object") {
        if (Array.isArray(value.rect) && "width" in value && "height" in value) result.push(value);
        else for (const key of Object.keys(value)) avatarFrames(value[key], result);
    }
    return result;
}

const sourceFiles = [
    "RogueRunState.ts", "RogueRunManager.ts", "RogueSaveAdapter.ts",
    "RogueRewardPool.ts", "RogueRewardResolver.ts", "RogueSkillUpgradeSystem.ts", "RogueKillProgress.ts",
    "RogueSceneDirector.ts", "RogueSkillSynergySystem.ts"
];
const uiScripts = [
    "RogueUIFactory.ts", "GUI_RogueLevelSelect.ts", "GUI_RogueEntry.ts",
    "GUI_RogueMap.ts", "GUI_RogueReward.ts", "GUI_RogueResult.ts"
];
const tsconfig = json("Game/tsconfig.json");
for (const file of sourceFiles) {
    assert(tsconfig.files.indexOf("game/project/rogue/" + file) >= 0, "tsconfig missing " + file);
}
for (const file of uiScripts) {
    assert(tsconfig.files.indexOf("game/project/ui/rogue/" + file) >= 0, "tsconfig missing " + file);
}
const rogueUIFactorySource = read("Game/game/project/ui/rogue/RogueUIFactory.ts");
assert(rogueUIFactorySource.indexOf("class RogueSelectionCursor") >= 0 &&
    rogueUIFactorySource.indexOf("os.add_ENTERFRAME(this.updateEffect, this)") >= 0,
    "roguelike animated selection cursor is missing");
for (const file of ["GUI_RogueEntry.ts", "GUI_RogueMap.ts", "GUI_RogueReward.ts", "GUI_RogueResult.ts"]) {
    const source = read("Game/game/project/ui/rogue/" + file);
    assert(source.indexOf("RogueSelectionCursor") >= 0 && source.indexOf("selectionCursor.focus") >= 0,
        "roguelike UI does not use the selection cursor: " + file);
}

const expectedUIClasses = {
    38: "GUI_RogueLevelSelect",
    39: "GUI_RogueEntry",
    40: "GUI_RogueReward",
    41: "GUI_RogueMap",
    42: "GUI_RogueResult"
};
const uiList = json("asset/json/ui/uiList.json");
for (const idText of Object.keys(expectedUIClasses)) {
    const id = Number(idText);
    const ui = json("asset/json/ui/data/ui" + id + ".json");
    json("asset/json/server/ui/sui" + id + ".json");
    assert(ui.id === id, "UI data has wrong id: " + id);
    assert(ui.instanceClassName === expectedUIClasses[id], "UI class mismatch: " + id);
    assert(uiList.list["1"][id], "UI list missing id: " + id);
    assert(ui.root && Array.isArray(ui.root.children) && ui.root.children.length > 0, "UI component tree is empty: " + id);
}
const levelSelectUI = json("asset/json/ui/data/ui38.json");
const rogueEntryButton = levelSelectUI.root.children.find(child => child.name === "肉鸽入口");
assert(rogueEntryButton && rogueEntryButton.hasCommand[0], "level select roguelike entry is missing");
const rogueMapUI = json("asset/json/ui/data/ui41.json");
assert(rogueMapUI.root.children.some(child => child.name === "装备管理按钮" && child.label === "装备管理"),
    "roguelike map equipment management button is missing");
const levelSelectServer = json("asset/json/server/ui/sui38.json");
const rogueEntryCommand = JSON.stringify(levelSelectServer[rogueEntryButton.id]);
assert(levelSelectServer[rogueEntryButton.id] &&
    rogueEntryCommand.indexOf("GameUI.hide(38)") >= 0 &&
    rogueEntryCommand.indexOf("GameUI.show(39)") >= 0,
    "level select native roguelike transition is incomplete");
const levelSelectSource = read("Game/game/project/ui/rogue/GUI_RogueLevelSelect.ts");
const levelSelectRuntime = read("out/Game.js");
for (const transitionCode of ["GameUI.hide(38)", "GameUI.show(39)"]) {
    assert(levelSelectSource.indexOf(transitionCode) >= 0,
        "level select source transition is incomplete: " + transitionCode);
    assert(levelSelectRuntime.indexOf(transitionCode) >= 0,
        "level select runtime output is stale: " + transitionCode);
}

const avatarList = json("asset/json/avatar/avatarList.json");
const rogueActors = [
    [1012, 79, 11032, "魔虚罗"], [1013, 80, 11033, "绯刃·铃"],
    [1014, 81, 11034, "赤尾·娑罗"], [1015, 82, 11035, "织母·罗涅"],
    [1016, 83, 11036, "森角·芙萝"], [1017, 84, 11037, "岩角·可可"],
    [1018, 85, 11038, "月兔·茉白"], [1019, 86, 11039, "潮歌·澜"],
    [1020, 87, 11040, "星典·墨羽"], [1021, 88, 11041, "影弦·凛"],
    [1022, 89, 11042, "风袖·千鹤"]
];
assert(avatarList.list["12"][31] === "小美", "existing battler avatar 11031 is not indexed");
const xiaomeiCharacter = json("asset/json/avatar/data/avatar77.json");
const xiaomeiStandbyPath = "asset/image/avatar/character/xiaomei/Xiaomei_standby_v2.png";
assert(xiaomeiCharacter.picUrls[0] === xiaomeiStandbyPath,
    "Xiaomei is not using the corrected four-direction standby art");
assert(fs.existsSync(xiaomeiStandbyPath), "Xiaomei corrected standby image is missing");
const xiaomeiStandbySize = pngSize(xiaomeiStandbyPath);
assert(xiaomeiStandbySize.width === 48 && xiaomeiStandbySize.height === 384,
    "Xiaomei corrected standby image size is invalid");
const xiaomeiBattler = json("asset/json/avatar/data/avatar11031.json");
for (const imagePath of xiaomeiBattler.picUrls) {
    assert(imagePath.indexOf("_v4.png") >= 0, "Xiaomei battler is not using the corrected v4 art: " + imagePath);
    assert(fs.existsSync(imagePath), "Xiaomei battler image is missing: " + imagePath);
    const size = pngSize(imagePath);
    assert(size.width === 2860 && size.height === 220, "Xiaomei battler image size is invalid: " + imagePath);
}
for (const action of ["standby", "attack", "release", "die", "hit", "defense"]) {
    assert(fs.existsSync("asset/image/avatar/battler/xiaomei/Xiaomei_" + action + "_v2.png"),
        "Xiaomei original v2 battler image was not preserved: " + action);
    assert(fs.existsSync("asset/image/avatar/battler/xiaomei/Xiaomei_" + action + "_v3.png"),
        "Xiaomei previous v3 battler image was not preserved: " + action);
}
const xiaomeiClass = json("asset/json/custom/customModule/7/cm6.json");
assert(Math.round(JSON.parse(xiaomeiClass.attrs.MaxHPGrow.value)[0][2] *
    JSON.parse(xiaomeiClass.attrs.MaxHPGrow.value)[0][4] / 100) === 160,
    "Xiaomei level-one MaxHP growth must resolve to 160");
const summonerActor = json("asset/json/custom/customModule/6/cm7.json");
const summonerClass = json("asset/json/custom/customModule/7/cm7.json");
const summonerLevelOne = {
    MaxHPGrow: 120, MaxSPGrow: 260, ATKGrow: 12, DEFGrow: 8,
    MAGGrow: 28, MAGDEFGrow: 18, DODGrow: 4
};
for (const attributeName of Object.keys(summonerLevelOne)) {
    assert(levelOneGrowth(summonerClass, attributeName) === summonerLevelOne[attributeName],
        "Summoner level-one growth mismatch: " + attributeName);
}
assert(summonerActor.attrs.HIT.value === 90, "Summoner base hit must be 90");
const wolfActor = json("asset/json/custom/customModule/6/cm5.json");
const wolfBonuses = {
    increaseMaxHP: 120, increaseMaxSP: 30, increaseATK: 10,
    increaseDEF: 9, increaseMagDef: 12, increaseDod: 6
};
for (const attributeName of Object.keys(wolfBonuses)) {
    assert(wolfActor.attrs[attributeName].value === wolfBonuses[attributeName],
        "Wolf-specific base bonus mismatch: " + attributeName);
}
for (const actorID of [5, 7, 8, 9]) {
    const actor = json("asset/json/custom/customModule/6/cm" + actorID + ".json");
    assert(actor.attrs.initAttrs.value.__characterBaseBalanceV1 === true,
        "Character balance migration marker is missing: " + actorID);
}
const projectPlayerSource = read("Game/game/project/ProjectPlayer.ts");
const projectGameSource = read("Game/game/project/ProjectGame.ts");
assert(projectPlayerSource.indexOf("static migrateCharacterBaseBalance()") >= 0 &&
    projectGameSource.indexOf("ProjectPlayer.migrateCharacterBaseBalance()") >= 0,
    "Existing-save character balance migration is incomplete");
const zuigeActor = json("asset/json/custom/customModule/6/cm8.json");
assert(zuigeActor.attrs.class.value === 8 && zuigeActor.attrs.avatar.value === 91 &&
    zuigeActor.attrs.battlerAvatar.value === 11044, "Zuige actor mapping is incomplete");
assert(zuigeActor.attrs.face.value === "asset/image/picture/face/zuige/Zuige_normal.png" &&
    fs.existsSync(zuigeActor.attrs.face.value), "Zuige face art is missing");
const zuigeSkillIDs = zuigeActor.attrs.skills.value.map(skill => skill.id);
for (const skillID of [76, 77, 81]) {
    assert(zuigeSkillIDs.indexOf(skillID) >= 0, "Zuige initial skill is missing: " + skillID);
}
const zuigeClass = json("asset/json/custom/customModule/7/cm8.json");
assert(zuigeClass.id === 8 && zuigeClass.attrs.icon.value === "asset/image/picture/control/icon_occupation_8.png" &&
    fs.existsSync(zuigeClass.attrs.icon.value), "Zuige class configuration is incomplete");
const zuigeLevelOne = {
    MaxHPGrow: 210, MaxSPGrow: 120, ATKGrow: 42,
    DEFGrow: 20, MAGDEFGrow: 12, DODGrow: 8
};
for (const attributeName of Object.keys(zuigeLevelOne)) {
    assert(levelOneGrowth(zuigeClass, attributeName) === zuigeLevelOne[attributeName],
        "Zuige level-one growth mismatch: " + attributeName);
}
assert(zuigeActor.attrs.increaseCRIT.value === 10, "Zuige base critical rate must be 10");
assert(zuigeClass.attrs.lvUpAutoGetSkills.value.map(entry => entry.skill.value).join(",") === "78,79,80,81",
    "Zuige class level-up skill order is incorrect");
for (const skillID of [76, 78, 80]) {
    const skill = json("asset/json/custom/customModule/8/cm" + skillID + ".json");
    assert(skill.attrs.costActionPower.value === true && skill.attrs.useDamage.value === false,
        "Zuige free-action skill flags are incomplete: " + skillID);
}
const battleHelperSource = read("Game/game/project/battle/GameBattleHelper.ts");
const battleActionSource = read("Game/game/project/battle/GameBattleAction.ts");
assert(battleHelperSource.indexOf("static consumesActionPower") >= 0 &&
    battleHelperSource.indexOf("isZuigeFreeActionSkill") >= 0 &&
    battleHelperSource.indexOf("isYanlingFreeActionSkill") >= 0,
    "character-specific free-action rule is missing from skill validation");
assert(battleActionSource.indexOf("GameBattleHelper.consumesActionPower(fromBattler, skill)") >= 0,
    "battle action does not use the Zuige free-action rule");
assert(battleActionSource.indexOf("moveYanlingIntoRange") >= 0 &&
    battleActionSource.indexOf("skill.id == 85") >= 0,
    "Yanling cross-entry does not reposition the user after a two-grid hit");
const zuigeWalking = json("asset/json/avatar/data/avatar91.json");
for (const imagePath of zuigeWalking.picUrls) {
    assert(fs.existsSync(imagePath), "Zuige walking image is missing: " + imagePath);
}
const zuigeBattler = json("asset/json/avatar/data/avatar11044.json");
for (const imagePath of zuigeBattler.picUrls) {
    assert(fs.existsSync(imagePath), "Zuige battler image is missing: " + imagePath);
    const size = pngSize(imagePath);
    assert(size.width === 2860 && size.height === 220, "Zuige battler image size is invalid: " + imagePath);
}
const yanlingActor = json("asset/json/custom/customModule/6/cm9.json");
assert(yanlingActor.id === 9 && yanlingActor.attrs.class.value === 9 &&
    yanlingActor.attrs.avatar.value === 92 && yanlingActor.attrs.battlerAvatar.value === 11045,
    "Yanling actor mapping is incomplete");
assert(yanlingActor.attrs.face.value === "asset/image/picture/face/yanling/Yanling_normal.png" &&
    fs.existsSync(yanlingActor.attrs.face.value), "Yanling face art is missing");
const yanlingSkillIDs = yanlingActor.attrs.skills.value.map(skill => skill.id);
for (const skillID of [82, 83, 87]) {
    assert(yanlingSkillIDs.indexOf(skillID) >= 0, "Yanling initial skill is missing: " + skillID);
}
const yanlingClass = json("asset/json/custom/customModule/7/cm9.json");
assert(yanlingClass.id === 9 && yanlingClass.attrs.icon.value === "asset/image/picture/control/icon_occupation_9.png" &&
    fs.existsSync(yanlingClass.attrs.icon.value), "Yanling class configuration is incomplete");
const yanlingLevelOne = {
    MaxHPGrow: 175, MaxSPGrow: 115, ATKGrow: 36,
    DEFGrow: 15, MAGDEFGrow: 13, DODGrow: 14
};
for (const attributeName of Object.keys(yanlingLevelOne)) {
    assert(levelOneGrowth(yanlingClass, attributeName) === yanlingLevelOne[attributeName],
        "Yanling level-one growth mismatch: " + attributeName);
}
assert(yanlingActor.attrs.increaseCRIT.value === 16, "Yanling base critical rate must be 16");
assert(yanlingClass.attrs.lvUpAutoGetSkills.value.map(entry => entry.skill.value).join(",") === "84,85,86,87",
    "Yanling class level-up skill order is incorrect");
const yanlingWalking = json("asset/json/avatar/data/avatar92.json");
assert(yanlingWalking.id === 92 && yanlingWalking.oriMode === 8 && yanlingWalking.actionListArr[0].frameImageInfo.length === 8,
    "Yanling walking avatar is not eight-direction");
for (const imagePath of yanlingWalking.picUrls) {
    assert(fs.existsSync(imagePath), "Yanling walking image is missing: " + imagePath);
}
const yanlingWalkingSizes = [pngSize(yanlingWalking.picUrls[0]), pngSize(yanlingWalking.picUrls[1])];
assert(yanlingWalkingSizes[0].width === 48 && yanlingWalkingSizes[0].height === 768 &&
    yanlingWalkingSizes[1].width === 192 && yanlingWalkingSizes[1].height === 768,
    "Yanling walking image dimensions are invalid");
const yanlingBattler = json("asset/json/avatar/data/avatar11045.json");
for (const imagePath of yanlingBattler.picUrls) {
    assert(fs.existsSync(imagePath), "Yanling battler image is missing: " + imagePath);
    const size = pngSize(imagePath);
    assert(size.width === 2860 && size.height === 220, "Yanling battler image size is invalid: " + imagePath);
}
for (const iconName of ["probe", "step", "spin", "cross", "phase", "finisher", "mark", "footwork", "ring", "bleed"]) {
    assert(fs.existsSync("asset/image/picture/icon/skill/Yanling_" + iconName + ".png"),
        "Yanling icon is missing: " + iconName);
}
function customRangeCells(skillID) {
    const attrs = json("asset/json/custom/customModule/8/cm" + skillID + ".json").attrs;
    const range = attrs.effectRange3.value;
    const center = Math.floor(range.size / 2);
    const cells = [];
    for (let x = 0; x < range.size; x++) {
        for (let y = 0; y < range.size; y++) {
            if (range.gridData[x][y]) cells.push([x - center, y - center]);
        }
    }
    return { attrs, cells };
}
function hasFourWayLine(cells, length) {
    const expected = [];
    for (let step = 1; step <= length; step++) {
        expected.push([step, 0], [-step, 0], [0, step], [0, -step]);
    }
    return expected.every(point => cells.some(cell => cell[0] === point[0] && cell[1] === point[1]));
}
const yanlingCrossRange = customRangeCells(85);
assert(yanlingCrossRange.attrs.effectRangeType.value === 2 &&
    yanlingCrossRange.attrs.associationOrientation.value === false &&
    yanlingCrossRange.cells.length === 8 &&
    hasFourWayLine(yanlingCrossRange.cells, 2) &&
    !yanlingCrossRange.cells.some(cell => cell[0] === 0 && cell[1] === 0),
    "Yanling cross-entry range must be an orientation-independent four-way 1-2 line");
const yanlingFinisherRange = customRangeCells(87);
assert(yanlingFinisherRange.attrs.effectRangeType.value === 2 &&
    yanlingFinisherRange.attrs.associationOrientation.value === false &&
    yanlingFinisherRange.cells.length === 12 &&
    hasFourWayLine(yanlingFinisherRange.cells, 3) &&
    !yanlingFinisherRange.cells.some(cell => cell[0] === 0 && cell[1] === 0),
    "Yanling finisher range must be an orientation-independent four-way 1-3 line");
for (const [actorID, walkID, battlerID, name] of rogueActors) {
    const actor = json("asset/json/custom/customModule/6/cm" + actorID + ".json");
    assert(actor.attrs.avatar.value === walkID, "walking avatar mapping mismatch: " + actorID);
    assert(actor.attrs.battlerAvatar.value === battlerID, "battler avatar mapping mismatch: " + actorID);
    assert(avatarList.list["1"][walkID] === name, "walking avatar index missing: " + walkID);
    assert(avatarList.list["12"][battlerID - 11000] === name, "battler avatar index missing: " + battlerID);
    const walkingAvatar = json("asset/json/avatar/data/avatar" + walkID + ".json");
    if (walkID >= 80 && walkID <= 89) {
        const frames = avatarFrames(walkingAvatar);
        assert(frames.length > 0, "walking avatar has no frames: " + walkID);
        for (const frame of frames) {
            assert(frame.rect[2] === 256 && frame.rect[3] === 256,
                "regular walking avatar source crop changed: " + walkID);
            assert(frame.x === -48 && frame.y === -88 && frame.width === 96 && frame.height === 96,
                "regular walking avatar display size is inconsistent: " + walkID);
        }
    }
    json("asset/json/avatar/data/avatar" + battlerID + ".json");
}

const sceneList = json("asset/json/scene/sceneList.json");
const scenes = [
    { id: 17, name: "肉鸽-战斗节点A", nodeID: "battle-a", x: 840, y: 1032 },
    { id: 18, name: "肉鸽-战斗节点B", nodeID: "battle-b", x: 120, y: 1032 },
    { id: 20, name: "肉鸽-林道废墟", nodeID: "battle-c", x: 936, y: 1032, width: 1920, height: 1200 },
    { id: 21, name: "肉鸽-庭院回廊", nodeID: "battle-d", x: 552, y: 984, width: 1152, height: 1152 },
    { id: 22, name: "肉鸽-腐化祭坛", nodeID: "battle-e", x: 936, y: 1032, width: 1920, height: 1200 },
    { id: 19, name: "肉鸽-Boss节点", nodeID: "boss", x: 840, y: 1176 },
    { id: 23, name: "肉鸽-深渊王座", nodeID: "boss-2", x: 936, y: 1032, width: 1920, height: 1200 },
    { id: 24, name: "肉鸽-星陨圣坛", nodeID: "boss-3", x: 936, y: 1032, width: 1920, height: 1200 }
];
for (const entry of scenes) {
    const scene = json("asset/json/scene/data/scene" + entry.id + ".json");
    const server = json("asset/json/server/scene/s" + entry.id + ".json");
    assert(scene.id === entry.id && scene.name === entry.name, "scene identity mismatch: " + entry.id);
    assert(server.id === entry.id, "server scene identity mismatch: " + entry.id);
    assert(sceneList.list[entry.id] === entry.name, "scene list mismatch: " + entry.id);
    if (entry.width) {
        assert(scene.width === entry.width && scene.height === entry.height, "scene dimensions mismatch: " + entry.id);
        const imagePath = scene.LayerDatas && scene.LayerDatas[0] && scene.LayerDatas[0].img;
        assert(imagePath && fs.existsSync(imagePath), "scene background is missing: " + entry.id);
        const image = fs.readFileSync(imagePath);
        assert(image.readUInt32BE(0) === 0x89504e47 && image.readUInt32BE(16) === entry.width && image.readUInt32BE(20) === entry.height,
            "scene background dimensions mismatch: " + entry.id);
    }
    assert(entry.x >= 0 && entry.y >= 0 && entry.x < scene.width && entry.y < scene.height, "entry outside scene: " + entry.id);
    const spawnMarkers = server.sceneObjects.filter(object => object && object.name === "肉鸽出生点");
    assert(spawnMarkers.length >= 2, "scene must contain multiple roguelike spawn markers: " + entry.id);
    assert(spawnMarkers[0].x === entry.x && spawnMarkers[0].y === entry.y,
        "primary spawn marker position mismatch: " + entry.id);
    const markerPositions = new Set();
    for (const marker of spawnMarkers) {
        markerPositions.add(marker.x + "," + marker.y);
        assert(marker.x >= 0 && marker.y >= 0 && marker.x < scene.width && marker.y < scene.height,
            "spawn marker is outside the scene: " + entry.id + " @" + marker.x + "," + marker.y);
        assert(marker.avatarID === 0 && marker.avatarAlpha === 0, "spawn marker must be invisible: " + entry.id);
        const markerAttributes = server.customAttributes[marker.index];
        assert(markerAttributes && markerAttributes.through && markerAttributes.through.value === true,
            "spawn marker must be passable: " + entry.id);
        const gridX = Math.floor(marker.x / 48);
        const gridY = Math.floor(marker.y / 48);
        const obstacleColumn = scene.dataLayers[0] && scene.dataLayers[0][gridX];
        assert(!obstacleColumn || obstacleColumn[gridY] !== 1,
            "spawn marker is on a fixed obstacle: " + entry.id + " @" + marker.x + "," + marker.y);
        const deploymentColumn = scene.dataLayers[3] && scene.dataLayers[3][gridX];
        assert(deploymentColumn && deploymentColumn[gridY] === 1,
            "spawn marker is not a player deployment cell: " + entry.id + " @" + marker.x + "," + marker.y);
    }
    assert(markerPositions.size === spawnMarkers.length,
        "roguelike spawn markers must use unique coordinates: " + entry.id);
    for (const object of server.sceneObjects) {
        if (!object || !(object.moduleIDs || []).includes(6)) continue;
        const battlerGridX = Math.floor(object.x / 48);
        const battlerGridY = Math.floor(object.y / 48);
        assert(scene.dataLayers[0][battlerGridX][battlerGridY] !== 1,
            "battler starts on a fixed obstacle: " + entry.id + "/" + object.name);
    }
    const enemyObjects = server.sceneObjects.filter(object => object && (object.moduleIDs || []).includes(6));
    const enemyActorIDs = enemyObjects.map(object => {
        const battler = server.modulesCustomAttributes[object.index] && server.modulesCustomAttributes[object.index][0];
        return battler && battler.actor && battler.actor.value && battler.actor.value.id;
    });
    if ([19, 23, 24].indexOf(entry.id) >= 0) {
        assert(enemyObjects.length >= 5, "boss scene must contain a boss and at least four reinforcements: " + entry.id);
        assert(enemyActorIDs.filter(actorID => actorID === 1008).length === 1,
            "boss scene must contain exactly one scaled boss actor: " + entry.id);
        assert(Array.from(new Set(enemyActorIDs)).length >= 5,
            "boss scene reinforcement roster is not diverse enough: " + entry.id);
        const bossObject = enemyObjects.find(object => {
            const battler = server.modulesCustomAttributes[object.index] && server.modulesCustomAttributes[object.index][0];
            return battler && battler.actor && battler.actor.value && battler.actor.value.id === 1008;
        });
        const bossData = server.modulesCustomAttributes[bossObject.index][0].actor.value.data;
        assert(bossData.MaxHP.value === 8000 && bossData.MaxSP.value === 2000,
            "boss scene uses stale HP/SP data: " + entry.id);
        assert(bossData.ATK.value === 150 && bossData.MAG.value === 150 && bossData.DEF.value === 40,
            "boss scene uses stale combat attributes: " + entry.id);
        const bossSkillIDs = bossData.skills.value.map(skill => skill.id);
        for (const skillID of [1016, 1017, 1018, 1010, 3012]) {
            assert(bossSkillIDs.indexOf(skillID) >= 0,
                "boss scene is missing skill " + skillID + ": " + entry.id);
        }
        assert(Array.isArray(server.statusPages[bossObject.index]) && server.statusPages[bossObject.index].length === 0,
            "boss scene still contains a stale actor status page: " + entry.id);
    }
    else {
        assert(enemyObjects.length >= 9, "regular roguelike scene must contain at least nine enemies: " + entry.id);
        assert(Array.from(new Set(enemyActorIDs)).length >= 6,
            "regular roguelike scene enemy roster is not diverse enough: " + entry.id);
    }
    const deployment = scene.dataLayers[3] || [];
    let deploymentCellCount = 0;
    for (let x = 0; x < deployment.length; x++) {
        for (let y = 0; y < (deployment[x] || []).length; y++) {
            if (deployment[x][y] === 1) {
                deploymentCellCount++;
                assert(scene.dataLayers[0][x][y] !== 1,
                    "player deployment cell is a fixed obstacle: " + entry.id + "/" + x + "," + y);
            }
        }
    }
    assert(deploymentCellCount === 6,
        "roguelike scene must contain exactly six player deployment cells: " + entry.id);
    if (entry.id >= 19) {
        const eventPage = server.customCommands && server.customCommands[0] || [];
        assert(eventPage.filter(command => command[0] === 100001).length === 1,
            "roguelike scene must start exactly one battle: " + entry.id);
        assert(eventPage.every(command => command[0] !== 11), "roguelike scene must not contain dialogue: " + entry.id);
        assert(eventPage.every(command => command[0] !== 21), "roguelike scene must not transfer to a story scene: " + entry.id);
        for (const commandCode of [40010, 40020]) {
            assert(eventPage.every(command => command[0] !== commandCode),
                "roguelike scene contains setup UI command " + commandCode + ": " + entry.id);
        }
    }
}

const bossScene = json("asset/json/server/scene/s19.json");
const bossEventPage = bossScene.customCommands[0];
const bossEventText = JSON.stringify(bossEventPage);
assert(bossEventPage.filter(command => command[0] === 100001).length === 1,
    "boss scene must start exactly one battle");
assert(bossEventPage.every(command => command[0] !== 11), "boss scene must not contain dialogue commands");
assert(bossEventPage.every(command => command[0] !== 21), "boss scene must not transfer to a main-story scene");
for (const commandCode of [100009, 40010, 40020]) {
    assert(bossEventPage.every(command => command[0] !== commandCode),
        "boss scene contains a pre-battle story/setup command: " + commandCode);
}
assert(bossEventText.indexOf("Battle_Boss.ogg") >= 0, "boss scene BGM is missing");
assert(bossEventText.indexOf("Battle_2.ogg") < 0, "boss scene still contains the removed first-phase BGM");
for (const text of ["尤加莉", "兔子战队", "小精灵王", "第二部队", "玩家方中途加入", "队伍编成"]) {
    assert(bossEventText.indexOf(text) < 0, "boss scene still contains story content: " + text);
}
for (const name of ["狼女", "兔女郎1", "兔女郎2", "兔女郎3", "兔女郎4", "兔女郎5"]) {
    assert(!bossScene.sceneObjects.some(object => object && object.name === name),
        "boss scene still contains a narrative actor: " + name);
}
assert(bossScene.sceneObjects.some(object => object && object.name === "BOSS"), "boss scene enemy is missing");

for (const bossID of [23, 24]) {
    const scene = json("asset/json/server/scene/s" + bossID + ".json");
    const eventPage = scene.customCommands[0];
    assert(eventPage.filter(command => command[0] === 100001).length === 1,
        "new boss scene must start exactly one battle: " + bossID);
    assert(eventPage.every(command => command[0] !== 11 && command[0] !== 21),
        "new boss scene contains story command: " + bossID);
    assert(eventPage.every(command => command[0] !== 40010 && command[0] !== 40020),
        "new boss scene contains setup UI command: " + bossID);
    assert(scene.sceneObjects.filter(object => object && /^BOSS/.test(object.name)).length === 1,
        "new boss scene must contain exactly one boss actor: " + bossID);
}

const sceneDirectorSource = read("Game/game/project/rogue/RogueSceneDirector.ts");
const sceneDirectorRuntime = read("out/Game.js");
assert(sceneDirectorSource.indexOf("getSpawnPosition") >= 0 &&
    sceneDirectorSource.indexOf("SPAWN_MARKER_NAME") >= 0,
    "scene director must resolve authored roguelike spawn markers");
assert(sceneDirectorSource.indexOf("finalNodeCompleted") >= 0 &&
    sceneDirectorSource.indexOf("RogueRunManager.saveProgress()") >= 0,
    "final roguelike node settlement must be idempotent and persisted");
assert(sceneDirectorRuntime.indexOf("getSpawnPosition") >= 0 &&
    sceneDirectorRuntime.indexOf("SPAWN_MARKER_NAME") >= 0,
    "runtime output is missing authored roguelike spawn resolution");
for (const entry of scenes) {
    const positionCode = entry.id + ": { x: " + entry.x + ", y: " + entry.y + " }";
    assert(sceneDirectorSource.indexOf(positionCode) >= 0, "scene director source position mismatch: " + entry.nodeID);
    assert(sceneDirectorRuntime.indexOf(positionCode) >= 0, "scene director runtime output is stale: " + entry.nodeID);
}
const runStateSource = read("Game/game/project/rogue/RogueRunState.ts");
for (const requiredCode of ["nodeOrder", "nodeSceneIDs", '"battle-b", "boss", "battle-c"', '"battle-d", "boss-2", "battle-e"', '"battle-f", "boss-3"']) {
    assert(runStateSource.indexOf(requiredCode) >= 0, "random nine-node plan is incomplete: " + requiredCode);
}
assert(sceneDirectorSource.indexOf("Math.max(0, state.floorIndex) * 3") >= 0, "per-floor enemy level scaling is missing");
assert(sceneDirectorSource.indexOf("applyEnemyAttributeBalance") >= 0, "roguelike enemy attribute balance is missing");
assert(sceneDirectorSource.indexOf("battlerModule.actor.id === 1008") >= 0,
    "boss durability scaling is not limited to the actual boss actor");
assert(sceneDirectorSource.indexOf("shouldResumeBattleEvent") < 0, "obsolete two-phase boss hook remains in source");
assert(sceneDirectorRuntime.indexOf("shouldResumeBattleEvent") < 0, "obsolete two-phase boss hook remains in runtime output");
assert(read("Game/game/custom/CustomCommand3.ts").indexOf("shouldResumeBattleEvent") < 0,
    "battle-stop flow still resumes the removed boss story event");

const battleData = read("Game/game/project/battle/GameBattleData.ts");
const battleAction = read("Game/game/project/battle/GameBattleAction.ts");
const battleFlow = read("Game/game/project/battle/GameBattle.ts");
const battleHelper = read("Game/game/project/battle/GameBattleHelper.ts");
const projectGame = read("Game/game/project/ProjectGame.ts");
assert(battleData.indexOf("RogueKillProgress.onBattlerDie") >= 0, "death hook missing");
assert(battleData.indexOf("RogueSceneDirector.applyEnemyLevel") >= 0, "roguelike enemy level hook missing");
assert(battleData.indexOf("if (RogueRunManager.active) return;") >= 0, "normal drop guard missing");
assert(projectGame.indexOf("RogueSceneDirector.applyEnemyAttributeBalance(actor, res)") >= 0,
    "enemy balance must be reapplied after actor attribute refreshes");
assert(battleFlow.indexOf("if (!RogueRunManager.active)") >= 0,
    "roguelike battles still use story protected-actor fail conditions");
assert(battleFlow.indexOf("this.playerBattlers.length > 0") >= 0 && battleFlow.indexOf("this.enemyBattlers.length > 0") >= 0,
    "battle completion must require a non-empty camp before checking total defeat");
assert(battleAction.indexOf("RogueRewardPresenter.presentPending") >= 0, "post-action reward hook missing");
assert(battleAction.indexOf('"action-end"') >= 0, "serializable reward continuation missing");
assert(battleFlow.indexOf('presentPending(finishBattle, "battle-complete")') >= 0,
    "final-kill cards are not blocking the native victory flow");
assert(battleHelper.indexOf("SUMMON_SKILL_ACTOR_IDS") >= 0 && battleHelper.indexOf("canCreateSummon") >= 0,
    "one-living-summon limit is missing from skill availability checks");

const killProgress = read("Game/game/project/rogue/RogueKillProgress.ts");
assert(killProgress.indexOf("__rogueIncarnationUID") >= 0, "per-incarnation battler uid missing");
assert(killProgress.indexOf("attachSummonOwner") >= 0 && killProgress.indexOf("resolveRootOwner") >= 0,
    "summon kill ownership is not rooted at the summoner");
assert(killProgress.indexOf("attachSummonOwnerAtSpawn") >= 0 &&
    read("Game/game/custom/CustomCommand3.ts").indexOf("attachSummonOwnerAtSpawn") >= 0,
    "event-created summons are not bound to their owner at spawn time");
assert(killProgress.indexOf("increaseOwnerLevel(owner)") >= 0 && killProgress.indexOf("ProjectPlayer.initPlayerActor(partyIndex, false)") >= 0,
    "one-kill/one-character-level progression is missing");
assert(killProgress.indexOf("rewardGroup.killOwnerPartyIndex") >= 0 && killProgress.indexOf("rewardGroup.levelTo") >= 0,
    "reward groups do not preserve kill owner and level settlement data");
const rewardUI = read("Game/game/project/ui/rogue/GUI_RogueReward.ts");
assert(rewardUI.indexOf("onQueueCompletePriority") >= 0 && rewardUI.indexOf('continuation === "battle-complete"') >= 0,
    "battle-complete reward continuation priority is missing");
assert(rewardUI.indexOf('continuation === "node-complete"') >= 0 &&
    sceneDirectorSource.indexOf('presentPending(() => this.completeCurrentNode(), "node-complete")') >= 0,
    "node completion can still cover pending final-kill cards");
assert(rewardUI.indexOf("currentGroup.killOwnerUID") >= 0 && rewardUI.indexOf("getOwnerActorName") >= 0,
    "reward UI does not display the character who triggered the drop");
assert(rewardUI.indexOf("currentGroup.didLevelUp") >= 0 && rewardUI.indexOf("currentGroup.levelTo") >= 0,
    "reward UI does not display the per-kill character level increase");
const rewardResolver = read("Game/game/project/rogue/RogueRewardResolver.ts");
assert(rewardResolver.indexOf("group.killOwnerPartyIndex") >= 0 && rewardResolver.indexOf("group.killOwnerActorID") >= 0,
    "reward resolution does not preserve per-character kill ownership");
assert(rewardResolver.indexOf("RogueRunManager.saveProgress()") >= 0,
    "reward confirmation can lose progress before a save slot exists");
const runManagerSource = read("Game/game/project/rogue/RogueRunManager.ts");
assert(runManagerSource.indexOf("static saveProgress()") >= 0 &&
    runManagerSource.indexOf("findAvailableSaveID()") >= 0,
    "roguelike run does not persist to a newly-created save slot");
const rogueMapSource = read("Game/game/project/ui/rogue/GUI_RogueMap.ts");
const rogueMapRuntime = read("out/Game.js");
const rogueEntrySource = read("Game/game/project/ui/rogue/GUI_RogueEntry.ts");
assert(rogueEntrySource.indexOf("state.finalNodeCompleted") >= 0 &&
    rogueMapSource.indexOf("state.finalNodeCompleted") >= 0,
    "completed roguelike runs do not recover directly to the result screen");
for (const requiredCode of ["装备管理按钮", "GameUI.show(16)", "syncRuntimeState()"]){
    assert(rogueMapSource.indexOf(requiredCode) >= 0, "roguelike equipment entry source is incomplete: " + requiredCode);
    assert(rogueMapRuntime.indexOf(requiredCode) >= 0, "roguelike equipment entry runtime output is stale: " + requiredCode);
}

const skillNames = json("asset/json/custom/customModule/customModuleDataList8.json").list["1"];
for (const skillID of [17, 35, 36, 37, 39]) {
    const summonSkill = json("asset/json/custom/customModule/8/cm" + skillID + ".json");
    assert(summonSkill.attrs.intro.value.indexOf("场上仅可存在一只，战败后可再次召唤") >= 0,
        "summon limit is not explained by skill " + skillID);
}
for (let skillID = 41; skillID <= 81; skillID++) {
    const skill = json("asset/json/custom/customModule/8/cm" + skillID + ".json");
    assert(skill.id === skillID && skillNames[skillID], "roguelike skill database entry is missing: " + skillID);
    assert(fs.existsSync(skill.attrs.icon.value), "roguelike skill icon is missing: " + skillID);
}
const enemySkillNames = json("asset/json/custom/customModule/customModuleDataList8.json").list["2"];
for (let skillID = 1001; skillID <= 1018; skillID++) {
    const skill = json("asset/json/custom/customModule/8/cm" + skillID + ".json");
    assert(skill.id === skillID && enemySkillNames[skillID - 1000], "enemy skill database entry is missing: " + skillID);
}
for (const skillID of [1001, 1016, 1017, 1018]) {
    const skill = json("asset/json/custom/customModule/8/cm" + skillID + ".json");
    assert(skill.attrs.icon.value && fs.existsSync(skill.attrs.icon.value), "enemy skill icon is missing: " + skillID);
    assert(skill.attrs.intro.value, "enemy skill description is missing: " + skillID);
}
for (const moduleID of [8, 9]) {
    const dataDir = "asset/json/custom/customModule/" + moduleID;
    for (const file of fs.readdirSync(dataDir)) {
        if (!/^cm\d+\.json$/.test(file)) continue;
        const definition = json(dataDir + "/" + file);
        const intro = definition.attrs && definition.attrs.intro && definition.attrs.intro.value;
        if (typeof intro !== "string") continue;
        assert(!/[\uFFFD\u00C3\u00C2\u951F]/.test(intro) && !/[?？]{2,}/.test(intro),
            "skill or equipment description contains mojibake: " + moduleID + "/" + definition.id);
    }
}
const statusNames = json("asset/json/custom/customModule/customModuleDataList10.json").list["1"];
for (let statusID = 27; statusID <= 34; statusID++) {
    const status = json("asset/json/custom/customModule/10/cm" + statusID + ".json");
    assert(status.id === statusID && statusNames[statusID], "roguelike status database entry is missing: " + statusID);
    assert(fs.existsSync(status.attrs.icon.value), "roguelike status icon is missing: " + statusID);
}
for (let statusID = 37; statusID <= 45; statusID++) {
    const status = json("asset/json/custom/customModule/10/cm" + statusID + ".json");
    assert(status.id === statusID && statusNames[statusID], "roguelike status database entry is missing: " + statusID);
    assert(fs.existsSync(status.attrs.icon.value), "roguelike status icon is missing: " + statusID);
}
const itemNames = json("asset/json/custom/customModule/customModuleDataList1.json").list["1"];
for (let itemID = 1; itemID <= 25; itemID++) {
    const item = json("asset/json/custom/customModule/1/cm" + itemID + ".json");
    assert(item.id === itemID && itemNames[itemID], "item database entry is missing: " + itemID);
    assert(item.attrs.icon.value && fs.existsSync(item.attrs.icon.value), "item icon is missing: " + itemID);
    assert(item.attrs.intro.value, "item description is missing: " + itemID);
}
assert(json("asset/json/custom/customModule/10/cm21.json").attrs.intro.value.indexOf("魔法值") >= 0,
    "mana regeneration status description is incorrect");
const synergySource = read("Game/game/project/rogue/RogueSkillSynergySystem.ts");
for (const hook of ["preventLethalDamage", "captureHitState", "getRangeBonus", "getAreaBonus", "getDamageMultiplier", "onAttributedKill", "absorbDamage", "STATUS_SWORD_MOMENTUM", "STATUS_WIND_DOMAIN"]) {
    assert(synergySource.indexOf(hook) >= 0, "roguelike skill synergy hook is missing: " + hook);
}
const rewardPool = read("Game/game/project/rogue/RogueRewardPool.ts");
for (let skillID = 1; skillID <= 81; skillID++) {
    assert(rewardPool.indexOf("dataID: " + skillID + ",") >= 0, "roguelike reward pool is missing skill: " + skillID);
}
for (let skillID = 1001; skillID <= 1018; skillID++) {
    assert(rewardPool.indexOf("dataID: " + skillID + ",") >= 0, "enemy skill is missing from player reward pool: " + skillID);
}
for (let itemID = 2; itemID <= 25; itemID++) {
    assert(rewardPool.indexOf("dataID: " + itemID + ", type: \"consumable\"") >= 0,
        "item is missing from roguelike reward pool: " + itemID);
}
for (const rule of ["getRewardCategory", "usedConsumable", "minFloor", "quantity"]) {
    assert(rewardPool.indexOf(rule) >= 0, "consumable reward rule is missing: " + rule);
}
assert(rewardPool.indexOf("enemySkill: true") >= 0, "enemy skill reward marker is missing");
assert(rewardPool.indexOf("usedEnemySkill") >= 0, "enemy skill per-reward cap is missing");
const equipmentDir = "asset/json/custom/customModule/9";
for (const file of fs.readdirSync(equipmentDir)) {
    if (!/^cm\d+\.json$/.test(file)) continue;
    const equipment = json(equipmentDir + "/" + file);
    const equipmentID = equipment.id;
    assert(rewardPool.indexOf("dataID: " + equipmentID + ", type: \"equipment\"") >= 0 ||
        rewardPool.indexOf("dataID: " + equipmentID + ", type: \"weapon\"") >= 0,
        "equipment is missing from roguelike reward pool: " + equipmentID);
    assert(equipment.attrs.icon.value && fs.existsSync(equipment.attrs.icon.value), "equipment icon is missing: " + equipmentID);
    assert(equipment.attrs.intro.value, "equipment description is missing: " + equipmentID);
}
const mage = json("asset/json/custom/customModule/6/cm2.json");
assert(mage.attrs.MaxHP.value === 200, "mage base MaxHP is not normalized");
const upgradeSource = read("Game/game/project/rogue/RogueSkillUpgradeSystem.ts");
for (const hook of ["skillUpgrades", "duplicate", "MAX_LEVEL", "applyLevel"]) {
    assert(upgradeSource.indexOf(hook) >= 0, "skill upgrade system hook is missing: " + hook);
}

const runManager = read("Game/game/project/rogue/RogueRunManager.ts");
for (const rule of ["battleScene", "battleReadyBGM", "battleBGM", "battleSceneBGM"]) {
    assert(runManager.indexOf(rule) >= 0, "world rule snapshot missing: " + rule);
}

const touchCamera = read("Game/game/project/controller/TouchCameraControl.ts");
assert(touchCamera.indexOf("this.initialized || !os.canvas") >= 0, "touch camera is not initialized cross-platform");
assert(touchCamera.indexOf("this.initialized || !Browser.onMobile") < 0, "touch camera is still mobile-only");
assert(touchCamera.indexOf("consumeActionKey") < 0 &&
    read("Game/game/project/controller/KeyboardControl.ts").indexOf("consumeActionKey") < 0,
    "A/B keys must not be hijacked for camera reset");
assert(touchCamera.indexOf("static followPlayerOnMove") >= 0, "virtual movement camera follow missing");
assert(read("Game/game/project/controller/Controller.ts").indexOf("TouchCameraControl.followPlayerOnMove()") >= 0,
    "virtual movement does not restore camera follow");
const miniMap = read("Game/game/project/ui/MiniMapControl.ts");
const virtualKeyboard = read("Game/game/project/ui/GUI_VirtualKeyboard.ts");
assert(miniMap.indexOf("static ensureDesktop(): MiniMapControl") >= 0, "global minimap factory missing");
assert(miniMap.indexOf("resetButton") >= 0 && miniMap.indexOf("TouchCameraControl.resetCamera()") >= 0,
    "minimap camera reset button is missing");
assert(virtualKeyboard.indexOf("MiniMapControl.ensureDesktop()") >= 0, "mobile minimap does not use global instance");
assert(battleFlow.indexOf("TouchCameraControl.resetCamera()") >= 0,
    "enemy turn must automatically reset the camera");

console.log("Roguelike validation passed: scripts, UIs, independent scene identities, battle and recovery hooks.");
