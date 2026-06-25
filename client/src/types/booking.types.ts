export interface CheckoutResponse {
  orderId: string;
  amount: number;
  currency: string;
}

export interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayErrorResponse {
  error: {
    code: string;
    description: string;
    source: string;
    step: string;
    reason: string;
    metadata: {
      order_id: string;
      payment_id: string;
    };
  };
}

export interface Slot {
  slotId: string;
  startTime: string;
  endTime: string;
  price: number;
  isAvailable: boolean;
  reason: string | null;
}
