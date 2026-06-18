import os
import qrcode
from PIL import Image, ImageDraw, ImageFont
import textwrap

# Ensure the qr output directory exists
QR_DIR = os.path.join(os.path.dirname(__file__), "static", "qr")
os.makedirs(QR_DIR, exist_ok=True)

def generar_qr(referencia_id: str, nombre: str, codigo: str) -> str:
    """
    Genera una imagen PNG de 300x360 con el QR de la referencia.
    El QR codifica la URL de la PWA para escanear.
    Retorna el path relativo de la imagen.
    """
    base_url = os.getenv("BASE_URL", "http://localhost:8000")
    # Limpiamos si hay un slash al final
    if base_url.endswith("/"):
        base_url = base_url[:-1]
        
    url = f"{base_url}/pwa/scan.html?ref={referencia_id}"
    
    # Crear el QR
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)
    img_qr = qr.make_image(fill_color="black", back_color="white").convert('RGB')
    
    # Resize QR to exactly 300x300
    img_qr = img_qr.resize((300, 300))
    
    # Crear imagen base 300x360 blanca
    img_base = Image.new('RGB', (300, 360), 'white')
    img_base.paste(img_qr, (0, 0))
    
    draw = ImageDraw.Draw(img_base)
    
    # Intentar cargar fuente, usar default si falla
    try:
        # Intenta cargar una fuente truetype común (ej. arial en Windows, dejavu en Linux)
        font_main = ImageFont.truetype("arial.ttf", 11)
        font_small = ImageFont.truetype("arial.ttf", 9)
    except IOError:
        font_main = ImageFont.load_default()
        font_small = ImageFont.load_default()

    # Añadir el nombre (wrap si es muy largo)
    # 60 px disponibles abajo (300 a 360)
    text_y = 305
    wrapped_name = textwrap.fill(nombre, width=40)
    
    # Dibujar línea por línea para nombre
    for line in wrapped_name.split('\n'):
        # Centrar texto aproximado
        # Pillow fallback font tiene width fijo de ~6px por char
        try:
            bbox = font_main.getbbox(line)
            w = bbox[2] - bbox[0]
        except AttributeError:
            # Fallback for older PIL
            w = font_main.getsize(line)[0] if hasattr(font_main, 'getsize') else len(line)*6
            
        x = (300 - w) / 2
        draw.text((x, text_y), line, fill="black", font=font_main)
        text_y += 14
        
    # Añadir código en esquina inferior derecha
    try:
        bbox = font_small.getbbox(codigo)
        w_cod = bbox[2] - bbox[0]
    except AttributeError:
        w_cod = font_small.getsize(codigo)[0] if hasattr(font_small, 'getsize') else len(codigo)*5
        
    draw.text((300 - w_cod - 10, 340), codigo, fill="gray", font=font_small)
    
    filename = f"{referencia_id}.png"
    filepath = os.path.join(QR_DIR, filename)
    img_base.save(filepath)
    
    return f"/static/qr/{filename}"
