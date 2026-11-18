/**
 * Export my entire shelf — one zip of per-project Markdown context
 * cards plus shelf.json (full fidelity backup).
 */
import JSZip from 'jszip';

const slug = (s = '') =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'project';

export async function exportShelf(projects, toMarkdown) {
  const list = Array.isArray(projects) ? projects : [];
  const zip = new JSZip();
  const used = new Set();
  const folder = zip.folder('projects');
  const index = ['# Shelved — shelf export', '', `Exported ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} · ${list.length} project${list.length === 1 ? '' : 's'}`, ''];
  list.forEach((p, i) => {
    const name = p.name || `project-${i}`;
    const file = `projects/${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'project'}.md`;
    index.push(`${i + 1}. **${name}** — ${p.goal || 'no goal recorded'} ([${file}](${file}))`);
  });
  for (const p of list) {
    const base = slug(p.name);
    let name = base;
    let i = 2;
    while (used.has(name)) name = `${base}-${i++}`;
    used.add(name);
    folder.file(`${name}.md`, toMarkdown(p));
  }
  zip.file('_README.md', index.join('\n'));
  zip.file('shelf.json', JSON.stringify(list, null, 2));
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `shelved-export-${new Date().toISOString().slice(0, 10)}.zip`;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
