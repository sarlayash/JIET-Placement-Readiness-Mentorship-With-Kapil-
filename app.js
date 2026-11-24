/**
 * PLACEMENT READINESS MENTORSHIP WITH KAPIL | POWERED BY FACE PREP
 * Gamified Single Page Application Engine
 * Document Curriculum: CPCV13-05M
 */

// ==========================================
// 1. STATE & USER PROFILE
// ==========================================
const state = {
  learnerName: 'Learner',
  xp: 0,
  streak: 0,
  level: 1,
  soundEnabled: true,
  certificateId: '',
  certificateIssued: false,
  unlockedBadges: new Set(),
  answeredQuestions: {}, // { qId: { correct: bool, choice: string } }
  englishAssessments: {},
  activeEnglishAssessment: null,
  mockAssessments: {},
  activeMockAssessment: null,
  proctorLockUntil: 0,
  proctorViolationCount: 0,
  remoteProctorLockActive: false,
  syncUpdatedAt: 0,
  activeTab: 'tab-concepts',
  rahulOrder: [5, 1, 8, 3, 7, 2, 9, 4, 6] // start scrambled so the timeline cannot be claimed untouched
};

const LEGACY_STATE_KEY = 'faceprep_kapil_placement_state';
const PROFILES_STORAGE_KEY = 'faceprep_kapil_placement_profiles';
const ACTIVE_PROFILE_STORAGE_KEY = 'faceprep_kapil_active_profile';
let learnerProfiles = {};
let activeProfileId = null;
let lastLevelCompletionKey = null;
let authUser = null;
let appInitialized = false;
let pendingFirebaseUser = null;
let authStateVersion = 0;
let cloudSaveTimeout = null;
let pendingCloudRecord = null;
let learnerLockUnsubscribe = null;
let adminDataUnsubscribe = null;
let adminLearnerRecords = [];
let adminLockRecords = new Map();

const LEVEL_BADGES = [
  { id: 'level_foundations', icon: '📖', title: 'Foundation Builder', desc: 'Passed Level 1 Foundations with at least 70%.' },
  { id: 'level_english', icon: '🔤', title: 'English Master', desc: 'Passed all eight English Mastery assessments with at least 70% each.' },
  { id: 'level_drills', icon: '🎯', title: 'Drill Specialist', desc: 'Passed Level 3 Proactive Drills with at least 70%.' },
  { id: 'level_sentences', icon: '✍️', title: 'Sentence Strategist', desc: 'Passed Level 4 Sentence Battles with at least 70%.' },
  { id: 'level_parajumbles', icon: '🧩', title: 'Paragraph Architect', desc: 'Passed Level 5 Para-Jumbles with at least 70%.' },
  { id: 'level_cloze', icon: '🧪', title: 'Cloze Analyst', desc: 'Passed Level 6 Passage Cloze with at least 70%.' },
  { id: 'level_soft_skills', icon: '🤝', title: 'Workplace Ready', desc: 'Passed Level 7 Soft Skills with at least 70%.' },
  { id: 'level_communication', icon: '💬', title: 'Clear Communicator', desc: 'Passed Level 8 Communication with at least 70%.' },
  { id: 'level_aptitude', icon: '🧠', title: 'Aptitude Ready', desc: 'Passed Level 9 Placement Aptitude with at least 70%.' },
  { id: 'level_certificates', icon: '🏆', title: 'Career Ready', desc: 'Completed Level 10 by downloading your unlocked final certificate.' }
];

// Placement readiness badges across verbal, aptitude, communication, and workplace skills
const BADGES_CONFIG = [
  { id: 'recruit', icon: '🚀', title: 'Fresh Recruit', desc: 'Enrolled in Kapil\'s Placement Mentorship.' },
  { id: 'detective', icon: '🔍', title: 'Signpost Detective', desc: 'Identified clues, support & contrast signs in sentence completion.' },
  { id: 'proactive', icon: '💡', title: 'Proactive Thinker', desc: 'Mastered predictive fill-in-the-blank drills.' },
  { id: 'timeline', icon: '⏳', title: 'Chronology King', desc: 'Perfect chronological ordering of Rahul\'s narrative sequence.' },
  { id: 'sentence_ace', icon: '✍️', title: 'Sentence Architect', desc: 'Scored high on Sentence Completion Practice & Review questions.' },
  { id: 'jumble_maestro', icon: '🧩', title: 'Jumble Maestro', desc: 'Conquered complex sentence & fragment rearrangements.' },
  { id: 'cloze_master', icon: '🧪', title: 'Logic Alchemist', desc: 'Aced the Chemistry Discourse Cloze passage.' },
  { id: 'placement_prodigy', icon: '🏆', title: 'Placement Prodigy', desc: 'Earned 1000+ XP across the placement readiness journey.' },
  { id: 'soft_skills_pro', icon: '🤝', title: 'Teamwork Pro', desc: 'Scored 80% or higher on the Soft Skills assessment.' },
  { id: 'communication_ace', icon: '💬', title: 'Communication Ace', desc: 'Scored 80% or higher on the Professional Communication assessment.' },
  { id: 'quant_master', icon: '➗', title: 'Quant Master', desc: 'Scored 75% or higher on the Quantitative Aptitude assessment.' },
  { id: 'reasoning_ace', icon: '🧠', title: 'Reasoning Ace', desc: 'Scored 75% or higher on the Logical Reasoning assessment.' },
  { id: 'data_analyst', icon: '📊', title: 'Data Analyst', desc: 'Scored 75% or higher on the Data Interpretation assessment.' },
  { id: 'spatial_solver', icon: '🔷', title: 'Spatial Solver', desc: 'Scored 75% or higher on the Spatial Reasoning assessment.' },
  ...ENGLISH_TOPICS.map(topic => ({ id: `english_${topic.id}`, icon: topic.icon, title: `${topic.title} Ace`, desc: `Scored 80% or higher on the ${topic.title} assessment.` })),
  ...LEVEL_BADGES
];

const APTITUDE_QUESTIONS = [
  ...CAREER_ASSESSMENTS.quantitative,
  ...CAREER_ASSESSMENTS.reasoning,
  ...CAREER_ASSESSMENTS.dataInterpretation,
  ...CAREER_ASSESSMENTS.spatialReasoning
];
const CAREER_CERTIFICATES = {
  softSkills: { title: 'Professional Soft Skills', questions: CAREER_ASSESSMENTS.softSkills },
  communication: { title: 'Professional Communication', questions: CAREER_ASSESSMENTS.communication },
  aptitude: { title: 'Placement Aptitude', questions: APTITUDE_QUESTIONS }
};

// Audio Synthesizer (Zero external dependencies)
class SoundFX {
  constructor() {
    this.ctx = null;
  }
  init() {
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }
  playCorrect() {
    if (!state.soundEnabled) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(523.25, this.ctx.currentTime); // C5
    osc.frequency.exponentialRampToValueAtTime(659.25, this.ctx.currentTime + 0.12); // E5
    osc.frequency.exponentialRampToValueAtTime(783.99, this.ctx.currentTime + 0.24); // G5
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.36);
  }
  playWrong() {
    if (!state.soundEnabled) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(140, this.ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.26);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.27);
  }
  playBadge() {
    if (!state.soundEnabled) return;
    this.init();
    if (!this.ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.1);
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.1 + 0.25);
      osc.start(this.ctx.currentTime + idx * 0.1);
      osc.stop(this.ctx.currentTime + idx * 0.1 + 0.26);
    });
  }
}
const sfx = new SoundFX();

// ==========================================
// 2. CURRICULUM DATA STORE (100% UNMODIFIED)
// ==========================================

// --- LEVEL 2A: Proactive Fill-in-the-Blanks (Drill Q1 to Q10) ---
const PROACTIVE_DRILLS = [
  {
    id: 'drill_p1',
    qNum: 'Drill 1',
    prompt: 'He thought his problems were way too _______',
    options: [
      { key: 'a', text: 'overwhelming' },
      { key: 'b', text: 'trivial' },
      { key: 'c', text: 'minor' },
      { key: 'd', text: 'easy' }
    ],
    answer: 'a',
    hint: 'Look at the intensifier "way too". We say "way too overwhelming / complicated / severe" when expressing intense distress.',
    kapilTip: '"Way too" serves as a high-intensity degree modifier. In placement aptitude, pairing negative or burdensome words like "overwhelming", "cumbersome", or "formidable" with "way too" is the standard idiomatic construction.'
  },
  {
    id: 'drill_p2',
    qNum: 'Drill 2',
    prompt: 'I am not totally _______ to the idea; however, I do have some _______',
    options: [
      { key: 'a', text: 'averse, reservations' },
      { key: 'b', text: 'agreeable, doubts' },
      { key: 'c', text: 'opposed, certainty' },
      { key: 'd', text: 'open, acceptance' }
    ],
    answer: 'a',
    hint: 'Notice the contrast signpost "however". The first blank is qualified by "not totally...", while the second blank presents lingering hesitation.',
    kapilTip: 'Contrast Signpost Alert! "However" pivots the tone. "Not totally averse" means mildly open or not completely against it; "reservations" reflects the natural hesitation signaled by "however".'
  },
  {
    id: 'drill_p3',
    qNum: 'Drill 3',
    prompt: "The job required one to have _______ ability. All the candidate's attempts to _______ the recruiter that he possessed the same in good measure were in vain.",
    options: [
      { key: 'a', text: 'analytical, convince' },
      { key: 'b', text: 'slight, fool' },
      { key: 'c', text: 'physical, warn' },
      { key: 'd', text: 'random, guide' }
    ],
    answer: 'a',
    hint: 'A professional job demands a high cognitive quality (analytical / technical), and candidates attempt to "convince" or "persuade" recruiters.',
    kapilTip: 'Notice the restatement clue: "attempts to _______ the recruiter that he possessed the same in good measure were in vain". You convince someone of your ability!'
  },
  {
    id: 'drill_p4',
    qNum: 'Drill 4',
    prompt: 'The man next door, _______ has been recommended by my aunt to my professor.',
    options: [
      { key: 'a', text: 'who is a distinguished scholar,' },
      { key: 'b', text: 'which made loud noise,' },
      { key: 'c', text: 'whose dog barked,' },
      { key: 'd', text: 'that lives nearby,' }
    ],
    answer: 'a',
    hint: 'Commas surround a non-defining relative clause providing identifying credential suitable for academic recommendation.',
    kapilTip: 'Sentence structure clue: The non-restrictive relative clause flanked by commas must refer to a person ("who") and logically fit why an aunt would recommend him to a professor.'
  },
  {
    id: 'drill_p5',
    qNum: 'Drill 5',
    prompt: "She couldn't believe that she had scored 90% in physics, _______",
    options: [
      { key: 'a', text: 'given that she had hardly studied before the exam.' },
      { key: 'b', text: 'because she had revised all year long.' },
      { key: 'c', text: 'since she was the top student in school.' },
      { key: 'd', text: 'so she expected nothing less.' }
    ],
    answer: 'a',
    hint: 'The phrase "couldn\'t believe" sets up an expectation of surprise or unexpected success contrary to her preparation.',
    kapilTip: 'Disbelief requires an incongruous antecedent! If she had studied all year, she would naturally expect 90%. Being stunned means she achieved it despite minimal effort ("given that she had hardly studied").'
  },
  {
    id: 'drill_p6',
    qNum: 'Drill 6',
    prompt: 'The king was very proud of his _______',
    options: [
      { key: 'a', text: 'valor and conquests' },
      { key: 'b', text: 'defeat and retreat' },
      { key: 'c', text: 'cowardly knights' },
      { key: 'd', text: 'destitution and debt' }
    ],
    answer: 'a',
    hint: 'A monarch typically takes pride in glory, military victories, or noble valor.',
    kapilTip: 'Proactive vocabulary association: Royalty in classical comprehension passages takes pride in positive attributes like "valor", "benevolence", "sovereignty", or "conquests".'
  },
  {
    id: 'drill_p7',
    qNum: 'Drill 7',
    prompt: 'Swami Vivekananda was a _______',
    options: [
      { key: 'a', text: 'visionary spiritual leader' },
      { key: 'b', text: 'despotic ruler' },
      { key: 'c', text: 'frugal merchant' },
      { key: 'd', text: 'timid spectator' }
    ],
    answer: 'a',
    hint: 'Identify historical and biographical context. Swami Vivekananda is universally revered for spiritual intellect.',
    kapilTip: 'World Knowledge Clue: In verbal aptitude passages, historical references always maintain factual integrity. Vivekananda is revered as a "visionary spiritual thinker" and global ambassador of Indian philosophy.'
  },
  {
    id: 'drill_p8',
    qNum: 'Drill 8',
    prompt: 'He had finished his assignment and project work _______',
    options: [
      { key: 'a', text: 'well ahead of the stipulated deadline.' },
      { key: 'b', text: 'yesterday yesterday.' },
      { key: 'c', text: 'before he even started writing.' },
      { key: 'd', text: 'very much slowly.' }
    ],
    answer: 'a',
    hint: 'Past perfect ("had finished") naturally links with an adverbial phrase of time such as "well ahead of schedule".',
    kapilTip: 'Past perfect tense ("had finished") expresses an action completed before a specific point in time or deadline.'
  },
  {
    id: 'drill_p9',
    qNum: 'Drill 9',
    prompt: "He is my best friend that is _______ I can't avoid inviting him.",
    options: [
      { key: 'a', text: 'why' },
      { key: 'b', text: 'because' },
      { key: 'c', text: 'unless' },
      { key: 'd', text: 'although' }
    ],
    answer: 'a',
    hint: 'Idiomatic cause-and-effect phrase: "That is why..."',
    kapilTip: 'Cause & Effect signpost: The expression "that is why" functions as a cohesive connective explaining the unavoidable consequence.'
  },
  {
    id: 'drill_p10',
    qNum: 'Drill 10',
    prompt: 'He may have come to your house very often _______ no reason why you should go to his at this moment.',
    options: [
      { key: 'a', text: 'but that is' },
      { key: 'b', text: 'therefore' },
      { key: 'c', text: 'and that is' },
      { key: 'd', text: 'because of' }
    ],
    answer: 'a',
    hint: 'A concessive clause ("He may have come...") needs a contrast signpost ("but that is no reason...").',
    kapilTip: 'Contrast Signpost: "He may have..." grants a concession; "but that is" counterbalances it by stating an objection.'
  }
];

// --- LEVEL 2B: Which Part of Speech Would You Need? (Drill Q1 to Q5) ---
const POS_DRILLS = [
  {
    id: 'pos_1',
    qNum: 'POS 1',
    prompt: 'The doctor won huge _______ for his services.',
    options: [
      { key: 'a', text: 'Noun (e.g., acclaim, praise, accolades)' },
      { key: 'b', text: 'Verb (e.g., praised)' },
      { key: 'c', text: 'Adjective (e.g., reputable)' },
      { key: 'd', text: 'Adverb (e.g., generously)' }
    ],
    answer: 'a',
    hint: 'The word follows the adjective "huge" and functions as the direct object of "won".',
    kapilTip: 'Grammar Syntax Check: Transitive verb "won" + Adjective "huge" requires a Noun object! (e.g. "acclaim", "recognition").'
  },
  {
    id: 'pos_2',
    qNum: 'POS 2',
    prompt: '_______ reached the place, when I got a telephone call.',
    options: [
      { key: 'a', text: 'Adverb (e.g., Scarcely / Hardly had I)' },
      { key: 'b', text: 'Noun (e.g., Person)' },
      { key: 'c', text: 'Preposition (e.g., Under)' },
      { key: 'd', text: 'Interjection (e.g., Wow)' }
    ],
    answer: 'a',
    hint: 'Notice the correlation with "when". In English grammar, "Hardly / Scarcely had I reached... when..." is an adverbial inversion.',
    kapilTip: 'Inversion Rule: Paired correlative conjunction: "Hardly / Scarcely + auxiliary verb + subject... when...". The initial slot is an Adverb!'
  },
  {
    id: 'pos_3',
    qNum: 'POS 3',
    prompt: 'On this occasion, I would like to introduce my fiancée to you all. (Identify the part of speech of "fiancée")',
    options: [
      { key: 'a', text: 'Noun' },
      { key: 'b', text: 'Verb' },
      { key: 'c', text: 'Adjective' },
      { key: 'd', text: 'Pronoun' }
    ],
    answer: 'a',
    hint: 'Preceded by the possessive adjective "my" and acts as the object of "introduce".',
    kapilTip: 'Possessive Determiner Rule: Any word preceded by "my", "his", "her", or "their" functioning as a person/object is a Noun.'
  },
  {
    id: 'pos_4',
    qNum: 'POS 4',
    prompt: 'He had done all the work _______',
    options: [
      { key: 'a', text: 'Adverb (e.g., meticulously, independently)' },
      { key: 'b', text: 'Conjunction (e.g., because)' },
      { key: 'c', text: 'Preposition (e.g., with)' },
      { key: 'd', text: 'Pronoun (e.g., someone)' }
    ],
    answer: 'a',
    hint: 'Modifies how the action "had done all the work" was performed.',
    kapilTip: 'Manner modifier: When a completed predicate clause is followed by a single qualifying word answering "how?", that word is an Adverb.'
  },
  {
    id: 'pos_5',
    qNum: 'POS 5',
    prompt: 'We had done the job _______',
    options: [
      { key: 'a', text: 'Adverb (e.g., successfully, perfectly)' },
      { key: 'b', text: 'Noun (e.g., company)' },
      { key: 'c', text: 'Adjective (e.g., good)' },
      { key: 'd', text: 'Interjection (e.g., alas)' }
    ],
    answer: 'a',
    hint: 'Qualifies the verb phrase "had done".',
    kapilTip: 'Do not confuse with adjectives! You cannot say "done the job good" (informal); formal grammar mandates an Adverb ("done the job well / thoroughly").'
  }
];

// --- LEVEL 2C: Rahul's Day Chronological Ordering (9 sentences from Page 1 bottom to Page 2 top) ---
const RAHUL_EVENTS = [
  { id: 1, text: 'Getting up early Rahul had a big breakfast.' },
  { id: 2, text: 'He walked to work for about half an hour.' },
  { id: 3, text: 'He started his work immediately.' },
  { id: 4, text: 'He did not have his lunch.' },
  { id: 5, text: 'He never feels hungry at lunch time.' },
  { id: 6, text: 'At dusk he called it a day and started home where his wife and mother also live.' },
  { id: 7, text: 'At home he had his food cooked by the latter.' },
  { id: 8, text: 'Rahul went to his computer and worked late at night.' },
  { id: 9, text: 'He slept very late.' }
];

// --- LEVEL 3A: Page 1 Sentence Completion (Questions 1 to 4) ---
const SENTENCE_PAGE_1 = [
  {
    id: 's_p1_1',
    qNum: 'Question 1',
    prompt: 'People often revel under the impression that only the poor and less educated people use slang, but this idea is totally _______',
    options: [
      { key: 'a', text: 'Accurate' },
      { key: 'b', text: 'Popular' },
      { key: 'c', text: 'Erroneous' },
      { key: 'd', text: 'Ineffective' }
    ],
    answer: 'c',
    hint: 'Look for the contrast signpost "but". If people falsely believe only the poor use slang, that belief is wrong.',
    kapilTip: 'Contrast Signpost "but"! When the premise mentions a misconception ("revel under the impression..."), the word after "but" must reject it. "Erroneous" (full of error) is the exact match.'
  },
  {
    id: 's_p1_2',
    qNum: 'Question 2',
    prompt: 'He thought he had executed a perfect crime. His unique perfume _______',
    options: [
      { key: 'a', text: 'helped him with it' },
      { key: 'b', text: 'put the police on the wrong scent' },
      { key: 'c', text: 'made the police dogs faint' },
      { key: 'd', text: 'was his undoing' }
    ],
    answer: 'd',
    hint: 'Irony / Contrast clue: "He thought he had executed a perfect crime", but something gave him away.',
    kapilTip: 'Collocation & Clue matching: "His undoing" is an English idiom meaning the cause of someone\'s downfall or failure.'
  },
  {
    id: 's_p1_3',
    qNum: 'Question 3',
    prompt: "The beauty of the theory's simplicity is also its _______ for only by _______ the assumptions of the theory is it possible to explain the most recent observations made by researchers.",
    options: [
      { key: 'a', text: 'glory, avoiding' },
      { key: 'b', text: 'undoing, supplementing' },
      { key: 'c', text: 'virtue, negating' },
      { key: 'd', text: 'downfall, considering' }
    ],
    answer: 'b',
    hint: 'The theory was simple, but recent observations can only be explained by adding extra assumptions—which ruins the simplicity.',
    kapilTip: 'Dual Blank Logic: "Simplicity" is destroyed if you must add more to it ("supplementing"). Hence, that necessity becomes the theory\'s "undoing".'
  },
  {
    id: 's_p1_4',
    qNum: 'Question 4',
    prompt: 'Mark Samuel Clemens was better known by the _______ Twain, which he used as a result of his knowledge of river boat piloting.',
    options: [
      { key: 'a', text: 'Pseudonym' },
      { key: 'b', text: 'Mountebank' },
      { key: 'c', text: 'Protagonist' },
      { key: 'd', text: 'Misanthrope' }
    ],
    answer: 'a',
    hint: 'Mark Twain was a pen-name adopted by the famous American author Samuel Langhorne Clemens.',
    kapilTip: 'Root Word Alert: "Pseudo-" means false or fictitious, and "-nym" means name! A pseudonym is an assumed pen name.'
  }
];

