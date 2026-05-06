"use client"

import type React from "react"
import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, Plus, Check, ChevronRight } from "lucide-react"

type Address = {
   id: number
  title: string
  full_name: string
  phone: string
  city_id: number
  city_name: string
  district_id: number
  district_name: string
  full_address: string
  is_default: boolean
}

export default function CheckoutAddressPage() {
  const router = useRouter()
  const supabase = createClient()

  const [addresses, setAddresses] = useState<Address[]>([])
  const [cities, setCities] = useState<{ id: number; name: string }[]>([])
  const [districts, setDistricts] = useState<{ id: number; name: string; city_id: number }[]>([])
  const [filteredDistricts, setFilteredDistricts] = useState<{ id: number; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [showForm, setShowForm] = useState(false)

  const [shippingId, setShippingId] = useState<number | null>(null)
  const [billingId, setBillingId] = useState<number | null>(null)
  const [sameAddress, setSameAddress] = useState(true)

  const [form, setForm] = useState({
  title: "",
  full_name: "",
  phone: "",
  city_id: "",
  district_id: "",
  full_address: "",
})

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/customer/login"); return }

      const [{ data: addrs }, { data: cityData }, { data: distData }] = await Promise.all([
        supabase.from("addresses").select("*").eq("user_id", user.id).order("is_default", { ascending: false }),
        supabase.from("cities").select("id, name").order("name"),
        supabase.from("districts").select("id, name, city_id").order("name"),
      ])

      setAddresses(addrs || [])
      setCities(cityData || [])
      setDistricts(distData || [])

      if (addrs && addrs.length > 0) {
        const def = addrs.find(a => a.is_default) || addrs[0]
        setShippingId(def.id)
        setBillingId(def.id)
      } else {
        setShowForm(true)
      }

      // Daha önce seçilmişse localStorage'dan oku
      const savedShipping = localStorage.getItem("checkout_shipping_id")
      const savedBilling = localStorage.getItem("checkout_billing_id")
      const savedSame = localStorage.getItem("checkout_same_address")
      if (savedShipping) setShippingId(parseInt(savedShipping))
      if (savedBilling) setBillingId(parseInt(savedBilling))
      if (savedSame) setSameAddress(savedSame === "true")

      setLoading(false)
    }
    init()
  }, [])

  useEffect(() => {
  if (!form.city_id) return

  setFilteredDistricts(
    districts.filter(d => d.city_id === Number(form.city_id))
  )

  setForm(prev => ({
    ...prev,
    district_id: "",
  }))
}, [form.city_id, districts])

  const saveAddress = async () => {
    const required = [
  form.title,
  form.full_name,
  form.phone,
  form.city_id,
  form.district_id,
  form.full_address,
]
    if (required.some(f => !f.trim())) {
      setError("Lutfen zorunlu alanları (*) doldurun.")
      return
    }

    setSaving(true)
    setError("")

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

  const selectedCity = cities.find(
  c => c.id === Number(form.city_id)
)

const selectedDistrict = districts.find(
  d => d.id === Number(form.district_id)
)

const { data, error: err } = await supabase
  .from("addresses")
  .insert({
    user_id: user.id,
    title: form.title,
    full_name: form.full_name,
    phone: form.phone,

    city_id: Number(form.city_id),
    city_name: selectedCity?.name || "",

    district_id: Number(form.district_id),
    district_name: selectedDistrict?.name || "",

    full_address: form.full_address,

    is_default: addresses.length === 0,
  })
  .select()
  .single()

    if (err || !data) {
      setError("Adres kaydedilemedi: " + (err?.message || "Hata"))
      setSaving(false)
      return
    }

    setAddresses(prev => [...prev, data])
    setShippingId(data.id)
    if (sameAddress) setBillingId(data.id)
    setShowForm(false)
    setForm({ title: "", full_name: "", phone: "", city_id: "", district_id: "", full_address: "" })
    setSaving(false)
  }

  const goToPayment = () => {
    if (!shippingId) { setError("Lutfen teslimat adresi secin."); return }
    if (!sameAddress && !billingId) { setError("Lutfen fatura adresi secin."); return }

    // Seçimi kaydet
    localStorage.setItem("checkout_shipping_id", String(shippingId))
    localStorage.setItem("checkout_billing_id", String(sameAddress ? shippingId : billingId))
    localStorage.setItem("checkout_same_address", String(sameAddress))

    router.push("/customer/checkout/payment")
  }

  const selectedShipping = addresses.find(a => a.id === shippingId)

  const inp: React.CSSProperties = {
    width: "100%", border: "none", borderBottom: "1px solid #e0e0e0",
    padding: "10px 0", fontSize: "13px", outline: "none",
    fontFamily: "var(--font-dm-sans)", background: "transparent", color: "#0A0A0A",
  }

  const lbl: React.CSSProperties = {
    display: "block", fontSize: "10px", letterSpacing: "0.12em",
    textTransform: "uppercase", color: "#888", marginBottom: "4px",
  }

  if (loading) return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#888", fontSize: "13px" }}>Yukleniyor...</p>
    </main>
  )

  return (
    <main style={{ minHeight: "100vh", background: "#F8F8F8" }}>
      <style>{`
        .addr-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        @media (max-width: 600px) { .addr-grid { grid-template-columns: 1fr; } }
      `}</style>

      {/* HEADER */}
      <div style={{ background: "#0A0A0A", padding: "1.2rem 2rem" }}>
        <div style={{ maxWidth: "700px", margin: "0 auto", display: "flex", alignItems: "center", gap: "12px" }}>
          <Link href="/cart" style={{ color: "#666", display: "flex" }}><ArrowLeft size={18} /></Link>
          <Link href="/" style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.4rem", fontWeight: 300, color: "#fff", textDecoration: "none" }}>LUIR</Link>
          <span style={{ color: "#444" }}>/</span>
          <span style={{ fontSize: "12px", color: "#888" }}>Teslimat Bilgileri</span>
        </div>
      </div>

      {/* ADIM GÖSTER */}
      <div style={{ background: "#fff", borderBottom: "0.5px solid #efefef" }}>
        <div style={{ maxWidth: "700px", margin: "0 auto", padding: "0 2rem", display: "flex", alignItems: "center" }}>
          <div style={{ padding: "0.9rem 1rem", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", borderBottom: "2px solid #0A0A0A", color: "#0A0A0A", display: "flex", alignItems: "center", gap: "6px" }}>
            1. Adres
          </div>
          <ChevronRight size={13} color="#ddd" />
          <div style={{ padding: "0.9rem 1rem", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#bbb", display: "flex", alignItems: "center", gap: "6px" }}>
            2. Odeme
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "2rem" }}>

        {/* TESLİMAT ADRESİ */}
        <div style={{ background: "#fff", border: "0.5px solid #efefef", padding: "1.5rem", marginBottom: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }}>
            <h2 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.4rem", fontWeight: 300 }}>Teslimat Adresi</h2>
            {!showForm && (
              <button onClick={() => setShowForm(true)} style={{ fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", background: "none", border: "0.5px solid #e0e0e0", padding: "7px 14px", cursor: "pointer", fontFamily: "var(--font-dm-sans)", color: "#888", display: "flex", alignItems: "center", gap: "5px" }}>
                <Plus size={11} /> Yeni Adres
              </button>
            )}
          </div>

          {/* KAYITLI ADRESLER */}
          {addresses.length > 0 && !showForm && (
            <div style={{ display: "flex", flexDirection: "column" as const, gap: "8px" }}>
              {addresses.map(addr => (
                <label key={addr.id} style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "1rem 1.2rem", border: shippingId === addr.id ? "1.5px solid #0A0A0A" : "0.5px solid #e0e0e0", cursor: "pointer", transition: "border-color 0.15s", borderRadius: "2px" }}>
                  <input
                    type="radio"
                    name="shipping"
                    checked={shippingId === addr.id}
                    onChange={() => { setShippingId(addr.id); if (sameAddress) setBillingId(addr.id) }}
                    style={{ accentColor: "#0A0A0A", marginTop: "3px", flexShrink: 0 }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "13px", fontWeight: 500, marginBottom: "4px", display: "flex", alignItems: "center", gap: "8px" }}>
                      {addr.title}
                      {addr.is_default && <span style={{ fontSize: "8px", letterSpacing: "0.1em", textTransform: "uppercase", background: "#0A0A0A", color: "#fff", padding: "2px 7px" }}>Varsayilan</span>}
                    </div>
                    <div style={{ fontSize: "13px", color: "#0A0A0A", marginBottom: "2px" }}>{addr.full_name}</div>
                    <div style={{ fontSize: "12px", color: "#888", lineHeight: 1.6 }}>{addr.phone}</div>
                    <div style={{ fontSize: "12px", color: "#888", lineHeight: 1.6 }}>
                      {addr.full_address}
                    </div>
                    <div style={{ fontSize: "12px", color: "#888" }}>
                      {addr.district_id} / {addr.city_id}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}

          {/* YENİ ADRES FORMU */}
          {showForm && (
            <div>
              {addresses.length > 0 && (
                <button onClick={() => setShowForm(false)} style={{ fontSize: "11px", color: "#888", background: "none", border: "none", cursor: "pointer", marginBottom: "1rem", fontFamily: "var(--font-dm-sans)", display: "flex", alignItems: "center", gap: "4px" }}>
                  <ArrowLeft size={12} /> Kayitli adreslere don
                </button>
              )}

              <div style={{ display: "flex", flexDirection: "column" as const, gap: "1.2rem" }}>
                <div className="addr-grid">
                  <div>
                    <label style={lbl}>Adres Basligi *</label>
                    <input style={inp} placeholder="Ev, Is, Diger..." value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
                  </div>
                  <div>
                    <label style={lbl}>Ad Soyad *</label>
                    <input style={inp} placeholder="Ad Soyad" value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} />
                  </div>
                </div>

                <div>
                  <label style={lbl}>Telefon *</label>
                  <input style={inp} placeholder="05XX XXX XX XX" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} inputMode="tel" />
                </div>

                <div className="addr-grid">
                  <div>
                    <label style={lbl}>Il *</label>
                    <select style={{ ...inp, appearance: "none" as const, cursor: "pointer" }} value={form.city_id} onChange={e => setForm(p => ({ ...p, city_id: e.target.value }))}>
                      <option value="">Secin</option>
                      {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Ilce *</label>
                    <select style={{ ...inp, appearance: "none" as const, cursor: "pointer" }} value={form.district_id} onChange={e => setForm(p => ({ ...p, district_id: e.target.value }))}>
                      <option value="">Secin</option>
                      {filteredDistricts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={lbl}>Acik Adres *</label>
                  <textarea rows={3} style={{ ...inp, resize: "none" as const, lineHeight: "1.7" }} placeholder="Cadde, sokak, bina no, daire no..." value={form.full_address} onChange={e => setForm(p => ({ ...p, full_address: e.target.value }))} />
                </div>

                {error && <p style={{ fontSize: "12px", color: "#A32D2D", padding: "8px 12px", background: "#FCEBEB", border: "1px solid #E24B4A" }}>{error}</p>}

                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={saveAddress} disabled={saving} style={{ flex: 1, background: "#0A0A0A", color: "#fff", border: "none", padding: "12px", fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", cursor: saving ? "not-allowed" : "pointer", fontFamily: "var(--font-dm-sans)", opacity: saving ? 0.6 : 1 }}>
                    {saving ? "Kaydediliyor..." : "Adresi Kaydet"}
                  </button>
                  {addresses.length > 0 && (
                    <button onClick={() => { setShowForm(false); setError("") }} style={{ padding: "12px 20px", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", background: "none", border: "0.5px solid #e0e0e0", cursor: "pointer", fontFamily: "var(--font-dm-sans)", color: "#888" }}>
                      Vazgec
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FATURA ADRESİ */}
        {!showForm && addresses.length > 0 && (
          <div style={{ background: "#fff", border: "0.5px solid #efefef", padding: "1.5rem", marginBottom: "1rem" }}>
            <h2 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.4rem", fontWeight: 300, marginBottom: "1.2rem" }}>Fatura Adresi</h2>

            <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", padding: "1rem 1.2rem", border: sameAddress ? "1.5px solid #0A0A0A" : "0.5px solid #e0e0e0", marginBottom: sameAddress ? "0" : "12px", borderRadius: "2px" }}>
              <input
                type="checkbox"
                checked={sameAddress}
                onChange={e => { setSameAddress(e.target.checked); if (e.target.checked && shippingId) setBillingId(shippingId) }}
                style={{ accentColor: "#0A0A0A", width: "16px", height: "16px", cursor: "pointer", flexShrink: 0 }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "13px", fontWeight: 500 }}>Teslimat adresi ile aynı</div>
                {sameAddress && selectedShipping && (
                  <div style={{ fontSize: "12px", color: "#888", marginTop: "3px" }}>
                    {selectedShipping.title} — {selectedShipping.full_address}, {selectedShipping.district_id} / {selectedShipping.city_id}
                  </div>
                )}
              </div>
              {sameAddress && <Check size={16} color="#0A0A0A" />}
            </label>

            {!sameAddress && (
              <div style={{ display: "flex", flexDirection: "column" as const, gap: "8px" }}>
                {addresses.map(addr => (
                  <label key={addr.id} style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "1rem 1.2rem", border: billingId === addr.id ? "1.5px solid #0A0A0A" : "0.5px solid #e0e0e0", cursor: "pointer", borderRadius: "2px" }}>
                    <input type="radio" name="billing" checked={billingId === addr.id} onChange={() => setBillingId(addr.id)} style={{ accentColor: "#0A0A0A", marginTop: "3px" }} />
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 500, marginBottom: "3px" }}>{addr.title}</div>
                      <div style={{ fontSize: "12px", color: "#888", lineHeight: 1.6 }}>{addr.full_name} · {addr.full_address}, {addr.district_id} / {addr.city_id}</div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {error && !showForm && (
          <p style={{ fontSize: "12px", color: "#A32D2D", padding: "8px 12px", background: "#FCEBEB", border: "1px solid #E24B4A", marginBottom: "1rem" }}>{error}</p>
        )}

        {!showForm && (
          <button
            onClick={goToPayment}
            style={{ width: "100%", background: "#0A0A0A", color: "#fff", border: "none", padding: "14px", fontSize: "11px", letterSpacing: "0.18em", textTransform: "uppercase", cursor: "pointer", fontFamily: "var(--font-dm-sans)", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
          >
            Odemeye Gec <ChevronRight size={14} />
          </button>
        )}
      </div>
    </main>
  )
}