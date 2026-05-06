"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, Plus, X, Upload, Trash2, Save } from "lucide-react"

type Category = { id: number; name: string }
type Attribute = { id: number; name: string }
type AttributeValue = { id: number; value: string; attribute_id: number }

type ExistingImage = {
  id: number
  image_url: string
  is_primary: boolean
  sort_order: number
  variant_id: number | null
  toDelete?: boolean
}

type NewImage = {
  file: File
  preview: string
  isPrimary: boolean
  variantTempId: string | null
}

type ExistingVariant = {
  id: number
  price: string
  stock: string
  sku: string
  selectedAttributes: Record<number, number>
  toDelete?: boolean
}

type NewVariant = {
  tempId: string
  price: string
  stock: string
  sku: string
  selectedAttributes: Record<number, number>
  newImages: NewImage[]
}

export default function EditProductPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()

  const [categories, setCategories] = useState<Category[]>([])
  const [attributes, setAttributes] = useState<Attribute[]>([])
  const [attributeValues, setAttributeValues] = useState<AttributeValue[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")

  const [form, setForm] = useState({
    name: "",
    description: "",
    category_id: "",
    gender: "",
    is_active: true,
  })

  const [existingImages, setExistingImages] = useState<ExistingImage[]>([])
  const [newImages, setNewImages] = useState<NewImage[]>([])
  const [existingVariants, setExistingVariants] = useState<ExistingVariant[]>([])
  const [newVariants, setNewVariants] = useState<NewVariant[]>([])

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/admin/login"); return }
      const { data: adminData } = await supabase.from("admins").select("id").eq("id", user.id).single()
      if (!adminData) { router.push("/admin/login"); return }

      const [{ data: cats }, { data: attrs }, { data: attrVals }] = await Promise.all([
        supabase.from("categories").select("id, name").order("name"),
        supabase.from("attributes").select("id, name"),
        supabase.from("attribute_values").select("id, value, attribute_id"),
      ])
      setCategories(cats || [])
      setAttributes(attrs || [])
      setAttributeValues(attrVals || [])

      // Ürünü çek
      const { data: product } = await supabase
        .from("products")
        .select(`
          id, name, description, gender, is_active,
          category_id,
          product_images ( id, image_url, is_primary, sort_order, variant_id ),
          product_variants (
            id, price, stock, sku,
            variant_attributes ( attribute_values ( id, value, attributes ( name ) ) )
          )
        `)
        .eq("id", params.id)
        .single()

      if (!product) { router.push("/admin/products"); return }

      setForm({
        name: product.name,
        description: product.description || "",
        category_id: String(product.category_id),
        gender: product.gender,
        is_active: product.is_active,
      })

      setExistingImages(
        (product.product_images || []).sort((a, b) => a.sort_order - b.sort_order)
      )

      setExistingVariants(
        (product.product_variants || []).map(v => {
          const attrs: Record<number, number> = {}
          v.variant_attributes?.forEach((va: any) => {
  const attributeValue = Array.isArray(va.attribute_values)
    ? va.attribute_values[0]
    : va.attribute_values

  const attrObj = (attrVals || []).find(
    av => av.id === attributeValue?.id
  )

  if (attrObj) {
    attrs[attrObj.attribute_id] = attrObj.id
  }
})
          return {
            id: v.id,
            price: String(v.price),
            stock: String(v.stock),
            sku: v.sku || "",
            selectedAttributes: attrs,
          }
        })
      )

      setLoading(false)
    }
    init()
  }, [params.id])

  const handleFormChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
) => {
  const target = e.target

  const val =
    target instanceof HTMLInputElement && target.type === "checkbox"
      ? target.checked
      : target.value

  setForm(prev => ({
    ...prev,
    [target.name]: val,
  }))
}

  // Mevcut varyant güncelle
  const updateExistingVariant = (id: number, field: string, value: string) => {
    setExistingVariants(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v))
  }

  const updateExistingVariantAttr = (id: number, attrId: number, valueId: number) => {
    setExistingVariants(prev => prev.map(v => v.id === id ? {
      ...v, selectedAttributes: { ...v.selectedAttributes, [attrId]: valueId }
    } : v))
  }

  const markVariantDelete = (id: number) => {
    setExistingVariants(prev => prev.map(v => v.id === id ? { ...v, toDelete: !v.toDelete } : v))
  }

  // Yeni varyant
  const addNewVariant = () => {
    setNewVariants(prev => [...prev, {
      tempId: "nv" + Date.now(),
      price: "", stock: "", sku: "",
      selectedAttributes: {},
      newImages: [],
    }])
  }

  const updateNewVariant = (tempId: string, field: string, value: string) => {
    setNewVariants(prev => prev.map(v => v.tempId === tempId ? { ...v, [field]: value } : v))
  }

  const updateNewVariantAttr = (tempId: string, attrId: number, valueId: number) => {
    setNewVariants(prev => prev.map(v => v.tempId === tempId ? {
      ...v, selectedAttributes: { ...v.selectedAttributes, [attrId]: valueId }
    } : v))
  }

  const removeNewVariant = (tempId: string) => {
    setNewVariants(prev => prev.filter(v => v.tempId !== tempId))
  }

  const addNewVariantImages = (tempId: string, files: FileList) => {
    setNewVariants(prev => prev.map(v => {
      if (v.tempId !== tempId) return v
      const imgs: NewImage[] = Array.from(files).map((file, i) => ({
        file,
        preview: URL.createObjectURL(file),
        isPrimary: v.newImages.length === 0 && i === 0,
        variantTempId: tempId,
      }))
      return { ...v, newImages: [...v.newImages, ...imgs] }
    }))
  }

  const removeNewVariantImage = (tempId: string, idx: number) => {
    setNewVariants(prev => prev.map(v => {
      if (v.tempId !== tempId) return v
      const updated = v.newImages.filter((_, i) => i !== idx)
      if (v.newImages[idx]?.isPrimary && updated.length > 0) updated[0].isPrimary = true
      return { ...v, newImages: updated }
    }))
  }

  // Genel yeni görsel ekle
  const addGeneralImages = (files: FileList) => {
    const imgs: NewImage[] = Array.from(files).map((file, i) => ({
      file,
      preview: URL.createObjectURL(file),
      isPrimary: existingImages.length === 0 && newImages.length === 0 && i === 0,
      variantTempId: null,
    }))
    setNewImages(prev => [...prev, ...imgs])
  }

  const markImageDelete = (id: number) => {
    setExistingImages(prev => prev.map(img => img.id === id ? { ...img, toDelete: !img.toDelete } : img))
  }

  const setPrimaryExisting = (id: number) => {
    setExistingImages(prev => prev.map(img => ({ ...img, is_primary: img.id === id })))
    setNewImages(prev => prev.map(img => ({ ...img, isPrimary: false })))
  }

  const setPrimaryNew = (idx: number) => {
    setExistingImages(prev => prev.map(img => ({ ...img, is_primary: false })))
    setNewImages(prev => prev.map((img, i) => ({ ...img, isPrimary: i === idx })))
  }

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!form.name.trim()) { setError("Urun adi zorunludur."); return }
    if (!form.category_id) { setError("Kategori secimi zorunludur."); return }

    setSaving(true)

    try {
      // 1. Ürün bilgilerini güncelle
      const { error: productError } = await supabase
        .from("products")
        .update({
          name: form.name,
          description: form.description,
          category_id: parseInt(form.category_id),
          gender: form.gender,
          is_active: form.is_active,
        })
        .eq("id", params.id)

      if (productError) { setError("Urun guncellenemedi: " + productError.message); setSaving(false); return }

      // 2. Silinecek görselleri sil
      const toDeleteImages = existingImages.filter(img => img.toDelete)
      for (const img of toDeleteImages) {
        const parts = img.image_url.split("/storage/v1/object/public/products/")
        if (parts[1]) await supabase.storage.from("products").remove([parts[1]])
        await supabase.from("product_images").delete().eq("id", img.id)
      }

      // 3. Mevcut görsellerin primary durumunu güncelle
      for (const img of existingImages.filter(img => !img.toDelete)) {
        await supabase.from("product_images").update({ is_primary: img.is_primary }).eq("id", img.id)
      }

      // 4. Yeni genel görselleri yükle
      const sortStart = existingImages.filter(i => !i.toDelete).length
      for (let i = 0; i < newImages.length; i++) {
        const img = newImages[i]
        const ext = img.file.name.split(".").pop()
        const fileName = `${params.id}/general/${Date.now()}-${i}.${ext}`
        const { error: uploadError } = await supabase.storage.from("products").upload(fileName, img.file, { upsert: true })
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from("products").getPublicUrl(fileName)
          await supabase.from("product_images").insert({
            product_id: params.id,
            image_url: urlData.publicUrl,
            is_primary: img.isPrimary,
            sort_order: sortStart + i + 1,
            variant_id: null,
          })
        }
      }

      // 5. Silinecek varyantları sil
      for (const v of existingVariants.filter(v => v.toDelete)) {
        await supabase.from("product_variants").delete().eq("id", v.id)
      }

      // 6. Mevcut varyantları güncelle
      for (const v of existingVariants.filter(v => !v.toDelete)) {
        await supabase.from("product_variants").update({
          price: parseFloat(v.price),
          stock: parseInt(v.stock),
          sku: v.sku,
        }).eq("id", v.id)

        // Attribute'ları güncelle
        await supabase.from("variant_attributes").delete().eq("variant_id", v.id)
        const attrInserts = Object.values(v.selectedAttributes).map(valId => ({
          variant_id: v.id,
          attribute_value_id: valId,
        }))
        if (attrInserts.length > 0) await supabase.from("variant_attributes").insert(attrInserts)
      }

      // 7. Yeni varyantları ekle
      for (let vi = 0; vi < newVariants.length; vi++) {
        const v = newVariants[vi]
        if (!v.price || !v.stock) continue

        const { data: variantData } = await supabase
          .from("product_variants")
          .insert({
            product_id: params.id,
            price: parseFloat(v.price),
            stock: parseInt(v.stock),
            sku: v.sku || `LR-${params.id}-${Date.now()}`,
          })
          .select("id")
          .single()

        if (!variantData) continue

        const attrInserts = Object.values(v.selectedAttributes).map(valId => ({
          variant_id: variantData.id,
          attribute_value_id: valId,
        }))
        if (attrInserts.length > 0) await supabase.from("variant_attributes").insert(attrInserts)

        // Varyant görsellerini yükle
        for (let ii = 0; ii < v.newImages.length; ii++) {
          const img = v.newImages[ii]
          const ext = img.file.name.split(".").pop()
          const fileName = `${params.id}/v${variantData.id}/${Date.now()}-${ii}.${ext}`
          const { error: uploadError } = await supabase.storage.from("products").upload(fileName, img.file, { upsert: true })
          if (!uploadError) {
            const { data: urlData } = supabase.storage.from("products").getPublicUrl(fileName)
            await supabase.from("product_images").insert({
              product_id: params.id,
              variant_id: variantData.id,
              image_url: urlData.publicUrl,
              is_primary: img.isPrimary && vi === 0,
              sort_order: ii + 1,
            })
          }
        }
      }

      setSuccess("Urun basariyla guncellendi!")
      setNewImages([])
      setNewVariants([])

      // Sayfayı yenile
      setTimeout(() => window.location.reload(), 1000)

    } catch (err) {
      setError("Beklenmedik bir hata olustu.")
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = {
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

  const labelStyle = {
    display: "block",
    fontSize: "10px",
    letterSpacing: "0.15em",
    textTransform: "uppercase" as const,
    color: "#888",
    marginBottom: "4px",
  }

  const cardStyle = {
    background: "#fff",
    border: "0.5px solid #e0e0e0",
    padding: "1.5rem",
    marginBottom: "1rem",
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#888" }}>Yukleniyor...</p>
    </div>
  )

  return (
    <div style={{ minHeight: "100vh", background: "#F5F5F5" }}>

      <div style={{ background: "#0A0A0A", padding: "1rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Link href="/admin/products" style={{ color: "#555", display: "flex" }}><ArrowLeft size={20} /></Link>
          <div style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.4rem", fontWeight: 300, color: "#fff" }}>
            Urunu Duzenle — #{params.id}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "2rem" }}>
        <form onSubmit={handleSave}>

          {/* TEMEL BİLGİLER */}
          <div style={cardStyle}>
            <div style={{ fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#0A0A0A", marginBottom: "1.2rem", fontWeight: 500 }}>
              Temel Bilgiler
            </div>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: "1.2rem" }}>
              <div>
                <label style={labelStyle}>Urun Adi *</label>
                <input style={inputStyle} name="name" value={form.name} onChange={handleFormChange} />
              </div>
              <div>
                <label style={labelStyle}>Aciklama</label>
                <textarea name="description" value={form.description} onChange={handleFormChange} rows={3} style={{ ...inputStyle, resize: "none" as const, lineHeight: "1.6" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={labelStyle}>Kategori *</label>
                  <select style={{ ...inputStyle, appearance: "none" as const, cursor: "pointer" }} name="category_id" value={form.category_id} onChange={handleFormChange}>
                    <option value="">Secin</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Cinsiyet</label>
                  <select style={{ ...inputStyle, appearance: "none" as const, cursor: "pointer" }} name="gender" value={form.gender} onChange={handleFormChange}>
                    <option value="female">Kadin</option>
                    <option value="male">Erkek</option>
                    <option value="unisex">Unisex</option>
                    <option value="kids">Cocuk</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Durum</label>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingTop: "10px" }}>
                    <input type="checkbox" id="is_active" name="is_active" checked={form.is_active} onChange={handleFormChange} style={{ width: "16px", height: "16px", accentColor: "#0A0A0A", cursor: "pointer" }} />
                    <label htmlFor="is_active" style={{ fontSize: "13px", color: "#0A0A0A", cursor: "pointer" }}>Aktif</label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* MEVCUT GÖRSELLER */}
          <div style={cardStyle}>
            <div style={{ fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#0A0A0A", marginBottom: "1.2rem", fontWeight: 500 }}>
              Mevcut Gorseller
            </div>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" as const, marginBottom: "1rem" }}>
              {existingImages.map(img => (
                <div key={img.id} style={{ position: "relative", width: "100px", height: "100px" }}>
                  <img
                    src={img.image_url}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "4px", border: img.is_primary ? "2px solid #0A0A0A" : "1px solid #e0e0e0", opacity: img.toDelete ? 0.3 : 1, filter: img.toDelete ? "grayscale(1)" : "none", transition: "all 0.2s" }}
                  />
                  {img.is_primary && !img.toDelete && (
                    <div style={{ position: "absolute", top: "4px", left: "4px", background: "#0A0A0A", color: "#fff", fontSize: "8px", padding: "2px 5px" }}>KAPAK</div>
                  )}
                  {img.variant_id && (
                    <div style={{ position: "absolute", bottom: "4px", left: "4px", background: "#185FA5", color: "#fff", fontSize: "8px", padding: "2px 5px" }}>V</div>
                  )}
                  <div style={{ position: "absolute", top: "4px", right: "4px", display: "flex", gap: "3px" }}>
                    {!img.toDelete && (
                      <button type="button" onClick={() => setPrimaryExisting(img.id)} title="Kapak yap" style={{ background: "rgba(255,255,255,0.9)", border: "none", cursor: "pointer", width: "22px", height: "22px", borderRadius: "50%", fontSize: "11px", display: "flex", alignItems: "center", justifyContent: "center" }}>★</button>
                    )}
                    <button type="button" onClick={() => markImageDelete(img.id)} style={{ background: img.toDelete ? "#3B6D11" : "#E24B4A", border: "none", cursor: "pointer", width: "22px", height: "22px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                      {img.toDelete ? <Plus size={10} /> : <X size={10} />}
                    </button>
                  </div>
                </div>
              ))}

              {/* Yeni genel görsel */}
              {newImages.map((img, i) => (
                <div key={i} style={{ position: "relative", width: "100px", height: "100px" }}>
                  <img src={img.preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "4px", border: img.isPrimary ? "2px solid #0A0A0A" : "1px solid #3B6D11" }} />
                  {img.isPrimary && <div style={{ position: "absolute", top: "4px", left: "4px", background: "#0A0A0A", color: "#fff", fontSize: "8px", padding: "2px 5px" }}>KAPAK</div>}
                  <div style={{ position: "absolute", top: "4px", right: "4px", display: "flex", gap: "3px" }}>
                    <button type="button" onClick={() => setPrimaryNew(i)} style={{ background: "rgba(255,255,255,0.9)", border: "none", cursor: "pointer", width: "22px", height: "22px", borderRadius: "50%", fontSize: "11px", display: "flex", alignItems: "center", justifyContent: "center" }}>★</button>
                    <button type="button" onClick={() => setNewImages(prev => prev.filter((_, idx) => idx !== i))} style={{ background: "#E24B4A", border: "none", cursor: "pointer", width: "22px", height: "22px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}><X size={10} /></button>
                  </div>
                  <div style={{ position: "absolute", bottom: "4px", left: "4px", background: "#3B6D11", color: "#fff", fontSize: "8px", padding: "2px 5px" }}>YENİ</div>
                </div>
              ))}

              <label style={{ width: "100px", height: "100px", border: "1px dashed #e0e0e0", borderRadius: "4px", display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#bbb", gap: "4px" }}>
                <Upload size={18} />
                <span style={{ fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase" as const }}>Ekle</span>
                <input type="file" accept="image/*" multiple onChange={e => e.target.files && addGeneralImages(e.target.files)} style={{ display: "none" }} />
              </label>
            </div>
            <p style={{ fontSize: "11px", color: "#bbb" }}>
              Kirmizi X = silinecek (kaydet'e basınca silinir). ★ = kapak gorsel. Yesil kenarlı = yeni eklenecek.
            </p>
          </div>

          {/* MEVCUT VARYANTLAR */}
          <div style={{ marginBottom: "1rem" }}>
            <div style={{ fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#0A0A0A", fontWeight: 500, marginBottom: "1rem" }}>
              Mevcut Varyantlar
            </div>

            {existingVariants.map((variant, vi) => (
              <div key={variant.id} style={{ ...cardStyle, opacity: variant.toDelete ? 0.5 : 1, border: variant.toDelete ? "0.5px dashed #E24B4A" : "0.5px solid #e0e0e0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <span style={{ fontSize: "12px", fontWeight: 500, color: "#0A0A0A" }}>
                    Varyant #{variant.id}
                    {variant.toDelete && <span style={{ fontSize: "10px", color: "#E24B4A", marginLeft: "8px" }}>SILINECEK</span>}
                  </span>
                  <button
                    type="button"
                    onClick={() => markVariantDelete(variant.id)}
                    style={{ background: "none", border: "0.5px solid", borderColor: variant.toDelete ? "#3B6D11" : "#E24B4A", cursor: "pointer", padding: "4px 10px", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase" as const, fontFamily: "var(--font-dm-sans)", color: variant.toDelete ? "#3B6D11" : "#E24B4A" }}
                  >
                    {variant.toDelete ? "Geri Al" : "Sil"}
                  </button>
                </div>

                {!variant.toDelete && (
                  <>
                    {attributes.length > 0 && (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
                        {attributes.map(attr => (
                          <div key={attr.id}>
                            <label style={labelStyle}>{attr.name}</label>
                            <select style={{ ...inputStyle, appearance: "none" as const, cursor: "pointer" }} value={variant.selectedAttributes[attr.id] || ""} onChange={e => updateExistingVariantAttr(variant.id, attr.id, parseInt(e.target.value))}>
                              <option value="">Secin</option>
                              {attributeValues.filter(av => av.attribute_id === attr.id).map(av => (
                                <option key={av.id} value={av.id}>{av.value}</option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: "1rem" }}>
                      <div>
                        <label style={labelStyle}>Fiyat (TL)</label>
                        <input style={inputStyle} type="number" value={variant.price} onChange={e => updateExistingVariant(variant.id, "price", e.target.value)} />
                      </div>
                      <div>
                        <label style={labelStyle}>Stok</label>
                        <input style={inputStyle} type="number" value={variant.stock} onChange={e => updateExistingVariant(variant.id, "stock", e.target.value)} />
                      </div>
                      <div>
                        <label style={labelStyle}>SKU</label>
                        <input style={inputStyle} value={variant.sku} onChange={e => updateExistingVariant(variant.id, "sku", e.target.value)} />
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}

            {/* YENİ VARYANTLAR */}
            {newVariants.map((variant, vi) => (
              <div key={variant.tempId} style={{ ...cardStyle, border: "0.5px solid #3B6D11" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <span style={{ fontSize: "12px", fontWeight: 500, color: "#3B6D11" }}>Yeni Varyant {vi + 1}</span>
                  <button type="button" onClick={() => removeNewVariant(variant.tempId)} style={{ background: "none", border: "none", cursor: "pointer", color: "#E24B4A", display: "flex" }}><Trash2 size={14} /></button>
                </div>

                {attributes.length > 0 && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
                    {attributes.map(attr => (
                      <div key={attr.id}>
                        <label style={labelStyle}>{attr.name}</label>
                        <select style={{ ...inputStyle, appearance: "none" as const, cursor: "pointer" }} value={variant.selectedAttributes[attr.id] || ""} onChange={e => updateNewVariantAttr(variant.tempId, attr.id, parseInt(e.target.value))}>
                          <option value="">Secin</option>
                          {attributeValues.filter(av => av.attribute_id === attr.id).map(av => (
                            <option key={av.id} value={av.id}>{av.value}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: "1rem", marginBottom: "1rem" }}>
                  <div>
                    <label style={labelStyle}>Fiyat (TL) *</label>
                    <input style={inputStyle} type="number" placeholder="1849" value={variant.price} onChange={e => updateNewVariant(variant.tempId, "price", e.target.value)} />
                  </div>
                  <div>
                    <label style={labelStyle}>Stok *</label>
                    <input style={inputStyle} type="number" placeholder="25" value={variant.stock} onChange={e => updateNewVariant(variant.tempId, "stock", e.target.value)} />
                  </div>
                  <div>
                    <label style={labelStyle}>SKU</label>
                    <input style={inputStyle} placeholder="LR-PT-COG-001" value={variant.sku} onChange={e => updateNewVariant(variant.tempId, "sku", e.target.value)} />
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#888", marginBottom: "0.6rem" }}>Varyant Gorselleri</div>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" as const }}>
                    {variant.newImages.map((img, ii) => (
                      <div key={ii} style={{ position: "relative", width: "80px", height: "80px" }}>
                        <img src={img.preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "4px", border: "1px solid #e0e0e0" }} />
                        <button type="button" onClick={() => removeNewVariantImage(variant.tempId, ii)} style={{ position: "absolute", top: "2px", right: "2px", background: "#E24B4A", border: "none", cursor: "pointer", width: "18px", height: "18px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}><X size={9} /></button>
                      </div>
                    ))}
                    <label style={{ width: "80px", height: "80px", border: "1px dashed #e0e0e0", borderRadius: "4px", display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#bbb", gap: "3px" }}>
                      <Upload size={14} />
                      <span style={{ fontSize: "8px", textTransform: "uppercase" as const }}>Ekle</span>
                      <input type="file" accept="image/*" multiple onChange={e => e.target.files && addNewVariantImages(variant.tempId, e.target.files)} style={{ display: "none" }} />
                    </label>
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addNewVariant}
              style={{ background: "transparent", border: "1px dashed #3B6D11", color: "#3B6D11", padding: "10px", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", fontFamily: "var(--font-dm-sans)", display: "flex", alignItems: "center", gap: "6px", width: "100%", justifyContent: "center" }}
            >
              <Plus size={13} /> Yeni Varyant Ekle
            </button>
          </div>

          {/* HATA / BAŞARI */}
          {error && (
            <div style={{ background: "#FCEBEB", border: "1px solid #E24B4A", padding: "1rem", marginBottom: "1rem" }}>
              <p style={{ fontSize: "13px", color: "#A32D2D" }}>{error}</p>
            </div>
          )}
          {success && (
            <div style={{ background: "#EAF3DE", border: "1px solid #639922", padding: "1rem", marginBottom: "1rem" }}>
              <p style={{ fontSize: "13px", color: "#3B6D11" }}>{success}</p>
            </div>
          )}

          {/* KAYDET */}
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="submit"
              disabled={saving}
              style={{ background: "#0A0A0A", color: "#fff", border: "none", padding: "13px 32px", fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", cursor: saving ? "not-allowed" : "pointer", fontFamily: "var(--font-dm-sans)", opacity: saving ? 0.6 : 1, display: "flex", alignItems: "center", gap: "8px" }}
            >
              <Save size={14} />
              {saving ? "Kaydediliyor..." : "Degisiklikleri Kaydet"}
            </button>
            <Link href="/admin/products" style={{ background: "transparent", color: "#888", border: "0.5px solid #e0e0e0", padding: "13px 32px", fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "var(--font-dm-sans)", textDecoration: "none", display: "inline-block" }}>
              Geri Don
            </Link>
          </div>

        </form>
      </div>
    </div>
  )
}