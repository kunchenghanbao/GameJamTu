# GameJam 项目说明

## 结论

这是一个基于 Game Creator 的 TypeScript/JavaScript 单机 SRPG 项目，项目标题和模板描述为「SRPG-光之阵 / Formation of Light」。它把传统 RPG 的角色、装备、技能、道具、事件和存档，与网格移动、战斗阵营、技能范围、战斗 AI 结合在一起。

从现有源码和可读项目数据看，项目已经具备一套相对完整的探索、剧情事件、队伍管理和战棋战斗框架。当前仓库更像是一个带示例关卡和多套战斗场景的 Game Creator 工程，而不是只包含少量脚本的空白 Game Jam 原型。

## 项目基本信息

| 项目 | 内容 |
| --- | --- |
| 工程名 | `GameJam` |
| 游戏标题 | `SRPG-光之阵` |
| 版本 | `1.0` |
| 引擎 | Game Creator |
| 语言 | TypeScript，编译目标 ES5 |
| 运行方式 | 浏览器/HTML 运行时 |
| 游戏窗口 | `1600 x 900` |
| 地图格子 | `48 x 48` |
| 入口页面 | `Game.html` |
| TypeScript 入口 | `Game/game/GCMain.ts` |
| 工程配置 | `asset/json/config.json` |
| 工程数据 | `GameJam.gamecreator`，已启用加密数据标记 |

项目的构建脚本是 `npm run build`，实际 HTML 页面加载的是 `out/Game.js`。`GameCreatorLib/` 提供 Game Creator 运行库及 TypeScript 类型声明。

## 使用的代码和技术

这个项目不是 Unity/C# 项目，当前可见的核心代码技术如下：

| 类型 | 使用内容 | 位置 |
| --- | --- | --- |
| 主要源码 | TypeScript | `Game/game/**/*.ts` |
| 编译目标 | ES5，并使用 DOM、ES2015 类型库 | `Game/tsconfig.json` |
| 游戏运行代码 | 编译后的 JavaScript | `out/Game.js`（唯一运行入口） |
| 页面入口 | HTML + JavaScript | `Game.html` |
| 游戏引擎 | Game Creator Runtime API | `GameCreatorLib/gamecreator.js`、`GameCreatorLib/API/**/*.d.ts` |
| 游戏数据 | JSON 数据驱动 | `asset/json/**/*.json` |
| 工程数据 | Game Creator 工程数据，已标记为加密 | `GameJam.gamecreator` |
| 编辑器辅助 | JavaScript | `GameCreator/script.js`、`GameCreator/zrelease.js` |

### TypeScript 在做什么

TypeScript 是项目的主要业务代码，负责：

- 游戏启动和场景切换。
- 键盘、鼠标、手柄输入。
- 玩家移动、碰撞、接触和事件触发。
- 网格地图、障碍判断和寻路。
- 战斗回合、战斗 AI、移动、攻击、技能、道具和命中计算。
- 角色成长、队伍、背包、装备、技能和存档。
- 战斗界面、菜单、队伍界面、商店、设置和存档界面。
- Game Creator 自定义事件命令、条件、数值和字符串函数。

### JavaScript 在做什么

浏览器实际执行的是 JavaScript，而不是 TypeScript。构建后，`Game.html` 先加载运行时兼容层，再加载 `out/Game.js` 这一份项目入口。手机入口使用 `gamecreator.compat.js`（由 `tools/build_mobile_compat.js` 自动生成的 ES5 版本），桌面/编辑器仍可保留原始引擎文件用于对照。

```text
GameCreatorLib/mobile-startup-compat.js  手机启动兜底、旧 WebView API 兼容和错误面板
GameCreatorLib/gamecreator.compat.js     Game Creator ES5 运行时（手机入口）
GameCreatorLib/gamecreator.js             原始 Game Creator 运行时（保留用于更新/对照）
out/Game.js                               全部项目 TypeScript 的 ES5 汇总入口
```

`npm run build` 会依次编译项目、刷新兼容运行时，并从同一个 `Game.html` 生成 `release/mobile/assets/www/script.js` 与校验清单。通过 GameCreator 重新发布 APK 时，以该次构建的产物为准；已经安装的旧 APK 不会自动更新。若设备不支持 Web Streams，兼容层会使用带 `GCPLAIN1` 标记的本地存档回退格式。

TypeScript 编译配置还会生成声明文件和 source map，便于编辑器类型检查及从编译代码定位回 `.ts` 源码。

### JSON 和事件编辑器代码

