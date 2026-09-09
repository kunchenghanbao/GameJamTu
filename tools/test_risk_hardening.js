"use strict";

var assert = require("assert");
var crypto = require("crypto");
var fs = require("fs");
var path = require("path");
var ts = require("typescript");
var vm = require("vm");

var root = path.resolve(__dirname, "..");

function read(relativePath) {
    return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function loadClass(context, relativePath, className) {
    var source = read(relativePath) + "\nglobalThis." + className + " = " + className + ";";
    var output = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES5 } }).outputText;
    vm.runInContext(output, context, { filename: relativePath });
}

function createManagerContext(saveInfos, currentSave) {
    var saveCalls = [];
    var gateListeners = [];
    var context = vm.createContext({ console: console, setTimeout: setTimeout, clearTimeout: clearTimeout });
    context.ObjectUtils = { depthClone: function (value) { return JSON.parse(JSON.stringify(value)); } };
    context.EventUtils = {
        happen: function () { },
        addEventListenerFunction: function (target, event, fn, thisArg) { gateListeners.push({ fn: fn, thisArg: thisArg }); },
        removeEventListenerFunction: function (target, event, fn, thisArg) {
            gateListeners = gateListeners.filter(function (entry) { return entry.fn !== fn || entry.thisArg !== thisArg; });
        }
    };
    context.Callback = {
        New: function (fn, thisArg) {
            return {
                run: function () { return fn.call(thisArg); },
                runWith: function (args) { return fn.apply(thisArg, args || []); }
            };
        }
    };
    context.WorldData = {
        saveFileMax: 3,
        fullStateWhenBattleStart: true,
        battleScene: 3,
        battleReadyBGM: "ready.ogg",
        battleBGM: "battle.ogg",
        battleSceneBGM: "scene.ogg"
    };
    context.GameGate = {
        gateState: 4,
        STATE_3_IN_SCENE_COMPLETE: 3,
        EVENT_IN_SCENE_STATE_CHANGE: "gate-change"
    };
    context.Game = {
        currentScene: { id: 17 },
        player: {
            data: { gold: 10, package: [], party: [], marker: "normal" },
            variable: { variables: [1], switchs: [2], strings: ["normal"] }
        }
    };
    context.SinglePlayerGame = {
        getSaveInfo: function () { return saveInfos.slice(); },
        getSaveInfoByID: function (id) { return saveInfos.filter(function (info) { return info.id === id; })[0] || null; },
        saveGame: function (id, callback) { saveCalls.push({ id: id, callback: callback }); }
    };
    context.GUI_SaveFileManager = {
        currentSveFileIndexInfo: currentSave || null,
        saveFile: function (id, executeEvent, callback) {
            if (!context.SinglePlayerGame.getSaveInfoByID(id)) saveInfos.push({ id: id });
            saveCalls.push({
                id: id,
                callback: callback,
                rogueData: context.RogueRunManager.getSaveData()
            });
        }
    };
    loadClass(context, "Game/game/project/rogue/RogueRunState.ts", "RogueRunState");
    loadClass(context, "Game/game/project/rogue/RogueRunManager.ts", "RogueRunManager");
    return {
        context: context,
        saveCalls: saveCalls,
        fireGate: function () {
            gateListeners.slice().forEach(function (entry) { entry.fn.call(entry.thisArg); });
        },
        listenerCount: function () { return gateListeners.length; }
    };
}

/* Bursts are coalesced to the current write plus one latest snapshot. */
var setup = createManagerContext([], null);
var run = setup.context.RogueRunManager.startNewRun(123);
assert(run, "run should start when a free save slot exists");
assert.strictEqual(setup.saveCalls.length, 1, "new run should start one save");
setup.context.RogueRunManager.saveProgress();
setup.context.RogueRunManager.saveProgress();
setup.context.RogueRunManager.saveProgress();
assert.strictEqual(setup.saveCalls.length, 1, "save burst queued more than one in-flight write");
setup.saveCalls[0].callback.runWith([true]);
assert.strictEqual(setup.saveCalls.length, 2, "latest coalesced snapshot was not flushed");
setup.saveCalls[1].callback.runWith([true]);
assert.strictEqual(setup.saveCalls.length, 2, "save queue did not become idle");

