# Distributed Systems Labs — React (RPC & Lamport RA)

A modern, deploy-ready React app (Vite + Tailwind) showcasing two classic distributed systems concepts:

- **Remote Procedure Call (RPC) Demo** — Simulates remote calls with latency, request/response logs, and a live latency chart.
- **Lamport’s Distributed Mutual Exclusion (Ricart–Agrawala)** — Interactive visualization with animated REQUEST/REPLY messages, process state cards, and optional step mode.

> Built as a **static SPA**. No backend required. Perfect for **Netlify**.

---

## ✨ Features

- **Beautiful UI** with Tailwind and subtle Framer Motion animations
- **RPC**: adjustable latency, toasts on result, and mini **Recharts** latency graph
- **Lamport RA**: circular network layout, animated packets, per-process stats, step-by-step mode
- **Beginner-friendly “How it works”** sections for both features
- SPA-friendly redirects for Netlify

---

## 🧰 Tech Stack

- React 18 + Vite
- Tailwind CSS
- Framer Motion (animations)
- React Hot Toast (notifications)
- Recharts (charts)

---

## 🚀 Quick Start

```bash
# 1) Install dependencies
npm install

# 2) Start dev server
npm run dev
# Vite will print a local URL like http://localhost:5173

# 3) Build for production
npm run build

# 4) Preview the production build
npm run preview
```

> **Node version**: 18+ recommended.

---

## 📁 Project Structure

```
.
├── index.html
├── netlify.toml
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── src
│   ├── index.css
│   ├── main.jsx
│   ├── App.jsx
│   └── components
│       ├── RPCDemo.jsx
│       └── LamportRA.jsx
└── public
    └── _redirects
```

> If your files are currently at the repo root, place `App.jsx`, `index.css`, `main.jsx`, and component files under `src/`, and update imports if needed.

---

## 🧪 What You’ll See

### RPC Demo
- Choose a method (`ping`, `add`, `sub`, `mul`, `fact`, `reverse`, `upper`)
- Press **Call RPC** → see a toast with the result and latency
- Watch the **latency chart** update in real-time
- View recent request/response JSON in the log

### Lamport RA
- Set **# of processes**, **CS entries per process**, and **Step mode**
- Press **Start** → watch purple **REQUEST** and green **REPLY** packets animate
- Process cards show Lamport clocks, deferred list, replies needed, and CS count
- In **Step mode**, press **Next step** to walk through key moments

---

---

## 🌐 Deploy to Netlify

1. Push your repo to GitHub/GitLab.
2. On Netlify, **New site from Git** → connect your repo.
3. Build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
4. Ensure SPA redirects are set:
   - File `public/_redirects` with:
     ```
     /* /index.html 200
     ```
   - Or keep the included `netlify.toml`:
     ```toml
     [build]
       command = "npm run build"
       publish = "dist"

     [[redirects]]
       from = "/*"
       to = "/index.html"
       status = 200
     ```
5. Live Demo You can see a live version of this project here: [https://stalwart-gingersnap-d278de.netlify.app/](https://adorable-genie-a85811.netlify.app/).

---

---
