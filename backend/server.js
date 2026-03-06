import express from "express";
import cors from "cors";
import { AccessToken } from "livekit-server-sdk";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());

app.get("/get-token", async (req, res) => {
    const identity = req.query.identity || "human_dev";

    const at = new AccessToken(
        process.env.LIVEKIT_KEY,
        process.env.LIVEKIT_SECRET,
        { identity }
    );
    at.addGrant({
        roomJoin: true,
        room: "call-room-2",
        canPublish: true,
        canSubscribe: true,
    });
    const token = await at.toJwt();
    console.log("Generated token:", token);

    res.json({ token: token });
});

app.listen(5000, () => {
    console.log("Token server running on http://localhost:5000");
});