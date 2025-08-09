import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

function createMockRPCServer(latencyMin = 150, latencyMax = 450) {
  const api = {
    add: (a, b) => a + b,
    sub: (a, b) => a - b,
    mul: (a, b) => a * b,
    fact: (n) => {
      if (n < 0) throw new Error("n must be >= 0");
      let f = 1;
      for (let i = 2; i <= n; i++) f *= i;
      return f;
    },
    reverse: (s) => [...String(s)].reverse().join(""),
    upper: (s) => String(s).toUpperCase(),
    ping: () => "pong",
  };
  async function call(method, args) {
    const latency = latencyMin + Math.random() * (latencyMax - latencyMin);
    await new Promise((r) => setTimeout(r, latency));
    if (!api[method]) throw new Error("Method not found");
    const result = api[method](...args);
    return { ok: true, result, latency: Math.round(latency) };
  }
  return { call };
}

const Field = ({ label, value, onChange, type="text" }) => (
  <label className="flex flex-col gap-1 text-sm">
    <span className="label">{label}</span>
    <input type={type} className="input" value={value} onChange={(e) => onChange(e.target.value)} />
  </label>
);

export default function RPCDemo() {
  const [latencyMin, setLatencyMin] = useState(150);
  const [latencyMax, setLatencyMax] = useState(450);
  const server = useMemo(() => createMockRPCServer(latencyMin, latencyMax), [latencyMin, latencyMax]);

  const [method, setMethod] = useState("add");
  const [a, setA] = useState("5");
  const [b, setB] = useState("7");
  const [n, setN] = useState("6");
  const [s, setS] = useState("distributed systems");
  const [log, setLog] = useState([]);
  const [busy, setBusy] = useState(false);

  const makeCall = async () => {
    setBusy(true);
    const payload = (() => {
      switch (method) {
        case "add":
        case "sub":
        case "mul": return [Number(a), Number(b)];
        case "fact": return [Number(n)];
        case "reverse":
        case "upper": return [s];
        case "ping": return [];
        default: return [];
      }
    })();
    const req = { method, args: payload };
    try {
      const res = await server.call(method, payload);
      setLog((old) => [{ t: Date.now(), req, res }, ...old].slice(0, 100));
      toast.success(`${method} → ${JSON.stringify(res.result)} (${res.latency} ms)`);
    } catch (err) {
      setLog((old) => [{ t: Date.now(), req, res: { ok: false, error: err.message } }, ...old].slice(0, 100));
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const chartData = [...log].reverse().map((x, i) => ({ i, latency: x.res?.latency ?? 0 }));

  return (
    <div className="space-y-6">
      <motion.div layout className="grid lg:grid-cols-3 gap-4">
        <div className="card p-4 space-y-3">
          <div className="text-sm font-medium">RPC Controls</div>
          <label className="flex flex-col gap-1 text-sm">
            <span className="label">Method</span>
            <select value={method} onChange={(e) => setMethod(e.target.value)} className="select">
              <option>ping</option>
              <option>add</option>
              <option>sub</option>
              <option>mul</option>
              <option>fact</option>
              <option>reverse</option>
              <option>upper</option>
            </select>
          </label>

          {["add", "sub", "mul"].includes(method) && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="a" value={a} onChange={setA} type="number" />
              <Field label="b" value={b} onChange={setB} type="number" />
            </div>
          )}
          {method === "fact" && <Field label="n" value={n} onChange={setN} type="number" />}
          {["reverse", "upper"].includes(method) && <Field label="s" value={s} onChange={setS} />}

          <button onClick={makeCall} disabled={busy} className="btn w-full">{busy ? "Calling..." : "Call RPC"}</button>
        </div>

        <div className="card p-4 space-y-3">
          <div className="text-sm font-medium">Network Settings</div>
          <div className="grid grid-cols-2 gap-3 items-center">
            <label className="label col-span-2">Latency range (ms)</label>
            <input type="range" min="50" max="1000" value={latencyMin} onChange={(e)=>setLatencyMin(Number(e.target.value))} />
            <input type="range" min="50" max="1500" value={latencyMax} onChange={(e)=>setLatencyMax(Number(e.target.value))} />
            <div className="small col-span-2">Min: {latencyMin} ms • Max: {latencyMax} ms</div>
          </div>
          <div className="small">TIP: Adjust latency to see chart changes in real-time.</div>
        </div>

        <div className="card p-4 space-y-3">
          <div className="text-sm font-medium">Latency (last N calls)</div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="i" hide />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="latency" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      <motion.section layout className="grid md:grid-cols-2 gap-4">
        <div className="card p-3">
          <div className="font-medium mb-2">How it works</div>
          <ol className="small list-decimal pl-5 space-y-1">
  <li>You choose a method (like <code>add</code> or <code>fact</code>) and fill the inputs.</li>
  <li>When you click <b>Call RPC</b>, the app creates a request: <code>{"{ method, args }"}</code>.</li>
  <li>We pretend to send that request to a server (we also add a small random delay to feel like a network call).</li>
  <li>The “server” runs the function and calculates the answer.</li>
  <li>It sends back a response with the result and how many milliseconds it took.</li>
  <li>We show a toast with the result, add the request/response to the log, and update the latency chart.</li>
</ol>

        </div>
        <div className="card p-3">
          <div className="font-medium mb-2">Recent Calls</div>
          <ul className="text-xs space-y-2 max-h-48 overflow-auto">
            {log.slice(0, 8).map((item, idx) => (
              <li key={item.t + '-' + idx} className="p-2 rounded-lg bg-white border border-slate-200">
                <div>req: <code className="whitespace-pre">{JSON.stringify(item.req)}</code></div>
                <div className="mt-1">res: <code className="whitespace-pre">{JSON.stringify(item.res)}</code></div>
              </li>
            ))}
          </ul>
        </div>
      </motion.section>
    </div>
  );
}
