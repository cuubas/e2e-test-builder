import { AttrLocator } from 'app/common/locators/attr';
import { IdLocator } from 'app/common/locators/id';
import { CssLocator } from 'app/common/locators/css';

const SupportedLocators = {
  css: new CssLocator(),
  id: new IdLocator(),
  attr: new AttrLocator()
};

export {
  SupportedLocators,
  AttrLocator,
  IdLocator,
  CssLocator
}