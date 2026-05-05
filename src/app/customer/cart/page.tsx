"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Minus, Plus, X, Tag, ShoppingBag, Truck } from "lucide-react"

const KDV_RATE = 0.20
const CARGO_PRICE = 129
const FREE_CARGO_THRESHOLD = 500

type CartItem = {
  id: number
  quantity: number
  variant: {
    id: number
    price: number
    sku: string
    product: { id: number; name: string }
    variant_attributes: {
      attribute_values: { value: string; attributes: { name: string } }
    }[]
    product_images: { image_url: string; is_primary: boolean; variant_id: number | null }[]
  }
}

type Coupon = {
  id: number
  code: string
  discount_type: string
  discount_value: number
  min_order_amount: number | null
}

export default function CartPage() {
  const router = useRouter()
  const supabase = createClient()

  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<number | null>(null)
  const [couponInput, setCouponInput] = useState("")
  const [coupon, setCoupon] = useState<Coupon | null>(null)
  const [couponError, setCouponError] = useState("")
  const [couponLoading, setCouponLoading] = useState(false)

  const fetchCart = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/customer/login"); return }

    const { data: cart } = await supabase
      .from("carts").select("id").eq("user_id", user.id).single()

    if (!cart) { setLoading(false); return }

    const { data } = await supabase
      .from("cart_items")
      .select(`
        id, quantity,
        variant:product_variants (
          id, price, sku,
          product:products ( id, name ),
          variant_attributes (
            attribute_values ( value, attributes ( name ) )
          ),
          product_images ( image_url, is_primary, variant_id )
        )
      `)
      .eq("cart_id", cart.id)

    setItems((data as any) || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchCart() }, [fetchCart])

  const getImage = (item: CartItem) => {
    const imgs = item.variant?.product_images || []
    return (
      imgs.find(i => i.variant_id === item.variant.id && i.is_primary)?.image_url ||
      imgs.find(i => i.variant_id === item.variant.id)?.image_url ||
      imgs.find(i => i.is_primary && i.variant_id === null)?.image_url ||
      imgs[0]?.image_url || null
    )
  }

  const getLabel = (item: CartItem) =>
    item.variant?.variant_attributes?.map(va => va.attribute_values.value).join(" · ") || ""

  const updateQuantity = async (itemId: number, qty: number) => {
    if (qty < 1) return
    setUpdating(itemId)
    await supabase.from("cart_items").update({ quantity: qty }).eq("id", itemId)
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, quantity: qty } : i))
    setUpdating(null)
  }

  const removeItem = async (itemId: number) => {
    await supabase.from("cart_items").delete().eq("id", itemId)
    setItems(prev => prev.filter(i => i.id !== itemId))
  }

  const applyCoupon = async () => {
    if (!couponInput.trim()) return
    setCouponError("")
    setCouponLoading(true)
    const { data } = await supabase
      .from("coupons").select("*")
      .eq("code", couponInput.trim().toUpperCase()).single()

    if (!data) {
      setCouponError("Gecersiz kupon kodu.")
      setCoupon(null)
    } else if (data.min_order_amount && subtotalWithKdv < data.min_order_amount) {
      setCouponError(`Minimum siparis tutari: ${data.min_order_amount.toLocaleString("tr-TR")} TL`)
      setCoupon(null)
    } else {
      setCoupon(data)
      setCouponError("")
    }
    setCouponLoading(false)
  }

  const fmt = (p: number) => p.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " TL"

  const subtotalWithKdv = items.reduce((s, i) => s + (i.variant?.price || 0) * i.quantity, 0)
  const kdvTotal = subtotalWithKdv - subtotalWithKdv / (1 + KDV_RATE)
  const subtotalExKdv = subtotalWithKdv - kdvTotal
  const couponDiscount = coupon
    ? coupon.discount_type === "percentage"
      ? subtotalWithKdv * (coupon.discount_value / 100)
      : Math.min(coupon.discount_value, subtotalWithKdv)
    : 0
  const isFreeShipping = subtotalWithKdv >= FREE_CARGO_THRESHOLD
  const shippingCost = isFreeShipping ? 0 : CARGO_PRICE
  const grandTotal = subtotalWithKdv - couponDiscount + shippingCost

  if (loading) return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>Yukleniyor...</p>
    </main>
  )

  if (items.length === 0) return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", gap: "1.5rem", padding: "2rem" }}>
      <ShoppingBag size={48} color="var(--muted-light)" strokeWidth={1} />
      <div style={{ textAlign: "center" }}>
        <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.8rem", fontWeight: 300, marginBottom: "8px" }}>Sepetiniz bos</p>
        <p style={{ fontSize: "13px", color: "var(--muted)" }}>Begendiklerinizi sepete ekleyin.</p>
      </div>
      <Link href="/customer/products" style={{ background: "#0A0A0A", color: "#fff", padding: "12px 28px", fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", textDecoration: "none", fontFamily: "var(--font-dm-sans)" }}>
        Alısverise Basla
      </Link>
    </main>
  )

  const SummaryBox = () => (
    <div>
      {/* KARGO */}
      <div style={{ background: isFreeShipping ? "#EAF3DE" : "var(--surface)", padding: "12px 16px", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "10px" }}>
        <Truck size={15} color={isFreeShipping ? "#3B6D11" : "var(--muted)"} />
        <span style={{ fontSize: "12px", color: isFreeShipping ? "#3B6D11" : "var(--muted)" }}>
          {isFreeShipping
            ? "Tebrikler! Ucretsiz kargo kazandınız."
            : `${fmt(FREE_CARGO_THRESHOLD - subtotalWithKdv)} daha ekle, kargo bedava!`}
        </span>
      </div>

      {/* KUPON */}
      <div style={{ border: "0.5px solid var(--border)", padding: "1.2rem", marginBottom: "1rem" }}>
        <div style={{ fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--muted)", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
          <Tag size={12} /> Kupon Kodu
        </div>

        {coupon ? (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#EAF3DE", padding: "8px 12px" }}>
            <div>
              <div style={{ fontSize: "12px", fontWeight: 500, color: "#3B6D11" }}>{coupon.code}</div>
              <div style={{ fontSize: "11px", color: "#3B6D11" }}>
                {coupon.discount_type === "percentage" ? `%${coupon.discount_value} indirim` : `${coupon.discount_value} TL indirim`} uygulandı
              </div>
            </div>
            <button onClick={() => { setCoupon(null); setCouponInput(""); setCouponError("") }} style={{ background: "none", border: "none", cursor: "pointer", color: "#3B6D11" }}>
              <X size={14} />
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              value={couponInput}
              onChange={e => setCouponInput(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === "Enter" && applyCoupon()}
              placeholder="KUPON KODU"
              style={{ flex: 1, border: "none", borderBottom: couponError ? "1px solid var(--error)" : "1px solid var(--border)", padding: "8px 0", fontSize: "13px", letterSpacing: "0.08em", outline: "none", fontFamily: "var(--font-dm-sans)", background: "transparent", color: "#0A0A0A" }}
            />
            <button
              onClick={applyCoupon}
              disabled={couponLoading || !couponInput.trim()}
              style={{ background: "#0A0A0A", color: "#fff", border: "none", padding: "8px 14px", fontSize: "10px", letterSpacing: "0.12em", cursor: "pointer", fontFamily: "var(--font-dm-sans)", opacity: !couponInput.trim() ? 0.5 : 1 }}
            >
              {couponLoading ? "..." : "Uygula"}
            </button>
          </div>
        )}
        {couponError && <p style={{ fontSize: "11px", color: "var(--error)", marginTop: "6px" }}>{couponError}</p>}
      </div>

      {/* FİYAT ÖZET */}
      <div style={{ border: "0.5px solid var(--border)", padding: "1.2rem" }}>
        <div style={{ fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--muted)", marginBottom: "1rem" }}>
          Siparis Ozeti
        </div>
        <div style={{ display: "flex", flexDirection: "column" as const, gap: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: "13px", color: "var(--muted)" }}>Ara Toplam (KDV Haric)</span>
            <span style={{ fontSize: "13px" }}>{fmt(subtotalExKdv)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: "13px", color: "var(--muted)" }}>KDV (%{KDV_RATE * 100})</span>
            <span style={{ fontSize: "13px" }}>{fmt(kdvTotal)}</span>
          </div>
          {coupon && couponDiscount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "13px", color: "#3B6D11" }}>Kupon ({coupon.code})</span>
              <span style={{ fontSize: "13px", color: "#3B6D11" }}>−{fmt(couponDiscount)}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", color: "var(--muted)" }}>Kargo</span>
            {isFreeShipping ? (
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "12px", color: "var(--muted)", textDecoration: "line-through" }}>{fmt(CARGO_PRICE)}</span>
                <span style={{ fontSize: "12px", color: "#3B6D11", fontWeight: 500 }}>Ucretsiz</span>
              </div>
            ) : (
              <span style={{ fontSize: "13px" }}>{fmt(CARGO_PRICE)}</span>
            )}
          </div>
          <div style={{ height: "0.5px", background: "var(--border)" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "14px", fontWeight: 500 }}>Toplam</span>
            <span style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.5rem", fontWeight: 300 }}>{fmt(grandTotal)}</span>
          </div>
          <p style={{ fontSize: "10px", color: "var(--muted-light)" }}>KDV dahil toplam tutardir.</p>
        </div>
        <Link href="/customer/checkout/address" style={{ display: "block", background: "#0A0A0A", color: "#fff", padding: "14px", fontSize: "11px", letterSpacing: "0.18em", textTransform: "uppercase", fontFamily: "var(--font-dm-sans)", textDecoration: "none", textAlign: "center", marginTop: "1.2rem" }}>
          Odemeye Gec
        </Link>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", marginTop: "10px" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--muted-light)" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          <span style={{ fontSize: "10px", color: "var(--muted-light)" }}>iyzico ile guvenli odeme</span>
        </div>
      </div>
    </div>
  )

  return (
    <main style={{ minHeight: "100vh", background: "var(--background)" }}>
      <style>{`
        .cart-layout { display: grid; grid-template-columns: 1fr 380px; gap: 3rem; }
        @media (max-width: 900px) {
          .cart-layout { grid-template-columns: 1fr; gap: 2rem; }
        }
        .cart-item-grid { display: grid; grid-template-columns: 90px 1fr; gap: 1.2rem; }
        @media (max-width: 480px) {
          .cart-item-grid { grid-template-columns: 72px 1fr; gap: 0.8rem; }
        }
      `}</style>

      <div style={{ padding: "2rem 2rem", borderBottom: "0.5px solid var(--border)", maxWidth: "1200px", margin: "0 auto" }}>
        <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "2rem", fontWeight: 300 }}>
          Sepetim <span style={{ fontSize: "1.2rem", color: "var(--muted)" }}>({items.length} urun)</span>
        </h1>
      </div>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 2rem" }}>
        <div className="cart-layout">

          {/* ÜRÜNLER */}
          <div>
            {items.map(item => {
              const imgUrl = getImage(item)
              const label = getLabel(item)
              const lineTotal = (item.variant?.price || 0) * item.quantity

              return (
                <div key={item.id} className="cart-item-grid" style={{ paddingBottom: "1.5rem", marginBottom: "1.5rem", borderBottom: "0.5px solid var(--border)" }}>

                  {/* GÖRSEL */}
                  <Link href={`/customer/products/${item.variant?.product?.id}`}>
                    <div style={{ width: "100%", aspectRatio: "1", background: "var(--surface)", borderRadius: "4px", overflow: "hidden" }}>
                      {imgUrl ? (
                        <img src={imgUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <svg width="28" height="28" viewBox="0 0 100 100" fill="none" opacity="0.2">
                            <rect x="20" y="35" width="60" height="50" rx="6" fill="#B8A99A"/>
                            <path d="M35 35 Q35 20 50 20 Q65 20 65 35" fill="none" stroke="#8B6F5E" strokeWidth="4" strokeLinecap="round"/>
                          </svg>
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* BİLGİ */}
                  <div style={{ display: "flex", flexDirection: "column" as const, gap: "6px", minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                      <div style={{ minWidth: 0 }}>
                        <Link href={`/customer/products/${item.variant?.product?.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                          <div style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1rem", fontWeight: 400, lineHeight: 1.3, marginBottom: "3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {item.variant?.product?.name}
                          </div>
                        </Link>
                        {label && <div style={{ fontSize: "11px", color: "var(--muted)" }}>{label}</div>}
                      </div>
                      <button onClick={() => removeItem(item.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-light)", padding: "2px", flexShrink: 0 }}>
                        <X size={15} />
                      </button>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", flexWrap: "wrap" as const, gap: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", border: "0.5px solid var(--border)" }}>
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1 || updating === item.id} style={{ width: "30px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: item.quantity <= 1 ? "not-allowed" : "pointer", color: item.quantity <= 1 ? "var(--muted-light)" : "var(--foreground)" }}>
                          <Minus size={11} />
                        </button>
                        <span style={{ width: "32px", textAlign: "center", fontSize: "13px", fontWeight: 500 }}>
                          {updating === item.id ? "·" : item.quantity}
                        </span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} disabled={updating === item.id} style={{ width: "30px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: "var(--foreground)" }}>
                          <Plus size={11} />
                        </button>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "14px", fontWeight: 500 }}>{fmt(lineTotal)}</div>
                        {item.quantity > 1 && (
                          <div style={{ fontSize: "10px", color: "var(--muted)" }}>{fmt(item.variant?.price || 0)} / adet</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            <Link href="/customer/products" style={{ fontSize: "11px", color: "var(--muted)", letterSpacing: "0.12em", textTransform: "uppercase", textDecoration: "none", borderBottom: "0.5px solid var(--border)", paddingBottom: "2px" }}>
              ← Alısverise Devam Et
            </Link>
          </div>

          {/* ÖZET */}
          <SummaryBox />
        </div>
      </div>
    </main>
  )
}