/* Closing waits for entry scene, then persists null instead of stale active. */
setup.context.Game.player.data.marker = "rogue-only";
setup.context.RogueRunManager.finishRun();
assert.strictEqual(setup.context.Game.player.data.marker, "normal", "normal player snapshot was not restored");
assert.strictEqual(setup.saveCalls.length, 2, "cleanup saved inside the roguelike battle scene");
assert.strictEqual(setup.listenerCount(), 1, "cleanup did not wait for the scene gate");
setup.context.Game.currentScene = { id: 2 };
setup.context.GameGate.gateState = 3;
setup.fireGate();
assert.strictEqual(setup.saveCalls.length, 3, "entry-scene cleanup save was not started");
assert.strictEqual(setup.saveCalls[2].rogueData, null, "ended run was still serialized as active");
setup.saveCalls[2].callback.runWith([true]);
assert.strictEqual(setup.listenerCount(), 0, "cleanup scene listener leaked after success");

/* A full save list without a current slot must never replace slot 1. */
var fullSetup = createManagerContext([{ id: 1 }, { id: 2 }, { id: 3 }], null);
assert.strictEqual(fullSetup.context.RogueRunManager.startNewRun(456), null, "full save list should reject a new run");
assert.strictEqual(fullSetup.saveCalls.length, 0, "full save list silently overwrote an occupied slot");

/* Verify the save gate and background callback contract in source. */
var saveManagerSource = read("Game/game/project/ui/manager/GUI_SaveFileManager.ts");
assert(saveManagerSource.indexOf("GameGate.gateState == null") >= 0 &&
    saveManagerSource.indexOf("GameGate.gateState < GameGate.STATE_3_IN_SCENE_COMPLETE") >= 0,
    "save manager still compares constants instead of the live gate state");
assert(saveManagerSource.indexOf("onFin.runWith([success])") >= 0,
    "background save does not return its real success state");

/* Evaluate portable save handling on both old and capable WebView profiles. */
function createCompatContext(nativeStreams, rawDeflateSupported, failFirstZipRead) {
    if (rawDeflateSupported === undefined) rawDeflateSupported = true;
    var zipConfiguration = null;
    var context = vm.createContext({
        console: console,
        Promise: Promise,
        Uint8Array: Uint8Array,
        Uint16Array: Uint16Array,
        Uint32Array: Uint32Array,
        ArrayBuffer: ArrayBuffer,
        DataView: DataView,
        TextEncoder: TextEncoder,
        TextDecoder: TextDecoder,
        encodeURIComponent: encodeURIComponent,
        decodeURIComponent: decodeURIComponent,
        escape: escape,
        unescape: unescape,
        isFinite: isFinite,
        setTimeout: function (fn, delay) { if (!delay) fn(); return 1; },
        clearTimeout: function () { }
    });
    if (nativeStreams) {
        context.TransformStream = function () { };
        context.ReadableStream = function () { };
        context.WritableStream = function () { };
        context.CompressionStream = function (format) {
            if (!rawDeflateSupported && format === "deflate-raw") throw new TypeError("unsupported format");
        };
        context.DecompressionStream = function (format) {
            if (!rawDeflateSupported && format === "deflate-raw") throw new TypeError("unsupported format");
        };
    }
    context.__gcZipWorkerSource = "self.initCodec=function(){self.Inflate=function(){};self.Deflate=function(){};};self.addEventListener('message',function(){});";
    context.zip = { configure: function (options) { zipConfiguration = options; } };
    vm.runInContext(read("GameCreatorLib/mobile-startup-compat.js"), context, { filename: "mobile-startup-compat.js" });
    var nativeReads = 0;
    function nativeRead(data, onFin) {
        nativeReads++;
        onFin(failFirstZipRead && nativeReads === 1 ? undefined : "legacy-zip");
    }
    context.ZipManager = {
        zipCompress: function (fileName, data, onFin) { onFin("native"); },
        zipCompress2: function (fileName, data, onFin) { onFin("native"); },
        zipDeCompress: nativeRead,
        zipDeCompressText: nativeRead,
        zipDeCompress2: nativeRead
    };
    context.__gcInstallZipFallback();
    return {
        context: context,
        nativeReads: function () { return nativeReads; },
        zipConfiguration: function () { return zipConfiguration; }
    };
}

function verifyPortableRoundTrip(nativeStreams) {
    var setup = createCompatContext(nativeStreams);
    var packed;
    var restored;
    var sample = JSON.stringify({ name: "中文存档", level: 7 });
    setup.context.ZipManager.zipCompress("gcdata", sample, function (value) { packed = value; });
    assert(packed instanceof ArrayBuffer, "gcdata did not use the portable binary envelope");
    var bytes = new Uint8Array(packed);
    assert.strictEqual(String.fromCharCode.apply(null, Array.from(bytes.subarray(0, 8))), "GCPLAIN1");
    var storageText = "";
    for (var i = 0; i < bytes.length; i++) storageText += String.fromCharCode(bytes[i]);
    setup.context.ZipManager.zipDeCompressText(storageText, function (value) { restored = value; });
    assert.strictEqual(restored, sample, "portable save corrupted its UTF-8 payload");
    return setup;
}

