"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, Plus, Pencil, Trash2, Check, X } from "lucide-react"

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

type City = { id: number; name: string }
type District = { id: number; name: string; city_id: number }

const emptyForm = {
  title: "",
  full_name: "",
  phone: "",
  city_id: 0,
  district_id: 0,
  full_address: "",
  is_default: false,
}

export default function AddressesPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [addresses, setAddresses] = useState<Address[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [districts, setDistricts] = useState<District[]>([])
  const [filteredDistricts, setFilteredDistricts] = useState<District[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [showDeleteId, setShowDeleteId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const fetchAddresses = async (uid: string) => {
    const { data } = await supabase
      .from("addresses")
      .select("*, cities(name), districts(name)")
      .eq("user_id", uid)
      .order("is_default", { ascending: false })

    const mapped = (data || []).map(a => ({
      ...a,
      city_name: a.cities?.name || "",
      district_name: a.districts?.name || "",
    }))
    setAddresses(mapped)
  }

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/customer/login"); return }
      setUserId(user.id)

      const [{ data: cityData }, { data: districtData }] = await Promise.all([
        supabase.from("cities").select("*").eq("is_active", true).order("name"),
        supabase.from("districts").select("*").eq("is_active", true).order("name"),
      ])

      setCities(cityData || [])
      setDistricts(districtData || [])
      await fetchAddresses(user.id)
      setLoading(false)
    }
    init()
  }, [])

  useEffect(() => {
    if (form.city_id) {
      setFilteredDistricts(districts.filter(d => d.city_id === Number(form.city_id)))
    } else {
      setFilteredDistricts([])
    }
  }, [form.city_id, districts])

  const handleChange = (e) => {
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.type === "number" ? Number(e.target.value) : e.target.value
    if (e.target.name === "city_id") {
      setForm(prev => ({ ...prev, city_id: Number(e.target.value), district_id: 0 }))
    } else {
      setForm(prev => ({ ...prev, [e.target.name]: val }))
    }
  }

  const openAdd = () => {
    setEditId(null)
    setForm(emptyForm)
    setError("")
    setShowForm(true)
    setTimeout(() => document.getElementById("addr-form")?.scrollIntoView({ behavior: "smooth" }), 100)
  }

  const openEdit = (addr: Address) => {
    setEditId(addr.id)
    setForm({
      title: addr.title,
      full_name: addr.full_name,
      phone: addr.phone,
      city_id: addr.city_id,
      district_id: addr.district_id,
      full_address: addr.full_address,
      is_default: addr.is_default,
    })
    setError("")
    setShowForm(true)
    setTimeout(() => document.getElementById("addr-form")?.scrollIntoView({ behavior: "smooth" }), 100)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditId(null)
    setForm(emptyForm)
    setError("")
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setError("")

    if (!form.title.trim()) { setError("Adres basligi zorunludur."); return }
    if (!form.full_name.trim()) { setError("Ad soyad zorunludur."); return }
    if (!form.phone.trim()) { setError("Telefon zorunludur."); return }
    if (!form.city_id) { setError("Sehir secimi zorunludur."); return }
    if (!form.district_id) { setError("Ilce secimi zorunludur."); return }
    if (!form.full_address.trim()) { setError("Acik adres zorunludur."); return }

    setSaving(true)

    try {
      if (form.is_default) {
        await supabase.from("addresses").update({ is_default: false }).eq("user_id", userId)
      }

      const payload = {
        title: form.title,
        full_name: form.full_name,
        phone: form.phone,
        city_id: form.city_id,
        district_id: form.district_id,
        full_address: form.full_address,
        is_default: form.is_default,
      }

      if (editId) {
        await supabase.from("addresses").update(payload).eq("id", editId)
      } else {
        await supabase.from("addresses").insert({ ...payload, user_id: userId })
      }

      await fetchAddresses(userId!)
      setShowForm(false)
      setEditId(null)
      setForm(emptyForm)
      setSuccess(editId ? "Adres guncellendi." : "Adres eklendi.")
      setTimeout(() => setSuccess(""), 3000)
    } catch {
      setError("Bir hata olustu.")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    await supabase.from("addresses").delete().eq("id", id)
    await fetchAddresses(userId!)
    setShowDeleteId(null)
    setSuccess("Adres silindi.")
    setTimeout(() => setSuccess(""), 3000)
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

  const selectStyle = {
    ...inputStyle,
    appearance: "none" as const,
    cursor: "pointer",
  }

  const labelStyle = {
    display: "block",
    fontSize: "0.65rem",
    letterSpacing: "0.18em",
    textTransform: "uppercase" as const,
    color: "var(--muted)",
    marginBottom: "4px",
  }

  if (loading) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Yukleniyor...</p>
      </main>
    )
  }

  return (
    <main style={{ minHeight: "100vh", background: "var(--background)" }}>

      {/* HEADER */}
      <div style={{ background: "#0A0A0A", padding: "20px 24px", display: "flex", alignItems: "center", gap: "16px" }}>
        <Link href="/customer/profile" style={{ color: "#fff", display: "flex", alignItems: "center" }}>
          <ArrowLeft size={20} />
        </Link>
        <div>
          <div style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "20px", fontWeight: 300, color: "#fff" }}>
            Adreslerim
          </div>
          <div style={{ fontSize: "11px", color: "#666", marginTop: "2px" }}>
            {addresses.length} kayitli adres
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "24px" }}>

        {success && (
          <p style={{ fontSize: "0.8rem", color: "var(--success-dark)", padding: "0.7rem 1rem", border: "1px solid var(--success)", marginBottom: "16px" }}>
            {success}
          </p>
        )}

        <div style={{ display: "flex", flexDirection: "column" as const, gap: "12px" }}>

          {addresses.length === 0 && !showForm && (
            <p style={{ fontSize: "0.9rem", color: "var(--muted)", textAlign: "center" as const, padding: "40px 0" }}>
              Henuz kayitli adresiniz yok.
            </p>
          )}

          {addresses.map(addr => (
            <div
              key={addr.id}
              style={{ border: addr.is_default ? "1px solid var(--foreground)" : "0.5px solid var(--border)", borderRadius: "12px", padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", background: editId === addr.id ? "var(--surface)" : "var(--background)", transition: "background 0.2s" }}
            >
              <div style={{ flex: 1 }}>
                {addr.is_default && (
                  <span style={{ fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase" as const, background: "#0A0A0A", color: "#fff", padding: "2px 8px", borderRadius: "2px", display: "inline-block", marginBottom: "8px" }}>
                    Varsayilan
                  </span>
                )}
                <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--foreground)", marginBottom: "4px" }}>{addr.title}</div>
                <div style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "2px" }}>{addr.full_name}</div>
                <div style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.6 }}>
                  {addr.full_address}<br />
                  {addr.district_name}, {addr.city_name}
                </div>
                <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "4px" }}>{addr.phone}</div>
              </div>
              <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                <button onClick={() => openEdit(addr)} style={{ background: "none", border: "0.5px solid var(--border)", padding: "7px 10px", cursor: "pointer", color: "var(--muted)", display: "flex", alignItems: "center", gap: "4px", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase" as const, fontFamily: "var(--font-dm-sans)" }}>
                  <Pencil size={12} /> Duzenle
                </button>
                <button onClick={() => setShowDeleteId(addr.id)} style={{ background: "none", border: "0.5px solid var(--error)", padding: "7px 10px", cursor: "pointer", color: "var(--error)", display: "flex", alignItems: "center", gap: "4px", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase" as const, fontFamily: "var(--font-dm-sans)" }}>
                  <Trash2 size={12} /> Sil
                </button>
              </div>
            </div>
          ))}

          {/* INLINE FORM */}
          {showForm && (
            <div id="addr-form" style={{ border: "1px solid var(--foreground)", borderRadius: "12px", padding: "24px", background: "var(--background)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "18px", fontWeight: 300, color: "var(--foreground)" }}>
                  {editId ? "Adresi Duzenle" : "Yeni Adres"}
                </p>
                <button onClick={handleCancel} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", display: "flex" }}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column" as const, gap: "16px" }}>

                <div>
                  <label style={labelStyle}>Adres Basligi *</label>
                  <input style={inputStyle} name="title" placeholder="Ev, Is, Diger..." value={form.title} onChange={handleChange} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
                  <div>
                    <label style={labelStyle}>Ad Soyad *</label>
                    <input style={inputStyle} name="full_name" placeholder="Alici adi" value={form.full_name} onChange={handleChange} />
                  </div>
                  <div>
                    <label style={labelStyle}>Telefon *</label>
                    <input style={inputStyle} name="phone" placeholder="05xx xxx xx xx" value={form.phone} onChange={handleChange} />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
                  <div>
                    <label style={labelStyle}>Sehir *</label>
                    <select style={selectStyle} name="city_id" value={form.city_id} onChange={handleChange}>
                      <option value={0} disabled>Sehir secin</option>
                      {cities.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Ilce *</label>
                    <select
                      style={{ ...selectStyle, opacity: !form.city_id ? 0.5 : 1 }}
                      name="district_id"
                      value={form.district_id}
                      onChange={handleChange}
                      disabled={!form.city_id}
                    >
                      <option value={0} disabled>
                        {form.city_id ? "Ilce secin" : "Once sehir secin"}
                      </option>
                      {filteredDistricts.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Acik Adres *</label>
                  <input style={inputStyle} name="full_address" placeholder="Mahalle, cadde, no, daire..." value={form.full_address} onChange={handleChange} />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <input type="checkbox" id="is_default" name="is_default" checked={form.is_default} onChange={handleChange} style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "#0A0A0A" }} />
                  <label htmlFor="is_default" style={{ fontSize: "0.82rem", color: "var(--muted)", cursor: "pointer" }}>
                    Varsayilan adres olarak ayarla
                  </label>
                </div>

                {error && (
                  <p style={{ fontSize: "0.78rem", color: "var(--error)", padding: "0.6rem 0.8rem", border: "1px solid var(--error)" }}>
                    {error}
                  </p>
                )}

                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" as const }}>
                  <button type="submit" disabled={saving} style={{ background: "#0A0A0A", color: "#fff", border: "none", padding: "12px 28px", fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase" as const, cursor: saving ? "not-allowed" : "pointer", fontFamily: "var(--font-dm-sans)", opacity: saving ? 0.6 : 1, display: "flex", alignItems: "center", gap: "6px" }}>
                    <Check size={14} />
                    {saving ? "Kaydediliyor..." : "Kaydet"}
                  </button>
                  <button type="button" onClick={handleCancel} style={{ background: "transparent", color: "var(--muted)", border: "0.5px solid var(--border)", padding: "12px 28px", fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase" as const, cursor: "pointer", fontFamily: "var(--font-dm-sans)" }}>
                    Vazgec
                  </button>
                </div>

              </form>
            </div>
          )}

          {!showForm && (
            <button onClick={openAdd} style={{ border: "0.5px dashed var(--border)", padding: "16px", textAlign: "center" as const, fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase" as const, color: "var(--muted)", cursor: "pointer", background: "none", fontFamily: "var(--font-dm-sans)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%" }}>
              <Plus size={14} />
              Yeni Adres Ekle
            </button>
          )}

        </div>
      </div>

      {/* SİL ONAY POP-UP */}
      {showDeleteId && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setShowDeleteId(null) }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 999 }}>
          <div style={{ background: "var(--background)", width: "100%", maxWidth: "520px", padding: "28px 24px", borderRadius: "16px 16px 0 0" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "50%", border: "1px solid var(--error)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Trash2 size={18} color="var(--error)" />
            </div>
            <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "20px", fontWeight: 300, textAlign: "center" as const, marginBottom: "8px", color: "var(--foreground)" }}>
              Adresi silmek istiyor musunuz?
            </p>
            <p style={{ fontSize: "13px", color: "var(--muted)", textAlign: "center" as const, lineHeight: 1.7, marginBottom: "24px" }}>
              Bu adres kalici olarak silinecek.
            </p>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: "8px" }}>
              <button onClick={() => handleDelete(showDeleteId)} style={{ background: "#c0392b", color: "#fff", border: "none", padding: "13px", fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase" as const, cursor: "pointer", fontFamily: "var(--font-dm-sans)" }}>
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