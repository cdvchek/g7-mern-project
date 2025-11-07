import { useState } from "react";
import styles from "./Dashboard.module.css";

export default function DashboardHome() {
  return (
    <div className={styles.card}>
      <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12}}>
        <h3 style={{margin:0}}>ENVELOPES</h3>
        {/* add a dynamic balance val later */}
        <div style={{fontSize:14, color:"#666"}}>Balance: </div>
      </div>

      <div style={{display:"flex", gap:16, marginBottom:18}}>
        <button className={`${styles.btn} ${styles.btnPrimary}`}>Modify Envelopes</button>
        <button className={`${styles.btn} ${styles.btnPrimary}`}>Allocate Funds</button>
      </div>

      <div style={{display:"flex", gap:20}}>
        <div style={{flex:1}}>
          <div className={styles.smallCard} style={{height:160, display:"flex", alignItems:"center", justifyContent:"center"}}>Envelope Box</div>
        </div>
        <div style={{flex:1}}>
          <div className={styles.smallCard} style={{height:160, display:"flex", alignItems:"center", justifyContent:"center"}}>Envelope Box</div>
        </div>
      </div>
    </div>
  );
}
