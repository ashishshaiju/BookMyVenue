export const bookings = [
  {
    id: 1,
    venueId: 101,
    venue: "Royal Palace Hall",
    place: "Edappally",
    district: "Ernakulam",
    address: "NH Bypass Road, Edappally, Kochi, Kerala",
    phone: "+91 9876543210",
    email: "royalpalacehall@gmail.com",

    image:
      "https://plus.unsplash.com/premium_photo-1664530452329-42682d3a73a7?w=800&auto=format&fit=crop&q=60",

    date: "24 Dec 2026",
    time: "6:00 PM - 11:00 PM",
    bookedOn: "15 Nov 2026",

    guests: "500 Guests",
    eventType: "Wedding",

    price: 25000,
    advancePaid: 10000,
    remainingAmount: 15000,

    paymentStatus: "Paid",
    paymentMethod: "UPI",

    bookingStatus: "Confirmed",
    status: "upcoming",

    amenities: [
      "Parking",
      "AC",
      "Dining Area",
      "Wifi",
      "Generator",
      "Stage",
    ],

    cancellationPolicy:
      "Free cancellation up to 7 days before event date.",
  },

  {
    id: 2,
    venueId: 102,
    venue: "Green Garden Venue",
    place: "Guruvayur",
    district: "Thrissur",
    address: "Temple Road, Guruvayur, Thrissur, Kerala",
    phone: "+91 9898989898",
    email: "greengarden@gmail.com",

    image:
      "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800",

    date: "Today",
    time: "4:00 PM - 9:00 PM",
    bookedOn: "10 Jun 2026",

    guests: "300 Guests",
    eventType: "Birthday Party",

    price: 18000,
    advancePaid: 18000,
    remainingAmount: 0,

    paymentStatus: "Paid",
    paymentMethod: "Card",

    bookingStatus: "Ongoing",
    status: "ongoing",

    amenities: [
      "Parking",
      "Wifi",
      "Rooms",
      "Decoration Space",
    ],

    cancellationPolicy:
      "Cannot cancel after booking start time.",
  },

  {
    id: 3,
    venueId: 103,
    venue: "Skyline Event Space",
    place: "Mavoor",
    district: "Kozhikode",
    address: "Main Junction, Mavoor, Kozhikode, Kerala",
    phone: "+91 9123456780",
    email: "skylineevents@gmail.com",

    image:
      "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800",

    date: "12 May 2026",
    time: "7:00 PM - 10:00 PM",
    bookedOn: "22 Apr 2026",

    guests: "200 Guests",
    eventType: "Corporate Event",

    price: 15000,
    advancePaid: 15000,
    remainingAmount: 0,

    paymentStatus: "Paid",
    paymentMethod: "Net Banking",

    bookingStatus: "Completed",
    status: "past",

    amenities: [
      "Parking",
      "Sound System",
      "Wifi",
      "Dining Area",
    ],

    cancellationPolicy:
      "Past bookings cannot be cancelled.",
  },

  {
    id: 4,
    venueId: 104,
    venue: "Grand Celebration Hall",
    place: "Kottakkal",
    district: "Malappuram",
    address: "Near Bus Stand, Kottakkal, Malappuram",
    phone: "+91 9988776655",
    email: "grandcelebration@gmail.com",

    image:
      "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800",

    date: "5 Jan 2027",
    time: "5:00 PM - 11:00 PM",
    bookedOn: "18 Dec 2026",

    guests: "350 Guests",
    eventType: "Engagement",

    price: 22000,
    advancePaid: 12000,
    remainingAmount: 10000,
    mapLink:"https://www.google.com/maps/search/?api=1&query=Royal+Palace+Hall+Edappally",
    paymentStatus: "Partially Paid",
    paymentMethod: "UPI",

    bookingStatus: "Confirmed",
    status: "upcoming",

    amenities: [
      "Parking",
      "AC",
      "Rooms",
      "Lift",
      "Wifi",
    ],

    cancellationPolicy:
      "50% refund if cancelled before 5 days.",
  },
];