import { DEFAULT_CATALOG_ITEMS } from './config.js';
import { supabaseClient } from './supabase.js';
import { navigate } from './navigation.js';

export const DEFAULT_TAXONOMY = [
  {
    id: 'cat_3d',
    name: 'Impresión 3D',
    icon: '3D',
    isWebService: false,
    subcategories: [
      'Impresión 3D (General)',
      'Posavasos, Platos y Portalatas',
      'Llaveros y Portallaveros',
      'Videojuegos y Juegos de Mesa',
      'Estuches y Alcancias',
      'Exhibidores y Joyeros',
      'Separadores y Accesorios para Libros',
      'Lámparas y Lítofanias',
      'Macetas y Floreros'
    ]
  },
  {
    id: 'cat_col',
    name: 'Coleccionables',
    icon: '★',
    isWebService: false,
    subcategories: [
      'Coleccionables (General)',
      'Figuras y Mas',
      'Dioramas y Bases',
      'TCG y Cartas'
    ]
  },
  {
    id: 'cat_web',
    name: 'Desarrollo Web',
    icon: '</>',
    isWebService: true,
    subcategories: [
      'Desarrollo Web'
    ]
  }
];

let taxonomy = JSON.parse(JSON.stringify(DEFAULT_TAXONOMY));
try {
  const savedTax = localStorage.getItem('five_friends_taxonomy');
  if (savedTax) {
    const parsed = JSON.parse(savedTax);
    if (Array.isArray(parsed) && parsed.length > 0) taxonomy = parsed;
  }
} catch (e) {}

let catalogItems = [...DEFAULT_CATALOG_ITEMS];
try {
  const savedCat = localStorage.getItem('five_friends_catalog');
  if (savedCat) catalogItems = JSON.parse(savedCat);
} catch (e) {}

let currentMacroFilter = 'all';
let currentSubFilter = 'all';

const WEB_PACKAGES = [
  {
    id: 'web-landing',
    tag: 'Ideal para Emprendedores',
    title: 'Landing Page Profesional',
    price: '$3,000',
    maintenance: '$200 / mes',
    description: 'Página de aterrizaje rápida y moderna diseñada para presentar tu negocio y convertir visitas en clientes por WhatsApp.',
    features: [
      'Diseño responsivo (Celular, Tablet y PC)',
      'Botón directo a WhatsApp y formulario de contacto',
      'Galería de servicios o productos destacados',
      'Publicación en la nube con certificado SSL',
      'Mantenimiento mensual ($200/mes): cambios ilimitados de textos, fotos y precios durante el mes'
    ],
    featured: false
  },
  {
    id: 'web-corporate',
    tag: 'Más Solicitado',
    title: 'Sitio Web Multi-Sección & Catálogo',
    price: '$4,500',
    maintenance: '$200 / mes',
    description: 'Plataforma completa con múltiples vistas, catálogo navegable y arquitectura modular lista para crecer.',
    features: [
      'Hasta 5 secciones navegables (Inicio, Catálogo, Puntos, FAQ, Contacto)',
      'Catálogo con filtros por categoría y buscador en vivo',
      'Optimización de velocidad y posicionamiento básico',
      'Integración con redes sociales y Google Maps',
      'Mantenimiento mensual ($200/mes): todos los cambios y actualizaciones mensuales incluidos'
    ],
    featured: true
  },
  {
    id: 'web-ecommerce',
    tag: 'Llave en Mano',
    title: 'Tienda Online E-commerce Pro',
    price: '$6,000',
    maintenance: '$200 / mes',
    description: 'Tu tienda completa con carrito de compras, pasarela de pagos Mercado Pago, panel administrativo y base de datos.',
    features: [
      'Carrito de compras con envío o recolección en sucursal',
      'Cobros con Tarjeta, SPEI y OXXO (Mercado Pago Pro)',
      'Panel de Administrador para gestionar productos y pedidos',
      'Base de datos en tiempo real (Supabase) y portal de clientes',
      'Mantenimiento mensual ($200/mes): soporte continuo y cambios ilimitados al mes'
    ],
    featured: false
  }
];

export function getTaxonomy() {
  return taxonomy;
}

