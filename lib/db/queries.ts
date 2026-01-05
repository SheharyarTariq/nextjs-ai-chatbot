import "server-only";

import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  inArray,
  lt,
  type SQL,
} from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import type { ArtifactKind } from "@/components/artifact";
import type { VisibilityType } from "@/components/visibility-selector";
import { ChatSDKError } from "../errors";
import type { AppUsage } from "../usage";
import {
  type Agenda,
  agenda,
  type Chat,
  chat,
  type DBMessage,
  document,
  type Event,
  type EventType,
  type EventIntensity,
  event,
  message,
  type Suggestion,
  stream,
  suggestion,
  type User,
  user,
  userEvent,
  vote,
} from "./schema";
import { generateHashedPassword } from "./utils";

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
export const db = drizzle(client);

export async function getUser(email: string): Promise<User[]> {
  try {
    return await db.select().from(user).where(eq(user.email, email));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get user by email"
    );
  }
}

export async function createUser(
  email: string,
  password: string,
  name: string,
  role?: "admin" | "user"
) {
  const hashedPassword = generateHashedPassword(password);

  try {
    return await db
      .insert(user)
      .values({ email, password: hashedPassword, name, role: role || "user" });
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to create user");
  }
}

export async function updateUserResetToken(
  email: string,
  resetToken: string,
  resetTokenExpiry: Date
) {
  try {
    return await db
      .update(user)
      .set({ resetToken, resetTokenExpiry })
      .where(eq(user.email, email));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to update user reset token"
    );
  }
}

export async function getUserByResetToken(resetToken: string): Promise<User[]> {
  try {
    return await db
      .select()
      .from(user)
      .where(eq(user.resetToken, resetToken));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get user by reset token"
    );
  }
}

export async function updateUserPassword(userId: string, password: string) {
  const hashedPassword = generateHashedPassword(password);

  try {
    return await db
      .update(user)
      .set({
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      })
      .where(eq(user.id, userId));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to update user password"
    );
  }
}

export async function getUserById(userId: string): Promise<User | null> {
  try {
    const [selectedUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, userId));
    return selectedUser || null;
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to get user by id");
  }
}

export async function updateUserProfile({
  userId,
  name,
  gender,
  birthDay,
  birthMonth,
  birthYear,
  country,
  city,
  password,
}: {
  userId: string;
  name?: string;
  gender?: string;
  birthDay?: number;
  birthMonth?: number;
  birthYear?: number;
  country?: string;
  city?: string;
  password?: string;
}) {
  try {
    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (gender !== undefined) updateData.gender = gender;
    if (birthDay !== undefined) updateData.birthDay = birthDay;
    if (birthMonth !== undefined) updateData.birthMonth = birthMonth;
    if (birthYear !== undefined) updateData.birthYear = birthYear;
    if (country !== undefined) updateData.country = country;
    if (city !== undefined) updateData.city = city;
    if (password) {
      updateData.password = generateHashedPassword(password);
    }

    return await db
      .update(user)
      .set(updateData)
      .where(eq(user.id, userId))
      .returning();
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to update user profile"
    );
  }
}

export async function updateUserRole(userId: string, role: "admin" | "user") {
  try {
    return await db
      .update(user)
      .set({ role })
      .where(eq(user.id, userId));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to update user role"
    );
  }
}

export async function saveChat({
  id,
  userId,
  title,
  visibility,
}: {
  id: string;
  userId: string;
  title: string;
  visibility: VisibilityType;
}) {
  try {
    return await db.insert(chat).values({
      id,
      createdAt: new Date(),
      userId,
      title,
      visibility,
    });
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to save chat");
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    await db.delete(vote).where(eq(vote.chatId, id));
    await db.delete(message).where(eq(message.chatId, id));
    await db.delete(stream).where(eq(stream.chatId, id));

    const [chatsDeleted] = await db
      .delete(chat)
      .where(eq(chat.id, id))
      .returning();
    return chatsDeleted;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete chat by id"
    );
  }
}

