const { AccessToken } = require("livekit-server-sdk");
const config = require("../config/env");

function createToken(roomName, identity) {
  console.log("abc1", config.livekitKey)
  console.log("abc2", config.livekitSecret)

  const at = new AccessToken(
    config.livekitKey,
    config.livekitSecret,
    { identity }
  );

  at.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true
  });

  return at.toJwt();
}

module.exports = { createToken };