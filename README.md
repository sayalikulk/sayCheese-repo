# sayCheese-repo

DayAdapt — App Summary
Concept
A weather-aware outfit recommendation app that learns your wardrobe, tracks what you wear, and suggests daily outfits tailored to the weather, your activity, and your lifestyle

Core Features
1. Wardrobe Onboarding
Users can build their wardrobe by uploading images of their clothing items in the following fixed categories:
    a. Non-negotiables - tops, pants, shoes.
    b. Optional - Thermals, Jackets, scarves, hats, gloves, facemask, umbrella
 and the vision LLM auto-detects and tags each item. Each clothing item is catalogued with these metrics: warmth, breathability, waterproof, occasion tag, color, and user comfort.
2. Daily Outfit Recommendation
The recommendation engine works in three layers:

Weather API fetches real-time data — temperature, feels-like, humidity, rain probability, UV index, wind
Algorithmic pre-filter scores and shortlists items based on weather conditions and wear history, before the LLM even gets involved
LLM reasoning gives the user around 2 options (based in the user's wardrobe inventory) for each fixed category and based on the weather - also from the optional category; and optionally generates a human-readable explanation of why each item was chosen

3. Outfit tracking (Wear Logging)
The LLM recommends the user 2 items per category (top, pant, accessory) and another option saying 'other', the user selects the item they are wearing that day and if they choose to go with none of the recommendations they can select other which will take them to their wardrobe inventory, they then select the item they are wearing that day from there. this tracks lets the LLM not recommend the same outfit option the next day. The LLM will also give weekly/monthly wardrobe utilization insights - purpose is that user will be pointed to towards the items worn less frequently.

4. Activity-Based Customisation
Ask the user Users can tell the app what they're doing that day — gym, office, outdoor brunch, casual day at home — and recommendations adjust accordingly, matching occasion tags and prioritising breathability or formality as needed.


Health & Lifestyle Angles
These are the features that anchor the app firmly in the theme:

Thermal safety — warns users about afternoon temperature drops, wind chill, or heat risk and adjusts recommendations proactively
UV protection — on high UV index days, prioritises long sleeves and protective layers, with a short health callout explaining why
Activity-matched breathability — for physical activities, recommends moisture-wicking and breathable fabrics from the user's wardrobe
Mood & enclothed cognition — a "how do you want to feel today?" selector (confident, relaxed, energised) subtly influences outfit tone and style


Technical Architecture

Vision LLM (Claude) — wardrobe scanning, item tagging, outfit scan recognition
Weather API — real-time and today's forecast (hourly)
Algorithmic scoring layer — pre-filters and scores items before LLM call, making it faster and more reliable
Reasoning LLM (also claude) — final outfit selection and explanation generation
Wear log database — stores outfit history, powers tracking and insights


What to Nail for the Demo
The hackathon win comes down to three moments: scanning a clothing item and watching it get tagged instantly, getting a recommendation with a clear and intelligent explanation, and showing the weekly planner laid out against the forecast. If those three flows are smooth, the idea sells itself.