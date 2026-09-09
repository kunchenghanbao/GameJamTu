# 新建玩家可操纵战斗角色指南

本文基于当前项目的 GameCreator SRPG 框架整理，说明新建一个“可以加入玩家队伍、可以在战斗中操作”的角色所需要的美术资源和配置。

## 一、框架中的角色组成

一个完整的玩家战斗角色由以下部分组成：

| 部分 | 项目中的作用 | 当前数据位置或模块 |
| --- | --- | --- |
| 角色 Actor | 角色本体、属性、等级、技能、装备、头像引用 | 自定义模块 `6`，例如 `asset/json/custom/customModule/6/cm1.json` |
| 职业 Class | 成长曲线、升级自动学习技能、职业装备限制 | 自定义模块 `7`，例如 `asset/json/custom/customModule/7/cm2.json` |
| 技能 Skill | 普攻、主动技能、范围、伤害、冷却、特效 | 自定义模块 `8` |
| 装备 Equip | 武器、头部、胸部、手部、脚部及属性加成 | 自定义模块 `9` |
| 状态 Status | 中毒、燃烧、增益、减益、控制等 | 自定义模块 `10` |
| 场景战斗者 | 把角色放到地图上，设置阵营和是否由玩家操纵 | 场景对象模块 `6`，`SoModule_Battler` |
| 玩家队伍记录 | 角色加入队伍后的等级、当前 HP/SP、技能和装备实例 | `Game.player.data.party` |

当前项目已有空槽示例：Actor `6`、职业 `6`、技能 `18` 和 `19`。行走 Avatar `6` 已被“村民小孩2”占用，小美使用未占用的行走 Avatar `77` 和战斗 Avatar `11031`。

代码中 `GameData.newModuleData(6, actorID, true)` 用角色编号创建玩家角色；战斗初始化时，场景战斗者模块通过角色的 `actor.id` 查找模块 `6` 数据。角色编号不存在时，战斗者会被移除。

## 二、需要准备的美术资源

### 2.1 必需资源

#### A. 战斗行走图 / 角色 Avatar

角色配置中的 `avatar` 是行走图资源的数字 ID；小美使用 `77`：

```text
avatar = 77
```

资源通常位于：

```text
asset/image/avatar/character/<character>/*.png
asset/image/avatar/battler/<character>/*.png
asset/json/avatar/data/avatar<ID>.json
```

一套可正常用于战棋战斗的角色，至少应有：

- `standby`：待机
- `attack`：普通攻击动作
- `release`：技能释放动作
- `hit`：受击动作
- `die`：死亡动作

根据角色是否需要特殊表现，还可以增加：

- `defense`：防御动作
- `walk`：地图非战斗行走动作
- `chant`：吟唱动作
- 其他自定义动作

项目中角色动作不是单纯按文件名自动识别，`avatar<ID>.json` 还记录了方向、动作编号、帧矩形、帧顺序、锚点、缩放和引用图片。因此导入图片后，还必须在 Avatar 数据中建立正确的动作帧配置。

#### B. 角色脸图

角色模块的 `face` 用于角色状态、战斗信息、对话或队伍 UI。例如：

```text
asset/image/picture/face/swordman/Swordman_normal.png
```

建议至少准备：

- 普通表情
- 受伤或痛苦表情
- 高兴、愤怒、悲伤、惊讶等剧情表情

如果只想让角色先能进入战斗，普通脸图是最低要求；如果要接入完整对话和状态界面，建议准备一组同尺寸、同画风的表情图。

#### C. 技能图标

角色的主动技能、普通攻击替代技能和被动技能都应有图标，路径通常为：

```text
asset/image/picture/icon/skill/<skill>.png
```

技能配置中的 `icon` 会被技能列表、战斗指令界面和角色状态界面使用。没有图标时部分界面仍可能运行，但会出现空图标或不易识别的技能项。

#### D. 技能战斗特效

技能配置可引用释放、命中、目标格和飞行物动画，资源通常位于：

```text
asset/image/animation/skill/
```

常用资源类型包括：

- `releaseAnimation`：施法或释放阶段特效
- `hitAnimation`：命中目标特效
- `targetGridAnimation`：目标格或范围提示特效
- `bulletAnimation`：箭、火球等飞行物动画

