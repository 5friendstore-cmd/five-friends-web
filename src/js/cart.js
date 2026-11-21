import { supabaseClient } from './supabase.js';
import { getCatalogItems } from './catalog.js';
import { toggleCartDrawer } from './navigation.js';
import { getSession } from './auth.js';

let cart = [];
try {
  const savedCart = localStorage.getItem('five_friends_cart');
  if (savedCart) cart = JSON.parse(savedCart);
} catch (e) {}

let selectedShippingRate = null;
let selectedDeliveryType = "pickup";

export function saveCart(newCart) {
  cart = newCart;
  try {
    localStorage.setItem('five_friends_cart', JSON.stringify(cart));
  } catch (e) {}
  updateCartUI();
}

export function pushCustomItemToCart(customProduct) {
  cart.push(customProduct);
  saveCart(cart);
}

export function addToCart(productId) {
  const product = getCatalogItems().find((p) => p.id === productId);
  if (!product) return;

  const isWeb = product.category === 'Desarrollo Web';
  const existing = cart.find((i) => i.id === productId);

  if (existing) {
    existing.quantity = (existing.quantity || 1) + 1;
  } else {
    cart.push({
      id: product.id,
      title: product.title,
      price: parseFloat(product.price),
      category: product.category,
      image_url: product.image_url || '',
      weight: isWeb ? 0 : parseFloat(product.weight || 0.5),
      length: isWeb ? 0 : parseFloat(product.length || 15),
      width: isWeb ? 0 : parseFloat(product.width || 15),
      height: isWeb ? 0 : parseFloat(product.height || 10),
      quantity: 1
    });
  }

  saveCart(cart);
  goToCartStep(1);
  toggleCartDrawer();
}

export function changeQuantity(productId, delta) {
  const idx = cart.findIndex((i) => i.id === productId);
  if (idx < 0) return;

  cart[idx].quantity = (cart[idx].quantity || 1) + delta;
  if (cart[idx].quantity <= 0) cart.splice(idx, 1);
  saveCart(cart);
}

export function removeFromCart(productId) {
  saveCart(cart.filter((i) => i.id !== productId));
}

export function toggleDeliveryMode(type) {
  selectedDeliveryType = type;
  const pickupBox = document.getElementById('pickup-location-box');
  const addressBox = document.getElementById('checkout-address-section');
  const shipCalcBox = document.getElementById('shipping-calculator-box');

  if (type === 'pickup') {
    if (pickupBox) pickupBox.classList.remove('hidden');
    if (addressBox) addressBox.classList.add('hidden');
    if (shipCalcBox) shipCalcBox.classList.add('hidden');
    selectedShippingRate = null;
  } else {
    if (pickupBox) pickupBox.classList.add('hidden');
    if (addressBox) addressBox.classList.remove('hidden');
    if (shipCalcBox) shipCalcBox.classList.remove('hidden');
  }
  updateCartUI();
}

