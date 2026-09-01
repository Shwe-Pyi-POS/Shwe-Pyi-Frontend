import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { Menu } from "lucide-react";
import { AppProvider } from "./context/AppContext";
import { LanguageProvider } from "./context/LanguageContext";
import { Sidebar } from "./components/Sidebar";
import { LanguageSwitcher } from "./components/LanguageSwitcher";
import { POS } from "./pages/POS";
import { DirectSale } from "./pages/DirectSale";
import { Warehouse } from "./pages/Warehouse";
import { WarehouseDetail } from "./pages/WarehouseDetail";
import { Storefront } from "./pages/Storefront";
import { StorefrontDetail } from "./pages/StorefrontDetail";
import { Reports } from "./pages/Reports";
import { PurchaseReport } from "./pages/PurchaseReport";
import { Settings } from "./pages/Settings";
import { Inventory } from "./pages/Inventory";
import { Purchasing } from "./pages/Purchasing";
import { Credits } from "./pages/Credits";
import { CreditDetail } from "./pages/CreditDetail";
import { Expenses } from "./pages/Expenses";
import { Suppliers } from "./pages/Suppliers";
import { Orders } from "./pages/Orders";
import { DirectSaleOrders } from "./pages/DirectSaleOrders";

import { QuotationList } from "./pages/QuotationList";
import { QuotationCreate } from "./pages/QuotationCreate";
import { QuotationDetail } from "./pages/QuotationDetail";
import { AccountManagement } from "./pages/AccountManagement";
import { Login } from "./pages/Login";
import { ProtectedRoute } from "./components/ProtectedRoute";
import PrintReceipt from "./pages/PrintReceipt";
import { AIChat } from "./pages/AIChat";

const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const token = localStorage.getItem("authToken");

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Only show header and sidebar if authenticated */}
      {token && (
        <>
          {/* Header */}
          <header className="bg-brand border-b border-white/10 sticky top-0 z-30 print:hidden shadow-lg">
            <div className="flex items-center justify-between h-14 px-4">
              <div className="flex items-center">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors mr-3"
                  aria-label="Open menu"
                >
                  <Menu className="w-6 h-6 text-white" />
                </button>
                <h1 className="text-lg font-bold text-white tracking-wide">
                  Shwepyi-ERP System
                </h1>
              </div>
              <div className="flex items-center gap-2">
                {/* <button
                  onClick={() => setRunTutorial(true)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white flex items-center gap-2"
                  title="Start Tutorial"
                >
                  <HelpCircle className="w-5 h-5" />
                  <span className="text-xs font-medium hidden sm:inline">
                    ဆော့ဝဲ လမ်းညွှန်
                  </span>
                </button> */}
                <LanguageSwitcher />
              </div>
            </div>
          </header>

          {/* Sidebar */}
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        </>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden">
        <Routes>
          <Route path="/" element={<Navigate to="/pos" replace />} />
          <Route path="/pos" element={<POS />} />
          <Route path="/direct-sale" element={<DirectSale />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/warehouse" element={<Warehouse />} />
          <Route path="/warehouse/:id" element={<WarehouseDetail />} />
          <Route path="/storefront" element={<Storefront />} />
          <Route path="/storefront/:id" element={<StorefrontDetail />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/purchasing" element={<Purchasing />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/direct-sale-orders" element={<DirectSaleOrders />} />
          <Route
            path="/credit-orders"
            element={<Navigate to="/orders?type=credit" replace />}
          />
          <Route path="/quotations" element={<QuotationList />} />
          <Route path="/quotations/create" element={<QuotationCreate />} />
          <Route
            path="/quotations/new"
            element={<Navigate to="/quotations/create" replace />}
          />
          <Route path="/quotations/:id/edit" element={<QuotationCreate />} />
          <Route path="/quotations/:id" element={<QuotationDetail />} />
          <Route path="/credits" element={<Credits />} />
          <Route path="/credits/:id" element={<CreditDetail />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/purchase-report" element={<PurchaseReport />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/accounts" element={<AccountManagement />} />
          <Route path="/ai-chat" element={<AIChat />} />
          <Route path="/print-receipt/:orderId" element={<PrintReceipt />} />
        </Routes>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AppProvider>
        <Toaster position="top-right" richColors />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoute />}>
              <Route path="*" element={<AppLayout />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </LanguageProvider>
  );
};

export default App;
