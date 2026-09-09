const fs = require("fs");

const clientTemplate = readJSON("asset/json/scene/data/scene18.json");
const enemyTemplate = readJSON("asset/json/server/scene/s17.json");
const directBattleTemplate = readJSON("asset/json/server/scene/s19.json");

const scenes = [
    {
        id: 20,
        name: "肉鸽-林道废墟",
        image: "asset/image/scene/rogue/rogue_forest_ruins.png",
        width: 1920,
        height: 1200,
        spawn: { x: 936, y: 1032 },
        enemies: [[744, 168], [1128, 168], [648, 312], [1224, 312], [840, 456], [1032, 456]],
        obstacleRects: [
            [0, 0, 39, 0], [0, 24, 39, 24], [0, 0, 0, 24], [39, 0, 39, 24],
            [1, 1, 3, 3], [4, 1, 6, 2], [1, 4, 2, 7],
            [36, 1, 38, 3], [33, 1, 35, 2], [37, 4, 38, 7],
            [1, 11, 2, 15], [37, 11, 38, 15], [1, 20, 4, 23], [35, 20, 38, 23],
            [4, 8, 7, 9], [10, 8, 14, 9], [25, 8, 29, 9], [32, 8, 35, 9],
            [4, 17, 7, 18], [10, 17, 14, 18], [25, 17, 29, 18], [32, 17, 35, 18],
            [8, 2, 9, 3], [11, 4, 12, 5], [30, 2, 31, 3], [27, 4, 28, 5],
            [11, 11, 12, 12], [27, 11, 28, 12], [12, 20, 13, 21], [26, 20, 27, 21],
            [15, 6, 15, 6], [24, 6, 24, 6], [15, 13, 15, 13], [24, 13, 24, 13]
        ],
        deploy: [[17, 21], [18, 21], [19, 21], [20, 21], [21, 21], [22, 21]]
    },
    {
        id: 21,
        name: "肉鸽-庭院回廊",
        image: "asset/image/scene/rogue/rogue_courtyard_cloister.png",
        width: 1152,
        height: 1152,
        spawn: { x: 552, y: 984 },
        enemies: [[360, 168], [744, 168], [312, 312], [792, 312], [408, 408], [696, 408]],
        obstacleRects: [
            [0, 0, 23, 0], [0, 23, 23, 23], [0, 0, 0, 23], [23, 0, 23, 23],
            [1, 1, 2, 2], [21, 1, 22, 2], [1, 19, 2, 20], [21, 19, 22, 20],
            [1, 5, 2, 5], [21, 5, 22, 5], [1, 17, 2, 17], [21, 17, 22, 17],
            [0, 7, 1, 12], [22, 7, 23, 12],
            [10, 10, 13, 13], [6, 10, 6, 13], [17, 10, 17, 13],
            [10, 8, 13, 8], [10, 15, 13, 15]
        ],
        deploy: [[9, 20], [10, 20], [11, 20], [12, 20], [13, 20], [14, 20]]
    },
    {
        id: 22,
        name: "肉鸽-腐化祭坛",
        image: "asset/image/scene/rogue/rogue_corrupted_altar.png",
        width: 1920,
        height: 1200,
        spawn: { x: 936, y: 1032 },
        enemies: [[744, 168], [1128, 168], [648, 312], [1224, 312], [792, 456], [1128, 456]],
        obstacleRects: [
            [0, 0, 39, 0], [0, 24, 39, 24], [0, 0, 0, 24], [39, 0, 39, 24],
            [1, 1, 5, 2], [7, 1, 10, 1], [29, 1, 32, 1], [34, 1, 38, 2],
            [1, 4, 2, 8], [37, 4, 38, 8], [1, 18, 4, 22], [35, 18, 38, 22],
            [10, 3, 11, 6], [8, 8, 9, 10], [6, 11, 7, 15], [8, 17, 9, 19], [10, 21, 11, 22],
            [28, 3, 29, 6], [30, 8, 31, 10], [32, 11, 33, 15], [30, 17, 31, 19], [28, 21, 29, 22],
            [19, 11, 20, 13], [17, 9, 17, 9], [22, 9, 22, 9], [15, 11, 15, 13],
            [24, 11, 24, 13], [17, 15, 17, 15], [22, 15, 22, 15]
        ],
        deploy: [[17, 21], [18, 21], [19, 21], [20, 21], [21, 21], [22, 21]]
    }
];

function readJSON(path) {
    return JSON.parse(fs.readFileSync(path, "utf8"));
}

function writeJSON(path, data) {
    fs.writeFileSync(path, JSON.stringify(data, null, 4) + "\n", "utf8");
}

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

function makeGrid(width, height) {
    return Array.from({ length: width }, () => Array(height).fill(0));
}

function fillRect(grid, rect, value) {
    for (let x = rect[0]; x <= rect[2]; x++) {
        for (let y = rect[1]; y <= rect[3]; y++) grid[x][y] = value;
    }
}

function replaceObjectID(value, sceneID) {
    if (typeof value === "string") return value.replace(/ArkanosScene16/g, "RogueScene" + sceneID);
    if (Array.isArray(value)) return value.map(item => replaceObjectID(item, sceneID));
    if (value && typeof value === "object") {
        for (const key of Object.keys(value)) value[key] = replaceObjectID(value[key], sceneID);
    }
    return value;
}

