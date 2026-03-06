import asyncio
import os
import logging
from dotenv import load_dotenv
from livekit_server_sdk import LiveKitAPI, CreateSIPParticipantRequest, CreateRoomRequest

load_dotenv()

logger = logging.getLogger("make-call")
logger.setLevel(logging.INFO)

# LiveKit config from environment
LIVEKIT_URL= "wss://denialmanagementcalller-aqd6zwym.livekit.cloud"
LIVEKIT_KEY="APIPXu9yUxjZRRu"
LIVEKIT_SECRET="f8Q7S2XLd7wtApJtTXnnmcl2kQ7f2ymNoPIEEWJ0xM4"

room_name = "call-room-1"
outbound_trunk_id =  "ST_DmQqcPLFFJDJ"
phone_number = "+923193023322"  # insurance agent
phone_participant_identity = "phone_user"

# Initialize LiveKit client
lkapi = LiveKitAPI(LIVEKIT_URL, LIVEKIT_KEY, LIVEKIT_SECRET)

async def make_call():
    try:
        # 1️⃣ Create room if it doesn't exist
        try:
            room = lkapi.create_room(CreateRoomRequest(name=room_name))
            logger.info(f"✅ Room created: {room_name}")
        except Exception as e:
            logger.info(f"ℹ️ Room might already exist: {e}")

        if not outbound_trunk_id or not outbound_trunk_id.startswith("ST_"):
            logger.error("SIP_OUTBOUND_TRUNK_ID is not set or invalid")
            return

        # 2️⃣ Create SIP participant
        sip_participant = lkapi.create_sip_participant(
            CreateSIPParticipantRequest(
                room_name=room_name,
                sip_trunk_id=outbound_trunk_id,
                sip_call_to=phone_number,
                participant_identity=phone_participant_identity
            )
        )
        logger.info(f"✅ SIP participant created: {sip_participant.sid}")

    except Exception as e:
        logger.error(f"❌ Error making call: {e}")

async def main():
    await make_call()

if __name__ == "__main__":
    asyncio.run(main())