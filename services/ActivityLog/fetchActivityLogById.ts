import axios from "../axios";
import { ActivityLogEntry } from "./fetchActivityLogs";

interface FetchActivityLogByIdResponse {
  success: boolean;
  message: string;
  data: ActivityLogEntry | null;
}

export const fetchActivityLogById = async (
  id: string,
): Promise<FetchActivityLogByIdResponse> => {
  try {
    const response = await axios.get(`/activity-log/${id}`);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching activity log:", error);
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to fetch activity log",
      data: null,
    };
  }
};
