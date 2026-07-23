import axios from "../axios";

export interface CreditPersona {
  _id: string;
  name: string;
  phone: string;
  address?: string;
  creditLimit?: number;
  blacklist: boolean;
  blacklistReason: string | null;
  blacklistDate: string | null;
  createdAt: string;
  updatedAt: string;
}

interface FetchCreditPersonasResponse {
  success: boolean;
  message: string;
  data: CreditPersona[];
}

export const fetchCreditPersonas = async (): Promise<FetchCreditPersonasResponse> => {
  try {
    const response = await axios.get("/credit-persona");
    return response.data;
  } catch (error: any) {
    console.error("Error fetching credit personas:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch credit personas",
      data: [],
    };
  }
};

