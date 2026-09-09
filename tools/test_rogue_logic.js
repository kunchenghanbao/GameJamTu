const assert = require("assert");
const fs = require("fs");
const ts = require("typescript");
const vm = require("vm");

function loadClass(context, path, className) {
    const source = fs.readFileSync(path, "utf8") + "\nglobalThis." + className + " = " + className + ";";
    const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES5 } }).outputText;
    vm.runInContext(js, context, { filename: path });
}

const context = vm.createContext({ console });
loadClass(context, "Game/game/project/rogue/RogueRunState.ts", "RogueRunState");

const recovered = context.RogueRunState.fromSaveData({
    schemaVersion: 1,
    rewardQueue: [{ status: "showing" }, { status: "confirmed" }]
});
assert.strictEqual(recovered.rewardQueue[0].status, "pending");
assert.strictEqual(recovered.rewardQueue[1].status, "confirmed");
assert.strictEqual(recovered.schemaVersion, 5);
assert.strictEqual(recovered.finalNodeCompleted, false);
assert.strictEqual(recovered.completedTransactionIDs.length, 0);
assert.deepStrictEqual(Array.from(recovered.skillUpgrades), []);
assert.strictEqual(context.RogueRunState.fromSaveData({ schemaVersion: 999 }), null);

const battleContext = vm.createContext({ console });
battleContext.RogueRunManager = { active: true };
battleContext.Dictionary = function () {};
battleContext.Config = { BEHAVIOR_EDIT_MODE: true };
battleContext.GameBattleHelper = { isInPlayerParty: () => true };
battleContext.ArrayUtils = {
    matchAttributesD2: (values, property, attrs) => values.filter(value =>
        Object.keys(attrs).every(key => value[property][key] === attrs[key])),
    matchAttributesD3: (values, first, second, attrs) => values.filter(value =>
        Object.keys(attrs).every(key => value[first][second][key] === attrs[key]))
};
loadClass(battleContext, "Game/game/project/battle/GameBattle.ts", "GameBattle");
const battler = (actorID, isDead) => ({ battlerSetting: { actor: { id: actorID }, isDead } });
battleContext.GameBattle.setting = { addFailConditions: [6] };
battleContext.GameBattle.playerBattlers = [battler(6, true), battler(1, false)];
battleContext.GameBattle.enemyBattlers = [battler(2004, false)];
assert.strictEqual(battleContext.GameBattle.getBattleCompleteState(), 0,
    "roguelike battle ended when only one party member died");
battleContext.GameBattle.playerBattlers[1].battlerSetting.isDead = true;
assert.strictEqual(battleContext.GameBattle.getBattleCompleteState(), 2,
    "roguelike battle did not fail after the whole player camp died");
battleContext.GameBattle.playerBattlers[0].battlerSetting.isDead = false;
battleContext.GameBattle.enemyBattlers[0].battlerSetting.isDead = true;
assert.strictEqual(battleContext.GameBattle.getBattleCompleteState(), 1,
    "roguelike battle did not win after the whole enemy camp died");
battleContext.RogueRunManager.active = false;
battleContext.GameBattle.playerBattlers = [battler(6, true), battler(1, false)];
battleContext.GameBattle.enemyBattlers[0].battlerSetting.isDead = false;
assert.strictEqual(battleContext.GameBattle.getBattleCompleteState(), 2,
    "story battle no longer honors protected-actor fail conditions");

const battleCompletionOrder = [];
let resumeBattleCompletion = null;
battleContext.RogueRunManager.active = true;
battleContext.RogueRewardPresenter = {
    presentPending: (callback, continuation) => {
        assert.strictEqual(continuation, "battle-complete");
        battleCompletionOrder.push("cards");
        resumeBattleCompletion = callback;
        return true;
    }
};
battleContext.GameBattleAction = {
    calcCurrentActionReward: (enterEndStep, callback) => {
        battleCompletionOrder.push("native-reward");
        callback();
    }
};
battleContext.GameCommand = { startCommonCommand: id => battleCompletionOrder.push("command-" + id) };
battleContext.Game = { player: { sceneObject: {} } };
battleContext.GameBattle.setting = { addFailConditions: [], battleFailHandleType: 0 };
battleContext.GameBattle.state = 2;
battleContext.GameBattle.playerBattlers = [battler(1, false)];
battleContext.GameBattle.enemyBattlers = [battler(2004, true)];
assert.strictEqual(battleContext.GameBattle.checkBattleIsComplete(), true);
assert.deepStrictEqual(battleCompletionOrder, ["cards"],
    "victory flow started before the final-kill cards were selected");
resumeBattleCompletion();
assert.deepStrictEqual(battleCompletionOrder, ["cards", "native-reward", "command-14022"]);

