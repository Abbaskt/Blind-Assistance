# Assissant Chatbot for Visually Impaired 
Final year project to help visually impaired people



## Running IPCamMask.py

1. Depends on 

```
MaskDetector/face_detector/res10_300x300_ssd_iter_140000.caffemodel
```

​	for loading model

2. Works on conda env having: 
   -  tensorflow and tensorflow-gpu 2.1
   - Python 3.6.12
   - imutils 0.5.3
   - numpy 1.19.2
   - opencv-python 4.4.0.46

3. Change the line 102 in IPCamMask.py from

   ``` python
   vs = VideoStream(src="http://192.168.2.101:8080/video").start()
   ```

   to 

   ```python
   vs = VideoStream(0).start()
   ```

   for laptop webcam stream or change the IP address and port of the src URL to one that matches in your phone's IPCam server. Not using RSTP, works well enough with http stream.