const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const skillDir = path.join(root, "asset/json/custom/customModule/8");
const statusDir = path.join(root, "asset/json/custom/customModule/10");
const skillTemplate = JSON.parse(fs.readFileSync(path.join(skillDir, "cm20.json"), "utf8"));
const statusTemplate = JSON.parse(fs.readFileSync(path.join(statusDir, "cm26.json"), "utf8"));

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

function set(attrs, key, value) {
    if (!attrs[key]) {
        const type = typeof value === "boolean" ? 2 : Array.isArray(value) ? 6 : typeof value === "string" ? 1 : 0;
        attrs[key] = { varType: type, value, copy: false };
    }
    else attrs[key].value = value;
}

function diamond(radius, size = 11, includeCenter = true) {
    const center = Math.floor(size / 2);
    const gridData = [];
    for (let x = 0; x < size; x++) {
        gridData[x] = [];
        for (let y = 0; y < size; y++) {
            const distance = Math.abs(x - center) + Math.abs(y - center);
            gridData[x][y] = distance <= radius && (includeCenter || distance > 0) ? 1 : 0;
        }
    }
    return { mode: 0, size, gridData };
}

function line(length, size = 7) {
    const center = Math.floor(size / 2);
    const gridData = [];
    for (let x = 0; x < size; x++) {
        gridData[x] = [];
        for (let y = 0; y < size; y++) gridData[x][y] = 0;
    }
    for (let i = 0; i < length; i++) gridData[center + i][center] = 1;
    return { mode: 0, size, gridData };
}

