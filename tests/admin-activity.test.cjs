const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const read = file => fs.readFileSync(file, 'utf8');

test('admin dashboard wires learner sessions, presence, and progress detail into the CSV', () => {
  const app = read('app.js');
  const firebase = read('firebase-auth.js');
  const html = read('index.html');
  assert.match(firebase, /collection\(db, 'loginSessions'\)/);
  assert.match(firebase, /loginHeartbeat = setInterval\([\s\S]*?45000\)/);
  assert.match(firebase, /window\.firebaseEndLearnerSession = async/);
  assert.match(app, /sessions => \{ adminSessionRecords = sessions; renderAdminDashboard\(\); \}/);
  assert.match(app, /function learnerIsOnline\(uid, cutoff\)/);
  assert.match(app, /englishAssessments/);
  assert.match(app, /mockAssessments/);
  assert.match(app, /'lastSignInAt', 'lastActivityAt'/);
  assert.match(html, /<th>Presence<\/th>[\s\S]*?<th>Last sign-in<\/th><th>Last activity<\/th>/);
});

test('Firestore allows only the verified admin to read sessions and owners to write their own', () => {
  const rules = read('firestore.rules');
  assert.match(rules, /request\.auth\.token\.email == 'kapilnarula27july@gmail\.com'/);
  assert.match(rules, /match \/loginSessions\/\{sessionId\}/);
  assert.match(rules, /allow get, list: if isAdmin\(\) \|\| \(signedIn\(\) && resource\.data\.uid == request\.auth\.uid\)/);
  assert.match(rules, /allow create: if signedIn\(\)[\s\S]*?validLoginSession\(request\.auth\.uid, sessionId\)/);
});
