const fs = require('fs');

const filePath = 'code.user.js';
let content = fs.readFileSync(filePath, 'utf8');

console.log('Starting move of initDealScanner() from global call to inside openSettings()...');
console.log('Current file size:', content.length, 'characters');

// ============================================================================
// STEP 1: Remove the global initDealScanner() call
// ============================================================================
console.log('Step 1: Removing global initDealScanner() call...');

// Find the global initDealScanner() call - it should be before the closing }(jQuery, async));
const globalInitPattern = /\n\s*initDealScanner\(\);\n\s*\n/;
const globalInitMatch = content.match(globalInitPattern);

if (globalInitMatch) {
    console.log('Found global initDealScanner() call, removing it...');
    content = content.replace(globalInitPattern, '\n');
    console.log('Global initDealScanner() call removed successfully');
} else {
    console.warn('Could not find global initDealScanner() call. It may already be removed.');
}

// ============================================================================
// STEP 2: Add initDealScanner() call inside openSettings() function
// ============================================================================
console.log('Step 2: Adding initDealScanner() call inside openSettings()...');

// Find the end of the openSettings() function
// We need to find the closing } of openSettings before the next function or region
const openSettingsMarker = 'function openSettings() {';
const openSettingsPos = content.indexOf(openSettingsMarker);

if (openSettingsPos === -1) {
    console.error('Could not find openSettings() function');
    process.exit(1);
}

// Find the next function or region marker after openSettings to locate its end
const contentAfterOpenSettings = content.slice(openSettingsPos);

// Look for the next function definition or region marker
const nextFunctionOrRegion = contentAfterOpenSettings.search(/\n\s*function\s+\w+|\n\s*\/\/#region|\n\s*\/\/#endregion/);

if (nextFunctionOrRegion === -1) {
    console.error('Could not find end of openSettings() function');
    process.exit(1);
}

// Calculate the actual position
const openSettingsEndPos = openSettingsPos + openSettingsPos + nextFunctionOrRegion;
console.log(`Found openSettings() ends at position ${openSettingsEndPos}`);

// Add initDealScanner() call before the closing of openSettings
const insertText = '\n          initDealScanner();\n';
content = content.slice(0, openSettingsEndPos) + insertText + content.slice(openSettingsEndPos);
console.log('initDealScanner() call added inside openSettings() successfully');

// ============================================================================
// Write the final file
// ============================================================================
fs.writeFileSync(filePath, content, 'utf8');
console.log('');
console.log('========================================');
console.log('Move complete! initDealScanner() is now called inside openSettings()');
console.log('========================================');
console.log('');
