import { Field, ErrorMessage } from 'formik';
import { KERALA_DISTRICTS } from '@/constants';

const venueTypes = [
  'Hall',
  'Turf',
  'Swimming Pool',
  'Open Ground',
  'Auditorium',
  'Convention Center',
  'Resort',
  'Party Hall',
  'Conference Space',
  'Other',
];

const spaceAttributes = [
  'Indoor',
  'Outdoor (Garden/Lawn)',
  'Rooftop',
  'Poolside',
  'Both Indoor & Outdoor',
];

const seatingConfigs = [
  'Floating',
  'Theatre Seating',
  'Round Table',
  'Banquet Seating',
  'Standing',
];

const err = 'text-red-500 text-sm mt-1';

const BasicInfoStep = () => {
  return (
    <section className="font-sans">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-[var(--bg-green)]">Venue Registration</h2>
        <p className="text-[var(--text-secondary)] mt-2">
          Add your venue details to help customers discover your space.
        </p>
      </div>

      <div className="bg-[var(--bg-tertiary)] rounded-3xl p-8 border border-[var(--bg-grey)] shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Venue Name */}
          <div className="md:col-span-2">
            <label className="block mb-2 font-bold text-[var(--text-primary)]">Venue Name</label>
            <Field
              name="VenueName"
              type="text"
              placeholder="Enter Venue Name"
              className="w-full rounded-xl border border-[var(--bg-grey)] px-4 py-3 outline-none focus:border-[var(--bg-green)]"
            />
            <ErrorMessage name="VenueName" component="p" className={err} />
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="block mb-2 font-bold text-[var(--text-primary)]">
              Venue Description
            </label>
            <Field
              as="textarea"
              name="VenueDescription"
              rows={4}
              placeholder="Describe your venue..."
              className="w-full rounded-xl border border-[var(--bg-grey)] px-4 py-3 outline-none focus:border-[var(--bg-green)] resize-none"
            />
            <ErrorMessage name="VenueDescription" component="p" className={err} />
          </div>

          {/* Venue Type */}
          <div>
            <label className="block mb-2 font-bold">Venue Type</label>
            <Field
              as="select"
              name="venueType"
              className="w-full rounded-xl border border-[var(--bg-grey)] px-4 pr-8 py-3 outline-none focus:border-[var(--bg-green)]"
            >
              <option value="">Select venue type</option>
              {venueTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Field>
            <ErrorMessage name="venueType" component="p" className={err} />
          </div>

          {/* District */}
          <div>
            <label className="block mb-2 font-bold">District</label>
            <Field
              as="select"
              name="district"
              className="w-full rounded-xl border border-[var(--bg-grey)] px-4 py-3 outline-none focus:border-[var(--bg-green)]"
            >
              <option value="">Select district</option>
              {KERALA_DISTRICTS.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </Field>
            <ErrorMessage name="district" component="p" className={err} />
          </div>

          {/* City */}
          <div>
            <label className="block mb-2 font-bold">City / Place</label>
            <Field
              name="city"
              type="text"
              placeholder="Enter Your City"
              className="w-full rounded-xl border border-[var(--bg-grey)] px-4 py-3 outline-none focus:border-[var(--bg-green)]"
            />
            <ErrorMessage name="city" component="p" className={err} />
          </div>

          {/* Pincode */}
          <div>
            <label className="block mb-2 font-bold">Pincode</label>
            <Field
              name="pincode"
              type="text"
              placeholder="Enter PIN CODE"
              className="w-full rounded-xl border border-[var(--bg-grey)] px-4 py-3 outline-none focus:border-[var(--bg-green)]"
            />
            <ErrorMessage name="pincode" component="p" className={err} />
          </div>

          {/* Full Address */}
          <div className="md:col-span-2">
            <label className="block mb-2 font-bold">Full Address</label>
            <Field
              as="textarea"
              name="fullAddress"
              rows={3}
              placeholder="Enter full address"
              className="w-full rounded-xl border border-[var(--bg-grey)] px-4 py-3 outline-none focus:border-[var(--bg-green)] resize-none"
            />
            <ErrorMessage name="fullAddress" component="p" className={err} />
          </div>

          {/* Google Maps */}
          <div className="md:col-span-2">
            <label className="block mb-2 font-bold">
              Google Maps Link{' '}
              <span className="text-[var(--text-secondary)] font-normal text-sm">(optional)</span>
            </label>
            <Field
              name="googleMapsLink"
              type="text"
              placeholder="Paste Google Maps link"
              className="w-full rounded-xl border border-[var(--bg-grey)] px-4 py-3 outline-none focus:border-[var(--bg-green)]"
            />
            <ErrorMessage name="googleMapsLink" component="p" className={err} />
          </div>
        </div>

        {/* Space Attributes */}
        <div className="mt-8">
          <h3 className="font-semibold text-lg mb-4">Space Attributes</h3>
          <div className="flex flex-wrap gap-3">
            {spaceAttributes.map((item) => (
              <label
                key={item}
                className="flex items-center gap-2 border border-[var(--bg-grey)] rounded-xl px-4 py-3 cursor-pointer"
              >
                <Field type="checkbox" name="spaceAttributes" value={item} />
                {item}
              </label>
            ))}
          </div>
          <ErrorMessage name="spaceAttributes" component="p" className={err} />
        </div>

        {/* Seating Configuration */}
        <div className="mt-8">
          <h3 className="font-semibold text-lg mb-4">Seating Configuration</h3>
          <div className="flex flex-wrap gap-3">
            {seatingConfigs.map((item) => (
              <label
                key={item}
                className="flex items-center gap-2 border border-[var(--bg-grey)] rounded-xl px-4 py-3 cursor-pointer"
              >
                <Field type="checkbox" name="seatingConfigurations" value={item} />
                {item}
              </label>
            ))}
          </div>
          <ErrorMessage name="seatingConfigurations" component="p" className={err} />
        </div>

        {/* Max Capacity */}
        <div className="mt-8">
          <label className="block mb-2 font-bold">
            Maximum Capacity{' '}
            <span className="text-[var(--text-secondary)] font-normal text-sm">(optional)</span>
          </label>
          <Field
            name="maxCapacity"
            type="number"
            placeholder="500"
            className="w-full rounded-xl border border-[var(--bg-grey)] px-4 py-3 outline-none focus:border-[var(--bg-green)]"
          />
          <ErrorMessage name="maxCapacity" component="p" className={err} />
        </div>
      </div>
    </section>
  );
};

export default BasicInfoStep;
