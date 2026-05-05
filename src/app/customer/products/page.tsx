"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Heart, ChevronDown, SlidersHorizontal, X, ChevronUp } from "lucide-react"

type FlatVariant = {
  productId: number
  productName: string
  categoryName: string
  categoryId: number
  variantId: number
  price: number
  stock: number
  imageUrl: string | null
  label: string
  attrs: Record<string, string>
}

type Category = { id: number; name: string; slug: string }
type AttributeGroup = { name: string; values: string[] }

 const normalize = (str: string) =>
  str
    ?.toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")


export default function ProductsPage() {
  const supabase = createClient()
  const searchParams = useSearchParams()

  const [allVariants, setAllVariants] = useState<FlatVariant[]>([])
  const [filtered, setFiltered] = useState<FlatVariant[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [attrGroups, setAttrGroups] = useState<AttributeGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [favorites, setFavorites] = useState<number[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [showSort, setShowSort] = useState(false)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    kategori: true, fiyat: true,
  })

  const [sortBy, setSortBy] = useState("newest")
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string[]>>({})
  const [priceMin, setPriceMin] = useState("")
  const [priceMax, setPriceMax] = useState("")
  const [onlyInStock, setOnlyInStock] = useState(false)

  const [minPrice, setMinPrice] = useState(0)
  const [maxPrice, setMaxPrice] = useState(10000)

  const category = searchParams.get("category")
  const slug = searchParams.get("slug")
  const search = searchParams.get("search")

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)

      const { data: catData } = await supabase
        .from("categories").select("id, name, slug").order("sort_order")
      setCategories(catData || [])

      let query = supabase
        .from("products")
        .select(`
          id, name, gender, category_id,
          categories ( id, name ),
          product_images ( image_url, is_primary, variant_id ),
          product_variants (
            id, price, stock, sku,
            variant_attributes (
              attribute_values ( id, value, attributes ( name ) )
            )
          )
        `)
        .eq("is_active", true)

      if (category) query = query.eq("gender", category)
      if (slug) {
        const cat = catData?.find(c => c.slug === slug)
        if (cat) query = query.eq("category_id", cat.id)
      }
      if (search) query = query.ilike("name", "%" + search + "%")

      const { data } = await query
      const products = data || []

      // Attribute gruplarï¿½ ï¿½ normalize edilmiï¿½ deï¿½erler
      const groups: Record<string, Set<string>> = {}
      products.forEach(p => {
        p.product_variants?.forEach(v => {
          v.variant_attributes?.forEach(va => {
            const name = va.attribute_values.attributes.name
            if (!groups[name]) groups[name] = new Set()
            groups[name].add(va.attribute_values.value)
          })
        })
      })

      const attrGroupList = Object.entries(groups).map(([name, vals]) => ({
        name,
        values: Array.from(vals).sort((a, b) => a.localeCompare(b, "tr-TR")),
      }))
      setAttrGroups(attrGroupList)

      // OpenSections'a attribute gruplarï¿½ ekle
      const initOpen: Record<string, boolean> = { kategori: true, fiyat: true, stok: true }
      attrGroupList.forEach(g => { initOpen[normalize(g.name)] = true })
      setOpenSections(initOpen)

      // Flat varyant listesi
      const flat: FlatVariant[] = []
      const prices: number[] = []

      products.forEach(product => {
        product.product_variants?.forEach(variant => {
          prices.push(variant.price)

          const variantImg = product.product_images?.find(
            img => img.variant_id === variant.id && img.is_primary
          ) || product.product_images?.find(img => img.variant_id === variant.id)

          const generalImg = product.product_images?.find(
            img => img.is_primary && img.variant_id === null
          ) || product.product_images?.find(img => img.variant_id === null)

          const imageUrl = variantImg?.image_url || generalImg?.image_url || null
          const label = variant.variant_attributes?.map(va => va.attribute_values.value).join(" | ") || ""

          const attrs: Record<string, string> = {}
          variant.variant_attributes?.forEach(va => {
            attrs[va.attribute_values.attributes.name] = va.attribute_values.value
          })

          flat.push({
            productId: product.id,
            productName: product.name,
            categoryName: product.categories?.name || "",
            categoryId: product.category_id,
            variantId: variant.id,
            price: variant.price,
            stock: variant.stock,
            imageUrl,
            label,
            attrs,
          })
        })
      })

      setAllVariants(flat)

      // Fiyat aralï¿½ï¿½ï¿½nï¿½ belirle
      if (prices.length > 0) {
        const mn = Math.floor(Math.min(...prices))
        const mx = Math.ceil(Math.max(...prices))
        setMinPrice(mn)
        setMaxPrice(mx)
      }

      setLoading(false)
    }
    fetchAll()
  }, [category, slug, search])

  // Filtreleme
  useEffect(() => {
    let result = [...allVariants]

    if (selectedCategory) {
      result = result.filter(v => v.categoryId === selectedCategory)
    }

    // Attribute filtresi ï¿½ Tï¿½rkï¿½e normalize karï¿½ï¿½laï¿½tï¿½rma
    Object.entries(selectedAttrs).forEach(([attrName, vals]) => {
      if (vals.length === 0) return
      const normalizedVals = vals.map(normalize)
      result = result.filter(v => {
        const attrVal = v.attrs[attrName]
        return attrVal && normalizedVals.includes(normalize(attrVal))
      })
    })

    // Fiyat filtresi
    const min = priceMin !== "" ? parseFloat(priceMin) : null
    const max = priceMax !== "" ? parseFloat(priceMax) : null
    if (min !== null) result = result.filter(v => v.price >= min)
    if (max !== null) result = result.filter(v => v.price <= max)

    // Stok filtresi
    if (onlyInStock) result = result.filter(v => v.stock > 0)

    // Sï¿½ralama
    if (sortBy === "price_asc") result.sort((a, b) => a.price - b.price)
    if (sortBy === "price_desc") result.sort((a, b) => b.price - a.price)

    setFiltered(result); window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [allVariants, selectedCategory, selectedAttrs, priceMin, priceMax, onlyInStock, sortBy])

  useEffect(() => {
    const fetchFavorites = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from("favorites").select("variant_id").eq("user_id", user.id)
      setFavorites(data?.map(f => f.variant_id) || [])
    }
    fetchFavorites()
  }, [])

  const toggleFavorite = async (e: React.MouseEvent, variantId: number) => {
    e.preventDefault()
    e.stopPropagation()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    if (favorites.includes(variantId)) {
      await supabase.from("favorites").delete().eq("user_id", user.id).eq("product_id", variantId)
      setFavorites(prev => prev.filter(id => id !== variantId))
    } else {
      await supabase.from("favorites").insert({user_id: user.id, variant_id: variantId })
      setFavorites(prev => [...prev, variantId])
    }
  }

  const toggleAttr = (attrName: string, val: string) => {
    setSelectedAttrs(prev => {
      const current = prev[attrName] || []
      const normalizedVal = val
      const updated = current.includes(normalizedVal)
        ? current.filter(v => v !== normalizedVal)
        : [...current, normalizedVal]
      return { ...prev, [attrName]: updated }
    })
  }

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const clearFilters = () => {
    setSelectedCategory(null)
    setSelectedAttrs({})
    setPriceMin("")
    setPriceMax("")
    setOnlyInStock(false)
  }

  const activeFilterCount = [
    selectedCategory ? 1 : 0,
    Object.values(selectedAttrs).flat().length,
    priceMin || priceMax ? 1 : 0,
    onlyInStock ? 1 : 0,
  ].reduce((a, b) => a + b, 0)

  const formatPrice = (p: number) => p.toLocaleString("tr-TR") + " TL"

  const pageTitle = search ? `"${search}" sonuclari`
    : category === "female" ? "Kadin"
    : category === "male" ? "Erkek"
    : category === "unisex" ? "Unisex"
    : category === "kids" ? "Cocuk"
    : slug ? categories.find(c => c.slug === slug)?.name || slug
    : "Tum Urunler"

  const sortOptions = [
    { value: "newest", label: "En Yeni" },
    { value: "price_asc", label: "Fiyat: Ucuz ï¿½ Pahalï¿½" },
    { value: "price_desc", label: "Fiyat: Pahalï¿½ ï¿½ Ucuz" },
  ]

  const FilterSection = ({ title, sectionKey, children }: { title: string; sectionKey: string; children: React.ReactNode }) => (
    <div style={{ borderBottom: "0.5px solid #efefef" }}>
      <button
        type="button"
        onClick={() => toggleSection(sectionKey)}
        style={{ width: "100%", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-dm-sans)" }}
      >
        <span style={{ fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase" as const, color: "#888" }}>{title}</span>
        {openSections[sectionKey] ? <ChevronUp size={13} color="#bbb" /> : <ChevronDown size={13} color="#bbb" />}
      </button>
      {openSections[sectionKey] && (
        <div style={{ padding: "0 16px 14px" }}>{children}</div>
      )}
    </div>
  )

  return (
    <main style={{ minHeight: "100vh", background: "var(--background)" }}>

      {/* HEADER */}
      <div style={{ background: "#0A0A0A", padding: "2rem 3rem" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap" as const, gap: "1rem" }}>
          <div>
            <div style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "2rem", fontWeight: 300, color: "#fff", marginBottom: "4px" }}>
              {pageTitle}
            </div>
            <div style={{ fontSize: "11px", color: "#555" }}>
              {loading ? "Yukleniyor..." : `${filtered.length} urun`}
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{ background: showFilters ? "#fff" : "transparent", border: "0.5px solid #333", color: showFilters ? "#0A0A0A" : "#888", padding: "9px 16px", fontSize: "11px", letterSpacing: "0.1em", fontFamily: "var(--font-dm-sans)", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
            >
              <SlidersHorizontal size={14} />
              Filtrele
              {activeFilterCount > 0 && (
                <span style={{ background: showFilters ? "#0A0A0A" : "#fff", color: showFilters ? "#fff" : "#0A0A0A", borderRadius: "50%", width: "18px", height: "18px", fontSize: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {activeFilterCount}
                </span>
              )}
            </button>
            <div style={{ position: "relative" }}>
              <button onClick={() => setShowSort(!showSort)} style={{ background: "transparent", border: "0.5px solid #333", color: "#888", padding: "9px 16px", fontSize: "11px", letterSpacing: "0.1em", fontFamily: "var(--font-dm-sans)", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
                {sortOptions.find(o => o.value === sortBy)?.label}
                <ChevronDown size={14} />
              </button>
              {showSort && (
                <div style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, background: "#fff", border: "0.5px solid #e0e0e0", zIndex: 50, minWidth: "200px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
                  {sortOptions.map(opt => (
                    <button key={opt.value} onClick={() => { setSortBy(opt.value); setShowSort(false) }} style={{ display: "block", width: "100%", textAlign: "left" as const, padding: "10px 16px", fontSize: "12px", background: sortBy === opt.value ? "#f5f5f5" : "#fff", border: "none", cursor: "pointer", fontFamily: "var(--font-dm-sans)", color: sortBy === opt.value ? "#0A0A0A" : "#888", borderBottom: "0.5px solid #f5f5f5" }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KATEGORï¿½ SEKMELERï¿½ */}
      <div style={{ borderBottom: "0.5px solid var(--border)" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 3rem", display: "flex", overflowX: "auto", scrollbarWidth: "none" as const }}>
          {[
            { label: "Tumu", active: !category && !slug, href: "/customer/products" },
            { label: "Kadin", active: category === "female", href: "/customer/products?category=female" },
            { label: "Erkek", active: category === "male", href: "/customer/products?category=male" },
            { label: "Unisex", active: category === "unisex", href: "/customer/products?category=unisex" },
            { label: "Cocuk", active: category === "kids", href: "/customer/products?category=kids" },
          ].map(item => (
            <Link key={item.href} href={item.href} style={{ padding: "1rem 1.4rem", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", textDecoration: "none", whiteSpace: "nowrap" as const, borderBottom: item.active ? "2px solid #0A0A0A" : "2px solid transparent", color: item.active ? "#0A0A0A" : "var(--muted)", flexShrink: 0 }}>
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 3rem" }}>
        <div style={{ display: "flex", gap: "2rem", alignItems: "flex-start" }}>

          {/* Fï¿½LTRE PANELï¿½ */}
          {showFilters && (
            <div style={{ width: "240px", flexShrink: 0, paddingTop: "2rem", position: "sticky", top: "130px", maxHeight: "calc(100vh - 150px)", overflowY: "auto" }}>
              <div style={{ border: "0.5px solid #efefef", background: "#fff" }}>

                {/* BAï¿½LIK */}
                <div style={{ padding: "12px 16px", borderBottom: "0.5px solid #efefef", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 500 }}>Filtreler</span>
                  {activeFilterCount > 0 && (
                    <button onClick={clearFilters} style={{ fontSize: "10px", color: "var(--muted)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                      <X size={11} /> Temizle
                    </button>
                  )}
                </div>

                {/* KATEGORï¿½ */}
                {categories.length > 0 && (
                  <FilterSection title="Kategori" sectionKey="kategori">
                    <div style={{ display: "flex", flexDirection: "column" as const, gap: "6px" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "12px", color: selectedCategory === null ? "#0A0A0A" : "#888" }}>
                        <input type="radio" name="cat" checked={selectedCategory === null} onChange={() => setSelectedCategory(null)} style={{ accentColor: "#0A0A0A", cursor: "pointer" }} />
                        Tumu
                      </label>
                      {categories.map(cat => (
                        <label key={cat.id} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "12px", color: selectedCategory === cat.id ? "#0A0A0A" : "#888" }}>
                          <input type="radio" name="cat" checked={selectedCategory === cat.id} onChange={() => setSelectedCategory(cat.id)} style={{ accentColor: "#0A0A0A", cursor: "pointer" }} />
                          {cat.name}
                        </label>
                      ))}
                    </div>
                  </FilterSection>
                )}

                {/* ATTRIBUTE Fï¿½LTRELERï¿½ */}
                {attrGroups.map(group => (
                  <FilterSection key={group.name} title={group.name} sectionKey={normalize(group.name)}>
                    <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "6px" }}>
                      {group.values.map(val => {
                        const isSelected = (selectedAttrs[group.name] || []).includes(val)
                        return (
                          <button
                            key={val}
                            onClick={() => toggleAttr(group.name, val)}
                            style={{
                              padding: "5px 11px",
                              fontSize: "11px",
                              border: isSelected ? "1.5px solid #0A0A0A" : "0.5px solid #e0e0e0",
                              background: isSelected ? "#0A0A0A" : "#fff",
                              color: isSelected ? "#fff" : "#888",
                              cursor: "pointer",
                              fontFamily: "var(--font-dm-sans)",
                              borderRadius: "2px",
                              transition: "all 0.15s",
                            }}
                          >
                            {val}
                          </button>
                        )
                      })}
                    </div>
                  </FilterSection>
                ))}

                {/* Fï¿½YAT ARALIï¿½I */}
                <FilterSection title="Fiyat Araligi" sectionKey="fiyat">
                  <div style={{ display: "flex", flexDirection: "column" as const, gap: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "9px", color: "#bbb", marginBottom: "3px", letterSpacing: "0.1em" }}>MIN (TL)</div>
                        <input
                          type="number"
                          placeholder={String(minPrice)}
                          value={priceMin}
                          min={minPrice}
                          max={priceMax}
                          onChange={e => setPriceMin(e.target.value)}
                          style={{ width: "100%", border: "none", borderBottom: "1px solid #e0e0e0", padding: "6px 0", fontSize: "13px", outline: "none", fontFamily: "var(--font-dm-sans)", background: "transparent", color: "#0A0A0A" }}
                        />
                      </div>
                      <span style={{ fontSize: "12px", color: "#bbb", paddingTop: "16px" }}>ï¿½</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "9px", color: "#bbb", marginBottom: "3px", letterSpacing: "0.1em" }}>MAX (TL)</div>
                        <input
                          type="number"
                          placeholder={String(maxPrice)}
                          value={priceMax}
                          min={minPrice}
                          max={maxPrice}
                          onChange={e => setPriceMax(e.target.value)}
                          style={{ width: "100%", border: "none", borderBottom: "1px solid #e0e0e0", padding: "6px 0", fontSize: "13px", outline: "none", fontFamily: "var(--font-dm-sans)", background: "transparent", color: "#0A0A0A" }}
                        />
                      </div>
                    </div>
                    <div style={{ fontSize: "10px", color: "#bbb" }}>
                      {formatPrice(minPrice)} ï¿½ {formatPrice(maxPrice)}
                    </div>
                    {(priceMin || priceMax) && (
                      <button onClick={() => { setPriceMin(""); setPriceMax("") }} style={{ fontSize: "10px", color: "#888", background: "none", border: "0.5px solid #e0e0e0", padding: "4px 10px", cursor: "pointer", fontFamily: "var(--font-dm-sans)", alignSelf: "flex-start" }}>
                        Temizle
                      </button>
                    )}
                  </div>
                </FilterSection>

                {/* STOK */}
                <FilterSection title="Stok Durumu" sectionKey="stok">
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "12px", color: "#888" }}>
                    <input type="checkbox" checked={onlyInStock} onChange={e => setOnlyInStock(e.target.checked)} style={{ accentColor: "#0A0A0A", cursor: "pointer", width: "14px", height: "14px" }} />
                    Sadece stokta olanlar
                  </label>
                </FilterSection>

              </div>
            </div>
          )}

          {/* ï¿½Rï¿½N GRID */}
          <div style={{ flex: 1, paddingTop: "2rem", paddingBottom: "4rem" }}>

            {/* AKTï¿½F Fï¿½LTRE CHIPLERï¿½ */}
            {activeFilterCount > 0 && (
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" as const, marginBottom: "16px", alignItems: "center" }}>
                <span style={{ fontSize: "10px", color: "#bbb", letterSpacing: "0.1em", textTransform: "uppercase" }}>Filtreler:</span>
                {Object.entries(selectedAttrs).flatMap(([attrName, vals]) =>
                  vals.map(val => (
                    <span key={`${attrName}-${val}`} style={{ display: "inline-flex", alignItems: "center", gap: "5px", background: "#0A0A0A", color: "#fff", padding: "4px 10px", fontSize: "10px", letterSpacing: "0.08em" }}>
                      {val}
                      <button onClick={() => toggleAttr(attrName, val)} style={{ background: "none", border: "none", cursor: "pointer", color: "#fff", display: "flex", padding: 0 }}>
                        <X size={10} />
                      </button>
                    </span>
                  ))
                )}
                {priceMin && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", background: "#0A0A0A", color: "#fff", padding: "4px 10px", fontSize: "10px" }}>
                    Min: {formatPrice(parseFloat(priceMin))}
                    <button onClick={() => setPriceMin("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#fff", display: "flex", padding: 0 }}><X size={10} /></button>
                  </span>
                )}
                {priceMax && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", background: "#0A0A0A", color: "#fff", padding: "4px 10px", fontSize: "10px" }}>
                    Max: {formatPrice(parseFloat(priceMax))}
                    <button onClick={() => setPriceMax("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#fff", display: "flex", padding: 0 }}><X size={10} /></button>
                  </span>
                )}
                {onlyInStock && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", background: "#0A0A0A", color: "#fff", padding: "4px 10px", fontSize: "10px" }}>
                    Stokta var
                    <button onClick={() => setOnlyInStock(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#fff", display: "flex", padding: 0 }}><X size={10} /></button>
                  </span>
                )}
                <button onClick={clearFilters} style={{ fontSize: "10px", color: "#888", background: "none", border: "0.5px solid #e0e0e0", padding: "4px 10px", cursor: "pointer", fontFamily: "var(--font-dm-sans)", letterSpacing: "0.08em" }}>
                  Tumu Temizle
                </button>
              </div>
            )}

            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "5rem 0" }}>
                <p style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Yükleniyor...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "6rem 0" }}>
                <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.8rem", fontWeight: 300, marginBottom: "0.8rem" }}>
                 Aradığınız ürün bulunamadı
                </p>
                <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "1.5rem" }}>
                  Seçilen fitrelerle eşleşen ürün yok.
                </p>
                {activeFilterCount > 0 && (
                  <button onClick={clearFilters} style={{ background: "#0A0A0A", color: "#fff", padding: "10px 24px", fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "var(--font-dm-sans)", border: "none", cursor: "pointer" }}>
                    Filtreleri Temizle
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fill, minmax(${showFilters ? "210px" : "260px"}, 1fr))`, border: "0.5px solid #efefef" }}>
                {filtered.map(fv => (
                  <div
                    key={`${fv.productId}-${fv.variantId}`}
                    style={{ border: "0.5px solid #efefef", position: "relative", background: "#fff", transition: "background 0.15s" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#fafafa"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "#fff"}
                  >
                    <Link href={`/customer/products/${fv.productId}?variant=${fv.variantId}`} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
                      <div style={{ aspectRatio: "1", background: "#f8f8f8", overflow: "hidden", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {fv.imageUrl ? (
                          <img
                            src={fv.imageUrl}
                            alt={fv.productName}
                            style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s" }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = "scale(1.04)"}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = "scale(1)"}
                          />
                        ) : (
                          <svg width="60" height="60" viewBox="0 0 100 100" fill="none" Popacity="0.15">
                            <rect x="20" y="35" width="60" height="50" rx="6" fill="#B8A99A"/>
                            <path d="M35 35 Q35 20 50 20 Q65 20 65 35" fill="none" stroke="#8B6F5E" strokeWidth="4" strokeLinecap="round"/>
                          </svg>
                        )}
                        {fv.stock === 0 && (
                          <div style={{ position: "absolute", top: "10px", left: "10px", background: "#FCEBEB", color: "#A32D2D", fontSize: "8px", letterSpacing: "0.1em", textTransform: "uppercase", padding: "3px 7px" }}>Tükendi</div>
                        )}
                        {fv.stock > 0 && fv.stock <= 5 && (
                          <div style={{ position: "absolute", top: "10px", left: "10px", background: "#FEF3CD", color: "#854F0B", fontSize: "8px", letterSpacing: "0.1em", textTransform: "uppercase", padding: "3px 7px" }}>Son {fv.stock}!</div>
                        )}
                      </div>
                      <div style={{ padding: "1rem" }}>
                        <div style={{ fontSize: "9px", letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--muted)", marginBottom: "3px" }}>{fv.categoryName}</div>
                        <div style={{ fontFamily: "--font-cormorant, serif", fontSize: "1rem", fontWeight: 400, lineHeight: 1.3, color: "var(--foreground)", marginBottom: "4px" }}>{fv.productName}</div>
                        {fv.label && (
                          <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "8px" }}>{fv.label}</div>
                        )}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "13px", fontWeight: 500, color: fv.stock === 0 ? "var(--muted)" : "var(--foreground)" }}>
                            {formatPrice(fv.price)}
                          </span>
                          <span style={{ fontSize: "10px", color: fv.stock === 0 ? "var(--error)" : fv.stock <= 5 ? "#854F0B" : "var(--muted-light)" }}>
                            {fv.stock === 0 ? "Tukendi" : `${fv.stock} adet`}
                          </span>
                        </div>
                      </div>
                    </Link>
                    <button
                      onClick={e => toggleFavorite(e, fv.variantId)}
                      style={{ position: "absolute", top: "10px", right: "10px", width: "32px", height: "32px", background: "rgba(255,255,255,0.95)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", color: favorites.includes(fv.variantId) ? "var(--error)" : "var(--muted)", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}
                    >
                      <Heart size={14} fill={favorites.includes(fv.variantId) ? "currentColor" : "none"} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showSort && <div onClick={() => setShowSort(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />}

    </main>
  )
}

