"use server";

import { nanoid } from "nanoid";
import { z } from "zod";

import {
  createUser,
  getUser,
  getUserByResetToken,
  updateUserPassword,
  updateUserResetToken,
} from "@/lib/db/queries";
import { sendPasswordResetEmail } from "@/lib/email";

import { signIn } from "./auth";

const loginFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerFormSchema = z
  .object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    confirm_password: z.string().min(6),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
  });

export type LoginActionState = {
  status: "idle" | "in_progress" | "success" | "failed" | "invalid_data";
  user?: {
    gender?: string | null;
    birthDay?: number | null;
    birthMonth?: number | null;
    birthYear?: number | null;
  };
};

export const login = async (
  _: LoginActionState,
  formData: FormData
): Promise<LoginActionState> => {
  try {
    const validatedData = loginFormSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    const result = await signIn("credentials", {
      email: validatedData.email,
      password: validatedData.password,
      redirect: false,
    });

    if (result?.error || result?.ok === false) {
      return { status: "failed" };
    }

    const [user] = await getUser(validatedData.email);

    return {
      status: "success",
      user: {
        gender: user?.gender,
        birthDay: user?.birthDay,
        birthMonth: user?.birthMonth,
        birthYear: user?.birthYear,
      }
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: "invalid_data" };
    }

    return { status: "failed" };
  }
};

export type RegisterActionState = {
  status:
    | "idle"
    | "in_progress"
    | "success"
    | "failed"
    | "user_exists"
    | "invalid_data";
};

export const register = async (
  _: RegisterActionState,
  formData: FormData
): Promise<RegisterActionState> => {
  try {
    const validatedData = registerFormSchema.parse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      confirm_password: formData.get("confirm_password"),
    });

    const [user] = await getUser(validatedData.email);

    if (user) {
      return { status: "user_exists" } as RegisterActionState;
    }
    
    const adminEmail = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL;
    const role = validatedData.email === adminEmail ? "admin" : "user";
    
    await createUser(
      validatedData.email,
      validatedData.password,
      validatedData.name,
      role
    );
    await signIn("credentials", {
      email: validatedData.email,
      password: validatedData.password,
      redirect: false,
    });

    return { status: "success" };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: "invalid_data" };
    }

    return { status: "failed" };
  }
};

const forgotPasswordFormSchema = z.object({
  email: z.string().email(),
});

export type ForgotPasswordActionState = {
  status:
    | "idle"
    | "in_progress"
    | "success"
    | "failed"
    | "user_not_found"
    | "invalid_data";
};

export const forgotPassword = async (
  _: ForgotPasswordActionState,
  formData: FormData
): Promise<ForgotPasswordActionState> => {
  try {
    const validatedData = forgotPasswordFormSchema.parse({
      email: formData.get("email"),
    });

    const [user] = await getUser(validatedData.email);

    if (!user) {
      return { status: "user_not_found" };
    }

    const resetToken = nanoid(32);
    const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); 

    await updateUserResetToken(
      validatedData.email,
      resetToken,
      resetTokenExpiry
    );

    const emailResult = await sendPasswordResetEmail(
      validatedData.email,
      resetToken,
      user.name || "User"
    );

    if (!emailResult.success) {
      return { status: "failed" };
    }

    return { status: "success" };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: "invalid_data" };
    }

    return { status: "failed" };
  }
};

const resetPasswordFormSchema = z
  .object({
    token: z.string(),
    password: z.string().min(6),
    confirm_password: z.string().min(6),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
  });

export type ResetPasswordActionState = {
  status:
    | "idle"
    | "in_progress"
    | "success"
    | "failed"
    | "invalid_token"
    | "token_expired"
    | "invalid_data";
};

export const resetPassword = async (
  _: ResetPasswordActionState,
  formData: FormData
): Promise<ResetPasswordActionState> => {
  try {
    const validatedData = resetPasswordFormSchema.parse({
      token: formData.get("token"),
      password: formData.get("password"),
      confirm_password: formData.get("confirm_password"),
    });

    const [user] = await getUserByResetToken(validatedData.token);

    if (!user) {
      return { status: "invalid_token" };
    }

    if (user.resetTokenExpiry && user.resetTokenExpiry < new Date()) {
      return { status: "token_expired" };
    }

    await updateUserPassword(user.id, validatedData.password);

    return { status: "success" };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: "invalid_data" };
    }

    return { status: "failed" };
  }
};
