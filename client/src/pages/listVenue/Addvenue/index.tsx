import { Formik, Form } from 'formik';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../hooks/useToast';
import { useImageUpload } from '../../../hooks/useImageUpload';
import { createVenue, submitVenue } from '../../../services/venueService';
import { mapFormToDTO } from '../../../utils/venueFormMapper';
import { saveDraft, loadDraft, clearDraft } from '../../../utils/venueDraft';
import type { AddVenueFormValues } from '../../../types/venue.types';

import BasicInfoStep from './components/BasicInfoStep';
import { basicInfoSchema } from '../Addvenue/components/BasicValidation';
import BookingStep from './components/middleStep';
import FinishStep from './components/FinishStep';
import { finishSchema } from './components/FinishValidation';
import { middleSchema } from './components/middleValidation';

const STEP_LABELS = ['Basic Info', 'Booking', 'Final Details'];

const AddVenue = () => {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success: showSuccess } = useToast();
  const { uploadFiles, isUploading } = useImageUpload();

  const stepSchemas = [basicInfoSchema, middleSchema, finishSchema];

  const initialValues: AddVenueFormValues = {
    VenueName: '',
    VenueDescription: '',
    venueType: '',
    district: '',
    state: '',
    city: '',
    pincode: '',
    fullAddress: '',
    googleMapsLink: '',
    spaceAttributes: [],
    seatingConfigurations: [],
    maxCapacity: '',
    bookingType: '',
    workingDays: [],
    fixedPackages: [{ slotName: '', startTime: '', endTime: '', price: '' }],
    workingHours: { open: '', close: '' },
    slotDuration: '',
    bufferTime: '',
    pricingType: '',
    samePrice: '',
    pricingRules: [{ fromTime: '', toTime: '', price: '' }],
    blockedTimes: [{ fromTime: '', toTime: '', reason: '' }],
    amenities: [],
    venuePhotos: [],
    contactName: '',
    contactPhone: '',
    cancellationPolicy: '',
    refundType: '',
    refundRules: [{ daysBefore: '', refundPercentage: '' }],
  };

  const savedDraft = user?.id ? loadDraft<AddVenueFormValues>(user.id) : null;
  const resolvedInitialValues = savedDraft ?? initialValues;

  return (
    <Formik
      initialValues={resolvedInitialValues}
      enableReinitialize
      validationSchema={stepSchemas[step] || undefined}
      onSubmit={async (values, { setSubmitting }) => {
        console.log('Submit triggered. User ID:', user?.id);
        if (!user?.id) {
          console.warn('No user ID found, exiting submit early.');
          return;
        }
        try {
          console.log('Starting submission process...');
          setSubmitting(true);

          let imageUrls: string[] = [];
          if (values.venuePhotos && values.venuePhotos.length > 0) {
            console.log('Uploading images...');
            imageUrls = await uploadFiles(values.venuePhotos);
            console.log('Images uploaded:', imageUrls);
          }

          console.log('Mapping form to DTO...');
          const dto = mapFormToDTO(values, imageUrls);
          console.log('DTO:', dto);

          console.log('Calling createVenue API...');
          const venue = await createVenue(dto);
          console.log('Venue created:', venue);

          console.log('Calling submitVenue API...');
          await submitVenue(venue._id);

          console.log('Cleaning up draft and navigating...');
          clearDraft(user.id);
          showSuccess('Venue submitted for review successfully!');
          navigate('/list-venue/my-venues');
        } catch (error) {
          console.error('Submission failed:', error);
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({ validateForm, setTouched, values, errors, isSubmitting }) => {
        const hasErrors = Object.keys(errors).length > 0;

        // Log errors for debugging
        if (hasErrors) {
          console.log('Formik Validation Errors:', errors);
        }

        const handleNext = async () => {
          const errs = await validateForm();
          const touchAll = (obj: Record<string, unknown>): Record<string, unknown> =>
            Object.keys(obj).reduce<Record<string, unknown>>((acc, key) => {
              const val = obj[key];
              acc[key] =
                val && typeof val === 'object' && !Array.isArray(val)
                  ? touchAll(val as Record<string, unknown>)
                  : Array.isArray(val)
                    ? (val as unknown[]).map((item) =>
                        item && typeof item === 'object'
                          ? touchAll(item as Record<string, unknown>)
                          : true
                      )
                    : true;
              return acc;
            }, {});

          if (Object.keys(errs).length > 0) {
            await setTouched(touchAll(errs) as never, false);
            return;
          }

          if (user?.id) saveDraft(user.id, values);
          setStep((s) => s + 1);
        };

        return (
          <Form className="pb-28">
            {/* Step indicators */}
            <div className="ml-72 mb-6 flex gap-3 items-center px-6 pt-6">
              {STEP_LABELS.map((label, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                      i === step
                        ? 'bg-[var(--bg-green)] text-white'
                        : i < step
                          ? 'bg-[var(--bg-green)]/30 text-[var(--bg-green)]'
                          : 'border border-[var(--bg-grey)] text-[var(--text-secondary)]'
                    }`}
                  >
                    {i < step ? '✓' : i + 1}
                  </span>
                  <span
                    className={`text-sm font-medium ${
                      i === step ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
                    }`}
                  >
                    {label}
                  </span>
                  {i < STEP_LABELS.length - 1 && (
                    <span className="ml-2 text-[var(--bg-grey)]">›</span>
                  )}
                </div>
              ))}
            </div>

            {/* Step content */}
            {step === 0 && <BasicInfoStep />}
            {step === 1 && <BookingStep />}
            {step === 2 && <FinishStep />}

            {/* Fixed bottom navigation bar */}
            <div className="fixed bottom-0 left-72 right-0 bg-[var(--bg-tertiary)] border-t border-[var(--bg-grey)] px-8 py-4 flex items-center justify-between z-10">
              {/* Previous */}
              {step > 0 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => s - 1)}
                  className="border border-[var(--bg-grey)] px-6 py-2.5 rounded-xl cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                  ← Previous
                </button>
              ) : (
                <div />
              )}

              {/* Error hint */}
              {hasErrors && (
                <div className="text-center">
                  <p className="text-red-500 text-sm font-semibold">
                    Please fix the errors before continuing
                  </p>
                  <p
                    className="text-red-400 text-xs mt-1 max-w-md truncate"
                    title={Object.keys(errors).join(', ')}
                  >
                    Errors in: {Object.keys(errors).join(', ')}
                  </p>
                </div>
              )}

              {/* Next / Submit */}
              {step < 2 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={hasErrors}
                  className="bg-[var(--bg-green)] text-white px-6 py-2.5 rounded-xl transition-opacity disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Next →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting || isUploading || hasErrors}
                  className="bg-[var(--bg-green)] text-white px-6 py-2.5 rounded-xl transition-opacity disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSubmitting || isUploading ? 'Submitting…' : 'Submit Venue'}
                </button>
              )}
            </div>
          </Form>
        );
      }}
    </Formik>
  );
};

export default AddVenue;
