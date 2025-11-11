; Custom NSIS installer script for 3D Clue Board Kiosk
; This script adds auto-start configuration for kiosk mode

!macro customInstall
  ; Create startup shortcut for kiosk mode
  CreateShortCut "$SMSTARTUP\3D Clue Board Kiosk.lnk" "$INSTDIR\3D Clue Board Kiosk.exe" "--kiosk" "$INSTDIR\3D Clue Board Kiosk.exe" 0
  
  ; Set registry keys for kiosk mode
  WriteRegStr HKLM "Software\MCMuseum\3DClueBoard" "InstallPath" "$INSTDIR"
  WriteRegStr HKLM "Software\MCMuseum\3DClueBoard" "Version" "${VERSION}"
  WriteRegDWORD HKLM "Software\MCMuseum\3DClueBoard" "KioskMode" 1
  
  ; Disable Windows key and other shortcuts (optional - can be enabled in admin overlay)
  ; WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Policies\System" "DisableTaskMgr" 1
!macroend

!macro customUnInstall
  ; Remove startup shortcut
  Delete "$SMSTARTUP\3D Clue Board Kiosk.lnk"
  
  ; Remove registry keys
  DeleteRegKey HKLM "Software\MCMuseum\3DClueBoard"
  
  ; Re-enable Windows features if they were disabled
  ; DeleteRegValue HKLM "Software\Microsoft\Windows\CurrentVersion\Policies\System" "DisableTaskMgr"
!macroend
