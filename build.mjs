import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import path from "node:path";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const assetVersion = async (file) =>
  createHash("md5")
    .update(await readFile(path.join(ROOT, file)))
    .digest("hex")
    .slice(0, 8);
const CSS_VERSION = await assetVersion("styles.css");
const JS_VERSION = await assetVersion("script.js");
const DATA_FILE = path.join(ROOT, "data", "projects.json");
const INDEX_FILE = path.join(ROOT, "index.html");
const SITE_URL = "https://oleggazeta67-alt.github.io/fomin/";
const EMAIL = "oleggazeta67@gmail.com";
const TELEGRAM = "corrny303";
const BRAND = "VOLKOV";
const OWNER = "Олег Волков";
const CITY = "Москва";

const esc = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const plural = (n, forms) => {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
};

const readProjects = async () => {
  const raw = await readFile(DATA_FILE, "utf8");
  const data = JSON.parse(raw);
  if (!Array.isArray(data.projects) || data.projects.length === 0) {
    throw new Error("data/projects.json: projects должен быть непустым массивом");
  }

  const seen = new Set();
  const projects = data.projects
    .map((project) => {
      const required = ["slug", "title", "subtitle", "year", "category", "client", "role", "summary", "cover", "alt"];
      required.forEach((field) => {
        if (!project[field]) throw new Error(`Проект «${project.slug || "?"}»: нет поля ${field}`);
      });
      if (!/^[a-z0-9-]+$/.test(project.slug)) {
        throw new Error(`Недопустимый slug: ${project.slug} (только a-z, 0-9 и дефис)`);
      }
      if (seen.has(project.slug)) throw new Error(`Дублируется slug: ${project.slug}`);
      seen.add(project.slug);
      if (!Array.isArray(project.description) || project.description.length === 0) {
        throw new Error(`Проект «${project.slug}»: нужен хотя бы один абзац в description`);
      }
      if (!Array.isArray(project.deliverables)) {
        throw new Error(`Проект «${project.slug}»: deliverables должен быть массивом`);
      }
      return project;
    })
    .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));

  for (const project of projects) {
    const coverPath = path.join(ROOT, project.cover);
    try {
      await access(coverPath);
    } catch {
      throw new Error(`Проект «${project.slug}»: не найден файл обложки ${project.cover}`);
    }
  }

  return projects;
};

const workRow = (project) => `        <a class="work" href="work/${project.slug}/" data-preview="${esc(project.cover)}">
          <span class="work-index" aria-hidden="true">${String(project.order ?? 0).padStart(2, "0")}</span>
          <span class="work-main">
            <span class="work-title">${esc(project.title)}</span>
            <span class="work-sub">${esc(project.subtitle)}</span>
          </span>
          <span class="work-cat">${esc(project.category)}</span>
          <span class="work-year">${esc(project.year)}</span>
          <span class="work-arrow" aria-hidden="true">→</span>
        </a>`;

const favicon =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%230b0a09'/%3E%3Ctext x='32' y='46' font-family='Georgia,serif' font-size='38' font-weight='700' fill='%23ff4a1c' text-anchor='middle'%3EV%3C/text%3E%3C/svg%3E";

const header = () => `  <header class="site-header" id="site-header">
    <a class="brand" href="../../index.html" aria-label="${OWNER} — на главную">
      <span class="brand-name">${BRAND}</span>
      <span class="brand-sub">графический дизайн</span>
    </a>

    <nav class="nav" aria-label="Основная навигация">
      <a href="../../index.html#projects">Проекты</a>
      <a href="../../index.html#services">Услуги</a>
      <a href="../../index.html#about">Обо мне</a>
      <a href="../../index.html#contact">Контакт</a>
    </nav>

    <div class="header-side">
      <span class="status"><i aria-hidden="true"></i>беру заказы</span>
      <a class="header-mail" href="https://t.me/${TELEGRAM}" target="_blank" rel="noopener">@${TELEGRAM}</a>
    </div>

    <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="mobile-menu">
      <span class="menu-toggle-label">Меню</span>
      <span class="menu-toggle-lines" aria-hidden="true"><i></i><i></i></span>
    </button>
  </header>

  <div class="mobile-menu" id="mobile-menu" role="dialog" aria-modal="true" aria-label="Меню" aria-hidden="true">
    <div class="mm-top">
      <span class="mm-brand">${BRAND}</span>
      <button class="mm-close" type="button" aria-label="Закрыть меню">×</button>
    </div>
    <nav class="mm-nav" aria-label="Мобильная навигация">
      <a href="../../index.html#projects"><span>01</span>Проекты</a>
      <a href="../../index.html#services"><span>02</span>Услуги</a>
      <a href="../../index.html#about"><span>03</span>Обо мне</a>
      <a href="../../index.html#contact"><span>04</span>Контакт</a>
    </nav>
    <div class="mm-foot">
      <a href="https://t.me/${TELEGRAM}" target="_blank" rel="noopener">@${TELEGRAM}</a>
      <a href="mailto:${EMAIL}">${EMAIL}</a>
      <p>${CITY} · удалённо</p>
    </div>
  </div>`;

const footer = () => `  <footer class="footer">
    <div class="footer-top">
      <span>© 2026 ${BRAND}</span>
      <span>Графический дизайн</span>
      <a href="#main">Наверх ↑</a>
    </div>
    <div class="footer-word" aria-hidden="true">${BRAND}<span>.</span></div>
  </footer>`;

