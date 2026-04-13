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

      .pk-btn-muted {
        background: var(--pk-muted-bg, #ffffff);
        border: 1px solid var(--pk-muted-border, #111111);
        color: var(--pk-muted-fg, #111111);
      }

      .pk-btn-muted:not(:disabled):hover {
        background: var(--pk-muted-bg-hover, #111111);
        border-color: var(--pk-muted-border-hover, #111111);
        color: var(--pk-muted-fg-hover, #ffffff);
      }

      .pk-btn-muted:not(:disabled):active {
        transform: translateY(1px);
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
