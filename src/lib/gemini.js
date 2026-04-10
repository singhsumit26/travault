const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY
const API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.3-70b-versatile'

async function callGroq(prompt, temperature = 0.7) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: MODEL,
      temperature,
      max_tokens: 8192,
      messages: [
        {
          role: 'system',
          content: 'You are an expert Indian travel planner. Always respond with valid JSON only. No markdown, no explanation, just the raw JSON object.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    })
  })

  const data = await response.json()

  if (!response.ok) {
    console.error('Groq API error:', data)
    throw new Error(data.error?.message || `Groq API failed with status ${response.status}`)
  }

  const text = data.choices[0].message.content.trim()
  const clean = text.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}

export async function generateTripPlan(tripDetails) {
  const { source, destination, startDate, endDate, budget, travelers, preferences } = tripDetails

  const prompt = `Create a detailed travel plan with these details:
- From: ${source}
- To: ${destination}
- Start Date: ${startDate}
- End Date: ${endDate}
- Budget: ₹${budget} INR total for all ${travelers} travelers combined, for the entire round trip
- Number of Travelers: ${travelers}
- Preferences: ${preferences || 'General sightseeing'}

Critical instructions — follow ALL of these strictly:

TRANSPORT REALISM:
- If the source is a small town or village (like Pilani, Sikar, Alwar, Fatehpur etc.), identify the nearest major railway station or airport and suggest traveling there first by bus/cab, then take train to destination. 
- Never suggest flights unless the budget comfortably allows it after accounting for all other expenses.
- Always prefer trains over flights for budget trips.
- Suggest realistic transport modes based on actual Indian rail/road connectivity.

BUDGET AWARENESS (MOST CRITICAL):
- Total budget is ₹${budget} for ALL ${travelers} travelers for the ENTIRE round trip. This is absolutely non-negotiable.
- Before suggesting any transport, calculate: cost per person × ${travelers} travelers × 2 (return journey). If it exceeds 40% of total budget, suggest a cheaper alternative.
- Per person budget is approximately ₹${Math.round(budget / travelers)}. Plan accordingly.
- If per person budget is under ₹3000, use buses and sleeper class trains only. No flights ever.
- If per person budget is under ₹5000, use sleeper/3AC trains only. No flights.
- Budget hotel costs: ₹400-800 per room per night (fits 2 people). Mid-range: ₹1000-2500. Never suggest premium hotels on tight budgets.
- Meals: ₹80-150 per person per meal for budget trips. Dhabas and local restaurants.
- The sum of accommodation + food + transport + activities + miscellaneous must be less than or equal to ₹${budget}.

ROUND TRIP:
- The budget covers the COMPLETE round trip — travel to destination AND return back to source.
- Transport costs must include both onward and return journey.
- Plan the last day as a return travel day back to ${source}.

COST REALISM:
- All costs must reflect actual 2024-2025 Indian market rates.
- Train tickets sleeper class: ₹150-600 per person depending on distance. 3AC: ₹400-1500. Always multiply by ${travelers} travelers.
- Local auto/rickshaw: ₹30-150 per trip. Cab: ₹200-500 per trip.
- Entry tickets: ₹20-500 per person. Multiply by ${travelers}.
- Show total cost for all travelers in the cost field, not per person cost.

ITINERARY REALISM:
- First day should account for travel time. Long journey (500km+) = mostly travel day with light evening activity only.
- Last day = return travel day. Only morning activities before departure.
- Max 3-4 meaningful activities per day with realistic travel time between locations.
- Don't schedule activities that are geographically far apart on the same day without accounting for travel time.

HOTEL SUGGESTIONS:
- Suggest 3 hotels that fit within the budget.
- All hotels must be real-sounding, near main tourist areas.
- pricePerNight should be per room. Mention if it fits 2 people.

LOCAL SPECIFICS:
- Suggest locally famous street food and authentic experiences specific to ${destination}.
- Include at least one offbeat or less touristy suggestion.

Return this exact JSON structure:
{
  "title": "Trip title",
  "summary": "Brief 2-3 sentence trip summary mentioning the budget and travel mode",
  "itinerary": [
    {
      "day": 1,
      "date": "${startDate}",
      "title": "Day title",
      "activities": [
        {
          "time": "09:00 AM",
          "activity": "Activity name",
          "description": "Brief description including total cost for all travelers",
          "location": "Place name",
          "cost": 500
        }
      ]
    }
  ],
  "hotels": [
    {
      "name": "Hotel name",
      "area": "Area/locality",
      "distanceFromCenter": "2 km from city center",
      "pricePerNight": 800,
      "rating": 4.0,
      "amenities": ["WiFi", "AC", "Attached Bathroom"]
    }
  ],
  "budgetBreakdown": {
    "accommodation": 2000,
    "food": 3000,
    "transport": 4000,
    "activities": 1500,
    "miscellaneous": 500,
    "total": 11000
  },
  "packingList": ["Item 1", "Item 2", "Item 3"],
  "tips": ["Tip 1", "Tip 2", "Tip 3"]
}`

  return await callGroq(prompt)
}

export async function refineTripPlan(existingPlan, userRequest) {
  const prompt = `Here is an existing trip plan:
${JSON.stringify(existingPlan)}

Modify it based on this request: "${userRequest}"

Follow the same cost realism and budget constraints as before.
Return the complete updated plan in the exact same JSON format. Raw JSON only, no markdown.`

  return await callGroq(prompt)
}

export async function generateSurpriseDestination(budget, travelers, startDate, endDate) {
  const prompt = `Suggest a surprising and exciting travel destination in India for:
- Budget: ₹${budget} INR total for all travelers combined (round trip)
- Travelers: ${travelers}
- Dates: ${startDate} to ${endDate}
- Per person budget: ₹${Math.round(budget / travelers)}

Suggest a destination that is actually reachable within this budget. No exotic or expensive destinations if budget is tight.

Return this exact JSON, raw only no markdown:
{
  "destination": "City name only",
  "reason": "One sentence why this is perfect for this budget",
  "highlights": ["highlight 1", "highlight 2", "highlight 3"]
}`

  return await callGroq(prompt, 1.0)
}