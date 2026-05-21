import { useMemo, useState } from "react";
import Tip from "./Tooltip";
import { Image as ImgIcon, Upload, Link } from "lucide-react";

export function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onerror = reject;
        r.onload = () => resolve(r.result);
        r.readAsDataURL(file);
    });
}

export default function ImagePanel({ onSubmit, busy }) {
    const [useUpload, setUseUpload] = useState(true);
    const [dataUrl, setDataUrl] = useState("");
    const [url, setUrl] = useState("");

    const active = useMemo(() => (useUpload ? dataUrl : url.trim()), [useUpload, dataUrl, url]);
    const canSubmit = !!active;

    async function onPick(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        const d = await fileToDataUrl(file);
        setDataUrl(d);
        e.target.value = "";
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                    <p className="title">Image → 3D</p>
                    <p className="subtitle">Generate a 3D model from a 2D image.</p>
                </div>
                <div className="badge badge-primary">
                    <ImgIcon size={14} /> Task
                </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: 4, borderRadius: 'var(--radius-md)', display: 'flex', gap: 4, marginBottom: 16 }}>
                <Tip content="Upload an image and send it as base64.">
                    <button
                        className={useUpload ? "btn-primary" : "btn-secondary"}
                        onClick={() => setUseUpload(true)}
                        style={{ flex: 1 }}
                    >
                        <Upload size={16} /> Upload
                    </button>
                </Tip>
                <Tip content="Use a public image URL accessible to the backend.">
                    <button
                        className={!useUpload ? "btn-primary" : "btn-secondary"}
                        onClick={() => setUseUpload(false)}
                        style={{ flex: 1 }}
                    >
                        <Link size={16} /> URL
                    </button>
                </Tip>
            </div>

            <div style={{ minHeight: 180 }}>
                {useUpload ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <Tip content="Pick a clear image of a single object for best results.">
                            <label className="btn-secondary" style={{ display: 'flex', justifyContent: 'center', cursor: 'pointer', padding: 20, border: '1px dashed var(--glass-border)' }}>
                                <input type="file" accept="image/*" onChange={onPick} style={{ display: 'none' }} />
                                <span>Click to Select Image</span>
                            </label>
                        </Tip>

                        {dataUrl && (
                            <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden' }}>
                                <img
                                    src={dataUrl}
                                    alt="upload"
                                    style={{
                                        width: "100%",
                                        maxHeight: 240,
                                        objectFit: "contain",
                                        background: "rgba(0,0,0,0.2)",
                                        display: 'block'
                                    }}
                                />
                            </div>
                        )}
                    </div>
                ) : (
                    <div>
                        <label className="subtitle" style={{ fontSize: '0.85rem', marginBottom: 6, display: 'block' }}>Image URL</label>
                        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
                    </div>
                )}
            </div>

            <div style={{ height: 16 }} />

            <Tip content="Creates an Image→3D task and returns a task id.">
                <button
                    className="btn-primary"
                    disabled={!canSubmit || busy}
                    onClick={() => onSubmit({ image_url: active })}
                    style={{ width: "100%", justifyContent: 'center' }}
                >
                    {busy ? "Submitting..." : "Create Image Task"}
                </button>
            </Tip>
        </div>
    );
}
