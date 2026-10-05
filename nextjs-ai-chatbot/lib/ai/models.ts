import { groq } from '@ai-sdk/groq';

// Define your models here.

export interface Model {
  id: string;
  label: string;
  apiIdentifier: string;
  description: string;
}

export const models: Array<Model> = [
  {
    id: 'mixtral-8x7b-32768',
    label: 'Mixtral 8x7B',
    apiIdentifier: 'mixtral-8x7b-32768',
    description: 'Fast and efficient, great for everyday chat',
  },
  {
    id: 'llama-3.1-70b-versatile',
    label: 'Llama 3.1 70B',
    apiIdentifier: 'llama-3.1-70b-versatile',
    description: 'Powerful and versatile model for complex tasks',
  },
  {
    id: 'llama-3.1-8b-instant',
    label: 'Llama 3.1 8B',
    apiIdentifier: 'llama-3.1-8b-instant',
    description: 'Lightweight model for quick responses',
  },
  {
    id: 'gemma-7b-it',
    label: 'Gemma 7B',
    apiIdentifier: 'gemma-7b-it',
    description: 'Google Gemma model for general-purpose chat',
  },
] as const;

export const DEFAULT_MODEL_NAME: string = 'mixtral-8x7b-32768';

export const myProvider = {
  languageModel(apiIdentifier: string) {
    return groq(apiIdentifier);
  },
  imageModel() {
    throw new Error('Image generation is not supported with Groq');
  },
};