Add-Type -AssemblyName System.Drawing

function Save-ExeIcon($path, $outPng) {
    if (Test-Path $path) {
        $icon = [System.Drawing.Icon]::ExtractAssociatedIcon((Resolve-Path $path).Path)
        $bmp = $icon.ToBitmap()
        $bmp.Save($outPng, [System.Drawing.Imaging.ImageFormat]::Png)
        $bmp.Dispose()
        $icon.Dispose()
        Write-Host "Saved icon for $path to $outPng"
    } else {
        Write-Host "File not found: $path"
    }
}

$artifactDir = "C:\Users\samee\.gemini\antigravity\brain\3e407dab-5038-42b5-8e5e-91e7710b8279"
Save-ExeIcon "C:\Users\Public\Desktop\Isa Secure PDF.lnk" "$artifactDir\icon_public_lnk.png"
