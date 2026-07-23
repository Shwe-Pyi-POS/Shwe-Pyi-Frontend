import axios from "../axios";
import { ShopSettings } from "./fetchShopSettings";

interface DeleteShopLogoResponse {
  success: boolean;
  message: string;
  data?: ShopSettings;
}

export const deleteShopLogo = async (): Promise<DeleteShopLogoResponse> => {
  try {
    const response = await axios.delete("/shop-settings/logo");
    return response.data;
  } catch (error: unknown) {
    console.error("Error deleting shop logo:", error);
    const message =
      axios.isAxiosError(error) && error.response?.data?.message
        ? error.response.data.message
        : "Failed to delete shop logo";
    throw new Error(message);
  }
};
