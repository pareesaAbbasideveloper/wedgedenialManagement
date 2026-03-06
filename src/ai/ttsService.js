

// src/ai/ttsService.js
const fs = require("fs");
const path = require("path");
const { createClient } = require("@deepgram/sdk");
const { AudioSource, LocalAudioTrack, AudioFrame } = require("@livekit/rtc-node");
const wavDecoder = require("wav-decoder");
const config = require("../config/env");

const deepgram = createClient(config.deepgram);

/**
 * Returns a LocalAudioTrack already streaming frames to LiveKit
 */
async function textToSpeechStream(text, roomLocalParticipant) {
  // 1️⃣ Get WAV from Deepgram
  const response = await deepgram.speak.request(
    { text },
    { model: "aura-asteria-en", encoding: "linear16", sample_rate: 16000, container: "wav" }
  );
  const stream = await response.getStream();
  const buffer = await streamToBuffer(stream);

  // ✅ Optional save for verification
  const filePath = path.join(__dirname, "tts_debug.wav");
  fs.writeFileSync(filePath, buffer);
  console.log("✅ WAV saved for verification:", filePath);

  // 2️⃣ Decode WAV
  const decoded = await wavDecoder.decode(buffer);
  const samplesFloat = decoded.channelData[0];
  const sampleRate = decoded.sampleRate;

  // Convert Float32 [-1,1] to Int16
  const samples = new Int16Array(samplesFloat.length);
  for (let i = 0; i < samplesFloat.length; i++) {
    samples[i] = Math.max(-1, Math.min(1, samplesFloat[i])) * 32767;
  }

  // 3️⃣ Create AudioSource and LocalAudioTrack
  const audioSource = new AudioSource(sampleRate, 1);
  const localTrack = LocalAudioTrack.createAudioTrack("ai-voice", audioSource);

  // 4️⃣ Publish BEFORE streaming frames
  const publishOptions = {
    name: "ai-voice",                     // Give the track a name
  };

  await roomLocalParticipant.publishTrack(localTrack,publishOptions);
  console.log("🔊 AI track published, now streaming frames...");

  // 5️⃣ Stream in real-time
  const frameSize = Math.floor((sampleRate / 1000) * 20); // 20ms
  for (let offset = 0; offset < samples.length; offset += frameSize) {
    const chunk = samples.slice(offset, offset + frameSize);
    const frame = new AudioFrame(chunk, sampleRate, 1, chunk.length);
    audioSource.captureFrame(frame);

    // 20ms wait to mimic real-time
    await new Promise((r) => setTimeout(r, 20));
  }

  console.log("✅ Finished streaming TTS frames");
  return localTrack;
}

// Helper: convert ReadableStream to Buffer
async function streamToBuffer(stream) {
  const reader = stream.getReader();
  const chunks = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks);
}

module.exports = { textToSpeechStream };