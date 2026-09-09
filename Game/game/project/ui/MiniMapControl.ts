/**
 * 场景小地图。地图本身仅用于观察，镜头回正通过旁边的独立按钮触发。
 */
class MiniMapControl {
    private static readonly MAX_MAP_WIDTH: number = 180;
    private static readonly MAX_MAP_HEIGHT: number = 140;
    private static readonly TOGGLE_SIZE: number = 44;
    private static readonly RESET_WIDTH: number = 58;
    private static readonly RESET_HEIGHT: number = 44;
    private static readonly EDGE_MARGIN: number = 12;
    private static readonly PANEL_GAP: number = 6;
    private static readonly RESET_GAP: number = 6;
    private static readonly REFRESH_INTERVAL: number = 100;
    private static expandedState: boolean = true;
    private static desktopHost: UIRoot;
    private static desktopInstance: MiniMapControl;

    /** 创建独立于虚拟键盘的场景级小地图显示层。 */
    static ensureDesktop(): MiniMapControl {
        if (this.desktopHost && !this.desktopHost.isDisposed && this.desktopInstance) return this.desktopInstance;
        this.desktopHost = new UIRoot;
        this.desktopHost.mouseEnabled = true;
        Game.layer.uiLayer.addChild(this.desktopHost);
        this.desktopInstance = new MiniMapControl(this.desktopHost);
        return this.desktopInstance;
    }

    private host: UIRoot;
    private root: UIRoot;
    private panel: UIRoot;
    private terrainLayer: UIRoot;
    private dynamicLayer: UIRoot;
    private toggleButton: UIRoot;
    private toggleIcon: UIBitmap;
    private resetButton: UIRoot;
    private scene: ProjectClientScene;
    private expanded: boolean = MiniMapControl.expandedState;
    private mapWidth: number = 0;
    private mapHeight: number = 0;
    private scale: number = 1;
    private lastRefreshTime: number = 0;
    private lastStageWidth: number = 0;
    private lastStageHeight: number = 0;

    constructor(host: UIRoot) {
        this.host = host;
        this.createDisplayObjects();
        this.layout();
        os.add_ENTERFRAME(this.update, this);
        this.update();
    }

    hitTest(stageX: number, stageY: number): boolean {
        if (!this.root || !this.root.stage || !this.root.visible) return false;
        if (this.resetButton.visible && this.resetButton.hitTestPoint(stageX, stageY)) return true;
        if (this.toggleButton.visible && this.toggleButton.hitTestPoint(stageX, stageY)) return true;
        return this.panel.visible && this.panel.hitTestPoint(stageX, stageY);
    }

    dispose(): void {
        os.remove_ENTERFRAME(this.update, this);
        if (this.root) this.root.dispose();
        this.root = null;
        this.scene = null;
    }

    private createDisplayObjects(): void {
        this.root = new UIRoot;
        this.root.mouseEnabled = true;
        this.host.addChild(this.root);

        this.panel = new UIRoot;
        this.panel.mouseEnabled = true;
        this.panel.enabledLimitView = true;
        this.root.addChild(this.panel);

        this.terrainLayer = new UIRoot;
        this.terrainLayer.mouseEnabled = false;
        this.panel.addChild(this.terrainLayer);

        this.dynamicLayer = new UIRoot;
        this.dynamicLayer.mouseEnabled = false;
        this.panel.addChild(this.dynamicLayer);

        this.toggleButton = new UIRoot;
        this.toggleButton.width = MiniMapControl.TOGGLE_SIZE;
        this.toggleButton.height = MiniMapControl.TOGGLE_SIZE;
        this.toggleButton.mouseEnabled = true;
        this.toggleButton.hitArea = new Rectangle(0, 0, MiniMapControl.TOGGLE_SIZE, MiniMapControl.TOGGLE_SIZE);
        this.toggleButton.graphics.drawRect(0, 0, MiniMapControl.TOGGLE_SIZE, MiniMapControl.TOGGLE_SIZE,
            "#18212A", "#D8E2EA", 2);
        this.toggleButton.on(EventObject.MOUSE_DOWN, this, this.toggle);
        this.root.addChild(this.toggleButton);

        // 镜头回正独立成按钮，避免与 A/B 确认、取消键共用输入。
        this.resetButton = new UIRoot;
        this.resetButton.width = MiniMapControl.RESET_WIDTH;
        this.resetButton.height = MiniMapControl.RESET_HEIGHT;
        this.resetButton.mouseEnabled = true;
        this.resetButton.hitArea = new Rectangle(0, 0, MiniMapControl.RESET_WIDTH, MiniMapControl.RESET_HEIGHT);
        this.resetButton.on(EventObject.MOUSE_DOWN, this, this.resetCamera);
        this.root.addChild(this.resetButton);
        this.drawResetButton();

        this.toggleIcon = new UIBitmap;
        this.toggleIcon.image = "asset/image/picture/icon/item/Map_1.png";
        this.toggleIcon.x = 6;
        this.toggleIcon.y = 6;
        this.toggleIcon.width = 32;
        this.toggleIcon.height = 32;
        this.toggleIcon.mouseEnabled = false;
        this.toggleButton.addChild(this.toggleIcon);
        this.panel.visible = this.expanded;
    }

