/**
 * Serializable state for one roguelike run.
 */
class RogueRunState {
    static readonly SCHEMA_VERSION: number = 5;
    schemaVersion: number = RogueRunState.SCHEMA_VERSION;
    runID: string = "";
    runStatus: string = "inactive";
    seed: number = 0;
    contentVersion: number = 1;
    cardPoolVersion: number = 1;
    balanceVersion: number = 1;
    floorIndex: number = 0;
    currentNodeID: string = "";
    /** Final-node settlement is kept on the run so repeated battle-stop events are harmless. */
    finalNodeCompleted: boolean = false;
    nodeOrder: string[] = [];
    nodeSceneIDs: { [nodeID: string]: number } = {};
    runLevel: number = 1;
    killCount: number = 0;
    gold: number = 0;
    partySnapshots: any[] = [];
    temporaryPackage: any[] = [];
    temporaryEquipments: any[] = [];
    temporarySkills: any[] = [];
    skillUpgrades: any[] = [];
    temporaryPassives: any[] = [];
    rewardQueue: any[] = [];
    pendingRewardContinuation: string = "";
    completedTransactionIDs: string[] = [];
    processedDeathIDs: string[] = [];
    battlerUIDCounter: number = 0;
    visitedSceneIDs: number[] = [];
    usedBossIDs: number[] = [];
    worldRuleSnapshot: any = null;
    mainPlayerSnapshot: any = null;
    mainPlayerSnapshotComplete: boolean = false;
    variableSnapshots: any = null;
    mainVariableSnapshot: any = null;
    lastTransactionID: string = "";

    static create(seed: number): RogueRunState {
        let state = new RogueRunState();
        state.seed = seed >>> 0;
        state.runID = "rogue-" + new Date().getTime() + "-" + state.seed;
        state.runStatus = "active";
        state.nodeOrder = ["battle-a", "battle-b", "boss", "battle-c", "battle-d", "boss-2", "battle-e", "battle-f", "boss-3"];
        state.nodeSceneIDs = RogueRunState.createNodeScenePlan(state.seed);
        state.currentNodeID = state.nodeOrder[0];
        return state;
    }

    private static createNodeScenePlan(seed: number): { [nodeID: string]: number } {
        let random = seed >>> 0;
        let nextRandom = () => {
            random = (random * 1664525 + 1013904223) >>> 0;
            return random / 0x100000000;
        };
        let smallScenes = [17, 18, 20, 21, 22];
        let bossScenes = [19, 23, 24];
        let plan: { [nodeID: string]: number } = {};
        let smallNodeIDs = ["battle-a", "battle-b", "battle-c", "battle-d", "battle-e", "battle-f"];
        let remainingSmall: number[] = [];
        for (let i = 0; i < smallNodeIDs.length; i++) {
            if (remainingSmall.length === 0) remainingSmall = smallScenes.slice();
            let index = Math.floor(nextRandom() * remainingSmall.length);
            plan[smallNodeIDs[i]] = remainingSmall.splice(index, 1)[0];
        }
        for (let i = 0; i < 3; i++) {
            let index = Math.floor(nextRandom() * bossScenes.length);
            plan[["boss", "boss-2", "boss-3"][i]] = bossScenes.splice(index, 1)[0];
        }
        return plan;
    }

    static fromSaveData(data: any): RogueRunState {
        if (!data || (data.schemaVersion !== 1 && data.schemaVersion !== 2 && data.schemaVersion !== 3 &&
            data.schemaVersion !== 4 && data.schemaVersion !== RogueRunState.SCHEMA_VERSION)) return null;
        let sourceVersion = data.schemaVersion;
        let state = new RogueRunState();
        for (let key in state) {
            if (data[key] !== undefined) state[key] = data[key];
        }
        state.partySnapshots = state.partySnapshots || [];
        state.temporaryPackage = state.temporaryPackage || [];
        state.temporaryEquipments = state.temporaryEquipments || [];
        state.temporarySkills = state.temporarySkills || [];
        state.skillUpgrades = state.skillUpgrades || [];
        for (let i = 0; i < state.temporarySkills.length; i++) {
            let entry = state.temporarySkills[i];
            if (!entry || !entry.skill) continue;
            if (!entry.baseSkill) entry.baseSkill = JSON.parse(JSON.stringify(entry.skill));
        }
        state.temporaryPassives = state.temporaryPassives || [];
        state.rewardQueue = state.rewardQueue || [];
        for (let i = 0; i < state.rewardQueue.length; i++) {
            // An open reward UI is not a committed transaction.
            if (state.rewardQueue[i].status === "showing") state.rewardQueue[i].status = "pending";
        }
        state.processedDeathIDs = state.processedDeathIDs || [];
        state.completedTransactionIDs = state.completedTransactionIDs || [];
        state.visitedSceneIDs = state.visitedSceneIDs || [];
        state.usedBossIDs = state.usedBossIDs || [];
        if (!state.nodeOrder || state.nodeOrder.length === 0) {
            state.nodeOrder = ["battle-a", "battle-b", "boss", "battle-c", "battle-d", "boss-2", "battle-e", "battle-f", "boss-3"];
            state.nodeSceneIDs = RogueRunState.createNodeScenePlan(state.seed);
            let legacyOrder = ["battle-a", "battle-b", "battle-c", "battle-d", "battle-e", "boss", "boss-2", "boss-3"];
            let legacyIndex = legacyOrder.indexOf(state.currentNodeID);
            if (legacyIndex >= 0) state.currentNodeID = state.nodeOrder[Math.min(legacyIndex, state.nodeOrder.length - 1)];
        }
        state.nodeSceneIDs = state.nodeSceneIDs || RogueRunState.createNodeScenePlan(state.seed);
        state.pendingRewardContinuation = state.pendingRewardContinuation || "";
        state.battlerUIDCounter = state.battlerUIDCounter || 0;
        // Schema v1 only captured a subset of PlayerData and must be merged on restore.
        if (sourceVersion === 1) state.mainPlayerSnapshotComplete = false;
        state.schemaVersion = RogueRunState.SCHEMA_VERSION;
        return state;
    }
}
