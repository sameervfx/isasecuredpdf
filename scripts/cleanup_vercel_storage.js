import { execSync } from 'child_process';

async function cleanupAllDeployments() {
  console.log('Fetching and cleaning up all old Vercel deployments...');
  let hasMore = true;
  let nextToken = null;
  let totalDeleted = 0;

  while (hasMore) {
    let cmd = 'cmd.exe /c "npx vercel ls"';
    if (nextToken) {
      cmd = `cmd.exe /c "npx vercel ls --next ${nextToken}"`;
    }

    try {
      const rawList = execSync(cmd, { encoding: 'utf-8' });
      const lines = rawList.split('\n');
      const urls = [];
      nextToken = null;

      for (const line of lines) {
        const matchUrl = line.match(/https:\/\/[a-zA-Z0-9-]+\.vercel\.app/);
        if (matchUrl) {
          urls.push(matchUrl[0]);
        }
        const matchNext = line.match(/--next (\d+)/);
        if (matchNext) {
          nextToken = matchNext[1];
        }
      }

      // Filter out active production deployment on first batch if needed
      const toDelete = urls.filter((url, index) => {
        // Keep the main active production URL on index 0 of first page
        if (!nextToken && index === 0) return false;
        return true;
      });

      if (toDelete.length > 0) {
        console.log(`Found ${toDelete.length} old deployments to remove in this page...`);
        for (let i = 0; i < toDelete.length; i += 5) {
          const batch = toDelete.slice(i, i + 5).join(' ');
          console.log(`Removing batch: ${batch}`);
          try {
            execSync(`cmd.exe /c "npx vercel rm ${batch} -y --safe"`, { stdio: 'inherit' });
            totalDeleted += Math.min(5, toDelete.length - i);
          } catch (e) {
            console.warn('Failed to remove batch:', e.message);
          }
        }
      }

      if (!nextToken || urls.length === 0) {
        hasMore = false;
      }
    } catch (err) {
      console.error('Error listing deployments:', err.message);
      hasMore = false;
    }
  }

  console.log(`Cleanup finished! Total old deployments removed: ${totalDeleted}`);
}

cleanupAllDeployments().catch(console.error);