const expectedNodeOrder = ["battle-a", "battle-b", "boss", "battle-c", "battle-d", "boss-2", "battle-e", "battle-f", "boss-3"];
const smallNodes = ["battle-a", "battle-b", "battle-c", "battle-d", "battle-e", "battle-f"];
const bossNodes = ["boss", "boss-2", "boss-3"];
const firstPlan = context.RogueRunState.create(12345);
const repeatedPlan = context.RogueRunState.create(12345);
assert.deepStrictEqual(Array.from(firstPlan.nodeOrder), expectedNodeOrder);
assert.deepStrictEqual(JSON.parse(JSON.stringify(firstPlan.nodeSceneIDs)), JSON.parse(JSON.stringify(repeatedPlan.nodeSceneIDs)));
assert.deepStrictEqual([firstPlan.nodeOrder[2], firstPlan.nodeOrder[5], firstPlan.nodeOrder[8]], bossNodes);
assert(smallNodes.every(nodeID => [17, 18, 20, 21, 22].includes(firstPlan.nodeSceneIDs[nodeID])));
assert(bossNodes.every(nodeID => [19, 23, 24].includes(firstPlan.nodeSceneIDs[nodeID])));
assert.strictEqual(new Set(bossNodes.map(nodeID => firstPlan.nodeSceneIDs[nodeID])).size, 3);
assert.strictEqual(new Set(smallNodes.slice(0, 5).map(nodeID => firstPlan.nodeSceneIDs[nodeID])).size, 5);

const managerContext = vm.createContext({ console });
managerContext.ObjectUtils = { depthClone: value => JSON.parse(JSON.stringify(value)) };
managerContext.EventUtils = { happen: () => {} };
managerContext.WorldData = {
    fullStateWhenBattleStart: true,
    battleScene: 3,
    battleReadyBGM: "ready.ogg",
    battleBGM: "battle.ogg",
    battleSceneBGM: "scene.ogg"
};
managerContext.Game = {
    player: {
        data: { gold: 10, package: [], party: [], actorRecords: [], monsterManual_byKDS: [1] },
        variable: { variables: [1], switchs: [2], strings: ["main"] }
    }
};
loadClass(managerContext, "Game/game/project/rogue/RogueRunState.ts", "RogueRunState");
loadClass(managerContext, "Game/game/project/rogue/RogueRunManager.ts", "RogueRunManager");
managerContext.RogueRunManager.startNewRun(123);
managerContext.Game.player.data.monsterManual_byKDS.push(99);
managerContext.Game.player.data.customRunLeak = true;
managerContext.WorldData.battleScene = 19;
managerContext.WorldData.battleBGM = "rogue.ogg";
managerContext.RogueRunManager.abortRun();
assert.deepStrictEqual(managerContext.Game.player.data.monsterManual_byKDS, [1]);
assert.strictEqual(managerContext.Game.player.data.customRunLeak, undefined);
assert.strictEqual(managerContext.WorldData.battleScene, 3);
assert.strictEqual(managerContext.WorldData.battleBGM, "battle.ogg");

const ownerActor = { id: 101, name: "Actor A", class: 1, MaxLv: 99, MaxHP: 100, MaxSP: 40, hp: 75, sp: 25, skills: [{ id: 35 }] };
const secondOwnerActor = { id: 102, name: "Actor B", class: 1, MaxLv: 99, MaxHP: 120, MaxSP: 50, hp: 80, sp: 30 };
const ownerModule = { battleCamp: 0, actor: ownerActor };
const secondOwnerModule = { battleCamp: 0, actor: secondOwnerActor };
const owner = { index: 1, getModule: () => ownerModule };
const secondOwner = { index: 7, getModule: () => secondOwnerModule };
function enemy(index, ownerIndex) {
    const module = { battleCamp: 1, __rogueLastDamageOwnerIndex: ownerIndex };
    return { battler: { index, getModule: () => module }, module };
}
const firstEnemy = enemy(2, 1);
const secondEnemy = enemy(3, 7);
const unattributedEnemy = enemy(4, null);
const party = [{ actor: ownerActor, lv: 1 }, { actor: secondOwnerActor, lv: 4 }];
const initializedPartyIndexes = [];
const state = {
    runID: "test-run",
    currentNodeID: "battle-a",
    processedDeathIDs: [],
    killCount: 0,
    runLevel: 1,
    rewardQueue: [],
    visitedSceneIDs: [],
    battlerUIDCounter: 0
};
state.nodeOrder = expectedNodeOrder.slice();
state.nodeSceneIDs = {
    "battle-a": 17, "battle-b": 18, "boss": 19,
    "battle-c": 20, "battle-d": 21, "boss-2": 23,
    "battle-e": 22, "battle-f": 17, "boss-3": 24
};
state.floorIndex = 0;
context.RogueRunManager = {
    active: true,
    state,
    syncRuntimeState: () => {},
    EVENT_RUN_STATE_CHANGED: "changed"
};
context.RogueRewardPool = {
    createRewardGroup: (deadBattlerUID, killOwnerUID) => ({ deadBattlerUID, killOwnerUID })
};
context.EventUtils = { happen: () => {} };
context.ProjectPlayer = {
    EVENT_PLAYER_ACTOR_CHANGE_LEVEL: "level-changed",
    getPlayerActorIndexByActor: actor => party.findIndex(entry => entry.actor === actor),
    getPlayerActorDSByInPartyIndex: index => party[index],
    initPlayerActor: index => initializedPartyIndexes.push(index)
};
context.GameData = { getModuleData: () => null };
context.CommandPage = { startTriggerFragmentEvent: () => {} };
context.GameBattleHelper = {
    isInPlayerParty: battler => battler === owner || battler === secondOwner,
    isBattler: battler => !!battler
};
context.Game = {
    player: { sceneObject: {} },
    currentScene: { id: 17, sceneObjects: [null, owner, firstEnemy.battler, secondEnemy.battler, unattributedEnemy.battler, null, null, secondOwner] }
};
loadClass(context, "Game/game/project/rogue/RogueKillProgress.ts", "RogueKillProgress");
context.RogueKillProgress.onBattlerDie(firstEnemy.battler, firstEnemy.module);
context.RogueKillProgress.onBattlerDie(firstEnemy.battler, firstEnemy.module);
context.RogueKillProgress.onBattlerDie(secondEnemy.battler, secondEnemy.module);
context.RogueKillProgress.onBattlerDie(unattributedEnemy.battler, unattributedEnemy.module);
assert.strictEqual(state.killCount, 2);
assert.strictEqual(state.runLevel, 3);
assert.strictEqual(state.rewardQueue.length, 2);
assert.notStrictEqual(state.rewardQueue[0].deadBattlerUID, state.rewardQueue[1].deadBattlerUID);
assert.deepStrictEqual(party.map(entry => entry.lv), [2, 5]);
assert.deepStrictEqual(initializedPartyIndexes, [0, 1]);
assert.deepStrictEqual(state.rewardQueue.map(group => group.killOwnerPartyIndex), [0, 1]);
assert.deepStrictEqual(state.rewardQueue.map(group => [group.levelFrom, group.levelTo]), [[1, 2], [4, 5]]);

