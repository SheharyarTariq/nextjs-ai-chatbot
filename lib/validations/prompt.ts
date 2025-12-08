import * as yup from "yup";

export const promptSchema = yup.object().shape({
  name: yup
    .string()
    .trim()
    .min(3, "Name must be at least 3 characters")
    .max(50, "Name length should not exceed 50 characters")
    .required("Required"),
  content: yup
    .string()
    .trim()
    .min(1, "Required")
    .required("Required"),
});

export type PromptFormData = yup.InferType<typeof promptSchema>;
