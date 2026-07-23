import axios from "../axios";

export interface FOCOrderProduct {
  inventoryId: {
    _id: string;
    productName: string;
    productCode: string;
    SKU: string;
    profitMargin: null;
    profitAmount: null;
  };
  quantity: number;
  unitPrice: number;
  _id: string;
}

export interface FOCOrder {
  _id: string;
  orderNumber: string;
  storefrontId: {
    _id: string;
    locationCode: string;
    locationName: string;
  };
  ordersProducts: FOCOrderProduct[];
  creditPersonId: null;
  subTotal: number;
  tax: number;
  discount: number;
  finalAmount: number;
  paidAmount: number;
  extraChange: number;
  orderStatus: string;
  soldBy: {
    _id: string;
    name: string;
    role: string;
  };
  isDeleted: boolean;
  deletedAt: null;
  paymentType: string;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
  totalPaidAmount: object;
  remainingBalance: number;
}

interface FetchFOCOrdersResponse {
  success: boolean;
  message: string;
  data: FOCOrder[];
}

export const fetchFOCOrders = async (
  storefrontId: string,
  startDate: string,
  endDate: string,
  saleType?: string | null,
): Promise<FOCOrder[]> => {
  try {
    let url = `order?paymentType=paid&paymentMethod=foc&storefrontId=${storefrontId}`;
    const params = new URLSearchParams();

    if (startDate) {
      params.append("startDate", startDate);
    }
    if (endDate) {
      params.append("endDate", endDate);
    }
    if (saleType) {
      params.append("saleType", saleType);
    }

    if (params.toString()) {
      url += `&${params.toString()}`;
    }

    const response = await axios.get(url);
    // return response.data;

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || "Failed to fetch FOC orders");
    }
  } catch (error: any) {
    console.error("Error fetching FOC orders:", error);
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Failed to fetch FOC orders",
    );
  }
};

export const fetchAllStorefrontsFOCOrders = async (
  startDate: string,
  endDate: string,
  saleType?: string | null,
): Promise<FOCOrder[]> => {
  try {
    let url = `order?paymentType=paid&paymentMethod=foc`;
    const params = new URLSearchParams();

    if (startDate) {
      params.append("startDate", startDate);
    }
    if (endDate) {
      params.append("endDate", endDate);
    }
    if (saleType) {
      params.append("saleType", saleType);
    }

    if (params.toString()) {
      url += `&${params.toString()}`;
    }

    const response = await axios.get(url);
    // return response.data;

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message || "Failed to fetch all storefronts FOC orders",
      );
    }
  } catch (error: any) {
    console.error("Error fetching all storefronts FOC orders:", error);
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Failed to fetch all storefronts FOC orders",
    );
  }
};
