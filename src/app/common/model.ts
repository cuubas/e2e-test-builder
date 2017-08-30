
export class TestCase {
  public title: string;
  public baseUrl: string;
  public items: TestCaseItem[];

  constructor(object?: TestCase) {
    if (object) {
      this.title = object.title;
      this.baseUrl = object.baseUrl;
      if (object.items) {
        this.items = object.items.map((it) => new TestCaseItem(it));
      } else {
        this.items = [];
      }
    } else {
      this.items = [];
    }
  }
}

export class TestCaseItem {
  public type: 'command' | 'comment';
  public command: string;
  public locator: string;
  public selecting?: boolean;
  public value: string;
  public state?: string;
  public message?: string;

  constructor(item?: TestCaseItem) {
    if (item) {
      this.type = item.type;
      this.command = item.command;
      this.locator = item.locator;
      this.value = item.value;
    }
  }
}

export class SelectionRange {
  public start = 0;
  public end = 0;
}
