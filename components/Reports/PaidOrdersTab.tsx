import React from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import { Loader2, CreditCard, DollarSign, Store } from "lucide-react";
import { PaidOrdersReportResponse } from "../../services/Reports/fetchPaidOrdersReport";
import { getPaymentMethodLabel } from "../Orders/orderUtils";
import { COLORS, PAYMENT_METHOD_COLORS } from "./reportUtils";

interface PaidOrdersTabProps {
  paidOrdersReport: PaidOrdersReportResponse | null;
  loading: boolean;
}

export const PaidOrdersTab: React.FC<PaidOrdersTabProps> = ({
  paidOrdersReport,
  loading,
}) => {
  console.log(paidOrdersReport);
  const paymentMethodChartData =
    paidOrdersReport?.success && paidOrdersReport.data.paymentMethods.length > 0
      ? paidOrdersReport.data.paymentMethods.map((pm) => ({
          name: getPaymentMethodLabel(pm.paymentMethod),
          value: pm.totalPaidAmount,
          orderCount: pm.orderCount,
        }))
      : [];

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-slate-600">Loading payment methods...</p>
      </div>
    );
  }

  if (!paidOrdersReport?.success) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
        <CreditCard className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <p className="text-slate-600">No paid orders data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Paid Orders Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-sm border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 font-medium mb-1">
                Total Paid Amount
              </p>
              <p className="text-3xl font-bold text-green-800">
                {paidOrdersReport.data.totals.totalPaidAmount.toLocaleString()}{" "}
                MMK
              </p>
            </div>
            <div className="p-3 bg-green-200 rounded-lg">
              <DollarSign className="w-8 h-8 text-green-700" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-sm border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 font-medium mb-1">
                Total Final Amount
              </p>
              <p className="text-3xl font-bold text-blue-800">
                {paidOrdersReport.data.totals.totalFinalAmount.toLocaleString()}{" "}
                MMK
              </p>
            </div>
            <div className="p-3 bg-blue-200 rounded-lg">
              <CreditCard className="w-8 h-8 text-blue-700" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl shadow-sm border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700 font-medium mb-1">
                Total Paid Orders
              </p>
              <p className="text-3xl font-bold text-purple-800">
                {paidOrdersReport.data.totals.totalOrderCount}
              </p>
            </div>
            <div className="p-3 bg-purple-200 rounded-lg">
              <Store className="w-8 h-8 text-purple-700" />
            </div>
          </div>
        </div>
      </div>

      {/* Payment Methods Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Method Pie Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Payment Methods Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={paymentMethodChartData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
              >
                {paymentMethodChartData.map((entry, index) => {
                  const methodName = entry.name.toLowerCase();
                  const color =
                    PAYMENT_METHOD_COLORS[methodName] ||
                    COLORS[index % COLORS.length];
                  return <Cell key={`cell-${index}`} fill={color} />;
                })}
              </Pie>
              <Tooltip
                formatter={(value: number) => `${value.toLocaleString()} MMK`}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Methods Table */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-4 border-b bg-slate-50">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Payment Methods Breakdown
            </h3>
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
                    Paid Amount
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-600 text-right">
                    Final Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paidOrdersReport.data.paymentMethods.map((pm, index) => {
                  const methodName = pm.paymentMethod.toLowerCase();
                  const color = PAYMENT_METHOD_COLORS[methodName] || "#6366f1";
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
                      <td className="px-4 py-3 text-right font-semibold text-green-600">
                        {pm.totalPaidAmount.toLocaleString()} MMK
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-blue-600">
                        {pm.totalFinalAmount.toLocaleString()} MMK
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50 border-t-2">
                <tr>
                  <td className="px-4 py-3 font-bold text-slate-800">Total</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-800">
                    {paidOrdersReport.data.totals.totalOrderCount}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-green-700 text-lg">
                    {paidOrdersReport.data.totals.totalPaidAmount.toLocaleString()}{" "}
                    MMK
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-blue-700 text-lg">
                    {paidOrdersReport.data.totals.totalFinalAmount.toLocaleString()}{" "}
                    MMK
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