JSON 不是传统意义上的程序源码，但在这个项目中承担了大量玩法配置：

- 地图尺寸、图层、障碍和场景对象。
- 角色、敌人、技能、状态、道具、装备和掉落。
- UI 布局和组件参数。
- 公共事件、场景事件和战斗事件。
- 世界属性、变量、开关和自定义模块。

这些数据由 Game Creator 的事件系统解释执行。事件中的命令通过数字编号调用运行时或项目自定义函数，例如战斗入口使用 `customCommand_9001` 和 `customCommand_9002`，而具体关卡流程保存在 `asset/json/server/command/` 中。

### 构建关系

```text
Game/game/**/*.ts
        |
        |  TypeScript 4.9 / tsc -b
        v
out/Game.js + *.d.ts + *.map
        |
        |  Game.html 加载唯一项目入口
        v
浏览器中的 Game Creator 游戏运行时
        |
        +-- 读取 asset/json/**/*.json
        +-- 加载 asset/image、asset/audio 等资源
        +-- 执行场景事件和战斗事件
```

因此，修改游戏逻辑时应优先修改 `Game/game/` 下的 TypeScript；修改关卡、角色、UI 或事件内容时应修改对应的 Game Creator 数据。`out/` 是生成结果，不应作为主要源码维护。

## 目录结构

| 目录/文件 | 作用 |
| --- | --- |
| `Game/game/` | 项目层 TypeScript 源码 |
| `Game/game/GCMain.ts` | 创建全局 `Game`，启动 `GameGate` |
| `Game/game/GameGate.ts` | 世界初始化、进入场景、切换场景、读档流程 |
| `Game/game/project/` | 项目核心逻辑：玩家、场景、控制器、战斗、UI |
| `Game/game/custom/` | 自定义事件命令、条件、数值/字符串、场景对象模块 |
| `Game/system/` | 项目对 Game Creator 系统运行时的扩展 |
| `asset/json/` | 可读的地图、UI、世界数据、自定义数据和命令配置 |
| `asset/image/` | 角色、地图、UI、特效等图片资源 |
| `asset/audio/` | BGM、环境音和战斗/菜单音效 |
| `asset/video/` | 视频资源，目前包含测试视频 |
| `savedata/` | 本地存档相关数据样例/缓存 |
| `out/Game.js` | TypeScript 汇总编译产物及 source map（唯一项目运行入口） |
| `release/mobile/` | 与 Game.html 同源生成的 APK `script.js` 暂存包和校验清单 |
| `GameCreatorLib/` | Game Creator 运行库和 API 声明 |
| `Game.html` | 游戏页面，加载兼容运行时和唯一项目入口 `out/Game.js` |
| `GameCreator.html` | 编辑器/运行环境相关页面 |
| `gcUserData/` | 编辑器设置、预览图、命令排序等用户数据 |

## 游戏启动流程

启动入口位于 `Game/game/GCMain.ts`：

1. 创建全局 `Game: ProjectGame` 实例。
2. 非行为编辑器模式下调用 `GameGate.start()`。
3. `GameGate` 等待 `ClientWorld.EVENT_INITED`。
4. 初始化键盘、手柄、项目工具、场景系统和设置热键。
5. 若存在一次性读档标记则先读档，否则执行公共事件 `14001`。
6. 新游戏、读档、普通换场景分别通过公共事件 `14003`、`14005`、`14011` 等进入统一的场景门流程。
7. 场景门依次执行离场准备、资源预加载、场景创建、对象恢复、背景音乐切换、入场事件。
8. 场景入场事件完成后启动 `Controller`，玩家才重新获得控制权。

`GameGate` 使用以下状态管理场景切换：

| 状态 | 含义 |
| --- | --- |
| `STATE_0` | 执行离场/新游戏/读档开始事件 |
| `STATE_1` | 加载新场景及资源 |
| `STATE_2` | 执行入场/新游戏完成/读档完成事件 |
| `STATE_3` | 场景进入完成 |
| `STATE_4` | 玩家控制开始 |

这样可以保证场景事件、资源加载、玩家控制和音乐渐变不会相互穿插。

## 地图和关卡

`asset/json/scene/sceneList.json` 中的场景树如下：

```text
示例（可删除）
├─ 开始
├─ 关卡
│  ├─ 关卡1-普通战役
│  ├─ 关卡2-BOSS1
│  ├─ 关卡3-BOSS2
│  └─ 关卡4-剧情战斗1
│     └─ 关卡4-剧情战斗2
└─ 战斗画面
   ├─ 战斗画面-野外F1
   ├─ 战斗画面-野外F2
   ├─ 战斗画面_城镇F1
   ├─ 战斗画面_城镇S1
   └─ 战斗画面_未来F1
```

