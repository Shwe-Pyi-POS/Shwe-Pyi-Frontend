export enum Role {
  ADMIN = "ADMIN",
  STAFF = "STAFF",
}

export enum PaymentMethod {
  CASH = "Cash",
  KBZ_PAY = "KBZPay",
  WAVE_PAY = "WavePay",
  AYA_PAY = "AYA Pay",
  UAB_PAY = "UAB Pay",
  BANK_TRANSFER = "Bank Transfer",
  CREDIT = "Credit (Pay Later)",
  FOC = "FOC (Free of Charge)",
}

export enum ProductCategory {
  PHONE_COVER = "Phone Cover",
  TEMPERED_GLASS = "Tempered Glass",
  CHARGER_CABLE = "Charger Cable",
  CHARGER_ADAPTER = "Charger Adapter",
  TWS = "TWS",
  BLUETOOTH_SPEAKER = "Bluetooth Speaker",
  OTHER = "Other",
}

export interface Product {
  id: string;
  _id?: string;
  name: string;
  productName?: string;
  productCode?: string;
  category: ProductCategory;
  stockWarehouse: number;
  stockShop: number;
  costPrice: number;
  sellingPrice: number;
  lowStockThreshold: number;
  status?: "active" | "inactive";
}

export interface CartItem extends Product {
  qty: number;
  discountedPrice?: number;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  date: string; // ISO String
  items: {
    productId: string;
    name: string;
    qty: number;
    price: number;
  }[];
  subtotal: number;
  discountPercent: number;
  total: number;
  paymentMethod: PaymentMethod;
  cashierName: string;
  customerId?: string; // For credit sales
  status: "COMPLETED" | "CANCELLED";
  note?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  outstandingBalance: number;
  dueDate?: string;
}

export interface PaymentLog {
  id: string;
  customerId: string;
  amount: number;
  date: string;
  method: PaymentMethod;
}

export interface Expense {
  id: string;
  date: string;
  title: string;
  amount: number;
  category: string;
  photo?: string; // Base64 placeholder
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  user: string;
}

export interface PurchaseOrderProduct {
  inventoryId: string;
  productName: string;
  buyingPrice: number;
  purchaseQuantity: number;
  productCode?: string;
  _id?: string;
}

export interface ApiPurchaseOrder {
  _id: string;
  supplierId: string;
  products: PurchaseOrderProduct[];
  status: string;
  note: string;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  __v?: number;
  id?: string;
  poNumber: string;
  totalRemainingQuantity?: number;
  purchasedBy?: string;
  isDeleted?: boolean;
  deletedAt?: string;
}

export interface PurchaseOrderItem {
  productId: string;
  name: string;
  qty: number;
  costPrice: number;
  note?: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  date: string; // ISO String
  supplierName: string;
  items: PurchaseOrderItem[];
  status: "PENDING" | "PARTIALLY_RECEIVED" | "RECEIVED";
  note?: string;
}

export interface GRNItem {
  productId: string;
  name: string;
  qtyOrdered: number; // From PO
  qtyReceived: number; // Total received
  qtyGood: number; // Good items
  qtyBad: number; // Bad items
  costPrice: number;
}

export interface GoodsReceivedNote {
  id: string;
  grnNumber: string;
  poId: string; // Linked PO
  poNumber: string;
  date: string; // ISO String
  items: GRNItem[];
  note?: string;
}

export interface WarehouseProfile {
  _id: string;
  type: string;
  locationCode: string;
  locationName: string;
  locationAddress: string;
  locationPhone: string;
  locationEmail?: string;
  managerName?: string;
  status?: "active" | "inactive";
  description?: string;
  notes?: string;
  isDeleted?: boolean;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Supplier {
  id: string;
  _id?: string;
  supplierName: string;
  contactNumber: string;
  isDeleted?: boolean;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AppState {
  products: Product[];
  sales: Sale[];
  customers: Customer[];
  expenses: Expense[];
  purchaseOrders: PurchaseOrder[];
  goodsReceivedNotes: GoodsReceivedNote[];
  logs: AuditLog[];
  currentUser: {
    name: string;
    role: Role;
  };
}
