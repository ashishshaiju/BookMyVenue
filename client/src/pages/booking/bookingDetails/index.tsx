import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { FiCalendar, FiClock, FiMapPin, FiChevronLeft, FiPhone, FiMail, FiUsers, FiInfo, FiFileText } from 'react-icons/fi';
import { useBookingById } from '@/hooks/useBookingById';
import CancelBookingModal from '@/components/common/CancelBookingModal';

const BookingDetails = () => {
  const { bookingRefId } = useParams<{ bookingRefId: string }>();
  const navigate = useNavigate();
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  const { data, isLoading, isError } = useBookingById(bookingRefId);
  const booking = data?.data;

  const renderSkeleton = () => (
    <div className="animate-pulse space-y-8">
      <div className="h-64 bg-[var(--bg-grey)] rounded-3xl w-full"></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-48 bg-[var(--bg-grey)] rounded-3xl w-full"></div>
          <div className="h-48 bg-[var(--bg-grey)] rounded-3xl w-full"></div>
        </div>
        <div className="space-y-6">
          <div className="h-64 bg-[var(--bg-grey)] rounded-3xl w-full"></div>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] pt-24 pb-12 px-4">
        <div className="max-w-6xl mx-auto">{renderSkeleton()}</div>
      </div>
    );
  }

  if (isError || !booking) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] pt-24 pb-12 px-4 flex flex-col items-center justify-center">
        <div className="bg-[var(--bg-tertiary)] p-8 rounded-3xl border border-[var(--bg-grey)] text-center max-w-md w-full">
           <FiInfo className="text-4xl text-[var(--text-secondary)] mx-auto mb-4" />
           <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Booking Not Found</h2>
           <p className="text-[var(--text-secondary)] mb-6">The booking you are looking for does not exist or has been removed.</p>
           <button 
             onClick={() => navigate('/my-bookings')}
             className="px-6 py-3 bg-[var(--bg-green)] text-white font-bold rounded-xl w-full hover:bg-green-600 transition"
           >
             Back to My Bookings
           </button>
        </div>
      </div>
    );
  }

  const isCancelable = booking.uiStatus === 'upcoming' && booking.cancellationPolicy !== 'Non-refundable';
  
  let cancelTooltip = '';
  if (booking.uiStatus === 'completed') cancelTooltip = 'Cancellation is not available for past bookings';
  else if (booking.uiStatus === 'cancelled') cancelTooltip = 'This booking is already cancelled';
  else if (booking.cancellationPolicy === 'Non-refundable') cancelTooltip = 'This venue has a non-refundable policy';
  else if (booking.cancellationRefundPct === 0) cancelTooltip = 'Cancellation window has passed';

  if (isCancelable && booking.cancellationRefundPct === 0) {
      // although technically refundable policy, window passed
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] pt-24 pb-12 px-4">
      <div className="max-w-6xl mx-auto">
        
        <button 
          onClick={() => navigate('/my-bookings')}
          className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition mb-6 font-medium"
        >
          <FiChevronLeft /> Back to My Bookings
        </button>

        {/* Header Section */}
        <div className="bg-[var(--bg-tertiary)] border border-[var(--bg-grey)] rounded-3xl p-6 md:p-8 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm relative overflow-hidden">
           
           <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[var(--bg-green)]/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

           <div>
              <div className="flex items-center gap-3 mb-2">
                 <span className="bg-[var(--bg-primary)] text-[var(--text-secondary)] px-3 py-1 rounded-full text-xs font-bold border border-[var(--bg-grey)]">
                   {booking.bookingRef}
                 </span>
                 <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                   booking.uiStatus === 'upcoming' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                   booking.uiStatus === 'completed' ? 'bg-green-100 text-green-700 border border-green-200' :
                   'bg-red-100 text-red-700 border border-red-200'
                 }`}>
                   {booking.uiStatus.toUpperCase()}
                 </span>
              </div>
              <h1 className="text-3xl font-extrabold text-[var(--text-primary)]">{booking.venueName}</h1>
              <p className="text-[var(--text-secondary)] mt-1 flex items-center gap-2">
                <FiMapPin className="text-[var(--bg-green)]" /> {booking.city}, {booking.district}
              </p>
           </div>
           
           <div className="flex flex-col md:items-end w-full md:w-auto">
             <div className="relative group w-full md:w-auto">
               <button 
                 onClick={() => isCancelable && booking.cancellationRefundPct! > 0 && setIsCancelModalOpen(true)}
                 disabled={!isCancelable || booking.cancellationRefundPct === 0}
                 className="w-full md:w-auto px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 dark:bg-red-950/20 dark:border-red-900/30"
               >
                 Cancel Booking
               </button>
               {(!isCancelable || booking.cancellationRefundPct === 0) && (
                 <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-3 py-1.5 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition pointer-events-none z-10 hidden md:block">
                   {cancelTooltip || 'Cancellation window passed'}
                 </div>
               )}
             </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           
           {/* Left Column */}
           <div className="lg:col-span-2 space-y-8">
              
              <div className="bg-[var(--bg-tertiary)] border border-[var(--bg-grey)] rounded-3xl overflow-hidden shadow-sm">
                 <div className="h-64 w-full relative">
                   <img src={booking.coverImage} alt={booking.venueName} className="w-full h-full object-cover" />
                 </div>
                 <div className="p-6 md:p-8">
                    <h3 className="text-xl font-bold text-[var(--text-primary)] mb-6">Booking Details</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="flex items-start gap-4">
                         <div className="bg-[var(--bg-primary)] p-3 rounded-xl text-[var(--bg-green)] border border-[var(--bg-grey)]">
                           <FiCalendar size={20} />
                         </div>
                         <div>
                           <p className="text-sm text-[var(--text-secondary)] mb-1">Date</p>
                           <p className="font-semibold text-lg text-[var(--text-primary)]">{booking.date}</p>
                         </div>
                       </div>
                       
                       <div className="flex items-start gap-4">
                         <div className="bg-[var(--bg-primary)] p-3 rounded-xl text-[var(--bg-green)] border border-[var(--bg-grey)]">
                           <FiClock size={20} />
                         </div>
                         <div>
                           <p className="text-sm text-[var(--text-secondary)] mb-1">Time Range</p>
                           <p className="font-semibold text-lg text-[var(--text-primary)]">{booking.timeRange}</p>
                         </div>
                       </div>

                       <div className="flex items-start gap-4">
                         <div className="bg-[var(--bg-primary)] p-3 rounded-xl text-[var(--bg-green)] border border-[var(--bg-grey)]">
                           <FiUsers size={20} />
                         </div>
                         <div>
                           <p className="text-sm text-[var(--text-secondary)] mb-1">Guest Count</p>
                           <p className="font-semibold text-lg text-[var(--text-primary)]">{booking.guestCount || 'Not specified'}</p>
                         </div>
                       </div>

                       <div className="flex items-start gap-4">
                         <div className="bg-[var(--bg-primary)] p-3 rounded-xl text-[var(--bg-green)] border border-[var(--bg-grey)]">
                           <FiInfo size={20} />
                         </div>
                         <div>
                           <p className="text-sm text-[var(--text-secondary)] mb-1">Event Type</p>
                           <p className="font-semibold text-lg text-[var(--text-primary)] capitalize">{booking.eventType || 'Not specified'}</p>
                         </div>
                       </div>
                    </div>
                 </div>
              </div>

              {booking.bookerInfo && (
                <div className="bg-[var(--bg-tertiary)] border border-[var(--bg-grey)] rounded-3xl p-6 md:p-8 shadow-sm">
                   <h3 className="text-xl font-bold text-[var(--text-primary)] mb-6 flex items-center gap-2">
                     <FiFileText className="text-[var(--bg-green)]" /> Guest Information
                   </h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                     <div>
                       <p className="text-sm text-[var(--text-secondary)] mb-1">Full Name</p>
                       <p className="font-medium text-[var(--text-primary)]">{booking.bookerInfo.name}</p>
                     </div>
                     <div>
                       <p className="text-sm text-[var(--text-secondary)] mb-1">Email</p>
                       <p className="font-medium text-[var(--text-primary)]">{booking.bookerInfo.email}</p>
                     </div>
                     <div>
                       <p className="text-sm text-[var(--text-secondary)] mb-1">Phone</p>
                       <p className="font-medium text-[var(--text-primary)]">{booking.bookerInfo.phone}</p>
                     </div>
                     <div>
                       <p className="text-sm text-[var(--text-secondary)] mb-1">Place / City</p>
                       <p className="font-medium text-[var(--text-primary)]">{booking.bookerInfo.place}</p>
                     </div>
                     {booking.bookerInfo.note && (
                       <div className="md:col-span-2">
                         <p className="text-sm text-[var(--text-secondary)] mb-1">Additional Note</p>
                         <p className="font-medium text-[var(--text-primary)] bg-[var(--bg-primary)] p-4 rounded-xl border border-[var(--bg-grey)] text-sm">{booking.bookerInfo.note}</p>
                       </div>
                     )}
                   </div>
                </div>
              )}

           </div>

           {/* Right Column */}
           <div className="space-y-8">
              
              <div className="bg-[var(--bg-tertiary)] border border-[var(--bg-grey)] rounded-3xl p-6 shadow-sm">
                 <h3 className="text-lg font-bold text-[var(--text-primary)] mb-6">Payment Summary</h3>
                 <div className="space-y-4 mb-6">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[var(--text-secondary)]">Total Amount</span>
                      <span className="font-bold text-[var(--text-primary)]">₹{booking.totalPrice}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[var(--text-secondary)]">Payment Method</span>
                      <span className="font-medium text-[var(--text-primary)] uppercase">{booking.paymentMethod || 'Online'}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[var(--text-secondary)]">Transaction ID</span>
                      <span className="font-mono bg-[var(--bg-primary)] px-2 py-1 rounded text-xs">{booking.paymentReference}</span>
                    </div>
                 </div>
                 <div className="pt-4 border-t border-[var(--bg-grey)] flex justify-between items-center">
                    <span className="font-bold text-[var(--text-primary)]">Amount Paid</span>
                    <span className="text-2xl font-extrabold text-[var(--bg-green)]">₹{booking.totalPrice}</span>
                 </div>
              </div>

              <div className="bg-[var(--bg-tertiary)] border border-[var(--bg-grey)] rounded-3xl p-6 shadow-sm">
                 <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Contact Venue</h3>
                 <div className="space-y-4">
                    <a href={`tel:${booking.contactPhone}`} className="flex items-center gap-3 text-[var(--text-primary)] hover:text-[var(--bg-green)] transition">
                      <div className="w-10 h-10 bg-[var(--bg-primary)] rounded-full flex items-center justify-center border border-[var(--bg-grey)]">
                        <FiPhone />
                      </div>
                      <span className="font-medium">{booking.contactPhone}</span>
                    </a>
                    {booking.contactEmail && (
                      <a href={`mailto:${booking.contactEmail}`} className="flex items-center gap-3 text-[var(--text-primary)] hover:text-[var(--bg-green)] transition">
                        <div className="w-10 h-10 bg-[var(--bg-primary)] rounded-full flex items-center justify-center border border-[var(--bg-grey)]">
                          <FiMail />
                        </div>
                        <span className="font-medium truncate">{booking.contactEmail}</span>
                      </a>
                    )}
                 </div>
                 <div className="mt-6 pt-6 border-t border-[var(--bg-grey)]">
                   <p className="text-sm font-medium text-[var(--text-secondary)] mb-2">Venue Address</p>
                   <p className="text-sm text-[var(--text-primary)]">{booking.address}</p>
                 </div>
              </div>

              <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/30 rounded-3xl p-6">
                 <h3 className="text-lg font-bold text-orange-800 dark:text-orange-400 mb-2">Cancellation Policy</h3>
                 <p className="text-sm text-orange-700 dark:text-orange-300">
                   {booking.cancellationPolicy}
                 </p>
              </div>

           </div>
        </div>
      </div>
      
      {booking && (
        <CancelBookingModal 
          open={isCancelModalOpen} 
          onOpenChange={setIsCancelModalOpen} 
          booking={booking} 
        />
      )}
    </div>
  );
};

export default BookingDetails;
