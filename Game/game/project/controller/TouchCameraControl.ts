/**
 * 触摸镜头控制、两指捏合及镜头回正。
 */
class TouchCameraControl {
    private static initialized: boolean = false;
    private static pinching: boolean = false;
    private static multiTouchGesture: boolean = false;
    private static panning: boolean = false;
    private static panCandidate: boolean = false;
    private static panTouchId: number = null;
    private static panStartX: number = 0;
    private static panStartY: number = 0;
    private static panLastX: number = 0;
    private static panLastY: number = 0;
    private static startDistance: number = 0;
    private static startScaleX: number = 1;
    private static startScaleY: number = 1;
    private static defaultScene: ProjectClientScene;
    private static defaultScaleX: number = 1;
    private static defaultScaleY: number = 1;
    private static manualCameraChanged: boolean = false;
    private static suppressUntil: number = 0;
    private static readonly minScale: number = 0.25;
    private static readonly maxScale: number = 2;
    private static readonly panThreshold: number = 8;

    static get isPinching(): boolean {
        return this.pinching || this.multiTouchGesture || this.panning || Date.now() < this.suppressUntil;
    }

    static init(): void {
        // Windows touch screens and desktop WebViews may report onMobile=false
        // while still dispatching native touch events.
        if (this.initialized || !os.canvas) return;
        this.initialized = true;
        let canvas = os.canvas;
        canvas.addEventListener("touchstart", this.onTouchStart, { capture: true, passive: false });
        canvas.addEventListener("touchmove", this.onTouchMove, { capture: true, passive: false });
        canvas.addEventListener("touchend", this.onTouchEnd, { capture: true, passive: false });
        canvas.addEventListener("touchcancel", this.onTouchEnd, { capture: true, passive: false });
    }

    /**
     * 恢复场景默认缩放和默认跟随目标。
     * 战斗中跟随战斗光标，普通场景跟随玩家角色。
     */
    static resetCamera(): boolean {
        let camera = this.getCamera();
        if (!camera) return false;
        this.rememberDefaultScale(camera);
        let followTarget = this.getDefaultFollowTarget();
        let changed = Math.abs(camera.scaleX - this.defaultScaleX) > 0.001 ||
            Math.abs(camera.scaleY - this.defaultScaleY) > 0.001 ||
            camera.sceneObject != followTarget || (GameBattle.state == 1 && this.manualCameraChanged);
        if (!changed) return false;
        camera.scaleX = this.defaultScaleX;
        camera.scaleY = this.defaultScaleY;
        if (GameBattle.state == 1) {
            // 准备阶段原本不锁定光标：仅居中一次，然后恢复自由镜头。
            let cursor = GameBattleHelper.cursor;
            if (cursor && cursor.inScene) {
                camera.sceneObject = cursor;
                Game.currentScene.updateCamera();
            }
            camera.sceneObject = null;
        }
        else {
            camera.sceneObject = followTarget;
            if (followTarget) Game.currentScene.updateCamera();
        }
        this.manualCameraChanged = false;
        this.clearPan();
        return true;
    }

    /** 虚拟摇杆移动时恢复普通场景的玩家跟随，不改变当前缩放。 */
    static followPlayerOnMove(): void {
        if (GameBattle.state != 0) return;
        let camera = this.getCamera();
        let player = this.getDefaultFollowTarget();
        if (!camera || !player || camera.sceneObject == player) return;
        camera.sceneObject = player;
        this.manualCameraChanged = false;
        this.clearPan();
        Game.currentScene.updateCamera();
    }

    private static onTouchStart = (event: TouchEvent): void => {
        let camera = this.getCamera();
        if (!camera) return;
        this.rememberDefaultScale(camera);
        if (event.touches.length == 1) {
            let touch = event.touches[0];
            if (this.isTouchOnVirtualControl(touch)) return;
            this.panCandidate = true;
            this.panning = false;
            this.panTouchId = touch.identifier;
            this.panStartX = this.panLastX = touch.clientX;
            this.panStartY = this.panLastY = touch.clientY;
            return;
        }
        if (event.touches.length < 2) return;
        this.multiTouchGesture = true;
        this.clearPan();
        if (this.isTouchOnVirtualControl(event.touches[0]) ||
            this.isTouchOnVirtualControl(event.touches[1])) return;
        let distance = this.getDistance(event.touches[0], event.touches[1]);
        if (distance <= 0) return;
        this.pinching = true;
        this.startDistance = distance;
        this.startScaleX = camera.scaleX || 1;
        this.startScaleY = camera.scaleY || 1;
        event.preventDefault();
        event.stopPropagation();
    };

    private static onTouchMove = (event: TouchEvent): void => {
        let camera = this.getCamera();
        if (!camera) return;
        if (event.touches.length >= 2) {
            if (!this.pinching) this.onTouchStart(event);
            if (!this.pinching || this.startDistance <= 0) return;
            let distance = this.getDistance(event.touches[0], event.touches[1]);
            if (distance <= 0) return;
            let ratio = distance / this.startDistance;
            camera.scaleX = this.clamp(this.startScaleX * ratio);
            camera.scaleY = this.clamp(this.startScaleY * ratio);
            this.manualCameraChanged = true;
            event.preventDefault();
            event.stopPropagation();
            return;
        }
        if (!this.panCandidate || event.touches.length != 1) return;
        let touch = event.touches[0];
        if (touch.identifier != this.panTouchId) return;
        let totalX = touch.clientX - this.panStartX;
        let totalY = touch.clientY - this.panStartY;
        if (!this.panning && Math.sqrt(totalX * totalX + totalY * totalY) < this.panThreshold) return;
        this.panning = true;
        this.manualCameraChanged = true;
        let stageDelta = this.clientDeltaToStage(touch.clientX - this.panLastX, touch.clientY - this.panLastY);
        this.panLastX = touch.clientX;
        this.panLastY = touch.clientY;
        camera.sceneObject = null;
        camera.viewPort.x -= stageDelta.x / (camera.scaleX || 1);
        camera.viewPort.y -= stageDelta.y / (camera.scaleY || 1);
        this.limitCameraInsideScene(camera);
        event.preventDefault();
        event.stopPropagation();
    };

