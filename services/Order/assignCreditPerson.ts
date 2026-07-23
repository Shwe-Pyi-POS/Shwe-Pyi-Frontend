import axios from "../axios";

interface AssignCreditPersonRequest {
  creditPersonId: string;
}

interface AssignCreditPersonResponse {
  success: boolean;
  message: string;
  data?: any;
}

export const assignCreditPerson = async (
  orderId: string,
  creditPersonId: string
): Promise<AssignCreditPersonResponse> => {
  try {
    const response = await axios.patch(`/order/${orderId}/credit-person`, {
      creditPersonId,
    } as AssignCreditPersonRequest);
    return response.data;
  } catch (error: any) {
    console.error("Error assigning credit person:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to assign credit person",
    };
  }
};

