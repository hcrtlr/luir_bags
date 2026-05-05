"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import {
  ArrowLeft, Package, RotateCcw, X, Check,
  Truck, Clock, CheckCircle, ChevronDown, ChevronUp, AlertCircle
} from "lucide-react"

type OrderItem = {
  id: number
  quantity: number
  price: number
  is_cancelled: boolean
  variant: {
    id: number
    sku: string
    product: { id: number; name: string }
    variant_attributes: { attribute_values: { value: string } }[]
    product_images: { image_url: string; is_primary: boolean; variant_id: number | null }[]
  }
  return_request: ReturnRequest | null
}

type Order = {
  id: number
  order_number: string
  total_price: number
  status: string
  created_at: string
  order_items: OrderItem[]
}

type ReturnRequest = {
  id: number
  order_item_id: number
  reason: string
  note: string | null
  status: string
  return_code: string | null
  created_at: string
}

type ConfirmDialog = {
  open: boolean
  title: string
  message: string
  onConfirm: () => void
}

const ORDER_STATUS: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  hazirlaniyor: { label: "Hazirlaniyor", color: "#854F0B", bg: "#FEF3CD", icon: Clock },
  kargoda: { label: "Kargoda", color: "#185FA5", bg: "#EBF3FD", icon: Truck },
  teslim_edildi: { label: "Teslim Edildi", color: "#3B6D11", bg: "#EAF3DE", icon: CheckCircle },
  iade_talebi: { label: "Iade Talebi", color: "#6B3A8A", bg: "#F3EBF9", icon: RotateCcw },
  iade_oldu: { label: "Iade Tamamlandi", color: "#555", bg: "#F5F5F5", icon: Check },
  iptal: { label: "Iptal Edildi", color: "#A32D2D", bg: "#FCEBEB", icon: X },
}

const RETURN_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  beklemede: { label: "Inceleniyor", color: "#854F0B", bg: "#FEF3CD" },
  onaylandi: { label: "Onaylandi", color: "#3B6D11", bg: "#EAF3DE" },
  reddedildi: { label: "Reddedildi", color: "#A32D2D", bg: "#FCEBEB" },
}

const RETURN_REASONS = [
  "Urun hasarli geldi",
  "Yanlis urun geldi",
  "Beden uyumsuzlugu",
  "Renk veya gorsel uyumsuzlugu",
  "Beklentimi karsilamadi",
  "Diger",
]

