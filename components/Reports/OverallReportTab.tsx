import React from "react";
import { Loader2, Store } from "lucide-react";
import { SaleReportResponse } from "../../services/Reports/fetchSaleReport";

interface OverallReportTabProps {
  displayReport: {
    finalAmount: number;
    paidAmount: number;
    subTotal: number;
    tax: number;
    discount: number;
    transportFee: number;
    orderCount: number;
    creditOrderCount: number;
    paidOrderCount: number;
  };
  saleReports: SaleReportResponse[];
  allStorefrontsReport: SaleReportResponse | null;
  selectedStorefront: string;
  loading: boolean;
}

export const OverallReportTab: React.FC<OverallReportTabProps> = ({
  displayReport,
  saleReports,
  allStorefrontsReport,
  selectedStorefront,
  loading,
}) => {
  // Determine which reports to show in the breakdown table
  const reportsToShow =
    selectedStorefront === "all"
      ? saleReports.filter((report) => report.success)
      : saleReports.filter(
          (report) =>
            report.success &&
            (report.data.storefront == null ||
              report.data.storefront._id === selectedStorefront ||
              (report.data.storefront as unknown as { id?: string } | null)
                ?.id === selectedStorefront),
        );

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-slate-600">Loading payment methods...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow border border-primary/20">
          <p className="text-slate-500 text-xs uppercase font-bold">
            Total Sales
          </p>
          <p className="text-lg sm:text-2xl font-bold text-slate-900">
            {displayReport.finalAmount.toLocaleString()}{" "}
            <span className="hidden sm:inline">MMK</span>
          </p>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow border border-green-100">
          <p className="text-slate-500 text-xs uppercase font-bold">
            Paid Amount
          </p>
          <p className="text-lg sm:text-2xl font-bold text-green-600">
            {displayReport.paidAmount.toLocaleString()}{" "}
            <span className="hidden sm:inline">MMK</span>
          </p>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow border border-purple-100">
          <p className="text-slate-500 text-xs uppercase font-bold">
            Credit Amount
          </p>
          <p className="text-lg sm:text-2xl font-bold text-purple-600">
            {(
              displayReport.finalAmount - displayReport.paidAmount
            ).toLocaleString()}{" "}
            <span className="hidden sm:inline">MMK</span>
          </p>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow border border-blue-100">
          <p className="text-slate-500 text-xs uppercase font-bold">
            Total Orders
          </p>
          <p className="text-lg sm:text-2xl font-bold text-blue-600">
            {displayReport.orderCount}
          </p>
        </div>
      </div>

      {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow border border-amber-100">
          <p className="text-slate-500 text-xs uppercase font-bold">Discount</p>
          <p className="text-2xl font-bold text-amber-600">
            {displayReport.discount.toLocaleString()} MMK
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow border border-red-100">
          <p className="text-slate-500 text-xs uppercase font-bold">
            Credit Orders
          </p>
          <p className="text-2xl font-bold text-red-500">
            {displayReport.creditOrderCount}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow border border-green-100">
          <p className="text-slate-500 text-xs uppercase font-bold">
            Paid Orders
          </p>
          <p className="text-2xl font-bold text-green-600">
            {displayReport.paidOrderCount}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow border border-slate-100">
          <p className="text-slate-500 text-xs uppercase font-bold">Tax</p>
          <p className="text-2xl font-bold text-slate-600">
            {displayReport.tax.toLocaleString()} MMK
          </p>
        </div>
      </div> */}

      {/* Storefront Breakdown Table */}
      {reportsToShow.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-3 sm:p-4 border-b bg-slate-50">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-sm sm:text-base">
              <Store className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              {selectedStorefront === "all"
                ? "All Storefronts Breakdown"
                : "Storefront Details"}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[900px]">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-3 font-medium text-slate-600">
                    Storefront
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-600 text-right">
                    Final Amount
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-600 text-right">
                    Paid Amount
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-600 text-right">
                    Sub Total
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-600 text-right">
                    Discount
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-600 text-right">
                    Transport Fee
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-600 text-right">
                    Total Orders
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-600 text-right">
                    Paid Orders
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-600 text-right">
                    Credit Orders
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {reportsToShow.map((report, idx) => {
                  const storefront = report.data.storefront;
                  const rowKey =
                    storefront?._id ??
                    (storefront as unknown as { id?: string } | null)?.id ??
                    `no-storefront-${idx}`;
                  return (
                    <tr key={rowKey} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-slate-800">
                            {storefront?.locationName || "Direct Sale"}
                          </p>
                          <p className="text-xs text-slate-500">
                            {storefront?.locationCode || "-"}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-800">
                        {report.data.report.finalAmount.toLocaleString()} MMK
                      </td>
                      <td className="px-4 py-3 text-right text-green-600">
                        {report.data.report.paidAmount.toLocaleString()} MMK
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        {report.data.report.subTotal.toLocaleString()} MMK
                      </td>
                      <td className="px-4 py-3 text-right text-amber-600">
                        {report.data.report.discount.toLocaleString()} MMK
                      </td>
                      <td className="px-4 py-3 text-right text-purple-600">
                        {report.data.report.transportFee.toLocaleString()} MMK
                      </td>
                      <td className="px-4 py-3 text-right text-blue-600">
                        {report.data.report.orderCount}
                      </td>
                      <td className="px-4 py-3 text-right text-green-600">
                        {report.data.report.paidOrderCount}
                      </td>
                      <td className="px-4 py-3 text-right text-red-600">
                        {report.data.report.creditOrderCount}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
