/**
 * 移动端敌方回合加速按钮，复用原项目的战斗快速演示逻辑。
 */
class MobileBattleSpeedControl {
    private static readonly BUTTON_WIDTH: number = 58;
    private static readonly BUTTON_HEIGHT: number = 44;
    private static readonly EDGE_MARGIN: number = 12;

    private host: GUI_VirtualKeyboard;
    private button: UIRoot;
    private lastFastMode: boolean;
    private lastStageWidth: number = 0;
    private lastStageHeight: number = 0;

    constructor(host: GUI_VirtualKeyboard) {
        this.host = host;
        this.button = new UIRoot;
        this.button.width = MobileBattleSpeedControl.BUTTON_WIDTH;
        this.button.height = MobileBattleSpeedControl.BUTTON_HEIGHT;
        this.button.mouseEnabled = true;
        this.button.hitArea = new Rectangle(0, 0, this.button.width, this.button.height);
        this.button.on(EventObject.MOUSE_DOWN, this, this.toggleSpeed);
        this.host.addChild(this.button);
        this.layout();
        this.redraw();
        os.add_ENTERFRAME(this.update, this);
        this.update();
    }

    hitTest(stageX: number, stageY: number): boolean {
        return this.button && this.button.stage && this.button.visible &&
            this.button.hitTestPoint(stageX, stageY);
    }

    dispose(): void {
        os.remove_ENTERFRAME(this.update, this);
        if (this.button) this.button.dispose();
        this.button = null;
    }

    private toggleSpeed(): void {
        if (!GameBattle.fastPlayAvailable) return;
        GameBattle.fastPlayMode = !GameBattle.fastPlayMode;
        this.redraw();
    }

    private update(): void {
        if (!this.button) return;
        if (!this.host || this.host.isDisposed) {
            this.dispose();
            return;
        }
        if (this.lastStageWidth != stage.width || this.lastStageHeight != stage.height) this.layout();
        let available = Browser.onMobile && GameBattle.fastPlayAvailable;
        this.button.visible = available;
        if (!available && GameBattle.fastPlayMode) GameBattle.fastPlayMode = false;
        if (this.lastFastMode != GameBattle.fastPlayMode) this.redraw();
    }

    private layout(): void {
        this.lastStageWidth = stage.width;
        this.lastStageHeight = stage.height;
        this.button.x = MobileBattleSpeedControl.EDGE_MARGIN;
        this.button.y = MobileBattleSpeedControl.EDGE_MARGIN;
    }

    private redraw(): void {
        if (!this.button) return;
        this.lastFastMode = GameBattle.fastPlayMode;
        this.button.graphics.clear();
        let active = GameBattle.fastPlayMode;
        this.button.graphics.drawRect(0, 0, this.button.width, this.button.height,
            active ? "#1E6A46" : "#18212A", active ? "#8FF0B8" : "#D8E2EA", 2);
        this.button.graphics.fillText(active ? "2x" : "1x", this.button.width / 2,
            10, "bold 22px Arial", "#FFFFFF", "center");
    }
}
