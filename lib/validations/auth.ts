import * as yup from "yup";

export const loginSchema = yup.object().shape({
  email: yup
    .string()
    .email("Please enter a valid email address")
    .required("Required"),
  password: yup
    .string()
    .required("Required"),
});

export const registerSchema = yup.object().shape({
  name: yup
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(30, "Name length should not exceed 30 characters")
    .required("Required"),
  email: yup
    .string()
    .email("Please enter a valid email address")
    .required("Required"),
  password: yup
    .string()
    .min(6, "Password must be 6 characters long")
    .required("Required"),
  confirm_password: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords does not match")
    .required("Please confirm your password"),
});

export const forgotPasswordSchema = yup.object().shape({
  email: yup
    .string()
    .email("Please enter a valid email address")
    .required("Required"),
});

export const resetPasswordSchema = yup.object().shape({
  password: yup
    .string()
    .min(6, "Password must be 6 characters long")
    .required("Required"),
  confirm_password: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords must match")
    .required("Please confirm your password"),
});

export const profileUpdateSchema = yup.object().shape({
  name: yup
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(30, "Name length should not exceed 30 characters")
    .required("Required"),

  gender: yup
    .string()
    .oneOf(["male", "female", "other"], "Required")
    .required("Required"),
  day: yup
    .string()
    .required("Required"),
  month: yup
    .string()
    .required("Required"),
  year: yup
    .string()
    .required("Required"),
  password: yup
    .string()
    .min(6, "Password must be 6 characters long")
    .optional()
    .transform((value) => (value === "" ? undefined : value)),
  confirm_password: yup
    .string()
    .optional()
    .transform((value) => (value === "" ? undefined : value))
    .when("password", {
      is: (password: string) => password && password.length > 0,
      then: (schema) =>
        schema
          .oneOf([yup.ref("password")], "Passwords does not match")
          .required("Please confirm your password"),
    }),
});

export type LoginFormData = yup.InferType<typeof loginSchema>;
export type RegisterFormData = yup.InferType<typeof registerSchema>;
export type ForgotPasswordFormData = yup.InferType<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = yup.InferType<typeof resetPasswordSchema>;
export type ProfileUpdateFormData = yup.InferType<typeof profileUpdateSchema>;
