import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Package,
  AlertTriangle,
  Box,
  RefreshCw,
  ArrowRightLeft,
  X,
  Plus,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchWarehouseStock,
  WarehouseStockItem,
} from "../services/Warehouse/fetchWarehouseStock";
import { fetchCategories } from "../services/Inventory/fetchCategories";
import {
  fetchStorefrontProfiles,
  StorefrontProfile,
} from "../services/Storefront/fetchStorefrontProfiles";
import {
  createWarehouseTransfer,
  TransferLineItem,
} from "../services/Warehouse/createWarehouseTransfer";
import {
  updateWarehouseStockQuantity,
  UpdateWarehouseStockQuantityPayload,
} from "../services/Warehouse/updateWarehouseStockQuantity";

interface TransferFormItem {
  productCode: string;
  productName: string;
  quantity: number;
  maxQuantity: number;
  notes: string;
}

export const WarehouseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Get user role from localStorage (set during login)
  const adminData = JSON.parse(localStorage.getItem("adminData") || "{}");
  const userRole = adminData.role;

  // Get warehouse info from location state if available
  const warehouseInfo = location.state as {
    warehouseName?: string;
    warehouseCode?: string;
  } | null;

  const [stockItems, setStockItems] = useState<WarehouseStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [warehouseName, setWarehouseName] = useState(
    warehouseInfo?.warehouseName || "Warehouse",
  );
  const [warehouseCode, setWarehouseCode] = useState(
    warehouseInfo?.warehouseCode || "",
  );
  const [categories, setCategories] = useState<string[]>([]);
  const [totalProduct, setTotalProduct] = useState(0);
  const [totalproductQuantity, setTotalproductQuantity] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 100;

  // Transfer Modal State
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [storefronts, setStorefronts] = useState<StorefrontProfile[]>([]);
  const [selectedStorefrontId, setSelectedStorefrontId] = useState("");
  const [transferItems, setTransferItems] = useState<TransferFormItem[]>([]);
  const [transferDate, setTransferDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [transferNotes, setTransferNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Stock Adjustment Modal State
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [selectedStockItem, setSelectedStockItem] =
    useState<WarehouseStockItem | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<"increase" | "decrease">(
    "increase",
  );
  const [adjustmentQuantity, setAdjustmentQuantity] = useState(0);
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [isAdjusting, setIsAdjusting] = useState(false);

  useEffect(() => {
    loadWarehouseStock();
    loadStorefronts();
  }, [id, currentPage, itemsPerPage, selectedCategory, searchTerm]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await fetchCategories();
      if (response.success && response.data) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const loadWarehouseStock = async () => {
    if (!id) {
      toast.error("Warehouse ID is missing");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetchWarehouseStock(
        id,
        currentPage,
        itemsPerPage,
        selectedCategory,
        searchTerm,
      );
      // console.log(response);
      if (response.success) {
        if (response.summary) {
          setTotalProduct(response.summary.totalProducts);
          setTotalproductQuantity(response.summary.totalQuantity);
          setTotalAmount(response.summary.totalAmount);
        }
        setStockItems(response.data);

        // Update pagination info
        if (response.pagination) {
          setTotalPages(response.pagination.totalPages);
          setTotalItems(response.pagination.totalItems);
          setCurrentPage(response.pagination.currentPage);
        }

        // Update warehouse info from first item if not provided via state
        if (response.data.length > 0 && !warehouseInfo) {
          const firstItem = response.data[0];
          setWarehouseName(
            firstItem.warehouseId.locationName ||
            firstItem.warehouseId.warehouseName ||
            "Warehouse",
          );
          setWarehouseCode(
            firstItem.warehouseId.locationCode ||
            firstItem.warehouseId.warehouseCode ||
            "",
          );
        }
      } else {
        toast.error(response.message || "Failed to load warehouse stock");
      }
    } catch (error) {
      console.error("Error loading warehouse stock:", error);
      toast.error("Failed to load warehouse stock");
    } finally {
      setLoading(false);
    }
  };

  const loadStorefronts = async () => {
    try {
      const response = await fetchStorefrontProfiles();
      if (response.success && response.data) {
        setStorefronts(response.data.filter((s) => s.status === "active"));
      }
    } catch (error) {
      console.error("Error loading storefronts:", error);
    }
  };

  // Calculate fallback totals if API doesn't provide summary
  const fallbackTotalQuantity = stockItems.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );

  // Calculate total amount fallback
  const fallbackTotalAmount = stockItems.reduce((sum, item) => {
    const sellingPrice = item.inventoryId.sellingPrice || 0;
    const itemTotal = item.quantity * sellingPrice;
    return sum + itemTotal;
  }, 0);

  // Transfer Modal Functions
  const openTransferModal = (item?: WarehouseStockItem) => {
    if (item) {
      // Pre-populate with clicked item
      setTransferItems([
        {
          productCode: item.inventoryId.productCode,
          productName: item.inventoryId.productName,
          quantity: 1,
          maxQuantity: item.quantity,
          notes: "",
        },
      ]);
    } else {
      setTransferItems([]);
    }
    setSelectedStorefrontId("");
    setTransferDate(new Date().toISOString().split("T")[0]);
    setTransferNotes("");
    setIsTransferModalOpen(true);
  };

  const addTransferItem = () => {
    // Get available products (not already in transfer list)
    const usedCodes = transferItems.map((i) => i.productCode);
    console.log("usedCodes", usedCodes);
    console.log("stockItems", stockItems);

    const availableProducts = stockItems.filter(
      (item) =>
        !usedCodes.includes(item.inventoryId.productCode) &&
        (item.availableQuantity > 0 || item.quantity > 0), // Check both availableQuantity and quantity
    );

    console.log("availableProducts", availableProducts);

    if (availableProducts.length === 0) {
      toast.error(
        "No more products available to add. All products may have 0 quantity or are already selected.",
      );
      return;
    }

    const firstAvailable = availableProducts[0];
    const maxQuantity = Math.max(
      firstAvailable.availableQuantity || 0,
      firstAvailable.quantity || 0,
    );

    setTransferItems([
      ...transferItems,
      {
        productCode: firstAvailable.inventoryId.productCode,
        productName: firstAvailable.inventoryId.productName,
        quantity: 1,
        maxQuantity: maxQuantity,
        notes: "",
      },
    ]);
  };

  const removeTransferItem = (index: number) => {
    setTransferItems(transferItems.filter((_, i) => i !== index));
  };

  const updateTransferItem = (
    index: number,
    field: keyof TransferFormItem,
    value: string | number,
  ) => {
    const updated = [...transferItems];

    if (field === "productCode") {
      // Find the stock item for this product code
      const stockItem = stockItems.find(
        (item) => item.inventoryId.productCode === value,
      );
      if (stockItem) {
        const maxQuantity = Math.max(
          stockItem.availableQuantity || 0,
          stockItem.quantity || 0,
        );
        updated[index] = {
          ...updated[index],
          productCode: value as string,
          productName: stockItem.inventoryId.productName,
          maxQuantity: maxQuantity,
          quantity: Math.min(updated[index].quantity, maxQuantity),
        };
      }
    } else if (field === "quantity") {
      const qty = Math.max(
        1,
        Math.min(Number(value), updated[index].maxQuantity),
      );
      updated[index] = { ...updated[index], quantity: qty };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }

    setTransferItems(updated);
  };

  const handleSubmitTransfer = async () => {
    if (!selectedStorefrontId) {
      toast.error("Please select a destination storefront");
      return;
    }

    if (transferItems.length === 0) {
      toast.error("Please add at least one product to transfer");
      return;
    }

    // Validate quantities
    for (const item of transferItems) {
      if (item.quantity <= 0) {
        toast.error(`Quantity for ${item.productName} must be greater than 0`);
        return;
      }
      if (item.quantity > item.maxQuantity) {
        toast.error(
          `Quantity for ${item.productName} exceeds available stock (${item.maxQuantity})`,
        );
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const lineItems: TransferLineItem[] = transferItems.map((item) => ({
        productCode: item.productCode,
        quantity: item.quantity,
        ...(item.notes && { notes: item.notes }),
      }));

      const result = await createWarehouseTransfer({
        sourceType: "Warehouse",
        sourceWarehouseId: id!,
        destinationStorefrontId: selectedStorefrontId,
        lineItems,
        transferDate,
        ...(transferNotes && { notes: transferNotes }),
      });

      if (result.success) {
        toast.success("Transfer created successfully!");
        setIsTransferModalOpen(false);
        loadWarehouseStock(); // Refresh stock
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create transfer");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get available products for dropdown (not already selected)
  const getAvailableProductsForItem = (currentCode: string) => {
    const usedCodes = transferItems
      .map((i) => i.productCode)
      .filter((code) => code !== currentCode);
    return stockItems.filter(
      (item) =>
        !usedCodes.includes(item.inventoryId.productCode) &&
        (item.availableQuantity > 0 || item.quantity > 0), // Check both availableQuantity and quantity
    );
  };

  // Stock Adjustment Functions
  const openAdjustmentModal = (
    item: WarehouseStockItem,
    type: "increase" | "decrease",
  ) => {
    setSelectedStockItem(item);
    setAdjustmentType(type);
    setAdjustmentQuantity(0);
    setAdjustmentReason("");
    setIsAdjustmentModalOpen(true);
  };

  const handleSubmitAdjustment = async () => {
    if (!selectedStockItem) return;

    if (adjustmentQuantity <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }

    // For decrease, check if quantity is available
    if (
      adjustmentType === "decrease" &&
      adjustmentQuantity > selectedStockItem.quantity
    ) {
      toast.error(
        `Cannot decrease by ${adjustmentQuantity}. Available quantity is ${selectedStockItem.quantity}`,
      );
      return;
    }

    setIsAdjusting(true);
    try {
      const quantityChange =
        adjustmentType === "increase"
          ? adjustmentQuantity
          : -adjustmentQuantity;

      const payload: UpdateWarehouseStockQuantityPayload = {
        quantityChange,
        reason: adjustmentReason.trim() || "",
      };

      const result = await updateWarehouseStockQuantity(
        selectedStockItem._id,
        payload,
      );

      if (result.success) {
        toast.success(
          `Stock ${adjustmentType === "increase" ? "increased" : "decreased"
          } successfully!`,
        );
        setIsAdjustmentModalOpen(false);
        setSelectedStockItem(null);
        setAdjustmentQuantity(0);
        setAdjustmentReason("");
        loadWarehouseStock(); // Refresh stock
      } else {
        toast.error(result.message || "Failed to update stock quantity");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update stock quantity");
    } finally {
      setIsAdjusting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex gap-4 mb-6 justify-between">
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => navigate("/warehouse")}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors hidden md:inline"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2 flex-wrap">
              <Package className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
              <span className="truncate">{warehouseName}</span>
              {warehouseCode && (
                <span className="text-xs sm:text-sm px-2 py-1 bg-primary/20 text-blue-700 rounded-full font-medium flex-shrink-0">
                  {warehouseCode}
                </span>
              )}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Warehouse Stock Inventory
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 items-center ">
          {userRole === "owner" && (
            <button
              onClick={() => openTransferModal()}
              disabled={stockItems.length === 0}
              className="flex h-auto sm:h-10 items-center gap-2 px-3 py-2 sm:px-4 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Transfer to Storefront</span>
              <span className="sm:hidden">Transfer</span>
            </button>
          )}

          <button
            onClick={loadWarehouseStock}
            disabled={loading}
            className="hidden md:flex items-center gap-2 px-3 py-2 sm:px-4 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50 text-sm sm:text-base"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by product name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="sm:w-64">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none appearance-none"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          {(searchTerm || selectedCategory !== "all") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
              }}
              className="px-3 py-2 sm:px-4 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2 text-sm sm:text-base"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Clear Filters</span>
              <span className="sm:hidden">Clear</span>
            </button>
          )}
        </div>

        {/* Filter Results Summary */}
        {(searchTerm || selectedCategory !== "all") && (
          <div className="mt-3 text-sm text-slate-500">
            Showing {stockItems.length} of {totalItems} items
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
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
                {totalProduct}
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
                {totalproductQuantity}
              </p>
            </div>
          </div>
        </div>

        {/* <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-slate-500">Low Stock</p>
              <p className="text-lg sm:text-2xl font-bold text-slate-800 truncate">
                {filteredLowStockCount}
              </p>
            </div>
          </div>
        </div> */}

        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-indigo-100 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Package className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-slate-500">Total Amount</p>
              <p className="text-lg sm:text-2xl font-bold text-indigo-600 truncate">
                {totalAmount.toLocaleString()}{" "}
                <span className="hidden sm:inline">MMK</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stock Items Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b bg-slate-50">
          <h2 className="font-semibold text-slate-800">Stock Items</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500">
            Loading stock items...
          </div>
        ) : stockItems.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            {searchTerm || selectedCategory !== "all" ? (
              <div>
                <p className="font-medium mb-2">
                  No items found matching your filters
                </p>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("all");
                  }}
                  className="text-primary hover:text-primary-700 underline"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              "No stock items found in this warehouse."
            )}
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
                      Category
                    </th>
                    <th className="px-2 sm:px-4 py-3 font-medium text-slate-600 text-right">
                      Qty
                    </th>
                    {/* <th className="px-2 sm:px-4 py-3 font-medium text-slate-600 text-right">
                      <span className="hidden sm:inline">Available</span>
                      <span className="sm:hidden">Avail</span>
                    </th> */}
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
                      <span className="hidden sm:inline">Actions</span>
                      <span className="sm:hidden">A</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {stockItems.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50">
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
                      <td className="px-2 sm:px-4 py-3">
                        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-medium">
                          {item.inventoryId.category}
                        </span>
                      </td>
                      <td className="px-2 sm:px-4 py-3 text-right font-bold text-slate-800 text-xs sm:text-sm">
                        {item.quantity}
                      </td>
                      {/* <td className="px-2 sm:px-4 py-3 text-right text-slate-600 text-xs sm:text-sm">
                        {item.availableQuantity}
                      </td> */}
                      <td className="px-2 sm:px-4 py-3 text-right font-medium text-slate-700 text-xs sm:text-sm">
                        {(item.inventoryId.sellingPrice || 0).toLocaleString()}{" "}
                        <span className="hidden sm:inline">MMK</span>
                      </td>
                      <td className="px-2 sm:px-4 py-3 text-right font-bold text-slate-800 text-xs sm:text-sm">
                        {(
                          item.quantity * (item.inventoryId.sellingPrice || 0)
                        ).toLocaleString()}{" "}
                        <span className="hidden sm:inline">MMK</span>
                      </td>
                      <td className="px-2 sm:px-4 py-3">
                        {item.isLowStock ? (
                          <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
                            <AlertTriangle className="w-3 h-3" />{" "}
                            <span className="hidden sm:inline">Low Stock</span>
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
                            <span className="hidden sm:inline">In Stock</span>
                            <span className="sm:hidden">In</span>
                          </span>
                        )}
                      </td>
                      <td className="px-2 sm:px-4 py-3">
                        {userRole === "owner" || userRole === "inventory-manager" && (
                          <div className="flex items-center gap-1 sm:gap-2">
                            <button
                              onClick={() => openTransferModal(item)}
                              disabled={item.quantity == 0}
                              className="text-xs bg-purple-50 text-primary-600 px-2 py-1 sm:px-3 sm:py-1.5 rounded hover:bg-purple-100 border border-purple-200 font-medium transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <ArrowRightLeft className="w-3 h-3" />{" "}
                              <span className="hidden sm:inline">Transfer</span>
                              <span className="sm:hidden">T</span>
                            </button>
                            <button
                              onClick={() =>
                                openAdjustmentModal(item, "increase")
                              }
                              className="text-xs bg-green-50 text-green-600 px-2 py-1 sm:px-3 sm:py-1.5 rounded hover:bg-green-100 border border-green-200 font-medium transition-colors flex items-center gap-1"
                              title="Increase Stock"
                            >
                              <TrendingUp className="w-3 h-3" /> +
                            </button>
                            <button
                              onClick={() =>
                                openAdjustmentModal(item, "decrease")
                              }
                              disabled={item.quantity === 0}
                              className="text-xs bg-red-50 text-red-600 px-2 py-1 sm:px-3 sm:py-1.5 rounded hover:bg-red-100 border border-red-200 font-medium transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Decrease Stock"
                            >
                              <TrendingDown className="w-3 h-3" /> -
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-4 border-t bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-slate-500 order-2 sm:order-1">
                  Showing{" "}
                  <span className="font-medium">{stockItems.length}</span> of{" "}
                  <span className="font-medium">{totalItems}</span> items
                </div>
                <div className="flex items-center gap-2 order-1 sm:order-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1}
                    className="p-2 border rounded-lg bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Previous Page"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-10 h-10 flex items-center justify-center rounded-lg border text-sm font-medium transition-all ${currentPage === pageNum
                              ? "bg-primary text-white border-primary shadow-sm"
                              : "bg-white text-slate-600 hover:bg-slate-50 border-slate-200"
                            }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="p-2 border rounded-lg bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Next Page"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Transfer Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-primary-600" />
                Transfer to Storefront
              </h2>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Source Warehouse Info */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-primary font-medium">
                  Source Warehouse
                </p>
                <p className="text-lg font-bold text-blue-800">
                  {warehouseName}{" "}
                  <span className="text-sm font-normal">({warehouseCode})</span>
                </p>
              </div>

              {/* Destination Storefront */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Destination Storefront <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-primary outline-none"
                  value={selectedStorefrontId}
                  onChange={(e) => setSelectedStorefrontId(e.target.value)}
                >
                  <option value="">Select Storefront...</option>
                  {storefronts.map((sf) => (
                    <option key={sf._id} value={sf._id}>
                      {sf.locationName} ({sf.locationCode})
                    </option>
                  ))}
                </select>
              </div>

              {/* Transfer Items */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-medium text-slate-700">
                    Products to Transfer <span className="text-red-500">*</span>
                  </label>
                  <button
                    onClick={addTransferItem}
                    className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Add Product
                  </button>
                </div>

                {transferItems.length === 0 ? (
                  <div className="border-2 border-dashed rounded-lg p-8 text-center text-slate-400">
                    <p>No products added yet.</p>
                    <button
                      onClick={addTransferItem}
                      className="mt-2 text-primary-600 hover:text-primary-700 font-medium"
                    >
                      + Add your first product
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transferItems.map((item, index) => (
                      <div
                        key={index}
                        className="border rounded-lg p-4 bg-slate-50"
                      >
                        <div className="grid grid-cols-12 gap-3">
                          <div className="col-span-5">
                            <label className="block text-xs text-slate-500 mb-1">
                              Product
                            </label>
                            <select
                              className="w-full border rounded p-2 text-sm"
                              value={item.productCode}
                              onChange={(e) =>
                                updateTransferItem(
                                  index,
                                  "productCode",
                                  e.target.value,
                                )
                              }
                            >
                              {getAvailableProductsForItem(
                                item.productCode,
                              ).map((stockItem) => (
                                <option
                                  key={stockItem.inventoryId.productCode}
                                  value={stockItem.inventoryId.productCode}
                                >
                                  {stockItem.inventoryId.productName} (
                                  {stockItem.inventoryId.productCode})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="col-span-2">
                            <label className="block text-xs text-slate-500 mb-1">
                              Qty (max: {item.maxQuantity})
                            </label>
                            <input
                              type="number"
                              min="1"
                              max={item.maxQuantity}
                              className="w-full border rounded p-2 text-sm"
                              value={item.quantity}
                              onChange={(e) =>
                                updateTransferItem(
                                  index,
                                  "quantity",
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                          <div className="col-span-4">
                            <label className="block text-xs text-slate-500 mb-1">
                              Notes (optional)
                            </label>
                            <input
                              type="text"
                              className="w-full border rounded p-2 text-sm"
                              placeholder="Item notes..."
                              value={item.notes}
                              onChange={(e) =>
                                updateTransferItem(
                                  index,
                                  "notes",
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                          <div className="col-span-1 flex items-end justify-center">
                            <button
                              onClick={() => removeTransferItem(index)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Transfer Date & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Transfer Date
                  </label>
                  <input
                    type="date"
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none"
                    value={transferDate}
                    onChange={(e) => setTransferDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Notes (optional)
                  </label>
                  <input
                    type="text"
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none"
                    placeholder="Transfer notes..."
                    value={transferNotes}
                    onChange={(e) => setTransferNotes(e.target.value)}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors order-2 sm:order-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitTransfer}
                  disabled={isSubmitting || transferItems.length === 0}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 order-1 sm:order-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Creating...
                    </>
                  ) : (
                    <>
                      <ArrowRightLeft className="w-4 h-4" /> Create Transfer
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {isAdjustmentModalOpen && selectedStockItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                {adjustmentType === "increase" ? (
                  <TrendingUp className="w-5 h-5 text-green-600" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-600" />
                )}
                {adjustmentType === "increase"
                  ? "Increase Stock"
                  : "Decrease Stock"}
              </h2>
              <button
                onClick={() => setIsAdjustmentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Product Info */}
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-sm text-slate-500 mb-1">Product</p>
                <p className="font-bold text-slate-800">
                  {selectedStockItem.inventoryId.productName}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {selectedStockItem.inventoryId.productCode} | Current
                  Quantity: {selectedStockItem.quantity}
                </p>
              </div>

              {/* Adjustment Type Info */}
              <div
                className={`p-3 rounded-lg ${adjustmentType === "increase"
                    ? "bg-green-50 border border-green-200"
                    : "bg-red-50 border border-red-200"
                  }`}
              >
                <p className="text-sm font-medium">
                  {adjustmentType === "increase"
                    ? "This will increase the stock quantity"
                    : "This will decrease the stock quantity"}
                </p>
                {adjustmentType === "decrease" && (
                  <p className="text-xs text-red-600 mt-1">
                    Available to decrease: {selectedStockItem.quantity}
                  </p>
                )}
              </div>

              {/* Quantity Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Quantity to {adjustmentType === "increase" ? "Add" : "Remove"}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max={
                    adjustmentType === "decrease"
                      ? selectedStockItem.quantity
                      : undefined
                  }
                  className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-primary outline-none"
                  placeholder="Enter quantity"
                  value={adjustmentQuantity || ""}
                  onChange={(e) =>
                    setAdjustmentQuantity(Number(e.target.value) || 0)
                  }
                />
              </div>

              {/* Reason Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Reason (optional)
                </label>
                <textarea
                  rows={3}
                  className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-primary outline-none"
                  placeholder="Enter reason for stock adjustment (optional)..."
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                />
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsAdjustmentModalOpen(false)}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors order-2 sm:order-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitAdjustment}
                  disabled={isAdjusting || adjustmentQuantity <= 0}
                  className={`px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 order-1 sm:order-2 ${adjustmentType === "increase"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                    }`}
                >
                  {isAdjusting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Updating...
                    </>
                  ) : (
                    <>
                      {adjustmentType === "increase" ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}{" "}
                      {adjustmentType === "increase"
                        ? "Increase Stock"
                        : "Decrease Stock"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