// --- LEVEL 3B: Page 2 Concept Review Questions (Questions 1 to 10) ---
const SENTENCE_PAGE_2 = [
  {
    id: 's_p2_1',
    qNum: 'Concept Review Q1',
    prompt: 'Although the teasers for the TV show were absolutely _______, the show itself was well-presented, well-timed, and represented a rather _______ work.',
    options: [
      { key: 'a', text: 'spectacular, mediocre' },
      { key: 'b', text: 'sombre, professional' },
      { key: 'c', text: 'explicit, vulgar' },
      { key: 'd', text: 'crude, polished' }
    ],
    answer: 'd',
    hint: 'Contrast signpost "Although" indicates the teasers and the actual show were polar opposites. The show was "well-presented and well-timed".',
    kapilTip: 'Polarity Flip: "Although" dictates: Blank 1 = Negative (crude/unrefined), Blank 2 = Positive matching "well-presented" (polished).'
  },
  {
    id: 's_p2_2',
    qNum: 'Concept Review Q2',
    prompt: 'Despite the fact that the New Green Palm communities are _______ they leave behind an almost _______ legacy of architecture and furniture design.',
    options: [
      { key: 'a', text: 'outdated, fleeting' },
      { key: 'b', text: 'inactive, demure' },
      { key: 'c', text: 'extinct, colossal' },
      { key: 'd', text: 'self-sufficient, vital' }
    ],
    answer: 'c',
    hint: '"Despite" creates contrast between the demise of the community and the immense permanence of its design legacy.',
    kapilTip: '"Despite the fact that they are extinct (no longer existing), they leave behind an almost colossal (immense, lasting) legacy."'
  },
  {
    id: 's_p2_3',
    qNum: 'Concept Review Q3',
    prompt: 'After a sudden and fierce _______ that overthrew the Prime Minister, Captain Habibi declared himself the dictator of the island nation.',
    options: [
      { key: 'a', text: 'Nuance' },
      { key: 'b', text: 'Coup' },
      { key: 'c', text: 'Solicitation' },
      { key: 'd', text: 'Reproach' }
    ],
    answer: 'b',
    hint: 'A sudden, violent overthrow of an existing government or head of state is called a coup (coup d\'état).',
    kapilTip: 'High-Frequency Placement Vocab: A "coup" is a military seizure of power. "Nuance" means subtle distinction; "solicitation" means petitioning.'
  },
  {
    id: 's_p2_4',
    qNum: 'Concept Review Q4',
    prompt: 'His _______ speech about the landlord\'s tyrannical ways was heard by the people who wanted him back from _______',
    options: [
      { key: 'a', text: 'open, gaol' },
      { key: 'b', text: 'short, office' },
      { key: 'c', text: 'important, home' },
      { key: 'd', text: 'candid, exile' }
    ],
    answer: 'd',
    hint: 'Speaking frankly about tyranny is "candid", and someone forced away by a tyrant is returned from "exile".',
    kapilTip: '"Candid" means blunt, honest, and unsparing. Leaders banished by tyrants live in "exile" until recalled by their supporters.'
  },
  {
    id: 's_p2_5',
    qNum: 'Concept Review Q5',
    prompt: 'The Mayor formed a taskforce to simplify several of the city orders and rules that were unnecessarily complicated and out-of-date.',
    options: [
      { key: 'a', text: 'Contemporary' },
      { key: 'b', text: 'Practical' },
      { key: 'c', text: 'Byzantine' },
      { key: 'd', text: 'Modern' }
    ],
    answer: 'c',
    hint: 'Which vocabulary word specifically designates a system that is labyrinthine, excessively complex, and bureaucratic?',
    kapilTip: 'GRE / Corporate Aptitude Classic: "Byzantine" describes labyrinthine, excessively complicated rules. It directly defines "unnecessarily complicated and out-of-date".'
  },
  {
    id: 's_p2_6',
    qNum: 'Concept Review Q6',
    prompt: 'The company _______ its maximum revenue during the late 90\'s.',
    options: [
      { key: 'a', text: 'Reached' },
      { key: 'b', text: 'Saw' },
      { key: 'c', text: 'Lost' },
      { key: 'd', text: 'Realised' }
    ],
    answer: 'b',
    hint: 'In corporate business English reports, periods frequently "see" or witness highs and lows.',
    kapilTip: 'Idiomatic Placement Usage: While "reached" is common, formal business prose often uses personification: "The company saw its maximum revenue" (witnessed / experienced).'
  },
  {
    id: 's_p2_7',
    qNum: 'Concept Review Q7',
    prompt: 'Lee was cleared of all allegations; he was free of all charges _______ against him.',
    options: [
      { key: 'a', text: 'Accused' },
      { key: 'b', text: 'Alleged' },
      { key: 'c', text: 'Leveled' },
      { key: 'd', text: 'Vindicated' }
    ],
    answer: 'c',
    hint: 'What verb pairs with "charges against someone"? We say charges are _______ against an accused.',
    kapilTip: 'Mandatory Collocation: Charges are "leveled against" an individual. One is accused OF something, not accused against.'
  },
  {
    id: 's_p2_8',
    qNum: 'Concept Review Q8',
    prompt: 'Since his parents had financial constraints, Gary was _______ to his uncle for paying for his college education.',
    options: [
      { key: 'a', text: 'Forced' },
      { key: 'b', text: 'Attached' },
      { key: 'c', text: 'Obliged' },
      { key: 'd', text: 'Demented' }
    ],
    answer: 'c',
    hint: 'When someone sponsors your education during hardship, you feel deeply indebted and grateful ("obliged").',
    kapilTip: 'Contextual Tone: "Obliged to [someone]" means bound by gratitude or debt of honor.'
  },
  {
    id: 's_p2_9',
    qNum: 'Concept Review Q9',
    prompt: 'Craig found it hard to _______ himself from the problem he had created by producing fake documents.',
    options: [
      { key: 'a', text: 'Rebuke' },
      { key: 'b', text: 'Engulf' },
      { key: 'c', text: 'Oust' },
      { key: 'd', text: 'Extricate' }
    ],
    answer: 'd',
    hint: 'Root word: "ex-" means out of. Which word means to untangle or free oneself from a sticky situation?',
    kapilTip: 'Root Word Mastery: "Ex-" (out) + "tricae" (perplexities/traps) = "extricate" (to disentangle or free oneself from a predicament).'
  },
  {
    id: 's_p2_10',
    qNum: 'Concept Review Q10',
    prompt: 'The scientist made several _______ discoveries.',
    options: [
      { key: 'a', text: 'Innovate' },
      { key: 'b', text: 'Brilliant' },
      { key: 'c', text: 'Well' },
      { key: 'd', text: 'Innovation' }
    ],
    answer: 'b',
    hint: 'The word precedes the noun "discoveries" and must serve as an adjective describing their caliber.',
    kapilTip: 'Part of Speech Check: "Discoveries" is a plural noun. It requires an Adjective. "Innovate" is a verb, "innovation" is a noun, "well" is an adverb. "Brilliant" is the only valid adjective.'
  }
];

// --- LEVEL 4A: Page 1 Para-Jumbles (Questions 1 to 5 with Strategy Identification) ---
const PARAJUMBLES_PAGE_1 = [
  {
    id: 'pj_p1_1',
    qNum: 'Para-Jumble 1',
    fragments: [
      { letter: 'A', text: 'and, the best part is, she never underwent any training for this.' },
      { letter: 'B', text: 'she takes less than half the average time which others take to do the same.' },
      { letter: 'C', text: 'she has always solved questions of this type very easily.' }
    ],
    options: [
      { key: 'a', text: 'C - B - A' },
      { key: 'b', text: 'B - C - A' },
      { key: 'c', text: 'A - B - C' },
      { key: 'd', text: 'C - A - B' }
    ],
    strategies: [
      'Generic to Specific Transition & Signposts ("and, the best part is")',
      'Find the opening sentence based on proper nouns',
      'Abbreviation expansion rule'
    ],
    correctStrategy: 'Generic to Specific Transition & Signposts ("and, the best part is")',
    answer: 'a',
    hint: 'Start with the general capability (C), provide specific measurement of speed (B), and conclude with the surprising climax signpost (A: "and, the best part is...").',
    kapilTip: 'C introduces her natural talent. B elaborates with concrete proof (less than half the average time). A adds the crowning punchline with the additive signpost "and, the best part is". Order: C - B - A.'
  },
  {
    id: 'pj_p1_2',
    qNum: 'Para-Jumble 2',
    fragments: [
      { letter: 'A', text: 'however, all of a sudden, some people began to demand that he pave way for youngsters.' },
      { letter: 'B', text: 'as though in response to this, he chose to retire from ODI\'s.' },
      { letter: 'C', text: 'Sachin Tendulkar is an all-time favourite of many a cricket fan across the globe.' }
    ],
    options: [
      { key: 'a', text: 'C - A - B' },
      { key: 'b', text: 'C - B - A' },
      { key: 'c', text: 'A - C - B' },
      { key: 'd', text: 'B - A - C' }
    ],
    strategies: [
      'Match Pronouns with Antecedent (Sachin -> he) + Contrast Signpost ("however") + Response ("as though in response")',
      'Alphabetical sequence of events',
      'Action sequence starting with conclusion'
    ],
    correctStrategy: 'Match Pronouns with Antecedent (Sachin -> he) + Contrast Signpost ("however") + Response ("as though in response")',
    answer: 'a',
    hint: 'Sentence C contains the proper noun "Sachin Tendulkar". A has the contrast "however", and B has the reaction "as though in response to this".',
    kapilTip: 'Pronoun Antecedent Rule: C MUST precede A and B because you cannot begin with "he". A brings the turning point with "however". B directly answers A with "in response to this". Perfect sequence: C - A - B.'
  },
  {
    id: 'pj_p1_3',
    qNum: 'Para-Jumble 3',
    fragments: [
      { letter: 'A', text: 'but, when she began to listen to the husband\'s side of things, she began to think again.' },
      { letter: 'B', text: 'the judge began to weep after listening to her story.' },
      { letter: 'C', text: 'the husband and wife approached a family court seeking divorce.' }
    ],
    options: [
      { key: 'a', text: 'C - B - A' },
      { key: 'b', text: 'C - A - B' },
      { key: 'c', text: 'B - C - A' },
      { key: 'd', text: 'B - A - C' }
    ],
    strategies: [
      'Action Sequence: Court filing -> Hearing Wife\'s story -> Listening to Husband\'s side',
      'Anchor sentence in the middle',
      'Alphabetical order'
    ],
    correctStrategy: 'Action Sequence: Court filing -> Hearing Wife\'s story -> Listening to Husband\'s side',
    answer: 'a',
    hint: 'First, the couple approaches the court (C). Then the judge hears the wife\'s story and weeps (B). Then, contrasting signpost "but" shifts to the husband\'s side (A).',
    kapilTip: 'Legal Action Sequence: You first approach court (C). The judge hears the plaintiff/wife\'s story (B: "her story"). Then contrast signpost "but" introduces the husband\'s counter-narrative (A). Order: C - B - A.'
  },
  {
    id: 'pj_p1_4',
    qNum: 'Para-Jumble 4',
    fragments: [
      { letter: 'A', text: 'human rights activists raised a hue and cry about the death penalty.' },
      { letter: 'B', text: 'the man who was wanted in many rape and murder cases was nabbed.' },
      { letter: 'C', text: 'at the trial, after he admitted to all the crimes he had been accused of, he was given capital punishment.' }
    ],
    options: [
      { key: 'a', text: 'B - C - A' },
      { key: 'b', text: 'B - A - C' },
      { key: 'c', text: 'C - B - A' },
      { key: 'd', text: 'A - B - C' }
    ],
    strategies: [
      'Chronological Action Sequence: Arrest (nabbed) -> Trial & Capital Punishment -> Public Reaction (hue and cry)',
      'Opening with activist protest',
      'Generic to specific'
    ],
    correctStrategy: 'Chronological Action Sequence: Arrest (nabbed) -> Trial & Capital Punishment -> Public Reaction (hue and cry)',
    answer: 'a',
    hint: 'Arrest happens first (B), then the trial and sentencing (C), followed by public activist reaction against the penalty (A).',
    kapilTip: 'Temporal Logic: A criminal is first nabbed (B). The judicial trial follows, resulting in capital punishment (C). Only after capital punishment is announced can human rights activists protest the death penalty (A). Sequence: B - C - A.'
  },
  {
    id: 'pj_p1_5',
    qNum: 'Para-Jumble 5',
    fragments: [
      { letter: 'A', text: 'this mango seems to be an exception, he said.' },
      { letter: 'B', text: 'normally, we get sweet mangoes from his garden.' },
      { letter: 'C', text: 'we go inside his garden once a week.' }
    ],
    options: [
      { key: 'a', text: 'C - B - A' },
      { key: 'b', text: 'C - A - B' },
      { key: 'c', text: 'B - C - A' },
      { key: 'd', text: 'A - B - C' }
    ],
    strategies: [
      'Habitual routine (C) -> Normative expectation ("normally" - B) -> Specific exception ("this mango" - A)',
      'Starting with exception',
      'Name expansion rule'
    ],
    correctStrategy: 'Habitual routine (C) -> Normative expectation ("normally" - B) -> Specific exception ("this mango" - A)',
    answer: 'a',
    hint: 'Routine activity (C) leads to the regular experience (B: "normally..."), followed by the demonstrative pronoun referencing the current fruit (A: "this mango...").',
    kapilTip: 'Demonstrative Pronoun clue: "This mango" points to an object in hand. The context must first establish entering the garden (C), the historical norm of sweet mangoes (B), and then the single sour/bad exception (A). Order: C - B - A.'
  }
];

// --- LEVEL 4B: Page 2 & 3 Advanced Para-Jumbles (Questions 11 to 20) ---
const PARAJUMBLES_PAGE_2_3 = [
  {
    id: 'pj_adv_11',
    qNum: 'Question 11',
    fragments: [
      { letter: 'A', text: 'depends not on merit and ability, but on quotas based on caste' },
      { letter: 'B', text: 'or have a good work ethic as one of its core values' },
      { letter: 'C', text: 'community and gender or any other criterion, can hardly be stable' },
      { letter: 'D', text: 'a society where access to education and jobs' }
    ],
    options: [
      { key: 'a', text: 'C - B - D - A' },
      { key: 'b', text: 'D - B - C - A' },
      { key: 'c', text: 'C - B - A - D' },
      { key: 'd', text: 'D - A - C - B' }
    ],
    answer: 'd',
    hint: 'D is the grammatical subject ("a society where..."). A connects the relative clause ("depends not on merit..."), C completes the quota criteria, and B adds the parallel predicate ("or have a good work ethic...").',
    kapilTip: 'Mandatory Link D-A: "A society where access to education and jobs (D) depends not on merit and ability, but on quotas based on caste (A), community and gender or any other criterion, can hardly be stable (C) or have a good work ethic as one of its core values (B)." Option: D - A - C - B.'
  },
  {
    id: 'pj_adv_12',
    qNum: 'Question 12',
    fragments: [
      { letter: 'A', text: 'but it is also an age of short-term goals, changing career paths, decentralized structures and decision making' },
      { letter: 'B', text: 'the new age of information and society of organizations' },
      { letter: 'C', text: 'and jobs that no longer guarantee life-time employment' },
      { letter: 'D', text: 'is not just about egalitarian teams replacing the hierarchies of yesteryear' }
    ],
    options: [
      { key: 'a', text: 'B - C - A - D' },
      { key: 'b', text: 'B - A - C - D' },
      { key: 'c', text: 'B - D - C - A' },
      { key: 'd', text: 'B - D - A - C' }
    ],
    answer: 'd',
    hint: 'B establishes the subject. D provides the main verb "is not just about...". A balances with "but it is also an age of...", and C concludes with the parallel noun phrase "and jobs...".',
    kapilTip: 'Correlative Structure: "Not just about X (D) ... but it is also an age of Y (A) ... and jobs (C)". B is the opening subject. B - D - A - C.'
  },
  {
    id: 'pj_adv_13',
    qNum: 'Question 13',
    fragments: [
      { letter: 'A', text: 'the groups it is meant to benefit' },
      { letter: 'B', text: 'instead of creating more quotas' },
      { letter: 'C', text: 'the existing quotas have actually helped to improve' },
      { letter: 'D', text: 'the government would do better to look at whether' }
    ],
    options: [
      { key: 'a', text: 'D - A - B - C' },
      { key: 'b', text: 'B - A - D - C' },
      { key: 'c', text: 'C - A - B - D' },
      { key: 'd', text: 'B - D - C - A' }
    ],
    answer: 'a',
    hint: 'D begins the sentence with the governing clause "the government would do better to look at whether...". Then C + A + B follows: whether existing quotas helped improve the groups meant to benefit instead of creating more quotas.',
    kapilTip: 'D introduces the modal advisory: "The government would do better to look at whether (D) the existing quotas have actually helped to improve (C) the groups it is meant to benefit (A) instead of creating more quotas (B)." D - C - A - B / D - A - B - C.'
  },
  {
    id: 'pj_adv_14',
    qNum: 'Question 14',
    fragments: [
      { letter: 'A', text: 'But there are omissions and commissions in planning' },
      { letter: 'B', text: 'It is true that standard has fallen in the general sector' },
      { letter: 'C', text: 'In a period of expansion it is inevitable' },
      { letter: 'D', text: 'Some say that quantitative expansion is achieved at the expense of quality' },
      { letter: 'E', text: 'And the number of substandard institutions increased' }
    ],
    options: [
      { key: 'a', text: 'D - A - B - C - E' },
      { key: 'b', text: 'D - B - E - C - A' },
      { key: 'c', text: 'B - E - D - C - A' },
      { key: 'd', text: 'B - D - E - C - A' }
    ],
    answer: 'b',
    hint: 'D presents the prevailing criticism. B concedes it is true. E adds the proliferation of substandard colleges. C notes expansion makes it inevitable, and A concludes with planning deficiencies.',
    kapilTip: 'Flow of Argument: D states the popular hypothesis (expansion at expense of quality). B concedes truth. E joins with "And...". C argues inevitability during rapid growth. A closes with contrast "But...". Order: D - B - E - C - A.'
  },
  {
    id: 'pj_adv_15',
    qNum: 'Question 15',
    fragments: [
      { letter: 'A', text: 'which has plagued animal cloning efforts' },
      { letter: 'B', text: 'primates such as humans, apes and monkeys' },
      { letter: 'C', text: 'meaning cloned babies are protected from experiencing fetal outgrowth.' },
      { letter: 'D', text: 'possess two functional copies of a gene that regulates fetal growth' }
    ],
    options: [
      { key: 'a', text: 'B - A - D - C' },
      { key: 'b', text: 'A - D - C - B' },
      { key: 'c', text: 'B - D - A - C' },
      { key: 'd', text: 'B - D - C - A' }
    ],
    answer: 'd',
    hint: 'B is the subject ("primates..."). D is the predicate ("possess two functional copies..."). C explains what it means. A links to the cloning plague.',
    kapilTip: 'Scientific Subject-Verb Link: B ("Primates...") + D ("possess two functional copies...") form a mandatory pair (B-D). B - D - C - A.'
  },
  {
    id: 'pj_adv_16',
    qNum: 'Question 16',
    fragments: [
      { letter: 'A', text: 'when compared to prosperous and progressive nations' },
      { letter: 'B', text: 'the percentage of people having basic education' },
      { letter: 'C', text: 'and that is why they are poor and backward' },
      { letter: 'D', text: 'in the under developed and developing countries is dismally low' }
    ],
    options: [
      { key: 'a', text: 'A - B - D - C' },
      { key: 'b', text: 'B - D - A - C' },
      { key: 'c', text: 'B - A - D - C' },
      { key: 'd', text: 'A - C - B - D' }
    ],
    answer: 'b',
    hint: 'B is the grammatical subject. D specifies the geographic scope and predicate ("in developing countries is dismally low"). A adds the comparison ("when compared to..."). C concludes with consequence ("and that is why...").',
    kapilTip: 'B is the subject noun phrase. D provides the location and linking verb ("is dismally low"). A provides comparative benchmark ("when compared to..."). C gives causal wrap-up. Sequence: B - D - A - C.'
  },
  {
    id: 'pj_adv_17',
    qNum: 'Question 17',
    fragments: [
      { letter: 'A', text: 'Although there is a huge shift in the quality of ads that we come across on a daily basis, thanks essentially to improvement in technology, I somehow can\'t help but feel that the quality of communication of the message has become diluted.' },
      { letter: 'B', text: 'Over the years, I have had the opportunities to observe and understand the thought processes behind the ads that have been flooding both the print and the TV media.' },
      { letter: 'C', text: 'Another reason could be the burgeoning number of companies, which means an exponential increase in the number of ads that are being made.' },
      { letter: 'D', text: 'Proportionally, the number of ads that lack in quality, have gone up exponentially as well!!' },
      { letter: 'E', text: 'There is an increasing attempt by most companies to be seen as cool and funky.' }
    ],
    options: [
      { key: 'a', text: 'A - C - E - D - B' },
      { key: 'b', text: 'B - A - E - C - D' },
      { key: 'c', text: 'C - A - E - B - D' },
      { key: 'd', text: 'A - B - D - E - C' }
    ],
    answer: 'b',
    hint: 'B introduces personal experience over the years. A introduces the main dilemma (tech improved, communication diluted). E gives the first reason (desire to look cool). C introduces "Another reason...". D summarizes the proportional drop.',
    kapilTip: 'Notice the connector in C: "Another reason could be...". It MUST follow a first reason (E: "increasing attempt to be seen as cool"). Therefore, E-C is an unbreakable pair! B opens the narrative. Answer: B - A - E - C - D.'
  },
  {
    id: 'pj_adv_18',
    qNum: 'Question 18',
    fragments: [
      { letter: 'A', text: 'he returned to acting in 1946 and gave it up in 1963, and is now a full time writer' },
      { letter: 'B', text: 'during the World War II (1939-45) he joined the US Navy and was present at the sinking of the Bismarck' },
      { letter: 'C', text: 'in 1940, he got married and started teaching at Good Samaritan School in Bloomsbury' },
      { letter: 'D', text: 'at first his writings were not recognised' }
    ],
    options: [
      { key: 'a', text: 'A - B - D - C' },
      { key: 'b', text: 'C - B - A - D' },
      { key: 'c', text: 'B - A - D - C' },
      { key: 'd', text: 'A - C - B - D' }
    ],
    answer: 'b',
    hint: 'Follow strict chronological timestamps: 1940 (C) -> WWII service (B) -> return in 1946 & shift to writing in 1963 (A) -> reception of writings (D).',
    kapilTip: 'Chronological timeline mapping: C (1940 teaching) -> B (1939-45 WWII Naval duty) -> A (1946 acting, 1963 writing) -> D (initial reception of his writings). Order: C - B - A - D.'
  },
  {
    id: 'pj_adv_19',
    qNum: 'Question 19',
    fragments: [
      { letter: 'A', text: 'proper development of universities and colleges must be ensured' },
      { letter: 'B', text: 'cost benefit yardstick thus should not be applied in the case of universities' },
      { letter: 'C', text: 'universities cannot be equated with commercial enterprises' },
      { letter: 'D', text: 'most of the universities in the country are now facing financial crisis' },
      { letter: 'E', text: 'the current state of affairs cannot be allowed to continue for long' }
    ],
    options: [
      { key: 'a', text: 'D - E - C - B - A' },
      { key: 'b', text: 'C - B - A - D - E' },
      { key: 'c', text: 'B - A - D - C - E' },
      { key: 'd', text: 'A - C - B - D - E' }
    ],
    answer: 'b',
    hint: 'C sets the philosophical premise. B draws the deduction with "thus". A states the imperative. D describes the current crisis. E provides the resolution.',
    kapilTip: 'Premise-Conclusion Link: C ("cannot be equated with commercial enterprises") leads directly to B with the signpost "thus" ("cost benefit yardstick thus should not be applied"). That fixes C-B. Followed by A, D, and E: C - B - A - D - E.'
  },
  {
    id: 'pj_adv_20',
    qNum: 'Question 20',
    fragments: [
      { letter: 'A', text: 'Jawaharlal Nehru was born in Allahabad on 14 November, 1889' },
      { letter: 'B', text: 'Nehru met Mahatma Gandhi in February, 1920' },
      { letter: 'C', text: 'in 1905 he was sent to London to study at a school called Harrow' },
      { letter: 'D', text: 'he became the first Prime Minister of Independent India on 15 August, 1947' },
      { letter: 'E', text: 'he married Kamala Kaul in 1915' }
    ],
    options: [
      { key: 'a', text: 'D - E - C - B - A' },
      { key: 'b', text: 'C - B - A - D - E' },
      { key: 'c', text: 'A - C - E - B - D' },
      { key: 'd', text: 'A - C - B - D - E' }
    ],
    answer: 'c',
    hint: 'Order by dates: 1889 (birth) -> 1905 (Harrow school) -> 1915 (marriage) -> 1920 (meeting Gandhi) -> 1947 (Prime Minister).',
    kapilTip: 'Pure Biographical Chronology: 1889 (A) -> 1905 (C) -> 1915 (E) -> 1920 (B) -> 1947 (D). Sequence: A - C - E - B - D.'
  }
];

