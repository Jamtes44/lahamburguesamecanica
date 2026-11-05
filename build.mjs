// Genera dist/ uniendo src/layout.html + src/pages/* + src/site.json, y falla si algo quedó roto.
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { whatsappUrl } from './src/cart.js';

const site = JSON.parse(readFileSync('src/site.json', 'utf8'));
const layout = readFileSync('src/layout.html', 'utf8');
const carta = JSON.parse(readFileSync('src/carta.json', 'utf8'));

const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const money = (n) => `$${n.toLocaleString('es-CO')}`;
const wa = (text) => esc(whatsappUrl(site.data.whatsapp, text));

function priceButton(item, { label, price }) {
  const fullName = label ? `${item.name} (${label.toLowerCase()})` : item.name;
  return `<button class="add-to-cart-btn flex-1 min-w-[130px] px-space-sm py-space-sm bg-primary-container hover:bg-gear-amber text-on-primary-container font-headline-sm text-body-sm uppercase tracking-wider transition-all active:translate-x-0.5 active:translate-y-0.5" data-name="${esc(fullName)}" data-price="${price}" type="button">${esc(label ?? 'Agregar')} ${money(price)}</button>`;
}

function card(item) {
  const buy = item.consult
    ? `<a class="flex-1 text-center px-space-sm py-space-sm border-2 border-outline hover:border-primary-container text-ink-white font-headline-sm text-body-sm uppercase tracking-wider transition-all" href="${wa(`Hola La Hamburguesa Mecánica, ¿cuál es el precio del ${item.name}?`)}" rel="noopener noreferrer" target="_blank">Consultar precio</a>`
    : item.prices.map((p) => priceButton(item, p)).join('');
  const badge = item.badge ? `<span class="w-fit bg-paper-stencil text-surface-dark px-space-xs py-0.5 font-label-badge text-label-badge uppercase">${esc(item.badge)}</span>` : '';
  const photo = item.photo ? `<img alt="${esc(item.name)}" class="w-full h-56 object-cover" loading="lazy" src="img/${item.photo}"/>` : '';
  const desc = item.desc ? `<p class="font-body-sm text-body-sm text-on-surface-variant">${esc(item.desc)}</p>` : '';
  return `<article class="bg-surface-container-low border-2 border-outline-variant shadow-[4px_4px_0_0_#000000] flex flex-col">${photo}<div class="p-space-md flex flex-col gap-space-sm flex-1">${badge}<h3 class="font-headline-md text-headline-md uppercase text-ink-white">${esc(item.name)}</h3>${desc}<div class="mt-auto pt-space-xs flex flex-wrap gap-space-xs">${buy}</div></div></article>`;
}

const section = (s) => `<section class="menu-category-section flex flex-col gap-space-lg" data-section="${s.id}"><h2 class="font-headline-hero text-headline-lg-mobile md:text-headline-lg uppercase text-ink-white border-l-8 border-primary-container pl-space-sm">${esc(s.title)}</h2><div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-lg">${s.items.map(card).join('')}</div></section>`;
const filterButton = (id, title, on) => `<button aria-pressed="${on}" class="category-filter-btn shrink-0 px-space-md py-space-xs ${on ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container text-on-surface'} font-headline-sm text-body-sm uppercase tracking-wider transition-all" data-cat="${id}" type="button">${esc(title)}</button>`;
const findItem = (name) => carta.flatMap((s) => s.items).find((i) => i.name === name);

const navActive = 'bg-surface-container text-ink-white border-2 border-primary-container shadow-[2px_2px_0_0_#FF6600]';
const navIdle = 'text-on-surface-variant hover:text-ink-white hover:bg-surface-container';

function navLinks(current, base) {
  return site.pages
    .map((p) => {
      const on = p.file === current;
      const state = on ? `aria-current="page" class="${base} ${navActive}"` : `class="${base} ${navIdle}"`;
      return `<a ${state} href="${p.file}">${p.label}</a>`;
    })
    .join('');
}

// La URL canónica y la imagen al compartir exigen rutas absolutas: sin dominio no se pueden emitir.
function absoluteTags(page) {
  const base = site.data.siteUrl;
  if (!base) return '';
  const url = `${base}/${page.file === 'index.html' ? '' : page.file}`;
  return `<link href="${url}" rel="canonical"/>\n<meta content="${url}" property="og:url"/>\n<meta content="${base}/img/novena-sinfonia.jpg" property="og:image"/>`;
}