const skills = [
    { id: 41, name: "血刃", icon: "Communal_baneblade.png", intro: "【血魔】消耗当前10%生命，对敌方单体造成物理伤害，命中后获得1层血怒。", target: 2, range: 1, cd: 1, damageType: 0, value: 10, multiple: 125, add: [] },
    { id: 42, name: "血爆环", icon: "Communal_hemorrhage.png", intro: "【血魔】消耗当前15%生命，对自身周围敌人造成物理伤害；命中至少2名敌人时获得1层血怒。", target: 6, range: 0, radius: 1, cd: 2, damageType: 0, value: 12, multiple: 90, add: [] },
    { id: 43, name: "猩红投枪", icon: "Shadow_single.png", intro: "【血魔】消耗当前12%生命，对远处单体造成物理伤害；生命低于50%时射程+1。", target: 2, range: 5, cd: 2, damageType: 0, value: 8, multiple: 105, add: [] },
    { id: 44, name: "沸血扩张", icon: "Communal_rage.png", intro: "【血魔·被动】生命首次降至50%以下时获得血域2回合，使非近战主动技能射程+1。", passive: true },
    { id: 45, name: "饮血", icon: "Communal_demonicSmell.png", intro: "【血魔·被动】主动直接伤害回复伤害值8%的生命；击杀额外回复15%最大生命。每次行动最多回复25%最大生命。", passive: true },
    { id: 46, name: "越战越狂", icon: "Communal_strong.png", intro: "【血魔·被动】生命低于60%时，每回合首次主动造成伤害获得1层血怒；满层时改为回复8%当前生命。", passive: true },
    { id: 47, name: "血契不灭", icon: "Healing_resurrection.png", intro: "【血魔·被动】每场战斗首次受到致命伤害时保留1点生命，并获得血域与2层血怒。", passive: true },
    { id: 48, name: "血海葬阵", icon: "Shadow_aoe_plus.png", intro: "【血魔】消耗当前35%生命，对指定区域造成大范围伤害；每层血怒使伤害提高10%，释放后消耗全部血怒。", target: 6, range: 4, radius: 2, cd: 5, damageType: 0, value: 30, multiple: 150, add: [] },
    { id: 49, name: "冰封弹", icon: "Ice_single.png", intro: "【元素】对敌方单体造成冰属性魔法伤害并施加冰结1回合。", target: 2, range: 5, cd: 2, sp: 14, damageType: 1, value: 8, multiple: 85, additionType: 1, element: 2, add: [4] },
    { id: 50, name: "放电", icon: "Thunder_single.png", intro: "【元素】对敌方单体造成雷属性魔法伤害；命中冰结目标时触发超导。", target: 2, range: 5, cd: 1, sp: 12, damageType: 1, value: 8, multiple: 90, additionType: 1, element: 3, add: [] },
    { id: 51, name: "超导脉冲", icon: "Thunder_aoe.png", intro: "【元素】对自身周围敌人造成雷属性魔法伤害，对冰结目标分别触发超导。", target: 6, range: 0, radius: 2, cd: 3, sp: 26, damageType: 1, value: 12, multiple: 70, additionType: 1, element: 3, add: [] },
    { id: 52, name: "烈火印记", icon: "Fire_single.png", intro: "【元素】对敌方单体造成炎属性魔法伤害并施加燃烧2回合。", target: 2, range: 5, cd: 1, sp: 12, damageType: 1, value: 10, multiple: 80, additionType: 1, element: 1, add: [3] },
    { id: 53, name: "元素引爆", icon: "Blast_middling.png", intro: "【元素】对敌方单体造成无属性伤害；命中燃烧目标时触发元素爆炸。", target: 2, range: 5, cd: 2, sp: 16, damageType: 1, value: 10, multiple: 100, additionType: 1, element: 9, add: [] },
    { id: 54, name: "连环爆燃", icon: "Blast_big.png", intro: "【元素·被动】每回合前两次元素爆炸半径+1，爆炸伤害由50%提高至65%。", passive: true },
    { id: 55, name: "冰雷天灾", icon: "Ice_aoe.png", intro: "【元素】对指定区域先施加冰结，再以雷击触发超导并造成魔法伤害。", target: 6, range: 5, radius: 2, cd: 5, sp: 45, damageType: 1, value: 25, multiple: 110, additionType: 1, element: 3, add: [4] },
    { id: 56, name: "强攻姿态", icon: "Communal_strong.png", intro: "获得强攻3回合：攻击提高25%。会覆盖魔力集中。", target: 0, range: 0, cd: 3, sp: 10, damage: false, add: [30], remove: [31] },
    { id: 57, name: "魔力集中", icon: "Light_single.png", intro: "获得魔力集中3回合：魔力提高25%，魔法暴击提高10%。会覆盖强攻。", target: 0, range: 0, cd: 3, sp: 10, damage: false, add: [31], remove: [30] },
    { id: 58, name: "迅捷步调", icon: "Communal_rapid.png", intro: "不消耗行动力，获得迅捷2回合：移动力+2，暴击率+10%。", target: 0, range: 0, cd: 4, sp: 12, damage: false, action: false, add: [32] },
    { id: 59, name: "铁壁守护", icon: "Communal_morale.png", intro: "使友方单体获得铁壁2回合：物防、魔防提高35%，并移除对应防御下降。", target: 1, range: 4, cd: 4, sp: 18, damage: false, add: [33], remove: [13, 15] },
    { id: 60, name: "极限解放", icon: "Communal_rage.png", intro: "消耗当前15%生命，移除攻击下降、魔力下降、虚弱和禁止攻击，获得极限解放2回合。", target: 0, range: 0, cd: 5, damage: false, add: [34], remove: [9, 11, 18, 23] },
    { id: 61, name: "霜痕剑", icon: "Sword_slashDown.png", intro: "【剑系】对近战单体造成物理剑伤；目标处于冰结时伤害提高35%并获得1层剑势，不移除冰结。", target: 2, range: 1, cd: 2, sp: 14, damageType: 0, value: 8, multiple: 120, add: [] },
    { id: 62, name: "炽痕剑", icon: "Sword_multiple.png", intro: "【剑系·风】近战剑击；燃烧目标视为非炎元素攻击并触发元素爆炸，未燃烧目标施加燃烧1回合。", target: 2, range: 1, cd: 2, sp: 16, damageType: 0, value: 10, multiple: 110, element: 8, add: [3] },
    { id: 63, name: "破势剑意", icon: "Sword_continued.png", intro: "【剑系·被动】剑系技能命中带负面状态的敌人时获得1层剑势，最多3层；每层使剑系技能伤害提高6%。", passive: true },
    { id: 64, name: "回风剑阵", icon: "Sword_tornado.png", intro: "【剑系】对指定区域敌人造成剑气物理伤害；拥有风行结界时作用半径+1，命中战术标记目标时本次伤害额外提高15%。", target: 6, range: 3, radius: 1, cd: 4, sp: 24, damageType: 0, value: 12, multiple: 95, add: [] },
    { id: 65, name: "终式·裂空", icon: "Sword_tornado.png", intro: "【剑系】对直线3格敌人造成终结斩；消耗全部剑势，每层使本次伤害提高10%，腐蚀目标无视20%物防，战术标记目标伤害再提高15%。", target: 6, range: 3, radius: 0, cd: 5, sp: 32, damageType: 0, value: 25, multiple: 150, add: [], shape: "line3" },
    { id: 66, name: "剑心归一", icon: "Sword_multiple.png", intro: "【剑系·被动】剑系技能命中至少2个敌人或击杀敌人时，每场战斗首次恢复最大SP的12%，并使下一次剑系技能CD-1。", passive: true },
    { id: 67, name: "冰晶牢笼", icon: "Ice_single.png", intro: "【元素】对敌方单体造成冰属性魔法伤害并施加冰结1回合；免疫冰结的Boss改为减速。", target: 2, range: 4, cd: 3, sp: 20, damageType: 1, value: 10, multiple: 100, additionType: 1, element: 2, add: [4] },
    { id: 68, name: "裂地震荡", icon: "Communal_stomp.png", intro: "【控制】对自身周围半径1的敌人造成物理伤害并击退1格；受阻或无法位移时眩晕1回合。", target: 6, range: 0, radius: 1, cd: 3, sp: 22, damageType: 0, value: 12, multiple: 105, add: [], forceMoveMode: 1, forceMoveDistance: 1 },
    { id: 69, name: "风行结界", icon: "Wind_aoe_hit.png", intro: "【辅助】使范围内友军（包括召唤物）移动力+1、回避率+10%，持续2回合；不与迅捷重复叠加。", target: 5, range: 4, radius: 1, cd: 4, sp: 24, damage: false, add: [42] },
    { id: 70, name: "腐蚀沼域", icon: "Water_aoe.png", intro: "【控制】对指定区域敌人施加腐蚀2回合：物防、魔防下降15%，移动力-1；Boss仅持续1回合。", target: 6, range: 4, radius: 2, cd: 4, sp: 26, damage: false, add: [38] },
    { id: 71, name: "圣光屏障", icon: "Light_aoe.png", intro: "【辅助】使友方单体获得护主屏障2回合，吸收一次不超过最大生命20%的伤害，并移除1个可解除负面状态。", target: 1, range: 4, cd: 4, sp: 28, damage: false, add: [37] },
    { id: 72, name: "余烬回响", icon: "Fire_single.png", intro: "【元素·被动】给敌人施加燃烧后，使其下一次受到的非炎主动直接伤害提高30%，每回合最多标记2个目标。", passive: true },
    { id: 73, name: "破绽洞察", icon: "Archery_aim.png", intro: "【战术·被动】主动直接攻击带负面状态的敌人时，暴击率提高15%、伤害提高10%；每目标每次行动最多一次。", passive: true },
    { id: 74, name: "战术标记", icon: "Communal_binding.png", intro: "【战术】标记敌方单体2回合；持有者一方（包括召唤物）对其伤害提高15%，击杀后持有者恢复最大SP的10%。", target: 2, range: 5, cd: 2, sp: 12, damage: false, add: [39] },
    { id: 75, name: "终结回响", icon: "Communal_strong.png", intro: "【战术·被动】持有者或其召唤物完成归属明确的敌方击杀后，恢复最大SP的8%并使一个主动技能CD-1；每回合最多一次。", passive: true }
];