verifyPortableRoundTrip(false);
var capable = verifyPortableRoundTrip(true);
var delegated;
capable.context.ZipManager.zipDeCompress(new Uint8Array([80, 75, 3, 4]).buffer, function (value) { delegated = value; });
assert.strictEqual(delegated, "legacy-zip", "capable WebView no longer delegates legacy ZIP saves");
assert.strictEqual(capable.nativeReads(), 1);

var partialStreams = createCompatContext(true, false);
var partialDelegated;
partialStreams.context.ZipManager.zipDeCompress(new Uint8Array([80, 75, 3, 4]).buffer, function (value) { partialDelegated = value; });
assert.strictEqual(partialDelegated, "legacy-zip", "partial WebView stopped delegating startup ZIP reads");
assert.strictEqual(partialStreams.nativeReads(), 1);
assert.strictEqual(partialStreams.zipConfiguration().useWebWorkers, false);
assert.strictEqual(partialStreams.zipConfiguration().useCompressionStream, false);
assert.strictEqual(typeof partialStreams.zipConfiguration().Inflate, "function");

var asynchronousFailure = createCompatContext(true, true, true);
var retryResult;
asynchronousFailure.context.ZipManager.zipDeCompress(new Uint8Array([80, 75, 3, 4]).buffer, function (value) { retryResult = value; });
assert.strictEqual(retryResult, "legacy-zip", "native stream failure did not retry with the software ZIP codec");
assert.strictEqual(asynchronousFailure.nativeReads(), 2);
assert.strictEqual(asynchronousFailure.zipConfiguration().useWebWorkers, false);
assert.strictEqual(asynchronousFailure.zipConfiguration().useCompressionStream, false);
assert.strictEqual(typeof asynchronousFailure.zipConfiguration().Inflate, "function");

var compatSource = read("GameCreatorLib/mobile-startup-compat.js");
for (var api of ["Math.trunc", "Math.imul", "startsWith", "endsWith", "padStart", "prototype.find", "Object.entries", "Object.fromEntries", "Number.isFinite", "GCSymbol"]) {
    assert(compatSource.indexOf(api) >= 0, "missing legacy API shim: " + api);
}

/* Mobile battle preparation confirms taps and ignores only authored spawn markers. */
var readyContext = vm.createContext({ console: console });
readyContext.GUI_21 = function () { };
loadClass(readyContext, "Game/game/project/ui/GUI_BattleReady.ts", "GUI_BattleReady");
var readyUI = Object.create(readyContext.GUI_BattleReady.prototype);
var spawnMarker = { name: "肉鸽出生点" };
var placedBattler = { name: "player-battler" };
var battleCursor = { posGrid: { x: 1, y: 1 } };
var gridSceneObjects = [[], [[], [spawnMarker, battleCursor, placedBattler]]];
readyContext.Game = {
    currentScene: {
        sceneUtils: {
            isOutsideByGrid: function () { return false; },
            gridSceneObjects: gridSceneObjects
        }
    }
};
readyContext.GameBattleHelper = { cursor: battleCursor, inSceneMouseGridPoint: { x: 3, y: 4 } };
assert.strictEqual(readyUI.deploymentCursorSceneObject, placedBattler,
    "spawn marker filtering hid a battler occupying the same deployment cell");

var mobileTapCalls = { select: 0, jump: 0, deploy: 0 };
readyContext.Browser = { onMobile: true };
readyContext.TouchCameraControl = { isPinching: false };
readyContext.GameBattle = { state: 1 };
readyContext.MouseControl = { updateSelectSceneObject: function () { mobileTapCalls.select++; } };
readyContext.GameBattleAction = {
    cursorJumpToGridPoint: function (grid) {
        assert.strictEqual(grid, readyContext.GameBattleHelper.inSceneMouseGridPoint);
        mobileTapCalls.jump++;
    }
};
readyUI.stage = {};
readyUI.changeOriState = false;
readyUI.currentChangePostionBattler = null;
readyUI.addBattlerOrRmoveBattle = function () { mobileTapCalls.deploy++; };
readyUI.onMouseDown({});
assert.deepStrictEqual(mobileTapCalls, { select: 1, jump: 1, deploy: 1 },
    "mobile preparation tap did not immediately confirm deployment");

