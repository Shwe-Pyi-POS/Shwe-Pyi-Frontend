import axios from "../axios";

interface SoftDeletePurchaseResponse {
  success: boolean;
  message: string;
  data: any;
}

export const softDeletePurchase = async (
  purchaseId: string
): Promise<SoftDeletePurchaseResponse> => {
  try {
    const response = await axios.patch(`/purchase/${purchaseId}/soft-delete`);

    return response.data;
  } catch (error: any) {
    console.error("Error soft deleting purchase:", error);
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to soft delete purchase",
      data: null,
    };
  }
};