const statuses = [
    { id: 27, name: "血怒", icon: "Strong_up.png", intro: "每层攻击和魔力提高6%，最多5层。", duration: 0, layers: 5, atkPer: 106, magPer: 106 },
    { id: 28, name: "血域", icon: "Rage.png", intro: "非近战主动技能射程+1。", duration: 2 },
    { id: 29, name: "不灭血印", icon: "HolyLight.png", intro: "本场战斗尚可抵挡一次致命伤害。", duration: 0 },
    { id: 30, name: "强攻", icon: "Strong_up.png", intro: "攻击提高25%。", duration: 3, atkPer: 125 },
    { id: 31, name: "魔力集中", icon: "Magic_up.png", intro: "魔力提高25%，魔法暴击提高10%。", duration: 3, magPer: 125, magCrit: 10 },
    { id: 32, name: "迅捷", icon: "Agile_up.png", intro: "移动力+2，暴击率+10%。", duration: 2, moveGrid: 2, crit: 10 },
    { id: 33, name: "铁壁", icon: "Def_up.png", intro: "物理防御和魔法防御提高35%。", duration: 2, defPer: 135, magDefPer: 135 },
    { id: 34, name: "极限解放", icon: "Rage.png", intro: "攻击和魔力提高30%，物防和魔防降低20%。", duration: 2, atkPer: 130, magPer: 130, defPer: 80, magDefPer: 80 },
    { id: 37, name: "护主屏障", icon: "HolyLight.png", intro: "吸收一次受到的伤害，吸收量为最大生命值的20%；被击中后消失。", duration: 2 },
    { id: 38, name: "腐蚀", icon: "Def_down.png", intro: "物防、魔防下降15%，移动力-1，持续2回合。", duration: 2, defPer: 85, magDefPer: 85, moveGrid: -1 },
    { id: 39, name: "战术标记", icon: "Enchanting.png", intro: "受到施加者一方造成的伤害提高15%，持续2回合。", duration: 2 },
    { id: 40, name: "余烬回响", icon: "Rage.png", intro: "对带燃烧目标的下一次非炎主动直接伤害提高30%；触发后消失。", duration: 2 },
    { id: 41, name: "剑势", icon: "Strong_up.png", intro: "每层使剑系技能伤害提高6%，最多3层。", duration: 0, layers: 3 },
    { id: 42, name: "风行结界", icon: "Agile_up.png", intro: "移动力+1、回避率+10%，持续2回合。", duration: 2, moveGrid: 1 }
];

