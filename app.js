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
  unlockedBadges: new Set(),
  answeredQuestions: {}, // { qId: { correct: bool, choice: string } }
  activeTab: 'tab-concepts',
  rahulOrder: [1, 2, 3, 4, 5, 6, 7, 8, 9] // 1-based indices of the 9 events
};

// Placement readiness badges across verbal, aptitude, communication, and workplace skills
const BADGES_CONFIG = [
  { id: 'recruit', icon: '🚀', title: 'Fresh Recruit', desc: 'Enrolled in Kapil\'s Placement Mentorship.' },
  { id: 'detective', icon: '🔍', title: 'Signpost Detective', desc: 'Identified clues, support & contrast signs in sentence completion.' },
  { id: 'proactive', icon: '💡', title: 'Proactive Thinker', desc: 'Mastered predictive fill-in-the-blank drills.' },
  { id: 'timeline', icon: '⏳', title: 'Chronology King', desc: 'Perfect chronological ordering of Rahul\'s narrative sequence.' },
  { id: 'sentence_ace', icon: '✍️', title: 'Sentence Architect', desc: 'Scored high on Sentence Completion Practice & Review questions.' },
  { id: 'jumble_maestro', icon: '🧩', title: 'Jumble Maestro', desc: 'Conquered complex sentence & fragment rearrangements.' },
  { id: 'cloze_master', icon: '🧪', title: 'Logic Alchemist', desc: 'Aced the Chemistry Discourse Cloze passage.' },
  { id: 'placement_prodigy', icon: '🏆', title: 'Placement Prodigy', desc: 'Earned 1000+ XP and unlocked the Official Certificate of Mastery.' },
  { id: 'soft_skills_pro', icon: '🤝', title: 'Teamwork Pro', desc: 'Scored 80% or higher on the Soft Skills assessment.' },
  { id: 'communication_ace', icon: '💬', title: 'Communication Ace', desc: 'Scored 80% or higher on the Professional Communication assessment.' },
  { id: 'quant_master', icon: '➗', title: 'Quant Master', desc: 'Scored 75% or higher on the Quantitative Aptitude assessment.' },
  { id: 'reasoning_ace', icon: '🧠', title: 'Reasoning Ace', desc: 'Scored 75% or higher on the Logical Reasoning assessment.' },
  { id: 'data_analyst', icon: '📊', title: 'Data Analyst', desc: 'Scored 75% or higher on the Data Interpretation assessment.' },
  { id: 'spatial_solver', icon: '🔷', title: 'Spatial Solver', desc: 'Scored 75% or higher on the Spatial Reasoning assessment.' }
];

const BADGE_TOTAL = BADGES_CONFIG.length;
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
function loadSavedState() {
  try {
    const saved = localStorage.getItem('faceprep_kapil_placement_state');
    if (saved) {
      const data = JSON.parse(saved);
      state.learnerName = data.learnerName || 'Learner';
      state.xp = data.xp || 0;
      state.streak = data.streak || 0;
      state.level = data.level || 1;
      state.soundEnabled = data.soundEnabled !== undefined ? data.soundEnabled : true;
      state.unlockedBadges = new Set(data.unlockedBadges || ['recruit']);
      state.answeredQuestions = data.answeredQuestions || {};
      state.rahulOrder = data.rahulOrder || [1, 2, 3, 4, 5, 6, 7, 8, 9];
    }
  } catch (e) {
    console.error('Failed to load state from localStorage', e);
  }
}

