import React from "react";
import {
  Loader2,
  Receipt,
  DollarSign,
  AlertCircle,
  CreditCard,
  TrendingUp,
} from "lucide-react";
import { CreditOrdersReportResponse } from "../../services/Reports/fetchCreditOrdersReport";
import { getPaymentMethodLabel } from "../Orders/orderUtils";
import { PAYMENT_METHOD_COLORS } from "./reportUtils";

interface CreditOrdersTabProps {
  creditOrdersReport: CreditOrdersReportResponse | null;
  loading: boolean;
}

export const CreditOrdersTab: React.FC<CreditOrdersTabProps> = ({
  creditOrdersReport,
  loading,
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-slate-600">Loading credit orders...</p>
      </div>
    );
  }

  if (!creditOrdersReport?.success) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
        <CreditCard className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <p className="text-slate-600">No credit orders data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Credit Orders Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl shadow-sm border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-700 font-medium mb-1">
                Total Final Amount
              </p>
              <p className="text-3xl font-bold text-orange-800">
                {creditOrdersReport.data.totals.totalFinalAmount.toLocaleString()}{" "}
                MMK
              </p>
            </div>
            <div className="p-3 bg-orange-200 rounded-lg">
              <Receipt className="w-8 h-8 text-orange-700" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-sm border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 font-medium mb-1">
                Total Paid Amount
              </p>
              <p className="text-3xl font-bold text-green-800">
                {creditOrdersReport.data.totals.totalPaidAmount.toLocaleString()}{" "}
                MMK
              </p>
            </div>
            <div className="p-3 bg-green-200 rounded-lg">
              <DollarSign className="w-8 h-8 text-green-700" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl shadow-sm border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-700 font-medium mb-1">
                Remaining Balance
              </p>
              <p className="text-3xl font-bold text-red-800">
                {creditOrdersReport.data.totals.totalRemainingBalance.toLocaleString()}{" "}
                MMK
              </p>
            </div>
            <div className="p-3 bg-red-200 rounded-lg">
              <AlertCircle className="w-8 h-8 text-red-700" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl shadow-sm border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700 font-medium mb-1">
                Credit Orders
              </p>
              <p className="text-3xl font-bold text-purple-800">
                {creditOrdersReport.data.totals.orderCount}
              </p>
              <p className="text-xs text-purple-600 mt-1">
                {creditOrdersReport.data.totals.creditRecordCount} records
              </p>
            </div>
            <div className="p-3 bg-purple-200 rounded-lg">
              <CreditCard className="w-8 h-8 text-purple-700" />
            </div>
          </div>
        </div>
      </div>

      {/* Payment Breakdown Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Initial Payments */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-blue-100">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Initial Payments
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Total:{" "}
              {creditOrdersReport.data.totals.totalInitialPaidAmount.toLocaleString()}{" "}
              MMK
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-3 font-medium text-slate-600 text-left">
                    Payment Method
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-600 text-right">
                    Orders
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-600 text-right">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {creditOrdersReport.data.initialPayments.length > 0 ? (
                  creditOrdersReport.data.initialPayments.map((pm, index) => {
                    const methodName = pm.paymentMethod.toLowerCase();
                    const color =
                      PAYMENT_METHOD_COLORS[methodName] || "#6366f1";
                    return (
                      <tr key={index} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: color }}
                            ></div>
                            <span className="font-medium text-slate-800">
                              {getPaymentMethodLabel(pm.paymentMethod)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-slate-800">
                          {pm.orderCount}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-blue-600">
                          {pm.totalPaidAmount.toLocaleString()} MMK
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-8 text-center text-slate-500"
                    >
                      No initial payments found
                    </td>
                  </tr>
                )}
              </tbody>
              {creditOrdersReport.data.initialPayments.length > 0 && (
                <tfoot className="bg-slate-50 border-t-2">
                  <tr>
                    <td className="px-4 py-3 font-bold text-slate-800">
                      Total
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-800">
                      {creditOrdersReport.data.initialPayments.reduce(
                        (sum, pm) => sum + pm.orderCount,
                        0,
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-blue-700 text-lg">
                      {creditOrdersReport.data.totals.totalInitialPaidAmount.toLocaleString()}{" "}
                      MMK
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* Credit Payments */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-4 border-b bg-gradient-to-r from-green-50 to-green-100">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Credit Payments
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Total:{" "}
              {creditOrdersReport.data.totals.totalCreditPaidAmount.toLocaleString()}{" "}
              MMK
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-3 font-medium text-slate-600 text-left">
                    Payment Method
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-600 text-right">
                    Records
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-600 text-right">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {creditOrdersReport.data.creditPayments.length > 0 ? (
                  creditOrdersReport.data.creditPayments.map((pm, index) => {
                    const methodName = pm.paymentMethod.toLowerCase();
                    const color =
                      PAYMENT_METHOD_COLORS[methodName] || "#6366f1";
                    return (
                      <tr key={index} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: color }}
                            ></div>
                            <span className="font-medium text-slate-800">
                              {getPaymentMethodLabel(pm.paymentMethod)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-slate-800">
                          {pm.recordCount}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-green-600">
                          {pm.totalPaidAmount.toLocaleString()} MMK
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-8 text-center text-slate-500"
                    >
                      No credit payments found
                    </td>
                  </tr>
                )}
              </tbody>
              {creditOrdersReport.data.creditPayments.length > 0 && (
                <tfoot className="bg-slate-50 border-t-2">
                  <tr>
                    <td className="px-4 py-3 font-bold text-slate-800">
                      Total
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-800">
                      {creditOrdersReport.data.creditPayments.reduce(
                        (sum, pm) => sum + pm.recordCount,
                        0,
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-green-700 text-lg">
                      {creditOrdersReport.data.totals.totalCreditPaidAmount.toLocaleString()}{" "}
                      MMK
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
