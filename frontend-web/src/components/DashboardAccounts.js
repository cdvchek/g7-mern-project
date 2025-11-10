"use client";

import { useEffect, useState } from "react";
import { usePlaidLink } from "react-plaid-link";
import styles from "./Dashboard.module.css";
import BanksList from "./BanksList";
import BankDetail from "./BankDetail";

import {
    getBanksAPI,
    getAccountsFromBankAPI,
    setAccountTrackingAPI,
    deleteBankAPI,
    createLinkTokenAPI,
    exchangeLinkTokenAPI,
} from "../api";

export default function DashboardAccounts() {
    const [banks, setBanks] = useState([]);
    const [activeBankId, setActiveBankId] = useState(null);
    const [accountsByBank, setAccountsByBank] = useState({}); // { bankId: Account[] }
    const [loading, setLoading] = useState(false);

    // ---- Plaid Link state (single instance here) ----
    const [linkToken, setLinkToken] = useState(null);
    const [wantOpen, setWantOpen] = useState(false);
    const [starting, setStarting] = useState(false);

    const { open, ready } = usePlaidLink({
        token: linkToken || "",
        onSuccess: async (public_token, metadata) => {
            console.log("Token:", public_token, "Metadata:", metadata);

            try {
                const institution = metadata.institution;
                await exchangeLinkTokenAPI({ public_token, institution });
                await fetchBanks(); // refresh list after successful exchange
            } finally {
                setLinkToken(null);
                setWantOpen(false);
            }
        },
        onExit: () => {
            setLinkToken(null);
            setWantOpen(false);
        },
    });

    useEffect(() => {
        if (wantOpen && linkToken && ready) {
            open();
            setStarting(false);
        }
    }, [wantOpen, linkToken, ready, open]);

    async function startPlaid() {
        try {
            setStarting(true);
            const res = await createLinkTokenAPI();
            const token = res.data.link_token;
            if (!token) throw new Error("No link token returned");
            setLinkToken(token);
            setWantOpen(true);
        } catch (e) {
            console.error("START PLAID ERROR:", e);
            setStarting(false);
        }
    }

    // ---- Data fetching ----
    async function fetchBanks() {
        setLoading(true);
        try {
            const res = await getBanksAPI();
            setBanks(res.data);
        } catch {
            setBanks([]);
        } finally {
            setLoading(false);
        }
    }

    async function fetchAccounts(bankId) {
        if (accountsByBank[bankId]) return;
        try {
            const res = await getAccountsFromBankAPI(bankId);
            setAccountsByBank((m) => ({ ...m, [bankId]: res?.data ?? [] }));
        } catch {
            setAccountsByBank((m) => ({ ...m, [bankId]: [] }));
        }
    }

    useEffect(() => {
        fetchBanks();
    }, []);

    function getBankId(b) {
        return b.item_id;
    }

    async function handleOpenBank(bank) {
        const bankId = getBankId(bank);
        if (!bankId) return;
        setActiveBankId(bankId);
        await fetchAccounts(bankId);
    }

    async function handleToggleTracking(bankId, accountId, next) {
        setAccountsByBank((m) => ({
            ...m,
            [bankId]: (m[bankId] || []).map((a) =>
                a.id === accountId ? { ...a, tracking: next } : a
            ),
        }));
        try {
            await setAccountTrackingAPI(accountId, next);
        } catch {
            setAccountsByBank((m) => ({
                ...m,
                [bankId]: (m[bankId] || []).map((a) =>
                    a.id === accountId ? { ...a, tracking: !next } : a
                ),
            }));
        }
    }

    async function handleDeleteBank(itemId) {
        try {
            await deleteBankAPI(itemId);
            setActiveBankId(null);
            setBanks(prev => prev.filter(item => item.item_id !== itemId));
        } catch {

        }
    }

    const activeBank =
        activeBankId ? banks.find((b) => String(getBankId(b)) === String(activeBankId)) : null;
    const activeAccounts = activeBankId ? accountsByBank[activeBankId] || [] : [];

    return (
        <div className={styles.card}>
            {activeBank ? (
                <BankDetail
                    styles={styles}
                    bank={activeBank}
                    accounts={activeAccounts}
                    onBack={() => setActiveBankId(null)}
                    onToggle={(accId, next) => handleToggleTracking(activeBankId, accId, next)}
                    onDelete={handleDeleteBank}
                />
            ) : (
                <BanksList
                    styles={styles}
                    banks={banks}
                    loading={loading}
                    onOpenBank={handleOpenBank}
                    onConnectBank={startPlaid}    // <- BanksList triggers this; Plaid lives here
                    starting={starting}           // optional: show spinner on button
                />
            )}
        </div>
    );
}