function persistState() {
  try {
    const data = {
      learnerName: state.learnerName,
      xp: state.xp,
      streak: state.streak,
      level: state.level,
      soundEnabled: state.soundEnabled,
      unlockedBadges: Array.from(state.unlockedBadges),
      answeredQuestions: state.answeredQuestions,
      rahulOrder: state.rahulOrder
    };
    localStorage.setItem('faceprep_kapil_placement_state', JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save state to localStorage', e);
  }
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

function updateCareerTrackUI() {
  const trackDisplays = [
    { id: 'softSkills', questions: CAREER_ASSESSMENTS.softSkills, certificate: CAREER_CERTIFICATES.softSkills },
    { id: 'communication', questions: CAREER_ASSESSMENTS.communication, certificate: CAREER_CERTIFICATES.communication },
    { id: 'aptitude', questions: APTITUDE_QUESTIONS, certificate: CAREER_CERTIFICATES.aptitude }
  ];

  trackDisplays.forEach((track) => {
    const result = getAssessmentResult(track.questions);
    const progress = document.getElementById(`${track.id}Progress`);
    const certificateButton = document.getElementById(`${track.id}CertificateBtn`);
    const eligible = result.complete && result.percentage >= 70;
    if (progress) {
      progress.textContent = `${result.answered}/${result.total} answered · ${result.correct} correct · ${result.percentage}%`;
    }
    if (certificateButton) {
      certificateButton.disabled = !eligible;
      certificateButton.textContent = eligible
        ? `📜 Download ${track.certificate.title} Certificate`
        : 'Answer every question and score at least 70% to unlock';
    }
  });
}

function downloadTrackCertificate(trackId) {
  const track = CAREER_CERTIFICATES[trackId];
  if (!track) return;
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
  ctx.fillText(state.learnerName.toUpperCase(), canvas.width / 2, 510);
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
  ctx.fillText(`Issued ${new Date().toLocaleDateString('en-GB')}`, canvas.width / 2, 730);
  ctx.fillStyle = '#0F172A';
  ctx.font = '700 22px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Mentorship With Kapil • JIET Placement Readiness', canvas.width / 2, 825);

  const link = document.createElement('a');
  link.download = `JIET_${trackId}_Certificate_${state.learnerName.replace(/\s+/g, '_')}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
  showToast(`${track.title} certificate downloaded! 🏆`);
}

function updateHUD() {
  document.getElementById('hudXP').textContent = state.xp.toLocaleString();
  document.getElementById('hudStreak').textContent = state.streak;
  document.getElementById('hudLevel').textContent = `Lvl ${state.level}`;
  document.getElementById('navUserName').textContent = state.learnerName;
  document.getElementById('badgeCount').textContent = `${state.unlockedBadges.size}/${BADGE_TOTAL}`;
  document.getElementById('soundIcon').textContent = state.soundEnabled ? '🔊' : '🔇';

  // Global Progress percentage calculation
  const totalQuestions = PROACTIVE_DRILLS.length + POS_DRILLS.length + 1 + 
                         SENTENCE_PAGE_1.length + SENTENCE_PAGE_2.length + 
                         PARAJUMBLES_PAGE_1.length + PARAJUMBLES_PAGE_2_3.length + 
                         CLOZE_QUESTIONS.length +
                         CAREER_ASSESSMENTS.softSkills.length +
                         CAREER_ASSESSMENTS.communication.length +
                         APTITUDE_QUESTIONS.length;
  const answeredCount = Object.keys(state.answeredQuestions).length;
  const pct = Math.min(100, Math.max(5, Math.round((answeredCount / totalQuestions) * 100)));
  document.getElementById('globalProgressFill').style.width = `${pct}%`;

  // Update Certificate dynamic fields
  const certName = document.getElementById('certRecipientName');
  if (certName) certName.textContent = state.learnerName.toUpperCase();
  const certInput = document.getElementById('certCustomName');
  if (certInput && certInput.value !== state.learnerName) certInput.value = state.learnerName;
  const certXP = document.getElementById('certScoreXP');
  if (certXP) certXP.textContent = `${state.xp.toLocaleString()} XP`;
  const certBadges = document.getElementById('certBadgesEarned');
  if (certBadges) certBadges.textContent = `${state.unlockedBadges.size} of ${BADGE_TOTAL} Unlocked`;
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
  unlockBadge('recruit');

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
function switchTab(tabId) {
  state.activeTab = tabId;

  // Panes
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  const activePane = document.getElementById(tabId);
  if (activePane) activePane.classList.add('active');

  // Desktop Tabs
  document.querySelectorAll('.nav-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tabId);
  });

  // Mobile Bottom Nav
  document.querySelectorAll('.mobile-nav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tabId);
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==========================================
// 8. ONBOARDING & CERTIFICATE MANAGEMENT
// ==========================================
function startJourney() {
  const input = document.getElementById('learnerInputName');
  const name = input ? input.value.trim() : '';
  if (!name) {
    alert('Please enter your full name to proceed with your certification.');
    return;
  }
  state.learnerName = name;
  unlockBadge('recruit');
  updateHUD();
  persistState();

  const modal = document.getElementById('onboardingModal');
  if (modal) modal.classList.add('hidden');
  sfx.playCorrect();
  showToast(`Welcome, ${name}! Your Mentorship with Kapil has started! 🚀`);
}

function updateCertName(newName) {
  if (newName && newName.trim()) {
    state.learnerName = newName.trim();
    const certName = document.getElementById('certRecipientName');
    if (certName) certName.textContent = state.learnerName.toUpperCase();
    document.getElementById('navUserName').textContent = state.learnerName;
    persistState();
  }
}

function refreshCert() {
  updateHUD();
  showToast('Certificate recipient name updated! 📜');
}

function downloadCertificatePNG() {
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
  ctx.fillText(state.learnerName.toUpperCase(), canvas.width / 2, 400);

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
  ctx.fillText(`Verified Placement Ready`, 940, 572);

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

  // Download Trigger
  const link = document.createElement('a');
  link.download = `FACEPrep_Placement_Certificate_${state.learnerName.replace(/\s+/g, '_')}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

// ==========================================
// 9. BADGES MODAL
// ==========================================
function openBadgesModal() {
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
      </div>
    `;
    grid.appendChild(card);
  });

  modal.classList.remove('hidden');
}

function closeBadgesModal() {
  const modal = document.getElementById('badgesModal');
  if (modal) modal.classList.add('hidden');
}

// ==========================================
// PROFILE, LOGOFF & RESET ENGINE
// ==========================================
function openProfileModal() {
  const modal = document.getElementById('profileModal');
  if (!modal) return;
  document.getElementById('profileModalName').textContent = state.learnerName;
  document.getElementById('profileInputRename').value = state.learnerName === 'Learner' ? '' : state.learnerName;
  document.getElementById('profileStatXP').textContent = `⚡ ${state.xp.toLocaleString()} XP`;
  document.getElementById('profileStatLevel').textContent = `⭐ Level ${state.level}`;
  document.getElementById('profileStatBadges').textContent = `🏅 ${state.unlockedBadges.size}/${BADGE_TOTAL} Badges`;
  modal.classList.remove('hidden');
}

function closeProfileModal() {
  const modal = document.getElementById('profileModal');
  if (modal) modal.classList.add('hidden');
}

function saveNewNameFromProfile() {
  const input = document.getElementById('profileInputRename');
  const val = input ? input.value.trim() : '';
  if (val) {
    state.learnerName = val;
    updateHUD();
    persistState();
    closeProfileModal();
    showToast(`Student name updated to ${val}! ✍️`);
  } else {
    alert('Please enter a valid name.');
  }
}

function handleLogoff() {
  if (confirm('Are you sure you want to log off? You can switch to another learner.')) {
    closeProfileModal();
    state.learnerName = 'Learner';
    updateHUD();
    persistState();
    
    // Show onboarding modal for new user
    const onboarding = document.getElementById('onboardingModal');
    if (onboarding) {
      document.getElementById('learnerInputName').value = '';
      onboarding.classList.remove('hidden');
    }
    showToast('Logged off successfully. Welcome a new learner! 👋');
  }
}

function handleResetProfile() {
  if (confirm('⚠️ DANGER: Are you sure you want to completely RESET all your profile progress, earned XP, and unlocked badges? This action cannot be undone.')) {
    try {
      localStorage.removeItem('faceprep_kapil_placement_state');
    } catch(e) {}
    state.learnerName = 'Learner';
    state.xp = 0;
    state.streak = 0;
    state.level = 1;
    state.unlockedBadges = new Set();
    state.answeredQuestions = {};
    state.rahulOrder = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    
    showToast('Profile & progress reset completely! Restarting...');
    setTimeout(() => {
      window.location.reload();
    }, 600);
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
  loadSavedState();

  // If learner has previously set a name, hide onboarding modal
  if (state.learnerName && state.learnerName !== 'Learner') {
    const onboarding = document.getElementById('onboardingModal');
    if (onboarding) onboarding.classList.add('hidden');
  }

  // Render question sets
  renderMultipleChoiceList('proactiveDrillContainer', PROACTIVE_DRILLS, 50);
  renderMultipleChoiceList('posDrillContainer', POS_DRILLS, 50);
  renderRahulTimeline();
  renderMultipleChoiceList('sentencePage1Container', SENTENCE_PAGE_1, 60);
  renderMultipleChoiceList('sentencePage2Container', SENTENCE_PAGE_2, 60);
  renderMultipleChoiceList('parajumblesPage1Container', PARAJUMBLES_PAGE_1, 80);
  renderMultipleChoiceList('parajumblesPage2Container', PARAJUMBLES_PAGE_2_3, 80);
  renderMultipleChoiceList('clozeQuestionsContainer', CLOZE_QUESTIONS, 70);
  renderMultipleChoiceList('softSkillsAssessmentContainer', CAREER_ASSESSMENTS.softSkills, 25);
  renderMultipleChoiceList('communicationAssessmentContainer', CAREER_ASSESSMENTS.communication, 25);
  renderMultipleChoiceList('quantitativeAssessmentContainer', CAREER_ASSESSMENTS.quantitative, 25);
  renderMultipleChoiceList('reasoningAssessmentContainer', CAREER_ASSESSMENTS.reasoning, 25);
  renderMultipleChoiceList('dataAssessmentContainer', CAREER_ASSESSMENTS.dataInterpretation, 25);
  renderMultipleChoiceList('spatialAssessmentContainer', CAREER_ASSESSMENTS.spatialReasoning, 25);

  // Register Navigation clicks
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
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
});
