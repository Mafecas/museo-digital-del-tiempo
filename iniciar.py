#!/usr/bin/env python3
"""ARCHIVO DEL TIEMPO — servidor local del portafolio.

Uso:  python iniciar.py        (o doble clic en INICIAR_PORTAFOLIO.bat en Windows)

Sirve esta carpeta en http://localhost:<puerto>/ y abre el navegador.
Es necesario porque los navegadores no permiten leer los modelos 3D (GLB)
ni los módulos JavaScript cuando la página se abre directamente como archivo.
Para detener el servidor, cierra esta ventana o presiona Ctrl + C.
"""
import http.server
import os
import socket
import socketserver
import sys
import threading
import webbrowser

CARPETA = os.path.dirname(os.path.abspath(__file__))
PUERTOS = list(range(8000, 8021))


class Manejador(http.server.SimpleHTTPRequestHandler):
    # Tipos MIME explícitos: en algunos equipos Windows el registro asigna
    # text/plain a .js, lo que impide cargar los módulos del visor 3D.
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".js": "text/javascript",
        ".mjs": "text/javascript",
        ".css": "text/css",
        ".html": "text/html; charset=utf-8",
        ".glb": "model/gltf-binary",
        ".gltf": "model/gltf+json",
        ".bin": "application/octet-stream",
        ".woff2": "font/woff2",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".json": "application/json",
        ".md": "text/markdown; charset=utf-8",
    }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=CARPETA, **kwargs)

    def log_message(self, formato, *args):
        pass  # consola limpia


class Servidor(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True


def puerto_libre():
    for p in PUERTOS:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(("127.0.0.1", p)) != 0:
                return p
    return 0


def main():
    puerto = puerto_libre()
    try:
        httpd = Servidor(("127.0.0.1", puerto), Manejador)
    except OSError as e:
        print("No fue posible iniciar el servidor:", e)
        input("Presiona Enter para salir…")
        sys.exit(1)
    puerto = httpd.server_address[1]
    url = f"http://localhost:{puerto}/"
    print("=" * 58)
    print("  ARCHIVO DEL TIEMPO — Memorias reconstruidas en 3D")
    print("=" * 58)
    print(f"  Portafolio disponible en: {url}")
    print("  Para detener el servidor cierra esta ventana o pulsa Ctrl + C.")
    print("=" * 58)
    threading.Timer(0.8, lambda: webbrowser.open(url)).start()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor detenido.")
    finally:
        httpd.server_close()


if __name__ == "__main__":
    main()