    private toggle(): void {
        this.expanded = !this.expanded;
        MiniMapControl.expandedState = this.expanded;
        this.panel.visible = this.expanded;
        if (this.expanded) {
            this.rebuildTerrain();
            this.drawDynamicLayer();
        }
    }

    private update(): void {
        if (!this.root) return;
        if (!this.host || this.host.isDisposed) {
            this.dispose();
            return;
        }
        // 场景进入完成后即显示；通用战斗菜单占用右上区域，打开时暂时隐藏。
        let sceneVisible = !GameUI.isOpened(23) &&
            GameGate.gateState >= GameGate.STATE_3_IN_SCENE_COMPLETE && Game.currentScene &&
            Game.currentScene != ClientScene.EMPTY;
        this.root.visible = sceneVisible;
        if (!sceneVisible) {
            this.scene = null;
            return;
        }
        if (this.lastStageWidth != stage.width || this.lastStageHeight != stage.height) this.layout();
        if (this.scene != Game.currentScene) {
            this.scene = Game.currentScene;
            this.rebuildTerrain();
        }
        if (!this.expanded) return;
        let now = Date.now();
        if (now - this.lastRefreshTime < MiniMapControl.REFRESH_INTERVAL) return;
        this.lastRefreshTime = now;
        this.drawDynamicLayer();
    }

    private layout(): void {
        this.lastStageWidth = stage.width;
        this.lastStageHeight = stage.height;
        this.root.x = 0;
        this.root.y = 0;
        this.host.width = stage.width;
        this.host.height = stage.height;
        this.root.width = stage.width;
        this.root.height = stage.height;
        // 仅右上角参与命中，避免透明宿主遮挡战斗地图操作。
        let hitWidth = MiniMapControl.MAX_MAP_WIDTH + MiniMapControl.EDGE_MARGIN * 2;
        let hitHeight = MiniMapControl.MAX_MAP_HEIGHT + MiniMapControl.TOGGLE_SIZE +
            MiniMapControl.PANEL_GAP + MiniMapControl.EDGE_MARGIN * 2;
        let hitRect = new Rectangle(stage.width - hitWidth, 0, hitWidth, hitHeight);
        this.host.hitArea = hitRect;
        this.root.hitArea = hitRect;
        this.toggleButton.x = stage.width - MiniMapControl.EDGE_MARGIN - MiniMapControl.TOGGLE_SIZE;
        this.toggleButton.y = MiniMapControl.EDGE_MARGIN;
        this.resetButton.x = this.toggleButton.x - MiniMapControl.RESET_GAP - MiniMapControl.RESET_WIDTH;
        this.resetButton.y = MiniMapControl.EDGE_MARGIN;
        this.positionPanel();
    }

    private resetCamera(): void {
        if (GameDialog.isInDialog) return;
        TouchCameraControl.resetCamera();
    }

    private drawResetButton(): void {
        this.resetButton.graphics.clear();
        this.resetButton.graphics.drawRect(0, 0, MiniMapControl.RESET_WIDTH, MiniMapControl.RESET_HEIGHT,
            "#18212A", "#D8E2EA", 2);
        this.resetButton.graphics.fillText("回正", MiniMapControl.RESET_WIDTH / 2,
            10, "bold 18px Arial", "#FFFFFF", "center");
    }

    private positionPanel(): void {
        this.panel.x = stage.width - MiniMapControl.EDGE_MARGIN - this.mapWidth;
        this.panel.y = MiniMapControl.EDGE_MARGIN + MiniMapControl.TOGGLE_SIZE + MiniMapControl.PANEL_GAP;
    }

