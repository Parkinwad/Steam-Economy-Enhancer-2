// Merge Script: Save default values when opening settings for the first time
// This ensures that on first open (no localStorage data), defaults are saved so they persist

// Find and replace in code.user.js:
// After line 4340: function openSettings() {
// Add: Save initial defaults to localStorage if not already present

const lines = Get-Content code.user.js;

// Find the beginning of openSettings function (line 4340)
$startLine = $null;
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i].Trim() -eq 'function openSettings() {') {
        $startLine = $i + 1;
        break;
    }
}

if (-not $startLine) {
    Write-Host "ERROR: Could not find function openSettings()" -ForegroundColor Red
    exit 1;
}

Write-Host "Found openSettings() at line $startLine" -ForegroundColor Cyan

// Add code to save defaults if localStorage is empty (first-time open)
$defaultSaveCode = `n            // Save default values to localStorage on first open (if not already present)`n`n            foreach ($setting in [System.Collections.Generic.List[string]]@(`n                'SETTING_DEAL_SCANNER_ENABLED',`n                'SETTING_DEAL_MIN_PROFIT_CENTS',`n                'SETTING_DEAL_BOOSTER_MIN_PROFIT_CENTS',`n                'SETTING_DEAL_MAX_ITEMS_PER_SCAN',`n                'SETTING_DEAL_MAX_SPEND_PER_SCAN'`n            )) {`n                const storedValue = getLocalStorageItem($setting);`n                if (storedValue === null) {`n                    // First time opening - save default value`n                    setSetting($setting, settingDefaults[$setting]);`n                }`n            }`;

// Insert the code after line 4340
$lines.Insert(4341, $defaultSaveCode);

Write-Content $lines code.user.js;
Write-Host "SUCCESS: Default values save code added to openSettings()" -ForegroundColor Green