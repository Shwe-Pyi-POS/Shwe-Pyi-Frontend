import axios from "../axios";
import { UomConversion } from "../../types/uom";

export interface UpdateProductPayload {
  productName: string;
  productCode: string;
  saleCode?: string;
  SKU: string;
  barcode?: string;
  category: string;
  subCategory?: string;
  brand?: string;
  description?: string;
  buyingPrice: number;
  sellingPrice: number;
  unitOfMeasure: string;
  uomConversions?: UomConversion[];
  reorderPoint?: number;
  reorderQuantity?: number;
  taxRate?: number;
  status?: string;
  tags?: string[];
}

interface UpdateProductResponse {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Update an existing product via API
 * @param {string} productId - The ID of the product to update
 * @param {UpdateProductPayload} productData - Product data matching API schema
 * @returns {Promise<UpdateProductResponse>} Response from API
 */
export const updateProduct = async (
  productId: string,
  productData: UpdateProductPayload
): Promise<UpdateProductResponse> => {
  try {
    const response = await axios.patch(`/inventory/${productId}`, productData);

    return response.data;
  } catch (error) {
    console.error("Error updating product:", error);

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
