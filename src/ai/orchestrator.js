// src/ai/orchestrator.js

const STAGES = {
    IVR: "Navigating IVR",
    AUTH: "Authenticating with Agent",
    INQUIRY: "Inquiring about Denial Reason",
    RESOLUTION: "Negotiating/Appealing",
    WRAP_UP: "Recording Reference Number"
};

// --- HELPER: Handles units, teens, and tens ---
function wordsToDigits(text) {
    const units = {
        'zero': 0, 'oh': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
        'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10, 'eleven': 11,
        'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
        'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19
    };
    const tens = {
        'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50,
        'sixty': 60, 'seventy': 70, 'eighty': 80, 'ninety': 90
    };

    let result = text.toLowerCase();
    Object.keys(tens).forEach(t => {
        Object.keys(units).slice(1, 10).forEach(u => {
            const pattern = new RegExp(`\\b${t}[\\s-]${u}\\b`, 'g');
            result = result.replace(pattern, (tens[t] + units[u]).toString());
        });
        result = result.replace(new RegExp(`\\b${t}\\b`, 'g'), tens[t].toString());
    });
    Object.keys(units).forEach(u => {
        result = result.replace(new RegExp(`\\b${u}\\b`, 'g'), units[u].toString());
    });
    return result;
}

async function manageDenialFlow(userInput, state, history) {
    const text = userInput.toLowerCase(); //one two eight
    const normalizedText = wordsToDigits(text); 128
    let nextStage = state.stage || STAGES.IVR; // INQUIRY

    console.log("🎯 ORCHESTRATOR DEBUG:", { text, currentStage: nextStage });

    //1. DYNAMIC DATA EXTRACTION (Always active to catch data anytime) ---

    if (nextStage === STAGES.INQUIRY) {

        // A. Member ID
        if (!state.memberId) {
            const match = normalizedText.match(/\b([a-z]?\d[\d\s]{5,12})\b/i);
            if (match) {
                state.memberId = match[0].replace(/\s+/g, '').toUpperCase();
                console.log(`✅ Captured Member ID: ${state.memberId}`);
            }
        } else if (!state.denialCode) {

            /// B.Denial Code
            const phoneticMap = {
                'charlie': 'c', 'oscar': 'o', 'papa': 'p', 'romeo': 'r',
                'alpha': 'a', 'india': 'i', 'echo': 'e', 'sierra': 's'
            };

            let cleanedText = normalizedText.toLowerCase();
            Object.keys(phoneticMap).forEach(word => {
                cleanedText = cleanedText.replace(new RegExp(`\\b${word}\\b`, 'g'), phoneticMap[word]);
            });
            const compressedText = cleanedText.replace(/\s+/g, '');
            const denialMatch = compressedText.match(/([a-z]{2}\d{1,4})/gi);
            if (denialMatch) {
                state.denialCode = denialMatch[denialMatch.length - 1].toUpperCase();
                console.log(`✅ Captured Code: ${state.denialCode}`);
            }
        }
        else if (!state.denialReason) {
            // C. Denial Reason (Strong Contextual Logic)
            const denialPhrases = ["denied due to", "denied because", "missing documentation", "not a covered benefit", "duplicate claim", "past timely filing"];
            const denialKeywords = ["missing", "denied", "not covered", "not in our file", "authorization", , "because"];
            const isDenialContext = denialPhrases.some(phrase => text.includes(phrase)) || (text.includes("denied") && denialKeywords.some(kw => text.includes(kw)));

            if (isDenialContext && !(text.includes("not denied") || text.includes("no missing"))) {
                state.denialReason = userInput;
                console.log(`✅ Captured Denial Reason: ${state.denialReason}`);
            }
        }
    }
    // D. Reference Number
    if (text.includes("reference") || text.includes("confirmation") || text.includes("number is") || text.includes("reference Id")) {
        const match = normalizedText.match(/\b\d[\d\s]{2,15}\d\b/);
        if (match) {
            state.refNumber = match[0].replace(/\s+/g, '');
            console.log(`✅ Captured Ref Number: ${state.refNumber}`);
        }
    }


    //Inquiry Section 


    //ONE-WAY STAGE TRANSITION LOGIC ---

    // A. Move to AUTH (Only if currently in IVR)
    const humanDetection = ["how are you", "representative", "speaking", "may i help","hello how can i help you"];
    if (nextStage === STAGES.IVR && humanDetection.some(kw => text.includes(kw))) {
        nextStage = STAGES.AUTH;
        console.log("➡️ Transition: IVR -> AUTH");
    }
    // B. Move to INQUIRY (Only if currently in AUTH)
    const authSuccess = ["confirmed", "verified", "authenticated", "yes", "correct", "thank you for that information"];
    if (nextStage === STAGES.AUTH && authSuccess.some(kw => text.includes(kw))) {
        nextStage = STAGES.INQUIRY;
        console.log("➡️ Transition: AUTH -> INQUIRY");
    }

    // C. Move to RESOLUTION (Only if currently in INQUIRY and we have the code/reason) 
    if (nextStage === STAGES.INQUIRY && (state.denialCode && state.denialReason && state.memberId)) {
        nextStage = STAGES.RESOLUTION;
        console.log("➡️ Transition: INQUIRY -> RESOLUTION");
    }

    // D. Move to WRAP_UP (Only if currently in RESOLUTION and call is ending)
    const goodbyeKeywords = ["have a great day", "goodbye", "take care", "anything else I can help"];
    if (nextStage === STAGES.RESOLUTION && (goodbyeKeywords.some(kw => text.includes(kw)))) {
        nextStage = STAGES.WRAP_UP;
        console.log("➡️ Transition: RESOLUTION -> WRAP_UP");
    }

    return nextStage;
}

module.exports = { manageDenialFlow, STAGES };