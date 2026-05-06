"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, Plus, Truck, ChevronRight } from "lucide-react"

const KDV_RATE = 0.2
const CARGO_PRICE = 129
const FREE_CARGO_THRESHOLD = 500

type CartItem = {
  id: number
  quantity: number
  variant: {
    id: number
    price: number
    stock: number
    product: {
      id: number
      name: string
    }
    variant_attributes: {
      attribute_values: {
        value: string
      }
    }[]
    product_images: {
      image_url: string
      is_primary: boolean
      variant_id: number | null
    }[]
  }
}

type SavedCard = {
  id: number
  cardholder_name: string
  last_four_digits: string
  card_type: string
  expire_month: string
  expire_year: string
  is_default: boolean
  iyzico_card_token: string
  iyzico_card_user_key: string
}

type Address = {
  id: number
  title: string
  full_name: string
  phone: string
  address_line: string
  neighborhood: string
  district: string
  city: string
  zip_code: string
}

export default function CheckoutPaymentPage() {
  const router = useRouter()
  const supabase = createClient()

  const [items, setItems] = useState<CartItem[]>([])
  const [cartId, setCartId] = useState<number | null>(null)
  const [savedCards, setSavedCards] = useState<SavedCard[]>([])
  const [shippingAddress, setShippingAddress] = useState<Address | null>(null)
  const [billingAddress, setBillingAddress] = useState<Address | null>(null)

  const [loading, setLoading] = useState(true)
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState("")

  const [selectedCardId, setSelectedCardId] = useState<number | null>(null)
  const [useNewCard, setUseNewCard] = useState(false)
  const [saveCard, setSaveCard] = useState(false)

  const [card, setCard] = useState({
    holder: "",
    number: "",
    expiry: "",
    cvv: "",
  })

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/customer/login")
        return
      }

      const shippingId = localStorage.getItem("checkout_shipping_id")
      const billingId = localStorage.getItem("checkout_billing_id")

      if (!shippingId) {
        router.push("/checkout/address")
        return
      }

      const [
        { data: shippingAddr },
        { data: billingAddr },
        { data: cards },
        { data: cart },
      ] = await Promise.all([
        supabase.from("addresses").select("*").eq("id", shippingId).single(),

        billingId
          ? supabase.from("addresses").select("*").eq("id", billingId).single()
          : { data: null },

        supabase
          .from("cards")
          .select("*")
          .eq("user_id", user.id)
          .order("is_default", { ascending: false }),

        supabase.from("carts").select("id").eq("user_id", user.id).single(),
      ])

      setShippingAddress(shippingAddr)
      setBillingAddress(billingAddr || shippingAddr)
      setSavedCards(cards || [])

      if (cart) {
        setCartId(cart.id)

        const { data: cartItems } = await supabase
          .from("cart_items")
          .select(`
            id,
            quantity,
            variant:product_variants (
              id,
              price,
              stock,
              product:products (
                id,
                name
              ),
              variant_attributes (
                attribute_values (
                  value
                )
              ),
              product_images (
                image_url,
                is_primary,
                variant_id
              )
            )
          `)
          .eq("cart_id", cart.id)

        const fresh = (cartItems as any) || []

        if (fresh.length === 0) {
          router.push("/cart")
          return
        }

        setItems(fresh)
      }

      const defaultCard =
        (cards || []).find((c) => c.is_default) || (cards || [])[0]

      if (defaultCard) {
        setSelectedCardId(defaultCard.id)
        setUseNewCard(false)
      } else {
        setUseNewCard(true)
      }

      setLoading(false)
    }

    init()
  }, [])

  const detectBrand = (number: string): string => {
    const n = number.replace(/\s/g, "")

    if (n.startsWith("4")) return "VISA"
    if (n.startsWith("5") || n.startsWith("2")) return "MASTER"
    if (n.startsWith("9792")) return "TROY"
    if (n.startsWith("34") || n.startsWith("37")) return "AMEX"

    return "OTHER"
  }

  const formatNumber = (v: string) =>
    v
      .replace(/\D/g, "")
      .slice(0, 16)
      .replace(/(.{4})/g, "$1 ")
      .trim()

  const formatExpiry = (v: string) => {
    const clean = v.replace(/\D/g, "").slice(0, 4)

    return clean.length >= 2
      ? clean.slice(0, 2) + "/" + clean.slice(2)
      : clean
  }

  const getItemImage = (item: CartItem) => {
    const imgs = item.variant?.product_images || []

    return (
      imgs.find(
        (i) => i.variant_id === item.variant?.id && i.is_primary
      )?.image_url ||
      imgs.find((i) => i.variant_id === item.variant?.id)?.image_url ||
      imgs.find((i) => i.is_primary && i.variant_id === null)?.image_url ||
      imgs[0]?.image_url ||
      null
    )
  }

  const handlePlaceOrder = async () => {
    if (!useNewCard && !selectedCardId) {
      setError("Lutfen bir kart secin.")
      return
    }

    if (useNewCard) {
      if (!card.holder.trim()) {
        setError("Kart sahibi gerekli.")
        return
      }

      if (card.number.replace(/\s/g, "").length !== 16) {
        setError("Gecerli kart numarasi girin.")
        return
      }

      if (!card.expiry) {
        setError("Son kullanma tarihi gerekli.")
        return
      }

      if (card.cvv.length < 3) {
        setError("Gecerli CVV girin.")
        return
      }
    }

    setPlacing(true)
    setError("")

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const shippingId = localStorage.getItem("checkout_shipping_id")
    const billingId = localStorage.getItem("checkout_billing_id")

    if (!cartId) {
      setError("Sepet bulunamadi.")
      setPlacing(false)
      return
    }

    const { data: freshItems } = await supabase
      .from("cart_items")
      .select(`
        id,
        quantity,
        variant:product_variants (
          id,
          price,
          stock
        )
      `)
      .eq("cart_id", cartId)

    if (!freshItems || freshItems.length === 0) {
      router.push("/customer/cart")
      return
    }

    const subtotal = (freshItems as any[]).reduce(
      (s, i) => s + (i.variant?.price || 0) * i.quantity,
      0
    )

    const total =
      subtotal +
      (subtotal >= FREE_CARGO_THRESHOLD ? 0 : CARGO_PRICE)

    if (useNewCard && saveCard) {
      const expiryParts = card.expiry.split("/")

      const res = await fetch("/customer/api/iyzico/save-card", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cardHolderName: card.holder,
          cardNumber: card.number.replace(/\s/g, ""),
          expireMonth: expiryParts[0],
          expireYear: "20" + expiryParts[1],
          cvc: card.cvv,
          userId: user.id,
        }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        setError(data.error || "Kart kaydedilemedi.")
        setPlacing(false)
        return
      }

      await supabase.from("cards").insert({
        user_id: user.id,
        iyzico_card_token: data.cardToken,
        iyzico_card_user_key: data.cardUserKey,
        cardholder_name: card.holder,
        last_four_digits: card.number
          .replace(/\s/g, "")
          .slice(-4),
        card_type: detectBrand(card.number),
        expire_month: expiryParts[0],
        expire_year: "20" + expiryParts[1],
        is_default: savedCards.length === 0,
      })
    }

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        shipping_address_id: shippingId
          ? parseInt(shippingId)
          : null,
        billing_address_id: billingId
          ? parseInt(billingId)
          : null,
        total_price: total,
        status: "hazirlaniyor",
      })
      .select("id, order_number")
      .single()

    if (orderErr || !order) {
      setError("Siparis olusturulamadi.")
      setPlacing(false)
      return
    }

    await supabase.from("order_items").insert(
      (freshItems as any[]).map((item) => ({
        order_id: order.id,
        variant_id: item.variant.id,
        quantity: item.quantity,
        price: item.variant.price,
      }))
    )

    for (const item of freshItems as any[]) {
      await supabase
        .from("product_variants")
        .update({
          stock: Math.max(
            0,
            (item.variant?.stock || 0) - item.quantity
          ),
        })
        .eq("id", item.variant.id)
    }

    await supabase
      .from("cart_items")
      .delete()
      .eq("cart_id", cartId)

    localStorage.removeItem("checkout_shipping_id")
    localStorage.removeItem("checkout_billing_id")
    localStorage.removeItem("checkout_same_address")

    router.push(
      "/customer/checkout/success?order=" + (order.order_number || order.id)
    )
  }

  const subtotal = items.reduce(
    (s, i) => s + (i.variant?.price || 0) * i.quantity,
    0
  )

  const kdv = subtotal - subtotal / (1 + KDV_RATE)
  const subtotalExKdv = subtotal - kdv
  const isFree = subtotal >= FREE_CARGO_THRESHOLD

  const total =
    subtotal + (isFree ? 0 : CARGO_PRICE)

  const fmt = (p: number) =>
    p.toLocaleString("tr-TR", {
      minimumFractionDigits: 2,
    }) + " TL"

  const inp: React.CSSProperties = {
    width: "100%",
    border: "none",
    borderBottom: "1px solid #e0e0e0",
    padding: "10px 0",
    fontSize: "13px",
    outline: "none",
    background: "transparent",
    color: "#0A0A0A",
  }

  const lbl: React.CSSProperties = {
    display: "block",
    fontSize: "10px",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "#888",
    marginBottom: "4px",
  }

  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        Yukleniyor...
      </main>
    )
  }

  return (
    <main style={{ minHeight: "100vh", background: "#F8F8F8" }}>
      <div style={{ background: "#0A0A0A", padding: "1.2rem 2rem" }}>
        <div
          style={{
            maxWidth: "1000px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <Link
            href="/customer/checkout/address"
            style={{ color: "#666", display: "flex" }}
          >
            <ArrowLeft size={18} />
          </Link>

          <Link
            href="/customer"
            style={{
              fontSize: "1.4rem",
              fontWeight: 300,
              color: "#fff",
              textDecoration: "none",
            }}
          >
            LUIR
          </Link>

          <span style={{ color: "#444" }}>/</span>

          <span
            style={{
              fontSize: "12px",
              color: "#888",
            }}
          >
            Odeme
          </span>
        </div>
      </div>

      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          padding: "2rem",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 320px",
            gap: "2rem",
          }}
        >
          <div>
            {savedCards.length > 0 && (
              <div
                style={{
                  background: "#fff",
                  padding: "1.5rem",
                  border: "1px solid #eee",
                  marginBottom: "1rem",
                }}
              >
                <h2
                  style={{
                    fontSize: "1.4rem",
                    fontWeight: 300,
                    marginBottom: "1.2rem",
                  }}
                >
                  Kayitli Kartlar
                </h2>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  {savedCards.map((c) => (
                    <label
                      key={c.id}
                      style={{
                        border:
                          selectedCardId === c.id && !useNewCard
                            ? "1px solid #0A0A0A"
                            : "0.5px solid #e5e5e5",

                        borderRadius: "12px",
                        padding: "18px 20px",
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                        cursor: "pointer",
                        background: "#fff",
                      }}
                    >
                      <input
                        type="radio"
                        name="card"
                        checked={
                          selectedCardId === c.id &&
                          !useNewCard
                        }
                        onChange={() => {
                          setSelectedCardId(c.id)
                          setUseNewCard(false)
                        }}
                        style={{
                          accentColor: "#0A0A0A",
                          width: "16px",
                          height: "16px",
                          flexShrink: 0,
                        }}
                      />

                      <div style={{ flex: 1 }}>
                        {c.is_default && (
                          <span
                            style={{
                              fontSize: "9px",
                              letterSpacing: "0.12em",
                              textTransform: "uppercase",
                              background: "#0A0A0A",
                              color: "#fff",
                              padding: "2px 8px",
                              borderRadius: "2px",
                              display: "inline-block",
                              marginBottom: "6px",
                            }}
                          >
                            Varsayilan
                          </span>
                        )}

                        <div
                          style={{
                            fontSize: "14px",
                            fontWeight: 500,
                            letterSpacing: "0.08em",
                          }}
                        >
                          •••• •••• •••• {c.last_four_digits}
                        </div>

                        <div
                          style={{
                            fontSize: "11px",
                            color: "#888",
                            marginTop: "3px",
                          }}
                        >
                          {c.card_type} — {c.cardholder_name} —{" "}
                          {c.expire_month}/{c.expire_year}
                        </div>
                      </div>
                    </label>
                  ))}

                  <label
                    style={{
                      border: useNewCard
                        ? "1px solid #0A0A0A"
                        : "0.5px dashed #ddd",
                      borderRadius: "12px",
                      padding: "18px",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="radio"
                      name="card"
                      checked={useNewCard}
                      onChange={() => {
                        setUseNewCard(true)
                        setSelectedCardId(null)
                      }}
                    />

                    <Plus size={14} />

                    <span style={{ fontSize: "13px" }}>
                      Yeni kart ile ode
                    </span>
                  </label>
                </div>
              </div>
            )}

            {(useNewCard || savedCards.length === 0) && (
              <div
                style={{
                  background: "#fff",
                  padding: "1.5rem",
                  border: "1px solid #eee",
                  marginBottom: "1rem",
                }}
              >
                <h2
                  style={{
                    fontSize: "1.4rem",
                    fontWeight: 300,
                    marginBottom: "1.2rem",
                  }}
                >
                  Yeni Kart
                </h2>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1.2rem",
                  }}
                >
                  <div>
                    <label style={lbl}>Kart Uzerindeki Ad *</label>

                    <input
                      style={inp}
                      placeholder="AD SOYAD"
                      value={card.holder}
                      onChange={(e) =>
                        setCard((p) => ({
                          ...p,
                          holder: e.target.value.toUpperCase(),
                        }))
                      }
                    />
                  </div>

                  <div>
                    <label style={lbl}>Kart Numarasi *</label>

                    <input
                      style={inp}
                      placeholder="0000 0000 0000 0000"
                      value={card.number}
                      onChange={(e) =>
                        setCard((p) => ({
                          ...p,
                          number: formatNumber(e.target.value),
                        }))
                      }
                      maxLength={19}
                    />
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "1rem",
                    }}
                  >
                    <div>
                      <label style={lbl}>Son Kullanma *</label>

                      <input
                        style={inp}
                        placeholder="AA/YY"
                        value={card.expiry}
                        onChange={(e) =>
                          setCard((p) => ({
                            ...p,
                            expiry: formatExpiry(e.target.value),
                          }))
                        }
                        maxLength={5}
                      />
                    </div>

                    <div>
                      <label style={lbl}>CVV *</label>

                      <input
                        style={inp}
                        placeholder="•••"
                        value={card.cvv}
                        type="password"
                        onChange={(e) =>
                          setCard((p) => ({
                            ...p,
                            cvv: e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 4),
                          }))
                        }
                        maxLength={4}
                      />
                    </div>
                  </div>

                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      fontSize: "13px",
                      color: "#888",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={saveCard}
                      onChange={(e) =>
                        setSaveCard(e.target.checked)
                      }
                    />

                    Bu karti kaydet
                  </label>
                </div>
              </div>
            )}
          </div>

          <div>
            <div
              style={{
                background: "#fff",
                border: "1px solid #eee",
                padding: "1.5rem",
                position: "sticky",
                top: "100px",
              }}
            >
              <div
                style={{
                  fontSize: "10px",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "#888",
                  marginBottom: "1rem",
                }}
              >
                Siparis Ozeti ({items.length} urun)
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={placing}
                style={{
                  width: "100%",
                  background: "#0A0A0A",
                  color: "#fff",
                  border: "none",
                  padding: "15px",
                  cursor: "pointer",
                }}
              >
                {placing
                  ? "Siparis Veriliyor..."
                  : "Siparisi Tamamla — " + fmt(total)}
              </button>

              {error && (
                <p
                  style={{
                    color: "red",
                    fontSize: "12px",
                    marginTop: "12px",
                  }}
                >
                  {error}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}