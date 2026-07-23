import React from "react";
import { fetchShopSettings } from "../services/ShopSettings/fetchShopSettings";
import {
  getPrintShopBranding,
  preloadImage,
} from "../utils/printShopBranding";

interface ReceiptItem {
  name: string;
  code?: string;
  qty: number;
  price: number;
}

interface ReceiptData {
  invoiceNumber: string;
  storefrontName: string;
  date: string;
  items: ReceiptItem[];
  subtotal: number;
  discountPercent: number;
  total: number;
  paymentMethod: string;
  paidAmount?: number;
  change?: number;
  note?: string;
}

interface ThermalReceiptProps {
  order: ReceiptData;
  paperSize?: "57mm" | "58mm" | "80mm";
}

// const ThermalReceipt: React.FC<ThermalReceiptProps> = ({
//   order,
//   paperSize = "58mm",
// }) => {
//   // Standard thermal paper sizes: 57mm, 58mm, 80mm
//   const PAPER_WIDTH_MM = parseInt(paperSize) || 58;

//   // Adjust font sizes based on paper width - larger for better print visibility
//   const isWide = PAPER_WIDTH_MM >= 80;
//   const fontSize = {
//     title: isWide ? "26px" : "20px",
//     header: isWide ? "20px" : "14px",
//     item: isWide ? "20px" : "14px",
//     summary: isWide ? "19px" : "13px",
//     total: isWide ? "22px" : "16px",
//     footer: isWide ? "18px" : "12px",
//   };

//   const formatDate = (dateString: string) => {
//     if (!dateString) return "";
//     const date = new Date(dateString);
//     return date.toLocaleDateString("en-GB", {
//       day: "2-digit",
//       month: "short",
//       year: "2-digit",
//     });
//   };

//   const formatTime = (dateString: string) => {
//     if (!dateString) return "";
//     const date = new Date(dateString);
//     return date.toLocaleTimeString("en-US", {
//       hour: "2-digit",
//       minute: "2-digit",
//       hour12: true,
//     });
//   };

//   // Safety check - ensure we have order data
//   if (!order) {
//     return (
//       <div
//         className="thermal-receipt"
//         style={{ padding: "5px", textAlign: "center" }}
//       >
//         <p>No order data available</p>
//       </div>
//     );
//   }

//   // For thermal paper - no pagination needed (continuous roll)
//   const renderThermalReceipt = () => {
//     return (
//       <div
//         className="thermal-receipt-page"
//         style={{
//           width: `${PAPER_WIDTH_MM}mm`,
//           maxWidth: `${PAPER_WIDTH_MM}mm`,
//           fontFamily: "'Courier New', monospace",
//           fontSize: fontSize.header,
//           lineHeight: "1.3",
//           fontWeight: "bold",
//           backgroundColor: "white",
//           color: "#000000",
//           filter: "contrast(200%)",
//         }}
//       >
//         {/* Header */}
//         <div style={{ textAlign: "center", marginBottom: "1mm" }}>
//           <h2
//             style={{
//               fontSize: fontSize.title,
//               fontWeight: "900",
//               marginBottom: "1mm",
//               marginTop: "0",
//               textTransform: "uppercase",
//               letterSpacing: "0",
//             }}
//           >
//             i-mas ဖုန်းအပိုပစ္စည်း လက်ကားဒိုင်
//           </h2>
//         </div>

//         {/* Order Info */}
//         <div
//           style={{
//             borderTop: "1px dashed #000",
//             borderBottom: "1px dashed #000",
//             padding: "0.5mm 0",
//             margin: "1mm 0",
//           }}
//         >
//           <p
//             style={{
//               margin: "1px 0",
//               fontSize: fontSize.header,
//               fontWeight: "900",
//             }}
//           >
//             Order: {order.invoiceNumber}
//           </p>
//           <p
//             style={{
//               margin: "1px 0",
//               fontSize: fontSize.item,
//               fontWeight: "900",
//             }}
//           >
//             {formatDate(order.date)} {formatTime(order.date)}
//           </p>
//         </div>

