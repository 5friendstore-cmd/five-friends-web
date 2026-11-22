import { ORDER_STAGES } from './config.js';
import { supabaseClient } from './supabase.js';
import {
  getCatalogItems,
  saveCatalog,
  fetchCatalogFromDatabase,
  getTaxonomy,
  saveTaxonomy,
  loadTaxonomyFromDB
} from './catalog.js';
import { toggleManualOrderModal } from './navigation.js';
import { renderUserOrdersTable } from './auth.js';

export async function renderAdminOrdersTable() {
  const table = document.getElementById('admin-orders-table');
  if (!table) return;

  const ordersMap = {};

  try {
    const localOrders = JSON.parse(localStorage.getItem('five_friends_orders')) || [];
    localOrders.forEach((o) => {
      if (o && o.id) ordersMap[o.id] = o;
    });
  } catch (e) {}

  if (supabaseClient) {
    try {
      const res = await supabaseClient.from('orders').select('*').order('created_at', { ascending: false });
      if (res?.data && Array.isArray(res.data)) {
        res.data.forEach((o) => {
          if (o && o.id) ordersMap[o.id] = o;
        });
      }
    } catch (e) {}
  }

  const allOrders = Object.values(ordersMap).sort(
    (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
  );

  try {
    localStorage.setItem('five_friends_orders', JSON.stringify(allOrders));
  } catch (e) {}

  const hideDelivered = document.getElementById('adm-filter-hide-delivered')?.checked;
  const filteredOrders = hideDelivered
    ? allOrders.filter((o) => o.status !== 'Entregado')
    : allOrders;

  if (filteredOrders.length === 0) {
    table.innerHTML = '<tr><td colspan="6" class="py-8 text-center text-zinc-400">No hay pedidos pendientes de entrega.</td></tr>';
    return;
  }

  table.innerHTML = filteredOrders.map((o) => {
    const optionsHtml = ORDER_STAGES.map((st) => {
      const sel = o.status === st ? 'selected' : '';
      return '<option value="' + st + '" ' + sel + '>' + st + '</option>';
    }).join('');

    const isWeb = o.shipping_method && o.shipping_method.indexOf('Web') !== -1;

    return '<tr class="hover:bg-zinc-50 transition"><td class="py-3"><span class="font-bold text-zinc-900 block font-mono">' + o.id + '</span><span class="text-[10px] text-zinc-400">' + (o.created_at ? new Date(o.created_at).toLocaleDateString('es-MX') : '') + '</span></td>' +
           '<td class="py-3"><div class="font-bold text-zinc-900">' + (o.customer_name || 'Cliente') + '</div><div class="text-[11px] text-zinc-500">' + (o.customer_phone || '') + ' | ' + (o.customer_email || '') + '</div></td>' +
           '<td class="py-3 text-xs text-zinc-600 max-w-xs">' + (isWeb ? '<span class="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[10px] block w-fit mb-1">Servicio Web</span>' : '') + (o.shipping_address || 'Punto de Entrega') + '</td>' +
           '<td class="py-3 text-xs text-zinc-600 whitespace-pre-line">' + (o.items || '') + '</td>' +
           '<td class="py-3 font-bold text-zinc-950">$' + Number(o.total || 0).toLocaleString() + '</td>' +
           '<td class="py-3"><select onchange="updateOrderStatus(\'' + o.id + '\', this.value)" class="px-2.5 py-1.5 bg-white border-2 border-indigo-200 text-indigo-900 font-bold rounded-xl text-xs outline-none focus:border-indigo-600 shadow-sm">' + optionsHtml + '</select></td></tr>';
  }).join('');
}

export async function updateOrderStatus(orderId, newStatus) {
  if (supabaseClient) {
    try {
      await supabaseClient.from('orders').update({ status: newStatus }).eq('id', orderId);
    } catch (err) {}
  }

  let allOrders = [];
  try {
    allOrders = JSON.parse(localStorage.getItem('five_friends_orders')) || [];
  } catch (e) {}

  const idx = allOrders.findIndex((o) => o.id === orderId);
  if (idx !== -1) {
    allOrders[idx].status = newStatus;
    localStorage.setItem('five_friends_orders', JSON.stringify(allOrders));
  }

  renderAdminOrdersTable();
  renderUserOrdersTable();
}

export async function promptManualOrderLookup() {
  let folio = prompt("Ingresa el Folio de la orden a consultar (Ej. FF-123456 o FF-MANUAL-123456):");
  if (!folio) return;
  folio = folio.trim();

  let allOrders = [];
  try {
    allOrders = JSON.parse(localStorage.getItem('five_friends_orders')) || [];
  } catch (e) {}

  const existing = allOrders.find((o) => o.id.toLowerCase() === folio.toLowerCase());
  if (existing) {
    alert("✓ Pedido encontrado en memoria: " + existing.customer_name + " - " + existing.items);
    renderAdminOrdersTable();
    return;
  }

  if (supabaseClient) {
    try {
      const res = await supabaseClient.from('orders').select('*').eq('id', folio);
      if (res?.data && res.data.length > 0) {
        const order = res.data[0];
        allOrders.unshift(order);
        localStorage.setItem('five_friends_orders', JSON.stringify(allOrders));
        renderAdminOrdersTable();
        alert("✓ Pedido descargado de Supabase: " + order.customer_name + " - " + order.items);
        return;
      }
    } catch (e) {}
  }

  alert("No se encontró ningún pedido con el folio: " + folio);
}

export async function populateManualClientDropdown() {
  const select = document.getElementById('man-client-select');
  if (!select) return;

  select.innerHTML = '<option value="">Cargando clientes de la base de datos...</option>';

  let list = [];
  if (supabaseClient) {
    try {
      const res = await supabaseClient.from('profiles').select('*').order('full_name', { ascending: true });
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        list = res.data;
      }
    } catch (err) {}
  }

  if (list.length === 0) {
    try {
      list = JSON.parse(localStorage.getItem('five_friends_clients_cache')) || [];
    } catch (e) {}
  }

  const validClients = list.filter(
    (c) => c.email && c.email.toLowerCase() !== '5friendstore@gmail.com'
  );

  if (validClients.length === 0) {
    select.innerHTML = '<option value="">-- No hay clientes registrados (Ingresa los datos abajo) --</option>';
    return;
  }

  select.innerHTML =
    '<option value="">-- Seleccionar cliente registrado (' + validClients.length + ') --</option>' +
    validClients.map((c) => {
      const name = c.full_name || c.name || 'Cliente';
      const phone = c.phone || '';
      return '<option value="' + c.email + '" data-name="' + name + '" data-phone="' + phone + '">' + name + ' — ' + c.email + '</option>';
    }).join('');
}

