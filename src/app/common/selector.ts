
import { highlight } from './element-helper';

export class Selector {

  public constructor(
    private locator: string,
    private callback: (Element) => void
  ) {
    this.tracker = this.tracker.bind(this);
    this.handler = this.handler.bind(this);
  }

  private tracker(ev: Event) {
    highlight(ev.target as HTMLElement);
  }

  private handler(ev) {
    ev.preventDefault();
    ev.stopPropagation();
    ev.stopImmediatePropagation();
    this.callback(ev.target);
    return false;
  }

  public start() {
    this.stop();
    document.body.addEventListener('mousemove', this.tracker, true);
    document.body.addEventListener('click', this.handler, true);
  }

  public stop() {
    document.body.removeEventListener('mousemove', this.tracker, true);
    document.body.removeEventListener('click', this.handler, true);
  }
}