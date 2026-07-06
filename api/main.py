import os
import io
import base64
from flask import Flask, request, jsonify, send_file
from predict import predict_image

app = Flask(__name__)

MODEL_PATH = os.getenv('MODEL_PATH', '../models/best_caries.pt')
ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'bmp', 'webp'}


def allowed_file(filename: str) -> bool:
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'model': MODEL_PATH})


@app.route('/predict', methods=['POST'])
def predict():
    if 'image' not in request.files:
        return jsonify({'error': 'No se proporcionó ninguna imagen (campo: image)'}), 400

    file = request.files['image']
    if not file.filename or not allowed_file(file.filename):
        return jsonify({'error': f'Formato no soportado. Usa: {ALLOWED_EXTENSIONS}'}), 400

    conf = float(request.form.get('confidence', 0.25))
    if not (0.0 < conf < 1.0):
        return jsonify({'error': 'confidence debe estar entre 0 y 1'}), 400

    image_bytes = file.read()
    result = predict_image(image_bytes, MODEL_PATH, conf_threshold=conf)

    return jsonify({
        'total_detections': result['total_detections'],
        'detections':       result['detections'],
        'image_base64':     result['image_base64'],
    })


@app.route('/predict/image', methods=['POST'])
def predict_return_image():
    """Devuelve directamente la imagen anotada (sin JSON)."""
    if 'image' not in request.files:
        return jsonify({'error': 'No se proporcionó ninguna imagen'}), 400

    file = request.files['image']
    if not file.filename or not allowed_file(file.filename):
        return jsonify({'error': 'Formato no soportado'}), 400

    conf = float(request.form.get('confidence', 0.25))
    image_bytes = file.read()
    result = predict_image(image_bytes, MODEL_PATH, conf_threshold=conf)

    img_bytes = base64.b64decode(result['image_base64'])
    return send_file(
        io.BytesIO(img_bytes),
        mimetype='image/jpeg',
        download_name='resultado.jpg'
    )


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port)
