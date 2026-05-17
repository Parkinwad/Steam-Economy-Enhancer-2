const fs = require('fs');

const filePath = 'code.user.js';
let content = fs.readFileSync(filePath, 'utf8');

console.log('Starting merge of customizations into code.user.js...');
console.log('Current file size:', content.length, 'characters');

// Helper to avoid template literal evaluation issues
const TL = String.fromCharCode(96); // backtick
const TB = String.fromCharCode(36) + String.fromCharCode(123); // ${
const TE = String.fromCharCode(125); // }

// ============================================================================
// STEP 1: Add custom setting constants to the Settings region
// ============================================================================
console.log('Step 1: Adding custom setting constants...');

const constantsToAdd = [
    '',
    '    // Custom optimizations settings',
    "    const SETTING_MIN_NET_PROFIT_CENTS = 'SETTING_MIN_NET_PROFIT_CENTS';",
    "    const SETTING_DEMAND_THRESHOLD = 'SETTING_DEMAND_THRESHOLD';",
    "    const SETTING_DEMAND_DISCOUNT = 'SETTING_DEMAND_DISCOUNT';",
    '    // Deal scanner settings',
    "    const SETTING_DEAL_SCANNER_ENABLED = 'SETTING_DEAL_SCANNER_ENABLED';",
    "    const SETTING_DEAL_MIN_PROFIT_CENTS = 'SETTING_DEAL_MIN_PROFIT_CENTS';",
    "    const SETTING_DEAL_BOOSTER_MIN_PROFIT_CENTS = 'SETTING_DEAL_BOOSTER_MIN_PROFIT_CENTS';",
    "    const SETTING_DEAL_MAX_ITEMS_PER_SCAN = 'SETTING_DEAL_MAX_ITEMS_PER_SCAN';",
    "    const SETTING_DEAL_MAX_SPEND_PER_SCAN = 'SETTING_DEAL_MAX_SPEND_PER_SCAN';",
    "    const SETTING_DEAL_SCAN_DELAY_MS = 'SETTING_DEAL_SCAN_DELAY_MS';",
].join('\n');

const settingsRegionEndMarker = '    }\n\n    function setSetting';
const settingsRegionEnd = content.indexOf(settingsRegionEndMarker);
if (settingsRegionEnd === -1) {
    console.error('Could not find Settings region end marker');
    process.exit(1);
}

const insertPoint = settingsRegionEnd;
content = content.slice(0, insertPoint) + constantsToAdd + content.slice(insertPoint);
console.log('Constants added successfully');

// ============================================================================
// STEP 2: Add custom defaults to settingDefaults
// ============================================================================
console.log('Step 2: Adding custom defaults...');

const defaultsToAdd = [
    '',
    '        // Custom optimizations defaults',
    '        SETTING_MIN_NET_PROFIT_CENTS: 5,',
    '        SETTING_DEMAND_THRESHOLD: 1.2,',
    '        SETTING_DEMAND_DISCOUNT: 0.02,',
    '        // Deal Scanner defaults',
    '        SETTING_DEAL_SCANNER_ENABLED: 0,',
    '        SETTING_DEAL_MIN_PROFIT_CENTS: 15,',
    '        SETTING_DEAL_BOOSTER_MIN_PROFIT_CENTS: 25,',
    '        SETTING_DEAL_MAX_ITEMS_PER_SCAN: 50,',
    '        SETTING_DEAL_MAX_SPEND_PER_SCAN: 10,',
    '        SETTING_DEAL_SCAN_DELAY_MS: 3000,',
].join('\n');

const settingDefaultsEndMarker = '        SETTING_RELIST_AUTOMATICALLY: 0\n    };';
const settingDefaultsEnd = content.indexOf(settingDefaultsEndMarker);
if (settingDefaultsEnd === -1) {
    console.error('Could not find settingDefaults end');
    process.exit(1);
}

const defaultsInsertPoint = settingDefaultsEnd + '        SETTING_RELIST_AUTOMATICALLY: 0'.length;
content = content.slice(0, defaultsInsertPoint) + defaultsToAdd + content.slice(defaultsInsertPoint);
console.log('Defaults added successfully');

