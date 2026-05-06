"use client"

import type React from "react"
import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { ChevronRight, Plus, Check, MapPin, CreditCard, Truck, ArrowLeft } from "lucide-react"

const KDV_RATE = 0.20
const CARGO_PRICE = 129
const FREE_CARGO_THRESHOLD = 500

type Address = {
  id: number
  title: string
  full_name: string
  phone: string
  city: string
  district: string
  address_line: string
  zip_code: string
  is_default: boolean
}

type CartItem = {
  id: number
  quantity: number
  variant: {
    id: number
    price: number
    sku: string
    product: { id: number; name: string }
    variant_attributes: { attribute_values: { value: string } }[]
    product_images: { image_url: string; is_primary: boolean; variant_id: number | null }[]
  }
}

type Step = "address" | "payment"

export default function CheckoutPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState<Step>("address")
  const [items, setItems] = useState<CartItem[]>([])
  const [cartId, setCartId] = useState<number | null>(null)
  const [addresses, setAddresses] = useState<Address[]>([])
  const [cities, setCities] = useState<{ id: number; name: string }[]>([])
  const [districts, setDistricts] = useState<{ id: number; name: string; city_id: number }[]>([])
  const [filteredDistricts, setFilteredDistricts] = useState<{ id: number; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState("")

  const [shippingId, setShippingId] = useState<number | null>(null)
  const [billingId, setBillingId] = useState<number | null>(null)
  const [sameAddress, setSameAddress] = useState(true)
  const [showNewAddress, setShowNewAddress] = useState(false)
  const [savingAddr, setSavingAddr] = useState(false)

  const [newAddr, setNewAddr] = useState({
    title: "", full_name: "", phone: "",
    city: "", district: "", address_line: "", zip_code: ""
  })

  const [card, setCard] = useState({
    name: "", number: "", expiry: "", cvv: ""
  })

  // Sepet içeriğini her zaman DB'den çek
  const fetchCartItems = useCallback(async (cId: number) => {
    const { data } = await supabase
      .from("cart_items")
      .select(`
        id, quantity,
        variant:product_variants (
          id, price, sku,
          product:products ( id, name ),
          variant_attributes ( attribute_values ( value ) ),
          product_images ( image_url, is_primary, variant_id )
        )
      `)
      .eq("cart_id", cId)

    const freshItems = (data as any) || []
    if (freshItems.length === 0) {
      router.push("/customer/cart")
      return
    }
    setItems(freshItems)
  }, [])

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/customer/login"); return }

    // Sepeti çek
    const { data: cart } = await supabase
      .from("carts").select("id").eq("user_id", user.id).single()

    if (!cart) { router.push("/customer/cart"); return }
    setCartId(cart.id)

    // Sepet içeriğini çek
    const { data: cartItems } = await supabase
      .from("cart_items")
      .select(`
        id, quantity,
        variant:product_variants (
          id, price, sku,
          product:products ( id, name ),
          variant_attributes ( attribute_values ( value ) ),
          product_images ( image_url, is_primary, variant_id )
        )
      `)
      .eq("cart_id", cart.id)

    const freshItems = (cartItems as any) || []
    if (freshItems.length === 0) { router.push("/customer/cart"); return }
    setItems(freshItems)

    // Adresleri çek
    const { data: addrs } = await supabase
      .from("addresses").select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })

    setAddresses(addrs || [])
    const defaultAddr = addrs?.find(a => a.is_default) || addrs?.[0]
    if (defaultAddr) {
      setShippingId(defaultAddr.id)
      setBillingId(defaultAddr.id)
    }

    // Şehir / ilçe
    const [{ data: cityData }, { data: distData }] = await Promise.all([
      supabase.from("cities").select("id, name").order("name"),
      supabase.from("districts").select("id, name, city_id").order("name"),
    ])
    setCities(cityData || [])
    setDistricts(distData || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // Sepet değişikliklerini gerçek zamanlı dinle
  useEffect(() => {
    if (!cartId) return

    const channel = supabase
      .channel("checkout-cart-" + cartId)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "cart_items",
        filter: "cart_id=eq." + cartId
      }, () => {
        fetchCartItems(cartId)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [cartId, fetchCartItems])

  useEffect(() => {
    if (!newAddr.city) return
    const city = cities.find(c => c.name === newAddr.city)
    if (city) {
      setFilteredDistricts(districts.filter(d => d.city_id === city.id))
      setNewAddr(p => ({ ...p, district: "" }))
    }
  }, [newAddr.city, cities, districts])

  const saveAddress = async () => {
    if (!newAddr.title || !newAddr.full_name || !newAddr.phone || !newAddr.city || !newAddr.district || !newAddr.address_line) {
      setError("Lutfen tum alanları doldurun.")
      return
    }
    setSavingAddr(true)
    setError("")

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error: addrErr } = await supabase
      .from("addresses")
      .insert({ ...newAddr, user_id: user.id, is_default: addresses.length === 0 })
      .select().single()

    if (addrErr || !data) {
      setError("Adres kaydedilemedi.")
      setSavingAddr(false)
      return
    }

    setAddresses(prev => [...prev, data])
    setShippingId(data.id)
    if (sameAddress) setBillingId(data.id)
    setShowNewAddress(false)
    setNewAddr({ title: "", full_name: "", phone: "", city: "", district: "", address_line: "", zip_code: "" })
    setSavingAddr(false)
  }

  const getItemImage = (item: CartItem) => {
    const imgs = item.variant?.product_images || []
    return (
      imgs.find(i => i.variant_id === item.variant?.id && i.is_primary)?.image_url ||
      imgs.find(i => i.variant_id === item.variant?.id)?.image_url ||
      imgs.find(i => i.is_primary && i.variant_id === null)?.image_url ||
      imgs[0]?.image_url || null
    )
  }

  const handlePlaceOrder = async () => {
    if (!shippingId) { setError("Lutfen teslimat adresi secin."); return }
    if (!sameAddress && !billingId) { setError("Lutfen fatura adresi secin."); return }
    if (!card.name.trim() || !card.number.trim() || !card.expiry.trim() || !card.cvv.trim()) {
      setError("Lutfen tum kart bilgilerini doldurun.")
      return
    }

    setPlacing(true)
    setError("")

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // En güncel sepet içeriğini DB'den çek
    const { data: freshCart } = await supabase
      .from("carts").select("id").eq("user_id", user.id).single()

    if (!freshCart) { setError("Sepet bulunamadi."); setPlacing(false); return }

    const { data: freshItems } = await supabase
      .from("cart_items")
      .select("id, quantity, variant:product_variants(id, price, stock)")
      .eq("cart_id", freshCart.id)

    if (!freshItems || freshItems.length === 0) {
      router.push("/customer/cart")
      return
    }

    // Toplam fiyatı güncel sepetten hesapla
    const freshSubtotal = (freshItems as any[]).reduce((s, i) => s + (i.variant?.price || 0) * i.quantity, 0)
    const freshTotal = freshSubtotal + (freshSubtotal >= FREE_CARGO_THRESHOLD ? 0 : CARGO_PRICE)

    // Sipariş oluştur
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        shipping_address_id: shippingId,
        billing_address_id: sameAddress ? shippingId : billingId,
        total_price: freshTotal,
        status: "hazirlaniyor",
      })
      .select("id, order_number")
      .single()

    if (orderErr || !order) {
      setError("Siparis olusturulamadi: " + (orderErr?.message || "Hata"))
      setPlacing(false)
      return
    }

    // Sipariş kalemleri
    const orderItems = (freshItems as any[]).map(item => ({
      order_id: order.id,
      variant_id: item.variant.id,
      quantity: item.quantity,
      price: item.variant.price,
    }))
    await supabase.from("order_items").insert(orderItems)

    // Stok düş
    for (const item of freshItems as any[]) {
      await supabase
        .from("product_variants")
        .update({ stock: Math.max(0, (item.variant?.stock || 0) - item.quantity) })
        .eq("id", item.variant.id)
    }

    // Sepeti tamamen temizle — önce cart_items, state de temizle
    await supabase.from("cart_items").delete().eq("cart_id", freshCart.id)
    setItems([])

    // Yönlendir
    router.push("/customer/checkout/success?order=" + (order.order_number || order.id))
  }

  // Fiyatlar — her zaman güncel items'tan hesapla
  const subtotalWithKdv = items.reduce((s, i) => s + (i.variant?.price || 0) * i.quantity, 0)
  const kdvTotal = subtotalWithKdv - subtotalWithKdv / (1 + KDV_RATE)
  const subtotalExKdv = subtotalWithKdv - kdvTotal
  const isFreeShipping = subtotalWithKdv >= FREE_CARGO_THRESHOLD
  const shippingCost = isFreeShipping ? 0 : CARGO_PRICE
  const grandTotal = subtotalWithKdv + shippingCost

  const fmt = (p: number) => p.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " TL"

  const formatCardNumber = (v: string) =>
    v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim()

  const formatExpiry = (v: string) => {
    const clean = v.replace(/\D/g, "").slice(0, 4)
    return clean.length >= 2 ? clean.slice(0, 2) + " / " + clean.slice(2) : clean
  }

  const selectedShipping = addresses.find(a => a.id === shippingId)

  const inp: React.CSSProperties = {
    width: "100%", border: "none", borderBottom: "1px solid #e0e0e0",
    padding: "10px 0", fontSize: "0.9rem", outline: "none",
    fontFamily: "var(--font-dm-sans)", background: "transparent", color: "#0A0A0A",
  }

  const lbl: React.CSSProperties = {
    display: "block", fontSize: "10px", letterSpacing: "0.12em",
    textTransform: "uppercase", color: "#888", marginBottom: "4px",
  }

  if (loading) return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>Yukleniyor...</p>
    </main>
  )

  return (
    <main style={{ minHeight: "100vh", background: "#F8F8F8" }}>
      <style>{`
        .co-grid { display: grid; grid-template-columns: 1fr 340px; gap: 2rem; }
        .addr-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        @media (max-width: 900px) { .co-grid { grid-template-columns: 1fr; } }
        @media (max-width: 600px) { .addr-grid { grid-template-columns: 1fr; } }
        .card-box { background: #fff; border: 0.5px solid #efefef; padding: 1.5rem; margin-bottom: 1rem; }
        .step-btn { padding: 0.9rem 1.4rem; display: flex; align-items: center; gap: 8px; background: none; border: none; cursor: pointer; font-family: var(--font-dm-sans); font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; }
      `}</style>

      {/* HEADER */}
      <div style={{ background: "#0A0A0A", padding: "1.2rem 2rem" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", alignItems: "center", gap: "12px" }}>
          <Link href="/cart" style={{ color: "#555", display: "flex" }}><ArrowLeft size={18} /></Link>
          <Link href="/" style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.4rem", fontWeight: 300, color: "#fff", textDecoration: "none" }}>LUIR</Link>
          <span style={{ color: "#333" }}>/</span>
          <span style={{ fontSize: "12px", color: "#666" }}>Guvenli Odeme</span>
        </div>
      </div>

      {/* ADIMLAR */}
      <div style={{ background: "#fff", borderBottom: "0.5px solid #efefef" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 2rem", display: "flex", alignItems: "center" }}>
          <button className="step-btn" onClick={() => setStep("address")} style={{ borderBottom: step === "address" ? "2px solid #0A0A0A" : "2px solid transparent", color: step === "address" ? "#0A0A0A" : "#888" }}>
            <MapPin size={13} /> Adres
          </button>
          <ChevronRight size={13} color="#ccc" />
          <button className="step-btn" onClick={() => shippingId && setStep("payment")} style={{ borderBottom: step === "payment" ? "2px solid #0A0A0A" : "2px solid transparent", color: step === "payment" ? "#0A0A0A" : "#888", opacity: shippingId ? 1 : 0.5, cursor: shippingId ? "pointer" : "not-allowed" }}>
            <CreditCard size={13} /> Odeme
          </button>
        </div>
      </div>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "2rem" }}>
        <div className="co-grid">

          {/* SOL */}
          <div>

            {/* ADIM 1: ADRES */}
            {step === "address" && (
              <div>
                <div className="card-box">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }}>
                    <h2 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.3rem", fontWeight: 300 }}>Teslimat Adresi</h2>
                    <button onClick={() => setShowNewAddress(!showNewAddress)} style={{ fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", background: "none", border: "0.5px solid #e0e0e0", padding: "6px 12px", cursor: "pointer", fontFamily: "var(--font-dm-sans)", color: "#888", display: "flex", alignItems: "center", gap: "5px" }}>
                      <Plus size={11} /> Yeni Adres
                    </button>
                  </div>

                  {addresses.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column" as const, gap: "8px", marginBottom: showNewAddress ? "1.2rem" : "0" }}>
                      {addresses.map(addr => (
                        <label key={addr.id} style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "1rem", border: shippingId === addr.id ? "1.5px solid #0A0A0A" : "0.5px solid #e0e0e0", cursor: "pointer", transition: "border-color 0.15s" }}>
                          <input type="radio" name="shipping" checked={shippingId === addr.id} onChange={() => { setShippingId(addr.id); if (sameAddress) setBillingId(addr.id) }} style={{ accentColor: "#0A0A0A", marginTop: "2px", flexShrink: 0 }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: "12px", fontWeight: 500, marginBottom: "3px", display: "flex", alignItems: "center", gap: "8px" }}>
                              {addr.title}
                              {addr.is_default && <span style={{ fontSize: "8px", letterSpacing: "0.1em", textTransform: "uppercase", background: "#0A0A0A", color: "#fff", padding: "2px 6px" }}>Varsayilan</span>}
                            </div>
                            <div style={{ fontSize: "12px", color: "#888", lineHeight: 1.7 }}>{addr.full_name} · {addr.phone}</div>
                            <div style={{ fontSize: "12px", color: "#888", lineHeight: 1.7 }}>{addr.address_line}, {addr.district} / {addr.city}{addr.zip_code && " " + addr.zip_code}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}

                  {(showNewAddress || addresses.length === 0) && (
                    <div style={{ border: "0.5px solid #e0e0e0", padding: "1.2rem", marginTop: addresses.length > 0 ? "1rem" : "0" }}>
                      <div style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#0A0A0A", marginBottom: "1rem", fontWeight: 500 }}>Yeni Adres Ekle</div>
                      <div style={{ display: "flex", flexDirection: "column" as const, gap: "1rem" }}>
                        <div className="addr-grid">
                          <div><label style={lbl}>Adres Basligi *</label><input style={inp} placeholder="Ev, Is..." value={newAddr.title} onChange={e => setNewAddr(p => ({ ...p, title: e.target.value }))} /></div>
                          <div><label style={lbl}>Ad Soyad *</label><input style={inp} value={newAddr.full_name} onChange={e => setNewAddr(p => ({ ...p, full_name: e.target.value }))} /></div>
                        </div>
                        <div><label style={lbl}>Telefon *</label><input style={inp} placeholder="05XX XXX XXXX" value={newAddr.phone} onChange={e => setNewAddr(p => ({ ...p, phone: e.target.value }))} /></div>
                        <div className="addr-grid">
                          <div>
                            <label style={lbl}>Il *</label>
                            <select style={{ ...inp, appearance: "none" as const, cursor: "pointer" }} value={newAddr.city} onChange={e => setNewAddr(p => ({ ...p, city: e.target.value }))}>
                              <option value="">Secin</option>
                              {cities.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                            </select>
                          </div>
                          <div>
                            <label style={lbl}>Ilce *</label>
                            <select style={{ ...inp, appearance: "none" as const, cursor: "pointer" }} value={newAddr.district} onChange={e => setNewAddr(p => ({ ...p, district: e.target.value }))}>
                              <option value="">Secin</option>
                              {filteredDistricts.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                            </select>
                          </div>
                        </div>
                        <div><label style={lbl}>Acik Adres *</label><textarea rows={2} style={{ ...inp, resize: "none" as const, lineHeight: "1.6" }} placeholder="Mahalle, sokak, bina no, daire..." value={newAddr.address_line} onChange={e => setNewAddr(p => ({ ...p, address_line: e.target.value }))} /></div>
                        <div><label style={lbl}>Posta Kodu</label><input style={inp} placeholder="34000" value={newAddr.zip_code} onChange={e => setNewAddr(p => ({ ...p, zip_code: e.target.value }))} /></div>
                        <button onClick={saveAddress} disabled={savingAddr} style={{ background: "#0A0A0A", color: "#fff", border: "none", padding: "11px", fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", cursor: savingAddr ? "not-allowed" : "pointer", fontFamily: "var(--font-dm-sans)", opacity: savingAddr ? 0.6 : 1 }}>
                          {savingAddr ? "Kaydediliyor..." : "Adresi Kaydet"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* FATURA */}
                <div className="card-box">
                  <h2 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.3rem", fontWeight: 300, marginBottom: "1.2rem" }}>Fatura Adresi</h2>

                  <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", padding: "1rem", border: sameAddress ? "1.5px solid #0A0A0A" : "0.5px solid #e0e0e0", marginBottom: sameAddress ? "0" : "1rem", transition: "border-color 0.15s" }}>
                    <input type="checkbox" checked={sameAddress} onChange={e => { setSameAddress(e.target.checked); if (e.target.checked) setBillingId(shippingId) }} style={{ accentColor: "#0A0A0A", width: "16px", height: "16px", cursor: "pointer" }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "13px", fontWeight: 500 }}>Teslimat adresi ile ayni</div>
                      {sameAddress && selectedShipping && (
                        <div style={{ fontSize: "11px", color: "#888", marginTop: "3px" }}>
                          {selectedShipping.title} — {selectedShipping.address_line}, {selectedShipping.district} / {selectedShipping.city}
                        </div>
                      )}
                    </div>
                    {sameAddress && <Check size={16} />}
                  </label>

                  {!sameAddress && (
                    <div style={{ display: "flex", flexDirection: "column" as const, gap: "8px" }}>
                      {addresses.map(addr => (
                        <label key={addr.id} style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "1rem", border: billingId === addr.id ? "1.5px solid #0A0A0A" : "0.5px solid #e0e0e0", cursor: "pointer" }}>
                          <input type="radio" name="billing" checked={billingId === addr.id} onChange={() => setBillingId(addr.id)} style={{ accentColor: "#0A0A0A", marginTop: "2px" }} />
                          <div>
                            <div style={{ fontSize: "12px", fontWeight: 500, marginBottom: "3px" }}>{addr.title}</div>
                            <div style={{ fontSize: "12px", color: "#888", lineHeight: 1.6 }}>{addr.full_name} · {addr.address_line}, {addr.district} / {addr.city}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {error && <div style={{ background: "#FCEBEB", border: "1px solid #E24B4A", padding: "0.8rem 1rem", marginBottom: "1rem" }}><p style={{ fontSize: "12px", color: "#A32D2D" }}>{error}</p></div>}

                <button
                  onClick={() => { if (!shippingId) { setError("Lutfen teslimat adresi secin."); return } setError(""); setStep("payment") }}
                  style={{ width: "100%", background: "#0A0A0A", color: "#fff", border: "none", padding: "14px", fontSize: "11px", letterSpacing: "0.18em", textTransform: "uppercase", cursor: "pointer", fontFamily: "var(--font-dm-sans)", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                >
                  Odemeye Gec <ChevronRight size={14} />
                </button>
              </div>
            )}

            {/* ADIM 2: ÖDEME */}
            {step === "payment" && (
              <div>
                <div className="card-box">
                  <h2 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.3rem", fontWeight: 300, marginBottom: "1.2rem" }}>Kart Bilgileri</h2>
                  <div style={{ display: "flex", flexDirection: "column" as const, gap: "1.2rem" }}>
                    <div>
                      <label style={lbl}>Kart Uzerindeki Ad *</label>
                      <input style={inp} placeholder="AD SOYAD" value={card.name} onChange={e => setCard(p => ({ ...p, name: e.target.value.toUpperCase() }))} />
                    </div>
                    <div>
                      <label style={lbl}>Kart Numarasi *</label>
                      <input style={inp} placeholder="0000 0000 0000 0000" value={card.number} onChange={e => setCard(p => ({ ...p, number: formatCardNumber(e.target.value) }))} maxLength={19} inputMode="numeric" />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      <div>
                        <label style={lbl}>Son Kullanma *</label>
                        <input style={inp} placeholder="AA / YY" value={card.expiry} onChange={e => setCard(p => ({ ...p, expiry: formatExpiry(e.target.value) }))} maxLength={7} inputMode="numeric" />
                      </div>
                      <div>
                        <label style={lbl}>CVV *</label>
                        <input style={inp} placeholder="•••" value={card.cvv} onChange={e => setCard(p => ({ ...p, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) }))} type="password" inputMode="numeric" maxLength={4} />
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "1rem", padding: "10px 12px", background: "#F8F8F8" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    <span style={{ fontSize: "11px", color: "#888" }}>256-bit SSL sifreleme ile guvenli odeme</span>
                  </div>
                </div>

                {/* TESLİMAT ADRESİ ÖZETİ */}
                <div className="card-box">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem" }}>
                    <div style={{ fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--muted)", display: "flex", alignItems: "center", gap: "6px" }}>
                      <MapPin size={11} /> Teslimat Adresi
                    </div>
                    <button onClick={() => setStep("address")} style={{ fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", background: "none", border: "none", cursor: "pointer", color: "#888", fontFamily: "var(--font-dm-sans)" }}>
                      Degistir
                    </button>
                  </div>
                  {selectedShipping ? (
                    <div style={{ fontSize: "13px", color: "#0A0A0A", lineHeight: 1.8 }}>
                      <strong style={{ fontWeight: 500 }}>{selectedShipping.full_name}</strong><br />
                      <span style={{ color: "#888", fontSize: "12px" }}>{selectedShipping.phone}</span><br />
                      {selectedShipping.address_line}<br />
                      <span style={{ color: "#888" }}>{selectedShipping.district} / {selectedShipping.city}{selectedShipping.zip_code && " — " + selectedShipping.zip_code}</span>
                    </div>
                  ) : (
                    <p style={{ fontSize: "12px", color: "var(--error)" }}>Adres secilmedi — geri don ve adres sec</p>
                  )}
                </div>

                {error && <div style={{ background: "#FCEBEB", border: "1px solid #E24B4A", padding: "0.8rem 1rem", marginBottom: "1rem" }}><p style={{ fontSize: "12px", color: "#A32D2D" }}>{error}</p></div>}

                <button
                  onClick={handlePlaceOrder}
                  disabled={placing}
                  style={{ width: "100%", background: placing ? "#555" : "#0A0A0A", color: "#fff", border: "none", padding: "15px", fontSize: "11px", letterSpacing: "0.18em", textTransform: "uppercase", cursor: placing ? "not-allowed" : "pointer", fontFamily: "var(--font-dm-sans)" }}
                >
                  {placing ? "Siparis Veriliyor..." : "Siparisi Tamamla — " + fmt(grandTotal)}
                </button>
                <p style={{ fontSize: "10px", color: "#bbb", textAlign: "center", marginTop: "8px" }}>
                  Siparisi tamamlayarak kullanim kosullarini kabul etmis olursunuz.
                </p>
              </div>
            )}
          </div>

          {/* SAĞ: ÖZET */}
          <div>
            <div style={{ background: "#fff", border: "0.5px solid #efefef", padding: "1.5rem", position: "sticky", top: "100px" }}>
              <div style={{ fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--muted)", marginBottom: "1.2rem" }}>
                Siparis Ozeti ({items.length} urun)
              </div>

              <div style={{ display: "flex", flexDirection: "column" as const, gap: "10px", marginBottom: "1.2rem" }}>
                {items.map(item => {
                  const img = getItemImage(item)
                  const label = item.variant?.variant_attributes?.map(va => va.attribute_values.value).join(" · ") || ""
                  return (
                    <div key={item.id} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                      <div style={{ width: "48px", height: "48px", background: "#f8f8f8", borderRadius: "4px", overflow: "hidden", flexShrink: 0, position: "relative" }}>
                        {img
                          ? <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="18" height="18" viewBox="0 0 100 100" fill="none" opacity="0.2"><rect x="20" y="35" width="60" height="50" rx="6" fill="#B8A99A"/></svg></div>
                        }
                        <span style={{ position: "absolute", top: "-4px", right: "-4px", background: "#0A0A0A", color: "#fff", borderRadius: "50%", width: "16px", height: "16px", fontSize: "9px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {item.quantity}
                        </span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "12px", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.variant?.product?.name}</div>
                        {label && <div style={{ fontSize: "10px", color: "#888" }}>{label}</div>}
                      </div>
                      <div style={{ fontSize: "13px", fontWeight: 500, flexShrink: 0 }}>{fmt((item.variant?.price || 0) * item.quantity)}</div>
                    </div>
                  )
                })}
              </div>

              <div style={{ height: "0.5px", background: "#efefef", marginBottom: "1rem" }} />

              <div style={{ display: "flex", flexDirection: "column" as const, gap: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "12px", color: "#888" }}>Ara Toplam (KDV Haric)</span>
                  <span style={{ fontSize: "12px" }}>{fmt(subtotalExKdv)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "12px", color: "#888" }}>KDV (%20)</span>
                  <span style={{ fontSize: "12px" }}>{fmt(kdvTotal)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "12px", color: "#888" }}>Kargo</span>
                  {isFreeShipping ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                      <span style={{ fontSize: "11px", color: "#bbb", textDecoration: "line-through" }}>{fmt(CARGO_PRICE)}</span>
                      <span style={{ fontSize: "11px", color: "#3B6D11", fontWeight: 500 }}>Ucretsiz</span>
                    </div>
                  ) : (
                    <span style={{ fontSize: "12px" }}>{fmt(CARGO_PRICE)}</span>
                  )}
                </div>
                <div style={{ height: "0.5px", background: "#efefef" }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "14px", fontWeight: 500 }}>Toplam</span>
                  <span style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.5rem", fontWeight: 300 }}>{fmt(grandTotal)}</span>
                </div>
                <p style={{ fontSize: "10px", color: "#bbb" }}>KDV dahil toplam tutar</p>
              </div>

              <div style={{ marginTop: "1rem", background: isFreeShipping ? "#EAF3DE" : "#F8F8F8", padding: "10px 12px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Truck size={13} color={isFreeShipping ? "#3B6D11" : "#888"} />
                <span style={{ fontSize: "11px", color: isFreeShipping ? "#3B6D11" : "#888" }}>
                  {isFreeShipping ? "Ucretsiz kargo!" : fmt(FREE_CARGO_THRESHOLD - subtotalWithKdv) + " daha ekle, kargo bedava"}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  )
}