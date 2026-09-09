/**
 * 该文件为GameCreator编辑器自动生成的代码，请勿修改
 */

/**
 * 1-标题界面 [BASE]
 */
class GUI_1 extends GUI_BASE {
   标题背景:UIBitmap;
   动画:UIAnimation;
   LOGO装饰:UIBitmap;
   底部装饰:UIBitmap;
   装饰三角1:UIBitmap;
   装饰三角2:UIBitmap;
   装饰三角3:UIBitmap;
   游戏标题:UIString;
   开始游戏按钮:UIButton;
   读取存档按钮:UIButton;
   游戏设置按钮:UIButton;
   退出游戏按钮:UIButton;
   constructor(){
      super(1);
   }
}
class ListItem_1 extends UIListItemData {
   标题背景:string;
   动画:number;
   LOGO装饰:string;
   底部装饰:string;
   装饰三角1:string;
   装饰三角2:string;
   装饰三角3:string;
   游戏标题:string;

}

/**
 * 2-读档界面 [BASE]
 */
class GUI_2 extends GUI_BASE {
   背景:UIBitmap;
   滚动条背景:UIBitmap;
   list:UIList; // Item=1001
   滚动条框:UIBitmap;
   标题背景:UIBitmap;
   界面标题:UIString;
   底部文字背景:UIBitmap;
   底部文字:UIString;
   关闭读档界面按钮:UIButton;
   关闭标志:UIBitmap;
   constructor(){
      super(2);
   }
}
class ListItem_2 extends UIListItemData {
   背景:string;
   滚动条背景:string;
   list:UIListItemData[];
   滚动条框:string;
   标题背景:string;
   界面标题:string;
   底部文字背景:string;
   底部文字:string;
   关闭标志:string;
}

/**
 * 3-菜单界面 [BASE]
 */
class GUI_3 extends GUI_BASE {
   界面背景:UIBitmap;
   背包按钮:UIButton;
   队伍编成按钮:UIButton;
   存档按钮:UIButton;
   读档按钮:UIButton;
   设置按钮:UIButton;
   返回标题按钮:UIButton;
   返回游戏按钮:UIButton;
   菜单文本:UIString;
   constructor(){
      super(3);
   }
}
class ListItem_3 extends UIListItemData {
   界面背景:string;
   菜单文本:string;
}

/**
 * 4-背包界面 [BASE]
 */
class GUI_4 extends GUI_BASE {
   背景:UIBitmap;
   界面背景1:UIBitmap;
   界面背景2:UIBitmap;
   界面装饰:UIBitmap;
   界面花纹:UIBitmap;
   货币栏背景:UIBitmap;
   滚动条背景:UIBitmap;
   list:UIList; // Item=1002
   滚动条框:UIBitmap;
   关闭背包界面按钮:UIButton;
   关闭标志:UIBitmap;
   itemName:UIString;
   玩家金币数:UIString;
   货币图片:UIBitmap;
   我的金币文本:UIString;
   标题背景:UIBitmap;
   界面标题:UIString;
   底部文字背景:UIBitmap;
   底部文字:UIString;
   itemIntroRoot:UIRoot;
   itemIntro:UIString;
   分割线:UIBitmap;
   targetUI:GUI_TargetActor;
   constructor(){
      super(4);
   }
}
class ListItem_4 extends UIListItemData {
   背景:string;
   界面背景1:string;
   界面背景2:string;
   界面装饰:string;
   界面花纹:string;
   货币栏背景:string;
   滚动条背景:string;
   list:UIListItemData[];
   滚动条框:string;
   关闭标志:string;
   itemName:string;
   货币图片:string;
   我的金币文本:string;
   标题背景:string;
   界面标题:string;
   底部文字背景:string;
   底部文字:string;
   itemIntro:string;
   分割线:string;
   targetUI:number;
}

/**
 * 5-存档界面 [BASE]
 */
class GUI_5 extends GUI_BASE {
   背景:UIBitmap;
   滚动条背景:UIBitmap;
   list:UIList; // Item=1001
   滚动条框:UIBitmap;
   标题背景:UIBitmap;
   界面标题:UIString;
   关闭存档界面按钮:UIButton;
   关闭标志:UIBitmap;
   底部文字背景:UIBitmap;
   底部文字:UIString;
   constructor(){
      super(5);
   }
}
class ListItem_5 extends UIListItemData {
   背景:string;
   滚动条背景:string;
   list:UIListItemData[];
   滚动条框:string;
   标题背景:string;
   界面标题:string;
   关闭标志:string;
   底部文字背景:string;
   底部文字:string;
}

/**
 * 6-系统设置 [BASE]
 */
class GUI_6 extends GUI_BASE {
   背景:UIBitmap;
   装饰:UIBitmap;
   界面背景1:UIBitmap;
   界面背景2:UIBitmap;
   界面装饰:UIBitmap;
   界面花纹:UIBitmap;
   标题背景:UIBitmap;
   界面标题:UIString;
   typeTab:UITabBox;
   常规:UIRoot;
   bgmFocus:UIButton;
   bgsFocus:UIButton;
   seFocus:UIButton;
   tsFocus:UIButton;
   battleSceneFocus:UIButton;
   播放战斗画面:UIString;
   播放战斗画面开关:UICheckBox;
   bgm滑条框:UIBitmap;
   bgmSlider:UISlider;
   bgs滑条框:UIBitmap;
   bgsSlider:UISlider;
   se滑条框:UIBitmap;
   seSlider:UISlider;
   ts滑条框:UIBitmap;
   tsSlider:UISlider;
   背景音乐音量文本:UIString;
   环境音效音量文本:UIString;
   音效音量文本:UIString;
   语音音量文本:UIString;
   键盘控制:UIRoot;
   键盘滚动条背景:UIBitmap;
   keyboardList:UIList; // Item=1018
   keyboardReset:UIButton;
   键盘滚动条框:UIBitmap;
   手柄控制:UIRoot;
   手柄滚动条背景:UIBitmap;
   gamepadList:UIList; // Item=1019
   gamepadReset:UIButton;
   手柄滚动条框:UIBitmap;
   关闭系统设置界面按钮:UIButton;
   关闭标志:UIBitmap;
   needInputKeyPanel:UIBitmap;
   needInputKeyLabel:UIString;
   底部文字背景:UIBitmap;
   底部文字:UIString;
   constructor(){
      super(6);
   }
}
class ListItem_6 extends UIListItemData {
   背景:string;
   装饰:string;
   界面背景1:string;
   界面背景2:string;
   界面装饰:string;
   界面花纹:string;
   标题背景:string;
   界面标题:string;
   typeTab:string;
   播放战斗画面:string;
   播放战斗画面开关:boolean;
   bgm滑条框:string;
   bgmSlider:number;
   bgs滑条框:string;
   bgsSlider:number;
   se滑条框:string;
   seSlider:number;
   ts滑条框:string;
   tsSlider:number;
   背景音乐音量文本:string;
   环境音效音量文本:string;
   音效音量文本:string;
   语音音量文本:string;
   键盘滚动条背景:string;
   keyboardList:UIListItemData[];
   键盘滚动条框:string;
   手柄滚动条背景:string;
   gamepadList:UIListItemData[];
   手柄滚动条框:string;
   关闭标志:string;
   needInputKeyPanel:string;
   needInputKeyLabel:string;
   底部文字背景:string;
   底部文字:string;
}

/**
 * 7-文本输入界面 [BASE]
 */
class GUI_7 extends GUI_BASE {
   界面背景1:UIBitmap;
   界面背景2:UIBitmap;
   界面装饰:UIBitmap;
   界面花纹:UIBitmap;
   内容底衬:UIBitmap;
   输入框背景:UIBitmap;
   input:UIInput;
   提交文本输入按钮:UIButton;
   constructor(){
      super(7);
   }
}
class ListItem_7 extends UIListItemData {
   界面背景1:string;
   界面背景2:string;
   界面装饰:string;
   界面花纹:string;
   内容底衬:string;
   输入框背景:string;
   input:string;

}

/**
 * 8-数字输入界面 [BASE]
 */