配置中的默认出生信息为：

- 出生场景：场景 `2`
- 玩家对象：`玩家对象`
- 出生坐标：`(840, 504)`
- 无场景回退位置：场景 `1` 的 `(600, 600)`

从 `asset/json/server/scene/` 的对象数据可以看出当前示例内容包括：

- 场景 `5`：宝箱、野猪、恶狼、红蘑菇、史莱姆、海螺、老鼠、乌鸦、白银鸟等野外敌人/物件。
- 场景 `6`：伊斯特、哥布林队长、哥布林、Boss，以及玩家队伍角色。
- 场景 `7`：狼女、多个兔女郎敌人和 Boss。
- 场景 `8`：村长、村长夫人、盗匪、沙漠盗贼、卫兵、NPC、剧情阻挡和剧情点，明显承担城镇与剧情推进功能。
- 场景 `13`：士兵、伊斯特、菲妮罗、雷兹法普、拉芙娜和多名敌对角色，属于剧情战斗内容。

场景逻辑由 `ProjectClientScene` 和 `SceneUtils` 提供。`SceneUtils` 负责网格障碍、动态障碍、桥属性、碰撞检测、可通过位置和周边位置计算；`AstarUtils` 提供路径搜索支持。

## 探索与操作

探索控制由三类输入共同接入：

- `KeyboardControl.ts`：方向移动、键盘快捷键和网格移动。
- `MouseControl.ts`：场景对象选择、鼠标点击和目标交互。
- `GamepadControl.ts`：手柄输入。
- `Controller.ts`：统一管理玩家控制、自动移动、靠近目标、点击/接触事件和触发器执行。

探索阶段的典型交互路径是：

```text
玩家输入
  -> Controller 判断目标和距离
  -> 移动到目标附近
  -> 触发场景对象的点击/接触事件
  -> 执行 Game Creator 事件页
  -> 事件结束后恢复控制
```

`ProjectClientSceneObject` 是项目层场景对象实现，扩展了移动、朝向、跳跃、碰撞、接触记录、暂停恢复和行为队列等能力。

## 战棋战斗系统

战斗代码位于 `Game/game/project/battle/`，并由自定义事件命令接入。

### 战斗入口和结束

`Game/game/custom/CustomCommand3.ts` 中的自定义命令负责战斗生命周期：

- `customCommand_9001`：开始战斗。
- `customCommand_9002`：结束战斗，可按实际结果、强制胜利、强制失败或中断处理。
- `customCommand_9003`：修改战斗参数，例如角色死亡后是否离队、待机/准备阶段是否自动改变朝向、战斗开始是否回满状态。
- `customCommand_9004` / `9005`：增减战斗者 HP / SP。
- `customCommand_9006`：添加、移除或清空状态。
- `customCommand_9007`：显示伤害/治疗表现。
- `customCommand_9008`：战斗中生成新的战斗者。
- `customCommand_9009`：预加载战斗特写场景和 BGM。

开始战斗时会记录玩家对象的头像、移动状态、穿透、层级、阴影、速度、选择状态以及当前 BGM/BGS。战斗结束后恢复这些状态，并继续执行战斗前被暂停的事件。

### 核心模块

| 文件 | 职责 |
| --- | --- |
| `GameBattle.ts` | 战斗状态、回合阶段、阵营列表、战斗设置、存档恢复和结果 |
| `GameBattleController.ts` | 玩家战斗操作、移动/攻击/技能/道具/待机菜单和输入状态 |
| `GameBattleAction.ts` | 实际移动、普通攻击、技能、道具、弹道、动画、命中和伤害表现 |
| `GameBattleAI.ts` | 非玩家战斗者的自动决策和行动 |
| `GameBattleData.ts` | 战斗者初始化、阵营、仇恨、状态、死亡、经验和掉落奖励 |
| `GameBattleHelper.ts` | 阵营/目标/距离/范围/障碍/技能合法性等查询和计算 |
| `SoModule_Battler.ts` | 场景对象上的战斗者模块，模块 ID 为 `6` |

### 战斗操作

玩家战斗操作状态包括：

- 选择战斗者。
- 打开移动范围指示器并移动。
- 普通攻击。
- 技能选择、释放范围和效果范围选择。
- 道具使用与目标选择。
- 装备/道具交换。
- 改变朝向。
- 待机或结束当前行动。
- 查看当前战斗者和目标的状态窗口。

