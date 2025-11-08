import { useState } from "react";
import styles from "./Dashboard.module.css";
import FormInput from "./FormInput";

// example test acc data, to be linked with plaid later
const sampleAccounts = [
  { id: 1, name: "Checking", balance: 4200, type: "Checking", tracking: true },
  { id: 2, name: "Savings", balance: 9800, type: "Savings", tracking: false },
];

export default function DashboardAccounts() {
  const [accounts, setAccounts] = useState(sampleAccounts);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", type: "Checking" });

  function openAdd() {
    setEditing(null);
    setForm({ name: "", type: "Checking" });
    setShowAdd(true);
  }
  function openEdit(a) {
    setEditing(a.id);
    setForm({ name: a.name, type: a.type });
    setShowAdd(true);
  }
  function save() {
    if (editing) {
      setAccounts((s) => s.map((x) => (x.id === editing ? { ...x, name: form.name, type: form.type } : x)));
    } else {
      setAccounts((s) => [...s, { id: Date.now(), name: form.name || "New", type: form.type, balance: 0, tracking: false }]);
    }
    setShowAdd(false);
  }
  function del(id) {
    setAccounts((s) => s.filter((a) => a.id !== id));
  }

  return (
    <div className={styles.card}>
      <h3>Connected Bank Accounts</h3>
      <div style={{display:"grid", gap:12, marginTop:12}}>
        {accounts.map((a) => (
          <div key={a.id} style={{display:"flex", justifyContent:"space-between", alignItems:"center", border:"1px solid #eee", padding:12, borderRadius:6}}>
            <div>
              <div style={{fontWeight:700}}>{a.name}</div>
              <div style={{fontSize:12, color:"#666"}}>{a.type}</div>
              <div style={{fontSize:14, marginTop:6}}>${a.balance.toLocaleString()}</div>
            </div>
            <div style={{display:"flex", gap:8, alignItems:"center"}}>
              <label style={{display:"flex", gap:6, alignItems:"center", fontSize:13}}>
                <input type="checkbox" checked={a.tracking} onChange={() => setAccounts((s)=>s.map(x=>x.id===a.id?{...x, tracking:!x.tracking}:x))} />
                Enable Tracking
              </label>
              <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => openEdit(a)}>Modify</button>
            </div>
          </div>
        ))}
      </div>

      <div style={{marginTop:18}}>
        <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={openAdd}>Add Account</button>
      </div>

      {showAdd && (
        <div style={{marginTop:18, borderTop:"1px solid #eee", paddingTop:12}}>
          <h4>{editing ? "Modify Account" : "Add Account"}</h4>
          <FormInput label="Account Name" placeholder="Name *" value={form.name} onChange={(v)=>setForm(f=>({...f,name:v}))} />
          <div style={{display:"flex", gap:8, alignItems:"center", marginBottom:12}}>
            <label><input type="radio" name="type" checked={form.type==="Checking"} onChange={()=>setForm(f=>({...f,type:"Checking"}))} /> Checking</label>
            <label><input type="radio" name="type" checked={form.type==="Savings"} onChange={()=>setForm(f=>({...f,type:"Savings"}))} /> Savings</label>
            <label><input type="radio" name="type" checked={form.type==="Credit"} onChange={()=>setForm(f=>({...f,type:"Credit"}))} /> Credit</label>
            <label><input type="radio" name="type" checked={form.type==="Other"} onChange={()=>setForm(f=>({...f,type:"Other"}))} /> Other</label>
          </div>
          <div style={{display:"flex", gap:8}}>
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={save}>{editing ? "MODIFY ACCOUNT" : "ADD ACCOUNT"}</button>
            <button className={`${styles.btn} ${styles.btnAccent}`} onClick={()=>setShowAdd(false)}>{editing ? "DELETE ACCOUNT" : "DISCARD ACCOUNT"}</button>
          </div>
        </div>
      )}
    </div>
  );
}
