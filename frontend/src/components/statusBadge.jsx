export function statusBadge(status) {
    const s = (status || "").toUpperCase();
    if (s.includes("SUCC")) return <span className="badge badge-success">SUCCEEDED</span>;
    if (s.includes("FAIL")) return <span className="badge badge-danger">FAILED</span>;
    if (s.includes("RUN") || s.includes("PROC")) return <span className="badge badge-warn">RUNNING</span>;
    return <span className="badge badge-def">{status || "UNKNOWN"}</span>;
}
