/**
 * 战斗相关辅助计算类
 * Created by 黑暗之神KDS on 2021-01-14 13:52:47.
 */
class GameBattleHelper {
    private static readonly SUMMON_SKILL_ACTOR_IDS: any = {
        17: 1011,
        35: 1011,
        36: 1009,
        37: 1010,
        39: 1012,
        1016: 1009,
        1017: 1010,
        1018: 1011
    };
    //------------------------------------------------------------------------------------------------------
    // 获取
    //------------------------------------------------------------------------------------------------------
    /**
     * 获取等级根据角色数据
     * 因为战斗者区分玩家拥有的角色和非玩家拥有的角色，储存等级的地方不一样
     * @param actor 角色数据 
     * @return [number] 等级
     */
    static getLevelByActor(actor: Module_Actor): number {
        // -- 如果是玩家拥有的角色时则从玩家队伍的该角色中获取等级
        let playerActorDS: DataStructure_inPartyActor = ArrayUtils.matchAttributes(Game.player.data.party, { actor: actor }, true)[0];
        if (playerActorDS) {
            return playerActorDS.lv;
        }
        // -- 否则根据场上的战斗者获取等级
        else {
            for (let i = 0; i < Game.currentScene.sceneObjects.length; i++) {
                let so = Game.currentScene.sceneObjects[i];
                if (this.isBattler(so)) {
                    let soBattlerModule = so.getModule(6) as SoModule_Battler;
                    if (soBattlerModule.actor == actor) {
                        return soBattlerModule.level;
                    }
                }
            }
        }
        return 1;
    }
    /**
     * 获取所有战斗者
     * @return [ProjectClientSceneObject] 
     */
    static get allBattlers(): ProjectClientSceneObject[] {
        let arr = [];
        for (let i = 0; i < Game.currentScene.sceneObjects.length; i++) {
            let so = Game.currentScene.sceneObjects[i];
            if (GameBattleHelper.isBattler(so)) {
                arr.push(so);
            }
        }
        return arr;
    }
    /**
     * 获取指定战斗者，根据角色数据
     * @param actor 角色数据
     */
    static getBattlerByActor(actor: Module_Actor): ProjectClientSceneObject {
        for (let i = 0; i < Game.currentScene.sceneObjects.length; i++) {
            let so = Game.currentScene.sceneObjects[i];
            if (so) {
                let battleModule = so.getModule(6) as SoModule_Battler;
                if (battleModule && battleModule.actor == actor) {
                    return so;
                }
            }
        }
        return null;
    }
    //------------------------------------------------------------------------------------------------------
    // 判定
    //------------------------------------------------------------------------------------------------------
    /**
     * 是否处于战斗中
     */
    static get isInBattle(): boolean {
        return GameBattle.state != 0;
    }
    /**
     * 是否战斗者
     * @param so 场景对象
     * @return [boolean]  
     */
    static isBattler(so: ProjectClientSceneObject): boolean {
        return so && so.getModule(6) != null;
    }
    /**
     * 是否玩家阵营
     * @param so 场景对象
     * @return [boolean] 
     */
    static isPlayerCamp(so: ProjectClientSceneObject): boolean {
        return this.isBattler(so) && (so.getModule(6) as SoModule_Battler).battleCamp == 0;
    }
    /**
     * 是否敌对阵营
     * @param so 场景对象
     * @return [boolean] 
     */
    static isEnemyCamp(so: ProjectClientSceneObject): boolean {
        return this.isBattler(so) && (so.getModule(6) as SoModule_Battler).battleCamp == 1;
    }
    /**
     * 是否属于玩家队伍
     * @param so 场景对象
     * @return [boolean] 
     */
    static isInPlayerParty(so: ProjectClientSceneObject): boolean {
        return this.isPlayerCamp(so) && ProjectPlayer.getPlayerActorIndexByActor((so.getModule(6) as SoModule_Battler).actor) >= 0;
    }
    /**
     * 两个战斗者之间是否队友关系
     * @param so1 战斗者1
     * @param so2 战斗者2
     * @return [boolean] 
     */
    static isFriendlyRelationship(so1: ProjectClientSceneObject, so2: ProjectClientSceneObject): boolean {
        return this.isBattler(so1) && this.isBattler(so2) && (so1.getModule(6) as SoModule_Battler).battleCamp == (so2.getModule(6) as SoModule_Battler).battleCamp;
    }
    /**
     * 两个战斗者之间是否敌对关系
     * @param so1 战斗者1
     * @param so2 战斗者2
     * @return [boolean] 
     */
    static isHostileRelationship(so1: ProjectClientSceneObject, so2: ProjectClientSceneObject): boolean {
        return this.isBattler(so1) && this.isBattler(so2) && (so1.getModule(6) as SoModule_Battler).battleCamp != (so2.getModule(6) as SoModule_Battler).battleCamp;
    }
    /**
     * 是否玩家可控制的战斗角色
     */
    static isPlayerControlEnabledBattler(so: ProjectClientSceneObject): boolean {
        if (this.isPlayerCamp(so)) {
            let soBattlerModule = so.getModule(6) as SoModule_Battler;
            if (!soBattlerModule.playerCantCtrl && !soBattlerModule.actor.AI) {
                return true;
            }
        }
        return false;
    }
    /**
     * 指定的格子坐标是否在作用范围内
     * @param gridPos 指定的格子坐标 
     * @return [boolean] 
     */
    static isInEffectGrid(gridPos: Point): boolean {
        if (!GameBattleAction.battlerEffectIndicatorGridArr) return false;
        return ArrayUtils.matchAttributes(GameBattleAction.battlerEffectIndicatorGridArr, { x: gridPos.x, y: gridPos.y }, true).length == 1;
    }
    /**
     * 是否开启了战斗相关的菜单
     */
    static get isOpendBattleMenu(): boolean {
        // 存在战斗者菜单的话
        let battlerMenu = GameUI.get(22) as GUI_22;
        if (battlerMenu && battlerMenu.stage) {
            return true;
        }
        // 战斗中打开的装备界面同样属于战斗菜单，避免场景输入穿透。
        let partyMenu = GameUI.get(16) as GUI_Party;
        if (partyMenu && partyMenu.stage) {
            return true;
        }
        // 存在通用菜单的话
        let commonMenu = GameUI.get(23) as GUI_23;
        if (commonMenu && commonMenu.stage) {
            return true;
        }
        return false;
    }
    /**
     * 是否近战行动
     * @param battler 战斗者
     * @param actionType 攻击类别
     * @param skill 技能
     * @return [boolean] 
     */
    static isMeleeAction(battler: ProjectClientSceneObject, actionType: number, skill: Module_Skill): boolean {
        let battleActor = battler.battlerSetting.actor;
        return (actionType == 0 && battleActor.isMelee) || (skill && GameBattleHelper.isMeleeSkill(skill));
    }
    /**
     * fromBattler是否位于targetBattler背后
     */
    static atBackward(fromBattler: ProjectClientSceneObject, targetBattler: ProjectClientSceneObject): boolean {
        if (fromBattler.avatarOri == targetBattler.avatarOri) {
            if ((targetBattler.avatarOri == 4 && fromBattler.x > targetBattler.x) || (targetBattler.avatarOri == 6 && fromBattler.x < targetBattler.x) ||
                (targetBattler.avatarOri == 2 && fromBattler.y < targetBattler.y) || (targetBattler.avatarOri == 8 && fromBattler.y > targetBattler.y)) {
                return true;
            }
        }
        return false;
    }
    //------------------------------------------------------------------------------------------------------
    // 技能
    //------------------------------------------------------------------------------------------------------
    /**
     * 是否是作用敌人的技能
     * @param skill 技能
     * @return [boolean] 
     */
    static isHostileSkill(skill: Module_Skill): boolean {
        return skill.skillType <= 1 && (skill.targetType == 2 || skill.targetType == 4 || skill.targetType == 6);
    }
    /**
     * 是否是作用我方的技能
     * @param skill 技能
     * @return [boolean] 
     */
    static isFriendlySkill(skill: Module_Skill): boolean {
        return skill.skillType <= 1 && !this.isHostileSkill(skill);
    }
    /**
     * 是否近战技能
     */
    static isMeleeSkill(skill: Module_Skill): boolean {
        return skill.skillType != 2 && skill.targetType == 2 && // 非被动 + 敌人单体
            ((skill.effectRangeType == 0 && skill.effectRange1 == 1) || // 普通范围1 or 最小到最大范围1
                (skill.effectRangeType == 1 && skill.effectRange1 == 1 && skill.effectRange2B == 1));
    }
    /**
     * 是否单体技能
     */
    static isSingleTargetSkill(skill: Module_Skill): boolean {
        return skill.skillType != 2 && skill.targetType == 2;
    }
    //------------------------------------------------------------------------------------------------------
    // 状态
    //------------------------------------------------------------------------------------------------------
    /**
     * 获取战斗者的状态
     * @param battler 战斗者
     * @param statusID 状态编号
     * @return [boolean] 
     */
    static getBattlerStatus(battler: ProjectClientSceneObject, statusID: number): Module_Status {
        return ArrayUtils.matchAttributes((battler.getModule(6) as SoModule_Battler).actor.status, { id: statusID }, true)[0];
    }
    /**
     * 检查战斗者是否包含指定的状态
     * @param battler 战斗者
     * @param statusID 状态编号
     * @return [boolean] 
     */
    static isIncludeStatus(battler: ProjectClientSceneObject, statusID: number): boolean {
        return ArrayUtils.matchAttributes((battler.getModule(6) as SoModule_Battler).actor.status, { id: statusID }, true).length == 1;
    }
    /**
     * 检查战斗者是否允许叠加状态，如果已拥有且最大层的话则不允许
     * @param battler 战斗者
     * @param statusID 状态编号
     * @return [boolean] 
     */
    static canSuperpositionLayer(battler: ProjectClientSceneObject, statusID: number): boolean {
        let status: Module_Status = ArrayUtils.matchAttributes((battler.getModule(6) as SoModule_Battler).actor.status, { id: statusID }, true)[0];
        if (status && status.currentLayer >= status.maxlayer) return false;
        return true;
    }
    //------------------------------------------------------------------------------------------------------
    // 是否允许行动
    //------------------------------------------------------------------------------------------------------
    /**
     * 是否允许移动
     * @param battler 战斗者
     * @return [boolean] 
     */
    static canMove(battler: ProjectClientSceneObject): boolean {
        // 非战斗者不允许
        if (!GameBattleHelper.isBattler(battler)) return false;
        let battlerModule = battler.getModule(6) as SoModule_Battler;
        // 当前回合已移动或已待机或死亡的话则不允许
        if (battlerModule.moved || battlerModule.operationComplete || battlerModule.isDead) return false;
        // 移动力不足不允许移动
        if (battlerModule.actor.MoveGrid <= 0) return false;
        // 存在无法移动的状态则不允许
        return ArrayUtils.matchAttributes(battlerModule.actor.status, { cantMove: true }, true).length == 0;
    }
    /**
     * 是否允许攻击
     * @param battler 战斗者
     * @param force[可选] 默认值=false 强制表示已行动过仍然允许攻击
     * @return [boolean] 
     */
    static canAttack(battler: ProjectClientSceneObject, force: boolean = false): boolean {
        // 非战斗者不允许
        if (!GameBattleHelper.isBattler(battler)) return false;
        let battlerModule = battler.getModule(6) as SoModule_Battler;
        // 当前回合已行动或已待机或死亡的话则不允许
        if ((!force && (battlerModule.actioned || battlerModule.operationComplete)) || battlerModule.isDead) return false;
        // 使用技能代替普通攻击的模式下，未配置技能或技能不满足使用的话不允许攻击
        let actor = battlerModule.actor;
        if (!force && (actor.atkMode == 1 && (!actor.atkSkill || actor.atkSkill.currentCD != 0 || actor.atkSkill.costSP > actor.sp || actor.atkSkill.costHP > actor.hp))) return false;
        // 存在无法攻击的状态则不允许
        return ArrayUtils.matchAttributes(actor.status, { cantAtk: true }, true).length == 0;
    }
    /**
     * 是否允许使用技能
     * @param battler 战斗者
     * @return [boolean] 
     */
    static canUseSkill(battler: ProjectClientSceneObject): boolean {
        // 非战斗者不允许
        if (!GameBattleHelper.isBattler(battler)) return false;
        let battlerModule = battler.getModule(6) as SoModule_Battler;
        // 已待机或死亡的话则不允许
        if (battlerModule.operationComplete || battlerModule.isDead) return false;
        // 存在无法使用技能的状态则不允许
        if (ArrayUtils.matchAttributes(battlerModule.actor.status, { cantUseSkill: true }, true).length == 1) return false;
        return true;
    }
    /**
     * 是否允许使用技能
     * @param battler 战斗者
     * @param skill 技能
     * @param checkUseSkillCommconCondition [可选] 默认值=true 检查使用技能的通用条件
     * @return [boolean] 
     */
    static canUseOneSkill(battler: ProjectClientSceneObject, skill: Module_Skill, checkUseSkillCommconCondition: boolean = true): boolean {
        // 非战斗者不允许
        if (checkUseSkillCommconCondition && !this.canUseSkill(battler)) return false;
        // 被动技能不允许
        if (skill.skillType == 2) return false;
        // 同阵营中同类召唤物仍存活时，不允许再次召唤；阵亡后自动解除。
        if (!this.canCreateSummon(battler, skill)) return false;
        // 技能未冷却、不足的消耗、行动力不允许的情况不允许使用
        let battlerModule = battler.getModule(6) as SoModule_Battler;
        return !(skill.currentCD != 0 || skill.costSP > battlerModule.actor.sp || skill.costHP >= battlerModule.actor.hp ||
            (this.consumesActionPower(battler, skill) && battlerModule.actioned));
    }
    /**
     * 萧酉歌的三项非攻击技能可在同一回合内使用，不消耗其行动力。
     * 岚绫（角色 ID 9）所有非攻击主动技能也遵循同一规则；技能数据库
     * 仍保留 costActionPower=true，避免技能被其他角色获得时意外变成免费。
     */
    static isZuigeFreeActionSkill(battler: ProjectClientSceneObject, skill: Module_Skill): boolean {
        if (!battler || !skill || [76, 78, 80].indexOf(skill.id) < 0) return false;
        let module = battler.getModule(6) as SoModule_Battler;
        return !!(module && module.actor && module.actor.id === 8);
    }
    /** 岚绫的非攻击主动技能不消耗行动力，仅对角色本体生效。 */
    static isYanlingFreeActionSkill(battler: ProjectClientSceneObject, skill: Module_Skill): boolean {
        if (!battler || !skill || skill.skillType == 2 || skill.useDamage) return false;
        let module = battler.getModule(6) as SoModule_Battler;
        if (!module || !module.actor || module.actor.id !== 9) return false;
        return !this.isHostileSkill(skill);
    }
    /** 返回技能在当前角色身上是否要消耗行动力，兼容旧存档中的技能快照。 */
    static consumesActionPower(battler: ProjectClientSceneObject, skill: Module_Skill): boolean {
        if (!skill) return false;
        if ([76, 78, 80].indexOf(skill.id) >= 0) return !this.isZuigeFreeActionSkill(battler, skill);
        if (this.isYanlingFreeActionSkill(battler, skill)) return false;
        return !!skill.costActionPower;
    }
    /** 场上是否允许创建该技能对应的召唤物。非召唤技能始终允许。 */
    static canCreateSummon(battler: ProjectClientSceneObject, skill: Module_Skill): boolean {
        let summonActorID = skill && this.SUMMON_SKILL_ACTOR_IDS[skill.id];
        if (!summonActorID || !battler || !Game.currentScene) return true;
        let sourceModule = battler.getModule(6) as SoModule_Battler;
        if (!sourceModule) return true;
        for (let i = 0; i < Game.currentScene.sceneObjects.length; i++) {
            let sceneObject = Game.currentScene.sceneObjects[i] as ProjectClientSceneObject;
            if (!this.isBattler(sceneObject)) continue;
            let summonModule = sceneObject.getModule(6) as SoModule_Battler;
            if (summonModule.battleCamp !== sourceModule.battleCamp || summonModule.actor.id !== summonActorID) continue;
            if (!summonModule.isDead && summonModule.actor.hp > 0) return false;
        }
        return true;
    }
    /**
     * 是否允许使用道具
     * @param battler 战斗者
     * @return [boolean] 
     */
    static canUseItem(battler: ProjectClientSceneObject): boolean {
        // 非战斗者不允许
        if (!GameBattleHelper.isBattler(battler)) return false;
        // 已待机或死亡的话则不允许
        let battlerModule = battler.getModule(6) as SoModule_Battler;
        if (battlerModule.operationComplete || battlerModule.isDead) return false;
        // 存在无法使用道具的状态则不允许
        if (ArrayUtils.matchAttributes(battlerModule.actor.status, { cantUseItem: true }, true).length == 1) return false;
        return true;
    }
    /**
     * 道具是否可用：行动力允许
     * @param battler 战斗者
     * @param skill 技能
     * @return [boolean] 
     */
    static canUseOneItem(battler: ProjectClientSceneObject, item: Module_Item): boolean {
        // 非战斗者不允许
        if (!GameBattleHelper.isBattler(battler)) return false;
        // 拥有无法使用道具的状态则不允许
        let battlerModule = battler.getModule(6) as SoModule_Battler;
        if (!RogueSkillSynergySystem.canUseItem(battler, item)) return false;
        if (ArrayUtils.matchAttributes(battlerModule.actor.status, { cantUseItem: true }, true).length == 1) return false;
        // 已待机或死亡的话则不允许
        if (battlerModule.operationComplete || battlerModule.isDead) return false;
        // 需要消耗行动力且已经行动过的话不允许使用
        return !(item.costActionPower && battlerModule.actioned);
    }
    /**
     * 是否允许被攻击
     * @param battler 战斗者
     * @param force[可选] 默认值=false 强制表示已行动过仍然允许攻击
     * @return [boolean] 
     */
    static canToBeAttacked(fromBattler: ProjectClientSceneObject, targetBattler: ProjectClientSceneObject, ignoreEnemys: ProjectClientSceneObject[] = null): boolean {
        if (!fromBattler || !targetBattler) return false;
        // 在忽略名单中的话不攻击
        if (ignoreEnemys && ignoreEnemys.indexOf(targetBattler) != -1) return false;
        // 非战斗者不允许
        if (!GameBattleHelper.isBattler(fromBattler)) return false;
        if (!GameBattleHelper.isBattler(targetBattler)) return false;
        // 已死亡
        let fromBattlerModule = fromBattler.getModule(6) as SoModule_Battler;
        let targetBattlerModule = targetBattler.getModule(6) as SoModule_Battler;
        if (fromBattlerModule.isDead) return false;
        if (targetBattlerModule.isDead) return false;
        // 已经不是敌对关系
        if (!GameBattleHelper.isHostileRelationship(fromBattler, targetBattler)) return false;
        // 目标是隐形单位但攻击者无法感知
        if ((GameBattleHelper.hasInvisible(targetBattler) && !GameBattleHelper.hasSeeInvisible(fromBattler))) return false;
        // 单位类型判定（是否允许攻击飞行单位/地面单位）
        if ((fromBattlerModule.actor.targetType == 1 && targetBattlerModule.actor.flyUnit) || (fromBattlerModule.actor.targetType == 2 && !targetBattlerModule.actor.flyUnit)) {
            return false;
        }
        return true;
    }
    //------------------------------------------------------------------------------------------------------
    // 光标
    //------------------------------------------------------------------------------------------------------
    /**
     * 获取光标位置
     */
    static get cursorGridPoint(): Point {
        let p = Game.player.sceneObject;
        return p.posGrid;
    }
    /**
     * 获取光标对象
     */
    static get cursor(): ProjectClientSceneObject {
        return Game.player.sceneObject;
    }
    /**
     * 获取鼠标所在的格子坐标
     */
    static get inSceneMouseGridPoint(): Point {
        let localX = Game.currentScene.localX;
        let localY = Game.currentScene.localY;
        return GameUtils.getGridPostion(new Point(localX, localY));
    }
    /**
     * 获取鼠标所在的格子中心点实际坐标
     */
    static get inSceneMouseGridCenter(): Point {
        let localX = Game.currentScene.localX;
        let localY = Game.currentScene.localY;
        return GameUtils.getGridCenter(new Point(localX, localY));
    }
    //------------------------------------------------------------------------------------------------------
    //  镜头
    //------------------------------------------------------------------------------------------------------
    /**
     * 镜头矫正：根据光标所在的位置
     */
    static cameraCorrect(test: boolean = false): boolean {
        if (Game.currentScene.camera.sceneObject) return;
        // 当光标超出可视范围时移动镜头至可视范围内
        let cursorX = GameBattleHelper.cursor.x;
        let cursorY = GameBattleHelper.cursor.y;
        if (ProjectUtils.lastControl == 0) {
            cursorX = Game.currentScene.localX;
            cursorY = Game.currentScene.localY;
            if (cursorX < Config.SCENE_GRID_SIZE) cursorX = Config.SCENE_GRID_SIZE;
            else if (cursorX > Game.currentScene.width - Config.SCENE_GRID_SIZE) cursorX = Game.currentScene.width - Config.SCENE_GRID_SIZE;
            if (cursorY < Config.SCENE_GRID_SIZE) cursorY = Config.SCENE_GRID_SIZE;
            else if (cursorY > Game.currentScene.height - Config.SCENE_GRID_SIZE) cursorY = Game.currentScene.height - Config.SCENE_GRID_SIZE;
        }
        let screenRect = Game.currentScene.camera.viewPort.clone();
        // 以光标为中心的范围
        let range = Config.SCENE_GRID_SIZE;
        screenRect.x += range;
        screenRect.y += range;
        screenRect.width -= range * 2;
        screenRect.height -= range * 2;
        // 计算缩放率
        let lastW = screenRect.width;
        let lastH = screenRect.height;
        screenRect.width /= Game.currentScene.camera.scaleX;
        screenRect.height /= Game.currentScene.camera.scaleY;
        screenRect.x += (lastW - screenRect.width) / 2;
        screenRect.y += (lastH - screenRect.height) / 2;
        // debug
        // let layer = Game.currentScene.getLayerByPreset(10);
        // layer.alpha = 0.2;
        // layer.graphics.clear();
        // layer.graphics.drawRect(screenRect.x, screenRect.y, screenRect.width, screenRect.height, "#FF0000");
        // 如果不在范围内，修正至在范围内的位置
        if (!screenRect.contains(cursorX, cursorY)) {
            if (test) return true;
            let cameraToX = screenRect.x;
            if (cursorX < screenRect.x) {
                cameraToX = cursorX;
            }
            else if (cursorX > screenRect.right) {
                cameraToX = cursorX - screenRect.width;
            }
            let cameraToY = screenRect.y;
            if (cursorY < screenRect.y) {
                cameraToY = cursorY;
            }
            else if (cursorY > screenRect.bottom) {
                cameraToY = cursorY - screenRect.height;
            }
            // 转化坐标
            cameraToX -= range / Game.currentScene.camera.scaleX;
            cameraToY -= range / Game.currentScene.camera.scaleY;
            // 转化
            if (ProjectUtils.lastControl != 0) {
                let toX = (cameraToX + Math.round(Config.WINDOW_WIDTH / 2) / Game.currentScene.camera.scaleX);
                let toY = (cameraToY + Math.round(Config.WINDOW_HEIGHT / 2) / Game.currentScene.camera.scaleY);
                GameFunction.cameraMove(0, toX, toY, 0, true, 1);
            }
            else {
                let mouseMoveScreenSpeed = MathUtils.int(15 / Game.currentScene.camera.scaleX);
                if (Game.currentScene.camera.viewPort.x != cameraToX) {
                    if (cursorX < screenRect.x) {
                        Game.currentScene.camera.viewPort.x += -mouseMoveScreenSpeed;
                    }
                    else if (cursorX > screenRect.right) {
                        Game.currentScene.camera.viewPort.x += mouseMoveScreenSpeed;
                    }
                }
                if (Game.currentScene.camera.viewPort.y != cameraToY) {
                    if (cursorY < screenRect.y) {
                        Game.currentScene.camera.viewPort.y += -mouseMoveScreenSpeed;
                    }
                    else if (cursorY > screenRect.bottom) {
                        Game.currentScene.camera.viewPort.y += mouseMoveScreenSpeed;
                    }
                }
            }
            return true;
        }
        return false;
    }
    //------------------------------------------------------------------------------------------------------
    // 获取场景对象
    //------------------------------------------------------------------------------------------------------
    /**
     * 获取场景对象根据指定的格子坐标
     * @param posGridP 指定的格子坐标 
     * @param ignoreDeadUnit 是否忽略死亡单位
     * @return [ProjectClientSceneObject] 
     */
    static getSceneObjectByGrid(posGridP: Point, ignoreDeadUnit: boolean = false): ProjectClientSceneObject {
        // 越界
        if (Game.currentScene.sceneUtils.isOutsideByGrid(posGridP)) return;
        // 目标格子
        let targetSceneObjects = Game.currentScene.sceneUtils.gridSceneObjects[posGridP.x][posGridP.y].concat();
        // 排除光标本身
        ArrayUtils.remove(targetSceneObjects, GameBattleHelper.cursor);
        // 排除死亡单位和隐形的以及非战斗者
        if (ignoreDeadUnit) {
            for (let i = 0; i < targetSceneObjects.length; i++) {
                let so = targetSceneObjects[i];
                if (GameBattleHelper.isBattler(so)) {
                    let soBattlerModule = so.getModule(6) as SoModule_Battler;
                    if (soBattlerModule.isDead) {
                        targetSceneObjects.splice(i, 1);
                        i--;
                    }
                }
                else {
                    targetSceneObjects.splice(i, 1);
                    i--;
                }
            }
        }
        return targetSceneObjects[0];
    }
    /**
     * 获取场景光标上的场景对象
     */
    static get overCursorSceneObject(): ProjectClientSceneObject {
        // 获取光标位置（格子）
        let p = GameBattleHelper.cursor;
        let posGridP = new Point(p.posGrid.x, p.posGrid.y);
        return this.getSceneObjectByGrid(posGridP);
    }
    //------------------------------------------------------------------------------------------------------
    // 获取战斗者
    //------------------------------------------------------------------------------------------------------
    /**
     * 获取指定格子上的战斗者
     * @param posGridP 格子位置
     * @return [ProjectClientSceneObject] 
     */
    static getNoDeadBattlerByGrid(posGridP: Point): ProjectClientSceneObject {
        let so = this.getSceneObjectByGrid(posGridP, true);
        if (so && this.isBattler(so) && !(so.getModule(6) as SoModule_Battler).isDead) return so;
        return null;
    }
    /**
     * 获取场景光标上的战斗者对象
     */
    static get overCursorNoDeadBattler(): ProjectClientSceneObject {
        let p = GameBattleHelper.cursor;
        let posGridP = new Point(p.posGrid.x, p.posGrid.y);
        return this.getNoDeadBattlerByGrid(posGridP);
    }
    /**
     * 获取场景光标上的玩家阵营的战斗者对象
     */
    static get overCursorPlayerCampNoDeadBattler(): ProjectClientSceneObject {
        let overCursorNoDeadBattler = this.overCursorNoDeadBattler;
        if (!overCursorNoDeadBattler || (overCursorNoDeadBattler.getModule(6) as SoModule_Battler).battleCamp != 0) return null;
        return overCursorNoDeadBattler;
    }
    /**
     * 获取场景光标上的敌对阵营的战斗者对象
     */
    static get overCursorEnemyCampNoDeadBattler(): ProjectClientSceneObject {
        let overCursorNoDeadBattler = this.overCursorNoDeadBattler;
        if (!overCursorNoDeadBattler || (overCursorNoDeadBattler.getModule(6) as SoModule_Battler).battleCamp != 1) return null;
        return overCursorNoDeadBattler;
    }
    /**
     * 获取场景光标上的玩家可控角色对象（我方阵营+可控制+未行动过）
     */
    static get overCursorPlayerCtrlEnabledBattler(): ProjectClientSceneObject {
        let overCursorPlayerCampNoDeadBattler = this.overCursorPlayerCampNoDeadBattler;
        if (!overCursorPlayerCampNoDeadBattler) return;
        let battlerModule = overCursorPlayerCampNoDeadBattler.getModule(6) as SoModule_Battler;
        if (!overCursorPlayerCampNoDeadBattler || battlerModule.playerCantCtrl
            || battlerModule.actor.AI || battlerModule.operationComplete) return null;
        return overCursorPlayerCampNoDeadBattler;
    }
    /**
     * 获取指定战斗者的攻击目标，根据指定的格子位置
     * @param battler 指定的战斗者 
     * @param gridPos 指定的格子坐标
     */
    static getAttackTargetOnGrid(battler: ProjectClientSceneObject, gridPos: Point): ProjectClientSceneObject {
        // 不在作用范围则忽略
        if (!this.isInEffectGrid(gridPos)) return null;
        // 获取该格子上的目标
        let target = this.getNoDeadBattlerByGrid(gridPos);
        // 不允许被攻击的情况
        if (!this.canToBeAttacked(battler, target)) return null;
        return target;
    }
    /**
     * 获取指定战斗者的道具目标，根据指定的格子位置
     * @param battler 指定的战斗者 
     * @param gridPos 指定的格子坐标
     */
    static getItemTargetOnGrid(battler: ProjectClientSceneObject, gridPos: Point): ProjectClientSceneObject {
        // 不在作用范围则忽略
        if (!this.isInEffectGrid(gridPos)) return null;
        // 获取该格子上的目标
        let target = this.getNoDeadBattlerByGrid(gridPos);
        // 没有目标
        if (!target) return null;
        return target;
    }
    /**
     * 获取指定战斗者的技能目标，根据指定的格子位置
     * @param fromBattler 指定的战斗者
     * @param skill 技能的目标
     * @param gridPos 格子坐标
     * @return allow=是否允许 targets=目标组
     */
    static getSkillTargetOnGrid(fromBattler: ProjectClientSceneObject, skill: Module_Skill, gridPos: Point): { allow: boolean, targets: ProjectClientSceneObject[] } {
        // 不在作用范围则忽略（全体技能除外）
        if (skill.targetType != 3 && skill.targetType != 4 && !this.isInEffectGrid(gridPos)) return null;
        // 被动技能则忽略
        if (skill.skillType == 2) return null;
        let fromBattlerModule = fromBattler.getModule(6) as SoModule_Battler;
        // 目标类别：使用技能者
        if (skill.targetType == 0) {
            let target = this.getNoDeadBattlerByGrid(gridPos);
            if (target != fromBattler) return null;
            return { allow: true, targets: [target] };
        }
        // 目标类别：队友单体
        else if (skill.targetType == 1) {
            let target = this.getNoDeadBattlerByGrid(gridPos);
            if (!this.isFriendlyRelationship(fromBattler, target)) return null;
            return { allow: true, targets: [target] };
        }
        // 目标类别：敌人单体
        else if (skill.targetType == 2) {
            let target = this.getNoDeadBattlerByGrid(gridPos);
            if (!this.canToBeAttacked(fromBattler, target)) return null;
            return { allow: true, targets: [target] };
        }
        // 目标类别：队友全体
        else if (skill.targetType == 3) {
            let targets = fromBattlerModule.battleCamp == 0 ? GameBattle.playerBattlers : GameBattle.enemyBattlers;
            targets = ArrayUtils.matchAttributesD2(targets, "battlerSetting", { isDead: false }, false);
            return { allow: true, targets: targets };
        }
        // 目标类别：敌人全体
        else if (skill.targetType == 4) {
            let targets = fromBattlerModule.battleCamp == 1 ? GameBattle.playerBattlers : GameBattle.enemyBattlers;
            targets = ArrayUtils.matchAttributesD2(targets, "battlerSetting", { isDead: false }, false);
            for (let i = 0; i < targets.length; i++) {
                let target = targets[i];
                if (!this.canToBeAttacked(fromBattler, target)) {
                    targets.splice(i, 1);
                    i--;
                }
            }
            return { allow: true, targets: targets };
        }
        // 目标类别：队友多体、敌人多体
        else if (skill.targetType == 5 || skill.targetType == 6) {
            // 仅允许空地的情况，如果发现选中地存在场景对象的话则不允许
            if (skill.mustOpenSpace) {
                let target = this.getSceneObjectByGrid(gridPos);
                if (target && !target.through) return { allow: false, targets: [] };
            }
            let targets: ProjectClientSceneObject[] = [];
            let releasePointLength = GameBattleAction.battlerRelaseIndicatorGridArr.length;
            let cursorGrid = GameBattleHelper.cursorGridPoint;
            // -- 遍历所有释放格子区域
            for (let i = 0; i < releasePointLength; i++) {
                let localGrid = GameBattleAction.battlerRelaseIndicatorGridArr[i];
                let inSceneGridX = localGrid.x + cursorGrid.x;
                let inSceneGridY = localGrid.y + cursorGrid.y;
                let sceneGrid = new Point(inSceneGridX, inSceneGridY);
                // -- 忽略越界的坐标
                if (Game.currentScene.sceneUtils.isOutsideByGrid(sceneGrid)) {
                    continue;
                }
                // -- 获取战斗者
                let target = this.getNoDeadBattlerByGrid(sceneGrid);
                if (skill.targetType == 5 && this.isFriendlyRelationship(fromBattler, target)) {
                    targets.push(target);
                }
                else if (skill.targetType == 6 && this.isHostileRelationship(fromBattler, target)) {
                    // -- 允许攻击目标的情况-添加
                    if (this.canToBeAttacked(fromBattler, target)) {
                        targets.push(target);
                    }
                }
            }
            return { allow: true, targets: targets };
        }
    }
    //------------------------------------------------------------------------------------------------------
    // 获取下一个战斗角色
    //------------------------------------------------------------------------------------------------------
    /**
     * 获取下一个玩家可控角色
     * @return [ProjectClientSceneObject] 
     */
    static get nextPlayerControlBattler(): ProjectClientSceneObject {
        for (let i = 0; i < GameBattle.playerBattlers.length; i++) {
            let playerBattler = GameBattle.playerBattlers[i];
            let playerBattlerModule = playerBattler.getModule(6) as SoModule_Battler;
            if (playerBattlerModule.isDead) continue;
            if (GameBattleHelper.isPlayerControlEnabledBattler(playerBattler) && !playerBattlerModule.operationComplete) {
                return playerBattler;
            }
        }
    }
    /**
     * 获取下一个玩家方需要电脑控制的角色
     * @return [ProjectClientSceneObject] 
     */
    static get nextPlayerCampComputerControlBattler(): ProjectClientSceneObject {
        for (let i = 0; i < GameBattle.playerBattlers.length; i++) {
            let playerBattler = GameBattle.playerBattlers[i];
            let playerBattlerModule = playerBattler.getModule(6) as SoModule_Battler;
            if (playerBattlerModule.isDead) continue;
            if (!GameBattleHelper.isPlayerControlEnabledBattler(playerBattler) && !playerBattlerModule.operationComplete) {
                return playerBattler;
            }
        }
    }
    /**
     * 获取下一个敌方控制的角色
     */
    static get nextEnemyControlBattler(): ProjectClientSceneObject {
        for (let i = 0; i < GameBattle.enemyBattlers.length; i++) {
            let enemyBattler = GameBattle.enemyBattlers[i];
            let enemyBattlerModule = enemyBattler.getModule(6) as SoModule_Battler;
            if (enemyBattlerModule.isDead) continue;
            if (!enemyBattlerModule.operationComplete) {
                return enemyBattler;
            }
        }
    }
    //------------------------------------------------------------------------------------------------------
    // 获取范围
    //------------------------------------------------------------------------------------------------------
    /**
     * 获取技能作用范围地图格子（相对于地图坐标系）
     * @param posGrid 指定的格子 
     * @param skill 技能
     * @return [Point] 
     */
    static getSkillEffectRangeGrid(posGrid: Point, skill: Module_Skill, battler: ProjectClientSceneObject): Point[] {
        // 障碍模式 0-计算所有障碍 1-仅计算地图固定障碍 2-不计算障碍
        let obstacleMode: number = 1;
        // 0-普通范围 1-min-range范围 2-自定义范围
        let rangeMode: number;
        // 范围（最大范围）
        let range: number;
        // 最小范围
        let minRange: number;
        // 自定义范围
        let customRangeData: { size: number, gridData: number[][] };
        // 自定义释放范围（如果不存在则表示只有一个格子，否则允许选择多个格子）
        let customReleaseRangeData: { size: number, gridData: number[][] };
        // -- 范围模式和范围值
        rangeMode = skill.effectRangeType;
        // -- 普通范围
        if (rangeMode == 0) {
            range = skill.effectRange1;
        }
        // -- min-max 范围
        else if (rangeMode == 1) {
            minRange = skill.effectRange2A - 1;
            range = skill.effectRange2B;
        }
        // -- 自定义范围
        else if (rangeMode == 2) {
            customRangeData = skill.effectRange3;
            if (skill.associationOrientation) {
                let gridData: number[][];
                let ori = GameUtils.getAssetOri(battler.avatarOri, Math.max(battler.avatar.oriMode, 2));
                let mapping = { 8: 0, 4: 90, 2: 180, 6: 270 };
                let degrees = mapping[ori];
                if (degrees == null) degrees = 0;
                if (degrees != 0) gridData = this.rotateSquareArray(customRangeData.gridData, degrees);
                else gridData = customRangeData.gridData;
                customRangeData = {
                    size: customRangeData.size,
                    gridData: gridData
                }
            }
        }
        // -- 自己
        if (skill.targetType == 0) {
            rangeMode = 0;
            range = 0;
        }
        else if (rangeMode != 2) {
            range += RogueSkillSynergySystem.getRangeBonus(battler, skill);
        }
        // -- 必须空地
        let excludeBattlers: boolean = (skill.targetType == 5 || skill.targetType == 6) && skill.mustOpenSpace;
        return GameBattleHelper.getEffectRange(posGrid, range, obstacleMode, rangeMode, minRange, customRangeData, skill.isThroughObstacle, null, null, excludeBattlers);
    }
    /**
     * 获取作用范围，返回所有允许的地图格子坐标
     * @param posGrid 起始点
     * @param range 范围
     * @param obstacleMode [可选] 默认值=0 计算障碍的模式 0-计算所有障碍 1-仅计算地图固定障碍 2-不计算障碍 3-计算所有障碍但不包括敌军（必须填入fromBattler以便区分敌军） 4-计算所有障碍但不包括友军 5-空地（不包含任何战斗者） 6-计算除飞行单位外的所有障碍
     * @param rangeMode [可选] 默认值=0 范围模式 0-普通范围 1-min-range范围 2-自定义范围
     * @param minRange [可选] 默认值=0 最短值，低于该值不允许出现
     * @param customRangeData [可选] 默认值=null 自定义范围数据
     * @param isThroughObstacle [可选] 默认值=false 是否穿透障碍（如作用范围可穿透墙壁）
     * @param addGridsList [可选] 默认值=null 额外添加的格子合集
     * @param fromBattler [可选] 默认值=null 参考的战斗者
     * @param excludeBattlers [可选] 默认值=false 排除战斗者
     */
    static getEffectRange(firstGrid: Point, range: number, obstacleMode: number = 0, rangeMode: number = 0, minRange: number = 0,
        customRangeData: { size: number, gridData: number[][] } = null, isThroughObstacle: boolean = false, addGridsList: Point[] = null, fromBattler: ProjectClientSceneObject = null, excludeBattlers: boolean = false): Point[] {
        let calcDistance = rangeMode != 2;
        let battlerThroughGridMap = this.getDestinationThroughGridMap(firstGrid, range, isThroughObstacle ? 2 : obstacleMode, calcDistance, customRangeData, fromBattler);// 
        let grids = battlerThroughGridMap.grids;
        let throughGridMap = battlerThroughGridMap.throughGridMap;
        // 排除掉与首个格子无法连通的格子以及移动到达该地时
        for (let i = 0; i < grids.length; i++) {
            let targetGrid = grids[i];
            // min-range 模式
            if (rangeMode == 1) {
                let dis = Math.abs(targetGrid.x - firstGrid.x) + Math.abs(targetGrid.y - firstGrid.y);
                if (dis <= minRange) {
                    grids.splice(i, 1);
                    i--;
                    continue;
                }
            }
            // 忽略自身
            if (targetGrid.x == firstGrid.x && targetGrid.y == firstGrid.y) {
                if (obstacleMode == 0 || obstacleMode == 3 || obstacleMode == 4 || obstacleMode == 5 || obstacleMode == 6) {
                    grids.splice(i, 1);
                    i--;
                    continue;
                }
                else {
                    continue;
                }
            }
            // 获取路径是否可行
            if (calcDistance) {
                let toGridX = targetGrid.x - firstGrid.x + range;
                let toGridY = targetGrid.y - firstGrid.y + range;
                // 穿透障碍的话
                if (isThroughObstacle) {
                    continue;
                }
                // 否则计算寻路是否能够到达该地方且在范围步数内
                let realLineArr = AstarUtils.routeGrid(range, range, toGridX, toGridY, range, throughGridMap, new Point(), true, true);
                if (!realLineArr || realLineArr.length > range || (rangeMode == 1 && realLineArr.length <= minRange)) {
                    grids.splice(i, 1);
                    i--;
                    continue;
                }
            }
        }
        // 最终排除掉战斗者（普通移动和必须空地的技能落点）
        if (excludeBattlers) {
            for (let i = 0; i < grids.length; i++) {
                let targetGrid = grids[i];
                // 普通移动和需要空地的技能都不能与任何战斗者重叠，
                // 即使对方具有穿透属性也不能作为最终落点。
                if (this.isBattlerOccupiedGrid(targetGrid, fromBattler)) {
                    grids.splice(i, 1);
                    i--;
                    continue;
                }
            }
        }
        // 添加额外的格子
        if (addGridsList) grids = grids.concat(addGridsList);
        return grids;
    }
    /**
     * 是否是战斗者障碍格子（穿透的忽略）
     * @param gridP 
     */
    static isBattlerisObstacleGrid(gridP: Point) {
        let gridSceneObjects = Game.currentScene.sceneUtils.gridSceneObjects[gridP.x][gridP.y];
        for (let s = 0; s < gridSceneObjects.length; s++) {
            let so = gridSceneObjects[s];
            if (GameBattleHelper.isBattler(so) && !so.through) {
                return true;
            }
        }
        return false;
    }
    /** 是否有战斗者占用该格子（移动和强制位移均禁止与战斗者重叠）。 */
    static isBattlerOccupiedGrid(gridP: Point, except: ProjectClientSceneObject = null): boolean {
        if (!Game.currentScene || !Game.currentScene.sceneUtils || Game.currentScene.sceneUtils.isOutsideByGrid(gridP)) return true;
        let gridSceneObjects = Game.currentScene.sceneUtils.gridSceneObjects[gridP.x][gridP.y];
        if (!gridSceneObjects) return false;
        for (let s = 0; s < gridSceneObjects.length; s++) {
            let so = gridSceneObjects[s];
            if (so && so !== except && this.isBattler(so)) return true;
        }
        return false;
    }
    /**
     * 飞行单位移动时只把敌对战斗者视为动态阻挡，同阵营战斗者可以重叠通过。
     */
    static isHostileBattlerObstacleGrid(gridP: Point, fromBattler: ProjectClientSceneObject, except: ProjectClientSceneObject = null): boolean {
        if (!fromBattler || !Game.currentScene || !Game.currentScene.sceneUtils ||
            Game.currentScene.sceneUtils.isOutsideByGrid(gridP)) return true;
        let gridSceneObjects = Game.currentScene.sceneUtils.gridSceneObjects[gridP.x][gridP.y];
        if (!gridSceneObjects) return false;
        for (let s = 0; s < gridSceneObjects.length; s++) {
            let so = gridSceneObjects[s];
            if (!so || so === except || so.through || !this.isBattler(so)) continue;
            if (this.isHostileRelationship(fromBattler, so)) return true;
        }
        return false;
    }
    /**
     * 获取技能释放范围（相对坐标）
     * @param skill 技能
     * @return [Point] 相对位置集合 
     */
    static getSkillReleaseRangeGrid(skill: Module_Skill, battler: ProjectClientSceneObject = null): Point[] {
        // 获得释放范围格子数据
        if (skill.targetType == 5 || skill.targetType == 6) {
            let customReleaseData = skill.releaseRange
            let grids = [];
            if (!customReleaseData || !customReleaseData.gridData) return grids;
            let gridData = customReleaseData.gridData;
            let centerX = Math.floor(customReleaseData.size / 2);
            let centerY = Math.floor(customReleaseData.size / 2);
            for (let x = 0; x < customReleaseData.size; x++) {
                for (let y = 0; y < customReleaseData.size; y++) {
                    // 不计算距离，则根据自定义范围来决定是否采用该格子
                    let gridDataXArr = gridData[x];
                    if (!gridDataXArr) continue;
                    if (!gridDataXArr[y]) continue;
                    let localX = x - centerX;
                    let localY = y - centerY;
                    grids.push(new Point(localX, localY));
                }
            }
            if (RogueSkillSynergySystem.getAreaBonus(battler, skill) > 0) {
                let expanded = grids.concat();
                let directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];
                for (let i = 0; i < grids.length; i++) {
                    for (let d = 0; d < directions.length; d++) {
                        let point = new Point(grids[i].x + directions[d][0], grids[i].y + directions[d][1]);
                        if (ArrayUtils.matchAttributes(expanded, { x: point.x, y: point.y }, true).length === 0) expanded.push(point);
                    }
                }
                grids = expanded;
            }
            return grids;
        }
        else {
            return [new Point(0, 0)];
        }
    }
    /**
     * 获取移动的障碍模式
     */
    static getMoveObstacleMode(actor: Module_Actor, battler: ProjectClientSceneObject = null): number {
        // 飞行单位仍然忽略动态战斗者和地图障碍。
        if (actor.flyUnit) return 2;
        // 我方移动时允许穿过队友，但敌方战斗者会阻挡；敌方移动时，
        // 敌方单位之间也必须互相阻挡，因此使用“所有非飞行战斗者阻挡”的模式。
        if (battler && this.isEnemyCamp(battler)) return 6;
        return 4;
    }
    /**
     * 获取指定格子周围的通行图数据
     * @param posGrid 指定的格子 
     * @param range 范围
     * @param obstacleMode [可选] 默认值=0 计算障碍的模式 0-计算所有障碍 1-仅计算地图固定障碍 2-不计算障碍 3-计算所有障碍但不包括敌军（必须填入fromBattler以便区分敌军） 4-计算所有障碍但不包括友军 5-不计算障碍，但最后要排除动态障碍点（移动） 6-计算除飞行单位外的所有障碍
     * @param caleDistance [可选] 默认值=true 计算距离
     * @param customRangeData [可选] 默认值=null 自定义范围数据，如有的话则根据该范围来计算
     * @param fromBattler [可选] 默认值=null 参考的战斗者
     */
    static getDestinationThroughGridMap(posGrid: Point, range: number, obstacleMode: number = 0, caleDistance: boolean = true,
        customRangeData: { size: number, gridData: number[][] } = null, fromBattler: ProjectClientSceneObject = null): { grids: Point[], throughGridMap: boolean[][] } {
        let grids: Point[] = [];
        // 首个格子
        let firstGrid = posGrid;
        // 通行状态图
        let throughGridMap: boolean[][] = [];
        // 范围获取
        let gridData = null;
        if (customRangeData) {
            range = Math.floor(customRangeData.size / 2);
            gridData = customRangeData.gridData;
        }
        if (range == null) range = 0;
        // 查询周围 range x range 的可通行格
        if (firstGrid) {
            let startX = firstGrid.x - range
            let endX = firstGrid.x + range
            let startY = firstGrid.y - range
            let endY = firstGrid.y + range
            for (let x = startX; x <= endX; x++) {
                if (x < 0 || x >= Game.currentScene.gridWidth) continue;
                let throughGridMapXArr = throughGridMap[x - startX] = [];
                for (let y = startY; y <= endY; y++) {
                    if (y < 0 || y >= Game.currentScene.gridHeight) continue;
                    // 如果无障碍也超出范围的格子则排除掉
                    if (caleDistance) {
                        let dis = Math.abs(x - firstGrid.x) + Math.abs(y - firstGrid.y);
                        if (dis > range) continue;
                    }
                    // 不计算距离，则根据自定义范围来决定是否采用该格子
                    else {
                        let localX = x - startX;
                        let localY = y - startY;
                        if (!gridData || localX >= customRangeData.size || localY >= customRangeData.size) continue;
                        let gridDataXArr = gridData[localX];
                        if (!gridDataXArr) continue;
                        if (!gridDataXArr[localY]) continue;
                    }
                    // 排除掉带有障碍的格子（自身除外）
                    ProjectUtils.pointHelper.x = x;
                    ProjectUtils.pointHelper.y = y;
                    let isObstacleGrid = false;
                    if (firstGrid.x != x || firstGrid.y != y) {
                        if (obstacleMode == 0) {
                            isObstacleGrid = Game.currentScene.sceneUtils.isObstacleGrid(ProjectUtils.pointHelper);
                        }
                        else if (obstacleMode == 1) {
                            isObstacleGrid = Game.currentScene.sceneUtils.isFixedObstacleGrid(ProjectUtils.pointHelper);
                        }
                        // 计算所有障碍但不包括敌军（必须填入fromBattler以便区分敌军）和飞行单位
                        else if (obstacleMode == 3) {
                            // -- 如果该格子不存在固定障碍的话，则查询动态障碍中是否存在队友
                            let fixedObstacleGrid = Game.currentScene.sceneUtils.isFixedObstacleGrid(ProjectUtils.pointHelper);
                            if (!fixedObstacleGrid) {
                                let gridSceneObjectArr = Game.currentScene.sceneUtils.gridSceneObjects[x][y];
                                if (gridSceneObjectArr.length > 0) {
                                    for (let i = 0; i < gridSceneObjectArr.length; i++) {
                                        let targetSo = gridSceneObjectArr[i];
                                        if (targetSo && GameBattleHelper.isFriendlyRelationship(fromBattler, targetSo) && !targetSo.through) {
                                            isObstacleGrid = true;
                                            break;
                                        }
                                    }
                                }
                            }
                            else isObstacleGrid = true;
                        }
                        // 计算所有障碍但不包括友军和飞行单位
                        else if (obstacleMode == 4) {
                            let fixedObstacleGrid = Game.currentScene.sceneUtils.isFixedObstacleGrid(ProjectUtils.pointHelper);
                            if (!fixedObstacleGrid) {
                                let gridSceneObjectArr = Game.currentScene.sceneUtils.gridSceneObjects[x][y];
                                if (gridSceneObjectArr.length > 0) {
                                    for (let i = 0; i < gridSceneObjectArr.length; i++) {
                                        let targetSo = gridSceneObjectArr[i];
                                        if (targetSo) {
                                            // -- 敌对战斗者或非战斗者
                                            if (GameBattleHelper.isBattler(targetSo)) {
                                                if (fromBattler != targetSo && GameBattleHelper.isHostileRelationship(fromBattler, targetSo) && !targetSo.through) isObstacleGrid = true;
                                            }
                                            else if (Game.currentScene.sceneUtils.isObstacleGrid(ProjectUtils.pointHelper)) {
                                                isObstacleGrid = true;
                                            }
                                        }
                                    }
                                }
                            }
                            else isObstacleGrid = true;
                        }
                        // 只计算动态障碍
                        // else if (obstacleMode == 5) {
                        //     isObstacleGrid = Game.currentScene.sceneUtils.getGridDynamicObsStatus(ProjectUtils.pointHelper) == 2;
                        // }
                        // 计算除飞行单位外的所有障碍
                        else if (obstacleMode == 6) {
                            let fixedObstacleGrid = Game.currentScene.sceneUtils.isFixedObstacleGrid(ProjectUtils.pointHelper);
                            if (!fixedObstacleGrid) {
                                let gridSceneObjectArr = Game.currentScene.sceneUtils.gridSceneObjects[x][y];
                                if (gridSceneObjectArr.length > 0) {
                                    for (let i = 0; i < gridSceneObjectArr.length; i++) {
                                        let targetSo = gridSceneObjectArr[i];
                                        if (targetSo) {
                                            // -- 敌对战斗者或非战斗者
                                            if (GameBattleHelper.isBattler(targetSo)) {
                                                if (!targetSo.through && !(targetSo.battlerSetting.actor.flyUnit)) isObstacleGrid = true;
                                            }
                                            else if (Game.currentScene.sceneUtils.isObstacleGrid(ProjectUtils.pointHelper)) {
                                                isObstacleGrid = true;
                                            }
                                        }
                                    }
                                }
                            }
                            else {
                                isObstacleGrid = true;
                            }
                        }
                        else {
                            isObstacleGrid = false;
                        }
                        if (isObstacleGrid) continue;
                    }
                    throughGridMapXArr[y - startY] = true;
                    grids.push(new Point(x, y));
                }
            }
        }
        return { grids: grids, throughGridMap: throughGridMap };
    }
    /**
    * 获取战斗者的攻击范围数值参考
    * @param battler 战斗者
    * @return [number] 
    */
    static getBattlerAtkRangeReference(battler: ProjectClientSceneObject): number {
        let battlerModule = battler.getModule(6) as SoModule_Battler;
        let actor = battlerModule.actor;
        // 技能代替攻击
        if (actor.atkMode == 1 && actor.atkSkill) {
            if (actor.atkSkill.effectRangeType == 0) {
                return actor.atkSkill.effectRange1;
            }
            else if (actor.atkSkill.effectRangeType == 1) {
                return actor.atkSkill.effectRange2B;
            }
            else {
                return 1;
            }
        }
        // 普通攻击
        else {
            return 1;
        }
    }
    //------------------------------------------------------------------------------------------------------
    // 格子显示效果
    //------------------------------------------------------------------------------------------------------
    /**
     * 创建效果格子
     * @param gridX 格子水平坐标
     * @param gridY 格子垂直坐标
     * @param mode 0=出场格子 1=作用范围格子 2=释放范围格子
     * @return [GCAnimation] 
     */
    static createEffectGrid(gridX: number, gridY: number, mode: number, battler: ProjectClientSceneObject): GCAnimation {
        if (battler && GameBattleHelper.isEnemyCamp(battler) && !WorldData.aiOpenIndicator) {
            return null;
        }
        let aniID: number;
        if (mode == 0) {
            aniID = WorldData.readyBattlerFieldAni;
        }
        else if (mode == 1) {
            aniID = WorldData.rangeFieldAni;
        }
        else if (mode == 2) {
            aniID = WorldData.releaseFieldAni;
        }
        let aniX = gridX * Config.SCENE_GRID_SIZE + Config.SCENE_GRID_SIZE * 0.5;
        let aniY = gridY * Config.SCENE_GRID_SIZE + Config.SCENE_GRID_SIZE * 0.5;
        let layer = Game.currentScene.animationLowLayer;
        let ani = new GCAnimation();
        ani.loop = true;
        ani.id = aniID;
        ani.play();
        ani.x = aniX;
        ani.y = aniY;
        layer.addChild(ani);
        return ani;
    }
    //------------------------------------------------------------------------------------------------------
    // 算法
    //------------------------------------------------------------------------------------------------------
    /**
     * 获取格子坐标组中距离目标格子最近的的坐标
     * @param throughMapGrids 格子坐标组 
     * @param targetGrids 目标格子
     * @param minDis 最小的距离，不能低于该距离
     * @return [Point] 
     */
    static getNearestToTheTarget(throughMapGrids: Point[], targetGrids: Point, minDistance: number = 0): Point {
        let min = Number.MAX_VALUE;
        let nearestGrid: Point;
        for (let i = 0; i < throughMapGrids.length; i++) {
            let thisGrid = throughMapGrids[i];
            let dis = Math.abs(thisGrid.x - targetGrids.x) + Math.abs(thisGrid.y - targetGrids.y);
            if (dis < min && dis >= minDistance) {
                min = dis;
                nearestGrid = thisGrid;
            }
        }
        return nearestGrid;
    }
    /**
     * 获取两个战斗者之间的格子距离
     * @param battler1 战斗者1
     * @param battler2 战斗者2
     */
    static getBattlerDistance(battler1: ProjectClientSceneObject, battler2: ProjectClientSceneObject) {
        return Math.abs(battler1.posGrid.x - battler2.posGrid.x) + Math.abs(battler1.posGrid.y - battler2.posGrid.y);
    }
    /**
     * 获取两个格子距离
     * @param battler1 战斗者1
     * @param battler2 战斗者2
     */
    static getGridDistance(grid1: Point, grid2: Point) {
        return Math.abs(grid1.x - grid2.x) + Math.abs(grid1.y - grid2.y);
    }
    //------------------------------------------------------------------------------------------------------
    //  特殊效果
    //------------------------------------------------------------------------------------------------------
    /**
     * 获取战斗者的反击信息（遭受近战攻击后的反击）
     * @param fromBattler 攻击者
     * @param targetBattler 受击者
     * @param isMelee 是否近战
     * @param damageType 伤害类别（-2-无 -1-Miss 0-物理伤害 1-魔法伤害 2-真实伤害 3-恢复生命值 4-恢复魔法值）
     * @return [number] 反击伤害百分比（对比自己的普通攻击伤害） null=无反击
     */
    static getCounterattackDamagePer(fromBattler: ProjectClientSceneObject, targetBattler: ProjectClientSceneObject, isMelee: boolean, damageType: number): number {
        let targetBattlerModule = targetBattler.getModule(6) as SoModule_Battler;
        // -- 目标如果普通攻击不是单体则无法反击
        if (targetBattlerModule.actor.atkMode == 1 && !GameBattleHelper.isSingleTargetSkill(targetBattlerModule.actor.atkSkill)) {
            return null;
        }
        // -- 攻击者拥有无视反击的能力时不会遭受反击
        if (this.getSpecialBattleEffects(fromBattler, 1).length > 0) {
            return null;
        }
        // -- 目标无法攻击的情况下则无法反击
        if (!this.canAttack(targetBattler, true)) return;
        let atBackward = GameBattleHelper.atBackward(fromBattler, targetBattler);
        // 泰岳四件套：受到有效攻击时，攻击者在自身攻击范围内则以50%伤害反击。
        let taiyueCounterattack = false;
        if (damageType >= 0 && damageType <= 2 && ProjectGame.hasTaiyueSet(targetBattlerModule.actor)) {
            let battlerDistance = GameBattleHelper.getBattlerDistance(fromBattler, targetBattler);
            taiyueCounterattack = battlerDistance <= GameBattleHelper.getBattlerAtkRangeReference(targetBattler);
        }
        // -- 尝试触发反击（根据伤害高低排序后逐一尝试触发）
        let specialBattleEffects: DataStructure_specialBattleEffect[] = this.getSpecialBattleEffects(targetBattler, 0);;
        if (specialBattleEffects.length == 0) return taiyueCounterattack ? 50 : null;
        specialBattleEffects.sort((a, b) => { return a.counterattackDmagePer > b.counterattackDmagePer ? -1 : 1 });
        let battlerDistance: number = null;
        let atkRange: number = null;
        for (let i = 0; i < specialBattleEffects.length; i++) {
            let specialBattleEffect = specialBattleEffects[i];
            // -- 不满足仅近战反击
            if (specialBattleEffect.counterattackCondition1 == 1 && !isMelee) continue;
            // -- 不满足仅远程反击
            if (specialBattleEffect.counterattackCondition1 == 2 && isMelee) continue;
            // -- 不满足指定职业反击
            if (specialBattleEffect.counterattackCondition1 == 3 && (fromBattler.getModule(6) as SoModule_Battler).actor.class != specialBattleEffect.counterattackClass) continue;
            // -- 不满足物理伤害
            if (specialBattleEffect.counterattackCondition2 == 1 && damageType != 0) continue;
            // -- 不满足魔法伤害
            if (specialBattleEffect.counterattackCondition2 == 2 && damageType != 1) continue;
            // -- 不满足真实伤害
            if (specialBattleEffect.counterattackCondition2 == 3 && damageType != 2) continue;
            // -- 禁止后背被攻击时候反击
            if (specialBattleEffect.banBack && atBackward) continue;
            // -- 不满足普通攻击范围的情况
            if (specialBattleEffect.counterattackNeedRange) {
                if (battlerDistance == null) {
                    battlerDistance = GameBattleHelper.getBattlerDistance(fromBattler, targetBattler);
                    atkRange = GameBattleHelper.getBattlerAtkRangeReference(targetBattler);
                }
                if (battlerDistance > atkRange) continue;
            }
            // -- 几率
            if (MathUtils.rand(100) < specialBattleEffect.counterattackPer) {
                return taiyueCounterattack ? Math.max(50, specialBattleEffect.counterattackDmagePer) : specialBattleEffect.counterattackDmagePer;
            }
        }
        return taiyueCounterattack ? 50 : null;
    }
    /**
     * 获取战斗者的反伤信息（遭受近战攻击后的反伤）
     * @param fromBattler 攻击者
     * @param targetBattler 受击者
     * @param damageType 伤害类别（-2-无 -1-Miss 0-物理伤害 1-魔法伤害 2-真实伤害 3-恢复生命值 4-恢复魔法值）
     * @return [number] 反伤百分比（对比自己的普通攻击伤害） null=无反伤
     */
    static getReturnAttackDamagePer(fromBattler: ProjectClientSceneObject, targetBattler: ProjectClientSceneObject, damageType: number): number {
        // -- 攻击者拥有无视反伤的能力时不会遭受反伤
        if (this.getSpecialBattleEffects(fromBattler, 3).length > 0) {
            return null;
        }
        // -- 尝试触发反伤（根据伤害高低排序后逐一尝试触发）
        let specialBattleEffects: DataStructure_specialBattleEffect[] = this.getSpecialBattleEffects(targetBattler, 2);
        if (specialBattleEffects.length == 0) {
            return null;
        }
        specialBattleEffects.sort((a, b) => { return a.returnDamagePer > b.returnDamagePer ? -1 : 1 });
        for (let i = 0; i < specialBattleEffects.length; i++) {
            let specialBattleEffect = specialBattleEffects[i];
            // -- 不满足物理伤害
            if (specialBattleEffect.returnCondition == 1 && damageType != 0) continue;
            // -- 不满足魔法伤害
            if (specialBattleEffect.returnCondition == 2 && damageType != 1) continue;
            // -- 不满足真实伤害
            if (specialBattleEffect.returnCondition == 3 && damageType != 2) continue;
            if (MathUtils.rand(100) < specialBattleEffect.returnPer) {
                return specialBattleEffect.returnDamagePer;
            }
        }
        return null;
    }
    /**
     * 获取吸血百分比
     * @param fromBattler 战斗者
     * @param damageType 限定类别 0-物理伤害 1-魔法伤害 2-真实伤害
     * @param isHP 是否生命值，否则就是魔法值
     * @param isMelee 是否近战
     * @return [number] 
     */
    static getSuckPer(fromBattler: ProjectClientSceneObject, damageType: number, isHP: boolean, isMelee: boolean): number {
        let type = isHP ? 4 : 5;
        let specialBattleEffects: DataStructure_specialBattleEffect[] = this.getSpecialBattleEffects(fromBattler, type);
        for (let i = 0; i < specialBattleEffects.length; i++) {
            let specialBattleEffect = specialBattleEffects[i];
            if ((specialBattleEffect.suckCondition <= 2 && damageType != specialBattleEffect.suckCondition) ||
                (specialBattleEffect.suckCondition == 3 && !isMelee)) {
                specialBattleEffects.splice(i, 1);
                i--;
            }
        }
        if (specialBattleEffects.length == 0) return null;
        let suckPer = 0;
        for (let i = 0; i < specialBattleEffects.length; i++) {
            suckPer += specialBattleEffects[i].suckPer;
        }
        return suckPer;
    }
    /**
     * 获取普通攻击连击的概率
     * @param fromBattler 战斗者
     * @return [number] 
     */
    static getNormalAttackTimes(fromBattler: ProjectClientSceneObject): number {
        let specialBattleEffects: DataStructure_specialBattleEffect[] = this.getSpecialBattleEffects(fromBattler, 6);
        for (let i = 0; i < specialBattleEffects.length; i++) {
            if (MathUtils.rand(100) < specialBattleEffects[i].attackTimesPer) {
                return 2;
            }
        }
        return 1;
    }
    /**
     * 获取是否隐形
     */
    static hasInvisible(fromBattler: ProjectClientSceneObject): boolean {
        let specialBattleEffects: DataStructure_specialBattleEffect[] = this.getSpecialBattleEffects(fromBattler, 7);
        return specialBattleEffects.length != 0;
    }
    /**
     * 获取是否可以感知隐形
     */
    static hasSeeInvisible(fromBattler: ProjectClientSceneObject): boolean {
        let specialBattleEffects: DataStructure_specialBattleEffect[] = this.getSpecialBattleEffects(fromBattler, 8);
        return specialBattleEffects.length != 0;
    }
    /**
     * 获取伤害加成数值
     */
    static getDamagePer(fromBattler: ProjectClientSceneObject): number {
        let specialBattleEffects: DataStructure_specialBattleEffect[] = this.getSpecialBattleEffects(fromBattler, 9);
        let damagePer = 100;
        for (let i = 0; i < specialBattleEffects.length; i++) {
            damagePer *= specialBattleEffects[i].damagePer * 0.01;
        }
        return damagePer;
    }
    /**
     * 获取减少伤害数值
     */
    static getStrikePer(fromBattler: ProjectClientSceneObject): number {
        let specialBattleEffects: DataStructure_specialBattleEffect[] = this.getSpecialBattleEffects(fromBattler, 10);
        let strikePer = 100;
        for (let i = 0; i < specialBattleEffects.length; i++) {
            strikePer *= specialBattleEffects[i].strikePer * 0.01;
        }
        return strikePer;
    }
    /**
     * 获取死亡复活恢复的生命值
     */
    static getResurrectionHealthPer(fromBattler: ProjectClientSceneObject): number {
        let specialBattleEffects: DataStructure_specialBattleEffect[] = this.getSpecialBattleEffects(fromBattler, 11);
        for (let i = 0; i < specialBattleEffects.length; i++) {
            if (MathUtils.rand(100) < specialBattleEffects[i].resurrectionPer) {
                return specialBattleEffects[i].healthPer;
            }
        }
        return null;
    }
    /**
     * 元素伤害有效度
     * @param fromBattler 来自战斗者
     * @param elementType 元素类别
     * @return [number] 
     */
    static getElementEffectivenessPer(fromBattler: ProjectClientSceneObject, elementType: number): number {
        let specialBattleEffects: DataStructure_specialBattleEffect[] = this.getSpecialBattleEffects(fromBattler, 12);
        let v = 100;
        for (let i = 0; i < specialBattleEffects.length; i++) {
            if (specialBattleEffects[i].elementType == elementType) {
                v *= specialBattleEffects[i].effectiveness * 0.01;
            }
        }
        return v;
    }
    /**
     * 获取指定类型的特殊效果集合，根据战斗者拥有的技能和状态集内附带的特殊效果
     * @param battler 战斗者
     * @param specialType 类别
     */
    private static getSpecialBattleEffects(battler: ProjectClientSceneObject, specialType: number, fromBattleClass: Module_Class = null, fromBattleActor: Module_Actor = null): DataStructure_specialBattleEffect[] {
        let battlerModule = battler.getModule(6) as SoModule_Battler;
        if (!fromBattleActor) fromBattleActor = battlerModule.actor;
        if (!fromBattleClass) fromBattleClass = GameData.getModuleData(7, fromBattleActor.class);
        let specialBattleEffects: DataStructure_specialBattleEffect[] = [];
        // actor
        if (fromBattleActor && fromBattleActor.specialAbility) {
            specialBattleEffects = specialBattleEffects.concat(ArrayUtils.matchAttributes(fromBattleActor.specialBattleEffect, { type: specialType }, false));
        }
        // class
        if (fromBattleClass && fromBattleClass.specialAbility) {
            specialBattleEffects = specialBattleEffects.concat(ArrayUtils.matchAttributes(fromBattleClass.specialBattleEffect, { type: specialType }, false));
        }
        // equip
        let fromBattleEquips = fromBattleActor.equips;
        for (let i = 0; i < fromBattleEquips.length; i++) {
            let equip = fromBattleEquips[i];
            if (!equip || !equip.specialAbility) continue;
            specialBattleEffects = specialBattleEffects.concat(ArrayUtils.matchAttributes(equip.specialBattleEffect, { type: specialType }, false));
        }
        // skill
        let fromBattleSkills = battlerModule.actor.skills;
        if (battlerModule.actor.atkMode == 1 && battlerModule.actor.atkSkill) fromBattleSkills = fromBattleSkills.concat(battlerModule.actor.atkSkill);
        for (let i = 0; i < fromBattleSkills.length; i++) {
            let skill = fromBattleSkills[i];
            if (!skill.specialAbility) continue;
            specialBattleEffects = specialBattleEffects.concat(ArrayUtils.matchAttributes(skill.specialBattleEffect, { type: specialType }, false));
        }
        // status
        for (let i = 0; i < battlerModule.actor.status.length; i++) {
            let status = battlerModule.actor.status[i];
            if (!status.specialAbility) continue;
            specialBattleEffects = specialBattleEffects.concat(ArrayUtils.matchAttributes(status.specialBattleEffect, { type: specialType }, false));
        }
        return specialBattleEffects;
    }
    //------------------------------------------------------------------------------------------------------
    //  辅助计算
    //------------------------------------------------------------------------------------------------------
    /**
     * 旋转正方形二维数组
     * @param squareArray 正方形的二维数组
     * @param degrees 旋转角度（只能是90、180或270）
     * @returns 旋转后的新二维数组
     */
    static rotateSquareArray<T>(squareArray: T[][], degrees: 90 | 180 | 270): T[][] {
        const n = squareArray.length;
        // 验证输入是否为正方形数组（目前不需要）
        // if (!squareArray.every(row => row.length === n)) {
        //     throw new Error("Input array must be a square (N x N) array");
        // }
        // 根据角度决定旋转次数（90°=1次，180°=2次，270°=3次）
        const rotations = degrees / 90;
        let result = squareArray.map(row => [...row]); // 创建副本
        for (let r = 0; r < rotations; r++) {
            result = this.rotate90Degrees(result);
        }
        return result;
    }
    /**
     * 辅助函数：将正方形二维数组顺时针旋转90度
     * @param array 正方形二维数组
     * @returns 旋转后的新数组
     */
    static rotate90Degrees<T>(array: T[][]): T[][] {
        const n = array.length;
        const rotated = new Array(n).fill(0).map(() => new Array(n));
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                rotated[j][n - 1 - i] = array[i][j];
            }
        }
        return rotated;
    }
}
