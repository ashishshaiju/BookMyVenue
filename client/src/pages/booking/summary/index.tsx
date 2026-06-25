import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useLockTimer } from '@/hooks/useLockTimer';
import { useApiMutation } from '@/hooks/useApi';
import { API_ENDPOINTS } from '@/constants';
import { showError } from '@/utils/toast';
import { axiosInstance } from '@/config/axios';
import { FiClock, FiCalendar, FiMapPin } from 'react-icons/fi';
import { MdOutlineMeetingRoom } from 'react-icons/md';
import type {
  CheckoutResponse,
  RazorpaySuccessResponse,
  RazorpayErrorResponse,
} from '@/types/booking.types';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (document.getElementById('razorpay-checkout-js')) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.id = 'razorpay-checkout-js';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const BookingSummary = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  const state = location.state as {
    lockData?: {
      lockId: string;
      expiresAt: string;
      amountToPay: number;
    };
    venueName?: string;
    date?: string;
    slotTime?: string;
  } | null;

  useEffect(() => {
    if (!state?.lockData) {
      showError('Booking session not found. Please try again.');
      navigate(-1); // Navigate back to venue or home
    }
  }, [state, navigate]);

  const { lockId, expiresAt, amountToPay } = state?.lockData || {};

  const handleExpire = () => {
    showError('Your session has expired. Please select the slot again.');
    navigate(-1);
  };

  const { formattedTime, isExpired, remainingMs } = useLockTimer(expiresAt, handleExpire);

  const { mutate: initCheckout } = useApiMutation(
    {
      url: API_ENDPOINTS.CHECKOUT,
      method: 'POST',
    },
    {
      onSuccess: async (data: CheckoutResponse) => {
        const { orderId, amount, currency } = data;
        const res = await loadRazorpayScript();

        if (!res) {
          showError('Failed to load Razorpay SDK. Please check your connection.');
          setIsProcessing(false);
          return;
        }

        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID, // from env
          amount,
          currency,
          order_id: orderId,
          name: 'BookMyVenue',
          description: `Booking for ${state?.venueName}`,
          timeout: 540, // 9 minutes timeout strictly
          handler: async function (response: RazorpaySuccessResponse) {
            try {
              await axiosInstance.post('/bookings/verify-payment', {
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              });

              navigate('/booking/confirmation', {
                state: {
                  paymentId: response.razorpay_payment_id,
                  venueName: state?.venueName,
                  date: state?.date,
                  slotTime: state?.slotTime,
                },
              });
            } catch {
              setIsProcessing(false);
              showError(
                'Payment verification failed. Please contact support if your card was charged.'
              );
            }
          },
          prefill: {
            name: '',
            email: '',
            contact: '',
          },
          theme: {
            color: '#16a34a', // matches our bg-green
          },
          modal: {
            ondismiss: function () {
              setIsProcessing(false);
              showError('Payment cancelled. You can try again before the timer runs out.');
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response: RazorpayErrorResponse) {
          setIsProcessing(false);
          showError(response.error.description || 'Payment failed');
        });
        rzp.open();
      },
      onError: () => {
        setIsProcessing(false);
      },
    }
  );

  const handleProceedToPayment = () => {
    if (isExpired) return;

    // Buffer check: strictly < 60 seconds
    if (remainingMs < 60000) {
      showError('Not enough time to complete payment. Please re-select the slot.');
      navigate(-1);
      return;
    }

    setIsProcessing(true);
    initCheckout({ lockId });
  };

  if (!state?.lockData) return null;

  return (
    <div className="max-w-3xl mx-auto mt-24 px-4 pb-12">
      <div className="bg-[var(--bg-tertiary)] border border-[var(--bg-grey)] rounded-3xl p-8 shadow-md">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 pb-8 border-b border-[var(--bg-grey)]">
          <h1 className="text-3xl font-extrabold text-[var(--text-primary)]">Booking Summary</h1>
          <div className="mt-4 md:mt-0 flex items-center gap-3 bg-orange-50 dark:bg-orange-950/20 text-orange-600 border border-orange-200 dark:border-orange-900/30 px-5 py-3 rounded-2xl">
            <FiClock className="text-xl animate-pulse" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider">Time Remaining</p>
              <p className="text-2xl font-bold font-mono">{formattedTime}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="bg-[var(--bg-grey)] p-3 rounded-xl text-[var(--bg-green)] mt-1">
              <FiMapPin size={24} />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)] mb-1">Venue</p>
              <p className="font-semibold text-lg text-[var(--text-primary)]">
                {state.venueName || 'Venue'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="bg-[var(--bg-grey)] p-3 rounded-xl text-[var(--bg-green)] mt-1">
              <FiCalendar size={24} />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)] mb-1">Date</p>
              <p className="font-semibold text-lg text-[var(--text-primary)]">{state.date}</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="bg-[var(--bg-grey)] p-3 rounded-xl text-[var(--bg-green)] mt-1">
              <MdOutlineMeetingRoom size={24} />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)] mb-1">Time Slot</p>
              <p className="font-semibold text-lg text-[var(--text-primary)]">
                {state.slotTime || 'Selected Slot'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[var(--bg-grey)] rounded-2xl p-6 mb-8 flex justify-between items-center">
          <p className="text-lg font-semibold text-[var(--text-secondary)]">Total Amount</p>
          <p className="text-3xl font-extrabold text-[var(--bg-green)]">₹{amountToPay}</p>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => navigate(-1)}
            disabled={isProcessing}
            className="flex-1 py-4 rounded-xl border border-[var(--bg-grey)] font-bold text-[var(--text-primary)] hover:bg-[var(--bg-grey)] transition cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleProceedToPayment}
            disabled={isProcessing || isExpired}
            className="flex-[2] py-4 rounded-xl bg-[var(--bg-green)] text-white font-bold text-lg hover:bg-green-600 transition shadow-md hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed cursor-pointer flex justify-center items-center"
          >
            {isProcessing ? 'Processing Payment...' : 'Proceed to Payment'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingSummary;
