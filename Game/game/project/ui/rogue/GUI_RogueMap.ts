class GUI_RogueMap extends GUI_41 {
    private statusText: UIString;
    private nodeText: UIString;
    private buttons: UIButton[] = [];
    private selectedIndex: number = 0;
    private selectionCursor: RogueSelectionCursor;

    constructor() {
        super();
        RogueUIFactory.prepareRoot(this);
        let ui = this as any;
        this.statusText = ui.节点状态 as UIString;
        this.nodeText = ui.当前节点 as UIString;
        this.buttons.push(ui.进入节点按钮 as UIButton);
        this.buttons.push(ui.装备管理按钮 as UIButton);
        this.buttons.push(ui.放弃按钮 as UIButton);
        this.selectionCursor = new RogueSelectionCursor;
        this.buttons[0].on(EventObject.CLICK, this, this.enterNode);
        this.buttons[1].on(EventObject.CLICK, this, this.openEquipment);
        this.buttons[2].on(EventObject.CLICK, this, this.abortRun);
        for (let i = 0; i < this.buttons.length; i++) {
            this.buttons[i].on(EventObject.MOUSE_OVER, this, () => this.selectButton(i));
        }
        this.on(EventObject.DISPLAY, this, this.refreshNodeInfo);
        this.on(EventObject.UNDISPLAY, this, this.onUndisplay);
    }

    private refreshNodeInfo(): void {
        if (!RogueRunManager.active) {
            GameUI.hide(41);
            return;
        }
        let state = RogueRunManager.state;
        if (state.finalNodeCompleted) {
            GUI_RogueResult.result = "completed";
            GameUI.hide(41);
            GameUI.show(42);
            return;
        }
        this.statusText.text = "等级 " + state.runLevel + "    击杀 " + state.killCount + "    Run 金币 " + state.gold;
        let names: any = {
            "battle-a": "战斗节点 A",
            "battle-b": "战斗节点 B",
            "battle-c": "林道废墟",
            "battle-d": "庭院回廊",
            "battle-e": "腐化祭坛",
            "battle-f": "星辉回廊",
            "boss": "Boss I：王座",
            "boss-2": "Boss II：深渊王座",
            "boss-3": "Boss III：星陨圣坛"
        };
        this.nodeText.text = names[state.currentNodeID] || state.currentNodeID;
        this.selectedIndex = 0;
        this.refreshSelection();
        stage.off(EventObject.KEY_DOWN, this, this.onKeyDown);
        stage.on(EventObject.KEY_DOWN, this, this.onKeyDown);
    }

    private enterNode(): void {
        if (!RogueRunManager.active) return;
        RogueRunManager.syncRuntimeState();
        GameUI.hide(41);
        RogueSceneDirector.enterCurrentNode();
    }

    private openEquipment(): void {
        if (!RogueRunManager.active || GameUI.isOpened(16)) return;
        if (this.selectionCursor) this.selectionCursor.hide();
        let partyUI = GameUI.show(16) as GUI_Party;
        if (partyUI) partyUI.openEquipmentTab();
        if (partyUI) partyUI.once(EventObject.UNDISPLAY, this, this.onEquipmentClosed);
    }

    private onEquipmentClosed(): void {
        if (!RogueRunManager.active) return;
        RogueRunManager.syncRuntimeState();
        this.refreshNodeInfo();
    }

    private abortRun(): void {
        RogueRunManager.abortRun();
        GameUI.hide(41);
        if (Game.currentScene && Game.currentScene.id >= 17 && Game.currentScene.id <= 24) {
            RogueSceneDirector.returnToEntryScene();
        }
    }

    private onUndisplay(): void {
        stage.off(EventObject.KEY_DOWN, this, this.onKeyDown);
        if (this.selectionCursor) this.selectionCursor.hide();
    }

    private onKeyDown(e: EventObject): void {
        if (GameUI.isOpened(16)) return;
        if (GUI_Setting.IS_KEY(e.keyCode, GUI_Setting.KEY_BOARD.LEFT) || GUI_Setting.IS_KEY(e.keyCode, GUI_Setting.KEY_BOARD.RIGHT)) {
            this.selectedIndex = (this.selectedIndex + 1) % this.buttons.length;
            this.refreshSelection();
        }
        else if (GUI_Setting.IS_KEY(e.keyCode, GUI_Setting.KEY_BOARD.A)) this.buttons[this.selectedIndex].event(EventObject.CLICK);
        else if (GUI_Setting.IS_KEY(e.keyCode, GUI_Setting.KEY_BOARD.B)) this.abortRun();
    }

    private refreshSelection(): void {
        for (let i = 0; i < this.buttons.length; i++) {
            this.buttons[i].color = i === this.selectedIndex ? RogueUIFactory.ACCENT_COLOR : "#F4F6F8";
        }
        if (this.selectionCursor) this.selectionCursor.focus(this.buttons[this.selectedIndex], 7);
    }

    private selectButton(index: number): void {
        this.selectedIndex = index;
        this.refreshSelection();
    }
}
