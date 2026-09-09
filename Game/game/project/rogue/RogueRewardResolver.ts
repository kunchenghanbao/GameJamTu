/**
 * Applies one confirmed card to the isolated player data used by the run.
 */
class RogueRewardResolver {
    static confirmReward(groupID: string, cardID: string): boolean {
        if (!RogueRunManager.active) return false;
        let group = this.findGroup(groupID);
        if (!group || group.status === "confirmed") return false;
        let card = this.findCard(group, cardID);
        if (!card) return false;
        let transactionID = group.confirmedTransactionID || (RogueRunManager.state.runID + ":reward-confirm:" + group.rewardGroupID);
        if (RogueRunManager.state.completedTransactionIDs.indexOf(transactionID) >= 0) {
            group.status = "confirmed";
            return true;
        }
        if (!this.applyCard(card, group)) return false;
        group.selectedCardID = card.cardID;
        group.status = "confirmed";
        group.confirmedTransactionID = transactionID;
        RogueRunManager.state.completedTransactionIDs.push(transactionID);
        RogueRunManager.state.lastTransactionID = transactionID;
        RogueRunManager.syncRuntimeState();
        EventUtils.happen(RogueRunManager, RogueRunManager.EVENT_RUN_STATE_CHANGED, [RogueRunManager.state]);
        this.saveRunProgress();
        return true;
    }

    static removeConfirmedRewards(): void {
        if (!RogueRunManager.active) return;
        RogueRunManager.state.rewardQueue = RogueRunManager.state.rewardQueue.filter(group => group.status !== "confirmed");
    }

    static getOwnerActorName(ownerUID: string): string {
        let owner = this.getOwnerBattler(ownerUID);
        if (!owner) return "";
        let module = owner.getModule(6) as SoModule_Battler;
        return module && module.actor ? module.actor.name : "";
    }

    private static applyCard(card: any, group: any): boolean {
        if (card.type === "instant") return this.applyInstant(card.effectSnapshot);
        if (card.sourceModuleID === 1) {
            if (GameData.getModuleData(1, card.sourceDefinitionID)) {
                ProjectPlayer.changeItemNumber(card.sourceDefinitionID, Math.max(1, card.quantity || 1), false);
            }
            else if (card.effectSnapshot) {
                let quantity = Math.max(1, card.quantity || 1);
                for (let i = 0; i < quantity; i++) {
                    let item = ObjectUtils.depthClone(card.effectSnapshot) as Module_Item;
                    GameData.changeModuleDataToCopyMode(item, 1);
                    ProjectPlayer.addItemByInstance(item);
                }
            }
            else return this.applyInstant({ effect: "gold", value: 50 });
            return true;
        }
        if (card.sourceModuleID === 9) {
            let equip = GameData.newModuleData(9, card.sourceDefinitionID, true) as Module_Equip;
            if (!equip && card.effectSnapshot) equip = ObjectUtils.depthClone(card.effectSnapshot) as Module_Equip;
            if (!equip) return this.applyInstant({ effect: "gold", value: 50 });
            if (card.effectSnapshot) ObjectUtils.clone(card.effectSnapshot, equip);
            GameData.changeModuleDataToCopyMode(equip, 9);
            ProjectPlayer.addEquipByInstance(equip);
            RogueRunManager.state.temporaryEquipments.push(ObjectUtils.depthClone(equip));
            return true;
        }
        if (card.sourceModuleID === 8) {
            let actorIndex = this.getOwnerPartyIndex(group);
            if (actorIndex < 0) actorIndex = 0;
            let actorDS = ProjectPlayer.getPlayerActorDSByInPartyIndex(actorIndex);
            if (!actorDS) return false;
            let existingSkill = Game.getActorSkillBySkillID(actorDS.actor, card.sourceDefinitionID);
            if (existingSkill) {
                let previous = this.findTemporarySkill(actorIndex, card.sourceDefinitionID);
                let baseSkill = previous && previous.baseSkill ? previous.baseSkill : ObjectUtils.depthClone(existingSkill);
                let result = RogueSkillUpgradeSystem.duplicate(actorIndex, card.sourceDefinitionID, existingSkill, baseSkill);
                if (result === "maxed") return this.applyInstant({ effect: "gold", value: 50 });
                if (previous) {
                    previous.skill = ObjectUtils.depthClone(existingSkill);
                }
                else {
                    RogueRunManager.state.temporarySkills.push({
                        actorIndex: actorIndex,
                        skill: ObjectUtils.depthClone(existingSkill),
                        baseSkill: ObjectUtils.depthClone(baseSkill)
                    });
                }
                return true;
            }
            let skill = ProjectPlayer.learnSkillBySkillID(actorIndex, card.sourceDefinitionID);
            if (!skill && card.effectSnapshot) {
                skill = ObjectUtils.depthClone(card.effectSnapshot) as Module_Skill;
                GameData.changeModuleDataToCopyMode(skill, 8);
                actorDS.actor.skills.push(skill);
            }
            if (!skill) return this.applyInstant({ effect: "gold", value: 50 });
            if (card.effectSnapshot) ObjectUtils.clone(card.effectSnapshot, skill);
            let baseSkill = ObjectUtils.depthClone(skill);
            RogueSkillUpgradeSystem.learn(actorIndex, card.sourceDefinitionID, skill, baseSkill);
            RogueRunManager.state.temporarySkills.push({
                actorIndex: actorIndex,
                skill: ObjectUtils.depthClone(skill),
                baseSkill: baseSkill
            });
            return true;
        }
        return false;
    }