class GUI_8 extends GUI_BASE {
   界面背景1:UIBitmap;
   界面背景2:UIBitmap;
   界面装饰:UIBitmap;
   界面花纹:UIBitmap;
   内容底衬:UIBitmap;
   输入框背景:UIBitmap;
   input:UIInput;
   提交数字输入按钮:UIButton;
   constructor(){
      super(8);
   }
}
class ListItem_8 extends UIListItemData {
   界面背景1:string;
   界面背景2:string;
   界面装饰:string;
   界面花纹:string;
   内容底衬:string;
   输入框背景:string;
   input:string;

}

/**
 * 9-密码输入界面 [BASE]
 */
class GUI_9 extends GUI_BASE {
   界面背景1:UIBitmap;
   界面背景2:UIBitmap;
   界面装饰:UIBitmap;
   界面花纹:UIBitmap;
   内容底衬:UIBitmap;
   输入框背景:UIBitmap;
   input:UIInput;
   提交密码输入按钮:UIButton;
   constructor(){
      super(9);
   }
}
class ListItem_9 extends UIListItemData {
   界面背景1:string;
   界面背景2:string;
   界面装饰:string;
   界面花纹:string;
   内容底衬:string;
   输入框背景:string;
   input:string;

}

/**
 * 10-游戏结束界面 [BASE]
 */
class GUI_10 extends GUI_BASE {
   半透明背景:UIBitmap;
   底部装饰:UIBitmap;
   盈光草标志:UIBitmap;
   GameOver文本:UIString;
   constructor(){
      super(10);
   }
}
class ListItem_10 extends UIListItemData {
   半透明背景:string;
   底部装饰:string;
   盈光草标志:string;
   GameOver文本:string;
}

/**
 * 11-商店界面 [BASE]
 */
class GUI_11 extends GUI_BASE {
   背景:UIBitmap;
   装饰:UIBitmap;
   界面背景1:UIBitmap;
   界面背景2:UIBitmap;
   界面花纹:UIBitmap;
   界面装饰:UIBitmap;
   界面背景3:UIBitmap;
   界面装饰2:UIBitmap;
   分割线:UIBitmap;
   goodsListBox:UIBitmap;
   文本_商品名称:UIString;
   文本_价格:UIString;
   文本_数量:UIString;
   文本_持有数量:UIString;
   滚动条背景:UIBitmap;
   goodsList:UIList; // Item=1003
   sellItemList:UIList; // Item=1003
   滚动条框:UIBitmap;
   说明栏背景:UIBitmap;
   buyBox:UIRoot;
   buyBoxArea:UIRoot;
   购买弹窗背景:UIBitmap;
   购买弹窗花纹:UIBitmap;
   确认底衬:UIBitmap;
   buyNum_text:UIString;
   sellNum_text:UIString;
   subNumBtn:UIButton;
   减号:UIBitmap;
   addNumBtn:UIButton;
   加号:UIBitmap;
   maxNumBtn:UIButton;
   购买数量背景纹路:UIBitmap;
   buyNum:UIString;
   sureBtn:UIButton;
   cancelBtn:UIButton;
   itemBox:UIBitmap;
   itemName:UIString;
   itemIntroRoot:UIRoot;
   itemIntro:UIString;
   货币栏背景:UIBitmap;
   goldNum:UIString;
   标题背景:UIBitmap;
   界面标题:UIString;
   closeBtn:UIButton;
   关闭标志:UIBitmap;
   typeTab:UITabBox;
   我的金币文本:UIString;
   货币图片:UIBitmap;
   底部文字背景:UIBitmap;
   底部文字:UIString;
   constructor(){
      super(11);
   }
}
class ListItem_11 extends UIListItemData {
   背景:string;
   装饰:string;
   界面背景1:string;
   界面背景2:string;
   界面花纹:string;
   界面装饰:string;
   界面背景3:string;
   界面装饰2:string;
   分割线:string;
   goodsListBox:string;
   文本_商品名称:string;
   文本_价格:string;
   文本_数量:string;
   文本_持有数量:string;
   滚动条背景:string;
   goodsList:UIListItemData[];
   sellItemList:UIListItemData[];
   滚动条框:string;
   说明栏背景:string;
   购买弹窗背景:string;
   购买弹窗花纹:string;
   确认底衬:string;
   buyNum_text:string;
   sellNum_text:string;
   减号:string;
   加号:string;
   购买数量背景纹路:string;
   buyNum:string;
   itemBox:string;
   itemName:string;
   itemIntro:string;
   货币栏背景:string;
   标题背景:string;
   界面标题:string;
   关闭标志:string;
   typeTab:string;
   我的金币文本:string;
   货币图片:string;
   底部文字背景:string;
   底部文字:string;
}

/**
 * 12-虚拟按键 [BASE]
 */
class GUI_12 extends GUI_BASE {
   容器:UIRoot;
   A:UIButton;
   B:UIButton;
   START:UIButton;
   BACK:UIButton;
   rockerBg:UIBitmap;
   上标识:UIBitmap;
   右标识:UIBitmap;
   下标识:UIBitmap;
   左标识:UIBitmap;
   rocker:UIBitmap;
   dirBtnRoot:UIRoot;
   上按钮:UIButton;
   下按钮:UIButton;
   左按钮:UIButton;
   右按钮:UIButton;
   隐藏按键:UIButton;
   constructor(){
      super(12);
   }
}
class ListItem_12 extends UIListItemData {
   rockerBg:string;
   上标识:string;
   右标识:string;
   下标识:string;
   左标识:string;
   rocker:string;

}

/**
 * 13-计时器 [BASE]
 */
class GUI_13 extends GUI_BASE {
   界面背景2:UIBitmap;
   time:UIString;
   constructor(){
      super(13);
   }
}
class ListItem_13 extends UIListItemData {
   界面背景2:string;
   time:string;
}

/**
 * 14-预留 [BASE]
 */
class GUI_14 extends GUI_BASE {

   constructor(){
      super(14);
   }
}
class ListItem_14 extends UIListItemData {

}

/**
 * 15-预留 [BASE]
 */
class GUI_15 extends GUI_BASE {

   constructor(){
      super(15);
   }
}
class ListItem_15 extends UIListItemData {

}

/**
 * 16-队伍编成 [BASE]
 */
