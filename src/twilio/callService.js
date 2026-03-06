const { SipClient } = require("livekit-server-sdk");
const config = require("../config/env");

// Initialize LiveKit SIP Client
const sipClient = new SipClient(config.livekitUrl, config.livekitKey, config.livekitSecret);

// src/twilio/callService.js

async function callInsurance(insuranceNumber, roomName) {
  try {
    const trunkId = "ST_AWGRh3YeKrtQ";

    // ERROR FIX: Yahan poora SIP URI nahi, sirf NUMBER chahiye
    // Example: "+1234567890"
    const phoneNumber = insuranceNumber;
    console.log(phoneNumber)
    console.log(`📞 Calling ${phoneNumber} via Trunk ${trunkId}...`);

    const participant = await sipClient.createSipParticipant(
      trunkId,        // 1. Trunk ID
      phoneNumber,    // 2. ONLY the phone number (No 'sip:' prefix)
      roomName,       // 3. Room Name
      {
        participantIdentity: `agent_${Date.now()}`,
        participantName: "Insurance AI Agent",
        participantPermissions: {
          canPublish: true,      // Aapke phone ko mic publish karne ki ijazat
          canSubscribe: true,    // Aapke phone ko AI ki awaaz sunne ki ijazat
          canPublishData: true
        }
      }
    );
    //when the call is picked by the representative of the insurance company.
    console.log("✅ LiveKit is now dialing the PSTN number:", participant.sipCallId);
    return participant.sipCallId;
  } catch (error) {
    console.error("❌ SIP Bridge Error:", error.message);
  }
}

module.exports = { callInsurance };