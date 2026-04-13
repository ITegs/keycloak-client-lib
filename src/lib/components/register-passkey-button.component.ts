import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { AuthClientService } from '../auth-client.service';

@Component({
  selector: 'register-passkey-button',
  standalone: true,
  template: `
    <button class="pk-btn pk-btn-primary" type="button" [disabled]="disabled || loading" (click)="onClick()">
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
        padding: 0.6rem 1rem;
        transition: background-color 0.2s ease, color 0.2s ease;
        cursor: pointer;
      }

      .pk-btn:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }

      .pk-btn-primary {
        background: var(--pk-primary-bg, #334155);
        color: var(--pk-primary-fg, #ffffff);
      }

      .pk-btn-primary:not(:disabled):hover {
        background: var(--pk-primary-bg-hover, #1f2937);
      }
    `
  ]
})
export class RegisterPasskeyButtonComponent {
  @Input() label = 'Register Passkey';
  @Input() loadingLabel = 'Registering...';
  @Input() disabled = false;
  @Output() success = new EventEmitter<void>();
  @Output() failure = new EventEmitter<Error>();

  loading = false;
  private readonly authClient = inject(AuthClientService);

  async onClick(): Promise<void> {
    this.loading = true;
    try {
      await this.authClient.registerPasskey();
      this.success.emit();
    } catch (error) {
      this.failure.emit(error instanceof Error ? error : new Error('Passkey registration failed'));
    } finally {
      this.loading = false;
    }
  }
}
