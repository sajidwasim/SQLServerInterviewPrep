import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, copyFileSync } from 'fs';
import { join, basename, extname, parse } from 'path';
import { marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';

marked.use(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      if (lang && hljs.getLanguage(lang)) {
        return hljs.highlight(code, { language: lang }).value;
      }
      return hljs.highlightAuto(code).value;
    }
  })
);

const SRC_DIR = join(import.meta.dirname, 'src');
const DIST_DIR = join(import.meta.dirname, 'dist');
const DATA_FILE = join(import.meta.dirname, 'content-index.json');

function parseFrontmatter(text) {
  const normalized = text.replace(/\r\n/g, '\n');
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, content: normalized };
  const fm = {};
  for (const line of match[1].split('\n')) {
    const [k, ...v] = line.split(':');
    if (k && v.length) fm[k.trim()] = v.join(':').trim();
  }
  return { frontmatter: fm, content: match[2] };
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function buildToc(htmlContent) {
  const headings = [];
  const regex = /<h([2-3])\s+id="([^"]+)"[^>]*>(.*?)<\/h[2-3]>/gi;
  let match;
  while ((match = regex.exec(htmlContent)) !== null) {
    headings.push({ level: parseInt(match[1]), id: match[2], text: match[3].replace(/<[^>]*>/g, '') });
  }
  return headings;
}

function readChapters() {
  const files = readdirSync(SRC_DIR)
    .filter(f => f.endsWith('.md'))
    .sort();

  const chapters = [];
  for (const file of files) {
    const raw = readFileSync(join(SRC_DIR, file), 'utf-8');
    const { frontmatter, content } = parseFrontmatter(raw);
    const html = marked.parse(content);
    const toc = buildToc(html);
    chapters.push({
      file,
      slug: slugify(frontmatter.title || parse(file).name),
      title: frontmatter.title || parse(file).name,
      order: frontmatter.order == null ? 99 : parseInt(frontmatter.order, 10),
      icon: frontmatter.icon || '📄',
      html,
      toc
    });
  }
  chapters.sort((a, b) => a.order - b.order);
  return chapters;
}