class GUI_16 extends GUI_BASE {
   背景:UIBitmap;
   底部文字背景:UIBitmap;
   actorPanel:UIBitmap;
   actorList:UIList; // Item=1011
   人物属性背景:UIBitmap;
   界面背景1:UIBitmap;
   界面背景2:UIBitmap;
   界面装饰:UIBitmap;
   界面花纹:UIBitmap;
   内容底衬:UIBitmap;
   actorBattler:UIAvatar;
   actorName:UIString;
   职业底衬:UIBitmap;
   classIcon:UIBitmap;
   等级经验容器:UIRoot;
   经验条底部:UIBitmap;
   actorExpSlider:UISlider;
   经验条框:UIBitmap;
   actorClass:UIString;
   LevelRoot:UIRoot;
   actorLv:UIString;
   Level:UIString;
   EXP:UIString;
   NEXT_EXP:UIString;
   EXP_Mid:UIString;
   属性显示容器:UIRoot;
   文本Label:UIRoot;
   生命Label:UIString;
   魔法Label:UIString;
   攻击力Label:UIString;
   防御力Label:UIString;
   魔力Label:UIString;
   魔法防御力Label:UIString;
   命中Label:UIString;
   躲避Label:UIString;
   行动速度Label:UIString;
   暴击率Label:UIString;
   魔法暴击率Label:UIString;
   扩展属性_1_文本:UIString;
   扩展属性_2_文本:UIString;
   属性Label:UIRoot;
   HP:UIString;
   MAXHP:UIString;
   HP_Mid:UIString;
   SP:UIString;
   MAXSP:UIString;
   SP_Mid:UIString;
   攻击力:UIString;
   扩展属性_1:UIString;
   防御力:UIString;
   魔力:UIString;
   魔法防御力:UIString;
   命中:UIString;
   暴击率:UIString;
   魔法暴击率:UIString;
   回避:UIString;
   移动速度:UIString;
   扩展属性_2:UIString;
   attributeChangeBox:UIRoot;
   MaxHP2:UIString;
   MaxSP2:UIString;
   ATK2:UIString;
   DEF2:UIString;
   MAG2:UIString;
   MagDef2:UIString;
   HIT2:UIString;
   CRIT2:UIString;
   MagCrit2:UIString;
   DOD2:UIString;
   MoveGrid2:UIString;
   E1:UIString;
   E2:UIString;
   smallAvatar:UIAvatar;
   说明栏背景:UIBitmap;
   分割线:UIBitmap;
   descRoot:UIRoot;
   descName:UIString;
   descText:UIString;
   actorPanelTab:UITabBox;
   skillPanel:UIBitmap;
   技能栏:UIBitmap;
   滚动条背景:UIBitmap;
   actorSkillList:UIList; // Item=1013
   滚动条框:UIBitmap;
   装备栏:UIBitmap;
   actorEquipPanel:UIBitmap;
   actorEquipList:UIList; // Item=1012
   equipPackagePanel:UIBitmap;
   equipPackageList:UIList; // Item=1014
   道具栏:UIBitmap;
   actorItemPanel:UIBitmap;
   actorItemList:UIList; // Item=1015
   itemPackagePanel:UIBitmap;
   itemPackageList:UIList; // Item=1016
   设置栏:UIBitmap;
   电脑控制背景框:UIBitmap;
   设置自动行动文本:UIString;
   aiBtn:UIButton;
   ai:UICheckBox;
   dissolutionBox:UIBitmap;
   解散文本:UIString;
   dissolutionBtn:UIButton;
   关闭队伍编成界面按钮:UIButton;
   关闭标志:UIBitmap;
   reduceColor:UIString;
   increaseColor:UIString;
   constructor(){
      super(16);
   }
}
class ListItem_16 extends UIListItemData {
   背景:string;
   底部文字背景:string;
   actorPanel:string;
   actorList:UIListItemData[];
   人物属性背景:string;
   界面背景1:string;
   界面背景2:string;
   界面装饰:string;
   界面花纹:string;
   内容底衬:string;
   actorBattler:number;
   actorName:string;
   职业底衬:string;
   classIcon:string;
   经验条底部:string;
   actorExpSlider:number;
   经验条框:string;
   actorClass:string;
   actorLv:string;
   EXP_Mid:string;
   生命Label:string;
   魔法Label:string;
   攻击力Label:string;
   防御力Label:string;
   魔力Label:string;
   魔法防御力Label:string;
   命中Label:string;
   躲避Label:string;
   行动速度Label:string;
   暴击率Label:string;
   魔法暴击率Label:string;
   HP_Mid:string;
   SP_Mid:string;
   smallAvatar:number;
   说明栏背景:string;
   分割线:string;
   descName:string;
   descText:string;
   actorPanelTab:string;
   skillPanel:string;
   技能栏:string;
   滚动条背景:string;
   actorSkillList:UIListItemData[];
   滚动条框:string;
   装备栏:string;
   actorEquipPanel:string;
   actorEquipList:UIListItemData[];
   equipPackagePanel:string;
   equipPackageList:UIListItemData[];
   道具栏:string;
   actorItemPanel:string;
   actorItemList:UIListItemData[];
   itemPackagePanel:string;
   itemPackageList:UIListItemData[];
   设置栏:string;
   电脑控制背景框:string;
   设置自动行动文本:string;
   ai:boolean;
   dissolutionBox:string;
   解散文本:string;
   关闭标志:string;
   reduceColor:string;
   increaseColor:string;
}

/**
 * 17-指定角色 [BASE]
 */
class GUI_17 extends GUI_BASE {
   targetPanel:UIBitmap;
   界面背景1:UIBitmap;
   界面背景2:UIBitmap;
   界面装饰:UIBitmap;
   界面花纹:UIBitmap;
   窗口标题:UIBitmap;
   文本:UIString;
   actorList:UIList; // Item=1017
   closeTargetBtn:UIButton;
   关闭标志:UIBitmap;
   constructor(){
      super(17);
   }
}
class ListItem_17 extends UIListItemData {
   targetPanel:string;
   界面背景1:string;
   界面背景2:string;
   界面装饰:string;
   界面花纹:string;
   窗口标题:string;
   文本:string;
   actorList:UIListItemData[];
   关闭标志:string;
}

/**
 * 18-预留 [BASE]
 */
class GUI_18 extends GUI_BASE {

   constructor(){
      super(18);
   }
}
class ListItem_18 extends UIListItemData {

}

/**
 * 19-预留 [BASE]
 */
class GUI_19 extends GUI_BASE {

   constructor(){
      super(19);
   }
}
class ListItem_19 extends UIListItemData {

}

/**
 * 20-====战斗相关==== [BASE]
 */
class GUI_20 extends GUI_BASE {

   constructor(){
      super(20);
   }
}
class ListItem_20 extends UIListItemData {

}

/**
 * 21-战斗-出场准备 [BASE]
 */
class GUI_21 extends GUI_BASE {
   人物栏背景:UIBitmap;
   actorList:UIList; // Item=1032
   actorInfo:GUI_BattlerBriefInfo;
   提示文本背景:UIBitmap;
   tipsLabel:UIString;
   readyBtn:UIButton;
   人物栏框:UIBitmap;
   constructor(){
      super(21);
   }
}
class ListItem_21 extends UIListItemData {
   人物栏背景:string;
   actorList:UIListItemData[];
   actorInfo:number;
   提示文本背景:string;
   tipsLabel:string;
   人物栏框:string;
}

/**
 * 22-战斗-战斗者菜单 [BASE]
 */
class GUI_22 extends GUI_BASE {
   指令背景:UIBitmap;
   移动按钮:UIButton;
   移动图标:UIBitmap;
   攻击按钮:UIButton;
   攻击图标:UIBitmap;
   技能按钮:UIButton;
   技能图标:UIBitmap;
   道具按钮:UIButton;
   道具图标:UIBitmap;
   交换按钮:UIButton;
   交换图标:UIBitmap;
   待机按钮:UIButton;
   待机图标:UIBitmap;
   状态按钮:UIButton;
   装备按钮:UIButton;
   返回按钮:UIButton;
   返回图标:UIBitmap;
   文本:UIString;
   constructor(){
      super(22);
   }
}
class ListItem_22 extends UIListItemData {
   指令背景:string;
   移动图标:string;
   攻击图标:string;
   技能图标:string;
   道具图标:string;
   交换图标:string;
   待机图标:string;
   返回图标:string;
   文本:string;
}

/**
 * 23-战斗-通用菜单 [BASE]
 */
class GUI_23 extends GUI_BASE {
   界面背景:UIBitmap;
   索引行动者按钮:UIButton;
   胜利条件按钮:UIButton;
   结束回合按钮:UIButton;
   跳过AI结束按钮:UIButton;
   自动战斗:UIButton;
   返回按钮:UIButton;
   存档按钮:UIButton;
   读档按钮:UIButton;
   设置:UIButton;
   战斗菜单文本:UIString;
   constructor(){
      super(23);
   }
}
class ListItem_23 extends UIListItemData {
   界面背景:string;
   战斗菜单文本:string;
}

/**
 * 24-战斗-主界面 [BASE]
 */
class GUI_24 extends GUI_BASE {
   该文字透明度设置为1可参见说明:UIString;
   当前游戏回合测试显示:UIString;
   constructor(){
      super(24);
   }
}
class ListItem_24 extends UIListItemData {
   该文字透明度设置为1可参见说明:string;

}

/**
 * 25-战斗-技能栏 [BASE]
 */
class GUI_25 extends GUI_BASE {
   透明背景:UIBitmap;
   技能栏背景:UIBitmap;
   界面背景1:UIBitmap;
   界面背景2:UIBitmap;
   界面装饰:UIBitmap;
   界面花纹:UIBitmap;
   skillList:UIList; // Item=1033
   tipsUI:GUI_1027;
   关闭技能栏按钮:UIButton;
   关闭标志:UIBitmap;
   constructor(){
      super(25);
   }
}
class ListItem_25 extends UIListItemData {
   透明背景:string;
   技能栏背景:string;
   界面背景1:string;
   界面背景2:string;
   界面装饰:string;
   界面花纹:string;
   skillList:UIListItemData[];
   tipsUI:number;
   关闭标志:string;
}

/**
 * 26-战斗-道具栏 [BASE]
 */
