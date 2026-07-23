import React, { useRef, useState } from "react";
import { ImagePlus, Upload, Loader2, Store, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  uploadShopLogo,
  validateShopLogoFile,
} from "../../services/ShopSettings/uploadShopLogo";
import { deleteShopLogo } from "../../services/ShopSettings/deleteShopLogo";
import { ConfirmModal } from "../Common/ConfirmModal";

interface ShopLogoUploadProps {
  currentLogo?: string;
  shopName?: string;
  onSuccess: () => void;
}

export const ShopLogoUpload: React.FC<ShopLogoUploadProps> = ({
  currentLogo,
  shopName,
  onSuccess,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const displayLogo = preview || currentLogo;
  const hasSavedLogo = Boolean(currentLogo);
  const showUploadControls = !hasSavedLogo || Boolean(preview || selectedFile);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateShopLogoFile(file);
    if (error) {
      toast.error(error);
      e.target.value = "";
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select an image first");
      return;
    }

    setIsUploading(true);
    try {
      const response = await uploadShopLogo(selectedFile);
      if (response.success) {
        toast.success(response.message || "Shop logo uploaded successfully");
        setSelectedFile(null);
        setPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        onSuccess();
      } else {
        toast.error(response.message || "Failed to upload shop logo");
      }
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Failed to upload shop logo",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await deleteShopLogo();
      if (response.success) {
        toast.success(response.message || "Shop logo deleted successfully");
        setSelectedFile(null);
        setPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setShowDeleteConfirm(false);
        onSuccess();
      } else {
        toast.error(response.message || "Failed to delete shop logo");
      }
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete shop logo",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClearSelection = () => {
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const isBusy = isUploading || isDeleting;

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
        <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <ImagePlus className="w-5 h-5 text-blue-600" />
          Shop Logo
        </h3>

        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <div className="flex-shrink-0">
            {displayLogo ? (
              <img
                src={displayLogo}
                alt={shopName || "Shop logo"}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl object-cover border-2 border-slate-200 shadow-sm"
              />
            ) : (
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-slate-100 flex items-center justify-center border-2 border-dashed border-slate-300">
                <Store className="w-10 h-10 text-slate-400" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-3">
            <p className="text-sm text-slate-500">
              {hasSavedLogo && !preview
                ? "A logo is set. Delete it to upload a different image."
                : "Upload a shop logo (JPEG, PNG, WebP — max 5MB). Available after shop settings are created."}
            </p>

            {showUploadControls && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  disabled={isBusy}
                  className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleUpload}
                    disabled={!selectedFile || isBusy}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm font-medium"
                  >
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    {isUploading ? "Uploading..." : "Upload Logo"}
                  </button>
                  <div className="flex flex-wrap gap-2">
                    {hasSavedLogo && !preview && (
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={isBusy}
                        className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors text-sm font-medium"
                      >
                        {isDeleting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                        {isDeleting ? "Deleting..." : "Delete Logo"}
                      </button>
                    )}

                    {showUploadControls && selectedFile && !isBusy && (
                      <button
                        type="button"
                        onClick={handleClearSelection}
                        className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors text-sm font-medium"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete Shop Logo"
        message="Are you sure you want to delete the shop logo? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonColor="red"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        isLoading={isDeleting}
      />
    </>
  );
};
