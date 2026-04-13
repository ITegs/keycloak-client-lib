import { CommonModule } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { AuthClientService } from '../auth-client.service';

@Component({
  selector: 'auth-gate',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (authClient.state$ | async; as state) {
      @if (state.ready) {
        @if (state.authenticated) {
          <ng-content select="[authAuthenticated]"></ng-content>
        } @else {
          <ng-content select="[authUnauthenticated]"></ng-content>
        }
      } @else {
        @if (loadingLabel) {
          <p class="pk-feedback">{{ loadingLabel }}</p>
        }
        <ng-content select="[authLoading]"></ng-content>
      }
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .pk-feedback {
        background: var(--pk-muted-bg-soft, #f7f7f7);
        border: 1px solid var(--pk-border, #d4d4d4);
        border-radius: var(--pk-radius, 12px);
        color: var(--pk-text-muted, #555555);
        margin: 0;
        padding: 0.7rem 0.85rem;
      }
    `
  ]
})
export class AuthGateComponent {
  @Input() loadingLabel = 'Checking authentication...';

  protected readonly authClient = inject(AuthClientService);
}
