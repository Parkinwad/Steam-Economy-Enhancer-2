const fs = require('fs');

const filePath = 'code.user.js';
let content = fs.readFileSync(filePath, 'utf8');

console.log('Starting merge of getPriceBeforeFeesForDesiredReceivedAmount...');
console.log('Current file size:', content.length, 'characters');

// ============================================================================
// STEP 1: Insert getPriceBeforeFeesForDesiredReceivedAmount after getPriceIncludingFees
// ============================================================================
console.log('Step 1: Inserting getPriceBeforeFeesForDesiredReceivedAmount method...');

const newMethod = `
    // Calculate the seller price from the desired received amount
    SteamMarket.prototype.getPriceBeforeFeesForDesiredReceivedAmount = function (desiredReceived, item) {
        let publisherFee = -1;
        if (item != null) {
            if (item.market_fee != null) {
                publisherFee = item.market_fee;
            } else if (item.description != null && item.description.market_fee != null) {
                publisherFee = item.description.market_fee;
            }
        }
        if (publisherFee == -1) {
            if (this.walletInfo != null) {
                publisherFee = this.walletInfo['wallet_publisher_fee_percent_default'];
            } else {
                publisherFee = 0.10;
            }
        }

        // Binary search to find the gross price that yields the desired net amount
        let low = 1;
        let high = desiredReceived * 2; // Start with a reasonable upper bound
        let mid = 0;
        
        // Iterate until we converge on the correct price
        for (let i = 0; i < 100; i++) {
            mid = Math.round((low + high) / 2);
            const receivedAmount = this.getPriceIncludingFees(mid, item);
            
            if (receivedAmount < desiredReceived) {
                low = mid + 1;
            } else if (receivedAmount > desiredReceived) {
                high = mid - 1;
            } else {
                break; // Exact match found
            }
        }
        
        return mid;
    };`;

// Find the insertion point by locating getPriceIncludingFees and inserting after its //#endregion
const getPriceIncludingFeesIndex = content.indexOf('SteamMarket.prototype.getPriceIncludingFees = function');
if (getPriceIncludingFeesIndex === -1) {
    console.error('Could not find getPriceIncludingFees function');
    process.exit(1);
}

// Find the next //#endregion after this function
const afterFunction = content.slice(getPriceIncludingFeesIndex);
const endRegionIndex = afterFunction.indexOf('//#endregion');
if (endRegionIndex === -1) {
    console.error('Could not find //#endregion after getPriceIncludingFees');
    process.exit(1);
}

// Insert right after //#endregion
const insertionPoint = getPriceIncludingFeesIndex + endRegionIndex + '//#endregion'.length;
content = content.slice(0, insertionPoint) + '\n' + newMethod + content.slice(insertionPoint);
console.log('getPriceBeforeFeesForDesiredReceivedAmount inserted successfully');

// ============================================================================
// STEP 2: Verify the insertion
// ============================================================================
console.log('Step 2: Verifying insertion...');

if (content.includes('SteamMarket.prototype.getPriceBeforeFeesForDesiredReceivedAmount')) {
    console.log('✓ Method found in file');
    
    // Check indentation
    const lines = content.split('\n');
    let methodLineIndex = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('SteamMarket.prototype.getPriceBeforeFeesForDesiredReceivedAmount')) {
            methodLineIndex = i;
            break;
        }
    }
    
    if (methodLineIndex !== -1) {
        const methodLine = lines[methodLineIndex];
        const match = methodLine.match(/^(\s*)/);
        const indentSpaces = match[1].length;
        console.log(`✓ Declaration indentation: ${indentSpaces} spaces`);
        
        // Check body indentation (next non-empty line)
        let bodyLineIndex = -1;
        for (let i = methodLineIndex + 1; i < lines.length; i++) {
            if (lines[i].trim() !== '') {
                bodyLineIndex = i;
                break;
            }
        }
        
        if (bodyLineIndex !== -1) {
            const bodyLine = lines[bodyLineIndex];
            const bodyMatch = bodyLine.match(/^(\s*)/);
            const bodyIndentSpaces = bodyMatch[1].length;
            console.log(`✓ Body indentation: ${bodyIndentSpaces} spaces`);
            
            if (indentSpaces === 4 && bodyIndentSpaces === 8) {
                console.log('✓ Indentation matches expected format (4 spaces declaration, 8 spaces body)');
            } else {
                console.warn('⚠ Indentation may not match expected format');
            }
        }
    }
} else {
    console.error('✗ Method not found in file after insertion');
    process.exit(1);
}

// ============================================================================
// Write the final file
// ============================================================================
fs.writeFileSync(filePath, content, 'utf8');
console.log('');
console.log('========================================');
console.log('Merge complete! getPriceBeforeFeesForDesiredReceivedAmount successfully inserted');
console.log('========================================');
console.log('');