// --- LEVEL 5: Passage Cloze Test (Questions 21 to 25) ---
const CLOZE_QUESTIONS = [
  {
    id: 'cloze_21',
    blankNum: 21,
    prompt: 'It is an experimental science which has the task of (21) the materials out of which the things in the universe are made.',
    options: [
      { key: 'a', text: 'Implementing' },
      { key: 'b', text: 'Investigating' },
      { key: 'c', text: 'Inventing' },
      { key: 'd', text: 'Collecting' }
    ],
    answer: 'b',
    hint: 'Science explores and examines existing natural materials. We don\'t invent the universe\'s matter; we investigate it.',
    kapilTip: 'Scientific Definition: Chemistry does not "invent" the universe\'s basic elements; it "investigates" their constitution and properties.'
  },
  {
    id: 'cloze_22',
    blankNum: 22,
    prompt: 'Analyses have (22) things to be composed of elements aggregated in different...',
    options: [
      { key: 'a', text: 'Revealed' },
      { key: 'b', text: 'Allowed' },
      { key: 'c', text: 'Facilitated' },
      { key: 'd', text: 'Assumed' }
    ],
    answer: 'a',
    hint: 'Experimental analyses uncover or show objective findings.',
    kapilTip: 'Action Verb Collocation: Laboratory analysis "reveals" or demonstrates fundamental truths, rather than merely assuming them.'
  },
  {
    id: 'cloze_23',
    blankNum: 23,
    prompt: '...composed of elements aggregated in different (23).',
    options: [
      { key: 'a', text: 'Shapes' },
      { key: 'b', text: 'Manners' },
      { key: 'c', text: 'Styles' },
      { key: 'd', text: 'Proportion' }
    ],
    answer: 'd',
    hint: 'Chemical stoichiometry: elements combine in definite ratios and proportions (Law of Constant Proportions).',
    kapilTip: 'Scientific Domain Accuracy: In chemistry, atoms combine in definite "proportions" (ratios), not "styles" or "manners".'
  },
  {
    id: 'cloze_24',
    blankNum: 24,
    prompt: 'Millions of (24) which are used in our daily life are prepared with only a few dozen elements.',
    options: [
      { key: 'a', text: 'Products' },
      { key: 'b', text: 'Compounds' },
      { key: 'c', text: 'Substances' },
      { key: 'd', text: 'Ornamental' }
    ],
    answer: 'c',
    hint: 'Physical everyday materials in chemistry are collectively termed "substances".',
    kapilTip: 'Discourse Precision: "Substances" encompasses both compounds and mixtures used across everyday daily existence.'
  },
  {
    id: 'cloze_25',
    blankNum: 25,
    prompt: 'Even the (25) molecule does not contain more than four or five types of elements.',
    options: [
      { key: 'a', text: 'Biggest' },
      { key: 'b', text: 'Heaviest' },
      { key: 'c', text: 'Longest' },
      { key: 'd', text: 'Darkest' }
    ],
    answer: 'a',
    hint: 'Contrasting the immense size/scale of macromolecular structures with elemental simplicity.',
    kapilTip: 'Superlative Contrast: "Even the biggest molecule" emphasizes that despite gigantic physical size and complexity (like DNA or proteins), only 4-5 elements (C, H, O, N, P) are involved.'
  }
];

// ==========================================
// 3. GAMIFICATION & LOCAL STORAGE
// ==========================================
const MOCK_DIFFICULTIES = [
  { label: 'Easy I', secondsPerQuestion: 100 },
  { label: 'Easy II', secondsPerQuestion: 90 },
  { label: 'Medium I', secondsPerQuestion: 75 },
  { label: 'Medium II', secondsPerQuestion: 65 },
  { label: 'Hard', secondsPerQuestion: 55 }
];
const MOCK_TOPICS = [
  { id: 'foundations', title: 'Concept Foundations', icon: '📖', questions: FOUNDATION_ASSESSMENT },
  { id: 'drills', title: 'Proactive & Grammar Drills', icon: '🎯', questions: [...PROACTIVE_DRILLS, ...POS_DRILLS] },
  { id: 'sentences', title: 'Sentence Completion', icon: '✍️', questions: [...SENTENCE_PAGE_1, ...SENTENCE_PAGE_2] },
  { id: 'parajumbles', title: 'Para-Jumbles', icon: '🧩', questions: [...PARAJUMBLES_PAGE_1, ...PARAJUMBLES_PAGE_2_3] },
  { id: 'cloze', title: 'Passage Cloze', icon: '🧪', questions: CLOZE_QUESTIONS },
  { id: 'softSkills', title: 'Soft Skills', icon: '🤝', questions: CAREER_ASSESSMENTS.softSkills },
  { id: 'communication', title: 'Professional Communication', icon: '💬', questions: CAREER_ASSESSMENTS.communication },
  { id: 'quantitative', title: 'Quantitative Aptitude', icon: '➗', questions: CAREER_ASSESSMENTS.quantitative },
  { id: 'reasoning', title: 'Logical Reasoning', icon: '🧠', questions: CAREER_ASSESSMENTS.reasoning },
  { id: 'dataInterpretation', title: 'Data Interpretation', icon: '📊', questions: CAREER_ASSESSMENTS.dataInterpretation },
  { id: 'spatialReasoning', title: 'Spatial Reasoning', icon: '🔷', questions: CAREER_ASSESSMENTS.spatialReasoning },
  ...ENGLISH_TOPICS.map(topic => ({ id: topic.id, title: topic.title, icon: topic.icon, questions: ENGLISH_ASSESSMENTS[topic.id] }))
];
const MOCK_CERTIFICATE_BADGES = MOCK_TOPICS.map(topic => ({
  id: `mock_${topic.id}`,
  icon: topic.icon,
  title: `${topic.title} Mock Master`,
  desc: `Passed all five timed mock assessments for ${topic.title}.`
}));
BADGES_CONFIG.push(...MOCK_CERTIFICATE_BADGES);
const BADGE_TOTAL = BADGES_CONFIG.length;
const MOCK_QUESTION_LOOKUP = new Map(MOCK_TOPICS.flatMap(topic => topic.questions.map(question => [question.id, question])));
const PROCTOR_VIOLATION_LIMIT = 3;
const PROCTOR_LOCK_DURATION = 24 * 60 * 60 * 1000;
let mockTimerInterval = null;
let lastProctorViolationAt = 0;

function normalizeProfileId(name) {
  return name.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}

function generateCertificateId() {
  const bytes = new Uint8Array(8);
  if (window.crypto?.getRandomValues) window.crypto.getRandomValues(bytes);
  else for (let index = 0; index < bytes.length; index++) bytes[index] = Math.floor(Math.random() * 256);
  const suffix = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('').toUpperCase();
  return `JIET-${new Date().getFullYear()}-${suffix}`;
}

function createFreshLearnerState(name = 'Learner') {
  state.learnerName = name;
  state.xp = 0;
  state.streak = 0;
  state.level = 1;
  state.activeTab = 'tab-concepts';
  state.certificateId = generateCertificateId();
  state.certificateIssued = false;
  state.unlockedBadges = new Set();
  state.answeredQuestions = {};
  state.englishAssessments = {};
  state.activeEnglishAssessment = null;
  state.mockAssessments = {};
  state.activeMockAssessment = null;
  state.proctorLockUntil = 0;
  state.proctorViolationCount = 0;
  state.remoteProctorLockActive = false;
  state.syncUpdatedAt = 0;
  state.rahulOrder = [5, 1, 8, 3, 7, 2, 9, 4, 6];
}

function sanitizeLearnerState(data, fallbackName = 'Learner') {
  const safeData = data && typeof data === 'object' && !Array.isArray(data) ? data : {};
  const xpValue = Number(safeData.xp);
  const xp = Number.isFinite(xpValue) ? Math.max(0, Math.floor(xpValue)) : 0;
  const allowedBadgeIds = new Set(BADGES_CONFIG.map(badge => badge.id));
  const badges = Array.isArray(safeData.unlockedBadges)
    ? safeData.unlockedBadges.filter(id => allowedBadgeIds.has(id))
    : [];
  const knownQuestions = [
    ...FOUNDATION_ASSESSMENT,
    ...PROACTIVE_DRILLS, ...POS_DRILLS, ...SENTENCE_PAGE_1, ...SENTENCE_PAGE_2,
    ...PARAJUMBLES_PAGE_1, ...PARAJUMBLES_PAGE_2_3, ...CLOZE_QUESTIONS,
    ...CAREER_ASSESSMENTS.softSkills, ...CAREER_ASSESSMENTS.communication,
    ...APTITUDE_QUESTIONS
  ];
  const allowedEnglishAnswers = Object.fromEntries(Object.entries(ENGLISH_ASSESSMENTS).map(([topicId, questions]) => [
    topicId,
    Object.fromEntries(questions.map(question => [question.id, new Set(question.options.map(option => option.key))]))
  ]));
  const knownQuestionIds = new Set([...knownQuestions.map(question => question.id), 'rahul_timeline']);
  const answers = safeData.answeredQuestions && typeof safeData.answeredQuestions === 'object' && !Array.isArray(safeData.answeredQuestions)
    ? Object.fromEntries(Object.entries(safeData.answeredQuestions).filter(([id, answer]) =>
      knownQuestionIds.has(id) && answer && typeof answer.correct === 'boolean'
    ))
    : {};
  const order = Array.isArray(safeData.rahulOrder) && safeData.rahulOrder.length === 9 &&
    new Set(safeData.rahulOrder).size === 9 && safeData.rahulOrder.every(id => Number.isInteger(id) && id >= 1 && id <= 9)
    ? safeData.rahulOrder
    : [5, 1, 8, 3, 7, 2, 9, 4, 6];
  const timelineAlreadyCredited = safeData.answeredQuestions?.rahul_timeline?.correct === true;
  const safeOrder = !timelineAlreadyCredited && order.every((id, index) => id === index + 1)
    ? [5, 1, 8, 3, 7, 2, 9, 4, 6]
    : order;
  const name = typeof safeData.learnerName === 'string' && safeData.learnerName.trim()
    ? safeData.learnerName.trim().slice(0, 80)
    : fallbackName;
  const validTabs = new Set([
    'tab-concepts', 'tab-drills', 'tab-sentences', 'tab-parajumbles', 'tab-cloze',
    'tab-soft-skills', 'tab-communication', 'tab-aptitude', 'tab-english', 'tab-certificate', 'tab-mock-center'
  ]);
  const savedEnglish = safeData.englishAssessments && typeof safeData.englishAssessments === 'object' && !Array.isArray(safeData.englishAssessments)
    ? Object.fromEntries(Object.entries(safeData.englishAssessments).filter(([topicId, result]) =>
      allowedEnglishAnswers[topicId] && result && Number.isFinite(Number(result.bestCorrect)) && Number(result.bestCorrect) >= 0 && Number(result.bestCorrect) <= 50
    ).map(([topicId, result]) => [topicId, {
      bestCorrect: Math.floor(Number(result.bestCorrect)),
      bestPercent: Math.round(Number(result.bestCorrect) / 50 * 100),
      attempts: Math.max(1, Math.floor(Number(result.attempts) || 1)),
      completedAt: typeof result.completedAt === 'string' ? result.completedAt : '',
      bestCompletedAt: typeof result.bestCompletedAt === 'string' ? result.bestCompletedAt : (typeof result.completedAt === 'string' ? result.completedAt : ''),
      certificateId: typeof result.certificateId === 'string' && /^JIET-\d{4}-[A-F0-9]{16}$/.test(result.certificateId)
        ? result.certificateId
        : generateCertificateId()
    }]))
    : {};
  const activeAttempt = safeData.activeEnglishAssessment;
  const validActiveAttempt = activeAttempt && allowedEnglishAnswers[activeAttempt.topicId] && Number.isFinite(Number(activeAttempt.startedAt))
    ? {
      topicId: activeAttempt.topicId,
      startedAt: Math.min(Date.now(), Number(activeAttempt.startedAt)),
      index: Math.max(0, Math.min(49, Math.floor(Number(activeAttempt.index) || 0))),
      answers: Object.fromEntries(Object.entries(activeAttempt.answers || {}).filter(([questionId, key]) =>
        allowedEnglishAnswers[activeAttempt.topicId][questionId]?.has(key)
      )),
      hintOpen: Boolean(activeAttempt.hintOpen)
    }
    : null;
  const validMockIds = new Set(MOCK_TOPICS.flatMap(topic => MOCK_DIFFICULTIES.map((_, index) => `${topic.id}:${index + 1}`)));
  const savedMocks = safeData.mockAssessments && typeof safeData.mockAssessments === 'object' && !Array.isArray(safeData.mockAssessments)
    ? Object.fromEntries(Object.entries(safeData.mockAssessments).filter(([id, result]) => {
      const topic = MOCK_TOPICS.find(item => item.id === id.split(':')[0]);
      return validMockIds.has(id) && topic && result && Number.isFinite(Number(result.bestCorrect)) && Number(result.bestCorrect) >= 0 && Number(result.bestCorrect) <= Math.min(10, topic.questions.length);
    }).map(([id, result]) => {
      const count = Math.min(10, MOCK_TOPICS.find(topic => topic.id === id.split(':')[0]).questions.length);
      const bestCorrect = Math.floor(Number(result.bestCorrect));
      return [id, {
        bestCorrect,
        bestPercent: Math.round(bestCorrect / count * 100),
        attempts: Math.max(1, Math.floor(Number(result.attempts) || 1)),
        passed: bestCorrect >= Math.ceil(count * 0.7),
        xpAwarded: Boolean(result.xpAwarded),
        completedAt: typeof result.completedAt === 'string' ? result.completedAt : '',
        certificateId: typeof result.certificateId === 'string' && /^JIET-\d{4}-[A-F0-9]{16}$/.test(result.certificateId) ? result.certificateId : generateCertificateId()
      }];
    }))
    : {};
  const activeMock = safeData.activeMockAssessment;
  const activeMockId = activeMock && `${activeMock.topicId}:${Number(activeMock.mockIndex) + 1}`;
  const activeMockTopic = activeMock && MOCK_TOPICS.find(topic => topic.id === activeMock.topicId);
  const activeMockQuestionIds = new Set(activeMockTopic?.questions.map(question => question.id) || []);
  const validActiveMock = activeMock && validMockIds.has(activeMockId) && activeMockTopic && Number.isFinite(Number(activeMock.startedAt))
    ? {
      topicId: activeMock.topicId,
      mockIndex: Math.max(0, Math.min(4, Math.floor(Number(activeMock.mockIndex) || 0))),
      startedAt: Math.min(Date.now(), Number(activeMock.startedAt)),
      durationMs: Math.max(60_000, Math.min(60 * 60 * 1000, Math.floor(Number(activeMock.durationMs) || 10 * 60 * 1000))),
      questionIds: Array.isArray(activeMock.questionIds) ? activeMock.questionIds.filter(id => activeMockQuestionIds.has(id)).slice(0, 10) : [],
      index: Math.max(0, Math.min(9, Math.floor(Number(activeMock.index) || 0))),
      answers: Object.fromEntries(Object.entries(activeMock.answers || {}).filter(([id, key]) => {
        const question = MOCK_QUESTION_LOOKUP.get(id);
        return activeMockQuestionIds.has(id) && question?.options?.some(option => option.key === key);
      })),
      violations: Math.max(0, Math.min(PROCTOR_VIOLATION_LIMIT - 1, Math.floor(Number(activeMock.violations) || 0)))
    }
    : null;
  const proctorLockUntil = Number.isFinite(Number(safeData.proctorLockUntil))
    ? Math.max(0, Math.min(Date.now() + PROCTOR_LOCK_DURATION, Number(safeData.proctorLockUntil)))
    : 0;
  const proctorViolationCount = Math.max(0, Math.min(PROCTOR_VIOLATION_LIMIT - 1, Math.floor(Number(safeData.proctorViolationCount) || 0)));
  const remoteProctorLockActive = safeData.remoteProctorLockActive === true;
  const syncUpdatedAt = Number.isFinite(Number(safeData.syncUpdatedAt)) ? Math.max(0, Number(safeData.syncUpdatedAt)) : 0;

  return {
    learnerName: name,
    certificateId: typeof safeData.certificateId === 'string' && /^JIET-\d{4}-[A-F0-9]{16}$/.test(safeData.certificateId)
      ? safeData.certificateId
      : generateCertificateId(),
    certificateIssued: safeData.certificateIssued === true,
    xp,
    streak: Number.isFinite(Number(safeData.streak)) ? Math.max(0, Math.floor(Number(safeData.streak))) : 0,
    level: xp >= 1500 ? 5 : xp >= 1000 ? 4 : xp >= 600 ? 3 : xp >= 300 ? 2 : 1,
    soundEnabled: typeof safeData.soundEnabled === 'boolean' ? safeData.soundEnabled : true,
    unlockedBadges: badges,
    answeredQuestions: answers,
    englishAssessments: savedEnglish,
    activeEnglishAssessment: validActiveAttempt,
    mockAssessments: savedMocks,
    activeMockAssessment: validActiveMock,
    proctorLockUntil,
    proctorViolationCount,
    remoteProctorLockActive,
    syncUpdatedAt,
    rahulOrder: safeOrder,
    activeTab: validTabs.has(safeData.activeTab) ? safeData.activeTab : 'tab-concepts'
  };
}

