import { Component, Input, OnDestroy, inject } from '@angular/core';
import { KeycloakLoginOptions } from 'keycloak-js';
import { AuthClientService } from '../auth-client.service';

@Component({
  selector: 'login-with-password-button',
  standalone: true,
  template: `
    <button
      class="pk-btn"
      type="button"
      [class.pk-btn-secondary]="!failed"
      [class.pk-btn-failed]="failed"
      [disabled]="disabled || loading"
      (click)="onClick()"
    >
      {{ loading ? loadingLabel : failed ? failureLabel : label }}
    </button>
  `,
  styles: [
    `
      :host {
        display: inline-block;
      }

      .pk-btn {
        appearance: none;
        border: none;
        border-radius: var(--pk-radius, 6px);
        font: inherit;
        font-weight: 600;
        line-height: 1.2;
        outline: none;
        padding: 0.6rem 1rem;
        transition: background-color 0.2s ease, color 0.2s ease;
        cursor: pointer;
      }

      .pk-btn:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }

      .pk-btn-secondary {
        background: var(--pk-secondary-bg, #ffffff);
        color: var(--pk-secondary-fg, #334155);
      }

      .pk-btn-secondary:not(:disabled):hover {
        background: var(--pk-secondary-bg-hover, #f8fafc);
      }

      .pk-btn-failed {
        background: var(--pk-danger-bg, #b91c1c);
        color: var(--pk-danger-fg, #ffffff);
      }
    `
  ]
})
export class LoginWithPasswordButtonComponent implements OnDestroy {
  @Input() label = 'Login';
  @Input() loadingLabel = 'Logging in...';
  @Input() failureLabel = 'Failed';
  @Input() failureDurationMs = 1500;
  @Input() disabled = false;
  @Input() options?: KeycloakLoginOptions;
  loading = false;
  failed = false;
  private failureTimeoutId: number | null = null;

  private readonly authClient = inject(AuthClientService);

  async onClick(): Promise<void> {
    if (this.loading || this.disabled) {
      return;
    }
    this.clearFailureResetTimeout();
    this.failed = false;
    this.loading = true;
    try {
      await this.authClient.loginWithPassword(this.options);
    } catch {
      this.failed = true;
      this.scheduleFailureReset();
    } finally {
      this.loading = false;
    }
  }

  ngOnDestroy(): void {
    this.clearFailureResetTimeout();
  }

  private scheduleFailureReset(): void {
    this.clearFailureResetTimeout();
    this.failureTimeoutId = window.setTimeout(() => {
      this.failed = false;
      this.failureTimeoutId = null;
    }, this.failureDurationMs);
  }

  private clearFailureResetTimeout(): void {
    if (this.failureTimeoutId === null) {
      return;
    }
    window.clearTimeout(this.failureTimeoutId);
    this.failureTimeoutId = null;
  }
}