export function updateCartUI() {
  const count = cart.reduce((acc, i) => acc + (i.quantity || 1), 0);
  const subtotal = cart.reduce((acc, i) => acc + (i.price * (i.quantity || 1)), 0);

  const badgeDesk = document.getElementById('cart-badge-desktop');
  const badgeMob = document.getElementById('cart-badge-mobile');
  const countLabel = document.getElementById('cart-item-count');

  if (badgeDesk) {
    badgeDesk.innerText = count;
    badgeDesk.classList.toggle('hidden', count === 0);
  }
  if (badgeMob) {
    badgeMob.innerText = count;
    badgeMob.classList.toggle('hidden', count === 0);
  }
  if (countLabel) countLabel.innerText = count;

  const container = document.getElementById('cart-items-container');
  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = '<div class="text-center py-12 text-zinc-400 space-y-2"><p class="text-sm">Tu carrito está vacío.</p><button onclick="toggleCartDrawer(); navigate(\'catalogo\')" class="text-xs font-semibold underline text-zinc-950">Ver productos disponibles</button></div>';
    selectedShippingRate = null;
    goToCartStep(1);
  } else {
    container.innerHTML = cart.map((item) => {
      const isWeb = item.category === 'Desarrollo Web';
      const img = item.image_url
        ? '<img src="' + item.image_url + '" class="w-12 h-12 rounded-lg object-cover border border-zinc-200">'
        : '<div class="w-12 h-12 bg-zinc-100 rounded-lg flex items-center justify-center font-bold text-xs text-zinc-400">' + (isWeb ? '</>' : '3D') + '</div>';

      return '<div class="flex items-center justify-between gap-3 border-b border-zinc-100 pb-3"><div class="flex items-center gap-3">' + img + '<div><h4 class="text-xs font-bold text-zinc-900 leading-snug line-clamp-1">' + item.title + '</h4><span class="text-xs font-bold text-zinc-950">$' + item.price.toLocaleString() + ' MXN</span>' + (isWeb ? '<span class="text-[10px] text-emerald-600 font-semibold block">Servicio Digital (Sin Envío)</span>' : '') + '</div></div><div class="flex items-center gap-2"><div class="flex items-center border border-zinc-200 rounded-lg"><button onclick="changeQuantity(\'' + item.id + '\', -1)" class="px-2 py-0.5 text-xs text-zinc-600 hover:bg-zinc-100">-</button><span class="px-2 text-xs font-bold">' + item.quantity + '</span><button onclick="changeQuantity(\'' + item.id + '\', 1)" class="px-2 py-0.5 text-xs text-zinc-600 hover:bg-zinc-100">+</button></div><button onclick="removeFromCart(\'' + item.id + '\')" class="text-zinc-400 hover:text-rose-600 text-sm font-bold ml-1">&times;</button></div></div>';
    }).join('');
  }

  const hasPhysical = cart.some((i) => i.category !== 'Desarrollo Web');
  const delivModeBox = document.getElementById('delivery-mode-container');
  if (delivModeBox) delivModeBox.classList.toggle('hidden', !hasPhysical);

  let shippingCost = 0;
  if (hasPhysical && selectedDeliveryType === 'shipping' && selectedShippingRate) {
    shippingCost = selectedShippingRate.cost;
  }

  const total = subtotal + shippingCost;
  const subLabel = document.getElementById('cart-subtotal');
  const shipLabel = document.getElementById('cart-shipping-cost');
  const totLabel = document.getElementById('cart-total');

  if (subLabel) subLabel.innerText = '$' + subtotal.toLocaleString() + ' MXN';
  if (shipLabel) {
    if (!hasPhysical) shipLabel.innerText = '$0 MXN (Servicio Digital)';
    else if (selectedDeliveryType === 'pickup') shipLabel.innerText = '$0 MXN (Punto de Entrega)';
    else if (selectedShippingRate) shipLabel.innerText = '$' + shippingCost.toLocaleString() + ' MXN';
    else shipLabel.innerText = 'Pendiente de cotizar';
  }
  if (totLabel) totLabel.innerText = '$' + total.toLocaleString() + ' MXN';
}

export function goToCartStep(step) {
  const s1 = document.getElementById('cart-step-1');
  const s2 = document.getElementById('cart-step-2');
  const a1 = document.getElementById('action-step-1');
  const a2 = document.getElementById('action-step-2');
  const title = document.getElementById('cart-drawer-title');

  if (step === 2) {
    if (s1) s1.classList.add('hidden');
    if (s2) s2.classList.remove('hidden');
    if (a1) a1.classList.add('hidden');
    if (a2) a2.classList.remove('hidden');
    if (title) title.innerText = 'Entrega & Pago';
  } else {
    if (s1) s1.classList.remove('hidden');
    if (s2) s2.classList.add('hidden');
    if (a1) a1.classList.remove('hidden');
    if (a2) a2.classList.add('hidden');
    if (title) title.innerText = 'Tu Carrito de Compras';
  }
}

