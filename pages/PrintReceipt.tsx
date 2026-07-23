import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { fetchShopSettings } from "../services/ShopSettings/fetchShopSettings";
import {
  getPrintShopBranding,
  preloadImage,
  PrintShopBranding,
} from "../utils/printShopBranding";
import {
  getPrintPaperStyles,
  getSavedPrintPaperSize,
  getSharedTableStyles,
  parsePrintPaperSize,
  PrintPaperSize,
  savePrintPaperSize,
} from "../utils/printPaperSize";
import { PrintPaperSizeSelector } from "../components/Print/PrintPaperSizeSelector";
import {
  VoucherContent,
  VoucherReceiptData,
} from "../components/Print/VoucherContent";

const loadReceiptData = (
  orderId: string | undefined,
): VoucherReceiptData | null => {
  if (!orderId) return null;

  const storedData = localStorage.getItem(`receipt_${orderId}`);
  if (storedData) {
    try {
      return JSON.parse(storedData) as VoucherReceiptData;
    } catch {
      return null;
    }
  }

  const dataParam = new URLSearchParams(window.location.search).get("data");
  if (dataParam) {
    try {
      return JSON.parse(atob(dataParam)) as VoucherReceiptData;
    } catch {
      return null;
    }
  }

  return null;
};

const PrintReceipt: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [receiptData, setReceiptData] = useState<VoucherReceiptData | null>(
    null,
  );
  const [shopBranding, setShopBranding] = useState<PrintShopBranding | null>(
    null,
  );
  const [paperSize, setPaperSize] = useState<PrintPaperSize>(() => {
    const fromUrl = parsePrintPaperSize(searchParams.get("size"));
    return fromUrl ?? getSavedPrintPaperSize();
  });
  console.log(paperSize);
  const [loadingMessage, setLoadingMessage] = useState("Loading receipt...");
  const [isReady, setIsReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const hasTriggeredPrint = useRef(false);
  const shouldAutoPrint = searchParams.get("autoprint") === "1";

  const handleBack = useCallback(() => {
    navigate(-1);
    if (orderId) localStorage.removeItem(`receipt_${orderId}`);
  }, [navigate, orderId]);

  const handlePaperSizeChange = (size: PrintPaperSize) => {
    setPaperSize(size);
    savePrintPaperSize(size);
  };

  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    let cancelled = false;

    const preparePrint = async () => {
      setLoadingMessage("Loading receipt...");
      setIsReady(false);
      setLoadError(null);

      const receipt = loadReceiptData(orderId);
      if (!receipt) {
        if (!cancelled) {
          setReceiptData(null);
          setLoadError("Receipt not found");
        }
        return;
      }

      if (!cancelled) setReceiptData(receipt);

      setLoadingMessage("Loading shop settings...");
      const shopResponse = await fetchShopSettings();
      console.log(shopResponse);
      const branding = getPrintShopBranding(shopResponse.data ?? null);

      if (!cancelled) setShopBranding(branding);

      console.log(branding);

      if (branding.logo) {
        setLoadingMessage("Loading shop logo...");
        await preloadImage(branding.logo);
      }

      if (!cancelled) {
        setLoadingMessage(
          searchParams.get("autoprint") === "1"
            ? "Preparing print..."
            : "Ready to print",
        );
        setIsReady(true);
      }
    };

    preparePrint().catch(() => {
      if (!cancelled) {
        toast.error("Failed to prepare voucher for printing");
        setLoadError("Failed to load print data");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [orderId]);

  useEffect(() => {
    if (!shouldAutoPrint || !isReady || !receiptData || !shopBranding) return;
    if (hasTriggeredPrint.current) return;

    hasTriggeredPrint.current = true;

    const printTimer = window.setTimeout(() => {
      window.print();
    }, 350);

    const handleAfterPrint = () => {
      handleBack();
    };

    window.addEventListener("afterprint", handleAfterPrint);

    return () => {
      window.clearTimeout(printTimer);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, [shouldAutoPrint, isReady, receiptData, shopBranding, handleBack]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "2-digit",
    });
  };

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">🧾</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {loadError === "Receipt not found"
              ? "Receipt Not Found"
              : "Unable to Print"}
          </h1>
          <p className="text-gray-600 mb-6">
            {loadError === "Receipt not found"
              ? "The requested receipt could not be found or has expired."
              : "Something went wrong while preparing the voucher."}
          </p>
          <button
            onClick={handleBack}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!isReady || !receiptData || !shopBranding) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{loadingMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white print:bg-white">
      <style>{`
        ${getPrintPaperStyles(paperSize)}
        ${getSharedTableStyles()}
      `}</style>

      {!shouldAutoPrint && (
        <div className="no-print bg-white/80 backdrop-blur-md border-b sticky top-0 z-50 mb-6">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-800 tracking-tight">
                Print Preview — {shopBranding.shopName}
              </h1>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handlePrint}
                  className="bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-all font-bold"
                >
                  Print Now
                </button>
                <button
                  onClick={handleBack}
                  className="bg-slate-100 text-slate-600 px-5 py-2.5 rounded-xl hover:bg-slate-200 transition-all font-bold"
                >
                  Close
                </button>
              </div>
            </div>
            <PrintPaperSizeSelector
              value={paperSize}
              onChange={handlePaperSizeChange}
            />
            <p className="text-xs text-slate-500">
              Change default size in Shop Settings. Click Print when ready.
            </p>
          </div>
        </div>
      )}

      <div className="pb-8">
        <VoucherContent
          receiptData={receiptData}
          shopBranding={shopBranding}
          paperSize={paperSize}
          formatDate={formatDate}
        />
      </div>
    </div>
  );
};

export default PrintReceipt;
