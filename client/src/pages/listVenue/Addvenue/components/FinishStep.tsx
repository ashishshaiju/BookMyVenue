import { Field , FieldArray, useFormikContext} from "formik";
import { useState } from "react";

type FinishStepValues = {
  cancellationPolicy: string;
  refundType: string;
  refundRules: {
    daysBefore: string;
    refundPercentage: string;
  }[];
};

const FinishStep = () => {
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const { values } =useFormikContext<FinishStepValues>();

  return (
    <section className="font-sans ml-72">
      <div className="max-w-5xl mx-auto">

        <div className="mb-8">
          <h2 className="text-3xl font-bold text-[var(--bg-green)]">
            Final Details
          </h2>

          <p className="text-[var(--text-secondary)] mt-2">
            Upload photos and configure final venue settings.
          </p>
        </div>

        <div className="bg-[var(--bg-tertiary)] rounded-3xl p-8 border border-[var(--bg-grey)] shadow-sm">
            {/* Photos */}
          <div>
            <h3 className="font-semibold text-lg mb-4">
              Venue Photos
            </h3>

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
                  const files =
                    Array.from(
                      e.target.files || []
                    );

                  const imageUrls =
                    files.map((file) =>
                      URL.createObjectURL(file)
                    );

                  setPreviewImages(
                    (prev) => [
                      ...prev,
                      ...imageUrls,
                    ]
                  );
                }}
              />

              <div className="text-center">
                <p className="font-semibold text-[var(--text-primary)]">
                  Click to Upload Images
                </p>

                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  JPG, PNG
                </p>
              </div>
            </label>

            {/* Count */}
            {previewImages.length > 0 && (
              <p className="mt-4 text-sm text-[var(--bg-green)] font-medium">
                {previewImages.length} image(s)
                selected
              </p>
            )}

            {/* Preview Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">

              {previewImages.map(
                (image, index) => (
                  <div
                    key={index}
                    className={`relative rounded-2xl overflow-hidden border-2 ${
                      index === 0
                        ? "border-[var(--bg-green)]"
                        : "border-[var(--bg-grey)]"
                    }`}
                  >
                    <img
                      src={image}
                      alt="preview"
                      className="w-full h-40 object-cover"
                    />

                    {/* Cover Badge */}
                    {index === 0 && (
                      <div className="absolute top-2 left-2 bg-[var(--bg-green)] text-white text-xs px-2 py-1 rounded-lg">
                        Cover
                      </div>
                    )}

                    {/* Remove */}
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewImages(
                          previewImages.filter(
                            (_, i) =>
                              i !== index
                          )
                        )
                      }
                      className="absolute top-2 right-2 bg-white w-8 h-8 rounded-full shadow flex items-center justify-center text-red-500"
                    >
                      ✕
                    </button>
                  </div>
                )
              )}
            </div>
          </div>
          {/* Photos */}

          {/* Contact */}
          <div className="mt-10">
            <h3 className="font-semibold text-lg mb-4">
              Contact Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <div>
                <label className="block mb-2 font-bold">
                  Contact Name
                </label>

                <Field
                  name="contactName"
                  type="text"
                  placeholder="Contact Name"
                  className="w-full rounded-xl border border-[var(--bg-grey)] px-4 py-3"
                />
              </div>

              <div>
                <label className="block mb-2 font-bold">
                  Phone Number
                </label>

                <Field
                  name="contactPhone"
                  type="text"
                  placeholder="Your Phone Number"
                  className="w-full rounded-xl border border-[var(--bg-grey)] px-4 py-3"
                />
              </div>

            </div>
          </div>

          {/* Cancellation Policy */}
          <div className="mt-10">
            <h3 className="font-semibold text-lg mb-4">
              Cancellation Policy
            </h3>

            <div className="flex flex-wrap gap-4">

              <label className="flex items-center gap-2 border border-[var(--bg-grey)] rounded-xl px-4 py-3 cursor-pointer">
                <Field
                  type="radio"
                  name="cancellationPolicy"
                  value="refundable"
                />
                Refundable
              </label>

              <label className="flex items-center gap-2 border border-[var(--bg-grey)] rounded-xl px-4 py-3 cursor-pointer">
                <Field
                  type="radio"
                  name="cancellationPolicy"
                  value="nonRefundable"
                />
                Non Refundable
              </label>

            </div>
          </div>

          {/* Refund Rules */}
          {values.cancellationPolicy === "refundable" && (
            <div className="mt-10">
              <h3 className="font-semibold text-lg mb-4">
                Refund Rules
              </h3>

              <p className="text-[var(--text-secondary)] mb-4">
                Configure refund percentage
                based on cancellation time.
              </p>
              <div className="mb-6">
            <label className="block mb-2 font-bold">
              Refund Type
            </label>

            <div className="flex flex-wrap gap-4">

              <label className="flex items-center gap-2 border border-[var(--bg-grey)] rounded-xl px-4 py-3 cursor-pointer">
                <Field
                  type="radio"
                  name="refundType"
                  value="full"
                />
                Full Refund
              </label>

              <label className="flex items-center gap-2 border border-[var(--bg-grey)] rounded-xl px-4 py-3 cursor-pointer">
                <Field
                  type="radio"
                  name="refundType"
                  value="timeBased"
                />
                Time Based
              </label>

            </div>
          </div>

              {values.refundType === "timeBased" && 
              (<FieldArray name="refundRules">
                {({ push, remove }) => (
                  <div className="space-y-5">

                    {values.refundRules.map(
                      (_, index: number) => (
                        <div
                          key={index}
                          className="border border-[var(--bg-grey)] rounded-2xl p-5"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            <div>
                              <label className="block mb-2 font-bold">
                                Days Before
                              </label>

                              <Field
                                name={`refundRules.${index}.daysBefore`}
                                type="number"
                                placeholder="7"
                                className="w-full rounded-xl border border-[var(--bg-grey)] px-4 py-3"
                              />
                            </div>

                            <div>
                              <label className="block mb-2 font-bold">
                                Refund %
                              </label>

                              <Field
                                name={`refundRules.${index}.refundPercentage`}
                                type="number"
                                placeholder="90"
                                className="w-full rounded-xl border border-[var(--bg-grey)] px-4 py-3"
                              />
                            </div>

                          </div>

                          {index > 0 && (
                            <button
                              type="button"
                              onClick={() =>
                                remove(index)
                              }
                              className="text-red-500 mt-4"
                            >
                              Remove Rule
                            </button>
                          )}
                        </div>
                      )
                    )}
                  
                    <button
                      type="button"
                      onClick={() =>
                        push({
                          daysBefore: "",
                          refundPercentage:
                            "",
                        })
                      }
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