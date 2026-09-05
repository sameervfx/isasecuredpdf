import { chromium, devices } from 'playwright';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

async function recordDemo() {
    console.log('Starting preview server for recording...');
    
    // Start vite dev server
    const server = spawn('npx', ['vite', '--port', '5173', '--strictPort'], {
        cwd: process.cwd(),
        shell: true,
        stdio: 'ignore'
    });

    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('Launching Playwright Chromium in iPhone mobile viewport...');
    const browser = await chromium.launch({ headless: true });

    // Use iPhone 15 / 16 Pro Max viewport
    const iPhone = devices['iPhone 15 Pro Max'] || {
        viewport: { width: 430, height: 932 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    };

    const targetDir = 'C:\\Users\\samee\\OneDrive\\Desktop';
    const videoDir = path.join(process.cwd(), 'temp_videos');
    if (!fs.existsSync(videoDir)) fs.mkdirSync(videoDir, { recursive: true });

    const context = await browser.newContext({
        ...iPhone,
        recordVideo: {
            dir: videoDir,
            size: { width: 430, height: 932 }
        }
    });

    const page = await context.newPage();

    console.log('Navigating to ISASecuredPDF Suite...');
    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // Scroll through landing page
    console.log('Demonstrating app landing page & feature overview...');
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(1500);

    // Click "Open Free Web Editor" button
    console.log('Opening Web Editor...');
    const editorBtn = page.locator('text=Open Free Web Editor').first();
    if (await editorBtn.isVisible()) {
        await editorBtn.click();
    } else {
        await page.goto('http://localhost:5173/#editor');
    }
    await page.waitForTimeout(2500);

    // Demonstrate interactive tools (New Blank PDF or dropzone)
    console.log('Demonstrating PDF Editor Canvas...');
    const blankBtn = page.locator('text=New Blank PDF').first();
    if (await blankBtn.isVisible()) {
        await blankBtn.click();
        await page.waitForTimeout(2000);
    }

    // Interact with toolbar
    const textTool = page.locator('button:has-text("Text")').first();
    if (await textTool.isVisible()) {
        await textTool.click();
        await page.waitForTimeout(1500);
    }

    const signTool = page.locator('button:has-text("Sign")').first();
    if (await signTool.isVisible()) {
        await signTool.click();
        await page.waitForTimeout(1500);
    }

    // Export demonstration
    const exportBtn = page.locator('button:has-text("Export")').first();
    if (await exportBtn.isVisible()) {
        await exportBtn.click();
        await page.waitForTimeout(2000);
    }

    await page.waitForTimeout(2000);

    console.log('Closing browser and saving video file...');
    await context.close();
    await browser.close();
    server.kill();

    // Find recorded video file and copy to Desktop
    const files = fs.readdirSync(videoDir);
    const videoFile = files.find(f => f.endsWith('.webm') || f.endsWith('.mp4'));
    if (videoFile) {
        const srcVideo = path.join(videoDir, videoFile);
        const destVideo = path.join(targetDir, 'ISASecuredPDF_App_Demo.webm');
        fs.copyFileSync(srcVideo, destVideo);
        console.log('SUCCESS! Video demo saved to Desktop:', destVideo);
    } else {
        console.error('No video file generated!');
    }
}

recordDemo().catch(console.error);
