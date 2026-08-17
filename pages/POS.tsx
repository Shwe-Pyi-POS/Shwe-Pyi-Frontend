import React from "react";
import { Loader2, Store } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { usePOS } from "../hooks/usePOS";
import { ProductGrid } from "../components/POS/ProductGrid";
import { CartSidebar } from "../components/POS/CartSidebar";
import { CheckoutModal } from "../components/POS/CheckoutModal";
import { SuccessModal } from "../components/POS/SuccessModal";
import { DiscountCalculator } from "../components/POS/DiscountCalculator";
import { MarkupCalculator } from "../components/POS/MarkupCalculator";

export const POS: React.FC = () => {
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
    showMobileCart,
    setShowMobileCart,
    filteredProducts,
    subtotal,
    total,
    combinedDiscountAmount,
    addToCart,
    updateQty,
    setQty,
    removeFromCart,
    setCartLineUnit,
    handleStorefrontChange,
    handleRefresh,
    handleBarcodeScan,
    handleCheckout,
    handleAddCustomer,
  } = usePOS();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-dark-100">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-dark-600">{t("pos.loading")}</p>
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
      <ProductGrid
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
        p={{ itemsPerPage: 100, devices }}
        cartCount={cart.reduce((sum, item) => sum + item.qty, 0)}
        showMobileCart={showMobileCart}
        setShowMobileCart={setShowMobileCart}
      />

      <CartSidebar
        cart={cart}
        setCartLineUnit={setCartLineUnit}
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
        showMobileCart={showMobileCart}
        setShowMobileCart={setShowMobileCart}
        devices={devices}
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

      <CheckoutModal
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

      <SuccessModal
        showSuccessModal={showSuccessModal}
        setShowSuccessModal={setShowSuccessModal}
        setSuccessOrderNumber={setSuccessOrderNumber}
        t={t}
      />
    </div>
  );
};
