import {
  AuthResponseDto,
  RegisterDto,
  LoginDto,
  FranchiseTreeResponse,
  AddLibraryEntryDto,
  UpdateProgressDto,
  QuickTrackerWidgetData,
  ResolveConflictDto,
  SyncMutationEvent,
  UserLibrary,
  Franchise,
  Media
} from '@anivault/shared-types';

export interface ClientConfig {
  baseUrl: string;
  getAccessToken?: () => string | null;
  onUnauthorized?: () => void;
}

export class AniVaultApiClient {
  private baseUrl: string;
  private getAccessToken?: () => string | null;
  private onUnauthorized?: () => void;

  constructor(config: ClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.getAccessToken = config.getAccessToken;
    this.onUnauthorized = config.onUnauthorized;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>)
    };

    const token = this.getAccessToken?.();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (response.status === 401) {
      this.onUnauthorized?.();
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      let errorMessage = `HTTP error ${response.status}`;
      try {
        const errorJson = await response.json();
        if (errorJson.message) errorMessage = errorJson.message;
      } catch {
        // ignore parse error
      }
      throw new Error(errorMessage);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  // --- Auth Endpoints ---
  public register(dto: RegisterDto): Promise<AuthResponseDto> {
    return this.request<AuthResponseDto>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(dto)
    });
  }

  public login(dto: LoginDto): Promise<AuthResponseDto> {
    return this.request<AuthResponseDto>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(dto)
    });
  }

  public getMe(): Promise<any> {
    return this.request('/api/v1/users/me');
  }

  // --- Franchises & Media Endpoints ---
  public getFranchises(page = 1, search = ''): Promise<{ data: Franchise[]; total: number }> {
    const params = new URLSearchParams({ page: page.toString(), search });
    return this.request(`/api/v1/franchises?${params}`);
  }

  public getFranchiseTree(franchiseId: string): Promise<FranchiseTreeResponse> {
    return this.request(`/api/v1/franchises/${franchiseId}`);
  }

  public getMediaList(params: Record<string, string> = {}): Promise<{ data: Media[]; total: number }> {
    const query = new URLSearchParams(params);
    return this.request(`/api/v1/media?${query}`);
  }

  public getMediaById(id: string): Promise<Media> {
    return this.request(`/api/v1/media/${id}`);
  }

  // --- Library & Progress Endpoints ---
  public getLibrary(params: Record<string, string> = {}): Promise<{ data: UserLibrary[]; total: number }> {
    const query = new URLSearchParams(params);
    return this.request(`/api/v1/library?${query}`);
  }

  public addToLibrary(dto: AddLibraryEntryDto): Promise<UserLibrary> {
    return this.request('/api/v1/library', {
      method: 'POST',
      body: JSON.stringify(dto)
    });
  }

  public updateProgress(libraryId: string, dto: UpdateProgressDto): Promise<UserLibrary> {
    return this.request(`/api/v1/library/${libraryId}/progress`, {
      method: 'PATCH',
      body: JSON.stringify(dto)
    });
  }

  public quickIncrement(libraryId: string, delta = 1): Promise<UserLibrary> {
    return this.request(`/api/v1/library/${libraryId}/quick-increment`, {
      method: 'POST',
      body: JSON.stringify({ delta })
    });
  }

  // --- Widget Direct Endpoints ---
  public getQuickTrackerWidgetData(): Promise<QuickTrackerWidgetData[]> {
    return this.request('/api/v1/widgets/quick-tracker');
  }

  // --- Sync Endpoints ---
  public submitSyncEvents(events: SyncMutationEvent[]): Promise<{ processed: number }> {
    return this.request('/api/v1/sync/events/batch', {
      method: 'POST',
      body: JSON.stringify({ events })
    });
  }

  public getConflicts(): Promise<any[]> {
    return this.request('/api/v1/sync/conflicts');
  }

  public resolveConflict(dto: ResolveConflictDto): Promise<{ success: boolean }> {
    return this.request('/api/v1/sync/conflicts/resolve', {
      method: 'POST',
      body: JSON.stringify(dto)
    });
  }

  // --- Import / Export Endpoints ---
  public exportJson(): Promise<any> {
    return this.request('/api/v1/export/json');
  }

  public importJson(payload: any): Promise<{ importJobId: string; totalRecords: number }> {
    return this.request('/api/v1/import/json', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  // --- Statistics ---
  public getStats(): Promise<any> {
    return this.request('/api/v1/stats/overview');
  }
}

