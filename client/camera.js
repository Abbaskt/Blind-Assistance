// conda activate blindAsst && cd D:\src\Blind-Assistance\cynosure
const host = "http://127.0.0.1"
const port = "5678"
const fps = 1
const timeInterval = 1000 / fps

var endpoint = host + ":" + port

var video = document.getElementById("videoElement");
var captureButton = document.getElementById('capture');
var pingButton = document.getElementById('pingBtn');
var chatButton = document.getElementById('chatSendBtn');
var isCapturing = false
var continousSend

var socket = io(endpoint,{
    transports: ['websocket']
});

socket.on("connect", () => {
  console.log("SocketIO Connected!")
  console.log("ID :", socket.id);
  captureButton.disabled = false;
  pingButton.disabled = false;
  chatButton.disabled = false;
});

socket.on("disconnect", () => {
  console.log("SocketIO DisConnected!")
  captureButton.disabled = true;
  pingButton.disabled = true;
  chatButton.disabled = true;
});

function pingPong() {
  chatMsg = document.getElementById("chatInput").value
  pingMsg = "PING"

  socket.emit('pingPong', pingMsg, (resp) => {
    var item = document.getElementById("serverRespItem")
    item.innerHTML = "Bot says = " + resp
  });
}

function sendChat() {
  chatMsg = document.getElementById("chatInput").value
  chatObj =
  {
    "session_id": "session123",
    "sender": "testUser",
    "message": chatMsg
  }

  socket.emit('user_uttered', chatObj, (resp) => {
    var item = document.getElementById("serverRespItem")
    item.innerHTML = "Bot says = " + resp.text
    console.log("Bot says = ", resp.text)
  });
}

function getStillImage() {
  const canvas = document.getElementById('canvas');
  const context = canvas.getContext('2d');
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL("image/png");
}

function sendDataToServer(data) {
  console.log("Sending image to server")
  socket.emit('labelImage', data, (resp) => {
    var item = document.getElementById("serverRespItem")
    item.innerHTML = "Image label = " + resp
    console.log("Server Response = ", resp)
  });
}

captureButton.addEventListener('click', () => {
  if (isCapturing) {
    clearTimeout(continousSend);
    captureButton.innerText = "Start Capture"
  }
  if (!isCapturing) {
    captureButton.innerText = "Stop Capture"
    continousSend = setInterval(() => { sendDataToServer(getStillImage()) }, timeInterval);
  }
  isCapturing = !isCapturing
});

if (navigator.mediaDevices.getUserMedia) {
  navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
    .then(function (stream) {
      video.srcObject = stream;
    })
    .catch(function (err) {
      console.log("Something went wrong! ", err);
    });
}