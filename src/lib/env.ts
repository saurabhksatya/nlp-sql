export function loadEnvVariable(key: string): string {
  const value = process.env[key]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

export function getGeminiApiKey(): string {
  return process.env.GEMINI_API_KEY?.trim() || "";
}

const env = {
  get GEMINI_API_KEY(): string {
    return process.env.GEMINI_API_KEY?.trim() || "";
  },
};

export default env;
