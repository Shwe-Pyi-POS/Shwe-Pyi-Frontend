import React, { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Phone,
  User,
  Loader2,
  X,
  Edit,
  Trash2,
  Ban,
  RotateCcw,
  Archive,
} from "lucide-react";
import { createSupplier } from "../services/Supplier/createSupplier";
import { updateSupplier } from "../services/Supplier/updateSupplier";
import { softDeleteSupplier } from "../services/Supplier/softDeleteSupplier";
import { restoreSupplier } from "../services/Supplier/restoreSupplier";
import { deleteSupplier } from "../services/Supplier/deleteSupplier";
import { fetchSuppliers } from "../services/Supplier/fetchSuppliers";
import { ConfirmModal } from "../components/Common/ConfirmModal";
import { toast } from "sonner";
import { Supplier } from "../types";
import { useLanguage } from "../context/LanguageContext";

interface SupplierFormData {
  supplierName: string;
  contactNumber: string;
}

export const Suppliers: React.FC = () => {
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(
    null,
  );
  const [supplierToPermanentlyDelete, setSupplierToPermanentlyDelete] =
    useState<Supplier | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [formData, setFormData] = useState<SupplierFormData>({
    supplierName: "",
    contactNumber: "",
  });

  const adminData = JSON.parse(localStorage.getItem("adminData") || "{}");
  const userRole = adminData.role;

  useEffect(() => {
    loadSuppliers();
  }, [showDeleted]);

  const loadSuppliers = async () => {
    setIsLoading(true);
    try {
      const response = await fetchSuppliers(showDeleted ? true : undefined);
      if (response.success && response.data) {
        setSuppliers(response.data);
      }
    } catch (error) {
      console.error("Failed to load suppliers:", error);
      toast.error(t("suppliers.failedToLoad"));
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      supplierName: "",
      contactNumber: "",
    });
    setEditingId(null);
  };

  const handleOpenEdit = (supplier: Supplier) => {
    setEditingId(supplier.id || supplier._id || "");
    setFormData({
      supplierName: supplier.supplierName,
      contactNumber: supplier.contactNumber,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.supplierName || !formData.contactNumber) {
      toast.error(t("suppliers.fillRequiredFields"));
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {};
      if (formData.supplierName) {
        payload.supplierName = formData.supplierName;
      }
      if (formData.contactNumber) {
        payload.contactNumber = formData.contactNumber;
      }

      if (editingId) {
        // Update existing supplier
        await updateSupplier(editingId, payload);
        toast.success(t("suppliers.supplierUpdated"));
      } else {
        // Create new supplier
        await createSupplier(formData);
        toast.success(t("suppliers.supplierCreated"));
      }

      handleCloseModal();
      // Reload list
      loadSuppliers();
    } catch (error: any) {
      toast.error(
        error.message ||
          (editingId
            ? t("suppliers.failedToUpdate")
            : t("suppliers.failedToCreate")),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDeactivate = (supplier: Supplier) => {
    setSupplierToDelete(supplier);
  };

  const handleConfirmDeactivate = async () => {
    if (!supplierToDelete) return;

    const supplierId = supplierToDelete.id || supplierToDelete._id;
    if (!supplierId) return;

    setProcessingId(supplierId);
    try {
      await softDeleteSupplier(supplierId);
      toast.success(t("suppliers.supplierDeactivated"));
      setSupplierToDelete(null);
      loadSuppliers();
    } catch (error: any) {
      toast.error(error.message || t("suppliers.failedToDeactivate"));
    } finally {
      setProcessingId(null);
    }
  };

  const handleRestore = async (supplier: Supplier) => {
    const supplierId = supplier.id || supplier._id;
    if (!supplierId) return;

    setProcessingId(supplierId);
    try {
      await restoreSupplier(supplierId);
      toast.success(t("suppliers.supplierRestored"));
      // If viewing deleted suppliers, reload the deleted list
      // Otherwise, reload active suppliers
      loadSuppliers();
    } catch (error: any) {
      toast.error(error.message || t("suppliers.failedToRestore"));
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenPermanentDelete = (supplier: Supplier) => {
    setSupplierToPermanentlyDelete(supplier);
  };

  const handleConfirmPermanentDelete = async () => {
    if (!supplierToPermanentlyDelete) return;

    const supplierId =
      supplierToPermanentlyDelete.id || supplierToPermanentlyDelete._id;
    if (!supplierId) return;

    setProcessingId(supplierId);
    try {
      await deleteSupplier(supplierId);
      toast.success(t("suppliers.supplierDeleted"));
      setSupplierToPermanentlyDelete(null);
      loadSuppliers();
    } catch (error: any) {
      toast.error(error.message || t("suppliers.failedToDelete"));
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-row justify-between items-start gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
          {t("suppliers.title")}
        </h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-primary/90 text-white px-3 py-2 sm:px-4 rounded-lg flex items-center gap-2 transition-colors text-sm sm:text-base"
        >
          <Plus className="w-4 h-4" />{" "}
          <span className="hidden sm:inline">{t("suppliers.addSupplier")}</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* Suppliers List */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
          <h2 className="text-lg font-semibold">
            {showDeleted
              ? t("suppliers.deletedSuppliers")
              : t("suppliers.registeredSuppliers")}
          </h2>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setShowDeleted(false)}
                className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                  !showDeleted
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-600 hover:text-slate-800"
                }`}
              >
                {t("suppliers.active")}
              </button>
              <button
                onClick={() => setShowDeleted(true)}
                className={`px-3 py-1.5 text-sm font-medium rounded transition-colors flex items-center gap-1 ${
                  showDeleted
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-600 hover:text-slate-800"
                }`}
              >
                <Archive className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {t("suppliers.inactive")}
                </span>
                <span className="sm:hidden">Inactive</span>
              </button>
            </div>
            <span className="hidden md:block bg-primary/20 text-primary-700 text-xs font-medium px-2.5 py-0.5 rounded-full whitespace-nowrap">
              {t("suppliers.total")}: {suppliers.length}
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12 text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            {t("suppliers.loading")}
          </div>
        ) : suppliers.length === 0 ? (
          <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-lg border border-dashed">
            <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>
              {showDeleted
                ? t("suppliers.noDeletedSuppliers")
                : t("suppliers.noSuppliers")}
            </p>
            {!showDeleted && (
              <p className="text-sm mt-1">{t("suppliers.addFirstSupplier")}</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {suppliers.map((supplier) => (
              <div
                key={supplier.id || supplier._id}
                className="border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow bg-white"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary flex-shrink-0">
                      <User className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-medium text-slate-900 text-sm sm:text-base truncate">
                        {supplier.supplierName}
                      </h3>
                      <div className="flex items-center text-sm text-slate-500 mt-1">
                        <Phone className="w-3 h-3 mr-1 flex-shrink-0" />
                        <span className="truncate">
                          {supplier.contactNumber}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {userRole === "owner" && (
                      <div className="flex items-center gap-1 sm:gap-2">
                        {!supplier.isDeleted && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEdit(supplier);
                            }}
                            className="p-1.5 text-slate-600 hover:text-primary hover:bg-primary/10 rounded transition-colors"
                            title={t("common.edit")}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {supplier.isDeleted ? (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRestore(supplier);
                              }}
                              disabled={
                                processingId === (supplier.id || supplier._id)
                              }
                              className="p-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
                              title={t("suppliers.restore")}
                            >
                              {processingId ===
                              (supplier.id || supplier._id) ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <RotateCcw className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenPermanentDelete(supplier);
                              }}
                              disabled={
                                processingId === (supplier.id || supplier._id)
                              }
                              className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                              title={t("suppliers.delete")}
                            >
                              {processingId ===
                              (supplier.id || supplier._id) ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDeactivate(supplier);
                            }}
                            disabled={
                              processingId === (supplier.id || supplier._id)
                            }
                            className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                            title={t("suppliers.deactivate")}
                          >
                            {processingId === (supplier.id || supplier._id) ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Ban className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    )}
                    <div className="flex items-center">
                      <span
                        className={`w-2 h-2 rounded-full mr-2 flex-shrink-0 ${
                          supplier.isDeleted ? "bg-red-500" : "bg-green-500"
                        }`}
                      ></span>
                      <span className="text-xs text-slate-500">
                        {supplier.isDeleted
                          ? t("suppliers.inactive")
                          : t("suppliers.active")}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t text-xs text-slate-400 space-y-1">
                  {supplier.createdAt && (
                    <div>
                      {t("suppliers.added")}:{" "}
                      {new Date(supplier.createdAt).toLocaleDateString()}
                    </div>
                  )}
                  {supplier.deletedAt && (
                    <div className="text-red-500">
                      {t("suppliers.deletedAt")}:{" "}
                      {new Date(supplier.deletedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Supplier Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                {editingId
                  ? t("suppliers.editSupplier")
                  : t("suppliers.addNewSupplier")}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t("suppliers.name")} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    required
                    className="w-full border rounded-lg pl-10 p-2 focus:ring-2 focus:ring-primary outline-none"
                    placeholder={t("suppliers.namePlaceholder")}
                    value={formData.supplierName}
                    onChange={(e) =>
                      setFormData({ ...formData, supplierName: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t("suppliers.contact")}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                  <input
                    type="tel"
                    required
                    className="w-full border rounded-lg pl-10 p-2 focus:ring-2 focus:ring-primary outline-none"
                    placeholder={t("suppliers.contactPlaceholder")}
                    value={formData.contactNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contactNumber: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors order-2 sm:order-1"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 order-1 sm:order-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />{" "}
                      {editingId
                        ? t("suppliers.updating")
                        : t("suppliers.creating")}
                    </>
                  ) : editingId ? (
                    t("suppliers.updateSupplier")
                  ) : (
                    t("suppliers.createSupplier")
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deactivate Confirmation Modal */}
      <ConfirmModal
        isOpen={!!supplierToDelete}
        title={t("suppliers.deactivateSupplier")}
        message={
          supplierToDelete
            ? t("suppliers.confirmDeactivateMessage").replace(
                "{name}",
                supplierToDelete.supplierName,
              )
            : t("suppliers.confirmDeactivate")
        }
        confirmText={t("suppliers.deactivate")}
        cancelText={t("common.cancel")}
        confirmButtonColor="red"
        onConfirm={handleConfirmDeactivate}
        onCancel={() => setSupplierToDelete(null)}
        isLoading={
          supplierToDelete
            ? processingId === (supplierToDelete.id || supplierToDelete._id)
            : false
        }
      />

      {/* Permanent Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!supplierToPermanentlyDelete}
        title={t("suppliers.deleteSupplier")}
        message={
          supplierToPermanentlyDelete
            ? t("suppliers.confirmDeleteMessage").replace(
                "{name}",
                supplierToPermanentlyDelete.supplierName,
              )
            : t("suppliers.confirmDelete")
        }
        confirmText={t("suppliers.delete")}
        cancelText={t("common.cancel")}
        confirmButtonColor="red"
        onConfirm={handleConfirmPermanentDelete}
        onCancel={() => setSupplierToPermanentlyDelete(null)}
        isLoading={
          supplierToPermanentlyDelete
            ? processingId ===
              (supplierToPermanentlyDelete.id ||
                supplierToPermanentlyDelete._id)
            : false
        }
      />
    </div>
  );
};