如果技能只是数值攻击，可以复用已有动画；如果是新招式，应同时新增动画资源和动画数据 ID，再把 ID 写入技能配置。

### 2.2 装备和物品资源

如果角色需要穿戴武器或装备，需要准备对应图标：

```text
asset/image/picture/icon/equipment/
```

当前装备部位由 `partID` 区分，已有类型包括：

| 部位 | `partID` 示例 | 说明 |
| --- | ---: | --- |
| 武器 | `1` | 剑、杖、弓等 |
| 头部 | `2` | 头盔、帽子 |
| 胸部 | `3` | 铠甲、衣服 |
| 手部 | `4` | 护手、盾牌 |
| 脚部 | `5` | 靴子 |

角色携带的消耗品使用：

```text
asset/image/picture/icon/item/
```

装备图标不是角色进入战斗的硬性条件，但没有装备配置时，角色不会获得装备提供的属性和特殊战斗效果。

### 2.3 可选资源

以下资源取决于角色的表现需求：

- 战斗站位标记或玩家/敌方标记
- 角色专属阴影或光效
- 角色专属受击、死亡、移动音效
- 角色专属攻击音效和技能音效
- 对话立绘或大立绘
- 角色专属粒子、光环、武器拖尾
- 特殊材质、换色或装备外观

## 三、角色 Actor 配置

应在角色数据模块 `6` 中新建一个唯一 ID。当前小美使用 Actor `6`，角色列表和分类名称需要同步更新：

```text
asset/json/custom/customModuleDataList6.json
```

实际角色数据文件按现有项目格式放在：

```text
asset/json/custom/customModule/6/cm<ID>.json

角色名称不是 Actor JSON 顶层的普通字符串，而是登记在 `customModuleDataList6.json` 的 `list` 数组和角色树节点中；职业、技能列表也采用同样的列表登记方式。
```

### 3.1 最低必填字段

| 字段 | 作用 | 建议 |
| --- | --- | --- |
| `face` | 角色脸图路径 | 指向存在的 PNG |
| `class` | 职业 ID | 指向模块 `7` 中的有效职业 |
| `avatar` | 行走图 Avatar ID | 指向有效 `avatar<ID>.json` |
| `battlerAvatar` | 战斗显示 Avatar ID | 使用与角色一致的战斗图资源 |
| `growUpEnabled` | 是否启用等级成长 | 玩家角色通常开启 |
| `MaxLv` | 等级上限 | 与职业成长配置配套 |
| `MoveGrid` | 每回合移动格数 | 根据角色定位设置 |
| `moveSpeed` | 场景移动速度 | 参考现有角色 `250` |
| `MaxHP` / `MaxSP` | 基础生命和资源 | 与成长值一起平衡 |
| `ATK` / `DEF` / `MAG` / `MagDef` | 基础战斗属性 | 与职业成长一起计算 |
| `HIT` / `DOD` / `CRIT` / `MagCrit` | 命中、闪避、暴击 | 按职业定位配置 |
| `skills` | 初始主动技能数组 | 至少放入一个可用技能 |
| `atkMode` / `atkSkill` | 普攻模式和普攻技能 | 远程或特殊普攻必须配置 |
| `takeSetting` | 是否使用角色自身的技能、装备、道具数据 | 玩家角色建议开启 |

### 3.2 玩家角色推荐配置

玩家角色通常还应配置：


- `class`：绑定职业，获得成长和职业技能。
- `growUpEnabled = true`：允许升级。
- `skills`：初始技能列表。
- `equips`：初始装备列表；也可以留空，改由背包和剧情发放。
- `items`：角色携带的道具列表。
- `selfStatus`：进入战斗时自动附加的状态。
- `selfImmuneStatus`：角色免疫的状态。
- `hitTargetStatus`：命中目标时附加的状态。
- `hitTargetSelfAddStatus`：命中目标后给自己附加的状态。
- `levelUpEvent`：升级时执行的片段事件，可选。
- `moveEvent`、`releaseEvent`、`hitEvent`、`dieEvent`：移动、释放、受击、死亡事件，可选。

角色数据中的技能、装备、物品应使用模块实例引用，而不是只填写一个无法解析的数字。最稳妥的方式是在编辑器中选择对应数据，由编辑器生成引用结构。

## 四、职业 Class 配置

职业数据在模块 `7` 中维护，例如：

```text
asset/json/custom/customModule/7/cm2.json
```

