#!/usr/bin/env python
import sys
import base64
import numpy as np
import cv2
import socketio
from aiohttp import web

sys.path.append(".")
from object_detector import object_detector as OD

serverHost = "127.0.0.1"
serverPort = 5678

sio = socketio.AsyncServer(cors_allowed_origins = "*", async_handlers=True)

@sio.event
async def pingPong(sid, msg):
  returnMsg = "PONG"
  print("Received ", msg)
  return returnMsg

@sio.event
async def labelImage(sid, message):

  # print("sid = ", sid)

  startLoc = message.find("64,")+3
  imageData = message[startLoc:]

  img = processImg(imageData)
  label = OD.detect_object(img)

  return label

def processImg(imageData):
  jpg_original = base64.b64decode(imageData)
  jpg_as_np = np.frombuffer(jpg_original, dtype=np.uint8)
  return cv2.imdecode(jpg_as_np, flags=1)

def init_models():
  OD.init_object_detector()
  print("Initialised models")
  
init_models()

app = web.Application()
sio.attach(app)
print("Starting server")
web.run_app(app, port=serverPort)
