import React, { useState, useEffect, useRef } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Modal } from "../Modal";
import { Supplier, Product, PurchaseOrderItem } from "../../types";
import { createPurchase } from "../../services/Purchase/createPurchase";
import { toast } from "sonner";

interface CreatePOModalProps {
  isOpen: boolean;
  onClose: () => void;
  suppliers: Supplier[];
  products: Product[];
  onSuccess: () => void;
}

export const CreatePOModal: React.FC<CreatePOModalProps> = ({
  isOpen,
  onClose,
  suppliers,
  products,
  onSuccess,
}) => {
  const [poSupplierId, setPOSupplierId] = useState("");
  const [poItems, setPOItems] = useState<PurchaseOrderItem[]>([]);
  const [poSelectedProduct, setPOSelectedProduct] = useState("");
  const [poQty, setPOQty] = useState(1);
  const [poItemNote, setPOItemNote] = useState("");
  const [poNote, setPONote] = useState("");
  const [poNewProductName, setPONewProductName] = useState("");
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const productDropdownRef = useRef<HTMLDivElement>(null);

  const filteredProducts = products.filter((product) =>
    product.productName
      ?.toLowerCase()
      .includes(productSearchQuery.toLowerCase()),
  );

  const handleProductSelect = (productId: string, productName: string) => {
    setPOSelectedProduct(productId);
    setProductSearchQuery(productName);
    setShowProductDropdown(false);
    setPONewProductName("");
  };

  const handleProductInputChange = (value: string) => {
    setProductSearchQuery(value);
    setShowProductDropdown(true);
    if (value === "") {
      setPOSelectedProduct("");
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        productDropdownRef.current &&
        !productDropdownRef.current.contains(event.target as Node)
      ) {
        setShowProductDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const addPOItem = () => {
    if (!poSelectedProduct && !poNewProductName) return;
    if (poQty <= 0) return;

    let productId = poSelectedProduct;
    let productName = "";
    let buyingPrice = 0;

    if (poSelectedProduct) {
      const product = products.find(
        (p) => (p._id || p.id) === poSelectedProduct,
      );
      if (!product) return;
      productName = product.productName || product.name;
      buyingPrice = product.buyingPrice;
    } else {
      // New product - generate ID
      productId = `new-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      productName = poNewProductName;
    }

    const newItem: PurchaseOrderItem = {
      productId,
      name: productName,
      qty: poQty,
      costPrice: buyingPrice,
      note: poItemNote,
    };

    setPOItems((prev) => [...prev, newItem]);
    setPOSelectedProduct("");
    setPONewProductName("");
    setPOQty(1);
    setPOItemNote("");
  };

  const removePOItem = (index: number) => {
    setPOItems((prev) => prev.filter((_, i) => i !== index));
  };

  const submitPO = async () => {
    if (!poSupplierId || poItems.length === 0) {
      toast.error("Please select supplier and add at least one item");
      return;
    }

    // Calculate total amount
    const totalAmount = poItems.reduce(
      (sum, item) => sum + item.qty * item.costPrice,
      0,
    );

    const payload = {
      products: poItems.map((item) => ({
        inventoryId: item.productId,
        purchaseQuantity: item.qty,
      })),
      supplierId: poSupplierId,
      note: poNote,
      totalAmount,
    };

    try {
      const response = await createPurchase(payload);
      if (response.success) {
        toast.success("Purchase Order Created Successfully!");
        setPOSupplierId("");
        setPOItems([]);
        setPONote("");
        onSuccess();
        onClose();
      } else {
        toast.error(response.message || "Failed to create Purchase Order");
      }
    } catch (error: any) {
      console.error("Failed to create PO:", error);
      toast.error(
        error.message || "An error occurred while creating the Purchase Order",
      );
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Purchase Order">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                Supplier Name
              </label>
              <select
                className="w-full border rounded p-2"
                value={poSupplierId}
                onChange={(e) => setPOSupplierId(e.target.value)}
              >
                <option value="">Select Supplier</option>
                {suppliers.map((supplier) => (
                  <option
                    key={supplier.id || supplier._id}
                    value={supplier.id || supplier._id}
                  >
                    {supplier.supplierName}
                  </option>
                ))}
              </select>
            </div>

            <div className="border-t pt-4 mt-4">
              <label className="block text-xs font-bold text-slate-500 mb-2">
                Add Item to PO
              </label>
              <div className="mb-2 relative" ref={productDropdownRef}>
                <input
                  type="text"
                  className="w-full border rounded p-2 text-sm"
                  placeholder="Type to search and select product..."
                  value={productSearchQuery}
                  onChange={(e) => handleProductInputChange(e.target.value)}
                  onFocus={() => setShowProductDropdown(true)}
                />
                {showProductDropdown && (
                  <div className="absolute z-10 w-full bg-white border border-gray-300 rounded mt-1 max-h-60 overflow-y-auto shadow-lg">
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map((p) => (
                        <div
                          key={p._id}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                          onClick={() =>
                            handleProductSelect(p._id, p.productName)
                          }
                        >
                          {p.productName}
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-gray-500 text-sm">
                        No products found
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">
                  Quantity
                </label>
                <div className="flex  gap-2">
                  <input
                    type="number"
                    className="w-full border rounded p-2 text-sm"
                    placeholder="Qty"
                    value={poQty}
                    onChange={(e) => setPOQty(Number(e.target.value))}
                    min="1"
                  />
                  <button
                    onClick={addPOItem}
                    className="bg-green-100 text-green-700 p-2 rounded hover:bg-green-200"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <label className="block text-xs font-bold text-slate-500 mb-1">
                Note (Optional)
              </label>
              <textarea
                className="w-full border rounded p-2 text-sm"
                value={poNote}
                onChange={(e) => setPONote(e.target.value)}
                placeholder="Additional notes..."
                rows={2}
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border flex flex-col">
          <h2 className="font-bold text-lg mb-4">PO Summary</h2>
          <div className="flex-1 overflow-auto mb-4">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50">
                <tr className="border-b">
                  <th className="py-2 px-1">Item</th>
                  <th className="py-2 px-1">Qty</th>
                  <th className="py-2 px-1">Unit Price</th>
                  <th className="py-2 px-1">Cost Price</th>
                  <th className="py-2 px-1 w-12">Action</th>
                </tr>
              </thead>
              <tbody>
                {poItems.map((item, i) => (
                  <tr key={i} className="border-b">
                    <td className="py-2">{item.name}</td>
                    <td className="py-2">{item.qty}</td>
                    <td className="py-2">{item.costPrice.toLocaleString()}</td>
                    <td className="py-2">
                      {(item.costPrice * item.qty).toLocaleString()}
                    </td>
                    <td className="py-2">
                      <button
                        onClick={() => removePOItem(i)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {poItems.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-slate-400 py-4">
                      No items added
                    </td>
                  </tr>
                )}
                <tr>
                  <td colSpan={5} className="text-right py-2">
                    Total:{" "}
                    {poItems
                      .reduce(
                        (total, item) => total + item.costPrice * item.qty,
                        0,
                      )
                      .toLocaleString()}{" "}
                    MMK
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          {poNote && (
            <div className="mb-4 p-3 bg-gray-50 border rounded text-sm">
              <span className="font-semibold text-gray-600 block mb-1">
                Order Note:
              </span>
              <p className="text-gray-800">{poNote}</p>
            </div>
          )}
          <button
            onClick={submitPO}
            disabled={poItems.length === 0 || !poSupplierId}
            className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            Create Purchase Order
          </button>
          <p className="text-xs text-slate-500 mt-2">
            Note: PO does NOT update stock. Use GRN to receive goods.
          </p>
        </div>
      </div>
    </Modal>
  );
};
