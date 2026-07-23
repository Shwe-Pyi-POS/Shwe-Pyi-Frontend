import React, { useState, useEffect } from "react";
import { Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { saveShopSettings } from "../../services/ShopSettings/saveShopSettings";
import { ShopSettings } from "../../services/ShopSettings/fetchShopSettings";

interface ShopSettingsFormProps {
  initialData?: ShopSettings | null;
  onSuccess: () => void;
  onCancel?: () => void;
}

export const ShopSettingsForm: React.FC<ShopSettingsFormProps> = ({
  initialData,
  onSuccess,
  onCancel,
}) => {
  const [shopName, setShopName] = useState("");
  const [address, setAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setShopName(initialData.shopName || "");
      setAddress(initialData.address || "");
      setPhoneNumber(initialData.phoneNumber || "");
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!shopName.trim() || !address.trim() || !phoneNumber.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await saveShopSettings({
        shopName: shopName.trim(),
        address: address.trim(),
        phoneNumber: phoneNumber.trim(),
      });

      if (response.success) {
        toast.success(
          response.message || "Shop settings saved successfully",
        );
        onSuccess();
      } else {
        toast.error(response.message || "Failed to save shop settings");
      }
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save shop settings",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-slate-50 rounded-xl border border-slate-200 p-4 sm:p-6"
    >
      <h3 className="text-base font-semibold text-slate-800 mb-4">
        {initialData ? "Edit Shop Details" : "Create Shop Settings"}
      </h3>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="shopName"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Shop Name <span className="text-red-500">*</span>
          </label>
          <input
            id="shopName"
            type="text"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            placeholder="My Super Shop"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label
            htmlFor="address"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Address <span className="text-red-500">*</span>
          </label>
          <textarea
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="123 Main Street, Yangon, Myanmar"
            rows={2}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label
            htmlFor="phoneNumber"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Phone Number <span className="text-red-500">*</span>
          </label>
          <input
            id="phoneNumber"
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+959123456789"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-6">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm font-medium"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isSubmitting ? "Saving..." : "Save"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-50 transition-colors text-sm font-medium"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};
