import { auth } from "@/app/(auth)/auth";
import { getUserById } from "@/lib/db/queries";
import { redirect } from "next/navigation";
import { ProfileForm } from "../../../components/page/profile-form";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await getUserById(session.user.id);

  if (!user) {
    redirect("/login");
  }

  return (
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 h-full overflow-y-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            Profile
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Manage your account information and preferences
          </p>
        </div>
        <ProfileForm user={user} />
      </div>
  );
}
