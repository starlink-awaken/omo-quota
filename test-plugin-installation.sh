#!/bin/bash

echo "==================================="
echo "OMO-QUOTA Plugin Installation Test"
echo "==================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试计数器
PASS=0
FAIL=0

# 测试函数
test_item() {
    local description="$1"
    local test_command="$2"
    
    printf "Testing: %-50s " "$description"
    
    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((PASS++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        ((FAIL++))
        return 1
    fi
}

echo "Phase 1: Plugin Files"
echo "---------------------"
test_item "Plugin directory exists" "[ -d ~/.config/opencode/plugins/omo-quota ]"
test_item "Plugin dist/index.js exists" "[ -f ~/.config/opencode/plugins/omo-quota/dist/index.js ]"
test_item "Plugin package.json exists" "[ -f ~/.config/opencode/plugins/omo-quota/package.json ]"
test_item "Plugin README exists" "[ -f ~/.config/opencode/plugins/omo-quota/README.md ]"
echo ""

echo "Phase 2: Configuration Files"
echo "----------------------------"
test_item "OpenCode config exists" "[ -f ~/.config/opencode/opencode.json ]"
test_item "Plugin registered in config" "grep -q '\"~/.config/opencode/plugins/omo-quota\"' ~/.config/opencode/opencode.json"
test_item "Plugin config section exists" "grep -q '\"omo-quota\":' ~/.config/opencode/opencode.json"
test_item "Tracker file exists" "[ -f ~/.omo-quota-tracker.json ]"
echo ""

echo "Phase 3: Strategy Files"
echo "----------------------"
test_item "Strategies directory exists" "[ -d ~/.config/opencode/strategies ]"
test_item "Performance strategy exists" "[ -f ~/.config/opencode/strategies/strategy-1-performance.jsonc ]"
test_item "Balanced strategy exists" "[ -f ~/.config/opencode/strategies/strategy-2-balanced.jsonc ]"
test_item "Economical strategy exists" "[ -f ~/.config/opencode/strategies/strategy-3-economical.jsonc ]"
echo ""

echo "Phase 4: CLI Tool"
echo "----------------"
test_item "omo-quota CLI installed" "command -v omo-quota"
test_item "CLI can run status command" "omo-quota status"
test_item "CLI can list strategies" "omo-quota list"
echo ""

echo "Phase 5: Skills"
echo "--------------"
test_item "Agent skill installed" "[ -f ~/.config/opencode/skills/quota-manager.md ]"
test_item "Documentation skill exists" "[ -f .opencode/skill/omo-quota/SKILL.md ]"
echo ""

echo "Phase 6: Plugin Configuration"
echo "-----------------------------"
if [ -f ~/.config/opencode/opencode.json ]; then
    echo "Plugin Configuration:"
    grep -A 5 '"omo-quota":' ~/.config/opencode/opencode.json | sed 's/^/  /'
    echo ""
fi

echo "Phase 7: Plugin Dependencies"
echo "---------------------------"
cd ~/.config/opencode/plugins/omo-quota
if [ -f package.json ]; then
    echo "Checking node_modules..."
    test_item "Dependencies installed" "[ -d node_modules ]"
    test_item "@opencode-ai/plugin installed" "[ -d node_modules/@opencode-ai/plugin ]"
fi
echo ""

echo "==================================="
echo "Test Summary"
echo "==================================="
echo -e "${GREEN}Passed: $PASS${NC}"
echo -e "${RED}Failed: $FAIL${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed! Plugin is ready.${NC}"
    echo ""
    echo "Next Steps:"
    echo "1. Restart OpenCode to load the plugin"
    echo "2. Check logs: tail -f ~/.opencode/logs/*.log | grep omo-quota"
    echo "3. Test in session: 'Check my quota status'"
    echo ""
else
    echo -e "${RED}✗ Some tests failed. Please review above.${NC}"
    echo ""
fi
