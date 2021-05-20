#!/usr/bin/env python
import time
import asyncio
import websockets
import os
import sys
import base64
import numpy as np
import cv2

sys.path.append(".")
from mask_detector import mask_detector as MD

wsHost = "35.153.98.12"
wsPort = 5678

async def pingPong(websocket, path):
	keyWord   = "PING"
	returnMsg = "PONG"
	errMsg    = "INVALID keyWord"
	async for message in websocket:
		if message == keyWord:
			await websocket.send(returnMsg)
			print("Sent ", returnMsg)
		else:
			await websocket.send(errMsg)
			print(errMsg)


async def echoReceived(websocket, path):
	async for message in websocket:
		print("Received data!")
		startLoc = message.find("64,")+3
		imageData = message[startLoc:]

		if message != "PING":
			img = processImg(imageData)
			label = MD.mask_dist(img)
			# cv2.imshow('window',img)
			# cv2.waitKey(1)
			
			# with open("imageReceived.png", "wb") as fh:
			#   fh.write(base64.b64decode(imageData))
			#   print("Saved Image")
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
  
init_models()

start_server = websockets.serve(echoReceived, port=wsPort)
asyncio.get_event_loop().run_until_complete(start_server)
# initialize the known distance from the camera to the object, which
# in this case is 24 inches

print("Started Server and waiting for clients")
asyncio.get_event_loop().run_forever()
