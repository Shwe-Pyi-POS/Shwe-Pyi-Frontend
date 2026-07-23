import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  History,
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Filter,
  Download,
  AlertCircle,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchActivityLogs,
  ActivityLogEntry,
  FetchActivityLogsParams,
} from "../../services/ActivityLog/fetchActivityLogs";
import { fetchAdminAccounts } from "../../services/Admin/fetchAdminAccounts";
import { DateRangePicker } from "../Reports/DateRangePicker";
import {
  ACTIVITY_FEATURES,
  ACTIVITY_ACTIONS,
  getAdminDisplay,
  formatRelativeTime,
  formatFullDateTime,
  getActionBadgeClass,
  formatActionLabel,
  formatFeatureLabel,
  getTargetLink,
  exportLogsToCsv,
} from "./activityLogUtils";

interface ActivityLogFilters {
  feature: string;
  action: string;
  admin: string;
  startDate: string;
  endDate: string;
}

const defaultFilters: ActivityLogFilters = {
  feature: "",
  action: "",
  admin: "",
  startDate: "",
  endDate: "",
};

const parseFilterDate = (value: string): Date | null => {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatFilterDate = (date: Date | null): string => {
  if (!date) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <tr key={i} className="animate-pulse">
          <td className="px-4 py-3">
            <div className="h-4 bg-slate-200 rounded w-28" />
          </td>
          <td className="px-4 py-3 hidden md:table-cell">
            <div className="h-4 bg-slate-200 rounded w-24" />
          </td>
          <td className="px-4 py-3">
            <div className="h-6 bg-slate-200 rounded w-16" />
          </td>
          <td className="px-4 py-3 hidden sm:table-cell">
            <div className="h-6 bg-slate-200 rounded w-20" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 bg-slate-200 rounded w-full max-w-xs" />
          </td>
          <td className="px-4 py-3 hidden lg:table-cell">
            <div className="h-4 bg-slate-200 rounded w-16" />
          </td>
        </tr>
      ))}
    </>
  );
}

