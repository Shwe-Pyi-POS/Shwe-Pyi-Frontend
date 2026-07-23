import axios from "../axios";

interface UpdateOrderDueDateResponse {
  success: boolean;
  message: string;
  data?: unknown;
}

const DUE_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const updateOrderDueDate = async (
  orderId: string,
  dueDate: string | null,
): Promise<UpdateOrderDueDateResponse> => {
  try {
    if (dueDate === null) {
      const response = await axios.patch(`/order/${orderId}/due-date`, {
        dueDate: null,
      });
      return response.data;
    }

    const trimmed = dueDate?.trim();
    if (!trimmed) {
      return {
        success: false,
        message: "Due date is required",
      };
    }

    if (!DUE_DATE_PATTERN.test(trimmed)) {
      return {
        success: false,
        message: "Due date must be in YYYY-MM-DD format",
      };
    }

    const response = await axios.patch(`/order/${orderId}/due-date`, {
      dueDate: trimmed,
    });
    return response.data;
  } catch (error: unknown) {
    console.error("Error updating order due date:", error);
    const err = error as { response?: { data?: { message?: string } } };
    return {
      success: false,
      message:
        err.response?.data?.message || "Failed to update order due date",
    };
  }
};
