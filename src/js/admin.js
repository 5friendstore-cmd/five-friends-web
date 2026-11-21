import { ORDER_STAGES } from './config.js';
import { supabaseClient } from './supabase.js';
import { getCatalogItems, saveCatalog, fetchCatalogFromDatabase } from './catalog.js';
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
    msg += "\n\n(Aviso: Se guardó en la memoria local; asegúrate de ejecutar el script SQL en Supabase para que se sincronice en la nube).";
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
          category: cols[3] || 'Impresión 3D',
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
  document.getElementById('adm-p-id').value = prod.id;
  document.getElementById('adm-p-title').value = prod.title;
  document.getElementById('adm-p-price').value = prod.price;
  document.getElementById('adm-p-cost').value = prod.cost || 0;
  document.getElementById('adm-p-category').value = prod.category;
  document.getElementById('adm-p-image-url').value = prod.image_url || '';
  document.getElementById('adm-p-desc').value = prod.description || '';
  updateImagePreview(prod.image_url || '');
  document.getElementById('product-form').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

export function cancelProductEdit() {
  document.getElementById('adm-p-id').value = '';
  document.getElementById('product-form').reset();
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
  await renderAdminOrdersTable();
  await loadAdminData();
  await fetchCatalogFromDatabase();
  alert("✓ Panel sincronizado con la base de datos en tiempo real.");
}
