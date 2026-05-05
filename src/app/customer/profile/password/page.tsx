"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, Check, Eye, EyeOff } from "lucide-react"

export default function PasswordPage() {
  const supabase = createClient()

  const [newPass, setNewPass] = useState("")
  const [confirmPass, setConfirmPass] = useState("")
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const strength = (() => {
    let s = 0
    if (newPass.length >= 6) s++
    if (newPass.length >= 10) s++
    if (/[A-Z]/.test(newPass)) s++
    if (/[0-9]/.test(newPass)) s++
    if (/[!@#$%^&*]/.test(newPass)) s++
    return s
  })()

  const strengthLabel = ["", "Cok Zayif", "Zayif", "Orta", "Guclu", "Cok Guclu"][strength] || ""
  const strengthColor = ["", "#E24B4A", "#F97316", "#EAB308", "#3B6D11", "#16a34a"][strength] || "#e0e0e0"

  const handleSave = async () => {
    if (newPass.length < 6) { setError("Sifre en az 6 karakter olmalidir."); return }
    if (newPass !== confirmPass) { setError("Sifreler eslesmıyor."); return }
    setSaving(true)
    setError("")
    const { error: err } = await supabase.auth.updateUser({ password: newPass })
    if (err) { setError(err.message); setSaving(false); return }
    setSuccess(true)
    setNewPass("")
    setConfirmPass("")
    setSaving(false)
    setTimeout(() => setSuccess(false), 3000)
  }

  const inp: React.CSSProperties = { width: "100%", border: "none", borderBottom: "1px solid #e0e0e0", padding: "10px 0", fontSize: "14px", outline: "none", fontFamily: "var(--font-dm-sans)", background: "transparent", color: "#0A0A0A" }
  const lbl: React.CSSProperties = { display: "block", fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#888", marginBottom: "6px" }

  return (
    <main style={{ minHeight: "100vh", background: "#F8F8F8" }}>
      <div style={{ background: "#0A0A0A", padding: "1.2rem 1.5rem", display: "flex", alignItems: "center", gap: "14px" }}>
        <Link href="/customer/profile" style={{ color: "#666", display: "flex" }}><ArrowLeft size={20} /></Link>
        <div style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.3rem", fontWeight: 300, color: "#fff" }}>Sifre Degistir</div>
      </div>

      <div style={{ maxWidth: "500px", margin: "2rem auto", padding: "0 1.5rem" }}>
        <div style={{ background: "#fff", border: "0.5px solid #efefef", padding: "2rem", display: "flex", flexDirection: "column" as const, gap: "1.5rem" }}>

          <div>
            <label style={lbl}>Yeni Sifre *</label>
            <div style={{ position: "relative" }}>
              <input style={{ ...inp, paddingRight: "32px" }} type={showNew ? "text" : "password"} value={newPass} onChange={e => { setNewPass(e.target.value); setError("") }} placeholder="En az 6 karakter" />
              <button onClick={() => setShowNew(!showNew)} style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#888", display: "flex" }}>
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {newPass && (
              <div style={{ marginTop: "8px" }}>
                <div style={{ display: "flex", gap: "3px", marginBottom: "4px" }}>
                  {[1,2,3,4,5].map(i => (
                    <div key={i} style={{ flex: 1, height: "3px", borderRadius: "2px", background: i <= strength ? strengthColor : "#f0f0f0", transition: "background 0.2s" }} />
                  ))}
                </div>
                <div style={{ fontSize: "10px", color: strengthColor }}>{strengthLabel}</div>
              </div>
            )}
          </div>

          <div>
            <label style={lbl}>Sifre Tekrar *</label>
            <div style={{ position: "relative" }}>
              <input style={{ ...inp, paddingRight: "32px" }} type={showConfirm ? "text" : "password"} value={confirmPass} onChange={e => { setConfirmPass(e.target.value); setError("") }} placeholder="Sifreyi tekrar girin" />
              <button onClick={() => setShowConfirm(!showConfirm)} style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#888", display: "flex" }}>
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {confirmPass && newPass !== confirmPass && (
              <div style={{ fontSize: "11px", color: "#E24B4A", marginTop: "4px" }}>Sifreler eslesmıyor</div>
            )}
            {confirmPass && newPass === confirmPass && newPass.length >= 6 && (
              <div style={{ fontSize: "11px", color: "#3B6D11", marginTop: "4px", display: "flex", alignItems: "center", gap: "4px" }}><Check size={11} /> Sifreler uyusuyor</div>
            )}
          </div>

          {error && <p style={{ fontSize: "12px", color: "#A32D2D" }}>{error}</p>}

          <button
            onClick={handleSave}
            disabled={saving || newPass.length < 6 || newPass !== confirmPass}
            style={{ background: success ? "#3B6D11" : "#0A0A0A", color: "#fff", border: "none", padding: "13px", fontSize: "11px", letterSpacing: "0.18em", textTransform: "uppercase", cursor: saving || newPass.length < 6 || newPass !== confirmPass ? "not-allowed" : "pointer", fontFamily: "var(--font-dm-sans)", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "background 0.3s", opacity: newPass.length < 6 || newPass !== confirmPass ? 0.4 : 1 }}
          >
            {success ? <><Check size={14} /> Kaydedildi</> : saving ? "Kaydediliyor..." : "Sifreyi Guncelle"}
          </button>

          <div style={{ borderTop: "0.5px solid #f0f0f0", paddingTop: "1rem" }}>
            <div style={{ fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#bbb", marginBottom: "8px" }}>Ipuclari</div>
            {["En az 6 karakter", "Buyuk ve kucuk harf", "Rakam ekleyin", "Ozel karakter (!@#$%)"].map(tip => (
              <div key={tip} style={{ fontSize: "11px", color: "#bbb", marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "3px", height: "3px", borderRadius: "50%", background: "#ddd", flexShrink: 0 }} />
                {tip}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}