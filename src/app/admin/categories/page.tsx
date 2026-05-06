"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, Plus, Trash2, Upload, Save, X, LogOut, GripVertical } from "lucide-react"

type Category = {
  id: number
  name: string
  slug: string
  sort_order: number
  image_url: string | null
  parent_id: number | null
}

export default function AdminCategoriesPage() {
  const router = useRouter()
  const supabase = createClient()

  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [form, setForm] = useState({
    name: "",
    slug: "",
    sort_order: "",
    parent_id: "",
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImg, setUploadingImg] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/admin/login"); return }
      const { data } = await supabase.from("admins").select("id").eq("id", user.id).single()
      if (!data) { router.push("/admin/login"); return }
      fetchCategories()
    }
    init()
  }, [])

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("id, name, slug, sort_order, image_url, parent_id")
      .order("sort_order")
    setCategories(data || [])
    setLoading(false)
  }

  const autoSlug = (name: string) => {
    return name
      .toLocaleLowerCase("tr-TR")
      .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
      .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
      .replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
  }

  const handleNameChange = (name: string) => {
    setForm(p => ({ ...p, name, slug: autoSlug(name) }))
  }

  const openEdit = (cat: Category) => {
    setEditingId(cat.id)
    setForm({
      name: cat.name,
      slug: cat.slug || "",
      sort_order: String(cat.sort_order || ""),
      parent_id: cat.parent_id ? String(cat.parent_id) : "",
    })
    setImagePreview(cat.image_url)
    setImageFile(null)
    setShowForm(true)
    setError("")
    setSuccess("")
  }

  const openNew = () => {
    setEditingId(null)
    setForm({ name: "", slug: "", sort_order: String(categories.length + 1), parent_id: "" })
    setImageFile(null)
    setImagePreview(null)
    setShowForm(true)
    setError("")
    setSuccess("")
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingId(null)
    setError("")
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleSave = async () => {
    if (!form.name.trim()) { setError("Kategori adi zorunludur."); return }
    if (!form.slug.trim()) { setError("Slug zorunludur."); return }

    setSaving(true)
    setError("")

    let imageUrl = imagePreview

    // Görsel yükle
    if (imageFile) {
      setUploadingImg(true)
      const ext = imageFile.name.split(".").pop()
      const fileName = form.slug + "-" + Date.now() + "." + ext
      const { error: upErr } = await supabase.storage
        .from("category-images")
        .upload(fileName, imageFile, { upsert: true })

      if (!upErr) {
        const { data: urlData } = supabase.storage.from("category-images").getPublicUrl(fileName)
        imageUrl = urlData.publicUrl
      }
      setUploadingImg(false)
    }

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      sort_order: parseInt(form.sort_order) || 0,
      parent_id: form.parent_id ? parseInt(form.parent_id) : null,
      image_url: imageUrl || null,
    }

    if (editingId) {
      const { error: err } = await supabase.from("categories").update(payload).eq("id", editingId)
      if (err) { setError("Guncelleme hatasi: " + err.message); setSaving(false); return }
      setSuccess("Kategori guncellendi.")
    } else {
      const { error: err } = await supabase.from("categories").insert(payload)
      if (err) { setError("Ekleme hatasi: " + err.message); setSaving(false); return }
      setSuccess("Kategori eklendi.")
    }

    await fetchCategories()
    setSaving(false)
    closeForm()
  }

  const handleDelete = async (id: number) => {
    setDeleting(true)
    const cat = categories.find(c => c.id === id)

    // Storage'dan görseli sil
    if (cat?.image_url) {
      const parts = cat.image_url.split("/storage/v1/object/public/category-images/")
      if (parts[1]) await supabase.storage.from("category-images").remove([parts[1]])
    }

    await supabase.from("categories").delete().eq("id", id)
    setCategories(prev => prev.filter(c => c.id !== id))
    setDeleteId(null)
    setDeleting(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/admin/login")
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

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#888" }}>Yukleniyor...</p>
    </div>
  )

  const rootCategories = categories.filter(c => !c.parent_id)
  const subCategories = categories.filter(c => c.parent_id)

  return (
    <div style={{ minHeight: "100vh", background: "#F5F5F5" }}>

      {/* NAVBAR */}
      <div style={{ background: "#0A0A0A", padding: "1rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Link href="/admin" style={{ color: "#555", display: "flex" }}><ArrowLeft size={20} /></Link>
          <div style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.4rem", fontWeight: 300, color: "#fff" }}>
            Kategoriler ({categories.length})
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={openNew} style={{ background: "#fff", color: "#0A0A0A", border: "none", padding: "7px 16px", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", fontFamily: "var(--font-dm-sans)", display: "flex", alignItems: "center", gap: "6px" }}>
            <Plus size={12} /> Yeni Kategori
          </button>
          <button onClick={handleLogout} style={{ background: "none", border: "0.5px solid #333", color: "#666", padding: "7px 14px", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", fontFamily: "var(--font-dm-sans)", display: "flex", alignItems: "center", gap: "6px" }}>
            <LogOut size={12} /> Cikis
          </button>
        </div>
      </div>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "2rem", display: "grid", gridTemplateColumns: showForm ? "1fr 380px" : "1fr", gap: "1.5rem" }}>

        {/* KATEGORİ LİSTESİ */}
        <div>
          {/* ANA KATEGORİLER */}
          <div style={{ background: "#fff", border: "0.5px solid #e0e0e0", marginBottom: "1rem" }}>
            <div style={{ padding: "12px 16px", borderBottom: "0.5px solid #e0e0e0", background: "#FAFAFA" }}>
              <span style={{ fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#888" }}>
                Ana Kategoriler ({rootCategories.length})
              </span>
            </div>
            {rootCategories.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "#888", fontSize: "13px" }}>Henuz kategori yok.</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "0.5px solid #e0e0e0" }}>
                    {["Gorsel", "Ad", "Slug", "Sira", "Alt Kat.", "Islem"].map(h => (
                      <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#888", fontWeight: 400 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rootCategories.map(cat => {
                    const subCount = subCategories.filter(s => s.parent_id === cat.id).length
                    return (
                      <tr key={cat.id} style={{ borderBottom: "0.5px solid #f0f0f0" }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#FAFAFA"}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "#fff"}
                      >
                        <td style={{ padding: "10px 14px" }}>
                          <div style={{ width: "48px", height: "48px", borderRadius: "50%", overflow: "hidden", background: "#f5f5f5", border: "0.5px solid #e0e0e0" }}>
                            {cat.image_url ? (
                              <img src={cat.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>📁</div>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: "10px 14px", fontSize: "13px", fontWeight: 500 }}>{cat.name}</td>
                        <td style={{ padding: "10px 14px", fontSize: "11px", color: "#888", fontFamily: "monospace" }}>{cat.slug}</td>
                        <td style={{ padding: "10px 14px", fontSize: "12px", color: "#888", textAlign: "center" }}>{cat.sort_order}</td>
                        <td style={{ padding: "10px 14px", fontSize: "12px", color: subCount > 0 ? "#185FA5" : "#bbb", textAlign: "center" }}>
                          {subCount > 0 ? subCount : "—"}
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button onClick={() => openEdit(cat)} style={{ background: "none", border: "0.5px solid #e0e0e0", cursor: "pointer", padding: "4px 10px", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "var(--font-dm-sans)", color: "#888" }}>
                              Duzenle
                            </button>
                            <button onClick={() => setDeleteId(cat.id)} style={{ background: "none", border: "0.5px solid #E24B4A", cursor: "pointer", width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", color: "#E24B4A" }}>
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* ALT KATEGORİLER */}
          {subCategories.length > 0 && (
            <div style={{ background: "#fff", border: "0.5px solid #e0e0e0" }}>
              <div style={{ padding: "12px 16px", borderBottom: "0.5px solid #e0e0e0", background: "#FAFAFA" }}>
                <span style={{ fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#888" }}>
                  Alt Kategoriler ({subCategories.length})
                </span>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "0.5px solid #e0e0e0" }}>
                    {["Gorsel", "Ad", "Slug", "Ust Kategori", "Sira", "Islem"].map(h => (
                      <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#888", fontWeight: 400 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {subCategories.map(cat => {
                    const parent = categories.find(c => c.id === cat.parent_id)
                    return (
                      <tr key={cat.id} style={{ borderBottom: "0.5px solid #f0f0f0" }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#FAFAFA"}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "#fff"}
                      >
                        <td style={{ padding: "10px 14px" }}>
                          <div style={{ width: "40px", height: "40px", borderRadius: "50%", overflow: "hidden", background: "#f5f5f5", border: "0.5px solid #e0e0e0" }}>
                            {cat.image_url ? (
                              <img src={cat.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>📂</div>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: "10px 14px", fontSize: "13px" }}>{cat.name}</td>
                        <td style={{ padding: "10px 14px", fontSize: "11px", color: "#888", fontFamily: "monospace" }}>{cat.slug}</td>
                        <td style={{ padding: "10px 14px", fontSize: "12px", color: "#185FA5" }}>{parent?.name || "—"}</td>
                        <td style={{ padding: "10px 14px", fontSize: "12px", color: "#888", textAlign: "center" }}>{cat.sort_order}</td>
                        <td style={{ padding: "10px 14px" }}>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button onClick={() => openEdit(cat)} style={{ background: "none", border: "0.5px solid #e0e0e0", cursor: "pointer", padding: "4px 10px", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "var(--font-dm-sans)", color: "#888" }}>
                              Duzenle
                            </button>
                            <button onClick={() => setDeleteId(cat.id)} style={{ background: "none", border: "0.5px solid #E24B4A", cursor: "pointer", width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", color: "#E24B4A" }}>
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* FORM PANELİ */}
        {showForm && (
          <div style={{ background: "#fff", border: "0.5px solid #e0e0e0", padding: "1.5rem", height: "fit-content", position: "sticky", top: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <div style={{ fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 500 }}>
                {editingId ? "Kategoriyi Duzenle" : "Yeni Kategori"}
              </div>
              <button onClick={closeForm} style={{ background: "none", border: "none", cursor: "pointer", color: "#888" }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>

              {/* GÖRSEL */}
              <div>
                <label style={lbl}>Gorsel (Daire)</label>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "64px", height: "64px", borderRadius: "50%", overflow: "hidden", background: "#f5f5f5", border: "0.5px solid #e0e0e0", flexShrink: 0 }}>
                    {imagePreview ? (
                      <img src={imagePreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>📁</div>
                    )}
                  </div>
                  <label style={{ fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", background: "#f5f5f5", border: "0.5px solid #e0e0e0", padding: "6px 12px", cursor: "pointer", fontFamily: "var(--font-dm-sans)", color: "#888", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Upload size={11} />
                    {imagePreview ? "Degistir" : "Gorsel Sec"}
                    <input type="file" accept="image/*" onChange={handleImageSelect} style={{ display: "none" }} />
                  </label>
                  {imagePreview && (
                    <button onClick={() => { setImageFile(null); setImagePreview(null) }} style={{ background: "none", border: "none", cursor: "pointer", color: "#E24B4A" }}>
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label style={lbl}>Kategori Adi *</label>
                <input style={inp} value={form.name} onChange={e => handleNameChange(e.target.value)} placeholder="ornek: Kol Cantasi" />
              </div>

              <div>
                <label style={lbl}>Slug *</label>
                <input style={{ ...inp, fontFamily: "monospace", color: "#888" }} value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))} placeholder="kol-cantasi" />
                <div style={{ fontSize: "10px", color: "#bbb", marginTop: "3px" }}>URL'de kullanilir. Otomatik olusturulur.</div>
              </div>

              <div>
                <label style={lbl}>Sira</label>
                <input style={inp} type="number" value={form.sort_order} onChange={e => setForm(p => ({ ...p, sort_order: e.target.value }))} placeholder="1" />
              </div>

              <div>
                <label style={lbl}>Ust Kategori (Opsiyonel)</label>
                <select style={{ ...inp, appearance: "none", cursor: "pointer" }} value={form.parent_id} onChange={e => setForm(p => ({ ...p, parent_id: e.target.value }))}>
                  <option value="">Ana kategori (ust yok)</option>
                  {rootCategories.filter(c => c.id !== editingId).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {error && <p style={{ fontSize: "12px", color: "#A32D2D", background: "#FCEBEB", padding: "8px 12px" }}>{error}</p>}
              {success && <p style={{ fontSize: "12px", color: "#3B6D11", background: "#EAF3DE", padding: "8px 12px" }}>{success}</p>}

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{ flex: 1, background: "#0A0A0A", color: "#fff", border: "none", padding: "11px", fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", cursor: saving ? "not-allowed" : "pointer", fontFamily: "var(--font-dm-sans)", opacity: saving ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                >
                  <Save size={13} />
                  {uploadingImg ? "Gorsel yukleniyor..." : saving ? "Kaydediliyor..." : editingId ? "Guncelle" : "Kaydet"}
                </button>
                <button onClick={closeForm} style={{ padding: "11px 16px", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", background: "none", border: "0.5px solid #e0e0e0", cursor: "pointer", fontFamily: "var(--font-dm-sans)", color: "#888" }}>
                  Iptal
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SİL ONAY */}
      {deleteId && (
        <div onClick={e => { if (e.target === e.currentTarget) setDeleteId(null) }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 999 }}>
          <div style={{ background: "#fff", width: "100%", maxWidth: "480px", padding: "28px 24px", borderRadius: "16px 16px 0 0" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "50%", border: "1px solid #E24B4A", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Trash2 size={18} color="#E24B4A" />
            </div>
            <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "20px", fontWeight: 300, textAlign: "center", marginBottom: "8px" }}>
              Kategoriyi silmek istiyor musunuz?
            </p>
            <p style={{ fontSize: "12px", color: "#888", textAlign: "center", lineHeight: 1.7, marginBottom: "24px" }}>
              Bu kategoriye bagli urunlerin kategorisi kaldirilacak.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <button onClick={() => handleDelete(deleteId)} disabled={deleting} style={{ background: "#c0392b", color: "#fff", border: "none", padding: "13px", fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", cursor: deleting ? "not-allowed" : "pointer", fontFamily: "var(--font-dm-sans)", opacity: deleting ? 0.6 : 1 }}>
                {deleting ? "Siliniyor..." : "Evet, Sil"}
              </button>
              <button onClick={() => setDeleteId(null)} style={{ background: "transparent", color: "#888", border: "0.5px solid #e0e0e0", padding: "13px", fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer", fontFamily: "var(--font-dm-sans)" }}>
                Vazgec
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}