"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, Plus, X, ImageIcon } from "lucide-react"

type Category = { id: number; name: string }
type Attribute = { id: number; name: string }
type AttributeValue = { id: number; value: string; attribute_id: number }

type VariantImage = {
  file: File
  preview: string
  isPrimary: boolean
}

type Variant = {
  tempId: string
  price: string
  stock: string
  sku: string
  selectedAttributes: Record<number, number>
  images: VariantImage[]
}

export default function AddProductPage() {
  const router = useRouter()
  const supabase = createClient()

  const [categories, setCategories] = useState<Category[]>([])
  const [attributes, setAttributes] = useState<Attribute[]>([])
  const [attributeValues, setAttributeValues] = useState<AttributeValue[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState(0)

  const [form, setForm] = useState({
    name: "",
    description: "",
    category_id: "",
    gender: "",
  })

  const [variants, setVariants] = useState<Variant[]>([
    { tempId: "v1", price: "", stock: "", sku: "", selectedAttributes: {}, images: [] }
  ])

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/admin/login"); return }
      const { data } = await supabase.from("admins").select("id").eq("id", user.id).single()
      if (!data) { router.push("/admin/login"); return }

      const [{ data: cats }, { data: attrs }, { data: attrVals }] = await Promise.all([
        supabase.from("categories").select("id, name").order("name"),
        supabase.from("attributes").select("id, name"),
        supabase.from("attribute_values").select("id, value, attribute_id"),
      ])
      setCategories(cats || [])
      setAttributes(attrs || [])
      setAttributeValues(attrVals || [])
    }
    init()
  }, [])

  // Varyant etiketi — seçilen attribute değerlerinden oluşur
  const getVariantLabel = (variant: Variant) => {
    const parts = Object.values(variant.selectedAttributes)
      .map(valId => attributeValues.find(av => av.id === valId)?.value || "")
      .filter(Boolean)
    return parts.length > 0 ? parts.join(" / ") : `Varyant ${variants.indexOf(variant) + 1}`
  }

  // SKU otomatik oluştur
  const buildSKU = (variantTempId: string, newAttrs: Record<number, number>, productName: string, variantIndex: number) => {
    const prefix = productName
      .split(" ")
      .map(w => w[0]?.toUpperCase() || "")
      .join("")
      .slice(0, 4) || "LR"

    const attrPart = Object.values(newAttrs)
      .map(id => attributeValues.find(av => av.id === id)?.value?.slice(0, 3).toUpperCase() || "")
      .filter(Boolean)
      .join("-")

    return `LR-${prefix}${attrPart ? "-" + attrPart : ""}-${String(variantIndex + 1).padStart(3, "0")}`
  }

  const addVariant = () => {
    const newVariant: Variant = {
      tempId: "v" + Date.now(),
      price: variants[0]?.price || "",
      stock: "",
      sku: "",
      selectedAttributes: {},
      images: [],
    }
    setVariants(prev => [...prev, newVariant])
    setActiveTab(variants.length)
  }

  const removeVariant = (tempId: string) => {
    const idx = variants.findIndex(v => v.tempId === tempId)
    setVariants(prev => prev.filter(v => v.tempId !== tempId))
    setActiveTab(Math.max(0, idx - 1))
  }

  const updateVariantField = (tempId: string, field: string, value: string) => {
    setVariants(prev => prev.map(v => v.tempId === tempId ? { ...v, [field]: value } : v))
  }

  const updateVariantAttr = (tempId: string, attrId: number, valueId: number) => {
    setVariants(prev => prev.map((v, vi) => {
      if (v.tempId !== tempId) return v
      const newAttrs = { ...v.selectedAttributes, [attrId]: valueId }
      const autoSKU = buildSKU(tempId, newAttrs, form.name, vi)
      return { ...v, selectedAttributes: newAttrs, sku: autoSKU }
    }))
  }

  // Ürün adı değişince tüm SKU'ları güncelle
  const handleNameChange = (name: string) => {
    setForm(prev => ({ ...prev, name }))
    setVariants(prev => prev.map((v, vi) => ({
      ...v,
      sku: buildSKU(v.tempId, v.selectedAttributes, name, vi)
    })))
  }

  const addImages = (tempId: string, files: FileList) => {
    setVariants(prev => prev.map(v => {
      if (v.tempId !== tempId) return v
      const newImgs: VariantImage[] = Array.from(files).map((file, i) => ({
        file,
        preview: URL.createObjectURL(file),
        isPrimary: v.images.length === 0 && i === 0,
      }))
      return { ...v, images: [...v.images, ...newImgs] }
    }))
  }

  const removeImage = (tempId: string, idx: number) => {
    setVariants(prev => prev.map(v => {
      if (v.tempId !== tempId) return v
      const updated = v.images.filter((_, i) => i !== idx)
      if (v.images[idx]?.isPrimary && updated.length > 0) updated[0].isPrimary = true
      return { ...v, images: updated }
    }))
  }

  const setPrimary = (tempId: string, idx: number) => {
    setVariants(prev => prev.map(v => {
      if (v.tempId !== tempId) return v
      return { ...v, images: v.images.map((img, i) => ({ ...img, isPrimary: i === idx })) }
    }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!form.name.trim()) { setError("Urun adi zorunludur."); return }
    if (!form.category_id) { setError("Kategori secimi zorunludur."); return }
    if (!form.gender) { setError("Cinsiyet secimi zorunludur."); return }
    if (variants.some(v => !v.price || !v.stock)) { setError("Tum varyantlar icin fiyat ve stok giriniz."); return }

    setLoading(true)

    try {
      // 1. Ürün ekle
      const { data: product, error: pErr } = await supabase
        .from("products")
        .insert({
          name: form.name,
          description: form.description,
          category_id: parseInt(form.category_id),
          gender: form.gender,
          is_active: true,
        })
        .select("id")
        .single()

      if (pErr || !product) {
        setError("Urun eklenemedi: " + pErr?.message)
        setLoading(false)
        return
      }

      let firstImgDone = false

      // 2. Her varyantı ekle
      for (let vi = 0; vi < variants.length; vi++) {
        const variant = variants[vi]

        const { data: vData, error: vErr } = await supabase
          .from("product_variants")
          .insert({
            product_id: product.id,
            price: parseFloat(variant.price),
            stock: parseInt(variant.stock),
            sku: variant.sku || `LR-${product.id}-${vi + 1}`,
          })
          .select("id")
          .single()

        if (vErr || !vData) continue

        // 3. Attribute bağla
        const attrInserts = Object.values(variant.selectedAttributes).map(valId => ({
          variant_id: vData.id,
          attribute_value_id: valId,
        }))
        if (attrInserts.length > 0) {
          await supabase.from("variant_attributes").insert(attrInserts)
        }

        // 4. Görselleri yükle
        for (let ii = 0; ii < variant.images.length; ii++) {
          const img = variant.images[ii]
          const ext = img.file.name.split(".").pop()
          const fileName = `${product.id}/v${vData.id}/${Date.now()}-${ii}.${ext}`

          const { error: upErr } = await supabase.storage
            .from("products")
            .upload(fileName, img.file, { upsert: true })

          if (!upErr) {
            const { data: urlData } = supabase.storage.from("products").getPublicUrl(fileName)
            await supabase.from("product_images").insert({
              product_id: product.id,
              variant_id: vData.id,
              image_url: urlData.publicUrl,
              is_primary: img.isPrimary && !firstImgDone,
              sort_order: ii + 1,
            })
            if (img.isPrimary) firstImgDone = true
          }
        }
      }

      setSuccess(`"${form.name}" basariyla eklendi! Urun ID: #${product.id}`)
      setForm({ name: "", description: "", category_id: "", gender: "" })
      setVariants([{ tempId: "v1", price: "", stock: "", sku: "", selectedAttributes: {}, images: [] }])
      setActiveTab(0)

    } catch {
      setError("Beklenmedik bir hata olustu.")
    } finally {
      setLoading(false)
    }
  }

  const inp: React.CSSProperties = {
    width: "100%",
    border: "none",
    borderBottom: "1px solid #e0e0e0",
    padding: "10px 0",
    fontSize: "0.9rem",
    color: "#0A0A0A",
    background: "transparent",
    outline: "none",
    fontFamily: "var(--font-dm-sans)",
  }

  const lbl: React.CSSProperties = {
    display: "block",
    fontSize: "10px",
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    color: "#888",
    marginBottom: "4px",
  }

  const card: React.CSSProperties = {
    background: "#fff",
    border: "0.5px solid #e0e0e0",
    padding: "1.5rem",
    marginBottom: "1rem",
  }

  const activeVariant = variants[activeTab] || variants[0]

  return (
    <div style={{ minHeight: "100vh", background: "#F5F5F5" }}>

      {/* NAVBAR */}
      <div style={{ background: "#0A0A0A", padding: "1rem 2rem", display: "flex", alignItems: "center", gap: "16px" }}>
        <Link href="/admin" style={{ color: "#555", display: "flex" }}><ArrowLeft size={20} /></Link>
        <div style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.4rem", fontWeight: 300, color: "#fff" }}>
          Yeni Urun Ekle
        </div>
      </div>

      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "2rem" }}>
        <form onSubmit={handleSubmit}>

          {/* TEMEL BİLGİLER */}
          <div style={card}>
            <div style={{ fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#0A0A0A", marginBottom: "1.2rem", fontWeight: 500 }}>
              Temel Bilgiler
            </div>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: "1.2rem" }}>

              <div>
                <label style={lbl}>Urun Adi *</label>
                <input
                  style={inp}
                  value={form.name}
                  onChange={e => handleNameChange(e.target.value)}
                  placeholder="ornek: Portobello Tote"
                />
              </div>

              <div>
                <label style={lbl}>Aciklama</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  rows={5}
                  placeholder={"Urun aciklamasi...\n\nSatir basi ve bosluklar aynen korunur."}
                  style={{
                    ...inp,
                    resize: "vertical" as const,
                    lineHeight: "1.7",
                    whiteSpace: "pre-wrap",
                    padding: "10px 0",
                    minHeight: "100px",
                  }}
                />
                <p style={{ fontSize: "10px", color: "#bbb", marginTop: "4px" }}>
                  Enter ile satir basi yapabilirsiniz — urun sayfasinda aynen gozukur.
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={lbl}>Kategori *</label>
                  <select
                    style={{ ...inp, appearance: "none" as const, cursor: "pointer" }}
                    value={form.category_id}
                    onChange={e => setForm(p => ({ ...p, category_id: e.target.value }))}
                  >
                    <option value="">Secin</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Cinsiyet *</label>
                  <select
                    style={{ ...inp, appearance: "none" as const, cursor: "pointer" }}
                    value={form.gender}
                    onChange={e => setForm(p => ({ ...p, gender: e.target.value }))}
                  >
                    <option value="">Secin</option>
                    <option value="female">Kadin</option>
                    <option value="male">Erkek</option>
                    <option value="unisex">Unisex</option>
                    <option value="kids">Cocuk</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* VARYANTLAR */}
          <div style={{ background: "#fff", border: "0.5px solid #e0e0e0", marginBottom: "1rem" }}>

            {/* SEKMELER */}
            <div style={{ display: "flex", borderBottom: "0.5px solid #e0e0e0", overflowX: "auto", scrollbarWidth: "none" as const }}>
              {variants.map((v, i) => (
                <button
                  key={v.tempId}
                  type="button"
                  onClick={() => setActiveTab(i)}
                  style={{
                    padding: "12px 18px",
                    fontSize: "11px",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase" as const,
                    background: activeTab === i ? "#fff" : "#F5F5F5",
                    border: "none",
                    borderBottom: activeTab === i ? "2px solid #0A0A0A" : "2px solid transparent",
                    borderRight: "0.5px solid #e0e0e0",
                    cursor: "pointer",
                    fontFamily: "var(--font-dm-sans)",
                    color: activeTab === i ? "#0A0A0A" : "#888",
                    whiteSpace: "nowrap" as const,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    flexShrink: 0,
                  }}
                >
                  <span>{getVariantLabel(v)}</span>
                  {v.images.length > 0 && (
                    <span style={{ background: "#0A0A0A", color: "#fff", borderRadius: "50%", width: "16px", height: "16px", fontSize: "9px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {v.images.length}
                    </span>
                  )}
                  {variants.length > 1 && (
                    <span
                      onClick={e => { e.stopPropagation(); removeVariant(v.tempId) }}
                      style={{ color: "#bbb", cursor: "pointer", display: "flex", marginLeft: "2px" }}
                    >
                      <X size={12} />
                    </span>
                  )}
                </button>
              ))}
              <button
                type="button"
                onClick={addVariant}
                style={{ padding: "12px 16px", fontSize: "11px", background: "#F5F5F5", border: "none", cursor: "pointer", color: "#888", display: "flex", alignItems: "center", gap: "6px", fontFamily: "var(--font-dm-sans)", flexShrink: 0 }}
              >
                <Plus size={13} /> Varyant Ekle
              </button>
            </div>

            {/* AKTİF VARYANT */}
            {activeVariant && (
              <div style={{ padding: "1.5rem" }}>

                {/* BİLGİ NOTU */}
                <div style={{ background: "#F8F8F8", padding: "10px 14px", marginBottom: "1.4rem", fontSize: "12px", color: "#888", lineHeight: 1.7, borderLeft: "3px solid #e0e0e0" }}>
                  <strong style={{ color: "#0A0A0A" }}>"{getVariantLabel(activeVariant)}"</strong> varyantı.
                  Ozellik secin → SKU otomatik olusur. Her varyanta ait gorseller asagıya yukleyin.
                  Urun detay sayfasında bu renk/boyut secilince bu gorseller gozukur.
                </div>

                {/* ÖZELLİKLER */}
                {attributes.length > 0 && (
                  <div style={{ marginBottom: "1.4rem" }}>
                    <label style={lbl}>Ozellikler</label>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "1rem", marginTop: "8px" }}>
                      {attributes.map(attr => (
                        <div key={attr.id}>
                          <label style={lbl}>{attr.name}</label>
                          <select
                            style={{ ...inp, appearance: "none" as const, cursor: "pointer" }}
                            value={activeVariant.selectedAttributes[attr.id] || ""}
                            onChange={e => updateVariantAttr(activeVariant.tempId, attr.id, parseInt(e.target.value))}
                          >
                            <option value="">Secin</option>
                            {attributeValues
                              .filter(av => av.attribute_id === attr.id)
                              .map(av => (
                                <option key={av.id} value={av.id}>{av.value}</option>
                              ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* FİYAT / STOK / SKU */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: "1rem", marginBottom: "1.4rem" }}>
                  <div>
                    <label style={lbl}>Fiyat (TL) *</label>
                    <input
                      style={inp}
                      type="number"
                      min="0"
                      placeholder="1849"
                      value={activeVariant.price}
                      onChange={e => updateVariantField(activeVariant.tempId, "price", e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={lbl}>Stok *</label>
                    <input
                      style={inp}
                      type="number"
                      min="0"
                      placeholder="25"
                      value={activeVariant.stock}
                      onChange={e => updateVariantField(activeVariant.tempId, "stock", e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={lbl}>SKU (otomatik)</label>
                    <input
                      style={{ ...inp, color: "#888" }}
                      value={activeVariant.sku}
                      onChange={e => updateVariantField(activeVariant.tempId, "sku", e.target.value)}
                      placeholder="Ozellik secince otomatik olusur"
                    />
                  </div>
                </div>

                {/* GÖRSELLER */}
                <div>
                  <label style={{ ...lbl, marginBottom: "10px" }}>
                    Bu Varyanta Ait Gorseller
                    <span style={{ color: "#bbb", fontSize: "10px", marginLeft: "8px", textTransform: "none", letterSpacing: 0 }}>
                      (renk/boyut secilince bu gorseller gozukur)
                    </span>
                  </label>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: "10px" }}>
                    {activeVariant.images.map((img, ii) => (
                      <div
                        key={ii}
                        style={{
                          position: "relative",
                          aspectRatio: "1",
                          borderRadius: "4px",
                          overflow: "hidden",
                          border: img.isPrimary ? "2px solid #0A0A0A" : "1px solid #e0e0e0",
                        }}
                      >
                        <img src={img.preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />

                        {img.isPrimary && (
                          <div style={{ position: "absolute", top: "4px", left: "4px", background: "#0A0A0A", color: "#fff", fontSize: "8px", padding: "2px 5px", letterSpacing: "0.08em" }}>
                            KAPAK
                          </div>
                        )}

                        <div style={{ position: "absolute", top: "4px", right: "4px", display: "flex", gap: "3px" }}>
                          <button
                            type="button"
                            onClick={() => setPrimary(activeVariant.tempId, ii)}
                            title="Kapak yap"
                            style={{ background: "rgba(255,255,255,0.95)", border: "none", cursor: "pointer", width: "24px", height: "24px", borderRadius: "50%", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}
                          >★</button>
                          <button
                            type="button"
                            onClick={() => removeImage(activeVariant.tempId, ii)}
                            style={{ background: "#E24B4A", border: "none", cursor: "pointer", width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}
                          ><X size={11} /></button>
                        </div>
                      </div>
                    ))}

                    {/* EKLE */}
                    <label style={{ aspectRatio: "1", border: "1.5px dashed #e0e0e0", borderRadius: "4px", display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#bbb", gap: "6px", minHeight: "110px" }}>
                      <ImageIcon size={22} />
                      <span style={{ fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase" as const, textAlign: "center" as const }}>
                        Gorsel Ekle
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={e => e.target.files && addImages(activeVariant.tempId, e.target.files)}
                        style={{ display: "none" }}
                      />
                    </label>
                  </div>

                  {activeVariant.images.length === 0 && (
                    <p style={{ fontSize: "11px", color: "#E24B4A", marginTop: "8px" }}>
                      ⚠ Gorsel eklenmedi. Gorsel olmayan varyantlarda baska varyantın gorseli gosterilir.
                    </p>
                  )}
                  {activeVariant.images.length > 0 && (
                    <p style={{ fontSize: "11px", color: "#bbb", marginTop: "8px" }}>
                      ★ = kapak gorsel. Birden fazla gorsel ekleyebilirsiniz.
                    </p>
                  )}
                </div>

              </div>
            )}
          </div>

          {/* HATA / BAŞARI */}
          {error && (
            <div style={{ background: "#FCEBEB", border: "1px solid #E24B4A", padding: "1rem", marginBottom: "1rem" }}>
              <p style={{ fontSize: "13px", color: "#A32D2D" }}>{error}</p>
            </div>
          )}

          {success && (
            <div style={{ background: "#EAF3DE", border: "1px solid #639922", padding: "1rem", marginBottom: "1rem" }}>
              <p style={{ fontSize: "13px", color: "#3B6D11", marginBottom: "8px" }}>{success}</p>
              <div style={{ display: "flex", gap: "16px" }}>
                <button
                  type="button"
                  onClick={() => { setSuccess(""); setError(""); setActiveTab(0) }}
                  style={{ fontSize: "11px", color: "#3B6D11", background: "none", border: "none", cursor: "pointer", letterSpacing: "0.1em", textTransform: "uppercase", padding: 0 }}
                >
                  + Yeni Urun Ekle
                </button>
                <Link href="/admin/products" style={{ fontSize: "11px", color: "#3B6D11", letterSpacing: "0.1em", textTransform: "uppercase", textDecoration: "none" }}>
                  Urunleri Gor →
                </Link>
              </div>
            </div>
          )}

          {/* KAYDET */}
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="submit"
              disabled={loading}
              style={{ background: "#0A0A0A", color: "#fff", border: "none", padding: "13px 32px", fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", cursor: loading ? "not-allowed" : "pointer", fontFamily: "var(--font-dm-sans)", opacity: loading ? 0.6 : 1 }}
            >
              {loading ? "Kaydediliyor..." : "Urunu Kaydet"}
            </button>
            <Link
              href="/admin"
              style={{ background: "transparent", color: "#888", border: "0.5px solid #e0e0e0", padding: "13px 32px", fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "var(--font-dm-sans)", textDecoration: "none", display: "inline-block" }}
            >
              Vazgec
            </Link>
          </div>

        </form>
      </div>
    </div>
  )
}