function applyLearnerState(data, fallbackName) {
  const safeData = sanitizeLearnerState(data, fallbackName);
  state.learnerName = safeData.learnerName;
  state.xp = safeData.xp;
  state.streak = safeData.streak;
  state.level = safeData.level;
  state.certificateId = safeData.certificateId;
  state.certificateIssued = safeData.certificateIssued;
  state.soundEnabled = safeData.soundEnabled;
  state.unlockedBadges = new Set(safeData.unlockedBadges);
  state.answeredQuestions = safeData.answeredQuestions;
  state.englishAssessments = safeData.englishAssessments;
  state.activeEnglishAssessment = safeData.activeEnglishAssessment;
  state.mockAssessments = safeData.mockAssessments;
  state.activeMockAssessment = safeData.activeMockAssessment;
  state.proctorLockUntil = safeData.proctorLockUntil;
  state.proctorViolationCount = safeData.proctorViolationCount;
  state.remoteProctorLockActive = safeData.remoteProctorLockActive;
  state.syncUpdatedAt = safeData.syncUpdatedAt;
  state.rahulOrder = safeData.rahulOrder;
  state.activeTab = safeData.activeTab;
}

function loadSavedState(authenticatedUser = null) {
  try {
    const savedProfiles = JSON.parse(localStorage.getItem(PROFILES_STORAGE_KEY) || '{}');
    learnerProfiles = savedProfiles && typeof savedProfiles === 'object' && !Array.isArray(savedProfiles)
      ? savedProfiles
      : {};

    const legacyRaw = localStorage.getItem(LEGACY_STATE_KEY);
    let migratedLegacyState = false;
    let migratedProfileId = null;
    if (legacyRaw) {
      const legacyState = sanitizeLearnerState(JSON.parse(legacyRaw));
      const legacyProfileId = normalizeProfileId(legacyState.learnerName);
      if (legacyState.learnerName !== 'Learner' && !learnerProfiles[legacyProfileId]) {
        learnerProfiles[legacyProfileId] = legacyState;
        migratedLegacyState = true;
        migratedProfileId = legacyProfileId;
      }
    }

    if (authenticatedUser?.uid) {
      activeProfileId = `google:${authenticatedUser.uid}`;
      if (learnerProfiles[activeProfileId]) {
        learnerProfiles[activeProfileId] = sanitizeLearnerState(learnerProfiles[activeProfileId], authenticatedUser.displayName);
        applyLearnerState(learnerProfiles[activeProfileId], authenticatedUser.displayName);
      } else {
        const matchingLocalId = normalizeProfileId(authenticatedUser.displayName || '');
        const matchingLocalProfile = matchingLocalId && learnerProfiles[matchingLocalId];
        if (matchingLocalProfile && confirm(`We found progress saved on this device for “${authenticatedUser.displayName}”. Import it into this Google profile? This only copies this browser's local progress.`)) {
          learnerProfiles[activeProfileId] = sanitizeLearnerState(matchingLocalProfile, authenticatedUser.displayName);
          applyLearnerState(learnerProfiles[activeProfileId], authenticatedUser.displayName);
        } else {
          createFreshLearnerState(authenticatedUser.displayName || 'Learner');
          learnerProfiles[activeProfileId] = {};
        }
      }
      localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(learnerProfiles));
      localStorage.setItem(ACTIVE_PROFILE_STORAGE_KEY, activeProfileId);
    } else {
      const storedActiveProfileId = localStorage.getItem(ACTIVE_PROFILE_STORAGE_KEY);
      const isValidProfileId = (id) => id && learnerProfiles[id] && normalizeProfileId(
        typeof learnerProfiles[id].learnerName === 'string' ? learnerProfiles[id].learnerName : ''
      ) === id;
      const profileId = storedActiveProfileId === ''
        ? null
        : isValidProfileId(storedActiveProfileId) ? storedActiveProfileId
        : isValidProfileId(migratedProfileId) ? migratedProfileId
        : Object.keys(learnerProfiles).find(isValidProfileId);
      if (profileId) {
        activeProfileId = profileId;
        learnerProfiles[profileId] = sanitizeLearnerState(learnerProfiles[profileId]);
        applyLearnerState(learnerProfiles[profileId]);
        localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(learnerProfiles));
        localStorage.setItem(ACTIVE_PROFILE_STORAGE_KEY, profileId);
      } else {
        activeProfileId = null;
        createFreshLearnerState();
        if (storedActiveProfileId === null) localStorage.setItem(ACTIVE_PROFILE_STORAGE_KEY, '');
      }
    }

    if (migratedLegacyState) {
      localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(learnerProfiles));
      localStorage.removeItem(LEGACY_STATE_KEY);
    }
  } catch (e) {
    console.error('Failed to load state from localStorage', e);
    learnerProfiles = {};
    activeProfileId = authenticatedUser?.uid ? `google:${authenticatedUser.uid}` : null;
    createFreshLearnerState(authenticatedUser?.displayName || 'Learner');
  }
}

function persistState() {
  if (!activeProfileId) return;
  state.syncUpdatedAt = Date.now();
  const profileData = {
    learnerName: state.learnerName,
    xp: state.xp,
    streak: state.streak,
    level: state.level,
    soundEnabled: state.soundEnabled,
    certificateId: state.certificateId,
    certificateIssued: state.certificateIssued,
    unlockedBadges: Array.from(state.unlockedBadges),
    answeredQuestions: state.answeredQuestions,
    englishAssessments: state.englishAssessments,
    activeEnglishAssessment: state.activeEnglishAssessment,
    mockAssessments: state.mockAssessments,
    activeMockAssessment: state.activeMockAssessment,
    proctorLockUntil: state.proctorLockUntil,
    proctorViolationCount: state.proctorViolationCount,
    remoteProctorLockActive: state.remoteProctorLockActive,
    syncUpdatedAt: state.syncUpdatedAt,
    rahulOrder: state.rahulOrder,
    activeTab: state.activeTab
  };
  try {
    learnerProfiles[activeProfileId] = profileData;
    localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(learnerProfiles));
    localStorage.setItem(ACTIVE_PROFILE_STORAGE_KEY, activeProfileId);
  } catch (e) {
    console.error('Failed to save state to localStorage', e);
  }
  if (authUser?.uid && window.firebaseSaveLearner) {
    pendingCloudRecord = buildCloudLearnerRecord(profileData);
    if (cloudSaveTimeout) clearTimeout(cloudSaveTimeout);
    cloudSaveTimeout = setTimeout(() => { flushPendingCloudSave(); }, 650);
  }
}

function buildCloudLearnerRecord(profileData = null) {
  const learnerState = profileData || {
    learnerName: state.learnerName,
    xp: state.xp,
    streak: state.streak,
    level: state.level,
    certificateId: state.certificateId,
    certificateIssued: state.certificateIssued,
    unlockedBadges: Array.from(state.unlockedBadges),
    answeredQuestions: state.answeredQuestions,
    englishAssessments: state.englishAssessments,
    activeEnglishAssessment: state.activeEnglishAssessment,
    mockAssessments: state.mockAssessments,
    activeMockAssessment: state.activeMockAssessment,
    proctorLockUntil: state.proctorLockUntil,
    proctorViolationCount: state.proctorViolationCount,
    remoteProctorLockActive: state.remoteProctorLockActive,
    syncUpdatedAt: state.syncUpdatedAt,
    rahulOrder: state.rahulOrder,
    activeTab: state.activeTab
  };
  const learningLevels = getLearningLevelProgress().map(level => ({
    id: level.id,
    title: level.title,
    complete: level.complete,
    answered: level.result.answered,
    total: level.result.total,
    percentage: level.result.percentage
  }));
  const passedMocks = Object.values(learnerState.mockAssessments || {}).filter(result => result?.passed).length;
  return {
    uid: authUser.uid,
    learnerName: learnerState.learnerName,
    email: authUser.email || '',
    photoURL: authUser.photoURL || '',
    xp: learnerState.xp,
    level: learnerState.level,
    streak: learnerState.streak,
    badgeCount: learnerState.unlockedBadges.length,
    unlockedBadges: learnerState.unlockedBadges,
    answeredQuestionCount: Object.keys(learnerState.answeredQuestions || {}).length,
    learningLevels,
    englishAssessments: learnerState.englishAssessments,
    mockAssessments: learnerState.mockAssessments,
    passedMocks,
    certificateIssued: learnerState.certificateIssued,
    clientUpdatedAt: learnerState.syncUpdatedAt,
    profileData: learnerState
  };
}

function flushPendingCloudSave() {
  if (cloudSaveTimeout) clearTimeout(cloudSaveTimeout);
  cloudSaveTimeout = null;
  if (!pendingCloudRecord || !authUser?.uid || !window.firebaseSaveLearner) return Promise.resolve();
  const record = pendingCloudRecord;
  const uid = authUser.uid;
  pendingCloudRecord = null;
  return window.firebaseSaveLearner(uid, record).then(() => setCloudSyncStatus('Progress synced to Firebase.'))
    .catch(error => {
      pendingCloudRecord = record;
      setCloudSyncStatus('Cloud sync is unavailable. Progress remains saved on this device.');
      console.warn('Learner progress sync failed:', error?.code || error);
    });
}

window.addEventListener?.('online', () => { flushPendingCloudSave(); });

function setCloudSyncStatus(message) {
  const status = document.getElementById('cloudSyncStatus');
  if (status) status.textContent = message;
}

function getAssessmentResult(questions) {
  const answered = questions.filter(q => state.answeredQuestions[q.id]).length;
  const correct = questions.filter(q => state.answeredQuestions[q.id]?.correct).length;
  return {
    answered,
    correct,
    total: questions.length,
    complete: answered === questions.length,
    percentage: questions.length ? Math.round((correct / questions.length) * 100) : 0
  };
}

function getLearningLevelProgress() {
  const combinedResult = questions => getAssessmentResult(questions);
  const foundation = combinedResult(FOUNDATION_ASSESSMENT);
  const englishRecords = ENGLISH_TOPICS.map(topic => state.englishAssessments[topic.id]).filter(Boolean);
  const passedEnglish = ENGLISH_TOPICS.filter(topic => (state.englishAssessments[topic.id]?.bestPercent || 0) >= 70).length;
  const english = {
    answered: passedEnglish,
    correct: englishRecords.reduce((sum, record) => sum + record.bestCorrect, 0),
    total: ENGLISH_TOPICS.length,
    percentage: Math.round(englishRecords.reduce((sum, record) => sum + record.bestCorrect, 0) / (ENGLISH_TOPICS.length * 50) * 100),
    complete: passedEnglish === ENGLISH_TOPICS.length
  };
  const drills = combinedResult([...PROACTIVE_DRILLS, ...POS_DRILLS, { id: 'rahul_timeline' }]);
  const sentences = combinedResult([...SENTENCE_PAGE_1, ...SENTENCE_PAGE_2]);
  const parajumbles = combinedResult([...PARAJUMBLES_PAGE_1, ...PARAJUMBLES_PAGE_2_3]);
  const cloze = combinedResult(CLOZE_QUESTIONS);
  const softSkills = combinedResult(CAREER_ASSESSMENTS.softSkills);
  const communication = combinedResult(CAREER_ASSESSMENTS.communication);
  const aptitude = combinedResult(APTITUDE_QUESTIONS);
  const definitions = [
    { number: 1, id: 'foundations', paneId: 'tab-concepts', title: 'Foundations', badgeId: 'level_foundations', result: foundation },
    { number: 2, id: 'english', paneId: 'tab-english', title: 'English Mastery', badgeId: 'level_english', result: english },
    { number: 3, id: 'drills', paneId: 'tab-drills', title: 'Proactive Drills', badgeId: 'level_drills', result: drills },
    { number: 4, id: 'sentences', paneId: 'tab-sentences', title: 'Sentence Battles', badgeId: 'level_sentences', result: sentences },
    { number: 5, id: 'parajumbles', paneId: 'tab-parajumbles', title: 'Para-Jumbles', badgeId: 'level_parajumbles', result: parajumbles },
    { number: 6, id: 'cloze', paneId: 'tab-cloze', title: 'Passage Cloze', badgeId: 'level_cloze', result: cloze },
    { number: 7, id: 'soft_skills', paneId: 'tab-soft-skills', title: 'Soft Skills', badgeId: 'level_soft_skills', result: softSkills },
    { number: 8, id: 'communication', paneId: 'tab-communication', title: 'Communication', badgeId: 'level_communication', result: communication },
    { number: 9, id: 'aptitude', paneId: 'tab-aptitude', title: 'Placement Aptitude', badgeId: 'level_aptitude', result: aptitude }
  ].map(level => ({ ...level, complete: level.result.complete && level.result.percentage >= 70 }));
  const learningLevelsComplete = definitions.every(level => level.complete);
  definitions.push({
    number: 10,
    id: 'certificates',
    paneId: 'tab-certificate',
    title: 'Certificates',
    badgeId: 'level_certificates',
    result: { answered: state.certificateIssued ? 1 : 0, correct: state.certificateIssued ? 1 : 0, total: 1, percentage: state.certificateIssued ? 100 : 0, complete: state.certificateIssued && learningLevelsComplete },
    complete: state.certificateIssued && learningLevelsComplete,
    locked: !learningLevelsComplete
  });
  return definitions;
}

function areAllLearningLevelsComplete() {
  return getLearningLevelProgress().filter(level => level.number <= 9).every(level => level.complete);
}

function getNewLevelBadges(levels = getLearningLevelProgress(), unlocked = state.unlockedBadges) {
  return levels.filter(level => level.complete && !unlocked.has(level.badgeId));
}

function updateLearningProgressUI() {
  const levels = getLearningLevelProgress();
  const newLevelBadges = getNewLevelBadges(levels);
  newLevelBadges.forEach(level => {
    state.unlockedBadges.add(level.badgeId);
    if (level.number === 1) state.unlockedBadges.add('recruit');
  });
  if (newLevelBadges.length) {
    sfx.playBadge();
    triggerConfetti(1.1);
    showToast(newLevelBadges.length === 1
      ? `🏅 Level ${newLevelBadges[0].number} badge unlocked: ${LEVEL_BADGES.find(badge => badge.id === newLevelBadges[0].badgeId)?.title}!`
      : `🏅 ${newLevelBadges.length} level badges unlocked!`);
    persistState();
  }

  levels.forEach(level => {
    const pane = document.getElementById(level.paneId);
    const desktopButton = document.querySelector(`.nav-tab[data-tab="${level.paneId}"]`);
    const mobileButton = document.querySelector(`.mobile-nav-btn[data-tab="${level.paneId}"]`);
    [desktopButton, mobileButton].forEach(button => {
      if (!button) return;
      button.classList.toggle('completed', level.complete);
      button.classList.toggle('locked', Boolean(level.locked));
      button.title = level.locked ? `Complete Levels 1–9 to unlock ${level.title}.` : level.complete ? `${level.title} complete — select to review.` : `${level.title} in progress.`;
      button.setAttribute('aria-label', `${level.number}. ${level.title}${level.complete ? ', completed' : level.locked ? ', locked until Levels 1 through 9 are complete' : ', in progress'}`);
    });
    if (!pane) return;
    pane.classList.toggle('level-complete', level.complete);
    let status = pane.querySelector('.level-progress-status');
    if (!status) {
      status = document.createElement('div');
      status.className = 'level-progress-status';
      status.setAttribute('role', 'status');
      pane.querySelector('.section-header')?.after(status);
    }
    status.classList.toggle('is-complete', level.complete);
    if (level.locked) status.textContent = `🔒 Level 10 is locked. Complete Levels 1–9 before downloading your final certificate.`;
    else if (level.number === 2) status.textContent = level.complete
      ? `✓ Level 2 complete · ${level.result.answered}/${level.result.total} English assessments passed · Badge unlocked`
      : `Level 2 progress · ${level.result.answered}/${level.result.total} English assessments passed at 70% or higher`;
    else if (level.complete) status.textContent = `✓ Level ${level.number} complete · ${level.result.correct}/${level.result.total} correct · Badge unlocked · Review anytime`;
    else status.textContent = `Level ${level.number} in progress · ${level.result.answered}/${level.result.total} answered · ${level.result.percentage}% (70% and all answers required)`;
  });

  const completionKey = levels.map(level => level.complete ? '1' : '0').join('');
  if (completionKey !== lastLevelCompletionKey) {
    lastLevelCompletionKey = completionKey;
    renderEnglishTopicCards();
  }
  updateCertificateAccessUI(levels);
}

function updateCertificateAccessUI(levels = getLearningLevelProgress()) {
  const allLevelsComplete = levels.filter(level => level.number <= 9).every(level => level.complete);
  const lockPanel = document.getElementById('certificateLockPanel');
  const certificateContent = document.getElementById('certificateUnlockedContent');
  if (lockPanel) lockPanel.classList.toggle('hidden', allLevelsComplete);
  if (certificateContent) certificateContent.classList.toggle('hidden', !allLevelsComplete);
  const lockList = document.getElementById('certificateLevelChecklist');
  if (lockList) {
    lockList.innerHTML = levels.filter(level => level.number <= 9).map(level =>
      `<li class="${level.complete ? 'done' : ''}"><span>${level.complete ? '✓' : '○'}</span><strong>Level ${level.number}: ${escapeEnglishHTML(level.title)}</strong><small>${level.complete ? 'Passed — badge earned' : level.number === 2 ? `${level.result.answered}/8 English assessments passed` : `${level.result.answered}/${level.result.total} questions answered · ${level.result.percentage}%`}</small></li>`
    ).join('');
  }
}

function updateCareerTrackUI() {
  const trackDisplays = [
    { id: 'softSkills', questions: CAREER_ASSESSMENTS.softSkills, certificate: CAREER_CERTIFICATES.softSkills },
    { id: 'communication', questions: CAREER_ASSESSMENTS.communication, certificate: CAREER_CERTIFICATES.communication },
    { id: 'aptitude', questions: APTITUDE_QUESTIONS, certificate: CAREER_CERTIFICATES.aptitude }
  ];

  trackDisplays.forEach((track) => {
    const result = getAssessmentResult(track.questions);
    const progress = document.getElementById(`${track.id}Progress`);
    const certificateButtons = ['PNG', 'PDF'].map(format => document.getElementById(`${track.id}Certificate${format}Btn`)).filter(Boolean);
    const eligible = areAllLearningLevelsComplete() && result.complete && result.percentage >= 70;
    if (progress) {
      progress.textContent = `${result.answered}/${result.total} answered · ${result.correct} correct · ${result.percentage}%`;
    }
    certificateButtons.forEach(button => { button.disabled = !eligible; });
    const lockNote = document.getElementById(`${track.id}CertificateStatus`);
    if (lockNote) lockNote.textContent = !areAllLearningLevelsComplete()
      ? 'Locked until all nine learning levels are passed.'
      : eligible ? `Unlocked · ${result.percentage}%` : 'Complete every question and score at least 70%.';
  });
}

// ==========================================
// ENGLISH MASTERY: TIMED, RESUMABLE 50-QUESTION TESTS
// ==========================================
let englishTimerInterval = null;

function escapeEnglishHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

function renderEnglishTopicCards() {
  const grid = document.getElementById('englishTopicGrid');
  const topicNav = document.getElementById('englishTopicNav');
  if (!grid || !topicNav) return;
  grid.innerHTML = '';
  topicNav.innerHTML = '';
  ENGLISH_TOPICS.forEach(topic => {
    const previous = state.englishAssessments[topic.id];
    const active = state.activeEnglishAssessment?.topicId === topic.id;
    const article = document.createElement('article');
    article.className = 'english-topic-card';
    article.classList.toggle('completed', (previous?.bestPercent || 0) >= 70);
    article.id = `english-topic-${topic.id}`;
    article.innerHTML = `
      <div class="english-topic-card-title"><span>${escapeEnglishHTML(topic.icon)}</span><div><h3>${escapeEnglishHTML(topic.title)}</h3><span class="badge-chip">50 MCQs · 50 min</span></div></div>
      <p>${escapeEnglishHTML(topic.description)}</p>
      <details class="mentor-note-details">
        <summary>🗒️ Live Notes With Mentor Kapil</summary>
        <div class="mentor-note-body"><p>${escapeEnglishHTML(topic.notes)}</p><strong>Solved placement example</strong><p>${escapeEnglishHTML(topic.solved)}</p></div>
      </details>
      <div class="english-topic-result">${previous ? `Best score: <strong>${previous.bestCorrect}/50 (${previous.bestPercent}%)</strong> · ${previous.attempts} attempt${previous.attempts === 1 ? '' : 's'}` : 'Assessment not attempted yet.'}</div>
      <div class="english-topic-actions"><button type="button" class="btn btn-primary" onclick="startEnglishAssessment('${topic.id}')">${active ? '▶ Resume assessment' : previous ? '↻ Retake assessment' : '▶ Start assessment'}</button>${previous?.bestPercent >= 70 && areAllLearningLevelsComplete() ? `<button type="button" class="btn btn-secondary" onclick="downloadEnglishCertificate('${topic.id}', 'png')">Certificate PNG</button><button type="button" class="btn btn-secondary" onclick="downloadEnglishCertificate('${topic.id}', 'pdf')">Certificate PDF</button>` : ''}</div>
    `;
    grid.appendChild(article);

    const navButton = document.createElement('button');
    navButton.type = 'button';
    navButton.className = 'english-topic-nav-btn';
    navButton.textContent = topic.title;
    navButton.setAttribute('aria-label', `Jump to ${topic.title}`);
    navButton.addEventListener('click', () => scrollToEnglishTopic(topic.id));
    topicNav.appendChild(navButton);
  });
}

