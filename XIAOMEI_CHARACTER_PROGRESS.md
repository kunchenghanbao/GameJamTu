# 小美角色制作进度

更新时间：2026-08-21

## 2026-08-24 局内单帧待机修正

原 `Xiaomei_standby.png` 错误地将同一个正面姿势复制到四个方向，导致角色静止后无论朝向如何都会显示正面。现从已经校正朝向的 `Xiaomei_walk_v4.png` 每行提取首帧，生成：

```text
asset/image/avatar/character/xiaomei/Xiaomei_standby_v2.png
```

`avatar77` 已切换到该资源；上、左、右、下四个单帧待机现在分别使用对应方向，尺寸仍为 `48 x 384`，不改变现有动作表配置。

## 2026-08-21 局内战斗美术统一

小美原 `_v2` 战斗动画属于高像素格斗风，与剑士、法师等主角的细腻二次元战斗立绘不一致。本次保留全部 `_v2` 原文件，新增并接入 `_v3`：

```text
asset/image/avatar/battler/xiaomei/Xiaomei_standby_v3.png
asset/image/avatar/battler/xiaomei/Xiaomei_attack_v3.png
asset/image/avatar/battler/xiaomei/Xiaomei_release_v3.png
asset/image/avatar/battler/xiaomei/Xiaomei_die_v3.png
asset/image/avatar/battler/xiaomei/Xiaomei_hit_v3.png
asset/image/avatar/battler/xiaomei/Xiaomei_defense_v3.png
```

生成母版与最终提示词保存在：

```text
output/imagegen/xiaomei/Xiaomei_battler_pose_board_v4.png
output/imagegen/xiaomei/Xiaomei_battler_pose_board_v4.prompt.txt
```

母版由 `gpt-image-2` CLI 编辑模式生成，输入图分别只承担角色设定、姿势参考和项目内画风参考。正式动作表由 `tools/build_xiaomei_battler_sheets.py` 去除绿幕、裁切并导出为 `13 x 220x220` RGBA 帧；`avatar11031` 已切换至 `_v3`。

## 当前决定

小美后续使用项目已有的 HoodieGirl 视觉资源作为制作基准，主要参考文件为：

```text
asset/image/picture/face/hoodieGirl/HoodieGirl_fullbody.png
```

小美正式资源以 HoodieGirl 全身图为基准，保持项目现有像素风、透明背景和角色比例。此前生成的独立原画只保留作备选参考，不接入角色配置。

## 已完成的项目核对

- 角色 Actor 数据位：`6`
- 职业数据位：`6`
- 主角技能数据位：`18`、`19`
- 行走图 Avatar 数据位：`77`（原 Avatar `6` 已用于村民小孩2）
- 战斗 Avatar 建议使用新 ID：`11031`
- 角色配置位置：`asset/json/custom/customModule/6/cm6.json`
- 职业配置位置：`asset/json/custom/customModule/7/cm6.json`
- 技能配置位置：`asset/json/custom/customModule/8/cm18.json`、`cm19.json`
- 行走 Avatar 配置：`asset/json/avatar/data/avatar77.json`
- 战斗 Avatar 配置建议：`asset/json/avatar/data/avatar11031.json`

项目中的角色配置采用 `attrs` 包装字段，Actor 的 `skills` 和 `atkSkill` 使用嵌入式技能数据引用，不能只写技能数字。

## 已生成但未接入的原稿

以下文件位于临时输出目录，尚未复制到正式资源目录，也没有被任何 JSON 引用：

```text
output/imagegen/xiaomei/Xiaomei_fullbody_raw.png
output/imagegen/xiaomei/Xiaomei_skill_icons_raw.png
```

本次使用 `gpt-image-2` 基于 HoodieGirl 生成的动作参考表：

```text
output/imagegen/xiaomei/Xiaomei_character_actions_raw_v3.png
output/imagegen/xiaomei/Xiaomei_character_actions_transparent_v3.png
output/imagegen/xiaomei/Xiaomei_battle_actions_raw_v3.png
output/imagegen/xiaomei/Xiaomei_battle_actions_transparent_v3.png
```

其中行走动作表实际尺寸为 `1254x1254`，战斗动作表实际尺寸为 `1536x1024`；透明版本为 RGBA。

