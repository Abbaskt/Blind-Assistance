#!/usr/bin/env python

import asyncio
import websockets
import base64

wsHost = "127.0.0.1"
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
      with open("imageReceived.png", "wb") as fh:
        fh.write(base64.b64decode(imageData))
        print("Saved Image")
    await websocket.send("Gotcha")

start_server = websockets.serve(echoReceived, port = wsPort)
asyncio.get_event_loop().run_until_complete(start_server)
print("Started Server and waiting for clients")
asyncio.get_event_loop().run_forever()
