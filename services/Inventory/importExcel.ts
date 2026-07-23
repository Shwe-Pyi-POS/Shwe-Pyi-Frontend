import axios from "../axios";

export interface ErrorDetail {
  row: number;
  message: string;
}

export interface ImportExcelResponse {
  success: boolean;
  message: string;
  data: {
    total: number;
    success: number;
    failed: number;
    errors: ErrorDetail[];
    created: Array<{
      row: number;
      id: string;
      productCode: string;
      productName: string;
    }>;
  };
}

export const importExcel = async (file: File): Promise<ImportExcelResponse> => {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await axios.post("/inventory/import-excel", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error: any) {
    console.error("Error importing excel:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to import excel",
      data: {
        total: 0,
        success: 0,
        failed: 0,
        errors: [],
        created: [],
      },
    };
  }
};
