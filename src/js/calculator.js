import { DEFAULT_WORKSHOP_CONFIG } from './config.js';
import { supabaseClient } from './supabase.js';
import { toggleCartDrawer } from './navigation.js';

let workshopConfig = { ...DEFAULT_WORKSHOP_CONFIG };

try {
  const savedConfig = localStorage.getItem('five_friends_workshop_config');
  if (savedConfig) {
    workshopConfig = { ...workshopConfig, ...JSON.parse(savedConfig) };
  }
} catch (e) {}

export async function loadWorkshopConfigFromDB() {
  if (!supabaseClient) return;
  try {
    const res = await supabaseClient
      .from('settings')
      .select('config_data')
      .eq('id', 'aprende3d_config')
      .maybeSingle();
    if (res?.data?.config_data) {
      workshopConfig = { ...workshopConfig, ...res.data.config_data };
      localStorage.setItem('five_friends_workshop_config', JSON.stringify(workshopConfig));
    }
  } catch (e) {}
}

export function calculateFullAprende3DCost(grams, hours) {
  const g = parseFloat(grams) || 0;
  const h = parseFloat(hours) || 0;
  if (g <= 0 || h <= 0) {
    return { costMat: 0, costElec: 0, costMach: 0, costLabor: 0, totalCost: 0, finalPrice: 0 };
  }

  const weightTotal = workshopConfig.filWeightGrams || 1000;
  const costPerGram = workshopConfig.filCostPerKg / weightTotal;
  const costMat = g * costPerGram * (1 + (workshopConfig.wastePct / 100.0));
  const costElec = h * (workshopConfig.watts / 1000.0) * workshopConfig.costPerKwh;
  const amortPerHour = (workshopConfig.printerCost || 14500) / (workshopConfig.printerLifespanHours || 3000);
  const fixedPerHour = (workshopConfig.monthlyFixed || 2500) / (workshopConfig.monthlyHours || 250);
  const costMach = h * (amortPerHour + (workshopConfig.wearPerHour || 4.5) + fixedPerHour);
  const totalMinutes = (workshopConfig.minPrep || 0) + (workshopConfig.minProd || 0) + (workshopConfig.minPost || 0) + (workshopConfig.minPack || 0);
  const laborCost = (totalMinutes / 60.0) * (workshopConfig.hourlyRate || 120);
  const costLaborAndPackaging = laborCost + (workshopConfig.packMaterialCost || 18);
  const totalCost = costMat + costElec + costMach + costLaborAndPackaging;
  const subtotalMarkup = totalCost * (1 + (workshopConfig.markupPct / 100.0));
  const finalPrice = subtotalMarkup * (1 + ((workshopConfig.taxPct || 0) / 100.0));

  return {
    costMat,
    costElec,
    costMach,
    costLabor: costLaborAndPackaging,
    totalCost: Math.round(totalCost * 100) / 100,
    finalPrice: Math.round(finalPrice)
  };
}

export function switchQuoteTab(tab) {
  const mTech = document.getElementById('quote-mode-tech');
  const mSize = document.getElementById('quote-mode-size');
  const bTech = document.getElementById('tab-quote-tech');
  const bSize = document.getElementById('tab-quote-size');

  if (tab === 'tech') {
    mTech.classList.remove('hidden');
    mSize.classList.add('hidden');
    bTech.className = 'flex-1 py-2 rounded-xl bg-white text-zinc-900 shadow-sm transition';
    bSize.className = 'flex-1 py-2 rounded-xl text-zinc-600 hover:text-zinc-900 transition';
  } else {
    mTech.classList.add('hidden');
    mSize.classList.remove('hidden');
    bSize.className = 'flex-1 py-2 rounded-xl bg-white text-zinc-900 shadow-sm transition';
    bTech.className = 'flex-1 py-2 rounded-xl text-zinc-600 hover:text-zinc-900 transition';
  }
}

export function selectPresetSize(grams, hours, title) {
  document.getElementById('calc-client-grams').value = grams;
  document.getElementById('calc-client-hours').value = hours;
  calculateClientQuote();
  switchQuoteTab('tech');
}

export function calculateClientQuote() {
  const g = document.getElementById('calc-client-grams').value;
  const h = document.getElementById('calc-client-hours').value;
  const res = calculateFullAprende3DCost(g, h);
  const display = document.getElementById('calc-client-result');
  if (res.finalPrice > 0) {
    display.innerText = '$' + res.finalPrice.toLocaleString() + '.00 MXN';
  } else {
    display.innerText = '$0.00 MXN';
  }
}