const replacementEnemy = enemy(2, 1);
context.Game.currentScene.sceneObjects[2] = replacementEnemy.battler;
context.RogueKillProgress.onBattlerDie(replacementEnemy.battler, replacementEnemy.module);
assert.strictEqual(state.killCount, 3);
assert.strictEqual(state.rewardQueue.length, 3);
assert.notStrictEqual(state.rewardQueue[0].deadBattlerUID, state.rewardQueue[2].deadBattlerUID);
assert.strictEqual(party[0].lv, 3);

const summonModule = { battleCamp: 0, actor: { id: 1011 } };
const summon = { index: 5, getModule: () => summonModule };
const summonEnemy = enemy(6, 5);
context.Game.currentScene.sceneObjects[5] = summon;
context.Game.currentScene.sceneObjects[6] = summonEnemy.battler;
context.GameBattle = { state: 2 };
context.GameBattleAction = { fromBattler: owner, fromBattlerSkill: { id: 17 } };
context.RogueKillProgress.attachSummonOwnerAtSpawn(summon, owner);
assert.strictEqual(summonModule.__rogueOwnerIndex, owner.index);
const explicitSummonModule = { battleCamp: 0, actor: { id: 1011 } };
const explicitSummon = { index: 8, getModule: () => explicitSummonModule };
context.RogueKillProgress.attachSummonOwnerAtSpawn(explicitSummon, secondOwner);
assert.strictEqual(explicitSummonModule.__rogueOwnerIndex, secondOwner.index,
    "spawn-time summon binding did not preserve the explicit owner");
context.RogueKillProgress.onBattlerDie(summonEnemy.battler, summonEnemy.module);
assert.strictEqual(state.killCount, 4);
assert.strictEqual(state.rewardQueue.length, 4);
assert(state.rewardQueue[3].killOwnerUID.endsWith(":" + owner.index));
assert.strictEqual(state.rewardQueue[3].killOwnerPartyIndex, 0);
assert.strictEqual(party[0].lv, 4);
assert.deepStrictEqual(state.rewardQueue.map(group => group.killOwnerActorName), ["Actor A", "Actor B", "Actor A", "Actor A"]);

// Enemy-turn counterattacks/return damage can resolve a death before the
// battle-scene source marker runs. The reverse battler may itself be a summon;
// ownership must still roll up to the party summoner.
const fallbackSummonModule = { battleCamp: 0, __rogueOwnerIndex: owner.index };
const fallbackSummon = { index: 9, getModule: () => fallbackSummonModule };
const fallbackEnemy = enemy(10, null);
context.Game.currentScene.sceneObjects[9] = fallbackSummon;
context.Game.currentScene.sceneObjects[10] = fallbackEnemy.battler;
context.GameBattleAction = { reverseBattler: fallbackSummon, fromBattler: fallbackEnemy.battler };
context.RogueKillProgress.onBattlerDie(fallbackEnemy.battler, fallbackEnemy.module);
assert.strictEqual(state.killCount, 5);
assert.strictEqual(state.rewardQueue.length, 5);
assert.strictEqual(state.rewardQueue[4].killOwnerUID.endsWith(":" + owner.index), true);
assert.strictEqual(state.rewardQueue[4].killOwnerPartyIndex, 0);
assert.strictEqual(party[0].lv, 5);

