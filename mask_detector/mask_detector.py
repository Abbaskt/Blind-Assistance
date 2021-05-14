from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from tensorflow.keras.preprocessing.image import img_to_array
from tensorflow.keras.models import load_model
from imutils.video import VideoStream
from imageio import imread
import imutils
import numpy as np
import cv2

KNOWN_DISTANCE = 24.0
# initialize the known object width, which in this case, the piece of
# paper is 12 inches wide
KNOWN_WIDTH = 6.0
focalLength = -999
color =(255,0,0)

faceNet = None
maskNet = None

def detect_and_predict_mask(frame, faceNet, maskNet):
  # grab the dimensions of the frame and then construct a blob
  # from it
  (h, w) = frame.shape[:2]
  blob = cv2.dnn.blobFromImage(frame, 1.0, (300, 300),
    (104.0, 177.0, 123.0))

  # pass the blob through the network and obtain the face detections
  faceNet.setInput(blob)
  detections = faceNet.forward()

  # initialize our list of faces, their corresponding locations,
  # and the list of predictions from our face mask network
  faces = []
  locs = []
  preds = []

  # loop over the detections
  for i in range(0, detections.shape[2]):
    # extract the confidence (i.e., probability) associated with
    # the detection
    confidence = detections[0, 0, i, 2]

    # filter out weak detections by ensuring the confidence is
    # greater than the minimum confidence
    if confidence > 0.5:
      # compute the (x, y)-coordinates of the bounding box for
      # the object
      box = detections[0, 0, i, 3:7] * np.array([w, h, w, h])
      (startX, startY, endX, endY) = box.astype("int")

      # ensure the bounding boxes fall within the dimensions of
      # the frame
      (startX, startY) = (max(0, startX), max(0, startY))
      (endX, endY) = (min(w - 1, endX), min(h - 1, endY))

      # extract the face ROI, convert it from BGR to RGB channel
      # ordering, resize it to 224x224, and preprocess it
      face = frame[startY:endY, startX:endX]
      face = cv2.cvtColor(face, cv2.COLOR_BGR2RGB)
      face = cv2.resize(face, (224, 224))
      face = img_to_array(face)
      face = preprocess_input(face)

      # add the face and bounding boxes to their respective
      # lists
      faces.append(face)
      locs.append((startX, startY, endX, endY))

  # only make a predictions if at least one face was detected
  if len(faces) > 0:
    # for faster inference we'll make batch predictions on *all*
    # faces at the same time rather than one-by-one predictions
    # in the above `for` loop
    faces = np.array(faces, dtype="float32")
    preds = maskNet.predict(faces, batch_size=1)
    return (locs, preds)
  else:
    return (-999,-999)

def distance_to_camera(knownWidth, focalLength, perWidth):
  # compute and return the distance from the maker to the camera
  return (knownWidth * focalLength) / perWidth

def mask_dist(img):
  global focalLength, KNOWN_DISTANCE, KNOWN_WIDTH, color, faceNet, maskNet
  
  print("faceNet in mask_dist is", faceNet)
  frame = imutils.resize(img, width=400)
  (locs, preds) = detect_and_predict_mask(frame, faceNet, maskNet)
  if (locs, preds) == (-999,-999):
    pass
  else:
  # loop over the detected face locations and their corresponding
  # locations
    for (box, pred) in zip(locs, preds):
      (startX, startY, endX, endY) = box
      (mask, withoutMask) = pred
      perWidth = endX  - startX
      if focalLength == -999:
        focalLength = (perWidth * KNOWN_DISTANCE) / KNOWN_WIDTH
      cv2.rectangle(frame, (startX, startY), (endX, endY), color, 2)
      inches = distance_to_camera(KNOWN_WIDTH, focalLength, perWidth)
      cv2.putText(frame, "%.2fft" % (inches / 12),
      (frame.shape[1] - 200, frame.shape[0] - 20), cv2.FONT_HERSHEY_SIMPLEX,
      2.0, (0, 255, 0), 3)
      # determine the class label and color we'll use to draw
      # the bounding box and text
      label = "Mask" if mask > withoutMask else "No Mask"
      print(label)
      color = (0, 255, 0) if label == "Mask" else (0, 0, 255)

      # include the probability in the label
      label = "{}: {:.2f}%".format(label, max(mask, withoutMask) * 100)
      retval = label +", " + str(inches/12) + "ft"
      # cv2.putText(frame, label, (startX, startY - 10),
      # 	cv2.FONT_HERSHEY_SIMPLEX, 0.45, color, 2)
      # cv2.rectangle(frame, (startX, startY), (endX, endY), color, 2)
      # cv2.imshow('window',img)
      # cv2.waitKey(1)
      return retval

def init_face_detector():
  global faceNet, maskNet

  print("faceNet in init_face_detector is", faceNet)

  # load our serialized face detector model from disk
  print("[INFO] loading face detector model...")
  prototxtPath = "face_detector/deploy.prototxt"
  weightsPath = "face_detector/res10_300x300_ssd_iter_140000.caffemodel"
  faceNet = cv2.dnn.readNet(prototxtPath, weightsPath)

  # load the face mask detector model from disk
  print("[INFO] loading face mask detector model...")
  maskNet = load_model("face_detector/mask_detector.model")

  print("faceNet in init_face_detector is", faceNet)

def test():
  global faceNet, maskNet
  print("faceNet in test is", faceNet)