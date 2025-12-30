"use server";

import { updateUserProfile } from "@/lib/db/queries";
import { auth } from "@/app/(auth)/auth";

export type ProfileUpdateStatus =
  | "idle"
  | "in_progress"
  | "success"
  | "failed"
  | "unauthorized";

export interface ProfileUpdateResult {
  status: ProfileUpdateStatus;
}

export async function updateProfile(
  formData: FormData
): Promise<ProfileUpdateResult> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        status: "unauthorized",
      };
    }

    const name = formData.get("name") as string;
    const gender = formData.get("gender") as string;
    const day = formData.get("day") as string;
    const month = formData.get("month") as string;
    const year = formData.get("year") as string;
    const country = formData.get("country") as string;
    const city = formData.get("city") as string;
    const password = formData.get("password") as string;

    await updateUserProfile({
      userId: session.user.id,
      name,
      gender: gender || undefined,
      birthDay: day ? Number(day) : undefined,
      birthMonth: month ? Number(month) : undefined,
      birthYear: year ? Number(year) : undefined,
      country: country || undefined,
      city: city || undefined,
      password: password || undefined,
    });

    return {
      status: "success",
    };
  } catch (error) {
    return {
      status: "failed",
    };
  }
}