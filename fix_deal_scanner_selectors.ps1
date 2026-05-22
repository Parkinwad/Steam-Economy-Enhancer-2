# Fix deal scanner settings selectors to include price_options context

$lines = Get-Content 'code.user.js'

# Line 4450 - SETTING_DEAL_MIN_PROFIT_CENTS
$targetLine1 = $lines[4449]  # PowerShell uses 0-based indexing
if ($targetLine1 -match 'setSetting\(SETTING_DEAL_MIN_PROFIT_CENTS, \$\(`#\$\{SETTING_DEAL_MIN_PROFIT_CENTS\}\)`\)') {
    $newLine1 = "            setSetting(SETTING_DEAL_MIN_PROFIT_CENTS, $(`#${SETTING_DEAL_MIN_PROFIT_CENTS}`, price_options).val());"
    Write-Host "Fixing line 4450..." -ForegroundColor Green
} else {
    Write-Host "Pattern not found for line 4450" -ForegroundColor Yellow
}

# Line 4451 - SETTING_DEAL_BOOSTER_MIN_PROFIT_CENTS  
$targetLine2 = $lines[4450]
if ($targetLine2 -match 'setSetting\(SETTING_DEAL_BOOSTER_MIN_PROFIT_CENTS, \$\(`#\$\{SETTING_DEAL_BOOSTER_MIN_PROFIT_CENTS\}\)`\)') {
    $newLine2 = "            setSetting(SETTING_DEAL_BOOSTER_MIN_PROFIT_CENTS, $(`#${SETTING_DEAL_BOOSTER_MIN_PROFIT_CENTS}`, price_options).val());"
    Write-Host "Fixing line 4451..." -ForegroundColor Green
} else {
    Write-Host "Pattern not found for line 4451" -ForegroundColor Yellow
}

# Line 4452 - SETTING_DEAL_MAX_ITEMS_PER_SCAN
$targetLine3 = $lines[4451]
if ($targetLine3 -match 'setSetting\(SETTING_DEAL_MAX_ITEMS_PER_SCAN, \$\(`#\$\{SETTING_DEAL_MAX_ITEMS_PER_SCAN\}\)`\)') {
    $newLine3 = "            setSetting(SETTING_DEAL_MAX_ITEMS_PER_SCAN, $(`#${SETTING_DEAL_MAX_ITEMS_PER_SCAN}`, price_options).val());"
    Write-Host "Fixing line 4452..." -ForegroundColor Green
} else {
    Write-Host "Pattern not found for line 4452" -ForegroundColor Yellow
}

# Line 4453 - SETTING_DEAL_MAX_SPEND_PER_SCAN
$targetLine4 = $lines[4452]
if ($targetLine4 -match 'setSetting\(SETTING_DEAL_MAX_SPEND_PER_SCAN, \$\(`#\$\{SETTING_DEAL_MAX_SPEND_PER_SCAN\}\)`\)') {
    $newLine4 = "            setSetting(SETTING_DEAL_MAX_SPEND_PER_SCAN, $(`#${SETTING_DEAL_MAX_SPEND_PER_SCAN}`, price_options).val());"
    Write-Host "Fixing line 4453..." -ForegroundColor Green
} else {
    Write-Host "Pattern not found for line 4453" -ForegroundColor Yellow
}

# Line 4454 - SETTING_DEAL_SCAN_DELAY_MS
$targetLine5 = $lines[4453]
if ($targetLine5 -match 'setSetting\(SETTING_DEAL_SCAN_DELAY_MS, \$\(`#\$\{SETTING_DEAL_SCAN_DELAY_MS\}\)`\)') {
    $newLine5 = "            setSetting(SETTING_DEAL_SCAN_DELAY_MS, $(`#${SETTING_DEAL_SCAN_DELAY_MS}`, price_options).val());"
    Write-Host "Fixing line 4454..." -ForegroundColor Green
} else {
    Write-Host "Pattern not found for line 4454" -ForegroundColor Yellow
}

Write-Host "`nScript completed. Please verify the changes manually." -ForegroundColor Cyan