//         {/* Items */}
//         <div style={{ marginBottom: "2mm" }}>
//           <div
//             style={{
//               borderBottom: "1px dashed #000",
//               paddingBottom: "1mm",
//               marginBottom: "2mm",
//               display: "flex",
//               justifyContent: "space-between",
//               fontSize: fontSize.header,
//               fontWeight: "900",
//             }}
//           >
//             <span style={{ flex: "1", textAlign: "left" }}>Item</span>
//             <span style={{ width: "55px", textAlign: "right" }}>Amt</span>
//           </div>

//           {order.items.length > 0 ? (
//             order.items.map((item, index) => (
//               <div
//                 key={`${item.code || item.name}-${index}`}
//                 style={{
//                   marginBottom: "1mm",
//                 }}
//               >
//                 <div
//                   style={{
//                     display: "flex",
//                     justifyContent: "space-between",
//                     alignItems: "flex-start",
//                   }}
//                 >
//                   <span
//                     style={{
//                       flex: "1",
//                       fontSize: fontSize.item,
//                       wordBreak: "break-word",
//                       paddingRight: "1mm",
//                       textAlign: "left",
//                       fontWeight: "900",
//                     }}
//                   >
//                     {item.name.substring(0, 25)}
//                     {item.name.length > 25 ? "..." : ""} x{item.qty}
//                   </span>
//                   <span
//                     style={{
//                       width: "55px",
//                       textAlign: "right",
//                       fontSize: fontSize.item,
//                       fontWeight: "900",
//                     }}
//                   >
//                     {(item.price * item.qty).toLocaleString()}
//                   </span>
//                 </div>
//               </div>
//             ))
//           ) : (
//             <p
//               style={{
//                 textAlign: "center",
//                 fontSize: fontSize.item,
//                 fontWeight: "900",
//               }}
//             >
//               No items
//             </p>
//           )}
//         </div>

//         {/* Summary */}
//         <div
//           style={{
//             borderTop: "1px dashed #000",
//             borderBottom: "1px dashed #000",
//             padding: "2mm 0",
//             marginBottom: "2mm",
//           }}
//         >
//           <div
//             style={{
//               display: "flex",
//               justifyContent: "space-between",
//               marginBottom: "1mm",
//               fontSize: fontSize.summary,
//               fontWeight: "900",
//             }}
//           >
//             <span>Subtotal</span>
//             <span>{order.subtotal.toLocaleString()}</span>
//           </div>

//           {order.discountPercent > 0 && (
//             <div
//               style={{
//                 display: "flex",
//                 justifyContent: "space-between",
//                 marginBottom: "1mm",
//                 fontSize: fontSize.summary,
//                 fontWeight: "900",
//               }}
//             >
//               <span>Discount</span>
//               <span style={{ fontWeight: "900" }}>
//                 {order.discountPercent}%
//               </span>
//             </div>
//           )}

//           <div
//             style={{
//               display: "flex",
//               justifyContent: "space-between",
//               marginTop: "2mm",
//               paddingTop: "2mm",
//               borderTop: "1px solid #000",
//               fontSize: fontSize.total,
//               fontWeight: "900",
//             }}
//           >
//             <span>TOTAL</span>
//             <span>{order.total.toLocaleString()}</span>
//           </div>

//           <div
//             style={{
//               display: "flex",
//               justifyContent: "space-between",
//               marginBottom: "1mm",
//               fontSize: fontSize.summary,
//               fontWeight: "900",
//             }}
//           >
//             <span>Payment</span>
//             <span>{order.paymentMethod}</span>
//           </div>

//           {order.paidAmount && (
//             <div
//               style={{
//                 display: "flex",
//                 justifyContent: "space-between",
//                 marginBottom: "1mm",
//                 fontSize: fontSize.summary,
//                 fontWeight: "900",
//               }}
//             >
//               <span>Paid</span>
//               <span>{order.paidAmount.toLocaleString()}</span>
//             </div>
//           )}

