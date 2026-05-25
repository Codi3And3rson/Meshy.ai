import { useState } from "react";
import Tip from "./Tooltip";
import { Wand2, Sparkles, Box } from "lucide-react";

export default function TextPanel({ onPreview, onRefine, busy, hasPreview }) {
    const [prompt, setPrompt] = useState("a stylized dragon mask, clean topology, game-ready");
    const [negative, setNegative] = useState("blurry, low quality, broken geometry");
    const [artStyle, setArtStyle] = useState("realistic");
    const [shouldRemesh, setShouldRemesh] = useState(true);
    const [texturePrompt, setTexturePrompt] = useState("");

    const canPreview = prompt.trim().length >= 4;
    const canRefine = hasPreview && !busy;

    function handlePreviewSubmit(e) {
        e.preventDefault();
        onPreview({
            mode: "preview",
            prompt: prompt.trim(),
            negative_prompt: negative.trim() || undefined,
            art_style: artStyle,
            should_remesh: shouldRemesh,
        });
    }

    function handleRefineSubmit(e) {
        e.preventDefault();
        onRefine({
            mode: "refine",
            texture_prompt: texturePrompt.trim() || undefined,
            should_texture: true,
        });
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h2 className="title">Text → 3D</h2>
                    <p className="subtitle">Generate a 3D model from a text prompt.</p>
                </div>
                <div className="badge badge-primary" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Wand2 aria-hidden="true" size={14} /> Preview Mode
                </div>
            </div>

            <form onSubmit={handlePreviewSubmit} style={{ display: 'grid', gap: 16 }}>
                <div>
                    <label htmlFor="textPrompt" className="subtitle" style={{ fontSize: '0.85rem', marginBottom: 6, display: 'block' }}>Prompt <span className="sr-only">(required)</span></label>
                    <textarea
                        id="textPrompt"
                        rows={3}
                        required
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe the object..."
                        style={{ width: '100%', resize: 'vertical', minHeight: 80 }}
                        aria-invalid={!canPreview && prompt.length > 0}
                    />
                </div>

                <div>
                    <label htmlFor="textNegative" className="subtitle" style={{ fontSize: '0.85rem', marginBottom: 6, display: 'block' }}>Negative prompt</label>
                    <input
                        id="textNegative"
                        value={negative}
                        onChange={(e) => setNegative(e.target.value)}
                        placeholder="What to avoid..."
                    />
                </div>

                <div className="row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                        <label htmlFor="textArtStyle" className="subtitle" style={{ fontSize: '0.85rem', marginBottom: 6, display: 'block' }}>Art style</label>
                        <select id="textArtStyle" value={artStyle} onChange={(e) => setArtStyle(e.target.value)}>
                            <option value="realistic">Realistic</option>
                            <option value="cartoon">Cartoon</option>
                            <option value="lowpoly">Low Poly</option>
                            <option value="sculpture">Sculpture</option>
                            <option value="pbr">PBR</option>
                        </select>
                    </div>

                    <div>
                        <label className="subtitle" style={{ fontSize: '0.85rem', marginBottom: 6, display: 'block' }}>Topology</label>
                        <Tip content="Remesh attempts to improve topology for downstream use (animation/game).">
                            <button
                                type="button"
                                onClick={() => setShouldRemesh((v) => !v)}
                                className={shouldRemesh ? "btn-secondary" : "btn-secondary"}
                                aria-pressed={shouldRemesh}
                                style={{
                                    width: "100%",
                                    borderColor: shouldRemesh ? "var(--success)" : "transparent",
                                    color: shouldRemesh ? "var(--success)" : "var(--text-secondary)"
                                }}
                            >
                                <Box aria-hidden="true" size={16} /> {shouldRemesh ? "Remesh: ON" : "Remesh: OFF"}
                            </button>
                        </Tip>
                    </div>
                </div>

                <Tip content="Creates a preview generation task and returns a task id.">
                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={!canPreview || busy}
                        style={{ width: "100%", justifyContent: 'center' }}
                        aria-busy={busy}
                    >
                        {busy ? "Submitting..." : "Create Preview"}
                    </button>
                </Tip>
            </form>

            <div style={{ height: 1, background: 'var(--glass-border)' }} />

            <form onSubmit={handleRefineSubmit} style={{ display: 'grid', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Sparkles aria-hidden="true" size={16} className="text-secondary" />
                    <h3 className="title" style={{ fontSize: '1rem' }}>Refine</h3>
                </div>

                <div>
                    <label htmlFor="textTexturePrompt" className="subtitle" style={{ fontSize: '0.85rem', marginBottom: 6, display: 'block' }}>Texture Prompt (Optional)</label>
                    <input
                        id="textTexturePrompt"
                        value={texturePrompt}
                        onChange={(e) => setTexturePrompt(e.target.value)}
                        placeholder="e.g. gold trim, leather straps..."
                    />
                </div>

                <Tip content="Refines the last preview task into a final model.">
                    <button
                        type="submit"
                        className="btn-secondary"
                        disabled={!canRefine}
                        style={{ width: "100%", justifyContent: 'center' }}
                        aria-busy={busy}
                    >
                        <Sparkles aria-hidden="true" size={16} /> Refine → Final Model
                    </button>
                </Tip>
            </form>
        </div>
    );
}
