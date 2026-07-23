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
    if (!quotation || !window.confirm(t("quotation.cancelConfirm"))) return;
    setCancelling(true);
    const res = await updateQuotation(quotation._id, { status: "cancelled" });
    setCancelling(false);
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
    navigate("/orders");
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
  console.log("products", products);
  const convertedOrder =
    typeof quotation.convertedOrderId === "object"
      ? quotation.convertedOrderId
      : quotation.convertedOrderId
        ? { _id: quotation.convertedOrderId, orderNumber: undefined }
        : null;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => navigate("/quotations")}
            className="p-2 rounded-lg border hover:bg-slate-50 mt-0.5"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-6 h-6 text-primary" />
                {quotation.quotationNumber}
              </h1>
              <QuotationStatusBadge status={quotation.status} />
            </div>
            <p className="text-sm text-slate-500 mt-1">
              {t("common.date")}: {formatQuotationDate(quotation.createdAt)}
              {quotation.createdBy?.name && (
                <>
                  {" "}
                  · {t("quotation.createdBy")}: {quotation.createdBy.name}
                </>
              )}
            </p>
          </div>
        </div>

        {quotation.status === "draft" && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigate(`/quotations/${quotation._id}/edit`)}
              className="inline-flex items-center gap-1.5 px-4 py-2 border rounded-lg text-sm font-medium hover:bg-slate-50"
            >
              <Pencil className="w-4 h-4" />
              {t("common.edit")}
            </button>
            <button
              type="button"
              onClick={() => setShowConvert(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90"
            >
              <ArrowRightLeft className="w-4 h-4" />
              {t("quotation.convert.title")}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={cancelling}
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50"
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
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-center justify-between gap-3">
          <p className="text-sm text-emerald-800">
            {t("quotation.convertedToOrder")}
            {convertedOrder.orderNumber && (
              <span className="font-semibold ml-1">
                {convertedOrder.orderNumber}
              </span>
            )}
          </p>
          <Link
            to="/orders"
            className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:underline"
          >
            {t("quotation.viewOrders")}
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border p-4 space-y-2 text-sm">
          <h2 className="font-semibold text-slate-800 mb-2">
            {t("quotation.customerInfo")}
          </h2>
          <p>
            <span className="text-slate-500">
              {t("quotation.customerName")}:
            </span>{" "}
            {quotation.customerName || "—"}
          </p>
          <p>
            <span className="text-slate-500">
              {t("quotation.customerPhone")}:
            </span>{" "}
            {quotation.customerPhone || "—"}
          </p>
          <p>
            <span className="text-slate-500">{t("common.notes")}:</span>{" "}
            {quotation.note || "—"}
          </p>
        </div>
        <div className="bg-white rounded-xl border p-4 space-y-2 text-sm">
          <h2 className="font-semibold text-slate-800 mb-2">
            {t("quotation.saleInfo")}
          </h2>
          <p>
            <span className="text-slate-500">{t("quotation.saleType")}:</span>{" "}
            {quotation.saleType === "direct-sale"
              ? t("quotation.saleTypeDirectSale")
              : t("quotation.saleTypeStorefront")}
          </p>
          {quotation.saleType === "storefront" && (
            <p>
              <span className="text-slate-500">
                {t("quotation.storefront")}:
              </span>{" "}
              {getStorefrontLabel(quotation.storefrontId)}
            </p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-4 py-3 border-b font-semibold text-slate-800">
          {t("quotation.products")}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-2 w-10">#</th>
                <th className="text-left px-4 py-2">
                  {t("quotation.productName")}
                </th>
                <th className="text-left px-4 py-2">
                  {t("quotation.productCode")}
                </th>
                <th className="text-left px-4 py-2">{t("quotation.unit")}</th>
                <th className="text-right px-4 py-2">{t("common.quantity")}</th>
                <th className="text-right px-4 py-2">
                  {t("quotation.unitPrice")}
                </th>
                <th className="text-right px-4 py-2">{t("common.total")}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map((p, idx) => {
                console.log(p);
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
                  <tr key={resolveInventoryId(inv) + idx}>
                    <td className="px-4 py-2 text-slate-400">{idx + 1}</td>
                    <td className="px-4 py-2 font-medium">{name}</td>
                    <td className="px-4 py-2 text-slate-600">{code}</td>
                    <td className="px-4 py-2">{p.unit || "—"}</td>
                    <td className="px-4 py-2 text-right">{p.quantity}</td>
                    <td className="px-4 py-2 text-right">
                      {formatMMK(unitPrice)}
                    </td>
                    <td className="px-4 py-2 text-right font-medium">
                      {formatMMK(lineTotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-4 max-w-sm ml-auto space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-600">{t("common.subtotal")}</span>
          <span>{formatMMK(quotation.subTotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600">{t("common.tax")}</span>
          <span>{formatMMK(quotation.tax)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600">{t("common.discount")}</span>
          <span>{formatMMK(quotation.discount)}</span>
        </div>
        <div className="flex justify-between pt-2 border-t font-bold text-base">
          <span>{t("quotation.finalAmount")}</span>
          <span className="text-primary">
            {formatMMK(quotation.finalAmount)}
          </span>
        </div>
      </div>

      {showConvert && (
        <QuotationConvertModal
          quotation={quotation}
          open={showConvert}
          onClose={() => setShowConvert(false)}
          onSuccess={handleConvertSuccess}
        />
      )}
    </div>
  );
};
