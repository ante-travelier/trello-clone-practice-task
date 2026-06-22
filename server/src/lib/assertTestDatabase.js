/**
 * Hard guard against running destructive test logic (table truncation) against
 * a non-test database. Throws unless NODE_ENV==="test" AND the database name
 * contains "test".
 * @param {NodeJS.ProcessEnv} env
 * @returns {{ dbName: string }}
 */
export function assertTestDatabase(env = process.env) {
  const url = env.DATABASE_URL;
  if (!url) {
    throw new Error(
      '[test-db-guard] DATABASE_URL is not set. Refusing to run tests.'
    );
  }
  let dbName;
  try {
    dbName = new URL(url).pathname.replace(/^\//, '');
  } catch {
    throw new Error(`[test-db-guard] DATABASE_URL is not a valid URL: ${url}`);
  }
  const looksLikeTest = /test/i.test(dbName);
  if (env.NODE_ENV !== 'test' || !looksLikeTest) {
    throw new Error(
      '[test-db-guard] Refusing to run destructive tests.\n' +
        `  NODE_ENV must be "test" (got "${env.NODE_ENV}")\n` +
        `  and the database name must contain "test" (got "${dbName}").\n` +
        '  This guards against truncating a real database.'
    );
  }
  return { dbName };
}