// Damage-over-time resolves during the afflicted enemy's turn. It is still a
// normal attributed death and must create one reward group.
const enemyTurnStatusDeath = enemy(11, null);
context.Game.currentScene.sceneObjects[11] = enemyTurnStatusDeath.battler;
context.RogueKillProgress.markDamageSource(enemyTurnStatusDeath.battler, owner, null);
context.RogueKillProgress.onBattlerDie(enemyTurnStatusDeath.battler, enemyTurnStatusDeath.module);
assert.strictEqual(state.killCount, 6);
assert.strictEqual(state.rewardQueue.length, 6);
assert.strictEqual(state.rewardQueue[5].killOwnerPartyIndex, 0);

// Secondary reaction damage does not recursively proc kill synergies, but the
// enemy itself must still grant its one death reward.
const reactionDeath = enemy(12, null);
context.Game.currentScene.sceneObjects[12] = reactionDeath.battler;
context.RogueKillProgress.markDamageSource(reactionDeath.battler, owner, null, true);
context.RogueKillProgress.onBattlerDie(reactionDeath.battler, reactionDeath.module);
assert.strictEqual(state.killCount, 7);
assert.strictEqual(state.rewardQueue.length, 7);

// A status-page switch can pass an old module to die(). Attribution stored on
// the live map object/current module must take precedence over missing old data.
const switchedOldModule = { battleCamp: 1 };
const switchedCurrentModule = { battleCamp: 1 };
const switchedEnemy = { index: 13, getModule: () => switchedCurrentModule };
context.Game.currentScene.sceneObjects[13] = switchedEnemy;
context.RogueKillProgress.markDamageSource(switchedEnemy, owner, { id: 61 });
context.RogueKillProgress.onBattlerDie(switchedEnemy, switchedOldModule);
assert.strictEqual(state.killCount, 8);
assert.strictEqual(state.rewardQueue.length, 8);

// If an event-created summon missed the appearance hook, its actor type and a
// unique matching party summon skill repair ownership on its first kill.
const inferredSummonModule = { battleCamp: 0, actor: { id: 1011, skills: [] } };
const inferredSummon = { index: 14, getModule: () => inferredSummonModule };
const inferredSummonEnemy = enemy(15, 14);
context.Game.currentScene.sceneObjects[14] = inferredSummon;
context.Game.currentScene.sceneObjects[15] = inferredSummonEnemy.battler;
context.RogueKillProgress.onBattlerDie(inferredSummonEnemy.battler, inferredSummonEnemy.module);
assert.strictEqual(inferredSummonModule.__rogueOwnerIndex, owner.index);
assert.strictEqual(inferredSummon.__rogueOwnerIndex, owner.index);
assert.strictEqual(state.killCount, 9);
assert.strictEqual(state.rewardQueue.length, 9);
assert.strictEqual(state.rewardQueue[8].killOwnerPartyIndex, 0);

const summonLimitContext = vm.createContext({ console });
const summonerModule = { battleCamp: 0 };
const livingSummonModule = { battleCamp: 0, isDead: false, actor: { id: 1011, hp: 10 } };
const summoner = { getModule: () => summonerModule };
const summonedCreature = { getModule: () => livingSummonModule };
summonLimitContext.Game = { currentScene: { sceneObjects: [summonedCreature] } };
loadClass(summonLimitContext, "Game/game/project/battle/GameBattleHelper.ts", "GameBattleHelper");
assert.strictEqual(summonLimitContext.GameBattleHelper.canCreateSummon(summoner, { id: 17 }), false);
assert.strictEqual(summonLimitContext.GameBattleHelper.canCreateSummon(summoner, { id: 35 }), false,
    "alternate mushroom summon skill bypassed the one-living-summon limit");
assert.strictEqual(summonLimitContext.GameBattleHelper.canCreateSummon(summoner, { id: 36 }), true);
livingSummonModule.isDead = true;
livingSummonModule.actor.hp = 0;
assert.strictEqual(summonLimitContext.GameBattleHelper.canCreateSummon(summoner, { id: 17 }), true,
    "summon skill stayed locked after its summon was defeated");
livingSummonModule.battleCamp = 1;
livingSummonModule.isDead = false;
livingSummonModule.actor.hp = 10;
assert.strictEqual(summonLimitContext.GameBattleHelper.canCreateSummon(summoner, { id: 35 }), true,
    "an enemy summon incorrectly blocked the player's summon skill");

const rewardUIContext = vm.createContext({
    console,
    GUI_40: function () {},
    RogueRunManager: { active: true, state: { pendingRewardContinuation: "", rewardQueue: [{ status: "pending" }] } }
});
loadClass(rewardUIContext, "Game/game/project/ui/rogue/GUI_RogueReward.ts", "GUI_RogueReward");
const battleCompleteCallback = () => {};
rewardUIContext.GUI_RogueReward.setQueueCompletion(battleCompleteCallback, "battle-complete");
rewardUIContext.GUI_RogueReward.setQueueCompletion(() => {}, "action-end");
assert.strictEqual(rewardUIContext.GUI_RogueReward.onQueueComplete, battleCompleteCallback);
assert.strictEqual(rewardUIContext.RogueRunManager.state.pendingRewardContinuation, "battle-complete");
const nodeCompleteCallback = () => {};
rewardUIContext.GUI_RogueReward.setQueueCompletion(nodeCompleteCallback, "node-complete");
rewardUIContext.GUI_RogueReward.setQueueCompletion(() => {}, "battle-complete");
assert.strictEqual(rewardUIContext.GUI_RogueReward.onQueueComplete, nodeCompleteCallback);
assert.strictEqual(rewardUIContext.RogueRunManager.state.pendingRewardContinuation, "node-complete");

