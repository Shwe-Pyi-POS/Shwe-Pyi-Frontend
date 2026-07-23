import axios from "../axios";
import { CreditPersona } from "./fetchCreditPersonas";

export interface UpdateCreditPersonaPayload {
  name?: string;
  phone?: string;
  address?: string;
  creditLimit?: number;
}

interface UpdateCreditPersonaResponse {
  success: boolean;
  message: string;
  data?: CreditPersona;
}

export const updateCreditPersona = async (
  creditPersonId: string,
  payload: UpdateCreditPersonaPayload
): Promise<UpdateCreditPersonaResponse> => {
  try {
    const response = await axios.patch(`/credit-persona/${creditPersonId}`, payload);
    return response.data;
  } catch (error: any) {
    console.error("Error updating credit persona:", error);

    if (axios.isAxiosError(error)) {
      if (
        error.response &&
        error.response.headers["content-type"] &&
        error.response.headers["content-type"].includes("text/html")
      ) {
        throw new Error(
          `API endpoint not found. Please check if the API is running and the endpoint "${error.config?.url}" is correct.`
        );
      }

      if (error.response) {
        const errorMessage =
          error.response.data?.message ||
          error.response.data?.error ||
          `HTTP error! status: ${error.response.status}`;
        throw new Error(errorMessage);
      }

      if (error.request) {
        throw new Error(
          "Network error: Unable to reach the API. Please check if the API server is running."
        );
      }
    }

    throw error;
  }
};
