import { useState, useEffect } from "react";
import styles from "./Dashboard.module.css";
import FormInput from "./FormInput";
import { getMyEnvelopesAPI } from "../api";

//this is test example data, has to be linked with plaid later
//balance formatting needs fixing, only accepts integers in perfect format i.e. 1200 but not 1200.00 or 1,200
const sample = [
    { id: 1, name: "Groceries", goal: 500, balance: 220, desc: "Weekly groceries" },
    { id: 2, name: "Rent", goal: 1200, balance: 1200, desc: "Monthly rent" },
];

export default function DashboardEnvelopes() {
    const [envelopes, setEnvelopes] = useState(sample);
    const [mode, setMode] = useState("create");
    const [selected, setSelected] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ name: "", goal: "", desc: "" });
    const [showAllocate, setShowAllocate] = useState(false);
    const [alloc, setAlloc] = useState({ targetId: null, amount: "" });

    const fetchEnvelopes = async () => {
        const res = await getMyEnvelopesAPI();
        console.log(res);
    }

    useEffect(() => {
        fetchEnvelopes();
    }, [])

    function openAdd() {
        setMode("create");
        setForm({ name: "", goal: "", desc: "" });
        setShowForm(true);
    }
    function openModify(e) {
        setMode("modify");
        setSelected(e);
        setForm({ name: e.name, goal: e.goal, desc: e.desc });
        setShowForm(true);
    }
    function saveEnvelope() {
        if (mode === "create") {
            setEnvelopes((s) => [...s, { id: Date.now(), name: form.name || "New", goal: Number(form.goal || 0), balance: 0, desc: form.desc }]);
        } else {
            setEnvelopes((s) => s.map((x) => (x.id === selected.id ? { ...x, name: form.name, goal: Number(form.goal), desc: form.desc } : x)));
        }
        setShowForm(false);
    }
    function deleteEnv(id) {
        setEnvelopes((s) => s.filter((x) => x.id !== id));
    }
    function openAllocate(env) {
        setAlloc({ targetId: env.id, amount: "" });
        setShowAllocate(true);
    }
    function doAllocate() {
        setEnvelopes((s) => s.map((x) => (x.id === alloc.targetId ? { ...x, balance: Number(x.balance) + Number(alloc.amount || 0) } : x)));
        setShowAllocate(false);
    }

    return (
        <div className={styles.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3>Envelopes</h3>
                <div style={{ display: "flex", gap: 8 }}>
                    <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={openAdd}>Add Envelope</button>
                </div>
            </div>

            <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
                {envelopes.map((e) => (
                    <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #eee", padding: 12, borderRadius: 6 }}>
                        <div>
                            <div style={{ fontWeight: 700 }}>{e.name}</div>
                            <div style={{ fontSize: 12, color: "#666" }}>{e.desc}</div>
                            <div style={{ marginTop: 6 }}>Balance: ${e.balance} • Goal: ${e.goal}</div>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => openAllocate(e)}>Allocate</button>
                            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => openModify(e)}>Modify</button>
                            <button className={`${styles.btn} ${styles.btnAccent}`} onClick={() => deleteEnv(e.id)}>Delete</button>
                        </div>
                    </div>
                ))}
            </div>

            {showForm && (
                <div style={{ marginTop: 16, borderTop: "1px solid #eee", paddingTop: 12 }}>
                    <h4>{mode === "create" ? "Create Envelope" : "Modify Envelope"}</h4>
                    <div style={{ display: "grid", gap: 8, maxWidth: 420 }}>
                        <label style={{ fontSize: 12, color: "#666" }}>Envelope Name</label>
                        <input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} className="inputBasic" placeholder="Name *" />
                        <label style={{ fontSize: 12, color: "#666" }}>Allocation Goal</label>
                        <input value={form.goal} onChange={(e) => setForm(f => ({ ...f, goal: e.target.value }))} className="inputBasic" placeholder="$X,XXX.XX" />
                        <label style={{ fontSize: 12, color: "#666" }}>Envelope Description</label>
                        <input value={form.desc} onChange={(e) => setForm(f => ({ ...f, desc: e.target.value }))} className="inputBasic" placeholder="Provide A Short Description" />
                        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={saveEnvelope}>{mode === "create" ? "ADD ENVELOPE" : "MODIFY ENVELOPE"}</button>
                            <button className={`${styles.btn} ${styles.btnAccent}`} onClick={() => setShowForm(false)}>{mode === "create" ? "DISCARD ENVELOPE" : "DELETE ENVELOPE"}</button>
                        </div>
                    </div>
                </div>
            )}

            {showAllocate && (
                <div style={{ marginTop: 18, background: "#fafafa", padding: 12, borderRadius: 6, border: "1px solid #eee", maxWidth: 360 }}>
                    <h4>Allocate Funds</h4>
                    <label style={{ fontSize: 12, color: "#666" }}>Target Envelope</label>
                    <select value={alloc.targetId} onChange={(e) => setAlloc(a => ({ ...a, targetId: Number(e.target.value) }))} style={{ padding: 8 }}>
                        {envelopes.map(en => <option key={en.id} value={en.id}>{en.name}</option>)}
                    </select>
                    <label style={{ fontSize: 12, color: "#666", marginTop: 8 }}>Amount</label>
                    <input value={alloc.amount} onChange={(e) => setAlloc(a => ({ ...a, amount: e.target.value }))} placeholder="$X,XXX.XX" style={{ padding: 8 }} />
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                        <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={doAllocate}>Allocate Funds</button>
                        <button className={`${styles.btn} ${styles.btnAccent}`} onClick={() => setShowAllocate(false)}>Cancel</button>
                    </div>
                </div>
            )}
        </div>
    );
}
