import { useState } from "react";
import styles from "./Dashboard.module.css";

// sample transaction data, to be linked with backend later
const sampleTrans = [
  { id: 1, name: "Paycheck", account: "Checking", envelope: "Income", amount: 2500, date: "11/01/2025", sign: "+" },
  { id: 2, name: "Groceries", account: "Checking", envelope: "Groceries", amount: -84.5, date: "11/02/2025", sign: "-" },
  { id: 3, name: "Rent", account: "Checking", envelope: "Rent", amount: -1200, date: "11/03/2025", sign: "-" },
];

export default function DashboardTransactions() {
  const [transactions] = useState(sampleTrans);
  const [query, setQuery] = useState("");

  const filtered = transactions.filter(t => t.name.toLowerCase().includes(query.toLowerCase()) || t.account.toLowerCase().includes(query.toLowerCase()) || t.envelope.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className={styles.card}>
      <h3>Transaction History</h3>
      <div style={{marginTop:10, marginBottom:12}}>
        <input placeholder="Search" value={query} onChange={(e)=>setQuery(e.target.value)} style={{padding:8, width:260, borderRadius:6, border:"1px solid #ddd"}} />
      </div>

      <table style={{width:"100%", borderCollapse:"collapse"}}>
        <thead>
          <tr style={{textAlign:"left", borderBottom:"1px solid #eee"}}>
            <th style={{padding:8}}>Transaction</th>
            <th>Account</th>
            <th>Envelope</th>
            <th>Change</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(t => (
            <tr key={t.id} style={{borderBottom:"1px dashed #f0f0f0"}}>
              <td style={{padding:8}}>{t.name}</td>
              <td style={{padding:8}}>{t.account}</td>
              <td style={{padding:8}}>{t.envelope}</td>
              <td style={{padding:8, color: t.amount >=0 ? "green" : "crimson"}}>{t.amount >=0 ? `+ $${Math.abs(t.amount)}` : `- $${Math.abs(t.amount)}`}</td>
              <td style={{padding:8}}>{t.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
