import { initializeApp } from 'https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js';
import {
  browserLocalPersistence,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signOut
} from 'https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js';

const firebaseConfig = {
  apiKey: 'AIzaSyCz6bAcN9kCvU6Fp822wq_W9Jc4hfupS48',
  authDomain: 'picture-connect-with-kapil.firebaseapp.com',
  projectId: 'picture-connect-with-kapil',
  storageBucket: 'picture-connect-with-kapil.firebasestorage.app',
  messagingSenderId: '461344041752',
  appId: '1:461344041752:web:be01873e0d4eff25d04c6d'
};

try {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  await setPersistence(auth, browserLocalPersistence);

  window.firebaseSignInWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    return signInWithPopup(auth, provider);
  };
  window.firebaseSignOut = () => signOut(auth);

  onAuthStateChanged(auth, user => {
    window.handleFirebaseAuthState?.(user ? {
      uid: user.uid,
      displayName: user.displayName || user.email?.split('@')[0] || 'Learner',
      email: user.email || '',
      photoURL: user.photoURL || ''
    } : null);
  }, error => window.handleFirebaseAuthError?.(error));
} catch (error) {
  window.handleFirebaseAuthError?.(error);
}
