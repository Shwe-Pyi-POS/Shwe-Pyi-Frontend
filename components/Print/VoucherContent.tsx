import React from "react";
import { PrintShopBranding } from "../../utils/printShopBranding";
import { PrintPaperSize } from "../../utils/printPaperSize";
import logo from "./../../public/shewpyi.jpg";

export interface VoucherReceiptItem {
  name: string;
  code: string;
  qty: number;
  /** Unit of measure, e.g. ကျင်း, မူး */
  unit?: string;
  price: number;
}

function formatReceiptQty(item: VoucherReceiptItem): string {
  return Number.isInteger(item.qty) ? String(item.qty) : String(item.qty);
}

function formatReceiptUnit(item: VoucherReceiptItem): string {
  return item.unit?.trim() || "—";
}

/** Item names longer than this get underline + 2-line wrap on 80mm thermal. */
const THERMAL_ITEM_LONG_CHARS = 12;

function adjustItemPriceForTransport(
  item: VoucherReceiptItem,
  transportFee: number,
  subtotal: number,
  perItemFees?: Record<string, number>,
): { adjustedPrice: number; adjustedTotal: number } {
  const code = item.code || "";
  const originalLineTotal = item.price * item.qty;

  // Per-item fees take priority (Custom Print)
  if (perItemFees && code && (perItemFees[code] ?? 0) > 0) {
    const fee = perItemFees[code];
    const adjustedTotal = Math.round(originalLineTotal + fee);
    const adjustedPrice = Math.round(adjustedTotal / item.qty);
    return { adjustedPrice, adjustedTotal };
  }

  // Normal Print: No per-item fees, return original prices
  return { adjustedPrice: item.price, adjustedTotal: originalLineTotal };
}

export type VoucherDocumentType = "invoice" | "quotation";

export interface VoucherReceiptData {
  invoiceNumber: string;
  storefrontName: string;
  date: string;
  items: VoucherReceiptItem[];
  subtotal: number;
  discountPercent: number;
  /** Fixed discount in MMK (quotations); shown when > 0 */
  discountAmount?: number;
  tax?: number;
  total: number;
  paymentMethod: string;
  paidAmount?: number;
  change?: number;
  note?: string;
  documentType?: VoucherDocumentType;
  creditPersonName?: string;
  /** Global transport fee (used for proportional distribution fallback) */
  transportFee?: number;
  /** Per-item transport fees keyed by product code */
  perItemTransportFees?: Record<string, number>;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
}

interface VoucherContentProps {
  receiptData: VoucherReceiptData;
  shopBranding: PrintShopBranding;
  paperSize: PrintPaperSize;
  formatDate: (dateString: string) => string;
}

