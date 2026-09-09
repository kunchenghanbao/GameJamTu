/**
 * Run-only skill levels. The base skill snapshot is kept separate from the
 * live actor skill so loading a run never compounds an upgrade twice.
 */
class RogueSkillUpgradeSystem {
    static readonly MAX_LEVEL: number = 3;

    static getLevel(actorIndex: number, skillID: number): number {
        let record = this.findRecord(actorIndex, skillID);
        return record ? Math.max(1, Math.min(this.MAX_LEVEL, Number(record.level) || 1)) : 0;
    }

    static learn(actorIndex: number, skillID: number, skill: any, baseSkill: any): string {
        let record = this.findRecord(actorIndex, skillID);
        if (!record) {
            record = { actorIndex: actorIndex, skillID: skillID, level: 1 };
            RogueRunManager.state.skillUpgrades.push(record);
        }
        this.applyLevel(skill, baseSkill, skillID, record.level);
        return "learned";
    }

    static duplicate(actorIndex: number, skillID: number, skill: any, baseSkill: any): string {
        let record = this.findRecord(actorIndex, skillID);
        if (!record) {
            this.learn(actorIndex, skillID, skill, baseSkill);
            return "learned";
        }
        if (record.level >= this.MAX_LEVEL) return "maxed";
        record.level++;
        this.applyLevel(skill, baseSkill, skillID, record.level);
        return "upgraded";
    }

    static getUpgradeLabel(skillID: number, actorIndex: number): string {
        let level = this.getLevel(actorIndex, skillID);
        return level > 0 ? "Lv." + level : "Lv.1";
    }

    private static applyLevel(skill: any, baseSkill: any, skillID: number, level: number): void {
        if (!skill || !baseSkill) return;
        skill["__rogueLevel"] = Math.max(1, Math.min(this.MAX_LEVEL, level || 1));
        for (let key in baseSkill) {
            if (baseSkill.hasOwnProperty(key)) skill[key] = this.clone(baseSkill[key]);
        }
        if (level < 2) return;

        // Compact baseline upgrade used by all registered skills. Individual
        // skill mechanics can consume the level record without changing the
        // database definition shared with enemies and mainline actors.
        if (skill.costSP > 0) skill.costSP = Math.max(0, Math.floor(skill.costSP * 0.9));
        else if (skill.useDamage) skill.additionMultiple = (skill.additionMultiple || 100) + 10;
        if (skill.totalCD > 1) skill.totalCD--;
        if (level < 3) return;
        if (skill.useDamage) skill.additionMultiple = (skill.additionMultiple || 100) + 10;
        if (skill.effectRange1 > 0) skill.effectRange1++;
    }

    private static findRecord(actorIndex: number, skillID: number): any {
        if (!RogueRunManager.active || !RogueRunManager.state.skillUpgrades) return null;
        let records = RogueRunManager.state.skillUpgrades;
        for (let i = 0; i < records.length; i++) {
            if (records[i].actorIndex === actorIndex && records[i].skillID === skillID) return records[i];
        }
        return null;
    }

    private static clone(value: any): any {
        if (value === undefined || value === null) return value;
        if (typeof value !== "object") return value;
        return JSON.parse(JSON.stringify(value));
    }
}
