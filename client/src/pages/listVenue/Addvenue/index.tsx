import { Formik, Form } from "formik";
import { useState } from "react";

import BasicInfoStep from "./components/BasicInfoStep";
import { basicInfoSchema } from "../Addvenue/components/BasicValidation";
import BookingStep from "./components/middleStep";
import FinishStep from "./components/FinishStep";
import { finishSchema } from "./components/FinishValidation";
import { middleSchema } from "./components/middleValidation";
const AddVenue = () => {
  const [step, setStep] = useState(0);

  const stepSchemas = [
    basicInfoSchema,
    middleSchema,
    finishSchema,
  ];

  const initialValues = {
    VenueName: "",
    VenueDescription: "",
    venueType: "",
    district: "",
    city: "",
    pincode: "",
    fullAddress: "",
    googleMapsLink: "",
    spaceAttributes: [],
    seatingConfigurations: [],
    maxCapacity: "",
    bookingType: "",
    fixedPackages: [
      {
        slotName: "",
        startTime: "",
        endTime: "",
        price: "",
      },
    ],
    workingHours: {
      open: "",
      close: "",
    },
    slotDuration: "",
    bufferTime: "",
    pricingType: "",
    samePrice: "",
    pricingRules: [
      {
        fromTime: "",
        toTime: "",
        price: "",
      },
    ],
    blockedTimes: [
      {
        fromTime: "",
        toTime: "",
        reason: "",
      },
    ],
    amenities: [],
    venuePhotos: [],
    contactName: "",
    contactPhone: "",
    cancellationPolicy: "",
    refundType: "",
    refundRules: [
      {
        daysBefore: "",
        refundPercentage: "",
      },
    ],
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={stepSchemas[step] || undefined}
      onSubmit={(values) => {
        console.log({values});
      }}
    >
      {({ validateForm }) => (
        <Form className="max-w-5xl mx-auto p-6">

          {/* Step  */}
          {step === 0 && (<BasicInfoStep />)}
          {step === 1 && <BookingStep />}
          {step === 2 && <FinishStep />}
          {/* Buttons */}
         <div className="mt-8 flex justify-between">

            {/* Previous */}
            {step > 0 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="border border-[var(--bg-grey)] ml-72 px-6 py-3 rounded-xl cursor-pointer"
              >
                Previous
              </button>
            ) : (
              <div />
            )}

            {/* next or submit*/}
            {step < 2 ? (
              <button
                type="button"
                onClick={async () => {
                 
                const errors = await validateForm();

                console.error(errors);

                setStep(step + 1);
              
                  
                }}
                className="bg-[var(--bg-green)] text-white px-6 py-3 rounded-xl cursor-pointer"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                className="bg-[var(--bg-green)] text-white px-6 py-3 rounded-xl cursor-pointer"
              >
                Submit
              </button>
            )}
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default AddVenue;