class GUI_26 extends GUI_BASE {
   透明背景:UIBitmap;
   道具栏背景:UIBitmap;
   界面背景1:UIBitmap;
   界面背景2:UIBitmap;
   界面装饰:UIBitmap;
   界面花纹:UIBitmap;
   itemList:UIList; // Item=1034
   tipsUI:GUI_1027;
   关闭道具栏按钮:UIButton;
   关闭标志:UIBitmap;
   constructor(){
      super(26);
   }
}
class ListItem_26 extends UIListItemData {
   透明背景:string;
   道具栏背景:string;
   界面背景1:string;
   界面背景2:string;
   界面装饰:string;
   界面花纹:string;
   itemList:UIListItemData[];
   tipsUI:number;
   关闭标志:string;
}

/**
 * 27-战斗-状态栏 [BASE]
 */
class GUI_27 extends GUI_BASE {
   人物属性背景:UIBitmap;
   界面背景1:UIBitmap;
   界面背景2:UIBitmap;
   界面装饰:UIBitmap;
   界面花纹:UIBitmap;
   actorFace:UIBitmap;
   actorName:UIString;
   等级经验容器:UIRoot;
   EXP文本:UIString;
   actorExpSlider:UISlider;
   经验条框:UIBitmap;
   职业底衬:UIBitmap;
   actorClass:UIString;
   actorClassIcon:UIBitmap;
   LevelRoot:UIRoot;
   actorLv:UIString;
   Level:UIString;
   EXP:UIString;
   NEXT_EXP:UIString;
   EXP_Mid:UIString;
   属性显示容器:UIRoot;
   文本Label:UIRoot;
   最大生命值Label:UIString;
   最大魔法值Label:UIString;
   攻击力Label:UIString;
   防御力Label:UIString;
   魔力Label:UIString;
   魔法防御力Label:UIString;
   命中Label:UIString;
   躲避Label:UIString;
   移动力Label:UIString;
   暴击率Label:UIString;
   魔法暴击率Label:UIString;
   扩展属性_1_文本:UIString;
   扩展属性_2_文本:UIString;
   属性Label:UIRoot;
   扩展属性_1:UIString;
   扩展属性_2:UIString;
   HP:UIString;
   MAXHP:UIString;
   HP_Mid:UIString;
   SP:UIString;
   MAXSP:UIString;
   SP_Mid:UIString;
   攻击力:UIString;
   防御力:UIString;
   魔力:UIString;
   魔法防御力:UIString;
   命中:UIString;
   暴击率:UIString;
   魔法暴击率:UIString;
   回避:UIString;
   移动力:UIString;
   smallAvatar:UIAvatar;
   statusList:UIList; // Item=1028
   关闭状态栏按钮:UIButton;
   关闭标志:UIBitmap;
   constructor(){
      super(27);
   }
}
class ListItem_27 extends UIListItemData {
   人物属性背景:string;
   界面背景1:string;
   界面背景2:string;
   界面装饰:string;
   界面花纹:string;
   actorFace:string;
   actorName:string;
   EXP文本:string;
   actorExpSlider:number;
   经验条框:string;
   职业底衬:string;
   actorClass:string;
   actorClassIcon:string;
   actorLv:string;
   EXP_Mid:string;
   最大生命值Label:string;
   最大魔法值Label:string;
   攻击力Label:string;
   防御力Label:string;
   魔力Label:string;
   魔法防御力Label:string;
   命中Label:string;
   躲避Label:string;
   移动力Label:string;
   暴击率Label:string;
   魔法暴击率Label:string;
   HP_Mid:string;
   SP_Mid:string;
   smallAvatar:number;
   statusList:UIListItemData[];
   关闭标志:string;
}

/**
 * 28-战斗-当前战斗者 [BASE]
 */
class GUI_28 extends GUI_BASE {
   actorInfo:GUI_BattlerBriefInfo;
   constructor(){
      super(28);
   }
}
class ListItem_28 extends UIListItemData {
   actorInfo:number;
}

/**
 * 29-战斗-目标战斗者 [BASE]
 */
class GUI_29 extends GUI_BASE {
   actorInfo:GUI_BattlerBriefInfo;
   constructor(){
      super(29);
   }
}
class ListItem_29 extends UIListItemData {
   actorInfo:number;
}

/**
 * 30-战斗-击杀奖励 [BASE]
 */
class GUI_30 extends GUI_BASE {
   击杀结算标题:UIBitmap;
   baseBlock:UIBitmap;
   界面背景1:UIBitmap;
   界面背景2:UIBitmap;
   界面装饰:UIBitmap;
   界面花纹:UIBitmap;
   内容底衬:UIBitmap;
   内容底衬2:UIBitmap;
   经验条底部:UIBitmap;
   EXPSlider:UISlider;
   经验条框:UIBitmap;
   getExp:UIString;
   文本:UIString;
   getGold:UIString;
   EXP文本:UIString;
   金币图标:UIBitmap;
   actorFace:UIBitmap;
   actorName:UIString;
   actorExp:UIString;
   lvBox:UIRoot;
   lv:UIString;
   itemBlock:UIBitmap;
   dropItemList:UIList; // Item=1029
   skillBlock:UIBitmap;
   习得技能文本:UIString;
   learnSkillList:UIList; // Item=1030
   constructor(){
      super(30);
   }
}
class ListItem_30 extends UIListItemData {
   击杀结算标题:string;
   baseBlock:string;
   界面背景1:string;
   界面背景2:string;
   界面装饰:string;
   界面花纹:string;
   内容底衬:string;
   内容底衬2:string;
   经验条底部:string;
   EXPSlider:number;
   经验条框:string;
   getExp:string;
   文本:string;
   getGold:string;
   EXP文本:string;
   金币图标:string;
   actorFace:string;
   actorName:string;
   actorExp:string;
   lv:string;
   itemBlock:string;
   dropItemList:UIListItemData[];
   skillBlock:string;
   习得技能文本:string;
   learnSkillList:UIListItemData[];
}

/**
 * 31-战斗：胜利 [BASE]
 */
class GUI_31 extends GUI_BASE {
   战斗胜利背景:UIBitmap;
   确定按钮:UIButton;
   constructor(){
      super(31);
   }
}
class ListItem_31 extends UIListItemData {
   战斗胜利背景:string;

}

/**
 * 32-战斗：失败 [BASE]
 */
class GUI_32 extends GUI_BASE {
   战斗失败背景:UIBitmap;
   确定按钮:UIButton;
   constructor(){
      super(32);
   }
}
class ListItem_32 extends UIListItemData {
   战斗失败背景:string;

}

/**
 * 33-战斗-更换朝向 [BASE]
 */
class GUI_33 extends GUI_BASE {
   上朝向按钮:UIButton;
   下朝向按钮:UIButton;
   左朝向按钮:UIButton;
   右朝向按钮:UIButton;
   constructor(){
      super(33);
   }
}
class ListItem_33 extends UIListItemData {

}

/**
 * 34-战斗-交换道具 [BASE]
 */
class GUI_34 extends GUI_BASE {
   actorPanel1:UIBitmap;
   界面背景1:UIBitmap;
   界面背景2:UIBitmap;
   界面花纹:UIBitmap;
   内容底衬:UIBitmap;
   actorFace1:UIBitmap;
   actorName1:UIString;
   itemPackageList1:UIList; // Item=1031
   界面装饰:UIBitmap;
   actorPanel2:UIBitmap;
   actorFace2:UIBitmap;
   actorName2:UIString;
   itemPackageList2:UIList; // Item=1031
   closeBtn:UIButton;
   关闭标志:UIBitmap;
   底部文字背景:UIBitmap;
   底部文字:UIString;
   图片:UIBitmap;
   constructor(){
      super(34);
   }
}
class ListItem_34 extends UIListItemData {
   actorPanel1:string;
   界面背景1:string;
   界面背景2:string;
   界面花纹:string;
   内容底衬:string;
   actorFace1:string;
   actorName1:string;
   itemPackageList1:UIListItemData[];
   界面装饰:string;
   actorPanel2:string;
   actorFace2:string;
   actorName2:string;
   itemPackageList2:UIListItemData[];
   关闭标志:string;
   底部文字背景:string;
   底部文字:string;
   图片:string;
}

/**
 * 35-战斗-击中奖励 [BASE]
 */
