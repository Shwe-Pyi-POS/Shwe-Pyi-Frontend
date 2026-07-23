import axios from "../axios";
import { ShopSettings } from "./fetchShopSettings";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const validateShopLogoFile = (file: File): string | null => {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Only JPEG, PNG, and WebP images are allowed";
  }
  if (file.size > MAX_FILE_SIZE) {
    return "Image must be 5MB or smaller";
  }
  return null;
};

interface UploadShopLogoResponse {
  success: boolean;
  message: string;
  data?: ShopSettings;
}

export const uploadShopLogo = async (
  file: File,
): Promise<UploadShopLogoResponse> => {
  const validationError = validateShopLogoFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const formData = new FormData();
  formData.append("logo", file);

  try {
    const response = await axios.post("/shop-settings/logo", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error: unknown) {
    console.error("Error uploading shop logo:", error);
    const message =
      axios.isAxiosError(error) && error.response?.data?.message
        ? error.response.data.message
        : "Failed to upload shop logo";
    throw new Error(message);
  }
};
