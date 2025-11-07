import { useState } from "react";
import styles from "./Dashboard.module.css";

export default function DashboardHome() {
  // temp vals
  const totalBalance = "XX,XXX.XX";
  const availableBalance = "XX,XXX.XX";

  return (
    <div style={{ width: "100%", maxWidth: "1400px" }}>
      {/* Balance Section */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-around", 
        alignItems: "center",
        marginBottom: "40px",
        gap: "40px"
      }}>
        <div style={{ flex: 1, textAlign: "center" }}>
          <h2 style={{ 
            fontSize: "28px", 
            fontWeight: "400", 
            margin: "0 0 20px 0",
            color: "#222"
          }}>
            Total Balance: ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h2>
          <button 
            className={`${styles.btn} ${styles.btnPrimary}`}
            style={{ 
              fontSize: "18px", 
              padding: "14px 32px",
              borderRadius: "50px"
            }}
          >
            Transfer Funds
          </button>
        </div>

        <div style={{ flex: 1, textAlign: "center" }}>
          <h2 style={{ 
            fontSize: "28px", 
            fontWeight: "400", 
            margin: "0 0 20px 0",
            color: "#222"
          }}>
            Available Balance: ${availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h2>
          <button 
            className={`${styles.btn} ${styles.btnPrimary}`}
            style={{ 
              fontSize: "18px", 
              padding: "14px 32px",
              borderRadius: "50px"
            }}
          >
            Allocate Funds
          </button>
        </div>
      </div>

      {/* Content Boxes */}
      <div style={{ 
        display: "flex", 
        gap: "40px",
        justifyContent: "center"
      }}>
        <div style={{
          width: "480px",
          height: "280px",
          border: "2px solid #222",
          borderRadius: "8px",
          backgroundColor: "#fff"
        }}>
          {/* Placeholder box - add content later */}
        </div>

        <div style={{
          width: "480px",
          height: "280px",
          border: "2px solid #222",
          borderRadius: "8px",
          backgroundColor: "#fff"
        }}>
          {/* Placeholder box - add content later */}
        </div>
      </div>
    </div>
  );
}