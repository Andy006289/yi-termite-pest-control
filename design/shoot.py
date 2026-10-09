#!/usr/bin/env python3
"""Full-page screenshots of every page × breakpoint × skin using headless Chrome.
Usage:  python3 shoot.py              -> screenshots/mockups/…, screenshots/wireframes/…
        python3 shoot.py --annotate   -> also screenshots/*_annotated/…
        python3 shoot.py home booking -> only those pages
Output: screenshots/<folder>/<page>__<breakpoint>.png  (2× device pixel ratio)
"""
import os, sys, subprocess, http.server, threading, socketserver, functools, re, urllib.parse
ROOT = os.path.dirname(os.path.abspath(__file__))
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PORT = 8767
BREAKPOINTS = [("mobile", 390), ("tablet", 768), ("desktop", 1440)]
ALL_PAGES = ["home", "identify", "estimate", "estimate-result", "booking", "booking-confirmed", "my-services"]
SKINS = [("hifi", "mockups"), ("wire", "wireframes")]
args = [a for a in sys.argv[1:] if not a.startswith("--")]
PAGES = args or ALL_PAGES
ANNOTATE = "--annotate" in sys.argv

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
socketserver.TCPServer.allow_reuse_address = True
httpd = socketserver.TCPServer(("127.0.0.1", PORT), functools.partial(Quiet, directory=ROOT))
threading.Thread(target=httpd.serve_forever, daemon=True).start()

BASE = ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run", "--virtual-time-budget=5000"]

def shoot(page_url, width, out):
    host = f"http://127.0.0.1:{PORT}/frame.html?w={width}&src={urllib.parse.quote(page_url, safe='')}"
    win_w = max(width, 500)
    dom = subprocess.run([CHROME, *BASE, f"--window-size={win_w},900", "--dump-dom", host], capture_output=True, text=True).stdout
    m = re.search(r'data-h="(\d+)"', dom)
    h = int(m.group(1)) if m else 3000
    subprocess.run([CHROME, *BASE, "--force-device-scale-factor=2", f"--window-size={win_w},{h}", f"--screenshot={out}", host], capture_output=True)
    if win_w != width:  # crop the iframe region (2× scale)
        subprocess.run(["sips", "-c", str(h * 2), str(width * 2), out], capture_output=True)
    print(f"  {os.path.relpath(out, ROOT)}  {width}×{h}")

variants = [("", "")] + ([("&annotate=1&legend=top", "_annotated")] if ANNOTATE else [])
for skin, folder in SKINS:
    for page in PAGES:
        for bp, w in BREAKPOINTS:
            for extra, suffix in variants:
                d = os.path.join(ROOT, "screenshots", folder + suffix); os.makedirs(d, exist_ok=True)
                shoot(f"http://127.0.0.1:{PORT}/{folder}/{page}.html?clean=1{extra}", w, os.path.join(d, f"{page}__{bp}.png"))
if not args:
    d = os.path.join(ROOT, "screenshots"); os.makedirs(d, exist_ok=True)
    for bp, w in BREAKPOINTS:
        shoot(f"http://127.0.0.1:{PORT}/style-guide.html?clean=1", w, os.path.join(d, f"style-guide__{bp}.png"))
httpd.shutdown()
print("done")
