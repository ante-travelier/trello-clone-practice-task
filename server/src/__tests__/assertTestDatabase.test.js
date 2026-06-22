import { assertTestDatabase } from '../lib/assertTestDatabase.js';

const TEST_URL =
  'postgresql://postgres:postgres@localhost:5433/trello_clone_test';
const PROD_URL = 'postgresql://postgres:postgres@localhost:5432/trello_clone';

describe('assertTestDatabase', () => {
  test('throws when DATABASE_URL is missing', () => {
    expect(() => assertTestDatabase({ NODE_ENV: 'test' })).toThrow(
      /DATABASE_URL is not set/
    );
  });

  test('throws when NODE_ENV is not "test"', () => {
    expect(() =>
      assertTestDatabase({ NODE_ENV: 'development', DATABASE_URL: TEST_URL })
    ).toThrow(/Refusing to run destructive tests/);
  });

  test('throws when the database name does not contain "test"', () => {
    expect(() =>
      assertTestDatabase({ NODE_ENV: 'test', DATABASE_URL: PROD_URL })
    ).toThrow(/Refusing to run destructive tests/);
  });

  test('throws when DATABASE_URL is not a valid URL', () => {
    expect(() =>
      assertTestDatabase({ NODE_ENV: 'test', DATABASE_URL: 'not-a-url' })
    ).toThrow(/DATABASE_URL is not a valid URL/);
  });

  test('returns the db name for a proper test database', () => {
    expect(
      assertTestDatabase({ NODE_ENV: 'test', DATABASE_URL: TEST_URL })
    ).toEqual({ dbName: 'trello_clone_test' });
  });
});
