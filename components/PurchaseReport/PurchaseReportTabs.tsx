import React from "react";
import { LayoutGrid, Package, Users } from "lucide-react";

export type PurchaseReportTab = "overview" | "products" | "suppliers";

interface PurchaseReportTabsProps {
  activeTab: PurchaseReportTab;
  onTabChange: (tab: PurchaseReportTab) => void;
}

export const PurchaseReportTabs: React.FC<PurchaseReportTabsProps> = ({
  activeTab,
  onTabChange,
}) => {
  const tabs: { id: PurchaseReportTab; label: string; icon: React.ElementType }[] =
    [
      { id: "overview", label: "Overview", icon: LayoutGrid },
      { id: "products", label: "By Product", icon: Package },
      { id: "suppliers", label: "By Supplier", icon: Users },
    ];

  return (
    <div className="flex gap-1 sm:gap-2 border-b overflow-x-auto">
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onTabChange(id)}
          className={`px-3 sm:px-6 py-2 sm:py-3 font-semibold flex items-center gap-1 sm:gap-2 transition-colors whitespace-nowrap ${
            activeTab === id
              ? "border-b-2 border-primary text-primary"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Icon className="w-4 h-4" />
          {label}
        </button>
      ))}
    </div>
  );
};
