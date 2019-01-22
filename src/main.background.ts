import 'polyfills.shared';
import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { BackgroundModule } from './app/background/background.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}
platformBrowserDynamic().bootstrapModule(BackgroundModule, {
  ngZone: 'noop'
});