export async function loadTaxonomyFromDB() {
  if (supabaseClient) {
    try {
      const res = await supabaseClient
        .from('settings')
        .select('config_data')
        .eq('id', 'catalog_taxonomy')
        .maybeSingle();
      if (res?.data?.config_data && Array.isArray(res.data.config_data) && res.data.config_data.length > 0) {
        taxonomy = res.data.config_data;
        localStorage.setItem('five_friends_taxonomy', JSON.stringify(taxonomy));
      }
    } catch (e) {}
  }
  refreshTaxonomyUI();
}

export async function saveTaxonomy(newTaxonomy) {
  taxonomy = newTaxonomy;
  try {
    localStorage.setItem('five_friends_taxonomy', JSON.stringify(taxonomy));
  } catch (e) {}

  if (supabaseClient) {
    try {
      await supabaseClient.from('settings').upsert({
        id: 'catalog_taxonomy',
        config_data: taxonomy,
        updated_at: new Date().toISOString()
      });
    } catch (e) {}
  }

  refreshTaxonomyUI();
}

export function refreshTaxonomyUI() {
  renderMacroFilterButtons();
  renderSubcategoriesBar();
  renderCatalog();
  if (typeof window.populateProductCategorySelect === 'function') {
    window.populateProductCategorySelect();
  }
  if (typeof window.renderAdminTaxonomyManager === 'function') {
    window.renderAdminTaxonomyManager();
  }
}

export function getCatalogItems() {
  return catalogItems;
}

export function getParentCategoryObj(subOrCatName) {
  if (!subOrCatName) return taxonomy[0] || { name: 'Impresión 3D', icon: '3D', isWebService: false };
  const lower = subOrCatName.trim().toLowerCase();

  // Buscar coincidencia exacta en subcategorías o nombre de categoría padre
  for (const cat of taxonomy) {
    if (cat.name.toLowerCase() === lower) return cat;
    if (Array.isArray(cat.subcategories)) {
      const foundSub = cat.subcategories.find((s) => s.toLowerCase() === lower);
      if (foundSub) return cat;
    }
  }

  // Compatibilidad con registros históricos
  if (lower.indexOf('web') !== -1) {
    return taxonomy.find((c) => c.isWebService) || { name: 'Desarrollo Web', icon: '</>', isWebService: true };
  }
  if (lower === 'coleccionables' || lower === 'impresión 3d') {
    return taxonomy.find((c) => c.name.toLowerCase() === lower) || taxonomy[0];
  }

  return taxonomy[0] || { name: 'Impresión 3D', icon: '3D', isWebService: false };
}

export function getMacroCategory(category) {
  const parent = getParentCategoryObj(category);
  return parent ? parent.name : 'Impresión 3D';
}

export function saveCatalog(items) {
  catalogItems = items;
  try {
    localStorage.setItem('five_friends_catalog', JSON.stringify(catalogItems));
  } catch (e) {}
  renderSubcategoriesBar();
  renderCatalog();
  if (typeof window.renderAdminProductsTable === 'function') {
    window.renderAdminProductsTable();
  }
}

export async function fetchCatalogFromDatabase() {
  if (supabaseClient) {
    try {
      const res = await supabaseClient
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        catalogItems = res.data;
        try {
          localStorage.setItem('five_friends_catalog', JSON.stringify(catalogItems));
        } catch (e) {}
      }
    } catch (err) {}
  }
  renderMacroFilterButtons();
  renderSubcategoriesBar();
  renderCatalog();
  if (typeof window.renderAdminProductsTable === 'function') {
    window.renderAdminProductsTable();
  }
}

export function filterCategoryFromHome(macro) {
  navigate('catalogo');
  // Compatibilidad con botones de Home ('3D', 'Coleccionables', 'Web')
  if (macro === '3D') {
    const c3d = taxonomy.find((c) => c.name.toLowerCase().includes('3d')) || taxonomy[0];
    setMacroFilter(c3d ? c3d.name : 'all');
  } else if (macro === 'Web') {
    const cWeb = taxonomy.find((c) => c.isWebService);
    setMacroFilter(cWeb ? cWeb.name : 'all');
  } else {
    const found = taxonomy.find((c) => c.name.toLowerCase() === macro.toLowerCase());
    setMacroFilter(found ? found.name : 'all');
  }
}

