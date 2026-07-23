import { ActivityLogEntry } from "../../services/ActivityLog/fetchActivityLogs";

export const ACTIVITY_FEATURES = [
  { value: "", label: "All Features" },
  { value: "order", label: "Order" },
  { value: "inventory", label: "Inventory" },
  { value: "purchase", label: "Purchase" },
  { value: "grn", label: "GRN" },
  { value: "transfer", label: "Transfer" },
  { value: "quotation", label: "Quotation" },
  { value: "expense", label: "Expense" },
  { value: "credit", label: "Credit" },
  { value: "supplier", label: "Supplier" },
  { value: "warehouse_stock", label: "Warehouse Stock" },
  { value: "storefront_stock", label: "Storefront Stock" },
  { value: "warehouse_profile", label: "Warehouse Profile" },
  { value: "storefront_profile", label: "Storefront Profile" },
  { value: "admin", label: "Admin" },
] as const;

export const ACTIVITY_ACTIONS = [
  { value: "", label: "All Actions" },
  { value: "create", label: "Create" },
  { value: "update", label: "Update" },
  { value: "delete", label: "Delete" },
  { value: "login", label: "Login" },
  { value: "logout", label: "Logout" },
  { value: "create_payment", label: "Create Payment" },
  { value: "update_status", label: "Update Status" },
  { value: "update_quantity", label: "Update Quantity" },
  { value: "update_line_items", label: "Update Line Items" },
  { value: "mark_converted", label: "Mark Converted" },
] as const;

export function getAdminDisplay(log: ActivityLogEntry): {
  name: string;
  role: string;
  id: string;
} {
  if (typeof log.admin === "object" && log.admin) {
    return {
      name: log.admin.name || "Unknown",
      role: log.admin.role || "-",
      id: log.admin._id,
    };
  }
  return { name: "Unknown", role: "-", id: String(log.admin || "") };
}

export function formatRelativeTime(dateString: string): string {
  const then = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - then.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60)
    return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
  if (diffHour < 24)
    return `${diffHour} hour${diffHour === 1 ? "" : "s"} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;

  return then.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatFullDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function getActionBadgeClass(action: string): string {
  if (action === "create") return "bg-green-100 text-green-800 border-green-200";
  if (action === "delete") return "bg-red-100 text-red-800 border-red-200";
  if (action === "login" || action === "logout")
    return "bg-purple-100 text-purple-800 border-purple-200";
  if (action.startsWith("update") || action === "create_payment" || action === "mark_converted")
    return "bg-blue-100 text-blue-800 border-blue-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

export function formatActionLabel(action: string): string {
  return action.replace(/_/g, " ");
}

export function formatFeatureLabel(feature: string): string {
  return feature.replace(/_/g, " ");
}

export function getTargetLink(
  targetModel?: string | null,
  targetId?: string | null,
): string | null {
  if (!targetModel || !targetId) return null;
  const model = targetModel.toLowerCase();
  if (model === "order") return "/orders";
  if (model === "quotation") return `/quotations/${targetId}`;
  if (model === "credit") return `/credits/${targetId}`;
  if (model === "purchase" || model === "grn") return "/purchasing";
  if (model === "transfer") return "/settings";
  if (model === "inventory") return "/inventory";
  if (model === "expense") return "/expenses";
  if (model === "supplier") return "/suppliers";
  if (model === "warehouse" || model === "warehouseprofile")
    return `/warehouse/${targetId}`;
  if (model === "storefront" || model === "storefrontprofile")
    return `/storefront/${targetId}`;
  return null;
}

export function exportLogsToCsv(logs: ActivityLogEntry[]): void {
  const headers = [
    "Timestamp",
    "Admin",
    "Role",
    "Action",
    "Feature",
    "Description",
    "IP",
    "Target ID",
    "Target Model",
  ];
  const rows = logs.map((log) => {
    const admin = getAdminDisplay(log);
    return [
      log.createdAt,
      admin.name,
      admin.role,
      log.action,
      log.feature,
      `"${(log.description || "").replace(/"/g, '""')}"`,
      log.ip || "",
      log.targetId || "",
      log.targetModel || "",
    ].join(",");
  });
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `activity-logs-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
