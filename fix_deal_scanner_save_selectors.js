const fs = require('fs');

const filePath = 'code.user.js';
let content = fs.readFileSync(filePath, 'utf8');

console.log('Fixing deal scanner setting selectors to include price_options context...');

// Fix the save logic for deal scanner settings - add , price_options) to each selector
const fixes = [
    {
        old: "setSetting(SETTING_DEAL_MIN_PROFIT_CENTS, $(`#${SETTING_DEAL_MIN_PROFIT_CENTS}`).val());",
        new: "setSetting(SETTING_DEAL_MIN_PROFIT_CENTS, $(`#${SETTING_DEAL_MIN_PROFIT_CENTS}`, price_options).val());"
    },
    {
        old: "setSetting(SETTING_DEAL_BOOSTER_MIN_PROFIT_CENTS, $(`#${SETTING_DEAL_BOOSTER_MIN_PROFIT_CENTS}`).val());",
        new: "setSetting(SETTING_DEAL_BOOSTER_MIN_PROFIT_CENTS, $(`#${SETTING_DEAL_BOOSTER_MIN_PROFIT_CENTS}`, price_options).val());"
    },
    {
        old: "setSetting(SETTING_DEAL_MAX_ITEMS_PER_SCAN, $(`#${SETTING_DEAL_MAX_ITEMS_PER_SCAN}`).val());",
        new: "setSetting(SETTING_DEAL_MAX_ITEMS_PER_SCAN, $(`#${SETTING_DEAL_MAX_ITEMS_PER_SCAN}`, price_options).val());"
    },
    {
        old: "setSetting(SETTING_DEAL_MAX_SPEND_PER_SCAN, $(`#${SETTING_DEAL_MAX_SPEND_PER_SCAN}`).val());",
        new: "setSetting(SETTING_DEAL_MAX_SPEND_PER_SCAN, $(`#${SETTING_DEAL_MAX_SPEND_PER_SCAN}`, price_options).val());"
    },
    {
        old: "setSetting(SETTING_DEAL_SCAN_DELAY_MS, $(`#${SETTING_DEAL_SCAN_DELAY_MS}`).val());",
        new: "setSetting(SETTING_DEAL_SCAN_DELAY_MS, $(`#${SETTING_DEAL_SCAN_DELAY_MS}`, price_options).val());"
    }
];

let changesMade = 0;
for (const fix of fixes) {
    if (content.includes(fix.old)) {
        console.log(`Fixing: ${fix.old}`);
        content = content.replace(new RegExp(fix.old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), fix.new);
        changesMade++;
    } else {
        console.log(`Not found (already fixed?): ${fix.old.substring(0, 80)}...`);
    }
}

if (changesMade === fixes.length) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('');
    console.log('========================================');
    console.log('All deal scanner setting selectors fixed successfully!');
    console.log('========================================');
    console.log('');
} else {
    console.error(`Only ${changesMade}/${fixes.length} fixes applied. Check the output above.`);
    process.exit(1);
}
