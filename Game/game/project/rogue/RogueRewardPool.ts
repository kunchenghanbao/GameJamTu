/**
 * Deterministic starter reward pool. Only explicitly registered content is used.
 */
class RogueRewardPool {
    private static readonly STARTER_CONTENT: any[] = [
        { moduleID: 9, dataID: 1, type: "weapon", weight: 20 },
        { moduleID: 9, dataID: 5, type: "weapon", weight: 20 },
        { moduleID: 9, dataID: 9, type: "weapon", weight: 20 },
        { moduleID: 9, dataID: 13, type: "weapon", weight: 20 },
        { moduleID: 9, dataID: 21, type: "weapon", weight: 20 },
        { moduleID: 9, dataID: 2, type: "equipment", weight: 25 },
        { moduleID: 9, dataID: 3, type: "equipment", weight: 25 },
        { moduleID: 9, dataID: 4, type: "equipment", weight: 25 },
        { moduleID: 9, dataID: 6, type: "equipment", weight: 25 },
        { moduleID: 9, dataID: 7, type: "equipment", weight: 25 },
        { moduleID: 9, dataID: 8, type: "equipment", weight: 25 },
        { moduleID: 9, dataID: 10, type: "equipment", weight: 25 },
        { moduleID: 9, dataID: 11, type: "equipment", weight: 25 },
        { moduleID: 9, dataID: 12, type: "equipment", weight: 25 },
        { moduleID: 9, dataID: 14, type: "equipment", weight: 25 },
        { moduleID: 9, dataID: 15, type: "equipment", weight: 25 },
        { moduleID: 9, dataID: 16, type: "equipment", weight: 25 },
        { moduleID: 9, dataID: 17, type: "equipment", weight: 25 },
        { moduleID: 9, dataID: 18, type: "equipment", weight: 25 },
        { moduleID: 9, dataID: 19, type: "equipment", weight: 25 },
        { moduleID: 9, dataID: 20, type: "equipment", weight: 25 },
        { moduleID: 9, dataID: 22, type: "equipment", weight: 25 },
        { moduleID: 9, dataID: 23, type: "equipment", weight: 25 },
        { moduleID: 9, dataID: 24, type: "equipment", weight: 25 },
        { moduleID: 9, dataID: 25, type: "equipment", weight: 25 },
        { moduleID: 9, dataID: 1001, type: "equipment", weight: 20 },
        { moduleID: 9, dataID: 1002, type: "equipment", weight: 20 },
        { moduleID: 9, dataID: 1003, type: "equipment", weight: 20 },
        { moduleID: 9, dataID: 1004, type: "equipment", weight: 20 },
        { moduleID: 9, dataID: 1005, type: "equipment", weight: 20 },
        { moduleID: 9, dataID: 1006, type: "equipment", weight: 20 },
        { moduleID: 9, dataID: 1007, type: "equipment", weight: 20 },
        { moduleID: 9, dataID: 1008, type: "equipment", weight: 20 },
        { moduleID: 9, dataID: 1009, type: "equipment", weight: 20 },
        { moduleID: 9, dataID: 2001, type: "equipment", weight: 20 },
        { moduleID: 9, dataID: 2002, type: "equipment", weight: 20 },
        { moduleID: 9, dataID: 2003, type: "equipment", weight: 20 },
        { moduleID: 9, dataID: 2004, type: "equipment", weight: 20 },
        { moduleID: 9, dataID: 2005, type: "equipment", weight: 20 },
        { moduleID: 9, dataID: 2006, type: "equipment", weight: 20 },
        { moduleID: 9, dataID: 2007, type: "equipment", weight: 20 },
        { moduleID: 9, dataID: 3001, type: "equipment", weight: 20 },
        { moduleID: 9, dataID: 3002, type: "equipment", weight: 20 },
        { moduleID: 9, dataID: 3003, type: "equipment", weight: 20 },
        { moduleID: 9, dataID: 3004, type: "equipment", weight: 20 },
        { moduleID: 9, dataID: 3005, type: "equipment", weight: 20 },
        { moduleID: 9, dataID: 3006, type: "equipment", weight: 20 },
        { moduleID: 9, dataID: 3007, type: "equipment", weight: 20 },
        { moduleID: 9, dataID: 3008, type: "equipment", weight: 20 },
        { moduleID: 9, dataID: 3009, type: "equipment", weight: 20 },
        { moduleID: 9, dataID: 3010, type: "equipment", weight: 20 },
        { moduleID: 9, dataID: 3011, type: "equipment", weight: 20 },
        { moduleID: 9, dataID: 4001, type: "equipment", weight: 20 },
        { moduleID: 9, dataID: 4002, type: "equipment", weight: 20 },
        { moduleID: 9, dataID: 4003, type: "equipment", weight: 20 },
        { moduleID: 9, dataID: 4004, type: "equipment", weight: 20 },
        { moduleID: 9, dataID: 4005, type: "equipment", weight: 20 },
        { moduleID: 9, dataID: 4006, type: "equipment", weight: 20 },
        { moduleID: 9, dataID: 4007, type: "equipment", weight: 20 },
        { moduleID: 8, dataID: 1, type: "activeSkill", weight: 25 },
        { moduleID: 8, dataID: 2, type: "activeSkill", weight: 25 },
        { moduleID: 8, dataID: 3, type: "activeSkill", weight: 25 },
        { moduleID: 8, dataID: 4, type: "activeSkill", weight: 25 },
        { moduleID: 8, dataID: 5, type: "activeSkill", weight: 25 },
        { moduleID: 8, dataID: 6, type: "activeSkill", weight: 25 },
        { moduleID: 8, dataID: 7, type: "activeSkill", weight: 25 },
        { moduleID: 8, dataID: 8, type: "activeSkill", weight: 25 },
        { moduleID: 8, dataID: 9, type: "activeSkill", weight: 25 },
        { moduleID: 8, dataID: 10, type: "activeSkill", weight: 25 },
        { moduleID: 8, dataID: 11, type: "activeSkill", weight: 25 },
        { moduleID: 8, dataID: 12, type: "activeSkill", weight: 25 },
        { moduleID: 8, dataID: 13, type: "activeSkill", weight: 25 },
        { moduleID: 8, dataID: 14, type: "activeSkill", weight: 25 },
        { moduleID: 8, dataID: 15, type: "activeSkill", weight: 25 },
        { moduleID: 8, dataID: 16, type: "activeSkill", weight: 25 },
        { moduleID: 8, dataID: 17, type: "activeSkill", weight: 25 },
        { moduleID: 8, dataID: 18, type: "activeSkill", weight: 25 },
        { moduleID: 8, dataID: 19, type: "activeSkill", weight: 25 },
        { moduleID: 8, dataID: 20, type: "activeSkill", weight: 25 },
        { moduleID: 8, dataID: 21, type: "activeSkill", weight: 25 },
        { moduleID: 8, dataID: 22, type: "activeSkill", weight: 25 },
        { moduleID: 8, dataID: 23, type: "activeSkill", weight: 25 },
        { moduleID: 8, dataID: 24, type: "activeSkill", weight: 25 },
        { moduleID: 8, dataID: 25, type: "activeSkill", weight: 25 },
        { moduleID: 8, dataID: 26, type: "activeSkill", weight: 25 },
        { moduleID: 8, dataID: 27, type: "activeSkill", weight: 25 },
        { moduleID: 8, dataID: 28, type: "activeSkill", weight: 25 },
        { moduleID: 8, dataID: 29, type: "activeSkill", weight: 25 },
        { moduleID: 8, dataID: 30, type: "activeSkill", weight: 25 },
        { moduleID: 8, dataID: 31, type: "activeSkill", weight: 25 },
        { moduleID: 8, dataID: 32, type: "activeSkill", weight: 25 },
        { moduleID: 8, dataID: 33, type: "activeSkill", weight: 25 },
        { moduleID: 8, dataID: 34, type: "activeSkill", weight: 25 },
        { moduleID: 8, dataID: 35, type: "activeSkill", weight: 25 },
        { moduleID: 8, dataID: 36, type: "activeSkill", weight: 25 },
        { moduleID: 8, dataID: 37, type: "activeSkill", weight: 25 },
        { moduleID: 8, dataID: 38, type: "activeSkill", weight: 25 },
        { moduleID: 8, dataID: 39, type: "activeSkill", weight: 25 },
        { moduleID: 8, dataID: 40, type: "activeSkill", weight: 25 },
        { moduleID: 8, dataID: 41, type: "activeSkill", weight: 25 },
        { moduleID: 8, dataID: 42, type: "activeSkill", weight: 25 },
        { moduleID: 8, dataID: 43, type: "activeSkill", weight: 25 },
        { moduleID: 8, dataID: 44, type: "passiveSkill", weight: 15 },
        { moduleID: 8, dataID: 45, type: "passiveSkill", weight: 15 },
        { moduleID: 8, dataID: 46, type: "passiveSkill", weight: 15 },
        { moduleID: 8, dataID: 47, type: "passiveSkill", weight: 6 },
        { moduleID: 8, dataID: 48, type: "activeSkill", weight: 6 },
        { moduleID: 8, dataID: 49, type: "activeSkill", weight: 25 },
        { moduleID: 8, dataID: 50, type: "activeSkill", weight: 25 },
        { moduleID: 8, dataID: 51, type: "activeSkill", weight: 15 },
        { moduleID: 8, dataID: 52, type: "activeSkill", weight: 25 },
        { moduleID: 8, dataID: 53, type: "activeSkill", weight: 25 },
        { moduleID: 8, dataID: 54, type: "passiveSkill", weight: 15 },
        { moduleID: 8, dataID: 55, type: "activeSkill", weight: 6 },
        { moduleID: 8, dataID: 56, type: "activeSkill", weight: 25 },
        { moduleID: 8, dataID: 57, type: "activeSkill", weight: 25 },
        { moduleID: 8, dataID: 58, type: "activeSkill", weight: 25 },
        { moduleID: 8, dataID: 59, type: "activeSkill", weight: 15 },
        { moduleID: 8, dataID: 60, type: "activeSkill", weight: 6 },
        // Sword, elemental and tactical skills 61-75.
        { moduleID: 8, dataID: 61, type: "activeSkill", weight: 25 },
        { moduleID: 8, dataID: 62, type: "activeSkill", weight: 25 },
        { moduleID: 8, dataID: 63, type: "passiveSkill", weight: 15 },
        { moduleID: 8, dataID: 64, type: "activeSkill", weight: 15 },
        { moduleID: 8, dataID: 65, type: "activeSkill", weight: 8, minFloor: 2 },
        { moduleID: 8, dataID: 66, type: "passiveSkill", weight: 8, minFloor: 2 },
        { moduleID: 8, dataID: 67, type: "activeSkill", weight: 15, minFloor: 1 },
        { moduleID: 8, dataID: 68, type: "activeSkill", weight: 25 },
        { moduleID: 8, dataID: 69, type: "activeSkill", weight: 15, minFloor: 1 },
        { moduleID: 8, dataID: 70, type: "activeSkill", weight: 15, minFloor: 1 },
        { moduleID: 8, dataID: 71, type: "activeSkill", weight: 8, minFloor: 2 },
        { moduleID: 8, dataID: 72, type: "passiveSkill", weight: 15, minFloor: 1 },
        { moduleID: 8, dataID: 73, type: "passiveSkill", weight: 25 },
        { moduleID: 8, dataID: 74, type: "activeSkill", weight: 25 },
        { moduleID: 8, dataID: 75, type: "passiveSkill", weight: 8, minFloor: 2 },
        // Drunken-fist skills for 萧酉歌.  The passive is intentionally
        // lower-weighted so a run does not flood the pool with duplicates.
        { moduleID: 8, dataID: 76, type: "activeSkill", weight: 18 },
        { moduleID: 8, dataID: 77, type: "activeSkill", weight: 22 },
        { moduleID: 8, dataID: 78, type: "activeSkill", weight: 18 },
        { moduleID: 8, dataID: 79, type: "activeSkill", weight: 18, minFloor: 1 },
        { moduleID: 8, dataID: 80, type: "activeSkill", weight: 12, minFloor: 1 },
        { moduleID: 8, dataID: 81, type: "passiveSkill", weight: 8, minFloor: 1 },
        // Enemy skills are copied into the player's run-only skill pool.
        // Their lower weight keeps the original player skill families visible.
        { moduleID: 8, dataID: 1001, type: "activeSkill", weight: 15, enemySkill: true },
        { moduleID: 8, dataID: 1002, type: "activeSkill", weight: 15, enemySkill: true },
        { moduleID: 8, dataID: 1003, type: "activeSkill", weight: 15, enemySkill: true },
        { moduleID: 8, dataID: 1004, type: "activeSkill", weight: 15, enemySkill: true },
        { moduleID: 8, dataID: 1005, type: "activeSkill", weight: 15, enemySkill: true },
        { moduleID: 8, dataID: 1006, type: "activeSkill", weight: 15, enemySkill: true },
        { moduleID: 8, dataID: 1007, type: "activeSkill", weight: 15, enemySkill: true },
        { moduleID: 8, dataID: 1008, type: "activeSkill", weight: 15, enemySkill: true },
        { moduleID: 8, dataID: 1009, type: "activeSkill", weight: 15, enemySkill: true },
        { moduleID: 8, dataID: 1010, type: "activeSkill", weight: 15, enemySkill: true },
        { moduleID: 8, dataID: 1011, type: "activeSkill", weight: 15, enemySkill: true },
        { moduleID: 8, dataID: 1012, type: "activeSkill", weight: 15, enemySkill: true },
        { moduleID: 8, dataID: 1013, type: "activeSkill", weight: 15, enemySkill: true },
        { moduleID: 8, dataID: 1014, type: "activeSkill", weight: 15, enemySkill: true },
        { moduleID: 8, dataID: 1015, type: "activeSkill", weight: 15, enemySkill: true },
        { moduleID: 8, dataID: 1016, type: "activeSkill", weight: 15, enemySkill: true },
        { moduleID: 8, dataID: 1017, type: "activeSkill", weight: 15, enemySkill: true },
        { moduleID: 8, dataID: 1018, type: "activeSkill", weight: 15, enemySkill: true },
        { moduleID: 1, dataID: 2, type: "consumable", weight: 15 },
        { moduleID: 1, dataID: 3, type: "consumable", weight: 15 },
        { moduleID: 1, dataID: 4, type: "consumable", weight: 15 },
        { moduleID: 1, dataID: 5, type: "consumable", weight: 8, quality: 2, minFloor: 1 },
        { moduleID: 1, dataID: 6, type: "consumable", weight: 15, quantity: 2 },
        { moduleID: 1, dataID: 7, type: "consumable", weight: 8, quality: 2, minFloor: 1 },
        { moduleID: 1, dataID: 8, type: "consumable", weight: 8, quality: 2, minFloor: 1 },
        { moduleID: 1, dataID: 9, type: "consumable", weight: 8, quality: 2, minFloor: 1 },
        { moduleID: 1, dataID: 10, type: "consumable", weight: 8, quality: 2, minFloor: 1 },
        { moduleID: 1, dataID: 11, type: "consumable", weight: 8, quality: 2, minFloor: 1 },
        { moduleID: 1, dataID: 12, type: "consumable", weight: 15, quantity: 2 },
        { moduleID: 1, dataID: 13, type: "consumable", weight: 15, quantity: 2 },
        { moduleID: 1, dataID: 14, type: "consumable", weight: 15 },
        { moduleID: 1, dataID: 15, type: "consumable", weight: 8, quality: 2, minFloor: 1 },
        { moduleID: 1, dataID: 16, type: "consumable", weight: 3, quality: 3, minFloor: 3 },
        { moduleID: 1, dataID: 17, type: "consumable", weight: 15 },
        { moduleID: 1, dataID: 18, type: "consumable", weight: 15 },
        { moduleID: 1, dataID: 19, type: "consumable", weight: 8, quality: 2, minFloor: 1 },
        { moduleID: 1, dataID: 20, type: "consumable", weight: 8, quality: 2, minFloor: 1 },
        { moduleID: 1, dataID: 21, type: "consumable", weight: 3, quality: 3, minFloor: 3 },
        { moduleID: 1, dataID: 22, type: "consumable", weight: 3, quality: 3, minFloor: 3 },
        { moduleID: 1, dataID: 23, type: "consumable", weight: 8, quality: 2, minFloor: 1 },
        { moduleID: 1, dataID: 24, type: "consumable", weight: 3, quality: 3, minFloor: 3 },
        { moduleID: 1, dataID: 25, type: "consumable", weight: 3, quality: 3, minFloor: 3 }
    ];