class GUI_35 extends GUI_BASE {
   界面背景1:UIBitmap;
   界面背景2:UIBitmap;
   界面装饰:UIBitmap;
   界面花纹:UIBitmap;
   经验条底:UIBitmap;
   EXPSlider:UISlider;
   经验条框:UIBitmap;
   获得文本:UIString;
   actorExp:UIString;
   getExp:UIString;
   lvBox:UIRoot;
   lv:UIString;
   LV文本:UIString;
   nameText:UIString;
   skillBlock:UIBitmap;
   图片:UIBitmap;
   习得技能文本:UIString;
   learnSkillList:UIList; // Item=1030
   constructor(){
      super(35);
   }
}
class ListItem_35 extends UIListItemData {
   界面背景1:string;
   界面背景2:string;
   界面装饰:string;
   界面花纹:string;
   经验条底:string;
   EXPSlider:number;
   经验条框:string;
   获得文本:string;
   actorExp:string;
   getExp:string;
   lv:string;
   LV文本:string;
   nameText:string;
   skillBlock:string;
   图片:string;
   习得技能文本:string;
   learnSkillList:UIListItemData[];
}

/**
 * 36-战斗-战斗画面 [BASE]
 */
class GUI_36 extends GUI_BASE {
   参考物体:UIRoot;
   background:UIBitmap;
   battler1:UIAvatar;
   battler2:UIAvatar;
   界面层:UIRoot;
   提示文本背景:UIBitmap;
   actionText:UIString;
   constructor(){
      super(36);
   }
}
class ListItem_36 extends UIListItemData {
   background:string;
   battler1:number;
   battler2:number;
   提示文本背景:string;
   actionText:string;
}

/**
 * 37- [BASE]
 */
class GUI_37 extends GUI_BASE {
   图片:UIBitmap;
   constructor(){
      super(37);
   }
}
class ListItem_37 extends UIListItemData {
   图片:string;
}

/**
 * 38-演示-关卡选择 [BASE]
 */
class GUI_38 extends GUI_BASE {
   背景图片:UIBitmap;
   关卡背景容器:UIRoot;
   背景:UIBitmap;
   行走图:UIAvatar;
   关卡1:UIButton;
   关卡2:UIButton;
   关卡3:UIButton;
   关卡4:UIButton;
   按钮_作弊:UIButton;
   按钮_设置缩放率:UIButton;
   按钮_呼出菜单:UIButton;
   按钮_商店:UIButton;
   文本:UIString;
   block:UIBitmap;
   肉鸽入口:UIButton;
   constructor(){
      super(38);
   }
}
class ListItem_38 extends UIListItemData {
   背景图片:string;
   背景:string;
   行走图:number;
   文本:string;
   block:string;

}

/**
 * 39-肉鸽-入口 [BASE]
 */
class GUI_39 extends GUI_BASE {
   背景图片:UIBitmap;
   入口面板:UIBitmap;
   入口标题:UIString;
   入口说明:UIString;
   开始按钮:UIButton;
   继续按钮:UIButton;
   返回按钮:UIButton;
   constructor(){
      super(39);
   }
}
class ListItem_39 extends UIListItemData {
   背景图片:string;
   入口面板:string;
   入口标题:string;
   入口说明:string;

}

/**
 * 40-肉鸽-奖励 [BASE]
 */
class GUI_40 extends GUI_BASE {
   背景图片:UIBitmap;
   奖励面板:UIBitmap;
   奖励标题:UIString;
   奖励卡背景1:UIBitmap;
   奖励卡背景2:UIBitmap;
   奖励卡背景3:UIBitmap;
   奖励按钮1:UIButton;
   奖励按钮2:UIButton;
   奖励按钮3:UIButton;
   奖励描述1:UIString;
   奖励描述2:UIString;
   奖励描述3:UIString;
   奖励确认按钮:UIButton;
   constructor(){
      super(40);
   }
}
class ListItem_40 extends UIListItemData {
   背景图片:string;
   奖励面板:string;
   奖励标题:string;
   奖励卡背景1:string;
   奖励卡背景2:string;
   奖励卡背景3:string;
   奖励描述1:string;
   奖励描述2:string;
   奖励描述3:string;

}

/**
 * 41-肉鸽-节点 [BASE]
 */
class GUI_41 extends GUI_BASE {
   背景图片:UIBitmap;
   节点面板:UIBitmap;
   节点标题:UIString;
   节点状态:UIString;
   路线背景:UIBitmap;
   路线说明:UIString;
   当前节点:UIString;
   进入节点按钮:UIButton;
   装备管理按钮:UIButton;
   放弃按钮:UIButton;
   constructor(){
      super(41);
   }
}
class ListItem_41 extends UIListItemData {
   背景图片:string;
   节点面板:string;
   节点标题:string;
   节点状态:string;
   路线背景:string;
   路线说明:string;
   当前节点:string;

}

/**
 * 42-肉鸽-结算 [BASE]
 */
class GUI_42 extends GUI_BASE {
   背景图片:UIBitmap;
   结算面板:UIBitmap;
   结算标题:UIString;
   结算摘要:UIString;
   结算返回按钮:UIButton;
   constructor(){
      super(42);
   }
}
class ListItem_42 extends UIListItemData {
   背景图片:string;
   结算面板:string;
   结算标题:string;
   结算摘要:string;

}

/**
 * 1001-档案_Item [BASE]
 */
class GUI_1001 extends GUI_BASE {
   项目背景:UIBitmap;
   空白档案:UIBitmap;
   screenshotImg:UIBitmap;
   mapName:UIString;
   档案号码背景:UIBitmap;
   档案文本:UIString;
   no:UIString;
   delBtn:UIButton;
   删除标志:UIBitmap;
   texts:UIRoot;
   游戏时长文本:UIString;
   创建时间文本:UIString;
   gameTimeStr:UIString;
   dateStr:UIString;
   分割线:UIBitmap;
   截图框:UIBitmap;
   constructor(){
      super(1001);
   }
}
class ListItem_1001 extends UIListItemData {
   项目背景:string;
   空白档案:string;
   screenshotImg:string;
   mapName:string;
   档案号码背景:string;
   档案文本:string;
   no:string;
   删除标志:string;
   游戏时长文本:string;
   创建时间文本:string;
   gameTimeStr:string;
   dateStr:string;
   分割线:string;
   截图框:string;
}

/**
 * 1002-道具_Item [BASE]
 */
class GUI_1002 extends GUI_BASE {
   项目背景:UIBitmap;
   itemNum:UIString;
   itemName:UIString;
   道具背景:UIBitmap;
   icon:UIBitmap;
   道具框:UIBitmap;
   constructor(){
      super(1002);
   }
}
class ListItem_1002 extends UIListItemData {
   项目背景:string;
   itemNum:string;
   itemName:string;
   道具背景:string;
   icon:string;
   道具框:string;
}

/**
 * 1003-商品_Item [BASE]
 */
class GUI_1003 extends GUI_BASE {
   项目背景:UIBitmap;
   ownNum:UIString;
   itemNum:UIString;
   itemPrice:UIString;
   itemName:UIString;
   道具背景:UIBitmap;
   icon:UIBitmap;
   道具框:UIBitmap;
   constructor(){
      super(1003);
   }
}
class ListItem_1003 extends UIListItemData {
   项目背景:string;
   ownNum:string;
   itemNum:string;
   itemPrice:string;
   itemName:string;
   道具背景:string;
   icon:string;
   道具框:string;
}

/**
 * 1004- [BASE]
 */
class GUI_1004 extends GUI_BASE {

   constructor(){
      super(1004);
   }
}
class ListItem_1004 extends UIListItemData {

}

/**
 * 1005- [BASE]
 */
class GUI_1005 extends GUI_BASE {

   constructor(){
      super(1005);
   }
}
class ListItem_1005 extends UIListItemData {

}

/**
 * 1006- [BASE]
 */
class GUI_1006 extends GUI_BASE {

   constructor(){
      super(1006);
   }
}
class ListItem_1006 extends UIListItemData {

}

/**
 * 1007- [BASE]
 */
class GUI_1007 extends GUI_BASE {

   constructor(){
      super(1007);
   }
}
class ListItem_1007 extends UIListItemData {

}

/**
 * 1008-按钮选中效果样式1 [BASE]
 */
class GUI_1008 extends GUI_BASE {
   容器:UIRoot;
   target:UIBitmap;
   constructor(){
      super(1008);
   }
}
class ListItem_1008 extends UIListItemData {
   target:string;
}

/**
 * 1009-按钮选中效果样式2 [BASE]
 */
class GUI_1009 extends GUI_BASE {
   容器:UIRoot;
   target:UIBitmap;
   constructor(){
      super(1009);
   }
}
class ListItem_1009 extends UIListItemData {
   target:string;
}

