export interface AiChatModel {
  userId: string;
  at: number;
  chat: [
    {
      at: number;
      role: "user" | "system" | "assistant";
      content: string;
    }
  ]
}