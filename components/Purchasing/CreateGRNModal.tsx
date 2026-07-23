import React, { useState, useEffect } from "react";
import { Modal } from "../Modal";
import { ApiPurchaseOrder, Supplier } from "../../types";
import { createGRN } from "../../services/Purchase/createGRN";
import { toast } from "sonner";

interface ExtendedGRNItem {
  productId: string;
  productCode: string;
  name: string;
  qtyOrdered: number;
  qtyReceived: number;
  qtyGood: number;
  qtyBad: number;
  costPrice: number;
  isSelected: boolean;
}

interface CreateGRNModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrders: ApiPurchaseOrder[];
  suppliers: Supplier[];
  onSuccess: () => void;
  selectedPOId?: string | null;
}

export const CreateGRNModal: React.FC<CreateGRNModalProps> = ({
  isOpen,
  onClose,
  purchaseOrders,
  suppliers,
  onSuccess,
  selectedPOId: propSelectedPOId,
}) => {
  const [internalSelectedPOId, setInternalSelectedPOId] = useState("");
  const [grnItems, setGRNItems] = useState<ExtendedGRNItem[]>([]);
  const [grnNote, setGRNNote] = useState("");
  const [grnDate, setGrnDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use propSelectedPOId if provided, otherwise use internal state
  const selectedPOId = propSelectedPOId || internalSelectedPOId;

  useEffect(() => {
    if (propSelectedPOId) {
      setInternalSelectedPOId(propSelectedPOId);
    }
  }, [propSelectedPOId]);

  const pendingPOs = purchaseOrders.filter((p) => {
    const status = p.status?.toLowerCase();
    return status === "arrived" && p.totalRemainingQuantity > 0;
  });

  const selectedPO = purchaseOrders.find((p) => p._id === selectedPOId);

  // const getSupplierName = (supplierId: string) => {
  //   const supplier = suppliers.find(
  //     (s) => s.id === supplierId || s._id === supplierId
  //   );
  //   return supplier ? supplier.supplierName : "Unknown Supplier";
  // };

  const loadPOItems = () => {
    if (!selectedPOId) return;
    const po = purchaseOrders.find((p) => p._id === selectedPOId);
    if (!po) return;

    const grnItemsForPO: ExtendedGRNItem[] = po.products
      .filter((item) => item.productStatus === "pending")
      .map((item) => ({
        productId: item.inventoryId,
        productCode: item.productCode || "",
        name: item.productName,
        qtyOrdered: item.purchaseQuantity,
        qtyReceived: item.purchaseQuantity,
        qtyGood: item.purchaseQuantity,
        qtyBad: 0,
        costPrice: item.buyingPrice,
        isSelected: true,
      }));

    setGRNItems(grnItemsForPO);
  };

  const updateGRNItem = (
    index: number,
    field: keyof ExtendedGRNItem,
    value: number | boolean
  ) => {
    setGRNItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index] };

      if (field === "isSelected") {
        item.isSelected = value as boolean;
      } else if (field === "qtyReceived") {
        item.qtyReceived = value as number;
        if (value < item.qtyGood) {
          item.qtyGood = value;
          item.qtyBad = 0;
        }
      } else if (field === "qtyGood") {
        item.qtyGood = Math.min(value as number, item.qtyReceived);
        item.qtyBad = item.qtyReceived - item.qtyGood;
      } else if (field === "qtyBad") {
        item.qtyBad = Math.min(value as number, item.qtyReceived);
        item.qtyGood = item.qtyReceived - item.qtyBad;
      }

      updated[index] = item;
      return updated;
    });
  };

  const resetForm = () => {
    if (!propSelectedPOId) {
      setInternalSelectedPOId("");
    }
    setGRNItems([]);
    setGRNNote("");
    setGrnDate(new Date().toISOString().split("T")[0]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const submitGRN = async (selectedItemsOnly = false) => {
    if (!selectedPOId) {
      toast.error("Please select a Purchase Order");
      return;
    }

    if (grnItems.length === 0) {
      toast.error("Please load PO items first");
      return;
    }

    const itemsToProcess = selectedItemsOnly
      ? grnItems.filter((item) => item.isSelected)
      : grnItems;

    if (itemsToProcess.length === 0) {
      toast.error("Please select at least one item to create GRN");
      return;
    }

    for (const item of itemsToProcess) {
      if (item.qtyReceived !== item.qtyGood + item.qtyBad) {
        toast.error(
          `For ${item.name}: Received quantity must equal Good + Bad quantities`
        );
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const payload = {
        purchasingId: selectedPOId,
        lineItems: itemsToProcess.map((item) => ({
          productCode: item.productCode,
          goodQuantity: item.qtyGood,
          badQuantity: item.qtyBad,
        })),
        grnDate: grnDate,
        notes: grnNote,
      };

      const result = await createGRN(payload);

      if (result.success) {
        toast.success("GRN Created Successfully!");
        resetForm();
        onSuccess();
        onClose();
      } else {
        toast.error(result.message || "Failed to create GRN");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while creating GRN");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Goods Received Note"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel - PO Selection */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Select Purchase Order
            </label>
            <select
              className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
              value={selectedPOId}
              onChange={(e) => {
                setInternalSelectedPOId(e.target.value);
                setGRNItems([]);
              }}
            >
              <option value="">Select PO...</option>
              {pendingPOs.map((po) => (
                <option key={po._id} value={po._id}>
                  {po.poNumber} - {po.supplierId.supplierName} ({po.status})
                </option>
              ))}
            </select>
          </div>

          {selectedPO && (
            <div className="p-4 bg-slate-50 rounded-lg border">
              <h3 className="font-semibold text-slate-800 mb-3">PO Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Supplier:</span>
                  <span className="font-medium">
                    {selectedPO.supplierId.supplierName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date:</span>
                  <span className="font-medium">
                    {new Date(selectedPO.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Amount:</span>
                  <span className="font-medium">
                    {selectedPO.totalAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Products:</span>
                  <span className="font-medium">
                    {selectedPO.products.length} item(s)
                  </span>
                </div>
              </div>
              <button
                onClick={loadPOItems}
                className="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Load PO Items
              </button>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              GRN Date
            </label>
            <input
              type="date"
              className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
              value={grnDate}
              onChange={(e) => setGrnDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Note (Optional)
            </label>
            <textarea
              className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
              value={grnNote}
              onChange={(e) => setGRNNote(e.target.value)}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>
        </div>

        {/* Right Panel - GRN Items */}
        <div className="flex flex-col">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-slate-800">
              GRN Items - Select & Process
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setGRNItems((prev) =>
                    prev.map((item) => ({ ...item, isSelected: true }))
                  );
                }}
                className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                Select All
              </button>
              <button
                onClick={() => {
                  setGRNItems((prev) =>
                    prev.map((item) => ({ ...item, isSelected: false }))
                  );
                }}
                className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Deselect All
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto border rounded-lg bg-slate-50 p-4">
            {grnItems.length === 0 ? (
              <div className="text-center text-slate-400 py-12">
                Select a PO and click "Load PO Items" to start
              </div>
            ) : (
              <div className="space-y-4">
                {grnItems.map((item, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 shadow-sm ${
                      item.isSelected
                        ? "bg-white border-blue-300"
                        : "bg-gray-50 border-gray-200 opacity-60"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={item.isSelected}
                          onChange={(e) =>
                            updateGRNItem(index, "isSelected", e.target.checked)
                          }
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <div>
                          <div className="font-semibold text-slate-800">
                            {item.name}{" "}
                            <span className="text-xs text-gray-500 font-normal">
                              ({item.productCode})
                            </span>
                          </div>
                          <div className="text-xs text-slate-500">
                            Ordered: {item.qtyOrdered} | Cost:{" "}
                            {item.costPrice.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                    {item.isSelected && (
                      <div className="space-y-3 ml-7">
                        <div>
                          <label className="text-xs text-slate-500 block mb-1">
                            Received Qty:
                          </label>
                          <input
                            type="number"
                            className="w-full border rounded-lg p-2 text-sm"
                            value={item.qtyReceived}
                            onChange={(e) =>
                              updateGRNItem(
                                index,
                                "qtyReceived",
                                Number(e.target.value)
                              )
                            }
                            min="0"
                            max={item.qtyOrdered}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-slate-500 block mb-1">
                              Good:
                            </label>
                            <input
                              type="number"
                              className="w-full border rounded-lg p-2 text-sm bg-green-50 focus:ring-green-500"
                              value={item.qtyGood}
                              onChange={(e) =>
                                updateGRNItem(
                                  index,
                                  "qtyGood",
                                  Number(e.target.value)
                                )
                              }
                              min="0"
                              max={item.qtyReceived}
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-500 block mb-1">
                              Bad:
                            </label>
                            <input
                              type="number"
                              className="w-full border rounded-lg p-2 text-sm bg-red-50 focus:ring-red-500"
                              value={item.qtyBad}
                              onChange={(e) =>
                                updateGRNItem(
                                  index,
                                  "qtyBad",
                                  Number(e.target.value)
                                )
                              }
                              min="0"
                              max={item.qtyReceived}
                            />
                          </div>
                        </div>
                        {item.qtyReceived !== item.qtyGood + item.qtyBad && (
                          <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                            ⚠ Received must equal Good + Bad
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 space-y-2">
            <div className="grid grid-cols-1 gap-2">
              {/* <button
                onClick={() => submitGRN(false)}
                disabled={
                  grnItems.length === 0 || !selectedPOId || isSubmitting
                }
                className="bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
              >
                {isSubmitting ? "Creating..." : "Create GRN (All Items)"}
              </button> */}
              <button
                onClick={() => submitGRN(true)}
                disabled={
                  grnItems.filter((item) => item.isSelected).length === 0 ||
                  !selectedPOId ||
                  isSubmitting
                }
                className="bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
              >
                {isSubmitting ? "Creating..." : "Create GRN"}
              </button>
            </div>
            <p className="text-xs text-slate-500 text-center">
              Only good items will be added to Warehouse. Bad items are logged
              but not added to stock.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};
