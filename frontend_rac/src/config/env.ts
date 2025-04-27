export function getEnvOrThrow(key: string): string {
  const value = process.env[key];

  if (typeof value === "undefined" || value === "") {
    throw new Error(`❌ Missing required environment variable: ${key}`);
  }

  return value;
}
