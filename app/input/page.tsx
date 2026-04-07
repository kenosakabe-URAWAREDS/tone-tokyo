"use client";
import { useState, useRef } from "react";

export default function InputPage() {
  const [memo, setMemo] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle"|"sending"|"done"|"error">("idle");
  const [result, setResult] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const addImages = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files);
    setImages(prev => [...prev, ...newFiles]);
    newFiles.forEach(f => {
      const reader = new FileReader();
      reader.onload = (e) => setPreviews(prev => [...prev, e.target?.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const removeImage = (i: number) => {
    setImages(prev => prev.filter((_, idx) => idx !== i));
    setPreviews(prev => prev.filter((_, idx) => idx !== i));
  };

  const submit = async () => {
    if (!memo.trim()) return;
    setStatus("sending");
    try {
      const fd = new FormData();
      fd.append("memo", memo);
      fd.append("secret", "tonetokyo2026");
      images.forEach(img => fd.append("images", img));
      const res = await fetch("/api/create-article", { method: "POST", body: fd });
      const data = await res.json();
      if (data.success) {
        setStatus("done");
        setResult(data.title);
        setMemo("");
        setImages([]);
        setPreviews([]);
      } else {
        setStatus("error");
        setResult(data.error || "Failed");
      }
    } catch (e: any) {
      setStatus("error");
      setResult(e.message);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F8F6F1", padding: "20px", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 32, paddingTop: 20 }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: "#2D2D2D" }}>TONE <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 400, fontSize: 15, letterSpacing: "0.15em" }}>TOKYO</span></div>
          <div style={{ fontSize: 12, color: "#A39E93", marginTop: 8, letterSpacing: "0.1em" }}>CONTENT INPUT</div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <div onClick={() => fileRef.current?.click()} style={{ border: "2px dashed #E8E4DB", borderRadius: 8, padding: 32, textAlign: "center", cursor: "pointer", background: "#fff" }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{"\ud83d\udcf7"}</div>
            <div style={{ fontSize: 14, color: "#A39E93" }}>Tap to add photos</div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple capture="environment" onChange={e => addImages(e.target.files)} style={{ display: "none" }} />
        </div>
        {previews.length > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
            {previews.map((p, i) => (
              <div key={i} style={{ position: "relative", width: 80, height: 80, borderRadius: 6, overflow: "hidden" }}>
                <img src={p} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <button onClick={() => removeImage(i)} style={{ position: "absolute", top: 2, right: 2, background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", borderRadius: "50%", width: 22, height: 22, fontSize: 12, cursor: "pointer" }}>{"\u00d7"}</button>
              </div>
            ))}
          </div>
        )}
        <textarea value={memo} onChange={e => setMemo(e.target.value)} placeholder={"What's the story? Write your memo here...\n\nExample: New ramen spot in Daikanyama. Ex-Afuri chef. The yuzu shio is perfect."} style={{ width: "100%", minHeight: 140, padding: 16, border: "1px solid #E8E4DB", borderRadius: 8, background: "#fff", fontFamily: "'DM Sans', sans-serif", fontSize: 15, lineHeight: 1.6, color: "#2D2D2D", resize: "vertical", outline: "none", boxSizing: "border-box" }} />
        <button onClick={submit} disabled={!memo.trim() || status === "sending"} style={{ width: "100%", padding: 16, marginTop: 16, background: status === "sending" ? "#A39E93" : "#1B3A5C", color: "#F8F6F1", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 600, letterSpacing: "0.05em", cursor: memo.trim() && status !== "sending" ? "pointer" : "default", opacity: !memo.trim() ? 0.4 : 1 }}>
          {status === "sending" ? "Generating article..." : "Create Article"}
        </button>
        {status === "done" && (
          <div style={{ marginTop: 20, padding: 16, background: "#e8f5e9", borderRadius: 8, textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#2e7d32", marginBottom: 4 }}>Article created!</div>
            <div style={{ fontSize: 15, color: "#2D2D2D", fontWeight: 600 }}>{result}</div>
            <a href="/studio" style={{ display: "inline-block", marginTop: 12, fontSize: 13, color: "#1B3A5C", textDecoration: "underline" }}>Review in Studio</a>
          </div>
        )}
        {status === "error" && (
          <div style={{ marginTop: 20, padding: 16, background: "#fce4ec", borderRadius: 8, textAlign: "center" }}>
            <div style={{ fontSize: 14, color: "#c62828" }}>Error: {result}</div>
          </div>
        )}
      </div>
    </div>
  );
}
