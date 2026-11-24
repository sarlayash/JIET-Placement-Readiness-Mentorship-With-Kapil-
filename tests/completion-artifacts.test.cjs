const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function loadApp() {
  const root = process.cwd();
  const document = {
    addEventListener() {},
    createElement() { return { click() {}, set href(value) { this._href = value; }, set download(value) { this._download = value; } }; },
    getElementById() { return null; },
    querySelector() { return null; },
    querySelectorAll() { return []; }
  };
  const context = {
    console,
    document,
    window: { crypto: { getRandomValues(bytes) { bytes.fill(7); return bytes; } } },
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
  vm.runInContext(`${scripts}\nglobalThis.__testApi = { state, BADGES_CONFIG, LEVEL_BADGES, CAREER_ASSESSMENTS, FOUNDATION_ASSESSMENT, PROACTIVE_DRILLS, POS_DRILLS, SENTENCE_PAGE_1, SENTENCE_PAGE_2, PARAJUMBLES_PAGE_1, PARAJUMBLES_PAGE_2_3, CLOZE_QUESTIONS, APTITUDE_QUESTIONS, ENGLISH_TOPICS, getLearningLevelProgress, getNewLevelBadges, areAllLearningLevelsComplete, imageCanvasToPdfBlob, downloadCanvasArtifact, downloadTrackCertificate, downloadEnglishCertificate, downloadCertificatePNG }; globalThis.__testApi.__context = globalThis;`, context, { filename: 'app-test.vm.js' });
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
  assert.equal(api.BADGES_CONFIG.length, 32);
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
