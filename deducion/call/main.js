const socket = io.connect(window.location.origin);

let localStream;
let remoteStream;
let peerConnection;
const config = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' }
  ]
};

// Get local media stream
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => {
    localStream = stream;
    document.getElementById('localVideo').srcObject = localStream;
  })
  .catch(error => console.error('Error accessing media devices.', error));

// Handle incoming messages from signaling server
socket.on('message', async message => {
  if (message.type === 'offer') {
    await handleOffer(message);
  } else if (message.type === 'answer') {
    await handleAnswer(message);
  } else if (message.type === 'candidate') {
    await handleCandidate(message);
  }
});

// Create an offer
async function createOffer() {
  peerConnection = new RTCPeerConnection(config);
  peerConnection.onicecandidate = handleICECandidateEvent;
  peerConnection.ontrack = handleTrackEvent;
  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.emit('message', { type: 'offer', offer: offer });
}

// Handle offer
async function handleOffer(message) {
  peerConnection = new RTCPeerConnection(config);
  peerConnection.onicecandidate = handleICECandidateEvent;
  peerConnection.ontrack = handleTrackEvent;
  await peerConnection.setRemoteDescription(new RTCSessionDescription(message.offer));
  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.emit('message', { type: 'answer', answer: answer });
}

// Handle answer
async function handleAnswer(message) {
  await peerConnection.setRemoteDescription(new RTCSessionDescription(message.answer));
}

// Handle ICE candidate
async function handleCandidate(message) {
  const candidate = new RTCIceCandidate(message.candidate);
  await peerConnection.addIceCandidate(candidate);
}

function handleICECandidateEvent(event) {
  if (event.candidate) {
    socket.emit('message', { type: 'candidate', candidate: event.candidate });
  }
}

function handleTrackEvent(event) {
  if (!remoteStream) {
    remoteStream = new MediaStream();
    document.getElementById('remoteVideo').srcObject = remoteStream;
  }
  remoteStream.addTrack(event.track);
}

// Create offer on load (or could be triggered by a button)
window.onload = createOffer;
