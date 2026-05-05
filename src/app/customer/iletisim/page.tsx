"use client"
import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Mail, Phone, MapPin, Clock } from "lucide-react"

export default function IletisimPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" })
  const [sent, setSent] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSent(true)
  }

  const inp: React.CSSProperties = {
    width: "100%", border: "none", borderBottom: "1px solid #e0e0e0",
    padding: "10px 0", fontSize: "13px", outline: "none",
    fontFamily: "var(--font-dm-sans)", background: "transparent", color: "#0A0A0A",
  }

  const lbl: React.CSSProperties = {
    display: "block", fontSize: "10px", letterSpacing: "0.12em",
    textTransform: "uppercase", color: "#888", marginBottom: "4px",
  }

  return (
    <main style={{ minHeight: "100vh", background: "#fff" }}>
      <div style={{ background: "#0A0A0A", padding: "4rem 3rem" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <Link href="/customer" style={{ fontSize: "11px", color: "#555", textDecoration: "none", letterSpacing: "0.1em", textTransform: "uppercase", display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "1.5rem" }}>
            <ArrowLeft size={12} /> Ana Sayfa
          </Link>
          <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "clamp(2.5rem, 5vw, 4rem)", fontWeight: 300, color: "#fff", lineHeight: 1.1 }}>
            İletişim
          </h1>
          <p style={{ fontSize: "14px", color: "#666", marginTop: "1rem" }}>
            Size yardımcı olmaktan memnuniyet duyarız.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "4rem 3rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "4rem" }}>

          {/* SOL — BİLGİLER */}
          <div>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: "2rem" }}>
              {[
                { icon: <Mail size={16} />, title: "E-posta", lines: ["destek@luir.com", "basin@luir.com"] },
                { icon: <Phone size={16} />, title: "Telefon", lines: ["0212 000 00 00", "Hafta içi 09:00 - 18:00"] },
                { icon: <MapPin size={16} />, title: "Adres", lines: ["Levent Mah. Büyükdere Cad.", "No: 1/A, 34394 Şişli / İstanbul"] },
                { icon: <Clock size={16} />, title: "Çalışma Saatleri", lines: ["Pazartesi – Cuma: 09:00 – 18:00", "Hafta sonu: Kapalı"] },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <div style={{ width: "36px", height: "36px", border: "0.5px solid #efefef", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#0A0A0A" }}>
                    {item.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#888", marginBottom: "4px" }}>{item.title}</div>
                    {item.lines.map((line, li) => (
                      <div key={li} style={{ fontSize: "13px", color: "#0A0A0A", lineHeight: 1.7 }}>{line}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SAĞ — FORM */}
          <div>
            {sent ? (
              <div style={{ padding: "3rem", textAlign: "center" as const, border: "0.5px solid #efefef" }}>
                <div style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.8rem", fontWeight: 300, marginBottom: "1rem" }}>
                  Mesajınız Alındı
                </div>
                <p style={{ fontSize: "13px", color: "#888", lineHeight: 1.8, marginBottom: "1.5rem" }}>
                  En kısa sürede size geri dönüş yapacağız. Teşekkür ederiz.
                </p>
                <button onClick={() => { setSent(false); setForm({ name: "", email: "", subject: "", message: "" }) }} style={{ background: "#0A0A0A", color: "#fff", border: "none", padding: "10px 20px", fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer", fontFamily: "var(--font-dm-sans)" }}>
                  Yeni Mesaj
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column" as const, gap: "1.5rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                  <div>
                    <label style={lbl}>Ad Soyad *</label>
                    <input required style={inp} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Hacer Atalar" />
                  </div>
                  <div>
                    <label style={lbl}>E-posta *</label>
                    <input required type="email" style={inp} value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="ornek@email.com" />
                  </div>
                </div>
                <div>
                  <label style={lbl}>Konu *</label>
                  <input required style={inp} value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} placeholder="Sipariş hakkında..." />
                </div>
                <div>
                  <label style={lbl}>Mesaj *</label>
                  <textarea required rows={5} style={{ ...inp, resize: "none" as const, lineHeight: "1.7" }} value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} placeholder="Mesajınızı buraya yazın..." />
                </div>
                <button type="submit" style={{ background: "#0A0A0A", color: "#fff", border: "none", padding: "13px", fontSize: "11px", letterSpacing: "0.18em", textTransform: "uppercase", cursor: "pointer", fontFamily: "var(--font-dm-sans)" }}>
                  Mesaj Gönder
                </button>
                <p style={{ fontSize: "11px", color: "#bbb" }}>
                  * Zorunlu alanlar. Mesajınız genellikle 24 saat içinde yanıtlanır.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}