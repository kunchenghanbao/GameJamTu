const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const uiDir = path.join(root, "asset/json/ui/data");

function base(type, name, x, y, width, height) {
    return {
        id: `rogue-${name}`,
        condition: [], type, name, x, y, width, height,
        opacity: 1, blend: 0, rotation: 0, show: true,
        mouseEventEnabledData: type === "UIButton",
        materialData: [{ materials: [] }],
        mouseEventEnabledInEditor: true, lock: false, showOnEditor: true,
        hasCommand: [], isOpen: true
    };
}

function bitmap(name, x, y, width, height, image, opacity = 1, grid9 = "0,0,0,0,0") {
    return Object.assign(base("UIBitmap", name, x, y, width, height), {
        opacity, image, grid9, flip: false, isTile: false, pivotType: 0
    });
}

function text(name, value, x, y, width, height, fontSize = 24, align = 1) {
    return Object.assign(base("UIString", name, x, y, width, height), {
        mouseEventEnabledData: false,
        text: value, fontSize, color: "#ffffff", bold: fontSize >= 28,
        italic: false, smooth: true, align, valign: 1, leading: 0,
        letterSpacing: 0, font: "Source_Han_Sans", wordWrap: true, overflow: 0,
        shadowEnabled: true, shadowColor: "#000000", shadowDx: 2, shadowDy: 2,
        stroke: 0, strokeColor: "#000000", onChangeFragEvent: null
    });
}

function button(name, label, x, y, width, height, fontSize = 24) {
    return Object.assign(base("UIButton", name, x, y, width, height), {
        label,
        image1: "asset/image/picture/control/btn_normal.png",
        grid9img1: "25,27,28,24,0",
        image2: "asset/image/picture/control/btn_over.png",
        grid9img2: "25,27,28,24,0",
        image3: "asset/image/picture/control/btn_click.png",
        grid9img3: "25,27,28,24,0",
        fontSize, color: "#ffffff", overColor: "#fff0c2", clickColor: "#ffffff",
        bold: true, italic: false, smooth: true, align: 1, valign: 1,
        letterSpacing: 0, font: "Source_Han_Sans", textDx: 0, textDy: 0,
        textStroke: 0, textStrokeColor: "#000000"
    });
}

function frame(name, x, y, width, height) {
    return bitmap(name, x, y, width, height, "asset/image/picture/control/windows_frame.png", 1, "150,190,150,190,0");
}

function content(name, x, y, width, height) {
    return bitmap(name, x, y, width, height, "asset/image/picture/control/windows_content_bg.png", 1, "40,40,40,40,0");
}

function background() {
    return bitmap("背景图片", 0, 0, 1600, 900, "asset/image/picture/battleBackground/Pub.png", 0.45);
}

function save(id, className, children) {
    fs.writeFileSync(path.join(uiDir, `ui${id}.json`), JSON.stringify({
        root: { children }, id, instanceClassName: className, hasRootCommand: []
    }, null, 4) + "\n");
}

const levelSelectPath = path.join(uiDir, "ui38.json");
const levelSelect = JSON.parse(fs.readFileSync(levelSelectPath, "utf8"));
levelSelect.root.children = levelSelect.root.children.filter(child => child.name !== "肉鸽入口");
const rogueEntryButton = button("肉鸽入口", "肉鸽试炼", 620, 515, 360, 105, 30);
rogueEntryButton.hasCommand = [true];
levelSelect.root.children.push(rogueEntryButton);
fs.writeFileSync(levelSelectPath, JSON.stringify(levelSelect, null, 4) + "\n");

// Keep a native Game Creator click event as a fallback when the editor is
// running an older compiled custom UI class.
const serverUI38Path = path.join(root, "asset/json/server/ui/sui38.json");
const serverUI38 = JSON.parse(fs.readFileSync(serverUI38Path, "utf8"));
const openRogueEntryCode = "GameUI.hide(38); if (!GameUI.isOpened(39)) GameUI.show(39);";
serverUI38[rogueEntryButton.id] = {
    condition: [],
    commands: [[
        [20, "打开肉鸽入口", openRogueEntryCode, openRogueEntryCode, { ___cmdID: "rogue-open-entry" }],
        [-1, { ___cmdID: "rogue-open-entry-end" }]
    ], [], [], [], [], [], [], [], [], [], [], []]
};
fs.writeFileSync(serverUI38Path, JSON.stringify(serverUI38, null, 4) + "\n");

save(39, "GUI_RogueEntry", [
    background(), frame("入口面板", 360, 120, 880, 660),
    text("入口标题", "肉鸽试炼", 460, 175, 680, 70, 42),
    text("入口说明", "固定路线：战斗 A / 战斗 B / Boss", 470, 285, 660, 120, 24),
    button("开始按钮", "开始新 Run", 455, 485, 320, 78, 26),
    button("继续按钮", "继续 Run", 825, 485, 320, 78, 26),
    button("返回按钮", "放弃并返回", 640, 610, 320, 70, 24)
]);

save(40, "GUI_RogueReward", [
    background(), frame("奖励面板", 80, 70, 1440, 760),
    text("奖励标题", "选择一项奖励", 200, 115, 1200, 60, 38),
    content("奖励卡背景1", 145, 215, 390, 410),
    content("奖励卡背景2", 605, 215, 390, 410),
    content("奖励卡背景3", 1065, 215, 390, 410),
    button("奖励按钮1", "奖励一", 175, 245, 330, 115, 26),
    button("奖励按钮2", "奖励二", 635, 245, 330, 115, 26),
    button("奖励按钮3", "奖励三", 1095, 245, 330, 115, 26),
    text("奖励描述1", "奖励说明", 185, 390, 310, 180, 20),
    text("奖励描述2", "奖励说明", 645, 390, 310, 180, 20),
    text("奖励描述3", "奖励说明", 1105, 390, 310, 180, 20),
    button("奖励确认按钮", "确认", 675, 690, 250, 72, 26)
]);

save(41, "GUI_RogueMap", [
    background(), frame("节点面板", 250, 100, 1100, 700),
    text("节点标题", "试炼路线", 350, 150, 900, 65, 40),
    text("节点状态", "等级 1    击杀 0    Run 金币 0", 350, 235, 900, 50, 24),
    content("路线背景", 360, 330, 880, 170),
    text("路线说明", "战斗节点 A   >   战斗节点 B   >   Boss 节点", 390, 350, 820, 55, 25),
    text("当前节点", "战斗节点 A", 450, 420, 700, 60, 32),
    button("进入节点按钮", "进入节点", 340, 610, 260, 78, 26),
    button("装备管理按钮", "装备管理", 670, 610, 260, 78, 26),
    button("放弃按钮", "放弃 Run", 1000, 610, 260, 78, 26)
]);

save(42, "GUI_RogueResult", [
    background(), frame("结算面板", 400, 150, 800, 600),
    text("结算标题", "Run 结算", 500, 215, 600, 70, 42),
    text("结算摘要", "本次试炼已结束", 500, 340, 600, 150, 28),
    button("结算返回按钮", "返回", 640, 590, 320, 78, 26)
]);

console.log("Registered editor-visible roguelike UIs 38-42.");
