
// src/worker/aiWorker.js
const { Room, RoomEvent, AudioStream } = require("@livekit/rtc-node");
const wrtc = require("wrtc");
const config = require("../config/env");
const { createToken } = require("../livekit/tokenService");
const { createRealtimeSTT, sendAudioFrame, closeSTT } = require("../ai/sttService");
const { getAIResponse } = require("../ai/gptService");
const { textToSpeechStream } = require("../ai/ttsService");
const CallState = require("../state/callState");

async function startWorker(roomName) {
    try {
        console.log("🚀 Starting AI worker for room:", roomName);

        const participantSTTMap = new Map();
        const conversationHistory = new Map();
        const activeProcessing = new Set();
        const activeAudioTracks = new Map();

        const token = await createToken(roomName, "denial-ai");
        const room = new Room({ WebRTC: wrtc });

        await room.connect(config.livekitUrl, token, { autoSubscribe: true });
        console.log(`✅ AI joined: ${roomName}`);

        const state = new CallState(roomName);

        // --- NEW: INACTIVITY & SUMMARY LOGIC ---
        let inactivityTimer = null;
        const INACTIVITY_LIMIT = 300000; // 30 Seconds

        const showFinalSummary = (reason) => {
            console.log("\n" + "=".repeat(50));
            console.log(`📊 CALL SUMMARY (${reason})`);
            console.log("=".repeat(50));
            console.table({
                "Current Stage": state.stage || "Unknown",
                "Patient Name": state.patientName || "Not Provided",
                "Claim Number": state.claimNumber || "Not Provided",
                "Denial Reason": state.denialReason || "Not Provided",
                "Member ID": state.memberId || "Not Captured",
                "Denial Code": state.denialCode || "Not Captured",
                "Reference #": state.refNumber || "Not Captured",
            });
            console.log("=".repeat(50));
        };

        const safeDisconnect = async (reason) => {
            showFinalSummary(reason);
            try {
                console.log(`🔌 Disconnecting call: ${reason}`);
                await room.disconnect();
            } catch (err) {
                console.error("❌ Disconnect Error:", err);
            }
        };

        const resetInactivityTimer = () => {
            if (inactivityTimer) clearTimeout(inactivityTimer);
            inactivityTimer = setTimeout(() => {
                safeDisconnect("Inactivity Timeout (30s Silence)");
            }, INACTIVITY_LIMIT);
        };

        resetInactivityTimer();
        room.on(RoomEvent.TrackSubscribed, async (track, publication, participant) => {
            if (publication.kind !== 1) return;

            const pSid = participant.sid;
            console.log("🎧 Subscribed audio from:", participant.identity);

            // --- PAUSE HANDLING STATE ---
            let currentUtterance = "";
            let silenceTimer = null;
            const MID_SENTENCE_DELAY = 2000; // 3s pause allowed mid-sentence
            const END_SENTENCE_DELAY = 1200; // 1.2s response if sentence ends (.?!)

            async function onTranscript(transcript, isFinal) {
                if (!transcript) return;

                // console.log(isFinal ? "📝 Final:" : "📝 Partial:", transcript);
                resetInactivityTimer();
                if (isFinal) {
                    currentUtterance += " " + transcript;
                }

                // Reset timer whenever user speaks
                if (silenceTimer) clearTimeout(silenceTimer);

                // Logic: Determine if the user finished their thought
                const textSoFar = currentUtterance.trim();
                const isComplete = /[.!?]$/.test(textSoFar);
                const delay = isComplete ? END_SENTENCE_DELAY : MID_SENTENCE_DELAY;

                silenceTimer = setTimeout(async () => {
                    if (!currentUtterance.trim() || activeProcessing.has(pSid)) return;

                    const fullSentence = currentUtterance.trim();
                    currentUtterance = ""; // Reset buffer immediately for next turn

                    try {
                        activeProcessing.add(pSid); // Lock
                        console.log("\n🧠 FULL USER TURN:", fullSentence);

                        // 1. STOP PREVIOUS AUDIO (Barge-in)
                        if (activeAudioTracks.has(pSid)) {
                            const oldPub = activeAudioTracks.get(pSid);
                            if (oldPub && oldPub.trackSid) {
                                await room.localParticipant.unpublishTrack(oldPub.trackSid);
                                console.log("🛑 Stopped previous AI speech");
                            }
                            activeAudioTracks.delete(pSid);
                        }

                        // 2. GET AI RESPONSE
                        const history = conversationHistory.get(pSid) || [];
                        const aiReply = await getAIResponse(fullSentence, state, history);
                        // --- aiWorker.js ke andar timeout wala section ---

                        if (state.stage === "Recording Reference Number") {
                            console.log("⚠️ WRAP_UP DETECTED: Ending in 10s...");
                            setTimeout(() => safeDisconnect("Normal Wrap Up"), 8);
                        }


                        if (aiReply.includes("ACTION_PRESS_")) {
                            const digitMatch = aiReply.match(/ACTION_PRESS_(\d)/);
                            if (digitMatch) {
                                const digit = digitMatch[1];
                                console.log(`🔢 IVR ACTION: Pressing ${digit} via DTMF`);

                                // Send DTMF Tone to LiveKit
                                await room.localParticipant.publishDtmf(parseInt(digit), digit);

                                // Log the action in history so AI remembers it pressed the button
                                history.push({ role: "user", content: fullSentence });
                                history.push({ role: "assistant", content: `[System: Pressed DTMF ${digit}]` });
                                conversationHistory.set(pSid, history);
                                return; // Skip TTS for button presses
                            }
                        }
                        history.push({ role: "user", content: fullSentence });
                        history.push({ role: "assistant", content: aiReply });
                        conversationHistory.set(pSid, history);

                        console.log("🤖 AI:", aiReply);

                        // 3. TTS AND PUBLISH
                        const ttsPublication = await textToSpeechStream(aiReply, room.localParticipant);

                        if (ttsPublication && ttsPublication.trackSid) {
                            activeAudioTracks.set(pSid, ttsPublication);
                        }

                    } catch (err) {
                        console.error("❌ Processing Error:", err);
                    } finally {
                        activeProcessing.add(pSid);
                        activeProcessing.delete(pSid); // Unlock
                    }
                }, delay);
            }

            const stream = new AudioStream(track);
            const dgSocket = createRealtimeSTT(onTranscript);
            participantSTTMap.set(pSid, dgSocket);

            try {
                for await (const frame of stream) {
                    if (!frame?.data) continue;
                    const pcm16 = Buffer.from(frame.data.buffer, frame.data.byteOffset, frame.data.byteLength);
                    sendAudioFrame(dgSocket, pcm16);
                }
            } catch (err) {
                console.error("❌ Audio stream error:", err);
            }
        });

        // Cleanup logic
        room.on(RoomEvent.ParticipantDisconnected, (p) => {
            const dg = participantSTTMap.get(p.sid);
            if (dg) closeSTT(dg);
            participantSTTMap.delete(p.sid);
            activeAudioTracks.delete(p.sid);
            activeProcessing.delete(p.sid);
        });

    } catch (err) {
        console.error("❌ Failed to start AI worker:", err);
    }
}

module.exports = { startWorker };