export function handleSelectExistingClient(selectedEmail) {
  if (!selectedEmail) return;
  const select = document.getElementById('man-client-select');
  const option = select.options[select.selectedIndex];
  if (option) {
    document.getElementById('man-client-name').value = option.getAttribute('data-name') || '';
    document.getElementById('man-client-email').value = selectedEmail;
    document.getElementById('man-client-phone').value = option.getAttribute('data-phone') || '';
  }
}

export async function handleCreateManualOrder(e) {
  e.preventDefault();
  const name = document.getElementById('man-client-name').value.trim();
  const email = document.getElementById('man-client-email').value.trim().toLowerCase();
  const phone = document.getElementById('man-client-phone').value.trim();
  const items = document.getElementById('man-order-items').value.trim();
  const total = parseFloat(document.getElementById('man-order-total').value) || 0;
  const status = document.getElementById('man-order-status').value;
  const delivery = document.getElementById('man-order-delivery').value;

  if (!name || !email || !items || total <= 0) {
    alert("Completa el nombre, correo, descripción de productos y total válido.");
    return;
  }

  const btn = document.getElementById('btn-save-manual-order');
  if (btn) {
    btn.disabled = true;
    btn.innerText = "Guardando en Supabase...";
  }

  const manualId = 'FF-MANUAL-' + Math.floor(100000 + Math.random() * 900000);
  const isWeb = delivery.indexOf('Web') !== -1;

  const manualOrder = {
    id: manualId,
    user_id: 'usr_manual',
    customer_name: name,
    customer_email: email,
    customer_phone: phone || '-',
    shipping_address: delivery,
    shipping_method: isWeb ? 'Servicio Digital Web' : delivery,
    items: items,
    subtotal: total,
    shipping_cost: 0,
    total: total,
    status: status,
    checkout_url: '',
    created_at: new Date().toISOString()
  };

  let dbSuccess = false;
  if (supabaseClient) {
    try {
      const dbRes = await supabaseClient.from('orders').upsert([manualOrder]);
      if (!dbRes?.error) dbSuccess = true;
    } catch (err) {}
  }

  let allOrders = [];
  try {
    allOrders = JSON.parse(localStorage.getItem('five_friends_orders')) || [];
  } catch (e) {}
  allOrders.unshift(manualOrder);
  localStorage.setItem('five_friends_orders', JSON.stringify(allOrders));

  if (btn) {
    btn.disabled = false;
    btn.innerText = "Crear y Asignar Orden";
  }

  let msg = "✓ Folio " + manualId + " generado y asignado con éxito a " + name + " (" + email + ").";
  if (!dbSuccess && supabaseClient) {
    msg += "\n\n(Aviso: Se guardó en la memoria local; verifica tu conexión a Supabase).";
  } else {
    msg += "\n\nEl cliente ya puede verlo en su perfil en tiempo real con su estatus: " + status;
  }

  alert(msg);
  toggleManualOrderModal();
  await renderAdminOrdersTable();
}