const serialGroups = [
    { rewardGroupID: "serial-a", status: "pending", killOwnerActorName: "Actor A", didLevelUp: true, levelFrom: 1, levelTo: 2, cards: [{ cardID: "card-a", name: "A", description: "A" }] },
    { rewardGroupID: "serial-b", status: "pending", killOwnerActorName: "Actor B", didLevelUp: true, levelFrom: 4, levelTo: 5, cards: [{ cardID: "card-b", name: "B", description: "B" }] },
    { rewardGroupID: "serial-c", status: "pending", killOwnerActorName: "Actor A", didLevelUp: true, levelFrom: 2, levelTo: 3, cards: [{ cardID: "card-c", name: "C", description: "C" }] }
];
rewardUIContext.RogueRunManager.state.rewardQueue = serialGroups;
rewardUIContext.RogueRewardResolver = {
    removeConfirmedRewards: () => {
        rewardUIContext.RogueRunManager.state.rewardQueue = rewardUIContext.RogueRunManager.state.rewardQueue.filter(group => group.status !== "confirmed");
    },
    getOwnerActorName: () => "",
    confirmReward: (groupID, cardID) => {
        const group = rewardUIContext.RogueRunManager.state.rewardQueue.find(entry => entry.rewardGroupID === groupID);
        if (!group || !group.cards.some(card => card.cardID === cardID)) return false;
        group.status = "confirmed";
        return true;
    }
};
let serialQueueCompleteCount = 0;
rewardUIContext.GameUI = { hide: () => {} };
rewardUIContext.RogueRewardContinuation = { resume: () => {} };
rewardUIContext.GUI_RogueReward.onQueueComplete = () => serialQueueCompleteCount++;
const rewardUI = Object.create(rewardUIContext.GUI_RogueReward.prototype);
rewardUI.titleText = { text: "" };
rewardUI.cardButtons = [{}, {}, {}];
rewardUI.cardDescriptions = [{}, {}, {}];
rewardUI.showNextGroup();
assert.strictEqual(rewardUI.currentGroup.rewardGroupID, "serial-a");
assert(rewardUI.titleText.text.includes("Actor A的战利品  Lv.1→2"));
rewardUI.confirmSelection();
assert.strictEqual(rewardUI.currentGroup.rewardGroupID, "serial-b");
rewardUI.confirmSelection();
assert.strictEqual(rewardUI.currentGroup.rewardGroupID, "serial-c");
rewardUI.confirmSelection();
assert.strictEqual(serialQueueCompleteCount, 1);
assert.strictEqual(rewardUIContext.RogueRunManager.state.rewardQueue.length, 0);

const shownUIs = [];
context.GameUI = { show: id => shownUIs.push(id) };
context.GUI_RogueResult = { result: "" };
context.ClientScene = { EVENT_IN_NEW_SCENE: "new-scene" };
context.EventUtils = { happen: () => {} };
context.Game.player = { sceneObject: { x: 0, y: 0 }, data: { sceneObject: { x: 0, y: 0 } } };
let deferNodeCompletion = true;
let resumeNodeCompletion = null;
context.RogueRewardPresenter = {
    presentPending: (callback, continuation) => {
        if (!deferNodeCompletion) return false;
        assert.strictEqual(continuation, "node-complete");
        resumeNodeCompletion = callback;
        return true;
    }
};
loadClass(context, "Game/game/project/rogue/RogueSceneDirector.ts", "RogueSceneDirector");
context.RogueSceneDirector.onBattleStopped(true);
assert.strictEqual(state.currentNodeID, "battle-a");
assert.deepStrictEqual(shownUIs, []);
deferNodeCompletion = false;
resumeNodeCompletion();
assert.strictEqual(state.currentNodeID, "battle-b");
assert.strictEqual(state.floorIndex, 1);
context.RogueSceneDirector.onBattleStopped(true);
assert.strictEqual(state.currentNodeID, "battle-b");
assert.deepStrictEqual(shownUIs, [41]);
context.Game.currentScene.id = 18;
context.RogueSceneDirector.onBattleStopped(true);
assert.strictEqual(state.currentNodeID, "boss");
assert.strictEqual(state.floorIndex, 2);
for (const [nodeID, sceneID, nextNodeID, floorIndex] of [
    ["boss", 19, "battle-c", 3],
    ["battle-c", 20, "battle-d", 4],
    ["battle-d", 21, "boss-2", 5],
    ["boss-2", 23, "battle-e", 6],
    ["battle-e", 22, "battle-f", 7],
    ["battle-f", 17, "boss-3", 8]
]) {
    state.currentNodeID = nodeID;
    context.Game.currentScene.id = sceneID;
    context.RogueSceneDirector.onBattleStopped(true);
    assert.strictEqual(state.currentNodeID, nextNodeID);
    assert.strictEqual(state.floorIndex, floorIndex);
}
context.Game.currentScene.id = 24;
let finalNodeSaveCount = 0;
let finalNodeLevelUpCount = 0;
context.RogueRunManager.saveProgress = () => finalNodeSaveCount++;
context.Game.player.data.party = [{}, {}];
context.ProjectPlayer.increaseLevelByIndex = () => finalNodeLevelUpCount++;
context.RogueSceneDirector.onBattleStopped(true);
assert.strictEqual(context.GUI_RogueResult.result, "completed");
assert.strictEqual(finalNodeLevelUpCount, 2);
assert.strictEqual(finalNodeSaveCount, 1);
context.RogueSceneDirector.onBattleStopped(true);
assert.strictEqual(finalNodeLevelUpCount, 2, "final node was settled twice");
assert.strictEqual(finalNodeSaveCount, 1, "final node queued a duplicate save");
context.RogueSceneDirector.onBattleStopped(false);
assert.strictEqual(context.GUI_RogueResult.result, "completed", "late failure event overwrote final victory");

