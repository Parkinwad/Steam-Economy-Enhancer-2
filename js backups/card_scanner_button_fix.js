/**
 * Steam Economy Enhancer 2.0 - Card Scanner Button Fix Script
 * 
 * This file contains a single edit to add the Subnautica card scanner button initialization
 * call inside the openSettings() function, similar to how initDealScanner() is called.
 * 
 * USAGE: Run this script's output and paste it into code.user.js at line 4843 (after "initDealScanner();")
 */

// Find the exact location in code.user.js and add these lines after "initDealScanner();"

const newCodeToAdd = `
            // Initialize Subnautica card scanner test button after settings modal is created
            if (typeof initSubnauticaCardScannerTestButton === 'function') {
                initSubnauticaCardScannerTestButton();
            }
`;

console.log('=== CARD SCANNER BUTTON FIX SCRIPT ===');
console.log('');
console.log('LOCATION: code.user.js, line ~4843 (after "initDealScanner();" inside openSettings())');
console.log('');
console.log('CODE TO INSERT:');
console.log(newCodeToAdd);
console.log('');
console.log('=== END OF FIX SCRIPT ===');
