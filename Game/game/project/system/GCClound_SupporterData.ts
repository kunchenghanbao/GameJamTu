/**
 * 支持者数据
 * -- GC 云服功能-通信编号100001开始
 * -- 基础安全：做了基础版本的防数据串改
 * Created by Karson.DS on 2025-11-17 10:17:13.
 */
(() => {
    class GCClound_SupporterData {
        /**
         * 配置参数：白名单域名
         */
        private static whiteOrigins = ["http://127.0.0.1", "http://localhost",
            "https://gc.gamecreator.com.cn", "https://gamecreator.com.cn",
            "https://www.gamecreator.com.cn", "http://gc.gamecreator.com.cn",
            "https://global.gamecreator.com.cn", "http://global.gamecreator.com.cn"];
        /**
         * 锁定值
         */
        private static lock_fp_user: number;
        private static lock_fp_game: number;
        private static lock_fp_cost: number;
        /**
         * 最大值
         */
        private static lock_fp_gameMAX: number;
        /**
         * 初始化
         */
        static init() {
            this.initCommand();
            // 接收消息
            window.addEventListener("message", (event) => {
                // 白名单
                let allow = false;
                for (let i in this.whiteOrigins) {
                    let origin = this.whiteOrigins[i];
                    if (event.origin.indexOf(origin) != -1) {
                        allow = true;
                        break;
                    }
                }
                if (!allow) return;
                // 
                var data = event.data;
                if (!data || typeof data != "object") return;
                switch (data.msgType) {
                    case 100001: // 同步
                        this.syncFPValue(data.fp_user, data.fp_game);
                        break;
                    case 1002: // 支持者模块初始化完毕，开始同步数据（也可以视为引擎初始化完毕）
                        break;
                    case 1003: //
                        break;
                    default:
                        break;
                }
            })
        }
        /**
         * 同步支持度
         * @param fp_user 作者支持度
         * @param fp_game 作品支持度
         */
        private static syncFPValue(fp_user: number, fp_game: number) {
            // 安全防护：若低于此前记录的最大值则说明数据异常
            if (this.lock_fp_gameMAX == null || fp_game > this.lock_fp_gameMAX) {
                this.lock_fp_gameMAX = fp_game;
            }
            if (fp_game < this.lock_fp_gameMAX) {
                alert(`GCClound_SupporterData:Data anomaly 1`); // 数据异常-1：接收到了更小的值，不会出现该情况，因为支持度不会减少，可能遇到外部修改
                window.location.reload();
                return;
            }
            // 获取正确的消耗值（修正变量）
            let old_fp_cost_value = this.safelyFP_cost;
            if (old_fp_cost_value != ClientWorld.variable.getVariable(WorldData.const_fp_cost_value)) { ClientWorld.variable.setVariable(WorldData.const_fp_cost_value, old_fp_cost_value); this.onFixed(); }
            // 作者支持度发生变化时：更新
            let old_fp_user = this.safelyFP_user;
            if (old_fp_user != ClientWorld.variable.getVariable(WorldData.const_fp_user)) { ClientWorld.variable.setVariable(WorldData.const_fp_user, old_fp_user); this.onFixed(); }
            if (old_fp_user != fp_user) {
                ClientWorld.variable.setVariable(WorldData.const_fp_user, fp_user);
            }
            // 作品支持度发生变化时：更新 + 派发事件
            let old_fp_game = this.safelyFP_game;
            if (old_fp_game != ClientWorld.variable.getVariable(WorldData.const_fp_game)) { ClientWorld.variable.setVariable(WorldData.const_fp_game, old_fp_game); this.onFixed(); }
            if (old_fp_game != fp_game) {
                let changeValue = fp_game - old_fp_game;
                // changeValue
                ClientWorld.variable.setVariable(WorldData.const_fp_changeValue, changeValue);
                // fp_game
                ClientWorld.variable.setVariable(WorldData.const_fp_game, fp_game);
                // lock cost
                let newCostValue = old_fp_cost_value + changeValue;
                ClientWorld.variable.setVariable(WorldData.const_fp_cost_value, newCostValue);
                this.lock_fp_cost = newCostValue;
                // event
                CommandPage.startTriggerFragmentEvent(WorldData.const_fp_changeEvent, Game.player.sceneObject, Game.player.sceneObject);
            }
            else if (this.lock_fp_cost == null) {
                this.lock_fp_cost = ClientWorld.variable.getVariable(WorldData.const_fp_cost_value);
            }
            // lock
            this.lock_fp_user = fp_user;
            this.lock_fp_game = fp_game;
        }
        /**
         * 初始化指令
         */
        private static initCommand() {
            CommandExecute.customCommand_14001 = (commandPage: CommandPage, cmd: Command, trigger: CommandTrigger, triggerPlayer: ClientPlayer, playerInput: any[], p: CustomCommandParams_14001) => {
                if (!trigger || !(trigger instanceof CommandTrigger) || !triggerPlayer || !(triggerPlayer instanceof ClientPlayer)) return;
                let safelyFP_cost = this.safelyFP_cost;
                if (ClientWorld.variable.getVariable(WorldData.const_fp_cost_value) != safelyFP_cost) ClientWorld.variable.setVariable(WorldData.const_fp_cost_value, safelyFP_cost);
                // -- 超出上限下限
                let cost = Math.floor(p.cost);
                if (cost <= 0 || cost > safelyFP_cost) return;
                // -- 减少
                let newValue = safelyFP_cost - cost;
                ClientWorld.variable.setVariable(WorldData.const_fp_cost_value, newValue);
                this.lock_fp_cost = newValue;

            }
            Object.defineProperty(CommandExecute, 'customCommand_14001', {
                value: CommandExecute.customCommand_14001,
                writable: false,
                configurable: false,
                enumerable: true
            });
        }
        /**
         * 高频率修正监控
         */
        private static onFixed() {
            alert(`GCClound_SupporterData:Data anomaly 2`); // 数据异常-2：关键变量被修正，作者使用错误或遇到外部修改
            window.location.reload();
            return;
        }
        //------------------------------------------------------------------------------------------------------
        // 获取
        //------------------------------------------------------------------------------------------------------
        private static get safelyFP_user() {
            return this.lock_fp_user != null ? this.lock_fp_user : ClientWorld.variable.getVariable(WorldData.const_fp_user);
        }
        private static get safelyFP_game() {
            return this.lock_fp_game != null ? this.lock_fp_game : ClientWorld.variable.getVariable(WorldData.const_fp_game);
        }
        private static get safelyFP_cost() {
            return this.lock_fp_cost != null ? this.lock_fp_cost : ClientWorld.variable.getVariable(WorldData.const_fp_cost_value);
        }
    }
    // 监听引擎初始化完毕
    EventUtils.addEventListener(ClientWorld, ClientWorld.EVENT_INITED, Callback.New(() => {
        if (os.platform <= 1) {
            GCClound_SupporterData.init();
            parent.postMessage({ msgType: 1002 }, '*')
        }
    }, this), true);
})();
module CommandExecute {
    export function customCommand_14001(commandPage: CommandPage, cmd: Command, trigger: CommandTrigger, triggerPlayer: ClientPlayer, playerInput: any[], p: CustomCommandParams_14001): void { }
}