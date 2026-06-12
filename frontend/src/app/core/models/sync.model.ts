export interface ProviderStatus {
  provider: string;
  configured: boolean;
}

export interface SyncResult {
  created: number;
  updated: number;
  skipped: number;
}
