const GITHUB_TOKEN = import.meta.env.PUBLIC_GITHUB_TOKEN;
const GITHUB_REPO = import.meta.env.PUBLIC_GITHUB_REPO;

async function getFile(path: string): Promise<{ content: unknown; sha: string }> {
  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`,
    { headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: 'application/vnd.github+json' } }
  );
  if (!res.ok) throw new Error(`FETCH_FAILED: ${res.status}`);
  const data = await res.json();
  const decoded = JSON.parse(atob(data.content.replace(/\n/g, '')));
  return { content: decoded, sha: data.sha };
}

async function putFile(path: string, content: unknown, sha: string, message: string): Promise<void> {
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(content, null, 2))));
  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, content: encoded, sha }),
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 403) throw new Error('RATE_LIMIT_EXCEEDED');
    if (res.status === 401) throw new Error('AUTH_FAILED');
    throw new Error(`API_ERROR: ${(err as { message?: string }).message ?? res.status}`);
  }
}

const PATHS = {
  projects:  'public/data/projects.json',
  techstack: 'public/data/techstack.json',
  ambitions: 'public/data/ambitions.json',
};

export { getFile, putFile, PATHS };
