let localStream;
let remoteStream;
let peerConnection;

let servers = {
  iceServers: [
    {
      urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
    }
  ]

};

let init = async () => {
  // Get local stream
  localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
  });

  // Display local stream on user-1 video element
  document.getElementById("user-1").srcObject = localStream;
}

let createOffer = async () => {
  // Create peer connection
  peerConnection = new RTCPeerConnection( servers );
  // Create remote stream
  remoteStream = new MediaStream();
  document.getElementById("user-2").srcObject = remoteStream;

  // Listen for remote track
  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  })

  peerConnection.ontrack = async (event) => {
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track);
    });
  }

  peerConnection.onicecandidate = async (event) => {
    if (event.candidate) {
      // Display candidate on candidate textarea
      document.getElementById("offer-sdp").value = JSON.stringify(peerConnection.localDescription);
    }
  }

  let offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  // Display offer on offer-sdp textarea
  document.getElementById("offer-sdp").value = JSON.stringify(offer);
}

let createAnswer = async () => {
  // Create peer connection
  peerConnection = new RTCPeerConnection( servers );
  // Create remote stream
  remoteStream = new MediaStream();
  document.getElementById("user-2").srcObject = remoteStream;

  // Listen for remote track
  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  })

  peerConnection.ontrack = async (event) => {
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track);
    });
  }

  peerConnection.onicecandidate = async (event) => {
    if (event.candidate) {
      // Display candidate on candidate textarea
      document.getElementById("answer-sdp").value = JSON.stringify(peerConnection.localDescription);
    }
  }

  let offer = document.getElementById("offer-sdp").value;
  if (!offer) return alert("Please retrieve offer from peer first");
  
  offer = JSON.parse(offer);
  await peerConnection.setRemoteDescription(offer);

  let answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);

  // Display answer on answer-sdp textarea
  document.getElementById("answer-sdp").value = JSON.stringify(answer);
}

let addAnswer = async () => {
  let answer = document.getElementById("answer-sdp").value;
  if (!answer) return alert("Please retrieve answer from peer first");

  answer = JSON.parse(answer);
  if (!peerConnection.currentRemoteDescription) {
    await peerConnection.setRemoteDescription(answer);
  }
}

init();

// Create offer button
document.getElementById("create-offer").addEventListener("click", createOffer);
document.getElementById("create-answer").addEventListener("click", createAnswer);
document.getElementById("add-answer").addEventListener("click", addAnswer);