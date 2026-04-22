import { Buffer } from 'node:buffer';

const GITHUB_TOKEN = import.meta.env.GITHUB_TOKEN;

type GHHeaders = Record<string, string>;

export function authHeaders(): GHHeaders {
  return {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'User-Agent': 'Core-OS-Portfolio'
  };
}

export function decodeBase64(content: string): string {
  return Buffer.from(content.replace(/\n/g, ''), 'base64').toString('utf-8');
}

export function parseFrontmatter(raw: string): { data: Record<string, any>; content: string } {
  const yamlMatch = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (yamlMatch) {
    const data: Record<string, any> = {};
    const lines = yamlMatch[1].split('\n');
    for (const line of lines) {
      const splitAt = line.indexOf(':');
      if (splitAt > 0) {
        const k = line.slice(0, splitAt).trim();
        let v: any = line.slice(splitAt + 1).trim();
        if (v.startsWith('[') && v.endsWith(']')) {
          v = v.slice(1, -1).split(',').map((s: string) => s.trim().replace(/^["']|["']$/g, ''));
        } else if (v.toLowerCase() === 'true') v = true;
        else if (v.toLowerCase() === 'false') v = false;
        else if (!isNaN(v) && v !== '') v = Number(v);
        data[k] = v;
      }
    }
    return { data, content: yamlMatch[2].trim() };
  }

  const jsonMatch = raw.match(/^---json\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (jsonMatch) {
    try {
      return { data: JSON.parse(jsonMatch[1]), content: jsonMatch[2].trim() };
    } catch { }
  }

  return { data: {}, content: raw.trim() };
}

export function parseReadmeFallback(raw: string) {
  const archMatch = raw.match(/#+\s*(architect\w*|structure|design|overview)[^\n]*\n([\s\S]*?)(?=\n#+\s|\n---|\n___|\n\*\*\*|$)/i);
  const architecture = archMatch ? archMatch[2].replace(/```[\s\S]*?```/g, '').replace(/[#*`]/g, '').trim().slice(0, 400) : '';
  const techMatches = raw.match(/`([A-Za-z][A-Za-z0-9+#._-]{1,20})`/g) ?? [];
  const stack = [...new Set(techMatches.map(t => t.replace(/`/g, '').toUpperCase()))].slice(0, 12);
  return { architecture, stack };
}

export async function getRepoDetails(repoSlug: string) {
  const h = authHeaders();
  const [repoRes, langsRes, readmeRes] = await Promise.all([
    fetch(`https://api.github.com/repos/${repoSlug}`, { headers: h }),
    fetch(`https://api.github.com/repos/${repoSlug}/languages`, { headers: h }),
    fetch(`https://api.github.com/repos/${repoSlug}/readme`, { headers: h }),
  ]);

  if (!repoRes.ok) throw new Error(`GH_${repoRes.status}`);
  const r = await repoRes.json();
  const langs = langsRes.ok ? await langsRes.json() : {};

  const totalBytes = Object.values(langs).reduce((a: number, b: unknown) => a + (Number(b) || 0), 0) as number;
  const langPercentages: Record<string, number> = {};
  for (const [lang, bytes] of Object.entries(langs)) {
    langPercentages[lang.toUpperCase()] = totalBytes > 0 ? Math.round((Number(bytes) / totalBytes) * 100) : 0;
  }

  let metadata: Record<string, any> = {};
  let architecture = '';
  let stack: string[] = [];
  let stackWithUsage: { name: string; usageLevel: number }[] = [];

  if (readmeRes.ok) {
    const readmeData = await readmeRes.json();
    const rawContent = decodeBase64(readmeData.content);
    const parsed = parseFrontmatter(rawContent);
    metadata = parsed.data;

    const metaStack = metadata.stack 
      ? (Array.isArray(metadata.stack) ? metadata.stack : metadata.stack.split(','))
      : [];
    
    stack = metaStack.map((s: string) => s.trim().toUpperCase()).filter(Boolean);
    stackWithUsage = stack.map(name => ({
      name,
      usageLevel: langPercentages[name] ?? 50,
    }));

    if (metadata.architecture || metadata.stack) {
      architecture = metadata.architecture || '';
    } else {
      const fallback = parseReadmeFallback(rawContent);
      architecture = fallback.architecture;
    }
  } else {
    stack = Object.keys(langs).join(', ').toUpperCase().split(',').map(s => s.trim()).filter(Boolean);
    stackWithUsage = Object.entries(langs).map(([lang, bytes]) => ({
      name: lang.toUpperCase(),
      usageLevel: totalBytes > 0 ? Math.round((Number(bytes) / totalBytes) * 100) : 0,
    }));
  }

  return {
    id: r.name.toUpperCase().replace(/-/g, '_'),
    name: r.name.toUpperCase().replace(/-/g, '_'),
    photo: r.open_graph_image_url || `https://opengraph.githubassets.com/1/${repoSlug}`,
    specsDescription: r.description || metadata.description || '',
    specsLanguage: r.language || metadata.language || '',
    specsStars: String(r.stargazers_count),
    specsRepo: r.html_url,
    specsRepoSlug: repoSlug,
    specsStatus: metadata.status || 'PROD',
    pushedAt: r.pushed_at,
    stack,
    stackWithUsage,
    architecture,
    metadata
  };
}
