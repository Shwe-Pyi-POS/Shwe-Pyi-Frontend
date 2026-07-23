import React from "react";

export type POReportStatus =
  | "pending"
  | "confirmed"
  | "arrived"
  | "completed"
  | "cancelled";

export const formatMMK = (amount: number) =>
  `${new Intl.NumberFormat("en-US").format(Math.round(amount))} MMK`;

export const formatDate = (iso?: string | null) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const getSupplierFromPurchase = (
  supplierId: { supplierName?: string; supplierCode?: string } | string,
): { name: string; code: string } => {
  if (typeof supplierId === "string") {
    return { name: supplierId, code: "" };
  }
  return {
    name: supplierId.supplierName || "—",
    code: supplierId.supplierCode || "",
  };
};

const STATUS_STYLES: Record<
  string,
  { label: string; className: string }
> = {
  pending: {
    label: "Pending",
    className: "bg-amber-100 text-amber-800 border-amber-200",
  },
  confirmed: {
    label: "Confirmed",
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  arrived: {
    label: "Arrived",
    className: "bg-orange-100 text-orange-800 border-orange-200",
  },
  completed: {
    label: "Completed",
    className: "bg-green-100 text-green-800 border-green-200",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-red-100 text-red-800 border-red-200",
  },
};

export const POStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const key = status?.toLowerCase() || "pending";
  const style = STATUS_STYLES[key] || STATUS_STYLES.pending;
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${style.className}`}
    >
      {style.label}
    </span>
  );
};

export const ReceivedProgressBar: React.FC<{
  received: number;
  ordered: number;
}> = ({ received, ordered }) => {
  const pct = ordered > 0 ? Math.min(100, Math.round((received / ordered) * 100)) : 0;
  return (
    <div className="w-full min-w-[100px]">
      <div className="flex justify-between text-xs text-slate-500 mb-1">
        <span>
          {received.toLocaleString()} / {ordered.toLocaleString()}
        </span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};
