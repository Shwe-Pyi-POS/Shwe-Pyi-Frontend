import axios from "../axios";

interface CreateCreditRecordRequest {
  orderId: string;
  paidAmount: number;
  paymentMethod: string;
}

interface CreateCreditRecordResponse {
  success: boolean;
  message: string;
  data?: any;
}

export const createCreditRecord = async (
  payload: CreateCreditRecordRequest
): Promise<CreateCreditRecordResponse> => {
  try {
    const response = await axios.post("/credit-record", payload);
    return response.data;
  } catch (error: any) {
    console.error("Error creating credit record:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to create credit record",
    };
  }
};

