# 🎙️ AI Voice Denial Management System

An automated **AI-driven solution** that handles insurance denial calls using **LiveKit SIP**, **Deepgram (STT)**, **Groq (LLM)**, and **Deepgram (TTS)**. The system orchestrates a **three-way conversation** between an **Insurance Representative (PSTN)**, an **AI Agent**, and a **Monitoring Console**.

---

# 🛠️ Tech Stack

* **SIP Trunk Provider:** Twilio
* **Communication Layer:** LiveKit (SIP & WebRTC)
* **AI Orchestration:** Node.js
* **Audio Pipeline:** Deepgram

  * Real-time **Speech-to-Text (STT)**
  * Ultra-low latency **Text-to-Speech (TTS)**
* **LLM Engine:** Groq (Llama 3.1)
* **Frontend:** React (Vite)
* **Backend:** Express.js

---

# 📋 Prerequisites

To run this project, you need **three terminal windows** and the required **environment variables configured**.

---

# 🔑 Environment Configuration

You need to create **two separate `.env` files**.

---

## 1️⃣ Main Folder (`/`) `.env`

Create this file in the **root directory**. It is used for the **AI orchestrator and SIP logic**.

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

---

## 2️⃣ Backend Folder (`/backend`) `.env`

Create this file inside the **backend directory**. It is used for **token generation**.

```env
LIVEKIT_KEY=your_livekit_api_key
LIVEKIT_SECRET=your_livekit_secret
```

---

# 🚀 Installation & Setup

**Important Note:** You must run `npm install` inside **each project folder**.

---

## 🏁 Step 1: Install Dependencies

Open **three different terminals** and run the following commands.

### Terminal 1 (Backend)

```bash
cd backend
npm install
```

### Terminal 2 (Frontend)

```bash
cd frontend
npm install
```

### Terminal 3 (Main Project)

```bash
npm install
```

---

# 🏃 Step 2: Run the Services

After installing the dependencies, start the components in the following order.

---

## 1️⃣ Backend Server (Token & API)

```bash
cd backend
node server.js
```

Runs on:

```
http://localhost:5000
```

---

## 2️⃣ Frontend (Monitoring Dashboard)

```bash
cd frontend
npm run dev
```

Runs on:

```
http://localhost:5173
```

---

## 3️⃣ AI Agent & SIP Worker (The Brain)

```bash
node src/index.js
```

This component manages the **AI conversation logic and call orchestration**.

---

# 🏗️ Architecture Flow

### 1️⃣ Initialization

The **AI worker** joins a **LiveKit room** and waits for participants to connect.

### 2️⃣ SIP Dispatch

The **callService** initiates an outbound call to the **Insurance Representative** using the **Twilio/LiveKit SIP trunk**.

### 3️⃣ Media Bridge

Once the call is answered, **LiveKit bridges the PSTN audio into the WebRTC room**.

### 4️⃣ AI Conversation Loop

The system runs a continuous AI processing pipeline:

**Speech-to-Text**

* Deepgram converts the representative’s voice into **real-time text**.

**LLM Processing**

* Groq running **Llama 3.1** analyzes the conversation context.
* The AI decides what to ask next (for example **Member ID** or **Denial Code**).

**Text-to-Speech**

* Deepgram converts the AI response into **audio**.
* The response is played back to the **Insurance Representative**.

---

# 📂 Project Structure

```
├── backend/            # Express server for tokens
├── frontend/           # React monitoring dashboard
├── src/
│   ├── ai/             # STT (Deepgram), LLM (Groq), TTS (Deepgram), Orchestrator Layer
│   ├── livekit/        # Room and connection management
│   ├── twilio/         # SIP outbound call logic
│   ├── state/          # Conversation stage management
│   └── index.js        # Main entry point for AI Worker
├── .env                # Global configuration
└── README.md
```

---

# ⚠️ Troubleshooting

### One-Way Audio

Check in the **LiveKit dashboard** that the **SIP trunk “Media Bridge” option is enabled**.

### Identity Error

Ensure that the **AI worker and SIP participant have unique identities**, for example:

```
ai-bot
rep-1
```

### Connection Error

Make sure that the following ports are **not already in use**:

* **Backend:** `5000`
* **Frontend:** `5173`

