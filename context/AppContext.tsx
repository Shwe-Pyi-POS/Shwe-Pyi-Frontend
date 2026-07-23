import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  AppState,
  Product,
  Sale,
  Customer,
  Expense,
  Role,
  AuditLog,
  PaymentMethod,
  PurchaseOrder,
  GoodsReceivedNote,
  PurchaseOrderItem,
  GRNItem,
  ProductCategory,
} from "../types";
import { loadState, saveState } from "../services/dataService";
import { v4 as uuidv4 } from "uuid"; // Note: In a real app we'd use uuid, here we simulate

// Simple ID generator since we can't use external uuid lib easily without install
const generateId = () => Math.random().toString(36).substr(2, 9);
const generateInvoiceNumber = () => {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const random = Math.floor(10000 + Math.random() * 90000);
  return `INV-${yyyy}${mm}${dd}-${random}`;
};
const generatePONumber = () => {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const random = Math.floor(10000 + Math.random() * 90000);
  return `PO-${yyyy}${mm}${dd}-${random}`;
};
const generateGRNNumber = () => {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const random = Math.floor(10000 + Math.random() * 90000);
  return `GRN-${yyyy}${mm}${dd}-${random}`;
};

interface AppContextType extends AppState {
  setUserRole: (role: Role) => void;
  addProduct: (product: Product) => void;
  updateProduct: (id: string, data: Partial<Product>) => void;
  processSale: (
    items: any[],
    discount: number,
    method: PaymentMethod,
    customerId?: string,
    note?: string
  ) => { success: boolean; message?: string };
  cancelSale: (saleId: string, note: string) => void;
  transferStock: (productId: string, qty: number) => void; // Warehouse -> Shop
  addStockToWarehouse: (
    supplier: string,
    items: { productId: string; qty: number; cost: number }[]
  ) => void;
  createPurchaseOrder: (
    supplierName: string,
    items: PurchaseOrderItem[],
    note?: string
  ) => string;
  createGRN: (
    poId: string,
    items: GRNItem[],
    note?: string
  ) => { success: boolean; message?: string };
  addExpense: (expense: Omit<Expense, "id">) => void;
  addCustomer: (customer: Omit<Customer, "id" | "outstandingBalance">) => void;
  recordPayment: (
    customerId: string,
    amount: number,
    method: PaymentMethod
  ) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<AppState>(loadState());

  useEffect(() => {
    saveState(state);
  }, [state]);

