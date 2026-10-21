# 🍜 食記地圖

屬於自己嘅覓食足跡地圖：記錄**幾時、去邊、食咗乜、好唔好食、有咩推介**，然後喺地圖上重溫。

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Dinis0404/Food-Map&env=DATABASE_URL,AUTH_PASSWORD,AUTH_SECRET)

![tech](https://img.shields.io/badge/Next.js%2016-React%2019-black) ![db](https://img.shields.io/badge/Postgres-Neon%20%2F%20PGlite-blue) ![deploy](https://img.shields.io/badge/deploy-Vercel-black)

## 功能

- 🗺️ **地圖主頁**：所有去過嘅餐廳變成 pin，側邊欄按最近光顧排序，點擊睇摘要卡
- ➕ **新增食記**：搜尋餐廳（OpenStreetMap geocoder，自動帶名同座標）→ 手動定位都得 → 菜式逐道記（個別評分＋⭐推介＋備註）→ 整體評分、心得、埋單價、會唔會再去
- 📔 **食記列表**：按餐廳名／日期範圍／評分／有推介篩選，三種排序
- 🏪 **餐廳檔案**：光顧次數、平均分、位置小地圖、跨光顧嘅**菜式推介榜**、歷史食記
- 🔒 **密碼登入**：全站防護（頁面 redirect 登入、API 回 401）

## 技術棧

| 層 | 選擇 |
|----|------|
| 框架 | Next.js 16（App Router）+ TypeScript + Tailwind CSS v4 |
| 地圖 | Leaflet + OpenStreetMap（地點搜尋：Photon，fallback Nominatim） |
| 資料庫 | Postgres——生產用 Neon（HTTP serverless driver），本地用 PGlite socket server |
| ORM | Drizzle ORM |
| 認證 | 密碼登入（jose 簽名 session cookie + proxy 全站防護） |
| 部署 | Vercel |

## 本地開發

```bash
npm install

# 1. 設定環境變數
cp .env.example .env.local
# .env.local 內容：
#   DATABASE_URL=postgres://localhost:5433/postgres
#   AUTH_PASSWORD=你嘅密碼
#   AUTH_SECRET=隨機字串（openssl rand -base64 32）

# 2a. 起本地資料庫 server（自動建表＋灌示範資料，保持運行）
npm run db:server

# 2b. 另一個 terminal：起 app
npm run dev
```

打開 http://localhost:3000 ，用 `AUTH_PASSWORD` 登入。

> 為咗令 Next.js 多個 render worker 共享同一份數據，本地用官方
> `pglite-socket` 起一個 Postgres wire-protocol server（好似真 Postgres 咁連），
> 同生產架構一致。資料存喺 `.pglite/` 資料夾，刪掉佢再跑 `npm run db:server`
> 就會重灌示範資料。

### 常用腳本

| 指令 | 用途 |
|------|------|
| `npm run dev` | 開發 server |
| `npm run db:server` | 本地資料庫 server（port 5433，自動建表＋示範資料） |
| `npm run build` / `npm start` | 生產 build / 運行 |
| `npm run typecheck` | TypeScript 檢查 |
| `npm run lint` | ESLint |
| `npm run db:init` | 只初始化 `.pglite/`（唔起 server） |
| `npm run db:push` | 將 schema push 去 `DATABASE_URL` 指向嘅資料庫（Neon 用） |

## 部署去 Vercel（≈ $0/月）

### 方法一：一鍵部署（推薦）

撓上面嘅 **Deploy with Vercel** 按鈕，Vercel 會叫你填三個環境變數：

| 變數 | 值 |
|------|-----|
| `DATABASE_URL` | Neon pooled connection string（下面第二步） |
| `AUTH_PASSWORD` | 你嘅登入密碼 |
| `AUTH_SECRET` | 隨機字串（`openssl rand -base64 32`） |

填完 Deploy 就得——**build 過程會自動建立資料表**（`scripts/prebuild.mjs` 偵測到 Neon 環境會自動跑 `drizzle-kit push`），之後每次 push schema 有變都會自動同步。唯一前提係要先有 Neon 資料庫（第二步）。

### 方法二：Vercel Dashboard import

GitHub 同 Vercel 已連接嘅話：Vercel → Add New → Project → 揀 `Food-Map` repo → 加同樣三個環境變數 → Deploy。

### 準備 Neon 資料庫（兩個方法都要，一次性）

1. 去 [neon.com](https://neon.com) 註冊（免費，唔使信用卡）→ Create Project（揀近嘅 region，例如 Singapore）
2. 抄 **pooled connection string**（有 `-pooler` 嗰條）填入 `DATABASE_URL`

> 唔想用自動建表嘅話，都可以喺本機手動跑：`.env.local` 改成 Neon 嘅 `DATABASE_URL` 後 `npm run db:push`。

部署完成後，每次 `git push`，Vercel 自動重新部署。

## 資料庫結構

```
restaurants（餐廳）          visits（每次光顧）              dishes（菜式）
├─ id, name                 ├─ id, restaurant_id →        ├─ id, visit_id →
├─ osm_id（防重複）          ├─ visited_at                 ├─ name
├─ address, lat, lng        ├─ overall_rating 1–5         ├─ rating（可空）
├─ cuisine                  ├─ comment                    ├─ is_recommend ⭐
└─ created_at               ├─ total_price, would_return  └─ note
                            └─ created_at
```

## 項目結構

```
src/
├─ proxy.ts                  全站登入防護（Next 16 嘅 middleware）
├─ db/{schema,index}.ts      Drizzle schema + 連線（Neon/PGlite 自動切換）
├─ lib/
│  ├─ queries.ts             所有資料庫查詢（API 同 server component 共用）
│  ├─ validators.ts          zod 輸入驗證
│  ├─ auth.ts / format.ts / constants.ts
├─ components/               地圖（Leaflet ssr:false 包裝）、表單、卡片等
└─ app/
   ├─ page.tsx               地圖主頁
   ├─ login/                 登入
   ├─ visits/                列表 / 新增 / 詳情 / 編輯
   ├─ restaurants/[id]/      餐廳檔案
   └─ api/                   auth / visits / restaurants / places/search

scripts/                     本地 db server、初始化、共用 DDL
```

## 日後想升級 Google Maps？

地圖層集中喺 `src/components/LeafletMap.tsx` + `src/app/api/places/search/route.ts`，
換 Google Maps JS API + Places API 時只要替換呢兩處，schema 已預留 `google_place_id` 欄位。

## 已知取捨

- 本地 PGlite 唔支援多進程直連，所以經 socket server（生產 Neon 冇呢個問題）
- 地點搜尋用 OSM 生態（免費無 key），冷門餐廳可能要「手動輸入＋地圖點擊」定位
- 沒有照片上傳（規劃第二階段，Vercel Blob）
