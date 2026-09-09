/*
 * Mobile start-up compatibility layer.
 *
 * This file intentionally uses ES5 syntax only. It is loaded before the
 * GameCreator runtime so an older Android WebView can still report a useful
 * error instead of stopping at a black canvas during script parsing.
 */
(function (global) {
    "use strict";

    var doc = global.document;
    /*
     * The packaged GameCreator runtime is a single, several-megabyte script.
     * On Android WebView the browser can spend more than 18 seconds parsing
     * it before the following inline `main()` call gets a chance to run.  A
     * short watchdog therefore reports a false black-screen failure on
     * otherwise healthy, current WebViews.  Keep the timeout long enough for
     * a cold start while still surfacing a genuinely missing/broken entry.
     */
    var STARTUP_TIMEOUT_MS = 90000;
    /* GameCreator's packApplication step encrypts packaged JSON/asset
     * archives with this password.  The engine's historical default was
     * `gc_zip`, which leaves every encrypted .json unreadable in an APK. */
    var GC_RESOURCE_ZIP_PASSWORD = "gc_zip_2024";
    global.__gcResourceZipPassword = GC_RESOURCE_ZIP_PASSWORD;
    var timeoutHandle = null;
    var state = {
        phase: "runtime-loading",
        mainStarted: false,
        failed: false,
        failedFromPhase: "",
        startedAt: new Date().getTime()
    };
    var zipDiagnostics = global.__gcZipDiagnostics = {
        nativeRawDeflate: null,
        workerSourceLength: 0,
        softwareCodec: "not-attempted",
        archiveBytes: 0,
        attempts: 0,
        lastResult: ""
    };

    var nativeAlert = global.alert;
    if (typeof nativeAlert === "function") {
        global.alert = function (message) {
            var text = safeString(message);
            if (text.indexOf("merged version of Json") >= 0) {
                try { text += "\nZIP diagnostics: " + JSON.stringify(zipDiagnostics); }
                catch (e) { }
            }
            return nativeAlert.call(global, text);
        };
    }

    function schedule(fn) {
        if (typeof global.setTimeout === "function") {
            global.setTimeout(fn, 0);
        }
        else {
            fn();
        }
    }

    function safeString(value) {
        if (value === null || value === undefined) return "";
        try { return String(value); }
        catch (e) { return "未知错误"; }
    }

    function getPanel() {
        if (!doc) return null;
        var panel = doc.getElementById("gcStartupError");
        if (!panel) {
            panel = doc.createElement("div");
            panel.id = "gcStartupError";
            var host = doc.body || doc.documentElement;
            if (host) host.appendChild(panel);
        }
        panel.style.position = "fixed";
        panel.style.left = "10px";
        panel.style.right = "10px";
        panel.style.top = "10px";
        panel.style.zIndex = "2147483647";
        panel.style.display = "none";
        panel.style.padding = "14px 16px";
        panel.style.border = "1px solid #ff6b6b";
        panel.style.borderRadius = "8px";
        panel.style.backgroundColor = "rgba(20,20,20,0.97)";
        panel.style.color = "#ffffff";
        panel.style.font = "14px/1.5 sans-serif";
        panel.style.whiteSpace = "pre-wrap";
        panel.style.wordBreak = "break-word";
        panel.style.maxHeight = "80vh";
        panel.style.overflow = "auto";
        return panel;
    }

    function errorText(errorObj) {
        if (!errorObj) return "";
        var message = errorObj.message || errorObj.reason || errorObj;
        var stack = errorObj.stack;
        var result = safeString(message);
        if (stack && stack !== message) result += "\n" + safeString(stack);
        return result;
    }

    function showFailure(title, detail) {
        if (!state.failed) state.failedFromPhase = state.phase;
        state.failed = true;
        state.phase = "failed";
        var panel = getPanel();
        var diagnostics = "\n阶段: " + state.phase + (state.failedFromPhase ? "（失败前: " + state.failedFromPhase + "）" : "") +
            "\n设备: " + safeString(global.navigator && global.navigator.userAgent) +
            "\n页面: " + safeString(global.location && global.location.href);
        var text = title + "\n" + safeString(detail) + diagnostics;
        if (panel) {
            panel.textContent = text;
            panel.style.display = "block";
        }
        try {
            if (global.console && global.console.error) global.console.error(text);
        }
        catch (e) { }
    }

    function hidePanel() {
        if (!doc) return;
        var panel = doc.getElementById("gcStartupError");
        if (panel) panel.style.display = "none";
    }

    function cancelStartupTimeout() {
        if (timeoutHandle !== null && typeof global.clearTimeout === "function") {
            global.clearTimeout(timeoutHandle);
        }
        timeoutHandle = null;
    }

    function captureError(message, source, line, column, errorObj) {
        var detail = errorText(errorObj) || safeString(message);
        if (source) detail += "\n脚本: " + safeString(source);
        if (line) detail += "\n位置: " + safeString(line) + ":" + safeString(column || 0);
        showFailure("游戏启动失败（脚本无法执行）", detail);
    }

    global.__gcStartup = {
        state: state,
        setPhase: function (phase) { state.phase = phase; },
        markMainStarted: function () {
            cancelStartupTimeout();
            state.mainStarted = true;
            /* Do not hide a real parse/runtime error merely because the
             * generated wrapper still attempted to call main(). */
            if (state.failed) return;
            state.phase = "main-started";
            /* A delayed timeout may have fired between external script
             * blocks; reaching main means that diagnostic is no longer
             * actionable. */
            hidePanel();
        },
        fail: showFailure,
        captureError: captureError,
        diagnostics: function () {
            return {
                phase: state.phase,
                mainStarted: state.mainStarted,
                failed: state.failed,
                userAgent: safeString(global.navigator && global.navigator.userAgent)
            };
        }
    };

    var previousOnError = global.onerror;
    global.onerror = function (message, source, line, column, errorObj) {
        captureError(message, source, line, column, errorObj);
        if (typeof previousOnError === "function") {
            try { return previousOnError.apply(this, arguments); }
            catch (e) { }
        }
        return false;
    };

    if (global.addEventListener) {
        global.addEventListener("unhandledrejection", function (event) {
            var reason = event && (event.reason || event.detail);
            captureError("未处理的异步异常", "", 0, 0, reason);
        }, false);
        global.addEventListener("error", function (event) {
            var target = event && event.target;
            if (target && target !== global && target.tagName === "SCRIPT") {
                captureError("脚本加载失败", target.src || target.getAttribute("src"), 0, 0, null);
            }
        }, true);
    }

    /* A failed script parse otherwise leaves only a black page. */
    function checkStartupTimeout() {
        if (state.mainStarted || state.failed) return;
        if (new Date().getTime() - state.startedAt < STARTUP_TIMEOUT_MS) {
            if (global.setTimeout) timeoutHandle = global.setTimeout(checkStartupTimeout, STARTUP_TIMEOUT_MS);
            return;
        }
        showFailure("游戏启动超时", "入口脚本在 90 秒内未完成初始化。请确认 APK 文件完整，并更新 Android System WebView 后重试。\n如果问题仍在，请把此页面截图反馈。 ");
    }
    schedule(function () {
        if (state.mainStarted || state.failed) return;
        if (global.setTimeout) timeoutHandle = global.setTimeout(checkStartupTimeout, STARTUP_TIMEOUT_MS);
        else checkStartupTimeout();
    });

    /* ES5-era WebViews commonly miss these small platform APIs. */
    if (global.Object && !global.Object.assign) {
        global.Object.assign = function (target) {
            if (target === null || target === undefined) throw new TypeError("Cannot convert object");
            target = Object(target);
            for (var i = 1; i < arguments.length; i++) {
                var source = arguments[i];
                if (source === null || source === undefined) continue;
                for (var key in Object(source)) {
                    if (Object.prototype.hasOwnProperty.call(source, key)) target[key] = source[key];
                }
            }
            return target;
        };
    }
    if (global.Array && !global.Array.from) {
        global.Array.from = function (value, mapFunction, thisArg) {
            var result = [];
            if (value === null || value === undefined) return result;
            var iteratorMethod = global.Symbol && value[global.Symbol.iterator];
            if (typeof iteratorMethod === "function") {
                var iterator = iteratorMethod.call(value), step, iteratorIndex = 0;
                while (!(step = iterator.next()).done) {
                    result.push(typeof mapFunction === "function" ? mapFunction.call(thisArg, step.value, iteratorIndex++) : step.value);
                }
                return result;
            }
            for (var i = 0; i < value.length; i++) {
                result.push(typeof mapFunction === "function" ? mapFunction.call(thisArg, value[i], i) : value[i]);
            }
            return result;
        };
    }
    /* ES2015 helpers used by the generated project/runtime.  TypeScript's
     * ES5 target rewrites syntax, but it deliberately does not provide these
     * prototype/static methods.  Keep the shims small and ES5-only so a
     * legacy WebView can reach the game's first frame and its save path. */
    if (global.Math && !global.Math.trunc) {
        global.Math.trunc = function (value) {
            value = Number(value);
            if (!isFinite(value) || value === 0) return value;
            return value < 0 ? Math.ceil(value) : Math.floor(value);
        };
    }
    if (global.Math && !global.Math.imul) {
        global.Math.imul = function (a, b) {
            var ah = (a >>> 16) & 65535, al = a & 65535;
            var bh = (b >>> 16) & 65535, bl = b & 65535;
            var high = ((ah * bl + al * bh) << 16) >>> 0;
            return (al * bl + high) | 0;
        };
    }
    if (global.String && global.String.prototype) {
        if (!global.String.prototype.startsWith) {
            global.String.prototype.startsWith = function (search, position) {
                var text = String(this);
                var start = position == null ? 0 : Math.max(0, position);
                return text.substr(start, String(search).length) === String(search);
            };
        }
        if (!global.String.prototype.endsWith) {
            global.String.prototype.endsWith = function (search, length) {
                var text = String(this);
                var end = length === undefined ? text.length : Math.min(text.length, Math.max(0, length));
                search = String(search);
                return text.substring(end - search.length, end) === search;
            };
        }
        if (!global.String.prototype.padStart) {
            global.String.prototype.padStart = function (targetLength, padString) {
                var text = String(this);
                targetLength = targetLength >> 0;
                padString = String(padString === undefined ? " " : padString);
                if (targetLength <= text.length || !padString) return text;
                var needed = targetLength - text.length;
                while (padString.length < needed) padString += padString;
                return padString.substr(0, needed) + text;
            };
        }
    }
    if (global.Array && global.Array.prototype && !global.Array.prototype.find) {
        global.Array.prototype.find = function (predicate, thisArg) {
            if (this === null || this === undefined) throw new TypeError("Array.prototype.find called on null");
            if (typeof predicate !== "function") throw new TypeError("predicate must be a function");
            var list = Object(this);
            for (var i = 0; i < list.length; i++) {
                if (predicate.call(thisArg, list[i], i, list)) return list[i];
            }
            return undefined;
        };
    }
    if (global.Object && !global.Object.entries) {
        global.Object.entries = function (value) {
            if (value === null || value === undefined) throw new TypeError("Cannot convert undefined or null to object");
            var object = Object(value), result = [];
            for (var key in object) {
                if (Object.prototype.hasOwnProperty.call(object, key)) result.push([key, object[key]]);
            }
            return result;
        };
    }
    if (global.Object && !global.Object.fromEntries) {
        global.Object.fromEntries = function (entries) {
            var result = {};
            if (!entries) return result;
            var iteratorMethod = global.Symbol && entries[global.Symbol.iterator];
            if (typeof iteratorMethod === "function") {
                var iterator = iteratorMethod.call(entries), step;
                while (!(step = iterator.next()).done) result[step.value[0]] = step.value[1];
                return result;
            }
            for (var i = 0; i < entries.length; i++) result[entries[i][0]] = entries[i][1];
            return result;
        };
    }
    if (global.Number && !global.Number.isFinite) {
        global.Number.isFinite = function (value) {
            return typeof value === "number" && isFinite(value);
        };
    }

    /* TypeScript's generator helpers reference Symbol.iterator even when the
     * legacy save path itself does not use iterators. A string-keyed minimal
     * Symbol is enough to keep those helpers and header checks loadable. */
    if (!global.Symbol) {
        var gcSymbolID = 0;
        var GCSymbol = function (description) {
            gcSymbolID++;
            return "@@gcSymbol:" + safeString(description) + ":" + gcSymbolID;
        };
        GCSymbol.iterator = GCSymbol("iterator");
        GCSymbol.asyncIterator = GCSymbol("asyncIterator");
        global.Symbol = GCSymbol;
    }

    function gcArrayIterator(values) {
        var index = 0;
        var iterator = {
            next: function () {
                if (index >= values.length) return { value: undefined, done: true };
                return { value: values[index++], done: false };
            }
        };
        iterator[global.Symbol.iterator] = function () { return this; };
        return iterator;
    }

    if (!global.Promise) {
        var GCPromise = function (executor) {
            if (!(this instanceof GCPromise)) throw new TypeError("Promises must be constructed");
            this._state = 0;
            this._value = undefined;
            this._handlers = [];
            var self = this;
            function resolve(value) { settle(self, 1, value); }
            function reject(reason) { settle(self, 2, reason); }
            try { executor(resolve, reject); }
            catch (e) { reject(e); }
        };
        function settle(promise, stateValue, value) {
            if (promise._state !== 0) return;
            if (stateValue === 1 && value && typeof value.then === "function") {
                try {
                    value.then(function (next) { settle(promise, 1, next); }, function (error) { settle(promise, 2, error); });
                    return;
                }
                catch (e) { stateValue = 2; value = e; }
            }
            promise._state = stateValue;
            promise._value = value;
            var handlers = promise._handlers.slice();
            promise._handlers.length = 0;
            for (var i = 0; i < handlers.length; i++) dispatch(promise, handlers[i]);
        }
        function dispatch(promise, handler) {
            if (promise._state === 0) { promise._handlers.push(handler); return; }
            schedule(function () {
                var callback = promise._state === 1 ? handler.onFulfilled : handler.onRejected;
                if (typeof callback !== "function") {
                    (promise._state === 1 ? handler.resolve : handler.reject)(promise._value);
                    return;
                }
                try { handler.resolve(callback(promise._value)); }
                catch (e) { handler.reject(e); }
            });
        }
        GCPromise.prototype.then = function (onFulfilled, onRejected) {
            var self = this;
            return new GCPromise(function (resolve, reject) {
                dispatch(self, { onFulfilled: onFulfilled, onRejected: onRejected, resolve: resolve, reject: reject });
            });
        };
        GCPromise.prototype.catch = function (onRejected) { return this.then(null, onRejected); };
        GCPromise.prototype.finally = function (onFinally) {
            return this.then(function (value) { return GCPromise.resolve(onFinally && onFinally()).then(function () { return value; }); }, function (error) { return GCPromise.resolve(onFinally && onFinally()).then(function () { throw error; }); });
        };
        GCPromise.resolve = function (value) { return value instanceof GCPromise ? value : new GCPromise(function (resolve) { resolve(value); }); };
        GCPromise.reject = function (reason) { return new GCPromise(function (resolve, reject) { reject(reason); }); };
        GCPromise.all = function (values) { return new GCPromise(function (resolve, reject) { var result = [], count = 0, length = values.length; if (!length) { resolve(result); return; } function done(index, value) { result[index] = value; count++; if (count === length) resolve(result); } for (var i = 0; i < length; i++) GCPromise.resolve(values[i]).then((function (index) { return function (value) { done(index, value); }; })(i), reject); }); };
        GCPromise.race = function (values) { return new GCPromise(function (resolve, reject) { for (var i = 0; i < values.length; i++) GCPromise.resolve(values[i]).then(resolve, reject); }); };
        global.Promise = GCPromise;
    }

    if (!global.Map) {
        var GCMap = function (entries) { this._keys = []; this._values = []; if (entries) for (var i = 0; i < entries.length; i++) this.set(entries[i][0], entries[i][1]); };
        GCMap.prototype.set = function (key, value) { var i = this._keys.indexOf(key); if (i < 0) { this._keys.push(key); this._values.push(value); } else this._values[i] = value; return this; };
        GCMap.prototype.get = function (key) { var i = this._keys.indexOf(key); return i < 0 ? undefined : this._values[i]; };
        GCMap.prototype.has = function (key) { return this._keys.indexOf(key) >= 0; };
        GCMap.prototype.delete = function (key) { var i = this._keys.indexOf(key); if (i < 0) return false; this._keys.splice(i, 1); this._values.splice(i, 1); return true; };
        GCMap.prototype.clear = function () { this._keys.length = 0; this._values.length = 0; };
        GCMap.prototype.forEach = function (callback, thisArg) { for (var i = 0; i < this._keys.length; i++) callback.call(thisArg, this._values[i], this._keys[i], this); };
        GCMap.prototype.keys = function () { return this._keys.slice(); };
        GCMap.prototype.values = function () { return this._values.slice(); };
        GCMap.prototype.entries = function () { var result = []; for (var i = 0; i < this._keys.length; i++) result.push([this._keys[i], this._values[i]]); return result; };
        GCMap.prototype[global.Symbol.iterator] = function () { return gcArrayIterator(this.entries()); };
        try { Object.defineProperty(GCMap.prototype, "size", { get: function () { return this._keys.length; } }); }
        catch (e) { }
        global.Map = GCMap;
    }
    if (!global.Set) {
        var GCSet = function (values) { this._values = []; if (values) for (var i = 0; i < values.length; i++) this.add(values[i]); };
        GCSet.prototype.add = function (value) { if (this._values.indexOf(value) < 0) this._values.push(value); return this; };
        GCSet.prototype.has = function (value) { return this._values.indexOf(value) >= 0; };
        GCSet.prototype.delete = function (value) { var i = this._values.indexOf(value); if (i < 0) return false; this._values.splice(i, 1); return true; };
        GCSet.prototype.clear = function () { this._values.length = 0; };
        GCSet.prototype.forEach = function (callback, thisArg) { for (var i = 0; i < this._values.length; i++) callback.call(thisArg, this._values[i], this._values[i], this); };
        GCSet.prototype.keys = GCSet.prototype.values = function () { return this._values.slice(); };
        GCSet.prototype.entries = function () { var result = []; for (var i = 0; i < this._values.length; i++) result.push([this._values[i], this._values[i]]); return result; };
        GCSet.prototype[global.Symbol.iterator] = function () { return gcArrayIterator(this._values.slice()); };
        try { Object.defineProperty(GCSet.prototype, "size", { get: function () { return this._values.length; } }); }
        catch (e) { }
        global.Set = GCSet;
    }

    if (!global.TextEncoder) {
        global.TextEncoder = function () { };
        global.TextEncoder.prototype.encode = function (value) {
            var text = unescape(encodeURIComponent(String(value)));
            var bytes = new Uint8Array(text.length);
            for (var i = 0; i < text.length; i++) bytes[i] = text.charCodeAt(i);
            return bytes;
        };
    }
    if (!global.TextDecoder) {
        global.TextDecoder = function () { };
        global.TextDecoder.prototype.decode = function (value) {
            var bytes = value || [];
            var text = "";
            for (var i = 0; i < bytes.length; i++) text += String.fromCharCode(bytes[i]);
            try { return decodeURIComponent(escape(text)); }
            catch (e) { return text; }
        };
    }

    /* The zip library is loaded by the engine and declares classes extending
     * Web Streams. Placeholders keep its ES5 build loadable; old devices use
     * the plain-data ZipManager fallback installed after the engine script. */
    /* zip.js also requires the compression stream pair. Treat a partial
     * Web Streams implementation as unsupported and use the plain-data save
     * format below instead of allowing a later save/load call to crash. */
    var nativeStreams = typeof global.TransformStream === "function" && typeof global.ReadableStream === "function" && typeof global.WritableStream === "function" && typeof global.CompressionStream === "function" && typeof global.DecompressionStream === "function";
    /*
     * zip.js reads ZIP entries with the "deflate-raw" format.  Several
     * Android WebViews expose CompressionStream/DecompressionStream but only
     * implement "gzip" and "deflate".  Constructor presence alone therefore
     * produces a false positive: startup.json reaches zip.js, decompression
     * fails, and the engine only shows "could not find merged Json".
     *
     * Probe the exact format synchronously.  When it is missing, zip.js can
     * use its bundled pure-JavaScript worker codec instead.
     */
    if (nativeStreams) {
        try {
            new global.CompressionStream("deflate-raw");
            new global.DecompressionStream("deflate-raw");
        }
        catch (e) {
            nativeStreams = false;
        }
    }
    zipDiagnostics.nativeRawDeflate = nativeStreams;
    global.__gcWebStreamsAvailable = nativeStreams;
    if (!global.TransformStream) {
        global.TransformStream = function () {
            this.readable = { pipeThrough: function () { return this; }, pipeTo: function () { return global.Promise.resolve(); } };
            this.writable = { getWriter: function () { return { ready: global.Promise.resolve(), write: function () { return global.Promise.resolve(); }, close: function () { return global.Promise.resolve(); }, releaseLock: function () { } }; } };
        };
    }
    if (!global.ReadableStream) global.ReadableStream = function () { this.getReader = function () { return { read: function () { return global.Promise.resolve({ done: true }); } }; }; };
    if (!global.WritableStream) global.WritableStream = function () { this.getWriter = function () { return { ready: global.Promise.resolve(), write: function () { return global.Promise.resolve(); }, close: function () { return global.Promise.resolve(); }, releaseLock: function () { } }; }; };

    if (!global.URL) {
        global.URL = function (value) { this.href = safeString(value); };
    }
    if (!global.URL.createObjectURL) global.URL.createObjectURL = function () { return "data:text/javascript,"; };
    /* zip-full embeds its pure-JavaScript Deflate/Inflate implementation in
     * a Blob worker.  Android asset pages can reject that worker even though
     * Blob itself is available. Capture the trusted bundled worker source so
     * it can be registered as a main-thread codec if native decompression
     * fails later. */
    if (global.Blob && !global.Blob.__gcZipSourceCapture) {
        var NativeBlob = global.Blob;
        var CapturingBlob = function (parts, options) {
            try {
                if (parts && parts.length && options && options.type === "text/javascript") {
                    var source = "";
                    for (var i = 0; i < parts.length; i++) {
                        if (typeof parts[i] === "string") source += parts[i];
                    }
                    if (source.indexOf("initCodec") >= 0 && source.indexOf("Inflate") >= 0) {
                        global.__gcZipWorkerSource = source;
                        zipDiagnostics.workerSourceLength = source.length;
                    }
                }
            }
            catch (e) { }
            return new NativeBlob(parts, options);
        };
        CapturingBlob.prototype = NativeBlob.prototype;
        CapturingBlob.__gcZipSourceCapture = true;
        global.Blob = CapturingBlob;
    }
    if (!global.Blob) {
        global.Blob = function (parts, options) { this.parts = parts || []; this.type = options && options.type || ""; this.size = 0; for (var i = 0; i < this.parts.length; i++) this.size += this.parts[i] && this.parts[i].length || 0; };
        global.Blob.prototype.arrayBuffer = function () { return global.Promise.resolve(new ArrayBuffer(0)); };
    }

    function bytesFrom(value) {
        if (value instanceof Uint8Array) return new Uint8Array(value);
        if (value && value.buffer && typeof value.byteLength === "number") return new Uint8Array(value.buffer, value.byteOffset || 0, value.byteLength);
        if (value instanceof ArrayBuffer) return new Uint8Array(value);
        var text = unescape(encodeURIComponent(String(value)));
        var bytes = new Uint8Array(text.length);
        for (var i = 0; i < text.length; i++) bytes[i] = text.charCodeAt(i);
        return bytes;
    }
    function textFrom(bytes) {
        var text = "";
        for (var i = 0; i < bytes.length; i++) text += String.fromCharCode(bytes[i]);
        try { return decodeURIComponent(escape(text)); }
        catch (e) { return text; }
    }
    function plainPack(value) {
        var data = bytesFrom(value), result = new Uint8Array(data.length + 8);
        var magic = [71, 67, 80, 76, 65, 73, 78, 49];
        for (var i = 0; i < magic.length; i++) result[i] = magic[i];
        result.set(data, 8);
        return result.buffer;
    }
    function plainUnpack(value) {
        var bytes = bytesFrom(value);
        if (bytes.length < 8) return null;
        var magic = [71, 67, 80, 76, 65, 73, 78, 49];
        for (var i = 0; i < magic.length; i++) if (bytes[i] !== magic[i]) return null;
        return bytes.subarray(8);
    }
    /* IndexedDB/LocalStorage stores zip bytes as a binary string. Re-encoding
     * that string as UTF-8 would duplicate every byte above 127 and corrupt
     * Chinese save data, so recover its original byte values directly. */
    function plainUnpackStorageText(value) {
        if (typeof value !== "string" || value.length < 8) return null;
        var bytes = new Uint8Array(value.length);
        for (var i = 0; i < value.length; i++) bytes[i] = value.charCodeAt(i) & 255;
        return plainUnpack(bytes);
    }
    function copiedBuffer(bytes) {
        var copy = new Uint8Array(bytes.length);
        copy.set(bytes, 0);
        return copy.buffer;
    }
    function normalizeResourceZipPassword(password) {
        /* Preserve custom passwords, but translate the engine's old default
         * for packaged resources.  This also fixes ClientMain's literal
         * `gc_zip` argument without editing the generated runtime. */
        return !password || password === "gc_zip" ? GC_RESOURCE_ZIP_PASSWORD : password;
    }
    function asyncCallback(callback, value) {
        schedule(function () { if (typeof callback === "function") callback(value); });
        return global.Promise.resolve(value);
    }
    global.__gcInstallZipFallback = function () {
        if (!global.ZipManager || global.ZipManager.__gcPortableSaveSupport) return;
        var hasNativeStreams = global.__gcWebStreamsAvailable === true;
        var softwareCodecReady = false;

        function configureSoftwareZip() {
            if (!global.zip || !global.zip.configure) return false;
            if (softwareCodecReady) return true;
            var source = global.__gcZipWorkerSource;
            zipDiagnostics.workerSourceLength = source ? source.length : 0;
            if (source && global.Function) {
                try {
                    /* Do not use Object.create(global) here.  A number of
                     * browser globals (notably crypto) are accessor-backed
                     * and require the real global object as their receiver.
                     * Inheriting those accessors from a synthetic object can
                     * throw `ERR_INVALID_THIS` before the codec is initialized.
                     * Build a plain scope and copy only the globals used by
                     * zip.js instead. */
                    var codecScope = {
                        Array: global.Array,
                        Object: global.Object,
                        Number: global.Number,
                        Math: global.Math,
                        Error: global.Error,
                        Uint8Array: global.Uint8Array,
                        Uint16Array: global.Uint16Array,
                        Uint32Array: global.Uint32Array,
                        Int32Array: global.Int32Array,
                        Map: global.Map,
                        DataView: global.DataView,
                        Promise: global.Promise,
                        TextEncoder: global.TextEncoder,
                        crypto: global.crypto,
                        TransformStream: global.TransformStream,
                        ReadableStream: global.ReadableStream,
                        WritableStream: global.WritableStream,
                        CompressionStream: global.CompressionStream,
                        DecompressionStream: global.DecompressionStream
                    };
                    codecScope.self = codecScope;
                    codecScope.addEventListener = function () { };
                    codecScope.postMessage = function () { };
                    codecScope.importScripts = function () { };
                    new global.Function("self", source)(codecScope);
                    if (typeof codecScope.initCodec === "function") codecScope.initCodec();
                    if (typeof codecScope.Inflate === "function" && typeof codecScope.Deflate === "function") {
                        global.zip.configure({
                            Inflate: codecScope.Inflate,
                            Deflate: codecScope.Deflate,
                            useWebWorkers: false,
                            useCompressionStream: false
                        });
                        softwareCodecReady = true;
                        zipDiagnostics.softwareCodec = "main-thread";
                        return true;
                    }
                }
                catch (e) {
                    zipDiagnostics.softwareCodec = "main-thread-error:" + safeString(e && (e.message || e));
                }
            }
            /* Last resort for environments where Blob workers are allowed. */
            try {
                global.zip.configure({ useWebWorkers: true, useCompressionStream: false });
                softwareCodecReady = true;
                zipDiagnostics.softwareCodec = "worker";
                return true;
            }
            catch (e) {
                zipDiagnostics.softwareCodec = "worker-error:" + safeString(e && (e.message || e));
            }
            return false;
        }

        try {
            if (!hasNativeStreams) configureSoftwareZip();
        }
        catch (e) { }
        var manager = global.ZipManager;
        var nativeCompress = manager.zipCompress;
        var nativeCompress2 = manager.zipCompress2;
        var nativeDeCompress = manager.zipDeCompress;
        var nativeDeCompressText = manager.zipDeCompressText;
        var nativeDeCompress2 = manager.zipDeCompress2;
        manager.__gcPortableSaveSupport = true;
        manager.__gcPlainFallback = !hasNativeStreams;
        global.__gcSaveFormat = "GCPLAIN1";

        /* A few WebViews swallow the rejected stream and invoke the engine
         * callback with undefined even after zip.configure() has installed
         * the software codec.  In that case call zip.js directly with the
         * codec explicitly disabled for workers/CompressionStream so the
         * retry cannot accidentally reuse the failed native path. */
        function directSoftwareDecompress(inputIsText, outputBuffer, input, callback, password) {
            if (!global.zip || !global.zip.ZipReader || !global.zip.Uint8ArrayReader) {
                zipDiagnostics.softwareCodec = "direct-unavailable";
                return false;
            }
            var bytes;
            try {
                if (inputIsText) {
                    if (typeof input !== "string") {
                        zipDiagnostics.softwareCodec = "direct-invalid-text-input";
                        return false;
                    }
                    bytes = new global.Uint8Array(input.length);
                    for (var i = 0; i < input.length; i++) bytes[i] = input.charCodeAt(i) & 255;
                }
                else {
                    bytes = input instanceof global.Uint8Array ? input : new global.Uint8Array(input);
                }
                var passwords = [];
                function addPassword(value) {
                    if (!value) return;
                    for (var p = 0; p < passwords.length; p++) if (passwords[p] === value) return;
                    passwords.push(value);
                }
                /* startup.json has existed in both the packager's resource
                 * format and the older engine format. Try the current key
                 * first, then the legacy key so an APK built by either
                 * GameCreator version can boot. */
                addPassword(normalizeResourceZipPassword(password));
                addPassword(GC_RESOURCE_ZIP_PASSWORD);
                addPassword("gc_zip");

                function tryPassword(passwordIndex, lastError) {
                    if (passwordIndex >= passwords.length) {
                        zipDiagnostics.softwareCodec = "direct-error:" + safeString(lastError && (lastError.message || lastError));
                        callback();
                        return;
                    }
                    var reader;
                    try {
                        reader = new global.zip.ZipReader(new global.zip.Uint8ArrayReader(bytes), {
                            filenameEncoding: "utf-8",
                            useWebWorkers: false,
                            useCompressionStream: false
                        });
                        global.Promise.resolve(reader.getEntries()).then(function (entries) {
                            if (!entries || !entries.length) throw new global.Error("ZIP 中没有可读取的条目");
                            return entries[0].getData(new global.zip.Uint8ArrayWriter(), {
                                password: passwords[passwordIndex],
                                useWebWorkers: false,
                                useCompressionStream: false
                            });
                        }).then(function (decoded) {
                            return global.Promise.resolve(reader.close()).then(function () { return decoded; });
                        }).then(function (decoded) {
                            if (outputBuffer) callback(copiedBuffer(decoded));
                            else callback(textFrom(decoded));
                        }, function (error) {
                            var closeResult;
                            try { closeResult = reader && reader.close(); }
                            catch (closeError) { closeResult = null; }
                            global.Promise.resolve(closeResult).then(function () {
                                tryPassword(passwordIndex + 1, error);
                            }, function () {
                                tryPassword(passwordIndex + 1, error);
                            });
                        });
                    }
                    catch (error) {
                        tryPassword(passwordIndex + 1, error);
                    }
                }
                tryPassword(0, null);
                zipDiagnostics.softwareCodec = "direct";
                return true;
            }
            catch (error) {
                zipDiagnostics.softwareCodec = "direct-error:" + safeString(error && (error.message || error));
                return false;
            }
        }

        function delegateZipWithSoftwareRetry(nativeMethod, callArguments) {
            var args = Array.prototype.slice.call(callArguments);
            var originalCallback = args[1];
            var retried = false;
            if (typeof originalCallback !== "function") return nativeMethod.apply(manager, args);
            args[1] = function (value) {
                zipDiagnostics.attempts++;
                zipDiagnostics.lastResult = value === undefined ? "undefined" : value === null ? "null" : typeof value + ":" + (value && value.length || 0);
                /* Some WebViews accept the deflate-raw constructor but fail
                 * only after the stream starts.  The engine swallows that
                 * rejection and reports an empty result, so retry the same
                 * archive once with zip.js' bundled software worker codec. */
                if (!retried && (value === undefined || value === null) && global.zip && global.zip.configure) {
                    retried = true;
                    try {
                        configureSoftwareZip();
                        var inputIsText = nativeMethod === nativeDeCompressText;
                        var outputBuffer = nativeMethod === nativeDeCompress2;
                        if (directSoftwareDecompress(inputIsText, outputBuffer, args[0], originalCallback, args[2])) return;
                        nativeMethod.apply(manager, args);
                        return;
                    }
                    catch (e) { }
                }
                originalCallback.apply(this, arguments);
            };
            return nativeMethod.apply(manager, args);
        }

        /* All gcdata saves now use one portable envelope on both new and old
         * WebViews. Capable devices still retain native zip readers for legacy
         * compressed saves and other engine archives. */
        manager.zipCompress = function (fileName, data, onFin) {
            if (fileName === "gcdata" || !hasNativeStreams) {
                return data ? asyncCallback(onFin, plainPack(data)) : asyncCallback(onFin);
            }
            return nativeCompress.apply(manager, arguments);
        };
        manager.zipCompress2 = function (fileName, buffer, onFin) {
            if (fileName === "gcdata" || !hasNativeStreams) {
                return buffer ? asyncCallback(onFin, plainPack(buffer)) : asyncCallback(onFin);
            }
            return nativeCompress2.apply(manager, arguments);
        };
        manager.zipDeCompress = function (buffer, onFin) {
            zipDiagnostics.archiveBytes = buffer && (buffer.byteLength || buffer.length) || 0;
            var data = plainUnpack(buffer);
            if (data) return asyncCallback(onFin, textFrom(data));
            var args = Array.prototype.slice.call(arguments);
            if (args.length > 2) args[2] = normalizeResourceZipPassword(args[2]);
            return delegateZipWithSoftwareRetry(nativeDeCompress, args);
        };
        manager.zipDeCompressText = function (storageText, onFin) {
            var data = plainUnpackStorageText(storageText);
            if (data) return asyncCallback(onFin, textFrom(data));
            var args = Array.prototype.slice.call(arguments);
            if (args.length > 2) args[2] = normalizeResourceZipPassword(args[2]);
            return delegateZipWithSoftwareRetry(nativeDeCompressText, args);
        };
        manager.zipDeCompress2 = function (buffer, onFin) {
            var data = plainUnpack(buffer);
            if (data) return asyncCallback(onFin, copiedBuffer(data));
            var args = Array.prototype.slice.call(arguments);
            if (args.length > 2) args[2] = normalizeResourceZipPassword(args[2]);
            return delegateZipWithSoftwareRetry(nativeDeCompress2, args);
        };
    };
})(this);
