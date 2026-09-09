class GUI_RogueResult extends GUI_42 {
    static result: string = "completed";
    private summary: UIString;
    private closeButton: UIButton;
    private selectionCursor: RogueSelectionCursor;

    constructor() {
        super();
        RogueUIFactory.prepareRoot(this);
        let ui = this as any;
        this.summary = ui.结算摘要 as UIString;
        this.closeButton = ui.结算返回按钮 as UIButton;
        this.selectionCursor = new RogueSelectionCursor;
        this.closeButton.on(EventObject.CLICK, this, this.closeResult);
        this.on(EventObject.DISPLAY, this, this.refreshResultInfo);
        this.on(EventObject.UNDISPLAY, this, this.onUndisplay);
    }

    private refreshResultInfo(): void {
        let state = RogueRunManager.state;
        this.summary.text = state
            ? "等级 " + state.runLevel + "    击杀 " + state.killCount
            : "本次试炼已结束";
        this.closeButton.color = RogueUIFactory.ACCENT_COLOR;
        if (this.selectionCursor) this.selectionCursor.focus(this.closeButton, 7);
        stage.off(EventObject.KEY_DOWN, this, this.onKeyDown);
        stage.on(EventObject.KEY_DOWN, this, this.onKeyDown);
    }

    private closeResult(): void {
        if (GUI_RogueResult.result === "completed") RogueRunManager.finishRun();
        else RogueRunManager.failRun();
        GameUI.hide(42);
        RogueSceneDirector.returnToEntryScene();
    }

    private onUndisplay(): void {
        stage.off(EventObject.KEY_DOWN, this, this.onKeyDown);
        if (this.selectionCursor) this.selectionCursor.hide();
    }

    private onKeyDown(e: EventObject): void {
        if (GUI_Setting.IS_KEY(e.keyCode, GUI_Setting.KEY_BOARD.A) || GUI_Setting.IS_KEY(e.keyCode, GUI_Setting.KEY_BOARD.B)) {
            this.closeResult();
        }
    }
}
