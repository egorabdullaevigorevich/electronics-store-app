import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes))
  ]
};

// Объединяем глобальный конфиг (где лежит Zoneless) с серверным
export const serverConfigProvider = mergeApplicationConfig(appConfig, serverConfig);
