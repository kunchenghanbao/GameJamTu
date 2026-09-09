/* Regenerate the ES5 runtime used by Game.html on mobile WebViews. */
var fs = require("fs");
var path = require("path");
var vm = require("vm");
var ts = require("typescript");

var root = path.resolve(__dirname, "..");
var input = path.join(root, "GameCreatorLib", "gamecreator.js");
var output = path.join(root, "GameCreatorLib", "gamecreator.compat.js");
var workerOutput = path.join(root, "GameCreatorLib", "zip-worker-code.js");
var options = {
    allowJs: true,
    checkJs: false,
    target: ts.ScriptTarget.ES5,
    module: ts.ModuleKind.None,
    skipLibCheck: true,
    outFile: output,
    newLine: ts.NewLineKind.LineFeed,
    removeComments: false
};

var program = ts.createProgram([input], options);
var diagnostics = ts.getPreEmitDiagnostics(program);
if (diagnostics.length) {
    var message = ts.formatDiagnosticsWithColorAndContext(diagnostics, {
        getCurrentDirectory: function () { return root; },
        getCanonicalFileName: function (fileName) { return fileName; },
        getNewLine: function () { return "\n"; }
    });
    process.stderr.write(message);
    process.exit(1);
}

var result = program.emit();
if (result.emitSkipped || !fs.existsSync(output)) {
    process.stderr.write("无法生成移动端兼容运行时: " + output + "\n");
    process.exit(1);
}

/*
 * zip-full keeps its pure-JavaScript Inflate implementation inside a Blob
 * worker string. Cordova asset pages on some WebViews cannot execute that
 * worker, so expose the exact same bundled source for the startup layer's
 * main-thread fallback. Extracting from every generated runtime prevents the
 * compatibility copy from drifting away from the engine version.
 */
var emitted = fs.readFileSync(output, "utf8");
/* TypeScript's ES5 down-leveling emits `Base.prototype.readable` for
 * `super.readable`.  Web Streams expose readable as an accessor that requires
 * a real TransformStream instance, so the prototype receiver throws on
 * Chromium/WebView.  The native base constructor result is already kept in
 * `_this_2`; use that receiver in the three zip.js stream adapters. */
var prototypeReadableCount = (emitted.match(/tt\(_super_1\.prototype\.readable\)/g) || []).length;
var prototypeReadableCount2 = (emitted.match(/c = _super_1\.prototype\.readable/g) || []).length;
if (prototypeReadableCount !== 2 || prototypeReadableCount2 !== 1) {
    process.stderr.write("移动端兼容运行时的 Web Stream 访问点数量异常\n");
    process.exit(1);
}
emitted = emitted.replace(/tt\(_super_1\.prototype\.readable\)/g, "tt(_this_2.readable)");
emitted = emitted.replace(/c = _super_1\.prototype\.readable/g, "c = _this_2.readable");
var streamCtorMarker = ", v = _k.TransformStream, C = _k.ReadableStream";
var streamCtorReplacement = ", v = (function (nativeCtor) {\n" +
    "        if (typeof nativeCtor !== \"function\") return nativeCtor;\n" +
    "        try { nativeCtor({}); return nativeCtor; } catch (e) { }\n" +
    "        function callableTransformStream(options) { return new nativeCtor(options); }\n" +
    "        callableTransformStream.prototype = nativeCtor.prototype;\n" +
    "        return callableTransformStream;\n" +
    "    })(_k.TransformStream), C = _k.ReadableStream";
if (emitted.indexOf(streamCtorMarker) !== emitted.lastIndexOf(streamCtorMarker)) {
    process.stderr.write("移动端兼容运行时存在多个 TransformStream 定义\n");
    process.exit(1);
}
if (emitted.indexOf(streamCtorMarker) < 0) {
    process.stderr.write("移动端兼容运行时缺少 TransformStream 定义\n");
    process.exit(1);
}
emitted = emitted.replace(streamCtorMarker, streamCtorReplacement);
fs.writeFileSync(output, emitted, "utf8");
var workerPattern = /new m\(\[('(?:\\.|[^'\\])*')\], \{ type: "text\/javascript" \}\)/g;
var workerMatch;
var workerSource = "";
while ((workerMatch = workerPattern.exec(emitted))) {
    var candidate = vm.runInNewContext(workerMatch[1]);
    if (candidate.indexOf("initCodec") >= 0 && candidate.indexOf("Inflate") >= 0) {
        workerSource = candidate;
        break;
    }
}
if (!workerSource) {
    process.stderr.write("无法从兼容运行时提取 zip.js 软件解压器\n");
    process.exit(1);
}
var workerBootstrap = "/* Generated from gamecreator.compat.js; do not edit. */\n" +
    "(function(global){global.__gcZipWorkerSource=" + JSON.stringify(workerSource) + ";" +
    "if(global.__gcZipDiagnostics)global.__gcZipDiagnostics.workerSourceLength=global.__gcZipWorkerSource.length;" +
    "})(this);\n";
fs.writeFileSync(workerOutput, workerBootstrap, "utf8");
process.stdout.write("已生成 " + path.relative(root, output) + "\n");
process.stdout.write("已生成 " + path.relative(root, workerOutput) + "\n");
