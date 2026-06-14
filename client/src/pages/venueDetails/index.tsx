import { venueData } from "./venueData"
import {FiMapPin, FiUsers } from "react-icons/fi";
import { MdOutlineMeetingRoom } from "react-icons/md";
import { GiTable } from "react-icons/gi";
import { TbBuildingEstate } from "react-icons/tb";
import { useState } from "react";
import map from "../../assets/map.jpg"

const VenueDetails = () => {
  const venue = venueData
  const [selectedPackage , setSelectedPackage] = useState<number[]>([]);

  return (
      <section className="max-w-8xl mx-auto mt-24 px-2">
      <div className="grid grid-cols-12 gap-3">
        {/* left content */}
        <div className="col-span-8">
        <div className=" max-w-4xl ml-4 mb-10 px-4 z-10 font-sans">
          <div>
            {/* image Grid */}
            <div className="grid grid-cols-4 grid-rows-3 gap-3 h-[360px]">
              {/* Big Image */}
              <div className="col-span-3 row-span-4">
                <img
                  src={venue.images[0]}
                  alt="venue"
                  className="w-full h-full object-cover rounded-3xl"
                />
              </div>
              {/* image 2*/}
              {venue.images[1] && (
                <div>
                  <img
                    src={venue.images[1]}
                    alt="venue"
                    className="w-full h-full object-cover rounded-2xl"
                  />
                </div>
              )}
              {venue.images[2] && (
                <div>
                  <img
                    src={venue.images[2]}
                    alt="venue"
                    className="w-full h-full object-cover rounded-2xl"
                  />
                </div>
              )}
              {/* more images + icon*/}
              {venue.images.length > 3 && (
                <button className="relative cursor-pointer">

                  <img
                    src={venue.images[3]}
                    alt="venue"
                    className="w-full h-full object-cover rounded-2xl brightness-50"
                  />

                  <div className="absolute inset-0 flex items-center justify-center text-white text-2xl font-bold">
                    + {venue.images.length - 3}
                  </div>
                </button>
              )}

            </div>
          </div>
          {/* about venue */}
          <div className="mt-8 bg-[var(--bg-tertiary)] border border-[var(--bg-grey)] rounded-3xl p-6">
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">
              About Venue
            </h2>
            <p className="mt-4 text-[var(--text-secondary)] leading-8">
              {venue.description}
            </p>
          </div>
          {/* Amenities */}
          <div className="mt-8">

            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
              Amenities
            </h2>

            <div className="flex flex-wrap gap-3">

              {/* only show first 5 amianities else + icon */}
              {venue.amenities
                ?.slice(0, 8)
                .map((item, index) => (
                  <div
                    key={index}
                    className="px-4 py-2 rounded-full bg-[var(--bg-grey)] text-[var(--bg-green)] font-medium"
                  >
                    {item}
                  </div>
                ))}

              {/* more button */}
              {venue.amenities?.length > 8 && (
                <button className="px-4 py-2 rounded-full bg-[var(--bg-green)] text-white font-medium cursor-pointer">
                  +{venue.amenities.length - 8} More
                </button>
              )}

            </div>
          </div>
          {/* Venue Details */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-5">
              Venue Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Venue Type */}
              <div className="bg-[var(--bg-tertiary)] border border-[var(--bg-grey)] rounded-3xl p-5">
                <div className="flex items-center gap-3">
                  <div className="bg-[var(--bg-grey)] p-3 rounded-2xl">
                    <MdOutlineMeetingRoom className="text-[var(--bg-green)] text-xl" />
                  </div>
                  <div>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Venue Type
                    </p>
                    <h3 className="font-semibold text-[var(--text-primary)]">
                      {venue.venueType}
                    </h3>
                  </div>
                </div>
              </div>
              {/* Capacity */}
              <div className="bg-[var(--bg-tertiary)] border border-[var(--bg-grey)] rounded-3xl p-5">
                <div className="flex items-center gap-3">
                  <div className="bg-[var(--bg-grey)] p-3 rounded-2xl">
                    <FiUsers className="text-[var(--bg-green)] text-xl" />
                  </div>
                  <div>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Capacity
                    </p>
                    <h3 className="font-semibold text-[var(--text-primary)]">
                      {venue.maxCapacity} Guests
                    </h3>
                  </div>
                </div>
              </div>
              {/* Space Type */}
              <div className="bg-[var(--bg-tertiary)] border border-[var(--bg-grey)] rounded-3xl p-5">
                <div className="flex items-center gap-3">
                  <div className="bg-[var(--bg-grey)] p-3 rounded-2xl">
                    <TbBuildingEstate className="text-[var(--bg-green)] text-xl" />
                  </div>
                  <div>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Space Type
                    </p>
                    <h3 className="font-semibold text-[var(--text-primary)]">
                      {venue.spaceAttributes?.join(", ")}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Seating */}
              <div className="bg-[var(--bg-tertiary)] border border-[var(--bg-grey)] rounded-3xl p-5">
                <div className="flex items-center gap-3">
                  <div className="bg-[var(--bg-grey)] p-3 rounded-2xl">
                    <GiTable className="text-[var(--bg-green)] text-xl" />
                  </div>
                  <div>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Seating
                    </p>
                    <h3 className="font-semibold text-[var(--text-primary)]">
                      {venue.seatingConfigurations?.join(", ")}
                    </h3>
                  </div>
                </div>
              </div>

              
            </div>
          </div>
          {/* Location */}
         <div className="mt-8 bg-[var(--bg-tertiary)] border border-[var(--bg-grey)] rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-5">

              <div className="bg-[var(--bg-grey)] p-3 rounded-2xl">
                <FiMapPin className="text-[var(--bg-green)] text-xl" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-[var(--text-primary)]">
                  Location
                </h2>

                <p className="text-[var(--text-secondary)] text-sm mt-1">
                  {venue.city}, {venue.district}
                </p>
              </div>

            </div>

            {/* Address */}
            <p className="text-[var(--text-primary)] mb-5 leading-7">
              {venue.fullAddress}, {venue.pin}
            </p>

            {/* Map Box */}
            <a
              href={venue.googleMapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="block relative rounded-3xl overflow-hidden border border-[var(--bg-grey)] h-[220px] group"
            >

              <img
                src={map}
                alt="map"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              />

              <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                <div className="bg-[var(--bg-green)] px-5 py-3 rounded-2xl font-medium text-[var(--bg-tertiary)] shadow-md">
                  Open in Maps
                </div>
              </div>
            </a>
          </div>
        </div>
        </div>


        {/* Right Booking Section */}
        <div className="col-span-4">
          <div className="sticky top-28  mr-15 bg-[var(--bg-tertiary)] border border-[var(--bg-grey)] rounded-3xl p-4">
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">
              Book Venue
            </h2>

            {/* Date */}
            <div className="mt-5">

              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Select Date
              </label>

              <input
                type="date"
                className="w-full border border-[var(--bg-grey)] rounded-2xl px-4 py-3 outline-none"
              />

            </div>

            {/* slot selection*/}
            <div className="mt-6">
              <h3 className="font-semibold text-[var(--text-primary)] mb-3">
                Available Slots
              </h3>

              <div className="grid grid-cols-2 gap-3">
              {/* for fixed slots */}
              {venue.bookingType === "fixed" && 
                venue.fixedSlots?.map(
                  (item, index) => (
                    <button
                      key={index}
                      onClick={() => {
                          if ( selectedPackage.includes(index) ){
                            setSelectedPackage( selectedPackage.filter((item) => item !== index ));
                          } else {
                            setSelectedPackage([ ...selectedPackage, index ]);
                          }
                        }}
                      className={`w-full text-left border rounded-2xl p-3 transition cursor-pointer
                        ${
                          selectedPackage.includes(index)
                            ? "border-[var(--bg-green)] bg-[var(--bg-grey)]"
                            : "border-[var(--bg-grey)]"
                        }
                      `}
                    >

                      <div className="flex justify-between items-start">

                        <div>
                          <h4 className="font-semibold text-sm text-[var(--text-primary)]">
                            {item.slotName}
                          </h4>

                          <p className="text-xs text-[var(--text-secondary)] mt-1">
                            {item.startTime} - {item.endTime}
                          </p>
                        </div>

                        <span className="font-bold text-sm text-[var(--bg-green)]">
                          ₹{item.price}
                        </span>

                      </div>

                    </button>
                  )
                )}

              {/* flexible slots */}
              {venue.bookingType === "flexible" &&
                venue.generatedSlots?.map(
                  (item, index) => (
                    <button
                      key={index}
                      onClick={() => {

                        if (
                          selectedPackage.includes(index)
                        ) {

                          setSelectedPackage(
                            selectedPackage.filter(
                              (slot) =>
                                slot !== index
                            )
                          );

                        } else {

                          setSelectedPackage([
                            ...selectedPackage,
                            index
                          ]);

                        }

                      }}
                      className={`w-full text-left border rounded-2xl p-3 transition cursor-pointer

                        ${
                          selectedPackage.includes(index)
                            ? "border-[var(--bg-green)] bg-[var(--bg-grey)]"
                            : "border-[var(--bg-grey)]"
                        }
                      `}
                    >

                      <div className="flex justify-between items-start">

                        <div>

                          <h4 className="font-semibold text-sm text-[var(--text-primary)]">
                            {item.startTime}
                          </h4>

                          <p className="text-xs text-[var(--text-secondary)] mt-1">
                            {item.endTime}
                          </p>

                        </div>

                        <span className="font-bold text-sm text-[var(--bg-green)]">
                          ₹{item.price}
                        </span>

                      </div>

                    </button>
                  )
                )}
              </div>

            </div>

            {/* Book Button */}
            <button
              disabled={selectedPackage.length === 0}
              className={`w-full mt-6 py-4 rounded-2xl font-semibold transition

                ${
                  selectedPackage.length !== 0
                    ? "bg-[var(--bg-green)] text-white cursor-pointer"
                    : "bg-[var(--bg-grey)] text-[var(--text-secondary)] cursor-not-allowed"
                }
              `}
            >
              Book Now
            </button>

          </div>
        </div>
              
      </div>

    </section>
      
  )
}

export default VenueDetails