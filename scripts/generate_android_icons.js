import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const psScript = `
Add-Type -AssemblyName System.Drawing
$srcPath = "${path.resolve('public/google_play_app_icon_512x512.png').replace(/\\/g, '\\\\')}"
$src = [System.Drawing.Image]::FromFile($srcPath)

$densities = @{
    'mipmap-mdpi' = 48
    'mipmap-hdpi' = 72
    'mipmap-xhdpi' = 96
    'mipmap-xxhdpi' = 144
    'mipmap-xxxhdpi' = 192
}

foreach ($key in $densities.Keys) {
    $dim = $densities[$key]
    $bmp = New-Object System.Drawing.Bitmap($dim, $dim)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($src, 0, 0, $dim, $dim)
    
    $outDir = "${path.resolve('android/app/src/main/res').replace(/\\/g, '\\\\')}\\" + $key
    if (-not (Test-Path $outDir)) {
        New-Item -ItemType Directory -Path $outDir -Force
    }
    
    $bmp.Save("$outDir\\ic_launcher.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Save("$outDir\\ic_launcher_round.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Save("$outDir\\ic_launcher_foreground.png", [System.Drawing.Imaging.ImageFormat]::Png)
    
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Generated $key ($dim x $dim)"
}

$src.Dispose()
`;

fs.writeFileSync('generate_icons.ps1', psScript);
console.log('Running icon generator script...');
execSync('powershell -ExecutionPolicy Bypass -File generate_icons.ps1', { stdio: 'inherit' });
fs.unlinkSync('generate_icons.ps1');
console.log('All Android mipmap icons generated cleanly!');
