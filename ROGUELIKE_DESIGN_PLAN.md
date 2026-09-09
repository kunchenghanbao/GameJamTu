# 肉鸽玩法设计方案

## 目标

在现有 Game Creator SRPG 框架上增加“局内构筑、即时奖励、逐层推进、失败重置”的肉鸽玩法，支持：

- 敌人死亡后即时掉落武器。
- 敌人死亡后即时掉落技能。
- 将武器或技能立即应用到指定人物。
- 增加人物移动距离、攻击力、魔力、生命值和最终伤害。
- 中途存档、读档和失败回滚。
- 局内奖励与普通 RPG 永久进度分离。

建议不要重写战斗系统，而是在现有战斗、角色、装备、技能和事件系统上增加一个“肉鸽状态层”。

## 现有能力

| 需求 | 当前框架入口 | 说明 |
| --- | --- | --- |
| 独立装备实例 | `GameData.newModuleData(9, equipID, true)` | 适合生成带随机词条的装备 |
| 装备进背包 | `ProjectPlayer.addEquipByInstance` | 支持独立装备实例 |
| 穿戴装备 | `ProjectPlayer.wearPlayerActorEquip`、命令 `10004` | 会刷新角色属性 |
| 学习技能 | `Game.actorLearnSkill`、命令 `10003` | 将技能加入角色技能列表 |
| 忘记技能 | `Game.actorForgetSkill`、命令 `10003` | 可用于局结束清理 |
| 增加攻击力 | `actor.increaseATK`、命令 `10005` | 现有属性增量 |
| 增加移动力 | `actor.increaseMoveGrid`、命令 `10005` | 刷新后影响战斗移动和 AI |
| 增加生命/防御/魔力 | `increaseMaxHP`、`increaseDEF`、`increaseMag` 等 | 由 `Game.refreshActorAttribute` 生效 |
| 扩展属性 | `actor.increaseExtendAttributes` | 可承载自定义效果 |
| 敌人死亡通知 | `GameBattleData.EVENT_BATTLER_DEAD` | 适合接入即时掉落 |
| 玩家战斗角色绑定 | `SoModule_Battler`、`GameBattleData` | 战斗对象绑定玩家队伍角色 |
| 自定义存档 | `SinglePlayerGame.regSaveCustomData` | 可保存肉鸽局状态 |

当前自定义命令已经有这些相关能力：

- `customCommand_10001`：增加装备，并支持随机装备属性。
- `customCommand_10003`：添加、移除或替换技能。
- `customCommand_10004`：穿戴或卸下装备。
- `customCommand_10005`：增减角色攻击力、移动力、HP 上限等属性。
- `customCommand_2002`：增加或减少普通道具。

## 总体架构

建议新增一个独立的 `RogueRunManager`，集中负责局状态、奖励、属性应用和清理。

```text
RogueRunManager
  ├─ RogueRunState       局内状态、层数、种子、房间
  ├─ RogueActorBuild     每个角色的技能、装备和属性增量
  ├─ RogueRewardTable    奖励池、稀有度和权重
  ├─ RogueRandom         局内随机数
  ├─ RogueRewardUI       即时奖励选择界面
  ├─ GameBattleData      敌人死亡监听
  └─ SinglePlayerGame    肉鸽自定义存档
```

战斗核心继续负责移动、攻击、命中、伤害、回合和 AI；肉鸽层负责：

1. 生成奖励候选。
2. 暂停战斗并让玩家选择。
3. 将奖励应用到玩家角色。
4. 在场景切换、读档和战斗重新初始化后重放效果。
5. 在肉鸽局结束时清理临时数据。

## 三类数据必须隔离

### 普通 RPG 数据

角色原本的等级、经验、永久装备、永久技能和普通背包属于常规进度。

### 肉鸽局数据

本局获得的装备、技能、属性增量、肉鸽货币、房间、奖励记录和随机种子只属于当前肉鸽局。

### 临时表现数据

当前奖励 UI、当前高亮人物、动画和鼠标选择可以放在 `GlobalTempData`，但不能让它成为存档的唯一来源。

```text
存档关键数据      -> RogueRunState / SinglePlayerGame 自定义存档
当前 UI 和动画     -> GlobalTempData
实际战斗属性       -> Module_Actor + 肉鸽效果重放
```

`GlobalTempData` 在 `GCMain.ts` 中只是运行期对象，刷新或读档后可能丢失，不能单独保存肉鸽局。

## 肉鸽局状态

设计示例：

