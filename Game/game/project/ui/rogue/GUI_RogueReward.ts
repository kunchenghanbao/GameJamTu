class GUI_RogueReward extends GUI_40 {
    static onQueueComplete: Function = null;
    private static onQueueCompletePriority: number = 0;
    private titleText: UIString;
    private cardButtons: UIButton[] = [];
    private cardBackgrounds: UIBase[] = [];
    private cardDescriptions: UIString[] = [];
    private cardIcons: UIBitmap[] = [];
    private currentGroup: any;
    private selectedIndex: number = 0;
    private oldBattleControl: boolean;
    private oldWorldControl: boolean;
    private selectionCursor: RogueSelectionCursor;

    constructor() {
        super();
        RogueUIFactory.prepareRoot(this);
        let ui = this as any;
        this.titleText = ui.奖励标题 as UIString;
        this.selectionCursor = new RogueSelectionCursor;
        for (let i = 0; i < 3; i++) {
            let button = ui["奖励按钮" + (i + 1)] as UIButton;
            button.on(EventObject.CLICK, this, () => this.choose(i));
            button.on(EventObject.MOUSE_OVER, this, () => this.choose(i));
            // Leave room for the icon on the left while keeping the title centered
            // in the remaining visual area of the card button.
            button.textDx = 36;
            let icon = new UIBitmap;
            icon.x = 16;
            icon.y = 19;
            icon.width = 76;
            icon.height = 76;
            icon.mouseEnabled = false;
            icon.visible = false;
            button.addChild(icon);
            this.cardButtons.push(button);
            this.cardBackgrounds.push(ui["奖励卡背景" + (i + 1)] as UIBase);
            this.cardDescriptions.push(ui["奖励描述" + (i + 1)] as UIString);
            this.cardIcons.push(icon);
        }
        (ui.奖励确认按钮 as UIButton).on(EventObject.CLICK, this, this.confirmSelection);
        this.on(EventObject.DISPLAY, this, this.onDisplay);
        this.on(EventObject.UNDISPLAY, this, this.onUndisplay);
    }

    private onDisplay(): void {
        this.oldBattleControl = GameBattle.playerControlEnabled;
        this.oldWorldControl = WorldData.playCtrlEnabled;
        GameBattle.playerControlEnabled = false;
        WorldData.playCtrlEnabled = false;
        stage.on(EventObject.KEY_DOWN, this, this.onKeyDown);
        this.showNextGroup();
    }

    private onUndisplay(): void {
        stage.off(EventObject.KEY_DOWN, this, this.onKeyDown);
        if (this.selectionCursor) this.selectionCursor.hide();
        GameBattle.playerControlEnabled = this.oldBattleControl;
        WorldData.playCtrlEnabled = this.oldWorldControl;
    }

    private showNextGroup(): void {
        if (!RogueRunManager.active) return this.completeQueue();
        RogueRewardResolver.removeConfirmedRewards();
        this.currentGroup = null;
        for (let i = 0; i < RogueRunManager.state.rewardQueue.length; i++) {
            let group = RogueRunManager.state.rewardQueue[i];
            if (group.status === "pending" || group.status === "showing") {
                this.currentGroup = group;
                break;
            }
        }
        if (!this.currentGroup) return this.completeQueue();
        this.currentGroup.status = "showing";
        this.selectedIndex = 0;
        let ownerName = this.currentGroup.killOwnerActorName || RogueRewardResolver.getOwnerActorName(this.currentGroup.killOwnerUID);
        let ownerLabel = ownerName ? ownerName + "的战利品" : "队伍战利品";
        if (this.currentGroup.didLevelUp) {
            ownerLabel += "  Lv." + this.currentGroup.levelFrom + "→" + this.currentGroup.levelTo;
        }
        else if (this.currentGroup.levelFrom > 0 && this.currentGroup.levelFrom === this.currentGroup.levelTo) {
            ownerLabel += "  已达最高等级";
        }
        this.titleText.text = ownerLabel + "  " + (RogueRunManager.state.rewardQueue.indexOf(this.currentGroup) + 1) + "/" + RogueRunManager.state.rewardQueue.length;
        for (let i = 0; i < 3; i++) {
            let card = this.currentGroup.cards[i];
            this.cardButtons[i].label = card ? card.name : "不可用";
            this.cardButtons[i].disabled = !card;
            this.cardDescriptions[i].text = card ? card.description : "";
            let iconPath = this.getCardIcon(card);
            // Keep compatibility with lightweight/headless test instances that
            // construct this presenter without running the UI constructor.
            if (this.cardIcons && this.cardIcons[i]) {
                this.cardIcons[i].image = iconPath;
                this.cardIcons[i].visible = !!card && !!iconPath;
            }
        }
        this.refreshSelection();
    }

    /** Resolve the icon from the immutable card snapshot, including old and
     *  instant-reward snapshots that predate explicit icon IDs. */
    private getCardIcon(card: any): string {
        if (card && card.iconID) return card.iconID;
        if (card && card.type === "instant" && card.effectSnapshot) {
            if (card.effectSnapshot.effect === "gold") return "asset/image/picture/icon/item/Gold_1_1.png";
            if (card.effectSnapshot.effect === "healHP") return "asset/image/picture/icon/state/Treatment.png";
            if (card.effectSnapshot.effect === "healSP") return "asset/image/picture/icon/state/TreatmentSP.png";
        }
        return "asset/image/picture/icon/item/Card_1.png";
    }

    private choose(index: number): void {
        if (!this.currentGroup || !this.currentGroup.cards[index]) return;
        this.selectedIndex = index;
        this.refreshSelection();
    }

    private refreshSelection(): void {
        for (let i = 0; i < this.cardButtons.length; i++) {
            this.cardButtons[i].color = i === this.selectedIndex ? "#FFF0C2" : "#F4F6F8";
        }
        if (this.selectionCursor) this.selectionCursor.focus(this.cardBackgrounds[this.selectedIndex], 5);
    }

    private confirmSelection(): void {
        if (!this.currentGroup) return;
        let card = this.currentGroup.cards[this.selectedIndex];
        if (!card || !RogueRewardResolver.confirmReward(this.currentGroup.rewardGroupID, card.cardID)) return;
        this.showNextGroup();
    }

    private completeQueue(): void {
        let callback = GUI_RogueReward.onQueueComplete;
        GUI_RogueReward.onQueueComplete = null;
        GUI_RogueReward.onQueueCompletePriority = 0;
        let continuation = RogueRunManager.active ? RogueRunManager.state.pendingRewardContinuation : "";
        if (RogueRunManager.active) RogueRunManager.state.pendingRewardContinuation = "";
        GameUI.hide(40);
        if (callback) callback.apply(null);
        else RogueRewardContinuation.resume(continuation);
    }

    static setQueueCompletion(callback: Function, continuation: string): void {
        let priority = continuation === "node-complete" ? 4 :
            (continuation === "battle-complete" ? 3 : (continuation ? 2 : 1));
        if (priority < this.onQueueCompletePriority) return;
        this.onQueueCompletePriority = priority;
        this.onQueueComplete = callback;
        if (RogueRunManager.active && continuation) {
            RogueRunManager.state.pendingRewardContinuation = continuation;
        }
        // 记录“等待玩家确认”的奖励流程。即使应用在卡牌界面期间被
        // 系统回收，恢复存档时也会重新弹出尚未确认的奖励。
        if (RogueRunManager.active && typeof RogueRunManager.saveProgress === "function") RogueRunManager.saveProgress();
    }

    private onKeyDown(e: EventObject): void {
        if (GUI_Setting.IS_KEY(e.keyCode, GUI_Setting.KEY_BOARD.LEFT)) this.choose((this.selectedIndex + 2) % 3);
        else if (GUI_Setting.IS_KEY(e.keyCode, GUI_Setting.KEY_BOARD.RIGHT)) this.choose((this.selectedIndex + 1) % 3);
        else if (GUI_Setting.IS_KEY(e.keyCode, GUI_Setting.KEY_BOARD.A)) this.confirmSelection();
    }
}

