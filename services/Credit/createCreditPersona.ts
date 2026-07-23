import axios from "../axios";
import { CreditPersona } from "./fetchCreditPersonas";

export interface CreateCreditPersonaPayload {
  name: string;
  phone: string;
  address?: string;
  creditLimit?: number;
}

interface CreateCreditPersonaResponse {
  success: boolean;
  message: string;
  data?: CreditPersona;
}

export const createCreditPersona = async (
  payload: CreateCreditPersonaPayload
): Promise<CreateCreditPersonaResponse> => {
  try {
    const response = await axios.post("/credit-persona", payload);
    return response.data;
  } catch (error: any) {
    console.error("Error creating credit persona:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to create credit persona",
    };
  }
};

