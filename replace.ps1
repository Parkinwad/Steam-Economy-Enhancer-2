 = 'code.user.js'
 = Get-Content  -Raw
 = '(?s)(    SteamMarket\.prototype\.getPriceBeforeFeesForDesiredReceivedAmount = function \(desiredReceivedAmount\) \{[\s\S]*?return low;\s*\};)'
 = @'
    SteamMarket.prototype.getPriceBeforeFeesForDesiredReceivedAmount = function (desiredReceivedAmount) {
        let low = desiredReceivedAmount;
        let high = desiredReceivedAmount * 2;
        
        while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            const receivedPrice = this.getPriceIncludingFees(mid);
            
            if (receivedPrice < desiredReceivedAmount) {
                low = mid + 1;
            } else if (receivedPrice > desiredReceivedAmount) {
                high = mid - 1;
            } else {
                return mid;
            }
        }
        
        return low;
    };
'@
 = [regex]::Replace(, , , 'Singleline')
Set-Content  -Value  -NoNewline
Write-Host "Replacement complete"