职业至少需要配置：

- `MaxHPGrow`：生命成长
- `MaxSPGrow`：资源成长
- `POWGrow` / `ENDGrow` / `MAGGrow` / `AGIGrow`：力量、防御、魔力、敏捷成长
- `needEXPGrow`：升级所需经验成长
- `equipSetting`：可装备的部位或装备类型限制
- `lvUpAutoGetSkills`：达到指定等级自动学习的技能
- `levelUpEvent`：职业升级事件，可选

角色的 `class` 必须指向已存在的职业 ID。若职业不存在，角色虽然可能被创建，但属性刷新、升级和自动学技能会出现错误或缺失。

## 五、技能 Skill 配置

技能数据在模块 `8` 中维护。每个技能需要一个唯一 ID，并在技能列表中登记。

核心字段包括：

| 字段 | 作用 |
| --- | --- |
| `icon` | 技能图标路径 |
| `intro` | 技能说明和数值文本 |
| `skillType` | 主动、被动或特殊技能类型 |
| `targetType` | 单体、范围、友方、敌方等目标类型 |
| `effectRange1` / `effectRange2A` / `effectRange2B` | 作用范围 |
| `releaseRange` | 可释放范围 |
| `totalCD` | 总冷却回合 |
| `costSP` / `costHP` | 资源消耗 |
| `costActionPower` | 是否消耗行动力 |
| `useDamage` | 是否造成伤害 |
| `damageType` | 物理或魔法等伤害类型 |
| `damageValue` | 固定伤害值 |
| `additionMultiple` | 属性倍率 |
| `elementType` | 属性类型 |
| `releaseActionID` / `releaseFrame` | 角色释放动作和触发帧 |
| `releaseAnimation` | 释放动画 ID |
| `hitAnimation` | 命中动画 ID |
| `targetGridAnimation` | 目标格动画 ID |
| `bulletAnimation` | 飞行物动画 ID |
| `addStatus` / `removeStatus` | 添加或移除状态 |
| `releaseEvent` / `hitEvent` | 技能事件，可选 |

技能被加入角色的 `skills` 数组后，才会出现在玩家战斗指令中。职业自动学技能则通过模块 `7` 的 `lvUpAutoGetSkills` 完成。

## 六、场景中放置可操纵战斗角色

只创建 Actor 数据还不够，必须在战斗场景中放置一个场景对象，并挂载场景对象模块 `6`，客户端类为：

```text
SoModule_Battler
```

场景对象至少需要：

1. 选择一个场景对象模型。
2. 设置 `moduleIDs` 包含 `6`。
3. 在模块 `6` 中设置 `battleCamp = 0`，表示玩家阵营。
4. 将 `actor` 指向新建的 Actor ID。
5. 设置 `usePlayerActors = true`，让场景中的战斗者绑定玩家队伍中的同 ID 角色。
6. 需要固定出场时设置 `mustInBattle = true`。
7. 确认 `playerCantCtrl = false`，否则角色会进入玩家阵营但不能由玩家操纵。
8. 设置场景坐标和可通行网格位置。
9. 确认场景障碍数据没有把出生格或移动范围全部封死。

### `usePlayerActors` 与额外战斗角色的区别

| 设置 | 行为 |
| --- | --- |
| `usePlayerActors = true` | 使用玩家队伍中同 ID Actor 的等级、HP、技能、装备和成长数据 |
| `usePlayerActors = false` | 使用场景对象中独立配置的 Actor 数据，通常用于敌人或临时战斗者 |
| `battleCamp = 0` | 玩家阵营 |
| `battleCamp = 1` | 敌方阵营 |
| `playerCantCtrl = true` | 玩家阵营但不能直接操作，适合剧情同行角色 |
| `mustInBattle = true` | 不能在战斗准备界面被移出战场 |

玩家角色要保持存档和队伍数据一致，优先使用 `usePlayerActors = true`。这也是当前框架将战斗者和 `Game.player.data.party` 绑定的标准路径。

## 七、让角色真正加入玩家队伍

角色配置完成后，需要通过事件或代码加入队伍。项目已有接口：

```ts
ProjectPlayer.addPlayerActorByActorID(actorID, level)
```

该接口会：

