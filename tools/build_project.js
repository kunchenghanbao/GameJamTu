/*
 * Reproducible project build.
 *
 * The browser, editor preview and mobile staging bundle all consume the same
 * TypeScript output: out/Game.js. Do not reintroduce per-file script tags in
 * Game.html; the old out/game/** files are legacy editor artifacts only.
 */
"use strict";

var fs = require("fs");
var path = require("path");
var childProcess = require("child_process");

var root = path.resolve(__dirname, "..");

function fail(message) {
    process.stderr.write("构建失败: " + message + "\n");
    process.exit(1);
}

function runNode(relativeScript, args) {
    var script = path.join(root, relativeScript);
    if (!fs.existsSync(script)) fail("缺少构建脚本 " + relativeScript);
    var result = childProcess.spawnSync(process.execPath, [script].concat(args || []), {
        cwd: root,
        stdio: "inherit"
    });
    if (result.error) fail(result.error.message);
    if (result.status !== 0) process.exit(result.status || 1);
}

function checkJavaScript(relativePath) {
    var absolutePath = path.join(root, relativePath);
    var result = childProcess.spawnSync(process.execPath, ["--check", absolutePath], {
        cwd: root,
        stdio: "inherit"
    });
    if (result.error) fail(result.error.message);
    if (result.status !== 0) fail(relativePath + " 语法检查失败");
}

function validateCanonicalEntry() {
    var htmlPath = path.join(root, "Game.html");
    var html = fs.readFileSync(htmlPath, "utf8");
    var refs = [];
    var pattern = /<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*><\/script>/gi;
    var match;
    while ((match = pattern.exec(html))) refs.push(match[1].replace(/\\/g, "/"));

    var projectRefs = refs.filter(function (ref) { return /(^|\/)out\//i.test(ref); });
    var canonicalProjectRef = projectRefs.length === 1
        ? path.relative(root, path.resolve(root, projectRefs[0])).replace(/\\/g, "/")
        : "";
    if (projectRefs.length !== 1 || canonicalProjectRef !== "out/Game.js") {
        fail("Game.html 必须且只能加载 out/Game.js，当前为: " + projectRefs.join(", "));
    }
    for (var i = 0; i < refs.length; i++) {
        if (/^(?:https?:)?\/\//i.test(refs[i])) continue;
        var cleanRef = refs[i].split(/[?#]/)[0];
        var target = path.resolve(root, cleanRef);
        if (!fs.existsSync(target)) fail("Game.html 引用了不存在的脚本 " + refs[i]);
    }

    var gameBundlePath = path.join(root, "out", "Game.js");
    var gameBundle = fs.readFileSync(gameBundlePath, "utf8");
    if (gameBundle.indexOf("var Game = new ProjectGame") < 0) {
        fail("out/Game.js 未包含项目入口，可能是旧产物");
    }
    var runtime = fs.readFileSync(path.join(root, "GameCreatorLib", "gamecreator.compat.js"), "utf8");
    if (!/function\s+main\s*\(/.test(runtime)) fail("兼容运行时未包含 main() 入口");
}

runNode("tools/build_mobile_compat.js");
checkJavaScript("GameCreatorLib/mobile-startup-compat.js");
checkJavaScript("GameCreatorLib/mobile-startup-postload.js");
checkJavaScript("GameCreatorLib/gamecreator.compat.js");
runNode("node_modules/typescript/bin/tsc", ["-b", "tsconfig.json"]);
checkJavaScript("out/Game.js");
validateCanonicalEntry();
runNode("tools/build_mobile_bundle.js");
checkJavaScript("release/mobile/assets/www/script.js");
process.stdout.write("项目构建完成：Game.html、out/Game.js 与移动端 script.js 已同步。\n");
