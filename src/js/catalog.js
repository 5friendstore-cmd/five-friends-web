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
      b.className = 'px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition whitespace-nowrap bg-white border border-zinc-200 text-zinc-700 hover:border-zinc-400';
    }
  });

  const active = document.getElementById(mapping[macro]);
  if (active) {
    active.className = 'px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap bg-zinc-950 text-white shadow-sm';
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
    (currentSubFilter === 'all' ? 'bg-zinc-800 text-white shadow-sm' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200') + '">' +
    labelText + ' (' + availableSubs.length + ')</button>';

  availableSubs.forEach((sub) => {
    const isSelected = currentSubFilter === sub;
    const count = catalogItems.filter((i) => i.category === sub).length;
    html += '<button type="button" onclick="setSubcategoryFilter(\'' + sub + '\')" class="px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition ' +
      (isSelected ? 'bg-zinc-950 text-white font-bold shadow-sm' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200') + '">' +
      sub + ' (' + count + ')</button>';
  });

  bar.innerHTML = html;
}

export function filterCatalog() {
  renderCatalog();
}

export function renderCatalog() {
  const container = document.getElementById('catalog-container');
  if (!container) return;

  const searchQuery = (document.getElementById('cat-search')?.value || '').toLowerCase();
  const filtered = catalogItems.filter((item) => {
    const itemMacro = getMacroCategory(item.category);
    const matchesMacro = (currentMacroFilter === 'all') || (currentMacroFilter === itemMacro);
    const matchesSub = (currentSubFilter === 'all' || item.category === currentSubFilter);
    const matchesSearch =
      item.title.toLowerCase().indexOf(searchQuery) !== -1 ||
      (item.description && item.description.toLowerCase().indexOf(searchQuery) !== -1) ||
      item.category.toLowerCase().indexOf(searchQuery) !== -1;
    return matchesMacro && matchesSub && matchesSearch;
  });

  if (filtered.length === 0) {
    container.innerHTML = '<div class="text-center py-16 bg-white border border-zinc-200 rounded-2xl p-8"><h4 class="text-base font-bold text-zinc-800">No hay productos en esta sección</h4></div>';
    return;
  }

  const distinctCats = [];
  filtered.forEach((i) => {
    if (!distinctCats.includes(i.category)) distinctCats.push(i.category);
  });

  let html = '';

  distinctCats.forEach((cat) => {
    const group = filtered.filter((i) => i.category === cat);
    if (group.length === 0) return;

    const macro = getMacroCategory(cat);
    const icon = macro === '3D' ? '3D' : (macro === 'Coleccionables' ? '★' : '</>');

    html += '<div class="space-y-4"><div class="flex items-center justify-between pb-2 border-b border-zinc-200"><div class="flex items-center gap-2.5"><span class="w-7 h-7 rounded-lg bg-zinc-950 text-white flex items-center justify-center text-xs font-bold">' + icon + '</span><div><h3 class="font-extrabold text-lg text-zinc-950 leading-tight">' + cat + '</h3><span class="text-xs text-zinc-500">(' + group.length + ')</span></div></div></div><div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">';

    group.forEach((p) => {
      const isWeb = p.category === 'Desarrollo Web';
      const img = p.image_url
        ? '<div class="w-full h-44 rounded-xl overflow-hidden bg-zinc-100 mb-3 border border-zinc-100"><img src="' + p.image_url + '" class="w-full h-full object-cover"></div>'
        : '<div class="w-full h-24 rounded-xl bg-zinc-100/70 mb-3 border border-dashed border-zinc-200 flex items-center justify-center text-zinc-400 text-xs font-semibold">' + (isWeb ? '</>' : '3D') + '</div>';
      const badgeColor = isWeb ? 'bg-emerald-50 text-emerald-700' : (macro === 'Coleccionables' ? 'bg-amber-50 text-amber-700' : 'bg-zinc-100 text-zinc-600');

      const actionBtn = isWeb
        ? '<a href="https://wa.me/525639511105?text=Hola%20Five%20Friends,%20me%20interesa%20el%20servicio:%20' + encodeURIComponent(p.title) + '" target="_blank" rel="noopener noreferrer" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition shadow-sm flex items-center gap-1.5"><span>Agendar Asesoría</span></a>'
        : '<button type="button" onclick="addToCart(\'' + p.id + '\')" class="px-4 py-2 bg-zinc-950 text-white text-xs font-semibold rounded-xl hover:bg-zinc-800 transition shadow-sm flex items-center gap-1.5"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg><span>Agregar</span></button>';

      html += '<div class="border border-zinc-200 bg-white p-5 rounded-2xl flex flex-col justify-between space-y-3 shadow-sm hover:border-zinc-400 transition"><div>' + img + '<span class="text-[10px] uppercase font-bold px-2 py-0.5 rounded inline-block mb-1.5 ' + badgeColor + '">' + (p.badge || p.category) + '</span><h4 class="font-bold text-base text-zinc-950 leading-snug">' + p.title + '</h4><p class="text-xs text-zinc-500 leading-relaxed mt-1 line-clamp-2">' + (p.description || '') + '</p></div><div class="flex justify-between items-center pt-3 border-t border-zinc-100"><div><span class="text-[10px] text-zinc-400 uppercase font-semibold block">Precio</span><span class="font-extrabold text-base sm:text-lg text-zinc-950">$' + Number(p.price).toLocaleString() + ' MXN</span></div>' + actionBtn + '</div></div>';
    });

    html += '</div></div>';
  });

  container.innerHTML = html;
}
