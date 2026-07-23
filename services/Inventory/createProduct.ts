import axios from "../axios";
import { UomConversion } from "../../types/uom";

export interface CreateProductPayload {
  productName: string;
  productCode: string;
  SKU?: string;
  category?: string;
  buyingPrice: number;
  sellingPrice: number;
  unitOfMeasure: string;
  uomConversions?: UomConversion[];
  quantity?: number;
  description?: string;
  saleCode?: string;
  barcode?: string;
  subCategory?: string;
  brand?: string;
  reorderPoint?: number;
  reorderQuantity?: number;
  taxRate?: number;
  status?: string;
  tags?: string[];
  note?: string;
}

interface CreateProductResponse {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Create a new product via API
 * @param {CreateProductPayload} productData - Product data matching API schema
 * @returns {Promise<CreateProductResponse>} Response from API
 */
function appendFormValue(formData: FormData, key: string, value: unknown) {
  if (value === undefined || value === null) return;
  if (Array.isArray(value) || typeof value === "object") {
    formData.append(key, JSON.stringify(value));
    return;
  }
  formData.append(key, String(value));
}

export const createProduct = async (
  productData: CreateProductPayload,
): Promise<CreateProductResponse> => {
  try {
    const formData = new FormData();
    Object.entries(productData).forEach(([key, value]) => {
      if (key === "uomConversions") {
        if (value && Array.isArray(value) && value.length > 0) {
          formData.append("uomConversions", JSON.stringify(value));
        }
        return;
      }
      appendFormValue(formData, key, value);
    });

    const response = await axios.post("/inventory", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return response.data;
  } catch (error) {
    console.error("Error creating product:", error);

    if (axios.isAxiosError(error)) {
      if (
        error.response &&
        error.response.headers["content-type"] &&
        error.response.headers["content-type"].includes("text/html")
      ) {
        throw new Error(
          `API endpoint not found. Please check if the API is running and the endpoint "${error.config?.url}" is correct.`
        );
      }

      if (error.response) {
        const errorMessage =
          error.response.data?.message ||
          error.response.data?.error ||
          `HTTP error! status: ${error.response.status}`;
        throw new Error(errorMessage);
      }

      if (error.request) {
        throw new Error(
          "Network error: Unable to reach the API. Please check if the API server is running."
        );
      }
    }

    throw error;
  }
};
