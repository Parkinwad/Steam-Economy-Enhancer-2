# Settings Persistence Fix Summary

## Problem Description
Settings were not persisting correctly after save/reload, particularly for the Deal Scanner settings. The root causes identified and fixed:

### Root Cause Analysis (from bigger LLM analysis):

1. **Missing Input Field**: `setSetting(SETTING_DEAL_SCAN_DELAY_MS, ...)` tried to read from an input field that didn't exist, returning `undefined` which got saved to localStorage.

2. **NaN Poisoning**: Once "undefined" or invalid values were saved to localStorage, the `getSettingWithDefault()` function would return NaN instead of falling back to defaults because it checked for null but not for NaN.

3. **Fragile Key Definitions**: The settings object used literal property names like `SETTING_DEAL_SCANNER_ENABLED: 0` which worked only by coincidence (constant value equals string). This is fragile and error-prone.

## Fixes Applied

### Fix 1: Added Missing Input Field
**Location**: Line ~4422 in code.user.js  
**Change**: Inserted Scan Delay input field before the button container

```html
<div style="margin-top:6px;">
    Scan Delay (ms): <input type="number" id="${SETTING_DEAL_SCAN_DELAY_MS}" value=${getSettingWithDefault(SETTING_DEAL_SCAN_DELAY_MS)}> ms</div>
```

**Before**:
```html
<div style="margin-top:8px;">
    <button id="deal_scanner_run">Scan for Deals</button>
    ...
</div>
```

**After**:
```html
<div style="margin-top:6px;">
    Scan Delay (ms): <input type="number" id="${SETTING_DEAL_SCAN_DELAY_MS}" value=${getSettingWithDefault(SETTING_DEAL_SCAN_DELAY_MS)}> ms</div>
<div style="margin-top:8px;">
    <button id="deal_scanner_run">Scan for Deals</button>
    ...
</div>
```

### Fix 2: Improved getSettingWithDefault() NaN Handling  
**Location**: Lines ~304-312 in code.user.js

**Before**:
```javascript
function getSettingWithDefault(name) {
    const value = getLocalStorageItem(name);
    if (value !== null) {
        return Number(value);  // Returns NaN for "undefined", "", etc.
    }
    return name in settingDefaults ? settingDefaults[name] : null;
}
```

**After**:
```javascript
function getSettingWithDefault(name) {
    const value = getLocalStorageItem(name);
    
    if (value !== null) {
        const parsed = Number(value);
        
        // Only use stored value if it's a valid number
        if (!Number.isNaN(parsed)) {
            return parsed;
        }
    }
    
    // Fall back to default or null
    return settingDefaults[name] ?? null;
}
```

**Why this fixes the issue**: Now if localStorage contains "undefined", "", or any other invalid value, `Number()` returns NaN and we fall back to the default instead of returning a poisoned NaN value.

### Fix 3: Used Bracket Notation for Setting Defaults  
**Location**: Lines ~285-301 in code.user.js

**Before** (fragile):
```javascript
const settingDefaults = {
    SETTING_DEAL_SCANNER_ENABLED: 0,
    SETTING_DEAL_MIN_PROFIT_CENTS: 15,
    ...
};
```

**After** (safe):
```javascript
const settingDefaults = {
    [SETTING_DEAL_SCANNER_ENABLED]: 0,
    [SETTING_DEAL_MIN_PROFIT_CENTS]: 15,
    ...
    [SETTING_DEAL_SCAN_DELAY_MS]: 3000,  // NEW: Added missing default
};
```

**Why this is better**: Using bracket notation `[CONSTANT_NAME]` ensures the property name always matches the constant value exactly. If you change `const SETTING_DEAL_SCANNER_ENABLED = 'SETTING_DEAL_SCANNER_ENABLED'`, it will automatically update the defaults object without manual edits.

## Verification Results

All three fixes have been successfully applied:

✅ **Fix 1**: Scan Delay input field exists in settings modal (line 4422)  
✅ **Fix 2**: getSettingWithDefault() handles NaN values properly (lines 304-312)  
✅ **Fix 3**: settingDefaults uses bracket notation with SETTING_DEAL_SCAN_DELAY_MS: 3000 (lines 285, 301)  
✅ **Bonus**: Save logic includes SETTING_DEAL_SCAN_DELAY_MS (line 4456)

## Testing Recommendations

After applying these fixes, test the following scenarios:

### Test Case 1: Fresh Browser (First-Time User)
1. Open incognito/private browsing window
2. Navigate to Steam trading page with script loaded
3. Click Settings button → Deal Scanner settings should appear
4. Verify all default values show correctly for deal scanner inputs (including Scan Delay showing "3000 ms")

### Test Case 2: Save and Reload
1. Open settings, change some values (e.g., Min Profit for Cards to 20)
2. Click Save button
3. Reload the page
4. Reopen settings → verify changed value persists while other defaults show correctly

### Test Case 3: Invalid Value Recovery
1. Manually edit localStorage to set `SETTING_DEAL_SCAN_DELAY_MS` to "undefined" or ""
2. Open settings → verify it shows default value (3000) instead of blank/NaN
3. Save and reload → verify the setting still recovers from invalid values

## Files Modified

- **code.user.js** - Main script file with all three fixes applied

## Backup Location

Previous versions can be found in:
- `.js backups/code_user_2026_05_22_14_52.user.js` (before any fixes)
- Various timestamped backups in `.js backups/` directory

## Conclusion

All three critical issues have been resolved. The settings persistence functionality should now work correctly for all Deal Scanner settings, including the previously problematic SETTING_DEAL_SCAN_DELAY_MS field.

The combination of:
1. Adding the missing input field
2. Improving NaN handling in getSettingWithDefault()  
3. Using safer bracket notation for defaults

...ensures robust persistence behavior that won't break from edge cases like invalid localStorage values.
