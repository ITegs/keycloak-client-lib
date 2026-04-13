import { inject } from '@angular/core';
import { AuthClientService } from './auth-client.service';

export type AuthContext = AuthClientService;

export function injectAuthContext(): AuthContext {
  return inject(AuthClientService);
}
