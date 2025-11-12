"use client";

import { useEffect, useState } from "react";
import styles from "./Dashboard.module.css";
import { getMyEnvelopesAPI } from "../api";
import EnvelopesList from "./EnvelopesList";

export default function DashboardEnvelopes() {
    const [envelopes, setEnvelopes] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchEnvelopes = async () => {
        setLoading(true);
        try {
            const res = await getMyEnvelopesAPI();
            setEnvelopes(res?.data ?? []);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEnvelopes();
    }, []);

    if (loading) {
        return <div className={styles.card}>Loading envelopes…</div>;
    }

    // No outer .card here to avoid the “double white panel” look.
    return (
        <EnvelopesList
            envelopes={envelopes}
            onChanged={fetchEnvelopes} // children call this after create/edit/delete
        />
    );
}