function scrollToEnglishTopic(topicId) {
  const topicCard = document.getElementById(`english-topic-${topicId}`);
  if (!topicCard) return;
  if (!document.getElementById('tab-english').classList.contains('active')) switchTab('tab-english');
  topicCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function startEnglishAssessment(topicId) {
  if (!ENGLISH_ASSESSMENTS[topicId]) return;
  if (state.activeEnglishAssessment && state.activeEnglishAssessment.topicId !== topicId) {
    if (!confirm('A timed English assessment is in progress. Starting another topic will submit the current attempt with unanswered questions marked incorrect. Continue?')) return;
    finishEnglishAssessment(true);
  }
  if (!state.activeEnglishAssessment) {
    state.activeEnglishAssessment = { topicId, startedAt: Date.now(), answers: {}, index: 0, hintOpen: false };
  }
  switchTab('tab-english');
  persistState();
  activateEnglishAssessmentUI(topicId);
}

function activateEnglishAssessmentUI(topicId, startClock = true) {
  const topic = ENGLISH_TOPICS.find(item => item.id === topicId);
  const panel = document.getElementById('englishAssessmentPanel');
  if (!topic || !panel) return;
  panel.classList.remove('hidden');
  document.getElementById('englishExamTopicChip').textContent = '50 Questions · 50 minutes';
  document.getElementById('englishExamTitle').textContent = `${topic.title} Assessment`;
  document.getElementById('englishAssessmentResult').classList.add('hidden');
  document.getElementById('englishQuestionMount').classList.remove('hidden');
  document.querySelector('.english-exam-progress-row').classList.remove('hidden');
  document.querySelector('.english-exam-progress-track').classList.remove('hidden');
  document.querySelector('.english-exam-controls').classList.remove('hidden');
  document.querySelector('.english-exam-submit-row').classList.remove('hidden');
  renderEnglishQuestion();
  if (startClock) startEnglishTimer();
}

function renderEnglishQuestion() {
  const attempt = state.activeEnglishAssessment;
  if (!attempt) return;
  const questions = ENGLISH_ASSESSMENTS[attempt.topicId];
  const question = questions[attempt.index];
  if (!question) return;
  const mount = document.getElementById('englishQuestionMount');
  mount.innerHTML = `<article class="english-question-card"><div class="question-top-meta"><span>${question.qNum}</span><span class="xp-badge">Placement English</span></div><h4>${escapeEnglishHTML(question.prompt)}</h4><div class="english-option-list">${question.options.map(option => `<button type="button" class="english-option-btn ${attempt.answers[question.id] === option.key ? 'selected' : ''}" data-choice="${option.key}" aria-pressed="${attempt.answers[question.id] === option.key}"><span class="english-option-key">${option.key.toUpperCase()}</span><span>${escapeEnglishHTML(option.text)}</span></button>`).join('')}</div><div class="english-hint-box ${attempt.hintOpen ? 'visible' : ''}" id="englishHintBox">💡 ${escapeEnglishHTML(question.hint)}</div></article>`;
  mount.querySelectorAll('.english-option-btn').forEach(button => button.addEventListener('click', () => {
    attempt.answers[question.id] = button.dataset.choice;
    attempt.hintOpen = false;
    persistState();
    renderEnglishQuestion();
  }));
  document.getElementById('englishQuestionPosition').textContent = `Question ${attempt.index + 1} of 50`;
  document.getElementById('englishAnsweredCount').textContent = `${Object.keys(attempt.answers).length} answered`;
  document.getElementById('englishExamProgressFill').style.width = `${((attempt.index + 1) / questions.length) * 100}%`;
  document.getElementById('englishPreviousBtn').disabled = attempt.index === 0;
  document.getElementById('englishNextBtn').disabled = attempt.index === questions.length - 1;
  document.getElementById('englishHintBtn').textContent = attempt.hintOpen ? '🙈 Hide hint' : '💡 Show hint';
}

function moveEnglishQuestion(step) {
  const attempt = state.activeEnglishAssessment;
  if (!attempt) return;
  attempt.index = Math.max(0, Math.min(49, attempt.index + step));
  attempt.hintOpen = false;
  persistState();
  renderEnglishQuestion();
}

function toggleEnglishHint() {
  if (!state.activeEnglishAssessment) return;
  state.activeEnglishAssessment.hintOpen = !state.activeEnglishAssessment.hintOpen;
  persistState();
  renderEnglishQuestion();
}

function startEnglishTimer() {
  if (englishTimerInterval) clearInterval(englishTimerInterval);
  const tick = () => {
    const attempt = state.activeEnglishAssessment;
    if (!attempt) {
      clearInterval(englishTimerInterval);
      englishTimerInterval = null;
      return;
    }
    const remaining = Math.max(0, 50 * 60 * 1000 - (Date.now() - attempt.startedAt));
    const seconds = Math.ceil(remaining / 1000);
    const timer = document.getElementById('englishTimer');
    if (timer) {
      timer.textContent = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
      timer.classList.toggle('urgent', seconds <= 5 * 60);
    }
    if (remaining <= 0) finishEnglishAssessment(true);
  };
  tick();
  if (state.activeEnglishAssessment) englishTimerInterval = setInterval(tick, 1000);
}

function submitEnglishAssessment() {
  if (!state.activeEnglishAssessment) return;
  const unanswered = 50 - Object.keys(state.activeEnglishAssessment.answers).length;
  if (unanswered && !confirm(`You have ${unanswered} unanswered question${unanswered === 1 ? '' : 's'}. Submit now? Unanswered questions count as incorrect.`)) return;
  finishEnglishAssessment(false);
}

function finishEnglishAssessment(timesUp) {
  const attempt = state.activeEnglishAssessment;
  if (!attempt) return;
  if (englishTimerInterval) clearInterval(englishTimerInterval);
  englishTimerInterval = null;
  const questions = ENGLISH_ASSESSMENTS[attempt.topicId];
  const correct = questions.filter(question => attempt.answers[question.id] === question.answer).length;
  const old = state.englishAssessments[attempt.topicId];
  const firstAttempt = !old;
  const bestCorrect = Math.max(old?.bestCorrect || 0, correct);
  const bestPercent = Math.round(bestCorrect / questions.length * 100);
  const completedAt = new Date().toISOString();
  state.englishAssessments[attempt.topicId] = {
    bestCorrect,
    bestPercent,
    attempts: (old?.attempts || 0) + 1,
    completedAt,
    bestCompletedAt: correct >= (old?.bestCorrect || 0) ? completedAt : (old?.bestCompletedAt || old?.completedAt || completedAt),
    certificateId: old?.certificateId || generateCertificateId()
  };
  state.activeEnglishAssessment = null;
  if (bestPercent >= 80) unlockBadge(`english_${attempt.topicId}`);
  if (firstAttempt && correct) addXP(correct * 5, `English assessment: ${correct}/50 correct`);
  else {
    updateHUD();
    persistState();
  }
  renderEnglishTopicCards();
  const topic = ENGLISH_TOPICS.find(item => item.id === attempt.topicId);
  const panel = document.getElementById('englishAssessmentPanel');
  document.getElementById('englishQuestionMount').classList.add('hidden');
  document.querySelector('.english-exam-progress-row').classList.add('hidden');
  document.querySelector('.english-exam-progress-track').classList.add('hidden');
  document.querySelector('.english-exam-controls').classList.add('hidden');
  document.querySelector('.english-exam-submit-row').classList.add('hidden');
  const result = document.getElementById('englishAssessmentResult');
  result.classList.remove('hidden');
  const certificateReady = areAllLearningLevelsComplete();
  result.innerHTML = `<h4>${timesUp ? '⏱️ Time is up' : 'Assessment submitted'}: ${escapeEnglishHTML(topic.title)}</h4><p>Your score: <strong>${correct}/50 (${Math.round(correct / 50 * 100)}%)</strong>. Best score: <strong>${bestCorrect}/50 (${bestPercent}%)</strong>.</p><p>${bestPercent >= 80 ? '🏅 Topic badge earned!' : bestPercent >= 70 ? certificateReady ? 'All learning levels are complete; your topic certificate is unlocked.' : 'Your score qualifies. Topic certificates unlock after all nine learning levels are passed.' : 'Review Kapil’s notes and try again to reach 70% for a certificate.'}</p><div class="english-topic-actions"><button type="button" class="btn btn-primary" onclick="startEnglishAssessment('${topic.id}')">↻ Retake assessment</button>${bestPercent >= 70 && certificateReady ? `<button type="button" class="btn btn-secondary" onclick="downloadEnglishCertificate('${topic.id}', 'png')">Topic certificate PNG</button><button type="button" class="btn btn-secondary" onclick="downloadEnglishCertificate('${topic.id}', 'pdf')">Topic certificate PDF</button>` : ''}</div>`;
  if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  showToast(timesUp ? 'Time is up. Your assessment has been submitted.' : `Assessment complete: ${correct}/50 correct.`);
}

function downloadEnglishCertificate(topicId, format = 'png') {
  const topic = ENGLISH_TOPICS.find(item => item.id === topicId);
  const result = state.englishAssessments[topicId];
  if (!areAllLearningLevelsComplete()) {
    showToast('Complete all nine learning levels to unlock certificates.');
    return;
  }
  if (!topic || !result || result.bestPercent < 70) return;
  const canvas = document.createElement('canvas');
  canvas.width = 1400;
  canvas.height = 990;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#FFFDF9'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#D4AF37'; ctx.lineWidth = 10; ctx.strokeRect(32, 32, canvas.width - 64, canvas.height - 64);
  ctx.strokeStyle = '#FF5500'; ctx.lineWidth = 3; ctx.strokeRect(52, 52, canvas.width - 104, canvas.height - 104);
  ctx.textAlign = 'center'; ctx.fillStyle = '#FF5500'; ctx.font = '700 34px sans-serif'; ctx.fillText('JIET • MENTORSHIP WITH KAPIL', 700, 170);
  ctx.fillStyle = '#C28B38'; ctx.font = '700 22px sans-serif'; ctx.fillText('CERTIFICATE OF ACHIEVEMENT', 700, 270);
  ctx.fillStyle = '#0F172A'; ctx.font = '700 58px Georgia, serif'; ctx.fillText(topic.title, 700, 370);
  ctx.fillStyle = '#64748B'; ctx.font = '24px sans-serif'; ctx.fillText('This certificate is proudly awarded to', 700, 470);
  ctx.fillStyle = '#FF5500'; ctx.font = '700 54px Georgia, serif'; ctx.fillText(getCertificateRecipientName().toUpperCase(), 700, 555);
  ctx.fillStyle = '#334155'; ctx.font = '24px sans-serif'; ctx.fillText(`Best score ${result.bestCorrect}/50 (${result.bestPercent}%) · Timed placement English assessment`, 700, 660);
  ctx.fillText(`Certificate ID: ${result.certificateId}`, 700, 715);
  ctx.fillText(`Issued ${new Date(result.bestCompletedAt || result.completedAt || Date.now()).toLocaleDateString('en-GB')}`, 700, 765);
  ctx.font = '700 22px sans-serif'; ctx.fillText('Placement Readiness Mentorship With Kapil', 700, 850);
  downloadCanvasArtifact(canvas, `JIET_${topicId}_Certificate_${safeFilename(state.learnerName)}`, format);
}

function getCertificateRecipientName() {
  const input = document.getElementById('certCustomName');
  return (input?.value || '').trim() || state.learnerName;
}

function safeFilename(value) {
  return String(value || 'Learner').trim().replace(/[^a-z0-9_-]+/gi, '_').replace(/^_+|_+$/g, '') || 'Learner';
}

function imageCanvasToPdfBlob(canvas) {
  const jpegData = canvas.toDataURL('image/jpeg', 0.94).split(',')[1];
  const jpegBinary = atob(jpegData);
  const jpegBytes = Uint8Array.from(jpegBinary, character => character.charCodeAt(0));
  const encoder = new TextEncoder();
  const chunks = [];
  let byteLength = 0;
  const offsets = [0];
  const append = bytes => { chunks.push(bytes); byteLength += bytes.length; };
  const text = value => encoder.encode(value);
  append(text('%PDF-1.4\n'));
  const addObject = (number, body) => {
    offsets[number] = byteLength;
    append(text(`${number} 0 obj\n${body}\nendobj\n`));
  };
  addObject(1, '<< /Type /Catalog /Pages 2 0 R >>');
  addObject(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  addObject(3, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>');
  offsets[4] = byteLength;
  append(text(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`));
  append(jpegBytes);
  append(text('\nendstream\nendobj\n'));
  const pageContent = `q\n842 0 0 595 0 0 cm\n/Im0 Do\nQ\n`;
  addObject(5, `<< /Length ${text(pageContent).length} >>\nstream\n${pageContent}endstream`);
  const xrefOffset = byteLength;
  let xref = `xref\n0 6\n0000000000 65535 f \n`;
  for (let object = 1; object <= 5; object++) xref += `${String(offsets[object]).padStart(10, '0')} 00000 n \n`;
  xref += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  append(text(xref));
  return new Blob(chunks, { type: 'application/pdf' });
}

function downloadCanvasArtifact(canvas, baseFilename, format = 'png') {
  const kind = format === 'pdf' ? 'pdf' : 'png';
  const link = document.createElement('a');
  link.download = `${baseFilename}.${kind}`;
  if (kind === 'pdf') {
    const blobUrl = URL.createObjectURL(imageCanvasToPdfBlob(canvas));
    link.href = blobUrl;
    link.click();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  } else {
    link.href = canvas.toDataURL('image/png');
    link.click();
  }
}

function recordFinalCertificateDownload() {
  if (state.certificateIssued) return;
  state.certificateIssued = true;
  updateHUD();
  persistState();
}

function getMockId(topicId, mockIndex) { return `${topicId}:${mockIndex + 1}`; }

function getMockQuestions(topic, mockIndex) {
  const available = topic.questions.filter(question => question.id && question.answer && Array.isArray(question.options) && question.options.length >= 2);
  const count = Math.min(10, available.length);
  if (!count) return [];
  const complexity = question => {
    const promptLength = String(question.prompt || '').replace(/<[^>]*>/g, '').length;
    const optionLength = question.options.reduce((sum, option) => sum + String(option.text || '').length, 0) / question.options.length;
    const fragmentCount = question.fragments?.length || 0;
    return promptLength + optionLength * 0.6 + fragmentCount * 40;
  };
  const ordered = [...available].sort((left, right) => complexity(left) - complexity(right));
  const start = Math.round((mockIndex / (MOCK_DIFFICULTIES.length - 1)) * (ordered.length - count));
  return ordered.slice(start, start + count);
}

function getMockOptions(question, mockIndex) {
  const options = question.options || [];
  if (options.length < 2) return options;
  const shift = mockIndex % options.length;
  return [...options.slice(shift), ...options.slice(0, shift)];
}

function getMockTopicProgress(topicId) {
  const records = MOCK_DIFFICULTIES.map((_, index) => state.mockAssessments[getMockId(topicId, index)]);
  return { records, passed: records.filter(result => result?.passed).length, total: MOCK_DIFFICULTIES.length };
}

function renderMockCenter() {
  const root = document.getElementById('mockTopicGrid');
  if (!root) return;
  root.innerHTML = MOCK_TOPICS.map(topic => {
    const progress = getMockTopicProgress(topic.id);
    const passedAll = progress.passed === progress.total;
    const seriesBadge = MOCK_CERTIFICATE_BADGES.find(badge => badge.id === `mock_${topic.id}`);
    if (passedAll && !state.unlockedBadges.has(seriesBadge.id)) unlockBadge(seriesBadge.id);
    const mocks = MOCK_DIFFICULTIES.map((difficulty, index) => {
      const result = progress.records[index];
      const locked = state.proctorLockUntil > Date.now();
      const resume = state.activeMockAssessment?.topicId === topic.id && state.activeMockAssessment.mockIndex === index;
      return `<article class="mock-set-card ${result?.passed ? 'passed' : ''}"><div><strong>Mock ${index + 1} · ${difficulty.label}</strong><span>${Math.min(10, topic.questions.length)} questions · ${Math.ceil(Math.min(10, topic.questions.length) * difficulty.secondsPerQuestion / 60)} min · ${result ? `Best ${result.bestPercent}%` : 'Not attempted'}</span></div><button class="btn ${result?.passed ? 'btn-secondary' : 'btn-primary'}" type="button" ${locked ? 'disabled' : ''} onclick="startMockAssessment('${topic.id}', ${index})">${resume ? 'Resume mock' : result ? 'Retake' : 'Start'}</button></article>`;
    }).join('');
    const certificateActions = passedAll
      ? `<div class="certificate-download-actions"><button class="btn btn-secondary" type="button" onclick="downloadMockCertificate('${topic.id}', 'png')">📥 Topic certificate (PNG)</button><button class="btn btn-secondary" type="button" onclick="downloadMockCertificate('${topic.id}', 'pdf')">📄 Topic certificate (PDF)</button></div>`
      : `<p class="certificate-lock-note">Pass all five mocks at 70% or higher to unlock the ${escapeEnglishHTML(seriesBadge.title)} badge and topic certificates.</p>`;
    return `<section class="mock-topic-card"><div class="mock-topic-heading"><span>${escapeEnglishHTML(topic.icon)}</span><div><h3>${escapeEnglishHTML(topic.title)}</h3><p>${progress.passed}/${progress.total} mocks passed · 70% to pass · first completion earns XP</p></div></div><div class="mock-set-list">${mocks}</div>${certificateActions}</section>`;
  }).join('');
}

function startMockAssessment(topicId, mockIndex) {
  if (state.proctorLockUntil > Date.now()) { renderProctorLockScreen(); return; }
  const topic = MOCK_TOPICS.find(item => item.id === topicId);
  const difficulty = MOCK_DIFFICULTIES[mockIndex];
  if (!topic || !difficulty) return;
  if (state.activeMockAssessment && (state.activeMockAssessment.topicId !== topicId || state.activeMockAssessment.mockIndex !== mockIndex)) {
    recordProctorViolation('starting a different mock before submitting the active one');
    return;
  }
  if (!confirm(`Timed, camera-free proctoring is active for ${topic.title}, Mock ${mockIndex + 1} (${difficulty.label}). Keep this tab visible and stay in fullscreen. Three visibility/fullscreen violations lock this local learner profile for 24 hours. Continue?`)) return;
  const begin = () => {
    if (!state.activeMockAssessment || state.activeMockAssessment.topicId !== topicId || state.activeMockAssessment.mockIndex !== mockIndex) {
      const questions = getMockQuestions(topic, mockIndex);
      state.activeMockAssessment = {
        topicId,
        mockIndex,
        startedAt: Date.now(),
        durationMs: questions.length * difficulty.secondsPerQuestion * 1000,
        questionIds: questions.map(question => question.id),
        index: 0,
        answers: {},
        violations: 0
      };
    }
    state.activeTab = 'tab-mock-center';
    persistState();
    switchTab('tab-mock-center');
    renderMockExam();
    document.getElementById('mockExamPanel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  if (!document.fullscreenElement && document.documentElement?.requestFullscreen && document.fullscreenEnabled) {
    document.documentElement.requestFullscreen().then(begin).catch(() => showToast('Fullscreen permission is needed to start this proctored mock.'));
  } else begin();
}

function renderMockExam() {
  const attempt = state.activeMockAssessment;
  if (!attempt) return;
  const topic = MOCK_TOPICS.find(item => item.id === attempt.topicId);
  const questions = attempt.questionIds.map(id => MOCK_QUESTION_LOOKUP.get(id)).filter(Boolean);
  const question = questions[attempt.index];
  const panel = document.getElementById('mockExamPanel');
  if (!topic || !question || !panel) return;
  panel.classList.remove('hidden');
  document.getElementById('mockAssessmentResult').classList.add('hidden');
  document.getElementById('mockExamTitle').textContent = `${topic.title} · Mock ${attempt.mockIndex + 1} · ${MOCK_DIFFICULTIES[attempt.mockIndex].label}`;
  document.getElementById('mockQuestionPosition').textContent = `Question ${attempt.index + 1} of ${questions.length}`;
  document.getElementById('mockQuestionProgress').style.width = `${Math.round((Object.keys(attempt.answers).length / questions.length) * 100)}%`;
  const mount = document.getElementById('mockQuestionMount');
  const displayOptions = getMockOptions(question, attempt.mockIndex);
  mount.innerHTML = `<article class="english-question-card"><div class="question-top-meta"><span>${escapeEnglishHTML(question.qNum || `Question ${attempt.index + 1}`)}</span><span class="badge-chip">${escapeEnglishHTML(MOCK_DIFFICULTIES[attempt.mockIndex].label)} · No hints</span></div><h4>${escapeEnglishHTML(question.prompt)}</h4><div class="english-option-list">${displayOptions.map(option => `<button type="button" class="english-option-btn ${attempt.answers[question.id] === option.key ? 'selected' : ''}" data-choice="${escapeEnglishHTML(option.key)}" aria-pressed="${attempt.answers[question.id] === option.key}"><span class="english-option-key">${escapeEnglishHTML(option.key.toUpperCase())}</span><span>${escapeEnglishHTML(option.text)}</span></button>`).join('')}</div></article>`;
  mount.querySelectorAll('.english-option-btn').forEach(button => button.addEventListener('click', () => {
    attempt.answers[question.id] = button.dataset.choice;
    persistState();
    renderMockExam();
  }));
  document.getElementById('mockPreviousBtn').disabled = attempt.index === 0;
  document.getElementById('mockNextBtn').disabled = attempt.index === questions.length - 1;
  document.getElementById('mockAnsweredCount').textContent = `${Object.keys(attempt.answers).length}/${questions.length} answered · ${state.proctorViolationCount}/${PROCTOR_VIOLATION_LIMIT} profile warnings`;
  if (mockTimerInterval) clearInterval(mockTimerInterval);
  const tick = () => {
    if (!state.activeMockAssessment) { clearInterval(mockTimerInterval); mockTimerInterval = null; return; }
    const seconds = Math.max(0, Math.ceil((attempt.durationMs - (Date.now() - attempt.startedAt)) / 1000));
    const timer = document.getElementById('mockTimer');
    if (timer) {
      timer.textContent = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
      timer.classList.toggle('urgent', seconds <= 60);
    }
    if (!seconds) finishMockAssessment(true);
  };
  tick();
  if (state.activeMockAssessment) mockTimerInterval = setInterval(tick, 1000);
}

function moveMockQuestion(step) {
  if (!state.activeMockAssessment) return;
  const questions = getMockQuestions(MOCK_TOPICS.find(topic => topic.id === state.activeMockAssessment.topicId), state.activeMockAssessment.mockIndex);
  state.activeMockAssessment.index = Math.max(0, Math.min(questions.length - 1, state.activeMockAssessment.index + step));
  persistState();
  renderMockExam();
}

function submitMockAssessment() {
  if (!state.activeMockAssessment) return;
  const count = state.activeMockAssessment.questionIds.length;
  const unanswered = count - Object.keys(state.activeMockAssessment.answers).length;
  if (unanswered && !confirm(`${unanswered} question${unanswered === 1 ? '' : 's'} unanswered. Submit now? They count as incorrect.`)) return;
  finishMockAssessment(false);
}

function finishMockAssessment(timesUp) {
  const attempt = state.activeMockAssessment;
  if (!attempt) return;
  if (mockTimerInterval) clearInterval(mockTimerInterval);
  mockTimerInterval = null;
  const topic = MOCK_TOPICS.find(item => item.id === attempt.topicId);
  const questions = attempt.questionIds.map(id => MOCK_QUESTION_LOOKUP.get(id)).filter(Boolean);
  const correct = questions.filter(question => attempt.answers[question.id] === question.answer).length;
  const mockId = getMockId(attempt.topicId, attempt.mockIndex);
  const previous = state.mockAssessments[mockId];
  const bestCorrect = Math.max(previous?.bestCorrect || 0, correct);
  const result = {
    bestCorrect,
    bestPercent: Math.round(bestCorrect / questions.length * 100),
    attempts: (previous?.attempts || 0) + 1,
    passed: bestCorrect >= Math.ceil(questions.length * 0.7),
    xpAwarded: Boolean(previous?.xpAwarded),
    completedAt: new Date().toISOString(),
    certificateId: previous?.certificateId || generateCertificateId()
  };
  state.mockAssessments[mockId] = result;
  state.activeMockAssessment = null;
  const newXP = result.xpAwarded ? 0 : correct * 5 + 10;
  result.xpAwarded = true;
  const topicProgress = getMockTopicProgress(topic.id);
  if (topicProgress.passed === topicProgress.total) unlockBadge(`mock_${topic.id}`);
  updateHUD();
  if (newXP) addXP(newXP, `Mock assessment: ${correct}/${questions.length} correct`);
  else persistState();
  const resultNode = document.getElementById('mockAssessmentResult');
  resultNode.classList.remove('hidden');
  resultNode.innerHTML = `<h3>${timesUp ? '⏱️ Time is up' : 'Mock complete'} · ${escapeEnglishHTML(topic.title)}</h3><p>Score: <strong>${correct}/${questions.length} (${Math.round(correct / questions.length * 100)}%)</strong> · Personal best: <strong>${result.bestPercent}%</strong></p><p>${result.passed ? '✅ Mock passed. Best scores of 70% or higher count toward your topic badge and certificate.' : 'Review the topic lessons and retry this mock to reach 70%.'} XP awarded this mock: <strong>${newXP}</strong></p><button class="btn btn-primary" type="button" onclick="startMockAssessment('${topic.id}', ${attempt.mockIndex})">↻ Retake mock</button>`;
  renderMockCenter();
  if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
  showToast(`Mock assessment complete: ${correct}/${questions.length} correct.`);
}

function recordProctorViolation(reason) {
  const attempt = state.activeMockAssessment;
  const now = Date.now();
  if (!attempt || now - lastProctorViolationAt < 1500) return;
  lastProctorViolationAt = now;
  attempt.violations += 1;
  state.proctorViolationCount = Math.min(PROCTOR_VIOLATION_LIMIT, state.proctorViolationCount + 1);
  document.getElementById('mockViolationNotice').textContent = `Proctor warning ${state.proctorViolationCount}/${PROCTOR_VIOLATION_LIMIT}: ${reason}. Keep the exam tab visible and remain in fullscreen.`;
  document.getElementById('mockViolationNotice').classList.remove('hidden');
  if (state.proctorViolationCount >= PROCTOR_VIOLATION_LIMIT) {
    state.proctorLockUntil = Date.now() + PROCTOR_LOCK_DURATION;
    state.activeMockAssessment = null;
    if (mockTimerInterval) clearInterval(mockTimerInterval);
    mockTimerInterval = null;
    if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
    showToast('Three proctor warnings. This local learner profile is locked for 24 hours.');
    if (authUser?.uid && window.firebaseLockLearner) {
      window.firebaseLockLearner(authUser.uid, state.proctorLockUntil, 'Three proctor warnings during a timed assessment.', 'proctor')
        .then(() => { state.remoteProctorLockActive = true; persistState(); })
        .catch(handleFirebaseCloudError);
    }
    renderProctorLockScreen();
  } else showToast(`Proctor warning ${attempt.violations}/${PROCTOR_VIOLATION_LIMIT}: ${reason}.`);
  persistState();
}

let proctorLockInterval = null;
function renderProctorLockScreen() {
  const overlay = document.getElementById('proctorLockOverlay');
  if (!overlay) return;
  if (state.proctorLockUntil <= Date.now()) {
    state.proctorLockUntil = 0;
    state.proctorViolationCount = 0;
    overlay.classList.add('hidden');
    if (proctorLockInterval) clearInterval(proctorLockInterval);
    proctorLockInterval = null;
    persistState();
    return;
  }
  overlay.classList.remove('hidden');
  const tick = () => {
    const remaining = Math.max(0, state.proctorLockUntil - Date.now());
    const seconds = Math.ceil(remaining / 1000);
    const timer = document.getElementById('proctorLockCountdown');
    if (timer) timer.textContent = `${String(Math.floor(seconds / 3600)).padStart(2, '0')}:${String(Math.floor((seconds % 3600) / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    if (!remaining) renderProctorLockScreen();
  };
  tick();
  if (!proctorLockInterval) proctorLockInterval = setInterval(tick, 1000);
}

function handleCloudLearnerLock(lockRecord) {
  if (lockRecord?.until) {
    state.proctorLockUntil = typeof lockRecord.until.toMillis === 'function'
      ? lockRecord.until.toMillis()
      : Number(lockRecord.until) || 0;
    state.remoteProctorLockActive = true;
  } else if (state.remoteProctorLockActive) {
    state.proctorLockUntil = 0;
    state.proctorViolationCount = 0;
    state.remoteProctorLockActive = false;
  }
  renderProctorLockScreen();
  persistState();
}

function downloadMockCertificate(topicId, format = 'png') {
  const topic = MOCK_TOPICS.find(item => item.id === topicId);
  const progress = getMockTopicProgress(topicId);
  if (!topic || progress.passed !== progress.total) {
    showToast('Pass all five mocks in this topic at 70% or higher to unlock its certificate.');
    return;
  }
  const average = Math.round(progress.records.reduce((sum, result) => sum + result.bestPercent, 0) / progress.total);
  const canvas = document.createElement('canvas');
  canvas.width = 1400;
  canvas.height = 990;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#FFFDF9'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#D4AF37'; ctx.lineWidth = 10; ctx.strokeRect(32, 32, canvas.width - 64, canvas.height - 64);
  ctx.strokeStyle = '#FF5500'; ctx.lineWidth = 3; ctx.strokeRect(52, 52, canvas.width - 104, canvas.height - 104);
  ctx.textAlign = 'center'; ctx.fillStyle = '#FF5500'; ctx.font = '700 34px sans-serif'; ctx.fillText('JIET • MENTORSHIP WITH KAPIL', 700, 170);
  ctx.fillStyle = '#C28B38'; ctx.font = '700 22px sans-serif'; ctx.fillText('CERTIFICATE OF MOCK ASSESSMENT MASTERY', 700, 260);
  ctx.fillStyle = '#0F172A'; ctx.font = '700 54px Georgia, serif'; ctx.fillText(topic.title, 700, 365);
  ctx.fillStyle = '#64748B'; ctx.font = '24px sans-serif'; ctx.fillText('This certificate is proudly awarded to', 700, 460);
  ctx.fillStyle = '#FF5500'; ctx.font = '700 52px Georgia, serif'; ctx.fillText(getCertificateRecipientName().toUpperCase(), 700, 545);
  ctx.fillStyle = '#334155'; ctx.font = '24px sans-serif'; ctx.fillText(`Passed all five timed mock assessments · Average best score ${average}%`, 700, 645);
  ctx.fillText(`Certificate ID: ${progress.records[4].certificateId}`, 700, 710);
  ctx.fillText(`Issued ${new Date().toLocaleDateString('en-GB')}`, 700, 765);
  ctx.font = '700 22px sans-serif'; ctx.fillText('Placement Readiness Mentorship With Kapil', 700, 850);
  downloadCanvasArtifact(canvas, `JIET_${safeFilename(topicId)}_Mock_Certificate_${safeFilename(state.learnerName)}`, format);
}

function downloadTrackCertificate(trackId, format = 'png') {
  const track = CAREER_CERTIFICATES[trackId];
  if (!track) return;
  if (!areAllLearningLevelsComplete()) {
    showToast('Complete all nine learning levels to unlock certificates.');
    return;
  }
  const result = getAssessmentResult(track.questions);
  if (!result.complete || result.percentage < 70) {
    showToast('Complete the assessment with at least 70% to unlock this certificate.');
    return;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1400;
  canvas.height = 990;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#FFFDF9';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 10;
  ctx.strokeRect(32, 32, canvas.width - 64, canvas.height - 64);
  ctx.strokeStyle = '#FF5500';
  ctx.lineWidth = 3;
  ctx.strokeRect(52, 52, canvas.width - 104, canvas.height - 104);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#FF5500';
  ctx.font = '700 34px "Space Grotesk", sans-serif';
  ctx.fillText('JIET • POWERED BY FACE PREP', canvas.width / 2, 155);
  ctx.fillStyle = '#C28B38';
  ctx.font = '700 22px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('CERTIFICATE OF ACHIEVEMENT', canvas.width / 2, 245);
  ctx.fillStyle = '#0F172A';
  ctx.font = '700 58px "Cinzel", Georgia, serif';
  ctx.fillText(track.title, canvas.width / 2, 340);
  ctx.fillStyle = '#64748B';
  ctx.font = '24px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('This certificate is proudly awarded to', canvas.width / 2, 430);
  ctx.fillStyle = '#FF5500';
  ctx.font = '700 54px "Cinzel", Georgia, serif';
  ctx.fillText(getCertificateRecipientName().toUpperCase(), canvas.width / 2, 510);
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(300, 540);
  ctx.lineTo(1100, 540);
  ctx.stroke();

  ctx.fillStyle = '#334155';
  ctx.font = '22px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`has completed the ${track.title} assessment`, canvas.width / 2, 620);
  ctx.fillText(`with a score of ${result.percentage}% (${result.correct}/${result.total} correct)`, canvas.width / 2, 665);
  ctx.fillText(`Certificate ID: ${state.certificateId}`, canvas.width / 2, 710);
  ctx.fillText(`Issued ${new Date().toLocaleDateString('en-GB')}`, canvas.width / 2, 755);
  ctx.fillStyle = '#0F172A';
  ctx.font = '700 22px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Mentorship With Kapil • JIET Placement Readiness', canvas.width / 2, 825);

  downloadCanvasArtifact(canvas, `JIET_${trackId}_Certificate_${safeFilename(state.learnerName)}`, format);
  showToast(`${track.title} certificate ${format.toUpperCase()} downloaded! 🏆`);
}

function updateHUD() {
  updateLearningProgressUI();
  document.getElementById('hudXP').textContent = state.xp.toLocaleString();
  document.getElementById('hudStreak').textContent = state.streak;
  document.getElementById('hudLevel').textContent = `Lvl ${state.level}`;
  document.getElementById('navUserName').textContent = state.learnerName;
  document.getElementById('badgeCount').textContent = `${state.unlockedBadges.size}/${BADGE_TOTAL}`;
  document.getElementById('soundIcon').textContent = state.soundEnabled ? '🔊' : '🔇';
  const soundButton = document.getElementById('soundToggleBtn');
  if (soundButton) soundButton.setAttribute('aria-pressed', String(state.soundEnabled));

  // Global Progress percentage calculation
  const totalQuestions = FOUNDATION_ASSESSMENT.length + PROACTIVE_DRILLS.length + POS_DRILLS.length + 1 +
                         SENTENCE_PAGE_1.length + SENTENCE_PAGE_2.length +
                         PARAJUMBLES_PAGE_1.length + PARAJUMBLES_PAGE_2_3.length +
                         CLOZE_QUESTIONS.length +
                         CAREER_ASSESSMENTS.softSkills.length +
                         CAREER_ASSESSMENTS.communication.length +
                         APTITUDE_QUESTIONS.length;
  const answeredCount = Object.keys(state.answeredQuestions).length;
  const completedEnglishAssessments = Object.keys(state.englishAssessments).length;
  const englishTotalQuestions = ENGLISH_TOPICS.length * 50;
  const pct = Math.min(100, Math.max(5, Math.round(((answeredCount + completedEnglishAssessments * 50) / (totalQuestions + englishTotalQuestions)) * 100)));
  document.getElementById('globalProgressFill').style.width = `${pct}%`;
  const progressTrack = document.querySelector('.global-progress-track[role="progressbar"]');
  if (progressTrack) progressTrack.setAttribute('aria-valuenow', String(pct));

  // Update Certificate dynamic fields
  const certName = document.getElementById('certRecipientName');
  if (certName) certName.textContent = getCertificateRecipientName().toUpperCase();
  const certXP = document.getElementById('certScoreXP');
  if (certXP) certXP.textContent = `${state.xp.toLocaleString()} XP`;
  const certBadges = document.getElementById('certBadgesEarned');
  if (certBadges) certBadges.textContent = `${state.unlockedBadges.size} of ${BADGE_TOTAL} Unlocked`;
  const certId = document.getElementById('certVerificationId');
  if (certId) certId.textContent = state.certificateId || 'Created when a learner profile starts';
  const certDate = document.getElementById('certDateDisplay');
  if (certDate) {
    const now = new Date();
    certDate.textContent = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  updateCareerTrackUI();
}

function addXP(amount, reason = '') {
  state.xp += amount;
  state.streak += 1;

  // Calculate Level (100 XP = Lvl 1, 300 = Lvl 2, 600 = Lvl 3, 1000 = Lvl 4, 1500 = Lvl 5)
  if (state.xp >= 1500) state.level = 5;
  else if (state.xp >= 1000) state.level = 4;
  else if (state.xp >= 600) state.level = 3;
  else if (state.xp >= 300) state.level = 2;
  else state.level = 1;

  showToast(`+${amount} XP! ${reason}`);
  checkBadgeUnlocks();
  updateHUD();
  persistState();
}

function handleWrongAnswer() {
  state.streak = 0;
  updateHUD();
  persistState();
}

function unlockBadge(badgeId) {
  if (!state.unlockedBadges.has(badgeId)) {
    state.unlockedBadges.add(badgeId);
    const badge = BADGES_CONFIG.find(b => b.id === badgeId);
    if (badge) {
      sfx.playBadge();
      triggerConfetti();
      showToast(`🏅 UNLOCKED: ${badge.title}!`);
    }
    updateHUD();
    persistState();
  }
}

function checkBadgeUnlocks() {
  // Detective: answered at least 3 drill questions
  const proactiveSolved = PROACTIVE_DRILLS.filter(q => state.answeredQuestions[q.id]?.correct).length;
  if (proactiveSolved >= 3) unlockBadge('detective');

  // Proactive thinker: answered 8+ drills
  if (proactiveSolved >= 8) unlockBadge('proactive');

  // Sentence Ace: answered Sentence Page 1 & 2
  const sentencesSolved = [...SENTENCE_PAGE_1, ...SENTENCE_PAGE_2].filter(q => state.answeredQuestions[q.id]?.correct).length;
  if (sentencesSolved >= 8) unlockBadge('sentence_ace');

  // Jumble Maestro: solved 5+ Para-Jumbles
  const jumblesSolved = [...PARAJUMBLES_PAGE_1, ...PARAJUMBLES_PAGE_2_3].filter(q => state.answeredQuestions[q.id]?.correct).length;
  if (jumblesSolved >= 6) unlockBadge('jumble_maestro');

  // Cloze Master: answered all 5 cloze
  const clozeSolved = CLOZE_QUESTIONS.filter(q => state.answeredQuestions[q.id]?.correct).length;
  if (clozeSolved === 5) unlockBadge('cloze_master');

  // Placement Prodigy: 1000+ XP
  if (state.xp >= 1000) unlockBadge('placement_prodigy');

  [
    { key: 'softSkills', badge: 'soft_skills_pro', threshold: 80 },
    { key: 'communication', badge: 'communication_ace', threshold: 80 },
    { key: 'quantitative', badge: 'quant_master', threshold: 75 },
    { key: 'reasoning', badge: 'reasoning_ace', threshold: 75 },
    { key: 'dataInterpretation', badge: 'data_analyst', threshold: 75 },
    { key: 'spatialReasoning', badge: 'spatial_solver', threshold: 75 }
  ].forEach(({ key, badge, threshold }) => {
    const result = getAssessmentResult(CAREER_ASSESSMENTS[key]);
    if (result.complete && result.percentage >= threshold) unlockBadge(badge);
  });
  ENGLISH_TOPICS.forEach(topic => {
    if ((state.englishAssessments[topic.id]?.bestPercent || 0) >= 80) unlockBadge(`english_${topic.id}`);
  });
}

function showToast(message) {
  const toast = document.getElementById('toastNotification');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.remove('hidden');
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.classList.add('hidden'), 300);
  }, 2200);
}

// ==========================================
// 4. RENDERING QUESTION BLOCKS
// ==========================================

function renderMultipleChoiceList(containerId, questionList, xpPerQuestion = 50) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  questionList.forEach((q, idx) => {
    const card = document.createElement('div');
    card.className = 'question-card';
    card.id = `card_${q.id}`;

    const prevAnswer = state.answeredQuestions[q.id];
    if (prevAnswer) {
      card.classList.add(prevAnswer.correct ? 'answered-correct' : 'answered-wrong');
    }

    // Top Row
    const topRow = document.createElement('div');
    topRow.className = 'q-top-row';
    topRow.innerHTML = `
      <span class="q-number-pill">${q.qNum || `Question ${idx + 1}`}</span>
      <span class="q-status-icon">${prevAnswer ? (prevAnswer.correct ? '✅' : '❌') : '⚪'}</span>
    `;
    card.appendChild(topRow);

    // Prompt Text
    const promptEl = document.createElement('div');
    promptEl.className = 'q-text';
    promptEl.innerHTML = q.prompt;
    card.appendChild(promptEl);

    // If there are fragments (like Para-Jumbles)
    if (q.fragments && q.fragments.length > 0) {
      const fragBox = document.createElement('div');
      fragBox.className = 'jumble-fragments-box';
      q.fragments.forEach(f => {
        const row = document.createElement('div');
        row.className = 'fragment-row';
        row.innerHTML = `<span class="fragment-letter">${f.letter}</span> <span>${f.text}</span>`;
        fragBox.appendChild(row);
      });
      card.appendChild(fragBox);
    }

    // If there is a Strategy selector (Level 4A)
    let stratSelect = null;
    if (q.strategies && q.strategies.length > 0) {
      const stratBlock = document.createElement('div');
      stratBlock.className = 'strategy-selector-block';
      stratBlock.innerHTML = `
        <label class="strategy-label">Identify the FACE Prep Strategy Used:</label>
        <select class="strategy-select" id="strat_${q.id}" ${prevAnswer ? 'disabled' : ''}>
          <option value="">-- Choose Relevant Strategy --</option>
          ${q.strategies.map(s => `<option value="${s}" ${prevAnswer ? (s === q.correctStrategy ? 'selected' : '') : ''}>${s}</option>`).join('')}
        </select>
      `;
      card.appendChild(stratBlock);
      stratSelect = stratBlock.querySelector('select');
    }

    // Options Grid
    const optGrid = document.createElement('div');
    optGrid.className = `options-grid ${q.options.length <= 4 ? 'grid-2' : ''}`;

    q.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.id = `btn_${q.id}_${opt.key}`;
      btn.innerHTML = `<span class="option-letter">${opt.key.toUpperCase()}</span> <span>${opt.text}</span>`;

      if (prevAnswer) {
        btn.disabled = true;
        if (opt.key === q.answer) btn.classList.add('selected-correct');
        else if (opt.key === prevAnswer.choice) btn.classList.add('selected-wrong');
      }

      btn.addEventListener('click', () => {
        handleOptionSelect(q, opt.key, btn, card, xpPerQuestion);
      });

      optGrid.appendChild(btn);
    });
    card.appendChild(optGrid);

    // Action Strip (Hint & Status)
    const actionStrip = document.createElement('div');
    actionStrip.className = 'q-action-strip';
    actionStrip.innerHTML = `
      <button class="hint-toggle-btn" onclick="toggleHint('${q.id}')">
        <span>💡</span> <span>Mentor Hint</span>
      </button>
      <span class="xp-badge">+${xpPerQuestion} XP</span>
    `;
    card.appendChild(actionStrip);

    // Hint Box
    const hintBox = document.createElement('div');
    hintBox.className = 'hint-box';
    hintBox.id = `hint_${q.id}`;
    hintBox.innerHTML = `<strong>Mentor Clue:</strong> ${q.hint}`;
    card.appendChild(hintBox);

    // Explanation / Kapil Feedback Box
    const expBox = document.createElement('div');
    expBox.className = `q-explanation-box ${prevAnswer ? 'show ' + (prevAnswer.correct ? 'correct' : 'wrong') : ''}`;
    expBox.id = `exp_${q.id}`;
    if (prevAnswer) {
      expBox.innerHTML = `
        <div class="explanation-mentor-tag">Kapil's Analysis & Strategy Breakdown</div>
        <p>${q.kapilTip}</p>
      `;
    }
    card.appendChild(expBox);

    container.appendChild(card);
  });
}

function restoreClozePassage() {
  CLOZE_QUESTIONS.forEach((question) => {
    const savedAnswer = state.answeredQuestions[question.id];
    if (!savedAnswer) return;
    const slot = document.getElementById(`blankSlot${question.blankNum}`);
    const answerText = question.options.find(option => option.key === question.answer)?.text || '';
    if (slot) {
      slot.innerHTML = `[${question.blankNum}: <strong>${answerText}</strong>]`;
      slot.classList.add('solved');
    }
  });
}

function renderAllQuestionSets() {
  renderMultipleChoiceList('foundationAssessmentContainer', FOUNDATION_ASSESSMENT, 25);
  renderMultipleChoiceList('proactiveDrillContainer', PROACTIVE_DRILLS, 50);
  renderMultipleChoiceList('posDrillContainer', POS_DRILLS, 50);
  renderRahulTimeline();
  renderMultipleChoiceList('sentencePage1Container', SENTENCE_PAGE_1, 60);
  renderMultipleChoiceList('sentencePage2Container', SENTENCE_PAGE_2, 60);
  renderMultipleChoiceList('parajumblesPage1Container', PARAJUMBLES_PAGE_1, 80);
  renderMultipleChoiceList('parajumblesPage2Container', PARAJUMBLES_PAGE_2_3, 80);
  renderMultipleChoiceList('clozeQuestionsContainer', CLOZE_QUESTIONS, 70);
  restoreClozePassage();
  renderMultipleChoiceList('softSkillsAssessmentContainer', CAREER_ASSESSMENTS.softSkills, 25);
  renderMultipleChoiceList('communicationAssessmentContainer', CAREER_ASSESSMENTS.communication, 25);
  renderMultipleChoiceList('quantitativeAssessmentContainer', CAREER_ASSESSMENTS.quantitative, 25);
  renderMultipleChoiceList('reasoningAssessmentContainer', CAREER_ASSESSMENTS.reasoning, 25);
  renderMultipleChoiceList('dataAssessmentContainer', CAREER_ASSESSMENTS.dataInterpretation, 25);
  renderMultipleChoiceList('spatialAssessmentContainer', CAREER_ASSESSMENTS.spatialReasoning, 25);
  renderEnglishTopicCards();
  const englishPanel = document.getElementById('englishAssessmentPanel');
  if (state.activeEnglishAssessment) activateEnglishAssessmentUI(state.activeEnglishAssessment.topicId);
  else if (englishPanel) englishPanel.classList.add('hidden');
}

function handleOptionSelect(question, selectedKey, btnEl, cardEl, xpPerQuestion) {
  if (state.answeredQuestions[question.id]) return; // Already answered

  const isCorrect = (selectedKey === question.answer);
  state.answeredQuestions[question.id] = { correct: isCorrect, choice: selectedKey };

  // Disable all options in this card
  cardEl.querySelectorAll('.option-btn').forEach(b => b.disabled = true);
  const stratEl = cardEl.querySelector('.strategy-select');
  if (stratEl) stratEl.disabled = true;

  const statusIcon = cardEl.querySelector('.q-status-icon');
  const expBox = cardEl.querySelector('.q-explanation-box');

  if (isCorrect) {
    sfx.playCorrect();
    btnEl.classList.add('selected-correct');
    cardEl.classList.add('answered-correct');
    if (statusIcon) statusIcon.textContent = '✅';
    addXP(xpPerQuestion, 'Correct Answer!');
    triggerConfetti(0.4);
    if (expBox) {
      expBox.className = 'q-explanation-box show correct';
      expBox.innerHTML = `
        <div class="explanation-mentor-tag">🌟 Excellent Work! Kapil's Insight:</div>
        <p>${question.kapilTip}</p>
      `;
    }
  } else {
    sfx.playWrong();
    btnEl.classList.add('selected-wrong');
    cardEl.classList.add('answered-wrong');
    // Highlight correct answer button
    const correctBtn = cardEl.querySelector(`#btn_${question.id}_${question.answer}`);
    if (correctBtn) correctBtn.classList.add('selected-correct');
    if (statusIcon) statusIcon.textContent = '❌';
    handleWrongAnswer();
    if (expBox) {
      expBox.className = 'q-explanation-box show wrong';
      expBox.innerHTML = `
        <div class="explanation-mentor-tag">💡 Kapil's Solution & Correction:</div>
        <p><strong>Correct Answer: Option (${question.answer.toUpperCase()})</strong></p>
        <p>${question.kapilTip}</p>
      `;
    }
  }

  // If Cloze question, update the passage slot pill
  if (question.blankNum) {
    const slotPill = document.getElementById(`blankSlot${question.blankNum}`);
    if (slotPill) {
      const correctChoiceText = question.options.find(o => o.key === question.answer)?.text || '';
      slotPill.innerHTML = `[${question.blankNum}: <strong>${correctChoiceText}</strong>]`;
      slotPill.classList.add('solved');
    }
  }

  checkBadgeUnlocks();
  updateHUD();
  persistState();
}

function toggleHint(questionId) {
  const hintEl = document.getElementById(`hint_${questionId}`);
  if (hintEl) {
    hintEl.classList.toggle('show');
  }
}

// ==========================================
// 5. RAHUL'S DAY TIMELINE DRAG & ORDER (LEVEL 2C)
// ==========================================

function renderRahulTimeline() {
  const container = document.getElementById('rahulTimelineList');
  if (!container) return;
  container.innerHTML = '';

  state.rahulOrder.forEach((eventId, index) => {
    const ev = RAHUL_EVENTS.find(e => e.id === eventId);
    if (!ev) return;

    const item = document.createElement('div');
    item.className = 'timeline-item';
    item.dataset.index = index;

    item.innerHTML = `
      <div class="timeline-left">
        <span class="timeline-pos">${index + 1}</span>
        <span class="timeline-text">${ev.text}</span>
      </div>
      <div class="timeline-btns">
        <button class="move-btn" onclick="moveRahulItem(${index}, -1)" ${index === 0 ? 'disabled' : ''} title="Move Up">▲</button>
        <button class="move-btn" onclick="moveRahulItem(${index}, 1)" ${index === state.rahulOrder.length - 1 ? 'disabled' : ''} title="Move Down">▼</button>
      </div>
    `;

    container.appendChild(item);
  });
}

function moveRahulItem(index, direction) {
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= state.rahulOrder.length) return;

  const temp = state.rahulOrder[index];
  state.rahulOrder[index] = state.rahulOrder[targetIndex];
  state.rahulOrder[targetIndex] = temp;

  renderRahulTimeline();
  persistState();
}

function resetRahulTimeline() {
  // Scramble order for fresh challenge
  state.rahulOrder = [5, 1, 8, 3, 7, 2, 9, 4, 6];
  const fb = document.getElementById('rahulFeedback');
  if (fb) fb.className = 'timeline-feedback hidden';
  renderRahulTimeline();
  persistState();
}

function checkRahulTimeline() {
  const isPerfect = state.rahulOrder.every((val, idx) => val === idx + 1);
  const fb = document.getElementById('rahulFeedback');
  if (!fb) return;

  fb.classList.remove('hidden');

  if (isPerfect) {
    sfx.playCorrect();
    triggerConfetti(0.8);
    fb.className = 'timeline-feedback success';
    fb.innerHTML = `
      🎉 <strong>Mastery Achieved! Perfect Chronological Sequence!</strong><br>
      Rahul woke up early → walked to work → worked immediately → skipped lunch (never hungry at noon) → returned home at dusk to wife & mother → ate food cooked by mother (latter) → worked on computer late → slept late.
    `;
    if (!state.answeredQuestions['rahul_timeline']?.correct) {
      state.answeredQuestions['rahul_timeline'] = { correct: true };
      addXP(150, 'Rahul Timeline Mastered!');
      unlockBadge('timeline');
    }
  } else {
    sfx.playWrong();
    fb.className = 'timeline-feedback error';
    fb.innerHTML = `
      ⚠️ <strong>Sequence Incomplete:</strong> Keep arranging! Follow Rahul from dawn: Getting up early & breakfast → morning walk to office → daytime work → lunch observations → returning home at dusk → night computer work → sleeping late.
    `;
  }
}

// ==========================================
// 6. CLOZE TEST PASSAGE FOCUS
// ==========================================
function focusCloze(blankNum) {
  const card = document.getElementById(`card_cloze_${blankNum}`);
  if (card) {
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    card.style.boxShadow = '0 0 20px #FF5500';
    setTimeout(() => { card.style.boxShadow = ''; }, 1500);
  }
}

// ==========================================
// 7. TAB & MOBILE NAVIGATION
// ==========================================
function revealActiveNavItem(containerSelector, tabId) {
  const container = document.querySelector(containerSelector);
  const activeItem = container?.querySelector(`[data-tab="${tabId}"]`);
  if (!container || !activeItem) return;
  const containerRect = container.getBoundingClientRect();
  const itemRect = activeItem.getBoundingClientRect();
  if (itemRect.left < containerRect.left) {
    container.scrollBy({ left: itemRect.left - containerRect.left - 12, behavior: 'smooth' });
  } else if (itemRect.right > containerRect.right) {
    container.scrollBy({ left: itemRect.right - containerRect.right + 12, behavior: 'smooth' });
  }
}

function switchTab(tabId) {
  if (state.proctorLockUntil > Date.now()) { renderProctorLockScreen(); return; }
  if (state.activeMockAssessment && tabId !== 'tab-mock-center') {
    recordProctorViolation('leaving the Mock Center');
    return;
  }
  if (!document.getElementById(tabId)?.classList.contains('tab-pane')) return;
  state.activeTab = tabId;

  // Panes
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  const activePane = document.getElementById(tabId);
  if (activePane) activePane.classList.add('active');

  // Desktop Tabs
  document.querySelectorAll('.nav-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tabId);
    t.setAttribute('aria-current', t.dataset.tab === tabId ? 'page' : 'false');
  });

  // Mobile Bottom Nav
  document.querySelectorAll('.mobile-nav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tabId);
    b.setAttribute('aria-current', b.dataset.tab === tabId ? 'page' : 'false');
  });

  revealActiveNavItem('.level-nav-bar', tabId);
  revealActiveNavItem('.mobile-bottom-nav', tabId);
  persistState();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==========================================