    static createRewardGroup(deadBattlerUID: string, killOwnerUID: string): any {
        if (!RogueRunManager.active) return null;
        let state = RogueRunManager.state;
        let groupSeed = this.mixSeed(state.seed, state.floorIndex, state.killCount, state.cardPoolVersion);
        let cards = this.drawCards(groupSeed, 3);
        if (cards.length < 3) this.addFallbackCards(cards, groupSeed);
        let transactionID = RogueRunManager.nextTransactionID("reward-create");
        return {
            rewardGroupID: state.runID + ":reward:" + state.killCount,
            deadBattlerUID: deadBattlerUID,
            killOwnerUID: killOwnerUID,
            seed: groupSeed,
            cards: cards,
            selectedCardID: "",
            status: "pending",
            createdTransactionID: transactionID,
            confirmedTransactionID: ""
        };
    }

    private static drawCards(seed: number, count: number): any[] {
        let candidates: any[] = [];
        for (let i = 0; i < this.STARTER_CONTENT.length; i++) {
            let meta = this.STARTER_CONTENT[i];
            if ((meta.minFloor || 0) > RogueRunManager.state.floorIndex) continue;
            let definition = GameData.getModuleData(meta.moduleID, meta.dataID);
            if (!definition) continue;
            candidates.push({ meta: meta, definition: definition });
        }
        let cards: any[] = [];
        let usedConsumable = false;
        let usedEnemySkill = false;
        let usedSwordSkills = 0;
        let usedControlSkills = 0;
        let randomState = seed >>> 0;
        while (cards.length < count && candidates.length > 0) {
            let selectable = candidates.filter(c => (!c.meta.enemySkill || !usedEnemySkill) && (!usedConsumable || c.meta.type !== "consumable") &&
                (usedSwordSkills < 2 || !this.isSwordMeta(c.meta)) && (usedControlSkills < 2 || !this.isControlMeta(c.meta)));
            if (selectable.length == 0) break;
            let categoryWeights: any = { skill: 45, equipment: 40, consumable: 15 };
            let availableCategories: any[] = [];
            for (let category in categoryWeights) {
                if (selectable.some(c => this.getRewardCategory(c.meta) === category)) {
                    availableCategories.push({ category: category, weight: categoryWeights[category] });
                }
            }
            randomState = this.nextRandom(randomState);
            let categoryTotal = availableCategories.reduce((sum, entry) => sum + entry.weight, 0);
            let categoryRoll = (randomState / 4294967296) * categoryTotal;
            let selectedCategory = availableCategories[availableCategories.length - 1].category;
            for (let i = 0; i < availableCategories.length; i++) {
                categoryRoll -= availableCategories[i].weight;
                if (categoryRoll <= 0) {
                    selectedCategory = availableCategories[i].category;
                    break;
                }
            }
            let weighted = selectable.filter(c => this.getRewardCategory(c.meta) === selectedCategory);
            let totalWeight = 0;
            for (let i = 0; i < weighted.length; i++) totalWeight += this.getContentWeight(weighted[i].meta);
            randomState = this.nextRandom(randomState);
            let roll = (randomState / 4294967296) * totalWeight;
            let selected = weighted[weighted.length - 1];
            for (let i = 0; i < weighted.length; i++) {
                roll -= this.getContentWeight(weighted[i].meta);
                if (roll <= 0) {
                    selected = weighted[i];
                    break;
                }
            }
            cards.push(this.createCardSnapshot(selected.meta, selected.definition, cards.length));
            if (selected.meta.type === "consumable") usedConsumable = true;
            if (selected.meta.enemySkill) usedEnemySkill = true;
            if (this.isSwordMeta(selected.meta)) usedSwordSkills++;
            if (this.isControlMeta(selected.meta)) usedControlSkills++;
            candidates.splice(candidates.indexOf(selected), 1);
        }
        return cards;
    }

