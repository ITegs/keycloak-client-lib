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
        border: 1px solid var(--pk-btn-border, #111111);
        border-radius: var(--pk-radius, 12px);
        font: inherit;
        font-weight: 600;
        line-height: 1.2;
        padding: 0.6rem 1rem;
        transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, transform 0.12s ease;
        cursor: pointer;
      }

      .pk-btn:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }

      .pk-btn-accent {
        background: var(--pk-accent-bg, #ffffff);
        border-color: var(--pk-accent-border, #111111);
        color: var(--pk-accent-fg, #111111);
      }

      .pk-btn-accent:not(:disabled):hover {
        background: var(--pk-accent-bg-hover, #111111);
        border-color: var(--pk-accent-border-hover, #111111);
        color: var(--pk-accent-fg-hover, #ffffff);
      }

      .pk-btn-accent:not(:disabled):active {
        transform: translateY(1px);
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
