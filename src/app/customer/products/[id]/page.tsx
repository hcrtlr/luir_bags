"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Heart, ShoppingBag, ChevronLeft, ChevronRight, Minus, Plus, Check } from "lucide-react"

type AttributeValue = {
  id: number
  value: string
  attributes: { name: string }
}

type ProductImage = {
  id: number
  image_url: string
  is_primary: boolean
  sort_order: number
  variant_id: number | null
}

type Variant = {
  id: number
  price: number
  stock: number
  sku: string
  variant_attributes: { attribute_values: AttributeValue }[]
}

type Product = {
  id: number
  name: string
  description: string
  gender: string
  categories: { name: string }
  product_images: ProductImage[]
  product_variants: Variant[]
}

const colorMap: Record<string, string> = {
  "siyah": "#1A1714", "black": "#1A1714",
  "beyaz": "#F0F0F0", "white": "#F0F0F0",
  "taş": "#f8eee0", "krem": "#f8eee0",
  "taba": "#C4956A", "tan": "#C4956A",
  "vizon": "#CABFAD", "bej": "#CABFAD0", "beige":"#b6b5a9",
  "kahverengi": "#765845", "brown": "#765845",
  "lacivert": "#22396b", "navy": "#22396b",
  "gri": "#5f5c59", "grey": "#5f5c59", "gray": "#5f5c59",
  "kirmizi": "#cd3524", "red": "#cd3524",
  "bordo": "#5f1a27","darkred":"#5f1a27",
  "yeşil": "#1d8053", "green": "#1d8053",
  "mavi": "#2c7cd7", "blue": "#2c7cd7",
  "pembe": "#e27195", "pink": "#e27195",
  "sari": "#D4A017", "yellow": "#D4A017",
  "turuncu": "#C4612A", "orange": "#C4612A",
  "mor": "#6B3A8A", "purple": "#6B3A8A",
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null)
  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, number>>({})
  const [quantity, setQuantity] = useState(1)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isFavorite, setIsFavorite] = useState(false)
  const [cartSuccess, setCartSuccess] = useState(false)
  const [cartError, setCartError] = useState("")

  useEffect(() => {
    const fetchProduct = async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          id, name, description, gender,
          categories ( name ),
          product_images ( id, image_url, is_primary, sort_order, variant_id ),
          product_variants (
            id, price, stock, sku,
            variant_attributes (
              attribute_values ( id, value, attributes ( name ) )
            )
          )
        `)
        .eq("id", params.id)
        .single()

      if (error || !data) { router.push("/customer/products"); return }
      setProduct(data)

      // URL'den variant oku
      const urlVariantId = searchParams.get("variant")
      let initialVariant = data.product_variants[0]

      if (urlVariantId) {
        const found = data.product_variants.find(v => v.id === parseInt(urlVariantId))
        if (found) initialVariant = found
      }

      if (initialVariant) {
        setSelectedVariantId(initialVariant.id)
        const attrs: Record<string, number> = {}
        initialVariant.variant_attributes.forEach(va => {
          attrs[va.attribute_values.attributes.name] = va.attribute_values.id
        })
        setSelectedAttrs(attrs)
      }

      setLoading(false)
    }
    fetchProduct()
  }, [params.id])

  // Varyant değişince görsel ve adet sıfırla
  useEffect(() => {
    setCurrentImageIndex(0)
    setQuantity(1)
    setCartError("")
  }, [selectedVariantId])

  useEffect(() => {
    const checkFavorite = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from("favorites").select("id")
        .eq("user_id", user.id).eq("product_id", params.id).single()
      setIsFavorite(!!data)
    }
    checkFavorite()
  }, [params.id])

  // Attribute grupları
  const getAttributeGroups = () => {
    if (!product) return {}
    const groups: Record<string, { id: number; value: string }[]> = {}
    product.product_variants.forEach(v => {
      v.variant_attributes.forEach(va => {
        const name = va.attribute_values.attributes.name
        if (!groups[name]) groups[name] = []
        if (!groups[name].find(g => g.id === va.attribute_values.id)) {
          groups[name].push({ id: va.attribute_values.id, value: va.attribute_values.value })
        }
      })
    })
    return groups
  }

  // Attribute seçince varyantı bul ve görseli değiştir
  const handleAttrSelect = (attrName: string, valueId: number) => {
    if (!product) return
    const newAttrs = { ...selectedAttrs, [attrName]: valueId }
    setSelectedAttrs(newAttrs)

    // Yeni kombinasyona uyan varyantı bul
    const found = product.product_variants.find(v => {
      const vAttrs: Record<string, number> = {}
      v.variant_attributes.forEach(va => {
        vAttrs[va.attribute_values.attributes.name] = va.attribute_values.id
      })
      return Object.entries(newAttrs).every(([k, val]) => vAttrs[k] === val)
    })

    if (found) {
      setSelectedVariantId(found.id)
      router.push(`/customer/products/${params.id}?variant=${found.id}`, { scroll: false })
    }
  }

  // Bu attribute değeri seçilince hangi stok?
  const getAttrStock = (attrName: string, valueId: number): number => {
    if (!product) return 0
    const testAttrs = { ...selectedAttrs, [attrName]: valueId }
    const found = product.product_variants.find(v => {
      const vAttrs: Record<string, number> = {}
      v.variant_attributes.forEach(va => {
        vAttrs[va.attribute_values.attributes.name] = va.attribute_values.id
      })
      return Object.entries(testAttrs).every(([k, val]) => vAttrs[k] === val)
    })
    return found?.stock ?? 0
  }

  // Varyanta göre görseller — varyant görseli varsa onu, yoksa genel görseli göster
  const getImages = (): ProductImage[] => {
    if (!product) return []
    const all = product.product_images

    if (selectedVariantId) {
      const variantImgs = all
        .filter(img => img.variant_id === selectedVariantId)
        .sort((a, b) => a.sort_order - b.sort_order)
      if (variantImgs.length > 0) return variantImgs
    }

    return all
      .filter(img => img.variant_id === null)
      .sort((a, b) => a.sort_order - b.sort_order)
  }

  const handleAddToCart = async () => {
    setCartError("")
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/customer/login"); return }
    if (!currentVariant) { setCartError("Lutfen secim yapin."); return }
    if (currentVariant.stock === 0) { setCartError("Bu urun stokta yok."); return }

    let { data: cart } = await supabase.from("carts").select("id").eq("user_id", user.id).single()
    if (!cart) {
      const { data: newCart } = await supabase.from("carts").insert({ user_id: user.id }).select("id").single()
      cart = newCart
    }
    if (!cart) return

    const { data: existing } = await supabase
      .from("cart_items").select("id, quantity")
      .eq("cart_id", cart.id).eq("variant_id", currentVariant.id).single()

    if (existing) {
      await supabase.from("cart_items")
        .update({ quantity: existing.quantity + quantity }).eq("id", existing.id)
    } else {
      await supabase.from("cart_items").insert({
        cart_id: cart.id, variant_id: currentVariant.id, quantity
      })
    }

    setCartSuccess(true)
    setTimeout(() => setCartSuccess(false), 2500)
  }

  const handleFavorite = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/customer/login"); return }
    if (isFavorite) {
      await supabase.from("favorites").delete().eq("user_id", user.id).eq("product_id", product?.id)
      setIsFavorite(false)
    } else {
      await supabase.from("favorites").insert({ user_id: user.id, product_id: product?.id })
      setIsFavorite(true)
    }
  }

  const currentVariant = product?.product_variants.find(v => v.id === selectedVariantId) || null
  const images = getImages()
  const attrGroups = getAttributeGroups()
  const isOutOfStock = currentVariant ? currentVariant.stock === 0 : false

  if (loading) return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Yukleniyor...</p>
    </main>
  )

  if (!product) return null

  return (
    <main style={{ minHeight: "100vh", background: "var(--background)" }}>

      {/* BREADCRUMB */}
      <div style={{ padding: "1rem 3rem", borderBottom: "0.5px solid var(--border)", display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", color: "var(--muted)" }}>
        <Link href="/customer" style={{ color: "var(--muted)", textDecoration: "none" }}>Ana Sayfa</Link>
        <span>/</span>
        <Link href="/customer/products" style={{ color: "var(--muted)", textDecoration: "none" }}>Ürünler</Link>
        <span>/</span>
        <span style={{ color: "var(--foreground)" }}>{product.name}</span>
      </div>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "3rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5rem", alignItems: "flex-start" }}>

        {/* SOL: GÖRSELLER */}
        <div style={{ position: "sticky", top: "130px" }}>

          {/* ANA GÖRSEL */}
          <div style={{ aspectRatio: "1", background: "var(--surface)", borderRadius: "4px", overflow: "hidden", position: "relative", marginBottom: "12px" }}>
            {images.length > 0 ? (
              <img
                key={images[currentImageIndex]?.id}
                src={images[currentImageIndex]?.image_url}
                alt={product.name}
                style={{ width: "100%", height: "100%", objectFit: "cover", transition: "opacity 0.3s" }}
              />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="100" height="100" viewBox="0 0 100 100" fill="none" opacity="0.15">
                  <rect x="20" y="35" width="60" height="50" rx="6" fill="#B8A99A"/>
                  <path d="M35 35 Q35 20 50 20 Q65 20 65 35" fill="none" stroke="#8B6F5E" strokeWidth="4" strokeLinecap="round"/>
                </svg>
              </div>
            )}

            {images.length > 1 && (
              <>
                <button onClick={() => setCurrentImageIndex(p => (p - 1 + images.length) % images.length)} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.9)", border: "none", cursor: "pointer", width: "36px", height: "36px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                  <ChevronLeft size={16} />
                </button>
                <button onClick={() => setCurrentImageIndex(p => (p + 1) % images.length)} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.9)", border: "none", cursor: "pointer", width: "36px", height: "36px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                  <ChevronRight size={16} />
                </button>
                <div style={{ position: "absolute", bottom: "12px", right: "12px", background: "rgba(0,0,0,0.45)", color: "#fff", fontSize: "11px", padding: "3px 8px", borderRadius: "10px" }}>
                  {currentImageIndex + 1} / {images.length}
                </div>
              </>
            )}
          </div>

          {/* KÜÇÜK GÖRSELLER */}
          {images.length > 1 && (
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {images.map((img, i) => (
                <div key={img.id} onClick={() => setCurrentImageIndex(i)} style={{ width: "68px", height: "68px", borderRadius: "4px", overflow: "hidden", cursor: "pointer", border: currentImageIndex === i ? "2px solid var(--foreground)" : "1.5px solid var(--border)", transition: "border-color 0.2s", flexShrink: 0 }}>
                  <img src={img.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SAĞ: ÜRÜN BİLGİLERİ */}
        <div style={{ display: "flex", flexDirection: "column" as const, gap: "1.6rem" }}>

          {/* İSİM + FİYAT */}
          <div>
            <div style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--muted)", marginBottom: "8px" }}>
              {product.categories?.name}
            </div>
            <h1 style={{ fontFamily:"--font-cormorant" , fontSize: "2.4rem", fontWeight: 300, lineHeight: 1.15, marginBottom: "12px" }}>
              {product.name}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontFamily: "--font-cormorant, serif", fontSize: "1.8rem", fontWeight: 300 }}>
                {currentVariant ? currentVariant.price.toLocaleString("tr-TR") + " TL" : "—"}
              </span>
              {currentVariant && currentVariant.stock > 0 && currentVariant.stock <= 5 && (
                <span style={{ fontSize: "11px", color: "#854F0B", background: "#FEF3CD", padding: "3px 8px", borderRadius: "2px" }}>
                  Son {currentVariant.stock} adet!
                </span>
              )}
            </div>
          </div>

          {/* STOK */}
          {currentVariant && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: isOutOfStock ? "var(--error)" : "var(--success)", flexShrink: 0 }} />
              <span style={{ fontSize: "12px", color: isOutOfStock ? "var(--error)" : "var(--success-dark)" }}>
                {isOutOfStock ? "Stokta yok" : `Stokta var — ${currentVariant.stock} adet`}
              </span>
            </div>
          )}

          <div style={{ height: "0.5px", background: "var(--border)" }} />

          {/* VARİANT SEÇİCİLER */}
          {Object.entries(attrGroups).map(([attrName, values]) => {
            const isColor = attrName.toLowerCase().includes("renk") || attrName.toLowerCase().includes("color") || attrName.toLowerCase().includes("colour")
            const selectedId = selectedAttrs[attrName]

            return (
              <div key={attrName}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <span style={{ fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--muted)" }}>
                    {attrName}
                  </span>
                  {selectedId && (
                    <span style={{ fontSize: "12px", color: "var(--foreground)", fontWeight: 400 }}>
                      {values.find(v => v.id === selectedId)?.value}
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {values.map(val => {
                    const isSelected = selectedId === val.id
                    const stock = getAttrStock(attrName, val.id)
                    const isOOS = stock === 0
                    const colorHex = colorMap[val.value.toLowerCase()]

                    if (isColor && colorHex) {
                      return (
                        <button
                          key={val.id}
                          onClick={() => !isOOS && handleAttrSelect(attrName, val.id)}
                          title={val.value + (isOOS ? " — Tukendi" : ` — ${stock} adet`)}
                          style={{
                            width: "34px",
                            height: "34px",
                            borderRadius: "50%",
                            background: colorHex,
                            border: isSelected ? "3px solid #0A0A0A" : "2px solid var(--border)",
                            cursor: isOOS ? "not-allowed" : "pointer",
                            opacity: isOOS ? 0.3 : 1,
                            boxShadow: isSelected ? "0 0 0 2px #fff, 0 0 0 4px #0A0A0A" : "none",
                            transition: "all 0.2s",
                            outline: "none",
                            flexShrink: 0,
                            position: "relative",
                          }}
                        >
                          {isOOS && (
                            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%" }}>
                              <div style={{ width: "70%", height: "1px", background: "rgba(255,255,255,0.8)", transform: "rotate(45deg)" }} />
                            </div>
                          )}
                        </button>
                      )
                    }

                    // Yazılı buton (boyut vb.)
                    return (
                      <button
                        key={val.id}
                        onClick={() => !isOOS && handleAttrSelect(attrName, val.id)}
                        title={isOOS ? val.value + " — Tukendi" : val.value + ` — ${stock} adet`}
                        style={{
                          padding: "8px 18px",
                          border: isSelected ? "1.5px solid #0A0A0A" : "1px solid var(--border)",
                          background: isSelected ? "#0A0A0A" : "#fff",
                          color: isSelected ? "#fff" : isOOS ? "var(--muted-light)" : "var(--foreground)",
                          cursor: isOOS ? "not-allowed" : "pointer",
                          fontSize: "12px",
                          fontFamily: "var(--font-dm-sans)",
                          letterSpacing: "0.05em",
                          transition: "all 0.15s",
                          borderRadius: "2px",
                          position: "relative",
                          overflow: "hidden",
                        }}
                      >
                        {val.value}
                        {isOOS && (
                          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <div style={{ width: "110%", height: "1px", background: "var(--border)", transform: "rotate(-15deg)" }} />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* ADET */}
          <div>
            <div style={{ fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--muted)", marginBottom: "12px" }}>
              Adet
            </div>
            <div style={{ display: "flex", alignItems: "center", border: "0.5px solid var(--border)", width: "fit-content" }}>
              <button
                onClick={() => setQuantity(p => Math.max(1, p - 1))}
                disabled={quantity <= 1}
                style={{ width: "42px", height: "42px", display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: quantity <= 1 ? "not-allowed" : "pointer", color: quantity <= 1 ? "var(--muted-light)" : "var(--foreground)" }}
              >
                <Minus size={14} />
              </button>
              <span style={{ width: "52px", textAlign: "center", fontSize: "15px", fontWeight: 500 }}>{quantity}</span>
              <button
                onClick={() => setQuantity(p => Math.min(currentVariant?.stock || 1, p + 1))}
                disabled={quantity >= (currentVariant?.stock || 1)}
                style={{ width: "42px", height: "42px", display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: quantity >= (currentVariant?.stock || 1) ? "not-allowed" : "pointer", color: quantity >= (currentVariant?.stock || 1) ? "var(--muted-light)" : "var(--foreground)" }}
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {cartError && (
            <p style={{ fontSize: "12px", color: "var(--error)", padding: "8px 12px", border: "1px solid var(--error)" }}>
              {cartError}
            </p>
          )}

          {/* BUTONLAR */}
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock || !currentVariant}
              style={{ flex: 1, background: cartSuccess ? "var(--success-dark)" : isOutOfStock ? "#ccc" : "#0A0A0A", color: "#fff", border: "none", padding: "15px", fontSize: "11px", letterSpacing: "0.18em", textTransform: "uppercase", cursor: (isOutOfStock || !currentVariant) ? "not-allowed" : "pointer", fontFamily: "var(--font-dm-sans)", transition: "background 0.3s", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}
            >
              {cartSuccess ? <><Check size={16} /> Sepete Eklendi</> : isOutOfStock ? "Stokta Yok" : <><ShoppingBag size={16} /> Sepete Ekle</>}
            </button>
            {/* <button
              onClick={handleFavorite}
              style={{ width: "52px", height: "52px", border: isFavorite ? "1.5px solid var(--error)" : "0.5px solid var(--border)", background: isFavorite ? "#FFF0F0" : "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: isFavorite ? "var(--error)" : "var(--muted)", transition: "all 0.2s" }}
            >
              <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />
            </button> */}
          </div>

          <div style={{ height: "0.5px", background: "var(--border)" }} />

          {product.description && (
            <div>
              <div style={{ fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--muted)", marginBottom: "12px" }}>
                Urun Hakkında
              </div>
              <p style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.9 }}>
                {product.description}
              </p>
            </div>
          )}

          {currentVariant?.sku && (
            <p style={{ fontSize: "11px", color: "var(--muted-light)" }}>SKU: {currentVariant.sku}</p>
          )}

          <div style={{ background: "var(--surface)", padding: "1rem 1.2rem", display: "flex", alignItems: "center", gap: "12px" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <p style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.7 }}>
              iyzico ile guvenli odeme · 30 gun ucretsiz iade · Hizli teslimat
            </p>
          </div>

        </div>
      </div>
    </main>
  )
}