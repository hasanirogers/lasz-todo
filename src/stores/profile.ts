import { createStore } from 'zustand/vanilla';
import appStore from './app';
import { type IProfile } from '../shared/interfaces';

export interface IProfileStore {
  profile: IProfile;
  updateProfile: (profile: IProfile) => void;
  isLoggedIn: boolean;
  logout: () => void;
}

const getProfile = async () => {
  const options = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  };

  try {
    const userProfile = await fetch(`/api/profile/me`, options)
      .then((response) => response.json());
    if (userProfile) {
      return userProfile;
    }
  } catch (error) {
    console.log(error);
    // the api has failed turn on maintenance mode
    appStore.setState({ maintenanceMode: true });
  }

  return;
}

const isLoggedIn = async () => await fetch('/api/auth/authorized').then(response => response.json());
const isLoggedInResponse = await isLoggedIn();

const profileResponse = isLoggedInResponse ? await getProfile() : null;

const getAvatar = profileResponse
  ? async () => await fetch(`/api/profile/avatar?filePath=${profileResponse.avatar ? profileResponse.avatar : ''}`).then(response => response.json())
  : null;
const avatarResponse = getAvatar ? await getAvatar() : null;

const store = createStore<IProfileStore>(set => ({
  profile: { ...profileResponse, avatar: avatarResponse },
  updateProfile: (profile: IProfile) => set(() => { return { profile } }),
  isLoggedIn: isLoggedInResponse,
  logout: async () => {
    await fetch(`/api/auth/logout`);
    window.location.href = "/";
  }
}));

export default store;
