#!/usr/bin/env python3
"""
One-shot nginx patch for nexerp.id — production nexerp 443 server block.

Two surgical changes:
  (A) Existing /api/ block: rewrite strips /api/ + prepends /v1/.
  (B) NEW: exact-match /auth/login and prefix-match /marketing/prototype/ blocks
      that prepend /v1/. Inserted BEFORE the catch-all `location /` so the
      prefix-match wins. Frontend doesn't touch these paths.

Safe because:
  - /auth/login is not a frontend route
  - /marketing/prototype/* is not a frontend route
    (frontend marketing pages are /marketing/dashboard, /marketing/intake, etc.)
"""
import re, shutil, sys, os

FP = "/home/dreamlab/nexerp/nginx.conf"
BACKUP = FP + ".bak-fixA"

# Backup
if not os.path.exists(BACKUP):
    shutil.copy2(FP, BACKUP)
    print(f"backup -> {BACKUP}")

with open(FP) as f:
    s = f.read()

# --- (A) Existing /api/ block: re-point rewrite to prepend /v1/ ---
old_api = (
    "        location /api/ {\n"
    "            rewrite ^/api/(.*) /$1 break;\n"
    "            proxy_pass $backend_upstream;"
)
new_api = (
    "        location /api/ {\n"
    "            rewrite ^/api/(.*) /v1/$1 break;\n"
    "            proxy_pass $backend_upstream;"
)
if old_api not in s:
    print("FATAL: /api/ block not found in current nginx.conf"); sys.exit(1)
if new_api in s:
    print("WARN: /api/ block already patched — skipping (A)")
else:
    s = s.replace(old_api, new_api)
    print("(A) /api/ rewrite updated to prepend /v1/")

# --- (B) Insert /auth/login and /marketing/prototype/ blocks BEFORE catch-all ---
new_blocks = (
    "        # Backend API rewrites — frontend never uses /auth/login or\n"
    "        # /marketing/prototype/* paths, so we safely prepend /v1/ to\n"
    "        # forward to production-light-backend (image mounted at /v1/).\n"
    "        location = /auth/login {\n"
    "            rewrite ^/(.*)$ /v1/$1 break;\n"
    "            proxy_pass $backend_upstream;\n"
    "            proxy_http_version 1.1;\n"
    "            proxy_set_header Host $host;\n"
    "            proxy_set_header X-Real-IP $remote_addr;\n"
    "            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n"
    "            proxy_set_header X-Forwarded-Proto $scheme;\n"
    "        }\n\n"
    "        location ^~ /marketing/prototype/ {\n"
    "            rewrite ^/marketing/(.*)$ /v1/marketing/$1 break;\n"
    "            proxy_pass $backend_upstream;\n"
    "            proxy_http_version 1.1;\n"
    "            proxy_set_header Host $host;\n"
    "            proxy_set_header X-Real-IP $remote_addr;\n"
    "            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n"
    "            proxy_set_header X-Forwarded-Proto $scheme;\n"
    "        }\n\n"
)

# Anchor: insert before the catch-all `location /` block which has
# `proxy_pass $frontend_upstream;` as its body — inside the 443 server block.
anchor_re = re.compile(
    r"(        location / \{\n            proxy_pass \$frontend_upstream;)"
)
m = anchor_re.search(s)
if not m:
    print("FATAL: anchor catch-all location /{ proxy_pass $frontend_upstream; } not found"); sys.exit(1)
if "location ^~ /marketing/prototype/" in s:
    print("WARN: /marketing/prototype/ block already exists — skipping (B)")
else:
    s = s[: m.start()] + new_blocks + s[m.start():]
    print("(B) /auth/login + /marketing/prototype/ blocks inserted before catch-all")

with open(FP, "w") as f:
    f.write(s)
print(f"wrote {FP}, {os.path.getsize(FP)} bytes")
