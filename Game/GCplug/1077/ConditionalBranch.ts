/**
 * 高级条件分歧
 */
class AdvancedConditionalBranch {
    /**
     * 拓展超级开关
     */
    static getSuperSwitch(v: any, trigger: CommandTrigger) {
        if (trigger === void 0) { trigger = null; }
        if (v.mode == 0)
            return v.value;
        else if (!Game.currentScene)
            return false;
        else if (v.mode == 1)
            return Game.player.variable.getSwitch(MathUtils.int(v.value)) ? true : false;
        else if (v.mode == 2)
            return ClientWorld.variable.getSwitch(MathUtils.int(v.value)) ? true : false;
        else if (v.mode == 3) {
            const value = CustomCondition["f" + MathUtils.int(v.value[0])](trigger, v.value[1]);
            return value ? true : false;
        }
        else if (v.mode == 4) {
            return Game.player.variable.getSwitch(Game.player.variable.getVariable(MathUtils.int(v.value))) ? true : false;
        }
        else if (v.mode == 5) {
            return ClientWorld.variable.getSwitch(Game.player.variable.getVariable(MathUtils.int(v.value))) ? true : false;
        }
        else
            return false;
    }
    /**
     * 数值比较判断
     */
    static compareNumber(a: number, b: number, type: number): boolean {
        switch (type) {
            case 0: return a == b; // 等于
            case 1: return a >= b; // 大于等于
            case 2: return a > b; // 大于
            case 3: return a <= b; // 小于等于
            case 4: return a < b; // 小于
            case 5: return a != b; // 不等于
            default: return false;
        }
    }

    /**
     * 字符串比较
     */
    static compareString(a: string, b: string, type: number): boolean {
        switch (type) {
            case 0: return a === b;             // 等于
            case 1: return b.indexOf(a) !== -1; // 包含
            case 2: return b.indexOf(a) === -1; // 不包含
            default: return false;
        }
    }

    /**
     * 开关比较
     */
    static compareBoolean(value: boolean, type: number): boolean {
        switch (type) {
            case 0: return value === true;  // 开启
            case 1: return value === false; // 关闭
            default: return false;
        }
    }

    /**
     * 根据设定获取场景对象
     * @param soType 类别：0-玩家的场景对象 1-触发者 2-执行者 3-指定编号
     * @param soIndex 指定的编号
     * @param pointSoMode [可选] 默认值=0 指定场景对象编号的模式 0-常量 1-变量
     * @param soIndexVarID [可选] 默认值=0 使用的变量ID
     * @param trigger [可选] 默认值=null 触发器，如在事件执行时调用该函数则可传递触发器过来使用，以便判定触发者、执行者
     */
    static getSceneObjectBySetting(soType: number, soIndex: number, pointSoMode: number = 0, soIndexVarID: number = 0, trigger: CommandTrigger = null) {
        let so: ProjectClientSceneObject;
        if (soType == 0) {
            so = Game.player.sceneObject;
        }
        else if (soType == 1) {
            so = trigger ? trigger.trigger as any : Game.player.sceneObject;
        }
        else if (soType == 2) {
            so = trigger ? trigger.executor as any : Game.player.sceneObject;
        }
        else if (soType == 3) {
            if (!Game.currentScene) return null;
            if (pointSoMode == 1) {
                soIndex = Game.player.variable.getVariable(soIndexVarID);
            }
            so = soIndex < 0 ? null : Game.currentScene.sceneObjects[soIndex];
        }
        return so;
    }

