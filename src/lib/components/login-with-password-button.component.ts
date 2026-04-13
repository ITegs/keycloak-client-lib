import { Component, DestroyRef, Input, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { KeycloakLoginOptions } from 'keycloak-js';
import { PasskeyClientService } from '../passkey-client.service';

@Component({
  selector: 'login-with-password-button',
  standalone: true,
  template: `
    <button class="pk-btn pk-btn-primary" type="button" [disabled]="isDisabled" (click)="onClick()">
      {{ label }}
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
export class LoginWithPasswordButtonComponent {
  @Input() label = 'Login';
  @Input() disabled = false;
  @Input() options?: KeycloakLoginOptions;

  private readonly destroyRef = inject(DestroyRef);
  private readonly passkeyClient = inject(PasskeyClientService);
  private ready = false;
  private authenticated = false;

  constructor() {
    this.passkeyClient.state$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((state) => {
      this.ready = state.ready;
      this.authenticated = state.authenticated;
    });
  }

  get isDisabled(): boolean {
    return this.disabled || !this.ready || this.authenticated;
  }

  onClick(): void {
    void this.passkeyClient.loginWithPassword(this.options);
  }
}
