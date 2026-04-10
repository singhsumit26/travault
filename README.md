# Travault — AI-Powered Travel Planner

> Plan smarter. Travel better.

Travault is a full-stack AI travel planning web application that generates personalized day-by-day itineraries, hotel recommendations, budget breakdowns, packing lists, and travel tips — all in seconds.

---

## Live Demo

🌐(https://travault-six.vercel.app/)

---

## Screenshots

> <img width="1915" height="1031" alt="image" src="https://github.com/user-attachments/assets/2f429124-3bc2-4e2e-9884-60a043d8511f" />
> <img width="1916" height="1032" alt="image" src="https://github.com/user-attachments/assets/08981d9d-b59a-4090-8cf5-4d94c665ce72" />



---

## Features

- **AI Trip Generation** — Enter source, destination, dates, budget and travelers. Groq's Llama 3.3 70B generates a complete, realistic trip plan tailored to your inputs.
- **Smart Hotel Suggestions** — 3 hotels recommended at different price points (budget, mid-range, premium), ranked by proximity to tourist spots.
- **Interactive Map** — Live Leaflet map with source and destination pins, a dashed route line, and real-time distance calculation as you type.
- **Budget Breakdown** — Animated breakdown of accommodation, food, transport, activities, and miscellaneous costs with visual progress bars.
- **Packing List** — AI-generated packing list based on destination, weather season, and trip duration.
- **Travel Tips** — Local insights, hidden gems, and practical advice specific to your destination.
- **AI Refinement** — Not happy with the plan? Type a request like *"make it more budget friendly"* or *"add more adventure activities"* and AI updates the plan instantly.
- **Surprise Me** — Can't decide where to go? Enter your budget and dates and let AI pick a destination for you.
- **PDF Export** — Download your complete trip plan as a beautifully formatted dark-themed PDF.
- **Shareable Links** — Every trip gets a unique URL that anyone can view without logging in.
- **Save & Revisit** — All your trips are saved to your account and accessible from the dashboard.
- **Authentication** — Secure sign-in with Clerk (Google, Email supported).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Animations | Framer Motion |
| Authentication | Clerk |
| Database | Supabase (PostgreSQL) |
| AI | Groq API (Llama 3.3 70B) |
| Maps | Leaflet + React Leaflet |
| Geocoding | Nominatim (OpenStreetMap) |
| PDF Export | jsPDF |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites

- Node.js v18+
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/singhsumit26/travault.git
cd travault

# Install dependencies
npm install
```

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GROQ_API_KEY=your_groq_api_key
```

### API Keys Required

| Service | Purpose | Free Tier |
|---|---|---|
| [Clerk](https://clerk.com) | Authentication | ✅ Free |
| [Supabase](https://supabase.com) | Database | ✅ Free |
| [Groq](https://console.groq.com) | AI (Llama 3.3 70B) | ✅ 1000 req/day free |
| [Google AI Studio](https://aistudio.google.com) | Gemini API (optional) | ✅ Free tier |

### Database Setup

Run this SQL in your Supabase SQL editor:

```sql
create table trips (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  title text,
  source text not null,
  destination text not null,
  start_date date,
  end_date date,
  budget numeric,
  travelers integer,
  trip_data jsonb,
  created_at timestamp with time zone default now()
);

alter table trips enable row level security;

create policy "Allow all operations"
on trips for all
using (true)
with check (true);
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Project Structure

travault/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   └── ui/          # shadcn components
│   ├── lib/
│   │   ├── gemini.js    # Groq/AI functions
│   │   └── supabase.js  # Supabase client
│   ├── pages/
│   │   ├── LandingPage.jsx
│   │   ├── Dashboard.jsx
│   │   ├── PlanTrip.jsx
│   │   └── TripDetails.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── .env                 # Not committed
├── .gitignore
├── index.html
├── vite.config.js
└── package.json


---

## Deployment

This project is deployed on Vercel. To deploy your own:

1. Push the repository to GitHub
2. Import the repo on [vercel.com](https://vercel.com)
3. Add all environment variables in Vercel project settings
4. Deploy — Vercel auto-detects Vite and handles the build

---

## Roadmap

- [ ] Weather forecast for travel dates
- [ ] Mobile responsive design
- [ ] Interactive globe visualization
- [ ] OpenWeatherMap integration
- [ ] Dark/Light mode toggle
- [ ] Multi-city trip planning

---

## Author

**Sumit Shekhawat**
- GitHub: [@singhsumit26](https://github.com/singhsumit26)

---

## License

MIT License — feel free to use this project for learning and portfolio purposes.

---

*Built using React, Groq AI, and Supabase*