```ts
interface RogueRunState {
    active: boolean;
    runId: string;
    seed: number;
    randomIndex: number;
    floor: number;
    roomIndex: number;
    currency: number;
    currentSceneID: number;
    pendingRewards: RogueRewardChoice[];
    selectedRewardKeys: string[];
    completedRoomKeys: string[];
    actorBuilds: RogueActorBuild[];
}

interface RogueActorBuild {
    actorID: number;
    partySlot: number;
    gainedSkillIDs: number[];
    gainedEquipKeys: string[];
    statBonus: RogueStatBonus;
    originalSkillIDs: number[];
}

interface RogueStatBonus {
    maxHP: number;
    maxSP: number;
    atk: number;
    mag: number;
    def: number;
    magDef: number;
    moveGrid: number;
    dodge: number;
    crit: number;
    damagePercent: number;
}
```

角色建议使用 `actorID + partySlot` 作为逻辑键，不保存 JavaScript 对象引用。读档或重新进入战斗后，对象引用会变化，但角色 ID 和队伍位置可以重新建立绑定。

## 即时掉落的第一版方案

第一版建议做“敌人死亡后 3 选 1”，不要一开始制作真正的地图掉落物。

```text
敌人死亡
  -> RogueRunManager 生成 3 个奖励
  -> 暂停战斗输入
  -> 打开奖励选择 UI
  -> 玩家选择奖励和目标人物
  -> 立即应用奖励
  -> 写入 RogueRunState
  -> 关闭 UI
  -> 恢复战斗
```

这样可以避免处理掉落物碰撞、拾取距离、拾取是否消耗行动等问题，也能让键盘、鼠标和手柄共用现有焦点系统。

后续如果需要更强的即时感，再把奖励生成到敌人死亡格子：

- 复用场景对象克隆能力创建掉落物。
- 掉落物记录奖励类型、奖励 ID、格子坐标和唯一 key。
- 玩家接近或点击后触发拾取事件。
- 已生成的掉落物必须写入存档，避免读档后重复生成。

## 武器掉落和即时装备

### 生成

武器属于装备模块 `9`，不能直接修改公共装备模板。推荐流程：

```text
奖励表选择装备 ID
  -> GameData.newModuleData(9, equipID, true)
  -> 随机生成词条
  -> 生成唯一装备 key
  -> 写入 RogueRunState
  -> 显示装备候选
  -> 玩家选择目标人物
  -> 穿戴并刷新属性
```

`customCommand_10001` 已经有随机装备属性逻辑，可作为词条系统参考。词条可以包括攻击力、最大 HP、SP、防御、魔防、移动力、命中、回避、暴击和自定义扩展属性。

### 装备记录

肉鸽装备仍需真正进入角色的 `actor.equips`，现有战斗属性刷新才能生效；但同时要在肉鸽状态中记录它的来源和归属：

```ts
interface RogueEquipRecord {
    key: string;
    equipID: number;
    ownerActorID: number;
    ownerPartySlot: number;
    partID: number;
    equipData: Module_Equip;
    source: string;
}
```

局结束时只按装备唯一 key 清理肉鸽装备，不能按装备 ID 全部删除，否则会误删玩家原本拥有的同类装备。

### 装备替换

奖励界面应显示新旧装备对比：

- 当前装备和新装备名称。
- 攻击力、移动力、暴击等差值。
- 卸下的旧装备是否保留。
- 新装备是否带随机词条。

推荐规则：普通永久装备回到普通背包；肉鸽装备进入本局仓库；局结束只清理肉鸽装备。

## 技能掉落和即时学习

技能奖励保存技能 ID，应用时通过现有技能学习接口生成角色技能实例：

```text
奖励表选择技能 ID
  -> 检查目标人物是否已有该技能
  -> 玩家选择目标人物
  -> Game.actorLearnSkill(actor, skillID)
  -> 记录 gainedSkillIDs
  -> 设置初始冷却为 0
  -> 刷新技能和角色 UI
```

建议规则：

- 已拥有技能不再进入候选池。
- 主动技能、被动技能、普通攻击替换技能分别显示。
- 技能栏已满时进入“替换一个技能”流程。
- 奖励界面显示 SP 消耗、行动力消耗、冷却和攻击范围。
- 只移除本局新增技能，不按技能 ID 粗暴删除。

进入肉鸽局时记录原始技能列表：

```text
原始技能 = 进入肉鸽局前已有技能
局内技能 = 肉鸽局中新增技能
局结束清理 = 只移除局内新增技能
```

## 移动距离和伤害强化

### 移动距离