export function renderMacroFilterButtons() {
  const bar = document.getElementById('macro-filters-bar');
  if (!bar) return;

  let html = '<button type="button" onclick="setMacroFilter(\'all\')" class="px-4 py-2.5 rounded-xl text-xs sm:text-sm transition whitespace-nowrap ' +
    (currentMacroFilter === 'all'
      ? 'font-bold bg-zinc-950 text-white shadow-sm'
      : 'font-medium bg-white/80 border border-zinc-200 text-zinc-700 hover:border-zinc-400') +
    '">Todos los Productos</button>';

  taxonomy.forEach((cat) => {
    const isSelected = currentMacroFilter === cat.name;
    html += '<button type="button" onclick="setMacroFilter(\'' + cat.name.replace(/'/g, "\\'") + '\')" class="px-4 py-2.5 rounded-xl text-xs sm:text-sm transition whitespace-nowrap ' +
      (isSelected
        ? 'font-bold bg-zinc-950 text-white shadow-sm'
        : 'font-medium bg-white/80 border border-zinc-200 text-zinc-700 hover:border-zinc-400') +
      '">' + cat.name + '</button>';
  });

  bar.innerHTML = html;
}

export function setMacroFilter(macro) {
  currentMacroFilter = macro;
  currentSubFilter = 'all';
  renderMacroFilterButtons();
  renderSubcategoriesBar();
  renderCatalog();
}

export function setSubcategoryFilter(sub) {
  currentSubFilter = sub;
  renderSubcategoriesBar();
  renderCatalog();
}

export function renderSubcategoriesBar() {
  const bar = document.getElementById('subcategories-bar');
  if (!bar) return;

  const activeParent = taxonomy.find((c) => c.name === currentMacroFilter);
  if (activeParent && activeParent.isWebService) {
    bar.classList.add('hidden');
    return;
  }

  const availableSubs = [];

  if (currentMacroFilter === 'all') {
    taxonomy.forEach((cat) => {
      if (!cat.isWebService && Array.isArray(cat.subcategories)) {
        cat.subcategories.forEach((sub) => {
          if (!availableSubs.includes(sub)) availableSubs.push(sub);
        });
      }
    });
  } else if (activeParent && Array.isArray(activeParent.subcategories)) {
    activeParent.subcategories.forEach((sub) => {
      if (!availableSubs.includes(sub)) availableSubs.push(sub);
    });
  }

  // También incluir subcategorías de productos existentes por si alguna no estuviera listada
  catalogItems.forEach((item) => {
    const pObj = getParentCategoryObj(item.category);
    if (item.category && !pObj.isWebService) {
      if (currentMacroFilter === 'all' || pObj.name === currentMacroFilter) {
        if (!availableSubs.includes(item.category)) availableSubs.push(item.category);
      }
    }
  });

  if (availableSubs.length === 0) {
    bar.classList.add('hidden');
    return;
  }

  bar.classList.remove('hidden');
  const labelText = currentMacroFilter === 'all'
    ? 'Todas las ramas'
    : 'Todo en ' + currentMacroFilter;

  let html = '<button type="button" onclick="setSubcategoryFilter(\'all\')" class="px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ' +
    (currentSubFilter === 'all' ? 'bg-zinc-900 text-white shadow-sm' : 'bg-white/70 text-zinc-600 hover:bg-white') + '">' +
    labelText + ' (' + availableSubs.length + ')</button>';

  availableSubs.forEach((sub) => {
    const isSelected = currentSubFilter === sub;
    const count = catalogItems.filter((i) => i.category === sub).length;
    html += '<button type="button" onclick="setSubcategoryFilter(\'' + sub.replace(/'/g, "\\'") + '\')" class="px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition ' +
      (isSelected ? 'bg-zinc-950 text-white font-bold shadow-sm' : 'bg-white/70 text-zinc-700 hover:bg-white') + '">' +
      sub + ' (' + count + ')</button>';
  });

  bar.innerHTML = html;
}

export function filterCatalog() {
  renderCatalog();
}

function renderWebServicesSection(sectionTitle = 'Desarrollo Web & Tiendas Online') {
  const cardsHtml = WEB_PACKAGES.map((pkg) => {
    const isDark = pkg.featured;
    const cardClass = isDark
      ? 'card-obsidian text-white p-7 sm:p-8 rounded-3xl flex flex-col justify-between space-y-6 border border-white/15'
      : 'card-iridescent text-zinc-950 p-7 sm:p-8 rounded-3xl flex flex-col justify-between space-y-6';
    const tagClass = isDark ? 'bg-white/15 text-white' : 'bg-zinc-950 text-white';
    const descClass = isDark ? 'text-zinc-300' : 'text-zinc-600';
    const dividerClass = isDark ? 'border-white/10' : 'border-zinc-200/80';
    const maintBoxClass = isDark
      ? 'bg-white/10 border border-white/15 text-zinc-200'
      : 'bg-zinc-100/90 border border-zinc-200 text-zinc-800';
    const btnClass = isDark
      ? 'bg-white text-zinc-950 hover:bg-zinc-100'
      : 'bg-zinc-950 text-white hover:bg-zinc-800';

    const featuresList = pkg.features.map((f) =>
      '<li class="flex items-start gap-2 text-xs leading-relaxed ' + descClass + '"><span class="font-bold mt-0.5">✓</span><span>' + f + '</span></li>'
    ).join('');

    const waMsg = encodeURIComponent(
      'Hola Five Friends, me interesa cotizar/contratar el servicio de: ' + pkg.title + ' (' + pkg.price + ' MXN + mantenimiento de $200/mes).'
    );

    return '<div class="' + cardClass + '">' +
      '<div class="space-y-4">' +
        '<div class="flex items-center justify-between">' +
          '<span class="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ' + tagClass + '">' + pkg.tag + '</span>' +
          '<span class="text-xs font-mono opacity-60">&lt;/&gt;</span>' +
        '</div>' +
        '<div>' +
          '<h4 class="text-xl font-extrabold leading-snug">' + pkg.title + '</h4>' +
          '<p class="text-xs mt-1.5 leading-relaxed ' + descClass + '">' + pkg.description + '</p>' +
        '</div>' +
        '<div class="pt-2 border-t ' + dividerClass + '">' +
          '<div class="flex items-baseline gap-1.5">' +
            '<span class="text-3xl font-black">' + pkg.price + '</span>' +
            '<span class="text-xs opacity-70 font-semibold">MXN (Pago único)</span>' +
          '</div>' +
          '<div class="mt-2.5 px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between ' + maintBoxClass + '">' +
            '<span>Mantenimiento & Cambios:</span>' +
            '<span class="font-extrabold">' + pkg.maintenance + '</span>' +
          '</div>' +
        '</div>' +
        '<ul class="space-y-2 pt-2 border-t ' + dividerClass + '">' + featuresList + '</ul>' +
      '</div>' +
      '<div class="pt-2">' +
        '<a href="https://wa.me/525639511105?text=' + waMsg + '" target="_blank" rel="noopener noreferrer" class="w-full py-3.5 rounded-2xl text-xs font-bold transition shadow-md flex items-center justify-center gap-2 ' + btnClass + '">' +
          '<span>Solicitar este Plan por WhatsApp &rarr;</span>' +
        '</a>' +
      '</div>' +
    '</div>';
  }).join('');

  return '<div class="space-y-6">' +
    '<div class="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-3 border-b border-zinc-200/80">' +
      '<div class="flex items-center gap-3">' +
        '<span class="w-9 h-9 rounded-xl bg-zinc-950 text-white flex items-center justify-center text-xs font-bold">&lt;/&gt;</span>' +
        '<div>' +
          '<h3 class="font-extrabold text-xl text-zinc-950 leading-tight">' + sectionTitle + '</h3>' +
          '<p class="text-xs text-zinc-500">Servicios digitales a medida • Opción de mantenimiento mensual de $200 MXN con cambios ilimitados en el mes.</p>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div class="grid grid-cols-1 md:grid-cols-3 gap-6">' + cardsHtml + '</div>' +
  '</div>';
}

export function renderCatalog() {
  const container = document.getElementById('catalog-container');
  if (!container) return;

  const activeParent = taxonomy.find((c) => c.name === currentMacroFilter);
  if (activeParent && activeParent.isWebService) {
    container.innerHTML = renderWebServicesSection(activeParent.name);
    return;
  }

  const searchQuery = (document.getElementById('cat-search')?.value || '').toLowerCase();

  const physicalItems = catalogItems.filter((item) => {
    const pObj = getParentCategoryObj(item.category);
    return !pObj.isWebService;
  });

  const filtered = physicalItems.filter((item) => {
    const parentName = getMacroCategory(item.category);
    const matchesMacro = (currentMacroFilter === 'all') || (currentMacroFilter === parentName);
    const matchesSub = (currentSubFilter === 'all' || item.category === currentSubFilter);
    const matchesSearch =
      item.title.toLowerCase().indexOf(searchQuery) !== -1 ||
      (item.description && item.description.toLowerCase().indexOf(searchQuery) !== -1) ||
      item.category.toLowerCase().indexOf(searchQuery) !== -1 ||
      parentName.toLowerCase().indexOf(searchQuery) !== -1;
    return matchesMacro && matchesSub && matchesSearch;
  });

  let html = '';

  if (filtered.length === 0 && currentMacroFilter !== 'all') {
    container.innerHTML = '<div class="text-center py-16 card-iridescent rounded-3xl p-8"><h4 class="text-base font-bold text-zinc-800">No hay productos en esta categoría o subcategoría aún</h4></div>';
    return;
  }

  const distinctCats = [];
  filtered.forEach((i) => {
    if (!distinctCats.includes(i.category)) distinctCats.push(i.category);
  });

  distinctCats.forEach((cat) => {
    const group = filtered.filter((i) => i.category === cat);
    if (group.length === 0) return;

    const parentObj = getParentCategoryObj(cat);
    const icon = parentObj.icon || '3D';

    html += '<div class="space-y-5"><div class="flex items-center justify-between pb-2.5 border-b border-zinc-200/80"><div class="flex items-center gap-3"><span class="w-8 h-8 rounded-xl bg-zinc-950 text-white flex items-center justify-center text-xs font-bold">' + icon + '</span><div><h3 class="font-extrabold text-lg text-zinc-950 leading-tight">' + cat + '</h3><span class="text-xs text-zinc-500">' + parentObj.name + ' • ' + group.length + ' disponibles</span></div></div></div><div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">';

    group.forEach((p) => {
      const img = p.image_url
        ? '<div class="w-full h-48 rounded-2xl overflow-hidden bg-zinc-100 mb-3.5 border border-zinc-200/60"><img src="' + p.image_url + '" class="w-full h-full object-cover"></div>'
        : '<div class="w-full h-28 rounded-2xl bg-zinc-100/80 mb-3.5 border border-dashed border-zinc-300 flex items-center justify-center text-zinc-400 text-xs font-bold">' + icon + '</div>';
      const badgeColor = parentObj.name === 'Coleccionables' ? 'bg-zinc-900 text-white' : 'bg-zinc-200/80 text-zinc-800';

      html += '<div class="card-iridescent p-5 rounded-3xl flex flex-col justify-between space-y-4"><div>' + img + '<span class="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full inline-block mb-2 ' + badgeColor + '">' + (p.badge || p.category) + '</span><h4 class="font-bold text-base text-zinc-950 leading-snug">' + p.title + '</h4><p class="text-xs text-zinc-600 leading-relaxed mt-1 line-clamp-2">' + (p.description || '') + '</p></div><div class="flex justify-between items-center pt-3 border-t border-zinc-200/70"><div><span class="text-[10px] text-zinc-400 uppercase font-semibold block">Precio</span><span class="font-extrabold text-lg text-zinc-950">$' + Number(p.price).toLocaleString() + ' MXN</span></div><button type="button" onclick="addToCart(\'' + p.id + '\')" class="px-4 py-2.5 bg-zinc-950 text-white text-xs font-semibold rounded-xl hover:bg-zinc-800 transition shadow-sm flex items-center gap-1.5"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg><span>Agregar</span></button></div></div>';
    });

    html += '</div></div>';
  });

  const webCat = taxonomy.find((c) => c.isWebService);
  if (webCat && currentMacroFilter === 'all' && (searchQuery === '' || 'desarrollo web landing tienda mantenimiento'.indexOf(searchQuery) !== -1)) {
    html += '<div class="pt-6">' + renderWebServicesSection(webCat.name) + '</div>';
  }

  container.innerHTML = html;
}
