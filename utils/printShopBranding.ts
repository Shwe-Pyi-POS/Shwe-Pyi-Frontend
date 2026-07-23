import { ShopSettings } from "../services/ShopSettings/fetchShopSettings";

export interface PrintShopBranding {
  shopName: string;
  logo?: string;
  phone?: string;
  address?: string;
  website?: string;
  currency: string;
}

export const getPrintShopBranding = (
  settings: ShopSettings | null,
): PrintShopBranding => ({
  shopName: settings?.shopName || "Shop",
  logo: settings?.logo || undefined,
  phone: settings?.phoneNumber,
  address: settings?.address,
  website: settings?.socialMedia?.website,
  currency: settings?.currency || "MMK",
});

export const preloadImage = (src: string): Promise<void> =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = src;
  });
