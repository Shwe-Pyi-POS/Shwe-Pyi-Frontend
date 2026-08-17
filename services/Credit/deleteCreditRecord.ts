import axios from "../axios";

interface DeleteCreditRecordResponse {
  success: boolean;
  message: string;
  data?: any;
}

export const deleteCreditRecord = async (
  recordId: string
): Promise<DeleteCreditRecordResponse> => {
  try {
    const response = await axios.delete(`/credit-record/${recordId}`);
    return response.data;
  } catch (error: any) {
    console.error("Error deleting credit record:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to delete credit record",
    };
  }
};
