import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function Page() {
  return (
    <Suspense fallback={
      <div className="flex h-dvh w-screen items-center justify-center bg-background">
        <div className="text-gray-500 text-sm dark:text-zinc-400">Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}