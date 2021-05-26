from keras.models import load_model
import os
from PIL import Image
from numpy import asarray, expand_dims
from sklearn.preprocessing import LabelEncoder, Normalizer
from sklearn.svm import SVC
import joblib

model = load_model("./Classifiers/facenet_keras.h5",compile=False)
dataset_path = "./datasets"
ids = ['Anirudh','Ekansh']
face_sample = []
face_id = []
required_size = (160,160)

def get_embedding(face):
    face = face.astype('float32')
    mean, std = face.mean(), face.std()
    face = (face-mean)/std

    face_expand = expand_dims(face,axis = 0)
    embedding = model.predict(face_expand)
    return embedding[0]

for i in ids:
    path = os.path.join(dataset_path,i)
    images = os.listdir(path)
    for image in images:
        img_path = os.path.join(path,image)
        image = Image.open(img_path)
        image = image.convert('RGB')
        image = image.resize(required_size)
        face_array = asarray(image)
        face_sample.append(face_array)
        face_id.append(i)
new_face = []
for face in face_sample:
    embeddings = get_embedding(face)
    new_face.append(embeddings)
 
in_encoder = Normalizer(norm='l2')
new_face = in_encoder.transform(new_face)

out_encoder = LabelEncoder()
out_encoder.fit(face_id)
face_id = out_encoder.transform(face_id)

train_model = SVC(kernel='linear', probability=True)
train_model.fit(new_face, face_id)

joblib.dump(train_model, "facenet_model.pkl")