import { CommonModule } from '@angular/common';
import { Component, Input, ViewChild } from '@angular/core';
import { PasskeyListComponent } from './passkey-list.component';
import { RegisterPasskeyButtonComponent } from './register-passkey-button.component';

@Component({
  selector: 'passkey-manager',
  standalone: true,
  imports: [CommonModule, RegisterPasskeyButtonComponent, PasskeyListComponent],
  template: `
    <section class="pk-manager">
      <header class="pk-manager-header">
        <h3 class="pk-manager-title">{{ title }}</h3>
        <register-passkey-button
          [label]="registerLabel"
          [loadingLabel]="registerLoadingLabel"
          [disabled]="disabled"
          (success)="onRegistered()"
        />
      </header>

      <passkey-list
        #passkeyList
        [disabled]="disabled"
        [emptyLabel]="emptyLabel"
        [refreshLabel]="refreshLabel"
        [removeLabel]="removeLabel"
      />
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .pk-manager {
        background: var(--pk-surface-soft, #f8fafc);
        border-radius: var(--pk-radius-lg, 8px);
        box-shadow: var(--pk-shadow-soft, 0 1px 2px rgba(15, 23, 42, 0.06));
        display: grid;
        gap: 1rem;
        padding: 1rem;
      }

      .pk-manager-header {
        align-items: center;
        display: flex;
        gap: 0.75rem;
        justify-content: space-between;
      }

      .pk-manager-title {
        color: var(--pk-text-strong, #1f2937);
        font-size: 1rem;
        font-weight: 600;
        margin: 0;
      }
    `
  ]
})
export class PasskeyManagerComponent {
  @Input() title = 'Your Passkeys';
  @Input() registerLabel = 'Register Passkey';
  @Input() registerLoadingLabel = 'Registering...';
  @Input() refreshLabel = 'Refresh';
  @Input() removeLabel = 'Remove';
  @Input() emptyLabel = 'No passkeys registered yet.';
  @Input() disabled = false;

  @ViewChild('passkeyList') private passkeyList?: PasskeyListComponent;

  onRegistered(): void {
    void this.passkeyList?.refresh();
  }
}
