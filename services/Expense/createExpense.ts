import axios from "../axios";

export interface CreateExpensePayload {
  category: string;
  amount: number;
  date: string; // Format: YYYY-MM-DD
  notes?: string;
}

export interface CreateExpenseResponse {
  success: boolean;
  message: string;
  data?: any;
}

export const createExpense = async (
  payload: CreateExpensePayload
): Promise<CreateExpenseResponse> => {
  try {
    const response = await axios.post("/expense", payload);
    return response.data;
  } catch (error: any) {
    console.error("Error creating expense:", error);
    throw new Error(
      error.response?.data?.message || "Failed to create expense"
    );
  }
};