  const addLog = (action: string, details: string) => {
    const log: AuditLog = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      action,
      details,
      user: state.currentUser.name,
    };
    setState((prev) => ({ ...prev, logs: [log, ...prev.logs] }));
  };

  const setUserRole = (role: Role) => {
    setState((prev) => ({
      ...prev,
      currentUser: {
        ...prev.currentUser,
        role,
        name: role === Role.ADMIN ? "Admin User" : "Staff User",
      },
    }));
  };

  const addProduct = (product: Product) => {
    setState((prev) => ({ ...prev, products: [...prev.products, product] }));
    addLog("CREATE_PRODUCT", `Added product: ${product.name}`);
  };

  const updateProduct = (id: string, data: Partial<Product>) => {
    setState((prev) => ({
      ...prev,
      products: prev.products.map((p) => (p.id === id ? { ...p, ...data } : p)),
    }));
    addLog("UPDATE_PRODUCT", `Updated product ID: ${id}`);
  };

  const processSale = (
    cartItems: any[],
    discountPercent: number,
    method: PaymentMethod,
    customerId?: string,
    note?: string
  ) => {
    // Validation
    if (state.currentUser.role === Role.STAFF && discountPercent > 20) {
      return {
        success: false,
        message: "Staff cannot authorize > 20% discount",
      };
    }

    // Check stock
    for (const item of cartItems) {
      const product = state.products.find((p) => p.id === item.id);
      if (!product) return { success: false, message: "Product not found" };
      if (product.stockShop < item.qty)
        return {
          success: false,
          message: `Insufficient shop stock for ${product.name}`,
        };
    }

    const subtotal = cartItems.reduce(
      (sum, item) => sum + item.sellingPrice * item.qty,
      0
    );
    const total = subtotal * (1 - discountPercent / 100);

    const newSale: Sale = {
      id: generateId(),
      invoiceNumber: generateInvoiceNumber(),
      date: new Date().toISOString(),
      items: cartItems.map((i) => ({
        productId: i.id,
        name: i.name,
        qty: i.qty,
        price: i.sellingPrice,
      })),
      subtotal,
      discountPercent,
      total,
      paymentMethod: method,
      cashierName: state.currentUser.name,
      status: "COMPLETED",
      customerId,
      note,
    };

    // Deduct Stock
    const updatedProducts = state.products.map((p) => {
      const cartItem = cartItems.find((i) => i.id === p.id);
      if (cartItem) {
        return { ...p, stockShop: p.stockShop - cartItem.qty };
      }
      return p;
    });

    // Update Customer Balance if Credit
    let updatedCustomers = state.customers;
    if (method === PaymentMethod.CREDIT && customerId) {
      updatedCustomers = state.customers.map((c) =>
        c.id === customerId
          ? { ...c, outstandingBalance: c.outstandingBalance + total }
          : c
      );
    }

    setState((prev) => ({
      ...prev,
      sales: [newSale, ...prev.sales],
      products: updatedProducts,
      customers: updatedCustomers,
    }));

    addLog("NEW_SALE", `Sale ${newSale.invoiceNumber} - Total: ${total}`);
    return { success: true };
  };

  const cancelSale = (saleId: string, note: string) => {
    if (state.currentUser.role !== Role.ADMIN) {
      alert("Only Admin can cancel sales");
      return;
    }

    const sale = state.sales.find((s) => s.id === saleId);
    if (!sale || sale.status === "CANCELLED") return;

    // Restore stock
    const updatedProducts = [...state.products];
    sale.items.forEach((item) => {
      const product = updatedProducts.find((p) => p.id === item.productId);
      if (product) product.stockShop += item.qty;
    });

    // Reverse Credit if applicable
    let updatedCustomers = [...state.customers];
    if (sale.paymentMethod === PaymentMethod.CREDIT && sale.customerId) {
      const cust = updatedCustomers.find((c) => c.id === sale.customerId);
      if (cust) cust.outstandingBalance -= sale.total;
    }

    setState((prev) => ({
      ...prev,
      sales: prev.sales.map((s) =>
        s.id === saleId ? { ...s, status: "CANCELLED", note: note } : s
      ),
      products: updatedProducts,
      customers: updatedCustomers,
    }));

    addLog("CANCEL_SALE", `Cancelled ${sale.invoiceNumber}. Note: ${note}`);
  };

  const transferStock = (productId: string, qty: number) => {
    const product = state.products.find((p) => p.id === productId);
    if (!product) return;
    if (product.stockWarehouse < qty) {
      alert("Insufficient warehouse stock");
      return;
    }

    updateProduct(productId, {
      stockWarehouse: product.stockWarehouse - qty,
      stockShop: product.stockShop + qty,
    });
    addLog("STOCK_TRANSFER", `Transferred ${qty} of ${product.name} to Shop`);
  };

  const addStockToWarehouse = (
    supplier: string,
    items: { productId: string; qty: number; cost: number }[]
  ) => {
    const updatedProducts = [...state.products];
    items.forEach((item) => {
      const p = updatedProducts.find((x) => x.id === item.productId);
      if (p) {
        p.stockWarehouse += item.qty;
        p.costPrice = item.cost; // Update last cost price
      }
    });
    setState((prev) => ({ ...prev, products: updatedProducts }));
    addLog("PURCHASE", `Stock-in from ${supplier}`);
  };

  const createPurchaseOrder = (
    supplierName: string,
    items: PurchaseOrderItem[],
    note?: string
  ): string => {
    // Create new product if it doesn't exist (user can add NEW products directly here)
    const updatedProducts = [...state.products];
    items.forEach((item) => {
      const existingProduct = updatedProducts.find(
        (p) => p.id === item.productId
      );
      if (!existingProduct) {
        // Product doesn't exist, create it
        const newProduct: Product = {
          id: item.productId,
          name: item.name,
          category: ProductCategory.OTHER, // Default category
          stockWarehouse: 0,
          stockShop: 0,
          costPrice: item.costPrice,
          sellingPrice: item.costPrice * 1.5, // Default markup
          lowStockThreshold: 10,
        };
        updatedProducts.push(newProduct);
      }
    });

    const newPO: PurchaseOrder = {
      id: generateId(),
      poNumber: generatePONumber(),
      date: new Date().toISOString(),
      supplierName,
      items,
      status: "PENDING",
      note,
    };

    setState((prev) => ({
      ...prev,
      products: updatedProducts,
      purchaseOrders: [newPO, ...(prev.purchaseOrders || [])],
    }));

    addLog("CREATE_PO", `Created PO ${newPO.poNumber} from ${supplierName}`);
    return newPO.id;
  };

  const createGRN = (
    poId: string,
    items: GRNItem[],
    note?: string
  ): { success: boolean; message?: string } => {
    const po = (state.purchaseOrders || []).find((p) => p.id === poId);
    if (!po) {
      return { success: false, message: "Purchase Order not found" };
    }

    // Validate items - check that qtyReceived = qtyGood + qtyBad for each item
    for (const item of items) {
      if (item.qtyReceived !== item.qtyGood + item.qtyBad) {
        return {
          success: false,
          message: `For ${item.name}: Received quantity must equal Good + Bad quantities`,
        };
      }
    }

    // Create GRN
    const newGRN: GoodsReceivedNote = {
      id: generateId(),
      grnNumber: generateGRNNumber(),
      poId: po.id,
      poNumber: po.poNumber,
      date: new Date().toISOString(),
      items,
      note,
    };

    // Update stock - ONLY good items go to warehouse
    const updatedProducts = [...state.products];
    items.forEach((grnItem) => {
      const product = updatedProducts.find((p) => p.id === grnItem.productId);
      if (product) {
        // Only add good items to warehouse
        product.stockWarehouse += grnItem.qtyGood;
        product.costPrice = grnItem.costPrice; // Update cost price
      }
    });

    // Update PO status based on received quantities (sum all GRNs for this PO)
    let updatedPOs = [...(state.purchaseOrders || [])];
    const poIndex = updatedPOs.findIndex((p) => p.id === poId);
    if (poIndex !== -1) {
      // Get all GRNs for this PO (including the one we just created)
      const allGRNsForPO = [...(state.goodsReceivedNotes || []), newGRN].filter(
        (grn) => grn.poId === poId
      );

      // Calculate total received for each product
      const totalReceivedByProduct: Record<string, number> = {};
      allGRNsForPO.forEach((grn) => {
        grn.items.forEach((item) => {
          totalReceivedByProduct[item.productId] =
            (totalReceivedByProduct[item.productId] || 0) + item.qtyReceived;
        });
      });

      let allFullyReceived = true;
      let anyPartiallyReceived = false;

      po.items.forEach((poItem) => {
        const totalReceived = totalReceivedByProduct[poItem.productId] || 0;
        if (totalReceived < poItem.qty) {
          allFullyReceived = false;
          if (totalReceived > 0) {
            anyPartiallyReceived = true;
          }
        }
      });

      if (allFullyReceived) {
        updatedPOs[poIndex].status = "RECEIVED";
      } else if (anyPartiallyReceived) {
        updatedPOs[poIndex].status = "PARTIALLY_RECEIVED";
      }
    }

    setState((prev) => ({
      ...prev,
      products: updatedProducts,
      purchaseOrders: updatedPOs,
      goodsReceivedNotes: [newGRN, ...(prev.goodsReceivedNotes || [])],
    }));

    const goodItemsTotal = items.reduce((sum, item) => sum + item.qtyGood, 0);
    const badItemsTotal = items.reduce((sum, item) => sum + item.qtyBad, 0);
    addLog(
      "CREATE_GRN",
      `Created GRN ${newGRN.grnNumber} for PO ${po.poNumber}. Good: ${goodItemsTotal}, Bad: ${badItemsTotal}`
    );

    return { success: true };
  };

  const addExpense = (expenseData: Omit<Expense, "id">) => {
    const expense: Expense = { ...expenseData, id: generateId() };
    setState((prev) => ({ ...prev, expenses: [expense, ...prev.expenses] }));
    addLog("ADD_EXPENSE", `Expense: ${expense.title} - ${expense.amount}`);
  };

  const addCustomer = (
    customer: Omit<Customer, "id" | "outstandingBalance">
  ) => {
    const newC: Customer = {
      ...customer,
      id: generateId(),
      outstandingBalance: 0,
    };
    setState((prev) => ({ ...prev, customers: [...prev.customers, newC] }));
    addLog("ADD_CUSTOMER", `New Customer: ${customer.name}`);
  };

  const recordPayment = (
    customerId: string,
    amount: number,
    method: PaymentMethod
  ) => {
    setState((prev) => ({
      ...prev,
      customers: prev.customers.map((c) =>
        c.id === customerId
          ? { ...c, outstandingBalance: c.outstandingBalance - amount }
          : c
      ),
    }));
    addLog(
      "PAYMENT_RECEIVED",
      `Received ${amount} from Customer ID ${customerId} via ${method}`
    );
  };

  return (
    <AppContext.Provider
      value={{
        ...state,
        setUserRole,
        addProduct,
        updateProduct,
        processSale,
        cancelSale,
        transferStock,
        addStockToWarehouse,
        createPurchaseOrder,
        createGRN,
        addExpense,
        addCustomer,
        recordPayment,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};
