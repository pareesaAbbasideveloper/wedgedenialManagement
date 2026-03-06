require("dotenv").config();
console.log("ENV FILE PATH:", process.cwd());

module.exports = {
  twilioSid: process.env.TWILIO_SID,
  twilioToken: process.env.TWILIO_TOKEN,
  twilioNumber: process.env.TWILIO_NUMBER,

  deepgram: process.env.DEEPGRAM_KEY,

  livekitUrl: process.env.LIVEKIT_URL,
  livekitKey: process.env.LIVEKIT_KEY,
  livekitSecret: process.env.LIVEKIT_SECRET,

  geminiKey: process.env.GEMINI_KEY,
  grokKey: process.env.GROK_KEY,
};

console.log("Deepgram:", process.env.DEEPGRAM_KEY);