import axios from "../axios";

export interface UpdateAdminAccountPayload {
  name?: string;
  role?: string;
}

export interface UpdateAdminAccountResponse {
  success: boolean;
  message: string;
  data: {
    _id: string;
    name: string;
    role: string;
    locationId: any;
    lastActiveAt: string | null;
    softDeleted: boolean;
    deletedAt: string | null;
    updatedAt: string | null;
    createdAt: string;
  };
}

export const updateAdminAccount = async (
  accountId: string,
  payload: UpdateAdminAccountPayload
): Promise<UpdateAdminAccountResponse> => {
  try {
    const response = await axios.patch(`/admin/${accountId}`, payload);
    return response.data;
  } catch (error: any) {
    console.error("Error updating admin account:", error);
    throw new Error(
      error.response?.data?.message || "Failed to update admin account"
    );
  }
};

