/**
 * Owns the roguelike lifecycle and keeps its changes isolated from normal play.
 */
class RogueRunManager {
    static readonly EVENT_RUN_STARTED: string = "RogueRunManagerEVENT_RUN_STARTED";
    static readonly EVENT_RUN_FINISHED: string = "RogueRunManagerEVENT_RUN_FINISHED";
    static readonly EVENT_RUN_STATE_CHANGED: string = "RogueRunManagerEVENT_RUN_STATE_CHANGED";
    private static _state: RogueRunState = null;
    private static _saveInFlight: boolean = false;
    private static _savePending: boolean = false;
    private static _cleanupSavePending: boolean = false;
    private static _saveStateListenerRegistered: boolean = false;
    private static _retryScheduled: boolean = false;
    private static _saveRetryCount: number = 0;
    private static _saveID: number = 0;
    private static readonly ENTRY_SCENE_ID: number = 2;
    private static readonly MAX_SAVE_RETRIES: number = 2;

    static get active(): boolean {
        return !!this._state && this._state.runStatus === "active";
    }

    static get state(): RogueRunState {
        return this._state;
    }

    static startNewRun(seed: number = 0): RogueRunState {
        if (this.active) return this._state;
        if (!Game || !Game.player || !Game.player.data) return null;
        // A closing run must first replace its persisted active snapshot. Starting
        // another run during that write could make the cleanup save serialize the
        // new run instead.
        if (this._cleanupSavePending || this._saveInFlight) {
            this.warnSave("上一局仍在完成存档，请稍后再试。");
            return null;
        }
        let saveID = this.resolveSaveID();
        if (typeof SinglePlayerGame !== "undefined" && saveID < 1) {
            this.warnSave("存档槽已满，肉鸽不会覆盖现有存档；请先释放一个存档槽。");
            return null;
        }
        this._saveID = saveID;
        this._savePending = false;
        this._saveRetryCount = 0;
        if (!seed) seed = this.createSeed();
        let state = RogueRunState.create(seed);
        state.worldRuleSnapshot = {
            fullStateWhenBattleStart: WorldData.fullStateWhenBattleStart,
            battleScene: WorldData.battleScene,
            battleReadyBGM: WorldData.battleReadyBGM,
            battleBGM: WorldData.battleBGM,
            battleSceneBGM: WorldData.battleSceneBGM
        };
        state.mainPlayerSnapshot = this.capturePlayerData();
        state.mainPlayerSnapshotComplete = true;
        state.mainVariableSnapshot = this.captureVariableData();
        // Run gameplay may use existing ProjectPlayer APIs against this isolated copy.
        this.applyPlayerData(ObjectUtils.depthClone(state.mainPlayerSnapshot), true);
        this.applyVariableData(ObjectUtils.depthClone(state.mainVariableSnapshot));
        WorldData.fullStateWhenBattleStart = false;
        this._state = state;
        this.syncRuntimeState();
        EventUtils.happen(RogueRunManager, this.EVENT_RUN_STARTED, [state]);
        // 建立肉鸽运行后立即落盘。这样没有已有存档槽的新游戏也会先创建
        // 一个槽位，第一次击杀/选卡前退出时仍可恢复运行状态。
        this.saveProgress();
        return state;
    }

    static continueRun(state: RogueRunState): boolean {
        if (!state || state.runStatus !== "active" || !state.mainPlayerSnapshot) return false;
        this._saveID = this.resolveSaveID();
        this._savePending = false;
        this._cleanupSavePending = false;
        this._saveRetryCount = 0;
        this._state = state;
        // Recovery restores the normal save first; reapply the isolated run
        // snapshot before presenting the resumed roguelike scene.
        if (state.partySnapshots && state.partySnapshots.length > 0) {
            this.applyPlayerData({
                gold: state.gold,
                party: ObjectUtils.depthClone(state.partySnapshots),
                package: ObjectUtils.depthClone(state.temporaryPackage || [])
            });
        }
        if (state.variableSnapshots) this.applyVariableData(ObjectUtils.depthClone(state.variableSnapshots));
        WorldData.fullStateWhenBattleStart = false;
        this.syncRuntimeState();
        EventUtils.happen(RogueRunManager, this.EVENT_RUN_STATE_CHANGED, [state]);
        return true;
    }

    static finishRun(): void {
        this.closeRun("completed");
    }

    static failRun(): void {
        this.closeRun("failed");
    }

    static abortRun(): void {
        this.closeRun("aborted");
    }

