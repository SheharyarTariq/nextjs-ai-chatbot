"use client";

import Form from "next/form";
import Link from "next/link";
import { cn } from "@/lib/utils";

import { Input } from "./ui/input";
import { Label } from "./ui/label";

export function AuthForm({
  action,
  children,
  defaultEmail = "",
  type,
  errors = {},
}: {
  action: NonNullable<
    string | ((formData: FormData) => void | Promise<void>) | undefined
  >;
  children: React.ReactNode;
  defaultEmail?: string;
  type: "login" | "register";
  errors?: Record<string, string>;
}) {
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
          defaultValue={defaultEmail}
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

        <Input
          className={cn(
            "bg-muted text-md md:text-sm",
            errors.password && "border-red-500"
          )}
          id="password"
          name="password"
          type="password"
        />
        <div className="flex w-full justify-between">
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
        </div>
      </div>

      {type === "register" && (
        <div className="flex flex-col gap-2">
          <Label
            className="font-normal text-zinc-600 dark:text-zinc-400"
            htmlFor="confirm_password"
          >
            Confirm Password
          </Label>

          <Input
            className={cn(
              "bg-muted text-md md:text-sm",
              errors.confirm_password && "border-red-500"
            )}
            id="confirm_password"
            name="confirm_password"
            type="password"
          />
          {errors.confirm_password && (
            <p className="text-red-500 text-sm">{errors.confirm_password}</p>
          )}
        </div>
      )}

      {children}
    </Form>
  );
}
