import React, { useState, useEffect, useCallback } from "react";
import { Store, RefreshCw, Loader2, Info, Edit } from "lucide-react";
import { toast } from "sonner";
import {
  fetchShopSettings,
  isNoShopSettingsMessage,
  ShopSettings,
} from "../../services/ShopSettings/fetchShopSettings";
import { ShopInfoCard } from "./ShopInfoCard";
import { BusinessHoursCard } from "./BusinessHoursCard";
import { SocialMediaCard } from "./SocialMediaCard";
import { ShopSettingsForm } from "./ShopSettingsForm";
import { ShopLogoUpload } from "./ShopLogoUpload";
import { PrintPaperSizeSettingsCard } from "./PrintPaperSizeSettingsCard";

export const ShopSettingsTab: React.FC = () => {
  const [settings, setSettings] = useState<ShopSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [emptyMessage, setEmptyMessage] = useState<string | null>(null);

  const loadShopSettings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchShopSettings();
      if (response.success && response.data) {
        setSettings(response.data);
        setEmptyMessage(null);
        setIsEditing(false);
      } else if (
        response.success &&
        !response.data &&
        (isNoShopSettingsMessage(response.message) || !response.message)
      ) {
        setSettings(null);
        setEmptyMessage(
          response.message ||
            "No shop settings found. Please create shop settings using the form below.",
        );
      } else {
        setSettings(null);
        setEmptyMessage(null);
        if (!response.success && !isNoShopSettingsMessage(response.message)) {
          toast.error(response.message || "Failed to load shop settings");
        }
      }
    } catch (error) {
      console.error("Error loading shop settings:", error);
      setSettings(null);
      setEmptyMessage(null);
      toast.error("Failed to load shop settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadShopSettings();
  }, [loadShopSettings]);

  const handleSaveSuccess = () => {
    setIsEditing(false);
    loadShopSettings();
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
        <h2 className="text-lg font-semibold flex items-center">
          <Store className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600" />
          Shop Settings
        </h2>
        <div className="flex flex-wrap gap-2">
          {settings && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 bg-slate-600 text-white px-3 py-2 rounded-lg hover:bg-slate-700 transition-colors text-sm"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
          )}
          <button
            onClick={loadShopSettings}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500 mt-6">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p>Loading shop settings...</p>
        </div>
      ) : isEditing || !settings ? (
        <div className="space-y-6">
          {!settings && (
            <div
              role="status"
              className="p-4 sm:p-5 rounded-xl border border-blue-200 bg-blue-50 text-blue-900 flex gap-3 items-start"
            >
              <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">No shop settings yet</p>
                <p className="text-sm text-blue-800/90 mt-1">
                  {emptyMessage ||
                    "Create your shop profile below so receipts and vouchers show the correct shop name, address, and phone number."}
                </p>
              </div>
            </div>
          )}
          <ShopSettingsForm
            initialData={settings}
            onSuccess={handleSaveSuccess}
            onCancel={settings ? () => setIsEditing(false) : undefined}
          />
          {settings && (
            <ShopLogoUpload
              currentLogo={settings.logo}
              shopName={settings.shopName}
              onSuccess={loadShopSettings}
            />
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <ShopInfoCard settings={settings} />
          {/* <ShopLogoUpload
            currentLogo={settings.logo}
            shopName={settings.shopName}
            onSuccess={loadShopSettings}
          /> */}
          {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BusinessHoursCard businessHours={settings.businessHours} />
            <SocialMediaCard socialMedia={settings.socialMedia} />
          </div> */}
        </div>
      )}

      <div className="mt-6">
        <PrintPaperSizeSettingsCard />
      </div>
    </div>
  );
};
