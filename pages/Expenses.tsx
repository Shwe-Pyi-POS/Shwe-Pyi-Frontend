import React, { useState, useEffect } from "react";
import {
  PieChart,
  RefreshCw,
  MapPin,
  User,
  Calendar,
  Loader2,
  Plus,
  X,
  Edit,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { fetchExpenses, Expense } from "../services/Expense/fetchExpenses";
import { createExpense } from "../services/Expense/createExpense";
import { updateExpense } from "../services/Expense/updateExpense";
import { deleteExpense } from "../services/Expense/deleteExpense";
import {
  fetchLocationProfiles,
  LocationProfile,
} from "../services/Location/fetchLocationProfiles";
import { useLanguage } from "../context/LanguageContext";
import { ConfirmModal } from "../components/Common/ConfirmModal";
import { DateRangePicker } from "../components/Reports/DateRangePicker";

// Helper function to get today's date
const getToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

export const Expenses: React.FC = () => {
  const { t } = useLanguage();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<LocationProfile[]>([]);

  // Date Filter State
  const [startDate, setStartDate] = useState<Date | null>(getToday());
  const [endDate, setEndDate] = useState<Date | null>(getToday());

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    category: "electricity",
    amount: 0,
    date: new Date().toISOString().split("T")[0], // Format: YYYY-MM-DD
    notes: "",
    locationId: "", // Add locationId to form data
  });

  // Delete Confirmation Modal State
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const adminData = JSON.parse(localStorage.getItem("adminData") || "{}");
  const userRole = adminData.role;

  useEffect(() => {
    loadExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const response = await fetchLocationProfiles();
      if (response.success && response.data) {
        setLocations(response.data);
      } else {
        toast.error(response.message || "Failed to load locations");
      }
    } catch (error) {
      console.error("Error loading locations:", error);
      toast.error("Failed to load locations");
    }
  };

  const formatDateForAPI = (date: Date | null): string | null => {
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const startDateStr = formatDateForAPI(startDate);
      const endDateStr = formatDateForAPI(endDate);
      const response = await fetchExpenses(startDateStr, endDateStr);
      if (response.success && response.data) {
        setExpenses(response.data);
      } else {
        toast.error(response.message || t("expenses.failedToLoad"));
      }
    } catch (error) {
      console.error("Error loading expenses:", error);
      toast.error(t("expenses.failedToLoad"));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (expense: Expense) => {
    setEditingId(expense._id);
    setFormData({
      category: expense.category,
      amount: expense.amount,
      date: expense.date.split("T")[0], // Extract date part if it includes time
      notes: expense.notes || "",
      locationId: expense.locationId?._id || "", // Include locationId _id
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      category: "electricity",
      amount: 0,
      date: new Date().toISOString().split("T")[0],
      notes: "",
      locationId: "", // Reset locationId
    });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.category ||
      formData.amount <= 0 ||
      !formData.date ||
      (userRole !== "cashier" && !formData.locationId)
    ) {
      toast.error(t("expenses.fillRequiredFields"));
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        // Update existing expense
        const payload: any = {};
        if (formData.category) payload.category = formData.category;
        if (formData.amount > 0) payload.amount = formData.amount;
        if (formData.date) payload.date = formData.date;
        if (formData.notes) payload.notes = formData.notes;
        if (userRole !== "cashier" && formData.locationId)
          payload.locationId = formData.locationId;

        const response = await updateExpense(editingId, payload);

        if (response.success) {
          toast.success(t("expenses.expenseUpdated"));
          handleCloseModal();
          loadExpenses();
        } else {
          toast.error(response.message || t("expenses.failedToUpdate"));
        }
      } else {
        // Create new expense
        const payload: any = {
          category: formData.category,
          amount: formData.amount,
          date: formData.date,
          ...(formData.notes && { notes: formData.notes }),
        };

        // Only add locationId for non-cashier users
        if (userRole !== "cashier" && formData.locationId) {
          payload.locationId = formData.locationId;
        }

        const response = await createExpense(payload);

        if (response.success) {
          toast.success(t("expenses.expenseCreated"));
          handleCloseModal();
          loadExpenses();
        } else {
          toast.error(response.message || t("expenses.failedToCreate"));
        }
      }
    } catch (error: any) {
      console.error(
        editingId ? "Error updating expense:" : "Error creating expense:",
        error,
      );
      toast.error(
        error.message ||
          (editingId
            ? t("expenses.failedToUpdate")
            : t("expenses.failedToCreate")),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleDelete = (expense: Expense) => {
    setExpenseToDelete(expense);
  };

  const handleConfirmDelete = async () => {
    if (!expenseToDelete) return;

    setIsDeleting(true);
    try {
      const response = await deleteExpense(expenseToDelete._id);
      if (response.success) {
        toast.success(
          response.message ||
            t("expenses.expenseDeleted") ||
            "Expense deleted successfully",
        );
        setExpenseToDelete(null);
        loadExpenses();
      } else {
        toast.error(
          response.message ||
            t("expenses.failedToDelete") ||
            "Failed to delete expense",
        );
      }
    } catch (error: any) {
      console.error("Error deleting expense:", error);
      toast.error(
        error.message ||
          t("expenses.failedToDelete") ||
          "Failed to delete expense",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0,
  );

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <PieChart className="w-5 h-5 sm:w-7 sm:h-7 text-primary" />
            {t("expenses.title")}
          </h1>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onChange={(newStartDate, newEndDate) => {
              setStartDate(newStartDate);
              setEndDate(newEndDate);
            }}
          />
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-2 sm:px-4 rounded-lg transition-colors text-sm sm:text-base"
            >
              <Plus className="w-4 h-4" />{" "}
              <span className="hidden sm:inline">
                {t("expenses.addExpense")}
              </span>
            </button>
            <button
              onClick={loadExpenses}
              disabled={loading}
              className="hidden sm:flex items-center gap-2 bg-slate-600 text-white px-3 py-2 sm:px-4 rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-colors text-sm sm:text-base"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">{t("common.refresh")}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Card */}
      <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border mb-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-2 bg-red-100 rounded-lg">
            <PieChart className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
          </div>
          <div>
            <p className="text-xs sm:text-sm text-slate-500">
              {t("expenses.totalExpenses")}
            </p>
            <p className="text-lg sm:text-2xl font-bold text-slate-800">
              {totalExpenses.toLocaleString()}{" "}
              <span className="hidden sm:inline">MMK</span>
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm border rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
            <p>{t("expenses.loading")}</p>
          </div>
        ) : expenses.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <PieChart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p>{t("expenses.noExpenses")}</p>
          </div>
        ) : (
          <div>
            {/* Mobile scroll indicator */}
            <div className="sm:hidden px-4 py-2 bg-slate-50 text-xs text-slate-500 text-center">
              ← Swipe to see more →
            </div>

            {/* Table container with horizontal scroll on mobile */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left min-w-[900px]">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-2 sm:px-4 py-3 font-semibold text-slate-600">
                      <span className="hidden sm:inline">
                        {t("expenses.date")}
                      </span>
                      <span className="sm:hidden">Date</span>
                    </th>
                    <th className="px-2 sm:px-4 py-3 font-semibold text-slate-600">
                      <span className="hidden sm:inline">
                        {t("expenses.category")}
                      </span>
                      <span className="sm:hidden">Category</span>
                    </th>
                    <th className="px-2 sm:px-4 py-3 font-semibold text-slate-600">
                      <span className="hidden sm:inline">
                        {t("expenses.location")}
                      </span>
                      <span className="sm:hidden">Location</span>
                    </th>
                    <th className="px-2 sm:px-4 py-3 font-semibold text-slate-600">
                      <span className="hidden sm:inline">
                        {t("expenses.notes")}
                      </span>
                      <span className="sm:hidden">Notes</span>
                    </th>
                    <th className="px-2 sm:px-4 py-3 font-semibold text-slate-600">
                      <span className="hidden sm:inline">
                        {t("expenses.recordedBy")}
                      </span>
                      <span className="sm:hidden">Recorded By</span>
                    </th>
                    <th className="px-2 sm:px-4 py-3 font-semibold text-slate-600 text-right">
                      <span className="hidden sm:inline">
                        {t("expenses.amount")}
                      </span>
                      <span className="sm:hidden">Amount</span>
                    </th>
                    {userRole === "owner" && (
                      <th className="px-2 sm:px-4 py-3 font-semibold text-slate-600 text-center">
                        <span className="hidden sm:inline">
                          {t("common.actions")}
                        </span>
                        <span className="sm:hidden">A</span>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {expenses.map((expense) => (
                    <tr key={expense._id} className="hover:bg-slate-50">
                      <td className="px-2 sm:px-4 py-3">
                        <div className="flex items-center gap-1 text-slate-600 text-xs sm:text-sm">
                          <Calendar className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">
                            {formatDate(expense.date)}
                          </span>
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 py-3">
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium capitalize">
                          {expense.category}
                        </span>
                      </td>
                      <td className="px-2 sm:px-4 py-3">
                        {expense.locationId ? (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                            <div className="min-w-0">
                              <p
                                className="text-xs font-medium text-slate-800 truncate"
                                title={expense.locationId.locationName}
                              >
                                {expense.locationId.locationName}
                              </p>
                              <p
                                className="text-xs text-slate-500 truncate"
                                title={expense.locationId.locationCode}
                              >
                                {expense.locationId.locationCode}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-xs">
                            <span className="hidden sm:inline">
                              {t("expenses.noLocation")}
                            </span>
                            <span className="sm:hidden">No location</span>
                          </span>
                        )}
                      </td>
                      <td className="px-2 sm:px-4 py-3">
                        <span
                          className="text-xs text-slate-600 truncate"
                          title={expense.notes || "-"}
                        >
                          {expense.notes || "-"}
                        </span>
                      </td>
                      <td className="px-2 sm:px-4 py-3">
                        {expense.adminId ? (
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400 flex-shrink-0" />
                            <div className="min-w-0">
                              <p
                                className="text-xs font-medium text-slate-800 truncate"
                                title={expense.adminId.name}
                              >
                                {expense.adminId.name}
                              </p>
                              <p
                                className="text-xs text-slate-500 capitalize truncate"
                                title={expense.adminId.role}
                              >
                                {expense.adminId.role}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-xs">
                            -
                          </span>
                        )}
                      </td>
                      <td className="px-2 sm:px-4 py-3 text-right font-bold text-red-600 text-xs sm:text-sm">
                        {expense.amount.toLocaleString()}{" "}
                        <span className="hidden sm:inline">MMK</span>
                      </td>
                      {userRole === "owner" && (
                        <td className="px-2 sm:px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1 sm:gap-2">
                            <button
                              onClick={() => handleOpenEdit(expense)}
                              className="p-1.5 text-slate-600 hover:text-primary hover:bg-primary/10 rounded transition-colors"
                              title={t("common.edit")}
                            >
                              <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(expense)}
                              className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title={t("common.delete") || "Delete"}
                            >
                              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-primary" />
                {editingId
                  ? t("expenses.editExpense")
                  : t("expenses.newExpense")}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t("expenses.category")}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                >
                  <option value="electricity">
                    {t("expenses.electricity")}
                  </option>
                  <option value="water">{t("expenses.water")}</option>
                  <option value="utilities">{t("expenses.utilities")}</option>
                  <option value="salary">{t("expenses.salary")}</option>
                  <option value="maintenance">
                    {t("expenses.maintenance")}
                  </option>
                  <option value="rent">{t("expenses.rent")}</option>
                  <option value="other">{t("expenses.other")}</option>
                </select>
              </div>

              {userRole !== "cashier" && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Location <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    value={formData.locationId}
                    onChange={(e) =>
                      setFormData({ ...formData, locationId: e.target.value })
                    }
                  >
                    <option value="">Select Location</option>
                    {locations.map((location) => (
                      <option key={location._id} value={location._id}>
                        {location.locationName} ({location.locationCode})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t("expenses.amount")} (MMK){" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  placeholder="0"
                  value={formData.amount || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      amount: Number(e.target.value),
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t("expenses.date")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t("expenses.notesOptional")}
                </label>
                <textarea
                  rows={3}
                  maxLength={500}
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  placeholder={t("expenses.notesPlaceholder")}
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors order-2 sm:order-1"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 order-1 sm:order-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />{" "}
                      {editingId
                        ? t("expenses.updating")
                        : t("expenses.creating")}
                    </>
                  ) : editingId ? (
                    t("expenses.updateExpense")
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />{" "}
                      <span className="hidden sm:inline">
                        {t("expenses.createExpense")}
                      </span>
                      <span className="sm:hidden">Create</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!expenseToDelete}
        title={t("expenses.deleteExpense") || "Delete Expense"}
        message={
          expenseToDelete
            ? t("expenses.confirmDeleteMessage")?.replace(
                "{amount}",
                expenseToDelete.amount.toLocaleString(),
              ) ||
              `Are you sure you want to delete this expense of ${expenseToDelete.amount.toLocaleString()} MMK? This action cannot be undone.`
            : t("expenses.confirmDelete") ||
              "Are you sure you want to delete this expense?"
        }
        confirmText={t("common.delete") || "Delete"}
        cancelText={t("common.cancel") || "Cancel"}
        confirmButtonColor="red"
        onConfirm={handleConfirmDelete}
        onCancel={() => setExpenseToDelete(null)}
        isLoading={isDeleting}
      />
    </div>
  );
};
