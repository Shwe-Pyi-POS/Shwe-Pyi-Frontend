import axios from "../axios";

interface UpdateGRNStatusResponse {
  success: boolean;
  message: string;
  data?: any;
}

export const updateGRNStatus = async (
  grnId: string,
  status: string
): Promise<UpdateGRNStatusResponse> => {
  try {
    const response = await axios.patch(`/grn/${grnId}/status`, { status });

    return response.data;
  } catch (error: any) {
    console.error("Error updating GRN status:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to update GRN status",
    };
  }
};