for (const [nodeID, sceneID, position] of [
    ["battle-a", 21, { x: 552, y: 984 }],
    ["battle-b", 17, { x: 840, y: 1032 }],
    ["boss", 23, { x: 936, y: 1032 }]
]) {
    state.currentNodeID = nodeID;
    state.nodeSceneIDs[nodeID] = sceneID;
    context.RogueSceneDirector.enterCurrentNode();
    assert.deepStrictEqual(context.Game.player.sceneObject, position);
    assert.deepStrictEqual(context.Game.player.data.sceneObject, position);
}

// Spawn markers are authored in server scene data. The director must honor
// those coordinates when a map is regenerated, and use its deployment area
// when an older map has no marker at all.
context.Game.data = {
    sceneList: {
        data: {
            21: {
                mapData: {
                    width: 1152,
                    height: 1152,
                    dataLayers: [[], [], [], [[], [], [], [], [], [], [], [], [], [], [], [0, 1]]]
                },
                sceneObjectData: {
                    sceneObjects: [{ name: "肉鸽出生点", x: 600, y: 888 }]
                }
            },
            22: {
                mapData: {
                    width: 1152,
                    height: 1152,
                    dataLayers: [[], [], [], [[], [], [], [], [], [], [], [], [], [], [], [0, 1]]]
                },
                sceneObjectData: { sceneObjects: [] }
            }
        }
    }
};
state.currentNodeID = "battle-a";
state.nodeSceneIDs["battle-a"] = 21;
context.RogueSceneDirector.enterCurrentNode();
assert.deepStrictEqual(context.Game.player.data.sceneObject, { x: 600, y: 888 });
state.nodeSceneIDs["battle-a"] = 22;
context.RogueSceneDirector.enterCurrentNode();
assert.deepStrictEqual(context.Game.player.data.sceneObject, { x: 552, y: 72 });
delete context.Game.data;

state.currentNodeID = "battle-a";
state.nodeSceneIDs["battle-a"] = 17;
context.Game.currentScene.id = 17;
const scaledEnemy = { battleCamp: 1, level: 2, actor: { skills: [] } };
state.floorIndex = 0;
context.RogueSceneDirector.applyEnemyLevel(scaledEnemy);
assert.strictEqual(scaledEnemy.level, 2);
const firstFloorAttributes = { MaxHP: 500, ATK: 160, MAG: 0, DEF: 20, MagDef: 0 };
context.RogueSceneDirector.applyEnemyAttributeBalance(scaledEnemy.actor, firstFloorAttributes);
assert.deepStrictEqual(firstFloorAttributes, { MaxHP: 225, ATK: 25, MAG: 0, DEF: 10, MagDef: 0 });
assert((Math.max(1, firstFloorAttributes.ATK - 8) * 6) < 160,
    "six first-floor enemies can defeat full-health Xiaomei in one normal-attack round");
state.floorIndex = 1;
context.RogueSceneDirector.applyEnemyLevel(scaledEnemy);
assert.strictEqual(scaledEnemy.level, 5);
const secondFloorAttributes = { MaxHP: 500, ATK: 160, MAG: 0, DEF: 20, MagDef: 0 };
context.RogueSceneDirector.applyEnemyAttributeBalance(scaledEnemy.actor, secondFloorAttributes);
assert(secondFloorAttributes.MaxHP > firstFloorAttributes.MaxHP);
assert(secondFloorAttributes.ATK > firstFloorAttributes.ATK);
state.floorIndex = 8;
context.RogueSceneDirector.applyEnemyLevel(scaledEnemy);
assert.strictEqual(scaledEnemy.level, 26);

