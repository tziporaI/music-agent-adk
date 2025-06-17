# music-agent-adk
AI-powered music recommender built with Google ADK and Gemini — understands your mood, favorite genres, or artists and responds with tailored tracks via the Deezer API.  

# Music Recommendation Agent (ADK + LLM + Deezer)

Welcome to the Music Agent – a conversational AI agent that recommends music based on **genre**, **artist**, or **mood** using **Deezer's API**, built with **Google's Agent Development Kit (ADK)** and powered by **LLMs**.

## 🎯 Project Goal

This project was created as a learning experience to explore and understand how to work with Google’s Agent Development Kit (ADK).  
Its purpose was to gain hands-on experience in building a functional conversational agent, understand its core architecture, and test its capabilities using real-world functionality.

As a result, the project implements an intelligent and polite agent that:
- Understands the user's musical preferences or emotional state.
- Corrects spelling errors in user queries (e.g., "taylor sweft" → "Taylor Swift").
- Searches for matching tracks using the Deezer API.
- Returns a clean and visually pleasant HTML table with exactly **5 song recommendations**.
- Responds in a warm, respectful, and user-friendly tone.


## 🛠️ Tools & Technologies

- **Google ADK (Agent Development Kit)** – to build and manage the conversational agent.
- **LLM (Gemini 2.0 Flash)** – for natural language understanding and spell correction.
- **Deezer API** – for fetching music recommendations.
- **Python** – backend implementation.
- **Environment Variables** – managed with `.env` and Vertex AI configuration.

## 📁 Project Structure

```
music-agent-adk/
├── 
|   multi_tool_agent/
│       ├── __init__.py
│       ├── music_agent.py          
│       ├── music_tools.py 
│       ├── mood_to_genre.py 
│       ├── run_agent.py       
│       └──requirements.txt       
├── .env                   
├── README.md               
```

## 🔧 Tools (`music_tools.py`)

This file contains the main logic and integration with Deezer:
- `search_music_api(query)` – Smart search based on free-text input.
- `search_by_genre(genre)`
- `search_by_artist(artist)`
- `search_by_mood_with_genre_fallback(mood)`

The tools are optimized to:
- Be resilient to spelling mistakes and vague inputs.
- Always return 5 tracks.
- Format responses in a structured and clean HTML table (with links to play the music).

## 💡 Example User Prompts

> *"I feel nostalgic, got any songs?"*  
> *"Play something by tailer swft"*  
> *"Give me pop songs please"*

## ✅ Features

- 🎵 Real-time music search from Deezer.
- 🧠 Uses LLM to refine and understand user input.
- 🤖 Agent-based design for scalability.
- 🎨 Outputs styled HTML for better presentation.
- 🙌 Friendly tone in every response.

## 🚀 How to Run

1. Clone the repository:
   ```bash
   git clone https://github.com/tziporaI/music-agent-adk.git
   cd music-agent-adk
   ```

2. Add your environment variables in a `.env` file:
   ```dotenv
   GOOGLE_GENAI_USE_VERTEXAI=True
   SERVICE_ACCOUNT_JSON=your-path-to-service-account.json
   DEEZER_API_KEY=your-deezer-api-key
   ```

3. Run the agent using ADK (for full instructions, refer to the Google ADK documentation):

   Open a terminal.
   Run the command:adk web --port 8001
   Open the provided link in your browser.
   Start interacting with the agent by typing your requests.

## 🧪 Status

This is a foundational prototype, but designed with care to handle real-world input. Further enhancements can include:
- Voice input integration
- User session memory
- Personalized recommendations
- Language-based music recommendations (e.g., Hebrew songs, Spanish tracks, etc.)
- Integration with user music platforms (e.g., syncing with Spotify/YouTube history)

---

Made with 💜 by [Tzipora Ittah](https://github.com/tziporaI)