export async function deleteAllChatsByUserId({ userId }: { userId: string }) {
  try {
    const userChats = await db
      .select({ id: chat.id })
      .from(chat)
      .where(eq(chat.userId, userId));

    if (userChats.length === 0) {
      return { deletedCount: 0 };
    }

    const chatIds = userChats.map(c => c.id);

    await db.delete(vote).where(inArray(vote.chatId, chatIds));
    await db.delete(message).where(inArray(message.chatId, chatIds));
    await db.delete(stream).where(inArray(stream.chatId, chatIds));

    const deletedChats = await db
      .delete(chat)
      .where(eq(chat.userId, userId))
      .returning();

    return { deletedCount: deletedChats.length };
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete all chats by user id"
    );
  }
}

export async function getChatsByUserId({
  id,
  limit,
  startingAfter,
  endingBefore,
}: {
  id: string;
  limit: number;
  startingAfter: string | null;
  endingBefore: string | null;
}) {
  try {
    const extendedLimit = limit + 1;

    const query = (whereCondition?: SQL<any>) =>
      db
        .select()
        .from(chat)
        .where(
          whereCondition
            ? and(whereCondition, eq(chat.userId, id))
            : eq(chat.userId, id)
        )
        .orderBy(desc(chat.createdAt))
        .limit(extendedLimit);

    let filteredChats: Chat[] = [];

    if (startingAfter) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, startingAfter))
        .limit(1);

      if (!selectedChat) {
        throw new ChatSDKError(
          "not_found:database",
          `Chat with id ${startingAfter} not found`
        );
      }

      filteredChats = await query(gt(chat.createdAt, selectedChat.createdAt));
    } else if (endingBefore) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, endingBefore))
        .limit(1);

      if (!selectedChat) {
        throw new ChatSDKError(
          "not_found:database",
          `Chat with id ${endingBefore} not found`
        );
      }

      filteredChats = await query(lt(chat.createdAt, selectedChat.createdAt));
    } else {
      filteredChats = await query();
    }

    const hasMore = filteredChats.length > limit;

    return {
      chats: hasMore ? filteredChats.slice(0, limit) : filteredChats,
      hasMore,
    };
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get chats by user id"
    );
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    if (!selectedChat) {
      return null;
    }

    return selectedChat;
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to get chat by id");
  }
}

export async function saveMessages({ messages }: { messages: DBMessage[] }) {
  try {
    return await db.insert(message).values(messages);
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to save messages");
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get messages by chat id"
    );
  }
}

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: "up" | "down";
}) {
  try {
    const [existingVote] = await db
      .select()
      .from(vote)
      .where(and(eq(vote.messageId, messageId)));

    if (existingVote) {
      return await db
        .update(vote)
        .set({ isUpvoted: type === "up" })
        .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)));
    }
    return await db.insert(vote).values({
      chatId,
      messageId,
      isUpvoted: type === "up",
    });
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to vote message");
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    return await db.select().from(vote).where(eq(vote.chatId, id));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get votes by chat id"
    );
  }
}

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
}) {
  try {
    return await db
      .insert(document)
      .values({
        id,
        title,
        kind,
        content,
        userId,
        createdAt: new Date(),
      })
      .returning();
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to save document");
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    const documents = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(asc(document.createdAt));

    return documents;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get documents by id"
    );
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const [selectedDocument] = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt));

    return selectedDocument;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get document by id"
    );
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    await db
      .delete(suggestion)
      .where(
        and(
          eq(suggestion.documentId, id),
          gt(suggestion.documentCreatedAt, timestamp)
        )
      );

    return await db
      .delete(document)
      .where(and(eq(document.id, id), gt(document.createdAt, timestamp)))
      .returning();
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete documents by id after timestamp"
    );
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Suggestion[];
}) {
  try {
    return await db.insert(suggestion).values(suggestions);
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to save suggestions"
    );
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    return await db
      .select()
      .from(suggestion)
      .where(eq(suggestion.documentId, documentId));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get suggestions by document id"
    );
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    return await db.select().from(message).where(eq(message.id, id));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get message by id"
    );
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    const messagesToDelete = await db
      .select({ id: message.id })
      .from(message)
      .where(
        and(eq(message.chatId, chatId), gte(message.createdAt, timestamp))
      );

    const messageIds = messagesToDelete.map(
      (currentMessage) => currentMessage.id
    );

    if (messageIds.length > 0) {
      await db
        .delete(vote)
        .where(
          and(eq(vote.chatId, chatId), inArray(vote.messageId, messageIds))
        );

      return await db
        .delete(message)
        .where(
          and(eq(message.chatId, chatId), inArray(message.id, messageIds))
        );
    }
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete messages by chat id after timestamp"
    );
  }
}

