"use client";

import { memo, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SidebarUserNav } from "./sidebar-user-nav";
import { Session } from "next-auth";
import { ArrowLeft } from "lucide-react";

function PureChatHeader({
  user,
}: {
  user: Session["user"];
}) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const storedCurrent = sessionStorage.getItem("currentPath");
    if (storedCurrent && storedCurrent !== pathname) {
      sessionStorage.setItem("previousPath", storedCurrent);
    }
    sessionStorage.setItem("currentPath", pathname);
  }, [pathname]);

  const showBackButton = pathname === "/profile" || pathname.startsWith("/admin/");

  const handleBack = () => {
    const previousPath = sessionStorage.getItem("previousPath");
    if (previousPath && previousPath.startsWith("/chat/")) {
      router.push("/");
    } else {
      router.back();
    }
  }

  return (
    <header className="w-full bg-[#F5F5F5] flex items-center gap-2 px-2 py-1.5 md:px-2">
      {showBackButton ? (
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-primary-green font-bold hover:cursor-pointer text-[22px] hover:opacity-80 transition-opacity"
          aria-label="Go back"
        >
          <ArrowLeft className="w-6 h-6" />
          <span>Back</span>
        </button>
      ) : (
        <h1 className="text-primary-green font-bold text-[22px]">For Daily Use.</h1>
      )}
      {user && <div className="ml-auto">
        <SidebarUserNav user={user} />
      </div>}
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader);
