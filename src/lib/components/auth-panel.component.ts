import { CommonModule } from '@angular/common';
import { Component, DestroyRef, Input, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { AuthGateComponent } from './auth-gate.component';
import { AuthClientService } from '../auth-client.service';
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
        <h2 class="pk-auth-title">{{ title }}</h2>
      </header>

      <auth-gate [loadingLabel]="loadingLabel">
        <div authUnauthenticated class="pk-auth-actions">
          <login-with-passkey-button [label]="loginWithPasskeyLabel" [disabled]="disabled" />
          <login-with-password-button [label]="loginLabel" [disabled]="disabled" />
        </div>

        <div *ngIf="!redirect" authAuthenticated class="pk-auth-content">
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
        background: var(--pk-surface-soft, #f7f7f7);
        border: 1px solid var(--pk-border, #d4d4d4);
        border-radius: var(--pk-radius-lg, 16px);
        box-shadow: var(--pk-shadow-panel, 0 8px 24px rgba(0, 0, 0, 0.07));
        display: grid;
        gap: 0.9rem;
        padding: 1rem;
      }

      .pk-auth-header {
        align-items: center;
        display: flex;
        justify-content: space-between;
      }

      .pk-auth-title {
        color: var(--pk-text-strong, #111111);
        font-size: 1.05rem;
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
    `
  ]
})
export class AuthPanelComponent implements OnInit {
  @Input() title = 'Authentication';
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

  private readonly authClient = inject(AuthClientService);
  private readonly destroyRef = inject(DestroyRef);
  private redirected = false;

  ngOnInit(): void {
    this.authClient.authenticated$
      .pipe(
        filter((authenticated) => authenticated),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => this.redirectAfterLogin());
  }

  private redirectAfterLogin(): void {
    if (this.redirected || !this.redirect || typeof window === 'undefined') {
      return;
    }

    const target = new URL(this.redirect, window.location.origin).toString();
    if (target === window.location.href) {
      return;
    }

    this.redirected = true;
    window.location.assign(target);
  }
}
