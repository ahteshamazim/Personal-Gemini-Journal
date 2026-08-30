import { Message, PromptIdea, ReflectionMode, ReflectionResponse } from "../types";

export interface SendReflectionParams {
  prompt?: string;
  history: Message[];
  mode: ReflectionMode;
  title?: string;
}

export const requestReflection = async (
  params: SendReflectionParams
): Promise<ReflectionResponse> => {
  const response = await fetch("/api/gemini/reflect", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: params.prompt,
      history: params.history.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      mode: params.mode,
      title: params.title,
    }),
  });

  if (!response.ok) {
    let errorText = "Failed to communicate with Gemini API";
    try {
      const errJson = await response.json();
      if (errJson.error) errorText = errJson.error;
    } catch (_) {
      // ignore json parse error
    }
    throw new Error(errorText);
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || "Gemini reflection request was unsuccessful.");
  }

  return data;
};

export const fetchPromptIdeas = async (
  category: string = "general"
): Promise<PromptIdea[]> => {
  try {
    const response = await fetch("/api/gemini/prompt-ideas", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ category }),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch prompt ideas");
    }

    const data = await response.json();
    return Array.isArray(data.prompts) ? data.prompts : [];
  } catch (err) {
    console.warn("Using default prompts fallback:", err);
    return [
      {
        id: "1",
        title: "Daily Flow",
        question: "What moments brought the strongest clarity and energy today?",
        guidance: "Reflect on specific interactions or breakthroughs.",
      },
      {
        id: "2",
        title: "Overcoming Friction",
        question: "Where did you feel resistance, and what belief was underneath it?",
        guidance: "Explore the emotion without judgment.",
      },
      {
        id: "3",
        title: "Future Anchor",
        question: "If tomorrow went exceptionally well, what one thing would happen?",
        guidance: "Focus on meaningful intent rather than just busywork.",
      },
    ];
  }
};
