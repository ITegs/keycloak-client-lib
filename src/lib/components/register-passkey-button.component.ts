import { Component, DestroyRef, EventEmitter, Input, Output, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PasskeyClientService } from '../passkey-client.service';

@Component({
  selector: 'register-passkey-button',
  standalone: true,
  template: `
    <button class="pk-btn pk-btn-primary" type="button" [disabled]="isDisabled" (click)="onClick()">
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
        border: 1px solid transparent;
        border-radius: var(--pk-radius, 10px);
        font: inherit;
        font-weight: 600;
        line-height: 1.2;
        padding: 0.6rem 1rem;
        transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.12s ease;
        cursor: pointer;
      }

      .pk-btn:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }

      .pk-btn-primary {
        background: var(--pk-primary-bg, #166534);
        border-color: var(--pk-primary-bg, #166534);
        color: var(--pk-primary-fg, #ffffff);
      }

      .pk-btn-primary:not(:disabled):hover {
        background: var(--pk-primary-bg-hover, #14532d);
        border-color: var(--pk-primary-bg-hover, #14532d);
      }

      .pk-btn-primary:not(:disabled):active {
        transform: translateY(1px);
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
  private ready = false;
  private authenticated = false;
  private readonly destroyRef = inject(DestroyRef);
  private readonly passkeyClient = inject(PasskeyClientService);

  constructor() {
    this.passkeyClient.state$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((state) => {
      this.ready = state.ready;
      this.authenticated = state.authenticated;
    });
  }

  get isDisabled(): boolean {
    return this.loading || this.disabled || !this.ready || !this.authenticated;
  }

  async onClick(): Promise<void> {
    this.loading = true;
    try {
      await this.passkeyClient.registerPasskey();
      this.success.emit();
    } catch (error) {
      this.failure.emit(error instanceof Error ? error : new Error('Passkey registration failed'));
    } finally {
      this.loading = false;
    }
  }
}
