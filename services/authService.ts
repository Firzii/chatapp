import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth';
import { auth } from '../firebase';

const USER_KEY = '@user_session';

export const register = async (email: string, password: string) => {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password,
  );
  await saveUserSession(userCredential.user);
  return userCredential.user;
};

export const login = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password,
  );
  await saveUserSession(userCredential.user);
  return userCredential.user;
};

export const logout = async () => {
  await signOut(auth);
  await AsyncStorage.removeItem(USER_KEY);
};

export const saveUserSession = async (user: User) => {
  await AsyncStorage.setItem(
    USER_KEY,
    JSON.stringify({
      uid: user.uid,
      email: user.email,
    }),
  );
};

export const getUserSession = async () => {
  const data = await AsyncStorage.getItem(USER_KEY);
  return data ? JSON.parse(data) : null;
};
