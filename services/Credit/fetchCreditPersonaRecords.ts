import axios from "../axios";

export interface CreditRecordOrder {
  _id: string;
  orderNumber: string;
  finalAmount?: number;
  paidAmount?: number;
  paymentType?: string;
  createdAt?: string;
  totalPaidAmount?: Record<string, unknown>;
  remainingBalance?: number;
}

export interface CreditRecordAddedBy {
  _id: string;
  name: string;
  role: string;
}

export interface CreditRecord {
  _id: string;
  orderId: CreditRecordOrder;
  creditPersonId: string;
  paidAmount: number;
  paymentDate: string;
  paymentMethod: string;
  notes?: string | null;
  remainingBalanceAfterPayment: number;
  addedBy?: CreditRecordAddedBy;
  isDeleted?: boolean;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  id: string;
}

export interface CreditPersonaSummary {
  totalCreditRecords: number;
  totalPaidViaCreditRecords: number;
  totalOutstandingAmount: number;
}

export interface CreditPersonaOrder {
  _id: string;
  orderNumber: string;
}

export interface CreditPersonaRecordsData {
  creditPerson: {
    _id: string;
    name: string;
    phone: string;
    address?: string;
  };
  orders: CreditPersonaOrder[];
  creditRecords: {
    count: number;
    records: CreditRecord[];
  };
  summary: CreditPersonaSummary;
}

export interface CreditRecordsPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

interface FetchCreditPersonaRecordsResponse {
  success: boolean;
  message: string;
  data?: CreditPersonaRecordsData;
  pagination?: CreditRecordsPagination;
}

export const fetchCreditPersonaRecords = async (
  creditPersonId: string,
  page: number = 1,
): Promise<FetchCreditPersonaRecordsResponse> => {
  try {
    const response = await axios.get(
      `/credit-persona/${creditPersonId}/credit-records`,
      { params: { page } },
    );
    return response.data;
  } catch (error: unknown) {
    console.error("Error fetching credit persona records:", error);
    const message =
      axios.isAxiosError(error) && error.response?.data?.message
        ? error.response.data.message
        : "Failed to fetch credit persona records";
    return {
      success: false,
      message,
    };
  }
};