class RogueRewardPresenter {
    static presentPending(onComplete: Function, continuation: string = ""): boolean {
        if (!RogueRunManager.active || !RogueRunManager.state.rewardQueue.some(group => group.status !== "confirmed")) return false;
        GUI_RogueReward.setQueueCompletion(onComplete, continuation);
        if (!GameUI.isOpened(40)) {
            GameUI.show(40);
        }
        else {
            // The battle flow can leave the reward window registered as open
            // while its previous queue was already consumed. Refresh it so a
            // later kill is visible instead of silently waiting behind it.
            let rewardUI = GameUI.get ? GameUI.get(40) as any : null;
            if (rewardUI && rewardUI["showNextGroup"]) rewardUI["showNextGroup"]();
        }
        return true;
    }

    static recoverPending(): void {
        if (!RogueRunManager.active || !RogueRunManager.state.pendingRewardContinuation) return;
        if (RogueRunManager.state.rewardQueue.some(group => group.status !== "confirmed")) {
            setFrameout(() => this.presentPending(null), 1);
        }
        else {
            let continuation = RogueRunManager.state.pendingRewardContinuation;
            RogueRunManager.state.pendingRewardContinuation = "";
            setFrameout(() => RogueRewardContinuation.resume(continuation), 1);
        }
    }
}

class RogueRewardContinuation {
    static resume(continuation: string): void {
        if (!continuation) return;
        if (continuation === "action-end") {
            GameBattleAction.endAction();
        }
        else if (continuation === "battle-complete") {
            GameCommand.startCommonCommand(14022, [], null, Game.player.sceneObject, Game.player.sceneObject);
        }
        else if (continuation === "node-complete") {
            RogueSceneDirector.completeCurrentNode();
        }
        else if (continuation === "battle-scene-step-over") {
            let battleSceneUI = GameUI.get(36) as any;
            if (battleSceneUI && battleSceneUI.step_over) battleSceneUI.step_over();
            else EventUtils.happen(GameBattleAction, GameBattleAction.EVENT_ONCE_ACTION_COMPLETE);
        }
        else if (continuation === "battle-scene-action-complete") {
            EventUtils.happen(GameBattleAction, GameBattleAction.EVENT_ONCE_ACTION_COMPLETE);
        }
    }
}