    private static saveRunProgress(): void {
        // The run manager also creates the first save slot when this is a new
        // game. Do not silently drop the snapshot merely because the normal
        // save UI has not established currentSveFileIndexInfo yet.
        if (typeof RogueRunManager.saveProgress === "function") RogueRunManager.saveProgress();
        else if (typeof GUI_SaveFileManager !== "undefined" && GUI_SaveFileManager.currentSveFileIndexInfo) {
            // Compatibility fallback for lightweight editor/test runtimes that
            // provide the old manager surface but not RogueRunManager.saveProgress.
            GUI_SaveFileManager.saveFile(GUI_SaveFileManager.currentSveFileIndexInfo.id, false);
        }
    }

    private static applyInstant(effect: any): boolean {
        if (!effect) return false;
        if (effect.effect === "gold") {
            ProjectPlayer.increaseGold(effect.value || 0);
            return true;
        }
        let useHP = effect.effect === "healHP";
        let useSP = effect.effect === "healSP";
        if (!useHP && !useSP) return false;
        for (let i = 0; i < Game.player.data.party.length; i++) {
            let actor = Game.player.data.party[i].actor;
            if (useHP) actor.hp = Math.min(actor.MaxHP, actor.hp + Math.floor(actor.MaxHP * effect.value * 0.01));
            if (useSP) actor.sp = Math.min(actor.MaxSP, actor.sp + Math.floor(actor.MaxSP * effect.value * 0.01));
        }
        return true;
    }

    private static getOwnerPartyIndex(group: any): number {
        let savedIndex = group && group.killOwnerPartyIndex;
        if (savedIndex != null && savedIndex >= 0) {
            let actorDS = ProjectPlayer.getPlayerActorDSByInPartyIndex(savedIndex);
            if (actorDS && (!group.killOwnerActorID || actorDS.actor.id === group.killOwnerActorID)) return savedIndex;
        }
        let owner = this.getOwnerBattler(group && group.killOwnerUID);
        if (!owner) return -1;
        return ProjectPlayer.getPlayerActorIndexByActor((owner.getModule(6) as SoModule_Battler).actor);
    }

    private static getOwnerBattler(ownerUID: string): ProjectClientSceneObject {
        if (!ownerUID) return null;
        let parts = ownerUID.split(":");
        let sceneObjectIndex = parseInt(parts[parts.length - 1]);
        if (!Game.currentScene || isNaN(sceneObjectIndex)) return null;
        let owner = Game.currentScene.sceneObjects[sceneObjectIndex] as ProjectClientSceneObject;
        if (!owner || !GameBattleHelper.isBattler(owner)) return null;
        return owner;
    }

    private static findGroup(groupID: string): any {
        for (let i = 0; i < RogueRunManager.state.rewardQueue.length; i++) {
            let group = RogueRunManager.state.rewardQueue[i];
            if (group.rewardGroupID === groupID) return group;
        }
        return null;
    }

    private static findCard(group: any, cardID: string): any {
        for (let i = 0; i < group.cards.length; i++) {
            if (group.cards[i].cardID === cardID) return group.cards[i];
        }
        return null;
    }

    private static findTemporarySkill(actorIndex: number, skillID: number): any {
        let skills = RogueRunManager.state.temporarySkills || [];
        for (let i = 0; i < skills.length; i++) {
            if (skills[i].actorIndex === actorIndex && skills[i].skill && skills[i].skill.id === skillID) return skills[i];
        }
        return null;
    }
}