战斗以网格为基础，使用角色的移动格数、攻击距离、技能范围、最小距离、障碍模式和阵营关系进行判定。技能可以单体、多目标或范围作用，也支持动画信号、击中事件、状态变化、持续伤害、连击、反击和奖励结算。

### 战斗数据流程

```text
开始战斗
  -> GameBattle 初始化
  -> GameBattleData 扫描场景对象并建立阵营
  -> 初始化角色属性、状态、HP/SP、技能冷却
  -> GameBattleController / AI 接管行动
  -> GameBattleAction 执行动作与命中
  -> GameBattleData 处理伤害、状态、死亡、经验和掉落
  -> 判断胜负
  -> 结算金币、经验、道具、装备
  -> 恢复战前玩家状态并继续原事件
```

敌人死亡时会根据角色数据累计金币、经验、道具和装备掉落；玩家角色可获得经验并触发升级、技能学习和奖励界面。

## 角色、队伍、背包和成长

`ProjectPlayer.ts` 负责玩家层的 RPG 数据操作，主要包括：

- 金币增减。
- 普通道具和装备的增减。
- 独立装备实例的加入和移除。
- 队伍角色的加入、移除和初始化。
- 角色技能学习、遗忘和查询。
- 角色装备穿戴、卸下和替换。
- 角色携带道具的分配。
- 经验增加、升级和新技能学习。

`ProjectGame.ts` 负责项目层角色属性刷新和成长计算，包括等级、角色类别、成长属性、自定义属性以及暂停期间的游戏时间计算。

项目 UI 已覆盖：

- 标题/开始和通用菜单。
- 关卡选择。
- 队伍编成。
- 背包。
- 技能、装备和角色状态。
- 商店。
- 战斗准备。
- 战斗菜单、战斗技能、战斗道具和目标选择。
- 经验奖励、击杀奖励。
- 设置、存档和读档。
- 虚拟键盘。

UI 由 `GUI_Manager.ts` 统一提供列表、标签、焦点、装备品质颜色、技能/道具/状态描述和战斗信息等通用能力。`FocusButtonsManager.ts` 负责键盘、手柄和鼠标之间的 UI 焦点协调。

## 自定义事件和数据驱动方式

Game Creator 的大量玩法不是写死在 TypeScript 中，而是由 `asset/json/` 中的事件页、公共事件、UI 数据和模块数据驱动。

### 自定义命令

- `CustomCommand1.ts`：输入、界面属性、焦点、图块/动画/镜头、金币、道具、克隆场景对象、角色和装备等基础玩法扩展。
- `CustomCommand2.ts`：图片层、动画、立绘、视频、界面、等待界面关闭、BGM/BGS/音效等表现层和媒体命令。
- `CustomCommand3.ts`：战斗命令、角色/装备相关命令和部分高级玩法命令。
- `GCClound_SupporterData.ts`：Game Creator 云端支持度数据同步和防篡改逻辑，运行在受限的平台场景中。

### 自定义条件、数值和字符串

- `CustomCondition.ts`：场景对象、模块、UI、系统状态、世界属性、玩家属性、战斗状态、玩家拥有物和角色技能/装备/道具等条件判断。
- `CustomGameNumber.ts`：角色属性、战斗数据、背包、地图、变量和其他项目数值读取。
- `CustomGameString.ts`：角色、物品、地图、变量和界面相关字符串读取。

这些扩展使事件编辑器可以直接访问战斗者、阵营、状态、UI 和玩家数据，而无需把所有剧情逻辑写入单独的 TypeScript 类。

## 自定义场景对象模块

项目额外注册了以下场景对象模块：

| 模块 | 作用 |
| --- | --- |
| `SoModule_AvatarMaterial` | 角色头像材质/显示效果扩展 |
| `SoModule_CustomCollision` | 矩形、圆形和自定义多边形碰撞范围 |
| `SoModule_Battler` | 战斗者角色绑定、阵营、状态、仇恨和战斗标记 |
| `SoModule_LightShadow` | 动态光照和阴影表现 |
| `SoModule_Shadow` | 场景对象阴影绘制 |

其中自定义碰撞模块会结合场景障碍和桥属性工作；光影模块则为探索和战斗场景提供额外表现。

## 存档系统

存档入口在 `GUI_SaveFileManager.ts`，底层使用 Game Creator 的 `SinglePlayerGame`。

当前设计支持：

