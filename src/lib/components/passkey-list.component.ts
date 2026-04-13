import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  NgZone,
  SimpleChanges,
  inject
} from '@angular/core';
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
        border-radius: var(--pk-radius, 6px);
        display: flex;
        gap: 1rem;
        justify-content: space-between;
        padding: 0.7rem 0.8rem;
      }

      .pk-item-info {
        min-width: 0;
      }

      .pk-item-name {
        color: var(--pk-text-strong, #1f2937);
        display: block;
        font-weight: 600;
      }

      .pk-item-date {
        color: var(--pk-text-muted, #64748b);
        font-size: 0.9rem;
      }

      .pk-feedback {
        margin: 0;
        padding: 0.65rem 0.8rem;
        border-radius: var(--pk-radius, 6px);
      }

      .pk-feedback-error {
        background: var(--pk-danger-bg-soft, #fef2f2);
        color: var(--pk-danger-fg-soft, #991b1b);
      }

      .pk-feedback-empty {
        background: var(--pk-muted-bg-soft, #f8fafc);
        color: var(--pk-text-muted, #64748b);
      }

      .pk-btn {
        appearance: none;
        border: none;
        border-radius: var(--pk-radius, 6px);
        cursor: pointer;
        font: inherit;
        font-weight: 600;
        line-height: 1.2;
        outline: none;
        padding: 0.5rem 0.85rem;
        transition: background-color 0.2s ease, color 0.2s ease;
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

      .pk-btn-danger {
        background: var(--pk-danger-bg, #ffffff);
        color: var(--pk-danger-fg, #991b1b);
      }

      .pk-btn-danger:not(:disabled):hover {
        background: var(--pk-danger-bg-hover, #fef2f2);
        color: var(--pk-danger-fg-hover, #7f1d1d);
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
  private previousCanManage = false;
  private initialLoadCompleted = false;
  private readonly destroyRef = inject(DestroyRef);
  private readonly ngZone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly authClient = inject(AuthClientService);

  ngOnInit(): void {
    this.authClient.state$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((state) => {
      this.ready = state.ready;
      this.authenticated = state.authenticated;
      this.syncCanManageState();
    });
  }

  get canManage(): boolean {
    return this.ready && this.authenticated && !this.disabled;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['disabled']) {
      this.syncCanManageState();
    }
  }

  async refresh(): Promise<void> {
    if (!this.canManage) {
      this.runInAngular(() => {
        this.credentials = [];
        this.errorMessage = '';
      });
      return;
    }

    const requestId = ++this.refreshRequestId;
    this.runInAngular(() => {
      this.loading = true;
      this.errorMessage = '';
    });
    try {
      const credentials = await this.authClient.listPasskeys();
      if (requestId !== this.refreshRequestId) {
        return;
      }
      this.runInAngular(() => {
        this.credentials = credentials;
        this.refreshed.emit(credentials);
      });
    } catch (error) {
      if (requestId !== this.refreshRequestId) {
        return;
      }
      const typedError = error instanceof Error ? error : new Error('Unable to load passkeys.');
      this.runInAngular(() => {
        this.errorMessage = typedError.message;
        this.failure.emit(typedError);
      });
    } finally {
      if (requestId === this.refreshRequestId) {
        this.runInAngular(() => {
          this.loading = false;
        });
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
      this.runInAngular(() => {
        this.errorMessage = typedError.message;
        this.failure.emit(typedError);
        this.loading = false;
      });
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

  private syncCanManageState(): void {
    const canManageNow = this.canManage;
    if (!canManageNow) {
      this.previousCanManage = false;
      this.initialLoadCompleted = false;
      this.credentials = [];
      this.loading = false;
      this.errorMessage = '';
      return;
    }

    if (!this.previousCanManage && !this.initialLoadCompleted) {
      this.previousCanManage = true;
      this.initialLoadCompleted = true;
      void this.refresh();
      return;
    }

    this.previousCanManage = true;
  }

  private runInAngular(action: () => void): void {
    this.ngZone.run(() => {
      action();
      this.cdr.markForCheck();
    });
  }
}
