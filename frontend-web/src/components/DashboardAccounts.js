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

    // ---- Plaid Link state ----
    const [linkToken, setLinkToken] = useState(null);
    const [wantOpen, setWantOpen] = useState(false);
    const [starting, setStarting] = useState(false);

    const { open, ready } = usePlaidLink({
        token: linkToken || "",
        onSuccess: async (public_token, metadata) => {
            try {
                const institution = metadata?.institution;
                await exchangeLinkTokenAPI({ public_token, institution });
                await fetchBanks();
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
            const token = res?.data?.link_token;
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
            setBanks(res?.data ?? []);
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
        // item_id is your canonical bank identifier
        return b?.item_id ?? b?.id ?? b?._id ?? null;
    }

    async function handleOpenBank(bank) {
        const bankId = getBankId(bank);
        if (!bankId) return;
        setActiveBankId(bankId);
        await fetchAccounts(bankId);
    }

    async function handleToggleTracking(bankId, accountId, next) {
        // optimistic
        setAccountsByBank((m) => ({
            ...m,
            [bankId]: (m[bankId] || []).map((a) =>
                String(a.id) === String(accountId) ? { ...a, tracking: !!next } : a
            ),
        }));

        try {
            await setAccountTrackingAPI(accountId, { item_id: bankId, tracking: !!next });
        } catch {
            // revert
            setAccountsByBank((m) => ({
                ...m,
                [bankId]: (m[bankId] || []).map((a) =>
                    String(a.id) === String(accountId) ? { ...a, tracking: !next } : a
                ),
            }));
        }
    }

    async function handleDeleteBank(itemId) {
        try {
            await deleteBankAPI(itemId);
            setActiveBankId(null);
            setBanks((prev) => prev.filter((b) => b.item_id !== itemId));
            setAccountsByBank((m) => {
                const copy = { ...m };
                delete copy[itemId];
                return copy;
            });
        } catch (e) {
            console.error("DELETE BANK", e);
        }
    }

    const activeBank =
        activeBankId ? banks.find((b) => String(getBankId(b)) === String(activeBankId)) : null;
    const activeAccounts = activeBankId ? accountsByBank[activeBankId] || [] : [];

    return (
        <div className={styles.card}>
            {activeBank ? (
                <BankDetail
                    bank={activeBank}
                    accounts={activeAccounts}
                    onBack={() => setActiveBankId(null)}
                    onToggle={(accId, next) => handleToggleTracking(activeBankId, accId, next)}
                    onDelete={handleDeleteBank}
                />
            ) : (
                <BanksList
                    banks={banks}
                    loading={loading}
                    onOpenBank={handleOpenBank}
                    onConnectBank={startPlaid}
                    starting={starting}
                    styles={styles}
                />
            )}
        </div>
    );
}
