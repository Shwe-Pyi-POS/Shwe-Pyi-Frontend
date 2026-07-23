import axios from "../axios";

export interface StorefrontProfile {
  _id: string;
  type: string;
  locationCode: string;
  locationName: string;
  locationAddress: string;
  locationPhone: string;
  locationEmail?: string | null;
  managerName?: string | null;
  status: "active" | "inactive";
  description?: string;
  notes?: string;
  isDeleted?: boolean;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface FetchStorefrontProfilesResponse {
  success: boolean;
  message: string;
  data: StorefrontProfile[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export const fetchStorefrontProfiles =
  async (): Promise<FetchStorefrontProfilesResponse> => {
    try {
      const response = await axios.get("/storefront-profile");
      return response.data;
    } catch (error: any) {
      console.error("Error fetching storefront profiles:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          "Failed to fetch storefront profiles",
        data: [],
      };
    }
  };
