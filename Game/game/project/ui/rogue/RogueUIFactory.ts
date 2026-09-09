class RogueUIFactory {
    static readonly PANEL_COLOR: string = "#151B22";
    static readonly PANEL_BORDER: string = "#7E8A96";
    static readonly ACCENT_COLOR: string = "#C69B4B";

    static prepareRoot(root: UIRoot): void {
        root.width = 1600;
        root.height = 900;
        root.mouseEnabled = true;
        root.graphics.drawRect(0, 0, 1600, 900, "#080B0F", "#080B0F", 0);
    }

    static createPanel(parent: UIRoot, x: number, y: number, width: number, height: number): UIRoot {
        let panel = new UIRoot;
        panel.x = x;
        panel.y = y;
        panel.width = width;
        panel.height = height;
        panel.mouseEnabled = true;
        panel.graphics.drawRect(0, 0, width, height, this.PANEL_COLOR, this.PANEL_BORDER, 2);
        parent.addChild(panel);
        return panel;
    }

    static createText(parent: UIRoot, text: string, x: number, y: number, width: number, height: number, fontSize: number = 24, align: number = 0): UIString {
        let label = new UIString;
        label.text = text;
        label.x = x;
        label.y = y;
        label.width = width;
        label.height = height;
        label.fontSize = fontSize;
        label.color = "#F4F6F8";
        label.bold = fontSize >= 28;
        label.align = align;
        label.valign = 1;
        label.wordWrap = true;
        label.letterSpacing = 0;
        label.mouseEnabled = false;
        parent.addChild(label);
        return label;
    }

    static createButton(parent: UIRoot, label: string, x: number, y: number, width: number, height: number, caller: any, handler: Function): UIButton {
        let button = new UIButton;
        button.label = label;
        button.x = x;
        button.y = y;
        button.width = width;
        button.height = height;
        button.image1 = "asset/image/picture/control/btn_normal.png";
        button.image2 = "asset/image/picture/control/btn_over.png";
        button.image3 = "asset/image/picture/control/btn_click.png";
        button.grid9img1 = button.grid9img2 = button.grid9img3 = "25,27,28,24,0";
        button.fontSize = 24;
        button.color = "#F4F6F8";
        button.overColor = "#FFF0C2";
        button.clickColor = "#FFFFFF";
        button.bold = true;
        button.on(EventObject.CLICK, caller, handler);
        parent.addChild(button);
        return button;
    }
}

/** Animated focus frame shared by the roguelike menus. */
class RogueSelectionCursor extends UIRoot {
    private glowLayer: UIRoot;
    private frameLayer: UIRoot;
    private leftPointer: UIRoot;
    private rightPointer: UIRoot;
    private phase: number = 0;
    private pointerTravel: number = 0;

    constructor() {
        super();
        this.mouseEnabled = false;
        this.visible = false;
        this.glowLayer = this.createLayer();
        this.frameLayer = this.createLayer();
        this.leftPointer = this.createLayer();
        this.rightPointer = this.createLayer();
        os.add_ENTERFRAME(this.updateEffect, this);
    }

    focus(target: UIBase, padding: number = 8): void {
        if (!target || !target.parent || !target.visible) {
            this.hide();
            return;
        }
        let parent = target.parent as UIRoot;
        parent.addChild(this);
        let sideSpace = 24;
        this.x = target.x - padding - sideSpace;
        this.y = target.y - padding;
        this.width = target.width + (padding + sideSpace) * 2;
        this.height = target.height + padding * 2;
        this.pointerTravel = 0;
        this.drawEffect();
        this.visible = true;
    }

    hide(): void {
        this.visible = false;
    }

    dispose(): void {
        os.remove_ENTERFRAME(this.updateEffect, this);
        super.dispose();
    }

    private createLayer(): UIRoot {
        let layer = new UIRoot;
        layer.mouseEnabled = false;
        this.addChild(layer);
        return layer;
    }

    private drawEffect(): void {
        let inset = 20;
        let frameWidth = this.width - inset * 2;
        let centerY = Math.round(this.height / 2);
        this.glowLayer.graphics.clear();
        this.glowLayer.graphics.drawRect(inset - 4, -4, frameWidth + 8, this.height + 8,
            null, RogueUIFactory.ACCENT_COLOR, 7);
        this.frameLayer.graphics.clear();
        this.frameLayer.graphics.drawRect(inset, 0, frameWidth, this.height,
            null, "#FFD873", 3);
        this.leftPointer.graphics.clear();
        this.leftPointer.graphics.drawLine(1, centerY - 9, 11, centerY, "#FFF0C2", 4);
        this.leftPointer.graphics.drawLine(11, centerY, 1, centerY + 9, "#FFF0C2", 4);
        this.rightPointer.graphics.clear();
        this.rightPointer.graphics.drawLine(this.width - 1, centerY - 9,
            this.width - 11, centerY, "#FFF0C2", 4);
        this.rightPointer.graphics.drawLine(this.width - 11, centerY,
            this.width - 1, centerY + 9, "#FFF0C2", 4);
        this.glowLayer.alpha = 0.28;
    }

    private updateEffect(): void {
        if (!this.visible || !this.stage) return;
        this.phase += 0.09;
        let wave = (Math.sin(this.phase) + 1) * 0.5;
        this.glowLayer.alpha = 0.18 + wave * 0.32;
        this.frameLayer.alpha = 0.78 + wave * 0.22;
        let travel = Math.round(wave * 4);
        if (travel == this.pointerTravel) return;
        this.pointerTravel = travel;
        this.leftPointer.x = travel;
        this.rightPointer.x = -travel;
    }
}
