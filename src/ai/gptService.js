const { OpenAI } = require("openai");
const config = require("../config/env");
const { manageDenialFlow, STAGES } = require("./orchestrator");

const client = new OpenAI({
    apiKey: config.grokKey,
    baseURL: "https://api.groq.com/openai/v1",
});

// async function getAIResponse(transcript, state, history = []) {
//     // 1. Update the state via Orchestrator
//     state.stage = await manageDenialFlow(transcript, state, history);

//     // 2. COMPULSORY DATA LOGIC (Watermarking each step)
//     let currentTaskInstruction = "";

//     if (!state.memberId) {
//         currentTaskInstruction = "- MISSION: Ask for the Subscriber or Member ID. We cannot proceed without identifying the patient.";
//     } 
//     else if (!state.denialCode) {
//         currentTaskInstruction = `- MISSION: Member ID found (${state.memberId}). Now, ask for the alphanumeric DENIAL CODE (e.g., CO-16 or PR-45).`;
//     } 
//     else if (!state.denialReason) {
//         currentTaskInstruction = `- MISSION: We have Code ${state.denialCode}. Now, ask the agent to explain the EXACT REASON for this denial in plain English.`;
//     } 
//     else if (!state.refNumber) {
//         currentTaskInstruction = `- MISSION: Data secured. Now you MUST get the Call Reference Number or Interaction ID to close the file.`;
//     } 
//     else {
//         currentTaskInstruction = `- MISSION: All data captured. Politely suggest resubmission and say goodbye.`;
//     }

//     // 3. System Prompt with Strict Data Validation
//     const systemPrompt = `
// You are a Professional Billing Specialist at 'City General Hospital'.
// PATIENT: ${state.patientName} | CLAIM: ${state.claimNumber}.

// DATA CAPTURE CHECKLIST (COMPULSORY):
// 1. MEMBER ID: ${state.memberId || "MISSING"}
// 2. DENIAL CODE: ${state.denialCode || "MISSING"}
// 3. DENIAL REASON: ${state.denialReason || "MISSING"}
// 4. REFERENCE #: ${state.refNumber || "MISSING"}

// CURRENT TASK:
// ${currentTaskInstruction}

// STRICT RULES:
// - If both Code and Reason are missing, ask for the Code first.
// - Acknowledge digits/letters (e.g., "Received CO-16, thank you").
// - Provide NPI (9876543210) or Tax ID (12-3456789) if asked.
// - If talking to a person, be professional and concise (under 20 words).
// - Keep responses under 15 words.
// - NO markdown, NO special characters, NO bold text.
// - If machine prompted, respond ONLY with "ACTION_PRESS_X".
// `;

//     const messages = [
//         { role: "system", content: systemPrompt },
//         ...history.slice(-6),
//         { role: "user", content: transcript }
//     ];

//     try {
//         const chatCompletion = await client.chat.completions.create({
//             messages: messages,
//             model: "llama-3.1-8b-instant",
//             temperature: 0.1, // Even lower for maximum focus on data
//             max_tokens: 80,
//         });

//         let aiReply = chatCompletion.choices[0].message.content;
//         return aiReply.replace(/[*#_]/g, "").trim();

//     } catch (error) {
//         console.error("❌ Groq API Error:", error.message);
//         return "Could you please repeat the denial code?";
//     }
// }

// src/ai/gptService.js

async function getAIResponse(transcript, state, history = []) {
    // 1. Update State & Stage via Orchestrator
    // Orchestrator ab sirf agay barhay ga, piche nahi (One-Way Valve)
    state.stage = await manageDenialFlow(transcript, state, history);

    // 2. MISSION LOCK LOGIC
    let missionGoal = "";
    let guidance = "";

    switch (state.stage) {
        case STAGES.IVR:
            missionGoal = "Navigate the IVR menu.";
            guidance = "Listen for prompts and respond ONLY with ACTION_PRESS_X.";
            break;

        case STAGES.AUTH:
            missionGoal = "Introduce yourself and provide authentication details.";
            guidance = `
                - Start by saying: "Hi, I'm calling from City General Hospital regarding a claim for patient ${state.patientName}."
                - Then provide credentials: "My NPI is 9876543210 and Tax ID is 12-3456789."
                - Explicitly ask: "Could you please verify these details so we can discuss the claim?"
                - MISSION LOCK: Stay in this stage until the agent confirms your identity.
            `;
            break;

        case STAGES.INQUIRY:
            // Yahan hum check karte hain ke kya MISSING hai
            if (!state.memberId) {
                missionGoal = "Obtain the Member ID.";
                guidance = "Politely ask for the patient's Member ID or Subscriber ID. Do NOT ask about the denial yet.";
            } else if (!state.denialCode) {
                missionGoal = "Obtain the Denial Code.";
                guidance = `Member ID ${state.memberId} is verified. Now, ask for the specific Denial Code (e.g., CO-16).`;
            } else if (!state.denialReason) {
                missionGoal = "Obtain the Denial Reason.";
                guidance = `We have code ${state.denialCode}. Now ask: 'What is the specific reason for this denial?'`;
            }
            break;

        case STAGES.RESOLUTION:
            if (!state.refNumber) {
                missionGoal = "Get the Reference Number.";
                guidance = "The inquiry is done. Now, you MUST ask for a Call Reference Number to document this interaction.";
            } else {
                missionGoal = "Wrap up the call.";
                guidance = "You have all the info. Thank the agent and say goodbye.";
            }
            break;

        case STAGES.WRAP_UP:
            missionGoal = "Call ended.";
            guidance = "Say a final thank you and wait for disconnect.";
            break;
    }

    // 3. System Prompt with Locked Mission
    const systemPrompt = `
You are a Senior Billing Specialist. 
Current Stage: ${state.stage}
Current Mission: ${missionGoal}

DATA COLLECTED SO FAR:
- Member ID: ${state.memberId || "Pending"}
- Denial Code: ${state.denialCode || "Pending"}
- Denial Reason: ${state.denialReason || "Pending"}
- Ref Number: ${state.refNumber || "Pending"}

STRICT INSTRUCTIONS:
- ${guidance}
- Do NOT move to the next topic until the current mission is complete.
- If the agent ignores your question, ask it again politely but firmly.
- Keep responses under 15 words. No markdown.
`;

    const messages = [
        { role: "system", content: systemPrompt },
        ...history.slice(-4),
        { role: "user", content: transcript }
    ];

    try {
        const res = await client.chat.completions.create({
            messages: messages,
            model: "llama-3.1-8b-instant",
            temperature: 0.1, // Minimum creativity for maximum accuracy
        });
        return res.choices[0].message.content.replace(/[*#_]/g, "").trim(); //ACTION_PRESS_4
    } catch (e) {
        return "I'm sorry, could you please repeat that information?";
    }
}

module.exports = { getAIResponse };