    private static createCardSnapshot(meta: any, definition: any, index: number): any {
        let playerDefinition = meta.moduleID === 8 && meta.enemySkill
            ? this.createPlayerEnemySkillDefinition(meta.dataID, definition)
            : ObjectUtils.depthClone(definition);
        let quality = meta.quality || (meta.moduleID == 9 ? (playerDefinition.quality || 1) : 1);
        let quantity = Math.max(1, meta.quantity || 1);
        return {
            cardID: RogueRunManager.state.runID + ":card:" + RogueRunManager.state.killCount + ":" + index,
            type: meta.type,
            quality: quality,
            name: (playerDefinition.name || "未知奖励") + (quantity > 1 ? " x" + quantity : ""),
            description: playerDefinition.intro || "",
            iconID: playerDefinition.icon || "",
            sourceModuleID: meta.moduleID,
            sourceDefinitionID: meta.dataID,
            quantity: quantity,
            enemySkill: !!meta.enemySkill,
            definitionVersion: RogueRunManager.state.contentVersion,
            effectSnapshot: playerDefinition,
            duplicatePolicy: meta.moduleID == 8 ? "upgrade" : "allow"
        };
    }

    private static getRewardCategory(meta: any): string {
        if (meta.moduleID === 8) return "skill";
        if (meta.moduleID === 9) return "equipment";
        return "consumable";
    }

