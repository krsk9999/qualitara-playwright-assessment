/**
 * Reads a required environment variable, failing fast with a clear message
 * instead of letting a test run with `undefined` credentials.
 */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable ${name}. Copy .env.example to .env and fill it in.`);
  }
  return value;
}