// ============================================================================
// STEP 3: Replace calculateSellPriceBeforeFees with optimized version
// ============================================================================
console.log('Step 3: Replacing calculateSellPriceBeforeFees...');

const oldFunction = `    function calculateSellPriceBeforeFees(history, orderbook, applyOffset, minPriceBeforeFees, maxPriceBeforeFees) {
        const historyPrice = calculateAverageHistoryPriceBeforeFees(history);
        const listingPrice = calculateListingPriceBeforeFees(orderbook);
        const buyPrice = calculateBuyOrderPriceBeforeFees(orderbook);

        const shouldUseAverage = getSettingWithDefault(SETTING_PRICE_ALGORITHM) == 1;
        const shouldUseBuyOrder = getSettingWithDefault(SETTING_PRICE_ALGORITHM) == 3;

        // If the highest average price is lower than the first listing, return the offset + that listing.
        // Otherwise, use the highest average price instead.
        let calculatedPrice = 0;
        if (shouldUseBuyOrder && buyPrice !== -2) {
            calculatedPrice = buyPrice;
        } else if (historyPrice < listingPrice || !shouldUseAverage) {
            calculatedPrice = listingPrice;
        } else {
            calculatedPrice = historyPrice;
        }

        let changedToMax = false;
        // List for the maximum price if there are no listings yet.
        if (calculatedPrice == 0) {
            calculatedPrice = maxPriceBeforeFees;
            changedToMax = true;
        }


        // Apply the offset to the calculated price, but only if the price wasn't changed to the max (as otherwise it's impossible to list for this price).
        if (!changedToMax && applyOffset) {
            calculatedPrice = calculatedPrice + getSettingWithDefault(SETTING_PRICE_OFFSET) * 100;
        }


        // Keep our minimum and maximum in mind.
        calculatedPrice = clamp(calculatedPrice, minPriceBeforeFees, maxPriceBeforeFees);


        // In case there's a buy order higher than the calculated price.
        if (typeof orderbook !== 'undefined' && orderbook != null && orderbook.highest_buy_order != null) {
            const buyOrderPrice = market.getPriceBeforeFees(orderbook.highest_buy_order);
            if (buyOrderPrice > calculatedPrice) {
                calculatedPrice = buyOrderPrice;
            }
        }

        return calculatedPrice;
    }
    //#endregion`;

const newFunction = `    function calculateSellPriceBeforeFees(history, orderbook, applyOffset, minPriceBeforeFees, maxPriceBeforeFees) {
        const historyPrice = calculateAverageHistoryPriceBeforeFees(history);
        const listingPrice = calculateListingPriceBeforeFees(orderbook);
        const buyPrice = calculateBuyOrderPriceBeforeFees(orderbook);

        const shouldUseAverage = getSettingWithDefault(SETTING_PRICE_ALGORITHM) == 1;
        const shouldUseBuyOrder = getSettingWithDefault(SETTING_PRICE_ALGORITHM) == 3;

        // --- Optimization 1: Fee-Exact Net Profit Targeting ---
        // Calculate the price that yields our desired net profit after Steam + Publisher fees.
        const minNetProfitCents = getSettingWithDefault(SETTING_MIN_NET_PROFIT_CENTS) * 100;
        const minGrossPrice = market.getPriceBeforeFeesForDesiredReceivedAmount(minNetProfitCents);

        // --- Optimization 2: Liquidity-Aware Price Adjustment ---
        let demandScore = 1.0;
        if (history && history.length > 0) {
            const recentVolume = history[0][2];
            const avgVolume = history.reduce((sum, item) => sum + item[2], 0) / history.length;
            if (avgVolume > 0) {
                demandScore = recentVolume / avgVolume;
            }
        }

        let basePrice = listingPrice;

        if (shouldUseBuyOrder && buyPrice !== -2) {
            basePrice = buyPrice;
        } else if (historyPrice > listingPrice && shouldUseAverage) {
            basePrice = historyPrice;
        }

        let adjustedPrice = basePrice;
        if (demandScore > getSettingWithDefault(SETTING_DEMAND_THRESHOLD)) {
            if (buyPrice > basePrice * 1.05) {
                adjustedPrice = buyPrice;
            } else {
                adjustedPrice = basePrice * 1.02;
            }
        } else if (demandScore < 0.5) {
            const discount = getSettingWithDefault(SETTING_DEMAND_DISCOUNT) * basePrice;
            adjustedPrice = basePrice - discount;
        }

        let finalPrice = Math.max(adjustedPrice, minGrossPrice);

        if (finalPrice == 0) {
            finalPrice = maxPriceBeforeFees;
        }

        if (applyOffset) {
            finalPrice = finalPrice + getSettingWithDefault(SETTING_PRICE_OFFSET) * 100;
        }

        finalPrice = clamp(finalPrice, minPriceBeforeFees, maxPriceBeforeFees);

        if (typeof orderbook !== 'undefined' && orderbook != null && orderbook.highest_buy_order != null) {
            const buyOrderPrice = market.getPriceBeforeFees(orderbook.highest_buy_order);
            if (buyOrderPrice > finalPrice) {
                finalPrice = buyOrderPrice;
            }
        }

        return finalPrice;
    }
    //#endregion`;

