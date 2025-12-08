import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Chat } from "@/components/chat";
import { DataStreamHandler } from "@/components/data-stream-handler";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { generateUUID } from "@/lib/utils";
import { auth } from "../(auth)/auth";
import { getChatsByUserId, getUserById } from "@/lib/db/queries";

export default async function Page() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const existingChats = await getChatsByUserId({
    id: session.user.id,
    limit: 1,
    startingAfter: null,
    endingBefore: null,
  });

  if (existingChats.chats.length > 0) {
    redirect(`/chat/${existingChats.chats[0].id}`);
  }

  const freshUser = await getUserById(session.user.id);
  const userWithFreshData = freshUser ? {
    ...session.user,
    ...freshUser,
    type: session.user.type,
    role: session.user.role,
  } : session.user;

  const id = generateUUID();

  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get("chat-model");

  if (!modelIdFromCookie) {
    return (
      <>
        <Chat
          autoResume={false}
          user={userWithFreshData}
          id={id}
          initialChatModel={DEFAULT_CHAT_MODEL}
          initialMessages={[]}
          initialVisibilityType="private"
          isReadonly={false}
          key={id}
        />
        <DataStreamHandler />
      </>
    );
  }

  return (
    <>
      <Chat
        user={userWithFreshData}
        autoResume={false}
        id={id}
        initialChatModel={modelIdFromCookie.value}
        initialMessages={[]}
        initialVisibilityType="private"
        isReadonly={false}
        key={id}
      />
      <DataStreamHandler />
    </>
  );
}