    private static onTouchEnd = (event: TouchEvent): void => {
        if (this.pinching && event.touches.length < 2) {
            event.preventDefault();
            event.stopPropagation();
            this.pinching = false;
            this.startDistance = 0;
            this.clearPan();
            if (event.touches.length == 0) this.multiTouchGesture = false;
            this.suppressUntil = Date.now() + 100;
            return;
        }
        if (this.multiTouchGesture) {
            event.preventDefault();
            event.stopPropagation();
            this.clearPan();
            if (event.touches.length == 0) {
                this.multiTouchGesture = false;
                this.suppressUntil = Date.now() + 100;
            }
            return;
        }
        if (!this.panCandidate || !this.hasChangedTouch(event, this.panTouchId)) return;
        if (this.panning) {
            event.preventDefault();
            event.stopPropagation();
            this.suppressUntil = Date.now() + 100;
        }
        this.clearPan();
    };

    private static getCamera(): Camera {
        if (!Game.currentScene || Game.currentScene == ClientScene.EMPTY) return null;
        return Game.currentScene.camera;
    }

    private static getDistance(a: Touch, b: Touch): number {
        let dx = b.clientX - a.clientX;
        let dy = b.clientY - a.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    private static clamp(value: number): number {
        return Math.max(this.minScale, Math.min(this.maxScale, value));
    }

    private static clearPan(): void {
        this.panning = false;
        this.panCandidate = false;
        this.panTouchId = null;
    }

    private static rememberDefaultScale(camera: Camera): void {
        if (this.defaultScene == Game.currentScene) return;
        this.defaultScene = Game.currentScene;
        this.defaultScaleX = camera.scaleX || 1;
        this.defaultScaleY = camera.scaleY || 1;
        this.manualCameraChanged = false;
    }

    private static getDefaultFollowTarget(): ProjectClientSceneObject {
        if (GameBattle.state == 2 && GameBattleHelper.cursor && GameBattleHelper.cursor.inScene) {
            return GameBattleHelper.cursor;
        }
        if (GameBattle.state != 0) return null;
        if (Game.player && Game.player.sceneObject && Game.player.sceneObject.inScene) {
            return Game.player.sceneObject;
        }
        return null;
    }

    private static clientDeltaToStage(dx: number, dy: number): Point {
        let rect = os.canvas.getBoundingClientRect();
        return new Point(dx * stage.width / rect.width, dy * stage.height / rect.height);
    }

    private static clientToStage(touch: Touch): Point {
        let rect = os.canvas.getBoundingClientRect();
        return new Point((touch.clientX - rect.left) * stage.width / rect.width,
            (touch.clientY - rect.top) * stage.height / rect.height);
    }

    private static isTouchOnVirtualControl(touch: Touch): boolean {
        let ui = GUI_VirtualKeyboard.self;
        if (!ui || !ui.stage) return false;
        let point = this.clientToStage(touch);
        if (ui.miniMap && ui.miniMap.hitTest(point.x, point.y)) return true;
        if (ui.battleSpeed && ui.battleSpeed.hitTest(point.x, point.y)) return true;
        // A/B/START/BACK、摇杆和方向键均由“隐藏按键”统一控制的容器承载。
        // 容器隐藏时不要把不可见的子控件当作镜头手势的拦截区域。
        let controls: any[] = [ui.隐藏按键];
        if (!ui.容器 || ui.容器.visible) {
            controls = [ui.A, ui.B, ui.START, ui.BACK, ui.rockerBg, ui.rocker,
                ui.上按钮, ui.下按钮, ui.左按钮, ui.右按钮, ui.隐藏按键];
        }
        for (let i = 0; i < controls.length; i++) {
            let control = controls[i];
            if (control && control.stage && control.visible && control.hitTestPoint(point.x, point.y)) return true;
        }
        return false;
    }

    private static hasChangedTouch(event: TouchEvent, touchId: number): boolean {
        for (let i = 0; i < event.changedTouches.length; i++) {
            if (event.changedTouches[i].identifier == touchId) return true;
        }
        return false;
    }

    private static limitCameraInsideScene(camera: Camera): void {
        let scene = Game.currentScene;
        let visibleWidth = camera.viewPort.width / (camera.scaleX || 1);
        let visibleHeight = camera.viewPort.height / (camera.scaleY || 1);
        let maxX = scene.width - visibleWidth;
        let maxY = scene.height - visibleHeight;
        camera.viewPort.x = maxX >= 0 ? Math.max(0, Math.min(maxX, camera.viewPort.x)) : maxX * 0.5;
        camera.viewPort.y = maxY >= 0 ? Math.max(0, Math.min(maxY, camera.viewPort.y)) : maxY * 0.5;
    }
}
