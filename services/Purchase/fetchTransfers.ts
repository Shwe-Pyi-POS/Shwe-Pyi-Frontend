import axios from "../axios";

export interface TransferLineItem {
  inventoryId: {
    _id: string;
    productName: string;
  };
  quantity: number;
  grnLineItemId: string;
  notes: string | null;
  _id: string;
}

export interface TransferData {
  _id: string;
  transferNumber: string;
  sourceType: string;
  sourceId: string;
  destinationWarehouseId: string;
  destinationStorefrontId: string | null;
  lineItems: TransferLineItem[];
  status: string;
  transferDate: string;
  receivedDate: string | null;
  notes: string | null;
  isDeleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

interface FetchTransfersResponse {
  success: boolean;
  message: string;
  data: TransferData[];
}

export const fetchTransfers = async (): Promise<FetchTransfersResponse> => {
  try {
    const response = await axios.get("/transfer");

    return response.data;
  } catch (error: any) {
    console.error("Error fetching transfers:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch transfers",
      data: [],
    };
  }
};
