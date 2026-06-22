import { Field, FieldArray, ErrorMessage, useFormikContext } from 'formik';

const amenitiesList = [
  'Parking',
  'AC',
  'Dining Area',
  'Wifi',
  'Generator',
  'Sound System',
  'Stage',
  'Rooms',
  'Lift',
  'Wheelchair Access',
  'Decoration Space',
  'Catering Area',
];

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

type BookingStepValues = {
  bookingType: string;
  pricingType: string;
  fixedPackages: {
    slotName: string;
    startTime: string;
    endTime: string;
    price: string;
  }[];
  workingDays: string[];
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

const err = 'text-red-500 text-sm mt-1';
const inputCls =
  'w-full rounded-xl border border-[var(--bg-grey)] px-4 py-3 outline-none focus:border-[var(--bg-green)] bg-white';

const BookingStep = () => {
  const { values } = useFormikContext<BookingStepValues>();

  // Working hours for min/max constraints
  const openTime = values.workingHours?.open || undefined;
  const closeTime = values.workingHours?.close || undefined;

  return (
    <section className="font-sans">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-[var(--bg-green)]">Booking Configuration</h2>
          <p className="text-[var(--text-secondary)] mt-2">
            Configure booking, pricing and venue setup.
          </p>
        </div>

        <div className="bg-[var(--bg-tertiary)] rounded-3xl p-8 border border-[var(--bg-grey)] shadow-sm space-y-10">
          {/* Booking Type */}
          <div>
            <label className="block mb-4 font-bold text-[var(--text-primary)]">Booking Type</label>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 border border-[var(--bg-grey)] rounded-xl px-4 py-3 cursor-pointer">
                <Field type="radio" name="bookingType" value="fixedBooking" />
                Fixed Package
              </label>
              <label className="flex items-center gap-2 border border-[var(--bg-grey)] rounded-xl px-4 py-3 cursor-pointer">
                <Field type="radio" name="bookingType" value="flexibleBooking" />
                Flexible Time Slots
              </label>
            </div>
            <ErrorMessage name="bookingType" component="p" className={err} />
          </div>

          {/* Working Days */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Working Days</h3>
            <div className="flex flex-wrap gap-3">
              {daysOfWeek.map((day) => (
                <label
                  key={day}
                  className="flex items-center gap-2 border border-[var(--bg-grey)] rounded-xl px-4 py-3 cursor-pointer"
                >
                  <Field type="checkbox" name="workingDays" value={day} />
                  {day}
                </label>
              ))}
            </div>
            <ErrorMessage name="workingDays" component="p" className={err} />
          </div>

          {/* Fixed Booking */}
          {values.bookingType === 'fixedBooking' && (
            <div>
              <h3 className="font-semibold text-lg mb-4">Fixed Packages</h3>
              <FieldArray name="fixedPackages">
                {({ push, remove }) => (
                  <div className="space-y-5">
                    {values.fixedPackages.map((_, index) => (
                      <div key={index} className="border border-[var(--bg-grey)] rounded-2xl p-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="md:col-span-2">
                            <label className="block mb-2 font-bold">Slot Name</label>
                            <Field
                              name={`fixedPackages.${index}.slotName`}
                              type="text"
                              placeholder="e.g. Morning Package"
                              className={inputCls}
                            />
                            <ErrorMessage
                              name={`fixedPackages.${index}.slotName`}
                              component="p"
                              className={err}
                            />
                          </div>

                          <div>
                            <label className="block mb-2 font-bold">Start Time</label>
                            <Field
                              name={`fixedPackages.${index}.startTime`}
                              type="time"
                              className={inputCls}
                            />
                            <ErrorMessage
                              name={`fixedPackages.${index}.startTime`}
                              component="p"
                              className={err}
                            />
                          </div>

                          <div>
                            <label className="block mb-2 font-bold">End Time</label>
                            <Field
                              name={`fixedPackages.${index}.endTime`}
                              type="time"
                              className={inputCls}
                            />
                            <ErrorMessage
                              name={`fixedPackages.${index}.endTime`}
                              component="p"
                              className={err}
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="block mb-2 font-bold">Price (₹)</label>
                            <Field
                              name={`fixedPackages.${index}.price`}
                              type="number"
                              placeholder="20000"
                              className={inputCls}
                            />
                            <ErrorMessage
                              name={`fixedPackages.${index}.price`}
                              component="p"
                              className={err}
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
                          slotName: '',
                          startTime: '',
                          endTime: '',
                          price: '',
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

          {/* Flexible Booking */}
          {values.bookingType === 'flexibleBooking' && (
            <div className="space-y-8">
              {/* Working Hours */}
              <div>
                <h3 className="font-semibold text-lg mb-4">Working Hours</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block mb-2 font-bold">Open Time</label>
                    <Field name="workingHours.open" type="time" className={inputCls} />
                    <ErrorMessage name="workingHours.open" component="p" className={err} />
                  </div>
                  <div>
                    <label className="block mb-2 font-bold">Close Time</label>
                    <Field
                      name="workingHours.close"
                      type="time"
                      {...(openTime ? { min: openTime } : {})}
                      className={inputCls}
                    />
                    <ErrorMessage name="workingHours.close" component="p" className={err} />
                  </div>
                </div>
                {openTime && closeTime && (
                  <p className="text-[var(--text-secondary)] text-sm mt-2">
                    ⏱ All time-based fields below are restricted to{' '}
                    <strong>
                      {openTime} – {closeTime}
                    </strong>
                  </p>
                )}
              </div>

              {/* Slot Duration & Buffer Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block mb-2 font-bold">Slot Duration</label>
                  <p className="text-sm text-[var(--text-secondary)] mb-3">
                    Minimum booking duration for each slot.
                  </p>
                  <Field as="select" name="slotDuration" className={inputCls}>
                    <option value="">Select duration</option>
                    <option value="30">30 mins</option>
                    <option value="60">1 hour</option>
                    <option value="120">2 hours</option>
                    <option value="180">3 hours</option>
                  </Field>
                  <ErrorMessage name="slotDuration" component="p" className={err} />
                </div>

                <div>
                  <label className="block mb-2 font-bold">Buffer Time</label>
                  <p className="text-sm text-[var(--text-secondary)] mb-3">
                    Time gap between each slot.
                  </p>
                  <Field as="select" name="bufferTime" className={inputCls}>
                    <option value="">Select buffer</option>
                    <option value="0">No Buffer</option>
                    <option value="15">15 mins</option>
                    <option value="30">30 mins</option>
                    <option value="60">1 hour</option>
                    <option value="120">2 hours</option>
                  </Field>
                  <ErrorMessage name="bufferTime" component="p" className={err} />
                </div>
              </div>

              {/* Pricing Type */}
              <div>
                <label className="block mb-4 font-bold">Pricing Type</label>
                <div className="flex gap-4 flex-wrap">
                  <label className="flex items-center gap-2 border border-[var(--bg-grey)] rounded-xl px-4 py-3 cursor-pointer">
                    <Field type="radio" name="pricingType" value="fixedPricing" />
                    Same Price All Day
                  </label>
                  <label className="flex items-center gap-2 border border-[var(--bg-grey)] rounded-xl px-4 py-3 cursor-pointer">
                    <Field type="radio" name="pricingType" value="timeBasedPricing" />
                    Time Based Pricing
                  </label>
                </div>
                <ErrorMessage name="pricingType" component="p" className={err} />
              </div>

              {/* Same Price */}
              {values.pricingType === 'fixedPricing' && (
                <div>
                  <label className="block mb-2 font-bold">Price Per Slot (₹)</label>
                  <Field name="samePrice" type="number" placeholder="1000" className={inputCls} />
                  <ErrorMessage name="samePrice" component="p" className={err} />
                </div>
              )}

              {/* Time Based Pricing Rules */}
              {values.pricingType === 'timeBasedPricing' && (
                <div>
                  <h3 className="font-semibold text-lg mb-2">Pricing Rules</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block mb-2 font-bold">Base Price (₹)</label>
                        <p className="text-sm text-[var(--text-secondary)] mt-2">
                          This base price applies when time-based pricing is active.
                        </p>
                      <Field
                        name="pricing.basePrice"
                        type="number"
                        placeholder="1000"
                        className={inputCls + ' mt-2'}
                      />
                      <ErrorMessage name="pricing.basePrice" component="p" className={err} />
                    </div>
                  </div>
                  {openTime && closeTime && (
                    <p className="text-[var(--text-secondary)] text-sm mb-4">
                      Times must be within working hours:{' '}
                      <strong>
                        {openTime} – {closeTime}
                      </strong>
                    </p>
                  )}
                  <FieldArray name="pricingRules">
                    {({ push, remove }) => (
                      <div className="space-y-5">
                        {values.pricingRules.map((_, index) => (
                          <div
                            key={index}
                            className="border border-[var(--bg-grey)] rounded-2xl p-5"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div>
                                <label className="block mb-2 font-bold">From Time</label>
                                <Field
                                  name={`pricingRules.${index}.fromTime`}
                                  type="time"
                                  {...(openTime ? { min: openTime } : {})}
                                  {...(closeTime ? { max: closeTime } : {})}
                                  className={inputCls}
                                />
                                <ErrorMessage
                                  name={`pricingRules.${index}.fromTime`}
                                  component="p"
                                  className={err}
                                />
                              </div>
                              <div>
                                <label className="block mb-2 font-bold">To Time</label>
                                <Field
                                  name={`pricingRules.${index}.toTime`}
                                  type="time"
                                  {...(openTime ? { min: openTime } : {})}
                                  {...(closeTime ? { max: closeTime } : {})}
                                  className={inputCls}
                                />
                                <ErrorMessage
                                  name={`pricingRules.${index}.toTime`}
                                  component="p"
                                  className={err}
                                />
                              </div>
                              <div>
                                <label className="block mb-2 font-bold">Price (₹)</label>
                                <Field
                                  name={`pricingRules.${index}.price`}
                                  type="number"
                                  placeholder="1000"
                                  className={inputCls}
                                />
                                <ErrorMessage
                                  name={`pricingRules.${index}.price`}
                                  component="p"
                                  className={err}
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
                          onClick={() => push({ fromTime: '', toTime: '', price: '' })}
                          className="bg-[var(--bg-green)] text-white px-5 py-3 rounded-xl cursor-pointer"
                        >
                          + Add Pricing Rule
                        </button>
                      </div>
                    )}
                  </FieldArray>
                </div>
              )}

              {/* Blocked Times */}
              <div>
                <h3 className="font-semibold text-lg mb-2">Blocked Time</h3>
                <p className="text-[var(--text-secondary)] mb-4">
                  Add maintenance, lunch break or unavailable hours.
                  {openTime && closeTime && (
                    <>
                      {' '}
                      Times must be within{' '}
                      <strong>
                        {openTime} – {closeTime}
                      </strong>
                      .
                    </>
                  )}
                </p>
                <FieldArray name="blockedTimes">
                  {({ push, remove }) => (
                    <div className="space-y-5">
                      {values.blockedTimes.map((_, index) => (
                        <div key={index} className="border border-[var(--bg-grey)] rounded-2xl p-5">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block mb-2 font-bold">From Time</label>
                              <Field
                                name={`blockedTimes.${index}.fromTime`}
                                type="time"
                                {...(openTime ? { min: openTime } : {})}
                                {...(closeTime ? { max: closeTime } : {})}
                                className={inputCls}
                              />
                              <ErrorMessage
                                name={`blockedTimes.${index}.fromTime`}
                                component="p"
                                className={err}
                              />
                            </div>
                            <div>
                              <label className="block mb-2 font-bold">To Time</label>
                              <Field
                                name={`blockedTimes.${index}.toTime`}
                                type="time"
                                {...(openTime ? { min: openTime } : {})}
                                {...(closeTime ? { max: closeTime } : {})}
                                className={inputCls}
                              />
                              <ErrorMessage
                                name={`blockedTimes.${index}.toTime`}
                                component="p"
                                className={err}
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
                        onClick={() => push({ fromTime: '', toTime: '' })}
                        className="bg-[var(--bg-green)] text-white px-5 py-3 rounded-xl cursor-pointer"
                      >
                        + Add Blocked Time
                      </button>
                    </div>
                  )}
                </FieldArray>
              </div>
            </div>
          )}

          {/* Amenities */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Amenities</h3>
            <div className="flex flex-wrap gap-3">
              {amenitiesList.map((item) => (
                <label
                  key={item}
                  className="flex items-center gap-2 border border-[var(--bg-grey)] rounded-xl px-4 py-3 cursor-pointer"
                >
                  <Field type="checkbox" name="amenities" value={item} />
                  {item}
                </label>
              ))}
            </div>
            <ErrorMessage name="amenities" component="p" className={err} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default BookingStep;
