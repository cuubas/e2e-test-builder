export class IdLocator {
  public create(target: Element, settings: any): string {
    if (target.id) {
      return 'id=' + target.id
    }
  }

  public find(locator: string, parent: Element): NodeListOf<Element> {
    return parent.querySelectorAll('#' + locator);
  };
}