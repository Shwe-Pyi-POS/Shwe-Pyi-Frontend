import React, { useEffect, useMemo, useState } from "react";
import { Loader2, X, ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "../../context/LanguageContext";
import {
  Quotation,
  getQuotationProducts,
  resolveInventoryId,
} from "../../services/Quotation/quotationTypes";
import { markQuotationAsConverted } from "../../services/Quotation/quotationApi";
import { createOrder } from "../../services/Order/createOrder";
import {
  fetchCreditPersonas,
  CreditPersona,
} from "../../services/Credit/fetchCreditPersonas";
import { formatMMK } from "./quotationUtils";
import { buildOrderProductLine } from "../../utils/uom";

const PAYMENT_METHODS = [
  { value: "cash", labelKey: "quotation.payment.cash" },
  { value: "bank_transfer", labelKey: "quotation.payment.bankTransfer" },
  { value: "mobile_payment", labelKey: "quotation.payment.mobilePayment" },
  { value: "card", labelKey: "quotation.payment.card" },
] as const;

interface QuotationConvertModalProps {
  quotation: Quotation;
  open: boolean;
  onClose: () => void;
  onSuccess: (orderId: string, orderNumber?: string) => void;
}

export const QuotationConvertModal: React.FC<QuotationConvertModalProps> = ({
  quotation,
  open,
  onClose,
  onSuccess,
}) => {
  const { t } = useLanguage();
  const [tax, setTax] = useState(quotation.tax || 0);
  const [discount, setDiscount] = useState(quotation.discount || 0);
  const [finalAmount, setFinalAmount] = useState(quotation.finalAmount || 0);
  const [manualFinal, setManualFinal] = useState(false);
  const [paymentType, setPaymentType] = useState<"paid" | "credit">("paid");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paidAmount, setPaidAmount] = useState(quotation.finalAmount || 0);
  const [creditPersonas, setCreditPersonas] = useState<CreditPersona[]>([]);
  const [creditPersonId, setCreditPersonId] = useState("");
  const [processing, setProcessing] = useState(false);

  const subTotal = quotation.subTotal || 0;

  useEffect(() => {
    if (!open) return;
    setTax(quotation.tax || 0);
    setDiscount(quotation.discount || 0);
    setFinalAmount(quotation.finalAmount || 0);
    setPaidAmount(quotation.finalAmount || 0);
    setManualFinal(false);

    const qCpId = typeof quotation.creditPersonId === "object"
      ? quotation.creditPersonId?._id
      : quotation.creditPersonId;

    if (qCpId) {
      setPaymentType("credit");
      setCreditPersonId(qCpId);
      setPaidAmount(0);
    } else {
      setPaymentType("paid");
      setCreditPersonId("");
    }
    setPaymentMethod("cash");
  }, [open, quotation]);

  useEffect(() => {
    if (!manualFinal) {
      const computed = Math.max(0, subTotal + tax - discount);
      setFinalAmount(computed);
      if (paymentType === "paid") setPaidAmount(computed);
    }
  }, [subTotal, tax, discount, manualFinal, paymentType]);

  useEffect(() => {
    if (open) {
      fetchCreditPersonas().then((res) => {
        if (res.success) setCreditPersonas(res.data || []);
      });
    }
  }, [open]);

  const products = useMemo(() => getQuotationProducts(quotation), [quotation]);

  const orderProducts = useMemo(
    () =>
      products.map((p) => {
        const invId = resolveInventoryId(p.inventoryId);
        const baseUnit =
          typeof p.inventoryId === "object"
            ? p.inventoryId.unitOfMeasure?.trim() || "piece"
            : "piece";
        const unit = p.unit || baseUnit;
        return buildOrderProductLine(invId, p.quantity, baseUnit, unit);
      }),
    [products],
  );

  const handleConvert = async () => {
    if (paymentType === "credit" && !creditPersonId) {
      toast.error(t("quotation.convert.creditPersonRequired"));
      return;
    }
    if (finalAmount < 0) {
      toast.error(t("quotation.form.invalidFinalAmount"));
      return;
    }

    setProcessing(true);
    try {
      const selectedPersona = creditPersonas.find((p) => p._id === creditPersonId);
      const storefrontId =
        typeof quotation.storefrontId === "object"
          ? quotation.storefrontId?._id
          : quotation.storefrontId || undefined;

      const orderPayload: Parameters<typeof createOrder>[0] = {
        saleType: quotation.saleType,
        customerName: selectedPersona?.name || quotation.customerName,
        customerPhone: selectedPersona?.phone || quotation.customerPhone,
        customerAddress: selectedPersona?.address || undefined,
        note: quotation.note,
        ordersProducts: orderProducts,
        subTotal,
        tax,
        discount,
        finalAmount,
        paidAmount: paymentType === "credit" ? 0 : paidAmount,
        paymentType,
        paymentMethod,
        creditPersonId: creditPersonId || undefined,
      };

      if (quotation.saleType === "storefront" && storefrontId) {
        orderPayload.storefrontId = storefrontId;
      }

      const orderRes = await createOrder(orderPayload);
      if (!orderRes.success || !orderRes.data?._id) {
        toast.error(orderRes.message || t("quotation.convert.orderFailed"));
        return;
      }

      const orderId = orderRes.data._id as string;
      const markRes = await markQuotationAsConverted(quotation._id, orderId);

      if (!markRes.success) {
        toast.warning(t("quotation.convert.markFailed"), {
          description: orderRes.data?.orderNumber
            ? `Order ${orderRes.data.orderNumber} was created.`
            : undefined,
        });
      } else {
        toast.success(t("quotation.convert.success"));
      }

      onSuccess(orderId, orderRes.data?.orderNumber);
    } catch {
      toast.error(t("quotation.convert.orderFailed"));
    } finally {
      setProcessing(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="convert-modal-title"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-primary" />
            <h2 id="convert-modal-title" className="text-lg font-semibold text-slate-800">
              {t("quotation.convert.title")}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={processing}
            className="p-1.5 rounded-lg hover:bg-slate-100"
            aria-label={t("common.close")}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="rounded-lg bg-slate-50 p-3 text-sm space-y-1">
            <p>
              <span className="text-slate-500">{t("quotation.quotationNumber")}:</span>{" "}
              <span className="font-medium">{quotation.quotationNumber}</span>
            </p>
            <p>
              <span className="text-slate-500">{t("quotation.customer")}:</span>{" "}
              {quotation.customerName || "—"}
            </p>
            <p>
              <span className="text-slate-500">{t("quotation.products")}:</span>{" "}
              {products.length} {t("quotation.items")}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t("common.tax")}
              </label>
              <input
                type="number"
                min={0}
                value={tax}
                onChange={(e) => setTax(Number(e.target.value) || 0)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t("common.discount")}
              </label>
              <input
                type="number"
                min={0}
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t("quotation.finalAmount")}
            </label>
            <input
              type="number"
              min={0}
              value={finalAmount}
              onChange={(e) => {
                setManualFinal(true);
                const v = Number(e.target.value) || 0;
                setFinalAmount(v);
                if (paymentType === "paid") setPaidAmount(v);
              }}
              className="w-full border rounded-lg px-3 py-2 text-sm font-semibold"
            />
            {!manualFinal && (
              <p className="text-xs text-slate-500 mt-1">
                {formatMMK(subTotal + tax - discount)} ({t("quotation.autoCalculated")})
              </p>
            )}
          </div>

          <div>
            <span className="block text-sm font-medium text-slate-700 mb-2">
              {t("quotation.paymentType")}
            </span>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="paymentType"
                  checked={paymentType === "paid"}
                  onChange={() => {
                    setPaymentType("paid");
                    setPaidAmount(finalAmount);
                  }}
                />
                {t("quotation.payment.paid")}
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="paymentType"
                  checked={paymentType === "credit"}
                  onChange={() => setPaymentType("credit")}
                />
                {t("quotation.payment.credit")}
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t("quotation.paymentMethod")}
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {t(m.labelKey)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t("quotation.paidAmount")}
            </label>
            <input
              type="number"
              min={0}
              value={paidAmount}
              onChange={(e) => setPaidAmount(Number(e.target.value) || 0)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>

          {paymentType === "credit" && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t("quotation.creditPerson")} *
              </label>
              <select
                value={creditPersonId}
                onChange={(e) => setCreditPersonId(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                <option value="">{t("quotation.selectCreditPerson")}</option>
                {creditPersonas.map((cp) => (
                  <option key={cp._id} value={cp._id}>
                    {cp.name} {cp.phone ? `(${cp.phone})` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex gap-3 px-5 py-4 border-t bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            disabled={processing}
            className="flex-1 px-4 py-2.5 border rounded-lg text-sm font-medium hover:bg-white"
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={handleConvert}
            disabled={processing}
            className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t("common.processing")}
              </>
            ) : (
              t("quotation.convert.confirm")
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
