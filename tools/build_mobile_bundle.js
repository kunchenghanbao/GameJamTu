/* Generate the APK-facing script.js from the exact scripts loaded by Game.html. */
"use strict";

var crypto = require("crypto");
var fs = require("fs");
var path = require("path");

var root = path.resolve(__dirname, "..");
var htmlPath = path.join(root, "Game.html");
var outputRoot = path.join(root, "release", "mobile", "assets", "www");
var html = fs.readFileSync(htmlPath, "utf8");
var scriptPattern = /<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*><\/script>/gi;
var scripts = [];
var match;

while ((match = scriptPattern.exec(html))) {
    var ref = match[1].split(/[?#]/)[0].replace(/\\/g, "/");
    if (/^(?:https?:)?\/\//i.test(ref)) throw new Error("移动端构建不允许远程脚本: " + ref);
    var absolutePath = path.resolve(root, ref);
    if (!fs.existsSync(absolutePath)) throw new Error("Game.html 引用了不存在的脚本: " + ref);
    scripts.push({
        ref: path.relative(root, absolutePath).replace(/\\/g, "/"),
        absolutePath: absolutePath,
        content: fs.readFileSync(absolutePath, "utf8")
    });
}

if (!scripts.length) throw new Error("Game.html 中没有可合并的脚本");
var projectScripts = scripts.filter(function (entry) { return entry.ref === "out/Game.js"; });
if (projectScripts.length !== 1) throw new Error("移动端只能合并一个项目入口 out/Game.js");

var bundle = scripts.map(function (entry) {
    return "/* source: " + entry.ref + " */\n" + entry.content.replace(/\s+$/, "") + "\n";
}).join("\n");

var indexHtml = "<!DOCTYPE html>\n" +
    "<html><head><meta charset=\"utf-8\">" +
    "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1.0,minimum-scale=1.0,maximum-scale=1.0,user-scalable=no\">" +
    "<title>GameJam</title></head>\n" +
    "<body style=\"margin:0;background:#000;color:#fff\"></body>\n" +
    "<script src=\"cordova.js\"></script>\n" +
    "<script src=\"script.js\"></script>\n" +
    "<script>(function(){try{if(window.__gcStartup)window.__gcStartup.setPhase('calling-main');" +
    "if(typeof main==='function'){if(window.__gcStartup)window.__gcStartup.markMainStarted();main();}" +
    "else if(window.__gcStartup)window.__gcStartup.fail('游戏启动失败（入口缺失）','script.js 中没有 main 函数');" +
    "}catch(e){if(window.__gcStartup)window.__gcStartup.fail('游戏启动失败（初始化异常）',e&&(e.stack||e.message)||e);throw e;}})();</script>\n" +
    "</html>\n";

function sha256(value) {
    return crypto.createHash("sha256").update(value).digest("hex");
}

var manifest = {
    formatVersion: 1,
    canonicalEntry: "out/Game.js",
    gameHtmlSha256: sha256(html),
    scriptSha256: sha256(bundle),
    sources: scripts.map(function (entry) {
        return { path: entry.ref, sha256: sha256(entry.content) };
    })
};

fs.mkdirSync(outputRoot, { recursive: true });
fs.writeFileSync(path.join(outputRoot, "script.js"), bundle, "utf8");
fs.writeFileSync(path.join(outputRoot, "index.html"), indexHtml, "utf8");
fs.writeFileSync(path.join(outputRoot, "build-manifest.json"), JSON.stringify(manifest, null, 2) + "\n", "utf8");
process.stdout.write("已生成 release/mobile/assets/www/script.js（" + scripts.length + " 个同源脚本）\n");
