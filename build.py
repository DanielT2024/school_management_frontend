import os
import shutil
import time
import threading
from jinja2 import Environment, FileSystemLoader, select_autoescape
from http.server import HTTPServer, SimpleHTTPRequestHandler
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# Configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PAGES_DIR = os.path.join(BASE_DIR, 'pages')
COMPONENTS_DIR = os.path.join(BASE_DIR, 'components')
STATIC_DIR = os.path.join(BASE_DIR, 'static')
BUILD_DIR = os.path.join(BASE_DIR, 'build')

# Initialize Jinja2 environment
env = Environment(
    loader=FileSystemLoader(BASE_DIR),
    autoescape=select_autoescape(['html', 'xml'])
)

# Add global variable for static URL (used like {{ static('path/to/file.js') }})
def static_file(path):
    return f"/static/{path}"

env.globals['static'] = static_file


# Debouncing variables
last_build_time = 0
BUILD_COOLDOWN = 5.0  # Seconds between builds
build_in_progress = False  # Prevent concurrent builds

# Copy static files
def copy_static():
    dest_static = os.path.join(BUILD_DIR, 'static')
    if os.path.exists(dest_static):
        shutil.rmtree(dest_static)
    if os.path.exists(STATIC_DIR):
        shutil.copytree(STATIC_DIR, dest_static)
        print("📦 Static files copied to build/static/")
    else:
        print("⚠️ No static directory found — skipping.")

# Build site function
def build_site(trigger_path=None):
    global last_build_time, build_in_progress
    
    if build_in_progress:
        print("⏳ Build skipped (another build in progress)")
        return
    
    current_time = time.time()
    if current_time - last_build_time < BUILD_COOLDOWN:
        print("⏳ Build skipped (within cooldown period)")
        return
    
    build_in_progress = True
    last_build_time = current_time
    print(f"\n🧱 Rebuilding site at {time.strftime('%H:%M:%S')} (triggered by: {trigger_path or 'manual'})...")

    try:
        os.makedirs(BUILD_DIR, exist_ok=True)
        copy_static()

        for root, dirs, files in os.walk(PAGES_DIR):
            for filename in files:
                if filename.endswith('.html'):
                    rel_path = os.path.relpath(root, PAGES_DIR)
                    output_folder = os.path.join(BUILD_DIR, rel_path)
                    os.makedirs(output_folder, exist_ok=True)
                    template_path = os.path.join('pages', rel_path, filename).replace('\\', '/')
                    template = env.get_template(template_path)
                    output = template.render(title=filename.replace('.html', '').capitalize())
                    output_path = os.path.join(output_folder, filename)
                    with open(output_path, 'w', encoding='utf-8') as f:
                        f.write(output)
                    if filename == "home.html" and rel_path == '.':
                        index_path = os.path.join(BUILD_DIR, "index.html")
                        with open(index_path, "w", encoding="utf-8") as f:
                            f.write(output)

        print("✅ Build complete! All pages and static assets generated.")
        print(f"📁 Files saved to: {os.path.abspath(BUILD_DIR)}")
    finally:
        build_in_progress = False

# File watcher handler
class FileChangeHandler(FileSystemEventHandler):
    def on_any_event(self, event):
        # Ignore directories and build/ directory
        if event.is_directory or event.src_path.startswith(os.path.abspath(BUILD_DIR)):
            return
        # Only handle relevant file types
        if event.src_path.endswith(('.html', '.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.woff', '.woff2', '.ttf')):
            print(f"📝 Detected change in: {event.src_path}")
            build_site(trigger_path=event.src_path)

# HTTP server thread
def run_http_server():
    os.chdir(BUILD_DIR)  # Set working directory to build/ for serving
    server_address = ('', 3000)
    httpd = HTTPServer(server_address, SimpleHTTPRequestHandler)
    print("🌐 Serving site at http://localhost:3000")
    httpd.serve_forever()

# Main
if __name__ == "__main__":
    # Initial build
    build_site(trigger_path="initial build")

    # Start HTTP server in a separate thread
    server_thread = threading.Thread(target=run_http_server, daemon=True)
    server_thread.start()

    # Set up watchdog observer
    event_handler = FileChangeHandler()
    observer = Observer()
    observer.schedule(event_handler, PAGES_DIR, recursive=True)
    observer.schedule(event_handler, COMPONENTS_DIR, recursive=True)
    observer.schedule(event_handler, STATIC_DIR, recursive=True)
    observer.schedule(event_handler, os.path.join(BASE_DIR, "base.html"), recursive=False)

    print(f"👀 Watching: {PAGES_DIR}, {COMPONENTS_DIR}, {STATIC_DIR}, base.html")
    print(f"🚫 Build output: {BUILD_DIR} (not watched)")
    observer.start()

    try:
        while True:
            time.sleep(1)  # Keep the main thread alive
    except KeyboardInterrupt:
        observer.stop()
        print("🛑 Server stopped.")
    observer.join()


print(env.globals)  # debug to check if 'static' is registered