function buildHTML(chapters) {
  const navItems = chapters.map((ch, i) => {
    const subs = ch.toc.filter(h => h.level === 3).map(h =>
      `<li><a href="#${h.id}" data-section="${i}" class="sub-link">${h.text}</a></li>`
    ).join('\n');

    return `
      <li class="section-header">
        <a href="#${ch.slug}" data-section="${i}" class="section-link">
          <span class="section-icon">${ch.icon}</span>
          <span class="section-title">${ch.title}</span>
        </a>
        ${subs ? `<ul class="sub-sections">${subs}</ul>` : ''}
      </li>`;
  }).join('\n');

  const sections = chapters.map((ch, i) => {
    const prev = chapters[i - 1];
    const next = chapters[i + 1];
    const nav = `
      <nav class="section-nav">
        ${prev ? `<a href="#${prev.slug}" data-section="${i - 1}" class="nav-prev">&larr; ${prev.title}</a>` : '<span></span>'}
        <span class="section-counter">${i + 1} / ${chapters.length}</span>
        ${next ? `<a href="#${next.slug}" data-section="${i + 1}" class="nav-next">${next.title} &rarr;</a>` : '<span></span>'}
      </nav>`;
    return `<section id="${ch.slug}" class="chapter" data-index="${i}">${htmlContent(ch, nav)}</section>`;
  }).join('\n');

  function htmlContent(ch, nav) {
    const top = `<h1 id="${ch.slug}" class="chapter-title">${ch.title}</h1>${nav}`;
    return top + '\n' + ch.html.replace(/<h1[^>]*>.*?<\/h1>/, '') + '\n' + nav;
  }

  const tocJson = JSON.stringify(chapters.map(ch => ({
    title: ch.title,
    slug: ch.slug,
    icon: ch.icon,
    toc: ch.toc
  })));

  return `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SQL Server DBA Interview Prep — Senior Infrastructure Operations Engineer</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #ffffff;
      --bg-secondary: #f6f8fa;
      --bg-tertiary: #f0f2f5;
      --text: #1f2328;
      --text-secondary: #656d76;
      --text-muted: #8b949e;
      --border: #d0d7de;
      --accent: #0969da;
      --accent-hover: #0550ae;
      --accent-bg: #ddf4ff;
      --code-bg: #f6f8fa;
      --sidebar-bg: #f6f8fa;
      --sidebar-hover: #eaeef2;
      --sidebar-active: #ddf4ff;
      --shadow: 0 1px 3px rgba(31,35,40,0.12);
      --shadow-lg: 0 8px 24px rgba(31,35,40,0.12);
      --radius: 8px;
      --radius-sm: 4px;
      --nav-height: 56px;
      --sidebar-width: 280px;
    }
    [data-theme="dark"] {
      --bg: #0d1117;
      --bg-secondary: #161b22;
      --bg-tertiary: #21262d;
      --text: #e6edf3;
      --text-secondary: #8b949e;
      --text-muted: #6e7681;
      --border: #30363d;
      --accent: #58a6ff;
      --accent-hover: #79c0ff;
      --accent-bg: #0c2d6b;
      --code-bg: #161b22;
      --sidebar-bg: #161b22;
      --sidebar-hover: #21262d;
      --sidebar-active: #0c2d6b;
      --shadow: 0 1px 3px rgba(0,0,0,0.4);
      --shadow-lg: 0 8px 24px rgba(0,0,0,0.4);
    }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; scroll-padding-top: calc(var(--nav-height) + 16px); }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      font-size: 15px;
    }
    a { color: var(--accent); text-decoration: none; }
    a:hover { color: var(--accent-hover); text-decoration: underline; }

    /* Top nav */
    .top-nav {
      position: fixed; top: 0; left: 0; right: 0;
      height: var(--nav-height);
      background: var(--bg-secondary);
      border-bottom: 1px solid var(--border);
      display: flex; align-items: center;
      padding: 0 16px;
      z-index: 100;
      gap: 12px;
      backdrop-filter: blur(8px);
    }
    .top-nav .menu-btn {
      display: none; background: none; border: none; color: var(--text);
      font-size: 20px; cursor: pointer; padding: 8px;
    }
    .top-nav .logo {
      font-weight: 700; font-size: 15px; color: var(--text);
      display: flex; align-items: center; gap: 8px;
    }
    .top-nav .logo svg { width: 22px; height: 22px; }
    .top-nav .logo span { color: var(--accent); }
    .top-nav .spacer { flex: 1; }
    .top-nav .theme-toggle {
      background: none; border: 1px solid var(--border); border-radius: var(--radius-sm);
      color: var(--text); cursor: pointer; padding: 6px 10px; font-size: 14px;
      transition: all 0.2s;
    }
    .top-nav .theme-toggle:hover { background: var(--bg-tertiary); }

    /* Sidebar */
    .sidebar-overlay { display: none; }
    .sidebar {
      position: fixed; top: var(--nav-height); left: 0; bottom: 0;
      width: var(--sidebar-width);
      background: var(--sidebar-bg);
      border-right: 1px solid var(--border);
      overflow-y: auto;
      z-index: 90;
      padding: 12px 0;
    }
    .sidebar::-webkit-scrollbar { width: 6px; }
    .sidebar::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

    .sidebar .search-box {
      margin: 0 12px 12px;
      position: relative;
    }
    .sidebar .search-box input {
      width: 100%; padding: 8px 12px 8px 32px;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      background: var(--bg);
      color: var(--text);
      font-size: 13px;
      outline: none;
    }
    .sidebar .search-box input:focus { border-color: var(--accent); }
    .sidebar .search-box .search-icon {
      position: absolute; left: 10px; top: 50%; transform: translateY(-50%);
      color: var(--text-muted); font-size: 13px;
    }

    .sidebar ul { list-style: none; }
    .sidebar .section-header { margin: 0; }
    .sidebar .section-link {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 16px;
      color: var(--text);
      font-size: 13px;
      font-weight: 500;
      text-decoration: none;
      transition: all 0.15s;
      border-left: 3px solid transparent;
    }
    .sidebar .section-link:hover {
      background: var(--sidebar-hover);
      text-decoration: none;
    }
    .sidebar .section-link.active {
      background: var(--sidebar-active);
      border-left-color: var(--accent);
      color: var(--accent);
    }
    .sidebar .section-icon { font-size: 16px; width: 20px; text-align: center; flex-shrink: 0; }

    .sidebar .sub-sections { display: none; margin: 0 0 4px 36px; }
    .sidebar .sub-sections li { margin: 0; }
    .sidebar .sub-sections a {
      display: block; padding: 4px 8px;
      font-size: 12px; color: var(--text-secondary);
      border-radius: var(--radius-sm);
      transition: all 0.15s;
    }
    .sidebar .sub-sections a:hover {
      background: var(--sidebar-hover);
      color: var(--text);
      text-decoration: none;
    }
    .sidebar .section-header.expanded .sub-sections { display: block; }

    /* Main content */
    .main-content {
      margin-left: var(--sidebar-width);
      padding: calc(var(--nav-height) + 32px) 48px 64px;
      max-width: 900px;
    }
    .chapter { display: none; }
    .chapter.active { display: block; animation: fadeIn 0.3s ease; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

    /* Markdown styling */
    .chapter-title {
      font-size: 28px; font-weight: 700;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--border);
    }
    .chapter h2 {
      font-size: 20px; font-weight: 600;
      margin-top: 32px; margin-bottom: 12px;
      padding-bottom: 6px;
      border-bottom: 1px solid var(--border);
    }
    .chapter h2:first-of-type { margin-top: 24px; }
    .chapter h3 {
      font-size: 17px; font-weight: 600;
      margin-top: 28px; margin-bottom: 8px;
    }
    .chapter h4 {
      font-size: 15px; font-weight: 600;
      margin-top: 20px; margin-bottom: 6px;
    }
    .chapter p { margin-bottom: 16px; }
    .chapter ul, .chapter ol { margin-bottom: 16px; padding-left: 24px; }
    .chapter li { margin-bottom: 6px; }
    .chapter li > ul, .chapter li > ol { margin-bottom: 4px; }
    .chapter hr {
      border: none; border-top: 1px solid var(--border);
      margin: 24px 0;
    }

    .chapter blockquote {
      margin: 16px 0; padding: 12px 16px;
      border-left: 4px solid var(--accent);
      background: var(--bg-secondary);
      border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
    }
    .chapter blockquote p:last-child { margin-bottom: 0; }
    .chapter blockquote strong:first-child { color: var(--accent); }

    .chapter table {
      width: 100%; border-collapse: collapse;
      margin: 16px 0; font-size: 14px;
    }
    .chapter table th, .chapter table td {
      padding: 8px 12px; border: 1px solid var(--border);
      text-align: left;
    }
    .chapter table th {
      background: var(--bg-secondary);
      font-weight: 600;
    }
    .chapter table tr:nth-child(even) { background: var(--bg-secondary); }

    .chapter code {
      font-family: 'JetBrains Mono', 'Fira Code', monospace;
      font-size: 13px;
      padding: 2px 6px;
      background: var(--code-bg);
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
    }
    .chapter pre {
      margin: 16px 0;
      border-radius: var(--radius);
      border: 1px solid var(--border);
      overflow: hidden;
      position: relative;
    }
    .chapter pre code {
      display: block; padding: 16px;
      background: var(--code-bg);
      border: none;
      font-size: 13px;
      line-height: 1.5;
      overflow-x: auto;
    }
    .chapter pre .copy-btn {
      position: absolute; top: 8px; right: 8px;
      background: var(--bg-tertiary); border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      color: var(--text-secondary); cursor: pointer;
      padding: 4px 8px; font-size: 11px;
      opacity: 0; transition: opacity 0.2s;
    }
    .chapter pre:hover .copy-btn { opacity: 1; }
    .chapter pre .copy-btn:hover { background: var(--bg); color: var(--text); }
    .chapter pre .copy-btn.copied { background: #238636; color: #fff; border-color: #238636; }

    .section-nav {
      display: flex; justify-content: space-between; align-items: center;
      margin: 32px 0 16px; padding: 12px 0;
      border-top: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
      font-size: 13px;
    }
    .section-nav .nav-prev, .section-nav .nav-next { font-weight: 500; }
    .section-nav .section-counter { color: var(--text-muted); font-size: 12px; }
    .section-nav:first-of-type { margin-top: 0; border-top: none; }

    /* Tip / Warning / Info boxes */
    .tip, .warning, .info {
      margin: 16px 0; padding: 12px 16px;
      border-radius: var(--radius);
      border-left: 4px solid;
    }
    .tip { background: #dafbe1; border-color: #1a7f37; color: #116329; }
    [data-theme="dark"] .tip { background: #1a3a2a; border-color: #3fb950; color: #7ee787; }
    .warning { background: #fff8c5; border-color: #d29922; color: #7a5e00; }
    [data-theme="dark"] .warning { background: #3d2e00; border-color: #d29922; color: #e3b341; }
    .info { background: var(--accent-bg); border-color: var(--accent); color: var(--accent); }
    [data-theme="dark"] .info { background: #0c2d6b; color: #79c0ff; }

    /* Search */
    .search-no-results {
      display: none; text-align: center; padding: 40px 20px;
      color: var(--text-muted);
    }
    .search-highlight {
      background: #fff8c5; color: #1f2328;
      padding: 0 2px; border-radius: 2px;
    }
    .search-highlight.active {
      background: #ff9f1a; color: #000;
      box-shadow: 0 0 0 2px #ff9f1a;
    }
    [data-theme="dark"] .search-highlight {
      background: #3d2e00; color: #e6edf3;
    }
    [data-theme="dark"] .search-highlight.active {
      background: #cc7a00; color: #fff;
      box-shadow: 0 0 0 2px #cc7a00;
    }

    .search-bar {
      display: none; align-items: center; gap: 12px;
      padding: 8px 16px; margin-bottom: 16px;
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      font-size: 13px;
    }
    .search-bar .match-nav { display: flex; align-items: center; gap: 4px; }
    .search-bar .match-nav button {
      background: var(--bg-tertiary); border: 1px solid var(--border);
      border-radius: var(--radius-sm); cursor: pointer;
      padding: 2px 8px; font-size: 13px; color: var(--text);
      line-height: 1.4;
    }
    .search-bar .match-nav button:hover { background: var(--bg); }
    .search-bar .match-nav button:disabled { opacity: 0.4; cursor: default; }
    .search-bar .match-info {
      color: var(--text-muted); min-width: 100px;
      font-variant-numeric: tabular-nums;
    }
    .search-bar .match-query {
      color: var(--text-secondary);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .search-bar .match-query strong { color: var(--text); }
    .search-bar .spacer { flex: 1; }
    .search-bar .clear-search {
      background: none; border: none; color: var(--text-muted);
      cursor: pointer; font-size: 16px; padding: 2px 6px;
      border-radius: var(--radius-sm); line-height: 1;
    }
    .search-bar .clear-search:hover { background: var(--bg-tertiary); color: var(--text); }

    .sidebar .search-box .search-clear {
      position: absolute; right: 6px; top: 50%; transform: translateY(-50%);
      background: none; border: none; color: var(--text-muted);
      cursor: pointer; font-size: 14px; padding: 2px 4px;
      display: none; border-radius: var(--radius-sm); line-height: 1;
    }
    .sidebar .search-box .search-clear:hover { background: var(--bg-tertiary); color: var(--text); }
    .sidebar .search-box .search-clear.visible { display: block; }

    /* Print */
    @media print {
      .sidebar, .top-nav, .section-nav, .copy-btn { display: none !important; }
      .main-content { margin-left: 0; padding: 20px; max-width: 100%; }
      .chapter { display: block !important; page-break-after: always; }
      .chapter:last-child { page-break-after: avoid; }
      pre { break-inside: avoid; }
      table { break-inside: avoid; }
    }

    /* Mobile */
    @media (max-width: 768px) {
      .top-nav .menu-btn { display: block; }
      .top-nav { padding: 0 12px; }
      .top-nav .logo-subtitle { display: none; }
      .sidebar {
        transform: translateX(-100%);
        transition: transform 0.3s ease;
        width: 260px;
        -webkit-overflow-scrolling: touch;
      }
      .sidebar.open { transform: translateX(0); }
      .sidebar-overlay {
        display: none; position: fixed; inset: 0;
        background: rgba(0,0,0,0.5); z-index: 80;
      }
      .sidebar-overlay.open { display: block; }
      .main-content { margin-left: 0; padding: calc(var(--nav-height) + 16px) 16px 32px; }
      .chapter-title { font-size: 22px; }
      .chapter h2 { font-size: 18px; }
      .chapter h3 { font-size: 16px; }
      .chapter p, .chapter li { font-size: 14px; line-height: 1.7; }
      .chapter pre code { font-size: 12px; padding: 12px; -webkit-overflow-scrolling: touch; }
      .chapter blockquote { padding: 10px 12px; }
      .chapter table { font-size: 12px; display: block; overflow-x: auto; white-space: nowrap; -webkit-overflow-scrolling: touch; }
      .chapter table th, .chapter table td { padding: 4px 8px; }
      .chapter ul, .chapter ol { padding-left: 20px; }
      .section-nav { flex-wrap: wrap; gap: 4px; font-size: 12px; }
      .section-nav .nav-prev, .section-nav .nav-next { flex: 1; min-width: 0; }
      .section-nav .nav-prev { text-align: left; }
      .section-nav .nav-next { text-align: right; }
      .section-nav .section-counter { flex: 0 0 auto; }
      .sidebar .section-link { padding: 10px 16px; min-height: 44px; }
      .sidebar .sub-sections a { padding: 8px 8px; min-height: 36px; }
      .sidebar .search-box input { font-size: 16px; }
      .chapter pre .copy-btn { opacity: 1; padding: 8px 12px; }
      .search-bar { flex-wrap: wrap; gap: 8px; padding: 8px 12px; font-size: 12px; }
      .search-bar .match-info { min-width: auto; }
      .top-nav .theme-toggle { font-size: 13px; padding: 6px 8px; }
      .chapter .tip, .chapter .warning, .chapter .info { padding: 10px 12px; font-size: 13px; }
    }

    @media (max-width: 480px) {
      .top-nav .logo { font-size: 13px; }
      .top-nav .logo svg { width: 18px; height: 18px; }
      .main-content { padding: calc(var(--nav-height) + 12px) 12px 28px; }
      .chapter-title { font-size: 20px; }
      .chapter h2 { font-size: 17px; }
      .chapter p, .chapter li { font-size: 13px; }
      .chapter pre code { font-size: 11px; padding: 10px; }
      .sidebar { width: 240px; }
      .sidebar .section-link { font-size: 12px; padding: 8px 12px; min-height: 40px; }
      .sidebar .search-box input { font-size: 14px; }
      .chapter table { font-size: 11px; }
      .chapter table th, .chapter table td { padding: 3px 6px; }
    }
  </style>
</head>
<body>
  <nav class="top-nav">
    <button class="menu-btn" onclick="toggleSidebar()" aria-label="Toggle navigation">☰</button>
    <div class="logo">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V9l-5-5H7C6 4 4 5 4 7z"/>
        <path d="M14 4v4a2 2 0 002 2h4"/>
        <path d="M8 12h8M8 16h6"/>
      </svg>
      SQL Server <span>Interview Prep</span>
    </div>
    <div class="logo-subtitle" style="font-size: 11px; color: var(--text-muted); margin-left: 8px;">
      Senior Infrastructure Operations Engineer
    </div>
    <div class="spacer"></div>
    <button class="theme-toggle" onclick="toggleTheme()" id="themeBtn">🌙 Dark</button>
  </nav>

  <div class="sidebar-overlay" id="sidebarOverlay" onclick="toggleSidebar()"></div>
  <aside class="sidebar" id="sidebar">
    <div class="search-box">
      <span class="search-icon">🔍</span>
      <input type="text" id="searchInput" placeholder="Search topics..." autocomplete="off" spellcheck="false">
      <button class="search-clear" id="searchClear" onclick="clearSearch()" aria-label="Clear search">&#x2715;</button>
    </div>
    <ul id="navList">
      ${navItems}
    </ul>
  </aside>

  <main class="main-content" id="mainContent">
    <div class="search-no-results" id="noResults">
      <div style="font-size: 48px; margin-bottom: 16px;">🔍</div>
      <h3>No results found</h3>
      <p>Try a different search term</p>
    </div>
    <div class="search-bar" id="searchBar">
      <span class="match-info" id="matchInfo">0 of 0 matches</span>
      <span class="match-nav">
        <button id="prevMatch" onclick="navigateMatches(-1)" title="Previous match (Shift+Enter)" disabled>&uarr;</button>
        <button id="nextMatch" onclick="navigateMatches(1)" title="Next match (Enter)" disabled>&darr;</button>
      </span>
      <span class="match-query" id="matchQuery"></span>
      <span class="spacer"></span>
      <button class="clear-search" onclick="clearSearch()" title="Clear search (Esc)">&#x2715;</button>
    </div>
    ${sections}
  </main>

  <script>
    const CHAPTERS = ${tocJson};

    // ── Navigation ──
    function showSection(index) {
      document.querySelectorAll('.chapter').forEach((el, i) => {
        el.classList.toggle('active', i === index);
      });
      document.querySelectorAll('.section-link').forEach((el, i) => {
        el.classList.toggle('active', i === index);
      });
      document.querySelectorAll('.section-header').forEach((el, i) => {
        el.classList.toggle('expanded', i === index);
      });
      const title = CHAPTERS[index]?.title || '';
      document.title = title + ' \u2014 SQL Server Interview Prep';
      window.scrollTo({ top: 0, behavior: 'smooth' });
      const sidebar = document.getElementById('sidebar');
      if (sidebar.classList.contains('open')) toggleSidebar();
    }

    function initNav() {
      const hash = window.location.hash.slice(1);
      const links = document.querySelectorAll('.section-link, .sub-link, .nav-prev, .nav-next');
      links.forEach(link => {
        link.addEventListener('click', (e) => {
          const idx = link.dataset.section;
          if (idx !== undefined) {
            e.preventDefault();
            showSection(parseInt(idx));
            const targetId = link.getAttribute('href').slice(1);
            if (targetId && targetId !== CHAPTERS[parseInt(idx)]?.slug) {
              setTimeout(() => {
                document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }
            window.history.replaceState(null, '', '#' + (CHAPTERS[parseInt(idx)]?.slug || ''));
          }
        });
      });

      let initialIdx = 0;
      if (hash) {
        const found = CHAPTERS.findIndex(c => c.slug === hash);
        if (found >= 0) initialIdx = found;
      }
      showSection(initialIdx);
    }

    // ── Theme ──
    function toggleTheme() {
      const html = document.documentElement;
      const btn = document.getElementById('themeBtn');
      const isDark = html.getAttribute('data-theme') === 'dark';
      html.setAttribute('data-theme', isDark ? 'light' : 'dark');
      btn.textContent = isDark ? '\uD83C\uDF19 Dark' : '\u2600\uFE0F Light';
      localStorage.setItem('theme', isDark ? 'light' : 'dark');
    }

    (function() {
      const saved = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (saved === 'dark' || (!saved && prefersDark)) {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.getElementById('themeBtn').textContent = '\u2600\uFE0F Light';
      }
    })();

    // ── Sidebar ──
    function toggleSidebar() {
      document.getElementById('sidebar').classList.toggle('open');
      document.getElementById('sidebarOverlay').classList.toggle('open');
    }

    // ── Search Module ──
    let searchTimeout = null;
    let currentMatchIndex = -1;
    let totalMatchCount = 0;
    let chapterMatchCounts = [];

    function escapeRegex(str) {
      return str.replace(/[.*+?^\${}()|[\]\\]/g, '\\$&');
    }

    function handleSearch(query) {
      query = query.trim();
      const noResults = document.getElementById('noResults');
      const searchBar = document.getElementById('searchBar');
      const matchInfo = document.getElementById('matchInfo');
      const matchQuery = document.getElementById('matchQuery');
      const prevBtn = document.getElementById('prevMatch');
      const nextBtn = document.getElementById('nextMatch');
      const clearBtn = document.getElementById('searchClear');

      unhighlightAll();

      if (!query) {
        document.querySelectorAll('.chapter').forEach(el => { el.style.display = ''; });
        document.querySelectorAll('.section-header').forEach(el => { el.style.display = ''; });
        noResults.style.display = 'none';
        searchBar.style.display = 'none';
        clearBtn.classList.remove('visible');
        const activeIdx = Array.from(document.querySelectorAll('.chapter')).findIndex(c => c.classList.contains('active'));
        showSection(activeIdx >= 0 ? activeIdx : 0);
        return;
      }

      clearBtn.classList.add('visible');
      const lowerQuery = query.toLowerCase();
      const escapedQuery = escapeRegex(query);
      let totalMatches = 0;
      let chaptersWithMatches = 0;
      chapterMatchCounts = [];

      document.querySelectorAll('.chapter').forEach((ch, idx) => {
        const text = ch.textContent;
        const regex = new RegExp(escapedQuery, 'gi');
        const matches = text.match(regex);
        const matchCount = matches ? matches.length : 0;
        chapterMatchCounts[idx] = matchCount;

        if (matchCount > 0) {
          ch.style.display = 'block';
          chaptersWithMatches++;
          totalMatches += matchCount;
          highlightText(ch, query);
        } else {
          ch.style.display = 'none';
        }
      });

      document.querySelectorAll('.section-header').forEach((el, idx) => {
        const matchInContent = chapterMatchCounts[idx] > 0;
        const matchInTitle = CHAPTERS[idx] && CHAPTERS[idx].title.toLowerCase().includes(lowerQuery);
        el.style.display = matchInContent || matchInTitle ? '' : 'none';
      });

      totalMatchCount = totalMatches;

      if (totalMatches === 0) {
        noResults.style.display = 'block';
        searchBar.style.display = 'none';
      } else {
        noResults.style.display = 'none';
        searchBar.style.display = 'flex';
        matchInfo.textContent = totalMatches + ' match' + (totalMatches !== 1 ? 'es' : '') + ' in ' + chaptersWithMatches + ' chapter' + (chaptersWithMatches !== 1 ? 's' : '');
        matchQuery.innerHTML = 'for <strong>' + escapeHtml(query) + '</strong>';
        prevBtn.disabled = totalMatches <= 1;
        nextBtn.disabled = totalMatches <= 1;

        const firstMatch = chapterMatchCounts.findIndex(c => c > 0);
        if (firstMatch >= 0) {
          currentMatchIndex = 0;
          showSection(firstMatch);
          setTimeout(function() {
            const highlights = document.querySelectorAll('.search-highlight');
            if (highlights.length > 0) {
              highlights[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 150);
        }
      }
    }

    function escapeHtml(str) {
      return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function unhighlightAll() {
      document.querySelectorAll('.search-highlight').forEach(function(el) {
        el.parentNode.replaceChild(document.createTextNode(el.textContent), el);
      });
      document.querySelectorAll('.chapter, .search-bar').forEach(function(el) { el.normalize(); });
    }

    function navigateMatches(direction) {
      if (totalMatchCount === 0) return;
      const highlights = document.querySelectorAll('.search-highlight');
      if (highlights.length === 0) return;

      document.querySelectorAll('.search-highlight.active').forEach(function(el) {
        el.classList.remove('active');
      });

      currentMatchIndex = (currentMatchIndex + direction + highlights.length) % highlights.length;
      const target = highlights[currentMatchIndex];
      target.classList.add('active');
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });

      const ch = target.closest('.chapter');
      if (ch) {
        const idx = Array.from(document.querySelectorAll('.chapter')).indexOf(ch);
        if (idx >= 0) {
          showSection(idx);
        }
      }

      document.getElementById('matchInfo').textContent = (currentMatchIndex + 1) + ' of ' + totalMatchCount + ' matches';
    }

    function clearSearch() {
      const input = document.getElementById('searchInput');
      input.value = '';
      handleSearch('');
      input.focus();
    }

    function highlightText(element, query) {
      const escaped = escapeRegex(query);
      const regex = new RegExp(escaped, 'gi');

      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
      const textNodes = [];
      while (walker.nextNode()) textNodes.push(walker.currentNode);

      textNodes.forEach(function(node) {
        var parent = node.parentNode;
        if (!parent) return;
        var tag = parent.nodeName;
        if (tag === 'CODE' || tag === 'PRE') return;
        if (parent.classList && parent.classList.contains('search-highlight')) return;

        regex.lastIndex = 0;
        if (!regex.test(node.textContent)) return;

        regex.lastIndex = 0;
        var frag = document.createDocumentFragment();
        var lastIndex = 0;
        var text = node.textContent;
        var match;

        while ((match = regex.exec(text)) !== null) {
          if (match.index > lastIndex) {
            frag.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
          }
          var mark = document.createElement('mark');
          mark.className = 'search-highlight';
          mark.textContent = match[0];
          frag.appendChild(mark);
          lastIndex = regex.lastIndex;
        }

        if (lastIndex < text.length) {
          frag.appendChild(document.createTextNode(text.slice(lastIndex)));
        }

        parent.replaceChild(frag, node);
      });
    }

    function debounceSearch() {
      var input = document.getElementById('searchInput');
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(function() {
        handleSearch(input.value);
      }, 150);
    }

    // ── Keyboard Shortcuts ──
    document.addEventListener('keydown', function(e) {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && document.activeElement !== document.getElementById('searchInput')) {
        e.preventDefault();
        document.getElementById('searchInput').focus();
        return;
      }
      if (e.key === 'Escape') {
        var input = document.getElementById('searchInput');
        if (document.activeElement === input && input.value) {
          e.preventDefault();
          clearSearch();
          return;
        }
      }
      if (e.key === 'Enter') {
        var input = document.getElementById('searchInput');
        if (document.activeElement === input && input.value) {
          e.preventDefault();
          navigateMatches(e.shiftKey ? -1 : 1);
          return;
        }
      }
      if (e.key === 't' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        toggleTheme();
      }
    });

    document.getElementById('searchInput').addEventListener('input', debounceSearch);

    initNav();
  </script>
</body>
</html>`;
}

function main() {
  if (!existsSync(SRC_DIR)) {
    console.error('Error: src/ directory not found. Create markdown files in src/');
    process.exit(1);
  }
  if (!existsSync(DIST_DIR)) mkdirSync(DIST_DIR, { recursive: true });

  console.log('Reading chapters from src/...');
  const chapters = readChapters();
  console.log(`  Found ${chapters.length} chapters`);

  console.log('Building HTML...');
  const html = buildHTML(chapters);
  writeFileSync(join(DIST_DIR, 'index.html'), html, 'utf-8');

  const totalSize = (Buffer.byteLength(html) / 1024).toFixed(1);
  console.log(`  Output: dist/index.html (${totalSize} KB)`);
  console.log('\nDone! Open dist/index.html in your browser.');
  console.log('  npm run preview  →  to serve with a local web server');
}

main();
