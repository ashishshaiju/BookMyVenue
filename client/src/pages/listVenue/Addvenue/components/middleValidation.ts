import * as Yup from "yup";

export const middleSchema =
  Yup.object({

    bookingType:
      Yup.string().required( "Select booking type" ),

    /* Fixed Package */
    fixedPackages:
      Yup.array().when(
        "bookingType",
        {
          is: "fixed",
          then: () =>
            Yup.array().of(
              Yup.object({
                slotName:
                  Yup.string().trim().required("Slot name required"),

                startTime:
                  Yup.string().required("Start time required"),

                endTime:
                  Yup.string().required("End time required"),

                price:
                  Yup.number().typeError("Enter valid price").required("Price required").positive("Must be positive"),
              })
            ),
        }
      ),

    /* Flexible Booking */
    workingHours:
      Yup.object().when(
        "bookingType",
        {
          is: "flexible",
          then: () =>
            Yup.object({
              open:
                Yup.string().required( "Open time required" ),

              close:
                Yup.string().required( "Close time required" ),
            }),
        }
      ),

    slotDuration:
      Yup.string().when(
        "bookingType",
        {
          is: "flexible",
          then: (schema) =>
            schema.required( "Select slot duration" ),
        }
      ),

    bufferTime:
      Yup.string().when(
        "bookingType",
        {
          is: "flexible",
          then: (schema) =>
            schema.required( "Select buffer time" ),
        }
      ),
      blockedTimes:
        Yup.array().when(
          "bookingType",
          {
            is: "flexible",

            then: () =>
              Yup.array().of(
                Yup.object({
                  fromTime:
                    Yup.string().when(
                      "toTime",
                      {
                        is: (value: string) =>
                          !!value,

                        then: (schema) => 
                          schema.required( "From time required" ),
                      }
                    ),

                  toTime:
                    Yup.string().when(
                      "fromTime",
                      {
                        is: (value: string) =>
                          !!value,

                        then: (schema) =>
                          schema.required( "To time required" ),
                      }
                    ),
                })
              ),

      otherwise: () =>
        Yup.array(),
    }
  ),
    pricingType:
      Yup.string().when(
        "bookingType",
        {
          is: "flexible",
          then: (schema) =>
            schema.required( "Select pricing type" ),
        }
      ),

    /* Same Price */
    samePrice:
      Yup.string().when(
        "pricingType",
        {
          is: "same",
          then: (schema) =>
            schema.required( "Enter slot price" ),
        }
      ),

    /* Time Based Pricing */
    pricingRules:
      Yup.array().when(
        "pricingType",
        {
          is: "timeBased",
          then: () =>
            Yup.array().of(
              Yup.object({

                fromTime:
                  Yup.string().required( "Required" ),

                toTime:
                  Yup.string().required( "Required" ),

                price:
                  Yup.number().typeError( "Enter valid price" ).required( "Required" ),
              })
            ),
        }
      ),
     

      /* Amenities */
      amenities:
        Yup.array() .min( 1, "Select at least one amenity" ),
  });