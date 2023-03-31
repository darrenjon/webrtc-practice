let APP_ID = "YOUR AGORA APP ID"

let localStream;
let remoteStream;
let peerConnection;

let uid = String(Math.floor(Math.random() * 10000));
let token = null;
let client;

let servers = {
  iceServers: [
    {
      urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
    }
  ]

};

let init = async () => {
  // Create client
  client = await AgoraRTM.createInstance(APP_ID)
  await client.login({ uid, token })

  const channel = client.createChannel("main")
  channel.join();

  channel.on('MemberJoined', handlePeerJoined)
  client.on('MessageFromPeer', handleMessageFromPeer)

  // Get local stream
  localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: false,
  })

  // Display local stream on user-1 video element
  document.getElementById("user-1").srcObject = localStream
}

let handlePeerJoined = async (MemberId) => {
  console.log('A new peer has joined this room:', MemberId)
  createOffer(MemberId)  
}

let handleMessageFromPeer = async (message, MemberId) => {
  message = JSON.parse(message.text)
  console.log('Message from peer:', message.type)

  if (message.type === 'offer') {
    
    if (!localStream) {
      localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      })
      document.getElementById("user-1").srcObject = localStream
    }
    document.getElementById("offer-sdp").value = JSON.stringify(message.offer)
    createAnswer(MemberId)
  }

  if (message.type === 'answer') {
    document.getElementById("answer-sdp").value = JSON.stringify(message.answer)
    addAnswer()
  }

  if (message.type === 'candidate') {
    if (peerConnection) {
      peerConnection.addIceCandidate(message.candidate)
    }
  }
}

let createPeerConnection = async (sdpType, MemberId) => {
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
      document.getElementById(sdpType).value = JSON.stringify(peerConnection.localDescription)
      client.sendMessageToPeer({ text: JSON.stringify({ 'type': 'candidate', 'candidate': event.candidate }) }, MemberId)
    }
  }
}


let createOffer = async (MemberId) => {
  createPeerConnection("offer-sdp", MemberId);

  let offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  // Display offer on offer-sdp textarea
  document.getElementById("offer-sdp").value = JSON.stringify(offer)
  client.sendMessageToPeer({ text:JSON.stringify({'type': 'offer', 'offer': offer})}, MemberId)
}

let createAnswer = async (MemberId) => {
  createPeerConnection("answer-sdp", MemberId);

  let offer = document.getElementById("offer-sdp").value;
  if (!offer) return alert("Please retrieve offer from peer first");
  
  offer = JSON.parse(offer);
  await peerConnection.setRemoteDescription(offer);

  let answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);

  // Display answer on answer-sdp textarea
  document.getElementById("answer-sdp").value = JSON.stringify(answer);
  client.sendMessageToPeer({ text: JSON.stringify({ 'type': 'answer', 'answer': answer }) }, MemberId)
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