function createClientScene(spec) {
    const scene = replaceObjectID(clone(clientTemplate), spec.id);
    const gridWidth = spec.width / 48;
    const gridHeight = spec.height / 48;
    const obstacle = makeGrid(gridWidth, gridHeight);
    const deployment = makeGrid(gridWidth, gridHeight);
    for (const rect of spec.obstacleRects) fillRect(obstacle, rect, 1);
    for (const point of spec.deploy) deployment[point[0]][point[1]] = 1;

    scene.id = spec.id;
    scene.name = spec.name;
    scene.width = spec.width;
    scene.height = spec.height;
    scene.dataLayers = [obstacle, [], [], deployment];
    scene.sceneObjects = [];
    scene.preLoadAssets = [];
    scene.LayerDatas[0].img = spec.image;
    for (let i = 1; i < scene.LayerDatas.length - 1; i++) {
        scene.LayerDatas[i].tileData = Array.from({ length: gridWidth }, () => []);
        scene.LayerDatas[i].autoTileDataCache = [];
        scene.LayerDatas[i].tileTexIDs = {};
    }
    return scene;
}

function findWorldSettingCommand(page, settingName) {
    const command = page.find(item => item[0] === 50013 && JSON.stringify(item).indexOf('"varName":"' + settingName + '"') >= 0);
    if (!command) throw new Error("Missing world setting command: " + settingName);
    return clone(command);
}

function createServerScene(spec) {
    const scene = clone(enemyTemplate);
    const sourcePage = enemyTemplate.customCommands[0];
    const directPage = directBattleTemplate.customCommands[0];
    const sectionIndex = directPage.findIndex(command => command[0] === 18 && String(command[1]).indexOf("肉鸽 Boss 战") >= 0);
    const battleCommand = directPage.find(command => command[0] === 100001);
    if (sectionIndex < 0 || !battleCommand) throw new Error("Direct battle template is incomplete.");

    scene.id = spec.id;
    const arrayNames = ["sceneObjects", "customAttributes", "modulesCustomAttributes", "events", "statusPages"];
    for (const name of arrayNames) scene[name] = Array(8).fill(null);

    for (let i = 1; i <= 6; i++) {
        for (const name of arrayNames) scene[name][i] = clone(enemyTemplate[name][i]);
        scene.sceneObjects[i].index = i;
        scene.sceneObjects[i].x = spec.enemies[i - 1][0];
        scene.sceneObjects[i].y = spec.enemies[i - 1][1];
    }

    for (const name of arrayNames) scene[name][7] = clone(enemyTemplate[name][7]);
    scene.sceneObjects[7].index = 7;
    scene.sceneObjects[7].name = "肉鸽出生点";
    scene.sceneObjects[7].x = spec.spawn.x;
    scene.sceneObjects[7].y = spec.spawn.y;
    scene.sceneObjects[7].avatarID = 0;
    scene.sceneObjects[7].avatarAlpha = 0;
    scene.sceneObjects[7].displayList = { avatar: { type: 1, id: 0 } };
    scene.sceneObjects[7].showOnEditor = true;
    scene.sceneObjects[7].mouseEventEnabledInEditor = true;
    scene.customAttributes[7].selectEnabled.value = false;
    scene.customAttributes[7].through.value = true;
    scene.modulesCustomAttributes[7] = null;
    scene.statusPages[7] = null;

    const divider = "//------------------------------------------------------------------------------------------------------";
    scene.customCommands = [directPage.slice(0, sectionIndex).concat([
        [18, divider + "\n// 肉鸽战斗：无剧情，进入场景直接开战\n" + divider,
            { ___cmdID: "rogue_direct_battle_scene_" + spec.id }],
        findWorldSettingCommand(sourcePage, "battleScene"),
        findWorldSettingCommand(sourcePage, "battleReadyBGM"),
        findWorldSettingCommand(sourcePage, "battleBGM"),
        findWorldSettingCommand(sourcePage, "battleSceneBGM"),
        clone(battleCommand),
        [-1, { ___cmdID: "rogue_direct_battle_end_" + spec.id }]
    ])];
    scene.customAttributesCaches = [];
    scene.modulesCustomAttributesCaches = [];
    scene.statusPagesSelectedIndexs = [];
    return scene;
}

function registerSceneList() {
    const path = "asset/json/scene/sceneList.json";
    const sceneList = readJSON(path);
    let levelFolder = null;
    function findNode(nodes, id) {
        for (const node of nodes) {
            if (node.id === id) return node;
            const found = findNode(node.children || [], id);
            if (found) return found;
        }
        return null;
    }
    levelFolder = findNode(sceneList.node, 3);
    if (!levelFolder) throw new Error("Scene list level folder was not found.");
    for (const spec of scenes) {
        while (sceneList.list.length <= spec.id) sceneList.list.push(null);
        sceneList.list[spec.id] = spec.name;
        const existing = levelFolder.children.find(node => node.id === spec.id);
        if (existing) existing.name = spec.name;
        else levelFolder.children.push({ id: spec.id, name: spec.name, children: [] });
    }
    writeJSON(path, sceneList);
}

for (const spec of scenes) {
    if (!fs.existsSync(spec.image)) throw new Error("Missing generated map image: " + spec.image);
    writeJSON("asset/json/scene/data/scene" + spec.id + ".json", createClientScene(spec));
    writeJSON("asset/json/server/scene/s" + spec.id + ".json", createServerScene(spec));
    console.log("Registered " + spec.name + " as scene " + spec.id + ".");
}
registerSceneList();
require("./expand_rogue_enemy_rosters.js");
// Keep the shared multi-point spawn layout in sync when these scenes are
// regenerated from the map templates.
require("./register_rogue_spawns.js");
