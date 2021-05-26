import os
# comment out below line to enable tensorflow outputs
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
import time
import tensorflow as tf
physical_devices = tf.config.experimental.list_physical_devices('GPU')
if len(physical_devices) > 0:
    tf.config.experimental.set_memory_growth(physical_devices[0], True)
import object_detector.core.utils as utils
from object_detector.core.yolov4 import filter_boxes
from object_detector.core.functions import *
from tensorflow.python.saved_model import tag_constants
from PIL import Image
import cv2
import numpy as np
from tensorflow.compat.v1 import ConfigProto
from tensorflow.compat.v1 import InteractiveSession
from face_detector import face_detector as FD
from mask_detector import mask_detector as MD


framework = 'tflite'
weights = './object_detector/checkpoints/yolov4-tiny-416.tflite'
size = 416
tiny = True
model = 'yolov4'
video = 0
output = None
output_format = 'XVID'
iou = 0.45
score = 0.50
count = False
dont_show = True
info = False
crop = False
plate = False

config=None
session = None
STRIDES = None 
ANCHORS = None
NUM_CLASS = None
XYSCALE = None
input_size = None
video_path = None
interpreter = None
input_details = None
output_details = None

def init_object_detector():

    global config, session, STRIDES, ANCHORS, NUM_CLASS, XYSCALE, input_size, video_path, interpreter, input_details, output_details 
    config = ConfigProto()
    config.gpu_options.allow_growth = True
    session = InteractiveSession(config=config)
    STRIDES, ANCHORS, NUM_CLASS, XYSCALE = utils.load_config()
    input_size = size
    video_path = video
    # get video name by using split method
    # video_name = video_path.split('/')[-1]
    # video_name = video_name.split('.')[0]
    interpreter = tf.lite.Interpreter(model_path=weights)
    interpreter.allocate_tensors()
    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()
    # print(input_details)
    FD.init_face_detector()
    MD.init_mask_detector()
    print("Init successful")


def detect_object(frame_val):

    frame = frame_val
    frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    image = Image.fromarray(frame)
    input_size = size
    retval = ""
 
    image_data = cv2.resize(frame, (input_size, input_size))
    image_data = image_data / 255.
    image_data = image_data[np.newaxis, ...].astype(np.float32)
    start_time = time.time()

    interpreter.set_tensor(input_details[0]['index'], image_data)
    interpreter.invoke()
    pred = [interpreter.get_tensor(output_details[i]['index']) for i in range(len(output_details))]
    boxes, pred_conf = filter_boxes(pred[0], pred[1], score_threshold=0.25,
                                            input_shape=tf.constant([input_size, input_size]))

    boxes, scores, classes, valid_detections = tf.image.combined_non_max_suppression(
        boxes=tf.reshape(boxes, (tf.shape(boxes)[0], -1, 1, 4)),
        scores=tf.reshape(
            pred_conf, (tf.shape(pred_conf)[0], -1, tf.shape(pred_conf)[-1])),
        max_output_size_per_class=50,
        max_total_size=50,
        iou_threshold=iou,
        score_threshold=score
    )



    # print(pred_conf)

    # format bounding boxes from normalized ymin, xmin, ymax, xmax ---> xmin, ymin, xmax, ymax
    original_h, original_w, _ = frame.shape
    bboxes = utils.format_boxes(boxes.numpy()[0], original_h, original_w)

    pred_bbox = [bboxes, scores.numpy()[0], classes.numpy()[0], valid_detections.numpy()[0]]
    # print(bboxes)

    # read in all class names from config
    class_names = utils.read_class_names(cfg.YOLO.CLASSES)

    # by default allow all classes in .names file
    allowed_classes = list(class_names.values())
    
    # custom allowed classes (uncomment line below to allow detections for only people)
    #allowed_classes = ['person']

    if count:
        # count objects found
        counted_classes = count_objects(pred_bbox, by_class = False, allowed_classes=allowed_classes)
        # loop through dict and print
        for key, value in counted_classes.items():
            print("Number of {}s: {}".format(key, value))
        image, class_name, object_coord = utils.draw_bbox(frame, pred_bbox, info, counted_classes, allowed_classes=allowed_classes)
    else:
        image, class_name, object_coord = utils.draw_bbox(frame, pred_bbox, info, allowed_classes=allowed_classes)
    
    # retval += str(class_name)
    try:
        mask_label, dist = MD.mask_dist(frame_val)
    except:
        mask_label = "no face"
    if mask_label=="no face":
        pass
    else:    
        if class_name == "person":
            face_val = FD.detect_face(frame)
            if face_val!="None":
                retval = str(face_val) + " found with " +str(mask_label) + " "+dist+" ft away"
            else:
                retval = "Unknown person" + "found with " +str(mask_label) + " "+dist+" ft away"
        else:
            if retval=="":
                retval = "No object found in frame"
            else:
                retval = str(class_name) + " found in frame"
            # retval = str(str(mask_val) + str(face_val))

    fps = 1.0 / (time.time() - start_time)
    # print("FPS: %.2f" % fps)
    result = np.asarray(image)
    result = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
    
    if not dont_show:
        cv2.namedWindow("result", cv2.WINDOW_AUTOSIZE)
        cv2.imshow("result", result)

    return retval
    
# vid = cv2.VideoCapture(0)

# init_object_detector()
# FD.init_face_detector()
# MD.init_mask_detector()

# while(True):
#     return_value, frame = vid.read()
#     if return_value:
#        object_detector(frame)
#     else:
#         print('Video has ended or failed, try a different video format!')
#         break
#     if cv2.waitKey(1) & 0xFF == ord('q'): 
#         break
# cv2.destroyAllWindows()

