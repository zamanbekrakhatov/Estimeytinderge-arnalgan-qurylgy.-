#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
═══════════════════════════════════════════════════════════
ЕСТУ КӨМЕКШІСІ - HTTP СЕРВЕР
═══════════════════════════════════════════════════════════
Қарапайым HTTP сервер локалды тестілеу үшін.

НАЗАР: Микрофон үшін HTTPS керек! 
GitHub Pages немесе ngrok пайдаланыңыз.
═══════════════════════════════════════════════════════════
"""

import http.server
import socketserver
import os
import sys
from datetime import datetime

# Конфигурация
PORT = 8000
HOST = 'localhost'

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    """Кастомизацияланған HTTP Handler"""
    
    def end_headers(self):
        """CORS және кэш заголовкаларын қосу"""
        # CORS қосу
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        
        # Кэшті өшіру (дамыту үшін)
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        self.send_header('Expires', '0')
        
        super().end_headers()
    
    def log_message(self, format, *args):
        """Логтарды көрсету"""
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        print(f"[{timestamp}] {self.address_string()} - {format % args}")
    
    def do_GET(self):
        """GET сұраулары"""
        # Автоматты index.html ашу
        if self.path == '/':
            self.path = '/index.html'
        
        return super().do_GET()


def print_banner():
    """Сервер баннерін шығару"""
    banner = """
    ═══════════════════════════════════════════════════════════
    🎤  ЕСТУ КӨМЕКШІСІ - ЛОКАЛДЫ СЕРВЕР
    ═══════════════════════════════════════════════════════════
    """
    print(banner)


def check_files():
    """Қажетті файлдардың бар екенін тексеру"""
    required_files = ['index.html', 'style.css', 'script.js']
    missing_files = []
    
    for file in required_files:
        if not os.path.exists(file):
            missing_files.append(file)
    
    if missing_files:
        print(f"\n⚠️  НАЗАР: Келесі файлдар табылмады:")
        for file in missing_files:
            print(f"   - {file}")
        print(f"\nФайлдарды осы директорияға көшіріңіз: {os.getcwd()}")
        return False
    
    return True


def main():
    """Негізгі функция"""
    try:
        # Баннер
        print_banner()
        
        # Қазіргі директория
        current_dir = os.path.dirname(os.path.abspath(__file__))
        os.chdir(current_dir)
        print(f"📁 Директория: {current_dir}\n")
        
        # Файлдарды тексеру
        if not check_files():
            print("\n❌ Сервер іске қосылмады - файлдар жоқ")
            sys.exit(1)
        
        print("✅ Барлық файлдар табылды\n")
        
        # Сервер жасау
        with socketserver.TCPServer((HOST, PORT), CustomHandler) as httpd:
            print(f"🚀 Сервер іске қосылды!")
            print(f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
            print(f"📱 Браузерде ашыңыз:")
            print(f"   http://{HOST}:{PORT}")
            print(f"   http://127.0.0.1:{PORT}")
            print(f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
            print(f"\n⚠️  МАҢЫЗДЫ АҚПАРАТ:")
            print(f"   • Микрофон үшін HTTPS қосылым керек")
            print(f"   • Локалды тестілеу шектеулі")
            print(f"   • Толық тестілеу үшін GitHub Pages пайдаланыңыз")
            print(f"\n💡 GitHub Pages орнату:")
            print(f"   1. Файлдарды GitHub-қа жүктеңіз")
            print(f"   2. Settings → Pages → main branch")
            print(f"   3. https://username.github.io/repo-name/")
            print(f"\n🛑 Тоқтату үшін: Ctrl+C немесе Cmd+C\n")
            print(f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
            
            # Логтар
            print("📊 СЕРВЕРЛІК ЛОГТАР:\n")
            
            # Сервер іске қосу
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n\n" + "="*60)
        print("🛑 Сервер тоқтатылды")
        print("="*60)
        print("👋 Рақмет! Кездескенше!")
        sys.exit(0)
        
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"\n❌ ҚАТЕ: {PORT} порт бос емес!")
            print(f"💡 Шешім: Басқа портты пайдаланыңыз:")
            print(f"   python3 server.py 8080")
        else:
            print(f"\n❌ ҚАТЕ: {e}")
        sys.exit(1)
        
    except Exception as e:
        print(f"\n❌ КҮТПЕГЕН ҚАТЕ: {e}")
        sys.exit(1)


def start_server_with_custom_port(port):
    """Басқа портта серверді іске қосу"""
    global PORT
    PORT = int(port)
    main()


if __name__ == "__main__":
    # Порт аргументін тексеру
    if len(sys.argv) > 1:
        try:
            custom_port = int(sys.argv[1])
            if 1024 <= custom_port <= 65535:
                start_server_with_custom_port(custom_port)
            else:
                print("❌ Порт 1024-65535 аралығында болуы керек")
                sys.exit(1)
        except ValueError:
            print("❌ Дұрыс емес порт нөмірі")
            print("Мысалы: python3 server.py 8080")
            sys.exit(1)
    else:
        main()
