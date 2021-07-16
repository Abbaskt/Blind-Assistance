from keras.models import load_model
import cv2
import joblib
import os
from PIL import Image
import numpy as np
from numpy import asarray, expand_dims
from sklearn.preprocessing import LabelEncoder, Normalizer
from mtcnn import MTCNN
from mask_detector import mask_detector as MD

face_sample_test = []
face_names_file = "face_detector/face.names"
face_names = []

required_size = (160,160)
model = None
predict_model = None
face_detector = None
detector = None

def get_embeddings(face):
    face = face.astype('float32')
    mean, std = face.mean(), face.std()
    face = (face-mean)/std

    face_expand = expand_dims(face,axis = 0)
    embedding = model.predict(face_expand)
    return embedding[0]

def locate_face(img):
    global detector
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    faces = detector.detect_faces(img)
    faces_detected = []
    for i in faces:
        if i['confidence']*100>80:
            x,y,width,height = i['box']
            face = img[y:y+height, x:x+width]
            face = Image.fromarray(face)
            face = face.resize((160,160))
            face = asarray(face)
            faces_detected.append(face)
    return faces_detected


def detect_face(img):
    global face_names

    faces = locate_face(img)

    if(len(faces)==0):
        return "Person"

    for face in faces:

        face_array = asarray(face)
        test_embedding = get_embeddings(face_array)
        samples = expand_dims(test_embedding, axis=0)

        yhat_class = predict_model.predict(samples)
        yhat_prob = predict_model.predict_proba(samples)

        return str(face_names[yhat_class[0]])

def init_face_detector():
    global model, predict_model, face_detector, detector, face_names

    model = load_model("face_detector/Classifiers/facenet_keras.h5",compile=False)
    face_detector = cv2.CascadeClassifier('face_detector/Classifiers/haarcascade_frontalface_default.xml')
    predict_model = joblib.load("face_detector/facenet_model.pkl")
    detector = MTCNN()
    face_names = [f.strip() for f in open(face_names_file).readlines()]