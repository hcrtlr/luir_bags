"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, Check } from "lucide-react"

export default function PersonalPage() {
  const router = useRouter()
  const supabase = createClient()

  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/customer/login"); return }
      setFullName(user.user_metadata?.full_name || "")
      setEmail(user.email || "")
      setPhone(user.user_metadata?.phone || "")
    }
    init()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setError("")
    const { error: err } = await supabase.auth.updateUser({
      data: { full_name: fullName.trim(), phone: phone.trim() }
    })
    if (err) { setError(err.message); setSaving(false); return }
    setSaved(true)
    setSaving(false)
    setTimeout(() => setSaved(false), 2500)
  }

  const inp: React.CSSProperties = { width: "100%", border: "none", borderBottom: "1px solid #e0e0e0", padding: "10px 0", fontSize: "14px", outline: "none", fontFamily: "var(--font-dm-sans)", background: "transparent", color: "#0A0A0A" }
  const lbl: React.CSSProperties = { display: "block", fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#888", marginBottom: "6px" }

  return (
    <main style={{ minHeight: "100vh", background: "#F8F8F8" }}>
      <div style={{ background: "#0A0A0A", padding: "1.2rem 1.5rem", display: "flex", alignItems: "center", gap: "14px" }}>
        <Link href="/customer/profile" style={{ color: "#666", display: "flex" }}><ArrowLeft size={20} /></Link>
        <div style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.3rem", fontWeight: 300, color: "#fff" }}>Kisisel Bilgilerim</div>
      </div>

      <div style={{ maxWidth: "500px", margin: "2rem auto", padding: "0 1.5rem" }}>
        <div style={{ background: "#fff", border: "0.5px solid #efefef", padding: "2rem", display: "flex", flexDirection: "column" as const, gap: "1.5rem" }}>

          <div>
            <label style={lbl}>Ad Soyad</label>
            <input style={inp} value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Ad Soyad" />
          </div>

          <div>
            <label style={lbl}>E-posta (degistirilemez)</label>
            <input style={{ ...inp, color: "#bbb" }} value={email} readOnly />
          </div>

          <div>
            <label style={lbl}>Telefon</label>
            <input style={inp} value={phone} onChange={e => setPhone(e.target.value)} placeholder="05XX XXX XX XX" />
          </div>

          {error && <p style={{ fontSize: "12px", color: "#A32D2D" }}>{error}</p>}

          <button
            onClick={handleSave}
            disabled={saving}
            style={{ background: saved ? "#3B6D11" : "#0A0A0A", color: "#fff", border: "none", padding: "13px", fontSize: "11px", letterSpacing: "0.18em", textTransform: "uppercase", cursor: saving ? "not-allowed" : "pointer", fontFamily: "var(--font-dm-sans)", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "background 0.3s", opacity: saving ? 0.7 : 1 }}
          >
            {saved ? <><Check size={14} /> Kaydedildi</> : saving ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </div>
    </main>
  )
}