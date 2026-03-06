import React, { useState } from "react";
import { Room, RoomEvent } from "livekit-client";

export default function App() {
  const [isConnected, setIsConnected] = useState(false);

  const startSession = async () => {
    const room = new Room();

    // 1. Subscribe to tracks
    room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
      if (track.kind === "audio") {

        console.log("🔊 Track subscribed:", {
          participant: participant.identity,
          trackSid: track.sid,
          muted: track.muted,
          streamState: track.stream_state,
          kind: track.kind,
        });

        const element = track.attach();
        element.autoplay = true;
        document.body.appendChild(element);

        // Web Audio debugging
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioCtx.createMediaElementSource(element);
        const analyser = audioCtx.createAnalyser();
        source.connect(analyser);
        analyser.connect(audioCtx.destination);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        function checkAudio() {
          analyser.getByteFrequencyData(dataArray);
          const sum = dataArray.reduce((a, b) => a + b, 0);
          console.log(`🔊 Audio level for ${participant.identity}:`, sum);
          requestAnimationFrame(checkAudio);
        }

        checkAudio();
      }
    });

    // 2. Connect logic
    try {
      const res = await fetch("http://localhost:5000/get-token?identity=human_dev"); //token
      const data = await res.json(); // token
    
      await room.connect("wss://denialmanagementcalller-aqd6zwym.livekit.cloud", data.token);
      setIsConnected(true);

      // Mic publish karein
      const localTracks = await room.localParticipant.setMicrophoneEnabled(true);
      console.log("✅ Room connected and Mic enabled");
    } catch (error) {
      console.error("❌ Connection error:", error);
    }
  };

  return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <h2>Live AI Voice Test</h2>
      {!isConnected ? (
        <button onClick={startSession} style={{ padding: "10px 20px", fontSize: "16px" }}>
          Start Conversation
        </button>
      ) : (
        <p style={{ color: "green" }}>● Connected - Speak now...</p>
      )}
    </div>
  );
}