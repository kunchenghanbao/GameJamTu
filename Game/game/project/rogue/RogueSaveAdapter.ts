/**
 * Registers the run snapshot independently from normal scene and battle data.
 */
class RogueSaveAdapter {
    static readonly SAVE_KEY: string = "RogueRun";
    static readonly MAIN_PLAYER_BACKUP_KEY: string = "RogueMainPlayerBackup";

    static init(): void {
        SinglePlayerGame.regSaveCustomData(this.SAVE_KEY, Callback.New(() => {
            return RogueRunManager.getSaveData();
        }, this));
        SinglePlayerGame.regSaveCustomData(this.MAIN_PLAYER_BACKUP_KEY, Callback.New(() => {
            return RogueRunManager.getMainPlayerBackup();
        }, this));
        EventUtils.addEventListener(SinglePlayerGame, SinglePlayerGame.EVENT_ON_BEFORE_RECOVERY_DATA, Callback.New(() => {
            RogueRunManager.prepareForRecovery();
        }, this));
        EventUtils.addEventListener(SinglePlayerGame, SinglePlayerGame.EVENT_ON_AFTER_RECOVERY_DATA, Callback.New(() => {
            let saveData = SinglePlayerGame.getSaveCustomData(this.SAVE_KEY);
            if (!RogueRunManager.restoreFromSaveData(saveData)) {
                let mainPlayerBackup = SinglePlayerGame.getSaveCustomData(this.MAIN_PLAYER_BACKUP_KEY);
                RogueRunManager.restoreMainPlayerBackup(mainPlayerBackup);
            }
            else RogueRewardPresenter.recoverPending();
        }, this));
    }
}

if (!Config.BEHAVIOR_EDIT_MODE) RogueSaveAdapter.init();
