import { DEFAULT_CATALOG_ITEMS } from './config.js';
import { supabaseClient } from './supabase.js';
import { navigate } from './navigation.js';

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

export function getCatalogItems() {
  return catalogItems;
}

export function getMacroCategory(category) {
  if (category === 'Desarrollo Web') return 'Web';
  if (
    category === 'Coleccionables' ||
    category === 'Dioramas y Bases' ||
    category === 'TCG y Cartas' ||
    category === 'Figuras y Mas'
  ) {
    return 'Coleccionables';
  }
  return '3D';
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
  renderSubcategoriesBar();
  renderCatalog();
  if (typeof window.renderAdminProductsTable === 'function') {
    window.renderAdminProductsTable();
  }
}

export function filterCategoryFromHome(macro) {
  navigate('catalogo');
  setMacroFilter(macro);
}

export function setMacroFilter(macro) {
  currentMacroFilter = macro;
  currentSubFilter = 'all';

  const mapping = {
    'all': 'btn-macro-all',
    '3D': 'btn-macro-3d',
    'Coleccionables': 'btn-macro-col',
    'Web': 'btn-macro-web'
  };

  Object.keys(mapping).forEach((k) => {
    const b = document.getElementById(mapping[k]);
    if (b) {
      b.className = 'px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition whitespace-nowrap bg-white/80 border border-zinc-200 text-zinc-700 hover:border-zinc-400';
    }
  });

  const active = document.getElementById(mapping[macro]);
  if (active) {
    active.className = 'px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap bg-zinc-950 text-white shadow-sm';
  }

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

  if (currentMacroFilter === 'Web') {
    bar.classList.add('hidden');
    return;
  }

  const availableSubs = [];
  catalogItems.forEach((item) => {
    if (item.category && item.category !== 'Desarrollo Web') {
      const itemMacro = getMacroCategory(item.category);
      if (currentMacroFilter === 'all' || currentMacroFilter === itemMacro) {
        if (!availableSubs.includes(item.category)) {
          availableSubs.push(item.category);
        }
      }
    }
  });

  if (availableSubs.length === 0) {
    bar.classList.add('hidden');
    return;
  }

  bar.classList.remove('hidden');
  const labelText = currentMacroFilter === '3D'
    ? 'Todas las ramas 3D'
    : (currentMacroFilter === 'Coleccionables' ? 'Todos los coleccionables' : 'Todas las categorías');

  let html = '<button type="button" onclick="setSubcategoryFilter(\'all\')" class="px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ' +
    (currentSubFilter === 'all' ? 'bg-zinc-900 text-white shadow-sm' : 'bg-white/70 text-zinc-600 hover:bg-white') + '">' +
    labelText + ' (' + availableSubs.length + ')</button>';

  availableSubs.forEach((sub) => {
    const isSelected = currentSubFilter === sub;
    const count = catalogItems.filter((i) => i.category === sub).length;
    html += '<button type="button" onclick="setSubcategoryFilter(\'' + sub + '\')" class="px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition ' +
      (isSelected ? 'bg-zinc-950 text-white font-bold shadow-sm' : 'bg-white/70 text-zinc-700 hover:bg-white') + '">' +
      sub + ' (' + count + ')</button>';
  });

  bar.innerHTML = html;
}

export function filterCatalog() {
  renderCatalog();
}

