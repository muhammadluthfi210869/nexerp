# Page Audit — SCR-152

- **Path**: `C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO\frontend\src\app\(dashboard)\quality\report\page.tsx`
- **Route**: `/quality/report`
- **Spec Route**: `/scm/report-need-for-goods`
- **Module**: SCM & Purchasing (MOD-04)
- **Match Method**: stem-match
- **Total Lines**: 128
- **DNA Components**: 1
- **Raw UI Barrel Imports**: 0 (target: 0)
- **Mock Arrays**: 0 
- **React Query Hooks**: 3
- **Hardcoded `Rp`**: 2
- **Hardcoded `toLocaleString`**: 0

## 1. Table Columns
| # | Spec Column | FE Present | Status |
|---|---|---|---|
| 1 | # | - | ❌ missing |
| 2 | Kode | - | ❌ missing |
| 3 | Tanggal | - | ❌ missing |
| 4 | Sales / Customer / Produk / Brand | yes | ✅ |
| 5 | Pembuat | - | ❌ missing |
| 6 | Status | yes | ✅ |
| 7 | # | # | - | ❌ missing |
| 8 | Nama Barang | - | ❌ missing |
| 9 | Kebutuhan Qty | - | ❌ missing |
| 10 | Sisa Stok Saat Ini | - | ❌ missing |
| 11 | Selisih | - | ❌ missing |
| 12 | Qty Order | yes | ✅ |
| 13 | Harga (Rp) | - | ❌ missing |
| 14 | Total Kebutuhan (Rp) | yes | ✅ |
| 15 | Total Selisih + (Rp) | yes | ✅ |
| 16 | Total Selisih - (Rp) | yes | ✅ |
| 17 | Total Qty Order (Rp) | yes | ✅ |
| 18 | Catatan | - | ❌ missing |
| 19 | Tanggal | - | ❌ missing |
| 20 | No. Pembelian | - | ❌ missing |
| 21 | Supplier | - | ❌ missing |
| 22 | Qty | - | ❌ missing |
| 23 | Harga | - | ❌ missing |
| 24 | Tanggal | - | ❌ missing |
| 25 | No. Pembelian | - | ❌ missing |
| 26 | Supplier | - | ❌ missing |
| 27 | Qty | - | ❌ missing |
| 28 | Harga | - | ❌ missing |
| 29 | Tanggal | - | ❌ missing |
| 30 | No. Pembelian | - | ❌ missing |
| 31 | Supplier | - | ❌ missing |
| 32 | Qty | - | ❌ missing |
| 33 | Harga | - | ❌ missing |
| 34 | Tanggal | - | ❌ missing |
| 35 | No. Pembelian | - | ❌ missing |
| 36 | Supplier | - | ❌ missing |
| 37 | Qty | - | ❌ missing |
| 38 | Harga | - | ❌ missing |
| 39 | Tanggal | - | ❌ missing |
| 40 | No. Pembelian | - | ❌ missing |
| 41 | Supplier | - | ❌ missing |
| 42 | Qty | - | ❌ missing |
| 43 | Harga | - | ❌ missing |
| 44 | Tanggal | - | ❌ missing |
| 45 | No. Pembelian | - | ❌ missing |
| 46 | Supplier | - | ❌ missing |
| 47 | Qty | - | ❌ missing |
| 48 | Harga | - | ❌ missing |
| 49 | Tanggal | - | ❌ missing |
| 50 | No. Pembelian | - | ❌ missing |
| 51 | Supplier | - | ❌ missing |
| 52 | Qty | - | ❌ missing |
| 53 | Harga | - | ❌ missing |
| 54 | Tanggal | - | ❌ missing |
| 55 | No. Pembelian | - | ❌ missing |
| 56 | Supplier | - | ❌ missing |
| 57 | Qty | - | ❌ missing |
| 58 | Harga | - | ❌ missing |
| 59 | Tanggal | - | ❌ missing |
| 60 | No. Pembelian | - | ❌ missing |
| 61 | Supplier | - | ❌ missing |
| 62 | Qty | - | ❌ missing |
| 63 | Harga | - | ❌ missing |
| 64 | Tanggal | - | ❌ missing |
| 65 | No. Pembelian | - | ❌ missing |
| 66 | Supplier | - | ❌ missing |
| 67 | Qty | - | ❌ missing |
| 68 | Harga | - | ❌ missing |
| 69 | Tanggal | - | ❌ missing |
| 70 | No. Pembelian | - | ❌ missing |
| 71 | Supplier | - | ❌ missing |
| 72 | Qty | - | ❌ missing |
| 73 | Harga | - | ❌ missing |
| 74 | Tanggal | - | ❌ missing |
| 75 | No. Pembelian | - | ❌ missing |
| 76 | Supplier | - | ❌ missing |
| 77 | Qty | - | ❌ missing |
| 78 | Harga | - | ❌ missing |
| 79 | Tanggal | - | ❌ missing |
| 80 | No. Pembelian | - | ❌ missing |
| 81 | Supplier | - | ❌ missing |
| 82 | Qty | - | ❌ missing |
| 83 | Harga | - | ❌ missing |
| 84 | Tanggal | - | ❌ missing |
| 85 | No. Pembelian | - | ❌ missing |
| 86 | Supplier | - | ❌ missing |
| 87 | Qty | - | ❌ missing |
| 88 | Harga | - | ❌ missing |
| 89 | Tanggal | - | ❌ missing |
| 90 | No. Pembelian | - | ❌ missing |
| 91 | Supplier | - | ❌ missing |
| 92 | Qty | - | ❌ missing |
| 93 | Harga | - | ❌ missing |
| 94 | Tanggal | - | ❌ missing |
| 95 | No. Pembelian | - | ❌ missing |
| 96 | Supplier | - | ❌ missing |
| 97 | Qty | - | ❌ missing |
| 98 | Harga | - | ❌ missing |
| 99 | Tanggal | - | ❌ missing |
| 100 | No. Pembelian | - | ❌ missing |
| 101 | Supplier | - | ❌ missing |
| 102 | Qty | - | ❌ missing |
| 103 | Harga | - | ❌ missing |
| 104 | Tanggal | - | ❌ missing |
| 105 | No. Pembelian | - | ❌ missing |
| 106 | Supplier | - | ❌ missing |
| 107 | Qty | - | ❌ missing |
| 108 | Harga | - | ❌ missing |
| 109 | Tanggal | - | ❌ missing |
| 110 | No. Pembelian | - | ❌ missing |
| 111 | Supplier | - | ❌ missing |
| 112 | Qty | - | ❌ missing |
| 113 | Harga | - | ❌ missing |
| 114 | Tanggal | - | ❌ missing |
| 115 | No. Pembelian | - | ❌ missing |
| 116 | Supplier | - | ❌ missing |
| 117 | Qty | - | ❌ missing |
| 118 | Harga | - | ❌ missing |
| 119 | Tanggal | - | ❌ missing |
| 120 | No. Pembelian | - | ❌ missing |
| 121 | Supplier | - | ❌ missing |
| 122 | Qty | - | ❌ missing |
| 123 | Harga | - | ❌ missing |
| 124 | Tanggal | - | ❌ missing |
| 125 | No. Pembelian | - | ❌ missing |
| 126 | Supplier | - | ❌ missing |
| 127 | Qty | - | ❌ missing |
| 128 | Harga | - | ❌ missing |
| 129 | Tanggal | - | ❌ missing |
| 130 | No. Pembelian | - | ❌ missing |
| 131 | Supplier | - | ❌ missing |
| 132 | Qty | - | ❌ missing |
| 133 | Harga | - | ❌ missing |
| 134 | Tanggal | - | ❌ missing |
| 135 | No. Pembelian | - | ❌ missing |
| 136 | Supplier | - | ❌ missing |
| 137 | Qty | - | ❌ missing |
| 138 | Harga | - | ❌ missing |
| 139 | Tanggal | - | ❌ missing |
| 140 | No. Pembelian | - | ❌ missing |
| 141 | Supplier | - | ❌ missing |
| 142 | Qty | - | ❌ missing |
| 143 | Harga | - | ❌ missing |
| 144 | Tanggal | - | ❌ missing |
| 145 | No. Pembelian | - | ❌ missing |
| 146 | Supplier | - | ❌ missing |
| 147 | Qty | - | ❌ missing |
| 148 | Harga | - | ❌ missing |
| 149 | Tanggal | - | ❌ missing |
| 150 | No. Pembelian | - | ❌ missing |
| 151 | Supplier | - | ❌ missing |
| 152 | Qty | - | ❌ missing |
| 153 | Harga | - | ❌ missing |
| 154 | Tanggal | - | ❌ missing |
| 155 | No. Pembelian | - | ❌ missing |
| 156 | Supplier | - | ❌ missing |
| 157 | Qty | - | ❌ missing |
| 158 | Harga | - | ❌ missing |
| 159 | Tanggal | - | ❌ missing |
| 160 | No. Pembelian | - | ❌ missing |
| 161 | Supplier | - | ❌ missing |
| 162 | Qty | - | ❌ missing |
| 163 | Harga | - | ❌ missing |
| 164 | Tanggal | - | ❌ missing |
| 165 | No. Pembelian | - | ❌ missing |
| 166 | Supplier | - | ❌ missing |
| 167 | Qty | - | ❌ missing |
| 168 | Harga | - | ❌ missing |
| 169 | Tanggal | - | ❌ missing |
| 170 | No. Pembelian | - | ❌ missing |
| 171 | Supplier | - | ❌ missing |
| 172 | Qty | - | ❌ missing |
| 173 | Harga | - | ❌ missing |
| 174 | Tanggal | - | ❌ missing |
| 175 | No. Pembelian | - | ❌ missing |
| 176 | Supplier | - | ❌ missing |
| 177 | Qty | - | ❌ missing |
| 178 | Harga | - | ❌ missing |
| 179 | Tanggal | - | ❌ missing |
| 180 | No. Pembelian | - | ❌ missing |
| 181 | Supplier | - | ❌ missing |
| 182 | Qty | - | ❌ missing |
| 183 | Harga | - | ❌ missing |
| 184 | Tanggal | - | ❌ missing |
| 185 | No. Pembelian | - | ❌ missing |
| 186 | Supplier | - | ❌ missing |
| 187 | Qty | - | ❌ missing |
| 188 | Harga | - | ❌ missing |
| 189 | Tanggal | - | ❌ missing |
| 190 | No. Pembelian | - | ❌ missing |
| 191 | Supplier | - | ❌ missing |
| 192 | Qty | - | ❌ missing |
| 193 | Harga | - | ❌ missing |
| 194 | Tanggal | - | ❌ missing |
| 195 | No. Pembelian | - | ❌ missing |
| 196 | Supplier | - | ❌ missing |
| 197 | Qty | - | ❌ missing |
| 198 | Harga | - | ❌ missing |
| 199 | Tanggal | - | ❌ missing |
| 200 | No. Pembelian | - | ❌ missing |
| 201 | Supplier | - | ❌ missing |
| 202 | Qty | - | ❌ missing |
| 203 | Harga | - | ❌ missing |
| 204 | Tanggal | - | ❌ missing |
| 205 | No. Pembelian | - | ❌ missing |
| 206 | Supplier | - | ❌ missing |
| 207 | Qty | - | ❌ missing |
| 208 | Harga | - | ❌ missing |
| 209 | Tanggal | - | ❌ missing |
| 210 | No. Pembelian | - | ❌ missing |
| 211 | Supplier | - | ❌ missing |
| 212 | Qty | - | ❌ missing |
| 213 | Harga | - | ❌ missing |
| 214 | Tanggal | - | ❌ missing |
| 215 | No. Pembelian | - | ❌ missing |
| 216 | Supplier | - | ❌ missing |
| 217 | Qty | - | ❌ missing |
| 218 | Harga | - | ❌ missing |
| 219 | Tanggal | - | ❌ missing |
| 220 | No. Pembelian | - | ❌ missing |
| 221 | Supplier | - | ❌ missing |
| 222 | Qty | - | ❌ missing |
| 223 | Harga | - | ❌ missing |
| 224 | Tanggal | - | ❌ missing |
| 225 | No. Pembelian | - | ❌ missing |
| 226 | Supplier | - | ❌ missing |
| 227 | Qty | - | ❌ missing |
| 228 | Harga | - | ❌ missing |
| 229 | Tanggal | - | ❌ missing |
| 230 | No. Pembelian | - | ❌ missing |
| 231 | Supplier | - | ❌ missing |
| 232 | Qty | - | ❌ missing |
| 233 | Harga | - | ❌ missing |
| 234 | Tanggal | - | ❌ missing |
| 235 | No. Pembelian | - | ❌ missing |
| 236 | Supplier | - | ❌ missing |
| 237 | Qty | - | ❌ missing |
| 238 | Harga | - | ❌ missing |
| 239 | Tanggal | - | ❌ missing |
| 240 | No. Pembelian | - | ❌ missing |
| 241 | Supplier | - | ❌ missing |
| 242 | Qty | - | ❌ missing |
| 243 | Harga | - | ❌ missing |
| 244 | Tanggal | - | ❌ missing |
| 245 | No. Pembelian | - | ❌ missing |
| 246 | Supplier | - | ❌ missing |
| 247 | Qty | - | ❌ missing |
| 248 | Harga | - | ❌ missing |
| 249 | Tanggal | - | ❌ missing |
| 250 | No. Pembelian | - | ❌ missing |
| 251 | Supplier | - | ❌ missing |
| 252 | Qty | - | ❌ missing |
| 253 | Harga | - | ❌ missing |
| 254 | Tanggal | - | ❌ missing |
| 255 | No. Pembelian | - | ❌ missing |
| 256 | Supplier | - | ❌ missing |
| 257 | Qty | - | ❌ missing |
| 258 | Harga | - | ❌ missing |
| 259 | Tanggal | - | ❌ missing |
| 260 | No. Pembelian | - | ❌ missing |
| 261 | Supplier | - | ❌ missing |
| 262 | Qty | - | ❌ missing |
| 263 | Harga | - | ❌ missing |
| 264 | Tanggal | - | ❌ missing |
| 265 | No. Pembelian | - | ❌ missing |
| 266 | Supplier | - | ❌ missing |
| 267 | Qty | - | ❌ missing |
| 268 | Harga | - | ❌ missing |
| 269 | Tanggal | - | ❌ missing |
| 270 | No. Pembelian | - | ❌ missing |
| 271 | Supplier | - | ❌ missing |
| 272 | Qty | - | ❌ missing |
| 273 | Harga | - | ❌ missing |
| 274 | Tanggal | - | ❌ missing |
| 275 | No. Pembelian | - | ❌ missing |
| 276 | Supplier | - | ❌ missing |
| 277 | Qty | - | ❌ missing |
| 278 | Harga | - | ❌ missing |
| 279 | Tanggal | - | ❌ missing |
| 280 | No. Pembelian | - | ❌ missing |
| 281 | Supplier | - | ❌ missing |
| 282 | Qty | - | ❌ missing |
| 283 | Harga | - | ❌ missing |
| 284 | Tanggal | - | ❌ missing |
| 285 | No. Pembelian | - | ❌ missing |
| 286 | Supplier | - | ❌ missing |
| 287 | Qty | - | ❌ missing |
| 288 | Harga | - | ❌ missing |
| 289 | Tanggal | - | ❌ missing |
| 290 | No. Pembelian | - | ❌ missing |
| 291 | Supplier | - | ❌ missing |
| 292 | Qty | - | ❌ missing |
| 293 | Harga | - | ❌ missing |
| 294 | Tanggal | - | ❌ missing |
| 295 | No. Pembelian | - | ❌ missing |
| 296 | Supplier | - | ❌ missing |
| 297 | Qty | - | ❌ missing |
| 298 | Harga | - | ❌ missing |
| 299 | Tanggal | - | ❌ missing |
| 300 | No. Pembelian | - | ❌ missing |
| 301 | Supplier | - | ❌ missing |
| 302 | Qty | - | ❌ missing |
| 303 | Harga | - | ❌ missing |
| 304 | Tanggal | - | ❌ missing |
| 305 | No. Pembelian | - | ❌ missing |
| 306 | Supplier | - | ❌ missing |
| 307 | Qty | - | ❌ missing |
| 308 | Harga | - | ❌ missing |
| 309 | Tanggal | - | ❌ missing |
| 310 | No. Pembelian | - | ❌ missing |
| 311 | Supplier | - | ❌ missing |
| 312 | Qty | - | ❌ missing |
| 313 | Harga | - | ❌ missing |
| 314 | Tanggal | - | ❌ missing |
| 315 | No. Pembelian | - | ❌ missing |
| 316 | Supplier | - | ❌ missing |
| 317 | Qty | - | ❌ missing |
| 318 | Harga | - | ❌ missing |
| 319 | Tanggal | - | ❌ missing |
| 320 | No. Pembelian | - | ❌ missing |
| 321 | Supplier | - | ❌ missing |
| 322 | Qty | - | ❌ missing |
| 323 | Harga | - | ❌ missing |
| 324 | Tanggal | - | ❌ missing |
| 325 | No. Pembelian | - | ❌ missing |
| 326 | Supplier | - | ❌ missing |
| 327 | Qty | - | ❌ missing |
| 328 | Harga | - | ❌ missing |
| 329 | Tanggal | - | ❌ missing |
| 330 | No. Pembelian | - | ❌ missing |
| 331 | Supplier | - | ❌ missing |
| 332 | Qty | - | ❌ missing |
| 333 | Harga | - | ❌ missing |
| 334 | Tanggal | - | ❌ missing |
| 335 | No. Pembelian | - | ❌ missing |
| 336 | Supplier | - | ❌ missing |
| 337 | Qty | - | ❌ missing |
| 338 | Harga | - | ❌ missing |
| 339 | Tanggal | - | ❌ missing |
| 340 | No. Pembelian | - | ❌ missing |
| 341 | Supplier | - | ❌ missing |
| 342 | Qty | - | ❌ missing |
| 343 | Harga | - | ❌ missing |
| 344 | Tanggal | - | ❌ missing |
| 345 | No. Pembelian | - | ❌ missing |
| 346 | Supplier | - | ❌ missing |
| 347 | Qty | - | ❌ missing |
| 348 | Harga | - | ❌ missing |
| 349 | Tanggal | - | ❌ missing |
| 350 | No. Pembelian | - | ❌ missing |
| 351 | Supplier | - | ❌ missing |
| 352 | Qty | - | ❌ missing |
| 353 | Harga | - | ❌ missing |
| 354 | Tanggal | - | ❌ missing |
| 355 | No. Pembelian | - | ❌ missing |
| 356 | Supplier | - | ❌ missing |
| 357 | Qty | - | ❌ missing |
| 358 | Harga | - | ❌ missing |
| 359 | Tanggal | - | ❌ missing |
| 360 | No. Pembelian | - | ❌ missing |
| 361 | Supplier | - | ❌ missing |
| 362 | Qty | - | ❌ missing |
| 363 | Harga | - | ❌ missing |
| 364 | Tanggal | - | ❌ missing |
| 365 | No. Pembelian | - | ❌ missing |
| 366 | Supplier | - | ❌ missing |
| 367 | Qty | - | ❌ missing |
| 368 | Harga | - | ❌ missing |
| 369 | Tanggal | - | ❌ missing |
| 370 | No. Pembelian | - | ❌ missing |
| 371 | Supplier | - | ❌ missing |
| 372 | Qty | - | ❌ missing |
| 373 | Harga | - | ❌ missing |
| 374 | Tanggal | - | ❌ missing |
| 375 | No. Pembelian | - | ❌ missing |
| 376 | Supplier | - | ❌ missing |
| 377 | Qty | - | ❌ missing |
| 378 | Harga | - | ❌ missing |
| 379 | Tanggal | - | ❌ missing |
| 380 | No. Pembelian | - | ❌ missing |
| 381 | Supplier | - | ❌ missing |
| 382 | Qty | - | ❌ missing |
| 383 | Harga | - | ❌ missing |
| 384 | Tanggal | - | ❌ missing |
| 385 | No. Pembelian | - | ❌ missing |
| 386 | Supplier | - | ❌ missing |
| 387 | Qty | - | ❌ missing |
| 388 | Harga | - | ❌ missing |
| 389 | Tanggal | - | ❌ missing |
| 390 | No. Pembelian | - | ❌ missing |
| 391 | Supplier | - | ❌ missing |
| 392 | Qty | - | ❌ missing |
| 393 | Harga | - | ❌ missing |
| 394 | Tanggal | - | ❌ missing |
| 395 | No. Pembelian | - | ❌ missing |
| 396 | Supplier | - | ❌ missing |
| 397 | Qty | - | ❌ missing |
| 398 | Harga | - | ❌ missing |
| 399 | Tanggal | - | ❌ missing |
| 400 | No. Pembelian | - | ❌ missing |
| 401 | Supplier | - | ❌ missing |
| 402 | Qty | - | ❌ missing |
| 403 | Harga | - | ❌ missing |
| 404 | Tanggal | - | ❌ missing |
| 405 | No. Pembelian | - | ❌ missing |
| 406 | Supplier | - | ❌ missing |
| 407 | Qty | - | ❌ missing |
| 408 | Harga | - | ❌ missing |
| 409 | Tanggal | - | ❌ missing |
| 410 | No. Pembelian | - | ❌ missing |
| 411 | Supplier | - | ❌ missing |
| 412 | Qty | - | ❌ missing |
| 413 | Harga | - | ❌ missing |
| 414 | Tanggal | - | ❌ missing |
| 415 | No. Pembelian | - | ❌ missing |
| 416 | Supplier | - | ❌ missing |
| 417 | Qty | - | ❌ missing |
| 418 | Harga | - | ❌ missing |
| 419 | Tanggal | - | ❌ missing |
| 420 | No. Pembelian | - | ❌ missing |
| 421 | Supplier | - | ❌ missing |
| 422 | Qty | - | ❌ missing |
| 423 | Harga | - | ❌ missing |
| 424 | Tanggal | - | ❌ missing |
| 425 | No. Pembelian | - | ❌ missing |
| 426 | Supplier | - | ❌ missing |
| 427 | Qty | - | ❌ missing |
| 428 | Harga | - | ❌ missing |
| 429 | Tanggal | - | ❌ missing |
| 430 | No. Pembelian | - | ❌ missing |
| 431 | Supplier | - | ❌ missing |
| 432 | Qty | - | ❌ missing |
| 433 | Harga | - | ❌ missing |
| 434 | Tanggal | - | ❌ missing |
| 435 | No. Pembelian | - | ❌ missing |
| 436 | Supplier | - | ❌ missing |
| 437 | Qty | - | ❌ missing |
| 438 | Harga | - | ❌ missing |
| 439 | Tanggal | - | ❌ missing |
| 440 | No. Pembelian | - | ❌ missing |
| 441 | Supplier | - | ❌ missing |
| 442 | Qty | - | ❌ missing |
| 443 | Harga | - | ❌ missing |
| 444 | Tanggal | - | ❌ missing |
| 445 | No. Pembelian | - | ❌ missing |
| 446 | Supplier | - | ❌ missing |
| 447 | Qty | - | ❌ missing |
| 448 | Harga | - | ❌ missing |
| 449 | Tanggal | - | ❌ missing |
| 450 | No. Pembelian | - | ❌ missing |
| 451 | Supplier | - | ❌ missing |
| 452 | Qty | - | ❌ missing |
| 453 | Harga | - | ❌ missing |
| 454 | Tanggal | - | ❌ missing |
| 455 | No. Pembelian | - | ❌ missing |
| 456 | Supplier | - | ❌ missing |
| 457 | Qty | - | ❌ missing |
| 458 | Harga | - | ❌ missing |
| 459 | Tanggal | - | ❌ missing |
| 460 | No. Pembelian | - | ❌ missing |
| 461 | Supplier | - | ❌ missing |
| 462 | Qty | - | ❌ missing |
| 463 | Harga | - | ❌ missing |
| 464 | Tanggal | - | ❌ missing |
| 465 | No. Pembelian | - | ❌ missing |
| 466 | Supplier | - | ❌ missing |
| 467 | Qty | - | ❌ missing |
| 468 | Harga | - | ❌ missing |
| 469 | Tanggal | - | ❌ missing |
| 470 | No. Pembelian | - | ❌ missing |
| 471 | Supplier | - | ❌ missing |
| 472 | Qty | - | ❌ missing |
| 473 | Harga | - | ❌ missing |
| 474 | Tanggal | - | ❌ missing |
| 475 | No. Pembelian | - | ❌ missing |
| 476 | Supplier | - | ❌ missing |
| 477 | Qty | - | ❌ missing |
| 478 | Harga | - | ❌ missing |
| 479 | Tanggal | - | ❌ missing |
| 480 | No. Pembelian | - | ❌ missing |
| 481 | Supplier | - | ❌ missing |
| 482 | Qty | - | ❌ missing |
| 483 | Harga | - | ❌ missing |
| 484 | Tanggal | - | ❌ missing |
| 485 | No. Pembelian | - | ❌ missing |
| 486 | Supplier | - | ❌ missing |
| 487 | Qty | - | ❌ missing |
| 488 | Harga | - | ❌ missing |
| 489 | Tanggal | - | ❌ missing |
| 490 | No. Pembelian | - | ❌ missing |
| 491 | Supplier | - | ❌ missing |
| 492 | Qty | - | ❌ missing |
| 493 | Harga | - | ❌ missing |
| 494 | Tanggal | - | ❌ missing |
| 495 | No. Pembelian | - | ❌ missing |
| 496 | Supplier | - | ❌ missing |
| 497 | Qty | - | ❌ missing |
| 498 | Harga | - | ❌ missing |
| 499 | Tanggal | - | ❌ missing |
| 500 | No. Pembelian | - | ❌ missing |
| 501 | Supplier | - | ❌ missing |
| 502 | Qty | - | ❌ missing |
| 503 | Harga | - | ❌ missing |
| 504 | Tanggal | - | ❌ missing |
| 505 | No. Pembelian | - | ❌ missing |
| 506 | Supplier | - | ❌ missing |
| 507 | Qty | - | ❌ missing |
| 508 | Harga | - | ❌ missing |
| 509 | Tanggal | - | ❌ missing |
| 510 | No. Pembelian | - | ❌ missing |
| 511 | Supplier | - | ❌ missing |
| 512 | Qty | - | ❌ missing |
| 513 | Harga | - | ❌ missing |
| 514 | Tanggal | - | ❌ missing |
| 515 | No. Pembelian | - | ❌ missing |
| 516 | Supplier | - | ❌ missing |
| 517 | Qty | - | ❌ missing |
| 518 | Harga | - | ❌ missing |
| 519 | Tanggal | - | ❌ missing |
| 520 | No. Pembelian | - | ❌ missing |
| 521 | Supplier | - | ❌ missing |
| 522 | Qty | - | ❌ missing |
| 523 | Harga | - | ❌ missing |
| 524 | Tanggal | - | ❌ missing |
| 525 | No. Pembelian | - | ❌ missing |
| 526 | Supplier | - | ❌ missing |
| 527 | Qty | - | ❌ missing |
| 528 | Harga | - | ❌ missing |
| 529 | Tanggal | - | ❌ missing |
| 530 | No. Pembelian | - | ❌ missing |
| 531 | Supplier | - | ❌ missing |
| 532 | Qty | - | ❌ missing |
| 533 | Harga | - | ❌ missing |
| 534 | Tanggal | - | ❌ missing |
| 535 | No. Pembelian | - | ❌ missing |
| 536 | Supplier | - | ❌ missing |
| 537 | Qty | - | ❌ missing |
| 538 | Harga | - | ❌ missing |
| 539 | Tanggal | - | ❌ missing |
| 540 | No. Pembelian | - | ❌ missing |
| 541 | Supplier | - | ❌ missing |
| 542 | Qty | - | ❌ missing |
| 543 | Harga | - | ❌ missing |
| 544 | Tanggal | - | ❌ missing |
| 545 | No. Pembelian | - | ❌ missing |
| 546 | Supplier | - | ❌ missing |
| 547 | Qty | - | ❌ missing |
| 548 | Harga | - | ❌ missing |
| 549 | Tanggal | - | ❌ missing |
| 550 | No. Pembelian | - | ❌ missing |
| 551 | Supplier | - | ❌ missing |
| 552 | Qty | - | ❌ missing |
| 553 | Harga | - | ❌ missing |
| 554 | Tanggal | - | ❌ missing |
| 555 | No. Pembelian | - | ❌ missing |
| 556 | Supplier | - | ❌ missing |
| 557 | Qty | - | ❌ missing |
| 558 | Harga | - | ❌ missing |
| 559 | Tanggal | - | ❌ missing |
| 560 | No. Pembelian | - | ❌ missing |
| 561 | Supplier | - | ❌ missing |
| 562 | Qty | - | ❌ missing |
| 563 | Harga | - | ❌ missing |
| 564 | Tanggal | - | ❌ missing |
| 565 | No. Pembelian | - | ❌ missing |
| 566 | Supplier | - | ❌ missing |
| 567 | Qty | - | ❌ missing |
| 568 | Harga | - | ❌ missing |
| 569 | Tanggal | - | ❌ missing |
| 570 | No. Pembelian | - | ❌ missing |
| 571 | Supplier | - | ❌ missing |
| 572 | Qty | - | ❌ missing |
| 573 | Harga | - | ❌ missing |
| 574 | Tanggal | - | ❌ missing |
| 575 | No. Pembelian | - | ❌ missing |
| 576 | Supplier | - | ❌ missing |
| 577 | Qty | - | ❌ missing |
| 578 | Harga | - | ❌ missing |
| 579 | Tanggal | - | ❌ missing |
| 580 | No. Pembelian | - | ❌ missing |
| 581 | Supplier | - | ❌ missing |
| 582 | Qty | - | ❌ missing |
| 583 | Harga | - | ❌ missing |
| 584 | Tanggal | - | ❌ missing |
| 585 | No. Pembelian | - | ❌ missing |
| 586 | Supplier | - | ❌ missing |
| 587 | Qty | - | ❌ missing |
| 588 | Harga | - | ❌ missing |
| 589 | Tanggal | - | ❌ missing |
| 590 | No. Pembelian | - | ❌ missing |
| 591 | Supplier | - | ❌ missing |
| 592 | Qty | - | ❌ missing |
| 593 | Harga | - | ❌ missing |
| 594 | Tanggal | - | ❌ missing |
| 595 | No. Pembelian | - | ❌ missing |
| 596 | Supplier | - | ❌ missing |
| 597 | Qty | - | ❌ missing |
| 598 | Harga | - | ❌ missing |
| 599 | Tanggal | - | ❌ missing |
| 600 | No. Pembelian | - | ❌ missing |
| 601 | Supplier | - | ❌ missing |
| 602 | Qty | - | ❌ missing |
| 603 | Harga | - | ❌ missing |
| 604 | Tanggal | - | ❌ missing |
| 605 | No. Pembelian | - | ❌ missing |
| 606 | Supplier | - | ❌ missing |
| 607 | Qty | - | ❌ missing |
| 608 | Harga | - | ❌ missing |
| 609 | Tanggal | - | ❌ missing |
| 610 | No. Pembelian | - | ❌ missing |
| 611 | Supplier | - | ❌ missing |
| 612 | Qty | - | ❌ missing |
| 613 | Harga | - | ❌ missing |
| 614 | Tanggal | - | ❌ missing |
| 615 | No. Pembelian | - | ❌ missing |
| 616 | Supplier | - | ❌ missing |
| 617 | Qty | - | ❌ missing |
| 618 | Harga | - | ❌ missing |
| 619 | Tanggal | - | ❌ missing |
| 620 | No. Pembelian | - | ❌ missing |
| 621 | Supplier | - | ❌ missing |
| 622 | Qty | - | ❌ missing |
| 623 | Harga | - | ❌ missing |
| 624 | Tanggal | - | ❌ missing |
| 625 | No. Pembelian | - | ❌ missing |
| 626 | Supplier | - | ❌ missing |
| 627 | Qty | - | ❌ missing |
| 628 | Harga | - | ❌ missing |
| 629 | Tanggal | - | ❌ missing |
| 630 | No. Pembelian | - | ❌ missing |
| 631 | Supplier | - | ❌ missing |
| 632 | Qty | - | ❌ missing |
| 633 | Harga | - | ❌ missing |
| 634 | Tanggal | - | ❌ missing |
| 635 | No. Pembelian | - | ❌ missing |
| 636 | Supplier | - | ❌ missing |
| 637 | Qty | - | ❌ missing |
| 638 | Harga | - | ❌ missing |
| 639 | Tanggal | - | ❌ missing |
| 640 | No. Pembelian | - | ❌ missing |
| 641 | Supplier | - | ❌ missing |
| 642 | Qty | - | ❌ missing |
| 643 | Harga | - | ❌ missing |
| 644 | Tanggal | - | ❌ missing |
| 645 | No. Pembelian | - | ❌ missing |
| 646 | Supplier | - | ❌ missing |
| 647 | Qty | - | ❌ missing |
| 648 | Harga | - | ❌ missing |
| 649 | Tanggal | - | ❌ missing |
| 650 | No. Pembelian | - | ❌ missing |
| 651 | Supplier | - | ❌ missing |
| 652 | Qty | - | ❌ missing |
| 653 | Harga | - | ❌ missing |
| 654 | Tanggal | - | ❌ missing |
| 655 | No. Pembelian | - | ❌ missing |
| 656 | Supplier | - | ❌ missing |
| 657 | Qty | - | ❌ missing |
| 658 | Harga | - | ❌ missing |
| 659 | Tanggal | - | ❌ missing |
| 660 | No. Pembelian | - | ❌ missing |
| 661 | Supplier | - | ❌ missing |
| 662 | Qty | - | ❌ missing |
| 663 | Harga | - | ❌ missing |
| 664 | Tanggal | - | ❌ missing |
| 665 | No. Pembelian | - | ❌ missing |
| 666 | Supplier | - | ❌ missing |
| 667 | Qty | - | ❌ missing |
| 668 | Harga | - | ❌ missing |
| 669 | Tanggal | - | ❌ missing |
| 670 | No. Pembelian | - | ❌ missing |
| 671 | Supplier | - | ❌ missing |
| 672 | Qty | - | ❌ missing |
| 673 | Harga | - | ❌ missing |
| 674 | Tanggal | - | ❌ missing |
| 675 | No. Pembelian | - | ❌ missing |
| 676 | Supplier | - | ❌ missing |
| 677 | Qty | - | ❌ missing |
| 678 | Harga | - | ❌ missing |
| 679 | Tanggal | - | ❌ missing |
| 680 | No. Pembelian | - | ❌ missing |
| 681 | Supplier | - | ❌ missing |
| 682 | Qty | - | ❌ missing |
| 683 | Harga | - | ❌ missing |
| 684 | Tanggal | - | ❌ missing |
| 685 | No. Pembelian | - | ❌ missing |
| 686 | Supplier | - | ❌ missing |
| 687 | Qty | - | ❌ missing |
| 688 | Harga | - | ❌ missing |
| 689 | Tanggal | - | ❌ missing |
| 690 | No. Pembelian | - | ❌ missing |
| 691 | Supplier | - | ❌ missing |
| 692 | Qty | - | ❌ missing |
| 693 | Harga | - | ❌ missing |
| 694 | Tanggal | - | ❌ missing |
| 695 | No. Pembelian | - | ❌ missing |
| 696 | Supplier | - | ❌ missing |
| 697 | Qty | - | ❌ missing |
| 698 | Harga | - | ❌ missing |
| 699 | Tanggal | - | ❌ missing |
| 700 | No. Pembelian | - | ❌ missing |
| 701 | Supplier | - | ❌ missing |
| 702 | Qty | - | ❌ missing |
| 703 | Harga | - | ❌ missing |
| 704 | Tanggal | - | ❌ missing |
| 705 | No. Pembelian | - | ❌ missing |
| 706 | Supplier | - | ❌ missing |
| 707 | Qty | - | ❌ missing |
| 708 | Harga | - | ❌ missing |
| 709 | Tanggal | - | ❌ missing |
| 710 | No. Pembelian | - | ❌ missing |
| 711 | Supplier | - | ❌ missing |
| 712 | Qty | - | ❌ missing |
| 713 | Harga | - | ❌ missing |
| 714 | Tanggal | - | ❌ missing |
| 715 | No. Pembelian | - | ❌ missing |
| 716 | Supplier | - | ❌ missing |
| 717 | Qty | - | ❌ missing |
| 718 | Harga | - | ❌ missing |
| 719 | Tanggal | - | ❌ missing |
| 720 | No. Pembelian | - | ❌ missing |
| 721 | Supplier | - | ❌ missing |
| 722 | Qty | - | ❌ missing |
| 723 | Harga | - | ❌ missing |
| 724 | Tanggal | - | ❌ missing |
| 725 | No. Pembelian | - | ❌ missing |
| 726 | Supplier | - | ❌ missing |
| 727 | Qty | - | ❌ missing |
| 728 | Harga | - | ❌ missing |
| 729 | Tanggal | - | ❌ missing |
| 730 | No. Pembelian | - | ❌ missing |
| 731 | Supplier | - | ❌ missing |
| 732 | Qty | - | ❌ missing |
| 733 | Harga | - | ❌ missing |
| 734 | Tanggal | - | ❌ missing |
| 735 | No. Pembelian | - | ❌ missing |
| 736 | Supplier | - | ❌ missing |
| 737 | Qty | - | ❌ missing |
| 738 | Harga | - | ❌ missing |
| 739 | Tanggal | - | ❌ missing |
| 740 | No. Pembelian | - | ❌ missing |
| 741 | Supplier | - | ❌ missing |
| 742 | Qty | - | ❌ missing |
| 743 | Harga | - | ❌ missing |
| 744 | Tanggal | - | ❌ missing |
| 745 | No. Pembelian | - | ❌ missing |
| 746 | Supplier | - | ❌ missing |
| 747 | Qty | - | ❌ missing |
| 748 | Harga | - | ❌ missing |
| 749 | Tanggal | - | ❌ missing |
| 750 | No. Pembelian | - | ❌ missing |
| 751 | Supplier | - | ❌ missing |
| 752 | Qty | - | ❌ missing |
| 753 | Harga | - | ❌ missing |
| 754 | Tanggal | - | ❌ missing |
| 755 | No. Pembelian | - | ❌ missing |
| 756 | Supplier | - | ❌ missing |
| 757 | Qty | - | ❌ missing |
| 758 | Harga | - | ❌ missing |
| 759 | Tanggal | - | ❌ missing |
| 760 | No. Pembelian | - | ❌ missing |
| 761 | Supplier | - | ❌ missing |
| 762 | Qty | - | ❌ missing |
| 763 | Harga | - | ❌ missing |
| 764 | Tanggal | - | ❌ missing |
| 765 | No. Pembelian | - | ❌ missing |
| 766 | Supplier | - | ❌ missing |
| 767 | Qty | - | ❌ missing |
| 768 | Harga | - | ❌ missing |
| 769 | Tanggal | - | ❌ missing |
| 770 | No. Pembelian | - | ❌ missing |
| 771 | Supplier | - | ❌ missing |
| 772 | Qty | - | ❌ missing |
| 773 | Harga | - | ❌ missing |
| 774 | Tanggal | - | ❌ missing |
| 775 | No. Pembelian | - | ❌ missing |
| 776 | Supplier | - | ❌ missing |
| 777 | Qty | - | ❌ missing |
| 778 | Harga | - | ❌ missing |
| 779 | Tanggal | - | ❌ missing |
| 780 | No. Pembelian | - | ❌ missing |
| 781 | Supplier | - | ❌ missing |
| 782 | Qty | - | ❌ missing |
| 783 | Harga | - | ❌ missing |
| 784 | Tanggal | - | ❌ missing |
| 785 | No. Pembelian | - | ❌ missing |
| 786 | Supplier | - | ❌ missing |
| 787 | Qty | - | ❌ missing |
| 788 | Harga | - | ❌ missing |
| 789 | Tanggal | - | ❌ missing |
| 790 | No. Pembelian | - | ❌ missing |
| 791 | Supplier | - | ❌ missing |
| 792 | Qty | - | ❌ missing |
| 793 | Harga | - | ❌ missing |
| 794 | Tanggal | - | ❌ missing |
| 795 | No. Pembelian | - | ❌ missing |
| 796 | Supplier | - | ❌ missing |
| 797 | Qty | - | ❌ missing |
| 798 | Harga | - | ❌ missing |
| 799 | Tanggal | - | ❌ missing |
| 800 | No. Pembelian | - | ❌ missing |
| 801 | Supplier | - | ❌ missing |
| 802 | Qty | - | ❌ missing |
| 803 | Harga | - | ❌ missing |
| 804 | Tanggal | - | ❌ missing |
| 805 | No. Pembelian | - | ❌ missing |
| 806 | Supplier | - | ❌ missing |
| 807 | Qty | - | ❌ missing |
| 808 | Harga | Tanggal | - | ❌ missing |
| 809 | No. Pembelian | - | ❌ missing |
| 810 | Supplier | - | ❌ missing |
| 811 | Qty | - | ❌ missing |
| 812 | Harga | Tanggal | - | ❌ missing |
| 813 | No. Pembelian | - | ❌ missing |
| 814 | Supplier | - | ❌ missing |
| 815 | Qty | - | ❌ missing |
| 816 | Harga | Tanggal | - | ❌ missing |
| 817 | No. Pembelian | - | ❌ missing |
| 818 | Supplier | - | ❌ missing |
| 819 | Qty | - | ❌ missing |
| 820 | Harga | Tanggal | - | ❌ missing |
| 821 | No. Pembelian | - | ❌ missing |
| 822 | Supplier | - | ❌ missing |
| 823 | Qty | - | ❌ missing |
| 824 | Harga | Tanggal | - | ❌ missing |
| 825 | No. Pembelian | - | ❌ missing |
| 826 | Supplier | - | ❌ missing |
| 827 | Qty | - | ❌ missing |
| 828 | Harga | Tanggal | - | ❌ missing |
| 829 | No. Pembelian | - | ❌ missing |
| 830 | Supplier | - | ❌ missing |
| 831 | Qty | - | ❌ missing |
| 832 | Harga | Tanggal | - | ❌ missing |
| 833 | No. Pembelian | - | ❌ missing |
| 834 | Supplier | - | ❌ missing |
| 835 | Qty | - | ❌ missing |
| 836 | Harga | Tanggal | - | ❌ missing |
| 837 | No. Pembelian | - | ❌ missing |
| 838 | Supplier | - | ❌ missing |
| 839 | Qty | - | ❌ missing |
| 840 | Harga | Tanggal | - | ❌ missing |
| 841 | No. Pembelian | - | ❌ missing |
| 842 | Supplier | - | ❌ missing |
| 843 | Qty | - | ❌ missing |
| 844 | Harga | Tanggal | - | ❌ missing |
| 845 | No. Pembelian | - | ❌ missing |
| 846 | Supplier | - | ❌ missing |
| 847 | Qty | - | ❌ missing |
| 848 | Harga | Tanggal | - | ❌ missing |
| 849 | No. Pembelian | - | ❌ missing |
| 850 | Supplier | - | ❌ missing |
| 851 | Qty | - | ❌ missing |
| 852 | Harga | Tanggal | - | ❌ missing |
| 853 | No. Pembelian | - | ❌ missing |
| 854 | Supplier | - | ❌ missing |
| 855 | Qty | - | ❌ missing |
| 856 | Harga | Tanggal | - | ❌ missing |
| 857 | No. Pembelian | - | ❌ missing |
| 858 | Supplier | - | ❌ missing |
| 859 | Qty | - | ❌ missing |
| 860 | Harga | Tanggal | - | ❌ missing |
| 861 | No. Pembelian | - | ❌ missing |
| 862 | Supplier | - | ❌ missing |
| 863 | Qty | - | ❌ missing |
| 864 | Harga | Tanggal | - | ❌ missing |
| 865 | No. Pembelian | - | ❌ missing |
| 866 | Supplier | - | ❌ missing |
| 867 | Qty | - | ❌ missing |
| 868 | Harga | Tanggal | - | ❌ missing |
| 869 | No. Pembelian | - | ❌ missing |
| 870 | Supplier | - | ❌ missing |
| 871 | Qty | - | ❌ missing |
| 872 | Harga | Tanggal | - | ❌ missing |
| 873 | No. Pembelian | - | ❌ missing |
| 874 | Supplier | - | ❌ missing |
| 875 | Qty | - | ❌ missing |
| 876 | Harga | Tanggal | - | ❌ missing |
| 877 | No. Pembelian | - | ❌ missing |
| 878 | Supplier | - | ❌ missing |
| 879 | Qty | - | ❌ missing |
| 880 | Harga | Tanggal | - | ❌ missing |
| 881 | No. Pembelian | - | ❌ missing |
| 882 | Supplier | - | ❌ missing |
| 883 | Qty | - | ❌ missing |
| 884 | Harga | Tanggal | - | ❌ missing |
| 885 | No. Pembelian | - | ❌ missing |
| 886 | Supplier | - | ❌ missing |
| 887 | Qty | - | ❌ missing |
| 888 | Harga | Tanggal | - | ❌ missing |
| 889 | No. Pembelian | - | ❌ missing |
| 890 | Supplier | - | ❌ missing |
| 891 | Qty | - | ❌ missing |
| 892 | Harga | Tanggal | - | ❌ missing |
| 893 | No. Pembelian | - | ❌ missing |
| 894 | Supplier | - | ❌ missing |
| 895 | Qty | - | ❌ missing |
| 896 | Harga | Tanggal | - | ❌ missing |
| 897 | No. Pembelian | - | ❌ missing |
| 898 | Supplier | - | ❌ missing |
| 899 | Qty | - | ❌ missing |
| 900 | Harga | Tanggal | - | ❌ missing |
| 901 | No. Pembelian | - | ❌ missing |
| 902 | Supplier | - | ❌ missing |
| 903 | Qty | - | ❌ missing |
| 904 | Harga | Tanggal | - | ❌ missing |
| 905 | No. Pembelian | - | ❌ missing |
| 906 | Supplier | - | ❌ missing |
| 907 | Qty | - | ❌ missing |
| 908 | Harga | Tanggal | - | ❌ missing |
| 909 | No. Pembelian | - | ❌ missing |
| 910 | Supplier | - | ❌ missing |
| 911 | Qty | - | ❌ missing |
| 912 | Harga | Tanggal | - | ❌ missing |
| 913 | No. Pembelian | - | ❌ missing |
| 914 | Supplier | - | ❌ missing |
| 915 | Qty | - | ❌ missing |
| 916 | Harga | Tanggal | - | ❌ missing |
| 917 | No. Pembelian | - | ❌ missing |
| 918 | Supplier | - | ❌ missing |
| 919 | Qty | - | ❌ missing |
| 920 | Harga | Tanggal | - | ❌ missing |
| 921 | No. Pembelian | - | ❌ missing |
| 922 | Supplier | - | ❌ missing |
| 923 | Qty | - | ❌ missing |
| 924 | Harga | Tanggal | - | ❌ missing |
| 925 | No. Pembelian | - | ❌ missing |
| 926 | Supplier | - | ❌ missing |
| 927 | Qty | - | ❌ missing |
| 928 | Harga | Tanggal | - | ❌ missing |
| 929 | No. Pembelian | - | ❌ missing |
| 930 | Supplier | - | ❌ missing |
| 931 | Qty | - | ❌ missing |
| 932 | Harga | Tanggal | - | ❌ missing |
| 933 | No. Pembelian | - | ❌ missing |
| 934 | Supplier | - | ❌ missing |
| 935 | Qty | - | ❌ missing |
| 936 | Harga | Tanggal | - | ❌ missing |
| 937 | No. Pembelian | - | ❌ missing |
| 938 | Supplier | - | ❌ missing |
| 939 | Qty | - | ❌ missing |
| 940 | Harga | Tanggal | - | ❌ missing |
| 941 | No. Pembelian | - | ❌ missing |
| 942 | Supplier | - | ❌ missing |
| 943 | Qty | - | ❌ missing |
| 944 | Harga | Tanggal | - | ❌ missing |
| 945 | No. Pembelian | - | ❌ missing |
| 946 | Supplier | - | ❌ missing |
| 947 | Qty | - | ❌ missing |
| 948 | Harga | Tanggal | - | ❌ missing |
| 949 | No. Pembelian | - | ❌ missing |
| 950 | Supplier | - | ❌ missing |
| 951 | Qty | - | ❌ missing |
| 952 | Harga | Tanggal | - | ❌ missing |
| 953 | No. Pembelian | - | ❌ missing |
| 954 | Supplier | - | ❌ missing |
| 955 | Qty | - | ❌ missing |
| 956 | Harga | Tanggal | - | ❌ missing |
| 957 | No. Pembelian | - | ❌ missing |
| 958 | Supplier | - | ❌ missing |
| 959 | Qty | - | ❌ missing |
| 960 | Harga | Tanggal | - | ❌ missing |
| 961 | No. Pembelian | - | ❌ missing |
| 962 | Supplier | - | ❌ missing |
| 963 | Qty | - | ❌ missing |
| 964 | Harga | Tanggal | - | ❌ missing |
| 965 | No. Pembelian | - | ❌ missing |
| 966 | Supplier | - | ❌ missing |
| 967 | Qty | - | ❌ missing |
| 968 | Harga | Tanggal | - | ❌ missing |
| 969 | No. Pembelian | - | ❌ missing |
| 970 | Supplier | - | ❌ missing |
| 971 | Qty | - | ❌ missing |
| 972 | Harga | Tanggal | - | ❌ missing |
| 973 | No. Pembelian | - | ❌ missing |
| 974 | Supplier | - | ❌ missing |
| 975 | Qty | - | ❌ missing |
| 976 | Harga | Tanggal | - | ❌ missing |
| 977 | No. Pembelian | - | ❌ missing |
| 978 | Supplier | - | ❌ missing |
| 979 | Qty | - | ❌ missing |
| 980 | Harga | Tanggal | - | ❌ missing |
| 981 | No. Pembelian | - | ❌ missing |
| 982 | Supplier | - | ❌ missing |
| 983 | Qty | - | ❌ missing |
| 984 | Harga | Tanggal | - | ❌ missing |
| 985 | No. Pembelian | - | ❌ missing |
| 986 | Supplier | - | ❌ missing |
| 987 | Qty | - | ❌ missing |
| 988 | Harga | Tanggal | - | ❌ missing |
| 989 | No. Pembelian | - | ❌ missing |
| 990 | Supplier | - | ❌ missing |
| 991 | Qty | - | ❌ missing |
| 992 | Harga | Tanggal | - | ❌ missing |
| 993 | No. Pembelian | - | ❌ missing |
| 994 | Supplier | - | ❌ missing |
| 995 | Qty | - | ❌ missing |
| 996 | Harga | Tanggal | - | ❌ missing |
| 997 | No. Pembelian | - | ❌ missing |
| 998 | Supplier | - | ❌ missing |
| 999 | Qty | - | ❌ missing |
| 1000 | Harga | Tanggal | - | ❌ missing |
| 1001 | No. Pembelian | - | ❌ missing |
| 1002 | Supplier | - | ❌ missing |
| 1003 | Qty | - | ❌ missing |
| 1004 | Harga | Tanggal | - | ❌ missing |
| 1005 | No. Pembelian | - | ❌ missing |
| 1006 | Supplier | - | ❌ missing |
| 1007 | Qty | - | ❌ missing |
| 1008 | Harga | Tanggal | - | ❌ missing |
| 1009 | No. Pembelian | - | ❌ missing |
| 1010 | Supplier | - | ❌ missing |
| 1011 | Qty | - | ❌ missing |
| 1012 | Harga | Tanggal | - | ❌ missing |
| 1013 | No. Pembelian | - | ❌ missing |
| 1014 | Supplier | - | ❌ missing |
| 1015 | Qty | - | ❌ missing |
| 1016 | Harga | Tanggal | - | ❌ missing |
| 1017 | No. Pembelian | - | ❌ missing |
| 1018 | Supplier | - | ❌ missing |
| 1019 | Qty | - | ❌ missing |
| 1020 | Harga | Tanggal | - | ❌ missing |
| 1021 | No. Pembelian | - | ❌ missing |
| 1022 | Supplier | - | ❌ missing |
| 1023 | Qty | - | ❌ missing |
| 1024 | Harga | Tanggal | - | ❌ missing |
| 1025 | No. Pembelian | - | ❌ missing |
| 1026 | Supplier | - | ❌ missing |
| 1027 | Qty | - | ❌ missing |
| 1028 | Harga | Tanggal | - | ❌ missing |
| 1029 | No. Pembelian | - | ❌ missing |
| 1030 | Supplier | - | ❌ missing |
| 1031 | Qty | - | ❌ missing |
| 1032 | Harga | Tanggal | - | ❌ missing |
| 1033 | No. Pembelian | - | ❌ missing |
| 1034 | Supplier | - | ❌ missing |
| 1035 | Qty | - | ❌ missing |
| 1036 | Harga | Tanggal | - | ❌ missing |
| 1037 | No. Pembelian | - | ❌ missing |
| 1038 | Supplier | - | ❌ missing |
| 1039 | Qty | - | ❌ missing |
| 1040 | Harga | Tanggal | - | ❌ missing |
| 1041 | No. Pembelian | - | ❌ missing |
| 1042 | Supplier | - | ❌ missing |
| 1043 | Qty | - | ❌ missing |
| 1044 | Harga | Tanggal | - | ❌ missing |
| 1045 | No. Pembelian | - | ❌ missing |
| 1046 | Supplier | - | ❌ missing |
| 1047 | Qty | - | ❌ missing |
| 1048 | Harga | Tanggal | - | ❌ missing |
| 1049 | No. Pembelian | - | ❌ missing |
| 1050 | Supplier | - | ❌ missing |
| 1051 | Qty | - | ❌ missing |
| 1052 | Harga | Tanggal | - | ❌ missing |
| 1053 | No. Pembelian | - | ❌ missing |
| 1054 | Supplier | - | ❌ missing |
| 1055 | Qty | - | ❌ missing |
| 1056 | Harga | Tanggal | - | ❌ missing |
| 1057 | No. Pembelian | - | ❌ missing |
| 1058 | Supplier | - | ❌ missing |
| 1059 | Qty | - | ❌ missing |
| 1060 | Harga | Tanggal | - | ❌ missing |
| 1061 | No. Pembelian | - | ❌ missing |
| 1062 | Supplier | - | ❌ missing |
| 1063 | Qty | - | ❌ missing |
| 1064 | Harga | Tanggal | - | ❌ missing |
| 1065 | No. Pembelian | - | ❌ missing |
| 1066 | Supplier | - | ❌ missing |
| 1067 | Qty | - | ❌ missing |
| 1068 | Harga | Tanggal | - | ❌ missing |
| 1069 | No. Pembelian | - | ❌ missing |
| 1070 | Supplier | - | ❌ missing |
| 1071 | Qty | - | ❌ missing |
| 1072 | Harga | Tanggal | - | ❌ missing |
| 1073 | No. Pembelian | - | ❌ missing |
| 1074 | Supplier | - | ❌ missing |
| 1075 | Qty | - | ❌ missing |
| 1076 | Harga | Tanggal | - | ❌ missing |
| 1077 | No. Pembelian | - | ❌ missing |
| 1078 | Supplier | - | ❌ missing |
| 1079 | Qty | - | ❌ missing |
| 1080 | Harga | Tanggal | - | ❌ missing |
| 1081 | No. Pembelian | - | ❌ missing |
| 1082 | Supplier | - | ❌ missing |
| 1083 | Qty | - | ❌ missing |
| 1084 | Harga | Tanggal | - | ❌ missing |
| 1085 | No. Pembelian | - | ❌ missing |
| 1086 | Supplier | - | ❌ missing |
| 1087 | Qty | - | ❌ missing |
| 1088 | Harga | Tanggal | - | ❌ missing |
| 1089 | No. Pembelian | - | ❌ missing |
| 1090 | Supplier | - | ❌ missing |
| 1091 | Qty | - | ❌ missing |
| 1092 | Harga | Tanggal | - | ❌ missing |
| 1093 | No. Pembelian | - | ❌ missing |
| 1094 | Supplier | - | ❌ missing |
| 1095 | Qty | - | ❌ missing |
| 1096 | Harga | Tanggal | - | ❌ missing |
| 1097 | No. Pembelian | - | ❌ missing |
| 1098 | Supplier | - | ❌ missing |
| 1099 | Qty | - | ❌ missing |
| 1100 | Harga | Tanggal | - | ❌ missing |
| 1101 | No. Pembelian | - | ❌ missing |
| 1102 | Supplier | - | ❌ missing |
| 1103 | Qty | - | ❌ missing |
| 1104 | Harga | Tanggal | - | ❌ missing |
| 1105 | No. Pembelian | - | ❌ missing |
| 1106 | Supplier | - | ❌ missing |
| 1107 | Qty | - | ❌ missing |
| 1108 | Harga | Tanggal | - | ❌ missing |
| 1109 | No. Pembelian | - | ❌ missing |
| 1110 | Supplier | - | ❌ missing |
| 1111 | Qty | - | ❌ missing |
| 1112 | Harga | Tanggal | - | ❌ missing |
| 1113 | No. Pembelian | - | ❌ missing |
| 1114 | Supplier | - | ❌ missing |
| 1115 | Qty | - | ❌ missing |
| 1116 | Harga | Tanggal | - | ❌ missing |
| 1117 | No. Pembelian | - | ❌ missing |
| 1118 | Supplier | - | ❌ missing |
| 1119 | Qty | - | ❌ missing |
| 1120 | Harga | Tanggal | - | ❌ missing |
| 1121 | No. Pembelian | - | ❌ missing |
| 1122 | Supplier | - | ❌ missing |
| 1123 | Qty | - | ❌ missing |
| 1124 | Harga | Tanggal | - | ❌ missing |
| 1125 | No. Pembelian | - | ❌ missing |
| 1126 | Supplier | - | ❌ missing |
| 1127 | Qty | - | ❌ missing |
| 1128 | Harga | Tanggal | - | ❌ missing |
| 1129 | No. Pembelian | - | ❌ missing |
| 1130 | Supplier | - | ❌ missing |
| 1131 | Qty | - | ❌ missing |
| 1132 | Harga | Tanggal | - | ❌ missing |
| 1133 | No. Pembelian | - | ❌ missing |
| 1134 | Supplier | - | ❌ missing |
| 1135 | Qty | - | ❌ missing |
| 1136 | Harga | Tanggal | - | ❌ missing |
| 1137 | No. Pembelian | - | ❌ missing |
| 1138 | Supplier | - | ❌ missing |
| 1139 | Qty | - | ❌ missing |
| 1140 | Harga | Tanggal | - | ❌ missing |
| 1141 | No. Pembelian | - | ❌ missing |
| 1142 | Supplier | - | ❌ missing |
| 1143 | Qty | - | ❌ missing |
| 1144 | Harga | Tanggal | - | ❌ missing |
| 1145 | No. Pembelian | - | ❌ missing |
| 1146 | Supplier | - | ❌ missing |
| 1147 | Qty | - | ❌ missing |
| 1148 | Harga | Tanggal | - | ❌ missing |
| 1149 | No. Pembelian | - | ❌ missing |
| 1150 | Supplier | - | ❌ missing |
| 1151 | Qty | - | ❌ missing |
| 1152 | Harga | Tanggal | - | ❌ missing |
| 1153 | No. Pembelian | - | ❌ missing |
| 1154 | Supplier | - | ❌ missing |
| 1155 | Qty | - | ❌ missing |
| 1156 | Harga | Tanggal | - | ❌ missing |
| 1157 | No. Pembelian | - | ❌ missing |
| 1158 | Supplier | - | ❌ missing |
| 1159 | Qty | - | ❌ missing |
| 1160 | Harga | Tanggal | - | ❌ missing |
| 1161 | No. Pembelian | - | ❌ missing |
| 1162 | Supplier | - | ❌ missing |
| 1163 | Qty | - | ❌ missing |
| 1164 | Harga | Tanggal | - | ❌ missing |
| 1165 | No. Pembelian | - | ❌ missing |
| 1166 | Supplier | - | ❌ missing |
| 1167 | Qty | - | ❌ missing |
| 1168 | Harga | Tanggal | - | ❌ missing |
| 1169 | No. Pembelian | - | ❌ missing |
| 1170 | Supplier | - | ❌ missing |
| 1171 | Qty | - | ❌ missing |
| 1172 | Harga | Tanggal | - | ❌ missing |
| 1173 | No. Pembelian | - | ❌ missing |
| 1174 | Supplier | - | ❌ missing |
| 1175 | Qty | - | ❌ missing |
| 1176 | Harga | Tanggal | - | ❌ missing |
| 1177 | No. Pembelian | - | ❌ missing |
| 1178 | Supplier | - | ❌ missing |
| 1179 | Qty | - | ❌ missing |
| 1180 | Harga | Tanggal | - | ❌ missing |
| 1181 | No. Pembelian | - | ❌ missing |
| 1182 | Supplier | - | ❌ missing |
| 1183 | Qty | - | ❌ missing |
| 1184 | Harga | Tanggal | - | ❌ missing |
| 1185 | No. Pembelian | - | ❌ missing |
| 1186 | Supplier | - | ❌ missing |
| 1187 | Qty | - | ❌ missing |
| 1188 | Harga | Tanggal | - | ❌ missing |
| 1189 | No. Pembelian | - | ❌ missing |
| 1190 | Supplier | - | ❌ missing |
| 1191 | Qty | - | ❌ missing |
| 1192 | Harga | Tanggal | - | ❌ missing |
| 1193 | No. Pembelian | - | ❌ missing |
| 1194 | Supplier | - | ❌ missing |
| 1195 | Qty | - | ❌ missing |
| 1196 | Harga | Tanggal | - | ❌ missing |
| 1197 | No. Pembelian | - | ❌ missing |
| 1198 | Supplier | - | ❌ missing |
| 1199 | Qty | - | ❌ missing |
| 1200 | Harga | Tanggal | - | ❌ missing |
| 1201 | No. Pembelian | - | ❌ missing |
| 1202 | Supplier | - | ❌ missing |
| 1203 | Qty | - | ❌ missing |
| 1204 | Harga | Tanggal | - | ❌ missing |
| 1205 | No. Pembelian | - | ❌ missing |
| 1206 | Supplier | - | ❌ missing |
| 1207 | Qty | - | ❌ missing |
| 1208 | Harga | Tanggal | - | ❌ missing |
| 1209 | No. Pembelian | - | ❌ missing |
| 1210 | Supplier | - | ❌ missing |
| 1211 | Qty | - | ❌ missing |
| 1212 | Harga | Tanggal | - | ❌ missing |
| 1213 | No. Pembelian | - | ❌ missing |
| 1214 | Supplier | - | ❌ missing |
| 1215 | Qty | - | ❌ missing |
| 1216 | Harga | Tanggal | - | ❌ missing |
| 1217 | No. Pembelian | - | ❌ missing |
| 1218 | Supplier | - | ❌ missing |
| 1219 | Qty | - | ❌ missing |
| 1220 | Harga | Tanggal | - | ❌ missing |
| 1221 | No. Pembelian | - | ❌ missing |
| 1222 | Supplier | - | ❌ missing |
| 1223 | Qty | - | ❌ missing |
| 1224 | Harga | Tanggal | - | ❌ missing |
| 1225 | No. Pembelian | - | ❌ missing |
| 1226 | Supplier | - | ❌ missing |
| 1227 | Qty | - | ❌ missing |
| 1228 | Harga | Tanggal | - | ❌ missing |
| 1229 | No. Pembelian | - | ❌ missing |
| 1230 | Supplier | - | ❌ missing |
| 1231 | Qty | - | ❌ missing |
| 1232 | Harga | Tanggal | - | ❌ missing |
| 1233 | No. Pembelian | - | ❌ missing |
| 1234 | Supplier | - | ❌ missing |
| 1235 | Qty | - | ❌ missing |
| 1236 | Harga | Tanggal | - | ❌ missing |
| 1237 | No. Pembelian | - | ❌ missing |
| 1238 | Supplier | - | ❌ missing |
| 1239 | Qty | - | ❌ missing |
| 1240 | Harga | Tanggal | - | ❌ missing |
| 1241 | No. Pembelian | - | ❌ missing |
| 1242 | Supplier | - | ❌ missing |
| 1243 | Qty | - | ❌ missing |
| 1244 | Harga | Tanggal | - | ❌ missing |
| 1245 | No. Pembelian | - | ❌ missing |
| 1246 | Supplier | - | ❌ missing |
| 1247 | Qty | - | ❌ missing |
| 1248 | Harga | Tanggal | - | ❌ missing |
| 1249 | No. Pembelian | - | ❌ missing |
| 1250 | Supplier | - | ❌ missing |
| 1251 | Qty | - | ❌ missing |
| 1252 | Harga | Tanggal | - | ❌ missing |
| 1253 | No. Pembelian | - | ❌ missing |
| 1254 | Supplier | - | ❌ missing |
| 1255 | Qty | - | ❌ missing |
| 1256 | Harga | Tanggal | - | ❌ missing |
| 1257 | No. Pembelian | - | ❌ missing |
| 1258 | Supplier | - | ❌ missing |
| 1259 | Qty | - | ❌ missing |
| 1260 | Harga | Tanggal | - | ❌ missing |
| 1261 | No. Pembelian | - | ❌ missing |
| 1262 | Supplier | - | ❌ missing |
| 1263 | Qty | - | ❌ missing |
| 1264 | Harga | Tanggal | - | ❌ missing |
| 1265 | No. Pembelian | - | ❌ missing |
| 1266 | Supplier | - | ❌ missing |
| 1267 | Qty | - | ❌ missing |
| 1268 | Harga | Tanggal | - | ❌ missing |
| 1269 | No. Pembelian | - | ❌ missing |
| 1270 | Supplier | - | ❌ missing |
| 1271 | Qty | - | ❌ missing |
| 1272 | Harga | Tanggal | - | ❌ missing |
| 1273 | No. Pembelian | - | ❌ missing |
| 1274 | Supplier | - | ❌ missing |
| 1275 | Qty | - | ❌ missing |
| 1276 | Harga | Tanggal | - | ❌ missing |
| 1277 | No. Pembelian | - | ❌ missing |
| 1278 | Supplier | - | ❌ missing |
| 1279 | Qty | - | ❌ missing |
| 1280 | Harga | Tanggal | - | ❌ missing |
| 1281 | No. Pembelian | - | ❌ missing |
| 1282 | Supplier | - | ❌ missing |
| 1283 | Qty | - | ❌ missing |
| 1284 | Harga | Tanggal | - | ❌ missing |
| 1285 | No. Pembelian | - | ❌ missing |
| 1286 | Supplier | - | ❌ missing |
| 1287 | Qty | - | ❌ missing |
| 1288 | Harga | Tanggal | - | ❌ missing |
| 1289 | No. Pembelian | - | ❌ missing |
| 1290 | Supplier | - | ❌ missing |
| 1291 | Qty | - | ❌ missing |
| 1292 | Harga | Tanggal | - | ❌ missing |
| 1293 | No. Pembelian | - | ❌ missing |
| 1294 | Supplier | - | ❌ missing |
| 1295 | Qty | - | ❌ missing |
| 1296 | Harga | Tanggal | - | ❌ missing |
| 1297 | No. Pembelian | - | ❌ missing |
| 1298 | Supplier | - | ❌ missing |
| 1299 | Qty | - | ❌ missing |
| 1300 | Harga | Tanggal | - | ❌ missing |
| 1301 | No. Pembelian | - | ❌ missing |
| 1302 | Supplier | - | ❌ missing |
| 1303 | Qty | - | ❌ missing |
| 1304 | Harga | Tanggal | - | ❌ missing |
| 1305 | No. Pembelian | - | ❌ missing |
| 1306 | Supplier | - | ❌ missing |
| 1307 | Qty | - | ❌ missing |
| 1308 | Harga | Tanggal | - | ❌ missing |
| 1309 | No. Pembelian | - | ❌ missing |
| 1310 | Supplier | - | ❌ missing |
| 1311 | Qty | - | ❌ missing |
| 1312 | Harga | Tanggal | - | ❌ missing |
| 1313 | No. Pembelian | - | ❌ missing |
| 1314 | Supplier | - | ❌ missing |
| 1315 | Qty | - | ❌ missing |
| 1316 | Harga | Tanggal | - | ❌ missing |
| 1317 | No. Pembelian | - | ❌ missing |
| 1318 | Supplier | - | ❌ missing |
| 1319 | Qty | - | ❌ missing |
| 1320 | Harga | Tanggal | - | ❌ missing |
| 1321 | No. Pembelian | - | ❌ missing |
| 1322 | Supplier | - | ❌ missing |
| 1323 | Qty | - | ❌ missing |
| 1324 | Harga | Tanggal | - | ❌ missing |
| 1325 | No. Pembelian | - | ❌ missing |
| 1326 | Supplier | - | ❌ missing |
| 1327 | Qty | - | ❌ missing |
| 1328 | Harga | Tanggal | - | ❌ missing |
| 1329 | No. Pembelian | - | ❌ missing |
| 1330 | Supplier | - | ❌ missing |
| 1331 | Qty | - | ❌ missing |
| 1332 | Harga | Tanggal | - | ❌ missing |
| 1333 | No. Pembelian | - | ❌ missing |
| 1334 | Supplier | - | ❌ missing |
| 1335 | Qty | - | ❌ missing |
| 1336 | Harga | Tanggal | - | ❌ missing |
| 1337 | No. Pembelian | - | ❌ missing |
| 1338 | Supplier | - | ❌ missing |
| 1339 | Qty | - | ❌ missing |
| 1340 | Harga | Tanggal | - | ❌ missing |
| 1341 | No. Pembelian | - | ❌ missing |
| 1342 | Supplier | - | ❌ missing |
| 1343 | Qty | - | ❌ missing |
| 1344 | Harga | Tanggal | - | ❌ missing |
| 1345 | No. Pembelian | - | ❌ missing |
| 1346 | Supplier | - | ❌ missing |
| 1347 | Qty | - | ❌ missing |
| 1348 | Harga | Tanggal | - | ❌ missing |
| 1349 | No. Pembelian | - | ❌ missing |
| 1350 | Supplier | - | ❌ missing |
| 1351 | Qty | - | ❌ missing |
| 1352 | Harga | Tanggal | - | ❌ missing |
| 1353 | No. Pembelian | - | ❌ missing |
| 1354 | Supplier | - | ❌ missing |
| 1355 | Qty | - | ❌ missing |
| 1356 | Harga | Tanggal | - | ❌ missing |
| 1357 | No. Pembelian | - | ❌ missing |
| 1358 | Supplier | - | ❌ missing |
| 1359 | Qty | - | ❌ missing |
| 1360 | Harga | Tanggal | - | ❌ missing |
| 1361 | No. Pembelian | - | ❌ missing |
| 1362 | Supplier | - | ❌ missing |
| 1363 | Qty | - | ❌ missing |
| 1364 | Harga | Tanggal | - | ❌ missing |
| 1365 | No. Pembelian | - | ❌ missing |
| 1366 | Supplier | - | ❌ missing |
| 1367 | Qty | - | ❌ missing |
| 1368 | Harga | Tanggal | - | ❌ missing |
| 1369 | No. Pembelian | - | ❌ missing |
| 1370 | Supplier | - | ❌ missing |
| 1371 | Qty | - | ❌ missing |
| 1372 | Harga | Tanggal | - | ❌ missing |
| 1373 | No. Pembelian | - | ❌ missing |
| 1374 | Supplier | - | ❌ missing |
| 1375 | Qty | - | ❌ missing |
| 1376 | Harga | Tanggal | - | ❌ missing |
| 1377 | No. Pembelian | - | ❌ missing |
| 1378 | Supplier | - | ❌ missing |
| 1379 | Qty | - | ❌ missing |
| 1380 | Harga | Tanggal | - | ❌ missing |
| 1381 | No. Pembelian | - | ❌ missing |
| 1382 | Supplier | - | ❌ missing |
| 1383 | Qty | - | ❌ missing |
| 1384 | Harga | Tanggal | - | ❌ missing |
| 1385 | No. Pembelian | - | ❌ missing |
| 1386 | Supplier | - | ❌ missing |
| 1387 | Qty | - | ❌ missing |
| 1388 | Harga | Tanggal | - | ❌ missing |
| 1389 | No. Pembelian | - | ❌ missing |
| 1390 | Supplier | - | ❌ missing |
| 1391 | Qty | - | ❌ missing |
| 1392 | Harga | Tanggal | - | ❌ missing |
| 1393 | No. Pembelian | - | ❌ missing |
| 1394 | Supplier | - | ❌ missing |
| 1395 | Qty | - | ❌ missing |
| 1396 | Harga | Tanggal | - | ❌ missing |
| 1397 | No. Pembelian | - | ❌ missing |
| 1398 | Supplier | - | ❌ missing |
| 1399 | Qty | - | ❌ missing |
| 1400 | Harga | Tanggal | - | ❌ missing |
| 1401 | No. Pembelian | - | ❌ missing |
| 1402 | Supplier | - | ❌ missing |
| 1403 | Qty | - | ❌ missing |
| 1404 | Harga | Tanggal | - | ❌ missing |
| 1405 | No. Pembelian | - | ❌ missing |
| 1406 | Supplier | - | ❌ missing |
| 1407 | Qty | - | ❌ missing |
| 1408 | Harga | Tanggal | - | ❌ missing |
| 1409 | No. Pembelian | - | ❌ missing |
| 1410 | Supplier | - | ❌ missing |
| 1411 | Qty | - | ❌ missing |
| 1412 | Harga | Tanggal | - | ❌ missing |
| 1413 | No. Pembelian | - | ❌ missing |
| 1414 | Supplier | - | ❌ missing |
| 1415 | Qty | - | ❌ missing |
| 1416 | Harga | Tanggal | - | ❌ missing |
| 1417 | No. Pembelian | - | ❌ missing |
| 1418 | Supplier | - | ❌ missing |
| 1419 | Qty | - | ❌ missing |
| 1420 | Harga | Tanggal | - | ❌ missing |
| 1421 | No. Pembelian | - | ❌ missing |
| 1422 | Supplier | - | ❌ missing |
| 1423 | Qty | - | ❌ missing |
| 1424 | Harga | Tanggal | - | ❌ missing |
| 1425 | No. Pembelian | - | ❌ missing |
| 1426 | Supplier | - | ❌ missing |
| 1427 | Qty | - | ❌ missing |
| 1428 | Harga | Tanggal | - | ❌ missing |
| 1429 | No. Pembelian | - | ❌ missing |
| 1430 | Supplier | - | ❌ missing |
| 1431 | Qty | - | ❌ missing |
| 1432 | Harga | Tanggal | - | ❌ missing |
| 1433 | No. Pembelian | - | ❌ missing |
| 1434 | Supplier | - | ❌ missing |
| 1435 | Qty | - | ❌ missing |
| 1436 | Harga | Tanggal | - | ❌ missing |
| 1437 | No. Pembelian | - | ❌ missing |
| 1438 | Supplier | - | ❌ missing |
| 1439 | Qty | - | ❌ missing |
| 1440 | Harga | Tanggal | - | ❌ missing |
| 1441 | No. Pembelian | - | ❌ missing |
| 1442 | Supplier | - | ❌ missing |
| 1443 | Qty | - | ❌ missing |
| 1444 | Harga | - | ❌ missing |