export function addCustomPrintToCart() {
  const g = document.getElementById('calc-client-grams').value;
  const h = document.getElementById('calc-client-hours').value;
  const res = calculateFullAprende3DCost(g, h);
  if (res.finalPrice <= 0) {
    alert("Ingresa los gramos y las horas estimadas de tu pieza.");
    return;
  }

  const customProduct = {
    id: 'custom_3d_' + Date.now(),
    title: 'Pieza 3D Personalizada (' + g + 'g / ' + h + ' hrs)',
    price: res.finalPrice,
    cost: res.totalCost,
    category: 'Impresión 3D',
    image_url: '',
    weight: Math.max(parseFloat(g) / 1000.0, 0.2),
    length: 15,
    width: 15,
    height: 10,
    quantity: 1
  };

  if (typeof window.pushCustomItemToCart === 'function') {
    window.pushCustomItemToCart(customProduct);
  }
  toggleCartDrawer();
  if (typeof window.goToCartStep === 'function') {
    window.goToCartStep(1);
  }
}

export function runAdminSimulation() {
  const g = document.getElementById('adm-sim-grams')?.value || 100;
  const h = document.getElementById('adm-sim-hours')?.value || 5;
  const res = calculateFullAprende3DCost(g, h);
  const costEl = document.getElementById('adm-sim-cost');
  const priceEl = document.getElementById('adm-sim-price');
  if (costEl) costEl.innerText = '$' + res.totalCost.toFixed(2) + ' MXN';
  if (priceEl) priceEl.innerText = '$' + res.finalPrice.toLocaleString() + '.00 MXN';
}

export function populateAdminCalculatorInputs() {
  const map = {
    'adm-calc-fil-cost': workshopConfig.filCostPerKg,
    'adm-calc-fil-weight': workshopConfig.filWeightGrams,
    'adm-calc-waste': workshopConfig.wastePct,
    'adm-calc-watts': workshopConfig.watts,
    'adm-calc-kwh': workshopConfig.costPerKwh,
    'adm-calc-printer-cost': workshopConfig.printerCost,
    'adm-calc-printer-lifespan': workshopConfig.printerLifespanHours,
    'adm-calc-hourly-rate': workshopConfig.hourlyRate,
    'adm-calc-min-prep': workshopConfig.minPrep,
    'adm-calc-min-prod': workshopConfig.minProd,
    'adm-calc-min-post': workshopConfig.minPost,
    'adm-calc-min-pack': workshopConfig.minPack,
    'adm-calc-pack-material': workshopConfig.packMaterialCost,
    'adm-calc-monthly-fixed': workshopConfig.monthlyFixed,
    'adm-calc-monthly-hours': workshopConfig.monthlyHours,
    'adm-calc-markup': workshopConfig.markupPct
  };
  Object.keys(map).forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = map[id];
  });
  runAdminSimulation();
}

export async function saveAdminCalculatorConfig() {
  workshopConfig = {
    filCostPerKg: parseFloat(document.getElementById('adm-calc-fil-cost').value) || 380,
    filWeightGrams: parseFloat(document.getElementById('adm-calc-fil-weight').value) || 1000,
    wastePct: parseFloat(document.getElementById('adm-calc-waste').value) || 10,
    watts: parseFloat(document.getElementById('adm-calc-watts').value) || 120,
    costPerKwh: parseFloat(document.getElementById('adm-calc-kwh').value) || 3.5,
    printerCost: parseFloat(document.getElementById('adm-calc-printer-cost').value) || 14500,
    printerLifespanHours: parseFloat(document.getElementById('adm-calc-printer-lifespan').value) || 3000,
    wearPerHour: 4.5,
    hourlyRate: parseFloat(document.getElementById('adm-calc-hourly-rate').value) || 120,
    minPrep: parseFloat(document.getElementById('adm-calc-min-prep').value) || 10,
    minProd: parseFloat(document.getElementById('adm-calc-min-prod').value) || 5,
    minPost: parseFloat(document.getElementById('adm-calc-min-post').value) || 15,
    minPack: parseFloat(document.getElementById('adm-calc-min-pack').value) || 10,
    packMaterialCost: parseFloat(document.getElementById('adm-calc-pack-material').value) || 18,
    monthlyFixed: parseFloat(document.getElementById('adm-calc-monthly-fixed').value) || 2500,
    monthlyHours: parseFloat(document.getElementById('adm-calc-monthly-hours').value) || 250,
    zipOrigin: "54807",
    markupPct: parseFloat(document.getElementById('adm-calc-markup').value) || 80,
    taxPct: 0,
    shipBase: 135
  };

  localStorage.setItem('five_friends_workshop_config', JSON.stringify(workshopConfig));

  if (supabaseClient) {
    try {
      await supabaseClient.from('settings').upsert({
        id: 'aprende3d_config',
        config_data: workshopConfig,
        updated_at: new Date().toISOString()
      });
    } catch (e) {}
  }

  alert("✓ Parámetros guardados correctamente.");
}
