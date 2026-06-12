import { Field, ErrorMessage } from "formik";

const venueTypes = [
  "Hall",
  "Turf",
  "Swimming Pool",
  "Open Ground",
  "Auditorium",
  "Convention Center",
  "Resort",
  "Party Hall",
  "Conference Space",
  "Other",
];

const districts = [
  "Thiruvananthapuram",
  "Kollam",
  "Pathanamthitta",
  "Alappuzha",
  "Kottayam",
  "Idukki",
  "Ernakulam",
  "Thrissur",
  "Palakkad",
  "Malappuram",
  "Kozhikode",
  "Wayanad",
  "Kannur",
  "Kasaragod",
];

const spaceAttributes = [
  "Indoor",
  "Outdoor (Garden/Lawn)",
  "Rooftop",
  "Poolside",
  "Both Indoor & Outdoor",
];

const seatingConfigs = [
  "Floating",
  "Theatre Seating",
  "Round Table",
  "Banquet Seating",
  "Standing",
];

const BasicInfoStep = () => {
  return (
     <section className="font-sans ml-72">
        <div className="mb-8">
          <h2 className="text-3xl font-bold  text-[var(--bg-green)]">
            Venue Registration
          </h2>

          <p className="text-[var(--text-secondary)] mt-2">
            Add your venue details to help customers discover your space.
          </p>
        </div>
       <div className="bg-[var(--bg-tertiary)] rounded-3xl p-8 border border-[var(--bg-grey)] shadow-sm">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Venue Name */}
          <div className="md:col-span-2">
            <label className="block mb-2  font-bold text-[var(--text-primary)] ">
              Venue Name
            </label>

            <Field
              name="VenueName"
              type="text"
              placeholder="Enter Venue Name"
              className="w-full rounded-xl border border-[var(--bg-grey)] px-4 py-3 outline-none focus:border-[var(--bg-green)]"
            />

            <ErrorMessage
              name="VenueName"
              component="p"
              className="text-red-500 text-sm mt-1"
            />
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="block mb-2  font-bold text-[var(--text-primary)] ">
              Venue Description
            </label>

            <Field
              as="textarea"
              name="VenueDescription"
              rows={4}
              placeholder="Describe your venue..."
              className="w-full rounded-xl border border-[var(--bg-grey)] px-4 py-3 outline-none focus:border-[var(--bg-green)] resize-none"
            />

            <ErrorMessage
              name="VenueDescription"
              component="p"
              className="text-red-500 text-sm mt-1"
            />
          </div>

          {/* Venue Type */}
          <div>
            <label className="block mb-2 font-bold ">
              Venue Type
            </label>

            <Field
              as="select"
              name="venueType"
              className="w-full rounded-xl border border-[var(--bg-grey)] px-4 pr-8  py-3 outline-none focus:border-[var(--bg-green)]"
            >
              <option value="" >
                Select venue type
              </option>

              {venueTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Field>
          </div>

          {/* District */}
          <div>
            <label className="block mb-2 font-bold ">
              District
            </label>

            <Field
              as="select"
              name="district"
              className="w-full rounded-xl border border-[var(--bg-grey)] px-4 py-3 outline-none focus:border-[var(--bg-green)]"
            >
              <option value="">
                Select district
              </option>

              {districts.map((district) => (
                <option
                  key={district}
                  value={district}
                >
                  {district}
                </option>
              ))}
            </Field>
          </div>

          {/* Place */}
          <div>
            <label className="block mb-2 font-bold ">
              City / Place
            </label>

            <Field
              name="city"
              type="text"
              placeholder="Enter Your City"
              className="w-full rounded-xl border border-[var(--bg-grey)] px-4 py-3 outline-none focus:border-[var(--bg-green)]"
            />
          </div>

          {/* Pincode */}
          <div>
            <label className="block mb-2 font-bold ">
              Pincode
            </label>

            <Field
              name="pincode"
              type="text"
              placeholder="Enter PIN CODE"
              className="w-full rounded-xl border border-[var(--bg-grey)] px-4 py-3 outline-none focus:border-[var(--bg-green)]"
            />
          </div>

          {/* Address */}
          <div className="md:col-span-2">
            <label className="block mb-2 font-bold ">
              Full Address
            </label>

            <Field
              as="textarea"
              name="fullAddress"
              rows={3}
              placeholder="Enter full address"
              className="w-full rounded-xl border border-[var(--bg-grey)] px-4 py-3 outline-none focus:border-[var(--bg-green)] resize-none"
            />
          </div>

          {/* Google Maps */}
          <div className="md:col-span-2">
            <label className="block mb-2 font-bold ">
              Google Maps Link
            </label>

            <Field
              name="googleMapsLink"
              type="text"
              placeholder="Paste Google Maps link"
              className="w-full rounded-xl border border-[var(--bg-grey)] px-4 py-3 outline-none focus:border-[var(--bg-green)]"
            />
          </div>
        </div>

        {/* Space Attributes */}
        <div className="mt-8">
          <h3 className="font-semibold text-lg mb-4">
            Space Attributes
          </h3>

          <div className="flex flex-wrap gap-3">
            {spaceAttributes.map((item) => (
              <label
                key={item}
                className="flex items-center gap-2 border border-[var(--bg-grey)] rounded-xl px-4 py-3 cursor-pointer"
              >
                <Field
                  type="checkbox"
                  name="spaceAttributes"
                  value={item}
                />

                {item}
              </label>
            ))}
          </div>
        </div>

        {/* Seating */}
        <div className="mt-8">
          <h3 className="font-semibold text-lg mb-4">
            Seating Configuration
          </h3>

          <div className="flex flex-wrap gap-3">
            {seatingConfigs.map((item) => (
              <label
                key={item}
                className="flex items-center gap-2 border border-[var(--bg-grey)] rounded-xl px-4 py-3 cursor-pointer"
              >
                <Field
                  type="checkbox"
                  name="seatingConfigurations"
                  value={item}
                />

                {item}
              </label>
            ))}
          </div>
        </div>

        {/* Capacity */}
        <div className="mt-8">
          <label className="block mb-2 font-bold ">
            Maximum Capacity
          </label>

          <Field
            name="maxCapacity"
            type="number"
            placeholder="500"
            className="w-full rounded-xl border border-[var(--bg-grey)] px-4 py-3 outline-none focus:border-[var(--bg-green)]"
          />
        </div>
      </div>
    </section>

  );
};

export default BasicInfoStep;