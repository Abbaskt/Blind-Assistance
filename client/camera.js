// conda activate blindAsst && cd D:\src\Blind-Assistance\cynosure
// require("dotenv").config()

const host            = "http://127.0.0.1"
const cynosurePort    = "5678"
const rasaPort        = "5005"
const disconnectColor = "#ff0000"
const connectColor    = "#30db5d"
const fps             = 1
const timeInterval    = 1000 / fps
const respLength      = 5

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
// recognition.lang = "kn-IN"
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

var rasaTimesCounter = 0;
var rasaStartTimes   = [];
var rasaLatencies    = [];
var cynoTimesCounter = 0;
var cynoStartTimes   = [];
var cynoLatencies    = [];

recognition.onresult = function (event) {
  var current = event.resultIndex;
  var transcript = event.results[current][0].transcript;
  Content = transcript;
  Textbox.val(Content);
  // translate(Content,{from:"kn",to:"en"}).then(text =>{
  //   Textbox.val(text);
  // })
  // Textbox.val(Content);
  sendChat();
};

recognition.onstart = function () {
  // instructions.text('Voice recognition is ON.');
}

recognition.onspeechend = function () {
  // instructions.text('No activity.');
}

recognition.onerror = function (event) {
  if (event.error == 'no-speech') {
    // instructions.text('Try again.');  
  }
}

Textbox.on('input', function () {
  Content = $(this).val();
})

function pingPong() {
  pingMsg = "PING"
  cynoStartTimes.push(Date.now())
  cynosureSocket.emit('pingPong', pingMsg, (resp) => {
    cynoLatencies.push(Date.now() - cynoStartTimes[cynoTimesCounter++]);
    displayResponse("Cynosure", resp, cynoLatencies[cynoTimesCounter-1])
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
  rasaStartTimes.push(Date.now())
  rasaSocket.emit('user_uttered', chatObj)
}

rasaSocket.on("bot_uttered", (resp) => {
  console.log("Received Response from bot ", resp)
  rasaLatencies.push(Date.now() - rasaStartTimes[rasaTimesCounter++]);
  obj = undefined
  try{
    obj = Object.assign({}, ...resp)
  }
  catch(err){
    obj = resp
  }
  
  displayResponse("Rasa", obj.text, rasaLatencies[rasaTimesCounter-1])
  speech.text = obj.text;
  window.speechSynthesis.speak(speech);
  Textbox.val("")
  try{
    eval(obj.perform)
  }
  catch(err){
    console.log("Unknow function to perform", obj.perform)
  }
});

function startNavigation(){
  console.log("Starting Navigation")
  continousSend = setInterval(() => { sendDataToServer(getStillImage()) }, timeInterval);
}

function getStillImage() {
  const canvas = document.getElementById('canvas');
  const context = canvas.getContext('2d');
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL("image/png");
}

function sendDataToServer(data) {
  console.log("Sending image to server")
  cynoStartTimes.push(Date.now())
  cynosureSocket.emit('labelImage', data, (resp) => {
    cynoLatencies.push(Date.now() - cynoStartTimes[cynoTimesCounter++]);
    displayResponse("Cynosure", resp, cynoLatencies[cynoTimesCounter-1])
  });
}

captureButton.addEventListener('click', () => {
  if (isCapturing) {
    clearTimeout(continousSend);
    captureButton.innerText = "Start Capture"
    recognition.stop();
  }
  if (!isCapturing) {
    recognition.start()
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


function displayResponse(serverName, text, latency) {
  var responseUL = document.getElementById("serverResp")
  var item       = document.createElement("li");
  var respText   = serverName +" response: " + text + " | Latency = " + latency + "ms"

  item.appendChild(document.createTextNode(respText));
  responseUL.appendChild(item)

  if (responseUL.children.length > respLength) {
    responseUL.removeChild(responseUL.children[0]);
  }
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
