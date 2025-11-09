import { useState, useEffect } from "react";
import styles from "./Dashboard.module.css";
import {
    getMyEnvelopesAPI,
    createEnvelopeAPI,
    updateEnvelopeAPI,
    deleteEnvelopeAPI,
} from "../api";

import EnvelopesList from "./EnvelopesList";
import DetailedEnvelope from "./DetailedEnvelope";

export default function DashboardEnvelopes() {
    const [envelopes, setEnvelopes] = useState([]);
    const [mode, setMode] = useState("create"); // "create" | "modify"
    const [selected, setSelected] = useState(null); // envelope object
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ name: "", color: "#22c55e" });

    const [activeEnvelopeId, setActiveEnvelopeId] = useState(null); // list vs detail

    async function fetchEnvelopes() {
        try {
            const res = await getMyEnvelopesAPI();
            setEnvelopes(res?.data ?? []);
        } catch (e) {
            console.error("fetchEnvelopes failed:", e);
        }
    }

    useEffect(() => {
        fetchEnvelopes();
        const onEsc = (e) => e.key === "Escape" && setShowForm(false);
        window.addEventListener("keydown", onEsc);
        return () => window.removeEventListener("keydown", onEsc);
    }, []);

    // ---- list interactions ----
    function openAdd() {
        setMode("create");
        setSelected(null);
        setForm({ name: "", color: "#22c55e" });
        setShowForm(true);
    }

    function openModify(env) {
        setMode("modify");
        setSelected(env);
        setForm({ name: env.name ?? "", color: env.color ?? "#22c55e" });
        setShowForm(true);
    }

    async function saveEnvelope() {
        try {
            if (mode === "create") {
                const tempId = `tmp-${Date.now()}`;
                setEnvelopes((s) => [
                    ...s,
                    { id: tempId, name: form.name || "New", color: form.color, amount: 0 },
                ]);
                await createEnvelopeAPI({
                    name: form.name,
                    color: form.color,
                    amount: 0,
                    order: envelopes.length,
                });
            } else if (selected) {
                setEnvelopes((s) =>
                    s.map((x) =>
                        x.id === selected.id ? { ...x, name: form.name, color: form.color } : x
                    )
                );
                await updateEnvelopeAPI(selected.id, { name: form.name, color: form.color });
            }
            await fetchEnvelopes();
        } catch (e) {
            console.error("Save envelope failed:", e);
        } finally {
            setShowForm(false);
        }
    }

    async function handleDelete(id) {
        // optimistic
        setEnvelopes((s) => s.filter((x) => x.id !== id));
        try {
            await deleteEnvelopeAPI(id);
            if (activeEnvelopeId === id) setActiveEnvelopeId(null);
        } catch (e) {
            console.error("Delete failed:", e);
            fetchEnvelopes();
        }
    }

    // ---- navigation ----
    function openDetail(envId) {
        setActiveEnvelopeId(envId);
    }
    function goBackToList() {
        setActiveEnvelopeId(null);
    }

    // ---- data helpers ----
    const activeEnvelope =
        activeEnvelopeId != null
            ? envelopes.find((e) => String(e.id) === String(activeEnvelopeId))
            : null;

    // ---- transfer (local optimistic) ----
    function applyTransfer(fromId, toId, amount) {
        const delta = Number(amount || 0);
        if (Number.isNaN(delta) || delta <= 0) return;
        setEnvelopes((list) =>
            list.map((e) => {
                if (String(e.id) === String(fromId)) {
                    return { ...e, amount: Number(e.amount || 0) - delta };
                }
                if (String(e.id) === String(toId)) {
                    return { ...e, amount: Number(e.amount || 0) + delta };
                }
                return e;
            })
        );
        // TODO: call a real /transfer API if/when you add it
    }

    return (
        <div className={styles.card}>
            {activeEnvelope ? (
                <DetailedEnvelope
                    styles={styles}
                    envelope={activeEnvelope}
                    onBack={goBackToList}
                    onEdit={() => openModify(activeEnvelope)}
                    onDelete={() => handleDelete(activeEnvelope.id)}
                />
            ) : (
                <EnvelopesList
                    styles={styles}
                    envelopes={envelopes}
                    onAdd={openAdd}
                    onOpenDetail={(env) => openDetail(env.id)}
                    // create/edit modal props
                    showForm={showForm}
                    setShowForm={setShowForm}
                    form={form}
                    setForm={setForm}
                    mode={mode}
                    saveEnvelope={saveEnvelope}
                    onEdit={openModify}
                    // transfer handler (applied after modal confirms)
                    onTransfer={(fromId, toId, amount) => applyTransfer(fromId, toId, amount)}
                />
            )}
        </div>
    );
}
