const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function loadApp() {
  const root = process.cwd();
  const elements = new Map();
  const speechState = { speaking: false, utterances: [], cancel() { this.speaking = false; }, speak(utterance) { this.speaking = true; this.utterances.push(utterance); } };
  const document = {
    addEventListener() {},
    createElement() { return { click() {}, set href(value) { this._href = value; }, set download(value) { this._download = value; } }; },
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, { classList: { add() {}, remove() {}, toggle() {} }, textContent: '', className: '' });
      return elements.get(id);
    },
    querySelector() { return null; },
    querySelectorAll() { return []; }
  };
  const context = {
    console,
    document,
    window: { crypto: { getRandomValues(bytes) { bytes.fill(7); return bytes; } }, speechSynthesis: speechState },
    SpeechSynthesisUtterance: function (text) { this.text = text; },
    navigator: {},
    localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
    TextEncoder,
    Blob,
    atob,
    Uint8Array,
    URL: { createObjectURL() { return 'blob:test'; }, revokeObjectURL() {} },
    setTimeout() { return 1; },
    clearTimeout() {},
    setInterval() { return 1; },
    clearInterval() {},
    alert() {},
    confirm() { return true; }
  };
  vm.createContext(context);
  const scripts = ['career-curriculum.js', 'english-curriculum.js', 'app.js']
    .map(file => fs.readFileSync(path.join(root, file), 'utf8'))
    .join('\n');
  vm.runInContext(`${scripts}\nglobalThis.__testApi = { state, BADGES_CONFIG, LEVEL_BADGES, CAREER_ASSESSMENTS, FOUNDATION_ASSESSMENT, PROACTIVE_DRILLS, POS_DRILLS, SENTENCE_PAGE_1, SENTENCE_PAGE_2, PARAJUMBLES_PAGE_1, PARAJUMBLES_PAGE_2_3, CLOZE_QUESTIONS, APTITUDE_QUESTIONS, ENGLISH_TOPICS, MOCK_TOPICS, MOCK_DIFFICULTIES, getMockQuestions, getMockOptions, loadSavedState, getActiveProfileId: () => activeProfileId, getLearningLevelProgress, getNewLevelBadges, areAllLearningLevelsComplete, recordProctorViolation, readQuestionAloud, resetProctorDebounce() { lastProctorViolationAt = 0; }, imageCanvasToPdfBlob, downloadCanvasArtifact, downloadTrackCertificate, downloadEnglishCertificate, downloadCertificatePNG }; globalThis.__testApi.__context = globalThis; globalThis.__testApi.__speech = window.speechSynthesis;`, context, { filename: 'app-test.vm.js' });
  return context.__testApi;
}

function passQuestions(api, questions, correctCount = questions.length) {
  questions.forEach((question, index) => {
    api.state.answeredQuestions[question.id] = { correct: index < correctCount, choice: question.answer };
  });
}

function completeLevelsOneToNine(api) {
  passQuestions(api, api.FOUNDATION_ASSESSMENT);
  passQuestions(api, [...api.PROACTIVE_DRILLS, ...api.POS_DRILLS, { id: 'rahul_timeline' }]);
  passQuestions(api, [...api.SENTENCE_PAGE_1, ...api.SENTENCE_PAGE_2]);
  passQuestions(api, [...api.PARAJUMBLES_PAGE_1, ...api.PARAJUMBLES_PAGE_2_3]);
  passQuestions(api, api.CLOZE_QUESTIONS);
  passQuestions(api, api.CAREER_ASSESSMENTS.softSkills);
  passQuestions(api, api.CAREER_ASSESSMENTS.communication);
  passQuestions(api, api.APTITUDE_QUESTIONS);
  api.ENGLISH_TOPICS.forEach(topic => {
    api.state.englishAssessments[topic.id] = { bestCorrect: 35, bestPercent: 70, attempts: 1, completedAt: '2026-11-24T00:00:00.000Z', bestCompletedAt: '2026-11-24T00:00:00.000Z', certificateId: 'JIET-2026-0707070707070707' };
  });
}

