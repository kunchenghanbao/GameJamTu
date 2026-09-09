/* External post-load hook so GameCreator's script merger keeps this call. */
(function (global) {
    var RESOURCE_PASSWORD = global && global.__gcResourceZipPassword || "gc_zip_2024";

    function isAndroidPackage() {
        var href = global && global.location && String(global.location.href || "");
        return !!(global && (global.cordova || href.indexOf("file:///android_asset/") === 0));
    }

    function bytesFrom(value) {
        if (!value) return null;
        try {
            if (value instanceof global.Uint8Array) return value;
            if (value instanceof global.ArrayBuffer) return new global.Uint8Array(value);
            if (value.buffer && typeof value.byteLength === "number") {
                return new global.Uint8Array(value.buffer, value.byteOffset || 0, value.byteLength);
            }
        }
        catch (e) { }
        return null;
    }

    function isZipPayload(value) {
        var bytes = bytesFrom(value);
        if (bytes && bytes.length >= 4) return bytes[0] === 80 && bytes[1] === 75 && bytes[2] === 3 && bytes[3] === 4;
        if (typeof value === "string" && value.length >= 4) {
            return value.charCodeAt(0) === 80 && value.charCodeAt(1) === 75 && value.charCodeAt(2) === 3 && value.charCodeAt(3) === 4;
        }
        return false;
    }

    function textFrom(value) {
        if (typeof value === "string") return value;
        var bytes = bytesFrom(value);
        if (!bytes) return "";
        try {
            if (global.TextDecoder) return new global.TextDecoder().decode(bytes);
        }
        catch (e) { }
        var text = "";
        for (var i = 0; i < bytes.length; i++) text += String.fromCharCode(bytes[i]);
        try { return decodeURIComponent(escape(text)); }
        catch (e) { return text; }
    }

    function runCallback(callback, value) {
        if (!callback) return;
        if (typeof callback.runWith === "function") callback.runWith([value]);
        else if (typeof callback === "function") callback(value);
    }

    function parseJson(localURL, raw, forceNotCache, onFin) {
        var text = textFrom(raw);
        if (!text) {
            runCallback(onFin, null);
            return;
        }
        try {
            text = text.replace(/(\n|^)[ \t]*\/\/.*/g, "");
            var jsonObj = JSON.parse(text);
            /* BUFFER loading uses the same URL cache as JSON loading. Remove
             * the encrypted ArrayBuffer before publishing the parsed object,
             * otherwise a later AssetManager.loadJson call returns that raw
             * buffer and GCAnimation receives no imageSources/layers. */
            if (global.loader && global.loader.clearRes) {
                try { global.loader.clearRes(localURL, true); }
                catch (ignoredClear) { }
            }
            if (!forceNotCache && global.loader && global.loader.cacheRes) {
                global.loader.cacheRes(localURL, jsonObj);
            }
            runCallback(onFin, jsonObj);
        }
        catch (e) {
            if (global.console && global.console.error) {
                try { global.console.error("移动端 JSON 解析失败: " + localURL, e); }
                catch (ignored) { }
            }
            runCallback(onFin, null);
        }
    }

    /* The packager leaves JSON files as AES ZIP archives (even though their
     * names still end in .json). FileUtils' TEXT loader decodes those bytes
     * as Unicode before JSON.parse, so install a BUFFER path on Android and
     * decrypt the archive before parsing. This wrapper is installed before
     * ClientMain.loadStartupJson replaces FileUtils.loadJsonFile; the latter
     * therefore continues to use this safe loader for non-merged resources. */
    function installEncryptedJsonLoader() {
        if (!isAndroidPackage() || !global.FileUtils || !global.AssetManager || !global.AssetManager.loadFileArrayBuffer || global.FileUtils.__gcEncryptedJsonLoader) return;
        var originalLoadJsonFile = global.FileUtils.loadJsonFile;
        if (typeof originalLoadJsonFile !== "function") return;
        global.FileUtils.loadJsonFile = function (localURL, onFin, onErrorTips, forceNotCache) {
            if (onErrorTips === void 0) onErrorTips = true;
            if (forceNotCache === void 0) forceNotCache = false;
            var handled = false;
            var finish = function (value) {
                if (handled) return;
                handled = true;
                runCallback(onFin, value);
            };
            try {
                global.AssetManager.loadFileArrayBuffer(localURL, global.Callback && global.Callback.New ? global.Callback.New(function (buffer) {
                    if (!buffer) {
                        /* Preserve the engine's original missing-file and
                         * editor/remote handling when BUFFER loading fails. */
                        handled = true;
                        originalLoadJsonFile.call(global.FileUtils, localURL, onFin, onErrorTips, forceNotCache);
                        return;
                    }
                    if (isZipPayload(buffer) && global.ZipManager && typeof global.ZipManager.zipDeCompress === "function") {
                        global.ZipManager.zipDeCompress(buffer, function (text) {
                            if (text === undefined || text === null || text === "") {
                                finish(null);
                                return;
                            }
                            parseJson(localURL, text, forceNotCache, finish);
                        }, RESOURCE_PASSWORD);
                        return;
                    }
                    parseJson(localURL, buffer, forceNotCache, finish);
                }) : function (buffer) {
                    if (!buffer) {
                        handled = true;
                        originalLoadJsonFile.call(global.FileUtils, localURL, onFin, onErrorTips, forceNotCache);
                        return;
                    }
                    parseJson(localURL, buffer, forceNotCache, finish);
                });
            }
            catch (e) {
                handled = true;
                originalLoadJsonFile.apply(global.FileUtils, [localURL, onFin, onErrorTips, forceNotCache]);
            }
        };
        global.FileUtils.__gcEncryptedJsonLoader = true;
    }

    /*
     * The Android package embeds all JSON data in startup.json.  GameCreator
     * only reads that bundle when RELEASE_GAME is explicitly true; leaving it
     * undefined makes the WebView request loose JSON files that are not
     * shipped in the APK and leaves the app on a black screen.
     *
     * Keep desktop/editor previews unchanged: only force release mode inside
     * Cordova or when running from Android's asset origin.
     */
    if (global && global.Config && (
        global.cordova ||
        global.location && String(global.location.href).indexOf("file:///android_asset/") === 0
    )) {
        global.Config.RELEASE_GAME = true;
    }

    if (global && global.__gcInstallZipFallback) global.__gcInstallZipFallback();
    installEncryptedJsonLoader();

    /*
     * The Android wrapper calls the runtime's global main() from its generated
     * index.html.  Wrap it here (after gamecreator.js has defined it) so the
     * startup watchdog is cancelled on every packaging variant, including the
     * editor-generated APK index that does not call __gcStartup itself.
     */
    if (global && global.__gcStartup && typeof global.main === "function" && !global.main.__gcStartupWrapped) {
        var originalMain = global.main;
        var wrappedMain = function () {
            global.__gcStartup.markMainStarted();
            return originalMain.apply(this, arguments);
        };
        wrappedMain.__gcStartupWrapped = true;
        global.main = wrappedMain;
    }
})(this);
