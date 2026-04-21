import type { APIRoute } from 'astro';

export const prerender = false;

const GITHUB_TOKEN = import.meta.env.GITHUB_TOKEN;

type GHHeaders = Record<string, string>;

function authHeaders(): GHHeaders {
  return {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
  };
}

async function handlePublish(body: Record<string, unknown>) {
  const { repo, branch, files, buildNum } = body as {
    repo: string;
    branch: string;
    files: { path: string; content: string }[];
    buildNum: number;
  };

  if (!repo || !branch || !Array.isArray(files) || !files.length) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
  }

  const h = authHeaders();

  const refRes = await fetch(`https://api.github.com/repos/${repo}/git/ref/heads/${branch}`, { headers: h });
  if (!refRes.ok) throw new Error(`Branch '${branch}' not found — ${refRes.status}`);
  const ref = await refRes.json();
  const latestSha: string = ref.object.sha;

  const commitRes = await fetch(`https://api.github.com/repos/${repo}/git/commits/${latestSha}`, { headers: h });
  if (!commitRes.ok) throw new Error('Commit not found');
  const commitData = await commitRes.json();
  const baseTree: string = commitData.tree.sha;

  const treeItems = await Promise.all(
    files.map(async (f) => {
      const blobRes = await fetch(`https://api.github.com/repos/${repo}/git/blobs`, {
        method: 'POST',
        headers: h,
        body: JSON.stringify({ content: btoa(unescape(encodeURIComponent(f.content))), encoding: 'base64' }),
      });
      if (!blobRes.ok) throw new Error(`Blob failed for ${f.path}`);
      const blob = await blobRes.json();
      return { path: f.path, mode: '100644', type: 'blob', sha: blob.sha };
    })
  );

  const treeRes = await fetch(`https://api.github.com/repos/${repo}/git/trees`, {
    method: 'POST',
    headers: h,
    body: JSON.stringify({ base_tree: baseTree, tree: treeItems }),
  });
  if (!treeRes.ok) throw new Error('Tree creation failed');
  const tree = await treeRes.json();

  const newCommitRes = await fetch(`https://api.github.com/repos/${repo}/git/commits`, {
    method: 'POST',
    headers: h,
    body: JSON.stringify({
      message: `data: update portfolio content [build #${buildNum}]`,
      tree: tree.sha,
      parents: [latestSha],
    }),
  });
  if (!newCommitRes.ok) throw new Error('Commit creation failed');
  const newCommit = await newCommitRes.json();

  const updateRes = await fetch(`https://api.github.com/repos/${repo}/git/refs/heads/${branch}`, {
    method: 'PATCH',
    headers: h,
    body: JSON.stringify({ sha: newCommit.sha }),
  });
  if (!updateRes.ok) throw new Error('Ref update failed');

  return new Response(JSON.stringify({ success: true, sha: newCommit.sha }), { status: 200 });
}

async function handleUploadCv(body: Record<string, unknown>) {
  const { base64, repo } = body as { base64: string; repo: string };
  if (!repo || !base64) {
    return new Response(JSON.stringify({ error: 'Missing base64 or repo' }), { status: 400 });
  }

  const h = authHeaders();
  const filePath = 'public/cv.pdf';
  const apiUrl = `https://api.github.com/repos/${repo}/contents/${filePath}`;

  let existingSha: string | undefined;
  const existRes = await fetch(apiUrl, { headers: h });
  if (existRes.ok) {
    const d = await existRes.json();
    existingSha = d.sha;
  }

  const uploadBody: Record<string, string> = {
    message: existingSha ? 'cv: replace resume' : 'cv: add resume',
    content: base64,
  };
  if (existingSha) uploadBody.sha = existingSha;

  const upRes = await fetch(apiUrl, { method: 'PUT', headers: h, body: JSON.stringify(uploadBody) });
  if (!upRes.ok) {
    const err = await upRes.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? `Upload failed ${upRes.status}`);
  }

  return new Response(JSON.stringify({ success: true, cvUrl: '/cv.pdf' }), { status: 200 });
}

export const POST: APIRoute = async ({ request }) => {
  if (!GITHUB_TOKEN) {
    return new Response(JSON.stringify({ error: 'GITHUB_TOKEN not configured on server' }), { status: 500 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  try {
    const action = body.action as string;
    if (action === 'publish') return await handlePublish(body);
    if (action === 'uploadCv') return await handleUploadCv(body);
    return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), { status: 400 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Internal error';
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
};
