#!/usr/bin/env python
import time
import asyncio
import websockets
import os
import sys
import base64
import numpy as np
import cv2
import socketio

sys.path.append(".")
from mask_detector import mask_detector as MD

sio = socketio.AsyncServer(cors_allowed_origins = "*", async_handlers=True)
# app = socketio.ASGIApp(sio)

wsHost = "35.153.98.12"
wsPort = 5678

@sio.event
async def pingPong(websocket, path):
  keyWord   = "PING"
  returnMsg = "PONG"
  errMsg    = "INVALID keyWord"

  sio.emit('pingPong', {'text': returnMsg})
  # async for message in websocket:
  # 	if message == keyWord:
  # 		await websocket.send(returnMsg)
  # 		print("Sent ", returnMsg)
  # 	else:
  # 		await websocket.send(errMsg)
  # 		print(errMsg)


async def echoReceived(websocket, path):
  async for message in websocket:
    print("Received data!")
    startLoc = message.find("64,")+3
    imageData = message[startLoc:]

    if message != "PING":
      img = processImg(imageData)
      label = MD.mask_dist(img)
      await websocket.send(str(label))
    else:
      await websocket.send("PONG")

def processImg(imageData):
  jpg_original = base64.b64decode(imageData)
  jpg_as_np = np.frombuffer(jpg_original, dtype=np.uint8)
  return cv2.imdecode(jpg_as_np, flags=1)

def init_models():
  MD.init_face_detector()
  print("Initialised models")
  
# init_models()

# start_server = websockets.serve(echoReceived, port=wsPort)
# print("Started Server and waiting for clients")
asyncio.get_event_loop().run_until_complete(sio)

# print("Started Server and waiting for clients")
asyncio.get_event_loop().run_forever()