- 创建模块 `6` 的角色实例。
- 写入 `Game.player.data.party`。
- 初始化等级和属性。
- 根据职业等级自动学习技能。
- 初始化 HP/SP。
- 派发加入玩家角色事件。

新游戏默认加入角色时，应只放在新游戏初始化分支，并用 Actor ID 检查避免读档或重复初始化时再次加入。之后可以使用项目现有接口处理成长和装备：

```ts
ProjectPlayer.learnSkillBySkillID(inPartyIndex, skillID)
ProjectPlayer.wearPlayerActorEquip(inPartyIndex, equip)
ProjectPlayer.takeOffPlayerActorEquipByPartID(inPartyIndex, partID)
ProjectPlayer.increaseExpByIndex(inPartyIndex, exp)
```

不要只把角色名称添加到列表中；如果没有调用加入队伍逻辑，战斗准备界面不会把它当作玩家可用角色。

## 八、推荐的创建顺序

### 第一阶段：先做可运行原型

1. 复制一个现有玩家角色的 Actor 配置。
2. 分配新的 Actor ID。
3. 先复用现有 `avatar`、脸图、职业和技能。
4. 调整基础属性、移动格数和初始等级。
5. 通过 `addPlayerActorByActorID` 加入队伍。
6. 在一个已有战斗场景中放置玩家阵营战斗者。
7. 验证能显示、能移动、能选择、能攻击、能结束回合、能升级和读档。

### 第二阶段：替换角色美术

1. 新建角色脸图并更新 `face`。
2. 新建 Avatar 数据和动作帧。
3. 更新 `avatar` 与 `battlerAvatar`。
4. 逐个测试待机、攻击、释放、受击和死亡动作。
5. 检查角色锚点、方向、缩放和脚底位置。

### 第三阶段：补齐玩法内容

1. 新建或复制职业成长数据。
2. 新建技能和技能图标。
3. 配置释放范围、伤害公式、冷却和资源消耗。
4. 配置释放、命中、飞行物和目标格特效。
5. 新建装备、装备图标和装备限制。
6. 增加加入队伍、解锁技能、升级和剧情事件。
7. 在所有使用该角色的场景验证存档、换装、死亡和战斗准备流程。

## 九、验收清单

### 美术

- [ ] `avatar` 对应的 Avatar ID 存在。
- [ ] 行走图和战斗动作帧方向正确。
- [ ] 待机、攻击、释放、受击、死亡动作均能播放。
- [ ] `face` 文件存在且在角色界面显示正常。
- [ ] 技能图标存在。
- [ ] 技能特效、飞行物和目标格特效引用有效。
- [ ] 装备图标和物品图标存在。

### 数据

- [ ] Actor ID 唯一，并已登记到角色列表。
- [ ] Actor 的 `class` 指向有效职业。
- [ ] Actor 的 `avatar` 和 `battlerAvatar` 指向正确资源。
- [ ] 基础属性、成长属性、移动格数和最大等级已配置。
- [ ] 初始技能、普攻技能和装备引用有效。
- [ ] 技能的范围、伤害、消耗、冷却和动画已配置。
- [ ] 职业装备限制和升级自动学技能已配置。

### 场景和玩家队伍

- [ ] 场景对象挂载模块 `6`。
- [ ] `battleCamp = 0`。
- [ ] `usePlayerActors = true`。
- [ ] `playerCantCtrl = false`。
- [ ] 角色已通过队伍逻辑加入 `Game.player.data.party`。
- [ ] 出生点和移动网格可通行。
- [ ] 战斗准备界面能看到该角色。
- [ ] 角色可以被选中、移动、攻击、使用技能和结束行动。
- [ ] 切换场景、读档、升级、换装后数据仍然正确。

## 十、最小实现结论

如果目标只是先做出一个能操作的玩家战斗角色，最低组合是：

1. 一个新的 Actor 模块 `6` 数据。
2. 一个有效职业模块 `7` 引用。
3. 一个有效 `avatar` 和 `battlerAvatar`。
4. 一张有效脸图。
5. 至少一个有效普攻或主动技能。
6. 一个场景对象，挂载战斗者模块 `6`。
7. 场景模块设置为玩家阵营、绑定玩家角色且允许玩家操控。
8. 通过 `ProjectPlayer.addPlayerActorByActorID` 将角色加入队伍。

装备、专属技能特效、表情组、专属音效和高级事件都可以在最小原型通过后逐步补齐。
