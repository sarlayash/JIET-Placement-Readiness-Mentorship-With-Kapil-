# JIET Placement Readiness Mentorship With Kapil

> **Powered By FACE Prep** • Official Curriculum: **CPCV13-05M**  
> *One of India's Largest Skill Development Company*

[![Live Demo](https://img.shields.io/badge/Demo-Live%20App-orange?style=for-the-badge&logo=googlechrome)](https://sarlayash.github.io/JIET-Placement-Readiness-Mentorship-With-Kapil-/)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable-blue?style=for-the-badge&logo=pwa)](https://sarlayash.github.io/JIET-Placement-Readiness-Mentorship-With-Kapil-/)
[![License](https://img.shields.io/badge/Curriculum-CPCV13--05M-green?style=for-the-badge)](https://sarlayash.github.io/JIET-Placement-Readiness-Mentorship-With-Kapil-/)

---

## 🌟 Overview

**JIET Placement Readiness Mentorship With Kapil** is a gamified verbal aptitude training and placement preparation web application built for students targeting Tier-1 recruitment drives (TCS, Infosys, Cognizant, Wipro, Accenture, Capgemini, etc.).

### 📱 Install as Mobile App (PWA)
- **Android / Chrome / Edge:** Open the web app and tap the **"📲 Install App"** button in the header or your browser menu.
- **iOS / Safari:** Tap the **Share** button `⎋`, then select **"Add to Home Screen"** `➕`.
- After the app shell and Firebase SDK load online, the curriculum, styles, scripts, and local images support offline practice. Google OAuth sign-in and Realtime Database sync require an internet connection. Google Fonts also require internet; system fonts are used when unavailable.
- Sign in with Google to open a learner profile. Progress syncs to Firebase Realtime Database when connected and remains saved locally for offline use.
- Select **🔊 Read aloud** on any practice or assessment question to hear its prompt and answer choices. Speech uses the browser/device voice engine; an active read can be stopped from the same button.

### Enable Google Authentication

In Firebase Console for project `picture-connect-with-kapil`, enable **Authentication → Sign-in method → Google** and add `sarlayash.github.io` under **Authentication → Settings → Authorized domains**. `localhost` can be used for local development. Firebase Authentication handles sign-up automatically the first time a learner continues with Google.

### No-cost Firebase Data and Admin Dashboard

1. This project uses Firebase Authentication and the Spark-plan Firebase Realtime Database. The default database is in `asia-southeast1`; the app stores its database URL in `firebase-auth.js`.
2. Deploy the included database security rules with `firebase deploy --only database --project picture-connect-with-kapil`.
3. The only admin account is the verified Google account `kapilnarula27july@gmail.com`; the app and Realtime Database rules both enforce this allowlist. Other Google accounts cannot access admin functions.
4. After signing in with the allowlisted account, open **Admin dashboard** from the home page or Profile to review learner records, download a CSV report, and lock or unlock learner profiles. Profile lock actions are recorded in `adminAudit`.

The dashboard tracks Google sign-in sessions under `loginSessions/{UID}/{session}`. A server-side disconnect handler marks closed sessions offline, with a heartbeat every 45 seconds while open. The dashboard labels a learner online while their latest heartbeat is within two minutes. The CSV includes presence, latest sign-in, and latest activity. Learner completion details include learning levels, English assessment attempts, and mock completion by topic.

The dashboard does not use or display a shared password. Admin access requires Firebase Authentication for the allowlisted, verified Google account, and Realtime Database rules enforce the same identity. Learner assessment answers, attempts, XP, badges, completion levels, certificates, and profile metadata are synced to `learners/{UID}`. Profile locks are stored separately in `learnerLocks/{UID}` so learners cannot clear an admin lock from the client.

---

## 🚀 Career Readiness Curriculum

1. **Level 1: 📖 Concept Foundations**
   - **Sentence Completion:** Proactive solving, clue identification, Support vs. Contrast signposts, Root-word prefixes (`pro-`, `bene-`, `mal-`) & suffixes (`-cide`, `-less`), cause-and-effect structures.
   - **Para-Jumbles:** Moving Jumbles vs. Anchor Jumbles, and the 7 Core Strategies (Opening sentences, mandatory pairs, pronoun antecedents, action sequences, generic-to-specific, abbreviation expansion).
2. **Level 2: 🎯 Proactive Drills**
   - **Part A:** 10 Proactive predictive sentence completion drills.
   - **Part B:** 5 Parts-of-speech syntax analysis challenges.
   - **Part C:** Rahul's daily routine sequence ordering (9-step interactive timeline).
3. **Level 3: ✍️ Sentence Battles**
   - Page 1 Practice Questions (1 to 4).
   - Page 2 Concept Review Questions (1 to 10).
4. **Level 4: 🧩 Para-Jumble Arena**
   - Page 1 Para-Jumbles (Questions 1 to 5) with arrangement and **Strategy Identification**.
   - Page 2 & 3 Advanced Fragment Rearrangements (Questions 11 to 20).
5. **Level 5: 🧪 Passage Cloze Test**
   - Chemistry Discourse Cloze Test (Questions 21 to 25).
6. **Level 6: 🤝 Workplace Soft Skills:** Teamwork, conflict resolution, accountability, prioritization, adaptability, feedback, ethics, leadership, and interview reflection, with a 10-question scenario assessment.
7. **Level 7: 💬 Professional Communication:** Listening, concise workplace writing, meetings, presentations, virtual presence, stakeholder updates, and clarification, with a 10-question scenario assessment.
8. **Level 8: 🧠 Placement Aptitude:** 20 quantitative questions; 16 logical and analytical reasoning questions; 10 data interpretation questions; and 6 spatial reasoning questions. Existing Sentence Battles, Para-Jumbles, and Cloze modules cover verbal aptitude. CPCV13-05M remains the official verbal curriculum.
9. **Level 9: 🏆 Certificates:** Downloadable Soft Skills, Communication, and Aptitude certificates unlock after every question in that track is answered and the learner scores at least 70%. The overall certificate is available from the Certificates tab.

### 🔗 Connected Topics
- The Concept Mastery foundation links verbal concepts to the existing drills and practice modules, plus soft skills, communication, and aptitude assessments.

---

## 🎮 Gamification Mechanics

- **⚡ Placement XP:** Earn XP for correct answers, time bonuses, and mastery milestones.
- **🔥 Streaks:** Streak multipliers for consecutive correct solutions.
- **🏅 51 Placement Readiness Badges:**
  - 🚀 *Fresh Recruit*
  - 🔍 *Signpost Detective*
  - 💡 *Proactive Thinker*
  - ⏳ *Chronology King*
  - ✍️ *Sentence Architect*
  - 🧩 *Jumble Maestro*
  - 🧪 *Logic Alchemist*
  - 🏆 *Placement Prodigy*
  - 🤝 *Teamwork Pro*
  - 💬 *Communication Ace*
  - ➗ *Quant Master*
  - 🧠 *Reasoning Ace*
  - 📊 *Data Analyst*
  - 🔷 *Spatial Solver*
  - Eight English topic badges, ten level-completion badges, and nineteen topic mock-master badges
- **🔊 Sound FX:** Real-time synthesized web audio effects.
- **🎊 Confetti:** Celebratory canvas confetti particle physics.

## 📝 Mock Exam Center

- Five timed mock forms are available for each learning topic, from Easy through Medium to Hard.
- Each mock awards XP once on its first completion. Passing all five forms in a topic at 70% or higher unlocks that topic's badge and PNG/PDF certificate.
- Camera-free proctoring uses fullscreen and page visibility when the browser supports them. Three warnings create a Realtime Database-backed 24-hour profile lock for signed-in learners; profile writes are rejected by database rules until the lock expires or an admin removes it.
- Learner progress syncs to Realtime Database when connected, with local storage supporting offline use. Google sign-in and server sync require internet access.

---

## 🛠️ Local Development

```bash
# Clone the repository
git clone https://github.com/sarlayash/JIET-Placement-Readiness-Mentorship-With-Kapil-.git

# Navigate to the folder
cd JIET-Placement-Readiness-Mentorship-With-Kapil-

# Start any local HTTP server (e.g. Python)
python -m http.server 8080
```
Open [http://localhost:8080](http://localhost:8080) in your browser.

---

*Mentorship By Kapil • Powered By FACE Prep • JIET Placement Division*
