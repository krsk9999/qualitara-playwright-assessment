import { requireEnv } from './env';

export type LoginOutcome = 'success' | 'failure';

export type LoginCase = {
  /** Unique, human-readable test title. */
  readonly title: string;
  readonly username: string;
  readonly password: string;
  readonly expected: LoginOutcome;
  /** Flash banner text, without the trailing "×" close control. Observed on the live site. */
  readonly flashMessage: string;
};

// Credential values come from the environment (.env locally, repository secrets in CI);
// the expected behaviour for each combination stays here, under version control.
const VALID_USERNAME = requireEnv('LOGIN_USERNAME');
const VALID_PASSWORD = requireEnv('LOGIN_PASSWORD');
const INVALID_USERNAME = requireEnv('LOGIN_INVALID_USERNAME');
const INVALID_PASSWORD = requireEnv('LOGIN_INVALID_PASSWORD');

export const loginCases: readonly LoginCase[] = [
  {
    title: 'valid credentials open the secure area',
    username: VALID_USERNAME,
    password: VALID_PASSWORD,
    expected: 'success',
    flashMessage: 'You logged into a secure area!',
  },
  {
    title: 'unknown username with a valid password is rejected',
    username: INVALID_USERNAME,
    password: VALID_PASSWORD,
    expected: 'failure',
    flashMessage: 'Your username is invalid!',
  },
  {
    title: 'valid username with a wrong password is rejected',
    username: VALID_USERNAME,
    password: INVALID_PASSWORD,
    expected: 'failure',
    flashMessage: 'Your password is invalid!',
  },
];