// 8. ONBOARDING & CERTIFICATE MANAGEMENT
// ==========================================
function startJourney() {
  return signInWithGoogle();
}

async function signInWithGoogle() {
  const button = document.getElementById('googleSignInBtn');
  const status = document.getElementById('authGateStatus');
  if (!window.firebaseSignInWithGoogle) {
    if (status) status.textContent = 'Google sign-in is not ready. Check your connection and reload the app.';
    return;
  }
  if (button) button.disabled = true;
  if (status) status.textContent = 'Connecting securely to Google…';
  try {
    await window.firebaseSignInWithGoogle();
  } catch (error) {
    handleFirebaseAuthError(error);
  } finally {
    if (button) button.disabled = false;
  }
}

function handleFirebaseAuthError(error) {
  const status = document.getElementById('authGateStatus');
  const button = document.getElementById('googleSignInBtn');
  const code = error?.code || '';
  const messages = {
    'auth/unauthorized-domain': 'This app domain must be added in Firebase Console → Authentication → Settings → Authorized domains.',
    'auth/popup-closed-by-user': 'Google sign-in was cancelled. You can try again whenever you’re ready.',
    'auth/popup-blocked': 'Your browser blocked the Google sign-in window. Allow popups for this site and try again.',
    'auth/sdk-load-failed': 'Firebase could not load. Check your connection and reload the app.',
    'auth/operation-not-allowed': 'Google sign-in is not enabled for this Firebase project yet.'
  };
  if (status) status.textContent = messages[code] || 'Google sign-in failed. Check your connection or Firebase Authentication settings, then try again.';
  if (button) button.disabled = false;
  if (code !== 'auth/popup-closed-by-user') console.error('Firebase Authentication error:', code, error?.message || error);
}