项目的 `Module_Actor` 已有 `increaseMoveGrid`，战斗移动和 AI 都使用刷新后的 `actor.MoveGrid`。最小实现可以是：

```text
移动力奖励
  -> RogueStatBonus.moveGrid += 1
  -> actor.increaseMoveGrid = 基础增量 + 局内增量
  -> Game.refreshActorAttribute(actor, level)
```

推荐每次只增加 `+1` 或 `+2`，避免角色一次行动跨过整张地图，破坏战棋站位。

### 攻击力和魔力

固定数值奖励直接使用已有字段：

```text
攻击力奖励 -> actor.increaseATK += value
魔力奖励   -> actor.increaseMag += value
生命奖励   -> actor.increaseMaxHP += value
防御奖励   -> actor.increaseDEF += value
```

每次修改后调用 `Game.refreshActorAttribute`，并处理 HP/SP 上限变化后的当前值。

### 最终伤害

“攻击力提升”和“最终伤害提升”必须分开：

| 强化 | 推荐实现 | 影响 |
| --- | --- | --- |
| `+攻击力` | `actor.increaseATK` | 物理攻击及依赖攻击力的技能 |
| `+魔力` | `actor.increaseMag` | 魔法技能 |
| `+固定伤害` | 自定义扩展属性或事件 | 所有或指定伤害 |
| `+伤害百分比` | 参与最终命中结算 | 最终倍率 |
| `+物理/魔法伤害` | 按伤害类型分别计算 | 流派构筑 |
| `+技能伤害` | 按技能 ID 或类别计算 | 技能流派 |

第一版建议只做攻击力、魔力、移动力和暴击，避免马上改核心伤害公式。

如果要做真正的伤害倍率，应在 `GameBattleData.calculationHitResult` 的最终结算阶段集中读取肉鸽增益：

```text
基础攻击或技能结果
  -> 命中/暴击
  -> 角色和装备属性
  -> 肉鸽伤害倍率
  -> 防御、抗性和状态修正
  -> 反击、吸血和后续效果
  -> 写回实际 HP
```

不要只在 `GameBattleAction.showDamage` 中修改数字，因为它主要负责显示，不会改变实际 HP。

## 属性应用层

奖励事件不要直接散落地修改 `actor`，统一经过管理器：

```ts
class RogueRunManager {
    static startRun(): void;
    static endRun(result: string): void;
    static applyReward(reward: RogueRewardChoice, actor: Module_Actor): void;
    static applyActorBuild(actor: Module_Actor, build: RogueActorBuild): void;
    static refreshAllActorAttributes(): void;
    static cleanupRunActorData(): void;
    static onBattlerDead(battler: ProjectClientSceneObject): void;
    static saveData(): any;
    static recoveryData(data: any): void;
}
```

`applyActorBuild` 的职责：

1. 读取角色基础快照。
2. 重新应用局内装备。
3. 重新学习局内技能。
4. 应用 `RogueStatBonus`。
5. 调用 `Game.refreshActorAttribute`。
6. 修正 HP/SP。
7. 刷新角色、队伍和战斗 UI。

这样能应对换场景、读档、战斗初始化和 `SoModule_Battler` 重新绑定。

## 掉落监听和奖励表

现有 `GameBattleData.dropRecordByDie` 适合战斗结束统一结算，不适合直接承担即时肉鸽掉落。建议监听：

```text
GameBattleData.EVENT_BATTLER_DEAD
  -> RogueRunManager.onBattlerDead
  -> 判断是否敌方和是否允许肉鸽掉落
  -> 按楼层、难度和敌人类型读取奖励表
  -> 写入 pendingRewards
  -> 暂停战斗并打开奖励 UI
```

不要把敌人的 `dropEquips` 作为肉鸽掉落的唯一来源，因为原有死亡流程会累计普通奖励并清理掉落字段，最终结算时机也不同。建议建立独立奖励组：

```text
普通敌人 -> RewardTable_Common
精英敌人 -> RewardTable_Elite
Boss      -> RewardTable_Boss
剧情敌人  -> 由房间事件指定 RewardTable
```

奖励结构示例：

```ts
interface RogueRewardChoice {
    key: string;
    type: "equip" | "skill" | "stat" | "heal" | "currency" | "special";
    rarity: number;
    title: string;
    icon: string;
    equipID?: number;
    skillID?: number;
    statType?: string;
    value?: number;
    valuePercent?: number;
    targetMode: "oneActor" | "allActors" | "none";
    sourceBattlerKey: string;
}
```

## 奖励选择 UI

