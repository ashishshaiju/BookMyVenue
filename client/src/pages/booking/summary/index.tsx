import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useLockTimer } from '@/hooks/useLockTimer';
import { useApiMutation } from '@/hooks/useApi';
import { API_ENDPOINTS } from '@/constants';
import { showError } from '@/utils/toast';
import { axiosInstance } from '@/config/axios';
import { FiClock, FiCalendar, FiMapPin, FiUsers, FiInfo, FiCheckCircle } from 'react-icons/fi';
import { MdOutlineMeetingRoom } from 'react-icons/md';
import type { CheckoutResponse, RazorpaySuccessResponse, RazorpayErrorResponse } from '@/types/booking.types';
import { saveBookerDetails } from '@/services/bookingService';

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      on: (event: string, handler: (response: RazorpayErrorResponse) => void) => void;
      open: () => void;
    };
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

const BookingCheckout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  // Form State
  const [guestCount, setGuestCount] = useState<string>('');
  const [eventType, setEventType] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [place, setPlace] = useState('');
  const [note, setNote] = useState('');

  const state = location.state as {
    lockData?: {
      lockId: string;
      expiresAt: string;
      amountToPay: number;
    };
    venueName?: string;
    date?: string;
    slotTime?: string;
    venueImage?: string;
    venueCity?: string;
  } | null;

  useEffect(() => {
    if (!state?.lockData) {
      showError('Booking session not found. Please try again.');
      navigate(-1);
    }
  }, [state, navigate]);

  const { lockId, expiresAt, amountToPay } = state?.lockData || {};

  const handleExpire = () => {
    showError('Your session has expired. Please select the slot again.');
    navigate(-1);
  };

  const { formattedTime, isExpired, remainingMs } = useLockTimer(expiresAt, handleExpire);

  const { mutate: releaseLock } = useApiMutation({
    url: API_ENDPOINTS.RELEASE_LOCK,
    method: 'DELETE',
  });

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
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount,
          currency,
          order_id: orderId,
          name: 'BookMyVenue',
          description: `Booking for ${state?.venueName}`,
          timeout: 540,
          handler: async function (response: RazorpaySuccessResponse) {
            try {
              // verify returns booking id inside data if successful
              const verifyRes = await axiosInstance.post('/bookings/verify-payment', {
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
                  amountToPay,
                  bookingId: verifyRes.data?.data?._id || '', 
                  bookingRef: verifyRes.data?.data?.bookingRef || '',
                },
              });
            } catch {
              setIsProcessing(false);
              showError('Payment verification failed. Please contact support if your card was charged.');
            }
          },
          prefill: { name, email, contact: phone },
          theme: { color: '#16a34a' },
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

  const handleProceedToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isExpired) return;

    if (remainingMs < 60000) {
      showError('Not enough time to complete payment. Please re-select the slot.');
      navigate(-1);
      return;
    }

    if (!guestCount || !eventType || !name || !email || !phone || !place) {
      showError('Please fill in all required fields.');
      return;
    }

    setIsProcessing(true);
    try {
      await saveBookerDetails({
        lockId: lockId!,
        guestCount: Number(guestCount),
        eventType,
        name,
        email,
        phone,
        place,
        note,
      });
      initCheckout({ lockId });
    } catch {
      showError('Failed to save details. Please try again.');
      setIsProcessing(false);
    }
  };

  if (!state?.lockData) return null;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] pt-24 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Timer Banner for mobile */}
        <div className="md:hidden mb-6 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 p-4 rounded-2xl flex items-center justify-between shadow-sm">
           <div className="flex items-center gap-3">
             <FiClock className="text-orange-600 text-xl animate-pulse" />
             <span className="text-orange-800 dark:text-orange-400 font-medium">Session Expires In:</span>
           </div>
           <span className="text-orange-700 dark:text-orange-300 font-mono text-xl font-bold">{formattedTime}</span>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Left Panel: 70% Width */}
          <div className="md:w-[70%]">
             <div className="mb-8">
               <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">Checkout</h1>
               <p className="text-[var(--text-secondary)] mt-2">Provide your details to confirm the booking.</p>
             </div>

             <form id="checkout-form" onSubmit={handleProceedToPayment} className="space-y-8 bg-[var(--bg-tertiary)] p-6 md:p-8 rounded-3xl border border-[var(--bg-grey)] shadow-sm">
                
                {/* Event Details Section */}
                <div className="space-y-4 border-b border-[var(--bg-grey)] pb-8">
                   <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                     <FiCheckCircle className="text-[var(--bg-green)]" /> Event Details
                   </h2>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                     <div>
                       <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Event Type *</label>
                       <input 
                         type="text" 
                         value={eventType}
                         onChange={(e) => setEventType(e.target.value)}
                         placeholder="e.g. Wedding, Birthday" 
                         className="w-full bg-[var(--bg-primary)] border border-[var(--bg-grey)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--bg-green)] focus:border-transparent transition-all outline-none"
                         required
                       />
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Number of Guests *</label>
                       <div className="relative">
                         <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                           <FiUsers className="text-[var(--text-secondary)]" />
                         </div>
                         <input 
                           type="number" 
                           min="1"
                           value={guestCount}
                           onChange={(e) => setGuestCount(e.target.value)}
                           placeholder="Estimated count" 
                           className="w-full bg-[var(--bg-primary)] border border-[var(--bg-grey)] rounded-xl pl-12 pr-4 py-3 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--bg-green)] focus:border-transparent transition-all outline-none"
                           required
                         />
                       </div>
                     </div>
                   </div>
                </div>

                {/* Booker Details Section */}
                <div className="space-y-4 border-b border-[var(--bg-grey)] pb-8">
                   <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                     <FiCheckCircle className="text-[var(--bg-green)]" /> Contact Information
                   </h2>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                     <div className="md:col-span-2">
                       <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Full Name *</label>
                       <input 
                         type="text" 
                         value={name}
                         onChange={(e) => setName(e.target.value)}
                         placeholder="John Doe" 
                         className="w-full bg-[var(--bg-primary)] border border-[var(--bg-grey)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--bg-green)] outline-none"
                         required
                       />
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Email Address *</label>
                       <input 
                         type="email" 
                         value={email}
                         onChange={(e) => setEmail(e.target.value)}
                         placeholder="john@example.com" 
                         className="w-full bg-[var(--bg-primary)] border border-[var(--bg-grey)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--bg-green)] outline-none"
                         required
                       />
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Phone Number *</label>
                       <input 
                         type="tel" 
                         value={phone}
                         onChange={(e) => setPhone(e.target.value)}
                         placeholder="+91 9876543210" 
                         className="w-full bg-[var(--bg-primary)] border border-[var(--bg-grey)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--bg-green)] outline-none"
                         required
                       />
                     </div>
                     <div className="md:col-span-2">
                       <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Place / City *</label>
                       <input 
                         type="text" 
                         value={place}
                         onChange={(e) => setPlace(e.target.value)}
                         placeholder="E.g. Kochi" 
                         className="w-full bg-[var(--bg-primary)] border border-[var(--bg-grey)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--bg-green)] outline-none"
                         required
                       />
                     </div>
                   </div>
                </div>

                {/* Additional Info Section */}
                <div className="space-y-4">
                   <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                     <FiInfo className="text-blue-500" /> Additional Notes (Optional)
                   </h2>
                   <div className="mt-4">
                     <textarea 
                       value={note}
                       onChange={(e) => setNote(e.target.value)}
                       placeholder="Any special requests or instructions for the venue manager?" 
                       rows={4}
                       className="w-full bg-[var(--bg-primary)] border border-[var(--bg-grey)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:ring-2 focus:ring-blue-500 transition-all outline-none resize-none"
                     ></textarea>
                   </div>
                </div>

             </form>
          </div>

          {/* Right Panel: 30% Width (Sticky Summary) */}
          <div className="md:w-[30%]">
            <div className="sticky top-48 bg-[var(--bg-tertiary)] border border-[var(--bg-grey)] rounded-3xl p-6 shadow-xl">
              
              <div className="hidden md:flex mb-6 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/30 p-4 rounded-2xl items-center justify-between">
                <div className="flex items-center gap-3">
                  <FiClock className="text-orange-600 text-xl animate-pulse" />
                  <span className="text-orange-800 dark:text-orange-400 font-medium text-sm">Lock Timer</span>
                </div>
                <span className="text-orange-700 dark:text-orange-300 font-mono text-xl font-bold">{formattedTime}</span>
              </div>

              <h3 className="text-xl font-extrabold text-[var(--text-primary)] mb-6">Booking Details</h3>
              
              {state.venueImage && (
                <div className="w-full h-32 rounded-xl overflow-hidden mb-6 relative">
                  <img src={state.venueImage} alt={state.venueName} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-3 left-3 text-white">
                    <p className="font-bold">{state.venueName}</p>
                    {state.venueCity && <p className="text-xs text-gray-200">{state.venueCity}</p>}
                  </div>
                </div>
              )}

              <div className="space-y-5 mb-8">
                {!state.venueImage && (
                  <div className="flex items-start gap-4">
                    <div className="bg-[var(--bg-primary)] p-2.5 rounded-xl text-[var(--bg-green)] border border-[var(--bg-grey)]">
                      <FiMapPin size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-[var(--text-secondary)] mb-1 uppercase tracking-wider font-semibold">Venue</p>
                      <p className="font-bold text-[var(--text-primary)]">{state.venueName}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-start gap-4">
                  <div className="bg-[var(--bg-primary)] p-2.5 rounded-xl text-[var(--bg-green)] border border-[var(--bg-grey)]">
                    <FiCalendar size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-secondary)] mb-1 uppercase tracking-wider font-semibold">Date</p>
                    <p className="font-bold text-[var(--text-primary)]">{state.date}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-[var(--bg-primary)] p-2.5 rounded-xl text-[var(--bg-green)] border border-[var(--bg-grey)]">
                    <MdOutlineMeetingRoom size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-secondary)] mb-1 uppercase tracking-wider font-semibold">Time Slot</p>
                    <p className="font-bold text-[var(--text-primary)]">{state.slotTime}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-[var(--bg-grey)] pt-6 mb-8">
                 <div className="flex justify-between items-center bg-[var(--bg-primary)] border border-[var(--bg-grey)] p-4 rounded-2xl">
                    <span className="text-[var(--text-secondary)] font-medium">Total Payable</span>
                    <span className="text-3xl font-extrabold text-[var(--bg-green)]">₹{amountToPay}</span>
                 </div>
              </div>

              <div className="space-y-3">
                <button
                  type="submit"
                  form="checkout-form"
                  disabled={isProcessing || isExpired}
                  className="w-full py-4 rounded-xl bg-[var(--bg-green)] text-white font-bold text-lg hover:bg-green-600 transition-all shadow-md hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed flex justify-center items-center"
                >
                  {isProcessing ? (
                    <span className="flex items-center gap-2">
                       <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> Processing...
                    </span>
                  ) : 'Proceed to Payment'}
                </button>
                <button
                  onClick={() => {
                    releaseLock({});
                    navigate(-1);
                  }}
                  disabled={isProcessing}
                  type="button"
                  className="w-full py-3 rounded-xl font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-grey)] transition cursor-pointer disabled:opacity-50"
                >
                  Cancel Booking
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingCheckout;
