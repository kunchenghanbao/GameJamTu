const assert = require("assert");
const fs = require("fs");
const ts = require("typescript");
const vm = require("vm");

function loadClass(context, file, className) {
    const source = fs.readFileSync(file, "utf8") + "\nglobalThis." + className + " = " + className + ";";
    const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES5 } }).outputText;
    vm.runInContext(js, context, { filename: file });
}

const skillNames = JSON.parse(fs.readFileSync("asset/json/custom/customModule/customModuleDataList8.json", "utf8")).list["1"];
const statusNames = JSON.parse(fs.readFileSync("asset/json/custom/customModule/customModuleDataList10.json", "utf8")).list["1"];
for (let id = 41; id <= 81; id++) {
    const skill = JSON.parse(fs.readFileSync("asset/json/custom/customModule/8/cm" + id + ".json", "utf8"));
    assert.strictEqual(skill.id, id);
    assert(skillNames[id]);
    assert(fs.existsSync(skill.attrs.icon.value), "missing icon for skill " + id);
}
for (let id = 27; id <= 34; id++) {
    const status = JSON.parse(fs.readFileSync("asset/json/custom/customModule/10/cm" + id + ".json", "utf8"));
    assert.strictEqual(status.id, id);
    assert(statusNames[id]);
    assert(fs.existsSync(status.attrs.icon.value), "missing icon for status " + id);
}
for (let id = 43; id <= 45; id++) {
    const status = JSON.parse(fs.readFileSync("asset/json/custom/customModule/10/cm" + id + ".json", "utf8"));
    assert.strictEqual(status.id, id);
    assert(statusNames[id]);
    assert(fs.existsSync(status.attrs.icon.value), "missing icon for status " + id);
}

const statusDefinitions = {
    3: { maxlayer: 1, totalDuration: 2 }, 4: { maxlayer: 1, totalDuration: 1 },
    13: { maxlayer: 1, totalDuration: 2 }, 15: { maxlayer: 1, totalDuration: 2 },
    37: { maxlayer: 1, totalDuration: 2 }, 38: { maxlayer: 1, totalDuration: 2 },
    39: { maxlayer: 1, totalDuration: 2 }, 40: { maxlayer: 1, totalDuration: 2 },
    41: { maxlayer: 3, totalDuration: 0 }, 42: { maxlayer: 1, totalDuration: 2 },
    27: { maxlayer: 5, totalDuration: 0 }, 28: { maxlayer: 1, totalDuration: 2 }, 29: { maxlayer: 1, totalDuration: 0 },
    43: { maxlayer: 3, totalDuration: 0 }, 44: { maxlayer: 1, totalDuration: 2 }, 45: { maxlayer: 1, totalDuration: 1 }
};

function createBattler(index, camp, x, y, skillIDs = []) {
    const actor = { hp: 100, MaxHP: 100, MAG: 50, status: [], skills: skillIDs.map(id => ({ id })) };
    const module = { actor, battleCamp: camp, isDead: false };
    return { index, posGrid: { x, y }, module, getModule: () => module };
}

const player = createBattler(1, 0, 0, 0, [41, 44, 45, 46, 47]);
const enemy = createBattler(2, 1, 1, 0);
const nearbyEnemy = createBattler(3, 1, 2, 0);
const itemPlayer = createBattler(4, 0, 0, 1);
const context = vm.createContext({ console });
context.RogueRunManager = { active: true };
context.GameBattle = { battleRound: 1 };
context.Game = {
    currentScene: { sceneObjects: [null, player, enemy, nearbyEnemy, itemPlayer] },
    refreshActorAttribute: () => {}
};
context.GameBattleHelper = {
    isBattler: value => !!value && !!value.module,
    isInPlayerParty: value => value.module.battleCamp === 0,
    isHostileRelationship: (a, b) => a.module.battleCamp !== b.module.battleCamp,
    isIncludeStatus: (battler, id) => battler.module.actor.status.some(status => status.id === id),
    getLevelByActor: () => 1
};
context.GameBattleData = {
    addStatus: (battler, id) => {
        const actor = battler.module.actor;
        let status = actor.status.find(value => value.id === id);
        if (!status) {
            const definition = statusDefinitions[id] || { maxlayer: 1, totalDuration: 2 };
            status = { id, currentLayer: 1, maxlayer: definition.maxlayer, currentDuration: definition.totalDuration };
            actor.status.push(status);
        }
        else status.currentLayer = Math.min(status.maxlayer, status.currentLayer + 1);
        return true;
    },
    removeStatus: (battler, id) => {
        const index = battler.module.actor.status.findIndex(status => status.id === id);
        if (index < 0) return false;
        battler.module.actor.status.splice(index, 1);
        return true;
    },
    changeBattlerHP: (battler, value) => {
        battler.module.actor.hp = Math.max(0, Math.min(battler.module.actor.MaxHP, battler.module.actor.hp + value));
    }
};