const projectPage = (project, next) => {
  const description = `${project.subtitle}. ${project.summary}`;
  const ogImage = SITE_URL + project.cover;
  const paragraphs = project.description
    .map((text) => `        <p>${esc(text)}</p>`)
    .join("\n");
  const deliverables = project.deliverables
    .map((item) => `            <li>${esc(item)}</li>`)
    .join("\n");
  const siteLink = project.link
    ? `\n        <a class="p-site" href="${esc(project.link)}" target="_blank" rel="noopener">${esc(
        project.linkLabel || "Открыть сайт"
      )} <span aria-hidden="true">↗</span></a>`
    : "";
  const nextBlock = next
    ? `    <a class="p-next" href="../${next.slug}/">
      <span class="p-next-label">Следующий проект</span>
      <span class="p-next-title">
        <span>${esc(next.title)}</span>
        <span aria-hidden="true">→</span>
      </span>
    </a>`
    : "";

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(project.title)} — ${OWNER}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="theme-color" content="#0b0a09">
  <meta property="og:title" content="${esc(project.title)} — ${OWNER}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:type" content="article">
  <meta property="og:image" content="${esc(ogImage)}">
  <link rel="canonical" href="${SITE_URL}work/${project.slug}/">
  <link rel="icon" href="${favicon}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant:ital,wght@0,400;0,500;1,400;1,500&family=Golos+Text:wght@400;500&family=JetBrains+Mono:wght@400;500&family=Unbounded:wght@300;400;500;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../../styles.css?v=${CSS_VERSION}">
  <script>document.documentElement.classList.add('js');</script>
  <script src="../../script.js?v=${JS_VERSION}" defer></script>
</head>
<body class="project-page" style="--accent: ${esc(project.accent || "#ff4a1c")}">
  <a class="skip" href="#main">Перейти к содержанию</a>
  <div class="grain" aria-hidden="true"></div>

${header()}

  <main id="main">
    <section class="p-hero">
      <div class="p-kicker">
        <span class="p-cat">Проект · ${esc(project.category)}</span>
        <span>${esc(project.year)}</span>
      </div>

      <h1 class="p-title">${esc(project.title)}</h1>
      <p class="p-sub">${esc(project.subtitle)}</p>

      <dl class="p-meta">
        <div>
          <dt>Клиент</dt>
          <dd>${esc(project.client)}</dd>
        </div>
        <div>
          <dt>Роль</dt>
          <dd>${esc(project.role)}</dd>
        </div>
        <div>
          <dt>Год</dt>
          <dd>${esc(project.year)}</dd>
        </div>
        <div>
          <dt>Задачи</dt>
          <dd>
            <ul>
${deliverables}
            </ul>
          </dd>
        </div>
      </dl>

      <div class="p-actions">
        <a class="p-back" href="../../index.html#projects">← Все проекты</a>${siteLink}
      </div>
    </section>

    <figure class="p-cover">
      <img src="../../${esc(project.cover)}" width="${project.coverWidth || 1536}" height="${project.coverHeight || 1024}" alt="${esc(project.alt)}" fetchpriority="high">
      <figcaption class="p-caption">
        <span>${esc(project.alt)}</span>
        <span>${esc(project.category)} · ${esc(project.year)}</span>
      </figcaption>
    </figure>

    <section class="p-body">
      <aside class="p-body-aside">
        ${esc(project.category)}<br>${esc(project.year)}
      </aside>
      <div class="p-body-inner">
${paragraphs}
      </div>
    </section>

${nextBlock}
  </main>

${footer()}
</body>
</html>
`;
};

const main = async () => {
  const projects = await readProjects();
  const count = projects.length;
  const countLabel = `${count} ${plural(count, ["проект", "проекта", "проектов"])}`;

  let index = await readFile(INDEX_FILE, "utf8");
  const rows = projects.map(workRow).join("\n");

  index = index.replace(
    /<!-- PROJECTS:START -->[\s\S]*?<!-- PROJECTS:END -->/,
    `<!-- PROJECTS:START -->\n${rows}\n        <!-- PROJECTS:END -->`
  );

  index = index.replace(
    /<!-- COUNT:START -->[\s\S]*?<!-- COUNT:END -->/,
    `<!-- COUNT:START -->${countLabel}<!-- COUNT:END -->`
  );

  index = index
    .replace(/href="styles\.css(?:\?v=[^"]*)?"/, `href="styles.css?v=${CSS_VERSION}"`)
    .replace(/src="script\.js(?:\?v=[^"]*)?"/, `src="script.js?v=${JS_VERSION}"`);

  await writeFile(INDEX_FILE, index, "utf8");

  for (let i = 0; i < projects.length; i += 1) {
    const project = projects[i];
    const next = projects.length > 1 ? projects[(i + 1) % projects.length] : null;
    const dir = path.join(ROOT, "work", project.slug);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, "index.html"), projectPage(project, next), "utf8");
  }

  console.log(`Готово: ${countLabel}.`);
  console.log(`Страницы: ${projects.map((p) => `work/${p.slug}/`).join(", ")}`);
};

main().catch((error) => {
  console.error(`Ошибка сборки: ${error.message}`);
  process.exit(1);
});
