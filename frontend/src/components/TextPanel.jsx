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

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                    <p className="title">Text → 3D</p>
                    <p className="subtitle">Generate a 3D model from a text prompt.</p>
                </div>
                <div className="badge badge-primary">
                    <Wand2 size={14} /> Preview Mode
                </div>
            </div>

            <div style={{ display: 'grid', gap: 16 }}>
                <div>
                    <label className="subtitle" style={{ fontSize: '0.85rem', marginBottom: 6, display: 'block' }}>Prompt</label>
                    <textarea
                        rows={3}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe the object..."
                        style={{ width: '100%', resize: 'vertical', minHeight: 80 }}
                    />
                </div>

                <div>
                    <label className="subtitle" style={{ fontSize: '0.85rem', marginBottom: 6, display: 'block' }}>Negative prompt</label>
                    <input
                        value={negative}
                        onChange={(e) => setNegative(e.target.value)}
                        placeholder="What to avoid..."
                    />
                </div>

                <div className="row">
                    <div>
                        <label className="subtitle" style={{ fontSize: '0.85rem', marginBottom: 6, display: 'block' }}>Art style</label>
                        <select value={artStyle} onChange={(e) => setArtStyle(e.target.value)}>
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
                                onClick={() => setShouldRemesh((v) => !v)}
                                className={shouldRemesh ? "btn-secondary" : "btn-secondary"}
                                style={{
                                    width: "100%",
                                    borderColor: shouldRemesh ? "var(--success)" : "transparent",
                                    color: shouldRemesh ? "var(--success)" : "var(--text-secondary)"
                                }}
                            >
                                <Box size={16} /> {shouldRemesh ? "Remesh: ON" : "Remesh: OFF"}
                            </button>
                        </Tip>
                    </div>
                </div>

                <Tip content="Creates a preview generation task and returns a task id.">
                    <button
                        className="btn-primary"
                        disabled={!canPreview || busy}
                        onClick={() =>
                            onPreview({
                                mode: "preview",
                                prompt: prompt.trim(),
                                negative_prompt: negative.trim() || undefined,
                                art_style: artStyle,
                                should_remesh: shouldRemesh,
                            })
                        }
                        style={{ width: "100%", justifyContent: 'center' }}
                    >
                        {busy ? "Submitting..." : "Create Preview"}
                    </button>
                </Tip>
            </div>

            <div style={{ height: 1, background: 'var(--glass-border)', margin: '24px 0' }} />

            <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <Sparkles size={16} className="text-secondary" />
                    <span className="title" style={{ fontSize: '1rem' }}>Refine</span>
                </div>

                <label className="subtitle" style={{ fontSize: '0.85rem', marginBottom: 6, display: 'block' }}>Texture Prompt (Optional)</label>
                <input
                    value={texturePrompt}
                    onChange={(e) => setTexturePrompt(e.target.value)}
                    placeholder="e.g. gold trim, leather straps..."
                    style={{ marginBottom: 16 }}
                />

                <Tip content="Refines the last preview task into a final model.">
                    <button
                        className="btn-secondary"
                        disabled={!canRefine}
                        onClick={() =>
                            onRefine({
                                mode: "refine",
                                texture_prompt: texturePrompt.trim() || undefined,
                                should_texture: true,
                            })
                        }
                        style={{ width: "100%", justifyContent: 'center' }}
                    >
                        <Sparkles size={16} /> Refine → Final Model
                    </button>
                </Tip>
            </div>
        </div>
    );
}
