import dotenv from 'dotenv';

dotenv.config();

/**
 * Variables the server genuinely cannot run without. Missing any of these used
 * to surface as a 500 on the first login attempt in production; now the process
 * refuses to boot so a bad deploy fails loudly at rollout instead of silently.
 */
const REQUIRED = ['DATABASE_URL', 'CLERK_SECRET_KEY'] as const;

/**
 * Variables that only disable a feature when absent. Logged once at boot so an
 * operator can see which capabilities are degraded.
 */
const OPTIONAL_FEATURES: Record<string, string> = {
  MAILGUN_API_KEY: 'transactional email (reminder campaigns)',
  MAILGUN_DOMAIN: 'transactional email (reminder campaigns)',
  FIREBASE_PROJECT_ID: 'push notifications',
  API_ACCESS_TOKEN: 'TMDB proxy endpoints',
  CLIENT_URL: 'Clerk authorized-party checking on incoming session tokens',
};

export function validateEnv(): void {
  const missing = REQUIRED.filter(key => !process.env[key]?.trim());

  if (missing.length > 0) {
    console.error(
      `Refusing to start: missing required environment variable(s): ${missing.join(', ')}`
    );
    process.exit(1);
  }

  const clerkSecret = process.env.CLERK_SECRET_KEY!.trim();
  if (!clerkSecret.startsWith('sk_')) {
    console.error(
      "Refusing to start: CLERK_SECRET_KEY does not look like a Clerk secret key (expected an 'sk_' prefix)."
    );
    process.exit(1);
  }

  if (process.env.NODE_ENV === 'production' && clerkSecret.startsWith('sk_test_')) {
    console.warn(
      'Warning: running in production against Clerk test keys. Sessions from the live instance will be rejected.'
    );
  }

  const degraded = Object.entries(OPTIONAL_FEATURES)
    .filter(([key]) => !process.env[key]?.trim())
    .map(([key, feature]) => `${key} (${feature})`);

  if (degraded.length > 0) {
    console.warn(`Starting with disabled features:\n  - ${degraded.join('\n  - ')}`);
  }
}
