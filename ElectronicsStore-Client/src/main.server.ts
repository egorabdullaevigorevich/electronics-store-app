import 'zone.js/node'; // Полифилл строго первым!
import { BootstrapContext, bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { serverConfigProvider } from './app/app.config.server';

// Передаем context строго третьим позиционным аргументом, как требует Angular 22
const bootstrap = (context: BootstrapContext) =>
  bootstrapApplication(App, serverConfigProvider, context);

export default bootstrap;