const rewardContext = vm.createContext({ console });
let addedItems = 0;
let saveCount = 0;
const rewardState = {
    runID: "reward-run",
    rewardQueue: [{
        rewardGroupID: "group-1",
        status: "pending",
        killOwnerUID: "",
        cards: [{ cardID: "card-1", type: "consumable", sourceModuleID: 1, sourceDefinitionID: 999, quantity: 3, effectSnapshot: { id: 999 } }]
    }],
    completedTransactionIDs: [],
    temporaryEquipments: [],
    temporarySkills: []
};
rewardContext.RogueRunManager = {
    active: true,
    state: rewardState,
    syncRuntimeState: () => {},
    EVENT_RUN_STATE_CHANGED: "changed"
};
rewardContext.GameData = {
    getModuleData: () => null,
    changeModuleDataToCopyMode: () => {},
    newModuleData: () => null
};
rewardContext.ObjectUtils = {
    depthClone: value => JSON.parse(JSON.stringify(value)),
    clone: (source, target) => Object.assign(target, source)
};
rewardContext.ProjectPlayer = { addItemByInstance: () => addedItems++ };
rewardContext.EventUtils = { happen: () => {} };
rewardContext.GUI_SaveFileManager = {
    currentSveFileIndexInfo: { id: 1 },
    saveFile: () => saveCount++
};
loadClass(rewardContext, "Game/game/project/rogue/RogueRewardResolver.ts", "RogueRewardResolver");
assert.strictEqual(rewardContext.RogueRewardResolver.confirmReward("group-1", "card-1"), true);
assert.strictEqual(rewardContext.RogueRewardResolver.confirmReward("group-1", "card-1"), false);
assert.strictEqual(addedItems, 3);
assert.strictEqual(saveCount, 1);
assert.strictEqual(rewardState.completedTransactionIDs.length, 1);

const poolContext = vm.createContext({ console });
poolContext.ObjectUtils = { depthClone: value => JSON.parse(JSON.stringify(value)) };
poolContext.GameData = {
    getModuleData: (moduleID, dataID) => moduleID === 8 ? {
        id: dataID,
        name: "技能" + dataID,
        intro: "测试技能",
        icon: "test.png"
    } : moduleID === 1 ? {
        id: dataID,
        name: "物品" + dataID,
        intro: "测试物品",
        icon: "test.png"
    } : null
};
poolContext.RogueRunManager = {
    active: true,
    state: { runID: "pool-run", seed: 1, floorIndex: 0, killCount: 0, cardPoolVersion: 1, contentVersion: 1 },
    nextTransactionID: type => "tx:" + type
};
loadClass(poolContext, "Game/game/project/rogue/RogueRewardPool.ts", "RogueRewardPool");
const enemyIDs = new Set();
const enemySnapshots = {};
const earlyItemIDs = new Set();
for (let i = 0; i < 300; i++) {
    poolContext.RogueRunManager.state.seed = i + 1;
    poolContext.RogueRunManager.state.killCount = i;
    const group = poolContext.RogueRewardPool.createRewardGroup("dead:" + i, "owner");
    const enemyCards = group.cards.filter(card => card.enemySkill);
    const itemCards = group.cards.filter(card => card.type === "consumable");
    assert(enemyCards.length <= 1, "reward group contains multiple enemy skills");
    assert(itemCards.length <= 1, "reward group contains multiple consumables");
    itemCards.forEach(card => earlyItemIDs.add(card.sourceDefinitionID));
    enemyCards.forEach(card => {
        enemyIDs.add(card.sourceDefinitionID);
        enemySnapshots[card.sourceDefinitionID] = card.effectSnapshot;
    });
}
assert.strictEqual(enemyIDs.size, 18, "not all enemy skills are registered in the reward pool");
assert(Array.from(earlyItemIDs).every(id => [2, 3, 4, 6, 12, 13, 14, 17, 18].includes(id)),
    "an item appeared before its minimum floor");
assert.strictEqual(enemySnapshots[1001].icon, "asset/image/picture/icon/skill/Shadow_single.png");
assert.strictEqual(enemySnapshots[1003].costSP, 25);
assert.strictEqual(enemySnapshots[1008].costSP, 45);
assert.strictEqual(enemySnapshots[1008].additionMultiple, 160);
assert.strictEqual(enemySnapshots[1011].elementType, 4);
assert.strictEqual(enemySnapshots[1014].costSP, 35);
assert.strictEqual(enemySnapshots[1014].additionMultiple, 160);
assert.strictEqual(enemySnapshots[1016].costSP, 65);
assert.strictEqual(enemySnapshots[1017].costSP, 85);
assert.strictEqual(enemySnapshots[1018].costSP, 45);

const lateItemIDs = new Set();
poolContext.RogueRunManager.state.floorIndex = 8;
poolContext.RogueRunManager.state.currentNodeID = "boss-3";
for (let i = 0; i < 2000; i++) {
    poolContext.RogueRunManager.state.seed = 10000 + i;
    poolContext.RogueRunManager.state.killCount = i;
    const group = poolContext.RogueRewardPool.createRewardGroup("late:" + i, "owner");
    const itemCards = group.cards.filter(card => card.type === "consumable");
    assert(itemCards.length <= 1, "late reward group contains multiple consumables");
    itemCards.forEach(card => lateItemIDs.add(card.sourceDefinitionID));
}
for (let itemID = 2; itemID <= 25; itemID++) {
    assert(lateItemIDs.has(itemID), "late reward pool did not produce item " + itemID);
}

