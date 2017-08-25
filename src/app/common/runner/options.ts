export class IOptions {
  interval: number;
  waitForCheckInterval: number;
  customAttribute: string;
  locators: string;
}

export const Options: IOptions = {
  interval: 500,
  waitForCheckInterval: 500,
  customAttribute: 'e2e-tag',
  locators: 'attr css'
};