"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Heart } from "lucide-react"

type FavoriteItem = {
  id: number
  variant_id: number
  price: number
  stock: number
  label: string
  imageUrl: string | null
  productId: number
  productName: string
  categoryName: string
  isOutOfStock: boolean
}

export default function FavoritesPage() {
  const router = useRouter()
  const supabase = createClient()
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchFavorites = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/customer/login"); return }

      // 1. Favorites tablosundan variant_id'leri çek
      const { data: favData, error: favErr } = await supabase
        .from("favorites")
        .select("id, variant_id, created_at")
        .eq("user_id", user.id)
        .not("variant_id", "is", null)
        .order("created_at", { ascending: false })

      if (favErr) {
        console.error("Fav error:", favErr)
        setError("Favoriler yuklenemedi.")
        setLoading(false)
        return
      }

      if (!favData || favData.length === 0) {
        setFavorites([])
        setLoading(false)
        return
      }

      const variantIds = favData.map(f => f.variant_id)

      // 2. Variant'ları çek
      const { data: variantData, error: varErr } = await supabase
        .from("product_variants")
        .select(`
          id, price, stock,
          products (
            id, name,
            categories ( name )
          ),
          variant_attributes (
            attribute_values (
              value,
              attributes ( name )
            )
          )
        `)
        .in("id", variantIds)

      if (varErr) {
        console.error("Variant error:", varErr)
        setError("Urun bilgileri yuklenemedi.")
        setLoading(false)
        return
      }

      // 3. Görselleri çek
      const productIds = [...new Set((variantData || []).map((v: any) => v.products?.id).filter(Boolean))]

      const { data: imageData } = await supabase
        .from("product_images")
        .select("product_id, variant_id, image_url, is_primary, sort_order")
        .in("product_id", productIds)
        .order("sort_order")

      // 4. Hepsini birleştir
      const items: FavoriteItem[] = favData
        .map(fav => {
          const variant = (variantData || []).find((v: any) => v.id === fav.variant_id) as any
          if (!variant) return null

          const product = variant.products
          const imgs = (imageData || []).filter(img => img.product_id === product?.id)

          // Varyanta özel görsel önce, sonra genel
          const imageUrl =
            imgs.find(i => i.variant_id === fav.variant_id && i.is_primary)?.image_url ||
            imgs.find(i => i.variant_id === fav.variant_id)?.image_url ||
            imgs.find(i => i.is_primary && i.variant_id === null)?.image_url ||
            imgs.find(i => i.variant_id === null)?.image_url ||
            imgs[0]?.image_url ||
            null

          const label = variant.variant_attributes
            ?.map((va: any) => va.attribute_values?.value)
            .filter(Boolean)
            .join(" · ") || ""

          return {
            id: fav.id,
            variant_id: fav.variant_id,
            price: variant.price,
            stock: variant.stock,
            label,
            imageUrl,
            productId: product?.id,
            productName: product?.name,
            categoryName: product?.categories?.name || "",
            isOutOfStock: variant.stock === 0,
          } as FavoriteItem
        })
        .filter(Boolean) as FavoriteItem[]

      setFavorites(items)
      setLoading(false)
    }

    fetchFavorites()
  }, [])

  const removeFavorite = async (favoriteId: number) => {
    await supabase.from("favorites").delete().eq("id", favoriteId)
    setFavorites(prev => prev.filter(f => f.id !== favoriteId))
  }

  const fmt = (p: number) => p.toLocaleString("tr-TR") + " TL"

  if (loading) return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>Yukleniyor...</p>
    </main>
  )

  return (
    <main style={{ minHeight: "100vh", background: "var(--background)" }}>
      <style>{`
        .fav-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          border: 0.5px solid #efefef;
        }
        @media (max-width: 600px) {
          .fav-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      {/* BAŞLIK */}
      <div style={{ padding: "2rem 3rem", borderBottom: "0.5px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
          <Link href="/customer/profile" style={{ fontSize: "11px", color: "var(--muted)", textDecoration: "none", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Profilim
          </Link>
          <span style={{ color: "var(--muted-light)" }}>/</span>
          <span style={{ fontSize: "11px", color: "var(--foreground)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Favorilerim
          </span>
        </div>
        <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "2rem", fontWeight: 300 }}>
          Favorilerim
          {favorites.length > 0 && (
            <span style={{ fontSize: "1.2rem", color: "var(--muted)", marginLeft: "10px", fontWeight: 300 }}>
              ({favorites.length})
            </span>
          )}
        </h1>
      </div>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 3rem" }}>

        {error && (
          <div style={{ background: "#FCEBEB", border: "1px solid #E24B4A", padding: "1rem", marginBottom: "1rem" }}>
            <p style={{ fontSize: "13px", color: "#A32D2D" }}>{error}</p>
          </div>
        )}

        {favorites.length === 0 && !error ? (
          <div style={{ textAlign: "center", padding: "6rem 0", display: "flex", flexDirection: "column" as const, alignItems: "center", gap: "1.2rem" }}>
            <Heart size={48} strokeWidth={1} color="var(--muted-light)" />
            <div>
              <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.8rem", fontWeight: 300, marginBottom: "8px" }}>
                Favori urun yok
              </p>
              <p style={{ fontSize: "13px", color: "var(--muted)" }}>
                Begendiklerinizi favorilere ekleyin.
              </p>
            </div>
            <Link
              href="/customer/products"
              style={{ background: "#0A0A0A", color: "#fff", padding: "12px 28px", fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", textDecoration: "none", fontFamily: "var(--font-dm-sans)", marginTop: "0.5rem" }}
            >
              Urunleri Kesfet
            </Link>
          </div>
        ) : (
          <div className="fav-grid">
            {favorites.map(fav => (
              <div
                key={fav.id}
                style={{ border: "0.5px solid #efefef", position: "relative", background: "#fff", transition: "background 0.15s" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#fafafa"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "#fff"}
              >
                <Link
                  href={`/customer/products/${fav.productId}?variant=${fav.variant_id}`}
                  style={{ textDecoration: "none", color: "inherit", display: "block" }}
                >
                  {/* GÖRSEL */}
                  <div style={{ aspectRatio: "1", background: "#f8f8f8", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                    {fav.imageUrl ? (
                      <img
                        src={fav.imageUrl}
                        alt={fav.productName}
                        style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s" }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = "scale(1.04)"}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = "scale(1)"}
                      />
                    ) : (
                      <svg width="60" height="60" viewBox="0 0 100 100" fill="none" opacity="0.15">
                        <rect x="20" y="35" width="60" height="50" rx="6" fill="#B8A99A"/>
                        <path d="M35 35 Q35 20 50 20 Q65 20 65 35" fill="none" stroke="#8B6F5E" strokeWidth="4" strokeLinecap="round"/>
                      </svg>
                    )}
                    {fav.isOutOfStock && (
                      <div style={{ position: "absolute", top: "10px", left: "10px", background: "#FCEBEB", color: "#A32D2D", fontSize: "8px", letterSpacing: "0.1em", textTransform: "uppercase", padding: "3px 7px" }}>
                        Tukendi
                      </div>
                    )}
                  </div>

                  {/* BİLGİ */}
                  <div style={{ padding: "1rem" }}>
                    <div style={{ fontSize: "9px", letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--muted)", marginBottom: "3px" }}>
                      {fav.categoryName}
                    </div>
                    <div style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1rem", fontWeight: 400, lineHeight: 1.3, marginBottom: "4px", color: "var(--foreground)" }}>
                      {fav.productName}
                    </div>
                    {fav.label && (
                      <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "8px" }}>
                        {fav.label}
                      </div>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "13px", fontWeight: 500, color: fav.isOutOfStock ? "var(--muted)" : "var(--foreground)" }}>
                        {fmt(fav.price)}
                      </span>
                      <span style={{ fontSize: "10px", color: fav.isOutOfStock ? "var(--error)" : "var(--muted-light)" }}>
                        {fav.isOutOfStock ? "Tukendi" : `${fav.stock} adet`}
                      </span>
                    </div>
                  </div>
                </Link>

                {/* FAVORİDEN KALDIR */}
                <button
                  onClick={() => removeFavorite(fav.id)}
                  title="Favorilerden kaldir"
                  style={{ position: "absolute", top: "10px", right: "10px", width: "32px", height: "32px", background: "rgba(255,255,255,0.95)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", color: "var(--error)", boxShadow: "0 1px 4px rgba(0,0,0,0.1)", transition: "transform 0.2s" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = "scale(1.1)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = "scale(1)"}
                >
                  <Heart size={14} fill="currentColor" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}