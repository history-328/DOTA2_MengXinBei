import cloudbase from '@cloudbase/js-sdk';

const app = cloudbase.init({
  env: 'mengxinbei-d4g6ktzi5f81d41cf',
  region: 'ap-shanghai'
});

export const db = app.database();

export const auth = app.auth({
  persistence: 'local'
});

export const signInAnonymously = async () => {
  try {
    const loginState = await auth.getLoginState();
    if (!loginState) {
      await auth.anonymousAuthProvider().signIn();
      console.log('TCB Auth successful');
    }
  } catch (error) {
    console.warn('TCB Auth failed, continuing without auth', error);
  }
};
