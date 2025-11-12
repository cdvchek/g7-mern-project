import { useState, useEffect } from "react";
import styles from "./Dashboard.module.css";
import { getMyEnvelopesAPI, getAccountsBalance } from "@/api";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Label } from "recharts";

const COLORS = [
    "#5B9CFF", "#00C49F", "#FFB547", "#FF6B6B", "#9B59B6",
    "#2ECC71", "#3498DB", "#E67E22", "#F1C40F", "#1ABC9C"
];

function formatDollars(cents) {
    return (cents / 100).toLocaleString(undefined, { style: "currency", currency: "USD" });
}

// Choose dark/light text based on background color luminance
function getContrastText(hex = "#ffffff") {
    const h = hex.replace("#", "");
    const r = parseInt(h.slice(0, 2), 16) || 255;
    const g = parseInt(h.slice(2, 4), 16) || 255;
    const b = parseInt(h.slice(4, 6), 16) || 255;
    const L = (0.299 * r + 0.587 * g + 0.114 * b) / 255; // 0..1
    return L > 0.6 ? "#111" : "#fff";
}

export default function DashboardHome() {
    const [totalBalance, setTotalBalance] = useState(0);       // cents
    const [totalAllocated, setTotalAllocated] = useState(0);   // cents
    const [availableBalance, setAvailableBalance] = useState(0); // cents
    const [envelopes, setEnvelopes] = useState([]);

    const setBalances = async () => {
        const envelopesRes = await getMyEnvelopesAPI();
        const balanceRes = await getAccountsBalance();
        if (envelopesRes.code !== 0 || balanceRes.code !== 0) return;

        const envs = envelopesRes.data || [];
        setEnvelopes(envs);

        const allocated = envs.reduce((sum, e) => sum + (e.amount ?? 0), 0);
        const total = balanceRes.data?.balance ?? 0;

        setTotalAllocated(allocated);
        setTotalBalance(total);
        setAvailableBalance(total - allocated);
    };

    useEffect(() => { setBalances(); }, []);

    const pieData = envelopes
        .filter(e => e.amount > 0)
        .map(e => ({ name: e.name, value: e.amount, color: e.color || COLORS[Math.floor(Math.random() * COLORS.length)] }));

    const safeData = pieData.length ? pieData : [{ name: "No Envelopes", value: 1, color: "#ccc" }];

    return (
        <div className={styles.dashboardContainer}>
            {/* balances */}
            <div className={styles.dashboardBalances}>
                <div className={styles.balanceCard}><h3>Total Balance</h3><p>{formatDollars(totalBalance)}</p></div>
                <div className={styles.balanceCard}><h3>Total Allocated</h3><p>{formatDollars(totalAllocated)}</p></div>
                <div className={styles.balanceCard}><h3>Available Balance</h3><p>{formatDollars(availableBalance)}</p></div>
            </div>

            {/* pie */}
            <div className={styles.chartCard}>
                <div className={styles.chartHeader}>
                    <h3>Your Money’s Distribution</h3>
                    <span className={styles.chartSub}>Total Allocated = 100%</span>
                </div>
                <div className={styles.chartWrap}>
                    <ResponsiveContainer width="100%" height={360}>
                        <PieChart>
                            <Pie data={safeData} dataKey="value" nameKey="name" innerRadius={90} outerRadius={140} paddingAngle={2} isAnimationActive>
                                <Label value={formatDollars(totalAllocated)} position="center" className={styles.centerValue} />
                                {safeData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                            </Pie>
                            <Tooltip formatter={(val, name) => [formatDollars(val), name]} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* envelopes at a glance */}
            <div className={styles.envelopeListCard}>
                <h3 className={styles.envelopeHeader}>Envelopes at a Glance</h3>
                <div className={styles.envelopeList}>
                    {envelopes.map((e, i) => {
                        const textColor = getContrastText(e.color || "#ddd");
                        const flapBg = textColor === "#111" ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.25)";
                        const nameShadow = textColor === "#fff" ? "0 1px 3px rgba(0,0,0,0.25)" : "0 1px 0 rgba(255,255,255,0.15)";
                        const amtShadow = textColor === "#fff" ? "0 1px 3px rgba(0,0,0,0.25)" : "0 1px 0 rgba(255,255,255,0.15)";
                        return (
                            <div
                                key={i}
                                className={styles.envelopeCard}
                                style={{ backgroundColor: e.color || "#ddd", color: textColor }}
                            >
                                <div className={styles.envelopeFlap} style={{ background: flapBg }} />
                                <div className={styles.envelopeContent}>
                                    <span className={styles.envelopeName} style={{ textShadow: nameShadow }}>
                                        {e.name}
                                    </span>
                                    <span className={styles.envelopeAmount} style={{ textShadow: amtShadow }}>
                                        {formatDollars(e.amount ?? 0)}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                    {envelopes.length === 0 && <p className={styles.noEnvelopes}>No envelopes yet.</p>}
                </div>
            </div>
        </div>
    );
}