    /**
     * 判断单条条件是否成立
     * @param item 条件项
     * @param context 数据上下文，用于获取变量值
     */
    static evaluateCondition(item: AdvancedConditionalBranchLogicNode, trigger: CommandTrigger): boolean {
        switch (item.type) {
            case 0: // 数值比较
                const numberVar = CustomCompData.getSuperNumber(item.numberVar, trigger)
                const numberVar2 = CustomCompData.getSuperNumber(item.numberVar2, trigger)
                if (numberVar == null || numberVar2 == null) return false;
                return this.compareNumber(numberVar, numberVar2, item.numberComparator);

            case 1: // 字符串比较
                const stringVar = CustomCompData.getSuperString(item.stringVar, trigger)
                const stringVar2 = CustomCompData.getSuperString(item.stringVar2, trigger)
                if (stringVar == null || stringVar2 == null) return false;
                return this.compareString(stringVar, stringVar2, item.stringComparator);

            case 2: // 开关比较
                const booleanVar = CustomCompData.getSuperSwitch(item.booleanVar, trigger)
                if (booleanVar == null) return false;
                return this.compareBoolean(!!booleanVar, item.booleanComparator);

            case 3: // 对象开关比较
                if (typeof ProjectClientSceneObject === "undefined") {
                    return false;
                }
                const sceneID = Game.currentScene ? Game.currentScene.id : 0;
                if (!sceneID) return false;
                const soc = this.getSceneObjectBySetting(item.booleanObjectVar, CustomCompData.getSuperNumber(item.booleanObjectIndex, trigger), 0, 0, trigger);
                if (!soc) return false;
                const booleanObjectVar = soc.getSwitch(item.booleanObjectVar2);
                return this.compareBoolean(!!booleanObjectVar, item.booleanComparator);

            case 4:
                // @ts-ignore 未安装425数组插件时该条件不成立。
                if (typeof W26_VisualArray === "undefined") return false;
                // @ts-ignore
                if (!W26_VisualArray.arrayDict) return false;
                // @ts-ignore
                const stringArray = W26_VisualArray.getArray(item.stringArrVar);
                const stringArrayVar2 = CustomCompData.getSuperString(item.stringVar2, trigger);
                if (!Array.isArray(stringArray) || stringArrayVar2 == null) return false;
                const targetString = String(stringArrayVar2);
                switch (item.stringComparator) {
                    case 0:
                        // @ts-ignore == 时比较两个数组的完整内容，stringVar2 需要是另一个数组ID。
                        const targetArray = W26_VisualArray.getArray(targetString);
                        if (!Array.isArray(targetArray) || stringArray.length !== targetArray.length) return false;
                        for (let i = 0; i < stringArray.length; i++) {
                            if (String(stringArray[i]) !== String(targetArray[i])) return false;
                        }
                        return true;
                    case 1:
                        for (let i = 0; i < stringArray.length; i++) {
                            const value = stringArray[i];
                            if (value != null && String(value).indexOf(targetString) !== -1) return true;
                        }
                        return false;
                    case 2:
                        for (let i = 0; i < stringArray.length; i++) {
                            const value = stringArray[i];
                            if (value != null && String(value).indexOf(targetString) !== -1) return false;
                        }
                        return true;
                    default:
                        return false;
                }

            default:
                return false;
        }
    }

    /**
     * 根据树状逻辑计算最终布尔值
     * @param node 树节点
     * @param context 数据上下文，提供变量值
     */
    static evaluateLogicNode(node: AdvancedConditionalBranchLogicNode, context: any, trigger: CommandTrigger, debug: boolean): boolean {
        if (node.logicType === "CONDITION") {
            const result = this.evaluateCondition(node, trigger);
            if (debug && !result && node.sourceIndex != null) {
                trace(`[Debug]条件失败 → 失败条件位置: ${node.sourceIndex}`);
            }
            return result;
        }

        if (!node.logicConditions || node.logicConditions.length === 0) return true;

        if (node.logicType === "AND") {
            for (let i = 0; i < node.logicConditions.length; i++) {
                if (!this.evaluateLogicNode(node.logicConditions[i], context, trigger, debug)) {
                    return false;
                }
            }
            return true;
        }

        if (node.logicType === "OR") {
            for (let i = 0; i < node.logicConditions.length; i++) {
                if (this.evaluateLogicNode(node.logicConditions[i], context, trigger, debug)) {
                    return true;
                }
            }
            return false;
        }

        return true;
    }

