import { TestCase } from 'app/common/model';

export abstract class BaseFormatter {
  public name: string;
  public extension: string;

  public constructor() {
    this.name = 'unknown';
    this.extension = 'unknown';
  }

  public test(filename: string): boolean {
    filename = filename || '';
    return filename.indexOf(this.extension) === filename.length - this.extension.length;
  }

  public abstract parse(input: string): TestCase;
  public abstract stringify(testCase: TestCase): string;
}
