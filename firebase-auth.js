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
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getFirestore,
  initializeFirestore,
  onSnapshot,
  orderBy,
  persistentLocalCache,
  persistentMultipleTabManager,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  Timestamp
} from 'https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js';

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
  try {
    await setPersistence(auth, browserLocalPersistence);
  } catch (error) {
    console.warn('Could not enable persistent Google sign-in in this browser; continuing with Firebase defaults.', error);
  }

  let db;
  try {
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
    });
  } catch (error) {
    console.warn('Firestore offline persistence unavailable; using the default cache.', error);
    db = getFirestore(app);
  }

  window.firebaseSignInWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    return signInWithPopup(auth, provider);
  };
  window.firebaseSignOut = () => signOut(auth);
  window.firebaseLoadLearner = async uid => {
    const snapshot = await getDoc(doc(db, 'learners', uid));
    return snapshot.exists() ? snapshot.data() : null;
  };
  window.firebaseSaveLearner = (uid, record) => setDoc(doc(db, 'learners', uid), {
    ...record,
    updatedAt: serverTimestamp()
  }, { merge: true });
  window.firebaseWatchLearnerLock = (uid, callback, onError) => onSnapshot(
    doc(db, 'learnerLocks', uid),
    snapshot => callback(snapshot.exists() ? snapshot.data() : null),
    onError
  );
  window.firebaseWatchAdminData = (onLearners, onLocks, onSessions, onError) => {
    const learnerUnsubscribe = onSnapshot(
      query(collection(db, 'learners'), orderBy('updatedAt', 'desc')),
      snapshot => onLearners(snapshot.docs.map(item => ({ id: item.id, ...item.data() }))),
      onError
    );
    const locksUnsubscribe = onSnapshot(
      collection(db, 'learnerLocks'),
      snapshot => onLocks(snapshot.docs.map(item => ({ id: item.id, ...item.data() }))),
      onError
    );
    const sessionsUnsubscribe = onSnapshot(
      query(collection(db, 'loginSessions'), orderBy('lastSeenAt', 'desc')),
      snapshot => onSessions(snapshot.docs.map(item => ({ id: item.id, ...item.data() }))),
      onError
    );
    return () => { learnerUnsubscribe(); locksUnsubscribe(); sessionsUnsubscribe(); };
  };
  let activeLoginSession = null;
  let loginHeartbeat = null;
  let refreshSessionOnVisibility = null;
  window.firebaseStartLearnerSession = async uid => {
    if (loginHeartbeat) clearInterval(loginHeartbeat);
    if (refreshSessionOnVisibility) document.removeEventListener('visibilitychange', refreshSessionOnVisibility);
    let sessionToken;
    try {
      sessionToken = sessionStorage.getItem('jietPlacementSessionId');
      if (!sessionToken) {
        sessionToken = crypto.randomUUID();
        sessionStorage.setItem('jietPlacementSessionId', sessionToken);
      }
    } catch {
      sessionToken = crypto.randomUUID();
    }
    activeLoginSession = doc(db, 'loginSessions', `${uid}_${sessionToken}`);
    const heartbeat = () => setDoc(activeLoginSession, {
      uid,
      sessionId: sessionToken,
      lastSeenAt: serverTimestamp(),
      signedOutAt: null,
      updatedAt: serverTimestamp()
    }, { merge: true });
    await setDoc(activeLoginSession, {
      uid,
      sessionId: sessionToken,
      signedInAt: serverTimestamp(),
      lastSeenAt: serverTimestamp(),
      signedOutAt: null,
      updatedAt: serverTimestamp()
    }, { merge: true });
    loginHeartbeat = setInterval(() => heartbeat().catch(error => console.warn('Learner activity heartbeat failed:', error?.code || error)), 45000);
    refreshSessionOnVisibility = () => {
      if (document.visibilityState === 'visible') heartbeat().catch(error => console.warn('Learner activity refresh failed:', error?.code || error));
    };
    document.addEventListener('visibilitychange', refreshSessionOnVisibility);
  };
  window.firebaseEndLearnerSession = async () => {
    if (loginHeartbeat) clearInterval(loginHeartbeat);
    loginHeartbeat = null;
    if (refreshSessionOnVisibility) document.removeEventListener('visibilitychange', refreshSessionOnVisibility);
    refreshSessionOnVisibility = null;
    if (!activeLoginSession) return;
    const sessionRef = activeLoginSession;
    activeLoginSession = null;
    await updateDoc(sessionRef, { lastSeenAt: serverTimestamp(), signedOutAt: serverTimestamp(), updatedAt: serverTimestamp() });
  };
  window.firebaseLockLearner = (uid, untilMillis, reason, source = 'proctor') => setDoc(doc(db, 'learnerLocks', uid), {
    uid,
    until: Timestamp.fromMillis(untilMillis),
    reason: String(reason || '').slice(0, 300),
    source,
    updatedBy: auth.currentUser?.uid || '',
    updatedAt: serverTimestamp()
  }, { merge: true });
  window.firebaseUnlockLearner = async (uid, reason = '') => {
    await deleteDoc(doc(db, 'learnerLocks', uid));
    await addDoc(collection(db, 'adminAudit'), {
      action: 'unlock_profile',
      learnerUid: uid,
      reason: String(reason || '').slice(0, 300),
      adminUid: auth.currentUser?.uid || '',
      createdAt: serverTimestamp()
    });
  };
  window.firebaseAdminLockLearner = async (uid, untilMillis, reason = '') => {
    await setDoc(doc(db, 'learnerLocks', uid), {
      uid,
      until: Timestamp.fromMillis(untilMillis),
      reason: String(reason || '').slice(0, 300),
      source: 'admin',
      updatedBy: auth.currentUser?.uid || '',
      updatedAt: serverTimestamp()
    }, { merge: true });
    await addDoc(collection(db, 'adminAudit'), {
      action: 'lock_profile',
      learnerUid: uid,
      reason: String(reason || '').slice(0, 300),
      adminUid: auth.currentUser?.uid || '',
      createdAt: serverTimestamp()
    });
  };

  onAuthStateChanged(auth, user => {
    if (!user) {
      window.handleFirebaseAuthState?.(null);
      return;
    }
    window.handleFirebaseAuthState?.({
      uid: user.uid,
      displayName: user.displayName || user.email?.split('@')[0] || 'Learner',
      email: user.email || '',
      photoURL: user.photoURL || '',
      isAdmin: user.emailVerified === true && user.email?.toLowerCase() === 'kapilnarula27july@gmail.com'
    });
  }, error => window.handleFirebaseAuthError?.(error));
} catch (error) {
  window.handleFirebaseAuthError?.(error);
}