export async function updateChatVisibilityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: "private" | "public";
}) {
  try {
    return await db.update(chat).set({ visibility }).where(eq(chat.id, chatId));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to update chat visibility by id"
    );
  }
}

export async function updateChatLastContextById({
  chatId,
  context,
}: {
  chatId: string;
  // Store merged server-enriched usage object
  context: AppUsage;
}) {
  try {
    return await db
      .update(chat)
      .set({ lastContext: context })
      .where(eq(chat.id, chatId));
  } catch (error) {
    console.warn("Failed to update lastContext for chat", chatId, error);
    return;
  }
}

export async function getMessageCountByUserId({
  id,
  differenceInHours,
}: {
  id: string;
  differenceInHours: number;
}) {
  try {
    const twentyFourHoursAgo = new Date(
      Date.now() - differenceInHours * 60 * 60 * 1000
    );

    const [stats] = await db
      .select({ count: count(message.id) })
      .from(message)
      .innerJoin(chat, eq(message.chatId, chat.id))
      .where(
        and(
          eq(chat.userId, id),
          gte(message.createdAt, twentyFourHoursAgo),
          eq(message.role, "user")
        )
      )
      .execute();

    return stats?.count ?? 0;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get message count by user id"
    );
  }
}

export async function createStreamId({
  streamId,
  chatId,
}: {
  streamId: string;
  chatId: string;
}) {
  try {
    await db
      .insert(stream)
      .values({ id: streamId, chatId, createdAt: new Date() });
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to create stream id"
    );
  }
}

export async function getStreamIdsByChatId({ chatId }: { chatId: string }) {
  try {
    const streamIds = await db
      .select({ id: stream.id })
      .from(stream)
      .where(eq(stream.chatId, chatId))
      .orderBy(asc(stream.createdAt))
      .execute();

    return streamIds.map(({ id }) => id);
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get stream ids by chat id"
    );
  }
}

export async function saveAgenda({
  userId,
  chatId,
  goal,
  startDate,
  currentWeek,
  totalWeeks,
  trainingFrequency,
  injuries,
  workType,
  userData,
  weeklyData,
}: {
  userId: string;
  chatId: string;
  goal: string;
  startDate: Date;
  currentWeek?: number;
  totalWeeks?: number;
  trainingFrequency?: number;
  injuries?: string;
  workType?: string;
  userData?: {
    name?: string;
    gender?: string;
    age?: number;
    weight?: number;
    height?: number;
    heartRateZones?: any;
  };
  weeklyData?: Array<{
    weekNumber: number;
    sessions: Array<{
      day: string;
      date: string;
      completed: boolean;
      rating?: number;
      meals?: number;
      sleep?: number;
      energy?: number;
      notes?: string;
      currentDayNumber?: number;
      totalTrainingDays?: number;
      exerciseDetails?: string;
      mealDetails?: string;
      sleepDetails?: string;
    }>;
  }>;
}) {
  try {
    const now = new Date();
    return await db
      .insert(agenda)
      .values({
        userId,
        chatId,
        goal,
        startDate,
        currentWeek: currentWeek ?? 1,
        totalWeeks: totalWeeks ?? 12,
        trainingFrequency,
        injuries,
        workType,
        userData,
        weeklyData: weeklyData ?? [],
        createdAt: now,
        updatedAt: now,
      })
      .returning();
  } catch (error: any) {
    console.error("Database error saving agenda:", error);
    throw new ChatSDKError("bad_request:database", `Failed to save agenda: ${error.message}`);
  }
}

export async function getAgendaByUserId({ userId }: { userId: string }) {
  try {
    const [userAgenda] = await db
      .select()
      .from(agenda)
      .where(eq(agenda.userId, userId))
      .orderBy(desc(agenda.createdAt))
      .limit(1);
    return userAgenda || null;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get agenda by user id"
    );
  }
}

