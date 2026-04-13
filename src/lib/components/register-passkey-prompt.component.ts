import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthClientService } from '../auth-client.service';
import { AUTH_CLIENT_CONFIG } from '../auth-client.config';
import { RegisterPasskeyButtonComponent } from './register-passkey-button.component';

@Component({
  selector: 'register-passkey-prompt',
  standalone: true,
  imports: [CommonModule, RegisterPasskeyButtonComponent],
  template: `
    @if (visible) {
      <div class="pk-passkey-prompt-backdrop">
        <section class="pk-passkey-prompt-modal" role="dialog" aria-modal="true">
          <div class="pk-passkey-prompt-copy">
            <h3 class="pk-passkey-prompt-title">{{ title }}</h3>
            <p class="pk-passkey-prompt-description">{{ description }}</p>
          </div>

          <label class="pk-passkey-prompt-checkbox">
            <input type="checkbox" [checked]="neverShowAgain" (change)="onNeverShowAgainChange($event)" />
            <span>{{ neverShowAgainLabel }}</span>
          </label>

          <div class="pk-passkey-prompt-actions">
            <button class="pk-btn pk-btn-secondary" type="button" [disabled]="disabled" (click)="onCancel()">
              {{ cancelLabel }}
            </button>
            <register-passkey-button
              [label]="registerLabel"
              [loadingLabel]="registerLoadingLabel"
              [disabled]="disabled"
              (success)="onRegistered()"
            />
          </div>
        </section>
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: block;
        inset: 0;
        pointer-events: none;
        position: fixed;
        z-index: 2147483647;
      }

      .pk-passkey-prompt-backdrop {
        align-items: center;
        backdrop-filter: blur(6px);
        background:
          radial-gradient(circle at top, rgba(30, 41, 59, 0.3), transparent 55%),
          rgba(15, 23, 42, 0.62);
        bottom: 0;
        display: flex;
        justify-content: center;
        left: 0;
        padding: 1.5rem;
        pointer-events: auto;
        position: fixed;
        right: 0;
        top: 0;
      }

      .pk-passkey-prompt-modal {
        background: var(--pk-surface, #ffffff);
        border: 1px solid color-mix(in srgb, var(--pk-text-strong, #1f2937) 12%, transparent);
        border-radius: var(--pk-radius-lg, 14px);
        box-shadow:
          0 24px 60px rgba(2, 6, 23, 0.3),
          0 4px 16px rgba(15, 23, 42, 0.12);
        display: grid;
        gap: 1.05rem;
        max-width: 34rem;
        padding: 1.35rem 1.4rem;
        width: min(100%, 34rem);
        animation: pk-passkey-prompt-enter 220ms cubic-bezier(0.22, 1, 0.36, 1);
      }

      .pk-passkey-prompt-copy {
        display: grid;
        gap: 0.4rem;
      }

      .pk-passkey-prompt-title {
        color: var(--pk-text-strong, #1f2937);
        font-size: 1.18rem;
        font-weight: 700;
        letter-spacing: -0.012em;
        line-height: 1.2;
        margin: 0;
      }

      .pk-passkey-prompt-description {
        color: var(--pk-text-muted, #64748b);
        font-size: 0.96rem;
        line-height: 1.5;
        margin: 0;
      }

      .pk-passkey-prompt-checkbox {
        align-items: center;
        color: color-mix(in srgb, var(--pk-text-muted, #64748b) 88%, #0f172a);
        cursor: pointer;
        display: inline-flex;
        font-size: 0.9rem;
        font-weight: 500;
        gap: 0.55rem;
      }

      .pk-passkey-prompt-checkbox input[type='checkbox'] {
        accent-color: var(--pk-primary-bg, #334155);
        block-size: 1rem;
        inline-size: 1rem;
      }

      .pk-passkey-prompt-actions {
        display: flex;
        gap: 0.6rem;
        justify-content: flex-end;
        margin-top: 0.15rem;
      }

      .pk-btn {
        appearance: none;
        border: none;
        border-radius: var(--pk-radius, 6px);
        cursor: pointer;
        font: inherit;
        font-weight: 600;
        line-height: 1.2;
        min-width: 7.6rem;
        padding: 0.68rem 1.08rem;
        transition: transform 140ms ease, box-shadow 180ms ease, background-color 180ms ease, color 180ms ease;
      }

      .pk-btn:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }

      .pk-btn-secondary {
        background: color-mix(in srgb, var(--pk-surface-soft, #f8fafc) 86%, #ffffff);
        border: 1px solid color-mix(in srgb, var(--pk-text-muted, #64748b) 25%, transparent);
        color: var(--pk-secondary-fg, #334155);
      }

      .pk-btn-secondary:not(:disabled):hover {
        background: color-mix(in srgb, var(--pk-surface-soft, #f8fafc) 74%, #ffffff);
        box-shadow: 0 1px 6px rgba(15, 23, 42, 0.08);
        transform: translateY(-1px);
      }

      @media (max-width: 540px) {
        .pk-passkey-prompt-backdrop {
          padding: 1rem;
        }

        .pk-passkey-prompt-modal {
          border-radius: 12px;
          padding: 1.1rem;
        }

        .pk-passkey-prompt-actions {
          flex-direction: column-reverse;
        }

        .pk-btn {
          width: 100%;
        }
      }

      @keyframes pk-passkey-prompt-enter {
        from {
          opacity: 0;
          transform: translateY(10px) scale(0.985);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
    `
  ]
})
export class RegisterPasskeyPromptComponent implements OnChanges {
  @Input() disabled = false;
  @Input() title = 'Protect your account with a passkey';
  @Input() description = 'You are signed in, but no passkey is registered yet.';
  @Input() registerLabel = 'Register Passkey';
  @Input() registerLoadingLabel = 'Registering...';
  @Input() cancelLabel = 'Cancel';
  @Input() neverShowAgainLabel = 'Never show again';
  @Output() registered = new EventEmitter<void>();

