#!/bin/bash
# init命令策略生成功能测试脚本

set -e

echo "========================================"
echo "omo-quota Init命令策略生成功能测试"
echo "========================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试计数
PASSED=0
FAILED=0

# 测试函数
test_case() {
    local name="$1"
    local command="$2"
    local expected="$3"

    echo -n "测试: $name ... "

    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ 通过${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ 失败${NC}"
        ((FAILED++))
        return 1
    fi
}

echo "1. 清理现有配置"
echo "----------------------------------------"
rm -f ~/.omo-quota-tracker.json
rm -rf ~/.config/opencode/strategies
echo -e "${GREEN}✓ 清理完成${NC}"
echo ""

echo "2. 运行init命令"
echo "----------------------------------------"
bun run src/index.ts init
echo ""

echo "3. 验证生成的文件"
echo "----------------------------------------"
test_case "配额追踪文件存在" \
    "[ -f ~/.omo-quota-tracker.json ]"

test_case "策略目录存在" \
    "[ -d ~/.config/opencode/strategies ]"

test_case "Performance策略文件存在" \
    "[ -f ~/.config/opencode/strategies/strategy-1-performance.jsonc ]"

test_case "Balanced策略文件存在" \
    "[ -f ~/.config/opencode/strategies/strategy-2-balanced.jsonc ]"

test_case "Economical策略文件存在" \
    "[ -f ~/.config/opencode/strategies/strategy-3-economical.jsonc ]"
echo ""

echo "4. 验证文件内容"
echo "----------------------------------------"
test_case "Performance包含schema" \
    "grep -q '\$schema' ~/.config/opencode/strategies/strategy-1-performance.jsonc"

test_case "Balanced包含providers" \
    "grep -q '\"providers\"' ~/.config/opencode/strategies/strategy-2-balanced.jsonc"

test_case "Economical包含agents" \
    "grep -q '\"agents\"' ~/.config/opencode/strategies/strategy-3-economical.jsonc"

test_case "Performance包含注释" \
    "grep -q 'PERFORMANCE 策略配置' ~/.config/opencode/strategies/strategy-1-performance.jsonc"

test_case "Balanced包含Sisyphus配置" \
    "grep -q 'zhipuai-coding-plan/glm-4.7' ~/.config/opencode/strategies/strategy-2-balanced.jsonc"
echo ""

echo "5. 测试switch命令"
echo "----------------------------------------"
echo "切换到economical策略..."
bun run src/index.ts switch economical > /dev/null 2>&1
test_case "切换到economical成功" \
    "grep -q '经济节约' ~/.config/opencode/oh-my-opencode.jsonc"

echo "切换到balanced策略..."
bun run src/index.ts switch balanced > /dev/null 2>&1
test_case "切换到balanced成功" \
    "grep -q '均衡实用' ~/.config/opencode/oh-my-opencode.jsonc"

echo "切换到performance策略..."
bun run src/index.ts switch performance > /dev/null 2>&1
test_case "切换到performance成功" \
    "grep -q '极致性能' ~/.config/opencode/oh-my-opencode.jsonc"
echo ""

echo "6. 验证备份功能"
echo "----------------------------------------"
test_case "备份文件已创建" \
    "[ -f ~/.config/opencode/oh-my-opencode.backup.jsonc ]"
echo ""

echo "========================================"
echo "测试结果汇总"
echo "========================================"
echo -e "通过: ${GREEN}$PASSED${NC}"
echo -e "失败: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ 所有测试通过！${NC}"
    exit 0
else
    echo -e "${RED}✗ 有测试失败，请检查${NC}"
    exit 1
fi
