#!/bin/bash

echo "======================================"
echo "OMO-QUOTA Plugin Load Verification"
echo "======================================"
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

LOG_DIR="$HOME/.opencode/logs"
LATEST_LOG=$(ls -t "$LOG_DIR"/*.log 2>/dev/null | head -1)

if [ -z "$LATEST_LOG" ]; then
    echo -e "${RED}✗ No OpenCode logs found${NC}"
    echo "  Expected location: $LOG_DIR/"
    echo ""
    echo "Possible causes:"
    echo "  1. OpenCode hasn't been started yet"
    echo "  2. Logs directory doesn't exist"
    echo "  3. Different log location"
    exit 1
fi

echo -e "${BLUE}Checking latest log:${NC} $LATEST_LOG"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Plugin Loading"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if grep -q "omo-quota" "$LATEST_LOG"; then
    echo -e "${GREEN}✓ omo-quota plugin referenced in logs${NC}"
    
    if grep -q "Plugin loaded" "$LATEST_LOG" | grep -q "omo-quota"; then
        echo -e "${GREEN}✓ Plugin successfully loaded${NC}"
    else
        echo -e "${YELLOW}⚠ Plugin referenced but load confirmation not found${NC}"
    fi
else
    echo -e "${RED}✗ No omo-quota references in logs${NC}"
    echo ""
    echo "Troubleshooting steps:"
    echo "  1. Check if OpenCode was restarted after installation"
    echo "  2. Verify plugin path in opencode.json"
    echo "  3. Check for error messages in full log"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. Tool Registration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

TOOLS=("quota_status" "switch_strategy" "sync_quota" "cost_report")
FOUND_TOOLS=0

for tool in "${TOOLS[@]}"; do
    if grep -q "$tool" "$LATEST_LOG"; then
        echo -e "${GREEN}✓ Tool registered: $tool${NC}"
        ((FOUND_TOOLS++))
    else
        echo -e "${RED}✗ Tool not found: $tool${NC}"
    fi
done

if [ $FOUND_TOOLS -eq 4 ]; then
    echo -e "\n${GREEN}✓ All 4 tools registered successfully${NC}"
elif [ $FOUND_TOOLS -gt 0 ]; then
    echo -e "\n${YELLOW}⚠ Only $FOUND_TOOLS/4 tools found${NC}"
else
    echo -e "\n${RED}✗ No tools found in logs${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. Event Hooks"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if grep -q "session-monitor" "$LATEST_LOG" || grep -q "event hook" "$LATEST_LOG" | grep -q "omo-quota"; then
    echo -e "${GREEN}✓ Session monitor hook registered${NC}"
else
    echo -e "${YELLOW}⚠ Session monitor hook not confirmed${NC}"
fi

if grep -q "session.idle" "$LATEST_LOG" | grep -q "omo-quota"; then
    echo -e "${GREEN}✓ Low quota notification hook registered${NC}"
else
    echo -e "${YELLOW}⚠ Notification hook not confirmed${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

CONFIG_FILE="$HOME/.config/opencode/opencode.json"
if grep -q '"omo-quota"' "$CONFIG_FILE"; then
    echo -e "${GREEN}✓ Plugin configuration exists${NC}"
    
    ENABLED=$(grep -A 5 '"omo-quota":' "$CONFIG_FILE" | grep '"enabled"' | grep -o 'true\|false')
    if [ "$ENABLED" = "true" ]; then
        echo -e "${GREEN}✓ Plugin is enabled${NC}"
    else
        echo -e "${RED}✗ Plugin is disabled${NC}"
    fi
else
    echo -e "${RED}✗ Plugin configuration not found${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5. Recent Activity"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "Last 10 omo-quota related log entries:"
echo ""
grep "omo-quota" "$LATEST_LOG" | tail -10 | while IFS= read -r line; do
    echo "  $line"
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $FOUND_TOOLS -eq 4 ] && grep -q "omo-quota" "$LATEST_LOG"; then
    echo -e "${GREEN}✓ Plugin appears to be loaded correctly${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Start a new OpenCode session"
    echo "  2. Try: 'Check my quota status'"
    echo "  3. Try: 'Switch to economical strategy'"
    echo ""
else
    echo -e "${YELLOW}⚠ Plugin may not be fully loaded${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Review full log: cat $LATEST_LOG | grep -i error"
    echo "  2. Check plugin path: cat $CONFIG_FILE | grep omo-quota"
    echo "  3. Verify dist/index.js exists"
    echo "  4. Restart OpenCode again"
    echo ""
fi

echo "Full log file: $LATEST_LOG"
