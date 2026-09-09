const fs = require("fs");

const MARKER_NAME = "肉鸽出生点";
const scenes = [
    // Keep six safe entry points per map so a full party can be placed
    // without stacking on a single hidden object. The first point preserves
    // the historical scene entry coordinate; the remaining points mirror
    // the authored deployment area.
    { id: 17, index: 26, positions: [[840, 1032], [888, 1032], [936, 1032], [984, 1032], [1032, 1032], [1080, 1032]] },
    { id: 18, index: 26, positions: [[120, 1032], [168, 1032], [216, 984], [216, 1032], [216, 1080], [264, 1032]] },
    { id: 19, index: 21, positions: [[840, 1176], [840, 1224], [888, 1176], [888, 1224], [936, 1176], [936, 1224]] },
    { id: 20, index: 7, positions: [[936, 1032], [840, 1032], [888, 1032], [984, 1032], [1032, 1032], [1080, 1032]] },
    { id: 21, index: 7, positions: [[552, 984], [456, 984], [504, 984], [600, 984], [648, 984], [696, 984]] },
    { id: 22, index: 7, positions: [[936, 1032], [840, 1032], [888, 1032], [984, 1032], [1032, 1032], [1080, 1032]] },
    { id: 23, index: 21, positions: [[936, 1032], [840, 1032], [888, 1032], [984, 1032], [1032, 1032], [1080, 1032]] },
    { id: 24, index: 21, positions: [[936, 1032], [840, 1032], [888, 1032], [984, 1032], [1032, 1032], [1080, 1032]] }
];

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

function readScene(id) {
    const path = "asset/json/server/scene/s" + id + ".json";
    return { path, data: JSON.parse(fs.readFileSync(path, "utf8")) };
}

function ensureArraySlot(array, index, value) {
    while (array.length <= index) array.push(null);
    array[index] = value;
}

function findMarkerSlot(scene, preferredIndex) {
    let index = preferredIndex;
    while (scene.sceneObjects[index]) index++;
    return index;
}

const spawnTemplateScene = readScene(17).data;
const templateIndex = spawnTemplateScene.sceneObjects.findIndex(object =>
    object && object.avatarID === 0 && object.moduleIDs.length === 0
);

if (templateIndex < 0) throw new Error("No empty scene object is available as the spawn marker template.");

for (const entry of scenes) {
    const sceneFile = readScene(entry.id);
    const scene = sceneFile.data;
    const existingIndexes = [];
    scene.sceneObjects.forEach((object, index) => {
        if (object && object.name === MARKER_NAME) existingIndexes.push(index);
    });

    const positions = entry.positions || [[entry.x, entry.y]];
    const markerIndexes = [];
    for (let i = 0; i < positions.length; i++) {
        const markerIndex = existingIndexes[i] !== undefined
            ? existingIndexes[i]
            : findMarkerSlot(scene, i === 0 ? entry.index : markerIndexes[i - 1] + 1);
        markerIndexes.push(markerIndex);
        const marker = clone(spawnTemplateScene.sceneObjects[templateIndex]);
        marker.index = markerIndex;
        marker.name = MARKER_NAME;
        marker.x = positions[i][0];
        marker.y = positions[i][1];
        marker.avatarID = 0;
        marker.avatarAlpha = 0;
        marker.displayList = { avatar: { type: 1, id: 0 } };
        marker.moduleDisplayList = [];
        marker.moduleIDs = [];
        marker.hasCommand = [];
        marker.showOnEditor = true;
        marker.mouseEventEnabledInEditor = true;

        const attributes = clone(spawnTemplateScene.customAttributes[templateIndex]);
        attributes.selectEnabled.value = false;
        attributes.through.value = true;

        ensureArraySlot(scene.sceneObjects, markerIndex, marker);
        ensureArraySlot(scene.customAttributes, markerIndex, attributes);
        ensureArraySlot(scene.modulesCustomAttributes, markerIndex, null);
        ensureArraySlot(scene.events, markerIndex, {
            condition: [],
            customCommands: [[], [], [], [], []]
        });
        ensureArraySlot(scene.statusPages, markerIndex, null);
    }

    for (const duplicateIndex of existingIndexes.slice(positions.length)) {
        scene.sceneObjects[duplicateIndex] = null;
        scene.customAttributes[duplicateIndex] = null;
        scene.modulesCustomAttributes[duplicateIndex] = null;
        scene.events[duplicateIndex] = null;
        scene.statusPages[duplicateIndex] = null;
    }

    fs.writeFileSync(sceneFile.path, JSON.stringify(scene, null, 4) + "\n", "utf8");
    console.log("Registered scene " + entry.id + " spawn markers: " + positions.length + ".");
}