它们不作为小美的正式资源方案；正式资源已按 HoodieGirl 全身图派生并接入项目。

## 已接入的美术资源

正式资源路径如下：

以 `HoodieGirl_fullbody.png` 为源，按项目现有尺寸和动作表制作小美资源：

```text
asset/image/avatar/character/xiaomei/Xiaomei_standby.png
asset/image/avatar/character/xiaomei/Xiaomei_walk.png
asset/image/avatar/character/xiaomei/Xiaomei_attack.png
asset/image/avatar/character/xiaomei/Xiaomei_die.png

asset/image/avatar/battler/xiaomei/Xiaomei_standby.png
asset/image/avatar/battler/xiaomei/Xiaomei_attack.png
asset/image/avatar/battler/xiaomei/Xiaomei_release.png
asset/image/avatar/battler/xiaomei/Xiaomei_hit.png
asset/image/avatar/battler/xiaomei/Xiaomei_die.png

asset/image/picture/face/xiaomei/Xiaomei_normal.png
asset/image/picture/icon/skill/Xiaomei_punch.png
asset/image/picture/icon/skill/Xiaomei_spin_kick.png
```

当前资源按现有 Avatar 帧规格制作，透明通道、尺寸和引用路径均已检查通过。动作帧目前是稳定的静态派生帧，可正常作为占位版本使用；后续可用完整动作原稿替换，不需要调整角色或 Avatar ID。

## 已接入的数据配置

- 复制现有近战玩家角色，写入 Actor `6`。
- 将 Actor `6` 绑定职业 `6`、行走 Avatar `77`、战斗 Avatar `11031`。
- 将初始主动技能设置为技能 `18`“小美·重拳”。
- 将技能 `19`“小美·旋身踢”配置为职业升级自动学习技能。
- 设置小美的基础生命、攻击、防御、命中和移动格数。
- 在 `customModuleDataList6.json`、`customModuleDataList7.json`、`customModuleDataList8.json` 中同步名称。
- 在 `avatarList.json` 中登记 Avatar `77` 和 `11031` 的名称。

## 玩家队伍加入

小美已在新游戏初始化阶段加入玩家队伍，使用项目已有接口：

```ts
ProjectPlayer.addPlayerActorByActorID(6, 1)
```

加入逻辑只发生在新游戏流程，并通过 Actor ID 检查避免重复加入；读档不会再次添加。

## 已完成的验证

- JSON 文件可以正常解析。
- Actor `6`、职业 `6`、技能 `18` 和 `19` 均能从对应模块加载。
- Avatar `77` 和 `11031` 的图片路径存在，帧矩形与图片尺寸一致。
- 已核对新游戏初始化使用 Actor ID 去重，读档流程不会重复添加。
- 已核对行走和战斗 Avatar 的帧表引用与图片尺寸匹配。
- 创建指南 `PLAYER_BATTLE_CHARACTER_CREATION_GUIDE.md` 按实际配置补充 `avatar` 与 `battlerAvatar` 的区别，以及当前实际使用的模块列表结构。

## 尚未在编辑器中完成的验证

- 尚未在编辑器中实际启动新游戏确认队伍界面显示。
- 尚未在具体战斗场景中逐项点击验证移动、普攻、两个技能、受击和死亡动作。
- 当前暂未新增专门的战斗场景战斗者对象；小美作为玩家队伍角色，仍由现有战斗流程创建。

## 图像生成记录

2026-08-18 使用 `gpt-image-1.5` 时接口返回 HTTP 403，确认当前 API key 没有该模型权限。经确认改用有权限的 `gpt-image-2` 后，已成功生成行走/攻击/受伤/倒地动作表，以及战斗待机/攻击/释放/受击/防御/倒地动作表；再使用 Pillow 去除纯色背景，生成了对应 RGBA 版本。原有正式资源未被覆盖。

## 修改范围

- 已修改 Actor、职业、技能和 Avatar JSON。
- 已在新游戏初始化代码中加入小美，未修改读档流程。
- 已将 HoodieGirl 派生图片写入正式资源目录。
- 未修改已有场景和战斗场景。
- 未修改其他角色、技能、装备或关卡文件。
