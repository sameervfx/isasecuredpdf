!macro customInstall
  DetailPrint "Registering official ISASecuredPDF Suite desktop shortcuts..."
  ; Remove stale shortcuts from any previous per-user installs
  Delete "$LOCALAPPDATA\Programs\ISASecuredPDF Suite\Isa Secure PDF.lnk"
  Delete "$LOCALAPPDATA\Programs\ISASecuredPDF Suite\app.ico"

  ; Re-create desktop shortcut explicitly bound to the stamped executable's icon
  Delete "$DESKTOP\Isa Secure PDF.lnk"
  CreateShortCut "$DESKTOP\Isa Secure PDF.lnk" "$INSTDIR\ISASecuredPDF Suite.exe" "" "$INSTDIR\ISASecuredPDF Suite.exe" 0

  ; Flush Windows Explorer icon cache so the new shield icon appears immediately
  System::Call 'shell32.dll::SHChangeNotify(i 0x08000000, i 0, i 0, i 0)'
!macroend

!macro customUnInstall
  Delete "$DESKTOP\Isa Secure PDF.lnk"
  System::Call 'shell32.dll::SHChangeNotify(i 0x08000000, i 0, i 0, i 0)'
!macroend