function MetadataDisplay({ metadata }: { metadata: Record<string, unknown> }) {
  const entries = Object.entries(metadata);
  if (entries.length === 0) {
    return <p className="text-sm text-slate-500">No metadata</p>;
  }
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
      {entries.map(([key, value]) => (
        <div key={key} className="bg-white rounded border px-3 py-2">
          <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            {key}
          </dt>
          <dd className="text-slate-800 mt-0.5 break-all font-mono text-xs">
            {typeof value === "object"
              ? JSON.stringify(value, null, 2)
              : String(value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export const ActivityLogTab: React.FC = () => {
  const adminData = JSON.parse(localStorage.getItem("adminData") || "{}");
  const userRole = adminData?.role as string | undefined;
  const canView = userRole === "owner" || userRole === "admin";

  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draftFilters, setDraftFilters] =
    useState<ActivityLogFilters>(defaultFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<ActivityLogFilters>(defaultFilters);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [limit, setLimit] = useState(20);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [admins, setAdmins] = useState<{ _id: string; name: string }[]>([]);

  const loadAdmins = async () => {
    const res = await fetchAdminAccounts();
    if (res.success && res.data?.accounts) {
      setAdmins(
        res.data.accounts
          .filter((a) => !a.softDeleted)
          .map((a) => ({ _id: a._id, name: a.name })),
      );
    }
  };

  const buildParams = useCallback(
    (page: number): FetchActivityLogsParams => {
      const params: FetchActivityLogsParams = {
        page,
        limit,
        sortBy: "createdAt",
        sortOrder: "desc",
      };
      if (appliedFilters.feature) params.feature = appliedFilters.feature;
      if (appliedFilters.action) params.action = appliedFilters.action;
      if (appliedFilters.admin) params.admin = appliedFilters.admin;
      if (appliedFilters.startDate) params.startDate = appliedFilters.startDate;
      if (appliedFilters.endDate) params.endDate = appliedFilters.endDate;
      return params;
    },
    [limit, appliedFilters],
  );

  const loadLogs = useCallback(
    async (page: number = 1) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchActivityLogs(buildParams(page));
        if (response.success) {
          setLogs(response.data.logs);
          setTotalPages(response.data.pagination.totalPages);
          setCurrentPage(response.data.pagination.currentPage);
          setTotalItems(response.data.pagination.totalItems);
        } else {
          setError(response.message || "Failed to load activity logs");
          setLogs([]);
        }
      } catch {
        setError("Failed to load activity logs");
        setLogs([]);
      } finally {
        setLoading(false);
      }
    },
    [buildParams],
  );

  useEffect(() => {
    if (canView) {
      loadAdmins();
    }
  }, [canView]);

  useEffect(() => {
    if (canView) {
      loadLogs(currentPage);
    } else {
      setLoading(false);
    }
  }, [canView, currentPage, limit, appliedFilters, loadLogs]);

  const handleApplyFilters = () => {
    setAppliedFilters({ ...draftFilters });
    setCurrentPage(1);
    setExpandedId(null);
  };

  const handleClearFilters = () => {
    setDraftFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
    setCurrentPage(1);
    setExpandedId(null);
  };

  const hasActiveFilters = Object.values(appliedFilters).some((v) => v !== "");

  const dateRangeLabel =
    logs.length > 0
      ? `${formatFullDateTime(logs[logs.length - 1].createdAt)} → ${formatFullDateTime(logs[0].createdAt)}`
      : null;

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  if (!canView) {
    return (
      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border text-center">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-slate-800 mb-2">
          Access Restricted
        </h2>
        <p className="text-slate-500 text-sm">
          Activity logs are only available to owner and admin accounts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-primary" />
          Filters
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Feature
            </label>
            <select
              value={draftFilters.feature}
              onChange={(e) =>
                setDraftFilters((f) => ({ ...f, feature: e.target.value }))
              }
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
            >
              {ACTIVITY_FEATURES.map((opt) => (
                <option key={opt.value || "all"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Action
            </label>
            <select
              value={draftFilters.action}
              onChange={(e) =>
                setDraftFilters((f) => ({ ...f, action: e.target.value }))
              }
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
            >
              {ACTIVITY_ACTIONS.map((opt) => (
                <option key={opt.value || "all"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Admin
            </label>
            <select
              value={draftFilters.admin}
              onChange={(e) =>
                setDraftFilters((f) => ({ ...f, admin: e.target.value }))
              }
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
            >
              <option value="">All Admins</option>
              {admins.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div className="">
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Date Range
            </label>
            <DateRangePicker
              startDate={parseFilterDate(draftFilters.startDate)}
              endDate={parseFilterDate(draftFilters.endDate)}
              onChange={(newStartDate, newEndDate) => {
                setDraftFilters((f) => ({
                  ...f,
                  startDate: formatFilterDate(newStartDate),
                  endDate: formatFilterDate(newEndDate),
                }));
              }}
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={handleApplyFilters}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 text-sm font-medium"
            >
              Apply
            </button>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-3 py-2 border rounded-lg text-slate-600 hover:bg-slate-50 text-sm"
                title="Clear filters"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Summary + toolbar */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Activity Log (မှတ်တမ်း)
            </h2>
            {!loading && !error && (
              <p className="text-sm text-slate-500 mt-1">
                Total:{" "}
                <span className="font-medium text-slate-700">{totalItems}</span>{" "}
                log{totalItems === 1 ? "" : "s"}
                {hasActiveFilters && " (filtered)"}
                {dateRangeLabel && (
                  <span className="hidden md:inline">
                    {" "}
                    · Range: {dateRangeLabel}
                  </span>
                )}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border text-sm">
              <span className="text-slate-600">Per page:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-transparent font-semibold text-slate-800 outline-none cursor-pointer"
              >
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <button
              type="button"
              onClick={() => exportLogsToCsv(logs)}
              disabled={logs.length === 0}
              className="flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-slate-50 disabled:opacity-50 text-sm"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
            <button
              type="button"
              onClick={() => loadLogs(currentPage)}
              disabled={loading}
              className="flex items-center gap-2 bg-slate-600 text-white px-3 py-2 rounded-lg hover:bg-slate-700 disabled:opacity-50 text-sm"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </p>
            <button
              type="button"
              onClick={() => loadLogs(currentPage)}
              className="text-sm px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">
                    Timestamp
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 hidden md:table-cell">
                    Admin
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">
                    Action
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 hidden sm:table-cell">
                    Feature
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 hidden lg:table-cell">
                    IP
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <SkeletonRows />
              </tbody>
            </table>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-medium mb-2">
              No activity logs found matching your filters
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-primary hover:underline text-sm"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {logs.map((log) => {
                const admin = getAdminDisplay(log);
                const isExpanded = expandedId === log._id;
                const targetLink = getTargetLink(log.targetModel, log.targetId);
                return (
                  <div
                    key={log._id}
                    className="border rounded-lg overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => toggleExpand(log._id)}
                      className="w-full text-left p-4 hover:bg-slate-50"
                    >
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <span
                          className="text-xs text-slate-500"
                          title={formatFullDateTime(log.createdAt)}
                        >
                          {formatRelativeTime(log.createdAt)}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium border capitalize ${getActionBadgeClass(log.action)}`}
                        >
                          {formatActionLabel(log.action)}
                        </span>
                      </div>
                      <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-xs mb-2 capitalize">
                        {formatFeatureLabel(log.feature)}
                      </span>
                      <p className="text-sm text-slate-800 line-clamp-2">
                        {log.description}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {admin.name} · {log.ip || "-"}
                      </p>
                    </button>
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-0 border-t bg-slate-50 text-sm space-y-2">
                        {log.targetId && (
                          <p>
                            <span className="text-slate-500">Target: </span>
                            {targetLink ? (
                              <Link
                                to={targetLink}
                                className="text-primary hover:underline font-mono text-xs"
                              >
                                {log.targetId}
                              </Link>
                            ) : (
                              <span className="font-mono text-xs">
                                {log.targetId}
                              </span>
                            )}
                            {log.targetModel && (
                              <span className="text-slate-500">
                                {" "}
                                ({log.targetModel})
                              </span>
                            )}
                          </p>
                        )}
                        {log.metadata &&
                          Object.keys(log.metadata).length > 0 && (
                            <MetadataDisplay metadata={log.metadata} />
                          )}
                        <p className="text-xs text-slate-500">
                          {formatFullDateTime(log.createdAt)}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm text-left min-w-[900px]">
                <thead className="bg-slate-50 border-b sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-slate-600 w-8" />
                    <th className="px-4 py-3 font-semibold text-slate-600">
                      Timestamp
                    </th>
                    <th className="px-4 py-3 font-semibold text-slate-600">
                      Admin
                    </th>
                    <th className="px-4 py-3 font-semibold text-slate-600">
                      Action
                    </th>
                    <th className="px-4 py-3 font-semibold text-slate-600">
                      Feature
                    </th>
                    <th className="px-4 py-3 font-semibold text-slate-600">
                      Description
                    </th>
                    <th className="px-4 py-3 font-semibold text-slate-600">
                      IP
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {logs.map((log) => {
                    const admin = getAdminDisplay(log);
                    const isExpanded = expandedId === log._id;
                    const targetLink = getTargetLink(
                      log.targetModel,
                      log.targetId,
                    );
                    return (
                      <React.Fragment key={log._id}>
                        <tr
                          className={`hover:bg-slate-50 cursor-pointer ${isExpanded ? "bg-blue-50/50" : ""}`}
                          onClick={() => toggleExpand(log._id)}
                        >
                          <td className="px-4 py-3 text-slate-400">
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </td>
                          <td
                            className="px-4 py-3 text-slate-600 whitespace-nowrap"
                            title={log.createdAt}
                          >
                            {formatRelativeTime(log.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-800">
                              {admin.name}
                            </div>
                            <div className="text-xs text-slate-500 uppercase">
                              {admin.role}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium border capitalize ${getActionBadgeClass(log.action)}`}
                            >
                              {formatActionLabel(log.action)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 rounded bg-slate-100 text-slate-600 text-xs capitalize">
                              {formatFeatureLabel(log.feature)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-800 max-w-md">
                            <span className="line-clamp-2">
                              {log.description}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-500">
                            {log.ip || "-"}
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-slate-50">
                            <td colSpan={7} className="px-4 py-4">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
                                <div className="space-y-2">
                                  <p>
                                    <span className="font-medium text-slate-600">
                                      Admin:{" "}
                                    </span>
                                    {admin.name} (role: {admin.role})
                                  </p>
                                  <p>
                                    <span className="font-medium text-slate-600">
                                      IP Address:{" "}
                                    </span>
                                    <span className="font-mono">
                                      {log.ip || "-"}
                                    </span>
                                  </p>
                                  <p>
                                    <span className="font-medium text-slate-600">
                                      Created At:{" "}
                                    </span>
                                    {formatFullDateTime(log.createdAt)}
                                    <span className="text-slate-400 text-xs ml-1">
                                      ({log.createdAt})
                                    </span>
                                  </p>
                                  {log.targetModel && (
                                    <p>
                                      <span className="font-medium text-slate-600">
                                        Target Model:{" "}
                                      </span>
                                      {log.targetModel}
                                    </p>
                                  )}
                                  {log.targetId && (
                                    <p>
                                      <span className="font-medium text-slate-600">
                                        Target ID:{" "}
                                      </span>
                                      {targetLink ? (
                                        <Link
                                          to={targetLink}
                                          onClick={(e) => e.stopPropagation()}
                                          className="text-primary hover:underline font-mono text-xs"
                                        >
                                          {log.targetId}
                                        </Link>
                                      ) : (
                                        <span className="font-mono text-xs">
                                          {log.targetId}
                                        </span>
                                      )}
                                    </p>
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium text-slate-600 mb-2">
                                    Metadata
                                  </p>
                                  {log.metadata &&
                                  Object.keys(log.metadata).length > 0 ? (
                                    <MetadataDisplay metadata={log.metadata} />
                                  ) : (
                                    <p className="text-slate-500">—</p>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 px-4 py-3 border-t flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 rounded-b-xl">
                <p className="text-sm text-slate-600">
                  Page {currentPage} of {totalPages} · {totalItems} items
                </p>
                <nav className="inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1 || loading}
                    className="px-2 py-2 rounded-l-md border bg-white disabled:opacity-50"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) pageNum = i + 1;
                    else if (currentPage <= 3) pageNum = i + 1;
                    else if (currentPage >= totalPages - 2)
                      pageNum = totalPages - 4 + i;
                    else pageNum = currentPage - 2 + i;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-4 py-2 border text-sm ${
                          currentPage === pageNum
                            ? "bg-primary text-white border-primary"
                            : "bg-white hover:bg-slate-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage >= totalPages || loading}
                    className="px-2 py-2 rounded-r-md border bg-white disabled:opacity-50"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