export async function getAgendaByChatId({ chatId }: { chatId: string }) {
  try {
    const [chatAgenda] = await db
      .select()
      .from(agenda)
      .where(eq(agenda.chatId, chatId))
      .orderBy(desc(agenda.createdAt))
      .limit(1);
    return chatAgenda || null;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get agenda by chat id"
    );
  }
}

export async function updateAgenda({
  userId,
  currentWeek,
  weeklyData,
  userData,
  mergeWeeklyData = true,
}: {
  userId: string;
  currentWeek?: number;
  weeklyData?: Array<{
    weekNumber: number;
    sessions: Array<{
      day: string;
      date: string;
      completed: boolean;
      rating?: number;
      meals?: number;
      sleep?: number;
      energy?: number;
      notes?: string;
      currentDayNumber?: number;
      totalTrainingDays?: number;
      exerciseDetails?: string;
      mealDetails?: string;
      sleepDetails?: string;
    }>;
  }>;
  userData?: {
    name?: string;
    gender?: string;
    age?: number;
    weight?: number;
    height?: number;
    heartRateZones?: any;
  };
  mergeWeeklyData?: boolean;
}) {
  try {
    const updateData: any = { updatedAt: new Date() };
    if (currentWeek !== undefined) updateData.currentWeek = currentWeek;

    if (weeklyData !== undefined) {
      if (mergeWeeklyData) {
        const existingAgenda = await getAgendaByUserId({ userId });

        if (existingAgenda && existingAgenda.weeklyData) {
          const mergedWeeklyData = JSON.parse(JSON.stringify(existingAgenda.weeklyData));

          for (const providedWeek of weeklyData) {
            const existingWeekIndex = mergedWeeklyData.findIndex(
              (week: any) => week.weekNumber === providedWeek.weekNumber
            );

            if (existingWeekIndex !== -1) {
              for (const providedSession of providedWeek.sessions) {
                const existingSessionIndex = mergedWeeklyData[existingWeekIndex].sessions.findIndex(
                  (session: any) => {
                    // Match by date first if both have dates
                    if (providedSession.date && session.date) {
                      return session.date === providedSession.date;
                    }
                    // Fall back to day matching
                    return session.day === providedSession.day;
                  }
                );

                if (existingSessionIndex !== -1) {
                  mergedWeeklyData[existingWeekIndex].sessions[existingSessionIndex] = {
                    ...mergedWeeklyData[existingWeekIndex].sessions[existingSessionIndex],
                    ...providedSession,
                  };
                } else {
                  mergedWeeklyData[existingWeekIndex].sessions.push(providedSession);
                }
              }

              mergedWeeklyData[existingWeekIndex].sessions.sort((a: any, b: any) => {
                const dateA = new Date(a.date).getTime();
                const dateB = new Date(b.date).getTime();
                return dateA - dateB;
              });
            } else {
              providedWeek.sessions.sort((a: any, b: any) => {
                const dateA = new Date(a.date).getTime();
                const dateB = new Date(b.date).getTime();
                return dateA - dateB;
              });
              mergedWeeklyData.push(providedWeek);
            }
          }

          mergedWeeklyData.sort((a: any, b: any) => a.weekNumber - b.weekNumber);

          updateData.weeklyData = mergedWeeklyData;
        } else {
          updateData.weeklyData = weeklyData;
        }
      } else {
        updateData.weeklyData = weeklyData;
      }
    }

    if (userData !== undefined) updateData.userData = userData;

    return await db
      .update(agenda)
      .set(updateData)
      .where(eq(agenda.userId, userId))
      .returning();
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to update agenda");
  }
}

export async function deleteAgendaByUserId({ userId }: { userId: string }) {
  try {
    const [deletedAgenda] = await db
      .delete(agenda)
      .where(eq(agenda.userId, userId))
      .returning();
    return deletedAgenda;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete agenda by user id"
    );
  }
}

