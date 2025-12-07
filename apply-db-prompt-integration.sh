#!/bin/bash
# Apply this script to update chat API to fetch prompts from database
# Usage: ./apply-db-prompt-integration.sh

echo "🔧 Applying database prompt integration..."

# Backup original file
cp "app/(chat)/api/chat/route.ts" "app/(chat)/api/chat/route.ts.backup"

# Apply the patch
cat > /tmp/prompt-integration.patch << 'EOF'
--- a/app/(chat)/api/chat/route.ts
+++ b/app/(chat)/api/chat/route.ts
@@ -20,7 +20,7 @@ import { auth, type UserType } from "@/app/(auth)/auth";
 import type { VisibilityType } from "@/components/visibility-selector";
 import { entitlementsByUserType } from "@/lib/ai/entitlements";
 import type { ChatModel } from "@/lib/ai/models";
-import { type RequestHints, type UserProfile, systemPrompt } from "@/lib/ai/prompts";
+import { type RequestHints, type UserProfile, systemPrompt, regularPrompt, artifactsPrompt, getRequestPromptFromHints, getUserProfilePrompt } from "@/lib/ai/prompts";
 import { myProvider } from "@/lib/ai/providers";
 import { createDocument } from "@/lib/ai/tools/create-document";
 import { getWeather } from "@/lib/ai/tools/get-weather";
@@ -52,8 +52,8 @@ import { generateTitleFromUserMessage } from "../../actions";
 import { type PostRequestBody, postRequestBodySchema } from "./schema";
 import { createOpenAI } from "@ai-sdk/openai";
 import { embed } from "ai";
-import { embeddings } from "@/lib/db/schema";
-import { cosineDistance, desc, gt, sql } from "drizzle-orm";
+import { embeddings, prompt } from "@/lib/db/schema";
+import { cosineDistance, desc, gt, sql, eq, and } from "drizzle-orm";
 import { drizzle } from "drizzle-orm/postgres-js";
 import postgres from "postgres";
 
@@ -73,6 +73,36 @@ export const maxDuration = 60;
 
 let globalStreamContext: ResumableStreamContext | null = null;
 
+// Fetch system prompt from database with caching
+const getSystemPromptFromDB = cache(
+  async (): Promise<string | null> => {
+    try {
+      const [systemPrompt] = await db
+        .select()
+        .from(prompt)
+        .where(and(
+          eq(prompt.type, "system"),
+          eq(prompt.isActive, true)
+        ))
+        .limit(1);
+
+      if (systemPrompt) {
+        logToDebugFile(`Using system prompt from database (version ${systemPrompt.version})`);
+        return systemPrompt.content;
+      }
+      
+      logToDebugFile("No system prompt found in database, using fallback");
+      return null;
+    } catch (error) {
+      console.error("Error fetching system prompt from database:", error);
+      logToDebugFile("Error fetching system prompt from database, using fallback");
+      return null;
+    }
+  },
+  ["system-prompt"],
+  { revalidate: 60 } // Cache for 60 seconds
+);
+
 const getTokenlensCatalog = cache(
   async (): Promise<ModelCatalog | undefined> => {
     try {
@@ -252,12 +282,28 @@ export async function POST(request: Request) {
     }
 
     const stream = createUIMessageStream({
-      execute: ({ writer: dataStream }) => {
+      execute: async ({ writer: dataStream }) => {
+        // Fetch system prompt from database (with fallback to code-based prompt)
+        const dbPromptContent = await getSystemPromptFromDB();
+        const basePrompt = dbPromptContent || regularPrompt;
+        
+        // Build the full system prompt
+        const requestPrompt = getRequestPromptFromHints(requestHints);
+        const profilePrompt = getUserProfilePrompt(userProfile);
+        
+        let fullSystemPrompt: string;
+        if (selectedChatModel === "chat-model-reasoning") {
+          fullSystemPrompt = `${basePrompt}\\n\\n${requestPrompt}${profilePrompt}`;
+        } else {
+          fullSystemPrompt = `${basePrompt}\\n\\n${requestPrompt}${profilePrompt}\\n\\n${artifactsPrompt}`;
+        }
+        
+        // Add knowledge base context if available
+        if (contextText) {
+          fullSystemPrompt += `\\n\\nIMPORTANT: You have access to the following content from the "Athlete Standards" book/knowledge base. Use this information to answer the user's questions, explain concepts, or provide quotes. This is your core knowledge source:\\n\\n${contextText}`;
+        }
+
         const result = streamText({
           model: myProvider.languageModel(selectedChatModel),
           temperature: 0.7,
-          system: systemPrompt({
-            selectedChatModel,
-            requestHints,
-            userProfile,
-          }) + (contextText ? `\\n\\nIMPORTANT: You have access to the following content from the "Athlete Standards" book/knowledge base. Use this information to answer the user's questions, explain concepts, or provide quotes. This is your core knowledge source:\\n\\n${contextText}` : ""),
+          system: fullSystemPrompt,
EOF

# Apply using git apply
if patch "app/(chat)/api/chat/route.ts" < /tmp/prompt-integration.patch; then
  echo "✅ Patch applied successfully!"
  echo "📝 Backup saved to app/(chat)/api/chat/route.ts.backup"
  rm /tmp/prompt-integration.patch
else
  echo "❌ Patch failed. Restoring backup..."
  mv "app/(chat)/api/chat/route.ts.backup" "app/(chat)/api/chat/route.ts"
  rm /tmp/prompt-integration.patch
  exit 1
fi

echo "🎉 Database prompt integration complete!"
echo ""
echo "Next steps:"
echo "1. Check the logs when you send a chat message"
echo "2. You should see: 'Using system prompt from database (version X)'"
echo "3. Edit the prompt at /admin/books → System Prompt tab"
echo "4. Changes will take effect within 60 seconds (cache refresh)"
