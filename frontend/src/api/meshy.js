// meshy.js
import { apiFetch } from "./client";

export const meshy = {
    // -------------------------
    // TEXT (recommended unified endpoint)
    // -------------------------
    /**
     * Create a Text-to-3D task (preview or refine)
     *
     * payload examples:
     *  - preview: { mode: "preview", prompt: "a red dragon", art_style: "realistic", should_texture: true }
     *  - refine:  { mode: "refine", preview_task_id: "<taskId>", texture_prompt: "gold accents" }
     */
    createTextTo3D: (apiKey, payload) =>
        apiFetch("/api/text-to-3d", { apiKey, method: "POST", body: payload }),

    getTextTask: (apiKey, taskId) =>
        apiFetch(`/api/text-to-3d/${taskId}`, { apiKey }),

    // -------------------------
    // IMAGE
    // -------------------------
    createImageTo3D: (apiKey, payload) =>
        apiFetch("/api/image-to-3d", { apiKey, method: "POST", body: payload }),

    getImageTask: (apiKey, taskId) =>
        apiFetch(`/api/image-to-3d/${taskId}`, { apiKey }),
};
