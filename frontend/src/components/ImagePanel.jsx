import { useMemo, useState } from "react";
import Tip from "./Tooltip";
import { Image as ImgIcon, Upload, Link } from "lucide-react";

function fileToDataUrl(file) {
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

    function handleSubmit(e) {
        e.preventDefault();
        onSubmit({ image_url: active });
    }

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div>
                    <h2 className="title">Image → 3D</h2>
                    <p className="subtitle">Generate a 3D model from a 2D image.</p>
                </div>
                <div className="badge badge-primary" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ImgIcon aria-hidden="true" size={14} /> Task
                </div>
            </div>

            <fieldset style={{ border: 'none', padding: 0, margin: '0 0 24px 0' }}>
                <legend className="sr-only">Input method</legend>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: 4, borderRadius: 'var(--radius-md)', display: 'flex', gap: 4 }}>
                    <Tip content="Upload an image and send it as base64.">
                        <button
                            type="button"
                            className={useUpload ? "btn-primary" : "btn-secondary"}
                            onClick={() => setUseUpload(true)}
                            aria-pressed={useUpload}
                            style={{ flex: 1 }}
                        >
                            <Upload aria-hidden="true" size={16} /> Upload
                        </button>
                    </Tip>
                    <Tip content="Use a public image URL accessible to the backend.">
                        <button
                            type="button"
                            className={!useUpload ? "btn-primary" : "btn-secondary"}
                            onClick={() => setUseUpload(false)}
                            aria-pressed={!useUpload}
                            style={{ flex: 1 }}
                        >
                            <Link aria-hidden="true" size={16} /> URL
                        </button>
                    </Tip>
                </div>
            </fieldset>

            <div style={{ minHeight: 180, marginBottom: 24 }}>
                {useUpload ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <Tip content="Pick a clear image of a single object for best results.">
                            <label className="btn-secondary" style={{ display: 'flex', justifyContent: 'center', cursor: 'pointer', padding: 20, border: '1px dashed var(--glass-border)' }}>
                                <input type="file" accept="image/*" onChange={onPick} className="sr-only" />
                                <span>Click to Select Image</span>
                            </label>
                        </Tip>

                        {dataUrl && (
                            <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden' }}>
                                <img
                                    src={dataUrl}
                                    alt="Selected image preview"
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
                        <label htmlFor="imageUrl" className="subtitle" style={{ fontSize: '0.85rem', marginBottom: 6, display: 'block' }}>Image URL</label>
                        <input id="imageUrl" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
                    </div>
                )}
            </div>

            <Tip content="Creates an Image→3D task and returns a task id.">
                <button
                    type="submit"
                    className="btn-primary"
                    disabled={!canSubmit || busy}
                    style={{ width: "100%", justifyContent: 'center' }}
                    aria-busy={busy}
                >
                    {busy ? "Submitting..." : "Create Image Task"}
                </button>
            </Tip>
        </form>
    );
}
