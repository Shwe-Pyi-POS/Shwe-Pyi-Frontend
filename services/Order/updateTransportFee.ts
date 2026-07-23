import axios from "../axios";

interface UpdateTransportFeeResponse {
  success: boolean;
  message: string;
  data?: any;
}

export const updateTransportFee = async (
  orderId: string,
  transportFee: number,
  finalAmount: number,
  paidAmount: number,
): Promise<UpdateTransportFeeResponse> => {
  try {
    const numericFee = Number(transportFee);
    const numericFinal = Number(finalAmount);
    const numericPaid = Number(paidAmount);

    if (isNaN(numericFee) || !isFinite(numericFee) || numericFee < 0) {
      return {
        success: false,
        message: "Transport fee must be a valid non-negative number",
      };
    }

    if (isNaN(numericFinal) || !isFinite(numericFinal) || numericFinal < 0) {
      return {
        success: false,
        message: "Final amount must be a valid non-negative number",
      };
    }

    if (isNaN(numericPaid) || !isFinite(numericPaid) || numericPaid < 0) {
      return {
        success: false,
        message: "Paid amount must be a valid non-negative number",
      };
    }

    const response = await axios.patch(`/order/${orderId}/transport-fee`, {
      transportFee: numericFee,
      finalAmount: numericFinal,
      paidAmount: numericPaid,
    });
    return response.data;
  } catch (error: any) {
    console.error("Error updating transport fee:", error);
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to update transport fee",
    };
  }
};
