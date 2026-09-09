/**
 * 该文件为GameCreator编辑器自动生成的代码，请勿修改
 */
/**
* 自定义条件 1-场景对象
*/
class CustomConditionParams_1 {
    soType: number; // = 0; 场景对象
    soIndex: number; // = 0; 编号
    type: number; // = 0; 匹配
    useVar: number; // = 0; 使用变量指定
    soIndexVarID: number; // = 0; 编号
    soCustomAttr: CustomCompData; // 属性
    skillID: number; // = 1; 技能
    skillIDVarID: number; // = 1; 技能
    skillUseVar: number; // = 0; 使用变量指定
    equipID: number; // = 1; 装备
    equipIDVarID: number; // = 1; 装备
    equipUseVar: number; // = 0; 使用变量指定
    itemID: number; // = 1; 道具
    itemIDVarID: number; // = 1; 道具
    itemUseVar: number; // = 0; 使用变量指定
    statusID: number; // = 1; 状态
    statusIDVarID: number; // = 1; 状态
    statusUseVar: number; // = 0; 使用变量指定
    statusLayer: number; // = 1; 层次
    classID: number; // = 1; 职业
    classIDVarID: number; // = 1; 职业
    classUseVar: number; // = 0; 使用变量指定
    soModuleType: number; // = 0;
    soModuleAttr: CustomCompData; // 属性
    soModuleID: number; // = 1;
}
/**
* 自定义条件 2-界面
*/
class CustomConditionParams_2 {
    checkType: number; // = 0; 类别
    uiIDVarID: number; // = 1; 界面
    uiID: number; // = 1; 界面
    useVarID: number; // = 0; 使用变量指定
    type: number; // = 0;
    uiComp: { uiID: number, compName:string, compID:string, varName:string }; // 选择界面组件并指定属性
}
/**
* 自定义条件 3-系统信息
*/
class CustomConditionParams_3 {
    type: number; // = 0; 匹配名字
    systemKey: number; // = 0; 系统按键
    worldAttrName: string; // = ""; 属性名
}
/**
* 自定义条件 4-模块
*/
class CustomConditionParams_4 {
    modelData: CustomCompData; // 模块数据的布尔值属性
}
/**
* 自定义条件 5-世界
*/
class CustomConditionParams_5 {
    worldData: CustomCompData; // 世界设定的布尔值属性
}
/**
* 自定义条件 6-玩家
*/
class CustomConditionParams_6 {
    playerData: CustomCompData; // 玩家设定的布尔值属性
}
/**
* 自定义条件 7-战斗相关
*/
class CustomConditionParams_7 {
    type: number; // = 0; 类别
}
/**
* 自定义条件 8-玩家拥有
*/
class CustomConditionParams_8 {
    ownType: number; // = 0; 是否拥有
    itemID: number; // = 1; 道具
    itemIDVarID: number; // = 1; 道具
    itemUseVar: number; // = 0; 使用变量指定
    equipID: number; // = 1; 装备
    equipIDVarID: number; // = 1; 装备
    equipUseVar: number; // = 0; 使用变量指定
    actorID: number; // = 1; 角色
    actorIDVarID: number; // = 1; 角色
    actorUseVar: number; // = 0; 使用变量指定
}
/**
* 自定义条件 9-角色
*/
class CustomConditionParams_9 {
    actorCheckType: number; // = 0; 查找角色方式
    actorID: number; // = 1; 角色
    actorIDVarID: number; // = 1; 角色
    actorUseVar: number; // = 0; 使用变量指定
    actorInPartyIndex: number; // = 0; 所在队伍位置
    actorInPartyIndexVarID: number; // = 1; 所在队伍位置
    actorInPartyIndexVarIDUseVar: number; // = 0; 使用变量指定
    soType: number; // = 0; 场景对象
    soIndex: number; // = 0; 编号
    soIndexVarID: number; // = 0; 编号
    soUseVar: number; // = 0; 使用变量指定
    checkType: number; // = 0; 是否
    skillID: number; // = 1; 技能
    skillIDVarID: number; // = 1; 技能
    skillUseVar: number; // = 0; 使用变量指定
    equipID: number; // = 1; 装备
    equipIDVarID: number; // = 1; 装备
    equipUseVar: number; // = 0; 使用变量指定
    itemID: number; // = 1; 道具
    itemIDVarID: number; // = 1; 道具
    itemUseVar: number; // = 0; 使用变量指定
}
/**
* 自定义条件 10-高级条件分歧
*/
class CustomConditionParams_10 {
    opt: number; // = 0;
    debug: boolean; // = false; Debug
    isDesc: boolean; // = false; 启用备注
    desc: string; // = ""; 备注(将显示到指令短描述上)
    conditionList: DataStructure_AdvancedConditionalBranchViewer[]; // = [];
    comparison: string; // = ""; 判断方式
    compatibility: boolean; // = false; 启用兼容性
    setGameVar: boolean; // = false; 定义游戏变量
    gameVar: DataStructure_AdvancedConditionalBranchGameVar[]; // = [];
}
