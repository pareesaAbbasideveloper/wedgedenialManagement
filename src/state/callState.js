class CallState {
  constructor(roomName) {
    this.roomName = roomName;
    this.stage = "Navigating IVR";
    this.claimNumber = "123456";
    this.patientName = "John Doe";
    this.denialReason = null;
    this.stage = "Navigating IVR"
  }
}

module.exports = CallState;