/**
 * 1010-按钮选中效果样式3 [BASE]
 */
class GUI_1010 extends GUI_BASE {
   容器:UIRoot;
   target:UIBitmap;
   constructor(){
      super(1010);
   }
}
class ListItem_1010 extends UIListItemData {
   target:string;
}

/**
 * 1011-角色_Item [BASE]
 */
class GUI_1011 extends GUI_BASE {
   头像底衬:UIBitmap;
   face:UIBitmap;
   头像框:UIBitmap;
   ai:UIBitmap;
   constructor(){
      super(1011);
   }
}
class ListItem_1011 extends UIListItemData {
   头像底衬:string;
   face:string;
   头像框:string;
   ai:string;
}

/**
 * 1012-角色装备_Item [BASE]
 */
class GUI_1012 extends GUI_BASE {
   装备图标框:UIBitmap;
   道具背景:UIBitmap;
   partName:UIString;
   icon:UIBitmap;
   道具框:UIBitmap;
   constructor(){
      super(1012);
   }
}
class ListItem_1012 extends UIListItemData {
   装备图标框:string;
   道具背景:string;
   partName:string;
   icon:string;
   道具框:string;
}

/**
 * 1013-角色技能_item [BASE]
 */
class GUI_1013 extends GUI_BASE {
   技能图标背景:UIBitmap;
   技能图标容器:UIRoot;
   icon:UIBitmap;
   skillName:UIString;
   技能图标框:UIBitmap;
   constructor(){
      super(1013);
   }
}
class ListItem_1013 extends UIListItemData {
   技能图标背景:string;
   icon:string;
   skillName:string;
   技能图标框:string;
}

/**
 * 1014-角色待装备_Item [BASE]
 */
class GUI_1014 extends GUI_BASE {
   unequipBtn:UIBitmap;
   卸下装备背景:UIBitmap;
   卸下装备文本:UIString;
   equipBox:UIBitmap;
   装备背景:UIBitmap;
   道具背景:UIBitmap;
   icon:UIBitmap;
   itemNum:UIString;
   itemName:UIString;
   图标框:UIBitmap;
   constructor(){
      super(1014);
   }
}
class ListItem_1014 extends UIListItemData {
   unequipBtn:string;
   卸下装备背景:string;
   卸下装备文本:string;
   equipBox:string;
   装备背景:string;
   道具背景:string;
   icon:string;
   itemNum:string;
   itemName:string;
   图标框:string;
}

/**
 * 1015-角色携带道具_Item [BASE]
 */
class GUI_1015 extends GUI_BASE {
   携带道具图标背景:UIBitmap;
   携带道具图标容器:UIRoot;
   道具背景:UIBitmap;
   icon:UIBitmap;
   道具框:UIBitmap;
   constructor(){
      super(1015);
   }
}
class ListItem_1015 extends UIListItemData {
   携带道具图标背景:string;
   道具背景:string;
   icon:string;
   道具框:string;
}

/**
 * 1016-角色待携带道具_Item [BASE]
 */
class GUI_1016 extends GUI_BASE {
   unitemBtn:UIBitmap;
   卸下道具:UIString;
   itemBox:UIBitmap;
   道具背景:UIBitmap;
   icon:UIBitmap;
   itemNum:UIString;
   itemName:UIString;
   图标框:UIBitmap;
   constructor(){
      super(1016);
   }
}
class ListItem_1016 extends UIListItemData {
   unitemBtn:string;
   卸下道具:string;
   itemBox:string;
   道具背景:string;
   icon:string;
   itemNum:string;
   itemName:string;
   图标框:string;
}

/**
 * 1017-目标角色选择_Item [BASE]
 */
class GUI_1017 extends GUI_BASE {
   actorInfoBox:UIBitmap;
   背景:UIBitmap;
   魔法条底部:UIBitmap;
   spSlider:UISlider;
   魔法条框:UIBitmap;
   actorFace:UIBitmap;
   生命条底部:UIBitmap;
   hpSlider:UISlider;
   生命条框:UIBitmap;
   hpText:UIString;
   spText:UIString;
   actorName:UIString;
   actorLvLabel:UIString;
   actorLv:UIString;
   职业底衬:UIBitmap;
   classIcon:UIBitmap;
   classText:UIString;
   constructor(){
      super(1017);
   }
}
class ListItem_1017 extends UIListItemData {
   actorInfoBox:string;
   背景:string;
   魔法条底部:string;
   spSlider:number;
   魔法条框:string;
   actorFace:string;
   生命条底部:string;
   hpSlider:number;
   生命条框:string;
   hpText:string;
   spText:string;
   actorName:string;
   actorLvLabel:string;
   actorLv:string;
   职业底衬:string;
   classIcon:string;
   classText:string;
}

/**
 * 1018-设置_Item1 [BASE]
 */
class GUI_1018 extends GUI_BASE {
   项目背景:UIBitmap;
   keyName:UIString;
   key1:UIButton;
   key2:UIButton;
   key3:UIButton;
   key4:UIButton;
   constructor(){
      super(1018);
   }
}
class ListItem_1018 extends UIListItemData {
   项目背景:string;
   keyName:string;

}

/**
 * 1019-设置_Item2 [BASE]
 */
class GUI_1019 extends GUI_BASE {
   项目背景:UIBitmap;
   keyName:UIString;
   key1:UIButton;
   constructor(){
      super(1019);
   }
}
class ListItem_1019 extends UIListItemData {
   项目背景:string;
   keyName:string;

}

/**
 * 1020- [BASE]
 */
class GUI_1020 extends GUI_BASE {

   constructor(){
      super(1020);
   }
}
class ListItem_1020 extends UIListItemData {

}

/**
 * 1021- [BASE]
 */
class GUI_1021 extends GUI_BASE {

   constructor(){
      super(1021);
   }
}
class ListItem_1021 extends UIListItemData {

}

/**
 * 1022-===== 战斗相关 ==== [BASE]
 */
class GUI_1022 extends GUI_BASE {

   constructor(){
      super(1022);
   }
}
class ListItem_1022 extends UIListItemData {

}

/**
 * 1023-我方战斗阶段显示 [BASE]
 */
class GUI_1023 extends GUI_BASE {
   界面背景:UIBitmap;
   battleStageLabel3:UIString;
   当前回合数:UIString;
   constructor(){
      super(1023);
   }
}
class ListItem_1023 extends UIListItemData {
   界面背景:string;
   battleStageLabel3:string;

}

/**
 * 1024-敌方战斗阶段显示 [BASE]
 */
class GUI_1024 extends GUI_BASE {
   界面背景:UIBitmap;
   battleStageLabel3:UIString;
   当前回合数:UIString;
   constructor(){
      super(1024);
   }
}
class ListItem_1024 extends UIListItemData {
   界面背景:string;
   battleStageLabel3:string;

}

/**
 * 1025-战斗人物头像 [BASE]
 */
class GUI_1025 extends GUI_BASE {
   actorInfoBox:UIBitmap;
   actorCamp:UICheckBox;
   hpSlider:UISlider;
   spSlider:UISlider;
   hpText:UIString;
   spText:UIString;
   actorName:UIString;
   statusList:UIList; // Item=1026
   actorLvLabel:UIString;
   actorLv:UIString;
   职业底衬:UIBitmap;
   actorClassIcon:UIBitmap;
   actorClassName:UIString;
   deadSign:UIBitmap;
   actorFace:UIBitmap;
   角色背景框:UIBitmap;
   constructor(){
      super(1025);
   }
}
class ListItem_1025 extends UIListItemData {
   actorInfoBox:string;
   actorCamp:boolean;
   hpSlider:number;
   spSlider:number;
   hpText:string;
   spText:string;
   actorName:string;
   statusList:UIListItemData[];
   actorLvLabel:string;
   actorLv:string;
   职业底衬:string;
   actorClassIcon:string;
   actorClassName:string;
   deadSign:string;
   actorFace:string;
   角色背景框:string;
}

/**
 * 1026-战斗人物头像状态_Item [BASE]
 */
class GUI_1026 extends GUI_BASE {
   icon:UIBitmap;
   layer:UIString;
   constructor(){
      super(1026);
   }
}
class ListItem_1026 extends UIListItemData {
   icon:string;
   layer:string;
}

/**
 * 1027-战斗：说明栏 [BASE]
 */