export async function loadAdminData() {
  let clients = [];
  if (supabaseClient) {
    try {
      const res = await supabaseClient.from('profiles').select('*').order('created_at', { ascending: false });
      if (res?.data) clients = res.data;
    } catch (e) {}
  }
  if (clients.length === 0) {
    try {
      clients = JSON.parse(localStorage.getItem('five_friends_clients_cache')) || [];
    } catch (e) {}
  }

  clients = clients.filter((c) => c.email && c.email.toLowerCase() !== '5friendstore@gmail.com');
  document.getElementById('stat-client-count').innerText = clients.length;

  let orders = [];
  if (supabaseClient) {
    try {
      const oRes = await supabaseClient.from('orders').select('*');
      if (oRes?.data) orders = oRes.data;
    } catch (e) {}
  }
  if (orders.length === 0) {
    try {
      orders = JSON.parse(localStorage.getItem('five_friends_orders')) || [];
    } catch (e) {}
  }

  const totalSales = orders.reduce((acc, o) => acc + Number(o.total || 0), 0);
  const totalCost = Math.round(totalSales * 0.35);

  document.getElementById('stat-sales').innerText = '$' + totalSales.toLocaleString() + ' MXN';
  document.getElementById('stat-costs').innerText = '$' + totalCost.toLocaleString() + ' MXN';
  document.getElementById('stat-profit').innerText = '$' + (totalSales - totalCost).toLocaleString() + ' MXN';

  const table = document.getElementById('admin-client-table');
  if (table) {
    if (clients.length === 0) {
      table.innerHTML = '<tr><td colspan="5" class="py-6 text-center text-zinc-400">No hay clientes registrados aún.</td></tr>';
    } else {
      table.innerHTML = clients.map((c) =>
        '<tr class="hover:bg-zinc-50"><td class="py-2.5 font-bold text-zinc-900">' + (c.full_name || c.name || 'Sin nombre') + '</td><td class="py-2.5 text-zinc-600">' + (c.phone || '-') + '</td><td class="py-2.5 text-zinc-600">' + (c.email || '-') + '</td><td class="py-2.5 text-zinc-500">' + (c.birthday || '-') + '</td><td class="py-2.5 font-bold text-zinc-950">$' + Number(c.total_spent || 0).toLocaleString() + ' MXN</td></tr>'
      ).join('');
    }
  }
}

export function handleAdminValidateCoupon() {
  const code = document.getElementById('admin-coupon-code').value.trim();
  const res = document.getElementById('admin-coupon-result');
  if (code.toUpperCase().indexOf('FF10') !== -1) {
    res.className = 'text-xs font-semibold text-emerald-600';
    res.innerText = '✓ Cupón verificado: 10% de descuento aplicable.';
  } else {
    res.className = 'text-xs font-semibold text-rose-600';
    res.innerText = '✕ Código de cupón inválido o expirado.';
  }
}

