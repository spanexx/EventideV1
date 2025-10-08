import { Provider } from '../../provider-search/services/provider.service';

export interface ProvidersState {
  allProviders: Provider[];
  loading: boolean;
  error: string | null;
  lastFetched: number;
}

export const initialProvidersState: ProvidersState = {
  allProviders: [],
  loading: false,
  error: null,
  lastFetched: 0
};
