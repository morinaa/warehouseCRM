import { create } from 'zustand';
import type { Activity } from '../types';

type UiState = {
  // Global search from top bar
  globalSearch: string;
  setGlobalSearch: (value: string) => void;

  // Filters
  retailerSearch: string;
  setRetailerSearch: (value: string) => void;
  accountSearch: string;
  setAccountSearch: (value: string) => void;
  activityFilter: Activity['type'] | 'all';
  setActivityFilter: (value: Activity['type'] | 'all') => void;

  // Order modal / quick-create
  orderModalOpen: boolean;
  orderModalStatusId?: string;
  openOrderModal: (statusId?: string) => void;
  closeOrderModal: () => void;
};

export const useUiStore = create<UiState>((set) => ({
  globalSearch: '',
  setGlobalSearch: (value) => set({ globalSearch: value }),

  retailerSearch: '',
  setRetailerSearch: (value) => set({ retailerSearch: value }),
  accountSearch: '',
  setAccountSearch: (value) => set({ accountSearch: value }),
  activityFilter: 'all',
  setActivityFilter: (value) => set({ activityFilter: value }),

  orderModalOpen: false,
  orderModalStatusId: undefined,
  openOrderModal: (statusId) => set({ orderModalOpen: true, orderModalStatusId: statusId }),
  closeOrderModal: () => set({ orderModalOpen: false, orderModalStatusId: undefined }),
}));
