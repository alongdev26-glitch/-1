#!/bin/bash
# Builds the artifact bundle into $1: game.js, index.html fragment, models/*.b64.txt (the host serves text, not .glb)
set -e
P=$1; rm -rf "$P"; mkdir -p "$P/models"
cd "$(dirname "$0")/.."
npx esbuild src/main.js --bundle --format=iife --minify --outfile="$P/game.js" --log-level=warning
python3 - "$P" <<'PY'
import base64, re, sys, glob, os
P = sys.argv[1]
for f in glob.glob('public/models/*.glb'):
    open(f'{P}/models/{os.path.basename(f)[:-4]}.b64.txt', 'w').write(base64.b64encode(open(f, 'rb').read()).decode())
h = open('index.html').read()
head = re.search(r'<head>(.*?)</head>', h, re.S).group(1).replace('<meta charset="utf-8">', '').replace('<title>Arena 3D</title>', '')
body = re.search(r'<body>(.*?)<script type="module"', h, re.S).group(1)
open(f'{P}/index.html', 'w').write(f"<title>Arena 3D</title>\n{head}\n{body}\n<script src=\"game.js\"></script>\n")
PY
