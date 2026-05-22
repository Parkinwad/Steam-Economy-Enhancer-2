# Test Plan for Deal Scanner Settings Persistence Fix

## Issue Summary
Deal scanner number input settings were not showing default values when opening settings page, even after implementing Option 3 (type conversion in getSettingWithDefault()).

## Root Cause Identified
When opening settings for the **first time** (no previous saves):
1. Inputs are rendered with default values from `settingDefaults` (numeric)
2. But these defaults are **never saved to localStorage**
3. On reload, if no value exists in localStorage, it reads null and returns default - BUT this only works for settings that were previously saved!

## Solution Applied
Added code at beginning of `openSettings()` function to save initial default values to localStorage on first open:

```javascript
// Save default values to localStorage on first open (if not already present)
const dealScannerSettings = ['SETTING_DEAL_SCANNER_ENABLED', 'SETTING_DEAL_MIN_PROFIT_CENTS', 
    'SETTING_DEAL_BOOSTER_MIN_PROFIT_CENTS', 'SETTING_DEAL_MAX_ITEMS_PER_SCAN', 
    'SETTING_DEAL_MAX_SPEND_PER_SCAN', 'SETTING_DEAL_SCAN_DELAY_MS'];

for (const setting of dealScannerSettings) {
    const storedValue = getLocalStorageItem(setting);
    if (storedValue === null) {
        // First time opening - save default value
        setSetting(setting, settingDefaults[setting]);
    }
}
```

## Test Plan

### Test 1: Fresh Browser (No localStorage)
**Steps:**
1. Open fresh browser/incognito window
2. Navigate to Steam trading page
3. Click settings button
4. **Expected**: All deal scanner number inputs show default values (15, 25, 50, 10, 3000)

### Test 2: After Saving and Reloading
**Steps:**
1. Open settings in fresh browser
2. Verify defaults are shown
3. Change some values (e.g., Min Profit for Cards to 20 cents)
4. Click Save button
5. Reload page
6. Reopen settings
7. **Expected**: Changed value persists (20), other defaults show correctly

### Test 3: Mixed State After Partial Saves
**Steps:**
1. Open settings, change only Min Profit for Cards to 20
2. Save and reload
3. Open settings again without changing anything else
4. Change Max Items Per Scan to 75
5. Save and reload  
6. Reopen settings
7. **Expected**: Both values persist (Min Profit: 20, Max Items: 75), others show defaults

## Verification Commands

```powershell
# Check if default saving code was added correctly
Select-String -Path code.user.js -Pattern 'Save default values to localStorage' | Select-Object LineNumber,Line

# Verify deal scanner settings array includes all 6 settings
Select-String -Path code.user.js -Pattern "dealScannerSettings\s*=" | ForEach-Object { Write-Host $_.Line }

# Check the for loop syntax
Select-String -Path code.user.js -Pattern 'for \(const setting of dealScannerSettings\)' | ForEach-Object { Write-Host $_.Line }
```

## Expected Results After Fix
- ✅ First-time users see all default values when opening settings
- ✅ Values persist after save and reload
- ✅ Mixed state (some changed, some defaults) works correctly
- ✅ No JavaScript errors in console
