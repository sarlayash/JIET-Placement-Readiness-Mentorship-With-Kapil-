const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const read = file => fs.readFileSync(file, 'utf8');

test('admin dashboard wires learner sessions, presence, and progress detail into the CSV', () => {
  const app = read('app.js');
  const firebase = read('firebase-auth.js');
  const html = read('index.html');
  assert.match(firebase, /ref\(db, 'loginSessions'\)/);
  assert.match(firebase, /loginHeartbeat = setInterval\([\s\S]*?45000\)/);
  assert.match(firebase, /onDisconnect\(sessionRef\)/);
  assert.match(firebase, /window\.firebaseEndLearnerSession = async/);
  assert.match(app, /sessions => \{ adminSessionRecords = sessions; renderAdminDashboard\(\); \}/);
  assert.match(app, /function learnerIsOnline\(uid, cutoff\)/);
  assert.match(app, /englishAssessments/);
  assert.match(app, /mockAssessments/);
  assert.match(app, /'lastSignInAt', 'lastActivityAt'/);
  assert.match(html, /<th>Presence<\/th>[\s\S]*?<th>Last sign-in<\/th><th>Last activity<\/th>/);
});

test('Realtime Database rules isolate learner data and restrict administration to the verified admin', () => {
  const rules = read('database.rules.json');
  assert.match(rules, /auth\.token\.email_verified === true && auth\.token\.email === 'kapilnarula27july@gmail\.com'/);
  assert.match(rules, /"learners": \{\s*"\.read": "auth != null && auth\.token\.email_verified === true/);
  assert.match(rules, /"learners"[\s\S]*?auth\.uid === \$uid[\s\S]*?learnerLocks/);
  assert.match(rules, /"loginSessions": \{\s*"\.read": "auth != null && auth\.token\.email_verified === true/);
  assert.match(rules, /"loginSessions"[\s\S]*?auth\.uid === \$uid/);
  assert.match(rules, /"adminAudit"[\s\S]*?auth\.token\.email_verified === true/);
});

test('Firebase client uses the provisioned no-cost Realtime Database instead of Firestore', () => {
  const firebase = read('firebase-auth.js');
  const config = JSON.parse(read('firebase.json'));
  assert.match(firebase, /firebase-database\.js/);
  assert.match(firebase, /picture-connect-with-kapil-default-rtdb\.asia-southeast1\.firebasedatabase\.app/);
  assert.doesNotMatch(firebase, /firebase-firestore\.js/);
  assert.deepEqual(Object.keys(config), ['database']);
});