if (content.includes(oldFunction)) {
    content = content.replace(oldFunction, newFunction);
    console.log('Successfully replaced calculateSellPriceBeforeFees function');
} else {
    console.error('Could not find the target calculateSellPriceBeforeFees function');
    process.exit(1);
}

// ============================================================================
// STEP 4: Inject Deal Scanner module
// ============================================================================
console.log('Step 4: Injecting Deal Scanner module...');

const dealScannerCode = fs.readFileSync('deal_scanner_code.txt', 'utf8');
const insertBeforePoint = content.indexOf('    //#region Integer helpers');

if (insertBeforePoint === -1) {
    console.error('Could not find Integer helpers region');
    process.exit(1);
}

content = content.slice(0, insertBeforePoint) + '\n\n' + dealScannerCode + '\n\n' + content.slice(insertBeforePoint);
console.log('Deal Scanner module injected successfully');

// ============================================================================
// STEP 5: Add event handlers
// ============================================================================
console.log('Step 5: Adding settings event handlers...');

const eventHandlers = [
    '',
    '            setSetting(SETTING_MIN_NET_PROFIT_CENTS, $(`#${SETTING_MIN_NET_PROFIT_CENTS}`).val());',
    '            setSetting(SETTING_DEMAND_THRESHOLD, $(`#${SETTING_DEMAND_THRESHOLD}`).val());',
    '            setSetting(SETTING_DEMAND_DISCOUNT, $(`#${SETTING_DEMAND_DISCOUNT}`).val() / 100);',
    '            setSetting(SETTING_DEAL_SCANNER_ENABLED, $(`#${SETTING_DEAL_SCANNER_ENABLED}`).is(":checked") ? 1 : 0);',
    '            setSetting(SETTING_DEAL_MIN_PROFIT_CENTS, $(`#${SETTING_DEAL_MIN_PROFIT_CENTS}`).val());',
    '            setSetting(SETTING_DEAL_BOOSTER_MIN_PROFIT_CENTS, $(`#${SETTING_DEAL_BOOSTER_MIN_PROFIT_CENTS}`).val());',
    '            setSetting(SETTING_DEAL_MAX_ITEMS_PER_SCAN, $(`#${SETTING_DEAL_MAX_ITEMS_PER_SCAN}`).val());',
    '            setSetting(SETTING_DEAL_MAX_SPEND_PER_SCAN, $(`#${SETTING_DEAL_MAX_SPEND_PER_SCAN}`).val());',
    '            setSetting(SETTING_DEAL_SCAN_DELAY_MS, $(`#${SETTING_DEAL_SCAN_DELAY_MS}`).val());',
].join('\n');

