import {
  navigate,
  toggleMobileMenu,
  toggleCartDrawer,
  toggleAuthTab,
  switchAdminTab,
  toggleManualOrderModal
} from './navigation.js';
import {
  fetchCatalogFromDatabase,
  filterCategoryFromHome,
  setMacroFilter,
  setSubcategoryFilter,
  filterCatalog
} from './catalog.js';
import {
  loadWorkshopConfigFromDB,
  switchQuoteTab,
  selectPresetSize,
  calculateClientQuote,
  addCustomPrintToCart,
  runAdminSimulation,
  populateAdminCalculatorInputs,
  saveAdminCalculatorConfig
} from './calculator.js';
import {
  pushCustomItemToCart,
  addToCart,
  changeQuantity,
  removeFromCart,
  toggleDeliveryMode,
  updateCartUI,
  goToCartStep,
  handleProceedToCheckout,
  calculateShippingRates,
  selectShippingOption,
  finalizeOrderAndPay
} from './cart.js';
import {
  getSession,
  handleRegister,
  handleLogin,
  handleAdminLogin,
  showUserView,
  showAdminView,
  handleLogout,
  sendPasswordToEmail,
  renderUserOrdersTable
} from './auth.js';
import {
  renderAdminOrdersTable,
  updateOrderStatus,
  promptManualOrderLookup,
  populateManualClientDropdown,
  handleSelectExistingClient,
  handleCreateManualOrder,
  loadAdminData,
  handleAdminValidateCoupon,
  toggleShippingFields,
  updateImagePreview,
  handleImageFileUpload,
  renderAdminProductsTable,
  downloadCSVTemplate,
  handleBulkCSVImport,
  handleProductFormSubmit,
  editProduct,
  cancelProductEdit,
  deleteProduct,
  syncAllAdminData
} from './admin.js';
import { toggleAIChat, enviarMensajeAI } from './chat.js';

function applyThemeIcons(isDark) {
  document.querySelectorAll('.icon-sun').forEach((el) => el.classList.toggle('hidden', !isDark));
  document.querySelectorAll('.icon-moon').forEach((el) => el.classList.toggle('hidden', isDark));
}

export function toggleDarkMode() {
  const isDark = document.documentElement.classList.toggle('dark');
  try {
    localStorage.setItem('five_friends_theme', isDark ? 'dark' : 'light');
  } catch (e) {}
  applyThemeIcons(isDark);
}

// Aplicar preferencia guardada al instante antes de renderizar
try {
  if (localStorage.getItem('five_friends_theme') === 'dark') {
    document.documentElement.classList.add('dark');
  }
} catch (e) {}

Object.assign(window, {
  navigate,
  toggleMobileMenu,
  toggleCartDrawer,
  toggleAuthTab,
  switchAdminTab,
  toggleManualOrderModal,
  fetchCatalogFromDatabase,
  filterCategoryFromHome,
  setMacroFilter,
  setSubcategoryFilter,
  filterCatalog,
  switchQuoteTab,
  selectPresetSize,
  calculateClientQuote,
  addCustomPrintToCart,
  runAdminSimulation,
  populateAdminCalculatorInputs,
  saveAdminCalculatorConfig,
  pushCustomItemToCart,
  addToCart,
  changeQuantity,
  removeFromCart,
  toggleDeliveryMode,
  goToCartStep,
  handleProceedToCheckout,
  calculateShippingRates,
  selectShippingOption,
  finalizeOrderAndPay,
  handleRegister,
  handleLogin,
  handleAdminLogin,
  handleLogout,
  sendPasswordToEmail,
  renderUserOrdersTable,
  renderAdminOrdersTable,
  updateOrderStatus,
  promptManualOrderLookup,
  populateManualClientDropdown,
  handleSelectExistingClient,
  handleCreateManualOrder,
  loadAdminData,
  handleAdminValidateCoupon,
  toggleShippingFields,
  updateImagePreview,
  handleImageFileUpload,
  renderAdminProductsTable,
  downloadCSVTemplate,
  handleBulkCSVImport,
  handleProductFormSubmit,
  editProduct,
  cancelProductEdit,
  deleteProduct,
  syncAllAdminData,
  toggleAIChat,
  enviarMensajeAI,
  toggleDarkMode
});

// Movimiento parallax tornasol al navegar y hacer scroll
window.addEventListener('scroll', () => {
  document.documentElement.style.setProperty('--scroll-y', window.scrollY + 'px');
}, { passive: true });

window.addEventListener('DOMContentLoaded', async () => {
  applyThemeIcons(document.documentElement.classList.contains('dark'));
  await loadWorkshopConfigFromDB();
  await fetchCatalogFromDatabase();
  updateCartUI();

  try {
    const sess = getSession();
    if (sess?.type === 'admin') {
      showAdminView();
    } else if (sess?.type === 'client') {
      showUserView(sess.name, sess.total_spent);
    }
  } catch (e) {}
});
