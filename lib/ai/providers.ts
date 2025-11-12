
import { createOpenAI } from "@ai-sdk/openai";
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
import { isTestEnvironment } from "../constants";

const createOpenAIProvider = () => {
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Missing OPENAI_API_KEY environment variable. Set it in .env.local."
    );
  }

  const openai = createOpenAI({ apiKey });

  return customProvider({
    languageModels: {
      "chat-model": openai.languageModel("gpt-4.1-mini"),
      "chat-model-reasoning": wrapLanguageModel({
        model: openai.languageModel("o4-mini"),
        middleware: extractReasoningMiddleware({ tagName: "think" }),
      }),
      "title-model": openai.languageModel("gpt-4.1-mini"),
      "artifact-model": openai.languageModel("gpt-4.1-mini"),
    },
  });
};

export const myProvider = isTestEnvironment
  ? (() => {
      const {
        artifactModel,
        chatModel,
        reasoningModel,
        titleModel,
      } = require("./models.mock");
      return customProvider({
        languageModels: {
          "chat-model": chatModel,
          "chat-model-reasoning": reasoningModel,
          "title-model": titleModel,
          "artifact-model": artifactModel,
        },
      });
    })()
  : createOpenAIProvider();