建议新建 `GUI_RogueReward`，不要直接改造 `GUI_HitReward`，因为后者是战斗结束奖励。

UI 至少需要：

- 3 个奖励候选卡片。
- 奖励类型、稀有度、图标和描述。
- 装备与当前装备的差值对比。
- 技能消耗、范围、冷却和目标类型。
- 目标角色选择。
- 确认、返回和防重复点击。
- 当前层数、肉鸽货币和本局构筑摘要。

流程：

```text
显示奖励
  -> 选择奖励
  -> 需要目标时选择角色
  -> 显示应用前后差异
  -> 确认
  -> 先写入 RogueRunState
  -> applyReward
  -> 关闭 UI
  -> 恢复战斗或事件
```

选择确认时就要写入状态，不能等 UI 关闭后才保存，避免刷新或读档造成重复奖励。

## 房间和关卡循环

项目当前是固定场景树，第一版不需要完全随机地图。可以采用“固定场景 + 随机奖励 + 随机路线”：

```text
肉鸽入口
  -> 普通战斗房
  -> 随机事件房
  -> 商店/休息房
  -> 精英战斗房
  -> Boss 房
  -> 结算
```

可复用已有场景：

- 场景 `5`：普通野外战斗。
- 场景 `6`/`7`：精英或 Boss 战斗。
- 场景 `8`：NPC、事件、商店或休息房。
- 场景 `9` 至 `14`：战斗环境和背景参考。

房间路由先用玩家变量记录当前层数、房间编号、房间类型、可选路线和场景 ID。固定循环稳定后，再加入房间节点随机和地图变体。

## 随机种子

本局应有独立随机种子，影响奖励候选、装备词条、路线和商店库存。至少保存：

- `runSeed`。
- 当前随机序列位置，或已经生成的奖励。
- 当前房间 key。
- 已生成奖励 key。
- 已选择奖励 key。

第一版可以在奖励生成时立即把候选写入 `pendingRewards`，读档时直接恢复候选。这样不必依赖重新计算随机数，也能防止反复读档刷新奖励。

## 存档

建议注册独立的自定义存档段：

```ts
SinglePlayerGame.regSaveCustomData(
    "RogueRun",
    Callback.New(RogueRunManager.saveData, RogueRunManager)
);
```

恢复时至少还原：

- 是否处于肉鸽局。
- 局 ID、随机种子、层数和房间。
- 当前场景。
- 局内装备实例及归属。
- 局内技能。
- 每个角色的属性增量。
- 已生成但未选择的奖励。
- 已领取奖励和完成房间。
- 肉鸽货币。
- 当前战斗绑定和战斗状态。

恢复顺序：

```text
读取 RogueRunState
  -> 恢复场景
  -> 恢复玩家角色
  -> 恢复装备和技能
  -> 重新计算属性
  -> 恢复战斗绑定
  -> 恢复奖励 UI 或战斗输入
```

不要只保存最终 `actor.ATK` 或 `actor.MoveGrid`，这些是派生值。应保存奖励来源和增量，然后重新应用。

## 局结束和清理

### 失败

默认清除：

- 肉鸽装备。
- 肉鸽技能。
- 肉鸽属性增量。
- 肉鸽货币、房间和未领取奖励。

默认保留：

- 永久解锁内容。
- 最高层数。
- 奖励图鉴。
- 永久成就。

### 胜利

可以提供两种模式：

1. 奖励全部清除，只记录成绩。
2. 选择少量奖励转化为普通 RPG 金币、解锁技能或收藏装备。

### 清理顺序

```text
停止奖励 UI
  -> 关闭肉鸽监听器
  -> 卸下并删除局内装备
  -> 移除局内技能
  -> 恢复角色属性增量
  -> Game.refreshActorAttribute
  -> 清理肉鸽存档
  -> 写入胜利/失败结果
```

## 三阶段实施

### 第一阶段：事件驱动 MVP

不改战斗核心，只增加奖励 UI 和事件数据：

- 固定房间路线。
- 敌人死亡后 3 选 1。
- 固定攻击力、移动力和最大 HP 奖励。
- 用 `10003` 学技能。
- 用 `10001` 生成装备，用 `10004` 穿戴。
- 用变量记录层数、奖励和完成状态。
- 明确写入失败清理事件。

这个阶段能快速验证玩法，但 `10005` 的属性增量和 `10003` 的技能必须有回滚逻辑。

### 第二阶段：正式局内构筑层

新增 `RogueRunManager` 和独立数据结构：

