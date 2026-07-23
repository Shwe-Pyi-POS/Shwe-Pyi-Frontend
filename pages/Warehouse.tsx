import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  Plus,
  X,
  Building2,
  Phone,
  MapPin,
  User,
  Mail,
  ChevronRight,
  Edit,
  RefreshCw,
  AlertTriangle,
  Loader2,
  Box,
} from "lucide-react";
import { createWarehouseProfile } from "../services/Warehouse/createWarehouseProfile";
import { fetchWarehouseProfiles } from "../services/Warehouse/fetchWarehouseProfiles";
import { updateWarehouseProfile } from "../services/Warehouse/updateWarehouseProfile";
import {
  fetchWarehouseStock,
  WarehouseStockItem,
} from "../services/Warehouse/fetchWarehouseStock";
import { toast } from "sonner";
import { WarehouseProfile } from "../types";
import { useLanguage } from "../context/LanguageContext";

interface WarehouseProfileFormData {
  warehouseCode: string;
  warehouseName: string;
  warehouseAddress: string;
  warehousePhone: string;
  warehouseEmail: string;
  managerName: string;
  status: "active" | "inactive";
  description: string;
  notes: string;
}

export const Warehouse: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Get user role from localStorage (set during login)
  const adminData = JSON.parse(localStorage.getItem("adminData") || "{}");
  const userRole = adminData.role;
  const [warehouseProfiles, setWarehouseProfiles] = useState<
    WarehouseProfile[]
  >([]);
  const [loading, setLoading] = useState(false);

  // Inventory State
  const [inventoryItems, setInventoryItems] = useState<WarehouseStockItem[]>(
    [],
  );
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [showInventory, setShowInventory] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<WarehouseProfileFormData>({
    warehouseCode: "",
    warehouseName: "",
    warehouseAddress: "",
    warehousePhone: "",
    warehouseEmail: "",
    managerName: "",
    status: "active",
    description: "",
    notes: "",
  });

  useEffect(() => {
    loadWarehouseProfiles();
  }, []);

  const loadInventory = async () => {
    setLoadingInventory(true);
    try {
      const response = await fetchWarehouseStock();
      if (response.success && response.data) {
        setInventoryItems(response.data);
      } else {
        toast.error(response.message || "Failed to load inventory");
      }
    } catch (error) {
      console.error("Error loading inventory:", error);
      toast.error("Failed to load inventory");
    } finally {
      setLoadingInventory(false);
    }
  };

  useEffect(() => {
    if (showInventory) {
      loadInventory();
    }
  }, [showInventory]);

  // Calculate stats for all inventory
  const totalQuantity = inventoryItems.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );
  const lowStockCount = inventoryItems.filter((item) => item.isLowStock).length;

  // Calculate total amount for all inventory
  const totalInventoryAmount = inventoryItems.reduce((sum, item) => {
    const sellingPrice = item.inventoryId.sellingPrice || 0;
    const itemTotal = item.quantity * sellingPrice;
    return sum + itemTotal;
  }, 0);

  const loadWarehouseProfiles = async () => {
    setLoading(true);
    try {
      const response = await fetchWarehouseProfiles();
      // console.log(response);
      if (response.success && response.data) {
        setWarehouseProfiles(response.data.reverse());
      }
    } catch (error) {
      console.log(error);
      console.error("Failed to load warehouse profiles:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      warehouseCode: "",
      warehouseName: "",
      warehouseAddress: "",
      warehousePhone: "",
      warehouseEmail: "",
      managerName: "",
      status: "active",
      description: "",
      notes: "",
    });
    setEditingId(null);
  };

  const handleOpenEdit = (profile: WarehouseProfile) => {
    setEditingId(profile._id);
    setFormData({
      warehouseCode: profile.locationCode,
      warehouseName: profile.locationName,
      warehouseAddress: profile.locationAddress,
      warehousePhone: profile.locationPhone,
      warehouseEmail: profile.locationEmail || "",
      managerName: profile.managerName || "",
      status: profile.status || "active",
      description: profile.description || "",
      notes: profile.notes || "",
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (
      !formData.warehouseCode ||
      !formData.warehouseName ||
      !formData.warehouseAddress ||
      !formData.warehousePhone
    ) {
      toast.error(t("warehouse.fillRequiredFields"));
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare payload (handle optional fields and formatting)
      const payload: any = {
        warehouseCode: formData.warehouseCode.toUpperCase(),
        warehouseName: formData.warehouseName,
        warehouseAddress: formData.warehouseAddress,
        warehousePhone: formData.warehousePhone,
      };

      // Add optional fields only if they have values
      if (formData.warehouseEmail) {
        payload.warehouseEmail = formData.warehouseEmail.toLowerCase();
      }
      if (formData.managerName) {
        payload.managerName = formData.managerName;
      }
      if (formData.status) {
        payload.status = formData.status;
      }
      if (formData.description) {
        payload.description = formData.description;
      }
      if (formData.notes) {
        payload.notes = formData.notes;
      }

      if (editingId) {
        // Update existing warehouse
        await updateWarehouseProfile(editingId, payload);
        toast.success(t("warehouse.profileUpdated"));
      } else {
        // Create new warehouse
        await createWarehouseProfile(payload);
        toast.success(t("warehouse.profileCreated"));
      }

      loadWarehouseProfiles();
      handleCloseModal();
    } catch (error: any) {
      toast.error(
        error.message ||
          (editingId
            ? t("warehouse.failedToUpdate")
            : t("warehouse.failedToCreate")),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-row justify-between items-start gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
          {t("warehouse.title")}
        </h1>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setShowInventory(!showInventory);
              if (!showInventory) {
                loadInventory();
              }
            }}
            className="bg-slate-600 hover:bg-slate-700 text-white px-3 py-2 sm:px-4 rounded-lg flex items-center gap-2 transition-colors text-sm sm:text-base"
          >
            <Package className="w-4 h-4" />
            <span className="hidden sm:inline">
              {showInventory
                ? `${t("warehouse.hideInventory")}`
                : `${t("warehouse.showAllInventory")}`}
            </span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-primary hover:bg-primary/90 text-white px-3 py-2 sm:px-4 rounded-lg flex items-center gap-2 transition-colors text-sm sm:text-base"
          >
            <Plus className="w-4 h-4" />{" "}
            <span className="hidden sm:inline">
              {t("warehouse.addWarehouse")}
            </span>
          </button>
        </div>
      </div>

      {/* All Inventory Products Section */}
      {showInventory && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden mb-6">
          <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              All Warehouse Inventory
            </h2>
            <button
              onClick={loadInventory}
              disabled={loadingInventory}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50 text-sm"
            >
              <RefreshCw
                className={`w-4 h-4 ${loadingInventory ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>

          {/* Stats Cards */}
          {!loadingInventory && inventoryItems.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 p-4 border-b bg-slate-50">
              <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <Box className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-slate-500">
                      Total Products
                    </p>
                    <p className="text-lg sm:text-2xl font-bold text-slate-800 truncate">
                      {inventoryItems.length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Package className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-slate-500">
                      Total Quantity
                    </p>
                    <p className="text-lg sm:text-2xl font-bold text-slate-800 truncate">
                      {totalQuantity}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-slate-500">
                      Low Stock
                    </p>
                    <p className="text-lg sm:text-2xl font-bold text-slate-800 truncate">
                      {lowStockCount}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-indigo-100">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-slate-500">
                      Total Amount
                    </p>
                    <p className="text-lg sm:text-2xl font-bold text-indigo-600 truncate">
                      {totalInventoryAmount.toLocaleString()} MMK
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {loadingInventory ? (
            <div className="p-8 text-center text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
              <p>Loading inventory...</p>
            </div>
          ) : inventoryItems.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p>No inventory items found.</p>
            </div>
          ) : (
            <div>
              {/* Mobile scroll indicator */}
              <div className="sm:hidden px-4 py-2 bg-slate-50 text-xs text-slate-500 text-center">
                ← Swipe to see more →
              </div>

              {/* Table container with horizontal scroll on mobile */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left min-w-[1000px]">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="px-2 sm:px-4 py-3 font-medium text-slate-600">
                        <span className="hidden sm:inline">Product Name</span>
                        <span className="sm:hidden">Name</span>
                      </th>
                      <th className="px-2 sm:px-4 py-3 font-medium text-slate-600">
                        <span className="hidden sm:inline">Product Code</span>
                        <span className="sm:hidden">Code</span>
                      </th>
                      <th className="px-2 sm:px-4 py-3 font-medium text-slate-600">
                        SKU
                      </th>
                      <th className="px-2 sm:px-4 py-3 font-medium text-slate-600">
                        Category
                      </th>
                      <th className="px-2 sm:px-4 py-3 font-medium text-slate-600">
                        <span className="hidden sm:inline">Warehouse</span>
                        <span className="sm:hidden">WH</span>
                      </th>
                      <th className="px-2 sm:px-4 py-3 font-medium text-slate-600 text-right">
                        Qty
                      </th>
                      <th className="px-2 sm:px-4 py-3 font-medium text-slate-600 text-right">
                        <span className="hidden sm:inline">Available</span>
                        <span className="sm:hidden">Avail</span>
                      </th>
                      <th className="px-2 sm:px-4 py-3 font-medium text-slate-600 text-right">
                        <span className="hidden sm:inline">Price</span>
                        <span className="sm:hidden">$</span>
                      </th>
                      <th className="px-2 sm:px-4 py-3 font-medium text-slate-600 text-right">
                        <span className="hidden sm:inline">Total</span>
                        <span className="sm:hidden">T</span>
                      </th>
                      <th className="px-2 sm:px-4 py-3 font-medium text-slate-600">
                        <span className="hidden sm:inline">Status</span>
                        <span className="sm:hidden">S</span>
                      </th>
                      <th className="px-2 sm:px-4 py-3 font-medium text-slate-600">
                        <span className="hidden sm:inline">Updated</span>
                        <span className="sm:hidden">U</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {inventoryItems.map((item) => {
                      const warehouseName =
                        item.warehouseId.locationName ||
                        item.warehouseId.warehouseName ||
                        "Unknown";
                      const warehouseCode =
                        item.warehouseId.locationCode ||
                        item.warehouseId.warehouseCode ||
                        "";

                      return (
                        <tr
                          key={item._id}
                          className="hover:bg-slate-50 cursor-pointer"
                          onClick={() =>
                            navigate(`/warehouse/${item.warehouseId._id}`, {
                              state: {
                                warehouseName,
                                warehouseCode,
                              },
                            })
                          }
                        >
                          <td className="px-2 sm:px-4 py-3 font-medium text-slate-800">
                            <div
                              className="max-w-[150px] sm:max-w-none truncate"
                              title={item.inventoryId.productName}
                            >
                              {item.inventoryId.productName}
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 py-3 text-slate-600">
                            <span className="bg-slate-100 px-2 py-1 rounded text-xs font-mono">
                              {item.inventoryId.productCode}
                            </span>
                          </td>
                          <td className="px-2 sm:px-4 py-3 text-slate-500 font-mono text-xs">
                            {item.inventoryId.SKU}
                          </td>
                          <td className="px-2 sm:px-4 py-3">
                            <span className="bg-primary/20 text-primary-700 px-2 py-1 rounded text-xs font-medium">
                              {item.inventoryId.category}
                            </span>
                          </td>
                          <td className="px-2 sm:px-4 py-3">
                            <div className="flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-slate-400" />
                              <div className="min-w-0">
                                <p
                                  className="text-xs font-medium text-slate-800 truncate"
                                  title={warehouseName}
                                >
                                  {warehouseName}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {warehouseCode}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 py-3 text-right font-bold text-slate-800 text-xs sm:text-sm">
                            {item.quantity}
                          </td>
                          <td className="px-2 sm:px-4 py-3 text-right text-slate-600 text-xs sm:text-sm">
                            {item.availableQuantity}
                          </td>
                          <td className="px-2 sm:px-4 py-3 text-right font-medium text-slate-700 text-xs sm:text-sm">
                            {(
                              item.inventoryId.sellingPrice || 0
                            ).toLocaleString()}{" "}
                            <span className="hidden sm:inline">MMK</span>
                          </td>
                          <td className="px-2 sm:px-4 py-3 text-right font-bold text-slate-800 text-xs sm:text-sm">
                            {(
                              item.quantity *
                              (item.inventoryId.sellingPrice || 0)
                            ).toLocaleString()}{" "}
                            <span className="hidden sm:inline">MMK</span>
                          </td>
                          <td className="px-2 sm:px-4 py-3">
                            {item.isLowStock ? (
                              <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
                                <AlertTriangle className="w-3 h-3" />{" "}
                                <span className="hidden sm:inline">
                                  Low Stock
                                </span>
                                <span className="sm:hidden">Low</span>
                              </span>
                            ) : item.quantity === 0 ? (
                              <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">
                                <span className="hidden sm:inline">
                                  Out of Stock
                                </span>
                                <span className="sm:hidden">Out</span>
                              </span>
                            ) : (
                              <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                                <span className="hidden sm:inline">
                                  In Stock
                                </span>
                                <span className="sm:hidden">In</span>
                              </span>
                            )}
                          </td>
                          <td className="px-2 sm:px-4 py-3 text-slate-500 text-xs">
                            <span className="hidden sm:inline">
                              {new Date(item.lastUpdated).toLocaleDateString()}{" "}
                              {new Date(item.lastUpdated).toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </span>
                            <span className="sm:hidden">
                              {new Date(item.lastUpdated).toLocaleDateString()}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Warehouse Profiles List */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-slate-500" />
          {t("warehouse.profiles")}
        </h2>
        {loading ? (
          <div className="text-center py-8 text-slate-500">
            {t("warehouse.loading")}
          </div>
        ) : warehouseProfiles.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            {t("warehouse.noWarehouses")}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {warehouseProfiles.map((profile) => (
              <div
                key={profile._id}
                onClick={() =>
                  navigate(`/warehouse/${profile._id}`, {
                    state: {
                      warehouseName: profile.locationName,
                      warehouseCode: profile.locationCode,
                    },
                  })
                }
                className="border rounded-lg p-3 sm:p-4 hover:shadow-md transition-all cursor-pointer hover:border-primary group"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2 group-hover:text-primary transition-colors text-sm sm:text-base">
                      <span className="truncate">{profile.locationName}</span>
                      <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary-700 rounded-full flex-shrink-0">
                        {profile.locationCode}
                      </span>
                    </h3>
                    <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">
                        {profile.locationAddress}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        profile.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {profile.status}
                    </span>
                    {userRole === "owner" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEdit(profile);
                        }}
                        className="p-1.5 text-slate-600 hover:text-primary hover:bg-primary/10 rounded transition-colors"
                        title={t("common.edit")}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 text-sm text-slate-600 mt-3 pt-3 border-t">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{profile.locationPhone}</span>
                  </div>
                  {profile.managerName && (
                    <div className="flex items-center gap-2">
                      <User className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{profile.managerName}</span>
                    </div>
                  )}
                  {profile.locationEmail && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{profile.locationEmail}</span>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t text-xs text-primary font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {t("warehouse.viewStockItems")}{" "}
                  <ChevronRight className="w-3 h-3" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Warehouse Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                {editingId
                  ? t("warehouse.editProfile")
                  : t("warehouse.newProfile")}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Required Fields */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {t("warehouse.locationCode")}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={50}
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none uppercase"
                    placeholder={t("warehouse.codePlaceholder")}
                    value={formData.warehouseCode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        warehouseCode: e.target.value.toUpperCase(),
                      })
                    }
                    disabled={!!editingId}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {t("warehouse.status")}
                  </label>
                  <select
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as "active" | "inactive",
                      })
                    }
                  >
                    <option value="active">{t("warehouse.active")}</option>
                    <option value="inactive">{t("warehouse.inactive")}</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {t("warehouse.locationName")}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={200}
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none"
                    placeholder={t("warehouse.namePlaceholder")}
                    value={formData.warehouseName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        warehouseName: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {t("warehouse.locationAddress")}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    maxLength={500}
                    rows={2}
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none"
                    placeholder={t("warehouse.addressPlaceholder")}
                    value={formData.warehouseAddress}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        warehouseAddress: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {t("warehouse.locationPhone")}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={20}
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none"
                    placeholder={t("warehouse.phonePlaceholder")}
                    value={formData.warehousePhone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        warehousePhone: e.target.value,
                      })
                    }
                  />
                </div>

                {/* <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {t("warehouse.locationEmail")}
                  </label>
                  <input
                    type="email"
                    maxLength={200}
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none"
                    placeholder={t("warehouse.emailPlaceholder")}
                    value={formData.warehouseEmail}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        warehouseEmail: e.target.value,
                      })
                    }
                  />
                </div> */}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {t("warehouse.managerName")}
                  </label>
                  <input
                    type="text"
                    maxLength={200}
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none"
                    placeholder={t("warehouse.managerPlaceholder")}
                    value={formData.managerName}
                    onChange={(e) =>
                      setFormData({ ...formData, managerName: e.target.value })
                    }
                  />
                </div>
              </div>
              {/* 
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t("warehouse.description")}
                </label>
                <textarea
                  maxLength={1000}
                  rows={2}
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none"
                  placeholder={t("warehouse.descriptionPlaceholder")}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t("warehouse.notes")}
                </label>
                <textarea
                  maxLength={500}
                  rows={2}
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none"
                  placeholder={t("warehouse.notesPlaceholder")}
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                />
              </div> */}

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
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 order-1 sm:order-2"
                >
                  {isSubmitting
                    ? editingId
                      ? t("warehouse.updating")
                      : t("warehouse.creating")
                    : editingId
                      ? t("warehouse.updateWarehouse")
                      : t("warehouse.createWarehouse")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
