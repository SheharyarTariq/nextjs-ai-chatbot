"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useActionState, useEffect, useState, useTransition } from "react";

import { AuthForm } from "@/components/auth-form";
import { SubmitButton } from "@/components/submit-button";
import { toast } from "@/components/toast";
import { loginSchema } from "@/lib/validations/auth";
import { type LoginActionState, login } from "../../app/(auth)/actions";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [, startTransition] = useTransition();

  const [state, formAction] = useActionState<LoginActionState, FormData>(login, {
    status: "idle",
  });

  useEffect(() => {
    if (state.status === "failed") {
      toast({
        type: "error",
        description: "Invalid credentials!",
      });
    } else if (state.status === "invalid_data") {
      toast({
        type: "error",
        description: "Invalid credentials",
      });
    } else if (state.status === "success") {
      toast({
        type: "success",
        description: "Login Successful",
      });
      setIsSuccessful(true);

      const isProfileIncomplete = !state.user?.gender ||
                                   !state.user?.birthDay ||
                                   !state.user?.birthMonth ||
                                   !state.user?.birthYear;

      if (isProfileIncomplete) {
        router.push("/profile");
        router.refresh();
        return;
      }

      const redirectUrl = searchParams.get("redirectUrl");
      if (redirectUrl) {
        try {
          const decodedUrl = decodeURIComponent(redirectUrl);
          const url = new URL(decodedUrl, window.location.origin);
          router.push(url.pathname + url.search + url.hash);
          router.refresh();
          return;
        } catch (_error) {
        }
      }
      router.push("/");
      router.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, searchParams, state.status]);

  const handleSubmit = async (submittedFormData: FormData) => {
    const data = {
      email: submittedFormData.get("email") as string,
      password: submittedFormData.get("password") as string,
    };

    setFormData(data);

    try {
      await loginSchema.validate(data, { abortEarly: false });
      setValidationErrors({});
      startTransition(() => {
        formAction(submittedFormData);
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
          <h3 className="font-semibold text-xl dark:text-zinc-50">Sign In</h3>
          <p className="text-gray-500 text-sm dark:text-zinc-400">
            Use your email and password to sign in
          </p>
        </div>
        <AuthForm
          action={handleSubmit}
          defaultValues={formData}
          type="login"
          errors={validationErrors}
        >
          <SubmitButton isSuccessful={isSuccessful}>Sign in</SubmitButton>
          <p className="mt-4 text-center text-gray-600 text-sm dark:text-zinc-400">
            {"Don't have an account? "}
            <Link
              className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
              href="/register"
            >
              Sign up
            </Link>
            {" for free."}
          </p>
        </AuthForm>
      </div>
    </div>
  );
}