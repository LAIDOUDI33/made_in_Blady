// AI Chatbot Module - Public API
export { chatbotEngine, ChatbotEngine } from './engine';
export type { ChatContext, ProcessedMessage, ChatMessageSummary } from './engine';
export { detectIntent, extractEntities, INTENTS, FALLBACK_INTENT } from './intents';
export type { Intent } from './intents';
export { getResponse, getTypingDelay } from './responses';
export type { BotResponse, ProductCardData } from './responses';
