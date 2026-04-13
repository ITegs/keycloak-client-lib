import { Component, Input, inject } from '@angular/core';
import { KeycloakLogoutOptions } from 'keycloak-js';
import { AuthClientService } from '../auth-client.service';

@Component({
  selector: 'logout-button',
  standalone: true,
  template: `
    <button class="pk-btn pk-btn-muted" type="button" (click)="onClick()">
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

      .pk-btn-muted {
        background: var(--pk-muted-bg, #ffffff);
        color: var(--pk-muted-fg, #475569);
      }

      .pk-btn-muted:not(:disabled):hover {
        background: var(--pk-muted-bg-hover, #f8fafc);
        color: var(--pk-muted-fg-hover, #334155);
      }
    `
  ]
})
export class LogoutButtonComponent {
  @Input() label = 'Logout';
  @Input() disabled = false;
  @Input() options?: KeycloakLogoutOptions;
  private readonly authClient = inject(AuthClientService);

  onClick(): void {
    void this.authClient.logout(this.options);
  }
}