export function handleProceedToCheckout() {
  if (cart.length === 0) {
    alert("Agrega productos antes de continuar.");
    return;
  }

  const sess = getSession();
  const nameInp = document.getElementById('order-customer-name');
  const emailInp = document.getElementById('order-customer-email');
  const phoneInp = document.getElementById('order-customer-phone');

  if (sess && sess.type === 'client') {
    if (nameInp && !nameInp.value) nameInp.value = sess.name || sess.full_name || '';
    if (emailInp && !emailInp.value) emailInp.value = sess.email || '';
    if (phoneInp && !phoneInp.value) phoneInp.value = sess.phone || '';
  }

  goToCartStep(2);
}

export async function calculateShippingRates() {
  const zip = document.getElementById('shipping-zip').value.trim();
  const btn = document.getElementById('btn-calc-shipping');
  const list = document.getElementById('shipping-options-list');
  if (!zip || zip.length !== 5) {
    alert("Ingresa un Código Postal válido.");
    return;
  }

  btn.innerText = "...";
  btn.disabled = true;
  const totalWeight = cart.reduce((acc, i) => acc + (parseFloat(i.weight || 0.5) * (i.quantity || 1)), 0);
  const maxDim = 15;

  const fallbackRates = [
    { cost: 135, provider: "Estafeta", service: "Terrestre", days: "2 a 4 días" },
    { cost: 175, provider: "FedEx", service: "Express", days: "1 a 2 días" }
  ];

  try {
    const response = await fetch('/api/cotizar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ zip_to: zip, weight: totalWeight, length: maxDim, width: maxDim, height: maxDim })
    });
    const data = await response.json();
    const rates = data.rates || fallbackRates;

    list.innerHTML = rates.map((r, idx) =>
      '<label class="flex items-center justify-between p-2.5 bg-white border border-zinc-200 rounded-xl cursor-pointer hover:border-zinc-950 transition text-xs"><div class="flex items-center gap-2"><input type="radio" name="shipping_rate" value="' + idx + '" onchange="selectShippingOption(' + r.cost + ', \'' + r.provider + '\', \'' + r.service + '\', \'' + r.days + '\')" ' + (idx === 0 ? 'checked' : '') + ' class="text-zinc-950"><div><div class="font-bold text-zinc-900">' + r.provider + ' (' + r.service + ')</div><div class="text-[10px] text-zinc-400">Entrega: ' + r.days + '</div></div></div><span class="font-bold text-zinc-950">$' + r.cost + ' MXN</span></label>'
    ).join('');

    selectShippingOption(rates[0].cost, rates[0].provider, rates[0].service, rates[0].days);
    list.classList.remove('hidden');
  } catch (e) {
    list.innerHTML = fallbackRates.map((r, idx) =>
      '<label class="flex items-center justify-between p-2.5 bg-white border border-zinc-200 rounded-xl cursor-pointer hover:border-zinc-950 transition text-xs"><div class="flex items-center gap-2"><input type="radio" name="shipping_rate" value="' + idx + '" onchange="selectShippingOption(' + r.cost + ', \'' + r.provider + '\', \'' + r.service + '\', \'' + r.days + '\')" ' + (idx === 0 ? 'checked' : '') + ' class="text-zinc-950"><div><div class="font-bold text-zinc-900">' + r.provider + ' (' + r.service + ')</div><div class="text-[10px] text-zinc-400">Entrega: ' + r.days + '</div></div></div><span class="font-bold text-zinc-950">$' + r.cost + ' MXN</span></label>'
    ).join('');

    selectShippingOption(fallbackRates[0].cost, fallbackRates[0].provider, fallbackRates[0].service, fallbackRates[0].days);
    list.classList.remove('hidden');
  }

  btn.innerText = "Cotizar";
  btn.disabled = false;
}

export function selectShippingOption(cost, provider, service, days) {
  selectedShippingRate = { cost, provider, service, days };
  updateCartUI();
}

