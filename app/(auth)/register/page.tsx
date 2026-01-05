"use client";

import Link from "next/link";
import Image from "next/image";
import logo from "../../../public/assets/logos.png";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useActionState, useEffect, useState, useTransition } from "react";
import { AuthForm } from "@/components/auth-form";
import { SubmitButton } from "@/components/submit-button";
import { toast } from "@/components/toast";
import { registerSchema } from "@/lib/validations/auth";
import { validateFormWithYup } from "@/lib/utils";
import { type RegisterActionState, register } from "../actions";

export default function Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirm_password: "",
  });
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [, startTransition] = useTransition();

  const [state, formAction] = useActionState<RegisterActionState, FormData>(
    register,
    {
      status: "idle",
    }
  );

  const { update: updateSession } = useSession();

  useEffect(() => {
    if (state.status === "user_exists") {
      toast({ type: "error", description: "Email already exists, Please try another email!" });
    } else if (state.status === "failed") {
      toast({ type: "error", description: "Failed to create account!" });
    } else if (state.status === "invalid_data") {
      toast({
        type: "error",
        description: "Invalid credentials",
      });
    } else if (state.status === "success") {
      toast({ type: "success", description: "Account created successfully!" });

      setIsSuccessful(true);

      const performNavigation = async () => {
        await updateSession();

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
        router.push("/profile");
        router.refresh();
      };

      performNavigation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, searchParams, router]);

  const handleSubmit = async (submittedFormData: FormData) => {
    const data = {
      name: submittedFormData.get("name") as string,
      email: submittedFormData.get("email") as string,
      password: submittedFormData.get("password") as string,
      confirm_password: submittedFormData.get("confirm_password") as string,
    };

    setFormData(data);

    const { isValid, errors: validationErrors } = await validateFormWithYup(
      registerSchema,
      data
    );

    if (!isValid) {
      setValidationErrors(validationErrors);
      toast({
        type: "error",
        description: "Please fix the validation errors",
      });
      return;
    }

    setValidationErrors({});
    startTransition(() => {
      formAction(submittedFormData);
    });
  };

  return (
    <div className="flex min-h-dvh w-screen items-center justify-center bg-background pt-0">
      <div className="flex w-full max-w-md flex-col gap-12 overflow-hidden rounded-2xl">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <Image src={logo} alt="Logo" width={100} height={100} />
          <h3 className="font-semibold text-xl dark:text-zinc-50">Sign Up</h3>
          <p className="text-gray-500 text-sm dark:text-zinc-400">
            Create an account with your email and password
          </p>
        </div>
        <AuthForm
          action={handleSubmit}
          defaultValues={formData}
          type="register"
          errors={validationErrors}
        >
          <SubmitButton isSuccessful={isSuccessful}>Sign Up</SubmitButton>
          <p className="mt-4 text-center text-gray-600 text-sm dark:text-zinc-400">
            {"Already have an account? "}
            <Link
              className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
              href="/login"
            >
              Sign in
            </Link>
            {" instead."}
          </p>
        </AuthForm>
      </div>
    </div>
  );
}
