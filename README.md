# 🎙️ AI Voice Denial Management System

An automated AI-driven solution that handles insurance denial calls using **LiveKit SIP**, **Deepgram (STT)**, **Groq (LLM)**, and **Deepgram (TTS)**. The system orchestrates a 3-way conversation between an Insurance Representative (PSTN), an AI Agent, and a Monitoring Console.

---

## 🛠️ Tech Stack

* **SIP Trunk Provider:** Twilio
* **Communication:** LiveKit (SIP & WebRTC)
* **AI Orchestration:** Node.js
* **Audio Pipeline:** Deepgram (Real-time STT), Deepgram (Ultra-low latency TTS)
* **LLM Engine:** Groq (Llama 3.1)
* **Frontend:** React.js (Vite)
* **Backend:** Express.js

---

## 📋 Prerequisites

Project ko run karne ke liye aapke paas **teen terminal windows** honi chahiye aur niche diye gaye environment variables set hone chahiye.

### 🔑 Environment Configuration

Aapko **do alag `.env` files** banani hain:

#### 1. Main Folder (`/`) `.env`

Root directory mein yeh file banayein (AI Orchestrator aur SIP logic ke liye):

```env
TWILIO_SID=your_twilio_sid
TWILIO_TOKEN=your_twilio_token
TWILIO_NUMBER=your_twilio_phone_number
DEEPGRAM_KEY=your_deepgram_api_key
LIVEKIT_URL=your_livekit_url
LIVEKIT_KEY=your_livekit_api_key
LIVEKIT_SECRET=your_livekit_secret
GROK_KEY=your_grok_api_key

```

#### 2. Backend Folder (`/backend`) `.env`

`/backend` directory ke andar yeh file banayein (Token generation ke liye):

```env
LIVEKIT_KEY=your_livekit_api_key
LIVEKIT_SECRET=your_livekit_secret

```

---

## 🚀 Installation & Setup

**Zaroori Note:** Har folder mein ja kar `npm install` karna lazmi hai.

### 🏁 Step 1: Dependencies Install Karein

Teen alag terminals kholein aur ye commands run karein:

1. **Terminal 1 (Backend):** `cd backend && npm install`
2. **Terminal 2 (Frontend):** `cd frontend && npm install`
3. **Terminal 3 (Main):** `npm install`

### 🏃 Step 2: Services Run Karein

Installation ke baad, components ko is order mein start karein:

**1️⃣ Backend Server (Token & API)**

```bash
cd backend
node server.js

```

*Port: http://localhost:5000*

**2️⃣ Frontend (Monitoring Dashboard)**

```bash
cd frontend
npm run dev

```

*Port: http://localhost:5173*

**3️⃣ AI Agent & SIP Worker (The Brain)**

```bash
node src/index.js

```

---

## 🏗️ Architecture Flow

1. **Initialization:** `ai-worker` LiveKit room join karta hai aur participants ka wait karta hai.
2. **SIP Dispatch:** `callService` Twilio/LiveKit Trunk ke zariye Insurance Representative ko call milata hai.
3. **Media Bridge:** Call answer hote hi, LiveKit PSTN audio ko WebRTC room mein bridge kar deta hai.
4. **AI Loop:**
* **STT:** Deepgram voice ko real-time text mein convert karta hai.
* **LLM (Groq):** Llama 3.1 context samajh kar "Member ID" ya "Denial Code" mangne ka faisla karta hai.
* **TTS:** Deepgram AI ke response ko wapas audio mein badalta hai jo Representative ko sunayi deta hai.



---

## 📂 Project Structure

```text
├── backend/            # Express server for tokens
├── frontend/           # React monitoring dashboard
├── src/
│   ├── ai/             # STT (Deepgram), LLM (Groq), TTS (Deepgram) ,Orchestrator Layer
│   ├── livekit/        # Room & Connection management
│   ├── twilio/         # SIP Outbound call logic
│   ├── state/          # Conversation stage management
│   └── index.js        # Main entry point for AI Worker
├── .env                # Global Main Config
└── README.md

```


## ⚠️ Troubleshooting

* **One-Way Audio:** LiveKit Dashboard mein check karein ke SIP Trunk ka "Media Bridge" enabled hai.
* **Identity Error:** AI Worker aur SIP Participant ki identity unique honi chahiye (e.g., `ai-bot` aur `rep-1`).
* **Connection Error:** Ensure karein ke backend (5000) aur frontend (5173) ports khali hain.

