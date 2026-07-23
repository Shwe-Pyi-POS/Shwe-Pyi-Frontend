export interface UomConversion {
  unit: string;
  factor: number;
  isDefaultSellingUnit?: boolean;
}

export interface InventoryUomFields {
  unitOfMeasure: string;
  uomConversions?: UomConversion[];
}
