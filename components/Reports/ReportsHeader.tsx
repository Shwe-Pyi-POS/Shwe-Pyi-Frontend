import React from "react";
import { LocationProfile } from "../../services/Location/fetchLocationProfiles";
import { DateRangePicker } from "./DateRangePicker";
import { useLanguage } from "../../context/LanguageContext";

import { Printer } from "lucide-react";

export type ReportsDataSource = "all" | "storefront" | "direct-sale";

interface ReportsHeaderProps {
  storefronts: LocationProfile[];
  selectedStorefront: string;
  onStorefrontChange: (storefrontId: string) => void;
  onRefresh: () => void;
  loading: boolean;
  startDate: Date | null;
  endDate: Date | null;
  onDateRangeChange: (startDate: Date | null, endDate: Date | null) => void;
  fixedStartDate?: boolean;
  singleDate?: boolean;
  reportDataSource: ReportsDataSource;
  onReportDataSourceChange: (source: ReportsDataSource) => void;
}

export const ReportsHeader: React.FC<ReportsHeaderProps> = ({
  storefronts,
  selectedStorefront,
  onStorefrontChange,
  // onRefresh,
  // loading,
  startDate,
  endDate,
  onDateRangeChange,
  fixedStartDate,
  singleDate,
  reportDataSource,
  onReportDataSourceChange,
}) => {
  const { t } = useLanguage();

  const getActiveLocationName = () => {
    if (selectedStorefront === "all") return "All Locations";
    const sf = storefronts.find((s) => s._id === selectedStorefront);
    if (!sf) return selectedStorefront;
    return `${sf.locationName} (${sf.locationCode})${sf.type === "warehouse" ? " - Warehouse" : ""}`;
  };

  const getActiveDataSourceName = () => {
    if (reportDataSource === "all") return "All Sources";
    if (reportDataSource === "storefront") return t("reports.storefrontSales") || "Storefront Sales";
    if (reportDataSource === "direct-sale") return t("reports.directSale") || "Direct Sales";
    return reportDataSource;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col md:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
            Financial Reports
          </h1>
          {/* Print-only Filter Parameters */}
          <div className="hidden print:block text-xs text-slate-500 mt-2 space-y-1">
            <p><strong>Location:</strong> {getActiveLocationName()}</p>
            <p><strong>Source:</strong> {getActiveDataSourceName()}</p>
            <p>
              <strong>Date:</strong>{" "}
              {startDate ? startDate.toLocaleDateString() : ""} -{" "}
              {endDate ? endDate.toLocaleDateString() : ""}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 print:hidden">
          <select
            value={reportDataSource}
            onChange={(e) =>
              onReportDataSourceChange(e.target.value as ReportsDataSource)
            }
            className="px-3 py-2 sm:px-4 border rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm sm:text-base bg-white"
            aria-label={t("reports.dataSourceAria")}
          >
            <option value="all">All</option>
            <option value="storefront">{t("reports.storefrontSales")}</option>
            <option value="direct-sale">{t("reports.directSale")}</option>
          </select>
          <select
            value={selectedStorefront}
            onChange={(e) => onStorefrontChange(e.target.value)}
            className="px-3 py-2 sm:px-4 border rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm sm:text-base bg-white"
          >
            <option value="all">All Locations</option>
            {storefronts.map((sf) => (
              <option key={sf._id} value={sf._id}>
                {sf.locationName} ({sf.locationCode})
                {sf.type === "warehouse" ? " - Warehouse" : ""}
              </option>
            ))}
          </select>
          <div className="w-[260px] lg:w-auto">
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onChange={onDateRangeChange}
              fixedStartDate={fixedStartDate}
              singleDate={singleDate}
            />
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center justify-center gap-2 px-3 py-2 sm:px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 border rounded-lg transition-colors text-sm sm:text-base"
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </button>
        </div>
      </div>
    </div>
  );
};
