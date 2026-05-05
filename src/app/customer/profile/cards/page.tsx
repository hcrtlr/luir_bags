"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, Plus, Trash2, ShieldCheck } from "lucide-react"

type Card = {
  id: number
  cardholder_name: string
  last_four_digits: string
  card_type: string
  expire_month: string
  expire_year: string
  is_default: boolean
  iyzico_card_token: string
}

const emptyForm = {
  cardholder_name: "",
  card_number: "",
  expire_month: "",
  expire_year: "",
  cvc: "",
  is_default: false,
}

export default function CardsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [cards, setCards] = useState<Card[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showDeleteId, setShowDeleteId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const fetchCards = async (uid: string) => {
    const { data } = await supabase
      .from("cards")
      .select("*")
      .eq("user_id", uid)
      .order("is_default", { ascending: false })
    setCards(data || [])
  }

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/login"); return }
      setUserId(user.id)
      await fetchCards(user.id)
      setLoading(false)
    }
    init()
  }, [])

  const handleChange = (e) => {
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value

    if (e.target.name === "card_number") {
      const cleaned = e.target.value.replace(/\D/g, "").slice(0, 16)
      const formatted = cleaned.replace(/(.{4})/g, "$1 ").trim()
      setForm(prev => ({ ...prev, card_number: formatted }))
      return
    }

    if (e.target.name === "expire_month") {
      const v = e.target.value.replace(/\D/g, "").slice(0, 2)
      setForm(prev => ({ ...prev, expire_month: v }))
      return
    }

    if (e.target.name === "expire_year") {
      const v = e.target.value.replace(/\D/g, "").slice(0, 2)
      setForm(prev => ({ ...prev, expire_year: v }))
      return
    }

    if (e.target.name === "cvc") {
      const v = e.target.value.replace(/\D/g, "").slice(0, 4)
      setForm(prev => ({ ...prev, cvc: v }))
      return
    }

    setForm(prev => ({ ...prev, [e.target.name]: val }))
  }

  const detectCardType = (number: string): string => {
    const n = number.replace(/\s/g, "")
    if (n.startsWith("4")) return "VISA"
    if (n.startsWith("5") || n.startsWith("2")) return "MASTER"
    if (n.startsWith("9792")) return "TROY"
    if (n.startsWith("34") || n.startsWith("37")) return "AMEX"
    return "OTHER"
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setError("")

    const rawNumber = form.card_number.replace(/\s/g, "")

    if (!form.cardholder_name.trim()) { setError("Kart sahibinin adi zorunludur."); return }
    if (rawNumber.length !== 16) { setError("Gecerli bir kart numarasi girin."); return }
    if (!form.expire_month || parseInt(form.expire_month) < 1 || parseInt(form.expire_month) > 12) { setError("Gecerli bir son kullanma ayi girin."); return }
    if (!form.expire_year || form.expire_year.length !== 2) { setError("Gecerli bir son kullanma yili girin (YY)."); return }
    if (!form.cvc || form.cvc.length < 3) { setError("Gecerli bir CVC girin."); return }

    setSaving(true)

    try {
      // iyzico entegrasyonu için API route çağrısı
      // Kart bilgileri direkt iyzico'ya gönderilir, biz sadece token saklarız
      const res = await fetch("/customer/api/iyzico/save-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardHolderName: form.cardholder_name,
          cardNumber: rawNumber,
          expireMonth: form.expire_month,
          expireYear: "20" + form.expire_year,
          cvc: form.cvc,
          userId,
        }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        setError(data.error || "Kart eklenemedi. Bilgileri kontrol edin.")
        setSaving(false)
        return
      }

      if (form.is_default) {
        await supabase.from("cards").update({ is_default: false }).eq("user_id", userId)
      }

      await supabase.from("cards").insert({
        user_id: userId,
        iyzico_card_token: data.cardToken,
        iyzico_card_user_key: data.cardUserKey,
        cardholder_name: form.cardholder_name,
        last_four_digits: rawNumber.slice(-4),
        card_type: detectCardType(rawNumber),
        expire_month: form.expire_month,
        expire_year: "20" + form.expire_year,
        is_default: form.is_default,
      })

      await fetchCards(userId!)
      setShowForm(false)
      setForm(emptyForm)
      setSuccess("Kart basariyla eklendi.")
      setTimeout(() => setSuccess(""), 3000)

    } catch {
      setError("Bir hata olustu. Lutfen tekrar deneyin.")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (card: Card) => {
    try {
      // iyzico'dan da sil
      await fetch("/customer/api/iyzico/delete-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardToken: card.iyzico_card_token,
          cardUserKey: card.iyzico_card_user_key,
        }),
      })
    } catch {}

    await supabase.from("cards").delete().eq("id", card.id)
    await fetchCards(userId!)
    setShowDeleteId(null)
    setSuccess("Kart silindi.")
    setTimeout(() => setSuccess(""), 3000)
  }

  const getCardIcon = (type: string) => {
    if (type === "VISA") return (
      <svg width="32" height="20" viewBox="0 0 38 24" fill="none">
        <rect width="38" height="24" rx="3" fill="#1434CB"/>
        <text x="4" y="17" fontFamily="Arial" fontSize="11" fontWeight="bold" fill="white">VISA</text>
      </svg>
    )
    if (type === "MASTER") return (
      <svg width="32" height="20" viewBox="0 0 38 24">
        <rect width="38" height="24" rx="3" fill="#252525"/>
        <circle cx="14" cy="12" r="8" fill="#EB001B" opacity="0.9"/>
        <circle cx="24" cy="12" r="8" fill="#F79E1B" opacity="0.9"/>
      </svg>
    )
    if (type === "TROY") return (
      <svg width="32" height="20" viewBox="0 0 38 24" fill="none">
        <rect width="38" height="24" rx="3" fill="#00539F"/>
        <text x="5" y="17" fontFamily="Arial" fontSize="10" fontWeight="bold" fill="white">TROY</text>
      </svg>
    )
    return (
      <svg width="32" height="20" viewBox="0 0 38 24" fill="none">
        <rect width="38" height="24" rx="3" fill="#333"/>
        <rect x="3" y="8" width="32" height="8" rx="1" fill="#555"/>
      </svg>
    )
  }

  const inputStyle = {
    width: "100%",
    border: "none",
    borderBottom: "1px solid var(--border)",
    padding: "10px 0",
    fontSize: "0.9rem",
    color: "var(--foreground)",
    background: "transparent",
    outline: "none",
    fontFamily: "var(--font-dm-sans)",
  }

  const labelStyle = {
    display: "block",
    fontSize: "0.65rem",
    letterSpacing: "0.18em",
    textTransform: "uppercase" as const,
    color: "var(--muted)",
    marginBottom: "4px",
  }

  if (loading) return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Yukleniyor...</p>
    </main>
  )

  return (
    <main style={{ minHeight: "100vh", background: "var(--background)" }}>

      <div style={{ background: "#0A0A0A", padding: "20px 24px", display: "flex", alignItems: "center", gap: "16px" }}>
        <Link href="/customer/profile" style={{ color: "#fff", display: "flex", alignItems: "center" }}>
          <ArrowLeft size={20} />
        </Link>
        <div>
          <div style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "20px", fontWeight: 300, color: "#fff" }}>Kartlarim</div>
          <div style={{ fontSize: "11px", color: "#666", marginTop: "2px" }}>{cards.length} kayitli kart — iyzico guvencesiyle</div>
        </div>
      </div>

      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "24px" }}>

        {success && (
          <p style={{ fontSize: "0.8rem", color: "var(--success-dark)", padding: "0.7rem 1rem", border: "1px solid var(--success)", marginBottom: "16px" }}>
            {success}
          </p>
        )}

        <div style={{ display: "flex", flexDirection: "column" as const, gap: "12px" }}>

          {cards.length === 0 && !showForm && (
            <p style={{ fontSize: "0.9rem", color: "var(--muted)", textAlign: "center" as const, padding: "40px 0" }}>
              Henuz kayitli kartiniz yok.
            </p>
          )}

          {cards.map(card => (
            <div key={card.id} style={{ border: card.is_default ? "1px solid var(--foreground)" : "0.5px solid var(--border)", borderRadius: "12px", padding: "18px 20px", display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ flexShrink: 0 }}>{getCardIcon(card.card_type)}</div>
              <div style={{ flex: 1 }}>
                {card.is_default && (
                  <span style={{ fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase" as const, background: "#0A0A0A", color: "#fff", padding: "2px 8px", borderRadius: "2px", display: "inline-block", marginBottom: "6px" }}>
                    Varsayilan
                  </span>
                )}
                <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--foreground)", letterSpacing: "0.08em" }}>
                  •••• •••• •••• {card.last_four_digits}
                </div>
                <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "3px" }}>
                  {card.card_type} — {card.cardholder_name} — {card.expire_month}/{card.expire_year}
                </div>
              </div>
              <button
                onClick={() => setShowDeleteId(card.id)}
                style={{ background: "none", border: "0.5px solid var(--error)", padding: "7px 12px", cursor: "pointer", color: "var(--error)", display: "flex", alignItems: "center", gap: "4px", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase" as const, fontFamily: "var(--font-dm-sans)", flexShrink: 0 }}
              >
                <Trash2 size={12} /> Sil
              </button>
            </div>
          ))}

          {/* INLINE FORM */}
          {showForm && (
            <div style={{ border: "1px solid var(--foreground)", borderRadius: "12px", padding: "24px", background: "var(--background)" }}>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "18px", fontWeight: 300 }}>Yeni Kart Ekle</p>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "var(--muted)" }}>
                  <ShieldCheck size={14} />
                  iyzico ile guvenli
                </div>
              </div>

              <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column" as const, gap: "16px" }}>

                <div>
                  <label style={labelStyle}>Kart Sahibinin Adi *</label>
                  <input style={inputStyle} name="cardholder_name" placeholder="Kart uzerindeki isim" value={form.cardholder_name} onChange={handleChange} />
                </div>

                <div>
                  <label style={labelStyle}>Kart Numarasi *</label>
                  <input
                    style={{ ...inputStyle, letterSpacing: "0.1em", fontSize: "1rem" }}
                    name="card_number"
                    placeholder="0000 0000 0000 0000"
                    value={form.card_number}
                    onChange={handleChange}
                    maxLength={19}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "16px" }}>
                  <div>
                    <label style={labelStyle}>Son Kullanma Ayi *</label>
                    <input style={inputStyle} name="expire_month" placeholder="AA" value={form.expire_month} onChange={handleChange} maxLength={2} />
                  </div>
                  <div>
                    <label style={labelStyle}>Son Kullanma Yili *</label>
                    <input style={inputStyle} name="expire_year" placeholder="YY" value={form.expire_year} onChange={handleChange} maxLength={2} />
                  </div>
                  <div>
                    <label style={labelStyle}>CVC *</label>
                    <input style={inputStyle} name="cvc" placeholder="•••" value={form.cvc} onChange={handleChange} maxLength={4} type="password" />
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <input type="checkbox" id="card_default" name="is_default" checked={form.is_default} onChange={handleChange} style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "#0A0A0A" }} />
                  <label htmlFor="card_default" style={{ fontSize: "0.82rem", color: "var(--muted)", cursor: "pointer" }}>
                    Varsayilan kart olarak ayarla
                  </label>
                </div>

                <div style={{ background: "var(--surface)", padding: "12px 16px", borderRadius: "8px", display: "flex", alignItems: "flex-start", gap: "10px" }}>
                  <ShieldCheck size={16} color="var(--muted)" style={{ flexShrink: 0, marginTop: "1px" }} />
                  <p style={{ fontSize: "11px", color: "var(--muted)", lineHeight: 1.6 }}>
                    Kart bilgileriniz iyzico altyapisi ile sifrelenerek islenur. Kart numaraniz sistemimizde saklanmaz, yalnizca guvenli token kullanilir.
                  </p>
                </div>

                {error && (
                  <p style={{ fontSize: "0.78rem", color: "var(--error)", padding: "0.6rem 0.8rem", border: "1px solid var(--error)" }}>
                    {error}
                  </p>
                )}

                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" as const }}>
                  <button type="submit" disabled={saving} style={{ background: "#0A0A0A", color: "#fff", border: "none", padding: "12px 28px", fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase" as const, cursor: saving ? "not-allowed" : "pointer", fontFamily: "var(--font-dm-sans)", opacity: saving ? 0.6 : 1 }}>
                    {saving ? "Kaydediliyor..." : "Karti Kaydet"}
                  </button>
                  <button type="button" onClick={() => { setShowForm(false); setForm(emptyForm); setError("") }} style={{ background: "transparent", color: "var(--muted)", border: "0.5px solid var(--border)", padding: "12px 28px", fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase" as const, cursor: "pointer", fontFamily: "var(--font-dm-sans)" }}>
                    Vazgec
                  </button>
                </div>

              </form>
            </div>
          )}

          {!showForm && (
            <button onClick={() => setShowForm(true)} style={{ border: "0.5px dashed var(--border)", padding: "16px", textAlign: "center" as const, fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase" as const, color: "var(--muted)", cursor: "pointer", background: "none", fontFamily: "var(--font-dm-sans)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%" }}>
              <Plus size={14} /> Yeni Kart Ekle
            </button>
          )}

        </div>
      </div>

      {/* SİL POP-UP */}
      {showDeleteId && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setShowDeleteId(null) }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 999 }}>
          <div style={{ background: "var(--background)", width: "100%", maxWidth: "520px", padding: "28px 24px", borderRadius: "16px 16px 0 0" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "50%", border: "1px solid var(--error)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Trash2 size={18} color="var(--error)" />
            </div>
            <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "20px", fontWeight: 300, textAlign: "center" as const, marginBottom: "8px", color: "var(--foreground)" }}>
              Karti silmek istiyor musunuz?
            </p>
            <p style={{ fontSize: "13px", color: "var(--muted)", textAlign: "center" as const, lineHeight: 1.7, marginBottom: "24px" }}>
              Bu kart iyzico sisteminden de kalici olarak silinecek.
            </p>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: "8px" }}>
              <button onClick={() => handleDelete(cards.find(c => c.id === showDeleteId)!)} style={{ background: "#c0392b", color: "#fff", border: "none", padding: "13px", fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase" as const, cursor: "pointer", fontFamily: "var(--font-dm-sans)" }}>
                Evet, Sil
              </button>
              <button onClick={() => setShowDeleteId(null)} style={{ background: "transparent", color: "var(--muted)", border: "0.5px solid var(--border)", padding: "13px", fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase" as const, cursor: "pointer", fontFamily: "var(--font-dm-sans)" }}>
                Vazgec
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  )
}