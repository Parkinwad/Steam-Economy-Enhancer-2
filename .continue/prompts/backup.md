---
name: backup
description: Create a new backup of the current code.user.js file
invokable: true
---

Create a backup of the current code.user.js file in the "./backups" folder. Use the naming convention "code_user_YYYY-MM-DD_HH-MM.user.js". You have tested the command "$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm"; Copy-Item code.user.js "./backups/code_user_$timestamp.user.js" -ErrorAction Stop; Write-Host "Backup created successfully at: $timestamp"" to work well, then verify the backup was created.