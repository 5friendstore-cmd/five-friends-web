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

// Exponer funciones globales para eventos HTML (onclick / onsubmit / oninput)
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
  enviarMensajeAI
});

// Arranque inicial de la SPA
window.addEventListener('DOMContentLoaded', async () => {
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
