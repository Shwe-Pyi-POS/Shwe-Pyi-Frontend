export const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case "completed":
      return "bg-green-100 text-green-700";
    case "pending":
      return "bg-yellow-100 text-yellow-700";
    case "cancelled":
      return "bg-red-100 text-red-700";
    case "refunded":
      return "bg-purple-100 text-purple-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

export const getPaymentTypeLabel = (paymentType: string) => {
  const labels: Record<string, string> = {
    paid: "Paid",
    credit: "Credit",
  };
  return labels[paymentType?.toLowerCase()] || paymentType;
};

export const getPaymentMethodLabel = (paymentMethod: string) => {
  const labels: Record<string, string> = {
    cash: "Cash",
    kpay: "KBZ Pay",
    kbzpay: "KBZ Pay",
    wavepay: "Wave Pay",
    ayapay: "AYA Pay",
    uabpay: "UAB Pay",
    bank_transfer: "Bank Transfer",
  };
  return labels[paymentMethod?.toLowerCase()] || paymentMethod;
};

export const getPaymentTypeColor = (paymentType: string) => {
  switch (paymentType?.toLowerCase()) {
    case "paid":
      return "bg-green-100 text-green-700";
    case "credit":
      return "bg-orange-100 text-orange-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const parseDueDateString = (dateString: string): Date => {
  const datePart = dateString.split("T")[0];
  const [year, month, day] = datePart.split("-").map(Number);
  return new Date(year, month - 1, day);
};

export const formatDueDate = (dateString: string) => {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const isDueDateExpired = (dueDate: string): boolean => {
  const [year, month, day] = dueDate.split("-").map(Number);
  const due = new Date(year, month - 1, day);
  due.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today;
};

export const isDueDateWithinDays = (dueDate: string, days: number): boolean => {
  const [year, month, day] = dueDate.split("-").map(Number);
  const due = new Date(year, month - 1, day);
  due.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const limit = new Date(today);
  limit.setDate(limit.getDate() + days);
  return due >= today && due <= limit;
};

export type DueDateUrgency = "expired" | "near" | "normal";

export const getDueDateUrgency = (
  dueDate: string,
  withinDays = 7,
): DueDateUrgency => {
  if (isDueDateExpired(dueDate)) return "expired";
  if (isDueDateWithinDays(dueDate, withinDays)) return "near";
  return "normal";
};

export const getDueDateCellClasses = (urgency: DueDateUrgency): string => {
  switch (urgency) {
    case "expired":
      return "text-red-700";
    case "near":
      return "text-amber-800 font-semibold";
    default:
      return "text-slate-800";
  }
};

