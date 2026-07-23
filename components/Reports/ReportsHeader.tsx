import React from "react";
import { LocationProfile } from "../../services/Location/fetchLocationProfiles";
import { DateRangePicker } from "./DateRangePicker";
import { useLanguage } from "../../context/LanguageContext";

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
  return (
    <div className="flex flex-col md:flex-row sm:justify-between sm:items-start gap-4">
      <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
        Financial Reports
      </h1>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
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
          className="px-3 py-2 sm:px-4 border rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm sm:text-base"
        >
          <option value="all">All Storefronts</option>
          {storefronts.map((sf) => (
            <option key={sf._id} value={sf._id}>
              {sf.locationName} ({sf.locationCode})
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
        {/* <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button> */}
      </div>
    </div>
  );
};
