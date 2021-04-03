
host = "ws://127.0.0.1"
port = "5678"
var ws = new WebSocket(host+":"+port)

ws.addEventListener('open', function (event) {
  document.getElementById('pingBtn').disabled = false; 
});

ws.addEventListener('close', function (event) {
  document.getElementById('pingBtn').disabled = true; 
});

function pingServer(){
  ws.send("PING");
  
  ws.onmessage = function (event) {
  var respDiv = document.getElementById('serverResp'),
      message = document.createElement('li'),
      content = document.createTextNode(event.data);
  
  message.appendChild(content);
  respDiv.appendChild(message);
  };
}

// var video = document.getElementById("videoElement");
// if (navigator.mediaDevices.getUserMedia) {
//   navigator.mediaDevices.getUserMedia({video: { facingMode: "environment" }})
//     .then(function (stream) {
//       video.srcObject = stream;
//     })
//     .catch(function (err) {
//       console.log("Something went wrong! ", err);
//     });
// }