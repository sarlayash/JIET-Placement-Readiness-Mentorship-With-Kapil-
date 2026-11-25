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
  get,
  getDatabase,
  onDisconnect,
  onValue,
  push,
  ref,
  serverTimestamp,
  set,
  update
} from 'https://www.gstatic.com/firebasejs/13.4.0/firebase-database.js';

const firebaseConfig = {
  apiKey: 'AIzaSyCz6bAcN9kCvU6Fp822wq_W9Jc4hfupS48',
  authDomain: 'picture-connect-with-kapil.firebaseapp.com',
  databaseURL: 'https://picture-connect-with-kapil-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'picture-connect-with-kapil',
  storageBucket: 'picture-connect-with-kapil.firebasestorage.app',
  messagingSenderId: '461344041752',
  appId: '1:461344041752:web:be01873e0d4eff25d04c6d'
};

try {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getDatabase(app);
  try {
    await setPersistence(auth, browserLocalPersistence);
  } catch (error) {
    console.warn('Could not enable persistent Google sign-in in this browser; continuing with Firebase defaults.', error);
  }

  const isAdminUser = user => user?.emailVerified === true
    && user.email?.toLowerCase() === 'kapilnarula27july@gmail.com';
  const asRecords = value => Object.entries(value || {}).map(([id, record]) => ({ id, ...record }));

  window.firebaseSignInWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    return signInWithPopup(auth, provider);
  };
  window.firebaseSignOut = () => signOut(auth);
  window.firebaseLoadLearner = async uid => {
    const snapshot = await get(ref(db, `learners/${uid}`));
    return snapshot.exists() ? snapshot.val() : null;
  };
  window.firebaseSaveLearner = (uid, record) => set(ref(db, `learners/${uid}`), {
    ...record,
    updatedAt: serverTimestamp()
  });
  window.firebaseWatchLearnerLock = (uid, callback, onError) => onValue(
    ref(db, `learnerLocks/${uid}`),
    snapshot => callback(snapshot.exists() ? snapshot.val() : null),
    onError
  );
  window.firebaseWatchAdminData = (onLearners, onLocks, onSessions, onError) => {
    const learnerUnsubscribe = onValue(ref(db, 'learners'), snapshot => {
      onLearners(asRecords(snapshot.val()).sort((a, b) => Number(b.updatedAt) - Number(a.updatedAt)));
    }, onError);
    const locksUnsubscribe = onValue(ref(db, 'learnerLocks'), snapshot => {
      onLocks(asRecords(snapshot.val()));
    }, onError);
    const sessionsUnsubscribe = onValue(ref(db, 'loginSessions'), snapshot => {
      const sessionsByUid = snapshot.val() || {};
      const sessions = Object.entries(sessionsByUid).flatMap(([uid, bySession]) =>
        Object.entries(bySession || {}).map(([sessionId, session]) => ({ id: `${uid}_${sessionId}`, uid, sessionId, ...session }))
      );
      onSessions(sessions.sort((a, b) => Number(b.lastSeenAt) - Number(a.lastSeenAt)));
    }, onError);
    return () => { learnerUnsubscribe(); locksUnsubscribe(); sessionsUnsubscribe(); };
  };

  let activeLoginSession = null;
  let activeDisconnectOperation = null;
  let loginHeartbeat = null;
  let refreshSessionOnVisibility = null;
  window.firebaseStartLearnerSession = async uid => {
    if (loginHeartbeat) clearInterval(loginHeartbeat);
    if (refreshSessionOnVisibility) document.removeEventListener('visibilitychange', refreshSessionOnVisibility);
    let sessionToken;
    try {
      sessionToken = crypto.randomUUID();
      sessionStorage.setItem('jietPlacementSessionId', sessionToken);
    } catch {
      sessionToken = crypto.randomUUID();
    }
    const sessionRef = ref(db, `loginSessions/${uid}/${sessionToken}`);
    const disconnectOperation = onDisconnect(sessionRef);
    await disconnectOperation.update({ lastSeenAt: serverTimestamp(), signedOutAt: serverTimestamp(), updatedAt: serverTimestamp() });
    const now = serverTimestamp();
    await set(sessionRef, {
      uid,
      sessionId: sessionToken,
      signedInAt: now,
      lastSeenAt: now,
      signedOutAt: null,
      updatedAt: now
    });
    activeLoginSession = sessionRef;
    activeDisconnectOperation = disconnectOperation;
    const heartbeat = () => update(sessionRef, {
      lastSeenAt: serverTimestamp(),
      signedOutAt: null,
      updatedAt: serverTimestamp()
    });
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
    const disconnectOperation = activeDisconnectOperation;
    activeLoginSession = null;
    activeDisconnectOperation = null;
    await update(sessionRef, { lastSeenAt: serverTimestamp(), signedOutAt: serverTimestamp(), updatedAt: serverTimestamp() });
    await disconnectOperation?.cancel();
  };
  window.firebaseLockLearner = (uid, untilMillis, reason, source = 'proctor') => set(ref(db, `learnerLocks/${uid}`), {
    uid,
    until: untilMillis,
    reason: String(reason || '').slice(0, 300),
    source,
    updatedBy: auth.currentUser?.uid || '',
    updatedAt: serverTimestamp()
  });
  window.firebaseUnlockLearner = async (uid, reason = '') => {
    const auditRef = push(ref(db, 'adminAudit'));
    await update(ref(db), {
      [`learnerLocks/${uid}`]: null,
      [`adminAudit/${auditRef.key}`]: {
        action: 'unlock_profile',
        learnerUid: uid,
        reason: String(reason || '').slice(0, 300),
        adminUid: auth.currentUser?.uid || '',
        createdAt: serverTimestamp()
      }
    });
  };
  window.firebaseAdminLockLearner = async (uid, untilMillis, reason = '') => {
    const auditRef = push(ref(db, 'adminAudit'));
    await update(ref(db), {
      [`learnerLocks/${uid}`]: {
        uid,
        until: untilMillis,
        reason: String(reason || '').slice(0, 300),
        source: 'admin',
        updatedBy: auth.currentUser?.uid || '',
        updatedAt: serverTimestamp()
      },
      [`adminAudit/${auditRef.key}`]: {
        action: 'lock_profile',
        learnerUid: uid,
        reason: String(reason || '').slice(0, 300),
        adminUid: auth.currentUser?.uid || '',
        createdAt: serverTimestamp()
      }
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
      isAdmin: isAdminUser(user)
    });
  }, error => window.handleFirebaseAuthError?.(error));
} catch (error) {
  window.handleFirebaseAuthError?.(error);
}
