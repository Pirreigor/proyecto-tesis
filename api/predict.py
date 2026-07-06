import cv2
import numpy as np
import base64
from ultralytics import YOLO
from pathlib import Path

CLASS_COLORS = {
    'incipiente-leve':  (34, 197, 94),    # verde
    'dentina-moderada': (234, 179, 8),    # amarillo
    'pulpar-severa':    (239, 68, 68),    # rojo
}

_model = None

def load_model(model_path: str) -> YOLO:
    global _model
    if _model is None:
        if not Path(model_path).exists():
            raise FileNotFoundError(f'Modelo no encontrado: {model_path}')
        _model = YOLO(model_path)
    return _model


def predict_image(image_bytes: bytes, model_path: str, conf_threshold: float = 0.25):
    model = load_model(model_path)

    img_array = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError('No se pudo decodificar la imagen')

    results = model.predict(img, conf=conf_threshold, verbose=False)[0]

    detections = []
    for box in results.boxes:
        class_name = model.names[int(box.cls)]
        detections.append({
            'class':      class_name,
            'confidence': round(float(box.conf), 4),
            'bbox': {
                'x1': round(float(box.xyxy[0][0])),
                'y1': round(float(box.xyxy[0][1])),
                'x2': round(float(box.xyxy[0][2])),
                'y2': round(float(box.xyxy[0][3])),
            }
        })

    annotated_img = _draw_boxes(img.copy(), detections)

    _, buffer = cv2.imencode('.jpg', annotated_img, [cv2.IMWRITE_JPEG_QUALITY, 90])
    img_base64 = base64.b64encode(buffer).decode('utf-8')

    return {
        'detections':       detections,
        'total_detections': len(detections),
        'image_base64':     img_base64,
    }


def _draw_boxes(img: np.ndarray, detections: list) -> np.ndarray:
    for det in detections:
        color = CLASS_COLORS.get(det['class'], (255, 255, 255))
        b = det['bbox']
        x1, y1, x2, y2 = b['x1'], b['y1'], b['x2'], b['y2']

        cv2.rectangle(img, (x1, y1), (x2, y2), color, 2)

        label = f"{det['class']} {det['confidence']:.0%}"
        (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 1)
        cv2.rectangle(img, (x1, y1 - th - 8), (x1 + tw + 4, y1), color, -1)
        cv2.putText(img, label, (x1 + 2, y1 - 4),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 0, 0), 1, cv2.LINE_AA)

    return img
