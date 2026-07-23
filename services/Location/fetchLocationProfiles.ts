import axios from "../axios";

export interface LocationProfile {
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

interface FetchLocationProfilesResponse {
  success: boolean;
  message: string;
  data: LocationProfile[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export const fetchLocationProfiles =
  async (): Promise<FetchLocationProfilesResponse> => {
    try {
      const response = await axios.get("/location-profile");
      return response.data;
    } catch (error: any) {
      console.error("Error fetching location profiles:", error);
      return {
        success: false,
        message:
          error.response?.data?.message || "Failed to fetch location profiles",
        data: [],
      };
    }
  };

