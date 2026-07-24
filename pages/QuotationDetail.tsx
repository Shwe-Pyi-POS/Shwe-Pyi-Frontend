import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
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
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "../context/LanguageContext";
import {
  fetchQuotationById,
  updateQuotation,
} from "../services/Quotation/quotationApi";
import {
  Quotation,
  getQuotationProducts,
  resolveInventoryId,
} from "../services/Quotation/quotationTypes";
import { QuotationStatusBadge } from "../components/Quotation/QuotationStatusBadge";
import { QuotationConvertModal } from "../components/Quotation/QuotationConvertModal";
import { ConfirmModal } from "../components/Common/ConfirmModal";
import {
  formatMMK,
  formatQuotationDate,
  getStorefrontLabel,
} from "../components/Quotation/quotationUtils";

export const QuotationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [showConvert, setShowConvert] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    const res = await fetchQuotationById(id);
    if (res.success) {
      setQuotation(res.data);
    } else {
      toast.error(res.message);
      navigate("/quotations");
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [id]);

  useEffect(() => {
    const state = location.state as { openConvert?: boolean } | null;
    if (state?.openConvert && quotation?.status === "draft") {
      setShowConvert(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, quotation, navigate]);

  const handleCancel = async () => {
    if (!quotation) return;
    setCancelling(true);
    const res = await updateQuotation(quotation._id, { status: "cancelled" });
    setCancelling(false);
    setShowCancelConfirm(false);
    if (res.success) {
      toast.success(t("quotation.cancelled"));
      setQuotation(res.data);
    } else {
      toast.error(res.message);
    }
  };

  const handleConvertSuccess = (orderId: string, orderNumber?: string) => {
    setShowConvert(false);
    load();
    if (orderNumber) {
      toast.success(`${t("quotation.convert.success")} — ${orderNumber}`);
    }
  };

  if (loading || !quotation) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        {t("common.loading")}
      </div>
    );
  }

  const products = getQuotationProducts(quotation);
  const convertedOrder =
    typeof quotation.convertedOrderId === "object"
      ? quotation.convertedOrderId
      : quotation.convertedOrderId
        ? { _id: quotation.convertedOrderId, orderNumber: undefined }
        : null;

  const creditPerson = quotation.creditPersonId && typeof quotation.creditPersonId === "object"
    ? quotation.creditPersonId
    : null;

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-5">
      {/* Top Navigation & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm transition-all">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/quotations")}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-600 transition-all active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2 tracking-tight">
                <FileText className="w-6 h-6 text-primary shrink-0" />
                {quotation.quotationNumber}
              </h1>
              <QuotationStatusBadge status={quotation.status} />
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-slate-500 mt-1">
              <span className="flex items-center gap-1.5">
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
          </div>
        </div>

        {quotation.status === "draft" && (
          <div className="flex flex-wrap gap-2 sm:self-center">
            <button
              type="button"
              onClick={() => navigate(`/quotations/${quotation._id}/edit`)}
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 hover:text-slate-900 transition-colors active:scale-95"
            >
              <Pencil className="w-4 h-4" />
              {t("common.edit")}
            </button>
            <button
              type="button"
              onClick={() => {
                if (quotation.saleType === "direct-sale") {
                  navigate("/direct-sale", { state: { quotationToConvert: quotation } });
                } else {
                  navigate("/pos", { state: { quotationToConvert: quotation } });
                }
              }}
              className="inline-flex items-center gap-1.5 px-4.5 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/95 shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/30 transition-all active:scale-95"
            >
              <ArrowRightLeft className="w-4 h-4" />
              {t("quotation.convert.title")}
            </button>
            <button
              type="button"
              onClick={() => setShowCancelConfirm(true)}
              disabled={cancelling}
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-red-200 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 hover:border-red-300 disabled:opacity-50 transition-colors active:scale-95"
            >
              {cancelling ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              {t("quotation.cancel")}
            </button>
          </div>
        )}
      </div>

      {quotation.status === "converted" && convertedOrder && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-pulse">
          <div>
            <h4 className="font-semibold text-emerald-950 text-sm sm:text-base">
              {t("quotation.convertedToOrder")}
            </h4>
            {convertedOrder.orderNumber && (
              <p className="text-xs sm:text-sm text-emerald-800 mt-0.5">
                Order Reference Number: <span className="font-bold text-emerald-950">{convertedOrder.orderNumber}</span>
              </p>
            )}
          </div>
          <Link
            to="/orders"
            className="inline-flex items-center gap-1 text-sm font-semibold text-white bg-emerald-600 px-4 py-2 rounded-xl hover:bg-emerald-700 transition-colors shadow-sm self-start sm:self-center"
          >
            {t("quotation.viewOrders")}
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Stacked Cards Layout */}
      <div className="space-y-5">

        {/* Products Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h2 className="font-bold text-slate-800 flex items-center gap-2 text-sm uppercase tracking-wider">
              <ShoppingBag className="w-4 h-4 text-primary" />
              {t("quotation.products")}
            </h2>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-200/60 rounded-full text-slate-600">
              {products.length} {products.length > 1 ? "Items" : "Item"}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/30 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                  <th className="text-left px-5 py-3.5 w-12">#</th>
                  <th className="text-left px-5 py-3.5">{t("quotation.productName")}</th>
                  <th className="text-left px-5 py-3.5">{t("quotation.productCode")}</th>
                  <th className="text-center px-5 py-3.5">{t("quotation.unit")}</th>
                  <th className="text-center px-5 py-3.5">{t("common.quantity")}</th>
                  <th className="text-right px-5 py-3.5">{t("quotation.unitPrice")}</th>
                  <th className="text-right px-5 py-3.5">{t("common.total")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-700">
                {products.map((p, idx) => {
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
                      <td className="px-5 py-3 text-slate-400 font-mono text-xs">{idx + 1}</td>
                      <td className="px-5 py-3 font-semibold text-slate-900">{name}</td>
                      <td className="px-5 py-3 font-mono text-xs text-slate-500">{code}</td>
                      <td className="px-5 py-3 text-center">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-medium uppercase">
                          {p.unit || "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center font-semibold text-slate-800">{p.quantity}</td>
                      <td className="px-5 py-3 text-right text-slate-600">{formatMMK(unitPrice)}</td>
                      <td className="px-5 py-3 text-right font-bold text-slate-900">{formatMMK(lineTotal)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Customer Profile Card */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              {t("quotation.customerInfo")}
            </h2>
            {creditPerson && (
              <Link
                to={`/credits?search=${encodeURIComponent(creditPerson.name)}`}
                className="text-[11px] font-semibold bg-primary/10 text-primary hover:bg-primary/20 px-2 py-0.5 rounded-md flex items-center gap-0.5 transition-colors"
              >
                Profile <ExternalLink className="w-2.5 h-2.5" />
              </Link>
            )}
          </div>

          <div className="space-y-3.5">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/5 flex items-center justify-center text-primary shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs text-slate-400 block">{t("quotation.customerName")}</span>
                <span className="font-bold text-slate-800 text-sm">
                  {creditPerson?.name || quotation.customerName || "Walk-in Customer"}
                </span>
              </div>
            </div>

            {(creditPerson?.phone || quotation.customerPhone) && (
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">{t("quotation.customerPhone")}</span>
                  <span className="font-semibold text-slate-700 text-sm">
                    {creditPerson?.phone || quotation.customerPhone}
                  </span>
                </div>
              </div>
            )}

            {creditPerson?.address && (
              <div className="flex items-start gap-3 border-t border-slate-50 pt-3">
                <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">{t("common.address") || "Address"}</span>
                  <span className="text-xs font-medium text-slate-600 block mt-0.5 leading-normal whitespace-pre-wrap">
                    {creditPerson.address}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sale details Card */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
          <h2 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-slate-100">
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
                <span className="font-bold text-slate-800 text-sm">
                  {getStorefrontLabel(quotation.storefrontId)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Calculation Summary Card */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-3.5">
          <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider pb-2 border-b border-slate-100">
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

            <div className="flex justify-between pt-3 border-t border-slate-100 items-baseline">
              <span className="text-slate-900 font-bold text-base">{t("quotation.finalAmount")}</span>
              <span className="text-primary font-extrabold text-xl font-mono tracking-tight">
                {formatMMK(quotation.finalAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Notes Card */}
        {quotation.note && (
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-2">
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">
              {t("common.notes")}
            </h3>
            <p className="text-sm text-slate-600 bg-slate-50/80 p-4 rounded-xl border border-slate-100 whitespace-pre-wrap leading-relaxed">
              {quotation.note}
            </p>
          </div>
        )}

      </div>

      {showConvert && (
        <QuotationConvertModal
          quotation={quotation}
          open={showConvert}
          onClose={() => setShowConvert(false)}
          onSuccess={handleConvertSuccess}
        />
      )}

      {showCancelConfirm && (
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
