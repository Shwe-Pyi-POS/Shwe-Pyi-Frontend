import axios from "../axios";

export interface CreditRecord {
  _id: string;
  orderId: {
    _id: string;
    orderNumber: string;
    finalAmount: number;
    paymentType: string;
    totalPaidAmount: any;
    remainingBalance: number | null;
  };
  creditPersonId: string;
  paidAmount: number;
  paymentDate: string;
  paymentMethod: string;
  notes: string | null;
  remainingBalanceAfterPayment: number;
  addedBy: string;
  isDeleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  __v: number;
  id: string;
}

export interface CreditRecordsResponse {
  success: boolean;
  message: string;
  data: CreditRecord[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export const fetchCreditRecords = async (
  startDate?: string,
  endDate?: string,
  storefrontId?: string,
  limit: number = 1000,
): Promise<CreditRecordsResponse> => {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    if (storefrontId && storefrontId !== "all")
      params.append("storefrontId", storefrontId);
    params.append("limit", limit.toString());

    const response = await axios.get(`/credit-record?${params.toString()}`);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching credit records:", error);
    return {
      success: false,
      message: error.message || "Failed to fetch credit records",
      data: [],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 10,
      },
    };
  }
};
