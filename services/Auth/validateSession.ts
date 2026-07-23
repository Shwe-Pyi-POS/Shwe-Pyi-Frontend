import axios from "../axios";

/**
 * Lightweight auth check — categories endpoint instead of full expense list.
 * Throws on network/auth errors so callers can handle status codes.
 */
export const validateSession = async (): Promise<void> => {
  await axios.get("/inventory/categories");
};
