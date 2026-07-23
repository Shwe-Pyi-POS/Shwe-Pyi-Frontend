import React from "react";
import {
  Store,
  MapPin,
  Phone,
  Mail,
  Receipt,
  BadgePercent,
  CircleDollarSign,
} from "lucide-react";
import { ShopSettings } from "../../services/ShopSettings/fetchShopSettings";

interface ShopInfoCardProps {
  settings: ShopSettings;
}

const InfoRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}> = ({ icon, label, value }) => (
  <div className="flex gap-3 py-3 border-b border-slate-100 last:border-0">
    <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
        {label}
      </p>
      <p className="text-sm font-medium text-slate-800 mt-0.5 break-words">
        {value}
      </p>
    </div>
  </div>
);

export const ShopInfoCard: React.FC<ShopInfoCardProps> = ({ settings }) => {
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleString();
  // console.log(settings);

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      <div className="p-4 sm:p-6 border-b bg-gradient-to-r from-blue-50 to-slate-50">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
          {settings.logo ? (
            <img
              src={settings.logo}
              alt={settings.shopName}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover border-2 border-white shadow-md"
            />
          ) : (
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-blue-100 flex items-center justify-center">
              <Store className="w-10 h-10 text-blue-600" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-slate-800 truncate">
              {settings.shopName}
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  settings.isActive
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {settings.isActive ? "Active" : "Inactive"}
              </span>
              <span className="text-xs text-slate-500">
                Updated {formatDate(settings.updatedAt)}
              </span>
            </div>
            {settings.updatedBy && (
              <p className="text-xs text-slate-500 mt-1">
                Last updated by {settings.updatedBy.name} (
                {settings.updatedBy.role})
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <InfoRow
          icon={<MapPin className="w-4 h-4" />}
          label="Address"
          value={settings.address}
        />
        <InfoRow
          icon={<Phone className="w-4 h-4" />}
          label="Phone"
          value={settings.phoneNumber}
        />
        {/* <InfoRow
          icon={<Mail className="w-4 h-4" />}
          label="Email"
          value={settings.email}
        />
        <InfoRow
          icon={<Receipt className="w-4 h-4" />}
          label="Tax ID"
          value={settings.taxId}
        />
        <InfoRow
          icon={<CircleDollarSign className="w-4 h-4" />}
          label="Currency"
          value={settings.currency}
        />
        <InfoRow
          icon={<BadgePercent className="w-4 h-4" />}
          label="Tax Rate"
          value={`${settings.taxRate}%`}
        /> */}
      </div>
    </div>
  );
};
