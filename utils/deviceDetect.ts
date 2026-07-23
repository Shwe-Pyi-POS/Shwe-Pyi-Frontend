import {
  isMobile,
  isTablet,
  isBrowser,
  isAndroid,
  isIOS,
  isWindows,
  isMacOs,
} from "react-device-detect";

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isAndroid: boolean;
  isIOS: boolean;
  isWindows: boolean;
  isMac: boolean;
  platform: string;
}

export const detectDevice = (): DeviceInfo => {
  // Use react-device-detect library for accurate detection
  const isDesktop = !isMobile && !isTablet;

  let detectedPlatform = "unknown";
  if (isAndroid) detectedPlatform = "android";
  else if (isIOS) detectedPlatform = "ios";
  else if (isWindows) detectedPlatform = "windows";
  else if (isMacOs) detectedPlatform = "mac";
  else if (isMobile) detectedPlatform = "mobile";
  else if (isTablet) detectedPlatform = "tablet";
  else if (isDesktop) detectedPlatform = "desktop";

  return {
    isMobile,
    isTablet,
    isDesktop,
    isAndroid,
    isIOS,
    isWindows,
    isMac: isMacOs,
    platform: detectedPlatform,
  };
};
