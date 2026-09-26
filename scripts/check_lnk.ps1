$shell = New-Object -ComObject WScript.Shell
$lnkPath = "C:\Users\Public\Desktop\Isa Secure PDF.lnk"
if (Test-Path $lnkPath) {
    $link = $shell.CreateShortcut($lnkPath)
    Write-Host "TargetPath: $($link.TargetPath)"
    Write-Host "IconLocation: $($link.IconLocation)"
} else {
    Write-Host "Not found"
}
