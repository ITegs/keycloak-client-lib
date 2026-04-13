export interface AuthClientConfig {
  keycloak: {
    url: string;
    realm: string;
    clientId: string;
  };
  checkSso?: {
    redirectUri: string;
    silentFallback?: boolean;
  };
  passkey?: {
    rpName?: string;
    userVerification?: UserVerificationRequirement;
    showSetupPromptAfterLogin?: boolean;
  };
}

export interface AuthUser {
  id: string;
  username: string;
  email: string | null;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  roles: string[];
  claims: Record<string, unknown>;
}

export interface AuthState {
  authenticated: boolean;
  ready: boolean;
  loading: boolean;
  user: AuthUser | null;
  userName: string | null;
  error: string | null;
}

export interface AuthActionResult {
  success: boolean;
  message?: string;
}

export interface AuthPasskeyCredentialSummary {
  id: string;
  name: string;
  createdDate?: number | null;
}

export interface AuthPasskeyChallengeResponse {
  challenge: string;
  credentialId?: string | null;
}