export const VoucherContent: React.FC<VoucherContentProps> = ({
  receiptData,
  shopBranding,
  paperSize,
  formatDate,
}) => {
  console.log("VoucherContent receiptData", receiptData);
  const isThermal = paperSize === "thermal-80mm";
  const isQuotation = receiptData.documentType === "quotation";
  const transportFee = receiptData.transportFee ?? 0;
  const perItemFees = receiptData.perItemTransportFees;
  const totalPerItemFees = perItemFees
    ? receiptData.items.reduce(
        (sum, item) => sum + (perItemFees[item.code ?? ""] ?? 0),
        0,
      )
    : 0;
  const hasPerItemFees = totalPerItemFees > 0;
  const effectiveTransportFee = hasPerItemFees ? 0 : transportFee;
  const adjustedSubtotal = receiptData.subtotal + totalPerItemFees;
  const contactParts = [
    shopBranding.phone && `Tel: ${shopBranding.phone}`,
    shopBranding.website,
  ].filter(Boolean);
  console.log("receiptData", receiptData);

  return (
    <div className="voucher-container" data-paper={paperSize}>
      <div className="text-center mb-4 sm:mb-8">
        <img
          src={logo}
          alt="Shwe Pyi"
          className="voucher-logo mx-auto object-contain"
        />
        <h2 className="voucher-shop-name font-bold text-slate-800 mt-3">
          {shopBranding.shopName}
        </h2>
        {shopBranding.address && (
          <p className="voucher-address text-slate-600 mt-1">
            {shopBranding.address}
          </p>
        )}
      </div>

      <div
        className={`flex justify-between items-start mb-4 sm:mb-6 voucher-invoice-row ${
          isThermal ? "flex-col gap-1" : ""
        }`}
      >
        <div
          className={
            receiptData.customerName || receiptData.creditPersonName
              ? ""
              : "invisible"
          }
        >
          <p className="font-bold mb-0.5">BILL TO:</p>
          <p>{receiptData.customerName || receiptData.creditPersonName}</p>
          {receiptData.customerPhone && (
            <p className="text-xs">Ph: {receiptData.customerPhone}</p>
          )}
          {receiptData.customerAddress && (
            <p className="text-xs">{receiptData.customerAddress}</p>
          )}
        </div>
        <div className="flex flex-col items-end">
          <div>
            <p className="font-bold">DATE: {formatDate(receiptData.date)}</p>
          </div>
          <div className={isThermal ? "" : "text-right"}>
            <p className="font-bold mb-0.5">
              {isQuotation ? "QUOTATION NO" : "INVOICE NO"} :{" "}
              {receiptData.invoiceNumber}
            </p>
          </div>
        </div>
      </div>

      {isThermal ? (
        <div className="mb-4 voucher-thermal-table">
          <div className="voucher-thermal-header">
            <div>NO</div>
            <div>ITEM</div>
            <div className="voucher-thermal-col-price">PRICE</div>
            <div className="voucher-thermal-col-qty">QTY</div>
            <div>UNIT</div>
            <div className="voucher-thermal-col-total">TOTAL</div>
          </div>
          {receiptData.items.map((item, index) => {
            const { adjustedPrice, adjustedTotal } =
              adjustItemPriceForTransport(
                item,
                effectiveTransportFee,
                receiptData.subtotal,
                perItemFees,
              );
            return (
              <div key={index} className="voucher-thermal-item">
                <div>{index + 1}</div>
                <div
                  className={`voucher-thermal-col-item ${
                    item.name.length > THERMAL_ITEM_LONG_CHARS ? "is-long" : ""
                  }`}
                  title={item.name}
                >
                  {item.name}
                </div>
                <div className="voucher-thermal-col-price">
                  {adjustedPrice.toLocaleString()}
                </div>
                <div className="voucher-thermal-col-qty">
                  {formatReceiptQty(item)}
                </div>
                <div className="break-words">{formatReceiptUnit(item)}</div>
                <div className="voucher-thermal-col-total">
                  {adjustedTotal.toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mb-6 sm:mb-8">
          <table className="voucher-table">
            <thead>
              <tr>
                <th style={{ width: "8%" }}>NO</th>
                <th style={{ width: "8%" }}>CODE</th>
                <th style={{ width: "38%" }}>ITEM DESCRIPTION</th>
                <th style={{ width: "12%" }}>PRICE</th>
                <th style={{ width: "10%" }}>QTY.</th>
                <th style={{ width: "12%" }}>UNIT</th>
                <th style={{ width: "12%" }}>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {receiptData.items.map((item, index) => {
                const { adjustedPrice, adjustedTotal } =
                  adjustItemPriceForTransport(
                    item,
                    effectiveTransportFee,
                    receiptData.subtotal,
                    perItemFees,
                  );
                return (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{item.code}</td>
                    <td>{item.name}</td>
                    <td>{adjustedPrice.toLocaleString()}</td>
                    <td>{formatReceiptQty(item)}</td>
                    <td>{formatReceiptUnit(item)}</td>
                    <td>{adjustedTotal.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div
        className={`voucher-summary-grid ${
          isThermal ? "" : "grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8"
        }`}
      >
        <div>
          <div className="mb-3 sm:mb-6">
            {isQuotation ? (
              <>
                <p className="font-bold mb-1">Document:</p>
                <p>{receiptData.paymentMethod}</p>
                <p className="text-xs text-slate-600 mt-1">
                  Prices are estimates. Not a final invoice.
                </p>
              </>
            ) : (
              <>
                <p className="font-bold mb-1">Payment Info:</p>
                <p>Method: {receiptData.paymentMethod}</p>
                {receiptData.paidAmount != null && (
                  <p>
                    Paid: {receiptData.paidAmount.toLocaleString()}{" "}
                    {shopBranding.currency}
                  </p>
                )}
                {receiptData.change != null && receiptData.change > 0 && (
                  <p>
                    Change: {receiptData.change.toLocaleString()}{" "}
                    {shopBranding.currency}
                  </p>
                )}
              </>
            )}
          </div>
          {receiptData.note && (
            <p className="italic">Note: {receiptData.note}</p>
          )}
        </div>

        <div>
          <div className="flex justify-between mb-1 sm:mb-2">
            <span>SUB TOTAL:</span>
            <span>{adjustedSubtotal.toLocaleString()}</span>
          </div>
          {(receiptData.tax ?? 0) > 0 && (
            <div className="flex justify-between mb-1 sm:mb-2">
              <span>TAX:</span>
              <span>+{(receiptData.tax ?? 0).toLocaleString()}</span>
            </div>
          )}
          {(receiptData.discountAmount ?? 0) > 0 && (
            <div className="flex justify-between mb-1 sm:mb-2">
              <span>DISCOUNT:</span>
              <span>-{(receiptData.discountAmount ?? 0).toLocaleString()}</span>
            </div>
          )}
          {receiptData.discountPercent > 0 && (
            <div className="flex justify-between mb-1 sm:mb-2">
              <span>DISCOUNT ({receiptData.discountPercent}%):</span>
              <span>
                -
                {(
                  (receiptData.subtotal * receiptData.discountPercent) /
                  100
                ).toLocaleString()}
              </span>
            </div>
          )}
          {effectiveTransportFee > 0 && (
            <div className="flex justify-between mb-1 sm:mb-2">
              <span>TRANSPORT FEE:</span>
              <span>+{effectiveTransportFee.toLocaleString()}</span>
            </div>
          )}
          <div
            className="voucher-total-bar flex justify-between font-bold text-white"
            style={{ backgroundColor: "#1E90FF" }}
          >
            <span>TOTAL:</span>
            <span>
              {receiptData.total.toLocaleString()} {shopBranding.currency}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-8 sm:mt-16 text-center">
        <p className="voucher-footer-title font-bold italic mb-1">
          {isQuotation
            ? "Thank you — please confirm before ordering."
            : "Thank you for your business!"}
        </p>
        <div className="voucher-sign border-t border-gray-300 mt-6 sm:mt-8 pt-4">
          <p className="text-xs text-right">
            Authorised Sign: _________________
          </p>
        </div>
      </div>

      <div
        className="voucher-contact-bar mt-4 sm:mt-6 py-2 sm:py-3 px-3 sm:px-4 flex justify-between text-white text-xs"
        style={{ backgroundColor: "#000" }}
      >
        <span>
          {contactParts.length > 0
            ? `Contact: ${contactParts.join(" | ")}`
            : shopBranding.address || ""}
        </span>
        <span>{shopBranding.shopName}</span>
      </div>
    </div>
  );
};
