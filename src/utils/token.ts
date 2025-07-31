import { STORAGE } from '@/constants/storage';
import Cookies from 'js-cookie';


type Token = {
  accessToken?: string;
  refreshToken?: string;
};

type TokenMethod = {
  get: () => Token;
  set: (token: Token) => void;
  remove: () => void;
};

// LocalStorage
export const localToken: TokenMethod = {
  get: () => {
    const item = localStorage.getItem(STORAGE.token);
    return item ? JSON.parse(item) : null;
  },
  set: (token) => localStorage.setItem(STORAGE.token, JSON.stringify(token)),
  remove: () => localStorage.removeItem(STORAGE.token),
};

// Cookies
export const cookieToken: TokenMethod = {
  get: () => {
    const cookie = Cookies.get(STORAGE.token);
    return cookie ? JSON.parse(cookie) : null;
  },
  set: (token) => Cookies.set(STORAGE.token, JSON.stringify(token)),
  remove: () => Cookies.remove(STORAGE.token),
};

const tokenMethod: TokenMethod = {
  get: () => {
    // return localToken.get()
    return cookieToken.get();
  },
  set: (token) => {
    console.log("token", token);
    // localToken.set(token)
    cookieToken.set(token);
  },
  remove: () => {
    // localToken.remove();
    cookieToken.remove();
  },
};

export default tokenMethod;
