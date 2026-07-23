import React, { useState } from "react";
import { UserPlus, Loader2 } from "lucide-react";

interface AddCustomerInlineProps {
  onSave: (name: string, phone: string, address: string) => Promise<boolean>;
  onCancel: () => void;
}

export const AddCustomerInline: React.FC<AddCustomerInlineProps> = ({
  onSave,
  onCancel,
}) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !phone.trim()) return;
    setSaving(true);
    const success = await onSave(name.trim(), phone.trim(), address.trim());
    setSaving(false);
    if (success) {
      setName("");
      setPhone("");
      setAddress("");
    }
  };

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <UserPlus className="w-4 h-4 text-orange-600" />
        <p className="text-sm font-medium text-orange-800">Add New Customer</p>
      </div>
      <input
        type="text"
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name *"
      />
      <input
        type="text"
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Phone *"
      />
      <input
        type="text"
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="Address (optional)"
      />
      <div className="flex gap-2 pt-1">
        <button
          onClick={handleSave}
          disabled={!name.trim() || !phone.trim() || saving}
          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
        >
          {saving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <>Save</>
          )}
        </button>
        <button
          onClick={onCancel}
          disabled={saving}
          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
