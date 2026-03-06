// // src/ai/sttService.js
// const WebSocket = require("ws");
// const config = require("../config/env");

// // Create a realtime STT socket
// function createRealtimeSTT(onTranscript) {
//   const ws = new WebSocket(`wss://api.deepgram.com/v1/listen?encoding=linear16&sample_rate=16000&interim_results=true&endpointing=2000`, {
//     headers: {
//       Authorization: `Token ${config.deepgram}`,
//     },
//   });

//   ws.on("open", () => console.log("✅ Deepgram WS connected for real-time STT"));

//   ws.on("message", (msg) => {
//     console.log("Received STT message:", msg.toString());
//     try {
//       const data = JSON.parse(msg.toString());
//       if (data.channel && data.channel.alternatives && data.channel.alternatives.length) {
//         const transcript = data.channel.alternatives[0].transcript;
//         if (transcript && transcript.trim() !== "") {
//           console.log(data.channel.is_final ? "📝 Final Transcript:" : "📝 Partial Transcript:", transcript);
//           onTranscript(transcript, data.is_final || false);
//         }
//       }
//     } catch (err) {
//       console.error("❌ STT message parse error:", err);
//     }
//   });

//   ws.on("close", () => console.log("⚡ Deepgram WS closed"));
//   ws.on("error", (err) => console.error("❌ Deepgram WS error:", err));

//   return ws;
// }

// // Send audio frames (PCM16)
// function sendAudioFrame(ws, audioBuffer) {
//   if (!ws || ws.readyState !== WebSocket.OPEN) return;
//   if (!audioBuffer) return;
//   console.log("Sending audio frame of size:", audioBuffer);
//   ws.send(audioBuffer);
// }

// // Close STT
// function closeSTT(ws) {
//   if (ws.readyState === WebSocket.OPEN) ws.close();
// }

// module.exports = { createRealtimeSTT, sendAudioFrame, closeSTT };

// src/ai/sttService.js
const WebSocket = require("ws");
const config = require("../config/env");

// Create a realtime STT socket
function createRealtimeSTT(onTranscript) {
  const ws = new WebSocket(
    `wss://api.deepgram.com/v1/listen?encoding=linear16&sample_rate=48000&channels=1&interim_results=true&endpointing=3000`,
    {
      headers: {
        Authorization: `Token ${config.deepgram}`,
      },
    }
  );

  ws.on("open", () => console.log("✅ Deepgram WS connected for real-time STT"));

  ws.on("message", (msg) => {

    try {
      const data = JSON.parse(msg.toString());

      // Log entire parsed object
      // Check if channel alternatives exist
      if (data.channel && data.channel.alternatives && data.channel.alternatives.length) {
        const alternative = data.channel.alternatives[0];
        const transcript = alternative.transcript || "";
        const isFinal = data.is_final
        if (isFinal) {
          console.log("📝 Final Transcript:", transcript);

        }
        // Call your callback
        onTranscript(transcript, isFinal);
      } else {
        console.log("⚠️ No transcript in this message:", data);
      }
    } catch (err) {
      console.error("❌ STT message parse error:", err);
    }
  });

  ws.on("close", () => console.log("⚡ Deepgram WS closed"));
  ws.on("error", (err) => console.error("❌ Deepgram WS error:", err));

  return ws;
}

// Send audio frames (PCM16)
function sendAudioFrame(ws, audioBuffer) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  if (!audioBuffer) return;

  // console.log("🎵 Sending audio frame of size:", audioBuffer.length, "bytes");
  ws.send(audioBuffer);
}

// Close STT
function closeSTT(ws) {
  if (ws.readyState === WebSocket.OPEN) ws.close();
}

module.exports = { createRealtimeSTT, sendAudioFrame, closeSTT };