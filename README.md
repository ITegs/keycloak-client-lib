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
        userVerification: 'preferred'
      }
    })
  ]
});
```

Initialize auth state once on app startup:

```ts
import { Component, OnInit, inject } from '@angular/core';
import { AuthClientService } from 'keycloak-client-lib';

@Component({
  selector: 'app-root',
  template: '<router-outlet />'
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

`AuthPanelComponent` accepts an optional `redirect` input for post-login navigation.  
If set, `AuthPanelComponent` redirects there once authentication succeeds and does not render the signed-in account/passkey view.

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
  --pk-primary-bg: #111111;
  --pk-primary-bg-hover: #000000;
  --pk-accent-bg: #ffffff;
  --pk-accent-border: #111111;
  --pk-muted-border: #111111;
  --pk-danger-border: #111111;
  --pk-border: #d4d4d4;
  --pk-text-strong: #111111;
  --pk-text-muted: #555555;
  --pk-radius: 12px;
}
```
