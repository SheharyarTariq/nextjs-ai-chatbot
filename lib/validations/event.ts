import * as yup from "yup";

export const eventSchema = yup.object().shape({
  title: yup.string()
    .required("Required")
    .max(50, "Title must be 50 characters or less"),
  location: yup.string().required("Required"),
  locationLat: yup.string().required("Required"),
  locationLng: yup.string().required("Required"),
  city: yup.string().required("Please pin location on the map"),
  date: yup.string().required("Required"),
  time: yup.string().required("Required"),
  duration: yup.string().required("Required"),
  type: yup.string().required("Required"),
  intensity: yup.string().required("Required"),
});

export type EventFormData = yup.InferType<typeof eventSchema>;
