// conda activate blindAsst && cd D:\src\Blind-Assistance\cynosure
const host = "http://127.0.0.1"
const port = "5005"
const fps = 3
const timeInterval = 1000 / fps

var endpoint = host + ":" + port

// var ws = new WebSocket(endpoint)
var video = document.getElementById("videoElement");
var captureButton = document.getElementById('capture');
var pingButton = document.getElementById('pingBtn');
var chatButton = document.getElementById('chatSendBtn');
var isCapturing = false
var continousSend

var socket = io(endpoint,{
    transports: ['websocket']
});

console.log("Socket value = ", socket)
console.log("Endpoint value = ", endpoint)

socket.on("connect", () => {
  console.log("SocketIO Connected!")
  console.log("UserID :", socket.id); // x8WIv7-mJelg7on_ALbx
  captureButton.disabled = false;
  pingButton.disabled = false;
  chatButton.disabled = false;
});

socket.on("disconnect", () => {
  console.log("SocketIO DisConnected!")
  captureButton.disabled = false;
  pingButton.disabled = true;
  chatButton.disabled = true;
});

// ws.addEventListener('open', function (event) {
//   captureButton.disabled = false;
//   pingButton.disabled = false;
//   chatButton.disabled = false;
// });

// ws.addEventListener('close', function (event) {
//   captureButton.disabled = true;
//   pingButton.disabled = true;
//   chatButton.disabled = false;
//   clearTimeout(continousSend);
// });

function pingServer() {
  ws.send("PING");
  console.log("Sent PING to Server")
  ws.onmessage = function (event) {
    // var respDiv = document.getElementById('serverResp'),
    //     message = document.createElement('li'),
    //     content = document.createTextNode(event.data);

    // message.appendChild(content);
    // respDiv.appendChild(message);
    var item = document.getElementById("serverRespItem")
    item.innerHTML = event.data
    console.log("Received " + event.data + " from Server")
  };
}

function sendChat() {
  chatMsg = document.getElementById("chatInput").value
  // ws.send(chatMsg);

  chatObj =
  {
    "session_id": "session123",
    "sender": "testUser",
    "message": chatMsg
  }

  socket.emit('user_uttered', chatObj);
  console.log("Sent ", chatObj, " to Server")

  socket.on("bot_uttered", (botResp) => {
    var item = document.getElementById("serverRespItem")
    item.innerHTML = "Bot says = " + botResp.text
    console.log("Bot says = ", botResp.text)

  });

}

function getStillImage() {
  const canvas = document.getElementById('canvas');
  const context = canvas.getContext('2d');
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL("image/png");
}

function sendDataToServer(data) {
  ws.send(data);
  console.log("Sent " + data + " to Server")
}

captureButton.addEventListener('click', () => {
  if (isCapturing) {
    clearTimeout(continousSend);
    captureButton.innerText = "Start"
  }
  if (!isCapturing) {
    captureButton.innerText = "Stop"
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