    static prepareForRecovery(): void {
        if (this._state) this.restoreWorldRules(this._state);
        this._state = null;
        this._savePending = false;
        this._cleanupSavePending = false;
        this._saveInFlight = false;
        this._retryScheduled = false;
        this._saveRetryCount = 0;
        this.removeSaveStateListener();
    }

    static restoreFromSaveData(data: any): boolean {
        let state = RogueRunState.fromSaveData(data);
        if (!state || state.runStatus !== "active") {
            this._state = null;
            return false;
        }
        return this.continueRun(state);
    }

    static getSaveData(): any {
        if (!this.active) return null;
        this.syncRuntimeState();
        return ObjectUtils.depthClone(this._state);
    }

    static getMainPlayerBackup(): any {
        if (!this.active || !this._state.mainPlayerSnapshot) return null;
        return {
            playerData: ObjectUtils.depthClone(this._state.mainPlayerSnapshot),
            variableData: ObjectUtils.depthClone(this._state.mainVariableSnapshot),
            complete: this._state.mainPlayerSnapshotComplete
        };
    }

    static restoreMainPlayerBackup(snapshot: any): boolean {
        if (!snapshot) return false;
        // Accept the pre-variable-backup shape while developing schema v1 saves.
        this.applyPlayerData(ObjectUtils.depthClone(snapshot.playerData || snapshot), snapshot.complete === true);
        if (snapshot.variableData) this.applyVariableData(ObjectUtils.depthClone(snapshot.variableData));
        return true;
    }

    static nextTransactionID(type: string): string {
        if (!this.active) return "";
        let id = this._state.runID + ":" + type + ":" + (new Date().getTime()) + ":" + (this._state.killCount + this._state.rewardQueue.length);
        this._state.lastTransactionID = id;
        return id;
    }

    static syncRuntimeState(): void {
        if (!this.active || !Game || !Game.player || !Game.player.data) return;
        this._state.gold = Game.player.data.gold;
        this._state.partySnapshots = ObjectUtils.depthClone(Game.player.data.party || []);
        this._state.temporaryPackage = ObjectUtils.depthClone(Game.player.data.package || []);
        this._state.variableSnapshots = this.captureVariableData();
    }

    /**
     * 将当前肉鸽快照写入当前存档；没有当前槽位时自动选择第一个空槽。
     * 存档目录信息由 GUI_SaveFileManager 生成，因此新建槽位也能正常显示
     * 截图、地图和时间。该方法只保存活动中的肉鸽状态，不改变普通流程。
     */
    static saveProgress(): void {
        if (!this.active || typeof SinglePlayerGame === "undefined") return;
        this._savePending = true;
        this.flushSaveQueue();
    }

    private static closeRun(status: string): void {
        if (!this._state) return;
        let closingState = this._state;
        closingState.runStatus = status;
        if (closingState.mainPlayerSnapshot) {
            this.applyPlayerData(ObjectUtils.depthClone(closingState.mainPlayerSnapshot), closingState.mainPlayerSnapshotComplete);
        }
        if (closingState.mainVariableSnapshot) {
            this.applyVariableData(ObjectUtils.depthClone(closingState.mainVariableSnapshot));
        }
        this.restoreWorldRules(closingState);
        this._savePending = false;
        this._saveRetryCount = 0;
        this._saveID = this.resolveSaveID();
        this._cleanupSavePending = this._saveID > 0 && typeof SinglePlayerGame !== "undefined";
        this._state = null;
        EventUtils.happen(RogueRunManager, this.EVENT_RUN_FINISHED, [status, closingState]);
        // Do not persist while still inside a roguelike battle scene. Once the
        // entrance scene has finished loading, write the restored normal player
        // state with RogueRun=null so an ended run cannot be recovered again.
        if (this._cleanupSavePending) {
            this.ensureSaveStateListener();
            this.trySaveCleanup();
        }
    }

    private static capturePlayerData(): any {
        return ObjectUtils.depthClone(Game.player.data);
    }

    private static applyPlayerData(snapshot: any, replaceAll: boolean = false): void {
        if (!snapshot || !Game || !Game.player || !Game.player.data) return;
        let playerData = Game.player.data as any;
        if (replaceAll) {
            for (let key in playerData) {
                if (playerData.hasOwnProperty(key) && snapshot[key] === undefined) delete playerData[key];
            }
        }
        for (let key in snapshot) {
            if (snapshot.hasOwnProperty(key)) playerData[key] = ObjectUtils.depthClone(snapshot[key]);
        }
    }

