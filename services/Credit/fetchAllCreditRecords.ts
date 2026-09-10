import axios from "../axios";

export interface CreditRecordOrderInfo {
  _id: string;
  orderNumber: string;
  finalAmount?: number;
  paymentType?: string;
  lastPaymentDate?: string;
  dueDate?: string;
}

export interface CreditRecordPersonInfo {
  _id: string;
  name: string;
  phone?: string;
}

export interface CreditRecordAddedByInfo {
  _id: string;
  name: string;
  role?: string;
}

export interface CreditPaymentRecord {
  _id: string;
  orderId: CreditRecordOrderInfo;
  creditPersonId?: CreditRecordPersonInfo | null;
  paidAmount: number;
  paymentDate: string;
  paymentMethod: string;
  notes?: string | null;
  addedBy?: CreditRecordAddedByInfo | null;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreditRecordsPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export interface FetchAllCreditRecordsParams {
  page?: number;
  limit?: number;
  orderId?: string;
  creditPersonId?: string;
  paymentMethod?: string;
  startDate?: string;
  endDate?: string;
}

export interface FetchAllCreditRecordsResponse {
  success: boolean;
  message: string;
  data?: CreditPaymentRecord[];
  pagination?: CreditRecordsPagination;
}

export const fetchAllCreditRecords = async (
  params: FetchAllCreditRecordsParams = {}
): Promise<FetchAllCreditRecordsResponse> => {
  try {
    const cleanParams: Record<string, any> = {};
    if (params.page) cleanParams.page = params.page;
    if (params.limit) cleanParams.limit = params.limit;
    if (params.orderId) cleanParams.orderId = params.orderId;
    if (params.creditPersonId) cleanParams.creditPersonId = params.creditPersonId;
    if (params.paymentMethod && params.paymentMethod !== "all") {
      cleanParams.paymentMethod = params.paymentMethod;
    }
    if (params.startDate) cleanParams.startDate = params.startDate;
    if (params.endDate) cleanParams.endDate = params.endDate;

    const response = await axios.get("/credit-record", { params: cleanParams });
    return response.data;
  } catch (error: unknown) {
    console.error("Error fetching all credit records:", error);
    const message =
      axios.isAxiosError(error) && error.response?.data?.message
        ? error.response.data.message
        : "Failed to fetch credit records";
    return {
      success: false,
      message,
    };
  }
};