class GUI_1027 extends GUI_BASE {
   说明栏背景:UIBitmap;
   descName:UIString;
   descTextBox:UIRoot;
   descText:UIString;
   cdBox:UIRoot;
   cdTextLabel:UIString;
   冷却条底图:UIBitmap;
   cdSlider:UISlider;
   cdText:UIString;
   冷却条框:UIBitmap;
   说明栏装饰:UIBitmap;
   分割线:UIBitmap;
   constructor(){
      super(1027);
   }
}
class ListItem_1027 extends UIListItemData {
   说明栏背景:string;
   descName:string;
   descText:string;
   cdTextLabel:string;
   冷却条底图:string;
   cdSlider:number;
   cdText:string;
   冷却条框:string;
   说明栏装饰:string;
   分割线:string;
}

/**
 * 1028-战斗状态栏的状态_Item [BASE]
 */
class GUI_1028 extends GUI_BASE {
   icon:UIBitmap;
   tipsLabel:UIString;
   constructor(){
      super(1028);
   }
}
class ListItem_1028 extends UIListItemData {
   icon:string;
   tipsLabel:string;
}

/**
 * 1029-战斗掉落物品_Item [BASE]
 */
class GUI_1029 extends GUI_BASE {
   携带道具图标背景:UIBitmap;
   携带道具图标容器:UIRoot;
   icon:UIBitmap;
   道具框:UIBitmap;
   itemNum:UIString;
   itemNumLabel:UIString;
   itemName:UIString;
   constructor(){
      super(1029);
   }
}
class ListItem_1029 extends UIListItemData {
   携带道具图标背景:string;
   icon:string;
   道具框:string;
   itemNum:string;
   itemNumLabel:string;
   itemName:string;
}

/**
 * 1030-升级习得技能_Item [BASE]
 */
class GUI_1030 extends GUI_BASE {
   技能图标背景:UIBitmap;
   技能图标容器:UIRoot;
   icon:UIBitmap;
   技能框:UIBitmap;
   constructor(){
      super(1030);
   }
}
class ListItem_1030 extends UIListItemData {
   技能图标背景:string;
   icon:string;
   技能框:string;
}

/**
 * 1031-战斗-交换道具_Item [BASE]
 */
class GUI_1031 extends GUI_BASE {
   itemBox:UIBitmap;
   道具底:UIBitmap;
   icon:UIBitmap;
   道具框:UIBitmap;
   itemName:UIString;
   图片:UIBitmap;
   constructor(){
      super(1031);
   }
}
class ListItem_1031 extends UIListItemData {
   itemBox:string;
   道具底:string;
   icon:string;
   道具框:string;
   itemName:string;
   图片:string;
}

/**
 * 1032-出场角色_Item [BASE]
 */
class GUI_1032 extends GUI_BASE {
   avatarbg:UIBitmap;
   底影:UIBitmap;
   avatar:UIAvatar;
   ai:UIBitmap;
   inScene:UIBitmap;
   constructor(){
      super(1032);
   }
}
class ListItem_1032 extends UIListItemData {
   avatarbg:string;
   底影:string;
   avatar:number;
   ai:string;
   inScene:string;
}

/**
 * 1033-战斗技能_item [BASE]
 */
class GUI_1033 extends GUI_BASE {
   技能图标背景:UIBitmap;
   技能图标容器:UIRoot;
   icon:UIBitmap;
   技能框:UIBitmap;
   constructor(){
      super(1033);
   }
}
class ListItem_1033 extends UIListItemData {
   技能图标背景:string;
   icon:string;
   技能框:string;
}

/**
 * 1034-战斗道具_Item [BASE]
 */
class GUI_1034 extends GUI_BASE {
   携带道具图标背景:UIBitmap;
   携带道具图标容器:UIRoot;
   icon:UIBitmap;
   道具框:UIBitmap;
   constructor(){
      super(1034);
   }
}
class ListItem_1034 extends UIListItemData {
   携带道具图标背景:string;
   icon:string;
   道具框:string;
}

/**
 * 1035-结算阶段显示 [BASE]
 */
class GUI_1035 extends GUI_BASE {
   界面背景:UIBitmap;
   文本:UIString;
   constructor(){
      super(1035);
   }
}
class ListItem_1035 extends UIListItemData {
   界面背景:string;
   文本:string;
}

/**
 * 1036- [BASE]
 */
class GUI_1036 extends GUI_BASE {

   constructor(){
      super(1036);
   }
}
class ListItem_1036 extends UIListItemData {

}

/**
 * 1037- [BASE]
 */
class GUI_1037 extends GUI_BASE {

   constructor(){
      super(1037);
   }
}
class ListItem_1037 extends UIListItemData {

}

/**
 * 1038- [BASE]
 */
class GUI_1038 extends GUI_BASE {

   constructor(){
      super(1038);
   }
}
class ListItem_1038 extends UIListItemData {

}

/**
 * 1039- [BASE]
 */
class GUI_1039 extends GUI_BASE {

   constructor(){
      super(1039);
   }
}
class ListItem_1039 extends UIListItemData {

}

/**
 * 1040-===== 伤害显示 ==== [BASE]
 */
class GUI_1040 extends GUI_BASE {

   constructor(){
      super(1040);
   }
}
class ListItem_1040 extends UIListItemData {

}

/**
 * 1041-miss显示 [BASE]
 */
class GUI_1041 extends GUI_BASE {
   容器:UIRoot;
   target:UIRoot;
   targetLabel:UIString;
   constructor(){
      super(1041);
   }
}
class ListItem_1041 extends UIListItemData {
   targetLabel:string;
}

/**
 * 1042-物理伤害数字显示 [BASE]
 */
class GUI_1042 extends GUI_BASE {
   容器:UIRoot;
   target:UIRoot;
   damage:UIString;
   constructor(){
      super(1042);
   }
}
class ListItem_1042 extends UIListItemData {
   damage:string;
}

/**
 * 1043-魔法伤害数字显示 [BASE]
 */
class GUI_1043 extends GUI_BASE {
   容器:UIRoot;
   target:UIRoot;
   damage:UIString;
   constructor(){
      super(1043);
   }
}
class ListItem_1043 extends UIListItemData {
   damage:string;
}

/**
 * 1044-真实伤害数字显示 [BASE]
 */
class GUI_1044 extends GUI_BASE {
   容器:UIRoot;
   target:UIRoot;
   damage:UIString;
   constructor(){
      super(1044);
   }
}
class ListItem_1044 extends UIListItemData {
   damage:string;
}

/**
 * 1045-恢复生命值数字显示 [BASE]
 */
class GUI_1045 extends GUI_BASE {
   容器:UIRoot;
   target:UIRoot;
   damage:UIString;
   constructor(){
      super(1045);
   }
}
class ListItem_1045 extends UIListItemData {
   damage:string;
}

/**
 * 1046-恢复魔法值数值显示 [BASE]
 */
class GUI_1046 extends GUI_BASE {
   容器:UIRoot;
   target:UIRoot;
   damage:UIString;
   constructor(){
      super(1046);
   }
}
class ListItem_1046 extends UIListItemData {
   damage:string;
}

/**
 * 1047- [BASE]
 */
class GUI_1047 extends GUI_BASE {

   constructor(){
      super(1047);
   }
}
class ListItem_1047 extends UIListItemData {

}

/**
 * 1048- [BASE]
 */
class GUI_1048 extends GUI_BASE {

   constructor(){
      super(1048);
   }
}
class ListItem_1048 extends UIListItemData {

}

/**
 * 1049- [BASE]
 */
class GUI_1049 extends GUI_BASE {

   constructor(){
      super(1049);
   }
}
class ListItem_1049 extends UIListItemData {

}

/**
 * 1050-===== 其他 ==== [BASE]
 */
class GUI_1050 extends GUI_BASE {

   constructor(){
      super(1050);
   }
}
class ListItem_1050 extends UIListItemData {

}

/**
 * 1051-编辑器-战斗者 [BASE]
 */
class GUI_1051 extends GUI_BASE {
   player:UIBitmap;
   enemy:UIBitmap;
   constructor(){
      super(1051);
   }
}
class ListItem_1051 extends UIListItemData {
   player:string;
   enemy:string;
}

/**
 * 1052- [BASE]
 */
class GUI_1052 extends GUI_BASE {