function handleFirebaseCloudError(error) {
  setCloudSyncStatus('Firebase data is unavailable. Progress is still saved locally.');
  const status = document.getElementById('adminDashboardStatus');
  if (status && authUser?.isAdmin) status.textContent = 'Firebase could not load admin data. Check Firestore setup and security rules.';
  console.warn('Firebase data operation failed:', error?.code || error);
}

async function handleFirebaseAuthState(user) {
  pendingFirebaseUser = user;
  if (!appInitialized) return;
  const token = ++authStateVersion;
  const gate = document.getElementById('authGateOverlay');
  if (!user) {
    learnerLockUnsubscribe?.();
    learnerLockUnsubscribe = null;
    adminDataUnsubscribe?.();
    adminDataUnsubscribe = null;
    if (cloudSaveTimeout) clearTimeout(cloudSaveTimeout);
    cloudSaveTimeout = null;
    pendingCloudRecord = null;
    authUser = null;
    activeProfileId = null;
    const adminButton = document.getElementById('adminDashboardBtn');
    if (adminButton) adminButton.classList.add('hidden');
    if (gate) gate.classList.remove('hidden');
    const status = document.getElementById('authGateStatus');
    if (status) status.textContent = 'New learners are registered automatically with Google.';
    return;
  }

  const previousUid = authUser?.uid;
  if (previousUid && previousUid !== user.uid) {
    learnerLockUnsubscribe?.();
    learnerLockUnsubscribe = null;
    adminDataUnsubscribe?.();
    adminDataUnsubscribe = null;
    adminLearnerRecords = [];
    adminLockRecords = new Map();
    if (cloudSaveTimeout) clearTimeout(cloudSaveTimeout);
    cloudSaveTimeout = null;
    pendingCloudRecord = null;
  }
  authUser = user;
  loadSavedState(user);
  setCloudSyncStatus('Loading your Firebase progress…');
  let cloudRecord = null;
  if (window.firebaseLoadLearner) {
    try { cloudRecord = await window.firebaseLoadLearner(user.uid); }
    catch (error) { handleFirebaseCloudError(error); }
  }
  if (token !== authStateVersion || authUser?.uid !== user.uid) return;
  if (cloudRecord?.profileData && Number(cloudRecord.clientUpdatedAt) >= state.syncUpdatedAt) {
    applyLearnerState(cloudRecord.profileData, user.displayName);
    state.syncUpdatedAt = Number(cloudRecord.clientUpdatedAt) || state.syncUpdatedAt;
    setCloudSyncStatus('Loaded progress from Firebase.');
  } else if (cloudRecord) setCloudSyncStatus('Local progress is newer; syncing it to Firebase…');
  else setCloudSyncStatus('Creating your cloud progress record…');

  learnerLockUnsubscribe?.();
  learnerLockUnsubscribe = null;
  if (window.firebaseWatchLearnerLock) {
    learnerLockUnsubscribe = window.firebaseWatchLearnerLock(user.uid, handleCloudLearnerLock, handleFirebaseCloudError);
  }

  renderAllQuestionSets();
  renderMockCenter();
  switchTab(state.activeTab);
  const certificateName = document.getElementById('certCustomName');
  if (certificateName && !certificateName.value) certificateName.value = state.learnerName;
  const emailLabel = document.getElementById('profileModalEmail');
  if (emailLabel) emailLabel.textContent = user.email || 'Google account';
  const adminButton = document.getElementById('adminDashboardBtn');
  if (adminButton) adminButton.classList.toggle('hidden', !user.isAdmin);
  if (gate) gate.classList.add('hidden');
  updateHUD();
  renderProctorLockScreen();
  if (state.proctorLockUntil > Date.now() && !state.remoteProctorLockActive && window.firebaseLockLearner) {
    window.firebaseLockLearner(user.uid, state.proctorLockUntil, 'Migrated local proctor lock.', 'proctor')
      .then(() => { state.remoteProctorLockActive = true; persistState(); })
      .catch(handleFirebaseCloudError);
  }
  persistState();
  if (previousUid !== user.uid) {
    sfx.playCorrect();
    showToast(`Signed in as ${user.displayName}. Your learner profile is ready.`);
  }
}

function openAdminDashboard() {
  if (!authUser?.isAdmin) {
    showToast('This Google account does not have the Firebase admin role.');
    return;
  }
  closeProfileModal();
  switchTab('tab-admin-dashboard');
  if (adminDataUnsubscribe) return;
  if (!window.firebaseWatchAdminData) {
    handleFirebaseCloudError(new Error('Firestore admin dashboard is unavailable.'));
    return;
  }
  document.getElementById('adminDashboardStatus').textContent = 'Loading Firebase learner records…';
  adminDataUnsubscribe = window.firebaseWatchAdminData(
    learners => { adminLearnerRecords = learners; renderAdminDashboard(); },
    locks => { adminLockRecords = new Map(locks.map(lock => [lock.id, lock])); renderAdminDashboard(); },
    handleFirebaseCloudError
  );
}

function renderAdminDashboard() {
  const root = document.getElementById('adminLearnerRows');
  if (!root) return;
  if (!authUser?.isAdmin) {
    root.innerHTML = '';
    return;
  }
  const needle = (document.getElementById('adminLearnerSearch')?.value || '').trim().toLowerCase();
  const filtered = adminLearnerRecords.filter(record =>
    [record.learnerName, record.email, record.uid, record.id].some(value => String(value || '').toLowerCase().includes(needle))
  );
  const status = document.getElementById('adminDashboardStatus');
  if (status) status.textContent = `${adminLearnerRecords.length} learner profile${adminLearnerRecords.length === 1 ? '' : 's'} in Firebase · showing ${filtered.length}`;
  root.innerHTML = filtered.map(record => {
    const uid = record.uid || record.id;
    const levels = Array.isArray(record.learningLevels) ? record.learningLevels : [];
    const completedLevels = levels.filter(level => level.complete).length;
    const lock = adminLockRecords.get(uid);
    const lockUntil = lock?.until?.toDate ? lock.until.toDate().getTime() : Number(lock?.until) || 0;
    const locked = Boolean(lock && lockUntil > Date.now());
    const updatedAt = record.updatedAt?.toDate ? record.updatedAt.toDate() : new Date(Number(record.clientUpdatedAt) || 0);
    const updatedLabel = Number.isNaN(updatedAt.getTime()) || updatedAt.getTime() === 0 ? '—' : updatedAt.toLocaleString();
    const action = locked
      ? `<button class="btn btn-secondary" type="button" onclick="adminUnlockLearner('${escapeEnglishHTML(uid)}')">Unlock profile</button><small>Locked until ${escapeEnglishHTML(new Date(lockUntil).toLocaleString())}</small>`
      : `<button class="btn btn-secondary" type="button" onclick="adminLockLearner('${escapeEnglishHTML(uid)}')">Lock 24 hours</button>`;
    return `<tr><td><strong>${escapeEnglishHTML(record.learnerName || 'Learner')}</strong><small>${escapeEnglishHTML(record.email || '')}</small><small title="${escapeEnglishHTML(uid)}">UID ${escapeEnglishHTML(uid.slice(0, 14))}</small></td><td>${Number(record.xp) || 0} XP<small>Level ${Number(record.level) || 1} · streak ${Number(record.streak) || 0}</small></td><td>${Number(record.badgeCount) || 0}/51</td><td>${completedLevels}/${levels.length || 10}</td><td>${Number(record.passedMocks) || 0}/95</td><td>${record.certificateIssued ? 'Issued' : 'Not issued'}</td><td>${escapeEnglishHTML(updatedLabel)}</td><td>${action}</td></tr>`;
  }).join('') || '<tr><td colspan="8">No learner profiles match this search.</td></tr>';
}

