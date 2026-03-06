require("dotenv").config();
const { startWorker } = require("./worker/aiWorker");

async function main() {
  const insuranceNumber = "+923193023322";
  const roomName = "call-room-2";
  await startWorker(roomName);
  // await callInsurance(insuranceNumber, roomName);
}

main();