# Conversation Summary: Repairing code.user.js Settings Issue

## Problem Identified
The settings page doesn't open when clicking the button because of JavaScript ReferenceErrors:
- `Uncaught ReferenceError: SETTING_DEAL_SCANNER_ENABLED is not defined`
- `Uncaught ReferenceError: SETTING_MIN_NET_PROFIT_CENTS is not defined`

## Root Cause
These variables are declared inside a block scope (between `//#region Settings` and the closing `}` on line 284):

```javascript
//#region Settings
const SETTING_MIN_NORMAL_PRICE = 'SETTING_MIN_NORMAL_PRICE';
// ... other settings ...

// Custom optimizations settings
const SETTING_MIN_NET_PROFIT_CENTS = 'SETTING_MIN_NET_PROFIT_CENTS';  // ❌ BLOCK SCOPED
const SETTING_DEMAND_THRESHOLD = 'SETTING_DEMAND_THRESHOLD';
const SETTING_DEMAND_DISCOUNT = 'SETTING_DEMAND_DISCOUNT';

// Deal scanner settings
const SETTING_DEAL_SCANNER_ENABLED = 'SETTING_DEAL_SCANNER_ENABLED';  // ❌ BLOCK SCOPED
const SETTING_DEAL_MIN_PROFIT_CENTS = 'SETTING_DEAL_MIN_PROFIT_CENTS';
const SETTING_DEAL_BOOSTER_MIN_PROFIT_CENTS = 'SETTING_DEAL_BOOSTER_MIN_PROFIT_CENTS';

// ... more settings ...
}  // ← Block ends here! Variables no longer accessible outside
```

Variables declared with `const` inside a block `{}` are only accessible within that block. When the settings button is clicked and code tries to access these variables from outside the block, JavaScript throws a `ReferenceError`.

## What's Been Done
✅ Moved backup files to `.js Backups/` folder:
- `code.user.js.merged`
- `merge_clean.js`
- `Parkinwad.code.user.js`

## What Needs to Be Fixed
The variables `SETTING_MIN_NET_PROFIT_CENTS`, `SETTING_DEAL_SCANNER_ENABLED`, and related settings need to be moved outside the block scope to the top level, alongside other settings that are already accessible.
