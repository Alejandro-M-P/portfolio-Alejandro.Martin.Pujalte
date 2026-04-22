import type { APIRoute } from 'astro';
import { kv } from '@vercel/kv';
import { getRepoDetails } from '../../../lib/github-server';
import projectsData from '../../../../public/data/projects.json';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  // Optional: Verify Vercel Cron secret if configured
  const authHeader = request.headers.get('authorization');
  if (import.meta.env.PROD && authHeader !== `Bearer ${import.meta.env.CRON_SECRET}`) {
    // return new Response('Unauthorized', { status: 401 });
  }

  try {
    const projects = projectsData as any[];
    const cursor = (await kv.get<number>('portfolio_sync_cursor')) || 0;
    const batchSize = 5;
    
    // Get the slice to sync
    const nextBatch = projects.slice(cursor, cursor + batchSize);
    if (nextBatch.length === 0 && projects.length > 0) {
      // If we reached the end, reset cursor and sync from start
      await kv.set('portfolio_sync_cursor', 0);
      return new Response(JSON.stringify({ success: true, message: 'Cursor reset' }), { status: 200 });
    }

    const cache: Record<string, any> = (await kv.get('portfolio_github_cache')) || {};
    
    const syncedSlugs = [];
    for (const p of nextBatch) {
      const slug = p.specs?.repoSlug;
      if (slug) {
        try {
          const details = await getRepoDetails(slug);
          cache[slug] = {
            ...details,
            syncedAt: new Date().toISOString()
          };
          syncedSlugs.push(slug);
        } catch (e) {
          console.error(`[CRON] Failed to sync ${slug}:`, e);
        }
      }
    }
    
    // Save updated cache
    await kv.set('portfolio_github_cache', cache);
    
    // Advance cursor
    let nextCursor = cursor + batchSize;
    if (nextCursor >= projects.length) nextCursor = 0;
    await kv.set('portfolio_sync_cursor', nextCursor);
    
    return new Response(JSON.stringify({ 
      success: true, 
      synced: syncedSlugs,
      cursor: cursor,
      nextCursor 
    }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
  }
};
