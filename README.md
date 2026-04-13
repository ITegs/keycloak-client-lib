# keycloak-client-lib

Angular standalone authentication library for Keycloak, including:
- auth context/service (`AuthClientService`)
- user/session state (`AuthState`, `AuthUser`)
- ready-to-use auth components
- passkey (WebAuthn) registration, login, listing, and deletion

## Install

```bash
npm install ITegs/keycloak-client-lib
```

Required peer dependencies:
- `@angular/common >=20 <22`
- `@angular/core >=20 <22`
- `rxjs >=7.8`
- `keycloak-js >=26`

## Quick Start

Register the auth config once during bootstrap:

```ts
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideAuthClient } from 'keycloak-client-lib';

bootstrapApplication(AppComponent, {
  providers: [
    provideAuthClient({
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
        userVerification: 'preferred',
        showSetupPromptAfterLogin: true
      }
    })
  ]
});
```

Initialize auth state once on app startup:

```ts
import { Component, OnInit, inject } from '@angular/core';
import { AuthClientService, RegisterPasskeyPromptComponent } from 'keycloak-client-lib';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RegisterPasskeyPromptComponent],
  template: `
    <router-outlet />
    <register-passkey-prompt />
  `
})
export class AppComponent implements OnInit {
  private readonly authClient = inject(AuthClientService);

  async ngOnInit(): Promise<void> {
    await this.authClient.init();
  }
}
```

Render a complete authentication UI with one component:

```ts
import { Component } from '@angular/core';
import { AuthPanelComponent } from 'keycloak-client-lib';

@Component({
  selector: 'app-auth-page',
  standalone: true,
  imports: [AuthPanelComponent],
  template: '<auth-panel [redirect]="postLoginRedirect" />'
})
export class AuthPageComponent {
  postLoginRedirect = `${window.location.origin}/account`;
}
```

Set `passkey.showSetupPromptAfterLogin` in `provideAuthClient(...)` to show a post-login prompt for users with no registered passkeys. Mount `<register-passkey-prompt />` once in the client app root (for example in `app.html`/`app.component.html`) so the prompt can display globally.
`AuthPanelComponent` `redirect` is used after successful passkey login only; password login continues to use Keycloak's own redirect flow.

## Auth Context and User Data

`AuthClientService` exposes:
- `state$`: complete auth state (`ready`, `authenticated`, `loading`, `error`, `user`)
- `authenticated$`: boolean stream for session status
- `user$`: normalized user stream (`AuthUser`)
- session methods: `init`, `login`, `logout`, `refreshAuthState`, `refreshToken`, `loadUserData`
- passkey methods: `loginWithPasskey`, `registerPasskey`, `listPasskeys`, `deletePasskey`

You can inject context directly:

```ts
import { Component } from '@angular/core';
import { AuthGateComponent, AuthUserComponent } from 'keycloak-client-lib';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [AuthGateComponent, AuthUserComponent],
  template: `
    <auth-gate>
      <auth-user authAuthenticated />
      <p authUnauthenticated>Please sign in.</p>
    </auth-gate>
  `
})
export class AccountComponent {}
```

## Exported Components

- `AuthPanelComponent`
- `AuthGateComponent`
- `AuthUserComponent`
- `LoginWithPasswordButtonComponent`
- `LoginWithPasskeyButtonComponent`
- `LogoutButtonComponent`
- `RegisterPasskeyButtonComponent`
- `RegisterPasskeyPromptComponent`
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

- Passkey endpoints expected by the client:
  - `POST /realms/{realm}/passkey/challenge`
  - `POST /realms/{realm}/passkey/authenticate`
  - `POST /realms/{realm}/passkey/save`
  - `GET/DELETE /realms/{realm}/account/credentials`

## Styling

Components include defaults and can be themed with CSS variables:

```css
:root {
  --pk-primary-bg: #334155;
  --pk-primary-bg-hover: #1f2937;
  --pk-accent-bg: #334155;
  --pk-accent-bg-hover: #1f2937;
  --pk-text-strong: #1f2937;
  --pk-text-muted: #64748b;
  --pk-radius: 6px;
  --pk-radius-lg: 8px;
}
```
