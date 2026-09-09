/** Adds the isolated roguelike entry without changing the four existing level events. */
class GUI_RogueLevelSelect extends GUI_38 {
    private rogueButton: UIButton;

    constructor() {
        super();
        this.rogueButton = (this as any).肉鸽入口 as UIButton;
        this.rogueButton.on(EventObject.CLICK, this, this.openRogueEntry);
    }

    private openRogueEntry(): void {
        GameUI.hide(38);
        if (!GameUI.isOpened(39)) GameUI.show(39);
    }
}
