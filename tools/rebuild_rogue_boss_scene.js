const fs = require("fs");

const path = "asset/json/server/scene/s19.json";
const scene = JSON.parse(fs.readFileSync(path, "utf8"));
const page = scene.customCommands[0];
const serializedPage = JSON.stringify(page);

function findCommand(predicate, message) {
    const command = page.find(predicate);
    if (!command) throw new Error(message);
    return command;
}

const sectionIndex = page.findIndex(command =>
    command[0] === 18 && (String(command[1]).indexOf("// 剧情") >= 0 || String(command[1]).indexOf("肉鸽 Boss 战") >= 0)
);
if (sectionIndex < 0) throw new Error("Scene 19 story or roguelike boss section was not found.");

const initialization = page.slice(0, sectionIndex);
const readyBGM = findCommand(command =>
    command[0] === 50013 && JSON.stringify(command).indexOf('"varName":"battleReadyBGM"') >= 0,
    "Scene 19 battle-ready BGM command was not found."
);
const bossBGM = findCommand(command =>
    command[0] === 50013 && JSON.stringify(command).indexOf("Battle_Boss.ogg") >= 0,
    "Scene 19 boss BGM command was not found."
);
const bossBattle = findCommand(command => {
    if (command[0] !== 100001) return false;
    const data = command[1] || {};
    return Array.isArray(data["53384009966_0.633011615576826"]) &&
        JSON.stringify(data["53384009966_0.633011615576826"]) === "[1,2,3,4]";
}, "Scene 19 player boss battle command was not found.");

const divider = "//------------------------------------------------------------------------------------------------------";
scene.customCommands[0] = initialization.concat([
    [18, divider + "\n// 肉鸽 Boss 战：无剧情，进入场景直接开战\n" + divider,
        { ___cmdID: "rogue_boss_direct_battle" }],
    readyBGM,
    bossBGM,
    bossBattle,
    [-1, { ___cmdID: "rogue_boss_event_end" }]
]);

const narrativeActorNames = ["狼女", "兔女郎1", "兔女郎2", "兔女郎3", "兔女郎4", "兔女郎5"];
for (let index = 0; index < scene.sceneObjects.length; index++) {
    const object = scene.sceneObjects[index];
    if (!object || narrativeActorNames.indexOf(object.name) < 0) continue;
    scene.sceneObjects[index] = null;
    scene.customAttributes[index] = null;
    scene.modulesCustomAttributes[index] = null;
    scene.events[index] = null;
    scene.statusPages[index] = null;
}

const rebuiltPage = JSON.stringify(scene.customCommands[0]);
for (const text of ["尤加莉", "兔子战队", "小精灵王", "第二部队", "玩家方中途加入", "队伍编成"]) {
    if (rebuiltPage.indexOf(text) >= 0) throw new Error("Scene 19 still contains removed story text: " + text);
}
if (scene.customCommands[0].filter(command => command[0] === 100001).length !== 1) {
    throw new Error("Scene 19 must contain exactly one direct boss battle command.");
}
if (serializedPage === rebuiltPage) console.log("Scene 19 was already configured for a direct boss battle.");
else console.log("Rebuilt scene 19 as a direct single-phase boss battle.");

fs.writeFileSync(path, JSON.stringify(scene, null, 4) + "\n", "utf8");
