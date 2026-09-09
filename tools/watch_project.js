/*
 * Development watcher for the canonical browser/mobile build.
 *
 * TypeScript's native --watch only refreshes out/Game.js. This watcher runs the
 * same reproducible pipeline as npm run build so the ES5 runtime, APK staging
 * script and build manifest cannot silently drift behind source edits.
 */
"use strict";

var childProcess = require("child_process");
var fs = require("fs");
var path = require("path");

var root = path.resolve(__dirname, "..");
var buildScript = path.join(root, "tools", "build_project.js");
var once = process.argv.indexOf("--once") >= 0;
var watchers = [];
var child = null;
var buildRunning = false;
var buildQueued = false;
var debounceTimer = null;
var shuttingDown = false;

function log(message) {
    process.stdout.write("[watch] " + message + "\n");
}

function runBuild(reason) {
    if (shuttingDown) return;
    if (buildRunning) {
        buildQueued = true;
        return;
    }
    buildRunning = true;
    buildQueued = false;
    log("开始完整构建" + (reason ? "（" + reason + "）" : "") + "...");
    child = childProcess.spawn(process.execPath, [buildScript], {
        cwd: root,
        stdio: "inherit"
    });
    child.on("error", function (error) {
        process.stderr.write("[watch] 无法启动构建: " + error.message + "\n");
    });
    child.on("close", function (code) {
        child = null;
        buildRunning = false;
        if (code === 0) log("构建完成，浏览器与移动端产物已同步。");
        else process.stderr.write("[watch] 构建失败（退出码 " + code + "），继续等待下一次修改。\n");
        if (once) {
            process.exitCode = code || 0;
            shutdown();
            return;
        }
        if (buildQueued) runBuild("构建期间又有文件变化");
    });
}

function queueBuild(label) {
    if (shuttingDown) return;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () {
        debounceTimer = null;
        runBuild(label);
    }, 180);
}

function watchPath(relativePath, recursive) {
    var absolutePath = path.join(root, relativePath);
    if (!fs.existsSync(absolutePath)) {
        process.stderr.write("[watch] 跳过不存在的路径: " + relativePath + "\n");
        return;
    }
    var watcher = fs.watch(absolutePath, { recursive: recursive === true }, function (eventName, fileName) {
        var changed = fileName ? path.join(relativePath, String(fileName)) : relativePath;
        queueBuild(changed.replace(/\\/g, "/"));
    });
    watcher.on("error", function (error) {
        process.stderr.write("[watch] 监听失败 " + relativePath + ": " + error.message + "\n");
    });
    watchers.push(watcher);
}

function shutdown() {
    if (shuttingDown) return;
    shuttingDown = true;
    if (debounceTimer) clearTimeout(debounceTimer);
    for (var i = 0; i < watchers.length; i++) watchers[i].close();
    watchers.length = 0;
    if (child && !child.killed) child.kill();
}

process.on("SIGINT", function () { shutdown(); });
process.on("SIGTERM", function () { shutdown(); });

if (!once) {
    watchPath("Game", true);
    watchPath("Game.html", false);
    watchPath(path.join("GameCreatorLib", "gamecreator.js"), false);
    watchPath(path.join("GameCreatorLib", "mobile-startup-compat.js"), false);
    watchPath(path.join("GameCreatorLib", "mobile-startup-postload.js"), false);
    log("正在监听项目源码；每次修改都会刷新桌面预览与移动端 staging。按 Ctrl+C 退出。");
}
runBuild("初始同步");