// =========================================================
// GESTOR MAESTRO DE CATEGORÍAS Y SUBCATEGORÍAS VINCULADAS
// =========================================================

export function populateProductCategorySelect() {
  const select = document.getElementById('adm-p-category');
  if (!select) return;

  const currentVal = select.value;
  const tax = getTaxonomy();

  select.innerHTML = tax.map((cat) => {
    const subs = Array.isArray(cat.subcategories) && cat.subcategories.length > 0
      ? cat.subcategories
      : [cat.name];
    const options = subs.map((s) => '<option value="' + s + '">' + s + '</option>').join('');
    return '<optgroup label="Categoría: ' + cat.name + '">' + options + '</optgroup>';
  }).join('');

  if (currentVal) {
    const exists = Array.from(select.options).some((opt) => opt.value === currentVal);
    if (exists) select.value = currentVal;
  }
}

export function renderAdminTaxonomyManager() {
  const container = document.getElementById('admin-taxonomy-tree');
  const parentSelect = document.getElementById('new-subcat-parent');
  if (!container) return;

  const tax = getTaxonomy();
  const products = getCatalogItems();

  if (parentSelect) {
    const prev = parentSelect.value;
    parentSelect.innerHTML = tax.map((c) => '<option value="' + c.id + '">' + c.name + '</option>').join('');
    if (prev && tax.some((c) => c.id === prev)) parentSelect.value = prev;
  }

  container.innerHTML = tax.map((cat) => {
    const subs = Array.isArray(cat.subcategories) ? cat.subcategories : [];
    const subsHtml = subs.length === 0
      ? '<span class="text-[11px] text-zinc-400 italic">Sin subcategorías vinculadas aún.</span>'
      : subs.map((sub, sIdx) => {
          const count = products.filter((p) => p.category === sub).length;
          return '<div class="inline-flex items-center gap-1.5 bg-zinc-100 border border-zinc-200 px-3 py-1.5 rounded-xl text-xs">' +
            '<span class="font-semibold text-zinc-800">' + sub + '</span>' +
            '<span class="text-[10px] text-zinc-400">(' + count + ')</span>' +
            '<button type="button" onclick="handleRenameSubcategory(\'' + cat.id + '\', ' + sIdx + ')" class="text-zinc-500 hover:text-zinc-950 ml-1" title="Renombrar subcategoría">✏️</button>' +
            '<button type="button" onclick="handleDeleteSubcategory(\'' + cat.id + '\', ' + sIdx + ')" class="text-rose-500 hover:text-rose-700 font-bold" title="Eliminar subcategoría">&times;</button>' +
          '</div>';
        }).join('');

    return '<div class="border border-zinc-200 rounded-2xl p-4 bg-zinc-50/70 space-y-3">' +
      '<div class="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200/80 pb-2.5">' +
        '<div class="flex items-center gap-2">' +
          '<span class="w-7 h-7 rounded-lg bg-zinc-950 text-white flex items-center justify-center text-[11px] font-bold">' + (cat.icon || '3D') + '</span>' +
          '<span class="font-extrabold text-sm text-zinc-950">' + cat.name + '</span>' +
          (cat.isWebService ? '<span class="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-full">Servicios Digitales</span>' : '') +
        '</div>' +
        '<div class="flex items-center gap-1.5">' +
          '<button type="button" onclick="handleRenameCategory(\'' + cat.id + '\')" class="px-2.5 py-1 text-[11px] font-semibold bg-white border border-zinc-300 rounded-lg hover:bg-zinc-100">Renombrar</button>' +
          '<button type="button" onclick="handleDeleteCategory(\'' + cat.id + '\')" class="px-2.5 py-1 text-[11px] font-semibold bg-rose-50 text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-100">Borrar</button>' +
        '</div>' +
      '</div>' +
      '<div class="flex flex-wrap gap-2">' + subsHtml + '</div>' +
    '</div>';
  }).join('');
}

