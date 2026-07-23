import axios from "../axios";

interface UpdateTransferStatusResponse {
  success: boolean;
  message: string;
  data?: any;
}

export const updateTransferStatus = async (
  transferId: string,
  status: string
): Promise<UpdateTransferStatusResponse> => {
  try {
    const response = await axios.patch(`/transfer/${transferId}`, {
      status,
    });

    return {
      success: true,
      message: "Transfer status updated successfully",
      data: response.data,
    };
  } catch (error: any) {
    console.error("Error updating transfer status:", error);
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to update transfer status",
    };
  }
};