    private static captureVariableData(): any {
        if (!Game || !Game.player || !Game.player.variable) return null;
        return {
            variables: ObjectUtils.depthClone(Game.player.variable["variables"] || []),
            switchs: ObjectUtils.depthClone(Game.player.variable["switchs"] || []),
            strings: ObjectUtils.depthClone(Game.player.variable["strings"] || [])
        };
    }

    private static applyVariableData(snapshot: any): void {
        if (!snapshot || !Game || !Game.player || !Game.player.variable) return;
        Game.player.variable["variables"] = snapshot.variables || [];
        Game.player.variable["switchs"] = snapshot.switchs || [];
        Game.player.variable["strings"] = snapshot.strings || [];
    }

    private static restoreWorldRules(state: RogueRunState): void {
        if (!state || !state.worldRuleSnapshot) return;
        if (typeof state.worldRuleSnapshot.fullStateWhenBattleStart === "boolean") {
            WorldData.fullStateWhenBattleStart = state.worldRuleSnapshot.fullStateWhenBattleStart;
        }
        if (typeof state.worldRuleSnapshot.battleScene === "number") WorldData.battleScene = state.worldRuleSnapshot.battleScene;
        if (typeof state.worldRuleSnapshot.battleReadyBGM === "string") WorldData.battleReadyBGM = state.worldRuleSnapshot.battleReadyBGM;
        if (typeof state.worldRuleSnapshot.battleBGM === "string") WorldData.battleBGM = state.worldRuleSnapshot.battleBGM;
        if (typeof state.worldRuleSnapshot.battleSceneBGM === "string") WorldData.battleSceneBGM = state.worldRuleSnapshot.battleSceneBGM;
    }

    private static findAvailableSaveID(): number {
        if (typeof SinglePlayerGame === "undefined") return 0;
        let max = typeof WorldData !== "undefined" && WorldData.saveFileMax ? WorldData.saveFileMax : 1;
        let saveInfo = SinglePlayerGame.getSaveInfo ? SinglePlayerGame.getSaveInfo() : [];
        saveInfo = saveInfo || [];
        for (let id = 1; id <= max; id++) {
            let occupied = false;
            for (let i = 0; i < saveInfo.length; i++) {
                if (saveInfo[i] && saveInfo[i].id === id) {
                    occupied = true;
                    break;
                }
            }
            if (!occupied) return id;
        }
        // Never silently replace slot 1. A current slot is handled by
        // resolveSaveID(); without one the run must wait for a free slot.
        return 0;
    }

    private static resolveSaveID(): number {
        if (typeof SinglePlayerGame === "undefined") return 0;
        let manager: any = typeof GUI_SaveFileManager === "undefined" ? null : GUI_SaveFileManager;
        if (manager && manager.currentSveFileIndexInfo && manager.currentSveFileIndexInfo.id > 0) {
            return manager.currentSveFileIndexInfo.id;
        }
        if (this._saveID > 0 && typeof SinglePlayerGame.getSaveInfoByID === "function" &&
            SinglePlayerGame.getSaveInfoByID(this._saveID)) return this._saveID;
        return this.findAvailableSaveID();
    }

    /** Coalesce every burst into the in-flight write plus at most one latest write. */
    private static flushSaveQueue(): void {
        if (this._saveInFlight || !this._savePending) return;
        if (!this.active) {
            this._savePending = false;
            this.removeSaveStateListenerIfIdle();
            return;
        }
        if (!this.isSaveSceneReady(false)) {
            this.ensureSaveStateListener();
            return;
        }
        let saveID = this.resolveSaveID();
        if (saveID < 1) {
            this._savePending = false;
            this.warnSave("没有可用存档槽，已跳过本次肉鸽自动存档。");
            this.removeSaveStateListenerIfIdle();
            return;
        }
        this._saveID = saveID;
        this.syncRuntimeState();
        this._savePending = false;
        this._saveInFlight = true;
        let onSaved = Callback.New((success: boolean) => {
            this._saveInFlight = false;
            if (success === true) {
                this._saveRetryCount = 0;
                this.updateCurrentSaveInfo(saveID);
            }
            else if (!this._cleanupSavePending && this.active) {
                this._savePending = true;
                this.retrySave("肉鸽进度存档失败，将自动重试。");
            }
            if (this._cleanupSavePending) this.trySaveCleanup();
            // A successful write may have collected more kills while it was in
            // flight; flush that single latest snapshot immediately. Failed
            // writes are handled by the bounded delayed retry above.
            else if (success === true && this._savePending && this.active) this.flushSaveQueue();
            this.removeSaveStateListenerIfIdle();
        }, this);
        this.writeSave(saveID, onSaved);
    }