function renderWebServicesSection() {
  const cardsHtml = WEB_PACKAGES.map((pkg) => {
    const isDark = pkg.featured;
    const cardClass = isDark
      ? 'card-obsidian text-white p-7 sm:p-8 rounded-3xl flex flex-col justify-between space-y-6 border border-white/15'
      : 'card-iridescent text-zinc-950 p-7 sm:p-8 rounded-3xl flex flex-col justify-between space-y-6';
    const tagClass = isDark
      ? 'bg-white/15 text-white'
      : 'bg-zinc-950 text-white';
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
          '<h3 class="font-extrabold text-xl text-zinc-950 leading-tight">Desarrollo Web & Tiendas Online</h3>' +
          '<p class="text-xs text-zinc-500">Servicios digitales a medida • Todos los planes incluyen opción de mantenimiento mensual de $200 MXN con cambios ilimitados en el mes.</p>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div class="grid grid-cols-1 md:grid-cols-3 gap-6">' + cardsHtml + '</div>' +
  '</div>';
}

export function renderCatalog() {
  const container = document.getElementById('catalog-container');
  if (!container) return;

  // Si el usuario selecciona exclusivamente "Desarrollo Web & Tiendas", mostramos la sección dedicada de planes
  if (currentMacroFilter === 'Web') {
    container.innerHTML = renderWebServicesSection();
    return;
  }

  const searchQuery = (document.getElementById('cat-search')?.value || '').toLowerCase();

  // Filtramos solo productos físicos (3D y Coleccionables) para la cuadrícula de tienda
  const physicalItems = catalogItems.filter((item) => item.category !== 'Desarrollo Web');

  const filtered = physicalItems.filter((item) => {
    const itemMacro = getMacroCategory(item.category);
    const matchesMacro = (currentMacroFilter === 'all') || (currentMacroFilter === itemMacro);
    const matchesSub = (currentSubFilter === 'all' || item.category === currentSubFilter);
    const matchesSearch =
      item.title.toLowerCase().indexOf(searchQuery) !== -1 ||
      (item.description && item.description.toLowerCase().indexOf(searchQuery) !== -1) ||
      item.category.toLowerCase().indexOf(searchQuery) !== -1;
    return matchesMacro && matchesSub && matchesSearch;
  });

  let html = '';

  if (filtered.length === 0 && currentMacroFilter !== 'all') {
    container.innerHTML = '<div class="text-center py-16 card-iridescent rounded-3xl p-8"><h4 class="text-base font-bold text-zinc-800">No hay piezas físicas en esta sección</h4></div>';
    return;
  }

  const distinctCats = [];
  filtered.forEach((i) => {
    if (!distinctCats.includes(i.category)) distinctCats.push(i.category);
  });

  distinctCats.forEach((cat) => {
    const group = filtered.filter((i) => i.category === cat);
    if (group.length === 0) return;

    const macro = getMacroCategory(cat);
    const icon = macro === 'Coleccionables' ? '★' : '3D';

    html += '<div class="space-y-5"><div class="flex items-center justify-between pb-2.5 border-b border-zinc-200/80"><div class="flex items-center gap-3"><span class="w-8 h-8 rounded-xl bg-zinc-950 text-white flex items-center justify-center text-xs font-bold">' + icon + '</span><div><h3 class="font-extrabold text-lg text-zinc-950 leading-tight">' + cat + '</h3><span class="text-xs text-zinc-500">' + group.length + ' disponibles</span></div></div></div><div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">';

    group.forEach((p) => {
      const img = p.image_url
        ? '<div class="w-full h-48 rounded-2xl overflow-hidden bg-zinc-100 mb-3.5 border border-zinc-200/60"><img src="' + p.image_url + '" class="w-full h-full object-cover"></div>'
        : '<div class="w-full h-28 rounded-2xl bg-zinc-100/80 mb-3.5 border border-dashed border-zinc-300 flex items-center justify-center text-zinc-400 text-xs font-bold">' + icon + '</div>';
      const badgeColor = macro === 'Coleccionables' ? 'bg-zinc-900 text-white' : 'bg-zinc-200/80 text-zinc-800';

      html += '<div class="card-iridescent p-5 rounded-3xl flex flex-col justify-between space-y-4"><div>' + img + '<span class="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full inline-block mb-2 ' + badgeColor + '">' + (p.badge || p.category) + '</span><h4 class="font-bold text-base text-zinc-950 leading-snug">' + p.title + '</h4><p class="text-xs text-zinc-600 leading-relaxed mt-1 line-clamp-2">' + (p.description || '') + '</p></div><div class="flex justify-between items-center pt-3 border-t border-zinc-200/70"><div><span class="text-[10px] text-zinc-400 uppercase font-semibold block">Precio</span><span class="font-extrabold text-lg text-zinc-950">$' + Number(p.price).toLocaleString() + ' MXN</span></div><button type="button" onclick="addToCart(\'' + p.id + '\')" class="px-4 py-2.5 bg-zinc-950 text-white text-xs font-semibold rounded-xl hover:bg-zinc-800 transition shadow-sm flex items-center gap-1.5"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg><span>Agregar</span></button></div></div>';
    });

    html += '</div></div>';
  });

  // Si estamos en "Todos los Productos" y no hay búsqueda activa (o coincide con "web"), mostramos al final la sección separada de Desarrollo Web
  if (currentMacroFilter === 'all' && (searchQuery === '' || 'desarrollo web landing tienda mantenimiento'.indexOf(searchQuery) !== -1)) {
    html += '<div class="pt-6">' + renderWebServicesSection() + '</div>';
  }

  container.innerHTML = html;
}