async function createMercadoPagoCheckout(orderId, items, shippingCost) {
  try {
    const response = await fetch('/api/crear-preferencia', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: String(orderId),
        items: items,
        shippingCost: Number(shippingCost || 0)
      })
    });
    const data = await response.json();
    return data && data.init_point ? data.init_point : null;
  } catch (err) {
    return null;
  }
}

export async function finalizeOrderAndPay() {
  const sess = getSession();
  const name = document.getElementById('order-customer-name').value.trim();
  const email = document.getElementById('order-customer-email').value.trim();
  const phone = document.getElementById('order-customer-phone').value.trim();

  if (!name || !email || !phone) {
    alert("Por favor completa tu nombre, correo y teléfono de contacto.");
    return;
  }

  const hasPhysical = cart.some((i) => i.category !== 'Desarrollo Web');
  const isWebDevOnly = !hasPhysical;
  let deliveryInfo = "";
  let shippingCost = 0;

  if (isWebDevOnly) {
    deliveryInfo = "Servicio Digital Web (Sin Flete)";
    shippingCost = 0;
  } else if (selectedDeliveryType === 'pickup') {
    deliveryInfo = "Punto de Entrega: " + document.getElementById('order-pickup-spot').value;
    shippingCost = 0;
  } else {
    const addr = document.getElementById('order-address').value.trim();
    const col = document.getElementById('order-colonia').value.trim();
    const city = document.getElementById('order-city').value.trim();
    const cp = document.getElementById('order-zip').value.trim();
    if (!addr || !col || !city || !cp) {
      alert("Completa tu dirección de envío o selecciona Punto de Entrega sin costo.");
      return;
    }
    deliveryInfo = "Envío: " + addr + ", " + col + ", " + city + " CP " + cp;
    shippingCost = selectedShippingRate ? selectedShippingRate.cost : 135;
  }

  const btn = document.getElementById('btn-confirm-pay');
  btn.innerText = "Conectando con Mercado Pago...";
  btn.disabled = true;

  const orderId = 'FF-' + Math.floor(100000 + Math.random() * 900000);
  const subtotal = cart.reduce((acc, i) => acc + (i.price * (i.quantity || 1)), 0);
  const total = subtotal + shippingCost;
  const itemsText = cart.map((i) => '- ' + i.quantity + 'x ' + i.title + ' ($' + (i.price * i.quantity).toLocaleString() + ')').join('\n');

  const checkoutUrl = await createMercadoPagoCheckout(orderId, cart, shippingCost);

  const orderRecord = {
    id: orderId,
    user_id: sess ? sess.id : ('usr_guest_' + Date.now()),
    customer_name: name,
    customer_email: email,
    customer_phone: phone,
    shipping_address: deliveryInfo,
    shipping_method: isWebDevOnly
      ? 'Servicio Digital Web'
      : (selectedDeliveryType === 'pickup' ? 'Punto de Entrega (Gratis)' : 'Envío Paquetería'),
    items: itemsText,
    subtotal: subtotal,
    shipping_cost: shippingCost,
    total: total,
    status: 'Recibido',
    checkout_url: checkoutUrl || '',
    created_at: new Date().toISOString()
  };

  if (supabaseClient) {
    try {
      await supabaseClient.from('orders').upsert([orderRecord]);
    } catch (e) {}
  }

  let allOrders = [];
  try {
    allOrders = JSON.parse(localStorage.getItem('five_friends_orders')) || [];
  } catch (e) {}
  allOrders.unshift(orderRecord);
  localStorage.setItem('five_friends_orders', JSON.stringify(allOrders));

  saveCart([]);
  goToCartStep(1);
  toggleCartDrawer();
  btn.innerText = "Pagar con Mercado Pago";
  btn.disabled = false;

  if (typeof window.renderUserOrdersTable === 'function') window.renderUserOrdersTable();
  if (typeof window.renderAdminOrdersTable === 'function') window.renderAdminOrdersTable();

  if (checkoutUrl) {
    window.location.href = checkoutUrl;
  } else {
    alert("¡Orden " + orderId + " registrada con éxito! Puedes consultar su estatus en tiempo real en tu perfil del Club.");
  }
}