export async function handleCreateCategory(e) {
  e.preventDefault();
  const nameInp = document.getElementById('new-cat-name');
  const iconInp = document.getElementById('new-cat-icon');
  const name = nameInp.value.trim();
  const icon = (iconInp?.value.trim() || '★').slice(0, 4);

  if (!name) return;

  const tax = JSON.parse(JSON.stringify(getTaxonomy()));
  if (tax.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
    alert("Ya existe una categoría principal con ese nombre.");
    return;
  }

  tax.push({
    id: 'cat_' + Date.now(),
    name: name,
    icon: icon,
    isWebService: false,
    subcategories: [name + ' (General)']
  });

  await saveTaxonomy(tax);
  nameInp.value = '';
  if (iconInp) iconInp.value = '';
  alert('✓ Categoría "' + name + '" creada y sincronizada.');
}

export async function handleRenameCategory(catId) {
  const tax = JSON.parse(JSON.stringify(getTaxonomy()));
  const cat = tax.find((c) => c.id === catId);
  if (!cat) return;

  const newName = prompt("Nuevo nombre para la categoría principal:", cat.name);
  if (!newName || !newName.trim() || newName.trim() === cat.name) return;

  const cleanName = newName.trim();
  const oldName = cat.name;
  cat.name = cleanName;

  // Si tenía una subcategoría con el mismo nombre exacto, también se actualiza
  if (Array.isArray(cat.subcategories)) {
    cat.subcategories = cat.subcategories.map((s) => (s === oldName ? cleanName : s));
  }

  await saveTaxonomy(tax);
  await renameCategoryOnProducts(oldName, cleanName);
  alert('✓ Categoría renombrada a "' + cleanName + '".');
}

export async function handleDeleteCategory(catId) {
  const tax = JSON.parse(JSON.stringify(getTaxonomy()));
  if (tax.length <= 1) {
    alert("Debe existir al menos una categoría principal en el catálogo.");
    return;
  }

  const cat = tax.find((c) => c.id === catId);
  if (!cat) return;

  if (!confirm('¿Eliminar la categoría "' + cat.name + '" y todas sus subcategorías? Los productos vinculados se moverán a la primera categoría disponible.')) {
    return;
  }

  const remaining = tax.filter((c) => c.id !== catId);
  const fallbackSub = remaining[0]?.subcategories?.[0] || remaining[0]?.name || 'Impresión 3D (General)';

  const affectedSubs = [cat.name, ...(cat.subcategories || [])];
  for (const oldSub of affectedSubs) {
    await renameCategoryOnProducts(oldSub, fallbackSub);
  }

  await saveTaxonomy(remaining);
  alert('✓ Categoría eliminada.');
}

export async function handleCreateSubcategory(e) {
  e.preventDefault();
  const parentId = document.getElementById('new-subcat-parent').value;
  const subInp = document.getElementById('new-subcat-name');
  const subName = subInp.value.trim();

  if (!parentId || !subName) return;

  const tax = JSON.parse(JSON.stringify(getTaxonomy()));
  const parent = tax.find((c) => c.id === parentId);
  if (!parent) return;

  if (!Array.isArray(parent.subcategories)) parent.subcategories = [];

  if (parent.subcategories.some((s) => s.toLowerCase() === subName.toLowerCase())) {
    alert('Esa subcategoría ya existe dentro de "' + parent.name + '".');
    return;
  }

  parent.subcategories.push(subName);
  await saveTaxonomy(tax);
  subInp.value = '';
  alert('✓ Subcategoría "' + subName + '" vinculada a "' + parent.name + '".');
}

export async function handleRenameSubcategory(catId, subIndex) {
  const tax = JSON.parse(JSON.stringify(getTaxonomy()));
  const parent = tax.find((c) => c.id === catId);
  if (!parent || !parent.subcategories || !parent.subcategories[subIndex]) return;

  const oldSub = parent.subcategories[subIndex];
  const newSub = prompt('Nuevo nombre para la subcategoría (vinculada a ' + parent.name + '):', oldSub);
  if (!newSub || !newSub.trim() || newSub.trim() === oldSub) return;

  const cleanSub = newSub.trim();
  parent.subcategories[subIndex] = cleanSub;

  await saveTaxonomy(tax);
  await renameCategoryOnProducts(oldSub, cleanSub);
  alert('✓ Subcategoría renombrada a "' + cleanSub + '" y productos actualizados.');
}