const upgradeContext = vm.createContext({ console });
upgradeContext.RogueRunManager = {
    active: true,
    state: { skillUpgrades: [] }
};
loadClass(upgradeContext, "Game/game/project/rogue/RogueSkillUpgradeSystem.ts", "RogueSkillUpgradeSystem");
const upgradeBase = { id: 1002, costSP: 25, totalCD: 3, useDamage: true, additionMultiple: 125, effectRange1: 4 };
const upgradedSkill = JSON.parse(JSON.stringify(upgradeBase));
assert.strictEqual(upgradeContext.RogueSkillUpgradeSystem.learn(0, 1002, upgradedSkill, upgradeBase), "learned");
assert.strictEqual(upgradeContext.RogueSkillUpgradeSystem.duplicate(0, 1002, upgradedSkill, upgradeBase), "upgraded");
assert.strictEqual(upgradeContext.RogueSkillUpgradeSystem.getLevel(0, 1002), 2);
assert.strictEqual(upgradedSkill.costSP, 22);
assert.strictEqual(upgradeContext.RogueSkillUpgradeSystem.duplicate(0, 1002, upgradedSkill, upgradeBase), "upgraded");
assert.strictEqual(upgradeContext.RogueSkillUpgradeSystem.getLevel(0, 1002), 3);
assert.strictEqual(upgradeContext.RogueSkillUpgradeSystem.duplicate(0, 1002, upgradedSkill, upgradeBase), "maxed");

const duplicateRewardContext = vm.createContext({ console });
duplicateRewardContext.ObjectUtils = {
    depthClone: value => JSON.parse(JSON.stringify(value)),
    clone: (source, target) => Object.assign(target, source)
};
duplicateRewardContext.RogueRunManager = {
    active: true,
    state: {
        runID: "duplicate-run",
        skillUpgrades: [{ actorIndex: 1, skillID: 1002, level: 1 }],
        temporarySkills: [{ actorIndex: 1, skill: JSON.parse(JSON.stringify(upgradeBase)), baseSkill: JSON.parse(JSON.stringify(upgradeBase)) }],
        rewardQueue: [{ rewardGroupID: "duplicate-group", status: "pending", killOwnerUID: "", killOwnerPartyIndex: 1, killOwnerActorID: 102, cards: [{ cardID: "duplicate-card", type: "activeSkill", sourceModuleID: 8, sourceDefinitionID: 1002, effectSnapshot: JSON.parse(JSON.stringify(upgradeBase)) }] }],
        completedTransactionIDs: [],
        lastTransactionID: ""
    },
    syncRuntimeState: () => {},
    EVENT_RUN_STATE_CHANGED: "changed"
};
duplicateRewardContext.Game = {
    currentScene: null,
    getActorSkillBySkillID: () => duplicateRewardContext.actorSkill
};
duplicateRewardContext.actorSkill = JSON.parse(JSON.stringify(upgradeBase));
duplicateRewardContext.requestedPartyIndexes = [];
duplicateRewardContext.ProjectPlayer = {
    getPlayerActorDSByInPartyIndex: index => {
        duplicateRewardContext.requestedPartyIndexes.push(index);
        return index === 1 ? { actor: duplicateRewardContext.actorSkillOwner } : null;
    },
    increaseGold: () => {}
};
duplicateRewardContext.actorSkillOwner = { id: 102, skills: [duplicateRewardContext.actorSkill] };
duplicateRewardContext.GameData = { changeModuleDataToCopyMode: () => {} };
duplicateRewardContext.EventUtils = { happen: () => {} };
duplicateRewardContext.GUI_SaveFileManager = { currentSveFileIndexInfo: null };
loadClass(duplicateRewardContext, "Game/game/project/rogue/RogueSkillUpgradeSystem.ts", "RogueSkillUpgradeSystem");
loadClass(duplicateRewardContext, "Game/game/project/rogue/RogueRewardResolver.ts", "RogueRewardResolver");
assert.strictEqual(duplicateRewardContext.RogueRewardResolver.confirmReward("duplicate-group", "duplicate-card"), true);
assert.strictEqual(duplicateRewardContext.RogueRunManager.state.skillUpgrades[0].level, 2);
assert.strictEqual(duplicateRewardContext.actorSkill.costSP, 22);
assert.deepStrictEqual(Array.from(duplicateRewardContext.requestedPartyIndexes), [1, 1]);

const packageContext = vm.createContext({ console });
packageContext.GUI_4 = function () {};
packageContext.GameData = {
    newModuleData: (moduleID, statusID) => moduleID === 10 ? {
        id: statusID, currentLayer: 1, maxlayer: 1, currentDuration: 0, totalDuration: 4
    } : null
};
loadClass(packageContext, "Game/game/project/ui/GUI_Package.ts", "GUI_Package");
const packageActor = {
    hp: 40, MaxHP: 100, sp: 10, MaxSP: 50,
    selfImmuneStatus: [], status: [{ id: 6 }, { id: 3 }]
};
packageContext.GUI_Package.prototype.applyNonBattleItemEffect.call({}, packageActor, {
    recoveryHP: 30, recoverySP: 20, removeStatus: [6], addStatus: [16]
});
assert.strictEqual(packageActor.hp, 70);
assert.strictEqual(packageActor.sp, 30);
assert.deepStrictEqual(Array.from(packageActor.status.map(status => status.id)), [3, 16]);
assert.strictEqual(packageActor.status[1].currentDuration, 4);

console.log("Roguelike logic tests passed: migration, isolation, random 9-node flow, level scaling, rewards, enemy skill pool and idempotency.");
