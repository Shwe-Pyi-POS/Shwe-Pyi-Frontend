import axios from "../axios";

interface RestorePurchaseResponse {
  success: boolean;
  message: string;
  data: any;
}

export const restorePurchase = async (
  purchaseId: string
): Promise<RestorePurchaseResponse> => {
  try {
    const response = await axios.patch(`/purchase/${purchaseId}/restore`);

    return response.data;
  } catch (error: any) {
    console.error("Error restoring purchase:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to restore purchase",
      data: null,
    };
  }
};
