export const formatMMK = (amount: number) =>
  `${new Intl.NumberFormat("en-US").format(Math.round(amount))} MMK`;

export const formatQuotationDate = (iso?: string | null) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const formatDateForAPI = (date: Date | null): string | null => {
  if (!date) return null;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const getToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export const getStorefrontLabel = (
  sf: { locationName?: string; storefrontName?: string; locationCode?: string; storefrontCode?: string } | string | null | undefined,
): string => {
  if (!sf) return "—";
  if (typeof sf === "string") return sf;
  return sf.locationName || sf.storefrontName || sf.locationCode || sf.storefrontCode || "—";
};
