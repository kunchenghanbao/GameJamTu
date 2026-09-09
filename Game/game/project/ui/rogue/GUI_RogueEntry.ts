class GUI_RogueEntry extends GUI_39 {
    private statusText: UIString;
    private continueButton: UIButton;
    private buttons: UIButton[] = [];
    private selectedIndex: number = 0;
    private selectionCursor: RogueSelectionCursor;

    constructor() {
        super();
        RogueUIFactory.prepareRoot(this);
        let ui = this as any;
        this.statusText = ui.入口说明 as UIString;
        this.buttons.push(ui.开始按钮 as UIButton);
        this.continueButton = ui.继续按钮 as UIButton;
        this.buttons.push(this.continueButton);
        this.buttons.push(ui.返回按钮 as UIButton);
        this.selectionCursor = new RogueSelectionCursor;
        this.buttons[0].on(EventObject.CLICK, this, this.startRun);
        this.continueButton.on(EventObject.CLICK, this, this.continueRun);
        this.buttons[2].on(EventObject.CLICK, this, this.abortAndClose);
        for (let i = 0; i < this.buttons.length; i++) {
            this.buttons[i].on(EventObject.MOUSE_OVER, this, () => this.selectButton(i));
        }
        this.on(EventObject.DISPLAY, this, this.refreshRunInfo);
        this.on(EventObject.UNDISPLAY, this, this.onUndisplay);
    }

    private refreshRunInfo(): void {
        let active = RogueRunManager.active;
        this.continueButton.visible = active;
        this.statusText.text = active
            ? "进行中  等级 " + RogueRunManager.state.runLevel + "  击杀 " + RogueRunManager.state.killCount
            : "固定路线：A / B / 林道 / 庭院 / 祭坛 / Boss I / Boss II / Boss III";
        this.selectedIndex = 0;
        this.refreshSelection();
        stage.off(EventObject.KEY_DOWN, this, this.onKeyDown);
        stage.on(EventObject.KEY_DOWN, this, this.onKeyDown);
    }

    private startRun(): void {
        if (RogueRunManager.active) RogueRunManager.abortRun();
        if (!RogueRunManager.startNewRun()) {
            this.statusText.text = "暂时无法开始：请等待上一局存档完成，或先释放一个存档槽。";
            return;
        }
        GameUI.hide(39);
        GameUI.show(41);
    }

    private continueRun(): void {
        if (!RogueRunManager.active) return;
        GameUI.hide(39);
        if (RogueRunManager.state.finalNodeCompleted) {
            GUI_RogueResult.result = "completed";
            GameUI.show(42);
            return;
        }
        GameUI.show(41);
    }

    private abortAndClose(): void {
        if (RogueRunManager.active) RogueRunManager.abortRun();
        GameUI.hide(39);
    }

    private onUndisplay(): void {
        stage.off(EventObject.KEY_DOWN, this, this.onKeyDown);
        if (this.selectionCursor) this.selectionCursor.hide();
    }

    private onKeyDown(e: EventObject): void {
        if (GUI_Setting.IS_KEY(e.keyCode, GUI_Setting.KEY_BOARD.LEFT) || GUI_Setting.IS_KEY(e.keyCode, GUI_Setting.KEY_BOARD.UP)) {
            this.moveSelection(-1);
        }
        else if (GUI_Setting.IS_KEY(e.keyCode, GUI_Setting.KEY_BOARD.RIGHT) || GUI_Setting.IS_KEY(e.keyCode, GUI_Setting.KEY_BOARD.DOWN)) {
            this.moveSelection(1);
        }
        else if (GUI_Setting.IS_KEY(e.keyCode, GUI_Setting.KEY_BOARD.A)) this.buttons[this.selectedIndex].event(EventObject.CLICK);
        else if (GUI_Setting.IS_KEY(e.keyCode, GUI_Setting.KEY_BOARD.B)) this.abortAndClose();
    }

    private moveSelection(offset: number): void {
        do {
            this.selectedIndex = (this.selectedIndex + offset + this.buttons.length) % this.buttons.length;
        } while (!this.buttons[this.selectedIndex].visible || this.buttons[this.selectedIndex].disabled);
        this.refreshSelection();
    }

    private selectButton(index: number): void {
        if (!this.buttons[index].visible || this.buttons[index].disabled) return;
        this.selectedIndex = index;
        this.refreshSelection();
    }

    private refreshSelection(): void {
        for (let i = 0; i < this.buttons.length; i++) {
            this.buttons[i].color = i === this.selectedIndex ? RogueUIFactory.ACCENT_COLOR : "#F4F6F8";
        }
        if (this.selectionCursor) this.selectionCursor.focus(this.buttons[this.selectedIndex], 7);
    }
}
