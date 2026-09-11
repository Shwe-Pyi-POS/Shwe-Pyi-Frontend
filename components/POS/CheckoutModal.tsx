import React, { useState, useRef, useEffect } from "react";
import { X, User, Calendar, Loader2, Calculator, Truck, UserPlus, ChevronDown, Search } from "lucide-react";
import { CreditPersona } from "../../services/Credit/fetchCreditPersonas";
import { PaymentMethod, CartItemData } from "./types";
import { AddCustomerInline } from "./AddCustomerInline";

interface CheckoutModalProps {
  showCheckoutModal: boolean;
  setShowCheckoutModal: (val: boolean) => void;
  cart: CartItemData[];
  subtotal: number;
  total: number;
  combinedDiscountAmount: number;
  discount: number;
  setDiscount: (val: number) => void;
  markupAmount: number;
  setMarkupAmount: (val: number) => void;
  useMarkup: boolean;
  setUseMarkup: (val: boolean) => void;
  paymentType: "paid" | "credit";
  setPaymentType: (val: "paid" | "credit") => void;
  creditPersonas: CreditPersona[];
  selectedCreditPersonId: string;
  setSelectedCreditPersonId: (val: string) => void;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (val: PaymentMethod) => void;
  paidAmount: number;
  setPaidAmount: (val: number) => void;
  note: string;
  setNote: (val: string) => void;
  createdAt: string;
  setCreatedAt: (val: string) => void;
  devices: { isMobile: boolean };
  isProcessing: boolean;
  handleCheckout: () => void;
  setShowDiscountCalculator: (val: boolean) => void;
  setShowMarkupCalculator: (val: boolean) => void;
  transportFee: number;
  setTransportFee: (val: number) => void;
  perItemTransportFees: Record<string, number>;
  setPerItemTransportFees: (val: Record<string, number>) => void;
  onAddCustomer: (name: string, phone: string, address: string) => Promise<boolean>;
  t: (key: string) => string;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  showCheckoutModal,
  setShowCheckoutModal,
  cart,
  subtotal,
  total,
  combinedDiscountAmount,
  discount,
  setDiscount,
  markupAmount,
  setMarkupAmount,
  useMarkup,
  setUseMarkup,
  paymentType,
  setPaymentType,
  creditPersonas,
  selectedCreditPersonId,
  setSelectedCreditPersonId,
  paymentMethod,
  setPaymentMethod,
  paidAmount,
  setPaidAmount,
  note,
  setNote,
  createdAt,
  setCreatedAt,
  devices,
  isProcessing,
  handleCheckout,
  setShowDiscountCalculator,
  setShowMarkupCalculator,
  transportFee,
  setTransportFee,
  perItemTransportFees,
  setPerItemTransportFees,
  onAddCustomer,
  t,
}) => {
  const [showAddCustomerForm, setShowAddCustomerForm] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showPerItemFees, setShowPerItemFees] = useState(false);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  const adminData = JSON.parse(localStorage.getItem("adminData") || "{}");
  const userRole = adminData.role;

  useEffect(() => {
    if (userRole === "cashier") {
      setCreatedAt(new Date().toISOString().split("T")[0]);
    }
  }, [userRole, setCreatedAt, showCheckoutModal]);

  const selectedPersona = creditPersonas.find((p) => p._id === selectedCreditPersonId);

  const filteredPersonas = creditPersonas.filter(
    (p) =>
      p.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      p.phone.includes(customerSearch),
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectCustomer = (persona: CreditPersona) => {
    setSelectedCreditPersonId(persona._id);
    setCustomerSearch("");
    setShowDropdown(false);
    setShowAddCustomerForm(false);
  };

  const handleClearCustomer = () => {
    setSelectedCreditPersonId("");
    setCustomerSearch("");
  };

  if (!showCheckoutModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className={`bg-white shadow-2xl overflow-hidden flex flex-col ${devices.isMobile
          ? 'w-full h-full max-h-full mx-0 rounded-none'
          : 'w-full max-w-md mx-4 max-h-[90vh] rounded-xl'
        }`}>
        <div className="p-4 border-b bg-primary/10">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg text-gray-800">
              {devices.isMobile ? "Mobile" : "Desktop"}
            </h3>
            <button
              onClick={() => setShowCheckoutModal(false)}
              className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {cart.reduce((sum, item) => sum + item.qty, 0)}{" "}
            {t("pos.itemsLower")} • {subtotal.toLocaleString()} MMK
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("pos.paymentType")}
            </label>
            <select
              className="payment-type-select w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              value={paymentType}
              onChange={(e) => {
                setPaymentType(e.target.value as "paid" | "credit");
                if (e.target.value === "paid") {
                  setPaymentMethod(PaymentMethod.CASH);
                  setPaidAmount(Math.ceil(total));
                } else if (e.target.value === "credit") {
                  setPaymentMethod(PaymentMethod.CASH);
                  setPaidAmount(0);
                }
              }}
            >
              <option value="paid">{t("pos.paid")}</option>
              <option value="credit">{t("pos.credit")}</option>
            </select>
          </div>

          {userRole !== "cashier" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("pos.orderDate") || "Order Date"}
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  value={createdAt}
                  onChange={(e) => setCreatedAt(e.target.value)}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {paymentType === "credit" ? t("pos.selectCreditPerson") : t("pos.selectCustomer")}
            </label>
            <div className="flex gap-2 items-start">
              <div className="relative flex-1" ref={autocompleteRef}>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder={selectedPersona ? selectedPersona.name : "Search by name or phone..."}
                    value={showDropdown ? customerSearch : (selectedPersona ? selectedPersona.name : customerSearch)}
                    onFocus={() => setShowDropdown(true)}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setShowDropdown(true);
                    }}
                    className="w-full pl-9 pr-8 py-2.5 border border-primary-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-primary/5 text-gray-800"
                  />
                  {selectedPersona && !showDropdown && (
                    <button
                      onClick={handleClearCustomer}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  {!selectedPersona && (
                    <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                  )}
                </div>
                {showDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredPersonas.length === 0 && (
                      <div className="px-3 py-2 text-sm text-gray-500">
                        {customerSearch ? "No customers found" : "No customers available"}
                      </div>
                    )}
                    {filteredPersonas.map((persona) => (
                      <div
                        key={persona._id}
                        onClick={() => handleSelectCustomer(persona)}
                        className={`px-3 py-2.5 text-sm cursor-pointer hover:bg-primary/5 flex items-center gap-2 ${persona._id === selectedCreditPersonId ? "bg-primary/10 text-primary font-medium" : "text-gray-700"
                          }`}
                      >
                        <User className="w-4 h-4 text-gray-400 shrink-0" />
                        <div>
                          <p className="font-medium">{persona.name}</p>
                          <p className="text-xs text-gray-500">{persona.phone}</p>
                        </div>
                      </div>
                    ))}
                    <div
                      onClick={() => {
                        setShowAddCustomerForm(true);
                        setShowDropdown(false);
                        setCustomerSearch("");
                      }}
                      className="px-3 py-2.5 text-sm cursor-pointer hover:bg-primary/5 text-primary font-medium border-t flex items-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      + Add New Customer
                    </div>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddCustomerForm(!showAddCustomerForm);
                }}
                className={`p-2.5 border rounded-lg flex items-center justify-center transition-colors text-sm font-medium shrink-0 ${showAddCustomerForm
                    ? "bg-primary text-white border-primary hover:bg-primary-600"
                    : "bg-white text-primary border-primary/20 hover:bg-primary/5"
                  }`}
                title="Add New Customer"
              >
                <UserPlus className="w-5 h-5" />
              </button>
            </div>
            {showAddCustomerForm && (
              <div className="mt-2">
                <AddCustomerInline
                  onSave={async (name, phone, address) => {
                    const success = await onAddCustomer(name, phone, address);
                    if (success) {
                      setShowAddCustomerForm(false);
                      setCustomerSearch("");
                    }
                    return success;
                  }}
                  onCancel={() => {
                    setShowAddCustomerForm(false);
                    setCustomerSearch("");
                  }}
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("pos.paymentMethod")}
            </label>
            <select
              className="payment-method-select w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              value={paymentMethod}
              onChange={(e) =>
                setPaymentMethod(e.target.value as PaymentMethod)
              }
            >
              <option value={PaymentMethod.CASH}>{t("pos.cash")}</option>
              <option value={PaymentMethod.KBZ_PAY}>
                {t("pos.kbzPay")}
              </option>
              <option value={PaymentMethod.WAVE_PAY}>
                {t("pos.wavePay")}
              </option>
              <option value={PaymentMethod.AYA_PAY}>
                {t("pos.ayaPay")}
              </option>
              <option value={PaymentMethod.UAB_PAY}>
                {t("pos.uabPay")}
              </option>
              <option value={PaymentMethod.BANK_TRANSFER}>
                {t("pos.bankTransfer")}
              </option>
              <option value={PaymentMethod.MMQR}>MMQR</option>
              <option value={PaymentMethod.FOC}>FOC</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pricing Option
            </label>
            <div className="flex gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="pricingOption"
                  checked={!useMarkup}
                  onChange={() => setUseMarkup(false)}
                  className="mr-2"
                />
                <span className="text-sm">Discount</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="pricingOption"
                  checked={useMarkup}
                  onChange={() => setUseMarkup(true)}
                  className="mr-2"
                />
                <span className="text-sm">Markup</span>
              </label>
            </div>
          </div>

          {!useMarkup && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("pos.discount")} (%)
                <button
                  onClick={() => setShowDiscountCalculator(true)}
                  className="ml-2 text-primary hover:text-primary-700 transition-colors"
                  title="Calculate discount percentage"
                >
                  <Calculator className="w-4 h-4" />
                </button>
              </label>
              <input
                type="number"
                min="0"
                max="100"
                className="discount-input w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                value={discount.toFixed(2)}
                onChange={(e) => setDiscount(Number(e.target.value))}
              />
            </div>
          )}

          {useMarkup && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Markup Amount (MMK)
                <button
                  onClick={() => setShowMarkupCalculator(true)}
                  className="ml-2 text-primary hover:text-primary-700 transition-colors"
                  title="Add fixed markup amount"
                >
                  <Calculator className="w-4 h-4" />
                </button>
              </label>
              <input
                type="number"
                min="0"
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                value={markupAmount}
                onChange={(e) => setMarkupAmount(Number(e.target.value))}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {paymentMethod === PaymentMethod.FOC
                ? `${t("pos.paidAmount")} (MMK) - ${t("pos.focMessage") || "Free of Charge"}`
                : `${t("pos.paidAmount")} (MMK)`}
              {paymentType === "paid" &&
                paymentMethod !== PaymentMethod.FOC && (
                  <span className="text-red-500">*</span>
                )}
            </label>
            <input
              type="number"
              min="0"
              disabled={paymentMethod === PaymentMethod.FOC}
              className={`w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none ${paymentMethod === PaymentMethod.FOC
                  ? "bg-gray-100 cursor-not-allowed"
                  : ""
                }`}
              value={paymentMethod === PaymentMethod.FOC ? 0 : paidAmount}
              onChange={(e) => {
                const value =
                  e.target.value === "" ? 0 : Number(e.target.value);
                setPaidAmount(Math.ceil(value));
              }}
              placeholder={
                paymentMethod === PaymentMethod.FOC
                  ? "0"
                  : t("pos.enterPaidAmount")
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("pos.note")} ({t("common.optional")})
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("pos.notePlaceholder")}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Transport Fee (MMK)
              </label>
              <button
                type="button"
                onClick={() => {
                  setShowPerItemFees(!showPerItemFees);
                  // If switching back to flat mode, clear per-item fees and total transport fee
                  if (showPerItemFees) {
                    setPerItemTransportFees({});
                    setTransportFee(0);
                  }
                }}
                className="text-xs text-primary font-semibold hover:underline"
              >
                {showPerItemFees ? "Use Flat Fee" : "Custom Per-Item Fee"}
              </button>
            </div>

            {!showPerItemFees ? (
              <div className="relative">
                <Truck className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  min="0"
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  value={transportFee || ""}
                  onChange={(e) => setTransportFee(Number(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
            ) : (
              <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50 max-h-60 overflow-y-auto">
                <p className="text-xs text-gray-500 font-medium mb-1">Enter fee for each item:</p>
                {cart.map((item, index) => {
                  const code = item.stockItem.inventoryId.productCode;
                  const name = item.stockItem.inventoryId.productName;
                  const key = item.stockItem.inventoryId._id || `cart-${index}`;
                  return (
                    <div key={key} className="flex items-center justify-between gap-2 bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="text-sm font-semibold text-gray-800 truncate" title={name}>
                          {name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {code} • Qty: {item.qty}
                        </p>
                      </div>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        className="w-32 text-right border border-gray-300 rounded-lg px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                        value={perItemTransportFees[code] || ""}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;
                          const updatedFees = {
                            ...perItemTransportFees,
                            [code]: val,
                          };
                          setPerItemTransportFees(updatedFees);

                          // Sum up to update main transport fee
                          const sum = cart.reduce((totalSum, cartItem) => {
                            const itemCode = cartItem.stockItem.inventoryId.productCode;
                            return totalSum + (updatedFees[itemCode] || 0);
                          }, 0);
                          setTransportFee(sum);
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{t("common.subtotal")}</span>
              <span>{subtotal.toLocaleString()} MMK</span>
            </div>
            {!useMarkup && discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>
                  {t("common.discount")} ({discount.toFixed(2)}%)
                </span>
                <span>-{combinedDiscountAmount.toLocaleString()} MMK</span>
              </div>
            )}
            {useMarkup && markupAmount > 0 && (
              <div className="flex justify-between text-sm text-blue-600">
                <span>Markup Amount</span>
                <span>+{markupAmount.toLocaleString()} MMK</span>
              </div>
            )}
            {transportFee > 0 && (
              <div className="flex justify-between text-sm text-orange-600">
                <span>Transport Fee</span>
                <span>+{transportFee.toLocaleString()} MMK</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t">
              <span>{t("common.total")}</span>
              <span>{total.toLocaleString()} MMK</span>
            </div>
            {paidAmount > 0 &&
              paidAmount >= total &&
              paymentType === "paid" && (
                <div className="change-display-row flex justify-between text-sm text-green-600 font-medium">
                  <span>{t("common.change")}</span>
                  <span>{(paidAmount - total).toLocaleString()} MMK</span>
                </div>
              )}
          </div>
        </div>

        <div className="p-4 border-t bg-gray-50 space-y-2">
          <button
            onClick={() => {
              handleCheckout();
              setShowCheckoutModal(false);
            }}
            disabled={
              cart.length === 0 ||
              isProcessing ||
              (paymentType === "paid" && paidAmount < total) ||
              (paymentType === "credit" && paidAmount > total)
            }
            className="complete-sale-btn w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-lg font-bold transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />{" "}
                {t("pos.processing")}
              </>
            ) : (
              <>
                {t("pos.completeSale")} • {total.toLocaleString()} MMK
              </>
            )}
          </button>
          <button
            onClick={() => setShowCheckoutModal(false)}
            className="w-full py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {t("common.cancel")}
          </button>
        </div>
      </div>
    </div>
  );
};