export async function handleDeleteSubcategory(catId, subIndex) {
  const tax = JSON.parse(JSON.stringify(getTaxonomy()));
  const parent = tax.find((c) => c.id === catId);
  if (!parent || !parent.subcategories || !parent.subcategories[subIndex]) return;

  const targetSub = parent.subcategories[subIndex];
  if (!confirm('¿Eliminar la subcategoría "' + targetSub + '"?')) return;

  parent.subcategories.splice(subIndex, 1);
  const fallbackSub = parent.subcategories[0] || parent.name;

  await renameCategoryOnProducts(targetSub, fallbackSub);
  await saveTaxonomy(tax);
  alert('✓ Subcategoría eliminada.');
}

async function renameCategoryOnProducts(oldCatName, newCatName) {
  const items = [...getCatalogItems()];
  let changed = false;

  items.forEach((p) => {
    if (p.category === oldCatName) {
      p.category = newCatName;
      changed = true;
    }
  });

  if (changed) {
    saveCatalog(items);
    if (supabaseClient) {
      try {
        await supabaseClient
          .from('products')
          .update({ category: newCatName })
          .eq('category', oldCatName);
      } catch (e) {}
    }
  }
}

// =========================================================
// GESTIÓN DE PRODUCTOS
// =========================================================

export function toggleShippingFields(category) {
  const box = document.getElementById('shipping-dimensions-box');
  if (box) box.classList.toggle('hidden', category === 'Desarrollo Web');
}

export function updateImagePreview(url) {
  const container = document.getElementById('image-preview-container');
  if (!container) return;
  if (url && (url.startsWith('http') || url.startsWith('data:image'))) {
    container.innerHTML = '<img src="' + url + '" alt="Preview" class="h-12 w-12 object-cover rounded-lg border border-zinc-200 mx-auto shadow-sm">';
  } else {
    container.innerHTML = '<span class="text-[11px] text-zinc-400">Sin vista previa</span>';
  }
}

export function handleImageFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById('adm-p-image-url').value = e.target.result;
    updateImagePreview(e.target.result);
  };
  reader.readAsDataURL(file);
}

export function renderAdminProductsTable() {
  populateProductCategorySelect();
  renderAdminTaxonomyManager();

  const table = document.getElementById('admin-products-table');
  const countLabel = document.getElementById('admin-product-count');
  if (!table) return;

  const items = getCatalogItems();
  if (countLabel) countLabel.innerText = items.length + ' productos';

  table.innerHTML = items.map((p) => {
    const isWeb = p.category === 'Desarrollo Web';
    const thumb = p.image_url
      ? '<img src="' + p.image_url + '" class="w-9 h-9 object-cover rounded-lg border border-zinc-200">'
      : '<div class="w-9 h-9 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center text-[10px] font-bold text-zinc-500">' + (isWeb ? '</>' : '3D') + '</div>';
    return '<tr class="hover:bg-zinc-50 transition"><td class="py-2.5">' + thumb + '</td><td class="py-2.5 font-semibold text-zinc-900">' + p.title + '</td><td class="py-2.5 text-zinc-600 font-medium">' + p.category + '</td><td class="py-2.5 font-bold text-zinc-950">$' + Number(p.price).toLocaleString() + '</td><td class="py-2.5 font-bold text-zinc-500">$' + Number(p.cost || 0).toLocaleString() + '</td><td class="py-2.5 text-right whitespace-nowrap"><button onclick="editProduct(\'' + p.id + '\')" class="px-2.5 py-1.5 text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-lg mr-1">Editar</button><button onclick="deleteProduct(\'' + p.id + '\')" class="px-2.5 py-1.5 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg">Eliminar</button></td></tr>';
  }).join('');
}

