const host            = "http://127.0.0.1"
const cynosurePort    = "5678"
const rasaPort        = "5005"
const disconnectColor = "#ff0000"
const connectColor    = "#30db5d"
const fps             = 1
const timeInterval    = 1000 / fps
const respLength      = 5
var top = 0;
const parent = i => ((i + 1) >>> 1) - 1;
const left = i => (i << 1) + 1;
const right = i => (i + 1) << 1;

const cynosureEndpoint = host + ":" + cynosurePort
const rasaEndpoint     = host + ":" + rasaPort

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

priorityOrder = [
  ["Stopping guided navigation.", 9]
, ["car",          5] 
, ["motorcycle",   5] 
, ["person",       4]
, ["pothole",      4]
, ["door",         4]
, ["cow",          2]
, ["dog",          2]
, ["doorhandle",   2]
, ["traffic_cone", 2]
, ["stairs",       2]
]

class PriorityQueue {
  constructor(comparator = (a, b) => a > b) {
    this._heap = [];
    this._comparator = comparePriorities;
  }
  size() {
    return this._heap.length;
  }
  isEmpty() {
    return this.size() == 0;
  }
  peek() {
    return this._heap[top];
  }
  push(...values) {
    values.forEach(value => {
      this._heap.push(value);
      this._siftUp();
    });
    return this.size();
  }
  pop() {
    const poppedValue = this.peek();
    const bottom = this.size() - 1;
    if (bottom > top) {
      this._swap(top, bottom);
    }
    this._heap.pop();
    this._siftDown();
    return poppedValue;
  }
  replace(value) {
    const replacedValue = this.peek();
    this._heap[top] = value;
    this._siftDown();
    return replacedValue;
  }
  _greater(i, j) {
    return this._comparator(this._heap[i], this._heap[j]);
  }
  _swap(i, j) {
    [this._heap[i], this._heap[j]] = [this._heap[j], this._heap[i]];
  }
  _siftUp() {
    let node = this.size() - 1;
    while (node > top && this._greater(node, parent(node))) {
      this._swap(node, parent(node));
      node = parent(node);
    }
  }
  _siftDown() {
    let node = top;
    while (
      (left(node) < this.size() && this._greater(left(node), node)) ||
      (right(node) < this.size() && this._greater(right(node), node))
    ) {
      let maxChild = (right(node) < this.size() && this._greater(right(node), left(node))) ? right(node) : left(node);
      this._swap(node, maxChild);
      node = maxChild;
    }
  }
}

var speakQueue = new PriorityQueue();

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
  pingMsg = "PING"
  cynoStartTimes.push(Date.now())
  cynosureSocket.emit('pingPong', pingMsg, (resp) => {
    cynoLatencies.push(Date.now() - cynoStartTimes[cynoTimesCounter++]);
    displayResponse("Cynosure", resp, cynoLatencies[cynoTimesCounter-1])
  });
}

function sendChat() {
  // test();
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
  // Textbox.val("")
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

function stopNavigation(){
  console.log("Stopping Navigation")
  clearTimeout(continousSend);
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
    displayResponse("Cynosure", resp, cynoLatencies[cynoTimesCounter-1]);
    console.log("Test ",resp)
    speech.text = resp;
    window.speechSynthesis.speak(speech);
    // speakQueue.push(resp.text)
  });
}

function test(){
  testq = new PriorityQueue();
  testq.push("Randomg");
  testq.push("stairs");
  testq.push("Stopping guided navigation.");
  testq.push("car");

  console.log("Testq",  testq)
  console.log("Popped value",testq.pop())
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

function comparePriorities (a, b){
  priorityA = 0;
  priorityB = 0;
  for(i = 0; i < priorityOrder.length; i++){
    if(a == priorityOrder[i][0]){
      priorityA = priorityOrder[i][1]
    }
    if(b == priorityOrder[i][0]){
      priorityB = priorityOrder[i][1]
    }
    if(priorityA != 0 && priorityB != 0){
      break;
    }
  }
  priorityA > priorityB
}

cynosureSocket.on("connect", () => {
  console.log("cynosureSocket ID :", cynosureSocket.id);
  // captureButton.disabled = false;
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
  test();
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
