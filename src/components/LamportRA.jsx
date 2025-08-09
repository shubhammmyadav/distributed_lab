import React, { useRef, useState, useMemo } from "react";
import { motion } from "framer-motion";

function makeBus(n) {
  const queues = Array.from({ length: n }, () => []);
  return {
    send(dst, msg) { queues[dst].push(msg); },
    broadcast(src, msg) { for (let i=0;i<n;i++) if (i!==src) queues[i].push({ ...msg }); },
    recv(pid) { return queues[pid].shift(); },
    has(pid) { return queues[pid].length > 0; },
    queues,
  };
}
const sleep = (ms) => new Promise((r)=>setTimeout(r, ms));

function useCircleLayout(n, r=150, cx=240, cy=180) {
  return useMemo(() => {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const angle = (2 * Math.PI * i) / n - Math.PI/2;
      pts.push({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
    }
    return pts;
  }, [n, r, cx, cy]);
}

export default function LamportRA() {
  const [n, setN] = useState(4);
  const [entries, setEntries] = useState(2);
  const [step, setStep] = useState(false);
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState([]);
  const [state, setState] = useState([]);
  const [packets, setPackets] = useState([]);
  const gate = useRef({ resolve: null });

  const layout = useCircleLayout(n, 150, 240, 180);

  const addLog = (s) => setLog((old) => [{ t: Date.now(), s }, ...old].slice(0, 250));
  const waitGate = async (label) => {
    if (!step) return;
    addLog(`[STEP] ${label} — click "Next step"`);
    await new Promise((resolve) => (gate.current.resolve = resolve));
    gate.current.resolve = null;
  };
  const nextStep = () => gate.current.resolve && gate.current.resolve();

  function fly(src, dst, kind) {
    const id = Math.random().toString(36).slice(2);
    const p = { id, src, dst, kind, t: Date.now() };
    setPackets((old) => [...old, p]);
    setTimeout(() => setPackets((old) => old.filter(x => x.id !== id)), 900);
  }

  const start = async () => {
    setRunning(true);
    setLog([]);
    const bus = makeBus(n);
    const procs = Array.from({ length: n }, (_, pid) => ({
      pid, clock: 0, requesting: false, requestTs: null, deferred: [], repliesNeeded: 0, done: 0,
    }));
    setState(procs.map(p => ({...p})));

    const tick = (p, otherTs=0) => { p.clock = Math.max(p.clock, otherTs) + 1; return p.clock; };

    const handle = async (p, msg) => {
      tick(p, msg.ts);
      if (msg.kind === "REQUEST") {
        const myReq = [p.requestTs ?? Number.POSITIVE_INFINITY, p.pid];
        const otherReq = [msg.req_ts, msg.src];
        if (!p.requesting || (otherReq[0] < myReq[0] || (otherReq[0] === myReq[0] && otherReq[1] < myReq[1]))) {
          fly(p.pid, msg.src, "REPLY");
          bus.send(msg.src, { kind: "REPLY", ts: tick(p), src: p.pid });
          addLog(`[P${p.pid}] REPLY → P${msg.src}`);
        } else {
          p.deferred.push(msg.src);
          addLog(`[P${p.pid}] DEFER → P${msg.src}`);
        }
      } else if (msg.kind === "REPLY") {
        p.repliesNeeded -= 1;
      }
    };

    const requestCS = async (p) => {
      p.requesting = true;
      p.requestTs = tick(p);
      p.repliesNeeded = n - 1;
      for (let q = 0; q < n; q++) if (q !== p.pid) fly(p.pid, q, "REQUEST");
      bus.broadcast(p.pid, { kind: "REQUEST", ts: p.clock, src: p.pid, req_ts: p.requestTs });
      addLog(`[P${p.pid}] REQUEST(ts=${p.requestTs})`);
      await waitGate(`P${p.pid} broadcast REQUEST`);
    };

    const releaseCS = async (p) => {
      p.requesting = false;
      p.requestTs = null;
      for (const q of p.deferred.splice(0)) {
        fly(p.pid, q, "REPLY");
        bus.send(q, { kind: "REPLY", ts: tick(p), src: p.pid });
        addLog(`[P${p.pid}] REPLY deferred → P${q}`);
      }
      bus.broadcast(p.pid, { kind: "RELEASE", ts: tick(p), src: p.pid });
    };

    const loops = procs.map((p) => (async () => {
      for (let k = 0; k < entries; k++) {
        await sleep(40 + Math.random() * 80 * (p.pid + 1));
        await requestCS(p);
        while (p.repliesNeeded > 0) {
          if (bus.has(p.pid)) {
            const msg = bus.recv(p.pid);
            if (msg.kind === "REPLY") fly(msg.src, p.pid, "REPLY");
            await handle(p, msg);
          } else {
            await sleep(10);
          }
          setState(procs.map(x => ({...x})));
        }
        addLog(`[P${p.pid}] >>> ENTER CS @L${p.clock}`);
        await waitGate(`P${p.pid} ENTER CS`);
        await sleep(60 + Math.random() * 80);
        tick(p);
        addLog(`[P${p.pid}] <<< EXIT  CS @L${p.clock}`);
        await waitGate(`P${p.pid} EXIT CS`);
        await releaseCS(p);
        p.done += 1;
        setState(procs.map(x => ({...x})));
      }
    })());
    await Promise.all(loops);
    setRunning(false);
    addLog("Simulation finished.");
  };

  return (
  <div className="space-y-6">
    {/* SECTION 1: Controls + Network (3-col like RPC) */}
    <div className="grid lg:grid-cols-3 gap-4">
      {/* Controls */}
      <div className="card p-4 space-y-3">
        <div className="text-sm font-medium">Simulation Controls</div>
        <label className="flex flex-col gap-1 text-sm">
          <span className="label"># Processes</span>
          <input
            type="number"
            min={2}
            max={10}
            value={n}
            onChange={(e)=>setN(Number(e.target.value))}
            className="input"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="label">CS entries per process</span>
          <input
            type="number"
            min={1}
            max={10}
            value={entries}
            onChange={(e)=>setEntries(Number(e.target.value))}
            className="input"
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={step} onChange={(e)=>setStep(e.target.checked)} />
          <span className="text-slate-700">Step mode</span>
        </label>

        <div className="flex gap-2">
          {!running ? (
            <button onClick={start} className="btn w-full">Start</button>
          ) : (
            <button disabled className="px-4 py-2 rounded-xl bg-slate-300 text-white w-full">Running...</button>
          )}
          {step && (
            <button
              onClick={()=>gate.current.resolve && gate.current.resolve()}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Next step
            </button>
          )}
        </div>
      </div>

      {/* Network (span 2) */}
      <div className="card p-3 lg:col-span-2">
        <div className="font-medium mb-2">Network</div>
        <svg
          viewBox="0 0 480 360"
          className="w-full h-[360px] bg-slate-50 rounded-xl border border-slate-200"
        >
          {/* nodes */}
          {layout.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="24" className="fill-white stroke-slate-300" strokeWidth="2" />
              <text x={p.x} y={p.y+4} textAnchor="middle" className="text-[12px] fill-slate-800">P{i}</text>
            </g>
          ))}
          {/* packets */}
          {packets.map((pk) => {
            const a = layout[pk.src], b = layout[pk.dst];
            return (
              <motion.circle
                key={pk.id}
                initial={{ cx: a.x, cy: a.y, r: 5, opacity: 0.9 }}
                animate={{ cx: b.x, cy: b.y, opacity: 0.2 }}
                transition={{ duration: 0.9 }}
                className={pk.kind === "REQUEST" ? "fill-indigo-500" : "fill-emerald-500"}
              />
            );
          })}
        </svg>
        <div className="small mt-2">
          Dots animate along edges: <span className="text-indigo-600">REQUEST</span> and <span className="text-emerald-600">REPLY</span>.
        </div>
      </div>
    </div>

    {/* SECTION 2: How it works + Processes (2-col like RPC) */}
    <div className="grid md:grid-cols-2 gap-4">
      {/* How it works */}
      <div className="card p-3">
        <div className="font-medium mb-2">How it works</div>
        <ol className="small list-decimal pl-5 space-y-1">
          <li>There are N processes (P0, P1, …). Each has a <b>Lamport clock</b> starting at 0.</li>
          <li>When a process wants the Critical Section (CS), it:
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>ticks its clock,</li>
              <li>sends a <b>REQUEST</b> to everyone with <code>(timestamp, pid)</code>.</li>
            </ul>
          </li>
          <li>On receiving a REQUEST, another process decides:
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li><b>Reply now</b> if it’s not waiting, or the requester has <b>older</b> priority.</li>
              <li><b>Defer reply</b> if it’s waiting and its own <code>(timestamp, pid)</code> is <b>smaller</b>.</li>
            </ul>
          </li>
          <li>The requester waits until it gets a <b>REPLY</b> from everyone.</li>
          <li>Then it <b>enters the CS</b> (only one at a time).</li>
          <li>On exit, it sends any <b>deferred REPLY</b> (and we also broadcast <b>RELEASE</b> for clarity).</li>
          <li><b>Who goes first?</b> Smallest <code>(timestamp, pid)</code>; ties break by smaller <code>pid</code>.</li>
          <li>In this UI:
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>Purple dots = <b>REQUEST</b>, green dots = <b>REPLY</b>.</li>
              <li>Cards show clocks, deferred list, replies needed, CS count.</li>
              <li><b>Step mode</b> pauses at key moments (use “Next step”).</li>
            </ul>
          </li>
        </ol>
      </div>

      {/* Processes */}
      <div className="card p-3">
        <div className="font-medium mb-2">Processes</div>
        <div className="grid sm:grid-cols-2 gap-3">
          {state.map((p) => (
            <div key={p.pid} className="p-3 rounded-xl bg-white border border-slate-200">
              <div className="text-sm font-medium">P{p.pid}</div>
              <div className="small mt-1">LClock: {p.clock}</div>
              <div className="small">Requesting: {String(p.requesting)}</div>
              <div className="small">Req TS: {p.requestTs ?? "-"}</div>
              <div className="small">Deferred: [{p.deferred.join(", ")}]</div>
              <div className="small">Replies needed: {p.repliesNeeded}</div>
              <div className="small">CS done: {p.done}</div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* SECTION 3: Event Log (full-width like a third card) */}
    <div className="card p-3">
      <div className="font-medium mb-2">Event Log</div>
      <ul className="text-xs space-y-2 max-h-[240px] overflow-auto">
        {log.map((x, i) => (
          <li key={x.t + "-" + i} className="p-2 rounded-lg bg-white border border-slate-200">{x.s}</li>
        ))}
      </ul>
    </div>
  </div>
);
}
