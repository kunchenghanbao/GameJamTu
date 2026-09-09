/**
 * 该文件为GameCreator编辑器自动生成的代码，请勿修改
 */
/**
* 自定义游戏数值 1-场景
*/
class CustomGameNumberParams_1 {
    type: number; // = 0; 当前场景
    isGrid: boolean; // = false; 格子坐标
    dataGridIndex: number; // = 0;
    dynamicObs: boolean; // = false; 计算动态障碍
    dataGridUseVar: number; // = 0; 使用变量
    x: number; // = 0; 格子坐标x
    y: number; // = 0; 格子坐标y
    x2: number; // = 0; 格子坐标x
    y2: number; // = 0; 格子坐标y
    dataLayerSoType: number; // = 0; 对象
    dataLayerSoUseVar: number; // = 0; 使用变量指定
    dataLayerSoVarID: number; // = 0; 编号
    dataLayerSoIndex: number; // = 0; 编号
    cameraAttr: number; // = 0; 属性
}
/**
* 自定义游戏数值 2-场景对象
*/
class CustomGameNumberParams_2 {
    type: number; // = 0; 属性
    posMode: number; // = 0; 坐标模式
    customAttr: CustomCompData; // 属性
    soType: number; // = 0; 对象
    useVar: number; // = 0; 使用变量指定
    no: number; // = 0; 编号
    varID: number; // = 0; 编号
    soModuleAttr: CustomCompData; // 属性
    actorAttrName: number; // = 0; 角色属性
    actorCustomAttr: CustomCompData; // 属性名
    trend: boolean; // = false; 变化趋势
    extendAttribute: number; // = 1; 属性
}
/**
* 自定义游戏数值 3-场景对象关系
*/
class CustomGameNumberParams_3 {
    soType1: number; // = 0; 对象B
    soType2: number; // = 0; 对象A
    type: number; // = 0; 关系
    no1: number; // = 0; 编号
    useVar1: number; // = 0; 使用变量指定
    useVar2: number; // = 0; 使用变量指定
    varID1: number; // = 0; 编号
    no2: number; // = 0; 编号
    varID2: number; // = 0; 编号
    isGrid: boolean; // = false; 格子坐标
}
/**
* 自定义游戏数值 4-玩家
*/
class CustomGameNumberParams_4 {
    type: number; // = 0; 属性
    itemID: number; // = 1; 道具
    playerData: CustomCompData; // 属性名
    actorCheckType: number; // = 0; 获取角色方式
    actorID: number; // = 1; 角色
    actorIDVarID: number; // = 1; 角色
    actorUseVar: number; // = 0; 使用变量指定
    actorInPartyIndex: number; // = 0; 所在队伍位置
    actorInPartyIndexVarID: number; // = 1; 所在队伍位置
    actorInPartyIndexVarIDUseVar: number; // = 0; 使用变量指定
    actorAttrName: number; // = 0; 属性
    actorCustomAttr: CustomCompData; // 属性名
    trend: boolean; // = false; 变化趋势
    extendAttribute: number; // = 1; 属性
}
/**
* 自定义游戏数值 5-界面
*/
class CustomGameNumberParams_5 {
    type: number; // = 0;
    uiComp: { uiID: number, compName:string, compID:string, varName:string }; // 选择界面组件并指定属性
    uiAttrName: string; // = ""; 界面的属性名
    uiID: number; // = 0; 界面
    useVarID: number; // = 0; 使用变量指定界面
    uiIDVarID: number; // = 0; 界面
}
/**
* 自定义游戏数值 6-鼠键
*/
class CustomGameNumberParams_6 {
    type: number; // = 0;
    isGrid: boolean; // = false; 格子坐标
    pointKeyboard: number; // = 0; 按键
}
/**
* 自定义游戏数值 7-模块
*/
class CustomGameNumberParams_7 {
    modelData: CustomCompData; // 模块指定数据的数值属性
}
/**
* 自定义游戏数值 8-世界
*/
class CustomGameNumberParams_8 {
    worldData: CustomCompData; // 世界设定的数值属性
    type: number; // = 0; 类型
    presetType: number; // = 0; 类型
}
/**
* 自定义游戏数值 9-其他
*/
class CustomGameNumberParams_9 {
    normalNumber: number; // = 0; 常用数值
}
/**
* 自定义游戏数值 10-战斗
*/
class CustomGameNumberParams_10 {
    type: number; // = 0; 检查项
}
/**
* 自定义游戏数值 11-作用目标
*/
class CustomGameNumberParams_11 {
    inBattleType: number; // = 0;
    type1: number; // = 0;
    type2: number; // = 0;
    isGrid: boolean; // = true; 格子坐标
}
/**
* 自定义游戏数值 12-伤害计算
*/
class CustomGameNumberParams_12 {
    type: number; // = 0;
    skill: CustomCompData;
    status: CustomCompData; // 状态
    item: CustomCompData; // 道具
    extendAttribute: number; // = 1;
    attributeType: number; // = 0; 扩展属性
}
