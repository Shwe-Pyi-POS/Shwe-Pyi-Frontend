import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { ShoppingBag, FileText, PackageCheck } from "lucide-react";
import { Supplier, Product, ApiPurchaseOrder } from "../types";
import { fetchSuppliers } from "../services/Supplier/fetchSuppliers";
import { fetchProducts } from "../services/Inventory/fetchProducts";
import { fetchPurchases } from "../services/Purchase/fetchPurchases";
import { fetchGRNs, GRNData } from "../services/Purchase/fetchGRNs";
import { toast } from "sonner";
import { useLanguage } from "../context/LanguageContext";
import { PurchaseOrderList } from "../components/Purchasing/PurchaseOrderList";
import { CreatePOModal } from "../components/Purchasing/CreatePOModal";
import { GRNList } from "../components/Purchasing/GRNList";
import { CreateGRNModal } from "../components/Purchasing/CreateGRNModal";
import { GRNDetailModal } from "../components/Purchasing/GRNDetailModal";
import { PODetailModal } from "../components/Purchasing/PODetailModal";
import { TransferWarehouseModal } from "../components/Purchasing/TransferWarehouseModal";
import { TransferStorefrontModal } from "../components/Purchasing/TransferStorefrontModal";

type TabType = "po" | "grn";

export const Purchasing: React.FC = () => {
  const { t } = useLanguage();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<TabType>("po");

  // Shared State
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // PO State
  const [poList, setPOList] = useState<ApiPurchaseOrder[]>([]);
  const [deletedPOList, setDeletedPOList] = useState<ApiPurchaseOrder[]>([]);
  const [poPagination, setPoPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });
  const [deletedPoPagination, setDeletedPoPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPOId, setSelectedPOId] = useState<string | null>(null);
  const [isPODetailModalOpen, setIsPODetailModalOpen] = useState(false);

  // GRN State
  const [grnList, setGRNList] = useState<GRNData[]>([]);
  const [grnPagination, setGrnPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });
  const [isCreateGRNModalOpen, setIsCreateGRNModalOpen] = useState(false);
  const [selectedGRNId, setSelectedGRNId] = useState<string | null>(null);
  const [isGRNDetailModalOpen, setIsGRNDetailModalOpen] = useState(false);
  const [transferModalType, setTransferModalType] = useState<
    "warehouse" | "storefront" | null
  >(null);
  const [transferGRNId, setTransferGRNId] = useState<string | null>(null);

  // Fetch Suppliers and Products
  useEffect(() => {
    const state = location.state as { viewPoId?: string } | null;
    if (state?.viewPoId) {
      setSelectedPOId(state.viewPoId);
      setIsPODetailModalOpen(true);
      setActiveTab("po");
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch Suppliers
        const supplierRes = await fetchSuppliers();
        if (supplierRes.success) {
          setSuppliers(supplierRes.data);
        }

        // Fetch Products
        const productRes = await fetchProducts();
        if (productRes.success && Array.isArray(productRes.data)) {
          setProducts(productRes.data);
        } else if (Array.isArray(productRes)) {
          setProducts(productRes);
        } else if (productRes.data && Array.isArray(productRes.data)) {
          setProducts(productRes.data);
        }

        // Fetch Purchase Orders
        loadPurchases();

        // Fetch Deleted Purchase Orders
        loadDeletedPurchases();

        // Fetch GRNs
        loadGRNs();
      } catch (error) {
        console.error("Failed to load data", error);
      }
    };
    loadData();
  }, []);

  const loadPurchases = async (
    page: number = 1,
    limit: number = 10,
    status: "pending" | "arrived" = "pending",
  ) => {
    try {
      const res = await fetchPurchases({ page, limit, status });
      if (res.success) {
        setPOList(res.data);
        // console.log(res.data);
        setPoPagination(res.pagination);
      }
    } catch (error) {
      console.error("Failed to load POs", error);
      toast.error(t("purchasing.failedToLoadPO"));
    }
  };

  const loadDeletedPurchases = async (page: number = 1, limit: number = 10) => {
    try {
      const res = await fetchPurchases({ page, limit, isDeleted: true });
      if (res.success) {
        setDeletedPOList(res.data);
        setDeletedPoPagination(res.pagination);
        // console.log(res.data);
      }
    } catch (error) {
      console.error("Failed to load deleted POs", error);
      toast.error("Failed to load deleted POs");
    }
  };

  const loadGRNs = async (page: number = 1, limit: number = 10) => {
    try {
      const res = await fetchGRNs({ page, limit });
      if (res.success) {
        setGRNList(res.data);
        setGrnPagination(res.pagination);
      }
    } catch (error) {
      console.error("Failed to load GRNs", error);
      toast.error(t("purchasing.failedToLoadGRN"));
    }
  };

  const handleGRNSuccess = () => {
    loadGRNs(grnPagination.currentPage);
    loadPurchases(poPagination.currentPage);
  };

  const handleCreateGRNFromPO = (po: ApiPurchaseOrder) => {
    setSelectedPOId(po._id);
    setIsCreateGRNModalOpen(true);
  };

  const handleViewPO = (po: ApiPurchaseOrder) => {
    setSelectedPOId(po._id);
    setIsPODetailModalOpen(true);
  };

  const handleViewGRN = (grn: GRNData) => {
    setSelectedGRNId(grn._id);
    setIsGRNDetailModalOpen(true);
  };

  const getGRNId = (grn: GRNData) => grn._id || grn.id;

  const handleTransferGRN = (grn: GRNData) => {
    setTransferGRNId(getGRNId(grn));
    setTransferModalType("warehouse");
  };

  const handleTransferGRNToStorefront = (grn: GRNData) => {
    setTransferGRNId(getGRNId(grn));
    setTransferModalType("storefront");
  };

  const handleCloseTransferModal = () => {
    setTransferModalType(null);
    setTransferGRNId(null);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2 text-slate-800">
        <ShoppingBag className="w-6 h-6" /> {t("purchasing.title")}
      </h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab("po")}
          className={`px-4 py-2 font-semibold flex items-center gap-2 ${
            activeTab === "po"
              ? "border-b-2 border-yellow-800 text-yellow-800"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span className="hidden sm:inline">
            {t("purchasing.purchaseOrder")}
          </span>
          <span className="sm:hidden">PO</span>
        </button>
        <button
          onClick={() => setActiveTab("grn")}
          className={`px-4 py-2 font-semibold flex items-center gap-2 ${
            activeTab === "grn"
              ? "border-b-2 border-yellow-800 text-yellow-800"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <PackageCheck className="w-4 h-4" />
          <span className="hidden sm:inline">
            {t("purchasing.goodsReceivedNote")}
          </span>
          <span className="sm:hidden">GRN</span>
        </button>
      </div>

      {/* PO Tab */}
      {activeTab === "po" && (
        <>
          <PurchaseOrderList
            poList={poList}
            deletedPOList={deletedPOList}
            suppliers={suppliers}
            setIsCreateModalOpen={setIsCreateModalOpen}
            loadPurchases={loadPurchases}
            loadDeletedPurchases={loadDeletedPurchases}
            onViewPO={handleViewPO}
            pagination={poPagination}
            deletedPagination={deletedPoPagination}
            onCreateGRN={handleCreateGRNFromPO}
          />
          <CreatePOModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            suppliers={suppliers}
            products={products}
            onSuccess={loadPurchases}
          />
          <PODetailModal
            isOpen={isPODetailModalOpen}
            onClose={() => setIsPODetailModalOpen(false)}
            purchaseId={selectedPOId}
            suppliers={suppliers}
          />
        </>
      )}

      {/* GRN Tab */}
      {activeTab === "grn" && (
        <>
          <GRNList
            grnList={grnList}
            setIsCreateModalOpen={setIsCreateGRNModalOpen}
            onStatusChange={loadGRNs}
            onViewGRN={handleViewGRN}
            onTransferGRN={handleTransferGRN}
            onTransferGRNToStorefront={handleTransferGRNToStorefront}
            pagination={grnPagination}
          />
        </>
      )}

      {/* Global Modals - accessible from any tab */}
      <CreateGRNModal
        isOpen={isCreateGRNModalOpen}
        onClose={() => setIsCreateGRNModalOpen(false)}
        purchaseOrders={poList}
        suppliers={suppliers}
        onSuccess={handleGRNSuccess}
        selectedPOId={selectedPOId}
      />
      <GRNDetailModal
        isOpen={isGRNDetailModalOpen}
        onClose={() => setIsGRNDetailModalOpen(false)}
        grnId={selectedGRNId}
        onGRNUpdate={loadGRNs}
      />
      <TransferWarehouseModal
        isOpen={transferModalType === "warehouse"}
        onClose={handleCloseTransferModal}
        grnId={transferGRNId}
        onSuccess={handleGRNSuccess}
      />
      <TransferStorefrontModal
        isOpen={transferModalType === "storefront"}
        onClose={handleCloseTransferModal}
        grnId={transferGRNId}
        onSuccess={handleGRNSuccess}
      />
    </div>
  );
};
