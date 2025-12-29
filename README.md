# 🎵 Music Agent ADK


## 🎬 Live Demo (Production)

Short demo video showing how the project interprets the **user’s intent**,  
understands the meaning of each request, and **routes it to the appropriate tool**  
to generate AI-powered music recommendations.  
The project is deployed on **Vercel**, with the AI Agent running via **Agent Engine**.

https://github.com/user-attachments/assets/6719b323-1a8c-4473-919e-58ec4c7ed803


<div align="center">

![Music Agent Banner](https://img.shields.io/badge/AI-Powered-blue?style=for-the-badge)
![Google ADK](https://img.shields.io/badge/Google-ADK-orange?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-3.10+-blue?style=for-the-badge)
![Deezer API](https://img.shields.io/badge/Deezer-API-purple?style=for-the-badge)

**AI-Powered Music Recommendation Agent Built with Google ADK & Gemini**

[Live Demo](https://music-agent-adk.vercel.app/) • [GitHub](https://github.com/tziporaI/music-agent-adk)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [Installation & Setup](#-installation--setup)
- [Usage Examples](#-usage-examples)
- [API Integration](#-api-integration)
- [Deployment](#-deployment)
- [Future Enhancements](#-future-enhancements)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

**Music Agent ADK** is an intelligent conversational AI agent that provides personalized music recommendations based on user preferences, mood, or favorite artists. Built as a learning project to explore **Google's Agent Development Kit (ADK)**, this application demonstrates the power of combining LLMs with external APIs to create contextually aware, helpful AI assistants.

### What Makes This Special?

- 🧠 **Smart Query Understanding**: Uses Gemini 2.0 Flash to interpret natural language, correct spelling errors, and understand user intent
- 🎯 **Contextual Recommendations**: Remembers conversation history to avoid repeating songs within the same session
- 🎨 **Beautiful UI**: Clean, responsive Next.js frontend with real-time agent interaction
- 🔗 **Full-Stack Integration**: Seamless communication between Python backend and Next.js frontend
- ☁️ **Cloud-Native**: Deployed on Vercel with production-ready infrastructure

---

## ✨ Key Features

### 🤖 Intelligent Agent Capabilities

- **Natural Language Processing**: Understands conversational queries like "I feel nostalgic, got any songs?" or "Play something by tailer swft"
- **Spell Correction**: Automatically fixes typos in artist names and song titles
- **Multi-Modal Search**: Supports search by:
  - 🎤 Artist name
  - 🎵 Song title
  - 😊 Mood/emotion
  - 🎼 Music genre
- **Context Awareness**: Maintains conversation history to provide relevant, non-repetitive recommendations

### 🎯 Smart Recommendations

- Returns exactly **5 curated song recommendations** per request
- Formats results in a clean, structured HTML table
- Provides direct links to play songs on Deezer
- Fallback mechanisms for ambiguous queries

### 💬 User Experience

- Warm, respectful, and friendly conversational tone
- Real-time responses with streaming capabilities
- Responsive design that works on all devices
- Intuitive interface for seamless interaction

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         USER                                │
│                  (Web Browser / Mobile)                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTPS Request
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   FRONTEND +BACKEND (Next.js)               │
│  ┌────────────────────────────────────────────────────┐     │
│  │  • TypeScript/React Components                     │     │
│  │  • Real-time Chat Interface                        │     │
│  │  • State Management                                │     │
│  │  • Responsive Design (Tailwind CSS)                │     │
│  └────────────────────────────────────────────────────┘     │
│                                                             │
│                 Deployed on: Vercel                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ API Calls
                         ▼
┌─────────────────────────────────────────────────────────────┐
│               BACKEND (Python + ADK)                        │
│  ┌────────────────────────────────────────────────────┐     │
│  │                    Music Agent                     │     │
│  │  ┌──────────────────────────────────────────────┐  │     │
│  │  │   Google ADK Agent (music_agent.py)          │  │     │
│  │  │   • Query Interpretation                     │  │     │
│  │  │   • Tool Selection & Orchestration           │  │     │
│  │  │   • Conversation History Management          │  │     │
│  │  │   • Response Formatting                      │  │     │
│  │  └──────────────────────────────────────────────┘  │     │
│  │                                                    │     │
│  │  ┌──────────────────────────────────────────────┐  │     │
│  │  │   Gemini 2.0 Flash (LLM)                     │  │     │
│  │  │   • Natural Language Understanding           │  │     │
│  │  │   • Spell Correction                         │  │     │
│  │  │   • Intent Recognition                       │  │     │
│  │  │   • Response Generation                      │  │     │
│  │  └──────────────────────────────────────────────┘  │     │
│  │                                                    │     │
│  │  ┌──────────────────────────────────────────────┐  │     │
│  │  │   Music Tools (music_tools.py)               │  │     │
│  │  │   • search_music_api(query)                  │  │     │
│  │  │   • search_by_genre(genre)                   │  │     │
│  │  │   • search_by_artist(artist)                 │  │     │
│  │  │   • search_by_mood_with_genre_fallback(mood) │  │     │
│  │  └──────────────────────────────────────────────┘  │     │
│  └────────────────────────────────────────────────────┘     │
│                                                             │
│                 Deployed on: Engine/Vercel                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ REST API Calls
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                        │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Deezer API                                        │     │
│  │  • Track Search                                    │     │
│  │  • Artist Information                              │     │
│  │  • Genre Filtering                                 │     │
│  │  • Preview URLs                                    │     │
│  └────────────────────────────────────────────────────┘     │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Google Vertex AI                                  │     │
│  │  • Gemini 2.0 Flash Model Hosting                  │     │
│  │  • Service Account Authentication                  │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Input** → User types a query in the Next.js frontend
2. **Frontend Processing** → React component captures input and sends to backend
3. **Agent Orchestration** → ADK agent receives request and analyzes intent
4. **LLM Processing** → Gemini 2.0 interprets query, corrects spelling, extracts key information
5. **Tool Selection** → Agent selects appropriate music search tool based on query type
6. **API Integration** → Tool calls Deezer API with refined search parameters
7. **Result Processing** → Agent formats 5 top results into structured HTML table
8. **Response Delivery** → Formatted response sent back through frontend to user

---

## 🛠️ Technology Stack

### Backend

| Technology | Purpose | Version |
|-----------|---------|---------|
| **Python** | Backend runtime | 3.10+ |
| **Google ADK** | Agent framework & orchestration | Latest |
| **Gemini 2.0 Flash** | LLM for natural language understanding | Latest |
| **Deezer API** | Music data source | v1 |
| **Vertex AI** | LLM hosting & management | Latest |

### Frontend

| Technology | Purpose | Version |
|-----------|---------|---------|
| **Next.js** | React framework | 14 |
| **TypeScript** | Type-safe JavaScript | Latest |
| **React** | UI library | 18 |
| **Tailwind CSS** | Styling framework | Latest |

### DevOps & Deployment

- **Vercel** - Frontend & backend hosting
- **Engine** - Agent deployment platform
- **Git/GitHub** - Version control
- **Environment Variables** - Configuration management

---

## 📁 Project Structure

```
music-agent-adk/
│
├── app/                                    # Backend Application Root
│   ├── [multi_tool_agent]/                # Agent package directory
│   │   ├── .adk/                          # ADK configuration
│   │   ├── tools/                         # Agent tools
│   │   │   ├── __init__.py
│   │   │   ├── mood_to_genre.py          # Mood → Genre mapping
│   │   │   └── music_tools.py            # Deezer API integration
│   │   ├── utils/                         # Utility functions
│   │   │   ├── __init__.py
│   │   │   ├── gcs.py                    # Google Cloud Storage utilities
│   │   │   ├── memory_store.py           # Conversation memory management
│   │   │   ├── tracing.py                # Debugging & logging
│   │   │   └── typing.py                 # Type definitions
│   │   └── .venv/                        # Python virtual environment
│   │
│   ├── .env                               # Environment variables (not in repo)
│   ├── requirements.txt                   # Python dependencies
│   ├── __init__.py                       # Package initialization
│   ├── agent.py                          # Main agent logic & orchestration
│   ├── agent_engine_app.py               # Agent Engine integration
│   └── config.py                         # Configuration management
│
├── nextjs/                                # Frontend Application
│   ├── src/
│   │   ├── app/                          # Next.js app directory
│   │   ├── components/                   # React components
│   │   └── lib/                          # Utility functions
│   ├── public/                           # Static assets
│   ├── package.json                      # Node dependencies
│   └── tsconfig.json                     # TypeScript configuration
│
├── External Libraries/                    # External dependencies
├── Scratches and Consoles/               # Development workspace
│
├── .gitignore                            # Git ignore rules
├── Makefile                              # Build & deployment scripts
├── pyproject.toml                        # Python project configuration
├── uv.lock                               # UV package lock file
└── README.md                             # This file
```

### Key Files Explained

#### Backend Core Files

**`agent.py`**
- Implements the main conversational agent using Google ADK
- Manages conversation state and history
- Orchestrates between LLM and tools
- Handles error cases and fallbacks

**`agent_engine_app.py`**
- Integration with Google Agent Engine
- Handles deployment and runtime configuration
- Manages agent lifecycle

**`config.py`**
- Central configuration management
- Environment variable handling
- API keys and credentials setup

#### Tools Directory

**`tools/music_tools.py`**
- Contains all Deezer API integration logic
- Implements main search functions:
  - `search_music_api()` - General smart search
  - `search_by_genre()` - Genre-specific search
  - `search_by_artist()` - Artist-specific search
  - `search_by_mood_with_genre_fallback()` - Mood-based with fallback
- Returns formatted HTML tables with song data

**`tools/mood_to_genre.py`**
- Maps emotional states to music genres
- Example: "nostalgic" → "classic rock", "indie"
- Provides intelligent defaults when mood is ambiguous

#### Utils Directory

**`utils/memory_store.py`**
- Manages conversation history
- Tracks previously recommended songs
- Prevents duplicate recommendations within session

**`utils/gcs.py`**
- Google Cloud Storage integration
- Handles file operations if needed
- Storage utilities

**`utils/tracing.py`**
- Debugging and logging utilities
- Performance monitoring
- Error tracking

**`utils/typing.py`**
- Type definitions and annotations
- Ensures type safety across the project

#### Frontend (Next.js)

**`nextjs/src/`**
- React components for chat interface
- API routes for backend communication
- Responsive design implementation
- Real-time state management
---

## 🚀 Installation & Setup

### Prerequisites

- **Python** 3.10 or higher
- **Node.js** 18 or higher
- **npm** or **yarn**
- **Google Cloud Account** with Vertex AI enabled
- **Deezer API Access** (free)

### Backend Setup

1. **Clone the repository**
```bash
git clone https://github.com/tziporaI/music-agent-adk.git
cd music-agent-adk
```

2. **Set up Python environment**
```bash
# Using uv (recommended)
uv venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Or using standard venv
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
cd app/multi_tool_agent
pip install -r requirements.txt
```

4. **Configure environment variables**

Create a `.env` file in the root directory:

```env
# Google Vertex AI Configuration
GOOGLE_GENAI_USE_VERTEXAI=True
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json

# Or use service account JSON directly
SERVICE_ACCOUNT_JSON=path/to/service-account.json

```

5. **Run the backend agent**
```bash
# From the root directory
adk web --port 8001
```

The agent will be available at `http://localhost:8001`

### Frontend Setup

1. **Navigate to Next.js directory**
```bash
cd nextjs
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
```

3. **Configure backend URL**

Create `nextjs/.env.local`:

```env
```

4. **Run the development server**
```bash
npm run dev
# or
yarn dev
```

The frontend will be available at `http://localhost:3000`

### Full Stack Development

For local development with both frontend and backend:

```bash
# Terminal 1 - Backend
adk web --port 8001

# Terminal 2 - Frontend
cd nextjs && npm run dev
```

---

## 💡 Usage Examples

### Example Conversations

**Example 1: Mood-Based Search**
```
User: I feel nostalgic, got any songs?

Agent: Of course! Here are 5 nostalgic songs for you:

[Displays table with 5 songs including:
- Title, Artist, Album
- Preview links to Deezer
- Songs matching nostalgic mood]
```

**Example 2: Artist Search (with spelling correction)**
```
User: Play something by tailer swft

Agent: I found songs by Taylor Swift! Here are 5 recommendations:

[Displays table with 5 Taylor Swift songs]
```

**Example 3: Genre-Based Search**
```
User: Give me pop songs please

Agent: Here are 5 great pop songs for you:

[Displays 5 popular pop tracks]
```

**Example 4: Conversation History**
```
User: Show me more rock songs

Agent: Since I already showed you some rock songs earlier,
here are 5 different rock tracks you might enjoy:

[Displays 5 new rock songs, avoiding previous recommendations]
```

### API Response Format

The agent returns responses in structured HTML format:

```html
<table>
  <thead>
    <tr>
      <th>Title</th>
      <th>Artist</th>
      <th>Album</th>
      <th>Preview</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Song Title</td>
      <td>Artist Name</td>
      <td>Album Name</td>
      <td><a href="deezer-url">🎵 Play</a></td>
    </tr>
    <!-- 4 more rows -->
  </tbody>
</table>
```

---

## 🔌 API Integration

### Deezer API

The project uses Deezer's public API for music data:

**Base URL**: `https://api.deezer.com`

**Key Endpoints Used**:
- `/search?q={query}` - General search
- `/search/track?q=artist:"{artist}"` - Artist-specific search
- `/search/track?q=genre:"{genre}"` - Genre-specific search

**Response Processing**:
1. API returns JSON with track data
2. Agent filters to top 5 results
3. Results formatted into HTML table
4. Preview URLs extracted for playback links

### Google Vertex AI / Gemini

**Model**: Gemini 2.0 Flash

**Key Capabilities Used**:
- Natural language understanding
- Spelling correction
- Intent classification
- Context-aware responses

**Integration**:
```python
from google.cloud import aiplatform

# Initialize with service account
credentials = service_account.Credentials.from_service_account_file(
    'path/to/service-account.json'
)

# Use with ADK
agent = Agent(
    model="gemini-2.0-flash",
    tools=[search_music_api, search_by_genre, ...]
)
```

---

## 🚢 Deployment

### Production Deployment

The application is deployed using **Vercel** for both frontend and backend:

**Live Application**: [https://music-agent-adk.vercel.app/](https://music-agent-adk.vercel.app/)

### Deployment Architecture

```
┌────────────────────────────────────┐
│         Vercel Platform            │
│                                    │
│  ┌──────────────────────────────┐  │
│  │  Next.js Frontend            │  │
│  │  - Static Generation         │  │
│  │  - Edge Functions            │  │
│  │  - CDN Distribution          │  │
│  └──────────────────────────────┘  │
│                                    │
│  ┌──────────────────────────────┐  │
│  │  Python Backend (Serverless) │  │
│  │  - ADK Agent                 │  │
│  │  - API Routes                │  │
│  │  - Function Execution        │  │
│  └──────────────────────────────┘  │
└────────────────────────────────────┘
```

### Deployment Steps

#### Deploy Backend (Agent)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy from root directory
vercel --prod

# Set environment variables in Vercel dashboard
# - GOOGLE_GENAI_USE_VERTEXAI
# - SERVICE_ACCOUNT_JSON
# -AGENT_ENGINE_ENDPOINT
```

#### Deploy Frontend

```bash
# Navigate to frontend
cd nextjs

# Deploy to Vercel
vercel --prod

# Configure environment variables
# - NEXT_PUBLIC_API_URL (points to backend)
```

### Environment Variables (Production)

In Vercel dashboard, configure:

**Backend**:
- `GOOGLE_GENAI_USE_VERTEXAI=True`
- `SERVICE_ACCOUNT_JSON=<base64-encoded-json>`
- `GOOGLE_CLOUD_PROJECT=<project-id>`

**Frontend**:
- `NEXT_PUBLIC_API_URL=<backend-url>`

### Alternative: Engine Deployment

Google ADK agents can also be deployed to **Engine**:

```bash
# Deploy agent to Engine
uv run python -m app.agent_engine_app

# Get deployment URL
adk deployments list
```

---

## 🎯 Key Learnings & Design Decisions

### Why Google ADK?

- **Built-in Orchestration**: Handles tool selection and execution flow
- **LLM Integration**: Seamless Gemini integration
- **Conversation Management**: Built-in history tracking
- **Error Handling**: Robust fallback mechanisms

### Why Deezer API?

- **Free Access**: No API key required for basic usage
- **Rich Metadata**: Comprehensive song information
- **Preview URLs**: Direct playback links
- **Global Coverage**: Extensive music catalog

### Why Next.js?

- **React Framework**: Modern component-based UI
- **Server-Side Rendering**: Better performance
- **API Routes**: Built-in backend capabilities
- **TypeScript Support**: Type safety
- **Vercel Integration**: Seamless deployment

---

## 🔮 Future Enhancements

### Planned Features

- [ ] **Voice Input Integration**
  - Use Web Speech API for voice queries
  - Text-to-speech for agent responses

- [ ] **User Session Memory**
  - Persistent user preferences
  - Cross-session recommendation history
  - Favorite artists/genres tracking

- [ ] **Personalized Recommendations**
  - Learning from user interactions
  - Collaborative filtering
  - Recommendation refinement over time

- [ ] **Language-Based Recommendations**
  - Hebrew songs
  - Spanish tracks
  - Multi-language support

- [ ] **Platform Integration**
  - Spotify API integration
  - YouTube Music sync
  - Apple Music support

- [ ] **Enhanced UI Features**
  - Inline music player
  - Playlist creation
  - Share recommendations

- [ ] **Advanced Agent Capabilities**
  - Explain song choices (why this song?)
  - Compare artists/songs
  - Music history and trivia

### Technical Improvements

- [ ] Add comprehensive unit tests
- [ ] Implement rate limiting
- [ ] Add caching layer for API calls
- [ ] Improve error messages
- [ ] Add logging and monitoring
- [ ] Performance optimization
- [ ] Security enhancements

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add some amazing feature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Contribution Guidelines

- Write clear commit messages
- Add tests for new features
- Update documentation as needed
- Follow existing code style
- Ensure all tests pass before submitting

---

## 🙏 Acknowledgments

- **Google ADK Team** - For the excellent agent development framework
- **Deezer** - For providing free music API access
- **Vercel** - For seamless deployment platform
- **Google Gemini** - For powerful LLM capabilities

---

## 📞 Contact & Support

**Developer**: Tzipora Ittah

- **GitHub**: [@tziporaI](https://github.com/tziporaI)
- **Project Link**: [https://github.com/tziporaI/music-agent-adk](https://github.com/tziporaI/music-agent-adk)
- **Live Demo**: [https://music-agent-adk.vercel.app/](https://music-agent-adk.vercel.app/)

### Found a Bug?

Please open an issue on GitHub with:
- Description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)

### Have Questions?

- Open a discussion on GitHub
- Check existing issues for similar questions
- Review the documentation

---

<div align="center">

**Made with 💜 by [Tzipora Ittah](https://github.com/tziporaI)**

⭐ **Star this repo if you found it helpful!** ⭐

[Live Demo](https://music-agent-adk.vercel.app/) • [Report Bug](https://github.com/tziporaI/music-agent-adk/issues) • [Request Feature](https://github.com/tziporaI/music-agent-adk/issues)

</div>
