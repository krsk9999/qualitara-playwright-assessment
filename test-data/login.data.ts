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

const VALID_USERNAME = 'tomsmith';
const VALID_PASSWORD = 'SuperSecretPassword!';

export const loginCases = [
  {
    title: 'valid credentials open the secure area',
    username: VALID_USERNAME,
    password: VALID_PASSWORD,
    expected: 'success',
    flashMessage: 'You logged into a secure area!',
  },
  {
    title: 'unknown username with a valid password is rejected',
    username: 'invalidUser',
    password: VALID_PASSWORD,
    expected: 'failure',
    flashMessage: 'Your username is invalid!',
  },
  {
    title: 'valid username with a wrong password is rejected',
    username: VALID_USERNAME,
    password: 'WrongPassword!',
    expected: 'failure',
    flashMessage: 'Your password is invalid!',
  },
] as const satisfies readonly LoginCase[];