    private static trySaveCleanup(): void {
        if (!this._cleanupSavePending || this._saveInFlight) return;
        if (!this.isSaveSceneReady(true)) {
            this.ensureSaveStateListener();
            return;
        }
        let saveID = this._saveID > 0 ? this._saveID : this.resolveSaveID();
        if (saveID < 1) {
            this._cleanupSavePending = false;
            this.warnSave("没有可用存档槽，无法写入肉鸽结束状态。");
            this.removeSaveStateListenerIfIdle();
            return;
        }
        this._saveID = saveID;
        this._saveInFlight = true;
        let onSaved = Callback.New((success: boolean) => {
            this._saveInFlight = false;
            if (success === true) {
                this._cleanupSavePending = false;
                this._saveRetryCount = 0;
                this.updateCurrentSaveInfo(saveID);
            }
            else this.retrySave("肉鸽结束状态存档失败，将自动重试。");
            this.removeSaveStateListenerIfIdle();
        }, this);
        this.writeSave(saveID, onSaved);
    }

    private static writeSave(saveID: number, onSaved: Callback): void {
        let saveManager: any = typeof GUI_SaveFileManager === "undefined" ? null : GUI_SaveFileManager;
        try {
            if (saveManager && typeof saveManager.saveFile === "function") saveManager.saveFile(saveID, false, onSaved);
            else SinglePlayerGame.saveGame(saveID, onSaved);
        }
        catch (error) {
            onSaved.runWith([false]);
        }
    }

    private static retrySave(message: string): void {
        this._saveRetryCount++;
        this.warnSave(message);
        if (this._saveRetryCount > this.MAX_SAVE_RETRIES) {
            this.warnSave("肉鸽自动存档连续失败，已停止自动重试。");
            this._savePending = false;
            this._cleanupSavePending = false;
            return;
        }
        if (this._retryScheduled) return;
        this._retryScheduled = true;
        setTimeout(() => {
            this._retryScheduled = false;
            if (this._cleanupSavePending) this.trySaveCleanup();
            else this.flushSaveQueue();
        }, 500 * this._saveRetryCount);
    }

    private static updateCurrentSaveInfo(saveID: number): void {
        let manager: any = typeof GUI_SaveFileManager === "undefined" ? null : GUI_SaveFileManager;
        if (!manager || typeof SinglePlayerGame.getSaveInfoByID !== "function") return;
        let info = SinglePlayerGame.getSaveInfoByID(saveID);
        if (info) manager.currentSveFileIndexInfo = info;
    }

    private static isSaveSceneReady(entryOnly: boolean): boolean {
        if (typeof Game === "undefined" || !Game.currentScene) return false;
        if (entryOnly && Game.currentScene.id !== this.ENTRY_SCENE_ID) return false;
        if (typeof GameGate !== "undefined" &&
            (GameGate.gateState == null || GameGate.gateState < GameGate.STATE_3_IN_SCENE_COMPLETE)) return false;
        return true;
    }

    private static ensureSaveStateListener(): void {
        if (this._saveStateListenerRegistered || typeof GameGate === "undefined") return;
        EventUtils.addEventListenerFunction(GameGate, GameGate.EVENT_IN_SCENE_STATE_CHANGE, this.onSaveSceneStateChange, this);
        this._saveStateListenerRegistered = true;
    }

    private static onSaveSceneStateChange(): void {
        if (this._cleanupSavePending) this.trySaveCleanup();
        else if (this._savePending) this.flushSaveQueue();
        this.removeSaveStateListenerIfIdle();
    }

    private static removeSaveStateListenerIfIdle(): void {
        if (this._saveInFlight || this._savePending || this._cleanupSavePending || this._retryScheduled) return;
        this.removeSaveStateListener();
    }

    private static removeSaveStateListener(): void {
        if (!this._saveStateListenerRegistered || typeof GameGate === "undefined") return;
        EventUtils.removeEventListenerFunction(GameGate, GameGate.EVENT_IN_SCENE_STATE_CHANGE, this.onSaveSceneStateChange, this);
        this._saveStateListenerRegistered = false;
    }

    private static warnSave(message: string): void {
        if (typeof console !== "undefined" && console.warn) console.warn("[RogueRunManager] " + message);
    }

    private static createSeed(): number {
        let now = new Date().getTime();
        return ((now & 0xFFFFFFFF) ^ Math.floor(Math.random() * 0x7FFFFFFF)) >>> 0;
    }
}
