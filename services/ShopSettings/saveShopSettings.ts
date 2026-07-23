import axios from "../axios";
import { ShopSettings } from "./fetchShopSettings";

export interface SaveShopSettingsPayload {
  shopName: string;
  address: string;
  phoneNumber: string;
}

interface SaveShopSettingsResponse {
  success: boolean;
  message: string;
  data?: ShopSettings;
}

export const saveShopSettings = async (
  payload: SaveShopSettingsPayload,
): Promise<SaveShopSettingsResponse> => {
  try {
    const response = await axios.post("/shop-settings", payload);
    return response.data;
  } catch (error: unknown) {
    console.error("Error saving shop settings:", error);
    const message =
      axios.isAxiosError(error) && error.response?.data?.message
        ? error.response.data.message
        : "Failed to save shop settings";
    throw new Error(message);
  }
};