export async function deleteAgendaAndChatByUserId({ userId }: { userId: string }) {
  try {
    const userAgenda = await getAgendaByUserId({ userId });

    if (!userAgenda) {
      return {
        success: false,
        error: "No agenda found to delete",
      };
    }

    const chatId = userAgenda.chatId;

    await db.delete(agenda).where(eq(agenda.userId, userId));

    if (chatId) {
      await db.delete(vote).where(eq(vote.chatId, chatId));
      await db.delete(message).where(eq(message.chatId, chatId));
      await db.delete(stream).where(eq(stream.chatId, chatId));
      await db.delete(chat).where(eq(chat.id, chatId));
    }

    return {
      success: true,
      deletedAgendaId: userAgenda.id,
      deletedChatId: chatId,
    };
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete agenda and chat by user id"
    );
  }
}

export async function createEvent({
  userId,
  title,
  location,
  locationLat,
  locationLng,
  city,
  date,
  time,
  duration,
  type,
  intensity,
  host,
}: {
  userId: string;
  title: string;
  location: string;
  locationLat: string;
  locationLng: string;
  city: string;
  date: string;
  time: string;
  duration: number;
  type: EventType;
  intensity: EventIntensity;
  host: string;
}) {
  try {
    const now = new Date();

    return await db
      .insert(event)
      .values({
        userId,
        title,
        location,
        locationLat,
        locationLng,
        city,
        date,
        time,
        duration,
        type,
        intensity,
        host,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to create event");
  }
}

export async function getAllEvents() {
  try {
    return await db
      .select()
      .from(event)
      .orderBy(desc(event.date));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get all events"
    );
  }
}

export async function getEventsByUserId({ userId }: { userId: string }) {
  try {
    return await db
      .select()
      .from(event)
      .where(eq(event.userId, userId))
      .orderBy(desc(event.date));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get events by user id"
    );
  }
}

export async function getEventById({ id }: { id: string }) {
  try {
    const [selectedEvent] = await db
      .select()
      .from(event)
      .where(eq(event.id, id));
    return selectedEvent || null;
  } catch (_error: any) {
    console.error("Database error in getEventById:", _error);
    throw _error;
  }
}

export async function updateEvent({
  id,
  title,
  location,
  locationLat,
  locationLng,
  city,
  date,
  time,
  duration,
  type,
  intensity,
}: {
  id: string;
  title: string;
  location: string;
  locationLat: string;
  locationLng: string;
  city: string;
  date: string;
  time: string;
  duration: number;
  type: EventType;
  intensity: EventIntensity;
}) {
  try {
    return await db
      .update(event)
      .set({
        title,
        location,
        locationLat,
        locationLng,
        city,
        date,
        time,
        duration,
        type,
        intensity,
        updatedAt: new Date(),
      })
      .where(eq(event.id, id))
      .returning();
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to update event");
  }
}

export async function deleteEvent({ id }: { id: string }) {
  try {
    const [deletedEvent] = await db
      .delete(event)
      .where(eq(event.id, id))
      .returning();
    return deletedEvent;
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to delete event");
  }
}

export async function isUserJoinedToEvent({
  userId,
  eventId,
}: {
  userId: string;
  eventId: string;
}) {
  try {
    const [existingJoin] = await db
      .select()
      .from(userEvent)
      .where(and(eq(userEvent.userId, userId), eq(userEvent.eventId, eventId)))
      .limit(1);
    return !!existingJoin;
  } catch (_error: any) {
    console.error("Database error in isUserJoinedToEvent:", _error);
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to check if user joined event"
    );
  }
}

export async function getUserJoinedEventsByDateRange({
  userId,
  startDate,
  endDate,
}: {
  userId: string;
  startDate: string;
  endDate: string;
}) {
  try {
    const joinedEvents = await db
      .select({
        id: event.id,
        title: event.title,
        date: event.date,
        time: event.time,
        duration: event.duration,
        type: event.type,
        intensity: event.intensity,
        location: event.location,
      })
      .from(userEvent)
      .innerJoin(event, eq(userEvent.eventId, event.id))
      .where(
        and(
          eq(userEvent.userId, userId),
          gte(event.date, startDate),
          lt(event.date, endDate)
        )
      )
      .orderBy(asc(event.date));

    return joinedEvents;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get user joined events by date range"
    );
  }
}