loadClass(context, "Game/game/project/rogue/RogueSkillSynergySystem.ts", "RogueSkillSynergySystem");
const system = context.RogueSkillSynergySystem;

system.onUseSkill(player, { id: 41 }, [enemy], true);
assert.strictEqual(player.module.actor.hp, 90);
enemy.module.actor.hp = 0;
system.afterHit(player, enemy, 1, { id: 41, elementType: 9 }, { damage: -50 }, { frozen: false, burning: false });
assert(player.module.actor.hp > 90, "blood drain did not heal");
assert(player.module.actor.status.some(status => status.id === 27), "blood rage was not added");

// 81 is a passive that must work when learned by a non-native actor.
player.module.actor.skills = [{ id: 81 }, { id: 47 }];
player.module.actor.hitTargetSelfAddStatus = [];
player.module.actor.status = [];
system.afterHit(player, enemy, 0, null, { damage: -20 }, { frozen: false, burning: false });
assert.strictEqual(player.module.actor.status.find(status => status.id === 43).currentLayer, 1,
    "drunken mastery did not grant momentum on a normal attack");

player.module.actor.hp = 10;
const protectedDamage = system.preventLethalDamage(player, -50);
assert.strictEqual(protectedDamage, -9);
assert(player.module.__rogueUndyingUsed);
assert(player.module.actor.status.some(status => status.id === 28));

enemy.module.actor.hp = 100;
nearbyEnemy.module.actor.hp = 100;
enemy.module.actor.status = [{ id: 4, currentLayer: 1, maxlayer: 1 }];
const superconduct = system.afterHit(player, enemy, 1, { id: 50, elementType: 3 }, { damage: -20 }, { frozen: true, burning: false });
assert.strictEqual(superconduct.length, 2);
assert(!enemy.module.actor.status.some(status => status.id === 4));
assert(enemy.module.actor.status.some(status => status.id === 13));

enemy.module.actor.status = [{ id: 3, currentLayer: 1, maxlayer: 1 }];
const explosion = system.afterHit(player, enemy, 1, { id: 53, elementType: 9 }, { damage: -40 }, { frozen: false, burning: true });
assert.strictEqual(explosion.length, 2);
assert.strictEqual(explosion[0].damage, -20);
assert(!enemy.module.actor.status.some(status => status.id === 3));

assert.strictEqual(system.canUseItem(itemPlayer, { id: 22 }), true);
context.GameBattleData.addStatus(itemPlayer, 29);
assert.strictEqual(system.canUseItem(itemPlayer, { id: 22 }), true);
assert.strictEqual(system.canUseItemOnTarget(player, itemPlayer, { id: 22 }), false);
assert.strictEqual(system.isSelfTargetItem({ id: 23 }), true);
assert.strictEqual(system.canUseItemOnTarget(player, itemPlayer, { id: 23 }), false);
assert.strictEqual(system.canUseItemOnTarget(player, player, { id: 23 }), true);
itemPlayer.module.actor.hp = 10;
assert.strictEqual(system.preventLethalDamage(itemPlayer, -50), -9);
assert(!itemPlayer.module.actor.status.some(status => status.id === 28), "item lock should not grant the skill-only blood bonus");

enemy.module.actor.hp = 100;
nearbyEnemy.module.actor.hp = 100;
enemy.module.actor.status = [];
nearbyEnemy.module.actor.status = [];
const flameItem = system.afterHit(player, player, 2, null, null, null, { id: 23 });
assert.strictEqual(flameItem.length, 1);
assert(enemy.module.actor.status.some(status => status.id === 3));
assert.strictEqual(enemy.module.actor.status.find(status => status.id === 3).currentDuration, 2);

