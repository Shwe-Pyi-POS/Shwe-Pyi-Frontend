import React from "react";
import { Loader2, Store } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useDirectSale } from "../hooks/useDirectSale";
import { DirectSaleProductGrid } from "../components/DirectSale/DirectSaleProductGrid";
import { DirectSaleCartSidebar } from "../components/DirectSale/DirectSaleCartSidebar";
import { DirectSaleCheckoutModal } from "../components/DirectSale/DirectSaleCheckoutModal";
import { DirectSaleSuccessModal } from "../components/DirectSale/DirectSaleSuccessModal";
import { DiscountCalculator } from "../components/POS/DiscountCalculator";
import { MarkupCalculator } from "../components/POS/MarkupCalculator";

export const DirectSale: React.FC = () => {
  const { t } = useLanguage();
  const {
    storefronts,
    selectedStorefrontId,
    loading,
    categories,
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems,
    cart,
    setCart,
    search,
    setSearch,
    selectedCategory,
    setSelectedCategory,
    paidAmount,
    setPaidAmount,
    paymentType,
    setPaymentType,
    creditPersonas,
    selectedCreditPersonId,
    setSelectedCreditPersonId,
    showCheckoutModal,
    setShowCheckoutModal,
    showSuccessModal,
    setShowSuccessModal,
    successOrderNumber,
    setSuccessOrderNumber,
    discount,
    setDiscount,
    markupAmount,
    setMarkupAmount,
    note,
    setNote,
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    isProcessing,
    showStorefrontMenu,
    setShowStorefrontMenu,
    useMarkup,
    setUseMarkup,
    paymentMethod,
    setPaymentMethod,
    showDiscountCalculator,
    setShowDiscountCalculator,
    showMarkupCalculator,
    setShowMarkupCalculator,
    discountAmount,
    setDiscountAmount,
    transportFee,
    setTransportFee,
    perItemTransportFees,
    setPerItemTransportFees,
    createdAt,
    setCreatedAt,
    devices,
    filteredProducts,
    subtotal,
    total,
    combinedDiscountAmount,
    addToCart,
    updateQty,
    setQty,
    removeFromCart,
    setCartLineUnit,
    setCartLineUnitPrice,
    handleStorefrontChange,
    handleRefresh,
    handleBarcodeScan,
    handleCheckout,
    handleAddCustomer,
  } = useDirectSale();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-dark-100">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-dark-600">{t("directSale.loading")}</p>
        </div>
      </div>
    );
  }

  if (storefronts.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-dark-100">
        <div className="text-center">
          <Store className="w-8 h-8 text-primary mx-auto mb-2" />
          <p className="text-dark-600">
            You are not assigned to any storefront. Please contact the
            administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-60px)] overflow-hidden bg-gray-100">
      <DirectSaleProductGrid
        search={search}
        setSearch={setSearch}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        categories={categories}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        filteredProducts={filteredProducts}
        addToCart={addToCart}
        handleBarcodeScan={handleBarcodeScan}
        storefronts={storefronts}
        selectedStorefrontId={selectedStorefrontId}
        showStorefrontMenu={showStorefrontMenu}
        setShowStorefrontMenu={setShowStorefrontMenu}
        handleStorefrontChange={handleStorefrontChange}
        handleRefresh={handleRefresh}
        loading={loading}
        t={t}
        p={{ itemsPerPage: 100 }}
      />

      <DirectSaleCartSidebar
        cart={cart}
        setCart={setCart}
        setCartLineUnit={setCartLineUnit}
        setCartLineUnitPrice={setCartLineUnitPrice}
        removeFromCart={removeFromCart}
        updateQty={updateQty}
        setQty={setQty}
        subtotal={subtotal}
        total={total}
        paymentMethod={paymentMethod}
        paymentType={paymentType}
        setPaidAmount={setPaidAmount}
        setShowCheckoutModal={setShowCheckoutModal}
        storefronts={storefronts}
        selectedStorefrontId={selectedStorefrontId}
        t={t}
      />

      {isProcessing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4">
            <Loader2 className="w-16 h-16 animate-spin text-primary" />
            <div className="text-center">
              <p className="text-xl font-bold text-gray-800 mb-1">
                {t("pos.processing")}
              </p>
              <p className="text-sm text-gray-500">
                Please wait while we process your order...
              </p>
            </div>
          </div>
        </div>
      )}

      <DirectSaleCheckoutModal
        showCheckoutModal={showCheckoutModal}
        setShowCheckoutModal={setShowCheckoutModal}
        cart={cart}
        subtotal={subtotal}
        total={total}
        combinedDiscountAmount={combinedDiscountAmount}
        discount={discount}
        setDiscount={setDiscount}
        markupAmount={markupAmount}
        setMarkupAmount={setMarkupAmount}
        useMarkup={useMarkup}
        setUseMarkup={setUseMarkup}
        paymentType={paymentType}
        setPaymentType={setPaymentType}
        creditPersonas={creditPersonas}
        selectedCreditPersonId={selectedCreditPersonId}
        setSelectedCreditPersonId={setSelectedCreditPersonId}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        paidAmount={paidAmount}
        setPaidAmount={setPaidAmount}
        note={note}
        setNote={setNote}
        customerName={customerName}
        setCustomerName={setCustomerName}
        customerPhone={customerPhone}
        setCustomerPhone={setCustomerPhone}
        createdAt={createdAt}
        setCreatedAt={setCreatedAt}
        devices={devices}
        isProcessing={isProcessing}
        handleCheckout={handleCheckout}
        setShowDiscountCalculator={setShowDiscountCalculator}
        setShowMarkupCalculator={setShowMarkupCalculator}
        transportFee={transportFee}
        setTransportFee={setTransportFee}
        perItemTransportFees={perItemTransportFees}
        setPerItemTransportFees={setPerItemTransportFees}
        onAddCustomer={handleAddCustomer}
        t={t}
      />

      <DiscountCalculator
        showDiscountCalculator={showDiscountCalculator}
        setShowDiscountCalculator={setShowDiscountCalculator}
        discountAmount={discountAmount}
        setDiscountAmount={setDiscountAmount}
        subtotal={subtotal}
        setDiscount={setDiscount}
        t={t}
      />

      <MarkupCalculator
        showMarkupCalculator={showMarkupCalculator}
        setShowMarkupCalculator={setShowMarkupCalculator}
        markupAmount={markupAmount}
        setMarkupAmount={setMarkupAmount}
        subtotal={subtotal}
        t={t}
      />

      <DirectSaleSuccessModal
        showSuccessModal={showSuccessModal}
        setShowSuccessModal={setShowSuccessModal}
        setSuccessOrderNumber={setSuccessOrderNumber}
        t={t}
      />
    </div>
  );
};