    private rebuildTerrain(): void {
        this.terrainLayer.graphics.clear();
        this.dynamicLayer.graphics.clear();
        if (!this.scene) return;
        let sceneWidth = Math.max(1, this.scene.width);
        let sceneHeight = Math.max(1, this.scene.height);
        this.scale = Math.min(MiniMapControl.MAX_MAP_WIDTH / sceneWidth,
            MiniMapControl.MAX_MAP_HEIGHT / sceneHeight);
        this.mapWidth = Math.max(48, Math.round(sceneWidth * this.scale));
        this.mapHeight = Math.max(36, Math.round(sceneHeight * this.scale));
        this.panel.width = this.mapWidth;
        this.panel.height = this.mapHeight;
        this.panel.hitArea = new Rectangle(0, 0, this.mapWidth, this.mapHeight);
        this.terrainLayer.width = this.dynamicLayer.width = this.mapWidth;
        this.terrainLayer.height = this.dynamicLayer.height = this.mapHeight;
        this.positionPanel();

        this.terrainLayer.graphics.drawRect(0, 0, this.mapWidth, this.mapHeight,
            "#101820", "#D8E2EA", 2);
        let obstacleData = this.scene.dataLayers[0];
        let cellWidth = Math.max(1, Config.SCENE_GRID_SIZE * this.scale);
        let cellHeight = cellWidth;
        for (let x = 0; x < this.scene.gridWidth; x++) {
            for (let y = 0; y < this.scene.gridHeight; y++) {
                let obstacle = obstacleData && obstacleData[x] && obstacleData[x][y];
                if (!obstacle) continue;
                this.terrainLayer.graphics.drawRect(x * Config.SCENE_GRID_SIZE * this.scale,
                    y * Config.SCENE_GRID_SIZE * this.scale, cellWidth, cellHeight, "#46515A");
            }
        }
    }

    private drawDynamicLayer(): void {
        this.dynamicLayer.graphics.clear();
        if (!this.scene) return;
        let battlers = this.scene.sceneObjects;
        for (let i = 0; i < battlers.length; i++) {
            let battler = battlers[i];
            if (!battler || !battler.inScene || !GameBattleHelper.isBattler(battler)) continue;
            let battlerModule = battler.getModule(6) as SoModule_Battler;
            if (!battlerModule || battlerModule.isDead) continue;
            let color = battlerModule.battleCamp == 0 ? "#43A8FF" : "#F05252";
            let radius = Math.max(2.5, Math.min(4, Config.SCENE_GRID_SIZE * this.scale * 0.36));
            this.dynamicLayer.graphics.drawCircle(battler.x * this.scale, battler.y * this.scale,
                radius, color, "#071016", 1);
        }
        this.drawCurrentBattler();
        this.drawCursor();
        this.drawCameraViewport();
    }

    private drawCurrentBattler(): void {
        let battler = GameBattleController.currentOperationBattler;
        if (!battler || !battler.inScene) return;
        let radius = Math.max(4, Math.min(6, Config.SCENE_GRID_SIZE * this.scale * 0.52));
        this.dynamicLayer.graphics.drawCircle(battler.x * this.scale, battler.y * this.scale,
            radius, null, "#FFD54A", 2);
    }

    private drawCursor(): void {
        let cursor = GameBattleHelper.cursor;
        if (!cursor || !cursor.inScene) return;
        let x = cursor.x * this.scale;
        let y = cursor.y * this.scale;
        let size = Math.max(4, Math.min(7, Config.SCENE_GRID_SIZE * this.scale * 0.55));
        this.dynamicLayer.graphics.drawLine(x - size, y, x + size, y, "#FFFFFF", 2);
        this.dynamicLayer.graphics.drawLine(x, y - size, x, y + size, "#FFFFFF", 2);
    }

    private drawCameraViewport(): void {
        let camera = this.scene.camera;
        if (!camera || !camera.viewPort) return;
        let width = Math.min(this.scene.width, camera.viewPort.width / (camera.scaleX || 1));
        let height = Math.min(this.scene.height, camera.viewPort.height / (camera.scaleY || 1));
        let x = Math.max(0, Math.min(this.scene.width - width, camera.viewPort.x));
        let y = Math.max(0, Math.min(this.scene.height - height, camera.viewPort.y));
        this.dynamicLayer.graphics.drawRect(x * this.scale, y * this.scale,
            width * this.scale, height * this.scale, null, "#FFFFFF", 1);
    }
}