    private static getContentWeight(meta: any): number {
        let weight = meta.weight || 1;
        // Keep the enemy-skill branch discoverable after expanding the player
        // pool with 61-75; its cap still limits each reward group to one card.
        if (meta.enemySkill) weight *= 1.5;
        // Small build-aware nudges make the new families form naturally linked
        // offers without making any card mandatory.  The guards keep reward
        // generation deterministic in editor/test contexts without a player.
        if (meta.moduleID === 8 && this.ownsAnySkill([61, 62, 63, 64, 65, 66]) && meta.dataID >= 61 && meta.dataID <= 66) weight *= 1.3;
        if (meta.moduleID === 8 && meta.dataID === 67 && this.ownsAnySkill([49, 50, 51, 55])) weight *= 1.2;
        if (meta.moduleID === 8 && meta.dataID === 72 && this.ownsAnySkill([52, 53])) weight *= 1.2;
        if (meta.moduleID === 8 && (meta.dataID === 64 || meta.dataID === 65) && this.ownsAnySkill([69, 70, 74])) weight *= 1.2;
        if (meta.moduleID === 8 && (meta.dataID === 73 || meta.dataID === 74) && this.ownsAnySkill([2, 3, 4, 5, 6, 13, 15, 18])) weight *= 1.15;
        if (meta.quality === 3 && RogueRunManager.state.currentNodeID && RogueRunManager.state.currentNodeID.indexOf("boss") === 0) {
            weight *= 2;
        }
        return weight;
    }

