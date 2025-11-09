import { useEffect, useState } from "react";
import styles from "./Dashboard.module.css";
import BanksList from "./BanksList";
import BankDetail from "./BankDetail";
// TODO: wire these to real endpoints
// import {
//   getMyBanksAPI,
//   createBankAPI,
//   getAccountsForBankAPI,
//   setAccountTrackingAPI,
// } from "../api";

// fallback sample
const sampleBanks = [
  { id: "b1", name: "Chase", institution: "chase" },
  { id: "b2", name: "Bank of America", institution: "bofa" },
];
const sampleAccounts = {
  b1: [
    { id: "a1", name: "Chase Checking", type: "Checking", balance: 4200, tracking: true },
    { id: "a2", name: "Chase Savings", type: "Savings", balance: 9800, tracking: false },
  ],
  b2: [
    { id: "a3", name: "BoA Checking", type: "Checking", balance: 1500, tracking: true },
  ],
};

export default function DashboardAccounts() {
  const [banks, setBanks] = useState([]);
  const [activeBankId, setActiveBankId] = useState(null);
  const [accountsByBank, setAccountsByBank] = useState({}); // { bankId: Account[] }
  const [loading, setLoading] = useState(false);

  async function fetchBanks() {
    try {
      setLoading(true);
      const res = await getMyBanksAPI();
      setBanks(res?.data ?? sampleBanks);
    } catch {
      setBanks(sampleBanks);
    } finally {
      setLoading(false);
    }
  }

  async function fetchAccounts(bankId) {
    // cache if present
    if (accountsByBank[bankId]) return;
    try {
      const res = await getAccountsForBankAPI(bankId);
      setAccountsByBank((m) => ({ ...m, [bankId]: res?.data ?? sampleAccounts[bankId] ?? [] }));
    } catch {
      setAccountsByBank((m) => ({ ...m, [bankId]: sampleAccounts[bankId] ?? [] }));
    }
  }

  useEffect(() => { fetchBanks(); }, []);

  async function handleOpenBank(bank) {
    setActiveBankId(bank.id);
    await fetchAccounts(bank.id);
  }

  async function handleAddBank(payload) {
    // optimistic add
    const temp = { id: `tmp-${Date.now()}`, name: payload.name, institution: payload.institution || "" };
    setBanks((b) => [...b, temp]);
    try {
      await createBankAPI(payload);
      await fetchBanks();
    } catch {
      // roll back on error
      setBanks((b) => b.filter((x) => x.id !== temp.id));
    }
  }

  async function handleToggleTracking(bankId, accountId, next) {
    // optimistic update
    setAccountsByBank((m) => ({
      ...m,
      [bankId]: (m[bankId] || []).map((a) => a.id === accountId ? { ...a, tracking: next } : a),
    }));
    try {
      await setAccountTrackingAPI(bankId, accountId, next);
    } catch {
      // rollback
      setAccountsByBank((m) => ({
        ...m,
        [bankId]: (m[bankId] || []).map((a) => a.id === accountId ? { ...a, tracking: !next } : a),
      }));
    }
  }

  const activeBank = activeBankId ? banks.find((b) => String(b.id) === String(activeBankId)) : null;
  const activeAccounts = activeBankId ? (accountsByBank[activeBankId] || []) : [];

  return (
    <div className={styles.card}>
      {activeBank ? (
        <BankDetail
          styles={styles}
          bank={activeBank}
          accounts={activeAccounts}
          onBack={() => setActiveBankId(null)}
          onToggle={(accId, next) => handleToggleTracking(activeBank.id, accId, next)}
        />
      ) : (
        <BanksList
          styles={styles}
          banks={banks}
          loading={loading}
          onOpenBank={handleOpenBank}
          onAddBank={handleAddBank}
        />
      )}
    </div>
  );
}
