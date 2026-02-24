import AsyncStorage from '@react-native-async-storage/async-storage';

export const getToken = async () => {
  try {
    return await AsyncStorage.getItem('auth_token');
  } catch (e) {
    return null;
  }
};

export const saveToken = async (token: string) => {
  try {
    await AsyncStorage.setItem('auth_token', token);
  } catch (e) {
    console.error('Error saving token', e);
  }
};

export const removeToken = async () => {
  try {
    await AsyncStorage.removeItem('auth_token');
  } catch (e) {
    console.error('Error removing token', e);
  }
};
