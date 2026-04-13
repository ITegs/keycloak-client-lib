import { CommonModule } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { AuthClientService } from '../auth-client.service';
import { AuthUser } from '../auth-client.models';

@Component({
  selector: 'auth-user',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (authClient.state$ | async; as state) {
      @if (!state.ready) {
        <p class="pk-feedback">{{ loadingLabel }}</p>
      }
      @if (state.ready && !state.authenticated) {
        <p class="pk-feedback">{{ unauthenticatedLabel }}</p>
      }

      @if (state.ready && state.authenticated && state.user; as user) {
        <section class="pk-user">
          <h3 class="pk-user-title">{{ title }}</h3>
          <div class="pk-user-primary">{{ userDisplayName(user) }}</div>
          @if (user.email) {
            <div class="pk-user-secondary">{{ user.email }}</div>
          }
          @if (showRoles && user.roles.length > 0) {
            <div class="pk-user-roles">Roles: {{ user.roles.join(', ') }}</div>
          }
        </section>
      }
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .pk-user {
        background: var(--pk-surface, #ffffff);
        border-radius: var(--pk-radius, 6px);
        box-shadow: var(--pk-shadow-soft, 0 1px 2px rgba(15, 23, 42, 0.06));
        display: grid;
        gap: 0.35rem;
        padding: 0.8rem;
      }

      .pk-user-title {
        color: var(--pk-text-strong, #1f2937);
        font-size: 0.95rem;
        font-weight: 600;
        margin: 0;
      }

      .pk-user-primary {
        color: var(--pk-text-strong, #1f2937);
        font-weight: 600;
      }

      .pk-user-secondary,
      .pk-user-roles {
        color: var(--pk-text-muted, #64748b);
        font-size: 0.9rem;
      }

      .pk-feedback {
        background: var(--pk-muted-bg-soft, #f8fafc);
        border-radius: var(--pk-radius, 6px);
        color: var(--pk-text-muted, #64748b);
        margin: 0;
        padding: 0.7rem 0.85rem;
      }
    `
  ]
})
export class AuthUserComponent {
  @Input() title = 'Signed in user';
  @Input() showRoles = true;
  @Input() loadingLabel = 'Checking authentication...';
  @Input() unauthenticatedLabel = 'No active session.';

  protected readonly authClient = inject(AuthClientService);

  userDisplayName(user: AuthUser): string {
    return user.name ?? user.username;
  }
}
