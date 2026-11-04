import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { appConfig } from './app.config';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering()
  ]
};

// Объединяем глобальный конфиг (где лежит Zoneless) с серверным
export const serverConfigProvider = mergeApplicationConfig(appConfig, serverConfig);