//           {order.change && order.change > 0 && (
//             <div
//               style={{
//                 display: "flex",
//                 justifyContent: "space-between",
//                 marginBottom: "1mm",
//                 fontSize: fontSize.summary,
//                 fontWeight: "900",
//               }}
//             >
//               <span>Change</span>
//               <span>{order.change.toLocaleString()}</span>
//             </div>
//           )}
//         </div>

//         {order.note && (
//           <div
//             style={{
//               marginBottom: "2mm",
//               fontSize: "11px",
//               fontStyle: "italic",
//               fontWeight: "900",
//             }}
//           >
//             Note: {order.note}
//           </div>
//         )}

//         {/* Footer */}
//         <div
//           style={{
//             textAlign: "center",
//             marginTop: "2mm",
//             paddingTop: "2mm",
//             borderTop: "1px dashed #000",
//             fontSize: fontSize.footer,
//           }}
//         >
//           <p
//             style={{
//               margin: "1mm 0",
//               fontSize: fontSize.item,
//               fontWeight: "900",
//             }}
//           >
//             Thank you!
//           </p>
//           <p style={{ margin: "1mm 0", opacity: 0.7, fontWeight: "900" }}>
//             IMAS POS System Receipt
//           </p>
//         </div>
//       </div>
//     );
//   };

//   return (
//     <div className="thermal-receipt-container thermal-receipt">
//       {renderThermalReceipt()}

//       {/* Print Styles for Thermal Paper - Continuous Roll (No Page Breaks) */}
//       <style>{`
//         @media print {
//           @page {
//             size: ${PAPER_WIDTH_MM}mm auto;
//             margin: 0;
//             padding: 0;
//           }
//           * {
//             -webkit-print-color-adjust: exact !important;
//             print-color-adjust: exact !important;
//             filter: contrast(200%) !important;
//             page-break-inside: avoid !important;
//             page-break-before: avoid !important;
//             page-break-after: avoid !important;
//             break-inside: avoid !important;
//             break-before: avoid !important;
//             break-after: avoid !important;
//           }
//           html, body {
//             margin: 0 !important;
//             padding: 0 !important;
//             width: ${PAPER_WIDTH_MM}mm !important;
//             height: auto !important;
//             overflow: visible !important;
//           }
//           body > *:not(#thermal-receipt-print-container) {
//             display: none !important;
//             visibility: hidden !important;
//           }
//           #thermal-receipt-print-container {
//             position: absolute !important;
//             left: 0 !important;
//             top: 0 !important;
//             width: ${PAPER_WIDTH_MM}mm !important;
//             height: auto !important;
//             margin: 0 !important;
//             padding: 0 !important;
//             background: white !important;
//             z-index: 99999 !important;
//             overflow: visible !important;
//             page-break-inside: avoid !important;
//             break-inside: avoid !important;
//           }
//           .thermal-receipt-container {
//             width: ${PAPER_WIDTH_MM}mm !important;
//             height: auto !important;
//             page-break-inside: avoid !important;
//             break-inside: avoid !important;
//           }
//           .thermal-receipt-page {
//             width: ${PAPER_WIDTH_MM}mm !important;
//             max-width: ${PAPER_WIDTH_MM}mm !important;
//             height: auto !important;
//             margin: 0 !important;
//             padding: 1mm 0.5mm !important;
//             background: white !important;
//             box-shadow: none !important;
//             border: none !important;
//             color: #000000 !important;
//             font-weight: bold !important;
//             filter: contrast(200%) !important;
//             page-break-inside: avoid !important;
//             break-inside: avoid !important;
//           }
//         }
//         @media screen {
//           .thermal-receipt-container {
//             display: flex;
//             justify-content: center;
//             padding: 20px;
//             background: #f5f5f5;
//           }
//           .thermal-receipt-page {
//             border: 1px solid #ccc;
//             box-shadow: 0 2px 8px rgba(0,0,0,0.15);
//             background: white;
//           }
//         }
//       `}</style>
//     </div>
//   );
// };