async function adminLockLearner(uid) {
  if (!authUser?.isAdmin || !window.firebaseAdminLockLearner) return;
  const reason = prompt('Reason for the 24-hour profile lock:');
  if (reason === null) return;
  try {
    await window.firebaseAdminLockLearner(uid, Date.now() + PROCTOR_LOCK_DURATION, reason.trim());
    showToast('Learner profile locked for 24 hours.');
  } catch (error) { handleFirebaseCloudError(error); }
}

async function adminUnlockLearner(uid) {
  if (!authUser?.isAdmin || !window.firebaseUnlockLearner) return;
  const reason = prompt('Reason for unlocking this learner profile:');
  if (reason === null) return;
  try {
    await window.firebaseUnlockLearner(uid, reason.trim());
    showToast('Learner profile unlocked.');
  } catch (error) { handleFirebaseCloudError(error); }
}

function downloadAdminReport() {
  if (!authUser?.isAdmin) return;
  const columns = ['uid', 'learnerName', 'email', 'xp', 'level', 'streak', 'badgeCount', 'answeredQuestionCount', 'learningLevels', 'englishAssessments', 'mockAssessments', 'passedMocks', 'certificateIssued', 'updatedAt', 'profileLockedUntil', 'profileData'];
  const rows = adminLearnerRecords.map(record => {
    const lock = adminLockRecords.get(record.uid || record.id);
    const lockUntil = lock?.until?.toDate ? lock.until.toDate().toISOString() : '';
    return columns.map(column => {
      const value = column === 'profileLockedUntil' ? lockUntil : column === 'updatedAt'
        ? (record.updatedAt?.toDate ? record.updatedAt.toDate().toISOString() : record.clientUpdatedAt || '')
        : ['learningLevels', 'englishAssessments', 'mockAssessments', 'profileData'].includes(column)
          ? JSON.stringify(record[column] || [])
          : column === 'uid' ? record.uid || record.id : record[column] ?? '';
      return `"${String(value).replace(/"/g, '""')}"`;
    }).join(',');
  });
  const csv = [columns.join(','), ...rows].join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `JIET_learner_progress_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function handleFirebaseSignOutError(error) {
  handleFirebaseAuthError(error);
}

window.handleFirebaseAuthState = handleFirebaseAuthState;
window.handleFirebaseAuthError = handleFirebaseAuthError;

function updateCertName(newName) {
  const certName = document.getElementById('certRecipientName');
  if (certName) certName.textContent = (newName.trim() || state.learnerName).toUpperCase();
}

function refreshCert() {
  updateHUD();
  showToast('Certificate recipient name updated! 📜');
}

function downloadCertificatePNG(format = 'png') {
  if (!areAllLearningLevelsComplete()) {
    showToast('Complete all nine learning levels to unlock your Career Readiness certificate.');
    return;
  }
  const certNode = document.getElementById('certificateNode');
  if (!certNode) return;

  showToast('Generating official certificate image... 🎨');

  // Render high-res Canvas directly
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 840;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#FFFDF9';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Borders
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 10;
  ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);

  ctx.strokeStyle = '#FF5500';
  ctx.lineWidth = 3;
  ctx.strokeRect(45, 45, canvas.width - 90, canvas.height - 90);

  // Header Brand
  ctx.fillStyle = '#FF5500';
  ctx.font = 'bold 36px "Space Grotesk", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('FACE Prep', canvas.width / 2, 110);

  ctx.fillStyle = '#4B5563';
  ctx.font = '600 16px "Plus Jakarta Sans", sans-serif';
  ctx.fillText("ONE OF INDIA'S LARGEST SKILL DEVELOPMENT COMPANY", canvas.width / 2, 138);

  // Certificate Title
  ctx.fillStyle = '#C28B38';
  ctx.font = 'bold 15px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('JIET • CAREER READINESS & PLACEMENT PREPARATION', canvas.width / 2, 190);

  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 42px "Cinzel", Georgia, serif';
  ctx.fillText('JIET Career Readiness Mentorship', canvas.width / 2, 245);

  ctx.fillStyle = '#555';
  ctx.font = '600 17px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Mentorship With Kapil • Powered By FACE Prep', canvas.width / 2, 280);

  // Awarded to
  ctx.fillStyle = '#777';
  ctx.font = 'italic 20px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('This certificate is proudly awarded to', canvas.width / 2, 335);

  // Recipient Name
  ctx.fillStyle = '#FF5500';
  ctx.font = 'bold 50px "Cinzel", Georgia, serif';
  ctx.fillText(getCertificateRecipientName().toUpperCase(), canvas.width / 2, 400);

  // Underline
  ctx.strokeStyle = '#C28B38';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(350, 420);
  ctx.lineTo(850, 420);
  ctx.stroke();

  // Achievement text
  ctx.fillStyle = '#374151';
  ctx.font = '16px "Plus Jakarta Sans", sans-serif';
  const text1 = 'for demonstrating progress in verbal and quantitative aptitude, logical reasoning,';
  const text2 = 'professional communication, and workplace soft skills through JIET placement readiness.';
  ctx.fillText(text1, canvas.width / 2, 465);
  ctx.fillText(text2, canvas.width / 2, 492);

  // Stats Box
  ctx.fillStyle = '#F8F5EE';
  ctx.fillRect(160, 530, 880, 70);
  ctx.strokeStyle = '#E2D6C0';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(160, 530, 880, 70);

  ctx.fillStyle = '#111';
  ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`Total Score: ${state.xp.toLocaleString()} XP`, 280, 572);
  ctx.fillText(`Badges: ${state.unlockedBadges.size}/${BADGE_TOTAL} Unlocked`, 520, 572);
  ctx.fillText('JIET Career Readiness', 740, 572);
  ctx.fillText('Career Readiness', 940, 572);
  ctx.fillStyle = '#64748B';
  ctx.font = '14px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`Certificate ID: ${state.certificateId || 'Not assigned'}`, canvas.width / 2, 625);

  // Signatures
  ctx.fillStyle = '#1E3A8A';
  ctx.font = 'italic bold 36px "Alex Brush", cursive';
  ctx.textAlign = 'left';
  ctx.fillText('Kapil', 180, 680);
  ctx.textAlign = 'right';
  ctx.fillText('FACE Prep', 1020, 680);

  ctx.strokeStyle = '#666';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(160, 695);
  ctx.lineTo(380, 695);
  ctx.moveTo(800, 695);
  ctx.lineTo(1040, 695);
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.fillStyle = '#111';
  ctx.font = 'bold 15px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Kapil', 160, 720);
  ctx.fillStyle = '#666';
  ctx.font = '13px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Mentorship By Kapil', 160, 740);
  ctx.fillText('Powered By FACE Prep', 160, 758);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#111';
  ctx.font = 'bold 15px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('FACE Prep', 1040, 720);
  ctx.fillStyle = '#666';
  ctx.font = '13px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Focus Academy for Career Enhancement', 1040, 740);
  const now = new Date();
  ctx.fillText(`Date: ${now.toLocaleDateString('en-GB')}`, 1040, 758);

  downloadCanvasArtifact(canvas, `FACEPrep_Placement_Certificate_${safeFilename(state.learnerName)}`, format);
  recordFinalCertificateDownload();
  showToast(`Career Readiness certificate ${format.toUpperCase()} downloaded! 🎓`);
}

// ==========================================
// 9. BADGES MODAL
// ==========================================
let modalReturnFocus = null;

function focusModal(modal) {
  modalReturnFocus = document.activeElement;
  modal.querySelector('.modal-close-btn')?.focus();
}

function restoreModalFocus() {
  if (modalReturnFocus && typeof modalReturnFocus.focus === 'function') modalReturnFocus.focus();
  modalReturnFocus = null;
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = String(text).split(/\s+/);
  let line = '';
  const lines = [];
  words.forEach(word => {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = candidate;
  });
  if (line) lines.push(line);
  lines.forEach((lineText, index) => ctx.fillText(lineText, x, y + index * lineHeight));
}

function renderBadgeCanvas(badge) {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 840;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#FFFDF9'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#D4AF37'; ctx.lineWidth = 12; ctx.strokeRect(34, 34, 1132, 772);
  ctx.strokeStyle = '#FF5500'; ctx.lineWidth = 3; ctx.strokeRect(52, 52, 1096, 736);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#FF5500'; ctx.font = '700 32px sans-serif'; ctx.fillText('JIET PLACEMENT READINESS MENTORSHIP', 600, 120);
  ctx.fillStyle = '#C28B38'; ctx.font = '700 18px sans-serif'; ctx.fillText('SKILL BADGE', 600, 175);
  ctx.beginPath(); ctx.arc(600, 330, 104, 0, Math.PI * 2); ctx.fillStyle = '#FFF7ED'; ctx.fill();
  ctx.strokeStyle = '#D4AF37'; ctx.lineWidth = 9; ctx.stroke();
  ctx.font = '92px sans-serif'; ctx.fillText(badge.icon, 600, 362);
  ctx.fillStyle = '#0F172A'; ctx.font = '700 40px Georgia, serif'; ctx.fillText(badge.title, 600, 490);
  ctx.fillStyle = '#475569'; ctx.font = '21px sans-serif';
  drawWrappedText(ctx, badge.desc, 600, 540, 820, 32);
  ctx.fillStyle = '#64748B'; ctx.font = '20px sans-serif';
  ctx.fillText(`Awarded to ${state.learnerName}`, 600, 675);
  ctx.fillText(`Badge: ${badge.id} · ${new Date().toLocaleDateString('en-GB')}`, 600, 720);
  ctx.fillStyle = '#9A3412'; ctx.font = '700 17px sans-serif'; ctx.fillText('MENTORSHIP WITH KAPIL • JIET', 600, 765);
  return canvas;
}

function downloadBadgeArtifact(badgeId, format = 'png') {
  const badge = BADGES_CONFIG.find(item => item.id === badgeId);
  if (!badge || !state.unlockedBadges.has(badgeId)) {
    showToast('This badge is still locked. Complete its level to download it.');
    return;
  }
  downloadCanvasArtifact(renderBadgeCanvas(badge), `JIET_Badge_${safeFilename(badge.id)}_${safeFilename(state.learnerName)}`, format);
  showToast(`${badge.title} badge ${format.toUpperCase()} downloaded!`);
}

function openBadgesModal() {
  if (state.activeMockAssessment || state.proctorLockUntil > Date.now()) {
    showToast('Badges are unavailable during a proctored mock or profile lock.');
    return;
  }
  const modal = document.getElementById('badgesModal');
  const grid = document.getElementById('badgesModalGrid');
  if (!modal || !grid) return;

  grid.innerHTML = '';
  BADGES_CONFIG.forEach(b => {
    const isUnlocked = state.unlockedBadges.has(b.id);
    const card = document.createElement('div');
    card.className = `badge-item-card ${isUnlocked ? 'unlocked' : ''}`;
    card.innerHTML = `
      <div class="badge-icon-box">${b.icon}</div>
      <div class="badge-info">
        <h4>${b.title} ${isUnlocked ? '✓' : '🔒'}</h4>
        <p>${b.desc}</p>
        ${isUnlocked ? `<div class="badge-download-actions"><button type="button" class="btn btn-secondary" onclick="downloadBadgeArtifact('${b.id}', 'png')">Badge PNG</button><button type="button" class="btn btn-secondary" onclick="downloadBadgeArtifact('${b.id}', 'pdf')">Badge PDF</button></div>` : '<span class="badge-locked-caption">Unlock this badge by completing its requirement.</span>'}
      </div>
    `;
    grid.appendChild(card);
  });

  modal.classList.remove('hidden');
  focusModal(modal);
}

function closeBadgesModal() {
  const modal = document.getElementById('badgesModal');
  if (modal) modal.classList.add('hidden');
  restoreModalFocus();
}

// ==========================================
// PROFILE, LOGOFF & RESET ENGINE
// ==========================================
function openProfileModal() {
  if (state.activeMockAssessment || state.proctorLockUntil > Date.now()) {
    showToast('Profile actions are disabled during a proctored mock or account lock.');
    return;
  }
  const modal = document.getElementById('profileModal');
  if (!modal) return;
  document.getElementById('profileModalName').textContent = state.learnerName;
  document.getElementById('profileInputRename').value = state.learnerName === 'Learner' ? '' : state.learnerName;
  document.getElementById('profileStatXP').textContent = `⚡ ${state.xp.toLocaleString()} XP`;
  document.getElementById('profileStatLevel').textContent = `⭐ Level ${state.level}`;
  document.getElementById('profileStatBadges').textContent = `🏅 ${state.unlockedBadges.size}/${BADGE_TOTAL} Badges`;
  modal.classList.remove('hidden');
  focusModal(modal);
}

function closeProfileModal() {
  const modal = document.getElementById('profileModal');
  if (modal) modal.classList.add('hidden');
  restoreModalFocus();
}

function saveNewNameFromProfile() {
  const input = document.getElementById('profileInputRename');
  const val = input ? input.value.trim().replace(/\s+/g, ' ').slice(0, 80) : '';
  if (val) {
    state.learnerName = val;
    const certInput = document.getElementById('certCustomName');
    if (certInput) certInput.value = val;
    updateHUD();
    persistState();
    closeProfileModal();
    showToast(`Student name updated to ${val}! ✍️`);
  } else {
    alert('Please enter a valid name.');
  }
}

async function handleLogoff() {
  if (state.activeMockAssessment || state.proctorLockUntil > Date.now()) {
    showToast('You cannot log off during a proctored mock or 24-hour profile lock.');
    return;
  }
  if (confirm('Sign out of your Google account on this device? Your progress will remain saved locally to this Google profile.')) {
    persistState();
    closeProfileModal();
    try {
      await flushPendingCloudSave();
      await window.firebaseSignOut?.();
    } catch (error) {
      handleFirebaseSignOutError(error);
    }
  }
}

function handleResetProfile() {
  if (confirm('⚠️ DANGER: Are you sure you want to completely RESET all your profile progress, earned XP, and unlocked badges? This action cannot be undone.')) {
    if (activeProfileId) delete learnerProfiles[activeProfileId];
    createFreshLearnerState(authUser?.displayName || 'Learner');
    renderAllQuestionSets();
    renderMockCenter();
    switchTab('tab-concepts');
    updateHUD();
    persistState();
    showToast('Your Google profile progress has been reset.');
  }
}

// ==========================================
// 10. CONFETTI ENGINE (PURE CANVAS)
// ==========================================
let confettiParticles = [];
let confettiAnimId = null;

function triggerConfetti(durationSeconds = 1.5) {
  const canvas = document.getElementById('confettiCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ['#FF5500', '#FFA14A', '#F59E0B', '#10B981', '#3B82F6', '#EC4899'];
  confettiParticles = [];

  for (let i = 0; i < 90; i++) {
    confettiParticles.push({
      x: canvas.width / 2,
      y: canvas.height * 0.4,
      vx: (Math.random() - 0.5) * 14,
      vy: (Math.random() - 0.8) * 16,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      vRot: (Math.random() - 0.5) * 10
    });
  }

  const startTime = Date.now();
  if (confettiAnimId) cancelAnimationFrame(confettiAnimId);

  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    confettiParticles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.35; // gravity
      p.rotation += p.vRot;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    });

    if (Date.now() - startTime < durationSeconds * 1000) {
      confettiAnimId = requestAnimationFrame(loop);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  loop();
}

// ==========================================
// 11. INITIALIZATION & EVENT LISTENERS
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  renderMockCenter();
  renderProctorLockScreen();

  renderAllQuestionSets();
  switchTab(state.activeTab);
  const certInput = document.getElementById('certCustomName');
  if (certInput && !certInput.value) certInput.value = state.learnerName;

  // Register Navigation clicks
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.setAttribute('aria-controls', tab.dataset.tab);
    tab.setAttribute('aria-current', tab.classList.contains('active') ? 'page' : 'false');
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
    btn.setAttribute('aria-controls', btn.dataset.tab);
    btn.setAttribute('aria-current', btn.classList.contains('active') ? 'page' : 'false');
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  document.addEventListener('keydown', (event) => {
    const openModal = ['badgesModal', 'profileModal', 'authGateOverlay']
      .map(id => document.getElementById(id))
      .find(modal => modal && !modal.classList.contains('hidden'));
    if (!openModal) return;

    if (event.key === 'Escape') {
      if (openModal.id === 'badgesModal') closeBadgesModal();
      else if (openModal.id === 'profileModal') closeProfileModal();
      return;
    }
    if (event.key !== 'Tab') return;

    const focusable = [...openModal.querySelectorAll('button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')]
      .filter(element => element.getClientRects().length > 0);
    if (!focusable.length) {
      event.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && (document.activeElement === first || !openModal.contains(document.activeElement))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (document.activeElement === last || !openModal.contains(document.activeElement))) {
      event.preventDefault();
      first.focus();
    }
  });

  // Sound Toggle
  const soundBtn = document.getElementById('soundToggleBtn');
  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      state.soundEnabled = !state.soundEnabled;
      updateHUD();
      persistState();
      showToast(state.soundEnabled ? 'Sound FX Enabled 🔊' : 'Sound FX Muted 🔇');
    });
  }

  // Badges Modal
  const badgesBtn = document.getElementById('badgesModalBtn');
  if (badgesBtn) badgesBtn.addEventListener('click', openBadgesModal);

  // Profile & Settings Modal
  const profileSettingsBtn = document.getElementById('profileSettingsBtn');
  if (profileSettingsBtn) profileSettingsBtn.addEventListener('click', openProfileModal);

  const userPill = document.getElementById('userProfilePill');
  if (userPill) userPill.addEventListener('click', openProfileModal);

  // Close modals on click outside
  const bModal = document.getElementById('badgesModal');
  if (bModal) {
    bModal.addEventListener('click', (e) => {
      if (e.target === bModal) closeBadgesModal();
    });
  }

  const pModal = document.getElementById('profileModal');
  if (pModal) {
    pModal.addEventListener('click', (e) => {
      if (e.target === pModal) closeProfileModal();
    });
  }

  // PWA Service Worker Registration
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(err => console.log('SW registration error:', err));
  }

  // PWA Installation Handling
  let deferredPrompt = null;
  const pwaBtn = document.getElementById('pwaInstallBtn');

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (pwaBtn) pwaBtn.style.display = 'inline-flex';
  });

  window.triggerPwaInstall = function() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          showToast('App Installed Successfully! 🎉');
        }
        deferredPrompt = null;
        if (pwaBtn) pwaBtn.style.display = 'none';
      });
    } else {
      if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) {
        alert('To install on iOS / Safari: Tap the Share button (⎋) below, then select "Add to Home Screen" (➕).');
      } else {
        showToast('Install option is available in your browser settings (⋮ or ⎋) 📲');
      }
    }
  };

  if (pwaBtn) {
    pwaBtn.addEventListener('click', window.triggerPwaInstall);
  }

  updateHUD();
  appInitialized = true;
  handleFirebaseAuthState(pendingFirebaseUser);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state.activeMockAssessment) recordProctorViolation('switching away from the exam tab');
  });
  document.addEventListener('click', event => {
    if (state.proctorLockUntil > Date.now() && !event.target.closest('#proctorLockOverlay')) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);
  document.addEventListener('keydown', event => {
    if (state.proctorLockUntil > Date.now()) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);
  document.addEventListener('fullscreenchange', () => {
    if (state.activeMockAssessment && !document.fullscreenElement && document.fullscreenEnabled) recordProctorViolation('exiting fullscreen');
  });
  window.addEventListener('beforeunload', () => {
    if (state.activeMockAssessment) recordProctorViolation('reloading or closing the exam');
  });
  window.addEventListener('storage', event => {
    if (event.key !== PROFILES_STORAGE_KEY || !activeProfileId || !event.newValue) return;
    try {
      const updatedProfiles = JSON.parse(event.newValue);
      const remoteLockUntil = Number(updatedProfiles?.[activeProfileId]?.proctorLockUntil) || 0;
      if (remoteLockUntil > state.proctorLockUntil) {
        state.proctorLockUntil = Math.min(Date.now() + PROCTOR_LOCK_DURATION, remoteLockUntil);
        state.activeMockAssessment = null;
        renderProctorLockScreen();
      }
    } catch (error) { console.warn('Unable to sync local profile lock', error); }
  });
});
