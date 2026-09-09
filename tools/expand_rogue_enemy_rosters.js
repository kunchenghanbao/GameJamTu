const fs = require("fs");

const rosters = {
    17: [
        { actorID: 2001, grid: [12, 7] },
        { actorID: 1009, grid: [27, 7] },
        { actorID: 1013, grid: [19, 5] }
    ],
    18: [
        { actorID: 2002, grid: [9, 7] },
        { actorID: 1010, grid: [12, 11] },
        { actorID: 1021, grid: [19, 14] }
    ],
    20: [
        { actorID: 1011, grid: [10, 5] },
        { actorID: 1016, grid: [19, 5] },
        { actorID: 2001, grid: [29, 5] }
    ],
    21: [
        { actorID: 1009, grid: [4, 4] },
        { actorID: 1018, grid: [11, 5] },
        { actorID: 2002, grid: [19, 4] }
    ],
    22: [
        { actorID: 1010, grid: [13, 4] },
        { actorID: 1020, grid: [19, 6] },
        { actorID: 1011, grid: [26, 4] }
    ],
    19: [
        { actorID: 1009, grid: [14, 8] },
        { actorID: 1011, grid: [23, 8] },
        { actorID: 2001, grid: [12, 6] },
        { actorID: 1010, grid: [24, 7] }
    ],
    23: [
        { actorID: 2001, grid: [16, 6] },
        { actorID: 1009, grid: [23, 6] },
        { actorID: 1011, grid: [12, 7] },
        { actorID: 2002, grid: [27, 7] }
    ],
    24: [
        { actorID: 2002, grid: [14, 6] },
        { actorID: 1011, grid: [25, 6] },
        { actorID: 1009, grid: [11, 6] },
        { actorID: 1010, grid: [28, 6] }
    ]
};

const objectArrays = ["sceneObjects", "customAttributes", "modulesCustomAttributes", "events", "statusPages"];
const templateScene = readJSON("asset/json/server/scene/s17.json");
const actorNames = buildActorNames();
// The role-pool actors keep their combat skills, but their 256px character
// walk sheets are too large for ordinary roguelike enemy formations.
const compactEnemyAvatars = {
    1013: 64,
    1021: 63,
    1016: 72,
    1018: 70,
    1020: 71
};

function readJSON(file) {
    return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJSON(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 4) + "\n", "utf8");
}

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

function buildActorNames() {
    const list = readJSON("asset/json/custom/customModule/customModuleDataList6.json");
    const names = {};
    for (const node of list.typeTreeNode.children || []) names[node.id] = node.name;
    return names;
}

function removeOldReinforcements(scene) {
    for (let i = 0; i < scene.sceneObjects.length; i++) {
        const object = scene.sceneObjects[i];
        if (!object || String(object.name).indexOf("肉鸽增援-") !== 0) continue;
        for (const arrayName of objectArrays) scene[arrayName][i] = null;
    }
}

function syncBossDefinition(scene) {
    const bossDefinition = readJSON("asset/json/custom/customModule/6/cm1008.json");
    for (const object of scene.sceneObjects) {
        if (!object || !(object.moduleIDs || []).includes(6)) continue;
        const battler = scene.modulesCustomAttributes[object.index] && scene.modulesCustomAttributes[object.index][0];
        if (!battler || !battler.actor || !battler.actor.value || battler.actor.value.id !== 1008) continue;
        battler.level.value = 1;
        battler.actor.value = {
            id: 1008,
            data: clone(bossDefinition.attrs)
        };
        object.avatarID = bossDefinition.attrs.avatar.value;
        object.displayList.avatar.id = bossDefinition.attrs.avatar.value;
        // The original map contains a stale necromancer status page which can
        // replace the boss module when its legacy condition becomes true.
        scene.statusPages[object.index] = [];
    }
}

function appendEnemy(scene, actorID, grid) {
    const actorDefinition = readJSON("asset/json/custom/customModule/6/cm" + actorID + ".json");
    const actorName = actorNames[actorID] || ("角色" + actorID);
    const index = scene.sceneObjects.length;

    for (const arrayName of objectArrays) {
        scene[arrayName][index] = clone(templateScene[arrayName][1]);
    }

    const object = scene.sceneObjects[index];
    object.index = index;
    object.name = "肉鸽增援-" + actorName;
    object.x = grid[0] * 48 + 24;
    object.y = grid[1] * 48 + 24;
    const avatarID = compactEnemyAvatars[actorID] || actorDefinition.attrs.avatar.value;
    object.avatarID = avatarID;
    object.displayList.avatar.id = avatarID;
    object.scale = 1;

    const battler = scene.modulesCustomAttributes[index][0];
    battler.level.value = 1;
    const actorData = clone(actorDefinition.attrs);
    // SoModule_Battler refreshes the scene object from actor.avatar at battle
    // start, so the compact avatar must be stored in the actor snapshot too.
    actorData.avatar.value = avatarID;
    battler.actor.value = {
        id: actorID,
        data: actorData
    };
}

for (const sceneID of Object.keys(rosters).map(Number)) {
    const serverPath = "asset/json/server/scene/s" + sceneID + ".json";
    const scene = readJSON(serverPath);
    removeOldReinforcements(scene);
    syncBossDefinition(scene);
    for (const enemy of rosters[sceneID]) appendEnemy(scene, enemy.actorID, enemy.grid);
    scene.customAttributesCaches = [];
    scene.modulesCustomAttributesCaches = [];
    scene.statusPagesSelectedIndexs = [];
    writeJSON(serverPath, scene);
    console.log("Expanded roguelike scene " + sceneID + " with " + rosters[sceneID].length + " enemies.");
}
