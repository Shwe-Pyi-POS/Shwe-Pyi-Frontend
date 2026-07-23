import { Product, ProductCategory, Role, PaymentMethod, Customer } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'iPhone 13 Pro Max Silicone Case',
    category: ProductCategory.PHONE_COVER,
    stockWarehouse: 50,
    stockShop: 10,
    costPrice: 2000,
    sellingPrice: 5000,
    lowStockThreshold: 5
  },
  {
    id: 'p2',
    name: 'Remax 2.4A Fast Cable',
    category: ProductCategory.CHARGER_CABLE,
    stockWarehouse: 100,
    stockShop: 20,
    costPrice: 1500,
    sellingPrice: 3500,
    lowStockThreshold: 10
  },
  {
    id: 'p3',
    name: '9H Tempered Glass (Generic)',
    category: ProductCategory.TEMPERED_GLASS,
    stockWarehouse: 200,
    stockShop: 45,
    costPrice: 500,
    sellingPrice: 1500,
    lowStockThreshold: 20
  },
  {
    id: 'p4',
    name: 'AirPods Pro Clone (TWS)',
    category: ProductCategory.TWS,
    stockWarehouse: 30,
    stockShop: 5,
    costPrice: 15000,
    sellingPrice: 35000,
    lowStockThreshold: 3
  },
  {
    id: 'p5',
    name: 'JBL Go 3 Copy',
    category: ProductCategory.BLUETOOTH_SPEAKER,
    stockWarehouse: 15,
    stockShop: 2,
    costPrice: 12000,
    sellingPrice: 25000,
    lowStockThreshold: 2
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'c1',
    name: 'John Doe',
    phone: '09123456789',
    outstandingBalance: 15000,
    dueDate: '2023-12-31'
  }
];

export const PAYMENT_METHODS = Object.values(PaymentMethod);
export const PRODUCT_CATEGORIES = Object.values(ProductCategory);