    private static ownsAnySkill(skillIDs: number[]): boolean {
        let parties: any[] = [];
        if (typeof Game !== "undefined" && Game.player && Game.player.data && Game.player.data.party) parties = Game.player.data.party;
        else if (RogueRunManager.state && RogueRunManager.state.partySnapshots) parties = RogueRunManager.state.partySnapshots;
        for (let i = 0; i < parties.length; i++) {
            let actor = parties[i] && (parties[i].actor || parties[i]);
            let skills = actor && actor.skills || [];
            for (let j = 0; j < skills.length; j++) {
                let id = typeof skills[j] === "number" ? skills[j] : skills[j].id;
                if (skillIDs.indexOf(id) >= 0) return true;
            }
        }
        return false;
    }

    private static isSwordMeta(meta: any): boolean { return meta && meta.moduleID === 8 && meta.dataID >= 61 && meta.dataID <= 66; }
    private static isControlMeta(meta: any): boolean {
        return meta && meta.moduleID === 8 && [67, 68, 69, 70, 71, 74].indexOf(meta.dataID) >= 0;
    }

    private static createPlayerEnemySkillDefinition(skillID: number, definition: any): any {
        let playerDefinition = ObjectUtils.depthClone(definition);
        let overrides: any = {
            1001: { icon: "asset/image/picture/icon/skill/Shadow_single.png", intro: "进入隐身状态，持续至主动攻击或状态结束。" },
            1003: { costSP: 25 },
            1008: { costSP: 45, additionMultiple: 160 },
            1011: { elementType: 4 },
            1014: { costSP: 35, additionMultiple: 160 },
            1016: { costSP: 65, icon: "asset/image/picture/icon/skill/Summoner_flower.png", intro: "召唤花妖精协助战斗。" },
            1017: { costSP: 85, icon: "asset/image/picture/icon/skill/Summoner_tree.png", intro: "召唤树妖精协助战斗。" },
            1018: { costSP: 45, icon: "asset/image/picture/icon/skill/Summoner_mushroom.png", intro: "召唤蘑菇精协助战斗。" }
        };
        let patch = overrides[skillID];
        if (patch) {
            for (let key in patch) playerDefinition[key] = patch[key];
        }
        return playerDefinition;
    }

