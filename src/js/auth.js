import { ORDER_STAGES } from './config.js';
import { supabaseClient } from './supabase.js';
import { switchAdminTab } from './navigation.js';
import { updateCartUI } from './cart.js';

export function getSession() {
  try {
    return JSON.parse(localStorage.getItem('five_friends_session'));
  } catch (e) {
    return null;
  }
}

export async function handleRegister(e) {
  e.preventDefault();
  const clientObj = {
    id: 'usr_' + Date.now(),
    name: document.getElementById('reg-name').value.trim(),
    full_name: document.getElementById('reg-name').value.trim(),
    email: document.getElementById('reg-email').value.trim().toLowerCase(),
    phone: document.getElementById('reg-phone').value.trim(),
    birthday: document.getElementById('reg-birthday').value,
    raw_pass: document.getElementById('reg-password').value.trim(),
    total_spent: 0,
    type: 'client'
  };

  if (supabaseClient) {
    try {
      await supabaseClient.from('profiles').upsert(clientObj);
    } catch (err) {}
  }

  let list = [];
  try {
    list = JSON.parse(localStorage.getItem('five_friends_clients_cache')) || [];
  } catch (ex) {}
  list.unshift(clientObj);
  localStorage.setItem('five_friends_clients_cache', JSON.stringify(list));
  localStorage.setItem('five_friends_session', JSON.stringify(clientObj));

  showUserView(clientObj.name, 0);
  updateCartUI();
}

export async function handleLogin(e) {
  e.preventDefault();
  const id = document.getElementById('login-identifier').value.trim().toLowerCase();
  const pass = document.getElementById('login-password').value.trim();
  let found = null;

  if (supabaseClient) {
    try {
      const res = await supabaseClient.from('profiles').select('*');
      if (res?.data) {
        found = res.data.find(
          (c) => ((c.email && c.email.toLowerCase() === id) || c.phone === id) && c.raw_pass === pass
        );
      }
    } catch (err) {}
  }

  if (!found) {
    try {
      const local = JSON.parse(localStorage.getItem('five_friends_clients_cache')) || [];
      found = local.find(
        (c) => ((c.email && c.email.toLowerCase() === id) || c.phone === id) && c.raw_pass === pass
      );
    } catch (ex) {}
  }

  if (found) {
    const sess = {
      id: found.id,
      type: 'client',
      name: found.full_name || found.name,
      email: found.email,
      phone: found.phone,
      total_spent: Number(found.total_spent || 0)
    };
    localStorage.setItem('five_friends_session', JSON.stringify(sess));
    showUserView(sess.name, sess.total_spent);
    updateCartUI();
  } else {
    alert("Credenciales incorrectas.");
  }
}

export function handleAdminLogin(e) {
  e.preventDefault();
  const email = document.getElementById('admin-email').value.trim().toLowerCase();
  const pass = document.getElementById('admin-password').value.trim();

  if (email === '5friendstore@gmail.com' && pass === 'Five.Friends@2025') {
    localStorage.setItem('five_friends_session', JSON.stringify({ type: 'admin', email: '5friendstore@gmail.com' }));
    showAdminView();
  } else {
    alert("Credenciales de administrador incorrectas.");
  }
}

export function showUserView(name, spent) {
  document.getElementById('club-auth').classList.add('hidden');
  document.getElementById('club-admin-portal').classList.add('hidden');
  document.getElementById('club-user-portal').classList.remove('hidden');
  document.getElementById('user-display-name').innerText = 'Cliente: ' + name;
  updateUserProgress(spent || 0);
  renderUserOrdersTable();
}

export function showAdminView() {
  document.getElementById('club-auth').classList.add('hidden');
  document.getElementById('club-user-portal').classList.add('hidden');
  document.getElementById('club-admin-portal').classList.remove('hidden');
  switchAdminTab('orders');
}

export function handleLogout() {
  localStorage.removeItem('five_friends_session');
  document.getElementById('club-user-portal').classList.add('hidden');
  document.getElementById('club-admin-portal').classList.add('hidden');
  document.getElementById('club-auth').classList.remove('hidden');
  updateCartUI();
}

export function updateUserProgress(spent) {
  const pct = Math.min((spent / 1500) * 100, 100);
  document.getElementById('user-progress-bar').style.width = pct + '%';
  document.getElementById('user-progress-text').innerText = '$' + spent + ' / $1,500 MXN';
}

