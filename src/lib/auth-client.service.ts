import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, distinctUntilChanged, map } from 'rxjs';
import Keycloak, {
  KeycloakInitOptions,
  KeycloakLoginOptions,
  KeycloakLogoutOptions,
  KeycloakProfile
} from 'keycloak-js';
import { arrayBufferToBase64Url, base64UrlToArrayBuffer } from './base64url';
import { AUTH_CLIENT_CONFIG } from './auth-client.config';
import {
  AuthActionResult,
  AuthPasskeyChallengeResponse,
  AuthPasskeyCredentialSummary,
  AuthState,
  AuthUser
} from './auth-client.models';

interface PasskeyCredentialResponse {
  id?: string;
  name?: string;
  userLabel?: string;
  createdDate?: number;
}

interface AccountCredentialTypeResponse {
  type?: string;
  userCredentialMetadatas?: Array<{ credential?: PasskeyCredentialResponse }>;
}

const PASSKEY_CREDENTIAL_TYPES = new Set(['webauthn-passwordless', 'webauthn']);

const INITIAL_STATE: AuthState = {
  authenticated: false,
  ready: false,
  loading: false,
  user: null,
  userName: null,
  error: null
};

@Injectable({ providedIn: 'root' })
export class AuthClientService {
  private readonly config = inject(AUTH_CLIENT_CONFIG);
  private keycloak = this.createKeycloak();
  private readonly stateSubject = new BehaviorSubject<AuthState>(INITIAL_STATE);

  readonly state$ = this.stateSubject.asObservable();
  readonly user$ = this.state$.pipe(map((state) => state.user), distinctUntilChanged());
  readonly authenticated$ = this.state$.pipe(
    map((state) => state.authenticated),
    distinctUntilChanged()
  );

  get state(): AuthState {
    return this.stateSubject.value;
  }

  get user(): AuthUser | null {
    return this.state.user;
  }

  async init(): Promise<boolean> {
    this.setPartialState({ loading: true, error: null });

    try {
      this.keycloak = this.createKeycloak();
      const authenticated = await this.keycloak.init(this.checkSsoOptions);
      const user = authenticated ? await this.resolveUser() : null;

      this.setState({
        authenticated,
        ready: true,
        loading: false,
        user,
        userName: user?.username ?? null,
        error: null
      });
      return authenticated;
    } catch (error) {
      this.setState({
        authenticated: false,
        ready: true,
        loading: false,
        user: null,
        userName: null,
        error: this.errorMessage(error, 'Keycloak initialization failed')
      });
      return false;
    }
  }

  login(options?: KeycloakLoginOptions): Promise<void> {
    return this.loginWithPassword(options);
  }

  loginWithPassword(options?: KeycloakLoginOptions): Promise<void> {
    this.setPartialState({ loading: true, error: null });
    return this.keycloak.login({
      redirectUri: this.currentUrl(),
      ...options
    });
  }

  logout(options?: KeycloakLogoutOptions): Promise<void> {
    this.setPartialState({ loading: true, error: null });
    return this.keycloak.logout(options);
  }

  async refreshAuthState(): Promise<boolean> {
    this.setPartialState({ loading: true, error: null });

    try {
      const refreshedClient = this.createKeycloak();
      const authenticated = await refreshedClient.init(this.checkSsoOptions);

      this.keycloak = refreshedClient;
      const user = authenticated ? await this.resolveUser() : null;
      this.setState({
        authenticated,
        ready: true,
        loading: false,
        user,
        userName: user?.username ?? null,
        error: null
      });
      return authenticated;
    } catch (error) {
      this.setState({
        ...this.state,
        authenticated: false,
        loading: false,
        user: null,
        userName: null,
        error: this.errorMessage(error, 'Unable to refresh auth state')
      });
      return false;
    }
  }

  async refreshToken(minValiditySeconds = 30): Promise<boolean> {
    if (!this.keycloak.authenticated) {
      return false;
    }

    try {
      const refreshed = await this.keycloak.updateToken(minValiditySeconds);
      await this.loadUserData();
      return refreshed;
    } catch (error) {
      this.setPartialState({
        loading: false,
        error: this.errorMessage(error, 'Token refresh failed')
      });
      return false;
    }
  }

