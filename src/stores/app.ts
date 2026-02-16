import { createStore } from 'zustand/vanilla';

export interface IAppStore {
  isMobile: boolean;
  isDrawerOpened: boolean;
  setIsDrawerOpened: (isDrawerOpened: boolean) => void;
  currentRoute: string;
  setCurrentRoute: (route: string) => void;
  checkout: any;
  setCheckout: (checkout: any) => void;
  fetchedTabs: string[];
  setFetchedTabs: (tab: string) => void;
  maintenanceMode: boolean;
  setMaintenanceMode: (maintenanceMode: boolean) => void;
}

const isMobile = () => {
  return !matchMedia('(min-width: 769px)').matches;
}

const store = createStore<IAppStore>(set => ({
  isMobile: isMobile(),
  isDrawerOpened: false,
  setIsDrawerOpened: (isDrawerOpened: boolean) => set(() => { return { isDrawerOpened } }),
  currentRoute: location.pathname,
  setCurrentRoute: (route: string) => set(() => { return { currentRoute: route } }),
  checkout: {},
  setCheckout: (checkout: any) => set(() => { return { checkout } }),
  fetchedTabs: [],
  setFetchedTabs: (tab) => set((state) => { return { fetchedTabs: [...state.fetchedTabs, tab]} }),
  maintenanceMode: false,
  setMaintenanceMode: (maintenanceMode: boolean) => { return { maintenanceMode }}
}));

window.addEventListener('resize', () => {
  store.setState({ isMobile: isMobile() });
});

window.addEventListener('kemet-drawer-closed', () => {
  store.setState({ isDrawerOpened: false });
});

export default store;
