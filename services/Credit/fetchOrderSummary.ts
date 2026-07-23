import axios from "../axios";

export interface OrderSummaryCreditPerson {
  _id: string;
  name: string;
  phone: string;
  creditLimit: number | null;
  remainingLimit: number | null;
}

export interface OrderSummaryBreakdown {
  totalOrders: number;
  totalFinalAmount: number;
  totalPaidAmount: number;
  totalOutstandingAmount: number;
}

export interface OrderSummaryData {
  creditPerson: OrderSummaryCreditPerson;
  summary: {
    totalOrders: number;
    totalFinalAmount: number;
    totalPaidAmount: number;
    totalOutstandingAmount: number;
    creditOrders: number;
    paidOrders: number;
    storefront: OrderSummaryBreakdown;
    directSale: OrderSummaryBreakdown;
  };
  recentOrders: OrderSummaryRecentOrder[];
}

export interface OrderSummaryRecentOrder {
  _id: string;
  orderNumber: string;
  saleType: "storefront" | "direct-sale";
  paymentType: "credit" | "paid";
  finalAmount: number;
  paidAmount: number;
  dueDate?: string | null;
  lastPaymentDate?: string | null;
  createdAt: string;
}

export const fetchOrderSummary = async (
  creditPersonId: string,
  startDate?: string | null,
  endDate?: string | null,
): Promise<{ success: boolean; message: string; data?: OrderSummaryData }> => {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    const queryString = params.toString();
    const url = `/credit-persona/${creditPersonId}/order-summary${queryString ? `?${queryString}` : ""}`;
    const response = await axios.get(url);
    return response.data;
  } catch (error: unknown) {
    const message =
      axios.isAxiosError(error) && error.response?.data?.message
        ? error.response.data.message
        : "Failed to fetch order summary";
    return { success: false, message };
  }
};
