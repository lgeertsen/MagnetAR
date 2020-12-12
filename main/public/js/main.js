const peerConnections = {};
const config = {
  iceServers: [
    {
      "urls": "stun:stun.l.google.com:19302",
    },
    // {
    //   "urls": "turn:TURN_IP?transport=tcp",
    //   "username": "TURN_USERNAME",
    //   "credential": "TURN_CREDENTIALS"
    // }
  ]
};

const socket = io.connect(window.location.origin);
const ipaddress = document.getElementById('ipaddress');
const softType = document.getElementById('software-type');
const softScene = document.getElementById('software-scene');
const phoneText = document.getElementById('phone-text');
const streamBtn = document.getElementById('start-stream');
const camerasDiv = document.getElementById('cameras');
const videoElement = document.querySelector("video");

var phoneConnected = false;
var softwareConnected = false;

streamBtn.addEventListener('click', function() {
  getStream()
})

socket.emit("broadcaster");
socket.emit('getIpaddress')

socket.on('ipaddress', ip => {
  ipaddress.innerHTML = ip
})

socket.on('software', data => {
  console.log('----- software -----');
  softType.innerHTML = data.soft;
  softType.className = "";
  softScene.innerHTML = data.scene;
})

socket.on('phone', () => {
  phoneText.innerHTML = 'Connected';
  phoneText.className = '';
})

socket.on("answer", (id, description) => {
  peerConnections[id].setRemoteDescription(description);
});

socket.on("watcher", id => {
  const peerConnection = new RTCPeerConnection(config);
  peerConnections[id] = peerConnection;

  let stream = videoElement.srcObject;
  stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

  peerConnection.onicecandidate = event => {
    if (event.candidate) {
      socket.emit("candidate", id, event.candidate);
    }
  };

  peerConnection
    .createOffer()
    .then(sdp => peerConnection.setLocalDescription(sdp))
    .then(() => {
      socket.emit("offer", id, peerConnection.localDescription);
    });
});

socket.on("candidate", (id, candidate) => {
  peerConnections[id].addIceCandidate(new RTCIceCandidate(candidate));
});

socket.on("disconnectPeer", id => {
  peerConnections[id].close();
  delete peerConnections[id];
});

window.onunload = window.onbeforeunload = () => {
  socket.close();
};

function getStream() {
  if (window.stream) {
    window.stream.getTracks().forEach(track => {
      track.stop();
    });
  }
  // const audioSource = audioSelect.value;
  // const videoSource = videoSelect.value;
  // const constraints = {
  //   audio: { deviceId: audioSource ? { exact: audioSource } : undefined },
  //   video: { deviceId: videoSource ? { exact: videoSource } : undefined }
  // };
  const constraints = {
    video: {

    }
  }
  // return navigator.mediaDevices
  //   .getUserMedia(constraints)
  //   .then(gotStream)
  //   .catch(handleError);

  navigator.mediaDevices.getDisplayMedia({video: true})
    .then(gotStream, handleError);
}

function gotStream(stream) {
  window.stream = stream;
  // audioSelect.selectedIndex = [...audioSelect.options].findIndex(
  //   option => option.text === stream.getAudioTracks()[0].label
  // );
  // videoSelect.selectedIndex = [...videoSelect.options].findIndex(
  //   option => option.text === stream.getVideoTracks()[0].label
  // );
  videoElement.srcObject = stream;
}

function handleError(error) {
  console.error("Error: ", error);
}
