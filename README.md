# passkey-client-lib

Angular standalone component + service library for Keycloak passkey (WebAuthn) flows.

## Install

```bash
npm install ITegs/passkey-client-lib
```

Required peer dependencies:
- `@angular/common >=20 <22`
- `@angular/core >=20 <22`
- `rxjs >=7.8`
- `keycloak-js >=26`

## Quick Start

Register the library config once during bootstrap:

```ts
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { providePasskeyClient } from 'passkey-client-lib';

bootstrapApplication(AppComponent, {
  providers: [
    providePasskeyClient({
      keycloak: {
        url: 'http://localhost:8080',
        realm: 'demo',
        clientId: 'demo-app'
      },
      checkSso: {
        redirectUri: `${window.location.origin}/silent-check-sso.html`,
        silentFallback: false
      },
      passkey: {
        rpName: 'My App',
        userVerification: 'preferred'
      }
    })
  ]
});
```

Initialize auth state once on app startup:

```ts
import { Component, inject } from '@angular/core';
import { PasskeyClientService } from 'passkey-client-lib';

@Component({
  selector: 'app-root',
  template: '<router-outlet />'
})
export class AppComponent {
  private readonly passkeyClient = inject(PasskeyClientService);

  async ngOnInit(): Promise<void> {
    await this.passkeyClient.init();
  }
}
```

Use the provided standalone UI components:

```ts
import { Component } from '@angular/core';
import {
  LoginWithPasskeyButtonComponent,
  LoginWithPasswordButtonComponent,
  LogoutButtonComponent,
  PasskeyManagerComponent
} from 'passkey-client-lib';

@Component({
  selector: 'app-auth-page',
  standalone: true,
  imports: [
    LoginWithPasswordButtonComponent,
    LoginWithPasskeyButtonComponent,
    LogoutButtonComponent,
    PasskeyManagerComponent
  ],
  template: `
    <login-with-password-button label="Login"></login-with-password-button>
    <login-with-passkey-button label="Login with Passkey"></login-with-passkey-button>
    <logout-button></logout-button>
    <passkey-manager></passkey-manager>
  `
})
export class AuthPageComponent {}
```

## Exports

- `providePasskeyClient`
- `PasskeyClientService`
- `PasskeyAuthState`, `PasskeyActionResult`, `PasskeyClientConfig`, `PasskeyCredentialSummary`
- `LoginWithPasskeyButtonComponent`
- `LoginWithPasswordButtonComponent`
- `RegisterPasskeyButtonComponent`
- `LogoutButtonComponent`
- `PasskeyListComponent`
- `PasskeyManagerComponent`

## Runtime Notes

- `silent-check-sso.html` must be served by your app:

```html
<!doctype html>
<html lang="en">
  <body>
    <script>parent.postMessage(location.href, location.origin);</script>
  </body>
</html>
```

- `loginWithPasskey()` posts to `/realms/{realm}/passkey/authenticate`, then refreshes auth state with Keycloak `check-sso`.
- `passkey-list` loads and removes credentials from `/realms/{realm}/account/credentials`.

## Styling

Components now ship with built-in default styling. You can override colors/radius with CSS variables in your app shell:

```css
:root {
  --pk-primary-bg: #1d4ed8;
  --pk-primary-bg-hover: #1e40af;
  --pk-accent-bg: #0f766e;
  --pk-danger-bg: #dc2626;
  --pk-radius: 12px;
}
```

## Repository Release Flow (Maintainers)

Build and validate tarball contents:

```bash
npm install
npm run build
npm run pack:dry
```

This package is intended to be consumed directly from GitHub, not from the npm registry.
