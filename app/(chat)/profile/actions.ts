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
  user?: {
    name?: string | null;
    gender?: string | null;
    birthDay?: number | null;
    birthMonth?: number | null;
    birthYear?: number | null;
    country?: string | null;
    city?: string | null;
  };
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

    const birthDay = day ? Number(day) : undefined;
    const birthMonth = month ? Number(month) : undefined;
    const birthYear = year ? Number(year) : undefined;

    await updateUserProfile({
      userId: session.user.id,
      name,
      gender: gender || undefined,
      birthDay,
      birthMonth,
      birthYear,
      country: country || undefined,
      city: city || undefined,
      password: password || undefined,
    });

    return {
      status: "success",
      user: {
        name,
        gender: gender || null,
        birthDay,
        birthMonth,
        birthYear,
        country: country || null,
        city: city || null,
      },
    };
  } catch (error) {
    return {
      status: "failed",
    };
  }
}