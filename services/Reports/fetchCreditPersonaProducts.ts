import axios from "../axios";

export interface CreditPersonaProduct {
    totalQuantity: number;
    orderCount: number;
    inventoryId: string;
    productName: string;
    productCode: string;
    SKU: string;
    unitOfMeasure: string;
}

export interface CreditPersonaProductReportResponse {
    success: boolean;
    statusCode: number;
    message: string;
    data: {
        creditPersona: {
            id: string;
            name: string;
            phone: string;
        };
        storefront: any;
        dateRange: {
            startDate: string | null;
            endDate: string | null;
        };
        totals: {
            totalQuantity: number;
            totalUniqueProducts: number;
            totalOrderCount: number;
        };
        products: CreditPersonaProduct[];
    };
}

/**
 * Fetch credit persona product report
 * @param {string} creditPersonaId - The ID of the credit persona
 * @returns {Promise<CreditPersonaProductReportResponse>} Response from API
 */
export const fetchCreditPersonaProducts = async (
    creditPersonaId: string
): Promise<CreditPersonaProductReportResponse> => {
    try {
        const response = await axios.get(
            `/sale-report/credit-persona-products?creditPersonaId=${creditPersonaId}`
        );
        return response.data;
    } catch (error: any) {
        console.error("Error fetching credit persona products:", error);
        return {
            success: false,
            statusCode: error.response?.status || 500,
            message:
                error.response?.data?.message || "Failed to fetch credit persona products",
            data: {
                creditPersona: {
                    id: creditPersonaId,
                    name: "",
                    phone: "",
                },
                storefront: null,
                dateRange: {
                    startDate: null,
                    endDate: null,
                },
                totals: {
                    totalQuantity: 0,
                    totalUniqueProducts: 0,
                    totalOrderCount: 0,
                },
                products: [],
            },
        };
    }
};
