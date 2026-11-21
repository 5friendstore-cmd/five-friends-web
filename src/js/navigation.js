export function navigate(section) {
  const sections = ['inicio', 'puntos', 'contacto', 'catalogo', 'cotizador', 'club', 'faq'];
  for (let i = 0; i < sections.length; i++) {
    const el = document.getElementById('sec-' + sections[i]);
    if (el) el.classList.add('hidden');
  }
  const target = document.getElementById('sec-' + section);
  if (target) {
    target.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (section === 'catalogo' && typeof window.fetchCatalogFromDatabase === 'function') {
      window.fetchCatalogFromDatabase();
    }
  }
}

export function toggleMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  const bars = document.getElementById('menu-icon-bars');
  const close = document.getElementById('menu-icon-close');
  if (!menu) return;

  const isHidden = menu.classList.contains('hidden');
  if (isHidden) {
    menu.classList.remove('hidden');
    if (bars) bars.classList.add('hidden');
    if (close) close.classList.remove('hidden');
  } else {
    menu.classList.add('hidden');
    if (bars) bars.classList.remove('hidden');
    if (close) close.classList.add('hidden');
  }
}

export function toggleCartDrawer() {
  const drawer = document.getElementById('cart-drawer');
  if (drawer) drawer.classList.toggle('hidden');
}

export function toggleAuthTab(tab) {
  const fLog = document.getElementById('form-login');
  const fReg = document.getElementById('form-register');
  const fAdm = document.getElementById('form-admin');
  if (fLog) fLog.classList.add('hidden');
  if (fReg) fReg.classList.add('hidden');
  if (fAdm) fAdm.classList.add('hidden');

  const tabs = ['login', 'register', 'admin'];
  for (let i = 0; i < tabs.length; i++) {
    const t = document.getElementById('tab-' + tabs[i]);
    if (t) t.className = 'text-zinc-400 hover:text-zinc-700 pb-2.5';
  }

  const activeTab = document.getElementById('tab-' + tab);
  if (activeTab) activeTab.className = 'text-zinc-950 border-b-2 border-zinc-950 pb-2.5';
  const form = document.getElementById('form-' + tab);
  if (form) form.classList.remove('hidden');
}

export function switchAdminTab(tabKey) {
  const adminTabs = ['orders', 'clients', 'calculator', 'products'];
  for (let i = 0; i < adminTabs.length; i++) {
    const panel = document.getElementById('adm-panel-' + adminTabs[i]);
    const btn = document.getElementById('adm-nav-' + adminTabs[i]);
    if (panel) panel.classList.add('hidden');
    if (btn) btn.className = 'px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition whitespace-nowrap';
  }

  const activePanel = document.getElementById('adm-panel-' + tabKey);
  const activeBtn = document.getElementById('adm-nav-' + tabKey);
  if (activePanel) activePanel.classList.remove('hidden');
  if (activeBtn) activeBtn.className = 'px-4 py-2 text-xs sm:text-sm font-bold rounded-xl bg-zinc-950 text-white shadow-sm whitespace-nowrap';

  if (tabKey === 'orders' && typeof window.renderAdminOrdersTable === 'function') {
    window.renderAdminOrdersTable();
  }
  if (tabKey === 'clients' && typeof window.loadAdminData === 'function') {
    window.loadAdminData();
  }
  if (tabKey === 'calculator' && typeof window.populateAdminCalculatorInputs === 'function') {
    window.populateAdminCalculatorInputs();
  }
  if (tabKey === 'products' && typeof window.renderAdminProductsTable === 'function') {
    window.renderAdminProductsTable();
  }
}

export async function toggleManualOrderModal() {
  const modal = document.getElementById('modal-manual-order');
  if (modal) {
    const isHidden = modal.classList.contains('hidden');
    if (isHidden) {
      modal.classList.remove('hidden');
      if (typeof window.populateManualClientDropdown === 'function') {
        await window.populateManualClientDropdown();
      }
    } else {
      modal.classList.add('hidden');
    }
  }
}
