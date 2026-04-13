import { InjectionToken, Provider } from '@angular/core';
import { AuthClientConfig } from './auth-client.models';

export const AUTH_CLIENT_CONFIG = new InjectionToken<AuthClientConfig>('AUTH_CLIENT_CONFIG');

export function provideAuthClient(config: AuthClientConfig): Provider {
  return {
    provide: AUTH_CLIENT_CONFIG,
    useValue: config
  };
}
