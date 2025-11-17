"use client";

import { useState } from "react";
import Form from "next/form";
import Link from "next/link";
import { cn } from "@/lib/utils";

import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Eye, EyeOff } from "lucide-react";

export function AuthForm({
  action,
  children,
  defaultEmail = "",
  defaultValues,
  type,
  errors = {},
}: {
  action: NonNullable<
    string | ((formData: FormData) => void | Promise<void>) | undefined
  >;
  children: React.ReactNode;
  defaultEmail?: string;
  defaultValues?: {
    name?: string;
    email?: string;
    password?: string;
    confirm_password?: string;
  };
  type: "login" | "register";
  errors?: Record<string, string>;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <Form action={action} className="flex flex-col gap-4 px-4 sm:px-16">
      {type === "register" && (
        <div className="flex flex-col gap-2">
          <Label
            className="font-normal text-zinc-600 dark:text-zinc-400"
            htmlFor="name"
          >
            Name
          </Label>

          <Input
            className={cn(
              "bg-muted text-md md:text-sm",
              errors.name && "border-red-500"
            )}
            defaultValue={defaultValues?.name}
            id="name"
            name="name"
            placeholder="John Doe"
            type="text"
          />
          {errors.name && (
            <p className="text-red-500 text-sm">{errors.name}</p>
          )}
        </div>
      )}
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
            errors.email && "border-red-500"
          )}
          defaultValue={defaultValues?.email || defaultEmail}
          id="email"
          name="email"
          placeholder="user@acme.com"
          type="email"
        />
        {errors.email && (
          <p className="text-red-500 text-sm">{errors.email}</p>
        )}
      </div>

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
              errors.password && "border-red-500"
            )}
            defaultValue={defaultValues?.password}
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        <span className="flex w-full justify-between">
          {errors.password && (
            <p className="text-red-500 text-sm whitespace-nowrap">{errors.password}</p>
          )}
          {type === "login" && (
            <span className="flex w-full justify-end gap-2">
              <Link
                href="/forgot-password"
                className="font-normal text-sm text-zinc-600 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                Forgot password?
              </Link>
            </span>
          )}
        </span>
      </div>

      {type === "register" && (
        <div className="flex flex-col -mt-1 gap-2">
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
                errors.confirm_password && "border-red-500"
              )}
              defaultValue={defaultValues?.confirm_password}
              id="confirm_password"
              name="confirm_password"
              type={showConfirmPassword ? "text" : "password"}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.confirm_password && (
            <p className="text-red-500 text-sm">{errors.confirm_password}</p>
          )}
        </div>
      )}

      {children}
    </Form>
  );
}
