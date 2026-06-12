import { Field, FieldArray, useFormikContext } from "formik";

const amenitiesList = [
  "Parking",
  "AC",
  "Dining Area",
  "Wifi",
  "Generator",
  "Sound System",
  "Stage",
  "Rooms",
  "Lift",
  "Wheelchair Access",
  "Decoration Space",
  "Catering Area",
];
type BookingStepValues = {
  bookingType: string;
  pricingType: string;

  fixedPackages: {
    slotName: string;
    startTime: string;
    endTime: string;
    price: string;
  }[];

  workingHours: {
    open: string;
    close: string;
  };

  slotDuration: string;
  bufferTime: string;
  samePrice: string;
  pricingRules: {
    fromTime: string;
    toTime: string;
    price: string;
  }[];
  blockedTimes: {
    fromTime: string;
    toTime: string;
  }[];
  amenities: string[];
};

const BookingStep = () => {
  const { values } = useFormikContext<BookingStepValues>();

  return (
    <section className="font-sans ml-72">
      <div className="max-w-5xl mx-auto">

        <div className="mb-8">
          <h2 className="text-3xl font-bold text-[var(--bg-green)]">Booking Configuration</h2>

          <p className="text-[var(--text-secondary)] mt-2">
            Configure booking, pricing and venue setup.
          </p>
        </div>

        <div className="bg-[var(--bg-tertiary)] rounded-3xl p-8 border border-[var(--bg-grey)] shadow-sm">

          {/* Booking Type */}
          <div>
            <label className="block mb-4 font-bold text-[var(--text-primary)]">
              Booking Type
            </label>

            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 border border-[var(--bg-grey)] rounded-xl px-4 py-3 cursor-pointer">
                <Field type="radio" name="bookingType" value="fixed" />
                Fixed Package
              </label>

              <label className="flex items-center gap-2 border border-[var(--bg-grey)] rounded-xl px-4 py-3 cursor-pointer">
                <Field type="radio" name="bookingType" value="flexible" />
                Flexible Time Slots
              </label>
            </div>
          </div>

          {/* Fixed Package */}
          {values.bookingType === "fixed" && (
            <div className="mt-10">

              <h3 className="font-semibold text-lg mb-4">
                Fixed Packages
              </h3>

              <FieldArray name="fixedPackages">
                {({ push, remove }) => (
                  <div className="space-y-5">

                    {values.fixedPackages.map((_, index: number) => (
                      <div
                        key={index}
                        className="border border-[var(--bg-grey)] rounded-2xl p-5"
                      >

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                          <div className="md:col-span-2">
                            <label className="block mb-2 font-bold">
                              Slot Name
                            </label>

                            <Field
                              name={`fixedPackages.${index}.slotName`}
                              type="text"
                              placeholder="Enter slot name"
                              className="w-full rounded-xl border border-[var(--bg-grey)] px-4 py-3 outline-none focus:border-[var(--bg-green)]"
                            />
                          </div>

                          <div>
                            <label className="block mb-2 font-bold">
                              Start Time
                            </label>

                            <Field
                              name={`fixedPackages.${index}.startTime`}
                              type="time"
                              className="w-full rounded-xl border border-[var(--bg-grey)] px-4 py-3"
                            />
                          </div>

                          <div>
                            <label className="block mb-2 font-bold">
                              End Time
                            </label>

                            <Field
                              name={`fixedPackages.${index}.endTime`}
                              type="time"
                              className="w-full rounded-xl border border-[var(--bg-grey)] px-4 py-3"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="block mb-2 font-bold">
                              Price
                            </label>

                            <Field
                              name={`fixedPackages.${index}.price`}
                              type="number"
                              placeholder="20000"
                              className="w-full rounded-xl border border-[var(--bg-grey)] px-4 py-3"
                            />
                          </div>
                        </div>

                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="text-red-500 mt-4 cursor-pointer"
                          >
                            Remove Package
                          </button>
                        )}
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() =>
                        push({
                          slotName: "",
                          startTime: "",
                          endTime: "",
                          price: "",
                        })
                      }
                      className="bg-[var(--bg-green)] text-white px-5 py-3 rounded-xl cursor-pointer"
                    >
                      + Add Package
                    </button>

                  </div>
                )}
              </FieldArray>
            </div>
          )}

          {/* Flexible Time */}
          {values.bookingType === "flexible" && (
            <div className="mt-10 space-y-8">

              {/* Working Hours */}
              <div>
                <h3 className="font-semibold text-lg mb-4">
                  Working Hours
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  <div>
                    <label className="block mb-2 font-bold">
                      Open Time
                    </label>

                    <Field
                      name="workingHours.open"
                      type="time"
                      className="w-full rounded-xl border border-[var(--bg-grey)] px-4 py-3"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 font-bold">
                      Close Time
                    </label>

                    <Field
                      name="workingHours.close"
                      type="time"
                      className="w-full rounded-xl border border-[var(--bg-grey)] px-4 py-3"
                    />
                  </div>

                </div>
              </div>

              {/* Slot Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <div>
                  <label className="block mb-2 font-bold">
                    Slot Duration
                  </label>

                  <Field
                    as="select"
                    name="slotDuration"
                    className="w-full rounded-xl border border-[var(--bg-grey)] px-4 py-3"
                  >
                    <option value="">Select duration</option>
                    <option value="30">30 mins</option>
                    <option value="60">1 hour</option>
                    <option value="120">2 hours</option>
                    <option value="180">3 hours</option>
                  </Field>
                </div>

                <div>
                  <label className="block mb-2 font-bold">
                    Buffer Time
                  </label>

                  <Field
                    as="select"
                    name="bufferTime"
                    className="w-full rounded-xl border border-[var(--bg-grey)] px-4 py-3"
                  >
                    <option value="">Select buffer</option>
                    <option value="0">No Buffer</option>
                    <option value="15">15 mins</option>
                    <option value="30">30 mins</option>
                    <option value="60">1 hour</option>
                    <option value="120">2 hours</option>
                  </Field>
                </div>

              </div>

              {/* Pricing Type */}
              <div>
                <label className="block mb-4 font-bold">
                  Pricing Type
                </label>

                <div className="flex gap-4 flex-wrap">

                  <label className="flex items-center gap-2 border border-[var(--bg-grey)] rounded-xl px-4 py-3 cursor-pointer">
                    <Field
                      type="radio"
                      name="pricingType"
                      value="same"
                    />
                    Same Price All Day
                  </label>

                  <label className="flex items-center gap-2 border border-[var(--bg-grey)] rounded-xl px-4 py-3 cursor-pointer">
                    <Field
                      type="radio"
                      name="pricingType"
                      value="timeBased"
                    />
                    Time Based Pricing
                  </label>

                </div>
              </div>

              {/* Same Price */}
              {values.pricingType === "same" && (
                <div>
                  <label className="block mb-2 font-bold">
                    Price Per Slot
                  </label>

                  <Field
                    name="samePrice"
                    type="number"
                    placeholder="1000"
                    className="w-full rounded-xl border border-[var(--bg-grey)] px-4 py-3"
                  />
                </div>
              )}
              {/* Time Based Pricing */}
              {values.pricingType === "timeBased" && (
                <div className="mt-8">
                  <h3 className="font-semibold text-lg mb-4">
                    Pricing Rules
                  </h3>

                  <FieldArray name="pricingRules">
                    {({ push, remove }) => (
                      <div className="space-y-5">

                        {values.pricingRules.map((_, index: number) => (
                          <div
                            key={index}
                            className="border border-[var(--bg-grey)] rounded-2xl p-5"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                              <div>
                                <label className="block mb-2 font-bold">
                                  From Time
                                </label>

                                <Field
                                  name={`pricingRules.${index}.fromTime`}
                                  type="time"
                                  className="w-full rounded-xl border border-[var(--bg-grey)] px-4 py-3"
                                />
                              </div>

                              <div>
                                <label className="block mb-2 font-bold">
                                  To Time
                                </label>

                                <Field
                                  name={`pricingRules.${index}.toTime`}
                                  type="time"
                                  className="w-full rounded-xl border border-[var(--bg-grey)] px-4 py-3"
                                />
                              </div>

                              <div>
                                <label className="block mb-2 font-bold">
                                  Price
                                </label>

                                <Field
                                  name={`pricingRules.${index}.price`}
                                  type="number"
                                  placeholder="1000"
                                  className="w-full rounded-xl border border-[var(--bg-grey)] px-4 py-3"
                                />
                              </div>

                            </div>

                            {index > 0 && (
                              <button
                                type="button"
                                onClick={() => remove(index)}
                                className="text-red-500 mt-4 cursor-pointer"
                              >
                                Remove Rule
                              </button>
                            )}
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={() =>
                            push({
                              fromTime: "",
                              toTime: "",
                              price: "",
                            })
                          }
                          className="bg-[var(--bg-green)] text-white px-5 py-3 rounded-xl cursor-pointer"
                        >
                          + Add Pricing Rule
                        </button>

                      </div>
                    )}
                  </FieldArray>
                </div>
              )}

            </div>
          )}

          {/* Amenities */}
          <div className="mt-10">
            <h3 className="font-semibold text-lg mb-4">
              Amenities
            </h3>

            <div className="flex flex-wrap gap-3">
              {amenitiesList.map((item: string, index: number) => (
                <label
                  key={index}
                  className="flex items-center gap-2 border border-[var(--bg-grey)] rounded-xl px-4 py-3 cursor-pointer"
                >
                  <Field
                    type="checkbox"
                    name="amenities"
                    value={item}
                  />

                  {item}
                </label>
              ))}
            </div>
          </div>
          {/* Blocked Time */}
          <div className="mt-10">
            <h3 className="font-semibold text-lg mb-4">
              Blocked Time
            </h3>

            <p className="text-[var(--text-secondary)] mb-4">
              Add maintenance, lunch break or unavailable hours.
            </p>

            <FieldArray name="blockedTimes">
              {({ push, remove }) => (
                <div className="space-y-5">

                  {values.blockedTimes.map((_, index: number) => (
                    <div
                      key={index}
                      className="border border-[var(--bg-grey)] rounded-2xl p-5"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                        <div>
                          <label className="block mb-2 font-bold">
                            From Time
                          </label>

                          <Field
                            name={`blockedTimes.${index}.fromTime`}
                            type="time"
                            className="w-full rounded-xl border border-[var(--bg-grey)] px-4 py-3"
                          />
                        </div>

                        <div>
                          <label className="block mb-2 font-bold">
                            To Time
                          </label>

                          <Field
                            name={`blockedTimes.${index}.toTime`}
                            type="time"
                            className="w-full rounded-xl border border-[var(--bg-grey)] px-4 py-3"
                          />
                        </div>


                      </div>

                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="text-red-500 mt-4 cursor-pointer"
                        >
                          Remove Block
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() =>
                      push({
                        fromTime: "",
                        toTime: "",
                      })
                    }
                    className="bg-[var(--bg-green)] text-white px-5 py-3 rounded-xl cursor-pointer"
                  >
                    + Add Blocked Time
                  </button>

                </div>
              )}
            </FieldArray>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BookingStep;