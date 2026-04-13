import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { AuthGateComponent } from './auth-gate.component';
import { AuthUserComponent } from './auth-user.component';
import { LoginWithPasskeyButtonComponent } from './login-with-passkey-button.component';
import { LoginWithPasswordButtonComponent } from './login-with-password-button.component';
import { LogoutButtonComponent } from './logout-button.component';
import { PasskeyManagerComponent } from './passkey-manager.component';

@Component({
  selector: 'auth-panel',
  standalone: true,
  imports: [
    CommonModule,
    AuthGateComponent,
    AuthUserComponent,
    LoginWithPasswordButtonComponent,
    LoginWithPasskeyButtonComponent,
    LogoutButtonComponent,
    PasskeyManagerComponent
  ],
  template: `
    <section class="pk-auth-panel">
      <header class="pk-auth-header">
        <div class="pk-auth-heading">
          <h2 class="pk-auth-title">{{ title }}</h2>
          @if (description) {
            <p class="pk-auth-description">{{ description }}</p>
          }
        </div>
      </header>

      <auth-gate [loadingLabel]="loadingLabel">
        <div authUnauthenticated class="pk-auth-actions pk-auth-actions-stack">
          <login-with-passkey-button
            [label]="loginWithPasskeyLabel"
            [disabled]="disabled"
            (success)="onPasskeyLoginSuccess()"
          />
          <login-with-password-button [label]="loginLabel" [disabled]="disabled" />
        </div>

        <div authAuthenticated class="pk-auth-content">
          <auth-user [title]="userTitle" [showRoles]="showRoles" [unauthenticatedLabel]="''" />
          <div class="pk-auth-actions">
            <logout-button [label]="logoutLabel" [disabled]="disabled" />
          </div>
          <passkey-manager
            [disabled]="disabled"
            [title]="passkeyTitle"
            [registerLabel]="registerPasskeyLabel"
            [registerLoadingLabel]="registerPasskeyLoadingLabel"
            [refreshLabel]="refreshPasskeysLabel"
            [removeLabel]="removePasskeyLabel"
            [emptyLabel]="emptyPasskeysLabel"
          />
        </div>
      </auth-gate>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .pk-auth-panel {
        background: var(--pk-surface-soft, #f8fafc);
        border-radius: var(--pk-radius-lg, 8px);
        box-shadow: var(--pk-shadow-panel, 0 1px 2px rgba(15, 23, 42, 0.08));
        display: grid;
        gap: 0.9rem;
        padding: 1rem;
      }

      .pk-auth-header {
        display: block;
      }

      .pk-auth-heading {
        display: grid;
        gap: 0.35rem;
      }

      .pk-auth-title {
        color: var(--pk-text-strong, #1f2937);
        font-size: 1.05rem;
        font-weight: 600;
        margin: 0;
      }

      .pk-auth-description {
        color: var(--pk-text-muted, #64748b);
        font-size: 0.92rem;
        margin: 0;
      }

      .pk-auth-content {
        display: grid;
        gap: 0.8rem;
      }

      .pk-auth-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.6rem;
      }

      .pk-auth-actions-stack {
        align-items: flex-start;
        flex-direction: column;
        flex-wrap: nowrap;
      }
    `
  ]
})
export class AuthPanelComponent {
  @Input() title = 'Authentication';
  @Input() description = 'Sign in to continue.';
  @Input() userTitle = 'Signed in user';
  @Input() loadingLabel = 'Checking authentication...';
  @Input() loginLabel = 'Login';
  @Input() loginWithPasskeyLabel = 'Login with Passkey';
  @Input() logoutLabel = 'Logout';
  @Input() passkeyTitle = 'Your Passkeys';
  @Input() registerPasskeyLabel = 'Register Passkey';
  @Input() registerPasskeyLoadingLabel = 'Registering...';
  @Input() refreshPasskeysLabel = 'Refresh';
  @Input() removePasskeyLabel = 'Remove';
  @Input() emptyPasskeysLabel = 'No passkeys registered yet.';
  @Input() redirect?: string;
  @Input() showRoles = true;
  @Input() disabled = false;

  onPasskeyLoginSuccess(): void {
    this.redirectAfterPasskeyLogin();
  }

  private redirectAfterPasskeyLogin(): void {
    if (!this.redirect || typeof window === 'undefined') {
      return;
    }

    const target = new URL(this.redirect, window.location.origin).toString();
    if (target === window.location.href) {
      return;
    }

    window.location.assign(target);
  }
}