   constructor(){
      super(1052);
   }
}
class ListItem_1052 extends UIListItemData {

}

/**
 * 1053- [BASE]
 */
class GUI_1053 extends GUI_BASE {

   constructor(){
      super(1053);
   }
}
class ListItem_1053 extends UIListItemData {

}

/**
 * 1054- [BASE]
 */
class GUI_1054 extends GUI_BASE {

   constructor(){
      super(1054);
   }
}
class ListItem_1054 extends UIListItemData {

}

/**
 * 1055- [BASE]
 */
class GUI_1055 extends GUI_BASE {

   constructor(){
      super(1055);
   }
}
class ListItem_1055 extends UIListItemData {

}

/**
 * 2001-启动载入界面 [BASE]
 */
class GUI_2001 extends GUI_BASE {
   loadingComp:UISlider;
   盈光草:UIBitmap;
   文本:UIString;
   constructor(){
      super(2001);
   }
}
class ListItem_2001 extends UIListItemData {
   loadingComp:number;
   盈光草:string;
   文本:string;
}

/**
 * 2002-新游戏载入界面 [BASE]
 */
class GUI_2002 extends GUI_BASE {
   图片:UIBitmap;
   constructor(){
      super(2002);
   }
}
class ListItem_2002 extends UIListItemData {
   图片:string;
}

/**
 * 2003-读档载入界面 [BASE]
 */
class GUI_2003 extends GUI_BASE {
   图片:UIBitmap;
   constructor(){
      super(2003);
   }
}
class ListItem_2003 extends UIListItemData {
   图片:string;
}

/**
 * 2004-场景载入界面 [BASE]
 */
class GUI_2004 extends GUI_BASE {
   黑色背景:UIBitmap;
   constructor(){
      super(2004);
   }
}
class ListItem_2004 extends UIListItemData {
   黑色背景:string;
}

/**
 * 2005-战斗载入界面 [BASE]
 */
class GUI_2005 extends GUI_BASE {
   loadingSlider:UISlider;
   文本:UIString;
   constructor(){
      super(2005);
   }
}
class ListItem_2005 extends UIListItemData {
   loadingSlider:number;
   文本:string;
}

/**
 * 2006- [BASE]
 */
class GUI_2006 extends GUI_BASE {

   constructor(){
      super(2006);
   }
}
class ListItem_2006 extends UIListItemData {

}

/**
 * 3001-我的自定义界面 [BASE]
 */
class GUI_3001 extends GUI_BASE {
   图片:UIBitmap;
   文本:UIString;
   按钮:UIButton;
   游戏数值:UIString;
   constructor(){
      super(3001);
   }
}
class ListItem_3001 extends UIListItemData {
   图片:string;
   文本:string;

}

/**
 * 3002- [BASE]
 */
class GUI_3002 extends GUI_BASE {

   constructor(){
      super(3002);
   }
}
class ListItem_3002 extends UIListItemData {

}

/**
 * 15001-怪物图鉴 [BASE]
 */
class GUI_15001 extends GUI_BASE {
   图片:UIBitmap;
   list:UIList; // Item=15002
   infoRoot:UIRoot;
   bigPic:UIBitmap;
   monsterName:UIString;
   monsterInfo:UIString;
   文本:UIString;
   closeBtn:UIButton;
   constructor(){
      super(15001);
   }
}
class ListItem_15001 extends UIListItemData {
   图片:string;
   list:UIListItemData[];
   bigPic:string;
   monsterName:string;
   monsterInfo:string;
   文本:string;

}

/**
 * 15002-怪物图鉴Item [BASE]
 */
class GUI_15002 extends GUI_BASE {
   背景图:UIBitmap;
   smallPic:UIBitmap;
   constructor(){
      super(15002);
   }
}
class ListItem_15002 extends UIListItemData {
   背景图:string;
   smallPic:string;
}
GameUI["__compCustomAttributes"] = {"UIRoot":["enabledLimitView","scrollShowType","hScrollBar","hScrollBg","vScrollBar","vScrollBg","scrollWidth","slowmotionType","enabledWheel","hScrollValue","vScrollValue"],"UIButton":["label","image1","grid9img1","image2","grid9img2","image3","grid9img3","fontSize","color","overColor","clickColor","bold","italic","smooth","align","valign","letterSpacing","font","textDx","textDy","textStroke","textStrokeColor"],"UIBitmap":["image","grid9","flip","isTile","pivotType","isAdaptiveSize"],"UIString":["text","fontSize","color","bold","italic","smooth","align","valign","leading","letterSpacing","font","wordWrap","overflow","shadowEnabled","shadowColor","shadowDx","shadowDy","stroke","strokeColor","onChangeFragEvent"],"UIVariable":["varMode","varID","fontSize","color","bold","italic","smooth","align","valign","leading","letterSpacing","font","wordWrap","overflow","shadowEnabled","shadowColor","shadowDx","shadowDy","stroke","strokeColor","onChangeFragEvent"],"UICustomGameNumber":["customData","previewNum","previewFixed","fontSize","color","bold","italic","smooth","align","valign","leading","letterSpacing","font","wordWrap","overflow","shadowEnabled","shadowColor","shadowDx","shadowDy","stroke","strokeColor"],"UICustomGameString":["customData","inEditorText","fontSize","color","bold","italic","smooth","align","valign","leading","letterSpacing","font","wordWrap","overflow","shadowEnabled","shadowColor","shadowDx","shadowDy","stroke","strokeColor"],"UIAvatar":["avatarID","scaleNumberX","scaleNumberY","orientationIndex","avatarFPS","playOnce","isPlay","avatarFrame","actionID","avatarHue"],"UIStandAvatar":["avatarID","actionID","scaleNumberX","scaleNumberY","flip","playOnce","isPlay","avatarFrame","avatarFPS","avatarHue"],"UIAnimation":["animationID","scaleNumberX","scaleNumberY","aniFrame","playFps","playType","showHitEffect","silentMode"],"UIInput":["text","fontSize","color","prompt","promptColor","bold","italic","smooth","align","leading","font","wordWrap","restrict","inputMode","maxChars","shadowEnabled","shadowColor","shadowDx","shadowDy","onInputFragEvent","onEnterFragEvent"],"UICheckBox":["selected","image1","grid9img1","image2","grid9img2","onChangeFragEvent"],"UISwitch":["switchMode","selected","image1","grid9img1","image2","grid9img2","previewselected","onChangeFragEvent"],"UITabBox":["selectedIndex","itemImage1","grid9img1","itemImage2","grid9img2","itemWidth","itemHeight","items","rowMode","spacing","labelSize","labelColor","labelFont","labelBold","labelItalic","smooth","labelAlign","labelValign","labelLetterSpacing","labelSelectedColor","labelDx","labelDy","labelStroke","labelStrokeColor","onChangeFragEvent"],"UISlider":["image1","bgGrid9","image2","blockGrid9","image3","blockFillGrid9","step","min","max","value","transverseMode","blockFillMode","blockPosMode","fillStrething","isBindingVarID","bindingVarID","onChangeFragEvent"],"UIGUI":["guiID","instanceClassName"],"UIList":["itemModelGUI","previewSize","selectEnable","repeatX","itemWidth","itemHeight","spaceX","spaceY","scrollShowType","hScrollBar","hScrollBg","vScrollBar","vScrollBg","scrollWidth","selectImageURL","selectImageGrid9","selectedImageAlpha","selectedImageOnTop","overImageURL","overImageGrid9","overImageAlpha","overImageOnTop","overSelectMode","slowmotionType","onChangeFragEvent1","onChangeFragEvent2"],"UIComboBox":["itemLabels","selectedIndex","bgSkin","bgGrid9","fontSize","color","bold","italic","smooth","align","valign","letterSpacing","font","textDx","textStroke","textStrokeColor","displayItemSize","listScrollBg","listScrollBar","listAlpha","listBgColor","itemHeight","itemFontSize","itemColor","itemBold","itemItalic","itemAlign","itemValign","itemLetterSpacing","itemFont","itemOverColor","itemOverBgColor","itemTextDx","itemTextDy","itemTextStroke","itemTextStrokeColor","onChangeFragEvent"],"UIVideo":["videoURL","playType","volume","playbackRate","currentTime","muted","loop","pivotType","flip","onLoadedFragEvent","onErrorFragEvent","onCompleteFragEvent"]};