test('certificates stay locked until all nine learning levels pass', () => {
  const api = loadApp();
  assert.equal(api.areAllLearningLevelsComplete(), false);
  assert.equal(api.getLearningLevelProgress().filter(level => level.number <= 9 && level.complete).length, 0);
  completeLevelsOneToNine(api);
  const levels = api.getLearningLevelProgress();
  assert.equal(levels.filter(level => level.number <= 9 && level.complete).length, 9);
  assert.equal(api.areAllLearningLevelsComplete(), true);
  assert.equal(levels.find(level => level.number === 10).complete, false, 'Level 10 completes only after the final certificate is downloaded');
  api.state.certificateIssued = true;
  assert.equal(api.getLearningLevelProgress().find(level => level.number === 10).complete, true);
});

test('each passed level awards exactly its own level badge', () => {
  const api = loadApp();
  passQuestions(api, api.FOUNDATION_ASSESSMENT, 7);
  let levels = api.getLearningLevelProgress();
  assert.equal(levels[0].complete, true);
  assert.equal(api.getNewLevelBadges(levels).map(level => level.badgeId).join(','), 'level_foundations');
  api.state.unlockedBadges.add('level_foundations');
  assert.equal(api.getNewLevelBadges(levels).length, 0);
  assert.equal(api.LEVEL_BADGES.length, 10);
  assert.equal(api.BADGES_CONFIG.length, 51);
});

test('five timed mock assessments cover every curriculum topic from easy through hard', () => {
  const api = loadApp();
  assert.equal(api.MOCK_TOPICS.length, 19);
  assert.equal(api.MOCK_TOPICS.length * api.MOCK_DIFFICULTIES.length, 95);
  assert.deepEqual(Array.from(api.MOCK_DIFFICULTIES, item => item.label), ['Easy I', 'Easy II', 'Medium I', 'Medium II', 'Hard']);
  assert.ok(api.MOCK_DIFFICULTIES.every((item, index, all) => index === 0 || item.secondsPerQuestion < all[index - 1].secondsPerQuestion));
  api.MOCK_TOPICS.forEach(topic => {
    api.MOCK_DIFFICULTIES.forEach((_, index) => {
      const mock = api.getMockQuestions(topic, index);
      assert.ok(mock.length > 0 && mock.length <= 10, `${topic.title} Mock ${index + 1} has usable questions`);
      assert.equal(new Set(mock.map(question => question.id)).size, mock.length, `${topic.title} Mock ${index + 1} has no duplicate questions`);
    });
    const first = topic.questions.find(question => question.options?.length > 1);
    assert.notDeepEqual(Array.from(api.getMockOptions(first, 0), option => option.text), Array.from(api.getMockOptions(first, 1), option => option.text), `${topic.title} variants shuffle answer positions`);
  });
  assert.equal(api.BADGES_CONFIG.length, 51);
});

test('Mock Center is reachable from both navigation bars with unique page IDs', () => {
  const html = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');
  const ids = Array.from(html.matchAll(/\bid="([^"]+)"/g), match => match[1]);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  assert.deepEqual(duplicates, []);
  assert.match(html, /class="nav-tab" data-tab="tab-mock-center"/);
  assert.match(html, /class="mobile-nav-btn" data-tab="tab-mock-center"/);
  assert.match(html, /id="tab-mock-center" class="tab-pane"/);
  assert.match(html, /id="proctorLockOverlay"/);
});

test('Google authentication is the app entry point and uses the supplied Firebase project', () => {
  const html = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');
  const authModule = fs.readFileSync(path.join(process.cwd(), 'firebase-auth.js'), 'utf8');
  assert.match(html, /id="authGateOverlay"/);
  assert.match(html, /id="googleSignInBtn"[^>]*onclick="signInWithGoogle\(\)"/);
  assert.doesNotMatch(html, /id="learnerInputName"/);
  assert.match(authModule, /projectId: 'picture-connect-with-kapil'/);
  assert.match(authModule, /signInWithPopup\(auth, provider\)/);
  assert.match(authModule, /browserLocalPersistence/);
});

