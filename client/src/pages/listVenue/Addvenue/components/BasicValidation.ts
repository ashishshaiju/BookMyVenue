import * as Yup from "yup";

export const basicInfoSchema = Yup.object({
  propertyName: Yup.string().required("Property name is required"),

  propertyDescription: Yup.string().required("Description is required").min(20, "Minimum 20 characters"),

  venueType: Yup.string().required("Venue type is required"),

  district: Yup.string().required("District is required"),

  city: Yup.string().required("City / Place is required"),

  pincode: Yup.string().matches(/^[0-9]{6}$/, "Invalid pincode").required("Pincode is required"),

  fullAddress: Yup.string().required("Address is required"),

  googleMapsLink: Yup.string().url("Invalid Google Maps URL").nullable(),

  spaceAttributes: Yup.array().min(1, "Select at least one"),

  seatingConfigurations: Yup.array(),

  maxCapacity: Yup.number().typeError("Must be a number").required("Capacity is required").min(1, "Minimum 1"),
});