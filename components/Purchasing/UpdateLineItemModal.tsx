import React, { useState } from "react";
import { Modal } from "../Modal";
import { Package, Edit2, Save, X } from "lucide-react";

interface LineItem {
  _id: string;
  receivedQuantity: number;
  goodQuantity: number;
  badQuantity: number;
  inventoryId?: {
    productName: string;
    productCode: string;
    SKU: string;
  };
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

interface UpdateLineItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  lineItem: LineItem | null;
  onSave: (
    lineItemId: string,
    goodQuantity: number,
    badQuantity: number,
    notes: string
  ) => Promise<void>;
  updating: boolean;
}

export const UpdateLineItemModal: React.FC<UpdateLineItemModalProps> = ({
  isOpen,
  onClose,
  lineItem,
  onSave,
  updating,
}) => {
  const [goodQuantity, setGoodQuantity] = useState(0);
  const [badQuantity, setBadQuantity] = useState(0);
  const [notes, setNotes] = useState("");

  React.useEffect(() => {
    if (lineItem) {
      setGoodQuantity(lineItem.goodQuantity);
      setBadQuantity(lineItem.badQuantity);
      setNotes(lineItem.notes || "");
    }
  }, [lineItem]);

  const handleGoodQuantityChange = (value: number) => {
    if (!lineItem) return;
    const newGoodQty = Math.max(0, Math.min(value, lineItem.receivedQuantity));
    const newBadQty = lineItem.receivedQuantity - newGoodQty;
    setGoodQuantity(newGoodQty);
    setBadQuantity(Math.max(0, newBadQty));
  };

  const handleBadQuantityChange = (value: number) => {
    if (!lineItem) return;
    const newBadQty = Math.max(0, Math.min(value, lineItem.receivedQuantity));
    const newGoodQty = lineItem.receivedQuantity - newBadQty;
    setBadQuantity(newBadQty);
    setGoodQuantity(Math.max(0, newGoodQty));
  };

  const handleSave = async () => {
    if (!lineItem) return;
    await onSave(lineItem._id, goodQuantity, badQuantity, notes);
  };

  const handleClose = () => {
    if (!updating) {
      onClose();
    }
  };

  if (!lineItem) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Update Line Item">
      <div className="space-y-6">
        {/* Product Info */}
        <div className="bg-slate-50 p-4 rounded-lg border">
          <div className="flex items-center gap-2 text-slate-700 font-semibold mb-2">
            <Package className="w-5 h-5" />
            Product Details
          </div>
          <div className="space-y-1">
            <div className="font-medium">
              {lineItem.inventoryId?.productName || "Unknown Product"}
            </div>
            <div className="text-sm text-slate-600">
              Code: {lineItem.inventoryId?.productCode || "-"} | SKU:{" "}
              {lineItem.inventoryId?.SKU || "-"}
            </div>
            <div className="text-sm text-slate-600">
              Unit Price: {lineItem.unitPrice.toLocaleString()} | Total:{" "}
              {lineItem.totalPrice.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Quantity Updates */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <label className="block text-sm font-medium text-blue-700 mb-2">
              Received Quantity
            </label>
            <div className="text-2xl font-bold text-blue-600">
              {lineItem.receivedQuantity}
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <label className="block text-sm font-medium text-green-700 mb-2">
              Good Quantity
            </label>
            <input
              type="number"
              min="0"
              max={lineItem.receivedQuantity}
              value={goodQuantity}
              onChange={(e) => handleGoodQuantityChange(Number(e.target.value))}
              className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={updating}
            />
          </div>

          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <label className="block text-sm font-medium text-red-700 mb-2">
              Bad Quantity
            </label>
            <input
              type="number"
              min="0"
              max={lineItem.receivedQuantity}
              value={badQuantity}
              onChange={(e) => handleBadQuantityChange(Number(e.target.value))}
              className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              disabled={updating}
            />
          </div>
        </div>

        {/* Notes */}
        {/* <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
            placeholder="Add any notes about this update..."
            disabled={updating}
          />
        </div> */}

        {/* Validation Info */}
        <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
          <div className="text-sm text-amber-800">
            <strong>Note:</strong> Good + Bad quantities should equal the
            received quantity ({lineItem.receivedQuantity}). Current total:{" "}
            {goodQuantity + badQuantity}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            onClick={handleClose}
            disabled={updating}
            className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={
              updating ||
              goodQuantity + badQuantity !== lineItem.receivedQuantity
            }
            className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {updating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Updating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Update Line Item
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};
