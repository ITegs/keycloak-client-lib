import { CommonModule } from '@angular/common';
import { Component, DestroyRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthPasskeyCredentialSummary } from '../auth-client.models';
import { AuthClientService } from '../auth-client.service';

@Component({
  selector: 'passkey-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="pk-list">
      <div class="pk-list-actions">
        <button class="pk-btn pk-btn-muted" type="button" (click)="refresh()">
          {{ refreshLabel }}
        </button>
      </div>

      @if (!canManage) {
        <p class="pk-feedback pk-feedback-empty">{{ unauthenticatedLabel }}</p>
      }
      @if (errorMessage) {
        <p class="pk-feedback pk-feedback-error">{{ errorMessage }}</p>
      }
      @if (canManage && !loading && !errorMessage && credentials.length === 0) {
        <p class="pk-feedback pk-feedback-empty">{{ emptyLabel }}</p>
      }

      @if (canManage && credentials.length > 0) {
        <ul class="pk-items">
          <li class="pk-item" *ngFor="let credential of credentials">
            <div class="pk-item-info">
              <strong class="pk-item-name">{{ credential.name }}</strong>
              <div class="pk-item-date">{{ formatCreatedDate(credential.createdDate) }}</div>
            </div>
            <button
              class="pk-btn pk-btn-danger"
              type="button"
              (click)="remove(credential.id)"
            >
              {{ removeLabel }}
            </button>
          </li>
        </ul>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .pk-list {
        display: grid;
        gap: 0.75rem;
      }

      .pk-list-actions {
        display: flex;
        justify-content: flex-end;
      }

      .pk-items {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 0.6rem;
      }

      .pk-item {
        align-items: center;
        background: var(--pk-surface, #ffffff);
        border: 1px solid var(--pk-border, #d4d4d4);
        border-radius: var(--pk-radius, 12px);
        display: flex;
        gap: 1rem;
        justify-content: space-between;
        padding: 0.7rem 0.8rem;
      }

      .pk-item-info {
        min-width: 0;
      }

      .pk-item-name {
        color: var(--pk-text-strong, #111111);
        display: block;
        font-weight: 700;
      }

      .pk-item-date {
        color: var(--pk-text-muted, #555555);
        font-size: 0.9rem;
      }

      .pk-feedback {
        margin: 0;
        padding: 0.65rem 0.8rem;
        border-radius: var(--pk-radius, 10px);
      }

      .pk-feedback-error {
        background: var(--pk-danger-bg-soft, #f2f2f2);
        border: 1px solid var(--pk-danger-border-soft, #111111);
        color: var(--pk-danger-fg-soft, #111111);
      }

      .pk-feedback-empty {
        background: var(--pk-muted-bg-soft, #f7f7f7);
        border: 1px solid var(--pk-border, #d4d4d4);
        color: var(--pk-text-muted, #555555);
      }

      .pk-btn {
        appearance: none;
        border-radius: var(--pk-radius, 12px);
        cursor: pointer;
        font: inherit;
        font-weight: 600;
        line-height: 1.2;
        padding: 0.5rem 0.85rem;
        transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, transform 0.12s ease;
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

      .pk-btn-danger {
        background: var(--pk-danger-bg, #ffffff);
        border: 1px solid var(--pk-danger-border, #111111);
        color: var(--pk-danger-fg, #111111);
      }

      .pk-btn-danger:not(:disabled):hover {
        background: var(--pk-danger-bg-hover, #111111);
        border-color: var(--pk-danger-border-hover, #111111);
        color: var(--pk-danger-fg-hover, #ffffff);
      }

      .pk-btn:not(:disabled):active {
        transform: translateY(1px);
      }
    `
  ]
})
export class PasskeyListComponent implements OnInit, OnChanges {
  @Input() disabled = false;
  @Input() emptyLabel = 'No passkeys registered yet.';
  @Input() unauthenticatedLabel = 'Log in to manage passkeys.';
  @Input() refreshLabel = 'Refresh';
  @Input() removeLabel = 'Remove';

  @Output() refreshed = new EventEmitter<AuthPasskeyCredentialSummary[]>();
  @Output() removed = new EventEmitter<string>();
  @Output() failure = new EventEmitter<Error>();

  credentials: AuthPasskeyCredentialSummary[] = [];
  loading = false;
  errorMessage = '';
  private ready = false;
  private authenticated = false;
  private refreshRequestId = 0;
  private canManageSnapshot = false;
  private readonly destroyRef = inject(DestroyRef);

  constructor(private readonly authClient: AuthClientService) {
    this.authClient.state$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((state) => {
      const previousCanManage = this.canManageSnapshot;
      this.ready = state.ready;
      this.authenticated = state.authenticated;
      this.canManageSnapshot = this.canManage;

      if (!this.canManageSnapshot) {
        this.credentials = [];
        this.loading = false;
      }

      if (this.canManageSnapshot && !previousCanManage) {
        void this.refresh();
      }
    });
  }

  get canManage(): boolean {
    return this.ready && this.authenticated && !this.disabled;
  }

  ngOnInit(): void {
    if (this.canManage) {
      void this.refresh();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.ready || !this.authenticated) {
      return;
    }

    if (changes['disabled'] && this.canManage) {
      void this.refresh();
    }
  }

  async refresh(): Promise<void> {
    if (!this.canManage) {
      this.credentials = [];
      this.errorMessage = '';
      return;
    }

    const requestId = ++this.refreshRequestId;
    this.loading = true;
    this.errorMessage = '';
    try {
      const credentials = await this.authClient.listPasskeys();
      if (requestId !== this.refreshRequestId) {
        return;
      }
      this.credentials = credentials;
      this.refreshed.emit(credentials);
    } catch (error) {
      if (requestId !== this.refreshRequestId) {
        return;
      }
      const typedError = error instanceof Error ? error : new Error('Unable to load passkeys.');
      this.errorMessage = typedError.message;
      this.failure.emit(typedError);
    } finally {
      if (requestId === this.refreshRequestId) {
        this.loading = false;
      }
    }
  }

  async remove(credentialId: string): Promise<void> {
    if (!this.canManage) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    try {
      await this.authClient.deletePasskey(credentialId);
      this.removed.emit(credentialId);
      await this.refresh();
    } catch (error) {
      const typedError = error instanceof Error ? error : new Error('Unable to remove passkey.');
      this.errorMessage = typedError.message;
      this.failure.emit(typedError);
      this.loading = false;
    }
  }

  formatCreatedDate(createdDate?: number | null): string {
    if (!createdDate || !Number.isFinite(createdDate)) {
      return 'Created date unavailable';
    }
    const parsed = new Date(createdDate);
    if (Number.isNaN(parsed.getTime())) {
      return 'Created date unavailable';
    }
    return `Created ${parsed.toLocaleString()}`;
  }
}
