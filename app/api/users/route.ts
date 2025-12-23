import { auth } from "@/app/(auth)/auth";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { user } from "@/lib/db/schema";
import { asc, count } from "drizzle-orm";

const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export async function GET(request: Request) {
    const session = await auth();

    if (!session || !session.user) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "admin") {
        return Response.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = 10; 
        const offset = (page - 1) * limit;

        const [totalResult] = await db.select({ count: count() }).from(user);
        const total = totalResult.count;

        const users = await db
            .select({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                gender: user.gender,
                birthDay: user.birthDay,
                birthMonth: user.birthMonth,
                birthYear: user.birthYear,
            })
            .from(user)
            .limit(limit)
            .offset(offset);

        const usersWithDetails = users.map(u => {
            let age: number | null = null;
            if (u.birthYear && u.birthMonth && u.birthDay) {
                const today = new Date();
                const birthDate = new Date(u.birthYear, u.birthMonth - 1, u.birthDay);
                age = today.getFullYear() - birthDate.getFullYear();
                const monthDiff = today.getMonth() - birthDate.getMonth();
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                }
            }

            return {
                id: u.id,
                name: u.name || "N/A",
                email: u.email,
                age: age,
                status: u.role === "admin" ? "Admin" : "Active",
            };
        });

        return Response.json({
            users: usersWithDetails,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        return Response.json({ error: "Failed to fetch users" }, { status: 500 });
    }
}