const saveRoutineMarker = '            window.location.reload();';
const saveRoutineEnd = content.indexOf(saveRoutineMarker);
if (saveRoutineEnd === -1) {
    console.error('Could not find save routine end');
    process.exit(1);
}

content = content.slice(0, saveRoutineEnd) + eventHandlers + content.slice(saveRoutineEnd);
console.log('Event handlers added successfully');

// ============================================================================
// STEP 6: Add Deal Scanner UI
// ============================================================================
console.log('Step 6: Adding Deal Scanner UI...');

const dealScannerUI = [
    '',
    '            <div style="margin-top:12px; border-top: 1px solid #444; padding-top: 8px;">',
    '                <h3 style="color: #407736; margin: 0 0 8px 0;">Deal Scanner</h3>',
    '                <div style="margin-top:6px;">',
    '                    <input type="checkbox" id="${SETTING_DEAL_SCANNER_ENABLED}" ${(getSettingWithDefault(SETTING_DEAL_SCANNER_ENABLED) == 1) ? "checked" : ""}>',
    '                    Enable Deal Scanner',
    '                </div>',
    '                <div style="margin-top:6px;">',
    '                    Min Profit for Cards: <input type="number" id="${SETTING_DEAL_MIN_PROFIT_CENTS}" value=${getSettingWithDefault(SETTING_DEAL_MIN_PROFIT_CENTS)}> cents</div>',
    '                <div style="margin-top:6px;">',
    '                    Min Profit for Booster Packs: <input type="number" id="${SETTING_DEAL_BOOSTER_MIN_PROFIT_CENTS}" value=${getSettingWithDefault(SETTING_DEAL_BOOSTER_MIN_PROFIT_CENTS)}> cents</div>',
    '                <div style="margin-top:6px;">',
    '                    Max Items Per Scan: <input type="number" id="${SETTING_DEAL_MAX_ITEMS_PER_SCAN}" value=${getSettingWithDefault(SETTING_DEAL_MAX_ITEMS_PER_SCAN)}> items</div>',
    '                <div style="margin-top:6px;">',
    '                    Max Spend Per Scan ($): <input type="number" id="${SETTING_DEAL_MAX_SPEND_PER_SCAN}" value=${getSettingWithDefault(SETTING_DEAL_MAX_SPEND_PER_SCAN)}> dollars</div>',
    '                <div style="margin-top:8px;">',
    '                    <button id="deal_scanner_run" class="btn_darkblue_white_innerfade btn_medium" style="padding: 4px 12px;">Scan for Deals</button>',
    '                    <span id="deal_scanner_status" style="margin-left: 8px; color: #767676; font-size: 11px;"></span>',
    '                </div>',
    '                <div id="deal_scanner_results" style="margin-top: 8px; max-height: 300px; overflow-y: auto; display: none;"></div>',
    '            </div>',
].join('\n');

const lastDivStyle = content.lastIndexOf('<div style="margin-top:6px;">');
if (lastDivStyle === -1) {
    console.error('Could not find settings modal structure');
    process.exit(1);
}

const settingsModalEnd = content.indexOf('</div>', lastDivStyle);
if (settingsModalEnd === -1) {
    console.error('Could not find settings modal closing');
    process.exit(1);
}

content = content.slice(0, settingsModalEnd) + dealScannerUI + content.slice(settingsModalEnd);
console.log('Deal Scanner UI added successfully');

// ============================================================================
// STEP 7: Add initDealScanner() call
// ============================================================================
console.log('Step 7: Adding initDealScanner() call...');

const initCallPoint = content.lastIndexOf('}(jQuery, async));');
if (initCallPoint === -1) {
    console.error('Could not find initialization end');
    process.exit(1);
}

content = content.slice(0, initCallPoint) + '\n        initDealScanner();\n\n' + content.slice(initCallPoint);
console.log('initDealScanner() call added successfully');

// ============================================================================
// Write the final file
// ============================================================================
fs.writeFileSync(filePath, content, 'utf8');
console.log('');
console.log('========================================');
console.log('Merge complete! Customizations successfully applied to code.user.js');
console.log('========================================');
console.log('');