- 统一奖励生成和应用。
- 追踪每一件肉鸽装备。
- 追踪本局新增技能。
- 支持中途存档和失败回滚。
- 支持角色重新绑定后的效果重放。
- 支持奖励历史和装备对比。

这是推荐的正式版本。

### 第三阶段：完整肉鸽循环

再加入：

- 随机房间路由和种子。
- 精英、事件、商店和休息房。
- Boss 多阶段。
- 构筑标签和奖励权重。
- 最终伤害倍率。
- 地图格子掉落物。
- 永久解锁和图鉴。

## 构筑方向

奖励最好有组合关系，而不只是单纯加数字：

| 构筑 | 核心奖励 | 玩法方向 |
| --- | --- | --- |
| 近战暴击 | 攻击、暴击、背后伤害 | 贴身和绕后 |
| 远程风筝 | 移动力、命中、攻击范围 | 移动后攻击 |
| 魔法循环 | 魔力、SP、技能冷却 | 高频释放技能 |
| 状态控制 | 施加状态、状态层数、状态伤害 | 持续削弱 |
| 防守反击 | 防御、减伤、反击倍率 | 牵制敌人 |
| 召唤流 | 召唤技能、行动点、队伍强化 | 多单位作战 |

奖励生成可以根据角色已有标签提高相关权重，但仍需保留跨流派奖励，避免随机结果把玩家完全锁死。

## 需要避免的错误

| 错误 | 后果 | 正确做法 |
| --- | --- | --- |
| 修改公共装备模板 | 污染所有角色和战斗 | 使用独立装备实例 |
| 肉鸽装备只进普通背包 | 失败后无法准确清理 | 记录唯一 key 和 runId |
| 直接永久修改 `increaseATK` | 失败后属性残留 | 由 `RogueStatBonus` 统一投影和回滚 |
| 直接按技能 ID 删除 | 误删原有技能 | 保存进入肉鸽前的技能快照 |
| 复用 `dropEquips` 做即时奖励 | 和普通战斗结算冲突 | 使用独立奖励表 |
| 在 `showDamage` 修改伤害 | 只改显示不改 HP | 在命中结算阶段修改 |
| 用 `GlobalTempData` 保存整局 | 刷新或读档后丢失 | 使用自定义存档 |
| 确认后才保存奖励 | 可能重复奖励 | 确认时立即写入状态 |
| 每个场景自己实现随机逻辑 | 规则不一致且难维护 | 统一由管理器和奖励表处理 |

## 测试清单

### 奖励和装备

- 敌人死亡只生成一次奖励。
- 生成的装备是独立实例，不修改公共模板。
- 奖励 UI 打开时战斗输入被暂停。
- 装备替换能正确处理旧装备。
- 技能重复和技能栏已满时有明确流程。

### 属性和战斗

- 移动力增加后，玩家和 AI 的移动范围一致。
- 攻击力、魔力和暴击变化正确。
- HP 上限变化后当前 HP 符合规则。
- 场景切换、战斗初始化和读档后效果仍在。
- 最终伤害倍率不会在普通攻击、技能、反击和状态伤害中重复计算。

### 存档和清理

- 奖励生成但未选择时读档。
- 选择奖励后、恢复战斗前读档。
- 战斗中读档。
- 进入下一房间后读档。
- 肉鸽失败后确认临时装备、技能和属性全部清除。
- 成功转化永久奖励后读档不会重复发放。

## 推荐实施顺序

```text
1. 固定一个房间，完成肉鸽入口和退出流程
2. 制作 3 选 1 奖励 UI
3. 接入 GameBattleData.EVENT_BATTLER_DEAD
4. 先实现攻击力、移动力和最大 HP 奖励
5. 接入独立装备生成和即时穿戴
6. 接入技能学习、重复技能和清理
7. 注册 RogueRun 自定义存档
8. 完成失败回滚和成功结算
9. 增加装备词条、构筑标签和奖励权重
10. 最后增加伤害倍率、随机路线和地图掉落物
```

## 最终建议

最适合当前项目的第一版是“固定场景 + 局内构筑 + 战斗中即时三选一奖励”。

第一版使用现有的 `10001`、`10003`、`10004`、`10005` 和 `GameBattleData.EVENT_BATTLER_DEAD` 验证玩法；正式版本再增加 `RogueRunManager`、`GUI_RogueReward` 和独立肉鸽存档段。这样能最大程度复用已有战斗和 UI，同时避免普通 RPG 数据被肉鸽奖励永久污染。

本方案只描述设计和实现边界。本轮不修改现有 TypeScript、JSON、资源、编译产物或工程数据。