- 多存档位。
- 存档截图、地图名、游戏时间和保存日期。
- 存档成功/失败事件。
- 读档失败事件。
- 游戏内读档时通过一次性本地标记刷新页面后恢复。
- 场景对象、独立开关和项目自定义数据恢复。
- 战斗中的阵营、战斗者索引、战斗结果和玩家角色绑定数据恢复。

项目自定义存档数据至少包括场景层数据，以及战斗前玩家状态和战斗状态。场景切换时使用 `ProjectClientScene` 注册自定义保存/恢复逻辑。

## 资源规模

按当前 `asset/` 目录静态统计：

| 类型 | 数量 |
| --- | ---: |
| JSON | 1,804 |
| PNG | 1,727 |
| OGG | 345 |
| JPG | 30 |
| MP4 | 1 |
| TTF | 1 |
| 合计 | 3,908 |

资源总大小约为 `322 MB`。主要内容包括角色头像、地图图块、UI、动画、战斗特效、BGM、环境声和战斗音效。默认字体是 `Source_Han_Sans`。

## 运行和维护重点

### 修改源码后的编译关系

修改 `Game/game/**/*.ts` 后，应该执行 `npm run build`，使 `out/Game.js` 和 `release/mobile/assets/www/script.js` 与源码保持一致。HTML 页面引用的是编译产物，浏览器不会直接执行 `Game/game/` 中的 TypeScript。

### 修改关卡或 UI 数据的位置

优先检查以下目录：

- 场景地图和场景对象：`asset/json/scene/`
- UI 模板：`asset/json/ui/` 和 `asset/json/server/ui/`
- 公共事件和命令数据：`asset/json/server/command/`
- 世界属性和全局设置：`asset/json/custom/customWorldData.json`、`customWorldSetting.json`
- 角色、技能、道具、装备等模块数据：`asset/json/custom/customModule/`
- 场景对象模块配置：`asset/json/scene/sceneObjectModule/`

### 需要同时理解的两层逻辑

1. TypeScript 层决定引擎如何运行：输入、场景切换、战斗计算、UI 行为、存档和自定义命令。
2. JSON/工程数据层决定具体内容：角色、地图、敌人、事件页、UI 布局、技能参数和关卡流程。

只读 TypeScript 而不看 `asset/json/`，无法还原完整剧情和具体关卡；只看 JSON 而不看 TypeScript，也无法解释战斗和输入的运行方式。

## 当前阅读边界

- 本说明基于源码、HTML 引用关系、配置文件、场景树和可读 JSON 数据完成静态分析。
- `GameJam.gamecreator` 的数据标记为加密，无法仅通过该文件直接阅读完整编辑器工程内容；可读运行数据主要位于 `asset/json/`。
- 没有在本次整理中启动游戏或执行完整通关测试，因此不能据此确认每个事件页都能从头到尾正常执行。
- `out/` 是编译产物，排查逻辑时应优先阅读 `Game/game/` 源码。
- 事件公共命令大量使用数字编号，例如 `140xx`、`150xx`；这些编号的具体文本和流程需要结合 `asset/json/server/command/` 中的事件数据确认。

## 关键入口速查

| 目标 | 首先阅读 |
| --- | --- |
| 游戏如何启动 | `Game/game/GCMain.ts`、`Game/game/GameGate.ts` |
| 玩家移动和交互 | `Game/game/project/controller/Controller.ts`、`KeyboardControl.ts`、`MouseControl.ts` |
| 地图障碍和寻路 | `Game/game/project/scene/SceneUtils.ts`、`AstarUtils.ts` |
| 战斗流程 | `Game/game/project/battle/GameBattle.ts`、`GameBattleController.ts` |
| 战斗伤害和动画 | `Game/game/project/battle/GameBattleAction.ts`、`GameBattleData.ts` |
| 战斗合法性和范围 | `Game/game/project/battle/GameBattleHelper.ts` |
| 玩家数据 | `Game/game/project/ProjectPlayer.ts`、`ProjectGame.ts` |
| 存档和读档 | `Game/game/project/ui/manager/GUI_SaveFileManager.ts` |
| UI 通用逻辑 | `Game/game/project/ui/manager/GUI_Manager.ts` |
| 事件扩展 | `Game/game/custom/CustomCommand1.ts`、`CustomCommand2.ts`、`CustomCommand3.ts` |
| 条件/数值/字符串扩展 | `Game/game/custom/CustomCondition.ts`、`CustomGameNumber.ts`、`CustomGameString.ts` |