for (const definition of skills) {
    const data = clone(skillTemplate);
    data.id = definition.id;
    const attrs = data.attrs;
    set(attrs, "icon", "asset/image/picture/icon/skill/" + definition.icon);
    set(attrs, "intro", definition.intro);
    set(attrs, "skillType", definition.passive ? 2 : 0);
    set(attrs, "targetType", definition.target == null ? 0 : definition.target);
    set(attrs, "effectRange1", definition.range || 0);
    set(attrs, "effectRangeType", definition.shape ? 2 : 0);
    set(attrs, "effectRange2A", 1);
    set(attrs, "effectRange2B", definition.range || 0);
    if (definition.shape === "line3") {
        set(attrs, "effectRange3", line(3));
        set(attrs, "associationOrientation", true);
    }
    set(attrs, "releaseRange", definition.radius == null ? {} : diamond(definition.radius));
    set(attrs, "totalCD", definition.cd || 0);
    set(attrs, "costSP", definition.sp || 0);
    set(attrs, "costHP", 0);
    set(attrs, "useDamage", definition.passive ? false : definition.damage !== false);
    set(attrs, "costActionPower", definition.action !== false);
    set(attrs, "useHate", !definition.passive && definition.damage !== false);
    set(attrs, "damageType", definition.damageType || 0);
    set(attrs, "damageValue", definition.value || 0);
    set(attrs, "additionMultiple", definition.multiple || 100);
    set(attrs, "useAddition", !definition.passive && definition.damage !== false);
    set(attrs, "additionMultipleType", definition.additionType || 0);
    set(attrs, "elementType", definition.element || 9);
    set(attrs, "swordFamily", definition.id >= 61 && definition.id <= 66);
    set(attrs, "statusSetting", !!((definition.add || []).length || (definition.remove || []).length));
    set(attrs, "addStatus", definition.add || []);
    set(attrs, "removeStatus", definition.remove || []);
    set(attrs, "releaseTimes", 1);
    set(attrs, "forceMoveMode", definition.forceMoveMode || 0);
    set(attrs, "forceMoveDistance", definition.forceMoveDistance || 0);
    set(attrs, "isThroughObstacle", false);
    set(attrs, "releaseAnimation", 0);
    set(attrs, "hitAnimation", definition.element === 1 ? 13 : definition.element === 2 ? 11 : definition.element === 3 ? 14 : 8);
    fs.writeFileSync(path.join(skillDir, "cm" + definition.id + ".json"), JSON.stringify(data, null, 2) + "\n");
}

for (const definition of statuses) {
    const data = clone(statusTemplate);
    data.id = definition.id;
    const attrs = data.attrs;
    set(attrs, "icon", "asset/image/picture/icon/state/" + definition.icon);
    set(attrs, "intro", definition.intro);
    set(attrs, "totalDuration", definition.duration);
    set(attrs, "maxlayer", definition.layers || 1);
    set(attrs, "atkPer", definition.atkPer || 100);
    set(attrs, "defPer", definition.defPer || 100);
    set(attrs, "magPer", definition.magPer || 100);
    set(attrs, "magDefPer", definition.magDefPer || 100);
    set(attrs, "moveGrid", definition.moveGrid || 0);
    set(attrs, "crit", definition.crit || 0);
    set(attrs, "magCrit", definition.magCrit || 0);
    set(attrs, "specialAbility", false);
    set(attrs, "eventSetting", false);
    set(attrs, "specialBattleEffect", []);
    fs.writeFileSync(path.join(statusDir, "cm" + definition.id + ".json"), JSON.stringify(data, null, 2) + "\n");
}

function updateNames(file, definitions) {
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    const names = data.list["1"];
    for (const definition of definitions) names[definition.id] = definition.name;
    fs.writeFileSync(file, JSON.stringify(data, null, 4) + "\n");
}

updateNames(path.join(root, "asset/json/custom/customModule/customModuleDataList8.json"), skills);
updateNames(path.join(root, "asset/json/custom/customModule/customModuleDataList10.json"), statuses);

console.log("Generated roguelike skills 41-75 and statuses 27-34, 37-42.");