export function downloadCSVTemplate() {
  const csvContent = "data:text/csv;charset=utf-8,Titulo,Precio,Costo,Categoria,Descripcion,Imagen\nSeparador Samurai,90,33,Separadores y Accesorios para Libros,Impreso en PLA técnico,https://ejemplo.com/foto1.jpg";
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "plantilla_catalogo_five_friends.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function handleBulkCSVImport(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (e) => {
    const lines = e.target.result.split(/\r\n|\n/);
    let importedCount = 0;
    const newCatalog = [];
    const timestamp = Date.now();
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const cols = line.split(',');
      if (cols.length >= 2) {
        newCatalog.push({
          id: 'prod_mp_' + timestamp + '_' + i,
          title: cols[0],
          price: parseFloat(cols[1]) || 100,
          cost: parseFloat(cols[2]) || 40,
          category: cols[3] || 'Impresión 3D (General)',
          weight: 0.5,
          length: 15,
          width: 15,
          height: 10,
          image_url: cols[5] || '',
          description: cols[4] || ''
        });
        importedCount++;
      }
    }
    if (importedCount > 0) {
      const currentItems = getCatalogItems();
      const updated = newCatalog.concat(currentItems.filter((i) => i.category === 'Desarrollo Web'));
      saveCatalog(updated);
      if (supabaseClient) {
        try {
          await supabaseClient.from('products').upsert(newCatalog);
        } catch (err) {}
      }
      alert('✓ Se importaron ' + importedCount + ' productos.');
    }
  };
  reader.readAsText(file, 'utf-8');
}

export async function handleProductFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('adm-p-id').value;
  const productRecord = {
    id: String(id || ('prod_' + Date.now())),
    title: document.getElementById('adm-p-title').value.trim(),
    price: Number(document.getElementById('adm-p-price').value),
    cost: Number(document.getElementById('adm-p-cost').value),
    category: document.getElementById('adm-p-category').value,
    weight: Number(document.getElementById('adm-p-weight').value || 0.5),
    length: Number(document.getElementById('adm-p-length').value || 15),
    width: Number(document.getElementById('adm-p-width').value || 15),
    height: Number(document.getElementById('adm-p-height').value || 10),
    image_url: document.getElementById('adm-p-image-url').value.trim(),
    description: document.getElementById('adm-p-desc').value.trim()
  };

  const items = [...getCatalogItems()];
  if (id) {
    const idx = items.findIndex((p) => p.id === id);
    if (idx >= 0) items[idx] = productRecord;
  } else {
    items.unshift(productRecord);
  }

  saveCatalog(items);
  if (supabaseClient) {
    try {
      await supabaseClient.from('products').upsert(productRecord);
    } catch (err) {}
  }
  cancelProductEdit();
}

export function editProduct(id) {
  const prod = getCatalogItems().find((p) => p.id === id);
  if (!prod) return;
  populateProductCategorySelect();
  document.getElementById('adm-p-id').value = prod.id;
  document.getElementById('adm-p-title').value = prod.title;
  document.getElementById('adm-p-price').value = prod.price;
  document.getElementById('adm-p-cost').value = prod.cost || 0;

  const catSelect = document.getElementById('adm-p-category');
  if (!Array.from(catSelect.options).some((opt) => opt.value === prod.category)) {
    const opt = document.createElement('option');
    opt.value = prod.category;
    opt.text = prod.category;
    catSelect.add(opt);
  }
  catSelect.value = prod.category;

  document.getElementById('adm-p-image-url').value = prod.image_url || '';
  document.getElementById('adm-p-desc').value = prod.description || '';
  updateImagePreview(prod.image_url || '');
  document.getElementById('product-form').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

export function cancelProductEdit() {
  document.getElementById('adm-p-id').value = '';
  document.getElementById('product-form').reset();
  populateProductCategorySelect();
  updateImagePreview('');
}

export async function deleteProduct(id) {
  if (confirm('¿Eliminar producto?')) {
    saveCatalog(getCatalogItems().filter((p) => p.id !== id));
    if (supabaseClient) {
      try {
        await supabaseClient.from('products').delete().eq('id', String(id));
      } catch (e) {}
    }
  }
}

export async function syncAllAdminData() {
  await loadTaxonomyFromDB();
  await renderAdminOrdersTable();
  await loadAdminData();
  await fetchCatalogFromDatabase();
  alert("✓ Panel, categorías y catálogo sincronizados con la base de datos.");
}
