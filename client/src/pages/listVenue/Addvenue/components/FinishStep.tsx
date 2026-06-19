import { Field, FieldArray, ErrorMessage, useFormikContext } from 'formik';
import { useState, useEffect } from 'react';
import { useToast } from '../../../../hooks/useToast';

type FinishStepValues = {
  cancellationPolicy: string;
  refundType: string;
  refundRules: {
    daysBefore: string;
    refundPercentage: string;
  }[];
  venuePhotos: File[];
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const err = 'text-red-500 text-sm mt-1';

const FinishStep = () => {
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const { values, setFieldValue } = useFormikContext<FinishStepValues>();
  const { error: showError } = useToast();

  useEffect(() => {
    const urls = values.venuePhotos?.map((file) => URL.createObjectURL(file)) || [];
    setPreviewImages(urls); // eslint-disable-line react-hooks/set-state-in-effect
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [values.venuePhotos]);

  return (
    <section className="font-sans">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-[var(--bg-green)]">Final Details</h2>
          <p className="text-[var(--text-secondary)] mt-2">
            Upload photos and configure final venue settings.
          </p>
        </div>

        <div className="bg-[var(--bg-tertiary)] rounded-3xl p-8 border border-[var(--bg-grey)] shadow-sm space-y-10">
          {/* Photos */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Venue Photos</h3>
            <p className="text-[var(--text-secondary)] mb-4">
              Upload venue images. First image becomes cover photo.
            </p>

            <label className="flex items-center justify-center w-full border-2 border-dashed border-[var(--bg-grey)] rounded-2xl p-8 cursor-pointer hover:border-[var(--bg-green)] transition">
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  const validFiles = files.filter((file) => {
                    if (!ALLOWED_TYPES.includes(file.type)) {
                      showError(
                        `Invalid file type: ${file.name}. Only JPG, PNG and WEBP are allowed.`
                      );
                      return false;
                    }
                    if (file.size > MAX_FILE_SIZE) {
                      showError(`File too large: ${file.name}. Maximum size is 5MB.`);
                      return false;
                    }
                    return true;
                  });
                  if (validFiles.length > 0) {
                    const currentFiles = values.venuePhotos || [];
                    setFieldValue('venuePhotos', [...currentFiles, ...validFiles]);
                  }
                  e.target.value = '';
                }}
              />
              <div className="text-center">
                <p className="font-semibold text-[var(--text-primary)]">Click to Upload Images</p>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  JPG, PNG, WEBP · Max 5MB each
                </p>
              </div>
            </label>

            <ErrorMessage name="venuePhotos" component="p" className={err} />

            {previewImages.length > 0 && (
              <p className="mt-4 text-sm text-[var(--bg-green)] font-medium">
                {previewImages.length} image(s) selected
              </p>
            )}

            {/* Preview Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              {previewImages.map((image, index) => (
                <div
                  key={index}
                  className={`relative rounded-2xl overflow-hidden border-2 ${
                    index === 0 ? 'border-[var(--bg-green)]' : 'border-[var(--bg-grey)]'
                  }`}
                >
                  <img src={image} alt="preview" className="w-full h-40 object-cover" />

                  {index === 0 && (
                    <div className="absolute top-2 left-2 bg-[var(--bg-green)] text-white text-xs px-2 py-1 rounded-lg">
                      Cover
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      const newFiles = [...(values.venuePhotos || [])];
                      newFiles.splice(index, 1);
                      setFieldValue('venuePhotos', newFiles);
                    }}
                    className="absolute top-2 right-2 bg-white w-8 h-8 rounded-full shadow flex items-center justify-center text-red-500"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Contact Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-2 font-bold">Contact Name</label>
                <Field
                  name="contactName"
                  type="text"
                  placeholder="Contact Name"
                  className="w-full rounded-xl border border-[var(--bg-grey)] px-4 py-3 outline-none focus:border-[var(--bg-green)]"
                />
                <ErrorMessage name="contactName" component="p" className={err} />
              </div>
              <div>
                <label className="block mb-2 font-bold">Phone Number</label>
                <Field
                  name="contactPhone"
                  type="text"
                  placeholder="10-digit mobile number"
                  className="w-full rounded-xl border border-[var(--bg-grey)] px-4 py-3 outline-none focus:border-[var(--bg-green)]"
                />
                <ErrorMessage name="contactPhone" component="p" className={err} />
              </div>
            </div>
          </div>

          {/* Cancellation Policy */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Cancellation Policy</h3>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 border border-[var(--bg-grey)] rounded-xl px-4 py-3 cursor-pointer">
                <Field type="radio" name="cancellationPolicy" value="refundable" />
                Refundable
              </label>
              <label className="flex items-center gap-2 border border-[var(--bg-grey)] rounded-xl px-4 py-3 cursor-pointer">
                <Field type="radio" name="cancellationPolicy" value="nonRefundable" />
                Non Refundable
              </label>
            </div>
            <ErrorMessage name="cancellationPolicy" component="p" className={err} />
          </div>

          {/* Refund Rules — only for refundable */}
          {values.cancellationPolicy === 'refundable' && (
            <div>
              <h3 className="font-semibold text-lg mb-4">Refund Rules</h3>
              <p className="text-[var(--text-secondary)] mb-4">
                Configure refund percentage based on cancellation time.
              </p>

              {/* Refund Type */}
              <div className="mb-6">
                <label className="block mb-2 font-bold">Refund Type</label>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 border border-[var(--bg-grey)] rounded-xl px-4 py-3 cursor-pointer">
                    <Field type="radio" name="refundType" value="fullRefund" />
                    Full Refund
                  </label>
                  <label className="flex items-center gap-2 border border-[var(--bg-grey)] rounded-xl px-4 py-3 cursor-pointer">
                    <Field type="radio" name="refundType" value="timeBasedRefund" />
                    Time Based
                  </label>
                </div>
                <ErrorMessage name="refundType" component="p" className={err} />
              </div>

              {/* Refund Rules — only for time based */}
              {values.refundType === 'timeBasedRefund' && (
                <FieldArray name="refundRules">
                  {({ push, remove }) => (
                    <div className="space-y-5">
                      {values.refundRules.map((_, index) => (
                        <div key={index} className="border border-[var(--bg-grey)] rounded-2xl p-5">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block mb-2 font-bold">Days Before</label>
                              <Field
                                name={`refundRules.${index}.daysBefore`}
                                type="number"
                                placeholder="7"
                                className="w-full rounded-xl border border-[var(--bg-grey)] px-4 py-3"
                              />
                              <ErrorMessage
                                name={`refundRules.${index}.daysBefore`}
                                component="p"
                                className={err}
                              />
                            </div>
                            <div>
                              <label className="block mb-2 font-bold">Refund %</label>
                              <Field
                                name={`refundRules.${index}.refundPercentage`}
                                type="number"
                                placeholder="90"
                                className="w-full rounded-xl border border-[var(--bg-grey)] px-4 py-3"
                              />
                              <ErrorMessage
                                name={`refundRules.${index}.refundPercentage`}
                                component="p"
                                className={err}
                              />
                            </div>
                          </div>
                          {index > 0 && (
                            <button
                              type="button"
                              onClick={() => remove(index)}
                              className="text-red-500 mt-4"
                            >
                              Remove Rule
                            </button>
                          )}
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => push({ daysBefore: '', refundPercentage: '' })}
                        className="bg-[var(--bg-green)] text-white px-5 py-3 rounded-xl"
                      >
                        + Add Rule
                      </button>
                    </div>
                  )}
                </FieldArray>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default FinishStep;
