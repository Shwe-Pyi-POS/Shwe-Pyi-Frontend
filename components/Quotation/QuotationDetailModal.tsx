import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  X,
  ArrowRightLeft,
  FileText,
  Loader2,
  Pencil,
  XCircle,
  ExternalLink,
  User,
  Phone,
  MapPin,
  Building,
  Calendar,
  ShoppingBag,
  Printer,
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "../../context/LanguageContext";
import {
  fetchQuotationById,
  updateQuotation,
} from "../../services/Quotation/quotationApi";
import {
  Quotation,
  getQuotationProducts,
  resolveInventoryId,
} from "../../services/Quotation/quotationTypes";
import { QuotationStatusBadge } from "./QuotationStatusBadge";
import { QuotationConvertModal } from "./QuotationConvertModal";
import { EditQuotationModal } from "./EditQuotationModal";
import { ConfirmModal } from "../Common/ConfirmModal";
import {
  formatMMK,
  formatQuotationDate,
  getStorefrontLabel,
} from "./quotationUtils";
import { getSavedPrintPaperSize } from "../../utils/printPaperSize";

interface QuotationDetailModalProps {
  isOpen: boolean;
  quotationId: string | null;
  onClose: () => void;
  onQuotationUpdate?: () => void;
  openConvertOnLoad?: boolean;
}

