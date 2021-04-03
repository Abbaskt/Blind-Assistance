#!/usr/bin/env python

# WS server that sends messages at random intervals

import asyncio
import datetime
import random
import websockets

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

start_server = websockets.serve(pingPong, wsHost, wsPort)
asyncio.get_event_loop().run_until_complete(start_server)
print("Started Server and waiting for clients")
asyncio.get_event_loop().run_forever()
