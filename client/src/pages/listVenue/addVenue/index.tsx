import { Formik, Form } from 'formik';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { useImageUpload } from '@/hooks/useImageUpload';
import { createVenue, upsertVenueDraft, getMyDraft } from '@/services/venueService';
import { mapFormToDTO } from '@/utils/venueFormMapper';
import {
  saveDraftSession,
  loadDraftSession,
  clearDraftSession,
  clearDraft,
} from '@/utils/venueDraft';
import type { AddVenueFormValues } from '@/types/venue.types';

import BasicInfoStep from './components/BasicInfoStep';
import { basicInfoSchema } from './components/BasicValidation';
import BookingStep from './components/middleStep';
import FinishStep from './components/FinishStep';
import { finishSchema } from './components/FinishValidation';
import { middleSchema } from './components/middleValidation';

const BLANK_FORM: AddVenueFormValues = {
  VenueName: '',
  VenueDescription: '',
  venueType: '',
  district: '',
  state: '',
  city: '',
  pincode: '',
  fullAddress: '',
  googleMapsLink: '',
  coordinates: null,
  spaceAttributes: [],
  seatingConfigurations: [],
  maxCapacity: '',
  bookingType: '',
  workingDays: [],
  fixedPackages: [{ slotName: '', startTime: '', endTime: '', price: 0 }],
  workingHours: { open: '', close: '' },
  flexibleBooking: { slotDuration: '', bufferTime: '' },
  pricing: {
    pricingType: '',
    basePrice: 0,
    pricingRules: [{ fromTime: '', toTime: '', price: 0 }],
  },
  blockedTimes: [{ fromTime: '', toTime: '', reason: '' }],
  amenities: [],
  venuePhotos: [],
  contact: { name: '', phone: '', email: '' },
  cancellation: {
    policy: '',
    refundType: '',
    refundRules: [{ daysBefore: '', refundPercentage: '' }],
  },
};

const STEP_LABELS = ['Basic Info', 'Booking', 'Final Details'];

const AddVenue = () => {
  const [step, setStep] = useState(0);
  const [formValues, setFormValues] = useState<AddVenueFormValues>(BLANK_FORM);
  const [initializing, setInitializing] = useState(true);

  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { success: showSuccess, error: showError } = useToast();
  const { uploadFiles, isUploading } = useImageUpload();

  const stepSchemas = [basicInfoSchema, middleSchema, finishSchema];

  // Load draft from session storage or API
  useEffect(() => {
    const init = async () => {
      if (authLoading) return;
      if (!user?.id) {
        setInitializing(false);
        return;
      }

      const session = loadDraftSession(user.id);
      if (session && session.formValues) {
        console.log('Restoring draft from session:', session.formValues);
        setStep(session.step || 0);
        setFormValues({ ...BLANK_FORM, ...session.formValues });
        setInitializing(false);
        showSuccess('Draft retrieved, you can continue from here.');
        return;
      }

      try {
        const draft = await getMyDraft();
        console.log('Draft from API:', draft);
        if (draft && draft.formValues && Object.keys(draft.formValues).length > 0) {
          console.log('Restoring draft from API:', draft.formValues);
          const values = { ...BLANK_FORM, ...(draft.formValues as Partial<AddVenueFormValues>) };
          const resumeStep = typeof draft.step === 'number' ? draft.step : 0;

          setStep(resumeStep);
          setFormValues(values);
          saveDraftSession(user.id, { venueId: 'draft', step: resumeStep, formValues: values });
          showSuccess('Draft retrieved, you can continue from here.');
        }
      } catch (err) {
        console.error('Failed to get draft:', err);
      } finally {
        setInitializing(false);
      }
    };

    void init();
  }, [user?.id, authLoading, showSuccess]);

  if (initializing) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[var(--bg-green)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-[var(--text-secondary)] text-sm">Loading your draft…</p>
        </div>
      </div>
    );
  }

  return (
    <Formik
      initialValues={formValues}
      enableReinitialize
      validationSchema={stepSchemas[step] || undefined}
      onSubmit={async (values, { setSubmitting }) => {
        if (!user?.id) {
          showError('User not authenticated. Please restart.');
          return;
        }
        try {
          setSubmitting(true);

          let imageUrls: string[] = [];
          if (values.venuePhotos?.length > 0) {
            imageUrls = await uploadFiles(values.venuePhotos);
          }

          const dto = mapFormToDTO(values, imageUrls);
          await createVenue(dto);

          clearDraftSession(user.id);
          clearDraft(user.id);
          showSuccess('Venue submitted for review successfully!');
          navigate('/list-venue/my-venues');
        } catch (error) {
          console.error('Submission failed:', error);
          showError('Submission failed. Please try again.');
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({ validateForm, setTouched, values, errors, isSubmitting }) => {
        const hasErrors = Object.keys(errors).length > 0;

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

          if (!user?.id) {
            showError('User not authenticated');
            return;
          }

          try {
            // Save raw form values as a draft backup on the server
            await upsertVenueDraft(step + 1, values);
            saveDraftSession(user.id, { venueId: 'draft', step: step + 1, formValues: values });
            setStep((s) => s + 1);
          } catch (error) {
            console.error('Save failed:', error);
            showError('Failed to save progress. Please try again.');
          }
        };

        return (
          <Form className="pb-28">
            <div className="mb-6 flex gap-2 md:gap-3 items-center px-2 md:px-0 pt-2 overflow-x-auto whitespace-nowrap hide-scrollbar">
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

            {step === 0 && <BasicInfoStep />}
            {step === 1 && <BookingStep />}
            {step === 2 && <FinishStep />}

            <div className="fixed bottom-[4.5rem] md:bottom-0 left-0 md:left-72 right-0 bg-[var(--bg-tertiary)] border-t border-[var(--bg-grey)] px-4 md:px-8 py-3 md:py-4 flex items-center justify-between z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
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