/* Resurrection passives can succeed only once per battler in one battle. */
var resurrectionContext = vm.createContext({ console: console });
resurrectionContext.Config = { BEHAVIOR_EDIT_MODE: true };
resurrectionContext.Dictionary = function () {
    this.keys = [];
    this.clear = function () { this.keys.length = 0; };
    this.get = function () { return null; };
};
resurrectionContext.Callback = {
    New: function (fn, thisArg) {
        return { run: function () { return fn.call(thisArg); } };
    }
};
var resurrectionCalls = 0;
var resurrectionDieCalls = 0;
resurrectionContext.GameBattleHelper = {
    getResurrectionHealthPer: function () { resurrectionCalls++; return 50; },
    isBattler: function () { return true; }
};
resurrectionContext.MathUtils = { int: function (value) { return Math.floor(value); } };
resurrectionContext.GameBattleController = { init: function () { } };
resurrectionContext.GameBattleAI = { init: function () { } };
resurrectionContext.GameBattleAction = {
    init: function () { },
    execCommonDieEvent: function (battler, onFin) { onFin(); },
    execActorDieEvent: function (battler, onFin) { onFin(); },
    showDamage: function () { }
};
resurrectionContext.GameBattleData = {
    init: function () { },
    removeAllStatus: function () { },
    changeBattlerHP: function (battler, value) { battler.getModule(6).actor.hp += value; },
    refreshCampAndNewBattles: function () { },
    die: function (battler) { resurrectionDieCalls++; battler.getModule(6).isDead = true; }
};
resurrectionContext.GameCommand = {
    startCommonCommand: function (id, args, onFin) { if (onFin) onFin.run(); }
};
resurrectionContext.ProjectPlayer = {
    getPlayerActorIndexByActor: function () { return -1; }
};
var resurrectionModule = { actor: { hp: 0, MaxHP: 200 }, isDead: false };
var resurrectionBattler = {
    index: 4,
    isDisposed: false,
    battlerSetting: resurrectionModule,
    getModule: function () { return resurrectionModule; }
};
resurrectionContext.Game = { currentScene: { sceneObjects: [] } };
resurrectionContext.Game.currentScene.sceneObjects[4] = resurrectionBattler;
loadClass(resurrectionContext, "Game/game/project/battle/GameBattle.ts", "GameBattle");
resurrectionContext.GameBattle.checkBattlerIsDead(resurrectionBattler, function () { });
assert.strictEqual(resurrectionCalls, 1, "first lethal hit did not evaluate resurrection");
assert.strictEqual(resurrectionModule.actor.hp, 100, "first successful resurrection restored the wrong HP");

var resurrectionSave = resurrectionContext.GameBattle.getSaveData();
assert.deepStrictEqual(Array.from(resurrectionSave.resurrectionUsedBattlers), [4],
    "used resurrection was not persisted by scene-object index");
resurrectionContext.GameBattle.retorySaveData(resurrectionSave);
resurrectionModule.actor.hp = 0;
resurrectionModule.isDead = false;
resurrectionContext.GameBattle.checkBattlerIsDead(resurrectionBattler, function () { });
assert.strictEqual(resurrectionCalls, 1, "the same battler evaluated resurrection more than once per battle");
assert.strictEqual(resurrectionDieCalls, 1, "second lethal hit did not resolve as a normal death");

resurrectionContext.GameBattle.init({ firstActionCamp: 0 });
resurrectionModule.actor.hp = 0;
resurrectionModule.isDead = false;
resurrectionContext.GameBattle.checkBattlerIsDead(resurrectionBattler, function () { });
assert.strictEqual(resurrectionCalls, 2, "a new battle did not restore the battler's resurrection chance");
assert.strictEqual(resurrectionModule.actor.hp, 100, "resurrection failed after the new-battle reset");

/* The mobile manifest must describe the exact staged script. */
var manifest = JSON.parse(read("release/mobile/assets/www/build-manifest.json"));
var stagedScript = read("release/mobile/assets/www/script.js");
var stagedHash = crypto.createHash("sha256").update(stagedScript).digest("hex");
assert.strictEqual(manifest.scriptSha256, stagedHash, "mobile staging manifest is stale");
assert.strictEqual(require(path.join(root, "package.json")).scripts.watch, "node tools/watch_project.js",
    "npm watch still bypasses the mobile build pipeline");

console.log("Risk hardening tests passed: saves, WebView APIs, mobile deployment and mobile manifest.");
