import { AppState, Role } from "../types";
import { INITIAL_PRODUCTS, INITIAL_CUSTOMERS } from "../constants";

const STORAGE_KEY = "mobileax_pos_data";

const DEFAULT_STATE: AppState = {
  products: INITIAL_PRODUCTS,
  sales: [],
  customers: INITIAL_CUSTOMERS,
  expenses: [],
  purchaseOrders: [],
  goodsReceivedNotes: [],
  logs: [],
  currentUser: {
    name: "Admin User",
    role: Role.ADMIN,
  },
};

export const loadState = (): AppState => {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (!serialized) {
      return DEFAULT_STATE;
    }
    const loadedState = JSON.parse(serialized);
    // Ensure new fields exist (for backward compatibility)
    return {
      ...DEFAULT_STATE,
      ...loadedState,
      purchaseOrders: loadedState.purchaseOrders || [],
      goodsReceivedNotes: loadedState.goodsReceivedNotes || [],
    };
  } catch (e) {
    console.error("Failed to load state", e);
    return DEFAULT_STATE;
  }
};

export const saveState = (state: AppState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to save state", e);
  }
};
