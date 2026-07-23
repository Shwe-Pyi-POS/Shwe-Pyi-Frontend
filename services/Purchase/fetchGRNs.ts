import axios from "../axios";

export interface GRNLineItem {
  _id: string;
  inventoryId: {
    _id: string;
    productName: string;
    productCode: string;
    SKU: string;
    buyingPrice: number;
    sellingPrice: number;
    profitMargin: number;
    profitAmount: number;
    id: string;
  };
  receivedQuantity: number;
  goodQuantity: number;
  badQuantity: number;
  transferredQuantity: number;
  unitPrice: number;
  totalPrice: number;
  notes: string | null;
  profitMargin: number;
  profitAmount: number;
  availableQuantity: number;
  id: string;
}

export interface GRNData {
  _id: string;
  grnNumber: string;
  purchasingId: {
    _id: string;
    status: string;
    totalAmount: number;
    id: string;
  } | null;
  grnDate: string;
  status: string;
  lineItems: GRNLineItem[];
  notes: string | null;
  totalAmount: number;
  isDeleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  totalReceivedQuantity: number;
  totalGoodQuantity: number;
  totalBadQuantity: number;
  id: string;
}

interface FetchGRNsResponse {
  success: boolean;
  message: string;
  data: GRNData[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

interface FetchGRNsParams {
  page?: number;
  limit?: number;
}

export const fetchGRNs = async (
  params?: FetchGRNsParams
): Promise<FetchGRNsResponse> => {
  try {
    const { page = 1, limit = 10 } = params || {};
    const response = await axios.get(`/grn?page=${page}&limit=${limit}`);

    return response.data;
  } catch (error: any) {
    console.error("Error fetching GRNs:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch GRNs",
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
