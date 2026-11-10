# Daily Diary

A calm, minimalist daily diary for **iOS, Android and the web**, built with Expo (React Native) and Expo Router.

- **Home**: greeting, profile, calendar (mood and event dots), **For you** (AI Daily companion: quote, advice, ask for advice) and **Reminders** (upcoming events)
- **Entries and events** open as one full card with **Edit** and **Delete**
- **New entry (+)**: title, diary text, mood (5 built-in moods + your own emoji moods via **+**)
- **Event plan**: title, date, time or all-day, description, plain reminder notes
- **Toasts**: today's and tomorrow's events with their reminders pop up when you open the app; saving and deleting confirm with a toast
- **History**: mood for the week, month or year, stats, an **AI Reflection** on the period, and a mood breakdown
- **Your diary**: Event / Diary toggle, sort newest or oldest, search, grouped by month
- **Profile**: your name, Auto / Light / Dark appearance, clear data

Everything is stored on the device (AsyncStorage). The AI features read your diary so their advice and summaries are
about you: the **Daily companion** and **Ask** send your last 7 days of entries (titles, text and moods) plus your first
name and question; **Reflection** sends the entries of the period you're viewing. Nothing else leaves the device.

## AI setup

The AI features (Daily companion, Ask, Reflection) run in a server route (`src/app/api/companion+api.ts`),
so API keys never ship inside the app. Put **one** key in `.env.local` (git-ignored), after the `=`:

```
GEMINI_API_KEY=your-gemini-key        # Google Gemini, used first when set
ANTHROPIC_API_KEY=your-claude-key     # Claude, used only if GEMINI_API_KEY is empty
```

- Gemini key: https://aistudio.google.com/apikey · Claude key: https://platform.claude.com
- No quotes, no spaces. Save the file, then **restart** the dev server (`Ctrl + C`, then `npm run dev`).
- Gemini: `gemini-flash-latest`; if Google says it's busy, the route retries and falls back to
  `gemini-flash-lite-latest`, then `gemini-2.5-flash`.
- **Without a key** the app still works: the card shows a saved quote and gentle advice.

## Run it

```bash
npm install
npx expo start
```

- **Phone**: install **Expo Go** from the App Store or Play Store, then scan the QR code.
- **Web**: `npm run dev` (or press `w`), then open http://localhost:8081.

> On a phone, the AI companion reaches the server route through the dev server. To publish the app, deploy
> the server part too (e.g. EAS Hosting: `npx expo export -p web` then `npx eas-cli@latest deploy`).

> Expo SDK 58 recommends **Node.js 22.13+**. It runs on Node 20, but you'll see warnings.
> If you use nvm: `nvm install 22 && nvm use 22`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm start` | Start the dev server |
| `npm run web` | Start and open the web app |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npx expo export -p web` | Build the static web app into `dist/` |

## Project layout

```
src/
  app/                 routes (Expo Router)
    (tabs)/            Home, History, Your diary + custom tab bar / sidebar
    entry/[id].tsx     diary editor ("new" creates)
    event/[id].tsx     event plan editor ("new" creates)
    profile.tsx
  components/          ui kit, calendar, form controls, list rows
  constants/theme.ts   colours, moods, spacing (light + dark)
  lib/                 store (AsyncStorage), date helpers, confirm dialog
```