    private static addFallbackCards(cards: any[], seed: number): void {
        let fallbacks = [
            { name: "战地补给", effect: "gold", value: 50, icon: "asset/image/picture/icon/item/Gold_1_1.png" },
            { name: "生命整备", effect: "healHP", value: 25, icon: "asset/image/picture/icon/state/Treatment.png" },
            { name: "魔力整备", effect: "healSP", value: 25, icon: "asset/image/picture/icon/state/TreatmentSP.png" }
        ];
        for (let i = cards.length; i < 3; i++) {
            let fallback = fallbacks[(seed + i) % fallbacks.length];
            cards.push({
                cardID: RogueRunManager.state.runID + ":card:" + RogueRunManager.state.killCount + ":fallback:" + i,
                type: "instant",
                quality: 1,
                name: fallback.name,
                description: "立即获得本 Run 强化",
                iconID: fallback.icon,
                sourceModuleID: 0,
                sourceDefinitionID: 0,
                definitionVersion: RogueRunManager.state.contentVersion,
                effectSnapshot: { effect: fallback.effect, value: fallback.value },
                duplicatePolicy: "allow"
            });
        }
    }

    private static mixSeed(seed: number, floor: number, kill: number, version: number): number {
        let value = seed >>> 0;
        value ^= this.multiply32(floor + 1, 0x9E3779B1);
        value ^= this.multiply32(kill + 1, 0x85EBCA6B);
        value ^= this.multiply32(version + 1, 0xC2B2AE35);
        return this.nextRandom(value >>> 0);
    }

    private static multiply32(a: number, b: number): number {
        let aLow = a & 0xFFFF;
        let aHigh = a >>> 16;
        let bLow = b & 0xFFFF;
        let bHigh = b >>> 16;
        return (aLow * bLow + ((aHigh * bLow + aLow * bHigh) << 16)) | 0;
    }

    private static nextRandom(value: number): number {
        value ^= value << 13;
        value ^= value >>> 17;
        value ^= value << 5;
        return value >>> 0;
    }
}