test('only the verified allowlisted Google account receives admin access in UI and Firestore rules', () => {
  const auth = fs.readFileSync(path.join(process.cwd(), 'firebase-auth.js'), 'utf8');
  const rules = fs.readFileSync(path.join(process.cwd(), 'firestore.rules'), 'utf8');
  const html = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');
  assert.match(auth, /user\.emailVerified === true && user\.email\?\.toLowerCase\(\) === 'kapilnarula27july@gmail\.com'/);
  assert.match(rules, /request\.auth\.token\.email_verified == true/);
  assert.match(rules, /request\.auth\.token\.email == 'kapilnarula27july@gmail\.com'/);
  assert.match(html, /id="homeAdminDashboardLink"[^>]*onclick="openAdminDashboard\(\)"/);
});

test('Firebase profile hydration runs after login without holding the sign-in gate open', () => {
  const app = fs.readFileSync(path.join(process.cwd(), 'app.js'), 'utf8');
  const auth = fs.readFileSync(path.join(process.cwd(), 'firebase-auth.js'), 'utf8');
  const handler = app.slice(app.indexOf('function handleFirebaseAuthState(user)'), app.indexOf('\nfunction openAdminDashboard()'));
  assert.doesNotMatch(handler, /await window\.firebaseLoadLearner/);
  assert.match(handler, /if \(gate\) gate\.classList\.add\('hidden'\);[\s\S]*window\.firebaseLoadLearner\(user\.uid\)\.then/);
  assert.match(auth, /Could not enable persistent Google sign-in[\s\S]*continuing with Firebase defaults/);
});

test('every generated question format has optional text-to-speech and responsive mobile layouts', () => {
  const app = fs.readFileSync(path.join(process.cwd(), 'app.js'), 'utf8');
  const html = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(process.cwd(), 'styles.css'), 'utf8');
  assert.match(app, /function readQuestionAloud\(button\)/);
  assert.match(app, /readButton\.className = 'question-read-btn'/);
  assert.equal((app.match(/class="question-read-btn"/g) || []).length, 2, 'English and mock assessment renderers expose read aloud');
  assert.match(html, /Read sequence/);
  assert.match(css, /@media \(max-width: 899px\)/);
  assert.match(css, /@media \(max-width: 640px\)/);
  assert.match(css, /env\(safe-area-inset-bottom/);
});

test('read aloud speaks the active question and its options and can be stopped', () => {
  const api = loadApp();
  const spokenButton = { textContent: '🔊 Read aloud', attributes: {}, setAttribute(key, value) { this.attributes[key] = value; }, closest() { return card; } };
  const prompt = { innerText: 'What should the learner do first?' };
  const options = [{ innerText: 'A. Review the clues' }, { innerText: 'B. Guess immediately' }];
  const card = { querySelector(selector) { return selector.includes('.q-text') ? prompt : null; }, querySelectorAll(selector) { return selector.includes('.option-btn') ? options : []; } };
  api.readQuestionAloud(spokenButton);
  assert.match(api.__speech.utterances[0].text, /What should the learner do first/);
  assert.match(api.__speech.utterances[0].text, /Review the clues/);
  assert.equal(spokenButton.attributes['aria-pressed'], 'true');
  api.readQuestionAloud(spokenButton);
  assert.equal(api.__speech.speaking, false);
  assert.equal(spokenButton.attributes['aria-pressed'], 'false');
});

test('saved learner profiles are isolated by Firebase UID even when names match', () => {
  const api = loadApp();
  api.loadSavedState({ uid: 'google-user-one', displayName: 'Alex Student' });
  assert.equal(api.getActiveProfileId(), 'google:google-user-one');
  api.state.xp = 525;
  api.loadSavedState({ uid: 'google-user-two', displayName: 'Alex Student' });
  assert.equal(api.getActiveProfileId(), 'google:google-user-two');
  assert.equal(api.state.xp, 0);
});

