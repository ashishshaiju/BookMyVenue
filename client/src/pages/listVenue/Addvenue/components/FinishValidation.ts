import * as Yup from "yup";
export const finishSchema =
  Yup.object({
    contactName:
      Yup.string().trim().required("Contact name is required"),

    contactPhone:
      Yup.string().matches( /^[6-9]\d{9}$/, "Enter valid phone number").required( "Phone number is required"),

    cancellationPolicy:
      Yup.string().required("Select cancellation policy"),

    venuePhotos:
      Yup.mixed().required("Upload at least one image"),

    refundType:
      Yup.string().when( "cancellationPolicy", {is: "refundable",then: (schema) => schema.required("Select refund type"),}),
  });