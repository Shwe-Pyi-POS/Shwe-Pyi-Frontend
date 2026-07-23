import axios from "../axios";

export interface PurchaseProduct {
  inventoryId: string;
  productStatus: string;
  productName: string;
  buyingPrice: number;
  purchaseQuantity: number;
  receivedQuantity: number;
  productCode: string;
  isDeleted: boolean;
  deletedAt: string | null;
  _id: string;
  createdAt: string;
  updatedAt: string;
  remainingQuantity: number;
}

export interface PurchaseDetail {
  _id: string;
  supplierId: string;
  products: PurchaseProduct[];
  status: string;
  note: string;
  totalAmount: number;
  purchasedBy: {
    _id: string;
    name: string;
    role: string;
  };
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface FetchPurchaseByIdResponse {
  success: boolean;
  message: string;
  data: PurchaseDetail | null;
}

export const fetchPurchaseById = async (
  purchaseId: string
): Promise<FetchPurchaseByIdResponse> => {
  try {
    const response = await axios.get(`/purchase/${purchaseId}`);

    return response.data;
  } catch (error: any) {
    console.error("Error fetching purchase:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch purchase",
      data: null,
    };
  }
};
