import axios from "../axios";

export interface DayHours {
  open: string;
  close: string;
  closed: boolean;
}

export interface BusinessHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

export interface SocialMedia {
  facebook: string;
  instagram: string;
  website: string;
}

export interface ShopSettingsUpdatedBy {
  _id: string;
  name: string;
  role: string;
}

export interface ShopSettings {
  _id: string;
  shopName: string;
  address: string;
  phoneNumber: string;
  formattedPhoneNumber?: string;
  logo: string;
  logoKey: string;
  email: string;
  taxId: string;
  currency: string;
  taxRate: number;
  isActive: boolean;
  businessHours: BusinessHours;
  socialMedia: SocialMedia;
  updatedBy?: ShopSettingsUpdatedBy;
  createdAt: string;
  updatedAt: string;
}

interface FetchShopSettingsResponse {
  success: boolean;
  message: string;
  data: ShopSettings | null;
}

/** API returns 404 or this message when settings were never created — not a load failure. */
export const isNoShopSettingsMessage = (message?: string): boolean => {
  if (!message) return false;
  const lower = message.toLowerCase();
  return (
    lower.includes("no shop settings") ||
    lower.includes("create shop settings") ||
    lower.includes("shop settings not found")
  );
};

export const fetchShopSettings =
  async (): Promise<FetchShopSettingsResponse> => {
    try {
      const response = await axios.get("/shop-settings");
      const body = response.data as FetchShopSettingsResponse;
      if (!body.success && isNoShopSettingsMessage(body.message)) {
        return { success: true, message: body.message, data: null };
      }
      if (body.success && !body.data && isNoShopSettingsMessage(body.message)) {
        return { success: true, message: body.message, data: null };
      }
      return body;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const message =
          (error.response?.data as { message?: string })?.message ||
          "Failed to fetch shop settings";
        if (
          error.response?.status === 404 ||
          isNoShopSettingsMessage(message)
        ) {
          return { success: true, message, data: null };
        }
        console.error("Error fetching shop settings:", error);
        return { success: false, message, data: null };
      }
      console.error("Error fetching shop settings:", error);
      return {
        success: false,
        message: "Failed to fetch shop settings",
        data: null,
      };
    }
  };
