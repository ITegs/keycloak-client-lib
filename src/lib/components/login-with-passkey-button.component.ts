import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { AuthClientService } from '../auth-client.service';

@Component({
  selector: 'login-with-passkey-button',
  standalone: true,
  template: `
    <button class="pk-btn pk-btn-accent" type="button" (click)="onClick()">
      {{ loading ? loadingLabel : label }}
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
    `
  ]
})
export class LoginWithPasskeyButtonComponent {
  @Input() label = 'Login with Passkey';
  @Input() loadingLabel = 'Logging in...';
  @Input() disabled = false;
  @Output() success = new EventEmitter<void>();
  @Output() failure = new EventEmitter<Error>();

  loading = false;
  private readonly authClient = inject(AuthClientService);

  async onClick(): Promise<void> {
    this.loading = true;
    try {
      await this.authClient.loginWithPasskey();
      this.success.emit();
    } catch (error) {
      this.failure.emit(error instanceof Error ? error : new Error('Passkey login failed'));
    } finally {
      this.loading = false;
    }
  }
}
