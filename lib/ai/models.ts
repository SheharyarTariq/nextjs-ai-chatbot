export const DEFAULT_CHAT_MODEL: string = "chat-model";

export type ChatModel = {
  id: string;
  name: string;
  description: string;
};

export const chatModels: ChatModel[] = [
  {
    id: "chat-model",
    name: "GPT-4.1 Mini",
    description: "Fast multimodal OpenAI model for day-to-day conversations",
  },
  {
    id: "chat-model-reasoning",
    name: "O4 Mini",
    description: "Reasoning-focused OpenAI model for complex problem solving",
  },
];