export default function ReturnsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab === "returns") setActiveTab("returns")
  }, [])
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<Order[]>([])
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<"orders" | "returns">("orders")

  const [cancellingId, setCancellingId] = useState<number | null>(null)
  const [cancellingOrderId, setCancellingOrderId] = useState<number | null>(null)

  const [returnItemId, setReturnItemId] = useState<number | null>(null)
  const [returnReason, setReturnReason] = useState("")
  const [returnNote, setReturnNote] = useState("")
  const [submittingReturn, setSubmittingReturn] = useState(false)
  const [returnError, setReturnError] = useState("")

  const [confirm, setConfirm] = useState<ConfirmDialog>({
    open: false, title: "", message: "", onConfirm: () => {}
  })

  // Sayaçlar
  const totalOrders = orders.length
  const totalReturns = orders.flatMap(o => o.order_items.filter(i => i.return_request || i.is_cancelled)).length

  const openConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirm({ open: true, title, message, onConfirm })
  }

  const closeConfirm = () => {
    setConfirm(prev => ({ ...prev, open: false }))
  }

  const fetchOrders = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/customer/login"); return }

    const { data: ordersData, error: ordersErr } = await supabase
      .from("orders")
      .select("id, order_number, total_price, status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (ordersErr || !ordersData) { setLoading(false); return }

    const ordersWithItems = await Promise.all(
      ordersData.map(async (order) => {
        const { data: items } = await supabase
          .from("order_items")
          .select(`
            id, quantity, price, is_cancelled,
            variant:product_variants (
              id, sku,
              product:products ( id, name ),
              variant_attributes ( attribute_values ( value ) ),
              product_images ( image_url, is_primary, variant_id )
            )
          `)
          .eq("order_id", order.id)

        const { data: returns } = await supabase
          .from("return_requests")
          .select("id, order_item_id, reason, note, status, return_code, created_at")
          .eq("order_id", order.id)
          .eq("user_id", user.id)

        const itemsWithReturns = ((items || []) as any[]).map((item: any) => ({
          ...item,
          return_request: (returns || []).find((r: any) => r.order_item_id === item.id) || null
        }))

        return { ...order, order_items: itemsWithReturns }
      })
    )

    setOrders(ordersWithItems as any)
    setLoading(false)
  }, [])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const doCancelItem = async (itemId: number, orderId: number) => {
    setCancellingId(itemId)
    closeConfirm()

    await supabase
      .from("order_items")
      .update({ is_cancelled: true, cancelled_at: new Date().toISOString() })
      .eq("id", itemId)

    // Stok iade
    const order = orders.find(o => o.id === orderId)
    const item = order?.order_items.find(i => i.id === itemId)
    if (item) {
      const { data: v } = await supabase.from("product_variants").select("stock").eq("id", item.variant.id).single()
      if (v) await supabase.from("product_variants").update({ stock: v.stock + item.quantity }).eq("id", item.variant.id)
    }

    // Tüm ürünler iptal mi?
    const remaining = order?.order_items.filter(i => i.id !== itemId && !i.is_cancelled) || []
    if (remaining.length === 0) {
      await supabase.from("orders").update({ status: "iptal" }).eq("id", orderId)
    }

    await fetchOrders()
    setCancellingId(null)

    // İadeler sekmesine geç
    setActiveTab("returns")
  }

  const doCancelOrder = async (orderId: number) => {
    setCancellingOrderId(orderId)
    closeConfirm()

    const order = orders.find(o => o.id === orderId)
    const activeItems = order?.order_items.filter(i => !i.is_cancelled) || []

    await supabase
      .from("order_items")
      .update({ is_cancelled: true, cancelled_at: new Date().toISOString() })
      .eq("order_id", orderId)

    await supabase.from("orders").update({ status: "iptal" }).eq("id", orderId)

    for (const item of activeItems) {
      const { data: v } = await supabase.from("product_variants").select("stock").eq("id", item.variant.id).single()
      if (v) await supabase.from("product_variants").update({ stock: v.stock + item.quantity }).eq("id", item.variant.id)
    }

    await fetchOrders()
    setCancellingOrderId(null)

    // İadeler sekmesine geç
    setActiveTab("returns")
  }

  const cancelItem = (itemId: number, orderId: number, productName: string) => {
    openConfirm(
      "Urunu Iptal Et",
      `"${productName}" urununu iptal etmek istediginize emin misiniz? Bu islem geri alinamaz.`,
      () => doCancelItem(itemId, orderId)
    )
  }

  const cancelOrder = (orderId: number, orderNumber: string) => {
    openConfirm(
      "Siparisi Iptal Et",
      `#${orderNumber} numarali siparisi tamamen iptal etmek istediginize emin misiniz? Tum urunler iptal edilecektir.`,
      () => doCancelOrder(orderId)
    )
  }

  const submitReturn = async (itemId: number, orderId: number) => {
    if (!returnReason) { setReturnError("Lutfen bir iade nedeni secin."); return }
    setSubmittingReturn(true)
    setReturnError("")

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from("return_requests").insert({
      order_id: orderId,
      order_item_id: itemId,
      user_id: user.id,
      reason: returnReason,
      note: returnNote.trim() || null,
      status: "beklemede",
    })

    if (error) {
      setReturnError("Iade talebi olusturulamadi: " + error.message)
      setSubmittingReturn(false)
      return
    }

    await supabase.from("orders").update({ status: "iade_talebi" }).eq("id", orderId)
    await fetchOrders()
    setReturnItemId(null)
    setReturnReason("")
    setReturnNote("")
    setSubmittingReturn(false)

    // İadeler sekmesine geç
    setActiveTab("returns")
  }

  const getItemImage = (item: OrderItem) => {
    const imgs = item.variant?.product_images || []
    return (
      imgs.find(i => i.variant_id === item.variant?.id && i.is_primary)?.image_url ||
      imgs.find(i => i.variant_id === item.variant?.id)?.image_url ||
      imgs.find(i => i.is_primary)?.image_url ||
      imgs[0]?.image_url || null
    )
  }

  const fmt = (p: number) => p.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) + " TL"
  const fmtDate = (d: string) => new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })
  const canCancel = (status: string) => status === "hazirlaniyor"
  const canReturn = (status: string) => status === "teslim_edildi"

  const allReturns = orders.flatMap(o =>
    o.order_items
      .filter(i => i.return_request || i.is_cancelled)
      .map(i => ({
        type: i.is_cancelled ? "iptal" : "iade",
        return_request: i.return_request,
        orderNumber: o.order_number,
        productName: i.variant?.product?.name || "",
        quantity: i.quantity,
        price: i.price,
        is_cancelled: i.is_cancelled,
      }))
  )

  // Sayaç hesaplamaları
  const activeOrderCount = orders.filter(o => o.status !== "iptal").length
  const returnCount = allReturns.length

  if (loading) return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ fontSize: "13px", color: "#888" }}>Yukleniyor...</p>
    </main>
  )

  return (
    <main style={{ minHeight: "100vh", background: "#F8F8F8" }}>
      <style>{`
        @media (max-width: 600px) {
          .item-row { flex-wrap: wrap !important; }
          .item-actions { width: 100% !important; flex-direction: row !important; justify-content: flex-end !important; }
        }

        /* CONFIRM DIALOG */
        .confirm-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.5);
          display: flex; align-items: center; justify-content: center;
          z-index: 9999; padding: 1rem;
          animation: fadeIn 0.15s ease;
        }
        .confirm-box {
          background: #fff; padding: 2rem; max-width: 400px; width: 100%;
          animation: slideUp 0.2s ease;
        }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>

      {/* CONFIRM DIALOG */}
      {confirm.open && (
        <div className="confirm-overlay" onClick={closeConfirm}>
          <div className="confirm-box" onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "1.2rem" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#FEF3CD", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <AlertCircle size={18} color="#854F0B" />
              </div>
              <div>
                <div style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.2rem", fontWeight: 400, marginBottom: "6px" }}>
                  {confirm.title}
                </div>
                <div style={{ fontSize: "13px", color: "#666", lineHeight: 1.7 }}>
                  {confirm.message}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button
                onClick={closeConfirm}
                style={{ padding: "8px 18px", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", background: "none", border: "0.5px solid #e0e0e0", color: "#888", cursor: "pointer", fontFamily: "var(--font-dm-sans)" }}
              >
                Vazgec
              </button>
              <button
                onClick={confirm.onConfirm}
                style={{ padding: "8px 18px", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", background: "#0A0A0A", border: "none", color: "#fff", cursor: "pointer", fontFamily: "var(--font-dm-sans)" }}
              >
                Evet, Iptal Et
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div style={{ background: "#0A0A0A", padding: "1.2rem 1.5rem", display: "flex", alignItems: "center", gap: "14px" }}>
        <Link href="/customer/profile" style={{ color: "#666", display: "flex" }}><ArrowLeft size={20} /></Link>
        <div>
          <div style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.3rem", fontWeight: 300, color: "#fff" }}>
            Siparislerim & Iadelerim
          </div>
          <div style={{ fontSize: "11px", color: "#555", marginTop: "2px" }}>
            {activeOrderCount} aktif siparis · {returnCount} islem
          </div>
        </div>
      </div>

      {/* TABS */}
      <div style={{ background: "#fff", borderBottom: "0.5px solid #efefef", display: "flex" }}>
        <button
          onClick={() => setActiveTab("orders")}
          style={{
            flex: 1, padding: "12px 16px",
            fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase",
            border: "none", cursor: "pointer", background: "none",
            borderBottom: activeTab === "orders" ? "2px solid #0A0A0A" : "2px solid transparent",
            color: activeTab === "orders" ? "#0A0A0A" : "#888",
            fontFamily: "var(--font-dm-sans)",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
          }}
        >
          Siparisler
          <span style={{ background: activeTab === "orders" ? "#0A0A0A" : "#f0f0f0", color: activeTab === "orders" ? "#fff" : "#888", borderRadius: "20px", padding: "1px 8px", fontSize: "10px", fontWeight: 600 }}>
            {activeOrderCount}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("returns")}
          style={{
            flex: 1, padding: "12px 16px",
            fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase",
            border: "none", cursor: "pointer", background: "none",
            borderBottom: activeTab === "returns" ? "2px solid #0A0A0A" : "2px solid transparent",
            color: activeTab === "returns" ? "#0A0A0A" : "#888",
            fontFamily: "var(--font-dm-sans)",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
          }}
        >
          Iptal & Iadeler
          <span style={{ background: returnCount > 0 ? (activeTab === "returns" ? "#0A0A0A" : "#E24B4A") : "#f0f0f0", color: returnCount > 0 ? "#fff" : "#888", borderRadius: "20px", padding: "1px 8px", fontSize: "10px", fontWeight: 600 }}>
            {returnCount}
          </span>
        </button>
      </div>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "1.5rem" }}>

        {/* ========== SİPARİŞLER ========== */}
        {activeTab === "orders" && (
          <div style={{ display: "flex", flexDirection: "column" as const, gap: "12px" }}>
            {orders.length === 0 ? (
              <div style={{ textAlign: "center" as const, padding: "4rem 0" }}>
                <Package size={48} strokeWidth={1} color="#ddd" style={{ margin: "0 auto 16px" }} />
                <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.5rem", fontWeight: 300, marginBottom: "8px" }}>Henuz siparis yok</p>
                <Link href="/customer/products" style={{ fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#888", textDecoration: "none", borderBottom: "0.5px solid #e0e0e0" }}>Alısverise Basla</Link>
              </div>
            ) : orders.map(order => {
              const s = ORDER_STATUS[order.status] || ORDER_STATUS.hazirlaniyor
              const StatusIcon = s.icon
              const isExpanded = expandedOrder === order.id
              const activeItems = order.order_items.filter(i => !i.is_cancelled)

              return (
                <div key={order.id} style={{ background: "#fff", border: "0.5px solid #efefef" }}>

                  {/* SİPARİŞ BAŞLIK */}
                  <div style={{ padding: "1rem 1.2rem", borderBottom: isExpanded ? "0.5px solid #efefef" : "none" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" as const, gap: "8px" }}>

                      <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" as const }}>
                        <div>
                          <div style={{ fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#888" }}>Siparis No</div>
                          <div style={{ fontSize: "13px", fontWeight: 600 }}>#{order.order_number}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#888" }}>Tarih</div>
                          <div style={{ fontSize: "12px" }}>{fmtDate(order.created_at)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#888" }}>Toplam</div>
                          <div style={{ fontSize: "13px", fontWeight: 500 }}>{fmt(order.total_price)}</div>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" as const }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", background: s.bg, color: s.color, padding: "3px 10px", fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase" as const }}>
                          <StatusIcon size={10} /> {s.label}
                        </span>

                        {canCancel(order.status) && activeItems.length > 0 && (
                          <button
                            onClick={() => cancelOrder(order.id, order.order_number)}
                            disabled={cancellingOrderId === order.id}
                            style={{ fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", background: "none", border: "0.5px solid #E24B4A", color: "#E24B4A", padding: "4px 10px", cursor: "pointer", fontFamily: "var(--font-dm-sans)", display: "flex", alignItems: "center", gap: "4px" }}
                          >
                            <X size={10} /> {cancellingOrderId === order.id ? "..." : "Tumunu Iptal"}
                          </button>
                        )}

                        <button
                          onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                          style={{ background: "none", border: "0.5px solid #e0e0e0", padding: "4px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#888", fontFamily: "var(--font-dm-sans)" }}
                        >
                          {isExpanded ? <><ChevronUp size={11} /> Gizle</> : <><ChevronDown size={11} /> Detay</>}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* DETAY */}
                  {isExpanded && (
                    <div>
                      {order.order_items.length === 0 ? (
                        <div style={{ padding: "1.5rem", textAlign: "center" as const, color: "#888", fontSize: "13px" }}>
                          Urun bilgisi yuklenemedi.
                        </div>
                      ) : order.order_items.map((item) => {
                        const img = getItemImage(item)
                        const label = item.variant?.variant_attributes?.map(va => va.attribute_values.value).join(" · ") || ""
                        const ret = item.return_request
                        const isReturnOpen = returnItemId === item.id
                        const retStatus = ret ? (RETURN_STATUS[ret.status] || RETURN_STATUS.beklemede) : null

                        return (
                          <div key={item.id}>
                            <div style={{ padding: "1rem 1.2rem", borderBottom: "0.5px solid #f5f5f5", opacity: item.is_cancelled ? 0.5 : 1 }}>
                              <div className="item-row" style={{ display: "flex", gap: "12px", alignItems: "center" }}>

                                {/* GÖRSEL */}
                                <div style={{ width: "72px", height: "72px", background: "#f5f5f5", flexShrink: 0, overflow: "hidden", position: "relative", borderRadius: "2px" }}>
                                  {img ? (
                                    <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                  ) : (
                                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                      <Package size={24} color="#ddd" />
                                    </div>
                                  )}
                                  {item.is_cancelled && (
                                    <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.8)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                      <span style={{ fontSize: "8px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#A32D2D", fontWeight: 600 }}>Iptal</span>
                                    </div>
                                  )}
                                </div>

                                {/* BİLGİ */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1rem", fontWeight: 400, marginBottom: "2px" }}>
                                    {item.variant?.product?.name || "Urun"}
                                  </div>
                                  {label && <div style={{ fontSize: "11px", color: "#888", marginBottom: "2px" }}>{label}</div>}
                                  <div style={{ fontSize: "11px", color: "#888" }}>
                                    {item.quantity} adet · {fmt(item.price)} / adet
                                  </div>
                                </div>

                                {/* FİYAT + BUTON */}
                                <div className="item-actions" style={{ display: "flex", flexDirection: "column" as const, alignItems: "flex-end", gap: "6px", flexShrink: 0 }}>
                                  <div style={{ fontSize: "14px", fontWeight: 600 }}>{fmt(item.price * item.quantity)}</div>

                                  {item.is_cancelled ? (
                                    <span style={{ fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#A32D2D", background: "#FCEBEB", padding: "2px 8px" }}>
                                      Iptal Edildi
                                    </span>
                                  ) : ret ? (
                                    <div style={{ textAlign: "right" as const }}>
                                      {ret.return_code ? (
                                        <div>
                                          <div style={{ fontSize: "9px", color: "#3B6D11", letterSpacing: "0.1em", textTransform: "uppercase" }}>Iade Onaylandi</div>
                                          <div style={{ fontSize: "11px", fontWeight: 700, color: "#3B6D11", letterSpacing: "0.05em" }}>{ret.return_code}</div>
                                        </div>
                                      ) : (
                                        <span style={{ fontSize: "9px", letterSpacing: "0.08em", textTransform: "uppercase", padding: "2px 8px", background: retStatus?.bg, color: retStatus?.color }}>
                                          {retStatus?.label}
                                        </span>
                                      )}
                                    </div>
                                  ) : canCancel(order.status) ? (
                                    <button
                                      onClick={() => cancelItem(item.id, order.id, item.variant?.product?.name || "Urun")}
                                      disabled={cancellingId === item.id}
                                      style={{ fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", background: "none", border: "0.5px solid #e0e0e0", color: "#888", padding: "4px 10px", cursor: "pointer", fontFamily: "var(--font-dm-sans)", display: "flex", alignItems: "center", gap: "4px" }}
                                    >
                                      <X size={9} /> {cancellingId === item.id ? "..." : "Iptal Et"}
                                    </button>
                                  ) : canReturn(order.status) ? (
                                    <button
                                      onClick={() => {
                                        if (isReturnOpen) {
                                          setReturnItemId(null)
                                        } else {
                                          setReturnItemId(item.id)
                                          setReturnReason("")
                                          setReturnNote("")
                                          setReturnError("")
                                        }
                                      }}
                                      style={{ fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", background: "none", border: "0.5px solid #e0e0e0", color: "#888", padding: "4px 10px", cursor: "pointer", fontFamily: "var(--font-dm-sans)", display: "flex", alignItems: "center", gap: "4px" }}
                                    >
                                      <RotateCcw size={9} />
                                      Iade Talebi
                                      {isReturnOpen ? <ChevronUp size={9} /> : <ChevronDown size={9} />}
                                    </button>
                                  ) : null}
                                </div>
                              </div>
                            </div>

                            {/* İADE FORMU */}
                            {isReturnOpen && !ret && (
                              <div style={{ padding: "1rem 1.2rem", background: "#FAFAFA", borderBottom: "0.5px solid #efefef" }}>
                                <div style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#0A0A0A", marginBottom: "1rem", fontWeight: 500 }}>
                                  Iade Nedeni *
                                </div>

                                <div style={{ display: "flex", flexDirection: "column" as const, gap: "6px", marginBottom: "1rem" }}>
                                  {RETURN_REASONS.map(reason => (
                                    <label key={reason} style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", padding: "8px 12px", border: returnReason === reason ? "1.5px solid #0A0A0A" : "0.5px solid #e0e0e0", background: returnReason === reason ? "#fff" : "transparent", transition: "all 0.15s" }}>
                                      <input
                                        type="radio"
                                        name={"return-" + item.id}
                                        checked={returnReason === reason}
                                        onChange={() => { setReturnReason(reason); setReturnError("") }}
                                        style={{ accentColor: "#0A0A0A" }}
                                      />
                                      <span style={{ fontSize: "13px", color: returnReason === reason ? "#0A0A0A" : "#888" }}>{reason}</span>
                                    </label>
                                  ))}
                                </div>

                                <div style={{ marginBottom: "1rem" }}>
                                  <div style={{ fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#888", marginBottom: "6px" }}>Ek Aciklama (Opsiyonel)</div>
                                  <textarea
                                    rows={2}
                                    value={returnNote}
                                    onChange={e => setReturnNote(e.target.value)}
                                    placeholder="Iade ile ilgili ek bilgi..."
                                    style={{ width: "100%", border: "0.5px solid #e0e0e0", padding: "10px 12px", fontSize: "13px", outline: "none", fontFamily: "var(--font-dm-sans)", resize: "none" as const, lineHeight: "1.6", background: "#fff" }}
                                  />
                                </div>

                                {returnError && <p style={{ fontSize: "12px", color: "#A32D2D", marginBottom: "10px" }}>{returnError}</p>}

                                <div style={{ display: "flex", gap: "8px" }}>
                                  <button
                                    onClick={() => submitReturn(item.id, order.id)}
                                    disabled={submittingReturn || !returnReason}
                                    style={{ background: "#0A0A0A", color: "#fff", border: "none", padding: "9px 18px", fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", cursor: submittingReturn || !returnReason ? "not-allowed" : "pointer", fontFamily: "var(--font-dm-sans)", opacity: !returnReason ? 0.4 : 1 }}
                                  >
                                    {submittingReturn ? "Gonderiliyor..." : "Talep Olustur"}
                                  </button>
                                  <button
                                    onClick={() => setReturnItemId(null)}
                                    style={{ background: "transparent", color: "#888", border: "0.5px solid #e0e0e0", padding: "9px 14px", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", fontFamily: "var(--font-dm-sans)" }}
                                  >
                                    Vazgec
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ========== İPTAL & İADELER ========== */}
        {activeTab === "returns" && (
          <div style={{ display: "flex", flexDirection: "column" as const, gap: "12px" }}>
            {allReturns.length === 0 ? (
              <div style={{ textAlign: "center" as const, padding: "4rem 0" }}>
                <RotateCcw size={48} strokeWidth={1} color="#ddd" style={{ margin: "0 auto 16px" }} />
                <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.5rem", fontWeight: 300, marginBottom: "8px" }}>Henuz islem yok</p>
                <p style={{ fontSize: "12px", color: "#888" }}>Iptal ve iade islemleriniz burada goruntulenir.</p>
              </div>
            ) : allReturns.map((entry, idx) => {
              if (entry.type === "iptal") {
                return (
                  <div key={idx} style={{ background: "#fff", border: "0.5px solid #efefef", padding: "1.2rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap" as const, gap: "8px" }}>
                      <div>
                        <div style={{ fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#888", marginBottom: "2px" }}>Siparis #{entry.orderNumber}</div>
                        <div style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1rem", fontWeight: 400 }}>{entry.productName}</div>
                        <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>{entry.quantity} adet · {fmt(entry.price * entry.quantity)}</div>
                      </div>
                      <span style={{ background: "#FCEBEB", color: "#A32D2D", padding: "3px 10px", fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase" as const, display: "flex", alignItems: "center", gap: "5px" }}>
                        <X size={9} /> Iptal Edildi
                      </span>
                    </div>
                  </div>
                )
              }

              const ret = entry.return_request!
              const rs = RETURN_STATUS[ret.status] || RETURN_STATUS.beklemede

              return (
                <div key={idx} style={{ background: "#fff", border: "0.5px solid #efefef", padding: "1.2rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem", flexWrap: "wrap" as const, gap: "8px" }}>
                    <div>
                      <div style={{ fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#888", marginBottom: "2px" }}>Siparis #{entry.orderNumber}</div>
                      <div style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1rem", fontWeight: 400 }}>{entry.productName}</div>
                      <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>{entry.quantity} adet · {fmt(entry.price * entry.quantity)}</div>
                    </div>
                    <span style={{ background: rs.bg, color: rs.color, padding: "3px 10px", fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase" as const }}>
                      {rs.label}
                    </span>
                  </div>

                  <div style={{ background: "#F8F8F8", padding: "10px 12px", marginBottom: "1rem" }}>
                    <div style={{ fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#888", marginBottom: "4px" }}>Iade Nedeni</div>
                    <div style={{ fontSize: "13px", color: "#0A0A0A" }}>{ret.reason}</div>
                    {ret.note && <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>{ret.note}</div>}
                  </div>

                  {ret.return_code ? (
                    <div style={{ border: "1.5px dashed #b7d9a0", padding: "1rem", textAlign: "center" as const, background: "#EAF3DE", marginBottom: "10px" }}>
                      <div style={{ fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#3B6D11", marginBottom: "6px" }}>Iade Kodunuz</div>
                      <div style={{ fontSize: "1.3rem", fontWeight: 700, letterSpacing: "0.1em", color: "#3B6D11", marginBottom: "10px" }}>{ret.return_code}</div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                        <Truck size={14} color="#3B6D11" />
                        <span style={{ fontSize: "12px", color: "#3B6D11" }}>Bu kodu kargoya verirken kullanin</span>
                      </div>
                      <div style={{ fontSize: "11px", color: "#888", marginTop: "8px" }}>
                        Urunu anlasmali kargo ile adresimize gonderin. Urun ulastiktan sonra odemeniz iade edilir.
                      </div>
                    </div>
                  ) : ret.status === "reddedildi" ? (
                    <div style={{ background: "#FCEBEB", padding: "10px 12px", display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                      <AlertCircle size={14} color="#A32D2D" />
                      <span style={{ fontSize: "12px", color: "#A32D2D" }}>Iade talebiniz reddedildi.</span>
                    </div>
                  ) : (
                    <div style={{ background: "#FEF3CD", padding: "10px 12px", display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                      <Clock size={14} color="#854F0B" />
                      <span style={{ fontSize: "12px", color: "#854F0B" }}>Talebiniz inceleniyor. 1-3 is gunu icinde donulecektir.</span>
                    </div>
                  )}

                  <div style={{ fontSize: "11px", color: "#bbb" }}>Talep tarihi: {fmtDate(ret.created_at)}</div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}