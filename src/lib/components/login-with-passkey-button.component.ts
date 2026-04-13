import { Component, EventEmitter, Input, OnDestroy, Output, inject } from '@angular/core';
import { AuthClientService } from '../auth-client.service';

@Component({
  selector: 'login-with-passkey-button',
  standalone: true,
  template: `
    <button
      class="pk-btn"
      type="button"
      [class.pk-btn-accent]="!failed"
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
        padding: 0.68rem 1.12rem;
        transition: background-color 0.2s ease, color 0.2s ease;
        cursor: pointer;
      }

      .pk-btn:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }

      .pk-btn-accent {
        background: var(--pk-accent-bg, #334155);
        box-shadow: var(--pk-accent-shadow, 0 1px 2px rgba(15, 23, 42, 0.12));
        color: var(--pk-accent-fg, #ffffff);
      }

      .pk-btn-accent:not(:disabled):hover {
        background: var(--pk-accent-bg-hover, #1f2937);
        color: var(--pk-accent-fg-hover, #ffffff);
      }

      .pk-btn-failed {
        background: var(--pk-danger-bg, #b91c1c);
        color: var(--pk-danger-fg, #ffffff);
      }
    `
  ]
})
export class LoginWithPasskeyButtonComponent implements OnDestroy {
  @Input() label = 'Login with Passkey';
  @Input() loadingLabel = 'Logging in...';
  @Input() failureLabel = 'Failed';
  @Input() failureDurationMs = 1500;
  @Input() disabled = false;
  @Output() success = new EventEmitter<void>();
  @Output() failure = new EventEmitter<Error>();

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
      await this.authClient.loginWithPasskey();
      this.success.emit();
    } catch (error) {
      this.failed = true;
      this.scheduleFailureReset();
      this.failure.emit(error instanceof Error ? error : new Error('Passkey login failed'));
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
