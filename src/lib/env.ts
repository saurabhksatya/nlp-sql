export function loadEnvVariable(key: string): string {
  const value = process.env[key]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

const env = {
  GEMINI_API_KEY: loadEnvVariable("GEMINI_API_KEY"),
};

export default env;