test('three proctor warnings suspend the active learner profile for 24 hours', () => {
  const api = loadApp();
  api.state.activeMockAssessment = { violations: 0 };
  for (let index = 0; index < 3; index++) {
    api.resetProctorDebounce();
    api.recordProctorViolation('test visibility change');
  }
  assert.equal(api.state.activeMockAssessment, null);
  assert.ok(api.state.proctorLockUntil - Date.now() > 23 * 60 * 60 * 1000);
  assert.equal(api.state.proctorViolationCount, 3);
});

test('a level is incomplete until every question is answered and 70% is reached', () => {
  const api = loadApp();
  passQuestions(api, api.FOUNDATION_ASSESSMENT.slice(0, 9), 6);
  assert.equal(api.getLearningLevelProgress()[0].complete, false, 'unanswered question keeps level incomplete');
  api.state.answeredQuestions[api.FOUNDATION_ASSESSMENT[9].id] = { correct: false, choice: 'b' };
  assert.equal(api.getLearningLevelProgress()[0].complete, false, '60% does not pass');
  api.state.answeredQuestions[api.FOUNDATION_ASSESSMENT[9].id] = { correct: true, choice: 'a' };
  assert.equal(api.getLearningLevelProgress()[0].complete, true, '90% with every question answered passes');
});

test('every certificate downloader refuses an incomplete learner before creating an artifact', () => {
  const api = loadApp();
  const calls = [];
  const toast = { classList: { remove() {}, add() {} }, textContent: '' };
  api.__context.document.getElementById = id => id === 'toastNotification' ? toast : null;
  api.__context.document.createElement = type => { calls.push(type); return { click() {} }; };
  api.downloadCertificatePNG('pdf');
  api.downloadTrackCertificate('softSkills', 'pdf');
  api.downloadEnglishCertificate('indianisms', 'pdf');
  assert.deepEqual(calls, [], 'locked certificate requests do not create download elements');
});

test('PNG and PDF export helpers produce correct download types and a valid one-page PDF', async () => {
  const api = loadApp();
  const downloads = [];
  const pdfBlobs = [];
  api.__context.URL.createObjectURL = blob => { pdfBlobs.push(blob); return 'blob:certificate-test'; };
  api.__context.document.createElement = type => {
    assert.equal(type, 'a');
    const link = { click() { downloads.push({ name: this.download, href: this.href }); } };
    return link;
  };
  api.__context.setTimeout = () => 1;
  const canvas = { width: 1200, height: 840, toDataURL(type) { return `data:${type};base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2w==`; } };
  api.downloadCanvasArtifact(canvas, 'badge-example', 'png');
  api.downloadCanvasArtifact(canvas, 'badge-example', 'pdf');
  assert.deepEqual(downloads.map(item => item.name), ['badge-example.png', 'badge-example.pdf']);
  assert.equal(pdfBlobs[0].type, 'application/pdf');
  const bytes = new Uint8Array(await pdfBlobs[0].arrayBuffer());
  const pdf = Buffer.from(bytes).toString('latin1');
  assert.ok(pdf.startsWith('%PDF-1.4'));
  assert.match(pdf, /\/Subtype \/Image/);
  assert.match(pdf, /\/DCTDecode/);
  const startXref = Number(pdf.match(/startxref\n(\d+)/)[1]);
  assert.equal(pdf.slice(startXref, startXref + 4), 'xref');
  const offsets = [...pdf.matchAll(/(\d{10}) 00000 n/g)].map(match => Number(match[1]));
  assert.equal(offsets.length, 5);
  offsets.forEach((offset, index) => assert.ok(pdf.startsWith(`${index + 1} 0 obj`, offset)));
});