    /**
     * 解析条件树
     * @param arr 条件项数组
     */
    static parseConditionTree(arr: DataStructure_AdvancedConditionalBranchViewer[]): AdvancedConditionalBranchLogicNode[] {
        const root: AdvancedConditionalBranchLogicNode[] = [];
        let currentGroup: AdvancedConditionalBranchLogicNode | null = null;

        for (let i = 0; i < arr.length; i++) {
            const item = arr[i];

            if (item.opt === 1 || item.opt === 2) {
                currentGroup = {
                    logicType: item.opt === 1 ? "AND" : "OR",
                    logicConditions: [],
                    sourceIndex: i
                };
                root.push(currentGroup);
            }
            else if (item.opt === 0) {
                const cond: AdvancedConditionalBranchLogicNode = {
                    logicType: "CONDITION",
                    sourceIndex: i
                };
                Object.assign(cond, item);

                if (currentGroup) {
                    currentGroup.logicConditions!.push(cond);
                } else {
                    root.push(cond);
                }
            }
        }
        return root;
    }
}

module CustomCondition {
    /**
     * 高级条件分歧
     */
    export function f10(trigger: CommandTrigger, p: CustomConditionParams_10): boolean {
        // 伪代码判断
        if (p.opt == 1) {
            //* * 是否安装OpenAPI*/
            // @ts-ignore
            if (typeof OpenAPI == 'undefined' || typeof OpenAPI.System == 'undefined' || OpenAPI.System.Version < 3.8) {
                alert(`【高级条件分歧】\n请安装前置插件 "OpenAPI" 大于等于 v3.8 版本`)
                return false
            }
            const patterns = [
                { regex: /\[@gv(\d+)\]/g, field: 'gameNumber', resolver: CustomCompData.getSuperNumber },
                { regex: /\[@gs(\d+)\]/g, field: 'gameString', resolver: CustomCompData.getSuperString },
                { regex: /\[@gb(\d+)\]/g, field: 'gameBoolean', resolver: CustomCompData.getSuperSwitch },
            ];
            let comparison = p.comparison;
            for (const { regex, field, resolver } of patterns) {
                comparison = comparison.replace(regex, (_, numStr) => {
                    const index = Number(numStr);
                    const rawValue = p.gameVar?.[index]?.[field];
                    const resolved = resolver({ mode: 3, value: rawValue }, trigger);
                    return String(resolved);
                });
            }
            // 启用兼容性情况下
            if (p.compatibility) {
                const patterns = [
                    { regex: /\[@@b(\d+)\]/g, mode: 4, resolver: AdvancedConditionalBranch.getSuperSwitch },
                    { regex: /\[@b(\d+)\]/g, mode: 1, resolver: AdvancedConditionalBranch.getSuperSwitch },
                    { regex: /\[\$\$b(\d+)\]/g, mode: 5, resolver: AdvancedConditionalBranch.getSuperSwitch },
                    { regex: /\[\$b(\d+)\]/g, mode: 2, resolver: AdvancedConditionalBranch.getSuperSwitch },
                ];
                for (const { regex, mode, resolver } of patterns) {
                    comparison = comparison.replace(regex, (_, numStr) => {
                        const index = Number(numStr);
                        const resolved = resolver({ mode: mode, value: index }, trigger);
                        return String(resolved);
                    });
                }
            }

            const math = Variable.margeDynamicText(Variable.splitDynamicText(comparison), Game.player);
            // @ts-ignore
            return OpenAPI.ExpressionEngine.evaluate(math, { debug: (p.debug && !Config.RELEASE_GAME) })
        } else if (p.opt == 0) {
            // 可视化判断
            const rootNodes = AdvancedConditionalBranch.parseConditionTree(p.conditionList);

            let conditions = true;
            for (let i = 0; i < rootNodes.length; i++) {
                if (!AdvancedConditionalBranch.evaluateLogicNode(rootNodes[i], p.conditionList, trigger, p.debug && !Config.RELEASE_GAME)) {
                    conditions = false;
                    break;
                }
            }
            return conditions;
        }
    }
}

/**
 * 高级条件分歧逻辑节点
 */
type AdvancedConditionalBranchLogicNode = {
    /**
     * 逻辑类型
     * AND: 且
     * OR: 或
     * CONDITION: 条件
     */
    logicType: "AND" | "OR" | "CONDITION";
    /**
     * 原始索引
     */
    sourceIndex: number;
    /**
     * 逻辑条件
     */
    logicConditions?: AdvancedConditionalBranchLogicNode[];
} & Partial<DataStructure_AdvancedConditionalBranchViewer>;
