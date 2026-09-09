/**
 * 战斗特写
 * Created by 黑暗之神KDS on 2022-07-21 13:49:32.
 */
class GUI_BattleScene extends GUI_36 {
    //------------------------------------------------------------------------------------------------------
    // 事件
    //------------------------------------------------------------------------------------------------------
    /**
     * 事件：战斗阶段 0~N
     */
    static EVENT_BATTLE_STEP: string = `GUI_BattleSceneEVENT_BATTLE_STEP`;
    //------------------------------------------------------------------------------------------------------
    //  
    //------------------------------------------------------------------------------------------------------
    // 场景根容器
    sceneRoot: UIRoot;
    // 场景
    scene: ClientScene;
    // 发起方
    bsFromBattler: ProjectClientSceneObject;
    fromBattler: ProjectClientSceneObject;
    fromActor: Module_Actor;
    // 目标方
    bsTargetBattler: ProjectClientSceneObject;
    targetBattler: ProjectClientSceneObject;
    targetActor: Module_Actor;
    // 发起方站位-左边
    bsFromBattlerLeft: boolean;
    // 根据左右获取目标战斗者
    bsLeftBattler: ProjectClientSceneObject;
    bsRightBattler: ProjectClientSceneObject;
    // 是否普通攻击
    isAttack: boolean;
    // 技能（如果使用技能的话）
    skill: Module_Skill;
    // 行动类别：0-移动 1-远程弹幕 2-远程直接
    actionType: number = 0;
    // 是否近战
    isMelee: boolean;
    // 反击需要转回正面
    counterattackTurnFront: boolean;
    // 记录当前状态的动画
    fromStAniRecord: { [ani: number]: boolean };
    targetStAniRecord: { [ani: number]: boolean };
    //------------------------------------------------------------------------------------------------------
    //  系统实现用
    //------------------------------------------------------------------------------------------------------
    private requestLoadSceneSign: number = 0;
    private currentHitTimes: number;
    private totalHitTimes: number;
    private targetLastHP: number;
    private winCurrentBattler: ProjectClientSceneObject;
    private winTargetBattler: ProjectClientSceneObject;
    private bgmInfo: any;
    private battleBGMURL: string;
    /**
     * 构造函数
     */
    constructor() {
        super();
        this.sceneRoot = this.background.parent as UIRoot;
        this.battler1.visible = false;
        this.battler2.visible = false;
        this.background.visible = false;
        this.on(EventObject.DISPLAY, this, this.onDisplay);
        this.on(EventObject.UNDISPLAY, this, this.onUndisplay);
    }
    //------------------------------------------------------------------------------------------------------
    //  设置数据
    //------------------------------------------------------------------------------------------------------
    setData(fromBattler: ProjectClientSceneObject, targetBattler: ProjectClientSceneObject, isAttack: boolean, skill: Module_Skill = null): void {
        EventUtils.happen(GUI_BattleScene, GUI_BattleScene.EVENT_BATTLE_STEP, [0, fromBattler, targetBattler, isAttack, skill]);
        if (this.scene) this.scene.dispose();
        this.isAttack = isAttack;
        this.skill = skill;
        this.fromBattler = fromBattler;
        this.targetBattler = targetBattler;
        this.fromActor = fromBattler.battlerSetting.actor;
        this.targetActor = targetBattler.battlerSetting.actor;
        this.requestLoadSceneSign = ObjectUtils.getInstanceID();
        ClientScene.createScene(WorldData.battleScene, null, Callback.New((requestLoadSceneSign: number, scene: ClientScene) => {
            // 过期的加载忽略掉
            if (requestLoadSceneSign != this.requestLoadSceneSign) {
                scene.dispose();
                return;
            }
            // 重写 setViewPort ，避免裁剪
            if (scene.width < Config.WINDOW_WIDTH) {
                let lastSetViewPort = scene[`setViewPort`];
                scene[`setViewPort`] = function (isLimit: boolean = true) {
                    lastSetViewPort.apply(this, [isLimit]);
                    this.displayObjectView.scrollRect = null;
                }
            }
            // 添加场景显示和开始渲染
            this.scene = scene;
            this.sceneRoot.addChild(scene.displayObject);
            scene.displayObject.x = scene.displayObject.y = 0;
            scene.startRender();
            // 添加战斗角色
            let battlerActor1 = fromBattler.battlerSetting.actor;
            let battlerActor2 = targetBattler.battlerSetting.actor;
            let battlerAvatarID1 = battlerActor1.battlerAvatar ? battlerActor1.battlerAvatar : fromBattler.avatarID;
            let battlerAvatarID2 = battlerActor2.battlerAvatar ? battlerActor2.battlerAvatar : targetBattler.avatarID;
            // 发起方站位确认
            this.bsFromBattlerLeft = WorldData.battleSceneAutoPosition == 0 ? fromBattler.x < targetBattler.x : WorldData.battleSceneAutoPosition == 1;
            let refFromBattler = this.bsFromBattlerLeft ? this.battler1 : this.battler2;
            let refTargetBattler = this.bsFromBattlerLeft ? this.battler2 : this.battler1;
            // 创建虚拟战斗者，同步参考avatar的部分属性（帧率、位置）
            let so1 = this.bsFromBattler = scene.addNewSceneObject(1, { x: refFromBattler.x, y: refFromBattler.y }) as ProjectClientSceneObject;
            let so2 = this.bsTargetBattler = scene.addNewSceneObject(1, { x: refTargetBattler.x, y: refTargetBattler.y + 1 }) as ProjectClientSceneObject;
            so1.avatar.id = battlerAvatarID1;
            so2.avatar.id = battlerAvatarID2;
            so1.avatarOri = this.bsFromBattlerLeft ? 6 : 4;
            so2.avatarOri = this.bsFromBattlerLeft ? 4 : 6;
            so1.avatarFPS = this.battler1.avatarFPS;
            so2.avatarFPS = this.battler2.avatarFPS;
            if (this.fromActor.battlerAvatarStyleSetting) {
                so1.scale = this.fromActor.btAvatarScale;
                so1.avatarHue = this.fromActor.btAvatarHue;
            }
            if (this.targetActor.battlerAvatarStyleSetting) {
                so2.scale = this.targetActor.btAvatarScale;
                so2.avatarHue = this.targetActor.btAvatarHue;
            }
            // 确认左右战斗者
            if (this.bsFromBattlerLeft) {
                this.bsLeftBattler = this.bsFromBattler;
                this.bsRightBattler = this.bsTargetBattler;
            }
            else {
                this.bsLeftBattler = this.bsTargetBattler;
                this.bsRightBattler = this.bsFromBattler;
            }
            // 右边的战斗者动画层反方向
            if (WorldData.battleSceneFlipAniLayer) {
                this.bsRightBattler.root.scaleX = -1;
                this.bsRightBattler.avatarOri = 6;
                this.bsRightBattler.fixOri = true;
            }
            // 背对攻击者时的处理
            this.counterattackTurnFront = false;
            if (WorldData.battleSceneBackwardSupport && GameBattleHelper.atBackward(fromBattler, targetBattler)) {
                this.counterattackTurnFront = true;
                if (this.bsFromBattlerLeft) {
                    this.bsRightBattler.avatarOri = WorldData.battleSceneFlipAniLayer ? 4 : 6;
                }
                else {
                    this.bsLeftBattler.avatarOri = 4;
                }
            }
            //
            this.winCurrentBattler = this.bsFromBattlerLeft ? this.fromBattler : this.targetBattler;
            this.winTargetBattler = this.bsFromBattlerLeft ? this.targetBattler : this.fromBattler;
            // 数据转接（模块暂时借给战斗场景对象用）
            this.bsFromBattler.battlerSetting = this.fromBattler.battlerSetting;
            this.bsTargetBattler.battlerSetting = this.targetBattler.battlerSetting;
            // 显示双方面板
            GameBattleAction.showCurrentBattlerWindow(this.winCurrentBattler);
            GameBattleAction.showTargetBattlerWindow(this.winTargetBattler);
            // 刷新状态动画和监听状态发生改变后刷新动画
            this.fromStAniRecord = {};
            this.targetStAniRecord = {};
            if (WorldData.battleSceneDisplayStatusAni) {
                this.refreshStatusAnimation();
                EventUtils.addEventListenerFunction(GameBattleData, GameBattleData.EVENT_STATUS_CHANGE, this.onBattlerStatusChange, this);
            }
            // 开始播放战斗画面
            this.startPlayBattlerAnimation();
            // 派发事件
            EventUtils.happen(GUI_BattleScene, GUI_BattleScene.EVENT_BATTLE_STEP, [1]);
        }, this, [this.requestLoadSceneSign]));
    }
    /**
     * 获取地图战斗者-根据可能存在的战斗画面的战斗者
     * @param bsBattler 
     */
    getMapBattler(bsBattler: ProjectClientSceneObject) {
        if (bsBattler == this.bsFromBattler) {
            return this.fromBattler;
        }
        else if (bsBattler == this.bsTargetBattler) {
            return this.targetBattler;
        }
        return bsBattler;
    }
    //------------------------------------------------------------------------------------------------------
    //  显示/隐藏界面
    //------------------------------------------------------------------------------------------------------
    /**
     * 显示界面
     */
    private onDisplay() {
        if (GameBattle.state != 2) return;
        // 记录BGM
        this.bgmInfo = [GameAudio.lastBgmURL, GameAudio.lastBGMVolume, GameAudio.lastBGMPitch];
        // 过渡到战斗BGM（如有）
        if (WorldData.battleSceneBGM) {
            this.battleBGMURL = WorldData.battleSceneBGM.split(`,`)[0];
        }
        else {
            this.battleBGMURL = ``;
        }
        if (this.battleBGMURL && this.battleBGMURL != GameAudio.lastBgmURL) {
            GameAudio.playBGM(GameAudio.lastBgmURL, 0, 9999, true, 100, GameAudio.lastBGMPitch);
            setTimeout(() => {
                GameAudio.playBGM(WorldData.battleSceneBGM, null, 9999, true, 200);
            }, 100);
        }
        // 图像层添加到界面中
        this.addChild(Game.layer.imageLayer);
    }
    /**
     * 隐藏界面
     */
    private onUndisplay() {
        if (GameBattle.state != 2) return;
        // 移除借用的模块
        if (this.bsFromBattler) this.bsFromBattler.removeModuleByID(6);
        if (this.bsTargetBattler) this.bsTargetBattler.removeModuleByID(6);
        if (this.scene) {
            this.scene.dispose();
            this.scene = null;
        }
        // 过渡到原BGM（如有）
        if (this.battleBGMURL && this.battleBGMURL != this.bgmInfo[0]) {
            GameAudio.playBGM(WorldData.battleBGM, 0, 9999, true, 100);
            setTimeout(() => {
                GameAudio.playBGM(this.bgmInfo[0], this.bgmInfo[1], 9999, true, 200, this.bgmInfo[2]);
            }, 100);
        }
    }
    //------------------------------------------------------------------------------------------------------
    //  播放-战斗流程
    //------------------------------------------------------------------------------------------------------
    private startPlayBattlerAnimation(): void {
        this.step_init();
        setTimeout(() => {
            // 文本显示
            this.showActionTips();
            this.step_startAction();
        }, WorldData.waitStartTime * 1000);
    }
    /**
     * 初始化
     */
    private step_init(): void {
        this.actionText.text = "";
        this.scene.camera.sceneObject = this.bsFromBattler;
        this.bsFromBattler.moveSpeed = WorldData.battlerSpeed;
        this.bsTargetBattler.moveSpeed = WorldData.battlerSpeed;
        this.currentHitTimes = 0;
        this.targetLastHP = this.bsTargetBattler.battlerSetting.actor.hp;
        if (this.isAttack) {
            this.totalHitTimes = GameBattleHelper.getNormalAttackTimes(this.fromBattler);
        }
        else {
            let fromBattlerModule = this.fromBattler.getModule(6) as SoModule_Battler;
            if (this.skill == fromBattlerModule.actor.atkSkill) {
                this.totalHitTimes = this.skill.releaseTimes * GameBattleHelper.getNormalAttackTimes(this.fromBattler);
            }
            // -- 否则仅来源技能的连击次数
            else {
                this.totalHitTimes = this.skill.releaseTimes;
            }
        }
    }
    /**
     * 信息显示
     */
    private showActionTips(): void {
        if (this.isAttack) {
            this.actionText.text = `「${this.fromActor.name}」${WorldData.word_usedAtk}`;
        }
        else {
            this.actionText.text = `「${this.fromActor.name}」${WorldData.word_used}「${this.skill.name}」。`;
        }
    }
    /**
     * 步骤：开始
     */
    private step_startAction(): void {
        EventUtils.happen(GUI_BattleScene, GUI_BattleScene.EVENT_BATTLE_STEP, [2]);
        // 初始化
        this.isMelee = false;
        // 如果是立即，则移动过去攻击。
        if ((this.isAttack && this.fromActor.isMelee) || (this.skill && this.skill.skillType == 0)) {
            this.actionType = 0;
            this.step_move();
        }
        // 如果是弹幕且弹幕速度不为0则显示弹幕，发出后到达目的地点，（此时镜头锁定弹幕
        else if (this.skill && this.skill.bulletSpeed != 0) {
            this.actionType = 1;
            this.step_use();
        }
        // 远程直接
        else {
            this.actionType = 2;
            this.step_use();
        }
    }
    /**
     * 移动
     */
    private step_move(): void {
        this.isMelee = true;
        let toPos = [this.bsFromBattlerLeft ? this.bsTargetBattler.x - WorldData.battlerSpacing : this.bsTargetBattler.x + WorldData.battlerSpacing, this.bsFromBattler.y];
        if ((this.bsFromBattler.x == toPos[0] && this.bsFromBattler.y == toPos[1])) {
            this.step_use();
        }
        else {
            EventUtils.happen(GUI_BattleScene, GUI_BattleScene.EVENT_BATTLE_STEP, [3]);
            GameBattleAction.execMoveEvent(this.bsFromBattler);
            this.bsFromBattler.startMove([toPos], 0, false, Callback.New(this.step_use, this));
        }
    }
    /**
     * 使用（技能/攻击）
     */
    private step_use(): void {
        EventUtils.happen(GUI_BattleScene, GUI_BattleScene.EVENT_BATTLE_STEP, [4]);
        this.execUseEvent(!this.skill, this.skill, this.bsFromBattler, this.bsTargetBattler, () => {
            this.step_release();
        })
    }
    /**
     * 发射弹幕
     */
    private step_release_bullet(counterattack: boolean = false, fromBattler: ProjectClientSceneObject = null, targetBattler: ProjectClientSceneObject = null, bsFromBattler: ProjectClientSceneObject = null, bsTargetBattler: ProjectClientSceneObject = null, onFin: Function = null): void {
        // 获取直接攻击或反击对应的数据
        if (!fromBattler) fromBattler = this.fromBattler;
        if (!targetBattler) targetBattler = this.targetBattler;
        if (!bsTargetBattler) bsTargetBattler = this.bsTargetBattler;
        if (!bsFromBattler) bsFromBattler = this.bsFromBattler;
        let fromActor = fromBattler.battlerSetting.actor;
        let targetActor = targetBattler.battlerSetting.actor;
        let isAttack = this.isAttack;
        let skill = this.skill;
        if (counterattack) {
            isAttack = fromActor.atkMode == 0;
            if (!isAttack) skill = fromActor.atkSkill;
        }
        //
        let bullet = new GCAnimation();
        bullet.id = skill.bulletAnimation;
        bullet.loop = true;
        bullet.play();
        this.scene.animationHighLayer.addChild(bullet);
        this.scene.camera.sceneObject = bullet as any;
        // 子弹起始位置
        let startPoint = new Point(bsFromBattler.pos.x, bsFromBattler.pos.y);
        // 子弹位置修正，根据起始点与目的地的角度
        let destinationPoint = bsTargetBattler.pos;
        let angle = MathUtils.direction360(destinationPoint.x, destinationPoint.y, startPoint.x, startPoint.y);
        let dx = Math.sin(angle / 180 * Math.PI) * WorldData.bulletOffsetX;
        let dy = WorldData.bulletOffsetY;
        startPoint.x += -dx;
        startPoint.y += dy;
        destinationPoint.y = startPoint.y;
        // 计算距离和需要的帧数
        let dis = Point.distance(startPoint, destinationPoint);
        let totalFrame = Math.max(Math.ceil(dis / skill.bulletSpeed * 60), 1);
        let currentFrame = 1;
        bullet.x = startPoint.x;
        bullet.y = startPoint.y;
        // 子弹面向
        let rotation = MathUtils.direction360(startPoint.x, startPoint.y, destinationPoint.x, destinationPoint.y);
        bullet.rotation = rotation;
        os.add_ENTERFRAME(() => {
            // 刷新子弹当前位置
            let per = currentFrame / totalFrame;
            bullet.x = (destinationPoint.x - startPoint.x) * per + startPoint.x;
            bullet.y = (destinationPoint.y - startPoint.y) * per + startPoint.y;
            // 推进1帧，当击中目标时进入下一阶段
            currentFrame++;
            if (currentFrame > totalFrame) {
                // 清除帧刷
                //@ts-ignore
                os.remove_ENTERFRAME(arguments.callee, this);
                // 清除子弹
                bullet.dispose();
                // 到下一个阶段
                if (onFin) onFin.apply(this)
                else this.hitTarget();
            }
        }, this);
    }
    /**
     * 释放
     */
    private step_release(): void {
        EventUtils.happen(GUI_BattleScene, GUI_BattleScene.EVENT_BATTLE_STEP, [5]);
        this.bsFromBattler.avatarFrame = 1;
        let releaseActionID: number;
        let releaseFrame: number;
        if (this.isAttack) {
            releaseActionID = 3;
            releaseFrame = this.fromBattler.battlerSetting.actor.hitFrame;
        }
        else {
            releaseActionID = this.skill.releaseActionID;
            releaseFrame = this.skill.releaseFrame;
        }
        let doNextStep = false;
        let doStep_release = () => {
            if (doNextStep) return;
            doNextStep = true;
            this.execReleaseEvent(!this.skill, this.skill, this.bsFromBattler, this.bsTargetBattler, () => {
                if (this.actionType == 1) {
                    this.step_release_bullet();
                }
                else if (this.actionType == 2) {
                    this.cameraMove(1, 0, 0, this.bsTargetBattler.index, true, WorldData.cameraToTargetTotalFrame, null, null, null);
                    setFrameout(() => {
                        this.hitTarget();
                    }, Math.max(WorldData.cameraToTargetTotalFrame - 5, 0));
                }
                else {
                    this.hitTarget();
                }
            });
        }
        // -- 释放动画
        let waitReleaseAnimationOver = GameBattleAction.playReleaseAnimation(this.bsFromBattler, this.fromActor, this.isAttack, this.skill, () => {
            if (waitReleaseAnimationOver) doStep_release.apply(this);
        });
        GameBattleAction.releaseAction(this.bsFromBattler, releaseActionID, releaseFrame, 1, () => {
            if (!waitReleaseAnimationOver) doStep_release.apply(this);
        });
    }
    /**
     * 奖励
     */
    private step_reward(): void {
        GameBattleAction.calcCurrentActionReward(false, () => {
            this.step_over();
        }, "battle-scene-step-over");
    }
    /**
     * 结束
     */
    private step_over(): void {
        // 还原图像层
        Game.layer.addChildAt(Game.layer.imageLayer, 1);
        // 移除监听
        EventUtils.removeEventListenerFunction(GameBattleData, GameBattleData.EVENT_STATUS_CHANGE, this.onBattlerStatusChange, this);
        // 执行关闭战斗画面事件
        GameCommand.startCommonCommand(14019, [], Callback.New(() => {
            // 确保关闭界面
            GameUI.hide(this.guiID);
            GameBattle.battlerfieldDetermineHandle(() => {
                GameBattleAction.calcCurrentActionReward(false, () => {
                    EventUtils.happen(GameBattleAction, GameBattleAction.EVENT_ONCE_ACTION_COMPLETE);
                }, "battle-scene-action-complete");
            });
        }, this), this.fromBattler, this.targetBattler);
    }
    /**
     * 击中
     */
    private hitTarget(counterattack: boolean = false, fromBattler: ProjectClientSceneObject = null, targetBattler: ProjectClientSceneObject = null, bsFromBattler: ProjectClientSceneObject = null, bsTargetBattler: ProjectClientSceneObject = null): void {
        EventUtils.happen(GUI_BattleScene, GUI_BattleScene.EVENT_BATTLE_STEP, [6, counterattack, fromBattler, targetBattler, bsFromBattler, bsTargetBattler]);
        // 获取直接攻击或反击对应的数据
        if (!fromBattler) fromBattler = this.fromBattler;
        if (!targetBattler) targetBattler = this.targetBattler;
        if (!bsTargetBattler) bsTargetBattler = this.bsTargetBattler;
        if (!bsFromBattler) bsFromBattler = this.bsFromBattler;
        let fromActor = fromBattler.battlerSetting.actor;
        let targetActor = targetBattler.battlerSetting.actor;
        let isAttack = this.isAttack;
        let skill = this.skill;
        if (counterattack) {
            isAttack = fromActor.atkMode == 0;
            if (!isAttack) skill = fromActor.atkSkill;
            else skill = null;
        }
        // 是否命中标识，根据对应行为计算命中率
        let isHitSuccess = true;
        // 击中动画
        let hitAniID = 0;
        // 是否显示目标受伤动作
        let showTargetHurtAnimation = false;
        // 普通攻击：(攻击者命中率 - 目标躲避率)%
        if (isAttack) {
            isHitSuccess = MathUtils.rand(100) < (fromActor.HIT - targetActor.DOD - RogueSkillSynergySystem.getDodgeBonus(targetBattler));
            hitAniID = fromBattler.battlerSetting.actor.hitAnimation;
            showTargetHurtAnimation = true;
        }
        // 使用技能：(技能命中率)%
        else {
            if (skill == fromBattler.battlerSetting.actor.atkSkill) {
                isHitSuccess = MathUtils.rand(100) < (fromActor.HIT - targetActor.DOD - RogueSkillSynergySystem.getDodgeBonus(targetBattler));
            }
            else {
                isHitSuccess = MathUtils.rand(100) < (skill.hit - RogueSkillSynergySystem.getDodgeBonus(targetBattler));
            }
            hitAniID = skill.hitAnimation;
            showTargetHurtAnimation = GameBattleHelper.isHostileRelationship(fromBattler, targetBattler);
        }
        // 击中即要计算伤害
        // Keep the pre-hit HP so custom damage events that mutate HP directly
        // still get an attribution marker (they may not return a built-in
        // damage result for the normal res.damage check below).
        let targetHPBefore = targetActor.hp;
        let rogueHitState = RogueSkillSynergySystem.captureHitState(targetBattler);
        let res = GameBattleData.calculationHitResult(fromBattler, targetBattler, isHitSuccess, isAttack ? 0 : 1, skill, null, null,
            GameBattleAction.seCounterattack ? GameBattleAction.seCounterattackDamagePer : null, bsFromBattler, bsTargetBattler);
        let synergyEffects = RogueSkillSynergySystem.afterHit(fromBattler, targetBattler, isAttack ? 0 : 1, skill, res, rogueHitState);
        for (let i = 0; i < synergyEffects.length; i++) {
            let effect = synergyEffects[i];
            let effectDamage = RogueSkillSynergySystem.absorbDamage(effect.target, effect.damage, true);
            effectDamage = RogueSkillSynergySystem.preventLethalDamage(effect.target, effectDamage);
            GameBattleData.changeBattlerHP(effect.target, effectDamage);
            RogueKillProgress.markDamageSource(effect.target, fromBattler, null, !!effect.secondary);
            GameBattleAction.showDamage(effect.target, effect.damageType, effectDamage, false, null, this.scene);
            GameBattle.checkBattlerIsDead(effect.target, () => { });
        }
        if ((res && res.damage < 0) || targetActor.hp < targetHPBefore) {
            RogueKillProgress.markDamageSource(targetBattler, fromBattler, skill);
        }
        // 内部函数
        let callHitEvent = () => {
            this.execHitTargetEvent(isHitSuccess, skill, bsFromBattler, bsTargetBattler, () => {
                if (bsTargetBattler.avatar.actionID != 7) bsTargetBattler.avatar.actionID = 1;
                this.hitResult(isHitSuccess, res, counterattack, fromBattler, targetBattler, bsFromBattler, bsTargetBattler);
            });
        }
        // 存在击中动画：显示击中动画
        // 已进入伤害显示阶段标识
        let alreadyInShowDamageStage = false;
        if (hitAniID) {
            AssetManager.preLoadAnimationAsset(hitAniID, Callback.New(() => {
                let hitAni: GCAnimation = null;
                // 命中的话显示受伤动作和动画
                if (isHitSuccess && showTargetHurtAnimation) {
                    // -- 受伤动作
                    let toHurtActionID = skill?.keepHurtAction ? 11 : 9;
                    if (bsTargetBattler.avatar.hasActionID(toHurtActionID)) {
                        bsTargetBattler.avatar.currentFrame = 1;
                        bsTargetBattler.avatar.once(Avatar.ACTION_PLAY_COMPLETED, this, () => {
                            if (!skill?.keepHurtAction) {
                                if (!alreadyInShowDamageStage) {
                                    alreadyInShowDamageStage = true;
                                    callHitEvent.apply(this);
                                }
                            }
                        })
                        bsTargetBattler.avatar.actionID = toHurtActionID;
                    }
                    // -- 受伤动画
                    if (WorldData.hurtAni) bsTargetBattler.playAnimation(WorldData.hurtAni, true, true);
                }
                // 播放击中动画
                hitAni = bsTargetBattler.playAnimation(hitAniID, false, isHitSuccess, null, true);
                if (hitAni) {
                    // 播放击中动画
                    hitAni.once(GCAnimation.PLAY_COMPLETED, this, () => {
                        if (!alreadyInShowDamageStage) {
                            alreadyInShowDamageStage = true;
                            callHitEvent.apply(this);
                        }
                    });
                    // 监听提前进入显示伤害阶段
                    hitAni.once(GCAnimation.SIGNAL, this, (signalID: number) => {
                        if (signalID == 1) {
                            if (!alreadyInShowDamageStage) {
                                alreadyInShowDamageStage = true;
                                callHitEvent.apply(this);
                            }
                        }
                    });
                }
                else {
                    if (!alreadyInShowDamageStage) {
                        alreadyInShowDamageStage = true;
                        callHitEvent.apply(this);
                    }
                }
            }, this), true, true, false);
        }
        // 不存在时：播放受伤动作后进入下一个阶段
        else {
            // 命中的话显示受伤动作和动画
            if (isHitSuccess && showTargetHurtAnimation) {
                // -- 受伤动作
                if (bsTargetBattler.avatar.hasActionID(9)) {
                    bsTargetBattler.avatar.currentFrame = 1;
                    bsTargetBattler.avatar.once(Avatar.ACTION_PLAY_COMPLETED, this, () => {
                        alreadyInShowDamageStage = true;
                        callHitEvent.apply(this);
                    })
                    bsTargetBattler.avatar.actionID = 9;
                }
                else {
                    alreadyInShowDamageStage = true;
                    callHitEvent.apply(this);
                }
                // -- 受伤动画
                if (WorldData.hurtAni) bsTargetBattler.playAnimation(WorldData.hurtAni, true, true);
            }
            else {
                callHitEvent.apply(this);
            }
        }
    }
    /**
     * 计算击中结果
     * @param isHitSuccess 
     */
    private hitResult(isHitSuccess: boolean, res: { damageType: number, damage: number, isCrit: boolean }, counterattack: boolean = false, fromBattler: ProjectClientSceneObject = null, targetBattler: ProjectClientSceneObject = null, bsFromBattler: ProjectClientSceneObject = null, bsTargetBattler: ProjectClientSceneObject = null): void {
        EventUtils.happen(GUI_BattleScene, GUI_BattleScene.EVENT_BATTLE_STEP, [7, isHitSuccess, res, counterattack, fromBattler, targetBattler, bsFromBattler, bsTargetBattler]);
        // 获取直接攻击或反击对应的数据
        if (!fromBattler) fromBattler = this.fromBattler;
        if (!targetBattler) targetBattler = this.targetBattler;
        if (!bsTargetBattler) bsTargetBattler = this.bsTargetBattler;
        if (!bsFromBattler) bsFromBattler = this.bsFromBattler;
        let fromActor = fromBattler.battlerSetting.actor;
        let targetActor = targetBattler.battlerSetting.actor;
        let isAttack = this.isAttack;
        let skill = this.skill;
        if (counterattack) {
            isAttack = fromActor.atkMode == 0;
            if (!isAttack) skill = fromActor.atkSkill;
        }
        let targetBattlerModule = bsTargetBattler.battlerSetting;
        let fromBattlerModule = bsFromBattler.battlerSetting;
        // 等待播放效果播放完毕后算作「行动完成」
        let animationCount = 0;
        let refreshActorWindow = false;
        let onAnimationCompleteCallback = Callback.New(() => {
            animationCount--;
            if (animationCount <= 0) {
                // 刷新双方面板
                if (!refreshActorWindow) {
                    GameBattleAction.showCurrentBattlerWindow(this.winCurrentBattler);
                    GameBattleAction.showTargetBattlerWindow(this.winTargetBattler);
                }
                if (this.currentHitTimes == this.totalHitTimes - 1) {
                    // 特殊效果：反击
                    let effect_counterattack = this.effect_counterattack(fromBattlerModule, targetBattlerModule, targetBattler);
                    if (effect_counterattack) return;
                }
                // 
                this.actionComplete();
            }
        }, this);
        // 计算击中结果
        if (res) {
            // 单体技能切入战斗演出时，同样在地图对象上结算强制位移和碰撞伤害。
            if (!isAttack && isHitSuccess && skill && targetBattlerModule.actor.hp > 0) {
                let collisionDamage = GameBattleAction.applySkillForceMove(fromBattler, targetBattler, skill);
                if (collisionDamage > 0) {
                    GameBattleData.changeBattlerHP(targetBattler, -collisionDamage);
                    res.damage -= collisionDamage;
                }
                if (skill.id == 68 && skill["__rogueForceMoveBlocked"]) GameBattleData.addStatus(targetBattler, 2, fromBattler, true);
            }
            if (!WorldData.useCustomDamageLogic) {
                // -- 伤害类技能且造成了伤害时：记录片段经验值以及伤害类特殊效果
                if (res.damageType >= 0 && res.damageType <= 2 && res.damage < 0) {
                    GameBattleData.addEXPFragment(fromBattler, targetBattler, -res.damage / targetBattlerModule.actor.MaxHP);
                    let showSlefDmage = false;
                    let damageType = isAttack ? 0 : (skill ? skill.damageType : -2);
                    // 特殊效果：反弹伤害
                    let returnDmagePer = GameBattleHelper.getReturnAttackDamagePer(fromBattler, targetBattler, damageType);
                    if (returnDmagePer != null) {
                        let returnDamage = MathUtils.int(res.damage * returnDmagePer * 0.01);
                        if (returnDamage != 0) {
                            GameBattleAction.reverseBattler = targetBattler;
                            GameBattleData.changeBattlerHP(fromBattler, returnDamage);
                            GameBattleData.addEXPFragment(targetBattler, fromBattler, -returnDamage / fromBattlerModule.actor.MaxHP);
                            GameBattleAction.showDamage(bsFromBattler, res.damageType, returnDamage, false, null, this.scene, this.currentHitTimes == this.totalHitTimes - 1);
                            showSlefDmage = true;
                        }
                    }
                    // 特殊效果：吸取生命值-近战
                    let suckHP = GameBattleHelper.getSuckPer(fromBattler, damageType, true, this.isMelee);
                    if (suckHP != null) {
                        let hpValue = MathUtils.int(-res.damage * suckHP * 0.01);
                        if (hpValue != 0) {
                            GameBattleData.changeBattlerHP(fromBattler, hpValue);
                            if (!showSlefDmage) GameBattleAction.showDamage(bsFromBattler, 3, hpValue, false, null, this.scene);
                            showSlefDmage = true;
                        }
                    }
                    // 特殊效果：吸取魔法值-近战
                    let suckSP = GameBattleHelper.getSuckPer(fromBattler, damageType, false, this.isMelee);
                    if (suckSP != null) {
                        let spValue = MathUtils.int(-res.damage * suckSP * 0.01);
                        if (spValue != 0) {
                            GameBattleData.changeBattlerSP(fromBattler, spValue);
                            if (!showSlefDmage) GameBattleAction.showDamage(bsFromBattler, 4, spValue, false, null, this.scene);
                            showSlefDmage = true;
                        }
                    }
                }
            }
            // 双方生命值都不为0的情况下需要等待伤害显示完毕，否则立即返回
            let animationCountZero = true;
            if (!WorldData.useCustomDamageLogic) {
                if (targetBattlerModule.actor.hp != 0 && fromBattlerModule.actor.hp != 0) {
                    animationCount++;
                    animationCountZero = false;
                }
            }
            // 最后一次立即刷新
            if (this.currentHitTimes == this.totalHitTimes - 1) {
                GameBattleAction.showCurrentBattlerWindow(this.winCurrentBattler);
                GameBattleAction.showTargetBattlerWindow(this.winTargetBattler);
                refreshActorWindow = true;
            }
            if (!WorldData.useCustomDamageLogic) GameBattleAction.showDamage(bsTargetBattler, res.damageType, res.damage, res.isCrit, animationCountZero ? null : onAnimationCompleteCallback, this.scene, this.currentHitTimes == this.totalHitTimes - 1);
            if (animationCountZero) {
                onAnimationCompleteCallback.run();
            }
        }
        // 停止受伤动画
        if (WorldData.hurtAni) bsTargetBattler.stopAnimation(WorldData.hurtAni);
        // Record both sides of the hit. The regular map battle path does this
        // in GameBattleAction.hitResult, but battle-scene attacks resolve here
        // instead. The second marker is required when return damage kills the
        // original attacker (commonly during the enemy turn).
        if (res && res.damage < 0) RogueKillProgress.markDamageSource(targetBattler, fromBattler, skill);
        if (GameBattleAction.reverseBattler == targetBattler && fromActor.hp == 0) {
            RogueKillProgress.markDamageSource(fromBattler, targetBattler);
        }
        if (!res) {
            animationCount++;
            onAnimationCompleteCallback.run();
        }
    }
    /**
     * 行为结束:派发战斗行为阶段事件
     * 检查多目标完毕和连击完毕
     */
    private actionComplete(skipHitTimes: boolean = false): void {
        EventUtils.happen(GUI_BattleScene, GUI_BattleScene.EVENT_BATTLE_STEP, [8, skipHitTimes]);
        // -- 死亡的情况（攻击方或受击方）
        if (this.targetBattler.battlerSetting.actor.hp == 0 || this.fromBattler.battlerSetting.actor.hp == 0) {
            let task = new AsynTask(Callback.New(() => {
                this.step_reward();
            }, this));
            if (this.targetBattler.battlerSetting.actor.hp == 0) {
                task.execute(1);
                this.effect_die(this.bsTargetBattler, () => { task.complete(); });
            }
            if (this.fromBattler.battlerSetting.actor.hp == 0) {
                task.execute(2);
                this.effect_die(this.bsFromBattler, () => { task.complete(); });
            }
        }
        else {
            this.currentHitTimes++;
            if (this.currentHitTimes != this.totalHitTimes) {
                this.step_startAction();
            }
            else {
                this.step_reward();
            }
        }
    }
    /**
     * 镜头移动
     */
    private cameraMove(type, x, y, soIndex, tween, t, tCur, window_width, window_height) {
        if (tCur === void 0) { tCur = null; }
        if (window_width === void 0) { window_width = null; }
        if (window_height === void 0) { window_height = null; }
        if (Game && Game.pause) {
            Callback.CallLater(GameFunction.cameraMove, GameFunction, [type, x, y, soIndex, tween, t, tCur, window_width, window_height]);
            return;
        }
        if (!window_width)
            window_width = Config.WINDOW_WIDTH;
        if (!window_height)
            window_height = Config.WINDOW_HEIGHT;
        let me = arguments.callee;
        if (this["cameraMoveCB"]) {
            this["cameraMoveCB"].stopDelay(clearFrameout);
        }
        let scene = this.scene;
        if (!scene || scene.isDisposed)
            return;
        let startRect = scene.camera.viewPort;
        if (tCur == null) {
            this["cameraMove_from"] = new Point(startRect.x, startRect.y);
            tCur = 1;
            scene.camera.sceneObject = null;
            scene.updateCamera();
        }
        let fromP = this["cameraMove_from"];
        let toP, soc;
        if (type == 1) {
            if (soIndex >= 0) {
                soc = scene.sceneObjects[soIndex];
                if (soc) {
                    toP = new Point(soc.x - window_width * 0.5, soc.y - window_height * 0.5);
                }
            }
        }
        else {
            toP = new Point(x - window_width * 0.5, y - window_height * 0.5);
        }
        if (!toP) {
            return;
        }
        let curP, per;
        if (tween) {
            per = Ease.strongOut(tCur, 0, 1, t);
        }
        else {
            per = tCur / t;
        }
        curP = Point.interpolate(toP, fromP, per);
        scene.camera.viewPort.x = curP.x;
        scene.camera.viewPort.y = curP.y;
        scene.updateCamera();
        tCur++;
        if (tCur > t) {
            if (type == 1) {
                scene.camera.sceneObject = soc;
                scene.updateCamera();
            }
            return;
        }
        ;
        this["cameraMoveCB"] = Callback.New(function () {
            me.apply(this, [type, x, y, soIndex, tween, t, tCur, window_width, window_height]);
        }, this).delayRun(1, setFrameout);
    };
    /**
     * 移动 - 反击
     */
    private step_move_counterattack(onFin: Function): void {
        this.scene.camera.sceneObject = this.bsTargetBattler;
        let toPos = [this.bsFromBattlerLeft ? this.bsFromBattler.x + WorldData.battlerSpacing : this.bsFromBattler.x - WorldData.battlerSpacing, this.bsFromBattler.y];
        if ((this.bsTargetBattler.x == toPos[0] && this.bsTargetBattler.y == toPos[1])) {
            onFin.apply(this);
        }
        else {
            GameBattleAction.execMoveEvent(this.bsTargetBattler);
            this.bsTargetBattler.startMove([toPos], 0, false, Callback.New(onFin, this));
        }
    }
    //------------------------------------------------------------------------------------------------------
    //  状态效果
    //------------------------------------------------------------------------------------------------------
    /**
     * 刷新状态动画
     */
    private refreshStatusAnimation(): void {
        this.refreshBattlerStatusAnimation(this.fromBattler, this.bsFromBattler, this.fromStAniRecord);
        this.refreshBattlerStatusAnimation(this.targetBattler, this.bsTargetBattler, this.targetStAniRecord);
    }
    /**
     * 当战斗者状态发生改变时
     * @param battler 战斗者
     */
    private onBattlerStatusChange(battler: ProjectClientSceneObject): void {
        if (battler == this.fromBattler) {
            this.refreshBattlerStatusAnimation(this.fromBattler, this.bsFromBattler, this.fromStAniRecord);
        }
        else if (battler == this.targetBattler) {
            this.refreshBattlerStatusAnimation(this.targetBattler, this.bsTargetBattler, this.targetStAniRecord);
        }
    }
    /**
     * 刷新战斗者状态动画
     * @param battler 地图战斗者
     * @param bsBattler 战斗画面的战斗者
     * @param StAniRecord 
     */
    private refreshBattlerStatusAnimation(battler: ProjectClientSceneObject, bsBattler: ProjectClientSceneObject, StAniRecord: { [ani: number]: boolean }): void {
        let actor = battler.battlerSetting.actor;
        // -- 遍历当前所有状态，添加播放动画
        let actorCurrentStAni = [];
        for (let i = 0; i < actor.status.length; i++) {
            let st = actor.status[i];
            actorCurrentStAni[st.animation] = true;
            // -- 已存在该动画时忽略
            if (!st.animation || StAniRecord[st.animation]) continue;
            // -- 附加动画
            bsBattler.playAnimation(st.animation, true, true);
            StAniRecord[st.animation] = true;
        }
        // -- 遍历此前所有动画，若当前的状态中未包含该动画则移除掉
        for (let s in StAniRecord) {
            let aniID = MathUtils.int(s);
            if (actorCurrentStAni[aniID]) continue;
            bsBattler.stopAnimation(aniID);
            delete StAniRecord[aniID];
        }
    }
    /**
     * 移除战斗者所有状态动画
     * @param bsBattler 战斗者
     * @param StAniRecord 
     */
    private removeBattlerAllStatusAnimation(bsBattler: ProjectClientSceneObject, StAniRecord: { [ani: number]: boolean }): void {
        for (let s in StAniRecord) {
            let aniID = MathUtils.int(s);
            bsBattler.stopAnimation(aniID);
            delete StAniRecord[aniID];
        }
    }
    //------------------------------------------------------------------------------------------------------
    //  效果演示
    //------------------------------------------------------------------------------------------------------
    /**
     * 反击
     */
    private effect_counterattack(fromBattlerModule: SoModule_Battler, targetBattlerModule: SoModule_Battler, targetBattler: ProjectClientSceneObject) {
        if (!GameBattleAction.seCounterattack) {
            // -- 普通攻击或攻击类技能
            if (this.isAttack || (this.skill && GameBattleHelper.isHostileSkill(this.skill))) {
                if (targetBattlerModule.actor.hp != 0 && fromBattlerModule.actor.hp != 0 && !targetBattlerModule.isDead && !fromBattlerModule.isDead) {
                    let damageType = this.isAttack ? 0 : (this.skill ? this.skill.damageType : -2);
                    let counterattackDmagePer = GameBattleHelper.getCounterattackDamagePer(this.fromBattler, this.targetBattler, this.isMelee, damageType);
                    if (counterattackDmagePer != null) {
                        EventUtils.happen(GUI_BattleScene, GUI_BattleScene.EVENT_BATTLE_STEP, [9, fromBattlerModule, targetBattlerModule, targetBattler]);
                        GameBattleAction.reverseBattler = targetBattler;
                        GameBattleAction.seCounterattack = true;
                        GameBattleAction.seCounterattackDamagePer = counterattackDmagePer;
                        let targetActor = this.bsTargetBattler.battlerSetting.actor;
                        let isAttack = targetBattlerModule.actor.atkMode == 0 || !targetBattlerModule.actor.atkSkill;
                        let atkSkill = targetActor.atkMode == 1 ? targetActor.atkSkill : null;
                        // 执行击中
                        let doCounterattack = () => {
                            this.execReleaseEvent(isAttack, atkSkill, this.bsTargetBattler, this.bsFromBattler, () => {
                                this.hitTarget(true, this.targetBattler, this.fromBattler, this.bsTargetBattler, this.bsFromBattler);
                            });
                        }
                        // 播放动画效果后击中
                        setTimeout(() => {
                            // 攻击/技能的使用事件
                            this.execUseEvent(isAttack, atkSkill, this.bsTargetBattler, this.bsFromBattler, () => {
                                // -- 面朝目标（右边背对攻击者时，需要转回正面）
                                if (this.counterattackTurnFront) {
                                    if (this.bsRightBattler == this.bsTargetBattler) this.bsRightBattler.avatarOri = 6;
                                    else this.bsLeftBattler.avatarOri = 6;
                                }
                                // -- 近战直接反击
                                if (this.isMelee) {
                                    let waitReleaseAnimationOver = GameBattleAction.playReleaseAnimation(this.bsTargetBattler, this.targetActor, true, null, () => {
                                        if (waitReleaseAnimationOver) doCounterattack.apply(this);
                                    });
                                    GameBattleAction.releaseAction(this.bsTargetBattler, 3, targetBattlerModule.actor.hitFrame, 1, () => {
                                        if (!waitReleaseAnimationOver) doCounterattack.apply(this);
                                    });
                                }
                                // -- 非近战：移动攻击/弹幕/远程直接攻击
                                else {
                                    // 如果是立即，则移动过去攻击。
                                    if ((targetBattlerModule.actor.atkMode == 0 && targetBattlerModule.actor.isMelee) ||
                                        (targetBattlerModule.actor.atkMode == 1 && targetBattlerModule.actor.atkSkill && targetBattlerModule.actor.atkSkill.skillType == 0)) {
                                        this.step_move_counterattack(() => {
                                            let waitReleaseAnimationOver = GameBattleAction.playReleaseAnimation(this.bsTargetBattler, this.targetActor, true, null, () => {
                                                if (waitReleaseAnimationOver) doCounterattack.apply(this);
                                            });
                                            GameBattleAction.releaseAction(this.bsTargetBattler, 3, targetBattlerModule.actor.hitFrame, 1, () => {
                                                if (!waitReleaseAnimationOver) doCounterattack.apply(this);
                                            });

                                        });
                                    }
                                    // 如果是弹幕且弹幕速度不为0则显示弹幕，发出后到达目的地点，（此时镜头锁定弹幕
                                    else if (this.skill && this.skill.bulletSpeed != 0) {
                                        let waitReleaseAnimationOver = GameBattleAction.playReleaseAnimation(this.bsTargetBattler, this.targetActor, true, null, () => {
                                            if (waitReleaseAnimationOver) doCounterattack.apply(this);
                                        });
                                        GameBattleAction.releaseAction(this.bsTargetBattler, 3, targetBattlerModule.actor.hitFrame, 1, () => {
                                            this.step_release_bullet(true, this.targetBattler, this.fromBattler, this.bsTargetBattler, this.bsFromBattler, () => {
                                                if (!waitReleaseAnimationOver) doCounterattack.apply(this);
                                            });
                                        });

                                    }
                                    // 如果是弹幕且弹幕速度为0，发出后镜头锁定目的地（不移动）
                                    else {
                                        let waitReleaseAnimationOver = GameBattleAction.playReleaseAnimation(this.bsTargetBattler, this.targetActor, true, null, () => {
                                            if (waitReleaseAnimationOver) doCounterattack.apply(this);
                                        });
                                        GameBattleAction.releaseAction(this.bsTargetBattler, 3, targetBattlerModule.actor.hitFrame, 1, () => {
                                            setFrameout(() => {
                                                this.cameraMove(1, 0, 0, this.bsFromBattler.index, true, WorldData.cameraToTargetTotalFrame, null, null, null);
                                            }, Math.max(WorldData.cameraToTargetTotalFrame - 5, 0));
                                            if (!waitReleaseAnimationOver) doCounterattack.apply(this);
                                        });
                                    }
                                }
                            })
                        }, WorldData.actionReflectionTime);
                        return true;
                    }
                }
            }
        }
        else {
            GameBattleAction.seCounterattack = false;
            GameBattleAction.seCounterattackDamagePer = null;
        }
        return false;
    }
    /**
     * 死亡
     */
    private effect_die(bsBattler: ProjectClientSceneObject, onFin: Function) {
        EventUtils.happen(GUI_BattleScene, GUI_BattleScene.EVENT_BATTLE_STEP, [10, bsBattler]);
        // 死亡掉落数据
        GameBattleData.dropRecordByDie(bsBattler == this.bsFromBattler ? this.fromBattler : this.targetBattler);
        // 如果存在死亡动作则播放死亡动作
        if (bsBattler.avatar.hasActionID(7)) {
            bsBattler.avatar.currentFrame = 1;
            bsBattler.avatar.once(Avatar.ACTION_PLAY_COMPLETED, this, () => {
                bsBattler.autoPlayEnable = false;
                bsBattler.avatar.currentFrame = bsBattler.avatar.totalFrame;
                onFin.apply(this);
            })
            bsBattler.avatarAct = 7;
        }
        // 否则播放死亡动画
        else {
            let deadAni = bsBattler.playAnimation(1034, false, true);
            deadAni.once(GCAnimation.PLAY_COMPLETED, this, onFin);
        }
        // 移除掉所有的状态动画
        this.removeBattlerAllStatusAnimation(bsBattler, bsBattler == this.bsFromBattler ? this.fromStAniRecord : this.targetStAniRecord);
    }
    /**
     * 执行片段事件
     * @param feData 片段事件
     * @param trigger 触发者
     * @param execute 执行者
     * @param onFin 完成时回调
     */
    private startTriggerFragmentEvent(feData: string, trigger: SceneObjectEntity, execute: SceneObjectEntity, onFin: Function) {
        // -- 临时替换当前场景，以便能够找到当前场景的触发器
        let oldScene = Game.currentScene;
        Game.currentScene = this.scene as any;
        CommandPage.startTriggerFragmentEvent(feData, trigger, execute, Callback.New(() => {
            Game.currentScene = oldScene;
            onFin && onFin.apply(this);
        }, this));
    }
    //------------------------------------------------------------------------------------------------------
    //  相关事件
    //------------------------------------------------------------------------------------------------------
    /**
     * 执行-使用事件（根据攻击或技能执行对应的使用事件）
     */
    private execUseEvent(isAttack: boolean, skill: Module_Skill, bsFromBattler: ProjectClientSceneObject, bsTargetBattler: ProjectClientSceneObject, onFin: Function) {
        if (isAttack) {
            this.execUseAttkckEvent(bsFromBattler, bsTargetBattler, onFin);
        }
        else {
            this.execUseSkillEvent(bsFromBattler, bsTargetBattler, skill, onFin);
        }
    }
    /**
     * 执行-释放事件（根据攻击或技能执行对应的使用事件）
     */
    private execReleaseEvent(isAttack: boolean, skill: Module_Skill, bsFromBattler: ProjectClientSceneObject, bsTargetBattler: ProjectClientSceneObject, onFin: Function) {
        if (isAttack) {
            this.execReleaseAttackEvent(bsFromBattler, bsTargetBattler, onFin);
        }
        else {
            this.execReleaseSkillEvent(bsFromBattler, bsTargetBattler, skill, onFin);
        }
    }
    /**
     * 使用攻击事件（技能代替攻击不会执行此函数）
     */
    private execUseAttkckEvent(bsFromBattler: ProjectClientSceneObject, bsTargetBattler: ProjectClientSceneObject, onFin: Function) {
        function fromActorUseAtkEvent(actor: Module_Actor, onFin: Function) {
            if (actor.eventSetting && actor.useAtkEvent) {
                this.startTriggerFragmentEvent(actor.useAtkEvent, bsFromBattler, bsTargetBattler, onFin);
            }
            else onFin.apply(this);
        }
        fromActorUseAtkEvent.call(this, bsFromBattler.battlerSetting.actor, () => {
            onFin.apply(this);
        });
    }
    /**
     * 释放攻击事件
     */
    private execReleaseAttackEvent(bsFromBattler: ProjectClientSceneObject, bsTargetBattler: ProjectClientSceneObject, onFin: Function) {
        function fromActorRelaseSkillEvent(actor: Module_Actor, onFin: Function) {
            if (actor.eventSetting && actor.releaseAtkEvent) {
                this.startTriggerFragmentEvent(actor.releaseAtkEvent, bsFromBattler, bsTargetBattler, onFin);
            }
            else onFin.apply(this);
        }
        fromActorRelaseSkillEvent.call(this, bsFromBattler.battlerSetting.actor, () => {
            onFin.apply(this);
        });
    }
    /**
     * 使用技能事件（没有skill不会触发）
     * @param bsFromBattler 
     * @param bsTargetBattler 
     * @param skill 
     * @param onFin 
     */
    private execUseSkillEvent(bsFromBattler: ProjectClientSceneObject, bsTargetBattler: ProjectClientSceneObject, skill: Module_Skill, onFin: Function) {
        function fromActorUseSkillEvent(actor: Module_Actor, onFin: Function) {
            if (skill && actor.eventSetting && actor.useEvent) {
                this.startTriggerFragmentEvent(actor.useEvent, bsFromBattler, bsTargetBattler, onFin);
            }
            else onFin.apply(this);
        }
        function skillUseSkilEvent(skill: Module_Skill, onFin: Function) {
            if (skill && skill.eventSetting && skill.useEvent) {
                this.startTriggerFragmentEvent(skill.useEvent, bsFromBattler, bsTargetBattler, onFin);
            }
            else onFin.apply(this);
        }
        fromActorUseSkillEvent.call(this, bsFromBattler.battlerSetting.actor, () => {
            skillUseSkilEvent.call(this, skill, () => {
                onFin.apply(this);
            });
        });
    }
    /**
     * 释放技能事件（没有skill不会触发）
     * @param bsFromBattler 
     * @param bsTargetBattler 
     * @param skill 
     * @param onFin 
     */
    private execReleaseSkillEvent(bsFromBattler: ProjectClientSceneObject, bsTargetBattler: ProjectClientSceneObject, skill: Module_Skill, onFin: Function) {
        function fromActorRelaseSkillEvent(actor: Module_Actor, onFin: Function) {
            if (skill && actor.eventSetting && actor.releaseEvent) {
                this.startTriggerFragmentEvent(actor.releaseEvent, bsFromBattler, bsTargetBattler, onFin);
            }
            else onFin.apply(this);
        }
        function skillRelaseSkilEvent(skill: Module_Skill, onFin: Function) {
            if (skill && skill.eventSetting && skill.releaseEvent) {
                this.startTriggerFragmentEvent(skill.releaseEvent, bsFromBattler, bsTargetBattler, onFin);
            }
            else onFin.apply(this);
        }
        fromActorRelaseSkillEvent.call(this, bsFromBattler.battlerSetting.actor, () => {
            skillRelaseSkilEvent.call(this, skill, () => {
                onFin.apply(this);
            });
        });
    }
    /**
     * 执行-击中目标和被击中的事件（普通攻击/技能）
     * @param skill 技能
     * @param fromBattler 来源
     * @param onFin 
     */
    private execHitTargetEvent(isHitSuccess: boolean, skill: Module_Skill, bsFromBattler: ProjectClientSceneObject, bsTargetBattler: ProjectClientSceneObject, onFin: Function): void {
        let fromBattlerModule = bsFromBattler.getModule(6) as SoModule_Battler;
        // 角色-击中目标事件
        function fromActorHitEvent(actor: Module_Actor, onFin: Function) {
            if (actor.eventSetting && actor.hitEvent) {
                this.startTriggerFragmentEvent(actor.hitEvent, bsFromBattler, bsTargetBattler, onFin);
            }
            else onFin.apply(this);
        }
        // 技能-击中目标事件
        function skillHitEvent(skill: Module_Skill, onFin: Function) {
            if (skill && skill.eventSetting && skill.hitEvent) {
                this.startTriggerFragmentEvent(skill.hitEvent, bsFromBattler, bsTargetBattler, onFin);
            }
            else onFin.apply(this);
        }
        // 被击中事件
        function hitByEvent(onFin: Function) {
            let targetBattlerModule = bsTargetBattler.getModule(6) as SoModule_Battler;
            if (GameBattleHelper.isHostileRelationship(bsFromBattler, bsTargetBattler) && targetBattlerModule.actor.eventSetting && targetBattlerModule.actor.hitByEvent) {
                this.startTriggerFragmentEvent(targetBattlerModule.actor.hitByEvent, bsFromBattler, bsTargetBattler, onFin);
            }
            else onFin.apply(this);
        }
        if (isHitSuccess) {
            fromActorHitEvent.call(this, fromBattlerModule.actor, () => {
                skillHitEvent.call(this, skill, () => {
                    hitByEvent.call(this, () => {
                        onFin.apply(this);
                    });
                });
            });
        }
        else onFin.apply(this);
    }
}
