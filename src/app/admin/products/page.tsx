"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, Plus, Trash2, Eye, EyeOff, LogOut, Pencil } from "lucide-react"

type Product = {
  id: number
  name: string
  gender: string
  is_active: boolean
  created_at: string
  categories: { name: string }
  product_variants: { price: number; stock: number }[]
  product_images: { image_url: string; is_primary: boolean }[]
}

export default function AdminProductsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState("")

  const fetchProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select(`
        id, name, gender, is_active, created_at,
        categories ( name ),
        product_variants ( price, stock ),
        product_images ( image_url, is_primary )
      `)
      .order("created_at", { ascending: false })
    setProducts((data as any[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/admin/login"); return }
      const { data } = await supabase.from("admins").select("id").eq("id", user.id).single()
      if (!data) { router.push("/admin/login"); return }
      fetchProducts()
    }
    checkAdmin()
  }, [])

  const toggleActive = async (id: number, current: boolean) => {
    const { error } = await supabase
      .from("products")
      .update({ is_active: !current })
      .eq("id", id)

    if (!error) {
      setProducts(prev => prev.map(p => p.id === id ? { ...p, is_active: !current } : p))
    }
  }

  const deleteProduct = async (id: number) => {
    setDeleting(true)
    setError("")

    try {
      // Storage'daki g�rselleri sil
      const { data: images } = await supabase
        .from("product_images")
        .select("image_url")
        .eq("product_id", id)

      if (images && images.length > 0) {
        const paths = images
          .map(img => {
            const url = img.image_url
            const parts = url.split("/storage/v1/object/public/products/")
            return parts[1] || null
          })
          .filter(Boolean) as string[]

        if (paths.length > 0) {
          await supabase.storage.from("products").remove(paths)
        }
      }

      
      const { error: deleteError } = await supabase
        .from("products")
        .delete()
        .eq("id", id)

      if (deleteError) {
        setError("Urun silinemedi: " + deleteError.message)
        setDeleting(false)
        return
      }

      setProducts(prev => prev.filter(p => p.id !== id))
      setDeleteId(null)

    } catch (err) {
      setError("Beklenmedik bir hata olustu.")
    } finally {
      setDeleting(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/admin/login")
  }

  const getPrimaryImage = (product: Product) => {
    return product.product_images?.find(i => i.is_primary)?.image_url
      || product.product_images?.[0]?.image_url
      || null
  }

  const getMinPrice = (product: Product) => {
    const prices = product.product_variants?.map(v => v.price) || []
    return prices.length > 0 ? Math.min(...prices) : 0
  }

  const getTotalStock = (product: Product) => {
    return product.product_variants?.reduce((sum, v) => sum + v.stock, 0) || 0
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#888" }}>Yukleniyor...</p>
    </div>
  )

  return (
    <div style={{ minHeight: "100vh", background: "#F5F5F5" }}>

      {/* NAVBAR */}
      <div style={{ background: "#0A0A0A", padding: "1rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Link href="/admin" style={{ color: "#555", display: "flex" }}>
            <ArrowLeft size={20} />
          </Link>
          <div style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.4rem", fontWeight: 300, color: "#fff" }}>
            Urunler ({products.length})
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <Link href="/admin/products/add" style={{ background: "#fff", color: "#0A0A0A", padding: "7px 16px", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "var(--font-dm-sans)", textDecoration: "none", display: "flex", alignItems: "center", gap: "6px" }}>
            <Plus size={12} /> Urun Ekle
          </Link>
          <button onClick={handleLogout} style={{ background: "none", border: "0.5px solid #333", color: "#666", padding: "7px 14px", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", fontFamily: "var(--font-dm-sans)", display: "flex", alignItems: "center", gap: "6px" }}>
            <LogOut size={12} /> Cikis
          </button>
        </div>
      </div>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>

        {error && (
          <div style={{ background: "#FCEBEB", border: "1px solid #E24B4A", padding: "1rem", marginBottom: "1rem" }}>
            <p style={{ fontSize: "13px", color: "#A32D2D" }}>{error}</p>
          </div>
        )}

        {products.length === 0 ? (
          <div style={{ background: "#fff", border: "0.5px solid #e0e0e0", padding: "4rem", textAlign: "center" }}>
            <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.5rem", fontWeight: 300, marginBottom: "1rem" }}>Henuz urun yok</p>
            <Link href="/admin/products/add" style={{ background: "#0A0A0A", color: "#fff", padding: "10px 24px", fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none", display: "inline-block" }}>
              Ilk Urunu Ekle
            </Link>
          </div>
        ) : (
          <div style={{ background: "#fff", border: "0.5px solid #e0e0e0", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "0.5px solid #e0e0e0", background: "#FAFAFA" }}>
                  {["Gorsel", "ID", "Urun", "Kategori", "Cinsiyet", "Fiyat", "Stok", "Durum", "Islemler"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#888", fontWeight: 400, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product.id} style={{ borderBottom: "0.5px solid #F0F0F0", transition: "background 0.15s" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#FAFAFA"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "#fff"}
                  >
                    {/* G�RSEL */}
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ width: "52px", height: "52px", background: "#f5f5f5", borderRadius: "4px", overflow: "hidden", flexShrink: 0 }}>
                        {getPrimaryImage(product) ? (
                          <img src={getPrimaryImage(product)!} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#ddd", fontSize: "20px" }}>?</div>
                        )}
                      </div>
                    </td>

                    {/* ID */}
                    <td style={{ padding: "12px 16px", fontSize: "12px", color: "#888", whiteSpace: "nowrap" }}>#{product.id}</td>

                    {/* �R�N ADI */}
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontSize: "13px", fontWeight: 500, color: "#0A0A0A", marginBottom: "2px" }}>{product.name}</div>
                      <div style={{ fontSize: "11px", color: "#bbb" }}>
                        {new Date(product.created_at).toLocaleDateString("tr-TR")}
                      </div>
                    </td>

                    {/* KATEGOR� */}
                    <td style={{ padding: "12px 16px", fontSize: "12px", color: "#888", whiteSpace: "nowrap" }}>
                      {product.categories?.name || "�"}
                    </td>

                    {/* C�NS�YET */}
                    <td style={{ padding: "12px 16px", fontSize: "12px", color: "#888", whiteSpace: "nowrap" }}>
                      {{ female: "Kadin", male: "Erkek", unisex: "Unisex", kids: "Cocuk" }[product.gender] || product.gender}
                    </td>

                    {/* F�YAT */}
                    <td style={{ padding: "12px 16px", fontSize: "13px", fontWeight: 500, whiteSpace: "nowrap" }}>
                      {getMinPrice(product).toLocaleString("tr-TR")} TL
                    </td>

                    {/* STOK */}
                    <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                      <span style={{ fontSize: "12px", color: getTotalStock(product) === 0 ? "#E24B4A" : getTotalStock(product) <= 5 ? "#854F0B" : "#3B6D11" }}>
                        {getTotalStock(product)} adet
                      </span>
                    </td>

                    {/* DURUM */}
                    <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                      <span style={{ fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", padding: "3px 8px", borderRadius: "2px", background: product.is_active ? "#EAF3DE" : "#F5F5F5", color: product.is_active ? "#3B6D11" : "#888" }}>
                        {product.is_active ? "Aktif" : "Pasif"}
                      </span>
                    </td>

                    {/* ��LEMLER */}
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <Link
                          href={`/products/${product.id}`}
                          target="_blank"
                          title="Site?? goster"
                          style={{ width: "32px", height: "32px", border: "0.5px solid #e0e0e0", display: "flex", alignItems: "center", justifyContent: "center", color: "#888", textDecoration: "none" }}
                        >
                          <Eye size={13} />
                        </Link>
                          <Link
                             href={`/admin/products/edit/${product.id}`}
                             title="Duzenle"
                             style={{ width: "32px", height: "32px", border: "0.5px solid #e0e0e0", display: "flex", alignItems: "center", justifyContent: "center", color: "#888", textDecoration: "none" }}
>
                            <Pencil size={13} />
                          </Link>
                        <button
                          onClick={() => toggleActive(product.id, product.is_active)}
                          title={product.is_active ? "Pasife al" : "Aktife al"}
                          style={{ width: "32px", height: "32px", border: "0.5px solid #e0e0e0", background: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#888" }}
                        >
                          {product.is_active ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                        <button
                          onClick={() => setDeleteId(product.id)}
                          title="Sil"
                          style={{ width: "32px", height: "32px", border: "0.5px solid #E24B4A", background: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#E24B4A" }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* S�L ONAY POP-UP */}
      {deleteId && (
        <div
          onClick={(e: React.MouseEvent<HTMLDivElement>) => { if (e.target === e.currentTarget) setDeleteId(null) }}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 999 }}
        >
          <div style={{ background: "#fff", width: "100%", maxWidth: "480px", padding: "28px 24px", borderRadius: "16px 16px 0 0" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "50%", border: "1px solid #E24B4A", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Trash2 size={18} color="#E24B4A" />
            </div>
            <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "20px", fontWeight: 300, textAlign: "center", marginBottom: "8px" }}>
              Urunu silmek istiyor musunuz?
            </p>
            <p style={{ fontSize: "12px", color: "#888", textAlign: "center", lineHeight: 1.7, marginBottom: "8px" }}>
              Bu islem geri alinamaz.
            </p>
            <p style={{ fontSize: "11px", color: "#bbb", textAlign: "center", lineHeight: 1.7, marginBottom: "24px" }}>
              Tum varyantlar, gorseller ve stok bilgileri silinecek.
            </p>

            {error && (
              <p style={{ fontSize: "12px", color: "#E24B4A", padding: "8px 12px", border: "1px solid #E24B4A", marginBottom: "12px" }}>
                {error}
              </p>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <button
                onClick={() => deleteProduct(deleteId)}
                disabled={deleting}
                style={{ background: "#c0392b", color: "#fff", border: "none", padding: "13px", fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", cursor: deleting ? "not-allowed" : "pointer", fontFamily: "var(--font-dm-sans)", opacity: deleting ? 0.6 : 1 }}
              >
                {deleting ? "Siliniyor..." : "Evet, Sil"}
              </button>
              <button
                onClick={() => { setDeleteId(null); setError("") }}
                disabled={deleting}
                style={{ background: "transparent", color: "#888", border: "0.5px solid #e0e0e0", padding: "13px", fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer", fontFamily: "var(--font-dm-sans)" }}
              >
                Vazgec
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
