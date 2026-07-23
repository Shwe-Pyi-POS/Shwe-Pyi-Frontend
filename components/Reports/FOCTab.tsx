import React from "react";
import { Package, Loader2 } from "lucide-react";
import { FOCOrder } from "../../services/Reports/fetchFOCOrders";

interface FOCTabProps {
  focOrders: FOCOrder[];
  loading: boolean;
}

interface AggregatedProduct {
  productName: string;
  productCode: string;
  quantity: number;
  unitPrice: number;
  orders: string[];
}

export const FOCTab: React.FC<FOCTabProps> = ({ focOrders, loading }) => {
  console.log("focOrders", focOrders);
  // Aggregate products by name and calculate total quantities
  const aggregatedProducts = focOrders.reduce(
    (acc, order) => {
      order.ordersProducts.forEach((product) => {
        const productName = product.inventoryId.productName;
        const productCode = product.inventoryId.productCode;
        const key = `${productName}-${productCode}`;

        if (acc[key]) {
          acc[key].quantity += product.quantity;
          acc[key].orders.push(order.orderNumber);
        } else {
          acc[key] = {
            productName,
            productCode,
            quantity: product.quantity,
            unitPrice: product.unitPrice,
            orders: [order.orderNumber],
          };
        }
      });
      return acc;
    },
    {} as Record<string, AggregatedProduct>,
  );

  // Convert to array and sort by quantity (highest first)
  const productList = Object.values(aggregatedProducts).sort(
    (a, b) => b.quantity - a.quantity,
  );

  // Calculate totals
  const totalProducts = productList.length;
  const totalQuantity = productList.reduce(
    (sum, product) => sum + product.quantity,
    0,
  );
  const totalValue = productList.reduce(
    (sum, product) => sum + product.quantity * product.unitPrice,
    0,
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-slate-500">Loading FOC products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Products</p>
              <p className="text-2xl font-bold text-slate-800">
                {totalProducts}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Package className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Quantity</p>
              <p className="text-2xl font-bold text-slate-800">
                {totalQuantity}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Package className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Value</p>
              <p className="text-2xl font-bold text-slate-800">
                {totalValue.toLocaleString()} MMK
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="p-4 border-b bg-slate-50">
          <h3 className="font-semibold text-slate-800">FOC Products Details</h3>
          <p className="text-sm text-slate-500 mt-1">
            Products given free of charge with quantities
          </p>
        </div>

        {productList.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p>No FOC products found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-600">
                    Product Name
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-600">
                    Product Code
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-600">
                    Unit Price
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-600">
                    Quantity
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-600">
                    Total Value
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-600">
                    Orders
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {productList.map((product, index) => (
                  <tr key={index} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">
                        {product.productName}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-slate-600 font-mono text-xs">
                        {product.productCode}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-slate-600">
                        {product.unitPrice.toLocaleString()} MMK
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-800">
                        {product.quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-800">
                        {(
                          product.quantity * product.unitPrice
                        ).toLocaleString()}{" "}
                        MMK
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="max-w-xs">
                        <div className="text-xs text-slate-500">
                          {product.orders.length} order
                          {product.orders.length > 1 ? "s" : ""}
                        </div>
                        <div className="text-xs text-slate-400 font-mono">
                          {product.orders.slice(0, 2).join(", ")}
                          {product.orders.length > 2 &&
                            ` +${product.orders.length - 2} more`}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