export function sendPasswordToEmail() {
  alert("Contraseña enviada a verificación.");
}

export async function renderUserOrdersTable() {
  const container = document.getElementById('user-orders-timeline-container');
  if (!container) return;

  const sess = getSession();
  if (!sess) return;

  const ordersMap = {};
  const clientEmail = sess.email ? sess.email.trim().toLowerCase() : "";

  if (supabaseClient) {
    try {
      const res = await supabaseClient.from('orders').select('*').order('created_at', { ascending: false });
      if (res?.data && Array.isArray(res.data)) {
        res.data.forEach((o) => {
          if (o && o.id) {
            const oEmail = o.customer_email ? o.customer_email.trim().toLowerCase() : "";
            if (oEmail === clientEmail || o.user_id === sess.id) {
              ordersMap[o.id] = o;
            }
          }
        });
      }
    } catch (e) {}
  }

  try {
    const localOrders = JSON.parse(localStorage.getItem('five_friends_orders')) || [];
    localOrders.forEach((o) => {
      if (o && o.id) {
        const oEmail = o.customer_email ? o.customer_email.trim().toLowerCase() : "";
        if (oEmail === clientEmail || o.user_id === sess.id) {
          if (!ordersMap[o.id]) ordersMap[o.id] = o;
        }
      }
    });
  } catch (e) {}

  const userOrders = Object.values(ordersMap).sort(
    (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
  );

  if (userOrders.length === 0) {
    container.innerHTML = '<div class="text-center py-8 text-zinc-400 text-xs">Aún no tienes pedidos registrados con tu correo (' + sess.email + ').</div>';
    return;
  }

  container.innerHTML = userOrders.map((order) => {
    const currentStage = order.status || "Recibido";
    let stageIndex = ORDER_STAGES.indexOf(currentStage);
    if (stageIndex === -1) stageIndex = 0;

    const progressPct = Math.round((stageIndex / (ORDER_STAGES.length - 1)) * 100);

    const stepsHtml = ORDER_STAGES.map((st, idx) => {
      const isDone = idx <= stageIndex;
      const isCurrent = idx === stageIndex;
      const circleClass = isDone ? 'bg-indigo-600 text-white font-bold ring-4 ring-indigo-100' : 'bg-zinc-200 text-zinc-500';
      return '<div class="flex flex-col items-center flex-1 text-center"><div class="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs ' + circleClass + '">' + (idx + 1) + '</div><span class="text-[9px] sm:text-[10px] mt-1.5 font-semibold ' + (isCurrent ? 'text-indigo-600 font-bold' : 'text-zinc-500') + '">' + st + '</span></div>';
    }).join('');

    const isWeb = order.shipping_method && order.shipping_method.indexOf('Web') !== -1;

    return '<div class="border border-zinc-200 bg-zinc-50 rounded-2xl p-5 space-y-4 shadow-sm">' +
           '  <div class="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-zinc-200 pb-3">' +
           '    <div><span class="text-xs font-bold text-zinc-950 font-mono">Folio: ' + order.id + '</span><span class="text-[11px] text-zinc-500 ml-2">' + new Date(order.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) + '</span>' + (isWeb ? '<span class="ml-2 px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded">Desarrollo Web</span>' : '') + '</div>' +
           '    <div class="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full self-start sm:self-auto">Estatus: ' + currentStage + '</div>' +
           '  </div>' +
           '  <div class="py-2">' +
           '    <div class="w-full bg-zinc-200 rounded-full h-1.5 mb-3 overflow-hidden"><div class="bg-indigo-600 h-1.5 rounded-full transition-all duration-500" style="width: ' + progressPct + '%"></div></div>' +
           '    <div class="flex justify-between items-start gap-1">' + stepsHtml + '</div>' +
           '  </div>' +
           '  <div class="bg-white p-3 rounded-xl border border-zinc-200 text-xs text-zinc-600 space-y-1">' +
           '    <div class="font-semibold text-zinc-800">Servicios/Artículos: <span class="font-normal whitespace-pre-line">' + order.items + '</span></div>' +
           '    <div><strong>Entrega / Modalidad:</strong> ' + order.shipping_address + '</div>' +
           '    <div><strong>Monto Total:</strong> $' + Number(order.total || 0).toLocaleString() + ' MXN</div>' +
           '  </div>' +
           '</div>';
  }).join('');
}