enemy.module.actor.status = [{ id: 4, currentLayer: 1, maxlayer: 1 }];
nearbyEnemy.module.actor.status = [];
const iceThunderItem = system.afterHit(player, player, 2, null, null, null, { id: 24 });
assert.strictEqual(iceThunderItem.filter(effect => effect.reaction === "item-lightning").length, 2);
assert.strictEqual(iceThunderItem.filter(effect => effect.reaction === "superconduct").length, 2);
assert(!enemy.module.actor.status.some(status => status.id === 4));

player.module.actor.hp = 100;
player.module.actor.status = [];
system.afterHit(player, player, 2, null, null, null, { id: 25 });
assert.strictEqual(player.module.actor.hp, 80);
assert.strictEqual(player.module.actor.status.find(status => status.id === 27).currentLayer, 2);
assert(player.module.actor.status.some(status => status.id === 28));

// 61-75 sword, ember, tactical and barrier hooks.
player.module.actor.skills = [61, 63, 66, 72, 73, 74, 75].map(id => ({ id }));
enemy.module.actor.status = [{ id: 4, currentLayer: 1, maxlayer: 1 }];
system.beginAction(player);
const frostMultiplier = system.getDamageMultiplier(player, { id: 61 }, enemy, 1);
assert.strictEqual(frostMultiplier, 1.4850000000000003);
system.afterHit(player, enemy, 1, { id: 61, elementType: 9 }, { damage: -20 }, { frozen: true, burning: false });
assert(player.module.actor.status.some(status => status.id === 41), "frost sword did not grant sword momentum");
assert(system.getDamageMultiplier(player, { id: 65 }, enemy, 1) > 1, "sword momentum did not amplify finisher");
const finisher = { id: 65 };
system.onUseSkill(player, finisher, [enemy], true);
assert(system.getDamageMultiplier(player, finisher, enemy, 1) > 1.1, "finisher snapshot did not preserve sword momentum");
assert(!player.module.actor.status.some(status => status.id === 41), "finisher did not consume sword momentum");

enemy.module.actor.status = [{ id: 3, currentLayer: 1, maxlayer: 1 }];
system.beginAction(player);
system.afterHit(player, enemy, 1, { id: 52, elementType: 1 }, { damage: -20 }, { frozen: false, burning: false });
assert(enemy.module.actor.status.some(status => status.id === 40), "ember echo was not armed");
const emberMultiplier = system.getDamageMultiplier(player, { id: 50, elementType: 3 }, enemy, 1);
assert.strictEqual(emberMultiplier, 1.4300000000000002);
system.afterHit(player, enemy, 1, { id: 50, elementType: 3 }, { damage: -10 }, { frozen: false, burning: true });
assert(!enemy.module.actor.status.some(status => status.id === 40), "ember echo was not consumed");

enemy.module.actor.status = [{ id: 39, currentLayer: 1, maxlayer: 1, fromBattlerID: player.index }];
assert(system.getDamageMultiplier(player, { id: 64, elementType: 9 }, enemy, 1) > 1, "tactical mark did not amplify sword damage");
player.module.actor.status = [{ id: 37, currentLayer: 1, maxlayer: 1 }];
assert.strictEqual(system.absorbDamage(player, -50), -30);
assert(!player.module.actor.status.some(status => status.id === 37), "barrier was not consumed");

const actionSource = fs.readFileSync("Game/game/project/battle/GameBattleAction.ts", "utf8");
const synergyCallIndex = actionSource.indexOf("let synergyEffects = RogueSkillSynergySystem.afterHit");
const guardedResultIndex = actionSource.indexOf("if (res)", synergyCallIndex);
assert(synergyCallIndex >= 0 && guardedResultIndex > synergyCallIndex,
    "tactical item synergy is still guarded by an empty built-in hit result");

const worldData = JSON.parse(fs.readFileSync("asset/json/custom/customWorldData.json", "utf8"));
assert.strictEqual(worldData.attrs.actorItemAllowToOthers.value, true);
const swiftStatus = JSON.parse(fs.readFileSync("asset/json/custom/customModule/10/cm16.json", "utf8"));
assert.strictEqual(swiftStatus.attrs.moveGridPer.value, 125);
const magicGuardStatus = JSON.parse(fs.readFileSync("asset/json/custom/customModule/10/cm14.json", "utf8"));
assert.strictEqual(magicGuardStatus.attrs.totalDuration.value, 3);

console.log("Roguelike skill tests passed: skills, blood flow, reactions and tactical consumables.");
