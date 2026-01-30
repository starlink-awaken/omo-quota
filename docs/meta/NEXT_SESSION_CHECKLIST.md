# Next Session Checklist

## Quick Status Check

Run this command first:
```bash
./verify-plugin-loaded.sh
```

Expected result: All checks should pass ✅

---

## If Plugin Not Loaded Yet

### 1. Restart OpenCode
```bash
pkill -f opencode
opencode
```

### 2. Monitor Startup
```bash
tail -f ~/.opencode/logs/*.log | grep omo-quota
```

Look for:
- `[omo-quota] Plugin loaded`
- `[omo-quota] Registered 4 tools`

### 3. Verify Installation
```bash
./test-plugin-installation.sh
```

Should show: **19/19 tests passed**

---

## Testing in Real Session

### Test 1: Quota Status
```
User: "Check my quota status"
Expected: AI uses quota_status tool, shows current usage
```

### Test 2: Strategy Switch
```
User: "Switch to economical strategy"
Expected: AI uses switch_strategy tool, updates config
```

### Test 3: Cost Report
```
User: "Show me today's costs"
Expected: AI uses cost_report tool, displays expense breakdown
```

### Test 4: Sync Data
```
User: "Sync my quota data"
Expected: AI uses sync_quota tool, updates tracker
```

---

## If Tests Fail

### Tool Not Found
1. Check plugin enabled in config
2. Verify tool registration in logs
3. Restart OpenCode

### Tool Execution Error
1. Check CLI is in PATH: `which omo-quota`
2. Test CLI directly: `omo-quota status`
3. Review tool-specific logs

### Config Not Updated
1. Check file permissions on opencode.json
2. Verify strategy files exist
3. Test CLI switch: `omo-quota switch balanced`

---

## Event Hook Verification

### Session Monitor (After 1 hour)
Check logs for:
```
[omo-quota] Periodic sync triggered
[omo-quota] Quota data updated
```

### Low Quota Alert (When Idle)
If any provider < 20%:
```
[omo-quota] Low quota detected: [provider]
[omo-quota] Notification sent to user
```

---

## Files to Review

### Plugin Code
- `plugin/src/index.ts` - Entry point
- `plugin/src/tools/*.ts` - Tool implementations
- `plugin/dist/index.js` - Built bundle

### Configuration
- `~/.config/opencode/opencode.json` - Plugin config
- `~/.config/opencode/strategies/*.jsonc` - Strategy files
- `~/.omo-quota-tracker.json` - Tracker data

### Documentation
- `PLUGIN_INSTALLATION_COMPLETE.md` - Full report
- `SESSION_COMPLETE.md` - Session summary
- `plugin/README.md` - Plugin API docs

---

## Common Commands

```bash
# Test installation
./test-plugin-installation.sh

# Verify plugin loaded
./verify-plugin-loaded.sh

# Check CLI
omo-quota status
omo-quota list

# View logs
tail -50 ~/.opencode/logs/*.log | grep omo-quota

# Check config
cat ~/.config/opencode/opencode.json | grep -A 5 omo-quota
```

---

## Success Criteria

- [ ] Plugin loads without errors
- [ ] All 4 tools registered
- [ ] AI can invoke tools in session
- [ ] Strategy switching works
- [ ] Event hooks trigger correctly
- [ ] CLI commands functional

---

## If Everything Works

🎉 **Plugin is production-ready!**

Consider:
1. Testing all 4 tools in different scenarios
2. Monitoring event hooks over time
3. Adjusting strategy budgets
4. Adding custom tools (optional)

---

## Support Resources

- **Issues?** Check `PLUGIN_INSTALLATION_COMPLETE.md` Troubleshooting section
- **API Reference?** See `plugin/README.md`
- **Usage Guide?** Read `QUICK_START.md`
- **Skills Help?** Review `SKILL_COMPARISON.md`

---

**Quick Summary:**
- Installation: ✅ Complete (19/19 tests passed)
- Configuration: ✅ All files created
- Build: ✅ dist/index.js (453KB)
- Status: ⏳ Awaiting OpenCode restart

**Next Action:** Restart OpenCode and verify plugin loads!
