import type { APIRoute } from 'astro';

export const prerender = false;

const CLIENT_ID = import.meta.env.GITHUB_OAUTH_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.GITHUB_OAUTH_CLIENT_SECRET;
const REDIRECT_URI = import.meta.env.GITHUB_OAUTH_REDIRECT_URI || 'https://portfolio-alejandro-martin-pujalte.vercel.app/api/github-auth';

export const GET: APIRoute = async ({ url }) => {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    return new Response(JSON.stringify({ error: 'OAuth not configured' }), { status: 500 });
  }

  const state = Math.random().toString(36).substring(2, 15);
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=read:user&state=${state}`;
  
  return new Response(null, {
    status: 302,
    headers: {
      Location: githubAuthUrl,
      'Set-Cookie': `oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`
    }
  });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const { code, state } = await request.json();
    
    if (!code) {
      return new Response(JSON.stringify({ error: 'NO_CODE' }), { status: 400 });
    }

    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code
      })
    });

    const tokenData = await tokenRes.json();
    
    if (tokenData.error) {
      return new Response(JSON.stringify({ error: tokenData.error }), { status: 401 });
    }

    const accessToken = tokenData.access_token;

    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json'
      }
    });

    const user = await userRes.json();

    return new Response(JSON.stringify({ 
      success: true, 
      login: user.login,
      name: user.name
    }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'OAuth flow failed' }), { status: 500 });
  }
};