import { Component, DestroyRef, Input, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { KeycloakLogoutOptions } from 'keycloak-js';
import { PasskeyClientService } from '../passkey-client.service';

@Component({
  selector: 'logout-button',
  standalone: true,
  template: `
    <button class="pk-btn pk-btn-muted" type="button" [disabled]="isDisabled" (click)="onClick()">
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

      .pk-btn-muted {
        background: var(--pk-muted-bg, #ffffff);
        border: 1px solid var(--pk-muted-border, #d1d5db);
        color: var(--pk-muted-fg, #111827);
      }

      .pk-btn-muted:not(:disabled):hover {
        background: var(--pk-muted-bg-hover, #f9fafb);
        border-color: var(--pk-muted-border-hover, #9ca3af);
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
    return this.disabled || !this.ready || !this.authenticated;
  }

  onClick(): void {
    void this.passkeyClient.logout(this.options);
  }
}
