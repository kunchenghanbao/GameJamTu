/**
 * 鼠标控制器
 * Created by 黑暗之神KDS on 2020-03-26 06:05:08.
 */
class MouseControl {
    /**
     * 鼠标事件集
     */
    static mouseEvents = [EventObject.MOUSE_DOWN, EventObject.MOUSE_UP, EventObject.CLICK, EventObject.DOUBLE_CLICK, EventObject.RIGHT_MOUSE_DOWN, EventObject.RIGHT_MOUSE_UP, EventObject.RIGHT_CLICK, EventObject.MOUSE_WHEEL, EventObject.MOUSE_MOVE];
    /**
     * 事件派发器
     */
    static eventDispatcher: EventDispatcher = new EventDispatcher;
    /**
     * 选中的场景对象
     */
    static selectSceneObject: ProjectClientSceneObject;
    /**
     * 选中场景对象时的动画效果
     */
    private static selectEffect: GCAnimation;
    /**
     * 防止场景切换或读档重复启动控制器时把同一组监听叠加多次。
     */
    private static isStarted: boolean = false;
    //------------------------------------------------------------------------------------------------------
    // 启动或停止
    //------------------------------------------------------------------------------------------------------
    /**
     * 启动控制器
     */
    static start(): void {
        if (this.isStarted) return;
        let sceneLayer = Game.layer.sceneLayer;
        // 初始化选中时效果
        if (WorldData.selectSceneObjectEffect != 0 && !this.selectEffect) {
            this.selectEffect = new GCAnimation;
            this.selectEffect.id = WorldData.selectSceneObjectEffect;
            this.selectEffect.loop = true;
            this.selectEffect.play();
        }
        // 初始化
        sceneLayer.width = Config.WINDOW_WIDTH;
        sceneLayer.height = Config.WINDOW_HEIGHT;
        // 抛出同等事件
        for (let i in MouseControl.mouseEvents) {
            sceneLayer.on(MouseControl.mouseEvents[i], this, this.onSceneLayerMouseEvent);
        }
        // 操作事件
        sceneLayer.on(this.sceneActionEvent, this, MouseControl.onSceneMouseDown);
        sceneLayer.on(EventObject.MOUSE_MOVE, this, MouseControl.onSceneMouseMove);
        this.isStarted = true;
    }
    /**
     * 关闭控制器 
     */
    static stop(): void {
        if (MouseControl.selectSceneObject) this.unselectOneSceneObject(MouseControl.selectSceneObject);
        let sceneLayer = Game.layer.sceneLayer;
        for (let i in MouseControl.mouseEvents) {
            sceneLayer.off(MouseControl.mouseEvents[i], this, this.onSceneLayerMouseEvent);
        }
        // 场景对象
        sceneLayer.off(this.sceneActionEvent, this, MouseControl.onSceneMouseDown);
        sceneLayer.off(EventObject.MOUSE_MOVE, this, MouseControl.onSceneMouseMove);
        this.isStarted = false;
    }
    //------------------------------------------------------------------------------------------------------
    // 选中效果
    //------------------------------------------------------------------------------------------------------
    /**
     * 更新选中场景对象的效果
     * @param e 
     */
    static updateSelectSceneObject() {
        if (!Game.currentScene || Game.currentScene == ClientScene.EMPTY) return;
        let len = Game.currentScene.sceneObjects.length;
        let globalP = Game.currentScene.globalPos;
        for (let i = len - 1; i >= 0; i--) {
            let soc = Game.currentScene.sceneObjects[i];
            if (!soc) continue;
            if (!soc.root.stage) continue;
            if (!soc.selectEnabled) continue;
            // 非选中效果
            this.unselectOneSceneObject(soc);
            // 像素级检测
            if (soc.avatar.hitTestPoint(globalP.x, globalP.y)) {
                this.selectOneSceneObject(soc);
                return;
            }
        }
    }
    /**
     * 取消选中场景对象
     */
    static unselectOneSceneObject(soc: ProjectClientSceneObject): void {
        if (soc == this.selectSceneObject) {
            this.selectSceneObject = null;
            if (WorldData.selectSceneObjectEffect != 0 && this.selectEffect) {
                this.selectEffect.removeFromGameSprite();
            }
        }
    }
    /**
     * 选中场景对象
     * @param soc 场景对象
     */
    static selectOneSceneObject(soc: ProjectClientSceneObject): void {
        if (this.selectSceneObject) this.unselectOneSceneObject(this.selectSceneObject);
        this.selectSceneObject = soc;
        if (WorldData.selectSceneObjectEffect != 0 && this.selectEffect) {
            this.selectEffect.addToGameSprite(soc.avatarContainer, soc.animationLowLayer, soc.animationHighLayer);
        }
    }
    /**
     * 场景鼠标事件
     * @param e 
     */
    private static onSceneLayerMouseEvent(e: EventObject) {
        if (TouchCameraControl.isPinching) return;
        this.eventDispatcher.event(e.type, [e]);
    }
    /**
     * 鼠标左键点击场景的场合
     * @param e 
     */
    private static onSceneMouseDown(e: EventObject): void {
        if (TouchCameraControl.isPinching) return;
        // 刷新选中效果
        this.updateSelectSceneObject();
        // 当无法控制时忽略
        if (!Controller.inSceneEnabled) return;
        // 选中对象时：移动至其附近并执行点击事件
        if (this.selectSceneObject && this.selectSceneObject.inScene) {
            Controller.moveToNearTargetSceneObjectAndTriggerClickEvent(this.selectSceneObject);
        }
    }
    /**
     * 移动端等到轻点完成后再执行场景操作，以便先区分点击、拖动和双指缩放。
     */
    private static get sceneActionEvent(): string {
        return Browser.onMobile ? EventObject.CLICK : EventObject.MOUSE_DOWN;
    }
    /**
     * 鼠标在场景中移动的场合
     */
    private static onSceneMouseMove() {
        if (TouchCameraControl.isPinching) return;
        // 刷新选中效果
        this.updateSelectSceneObject();
    }

}