  async loadUserData(): Promise<AuthUser | null> {
    if (!this.keycloak.authenticated) {
      this.setState({
        ...this.state,
        authenticated: false,
        loading: false,
        user: null,
        userName: null,
        error: null
      });
      return null;
    }

    try {
      const user = await this.resolveUser();
      this.setState({
        ...this.state,
        authenticated: true,
        ready: true,
        loading: false,
        user,
        userName: user?.username ?? null,
        error: null
      });
      return user;
    } catch (error) {
      this.setPartialState({
        loading: false,
        error: this.errorMessage(error, 'Unable to load user data')
      });
      return null;
    }
  }

  async registerPasskey(): Promise<AuthActionResult> {
    this.requireBrowserApi();
    if (!this.keycloak.authenticated || !this.keycloak.tokenParsed) {
      throw new Error('User must be logged in before creating a passkey.');
    }

    const challengePayload = await this.fetchChallenge();
    const claims = this.keycloak.tokenParsed;
    const accountId = String(
      claims.sub ?? claims.preferred_username ?? claims.email ?? this.keycloak.subject ?? ''
    );
    const accountName = String(claims.preferred_username ?? claims.email ?? claims.sub ?? '');
    const displayName = String(claims.name ?? claims.preferred_username ?? accountName);

    if (!accountId || !accountName) {
      throw new Error('Missing user identity claims for passkey registration.');
    }

    const userIdBytes = new TextEncoder().encode(accountId).slice(0, 64);
    const creationResult = (await navigator.credentials.create({
      publicKey: {
        challenge: base64UrlToArrayBuffer(challengePayload.challenge),
        rp: {
          name: this.config.passkey?.rpName ?? 'Keycloak App',
          id: window.location.hostname
        },
        user: {
          id: userIdBytes,
          name: accountName,
          displayName
        },
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
        authenticatorSelection: {
          userVerification: this.config.passkey?.userVerification ?? 'preferred',
          residentKey: 'required'
        },
        attestation: 'none'
      }
    })) as PublicKeyCredential | null;

    const response = creationResult?.response as AuthenticatorAttestationResponse | undefined;
    if (!creationResult?.rawId || !response?.clientDataJSON || !response?.attestationObject) {
      throw new Error('Passkey registration returned an incomplete credential.');
    }

    const savePayload = {
      credentialId: arrayBufferToBase64Url(creationResult.rawId),
      rawId: arrayBufferToBase64Url(creationResult.rawId),
      clientDataJSON: arrayBufferToBase64Url(response.clientDataJSON),
      attestationObject: arrayBufferToBase64Url(response.attestationObject),
      challenge: challengePayload.challenge
    };

    const saveResponse = await fetch(this.passkeyEndpoint('save'), {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.keycloak.token}`
      },
      body: JSON.stringify(savePayload)
    });

    if (!saveResponse.ok) {
      throw new Error((await saveResponse.text()) || 'Failed to store passkey');
    }

    return { success: true, message: 'Passkey created.' };
  }

  async loginWithPasskey(): Promise<AuthActionResult> {
    this.requireBrowserApi();

    const challengePayload = await this.fetchChallenge();
    const assertionResult = (await navigator.credentials.get({
      publicKey: {
        challenge: base64UrlToArrayBuffer(challengePayload.challenge),
        ...(challengePayload.credentialId
          ? {
              allowCredentials: [
                {
                  type: 'public-key',
                  id: base64UrlToArrayBuffer(challengePayload.credentialId)
                }
              ]
            }
          : {}),
        userVerification: this.config.passkey?.userVerification ?? 'preferred'
      }
    })) as PublicKeyCredential | null;

    const response = assertionResult?.response as AuthenticatorAssertionResponse | undefined;
    if (
      !assertionResult?.rawId ||
      !response?.clientDataJSON ||
      !response?.authenticatorData ||
      !response?.signature
    ) {
      throw new Error('Passkey authentication returned an incomplete assertion.');
    }

    const authenticateResponse = await fetch(this.passkeyEndpoint('authenticate'), {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        credentialId: arrayBufferToBase64Url(assertionResult.rawId),
        rawId: arrayBufferToBase64Url(assertionResult.rawId),
        clientDataJSON: arrayBufferToBase64Url(response.clientDataJSON),
        authenticatorData: arrayBufferToBase64Url(response.authenticatorData),
        signature: arrayBufferToBase64Url(response.signature),
        challenge: challengePayload.challenge
      })
    });

    if (!authenticateResponse.ok) {
      const payload = await this.parseJsonResponse<{ error?: string }>(authenticateResponse, {});
      throw new Error(payload.error ?? 'Passkey authentication failed');
    }

    const authenticated = await this.refreshAuthState();
    if (!authenticated) {
      throw new Error('Session cookie was not accepted by Keycloak check-sso');
    }

    return { success: true, message: 'Authenticated with passkey.' };
  }

  async listPasskeys(): Promise<AuthPasskeyCredentialSummary[]> {
    if (!this.keycloak.authenticated || !this.keycloak.token) {
      return [];
    }

    const response = await fetch(this.accountCredentialsEndpoint(), {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${this.keycloak.token}`
      }
    });
    const payload = await this.parseJsonResponse<unknown>(response, []);

    if (!response.ok) {
      throw new Error('Failed to load passkeys');
    }

    const mappedCredentials = Array.isArray(payload)
      ? this.parseCredentialTypes(payload as AccountCredentialTypeResponse[])
      : this.parseCredentialPayload(payload);

    return mappedCredentials.map((credential) => ({
      id: credential.id ?? '',
      name: credential.name ?? credential.userLabel ?? 'Passkey',
      createdDate: credential.createdDate ?? null
    }));
  }

  async deletePasskey(credentialId: string): Promise<void> {
    if (!credentialId || !this.keycloak.token) {
      return;
    }
    const response = await fetch(`${this.accountCredentialsEndpoint()}/${encodeURIComponent(credentialId)}`, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${this.keycloak.token}`
      }
    });
    if (!response.ok) {
      throw new Error('Failed to delete passkey');
    }
  }

  get authenticated(): boolean {
    return Boolean(this.keycloak.authenticated);
  }

  get accessToken(): string | undefined {
    return this.keycloak.token;
  }

  get keycloakClient(): Keycloak {
    return this.keycloak;
  }

  private createKeycloak(): Keycloak {
    return new Keycloak({
      url: this.config.keycloak.url,
      realm: this.config.keycloak.realm,
      clientId: this.config.keycloak.clientId
    });
  }

  private get checkSsoOptions(): KeycloakInitOptions {
    return {
      onLoad: 'check-sso',
      pkceMethod: 'S256',
      silentCheckSsoRedirectUri: this.config.checkSso?.redirectUri,
      silentCheckSsoFallback: this.config.checkSso?.silentFallback ?? false
    };
  }

  private passkeyEndpoint(path: string): string {
    return this.realmEndpoint(`passkey/${String(path).replace(/^\/+/, '')}`);
  }

  private accountCredentialsEndpoint(): string {
    return this.realmEndpoint('account/credentials');
  }

  private realmEndpoint(path: string): string {
    return new URL(
      `/realms/${encodeURIComponent(this.config.keycloak.realm)}/${String(path).replace(/^\/+/, '')}`,
      this.config.keycloak.url
    ).toString();
  }

  private async fetchChallenge(): Promise<AuthPasskeyChallengeResponse> {
    const challengeResponse = await fetch(this.passkeyEndpoint('challenge'), {
      credentials: 'include'
    });
    const challengePayload = await this.parseJsonResponse<AuthPasskeyChallengeResponse>(challengeResponse, {
      challenge: ''
    });
    if (!challengeResponse.ok || !challengePayload.challenge) {
      throw new Error('Failed to fetch passkey challenge');
    }
    return challengePayload;
  }

  private async resolveUser(): Promise<AuthUser | null> {
    const claims = this.tokenClaims();
    const profile = this.keycloak.authenticated
      ? await this.keycloak.loadUserProfile().catch(() => null)
      : null;

    return this.buildUser(claims, profile);
  }

  private buildUser(claims: Record<string, unknown>, profile: KeycloakProfile | null): AuthUser | null {
    const username =
      this.readString(claims['preferred_username']) ??
      profile?.username ??
      profile?.email ??
      this.readString(claims['email']);
    if (!username) {
      return null;
    }

    const id = this.readString(claims['sub']) ?? profile?.id ?? username;
    const firstName = this.readString(claims['given_name']) ?? profile?.firstName ?? null;
    const lastName = this.readString(claims['family_name']) ?? profile?.lastName ?? null;
    const email = this.readString(claims['email']) ?? profile?.email ?? null;
    const claimsName = this.readString(claims['name']);
    const combinedName = [firstName, lastName].filter((value): value is string => Boolean(value)).join(' ');
    const name = claimsName ?? (combinedName.trim() || null);

    return {
      id,
      username,
      email,
      name,
      firstName,
      lastName,
      roles: this.extractRoles(claims),
      claims
    };
  }

  private extractRoles(claims: Record<string, unknown>): string[] {
    const roles = new Set<string>();

    const realmAccess = claims['realm_access'];
    if (realmAccess && typeof realmAccess === 'object') {
      const realmRoles = this.asStringArray((realmAccess as { roles?: unknown }).roles);
      for (const role of realmRoles) {
        roles.add(role);
      }
    }

    const resourceAccess = claims['resource_access'];
    if (resourceAccess && typeof resourceAccess === 'object') {
      for (const resource of Object.values(resourceAccess as Record<string, unknown>)) {
        if (resource && typeof resource === 'object') {
          const resourceRoles = this.asStringArray((resource as { roles?: unknown }).roles);
          for (const role of resourceRoles) {
            roles.add(role);
          }
        }
      }
    }

    return [...roles];
  }

  private tokenClaims(): Record<string, unknown> {
    const tokenParsed = this.keycloak.tokenParsed;
    if (!tokenParsed || typeof tokenParsed !== 'object') {
      return {};
    }
    return tokenParsed as Record<string, unknown>;
  }

  private asStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }
    return value.filter((item): item is string => typeof item === 'string' && item.length > 0);
  }

  private readString(value: unknown): string | null {
    if (typeof value !== 'string') {
      return null;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private parseCredentialTypes(payload: AccountCredentialTypeResponse[]): PasskeyCredentialResponse[] {
    return payload.flatMap((credentialType) => {
      const type = String(credentialType.type ?? '').toLowerCase();
      if (!PASSKEY_CREDENTIAL_TYPES.has(type)) {
        return [];
      }
      const metadatas = Array.isArray(credentialType.userCredentialMetadatas)
        ? credentialType.userCredentialMetadatas
        : [];
      return metadatas.map((metadata) => metadata.credential).filter(Boolean) as PasskeyCredentialResponse[];
    });
  }

  private parseCredentialPayload(payload: unknown): PasskeyCredentialResponse[] {
    if (
      payload &&
      typeof payload === 'object' &&
      Array.isArray((payload as { credentials?: PasskeyCredentialResponse[] }).credentials)
    ) {
      return (payload as { credentials: PasskeyCredentialResponse[] }).credentials;
    }
    return [];
  }

  private async parseJsonResponse<T>(response: Response, fallbackValue: T): Promise<T> {
    return (await response.json().catch(() => fallbackValue)) as T;
  }

  private setState(next: AuthState): void {
    this.stateSubject.next(next);
  }

  private setPartialState(next: Partial<AuthState>): void {
    this.setState({
      ...this.state,
      ...next
    });
  }

  private currentUrl(): string {
    return typeof window === 'undefined' ? '/' : window.location.href;
  }

  private errorMessage(error: unknown, fallback: string): string {
    if (error instanceof Error && error.message) {
      return error.message;
    }
    return fallback;
  }

  private requireBrowserApi(): void {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      throw new Error('Passkey flows require a browser environment.');
    }
  }
}
