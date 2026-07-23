import axios from "../axios";
import { UomConversion } from "../../types/uom";

export interface ProductLocation {
  locationId: string;
  locationName: string;
  locationCode: string;
  locationAddress: string;
  locationType: string;
  status: string;
  quantity: number;
  lastUpdated: string;
}

export interface StockAvailability {
  warehouses: {
    count: number;
    locations: ProductLocation[];
    totalQuantity: number;
  };
  storefronts: {
    count: number;
    locations: ProductLocation[];
    totalQuantity: number;
  };
  totalQuantity: number;
}

export interface ProductDetail {
  _id: string;
  productName: string;
  productCode: string;
  SKU: string;
  category: string;
  subCategory: string;
  brand: string;
  description: string;
  buyingPrice: number;
  sellingPrice: number;
  unitOfMeasure: string;
  uomConversions?: UomConversion[];
  reorderPoint: number;
  reorderQuantity: number;
  taxRate: number;
  status: string;
  tags: string[];
  note?: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
  profitMargin: number;
  profitAmount: number;
  stockAvailability: StockAvailability;
}

interface FetchProductByIdResponse {
  success: boolean;
  message: string;
  data: ProductDetail;
}

export const fetchProductById = async (
  productId: string
): Promise<FetchProductByIdResponse> => {
  try {
    const response = await axios.get(`/inventory/${productId}`);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching product by ID:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch product",
      data: {} as ProductDetail,
    };
  }
};