**Score**: 7/1444 (0%)

## 2. Form Inputs
| # | Spec Field | FE Present | Status |
|---|---|---|---|
| 1 | Catatan | - | ❌ missing |

**Score**: 0/1 (0%)

## 3. Card Output
_No metric cards specified_

## 4. Actions
| # | Spec Action | FE Present | Status |
|---|---|---|---|
| 1 | Riwayat | - | ❌ missing |
| 2 | Process | - | ❌ missing |
| 3 | Lihat | - | ❌ missing |
| 4 | Hide | - | ❌ missing |

**Score**: 0/4 (0%)

## 5. Detail Modal/Page
- Spec: `Modal Detail via AJAX (ajaxDetail('130','modal-lg');)`
- [id]/page.tsx: ❌
- Inline Modal: ❌
- **Status**: ❌ missing

## 6. Edit Route
- [id]/update or [id]/edit: ❌ missing (inline edit only)

## 7. Print Template
- [id]/print or print/page: ❌ MISSING (Poin 4.3 Live Audit)

## 8. Delete Flow
- Confirmation dialog: ⚠️
- Delete handler: ❌
- Audit log reference: ✅

## Conformance Score

| Dimension | Score |
|---|---|
| Table Columns | 7/1444 (0%) |
| Form Inputs | 0/1 (0%) |
| Cards | 0/0 (0%) |
| Actions | 0/4 (0%) |
| Detail | 0/1 (0%) |
| Edit | 0/1 (0%) |
| Print | 0/1 (0%) |
| **TOTAL** | **7/1452 (0%)** |

**DNA Component Adoption**: 1 components
**Mock State**: ✅ NO (none)
