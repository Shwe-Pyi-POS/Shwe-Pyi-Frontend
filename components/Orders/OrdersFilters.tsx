import React from "react";
import { Search } from "lucide-react";
import { StorefrontProfile } from "../../services/Storefront/fetchStorefrontProfiles";
import { Order } from "../../services/Order/fetchOrders";
import { useLanguage } from "@/context/LanguageContext";

interface OrdersFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  storefronts: StorefrontProfile[];
  selectedStorefrontId: string;
  onStorefrontChange: (value: string) => void;
  paymentTypeFilter: string;
  onPaymentTypeChange: (value: string) => void;
  paymentStatusFilter?: string;
  onPaymentStatusChange?: (value: string) => void;
  paymentMethodFilter: string;
  onPaymentMethodChange: (value: string) => void;
  orders: Order[];
  filteredOrders: Order[];
  totalItems?: number;
  /** When true, show payment type (paid / credit) filter for API-backed lists */
  showPaymentTypeFilter?: boolean;
  /** When true, show payment status (fully paid / pending / etc) filter */
  showPaymentStatusFilter?: boolean;
  /** Hide storefront dropdown (e.g. direct-sale orders) */
  hideStorefrontFilter?: boolean;
}

export const OrdersFilters: React.FC<OrdersFiltersProps> = ({
  search,
  onSearchChange,
  storefronts,
  selectedStorefrontId,
  onStorefrontChange,
  paymentTypeFilter,
  onPaymentTypeChange,
  paymentStatusFilter = "all",
  onPaymentStatusChange,
  paymentMethodFilter,
  onPaymentMethodChange,
  orders,
  filteredOrders,
  totalItems,
  showPaymentTypeFilter = false,
  showPaymentStatusFilter = true,
  hideStorefrontFilter = false,
}) => {
  const { t } = useLanguage();

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border mb-6">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] sm:min-w-[250px]">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder={t("orders.search")}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Storefront Filter */}
          {!hideStorefrontFilter && (
            <div className="flex items-center gap-2">
              <select
                className="border border-gray-200 rounded-lg px-3 py-2.5 sm:px-4 bg-white focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm sm:text-base"
                value={selectedStorefrontId}
                onChange={(e) => onStorefrontChange(e.target.value)}
              >
                <option value="all">{t("creditOrders.allstorefront")}</option>
                {storefronts.map((sf) => (
                  <option key={sf._id} value={sf._id}>
                    {sf.locationName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Payment Type Filter (optional; e.g. Direct Sale Orders) */}
          {showPaymentTypeFilter && (
            <div className="flex items-center gap-2">
              <select
                className="border border-gray-200 rounded-lg px-3 py-2.5 sm:px-4 bg-white focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm sm:text-base"
                value={paymentTypeFilter}
                onChange={(e) => onPaymentTypeChange(e.target.value)}
              >
                <option value="all">{t("orders.allTypes")}</option>
                <option value="paid">{t("orders.paid")}</option>
                <option value="credit">{t("pos.credit")}</option>
              </select>
            </div>
          )}

          {/* Payment Status Filter */}
          {showPaymentStatusFilter && onPaymentStatusChange && (
            <div className="flex items-center gap-2">
              <select
                className="border border-gray-200 rounded-lg px-3 py-2.5 sm:px-4 bg-white focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm sm:text-base font-medium"
                value={paymentStatusFilter || "all"}
                onChange={(e) => onPaymentStatusChange(e.target.value)}
              >
                <option value="all">{t("creditOrders.statusAll") || "All Status"}</option>
                <option value="paid">{t("creditOrders.statusFullyPaid") || "Fully Paid"}</option>
                <option value="pending">{t("creditOrders.statusPending") || "Pending Payment"}</option>
                <option value="partial">{t("creditOrders.statusPartial") || "Partially Paid"}</option>
                <option value="unpaid">{t("creditOrders.statusUnpaid") || "Unpaid"}</option>
              </select>
            </div>
          )}

          {/* Payment Method Filter */}
          <div className="flex items-center gap-2">
            <select
              className="border border-gray-200 rounded-lg px-3 py-2.5 sm:px-4 bg-white focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm sm:text-base"
              value={paymentMethodFilter}
              onChange={(e) => onPaymentMethodChange(e.target.value)}
            >
              <option value="all">{t("creditOrders.allmethod")}</option>
              <option value="cash">Cash</option>
              <option value="kpay">KBZ Pay</option>
              <option value="wavepay">Wave Pay</option>
              <option value="ayapay">AYA Pay</option>
              <option value="uabpay">UAB Pay</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="MMQR">MMQR</option>
              <option value="foc">FOC</option>
            </select>
          </div>

          {/* Results count */}
          <div className="text-sm text-slate-500 whitespace-nowrap">
            <span className="hidden sm:inline">
              {totalItems != null
                ? t("orders.showingOnPage")
                    .replace("{filtered}", String(filteredOrders.length))
                    .replace("{total}", String(totalItems))
                : t("orders.showing")
                    .replace("{filtered}", String(filteredOrders.length))
                    .replace("{total}", String(orders.length))}
            </span>
            <span className="sm:hidden">
              {filteredOrders.length}/
              {totalItems ?? orders.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