// Helper function to print receipt
export const printThermalReceipt = async (
  receiptData: ReceiptData,
  paperSize: string = "58mm",
) => {
  const shopResponse = await fetchShopSettings();
  const branding = getPrintShopBranding(shopResponse.data ?? null);
  if (branding.logo) {
    await preloadImage(branding.logo);
  }

  const contactParts = [
    branding.phone && `Tel: ${branding.phone}`,
    branding.website,
  ].filter(Boolean);

  const logoHeader = branding.logo
    ? `<img src="${branding.logo}" alt="${branding.shopName}" style="width: 18mm; height: 18mm; object-fit: contain; margin: 0 auto 2mm; display: block;" />`
    : "";

  // Create a hidden iframe for printing
  const iframe = document.createElement("iframe");
  iframe.style.position = "absolute";
  iframe.style.left = "-9999px";
  iframe.style.top = "-9999px";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "none";
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;

  if (!iframeDoc) {
    console.error("Failed to create print preview");
    document.body.removeChild(iframe);
    return;
  }

  // Generate receipt HTML
  const receiptHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice - ${receiptData.invoiceNumber}</title>
      <style>
        @page {
          size: ${paperSize} auto;
          margin: 0;
          padding: 0;
        }
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        html {
          margin: 0;
          padding: 0;
        }
        body {
          font-family: Arial, sans-serif;
          font-size: 11px;
          width: ${paperSize};
          max-width: ${paperSize};
          margin: 0 auto;
          padding: 2mm;
          line-height: 1.4;
          color: #000000 !important;
          background: white !important;
          height: auto;
          overflow: visible;
        }
        .thermal-receipt-page {
          width: 100%;
          background: white !important;
          color: #000000 !important;
        }
        .header {
          text-align: center;
          margin-bottom: 3mm;
          padding-bottom: 2mm;
        }
        .logo-text {
          font-size: 24px;
          font-weight: 900;
          color: #1E90FF;
          margin-bottom: 1mm;
          letter-spacing: -0.5px;
        }
        .tagline {
          font-size: 9px;
          color: #000;
          margin-bottom: 3mm;
        }
        .invoice-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 3mm;
          font-size: 10px;
          font-weight: bold;
        }
        .invoice-to {
          text-align: left;
        }
        .invoice-details {
          text-align: right;
        }
        .table-header {
          background: #1E90FF !important;
          color: white !important;
          padding: 2mm 1mm;
          display: grid;
          grid-template-columns: 15% 40% 15% 15% 15%;
          font-size: 10px;
          font-weight: bold;
          margin-bottom: 1mm;
        }
        .table-header > div {
          text-align: center;
        }
        .table-header > div:first-child {
          text-align: left;
        }
        .table-header > div:last-child {
          text-align: right;
        }
        .item-row {
          display: grid;
          grid-template-columns: 15% 40% 15% 15% 15%;
          padding: 1.5mm 1mm;
          border-bottom: 1px solid #e0e0e0;
          font-size: 10px;
        }
        .item-row > div {
          text-align: center;
          word-break: break-word;
        }
        .item-row > div:first-child {
          text-align: left;
        }
        .item-row > div:nth-child(2) {
          text-align: left;
        }
        .item-row > div:last-child {
          text-align: right;
          font-weight: bold;
        }
        .summary-section {
          margin-top: 3mm;
          display: flex;
          justify-content: space-between;
        }
        .payment-info {
          flex: 1;
          font-size: 9px;
        }
        .totals {
          width: 45%;
          font-size: 10px;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 1mm 0;
        }
        .total-row {
          background: #1E90FF !important;
          color: white !important;
          padding: 2mm 1mm;
          font-weight: bold;
          font-size: 11px;
          margin-top: 1mm;
        }
        .footer {
          margin-top: 4mm;
          padding-top: 2mm;
          border-top: 1px solid #000;
          text-align: center;
          font-size: 10px;
        }
        .thank-you {
          font-style: italic;
          margin-bottom: 2mm;
          font-weight: bold;
        }
        .contact-bar {
          background: #000 !important;
          color: white !important;
          padding: 1.5mm;
          font-size: 8px;
          margin-top: 2mm;
          display: flex;
          justify-content: space-between;
        }
        @media print {
          body {
            margin: 0 !important;
            padding: 2mm !important;
            width: ${paperSize} !important;
            height: auto !important;
            overflow: visible !important;
          }
          .thermal-receipt-page {
            box-shadow: none !important;
            border: none !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="thermal-receipt-page">
        <!-- Header with Logo -->
        <div class="header">
          ${logoHeader}
          <div class="logo-text">${branding.shopName}</div>
          ${branding.address ? `<div class="tagline">${branding.address}</div>` : ""}
        </div>
        
        <!-- Invoice Header -->
        <div class="invoice-header">
          <div class="invoice-to">
            <div style="font-weight: bold;">INVOICE TO:</div>
          </div>
          <div class="invoice-details">
            <div>INVOICE NO: ${receiptData.invoiceNumber}</div>
            <div>DATE: ${new Date(receiptData.date).toLocaleDateString("en-GB")}</div>
          </div>
        </div>
        
        <!-- Table Header -->
        <div class="table-header">
          <div>NO</div>
          <div>ITEM DESCRIPTION</div>
          <div>PRICE</div>
          <div>QTY.</div>
          <div>TOTAL</div>
        </div>
        
        <!-- Items -->
        ${receiptData.items
          .map(
            (item: any, index: number) => `
          <div class="item-row">
            <div>${index + 1}</div>
            <div>${item.name.substring(0, 30)}${item.name.length > 30 ? "..." : ""}</div>
            <div>${item.price.toLocaleString()}</div>
            <div>${item.qty}</div>
            <div>${(item.price * item.qty).toLocaleString()}</div>
          </div>
        `,
          )
          .join("")}
        
        <!-- Summary Section -->
        <div class="summary-section">
          <div class="payment-info">
            <div style="font-weight: bold; margin-bottom: 2mm;">Payment Info:</div>
            <div>Method: ${receiptData.paymentMethod}</div>
            ${receiptData.paidAmount ? `<div>Paid: ${receiptData.paidAmount.toLocaleString()} ${branding.currency}</div>` : ""}
            ${receiptData.change && receiptData.change > 0 ? `<div>Change: ${receiptData.change.toLocaleString()} ${branding.currency}</div>` : ""}
            ${receiptData.note ? `<div style="margin-top: 2mm; font-style: italic;">Note: ${receiptData.note}</div>` : ""}
          </div>
          <div class="totals">
            <div class="summary-row">
              <span>SUB TOTAL:</span>
              <span>${receiptData.subtotal.toLocaleString()}</span>
            </div>
            ${
              receiptData.discountPercent > 0
                ? `
              <div class="summary-row">
                <span>DISCOUNT:</span>
                <span>-${((receiptData.subtotal * receiptData.discountPercent) / 100).toLocaleString()}</span>
              </div>
            `
                : ""
            }
            <div class="summary-row total-row">
              <span>TOTAL:</span>
              <span>${receiptData.total.toLocaleString()} ${branding.currency}</span>
            </div>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <div class="thank-you">Thank you for your business!</div>
          <div style="font-size: 9px; margin-bottom: 1mm;">
            <div>Authorised Sign: _________________</div>
          </div>
        </div>
        
        <!-- Contact Bar -->
        <div class="contact-bar">
          <span>${contactParts.length > 0 ? contactParts.join(" | ") : branding.address || ""}</span>
          <span>${branding.shopName}</span>
        </div>
      </div>
    </body>
    </html>
  `;

  iframeDoc.open();
  iframeDoc.write(receiptHTML);
  iframeDoc.close();

  // Wait for content to load, then print
  iframe.onload = () => {
    setTimeout(() => {
      iframe.contentWindow?.print();
      // Clean up iframe after printing
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 500);
  };
};

// export default ThermalReceipt;
