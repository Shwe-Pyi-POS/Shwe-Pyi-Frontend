import axios from "../axios";
import { TransferData } from "./fetchTransfers";

interface FetchTransferByIdResponse {
  success: boolean;
  message: string;
  data: TransferData | null;
}

export const fetchTransferById = async (
  transferId: string
): Promise<FetchTransferByIdResponse> => {
  try {
    const response = await axios.get(`/transfer/${transferId}`);

    return response.data;
  } catch (error: any) {
    console.error("Error fetching transfer:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch transfer",
      data: null,
    };
  }
};