  visible = false;
  neverShowAgain = false;
  private readonly authClient = inject(AuthClientService);
  private readonly config = inject(AUTH_CLIENT_CONFIG);
  private readonly destroyRef = inject(DestroyRef);
  private readonly setupPromptEnabled = Boolean(this.config.passkey?.showSetupPromptAfterLogin);
  private readonly suppressionKey = 'pk:setup-prompt:suppressed';
  private refreshRequestId = 0;
  private canEvaluate = false;

  constructor() {
    this.authClient.state$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((state) => {
      const nextCanEvaluate = this.setupPromptEnabled && state.ready && state.authenticated && !this.disabled;
      if (!nextCanEvaluate) {
        this.canEvaluate = false;
        this.visible = false;
        this.neverShowAgain = false;
        return;
      }
      if (this.canEvaluate) {
        return;
      }
      this.canEvaluate = true;
      this.neverShowAgain = false;
      void this.refreshVisibility();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['disabled']) {
      if (this.disabled) {
        this.canEvaluate = false;
        this.visible = false;
        return;
      }
      if (this.setupPromptEnabled && this.authClient.state.ready && this.authClient.state.authenticated) {
        this.canEvaluate = true;
        void this.refreshVisibility();
      }
    }
  }

  async refreshVisibility(): Promise<void> {
    const requestId = ++this.refreshRequestId;
    if (this.isSuppressed()) {
      this.visible = false;
      return;
    }

    try {
      const credentials = await this.authClient.listPasskeys();
      if (requestId !== this.refreshRequestId) {
        return;
      }
      this.visible = credentials.length === 0;
    } catch {
      if (requestId !== this.refreshRequestId) {
        return;
      }
      this.visible = false;
    }
  }

  onRegistered(): void {
    this.visible = false;
    this.registered.emit();
  }

  onCancel(): void {
    if (this.neverShowAgain) {
      this.setSuppressed(true);
    }
    this.visible = false;
  }

  onNeverShowAgainChange(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.neverShowAgain = Boolean(target?.checked);
  }

  private isSuppressed(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }
    try {
      return window.localStorage.getItem(this.suppressionKey) === '1';
    } catch {
      return false;
    }
  }

  private setSuppressed(value: boolean): void {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      if (value) {
        window.localStorage.setItem(this.suppressionKey, '1');
        return;
      }
      window.localStorage.removeItem(this.suppressionKey);
    } catch {
      // ignore storage failures
    }
  }
}
