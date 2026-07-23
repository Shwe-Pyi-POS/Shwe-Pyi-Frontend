import axios from "../axios";

export interface ActivityLogAdmin {
  _id: string;
  name: string;
  role: string;
}

export interface ActivityLogEntry {
  _id: string;
  admin: ActivityLogAdmin | string;
  action: string;
  feature: string;
  description: string;
  targetId?: string | null;
  targetModel?: string | null;
  metadata?: Record<string, unknown> | null;
  ip?: string | null;
  createdAt: string;
}

export interface ActivityLogPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export interface FetchActivityLogsParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  admin?: string;
  action?: string;
  feature?: string;
  startDate?: string;
  endDate?: string;
}

interface FetchActivityLogsResponse {
  success: boolean;
  message: string;
  data: {
    logs: ActivityLogEntry[];
    pagination: ActivityLogPagination;
  };
}

export const fetchActivityLogs = async (
  params: FetchActivityLogsParams = {},
): Promise<FetchActivityLogsResponse> => {
  try {
    const response = await axios.get("/activity-log", { params });
    return response.data;
  } catch (error: any) {
    console.error("Error fetching activity logs:", error);
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to fetch activity logs",
      data: {
        logs: [],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: params.limit || 20,
        },
      },
    };
  }
};
