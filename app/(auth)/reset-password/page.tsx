"use client";

import { Suspense } from "react";
import { ResetPasswordForm } from "../../../components/page/reset-password-form";

export default function Page() {
  return (
    <Suspense fallback={<div className="flex h-dvh w-screen items-center justify-center">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
