import Link from "next/link";
import Image from "next/image";
import logo from "../../public/assets/logos.png";
import Form from "next/form";
import { useRouter, useSearchParams } from "next/navigation";
import { useActionState, useEffect, useState, useTransition } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/submit-button";
import { toast } from "@/components/toast";
import { resetPasswordSchema } from "@/lib/validations/auth";
import { type ResetPasswordActionState, resetPassword } from "../../app/(auth)/actions";


export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [isSuccessful, setIsSuccessful] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [state, formAction] = useActionState<
    ResetPasswordActionState,
    FormData
  >(resetPassword, {
    status: "idle",
  });

  useEffect(() => {
    if (!token) {
      toast({
        type: "error",
        description: "Invalid reset link!",
      });
      router.push("/login");
    }
  }, [token, router]);

  useEffect(() => {
    if (state.status === "invalid_token") {
      toast({
        type: "error",
        description: "Invalid or expired reset token!",
      });
    } else if (state.status === "token_expired") {
      toast({
        type: "error",
        description: "Reset link has expired!",
      });
    } else if (state.status === "failed") {
      toast({
        type: "error",
        description: "Failed to reset password!",
      });
    } else if (state.status === "invalid_data") {
      toast({
        type: "error",
        description: "invalid credentials",
      });
    } else if (state.status === "success") {
      toast({
        type: "success",
        description: "Password reset successfully!",
      });
      setIsSuccessful(true);
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    }
  }, [state, router]);

  const handleSubmit = async (formData: FormData) => {
    const data = {
      password: formData.get("password") as string,
      confirm_password: formData.get("confirm_password") as string,
    };

    setPassword(data.password);
    setConfirmPassword(data.confirm_password);

    try {
      await resetPasswordSchema.validate(data, { abortEarly: false });
      setValidationErrors({});
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

  if (!token) {
    return null;
  }

  return (
    <div className="flex min-h-dvh w-screen items-center justify-center bg-background pt-12 md:pt-0">
      <div className="flex w-full max-w-md flex-col gap-12 overflow-hidden rounded-2xl">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <Image src={logo} alt="Logo" width={100} height={100} className="mx-auto mb-4" />
          <h3 className="font-semibold text-xl dark:text-zinc-50">
            Set New Password
          </h3>
          <p className="text-gray-500 text-sm dark:text-zinc-400">
            Enter your new password below
          </p>
        </div>
        <Form action={handleSubmit} className="flex flex-col gap-4 px-4 sm:px-16">
          <input type="hidden" name="token" value={token} />

          <div className="flex flex-col gap-2">
            <Label
              className="font-normal text-zinc-600 dark:text-zinc-400"
              htmlFor="password"
            >
              Password
            </Label>
            <div className="relative">
              <Input
                className={cn(
                  "bg-muted text-md md:text-sm pr-10",
                  validationErrors.password && "border-red-500"
                )}
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                defaultValue={password}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {validationErrors.password && (
              <p className="text-red-500 text-sm">{validationErrors.password}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label
              className="font-normal text-zinc-600 dark:text-zinc-400"
              htmlFor="confirm_password"
            >
              Confirm Password
            </Label>
            <div className="relative">
              <Input
                className={cn(
                  "bg-muted text-md md:text-sm pr-10",
                  validationErrors.confirm_password && "border-red-500"
                )}
                id="confirm_password"
                name="confirm_password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                defaultValue={confirmPassword}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {validationErrors.confirm_password && (
              <p className="text-red-500 text-sm">
                {validationErrors.confirm_password}
              </p>
            )}
          </div>

          <SubmitButton isSuccessful={isSuccessful}>Save Password</SubmitButton>

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
