import axios from "../axios";

interface UpdatePaidAmountResponse {
  success: boolean;
  message: string;
  data?: any;
}

export const updatePaidAmount = async (
  orderId: string,
  paidAmount: number,
): Promise<UpdatePaidAmountResponse> => {
  try {
    // Ensure paidAmount is always a number
    const numericPaidAmount = Number(paidAmount);

    // Validate it's a valid number
    if (isNaN(numericPaidAmount) || !isFinite(numericPaidAmount)) {
      return {
        success: false,
        message: "Paid amount must be a valid number",
      };
    }

    const response = await axios.patch(`/order/${orderId}/paid-amount`, {
      paidAmount: numericPaidAmount,
    });
    return response.data;
  } catch (error: any) {
    console.error("Error updating paid amount:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to update paid amount",
    };
  }
};
