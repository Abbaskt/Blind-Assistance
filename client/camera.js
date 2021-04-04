// conda activate blindAsst && cd D:\src\Blind-Assistance\cynosure
const host = "ws://127.0.0.1"
const port = "5678"
const fps  = 2
const timeInterval = 1000/fps 

var ws = new WebSocket(host+":"+port)
var video         = document.getElementById("videoElement");
var captureButton = document.getElementById('capture');
var pingButton    = document.getElementById('pingBtn');
var isCapturing   = false
var continousSend

ws.addEventListener('open', function (event) {
  captureButton.disabled = false;
  pingButton.disabled = false;
});

ws.addEventListener('close', function (event) {
  captureButton.disabled = true;
  pingButton.disabled = true;
  clearTimeout(continousSend);
});

function pingServer(){
  ws.send("PING");
  console.log("Sent PING to Server")
  ws.onmessage = function (event) {
    var respDiv = document.getElementById('serverResp'),
        message = document.createElement('li'),
        content = document.createTextNode(event.data);
    
    message.appendChild(content);
    respDiv.appendChild(message);
    console.log("Received " + event.data + " from Server")
  };
}

function getStillImage(){
  const canvas = document.getElementById('canvas');
  const context = canvas.getContext('2d');
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL("image/png");
}

function sendDataToServer(data){
  ws.send(data);
  console.log("Sent " + data + " to Server")
}

captureButton.addEventListener('click', () => {
    if(isCapturing){
      clearTimeout(continousSend);
      captureButton.innerText="Start"
    }
    if(!isCapturing){
      captureButton.innerText="Stop"
      continousSend = setInterval( () => { sendDataToServer(getStillImage()) }, timeInterval);
    }
    isCapturing = !isCapturing
  });

if (navigator.mediaDevices.getUserMedia) {
  navigator.mediaDevices.getUserMedia({video: { facingMode: "environment" }})
    .then(function (stream) {
      video.srcObject = stream;
    })
    .catch(function (err) {
      console.log("Something went wrong! ", err);
    });
}