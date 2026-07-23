import React, { useEffect, useState } from "react";
import { useSearchParams, Navigate } from "react-router-dom";
import { ClipboardList } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import {
  PurchaseReportTabs,
  PurchaseReportTab,
} from "../components/PurchaseReport/PurchaseReportTabs";
import { OverviewTab } from "../components/PurchaseReport/OverviewTab";
import { ProductTab } from "../components/PurchaseReport/ProductTab";
import { SupplierTab } from "../components/PurchaseReport/SupplierTab";

export const PurchaseReport: React.FC = () => {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") as PurchaseReportTab | null;
  const supplierIdParam = searchParams.get("supplierId") || "";

  const [activeTab, setActiveTab] = useState<PurchaseReportTab>(
    tabParam === "products" || tabParam === "suppliers" ? tabParam : "overview",
  );
  const [filterSupplierId, setFilterSupplierId] = useState(supplierIdParam);

  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    const stored = localStorage.getItem("adminData");
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setUserRole(data.role || "");
      } catch {
        setUserRole("");
      }
    }
  }, []);

  useEffect(() => {
    if (tabParam === "overview" || tabParam === "products" || tabParam === "suppliers") {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  useEffect(() => {
    setFilterSupplierId(supplierIdParam);
  }, [supplierIdParam]);

  if (userRole && userRole !== "owner" && userRole !== "admin") {
    return <Navigate to="/pos" replace />;
  }

  const handleTabChange = (tab: PurchaseReportTab) => {
    setActiveTab(tab);
    const next = new URLSearchParams(searchParams);
    next.set("tab", tab);
    if (tab !== "overview") {
      next.delete("supplierId");
      setFilterSupplierId("");
    }
    setSearchParams(next);
  };

  const handleSupplierClick = (supplierId: string) => {
    setFilterSupplierId(supplierId);
    setActiveTab("overview");
    setSearchParams({ tab: "overview", supplierId });
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
        <ClipboardList className="w-6 h-7 text-primary" />
        {t("purchaseReport.title")}
      </h1>
      <p className="text-sm text-slate-500 -mt-2">{t("purchaseReport.subtitle")}</p>

      <PurchaseReportTabs activeTab={activeTab} onTabChange={handleTabChange} />

      {activeTab === "overview" && (
        <OverviewTab initialSupplierId={filterSupplierId} />
      )}
      {activeTab === "products" && <ProductTab />}
      {activeTab === "suppliers" && (
        <SupplierTab onSupplierClick={handleSupplierClick} />
      )}
    </div>
  );
};