// Sin horario: el único conocido es el de Rappi, y publicarlo aquí lo daría por oficial.
function jsonLd() {
  const { phoneTel, email, maps, instagram, facebook, tiktok, siteUrl } = site.data;
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: 'La Hamburguesa Mecánica',
    servesCuisine: 'Hamburguesas',
    telephone: phoneTel,
    email,
    hasMap: maps,
    acceptsReservations: true,
    address: { '@type': 'PostalAddress', streetAddress: 'Calle 72 #98B-15', addressLocality: 'Bogotá', addressCountry: 'CO' },
    sameAs: [instagram, facebook, tiktok],
    ...(siteUrl && { url: `${siteUrl}/`, image: `${siteUrl}/img/novena-sinfonia.jpg` }),
  };
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
}

function render(page) {
  const vars = {
    ...site.data,
    description: esc(page.description),
    absoluteTags: absoluteTags(page),
    jsonLd: page.file === 'index.html' ? jsonLd() : '',
    waDomicilio: wa('Hola La Hamburguesa Mecánica, quiero pedir un domicilio'),
    waReserva: wa('Hola La Hamburguesa Mecánica, quiero reservar una mesa'),
    carta: carta.map(section).join(''),
    cartaFiltros: [filterButton('all', 'Todo', true), ...carta.map((s) => filterButton(s.id, s.title, false))].join(''),
    destacados: ['La Novena Sinfonía', 'La Jäger', 'Gin Tonic Frutos Rojos'].map((n) => card(findItem(n))).join(''),
    title: page.title,
    content: readFileSync(`src/pages/${page.file}`, 'utf8'),
    nav: navLinks(page.file, 'px-space-md py-space-xs transition-all'),
    mobileNav: navLinks(page.file, 'block px-space-md py-space-sm transition-all'),
  };
  // Dos pasadas: content trae a su vez {{datos}} del negocio.
  const fill = (s) => s.replace(/\{\{(\w+)\}\}/g, (m, k) => vars[k] ?? m);
  return fill(fill(layout))
    .replace('<main ', '<main id="contenido" tabindex="-1" ')
    // Los iconos son texto ("restaurant_menu"): sin esto el lector de pantalla los lee y el traductor los rompe.
    .replaceAll('<span class="material-symbols-outlined', '<span aria-hidden="true" translate="no" class="material-symbols-outlined');
}

function check(file, html) {
  const errors = [];
  if (/\{\{\w+\}\}/.test(html)) errors.push(`variable sin definir: ${html.match(/\{\{\w+\}\}/)[0]}`);
  if (/href=""|href="#"/.test(html)) errors.push('enlace vacío (href="#")');
  if (/lh3\.googleusercontent|cdn\.tailwindcss/.test(html)) errors.push('dependencia remota de Stitch');
  if ((html.match(/<h1\b/g) ?? []).length !== 1) errors.push('debe tener exactamente un h1');
  if (/<img\b(?![^>]*\salt=)/.test(html)) errors.push('imagen sin alt');
  if (/content="" name="description"|content="undefined"/.test(html)) errors.push('falta la descripción');
  const refs = [...html.matchAll(/(?:href|src)="(?![a-z]+:)([^"#?]+)[^"]*"|url\('(?![a-z]+:)([^']+)'\)/g)].map((m) => m[1] ?? m[2]);
  for (const ref of refs) {
    if (ref !== 'styles.css' && !existsSync(`dist/${ref}`)) errors.push(`archivo inexistente: ${ref}`);
  }
  return errors.map((e) => `${file}: ${e}`);
}

rmSync('dist', { recursive: true, force: true });
mkdirSync('dist');
['cart.js', 'site.js'].forEach((file) => cpSync(`src/${file}`, `dist/${file}`));

const output = site.pages.map((p) => [p.file, render(p)]);
output.forEach(([file, html]) => writeFileSync(`dist/${file}`, html));
// Solo se publica lo que las páginas usan; una imagen sin referencia no llega a dist/.
mkdirSync('dist/img');
new Set(output.flatMap(([, html]) => html.match(/img\/[\w.-]+/g) ?? [])).forEach((img) => cpSync(`src/${img}`, `dist/${img}`));

const errors = output.flatMap(([file, html]) => check(file, html));
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
site.pending.forEach((note) => console.warn(`PENDIENTE: ${note}`));
console.log(`dist/: ${output.length} páginas sin enlaces rotos`);