export const QuotationDetailModal: React.FC<QuotationDetailModalProps> = ({
  isOpen,
  quotationId,
  onClose,
  onQuotationUpdate,
  openConvertOnLoad = false,
}) => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [showConvert, setShowConvert] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const load = async () => {
    if (!quotationId) return;
    setLoading(true);
    const res = await fetchQuotationById(quotationId);
    if (res.success) {
      setQuotation(res.data);
    } else {
      toast.error(res.message);
      onClose();
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen && quotationId) {
      load();
      if (openConvertOnLoad) {
        setShowConvert(true);
      }
    } else {
      setQuotation(null);
      setShowConvert(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, quotationId, openConvertOnLoad]);

  const handleCancel = async () => {
    if (!quotation) return;
    setCancelling(true);
    const res = await updateQuotation(quotation._id, { status: "cancelled" });
    setCancelling(false);
    setShowCancelConfirm(false);
    if (res.success) {
      toast.success(t("quotation.cancelled"));
      setQuotation(res.data);
      if (onQuotationUpdate) onQuotationUpdate();
    } else {
      toast.error(res.message);
    }
  };

  const handlePrint = () => {
    if (!quotation) return;

    const products = getQuotationProducts(quotation);
    const cp = quotation.creditPersonId;
    const customerNameVal = typeof cp === "object" && cp ? cp.name : quotation.customerName;
    const customerPhoneVal = typeof cp === "object" && cp ? cp.phone : quotation.customerPhone;
    const customerAddressVal = typeof cp === "object" && cp ? cp.address : undefined;

    const receiptData = {
      documentType: "quotation",
      date: quotation.createdAt,
      invoiceNumber: quotation.quotationNumber,
      storefrontName: customerNameVal || "Walk-in Customer",
      items: products.map((p) => {
        const inv = p.inventoryId;
        const name = p.productName || (typeof inv === "object" ? inv.productName : "") || "Unknown Product";
        const code = p.productCode || (typeof inv === "object" ? inv.productCode : "") || "";
        return {
          name,
          code,
          qty: p.quantity,
          unit: p.unit || undefined,
          price: p.unitPrice || 0,
        };
      }),
      subtotal: quotation.subTotal || 0,
      tax: quotation.tax || 0,
      discountAmount: quotation.discount || 0,
      discountPercent: 0,
      total: quotation.finalAmount || 0,
      paymentMethod: t(`quotation.status.${quotation.status}`),
      note: quotation.note || undefined,
      customerName: customerNameVal || undefined,
      customerPhone: customerPhoneVal || undefined,
      customerAddress: customerAddressVal || undefined,
    };

    localStorage.setItem(
      `receipt_${quotation.quotationNumber}`,
      JSON.stringify(receiptData),
    );

    const paperSize = getSavedPrintPaperSize();
    navigate(
      `/print-receipt/${encodeURIComponent(quotation.quotationNumber)}?size=${paperSize}&autoprint=1`,
    );
  };

  const handleConvertSuccess = (orderId: string, orderNumber?: string) => {
    setShowConvert(false);
    onClose();
    if (onQuotationUpdate) onQuotationUpdate();
    if (orderNumber) {
      toast.success(`${t("quotation.convert.success")} — ${orderNumber}`);
    }
    navigate("/orders");
  };

  const convertedOrder =
    quotation && typeof quotation.convertedOrderId === "object"
      ? quotation.convertedOrderId
      : quotation && quotation.convertedOrderId
        ? { _id: quotation.convertedOrderId, orderNumber: undefined }
        : null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative border border-slate-100">

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-slate-800">
              {quotation ? quotation.quotationNumber : t("common.loading")}
            </h2>
            {quotation && <QuotationStatusBadge status={quotation.status} />}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200 text-slate-500 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {loading || !quotation ? (
            <div className="flex items-center justify-center py-20 text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              {t("common.loading")}
            </div>
          ) : (
            <>
              {/* Top Meta Info & Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatQuotationDate(quotation.createdAt)}
                  </span>
                  {quotation.createdBy?.name && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span>
                        {t("quotation.createdBy")}: <strong className="text-slate-700 font-medium">{quotation.createdBy.name}</strong>
                      </span>
                    </>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50 hover:text-slate-900 transition-colors active:scale-95"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print</span>
                  </button>

                  {quotation.status === "draft" && (
                    <>
                      <button
                        type="button"
                        onClick={() => setShowEditModal(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50 hover:text-slate-900 transition-colors active:scale-95"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        {t("common.edit")}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (quotation) {
                            if (quotation.saleType === "direct-sale") {
                              navigate("/direct-sale", { state: { quotationToConvert: quotation } });
                            } else {
                              navigate("/pos", { state: { quotationToConvert: quotation } });
                            }
                            onClose();
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary/95 shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/30 transition-all active:scale-95"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                        {t("quotation.convert.title")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCancelConfirm(true)}
                        disabled={cancelling}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-red-200 bg-white text-red-600 rounded-lg text-xs font-medium hover:bg-red-50 hover:border-red-300 disabled:opacity-50 transition-colors active:scale-95"
                      >
                        {cancelling ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5" />
                        )}
                        {t("quotation.cancel")}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {quotation.status === "converted" && convertedOrder && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                  <div>
                    <h4 className="font-semibold text-emerald-950 text-sm">
                      {t("quotation.convertedToOrder")}
                    </h4>
                    {convertedOrder.orderNumber && (
                      <p className="text-xs text-emerald-800 mt-0.5">
                        Order Reference Number: <span className="font-bold text-emerald-950">{convertedOrder.orderNumber}</span>
                      </p>
                    )}
                  </div>
                  <Link
                    to="/orders"
                    onClick={onClose}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-emerald-600 px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                  >
                    {t("quotation.viewOrders")}
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}

              {/* Products Card */}
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <h2 className="font-bold text-slate-800 flex items-center gap-2 text-xs uppercase tracking-wider">
                    <ShoppingBag className="w-4 h-4 text-primary" />
                    {t("quotation.products")}
                  </h2>
                  <span className="text-xs font-semibold px-2 py-0.5 bg-slate-200/60 rounded-full text-slate-600">
                    {getQuotationProducts(quotation).length} Items
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/30 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                        <th className="text-left px-4 py-2.5 w-10">#</th>
                        <th className="text-left px-4 py-2.5">{t("quotation.productName")}</th>
                        <th className="text-left px-4 py-2.5">{t("quotation.productCode")}</th>
                        <th className="text-center px-4 py-2.5">{t("quotation.unit")}</th>
                        <th className="text-center px-4 py-2.5">{t("common.quantity")}</th>
                        <th className="text-right px-4 py-2.5">{t("quotation.unitPrice")}</th>
                        <th className="text-right px-4 py-2.5">{t("common.total")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-slate-700">
                      {getQuotationProducts(quotation).map((p, idx) => {
                        const inv = p.inventoryId;
                        const name =
                          p.productName ||
                          (typeof inv === "object" ? inv.productName : "") ||
                          "—";
                        const code =
                          p.productCode ||
                          (typeof inv === "object" ? inv.productCode : "") ||
                          "—";
                        const unitPrice = p.unitPrice ?? 0;
                        const lineTotal = p.lineTotal ?? unitPrice * p.quantity;
                        return (
                          <tr key={resolveInventoryId(inv) + idx} className="hover:bg-slate-50/30 transition-colors">
                            <td className="px-4 py-2 text-slate-400 font-mono text-xs">{idx + 1}</td>
                            <td className="px-4 py-2 font-semibold text-slate-900">{name}</td>
                            <td className="px-4 py-2 font-mono text-xs text-slate-500">{code}</td>
                            <td className="px-4 py-2 text-center">
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-medium uppercase">
                                {p.unit || "—"}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-center font-semibold text-slate-800">{p.quantity}</td>
                            <td className="px-4 py-2 text-right text-slate-600">{formatMMK(unitPrice)}</td>
                            <td className="px-4 py-2 text-right font-bold text-slate-900">{formatMMK(lineTotal)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Customer Profile Card */}
              <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h2 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    {t("quotation.customerInfo")}
                  </h2>
                  {quotation.creditPersonId && typeof quotation.creditPersonId === "object" && (
                    <Link
                      to={`/credits?search=${encodeURIComponent(quotation.creditPersonId.name)}`}
                      onClick={onClose}
                      className="text-[10px] font-semibold bg-primary/10 text-primary hover:bg-primary/20 px-2 py-0.5 rounded flex items-center gap-0.5 transition-colors"
                    >
                      Ledger <ExternalLink className="w-2.5 h-2.5" />
                    </Link>
                  )}
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">{t("quotation.customerName")}</span>
                      <span className="font-bold text-slate-800 text-sm">
                        {typeof quotation.creditPersonId === "object" && quotation.creditPersonId
                          ? quotation.creditPersonId.name
                          : quotation.customerName || "Walk-in Customer"}
                      </span>
                    </div>
                  </div>

                  {(quotation.customerPhone || (typeof quotation.creditPersonId === "object" && quotation.creditPersonId?.phone)) && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">{t("quotation.customerPhone")}</span>
                        <span className="font-semibold text-slate-700 text-sm">
                          {typeof quotation.creditPersonId === "object" && quotation.creditPersonId
                            ? quotation.creditPersonId.phone
                            : quotation.customerPhone}
                        </span>
                      </div>
                    </div>
                  )}

                  {typeof quotation.creditPersonId === "object" && quotation.creditPersonId?.address && (
                    <div className="flex items-start gap-3 border-t border-slate-50 pt-2">
                      <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600 shrink-0">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">{t("common.address") || "Address"}</span>
                        <span className="text-xs font-medium text-slate-600 block mt-0.5 leading-normal whitespace-pre-wrap">
                          {quotation.creditPersonId.address}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Sale details Card */}
              <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm space-y-3">
                <h2 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Building className="w-4 h-4 text-primary" />
                  {t("quotation.saleInfo")}
                </h2>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-xs uppercase tracking-wide font-medium">{t("quotation.saleType")}:</span>
                    <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-xs">
                      {quotation.saleType === "direct-sale"
                        ? t("quotation.saleTypeDirectSale")
                        : t("quotation.saleTypeStorefront")}
                    </span>
                  </div>
                  {quotation.saleType === "storefront" && (
                    <div className="flex justify-between items-center border-t border-slate-50 pt-2">
                      <span className="text-slate-400 text-xs uppercase tracking-wide font-medium">{t("quotation.storefront")}:</span>
                      <span className="font-bold text-slate-800 text-xs">
                        {getStorefrontLabel(quotation.storefrontId)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Calculation Summary Card */}
              <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm space-y-3">
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider pb-2 border-b border-slate-100">
                  Quotation Summary
                </h3>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t("common.subtotal")}</span>
                    <span className="font-medium text-slate-800">{formatMMK(quotation.subTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t("common.tax")}</span>
                    <span className="font-medium text-slate-800 text-red-500">+{formatMMK(quotation.tax)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t("common.discount")}</span>
                    <span className="font-medium text-emerald-600">-{formatMMK(quotation.discount)}</span>
                  </div>

                  <div className="flex justify-between pt-2 border-t border-slate-100 items-baseline">
                    <span className="text-slate-900 font-bold text-sm">{t("quotation.finalAmount")}</span>
                    <span className="text-primary font-extrabold text-base font-mono tracking-tight">
                      {formatMMK(quotation.finalAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes Card */}
              {quotation.note && (
                <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm space-y-2">
                  <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                    {t("common.notes")}
                  </h3>
                  <p className="text-xs text-slate-600 bg-slate-50/80 p-3 rounded-lg border border-slate-100 whitespace-pre-wrap leading-relaxed">
                    {quotation.note}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showConvert && quotation && (
        <QuotationConvertModal
          quotation={quotation}
          open={showConvert}
          onClose={() => setShowConvert(false)}
          onSuccess={handleConvertSuccess}
        />
      )}

      {showEditModal && quotation && (
        <EditQuotationModal
          isOpen={showEditModal}
          quotationId={quotation._id}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            load();
            if (onQuotationUpdate) onQuotationUpdate();
          }}
        />
      )}

      {showCancelConfirm && quotation && (
        <ConfirmModal
          isOpen={showCancelConfirm}
          title={t("quotation.cancel") || "Cancel Quotation"}
          message={t("quotation.cancelConfirm") || "Are you sure you want to cancel this quotation?"}
          onConfirm={handleCancel}
          onCancel={() => setShowCancelConfirm(false)}
          isLoading={cancelling}
          confirmButtonColor="red"
        />
      )}
    </div>
  );
};
