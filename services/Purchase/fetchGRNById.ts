import axios from "../axios";
import { GRNData } from "./fetchGRNs";

interface FetchGRNByIdResponse {
  success: boolean;
  message: string;
  data: GRNData | null;
}

export const fetchGRNById = async (
  grnId: string
): Promise<FetchGRNByIdResponse> => {
  try {
    const response = await axios.get(`/grn/${grnId}`);

    return response.data;
  } catch (error: any) {
    console.error("Error fetching GRN:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch GRN",
      data: null,
    };
  }
};
