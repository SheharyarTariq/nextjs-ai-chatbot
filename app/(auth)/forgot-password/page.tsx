"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState, useTransition } from "react";
import Form from "next/form";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/submit-button";
import { toast } from "@/components/toast";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import {
  type ForgotPasswordActionState,
  forgotPassword,
} from "../actions";

export default function Page() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [isPending, startTransition] = useTransition();

  const [state, formAction] = useActionState<
    ForgotPasswordActionState,
    FormData
  >(forgotPassword, {
    status: "idle",
  });

  const handleStateChange = (status: ForgotPasswordActionState["status"]) => {

    switch (status) {
      case "user_not_found":
        toast({
          type: "error",
          description: "No account found with this email address!",
        });
        break;
      case "failed":
        toast({
          type: "error",
          description: "Failed to send reset email!",
        });
        break;
      case "invalid_data":
        toast({
          type: "error",
          description: "Invalid credentials",
        });
        break;
      case "success":
        toast({
          type: "success",
          description: "Password reset link sent to your email!",
        });
        setIsSuccessful(false);
        break;
    }
  };

  useEffect(() => {
    handleStateChange(state.status);
  }, [state.status]);

  const handleSubmit = async (formData: FormData) => {
    const data = {
      email: formData.get("email") as string,
    };

    try {
      await forgotPasswordSchema.validate(data, { abortEarly: false });
      setValidationErrors({});
      setEmail(data.email);
      startTransition(() => {
        formAction(formData);
      });
    } catch (error: any) {
      const errors: Record<string, string> = {};
      error.inner?.forEach((err: any) => {
        if (err.path) {
          errors[err.path] = err.message;
        }
      });
      setValidationErrors(errors);
      toast({
        type: "error",
        description: "Please fix the validation errors",
      });
    }
  };

  return (
    <div className="flex h-dvh w-screen items-start justify-center bg-background pt-12 md:items-center md:pt-0">
      <div className="flex w-full max-w-md flex-col gap-12 overflow-hidden rounded-2xl">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="font-semibold text-xl dark:text-zinc-50">
            Forgot Password
          </h3>
          <p className="text-gray-500 text-sm dark:text-zinc-400">
            Enter your email address and we'll send you a link to reset your
            password
          </p>
        </div>
        <Form action={handleSubmit} className="flex flex-col gap-4 px-4 sm:px-16">
          <div className="flex flex-col gap-2">
            <Label
              className="font-normal text-zinc-600 dark:text-zinc-400"
              htmlFor="email"
            >
              Email Address
            </Label>
            <Input
              autoComplete="email"
              autoFocus
              className={cn(
                "bg-muted text-md md:text-sm",
                validationErrors.email && "border-red-500"
              )}
              defaultValue={email}
              id="email"
              name="email"
              placeholder="user@acme.com"
              type="email"
            />
            {validationErrors.email && (
              <p className="text-red-500 text-sm">{validationErrors.email}</p>
            )}
          </div>

          <SubmitButton isSuccessful={isSuccessful}>Send Link</SubmitButton>

          <p className="mt-4 text-center text-gray-600 text-sm dark:text-zinc-400">
            {"Remember your password? "}
            <Link
              className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
              href="/login"
            >
              Sign in
            </Link>
            {" instead."}
          </p>
        </Form>
      </div>
    </div>
  );
}
