// conda activate blindAsst && cd D:\src\Blind-Assistance\cynosure
const host            = "http://127.0.0.1"
const cynosurePort    = "5678"
const rasaPort        = "5005"
const disconnectColor = "#ff0000"
const connectColor    = "#30db5d"
const fps             = 1
const timeInterval    = 1000 / fps

const cynosureEndpoint = host + ":" + cynosurePort
const rasaEndpoint     = host + ":" + rasaPort

// TTS
let speech = new SpeechSynthesisUtterance();
speech.lang = "en";
let voices = window.speechSynthesis.getVoices();
speech.voice = voices[1];

// STT
var SpeechRecognition = window.webkitSpeechRecognition;
var recognition = new SpeechRecognition();
var Textbox = $('#chatInput');
var Content = '';
recognition.continuous = true;
recognition.start();

var video = document.getElementById("videoElement");
var captureButton = document.getElementById('capture');
var pingButton    = document.getElementById('pingBtn');
var chatInput     = document.getElementById('chatInput');
var chatButton    = document.getElementById('chatSendBtn');

var cynosureStatusDiv = document.getElementById('cynosureStatus');
var rasaStatusDiv     = document.getElementById('rasaStatus');

var isCapturing       = false
var continousSend

var cynosureSocket = io(cynosureEndpoint);
var rasaSocket = io(rasaEndpoint);

recognition.onresult = function(event) {
  var current = event.resultIndex;
  var transcript = event.results[current][0].transcript;
  Content = transcript;
  Textbox.val(Content);
  sendChat();
};

recognition.onstart = function() { 
  instructions.text('Voice recognition is ON.');
}

recognition.onspeechend = function() {
  instructions.text('No activity.');
}

recognition.onerror = function(event) {
  if(event.error == 'no-speech') {
    instructions.text('Try again.');  
  }
}

Textbox.on('input', function() {
  Content = $(this).val();
})

function pingPong() {
  pingMsg = "PING"
  cynosureSocket.emit('pingPong', pingMsg, (resp) => {
    var item = document.getElementById("serverRespItem")
    item.innerHTML = "Response from Server: " + resp
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

  rasaSocket.emit('user_uttered', chatObj)

  rasaSocket.once("bot_uttered", (resp) =>  {
    var item = document.getElementById("serverRespItem")
    item.innerHTML = "Bot says = " + resp.text
    speech.text = resp.text;
    window.speechSynthesis.speak(speech);
    console.log("Bot says = ", resp.text)
    Textbox.val("")
    // console.log("Bot says = ", resp)
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
  cynosureSocket.emit('labelImage', data, (resp) => {
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

cynosureSocket.on("connect", () => {
  console.log("cynosureSocket ID :", cynosureSocket.id);
  captureButton.disabled = false;
  pingButton.disabled = false;
  cynosureStatusDiv.style.borderColor = connectColor;
  cynosureStatusDiv.style.color = connectColor;
  cynosureStatusDiv.style.boxShadow = "0px 0px 4px 1px " + connectColor;
});

cynosureSocket.on("disconnect", () => {
  captureButton.disabled = true;
  pingButton.disabled = true;
  cynosureStatusDiv.style.borderColor = disconnectColor;
  cynosureStatusDiv.style.color = disconnectColor;
  cynosureStatusDiv.style.boxShadow = "0px 0px 4px 1px " + disconnectColor;
});

rasaSocket.on("connect", () => {
  console.log("rasaSocket ID :", rasaSocket.id);
  chatInput.disabled = false;
  chatButton.disabled = false;
  rasaStatusDiv.style.borderColor = connectColor;
  rasaStatusDiv.style.color = connectColor;
  rasaStatusDiv.style.boxShadow = "0px 0px 4px 1px " + connectColor;
});

rasaSocket.on("disconnect", () => {
  chatInput.disabled = true;
  chatButton.disabled = true;
  rasaStatusDiv.style.borderColor = disconnectColor;
  rasaStatusDiv.style.color = disconnectColor;
  rasaStatusDiv.style.boxShadow = "0px 0px 4px 1px " + disconnectColor;
});
