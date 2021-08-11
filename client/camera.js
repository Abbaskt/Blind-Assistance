import * as DS from './dataStructure.js'

const host = "http://127.0.0.1"
const cynosurePort = "5678"
const rasaPort = "5005"
const disconnectColor = "#ff0000"
const connectColor = "#30db5d"
const fps = 1
const timeInterval = 1000 / fps
const respLength = 10
const latencyAvgWindow = 5

const cynosureEndpoint = host + ":" + cynosurePort
const rasaEndpoint = host + ":" + rasaPort

// TTS
let speech = new SpeechSynthesisUtterance();
let voices = window.speechSynthesis.getVoices();
speech.lang = "en";
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
var pingButton = document.getElementById('pingBtn');
var chatInput = document.getElementById('chatInput');
var chatButton = document.getElementById('chatSendBtn');

var cynosureStatusDiv = document.getElementById('cynosureStatus');
var cynosureLatency = document.getElementById('cynoLatency');
var rasaStatusDiv = document.getElementById('rasaStatus');
var rasaLatency = document.getElementById('rasaLatency');

var isCapturing = false
var continousSend

var cynosureSocket = io(cynosureEndpoint);
var rasaSocket = io(rasaEndpoint);

var rasaTimesCounter = 0;
var rasaStartTimes = [];
var rasaLatencies = [];
var cynoTimesCounter = 0;
var cynoStartTimes = [];
var cynoLatencies = [];

var prevLabelledImage;

var shouldlistencyno = false;

recognition.onresult = function (event) {
  var current = event.resultIndex;
  var transcript = event.results[current][0].transcript;
  Content = transcript;
  Textbox.val(Content);
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
  let pingMsg = "PING"
  cynoStartTimes.push(Date.now())
  cynosureSocket.emit('pingPong', pingMsg, (resp) => {
    updateCynoLatency();
    displayResponse("Cynosure", resp, cynoLatencies[cynoTimesCounter - 1])
  });
}

function sendChat() {
  let chatMsg = chatInput.value
  let chatObj =
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
  updateRasaLatency();
  let obj = undefined
  try {
    obj = Object.assign({}, ...resp)
  }
  catch (err) {
    obj = resp
  }

  displayResponse("Rasa", obj.text, rasaLatencies[rasaTimesCounter - 1])
  speaktext(obj.text)
  // Textbox.val("")
  try {
    eval(obj.perform)
  }
  catch (err) {
    console.log("Unknow function to perform", obj.perform)
  }
});

function startNavigation() {
  console.log("Starting Navigation")
  continousSend = setInterval(() => { sendDataToServer(getStillImage()) }, timeInterval);
}

function stopNavigation() {
  console.log("Stopping Navigation")
  clearTimeout(continousSend);
}

function getStillImage() {
  const canvas = document.getElementById('canvas');
  const context = canvas.getContext('2d');
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL("image/png");
}

function hasLabelChanged(newObj) {
  if (prevLabelledImage === undefined) {
    return (true)
  }
  if (newObj != undefined) {
    return (newObj.object != prevLabelledImage.object)
      || (newObj.person_name != prevLabelledImage.person_name)
      || (newObj.location != prevLabelledImage.location)
  }
  else {
    // prevLabelledImage = newObj
    return false
  }
}

function sendDataToServer(data) {
  cynoStartTimes.push(Date.now())
  if (shouldlistencyno) {
    cynosureSocket.emit('labelImage', data, (resp) => {
      console.log("Server response is ", resp)
      updateCynoLatency();
      if (resp[0]) {
        displayResponse("Cynosure", resp[0], cynoLatencies[cynoTimesCounter - 1]);
      }
      if (resp.length != 0) {
        let obj = resp[0]

        if (hasLabelChanged(obj)) {
          prevLabelledImage = obj;
          let str = ""
          if (obj.object == "person") {
            str =
              obj.person_name
              + " found with " + obj.mask
              + " " + obj.distance + " ft away"
              + " on the " + obj.location
          }
          else {
            str =
              obj.object + " found"
          }
          speaktext(str)
        }


      }

    });
  }
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

function displayResponse(serverName, displayObj, latency) {
  var responseUL = document.getElementById("serverResp")
  var item = document.createElement("li");
  var respText = serverName + " response: " + JSON.stringify(displayObj) + " | Latency = " + latency + "ms"

  item.appendChild(document.createTextNode(respText));
  // responseUL.appendChild(item)

  if (responseUL.children.length > respLength) {
    responseUL.removeChild(responseUL.children[0]);
  }
}

function updateCynoLatency() {
  cynoLatencies.push(Date.now() - cynoStartTimes[cynoTimesCounter++]);
  let avgLatency = getAvgOfN(cynoLatencies, latencyAvgWindow)
  cynosureLatency.innerHTML = avgLatency + " ms"
}

function updateRasaLatency() {
  rasaLatencies.push(Date.now() - rasaStartTimes[rasaTimesCounter++]);
  let avgLatency = getAvgOfN(rasaLatencies, latencyAvgWindow)
  rasaLatency.innerHTML = avgLatency + " ms"
}

function getAvgOfN(arr, n) {
  let avgWindow = arr.slice(-n)
  let avgLatency = (avgWindow.reduce((x, y) => x + y, 0) / avgWindow.length).toFixed(2)
  return avgLatency
}

function testPriorityQ() {
  let sampleQ = new DS.PriorityQueue();

  sampleQ.enqueue("L9a");
  sampleQ.enqueue("dog");
  sampleQ.enqueue("motorcycle");
  sampleQ.enqueue("Stopping guided navigation.");



  console.dir((sampleQ))
}

function speaktext(str) {

  if (str == "Stopping guided navigation.") {
    window.speechSynthesis.cancel()
    shouldlistencyno = false
  }

  if (str == "Starting guided navigation."){
    shouldlistencyno = true
  }

  speech.text = str

  window.speechSynthesis.speak(speech);


}

/* ----------------------------- EVENT LISTENERS ---------------------------- */

chatInput.addEventListener("keyup", function (event) {
  if (event.key === "Enter") {
    sendChat()
  }
});

pingButton.addEventListener('click', () => { pingPong() });

chatButton.addEventListener('click', () => { sendChat() });

cynosureSocket.on("connect", () => {
  console.log("cynosureSocket ID :", cynosureSocket.id);
  // captureButton.disabled = false;
  pingButton.disabled = false;
  cynosureStatusDiv.style.borderColor = connectColor;
  cynosureStatusDiv.style.color = connectColor;
  cynosureStatusDiv.style.boxShadow = "0px 0px 4px 1px " + connectColor;
});

cynosureSocket.on("disconnect", () => {
  console.log("Disconnected cynosure socket")
  cynosureSocket.connect();
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
