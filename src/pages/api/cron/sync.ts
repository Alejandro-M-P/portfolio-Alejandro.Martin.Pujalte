import type { APIRoute } from 'astro';
import { getRepoDetails } from '../../../lib/github-server';
import projectsData from '../../../../public/data/projects.json';
import { authHeaders } from '../../../lib/github-server';

export const prerender = false;

const GITHUB_USER = import.meta.env.GITHUB_USER;
const GITHUB_REPO = import.meta.env.PUBLIC_GITHUB_REPO;

// Cron job: updates all project metadata via GraphQL
// Hourly: just activity logs
// Daily at 00:00 UTC: full repo update + commit to GitHub → Vercel rebuild

export const GET: APIRoute = async ({ request }) => {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (import.meta.env.PROD && authHeader !== `Bearer ${import.meta.env.CRON_SECRET}`) {
    // return new Response('Unauthorized', { status: 401 });
  }

  // Check query params for force mode
  const url = new URL(request.url);
  const forceParam = url.searchParams.get('force');
  const scheduleParam = url.searchParams.get('schedule');
  
  const currentHour = new Date().getUTCHours();
  
  // Determine mode: query param > default logic
  let isDailyUpdate = false;
  
  if (forceParam === 'daily' || scheduleParam === 'daily') {
    isDailyUpdate = true; // Force daily mode
  } else if (forceParam === 'hourly' || scheduleParam === 'hourly') {
    isDailyUpdate = false; // Force hourly mode
  } else {
    // Default: daily at 00:00 UTC
    isDailyUpdate = currentHour === 0;
  }

  try {
    const projects = projectsData as any[];
    
    // Update each project
    for (const p of projects) {
      const slug = p.specs?.repoSlug;
      if (!slug) continue;
      
      try {
        const details = await getRepoDetails(slug);
        
        // Update stars and pushedAt
        p.specs = p.specs || {};
        p.specs.stars = details.specsStars;
        p.pushedAt = details.pushedAt;
        
        // Update stack/languages if daily
        if (isDailyUpdate && details.stackWithUsage?.length) {
          p.stack = details.stack;
          p.stackWithUsage = details.stackWithUsage;
        }
        
        console.log(`[CRON] Synced ${slug}: ${details.specsStars} stars`);
      } catch (e) {
        console.error(`[CRON] Failed ${slug}:`, e);
      }
    }

    // If daily update, commit to GitHub
    if (isDailyUpdate) {
      const content = JSON.stringify(projects, null, 2);
      const encoded = Buffer.from(content).toString('base64');
      
      // Get current SHA
      const getRes = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/public/data/projects.json`, {
        headers: authHeaders()
      });
      const current = await getRes.json();
      const sha = current?.sha;
      
      // Commit
      const commitRes = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/public/data/projects.json`, {
        method: 'PUT',
        headers: {
          ...authHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: 'chore(data): update projects via cron',
          content: encoded,
          ...(sha && { sha })
        })
      });
      
      if (commitRes.ok) {
        console.log('[CRON] Committed to GitHub → rebuild will trigger');
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      update: isDailyUpdate ? 'full' : 'logs',
      hour: hour,
      count: projects.length,
      timestamp: new Date().toISOString()
    }), { status: 200 });
    
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
  }
};