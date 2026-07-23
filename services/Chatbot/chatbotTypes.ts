export interface ChatbotRequestBody {
  message: string;
}

export interface ChatbotResponse {
  success: boolean;
  message?: string;
  data: {
    reply: string;
  };
}
