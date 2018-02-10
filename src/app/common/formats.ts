import { BaseFormatter } from 'app/common/formats/base';
import { HtmlFormatter } from 'app/common/formats/html';
import { ProtractorFormatter } from 'app/common/formats/protractor';


const SupportedFormats: BaseFormatter[] = [
  new HtmlFormatter(),
  new ProtractorFormatter()
];

export {
  BaseFormatter,
  HtmlFormatter,
  ProtractorFormatter,
  SupportedFormats
};
