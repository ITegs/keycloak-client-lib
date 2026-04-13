import { Component, Input, inject } from '@angular/core';
import { KeycloakLoginOptions } from 'keycloak-js';
import { AuthClientService } from '../auth-client.service';

@Component({
  selector: 'login-with-password-button',
  standalone: true,
  template: `
    <button class="pk-btn pk-btn-secondary" type="button" (click)="onClick()">
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

      .pk-btn-secondary {
        background: var(--pk-secondary-bg, #ffffff);
        border-color: var(--pk-secondary-border, #a3a3a3);
        color: var(--pk-secondary-fg, #111111);
      }

      .pk-btn-secondary:not(:disabled):hover {
        background: var(--pk-secondary-bg-hover, #f5f5f5);
        border-color: var(--pk-secondary-border-hover, #737373);
      }

      .pk-btn-secondary:not(:disabled):active {
        transform: translateY(1px);
      }
    `
  ]
})
export class LoginWithPasswordButtonComponent {
  @Input() label = 'Login';
  @Input() disabled = false;
  @Input() options?: KeycloakLoginOptions;

  private readonly authClient = inject(AuthClientService);

  onClick(): void {
    void this.authClient.loginWithPassword(this.options);
  }
}
