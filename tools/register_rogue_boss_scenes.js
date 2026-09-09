const fs = require("fs");

const clientTemplate = readJSON("asset/json/scene/data/scene18.json");
const bossTemplate = readJSON("asset/json/server/scene/s19.json");

const scenes = [
    {
        id: 23,
        name: "肉鸽-深渊王座",
        image: "asset/image/scene/rogue/rogue_abyssal_throne.png",
        width: 1920,
        height: 1200,
        spawn: { x: 936, y: 1032 },
        boss: { x: 936, y: 264, name: "BOSS-深渊王座" },
        obstacleRects: [
            [0, 0, 39, 0], [0, 24, 39, 24], [0, 0, 0, 24], [39, 0, 39, 24],
            [8, 1, 12, 3], [11, 4, 12, 4], [27, 1, 31, 3], [27, 4, 28, 4],
            [11, 8, 14, 9], [25, 8, 28, 9],
            [14, 1, 15, 3], [24, 1, 25, 3], [19, 1, 20, 2],
            [5, 3, 5, 5], [34, 3, 34, 5], [7, 8, 7, 8], [17, 8, 17, 8],
            [22, 8, 22, 8], [32, 8, 32, 8], [8, 12, 8, 12], [15, 12, 15, 12],
            [24, 12, 24, 12], [31, 12, 31, 12], [7, 16, 7, 16], [15, 16, 15, 16],
            [25, 16, 25, 16], [32, 16, 32, 16], [9, 18, 9, 18], [30, 18, 30, 18],
            [3, 21, 3, 21], [11, 21, 11, 21], [28, 21, 28, 21], [37, 21, 37, 21]
        ],
        deploy: [[17, 21], [18, 21], [19, 21], [20, 21], [21, 21], [22, 21]]
    },
    {
        id: 24,
        name: "肉鸽-星陨圣坛",
        image: "asset/image/scene/rogue/rogue_starfall_altar.png",
        width: 1920,
        height: 1200,
        spawn: { x: 936, y: 1032 },
        boss: { x: 936, y: 264, name: "BOSS-星陨圣坛" },
        obstacleRects: [
            [0, 0, 39, 0], [0, 24, 39, 24], [0, 0, 0, 24], [39, 0, 39, 24],
            [2, 1, 7, 2], [32, 1, 37, 2], [1, 4, 2, 9], [37, 4, 38, 9],
            [1, 12, 2, 17], [37, 12, 38, 17], [2, 20, 7, 22], [32, 20, 37, 22],
            [15, 1, 18, 2], [21, 1, 24, 2], [19, 1, 20, 2],
            [9, 7, 10, 8], [29, 7, 30, 8],
            [4, 4, 6, 5], [33, 4, 35, 5],
            [2, 23, 15, 23], [24, 23, 37, 23]
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

function createClientScene(spec) {
    const scene = clone(clientTemplate);
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

function replaceCommandIDs(value, sceneID) {
    if (typeof value === "string") return value.replace(/scene_19/g, "scene_" + sceneID).replace(/end_19/g, "end_" + sceneID);
    if (Array.isArray(value)) return value.map(item => replaceCommandIDs(item, sceneID));
    if (value && typeof value === "object") {
        for (const key of Object.keys(value)) value[key] = replaceCommandIDs(value[key], sceneID);
    }
    return value;
}

function createServerScene(spec) {
    const scene = clone(bossTemplate);
    const objectArrays = ["sceneObjects", "customAttributes", "modulesCustomAttributes", "events", "statusPages"];
    for (const name of objectArrays) scene[name] = Array(22).fill(null);

    scene.sceneObjects[3] = clone(bossTemplate.sceneObjects[3]);
    scene.sceneObjects[3].index = 3;
    scene.sceneObjects[3].name = spec.boss.name;
    scene.sceneObjects[3].x = spec.boss.x;
    scene.sceneObjects[3].y = spec.boss.y;
    scene.customAttributes[3] = clone(bossTemplate.customAttributes[3]);
    scene.modulesCustomAttributes[3] = clone(bossTemplate.modulesCustomAttributes[3]);
    scene.events[3] = clone(bossTemplate.events[3]);
    scene.statusPages[3] = clone(bossTemplate.statusPages[3]);

    const markerIndex = 21;
    scene.sceneObjects[markerIndex] = clone(bossTemplate.sceneObjects[markerIndex]);
    scene.sceneObjects[markerIndex].index = markerIndex;
    scene.sceneObjects[markerIndex].name = "肉鸽出生点";
    scene.sceneObjects[markerIndex].x = spec.spawn.x;
    scene.sceneObjects[markerIndex].y = spec.spawn.y;
    scene.sceneObjects[markerIndex].avatarID = 0;
    scene.sceneObjects[markerIndex].avatarAlpha = 0;
    scene.sceneObjects[markerIndex].displayList = { avatar: { type: 1, id: 0 } };
    scene.sceneObjects[markerIndex].showOnEditor = true;
    scene.sceneObjects[markerIndex].mouseEventEnabledInEditor = true;
    scene.customAttributes[markerIndex] = clone(bossTemplate.customAttributes[markerIndex]);
    scene.customAttributes[markerIndex].selectEnabled.value = false;
    scene.customAttributes[markerIndex].through.value = true;
    scene.modulesCustomAttributes[markerIndex] = null;
    scene.statusPages[markerIndex] = null;

    scene.id = spec.id;
    scene.customCommands = replaceCommandIDs(clone(bossTemplate.customCommands), spec.id);
    scene.customAttributesCaches = [];
    scene.modulesCustomAttributesCaches = [];
    scene.statusPagesSelectedIndexs = [];
    return scene;
}

function registerSceneList() {
    const path = "asset/json/scene/sceneList.json";
    const sceneList = readJSON(path);
    function findNode(nodes, id) {
        for (const node of nodes) {
            if (node.id === id) return node;
            const found = findNode(node.children || [], id);
            if (found) return found;
        }
        return null;
    }
    const levelFolder = findNode(sceneList.node, 3);
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
    if (!fs.existsSync(spec.image)) throw new Error("Missing generated boss map image: " + spec.image);
    writeJSON("asset/json/scene/data/scene" + spec.id + ".json", createClientScene(spec));
    writeJSON("asset/json/server/scene/s" + spec.id + ".json", createServerScene(spec));
    console.log("Registered " + spec.name + " as scene " + spec.id + ".");
}
registerSceneList();
require("./expand_rogue_enemy_rosters.js");
// Keep the shared multi-point spawn layout in sync when these scenes are
// regenerated from the boss template.
require("./register_rogue_spawns.js");
