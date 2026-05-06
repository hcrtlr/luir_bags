"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, ChevronDown, Eye, LogOut } from "lucide-react"

type Order = {
  id: number
  order_number: string
  total_price: number
  status: string
  created_at: string
  user: { email: string }
  order_items: { id: number }[]
  shipping_address: { full_name: string; city_id: number | null } | null
}

const STATUSES = [
  { value: "hazirlaniyor", label: "Hazirlaniyor", color: "#854F0B", bg: "#FEF3CD" },
  { value: "kargoda", label: "Kargoda", color: "#185FA5", bg: "#EBF3FD" },
  { value: "teslim_edildi", label: "Teslim Edildi", color: "#3B6D11", bg: "#EAF3DE" },
  { value: "iptal", label: "Iptal Edildi", color: "#A32D2D", bg: "#FCEBEB" },
]


export default function AdminOrdersPage() {
  const router = useRouter()
  const supabase = createClient()

  const [orders, setOrders] = useState<Order[]>([])
  const [openOrderId, setOpenOrderId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<number | null>(null)
  const [filterStatus, setFilterStatus] = useState("all")
  const [search, setSearch] = useState("")
  const [cities, setCities] = useState<Record<number, string>>({})

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/admin/login"); return }
      const { data } = await supabase.from("admins").select("id").eq("id", user.id).single()
      if (!data) { router.push("/admin/login"); return }

      const { data: cityData } = await supabase.from("cities").select("id, name")
      const cityMap: Record<number, string> = {}
      cityData?.forEach(c => { cityMap[c.id] = c.name })
      setCities(cityMap)

      fetchOrders()
    }
    init()
  }, [])

  const fetchOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select(`
        id, order_number, total_price, status, created_at,
        user:users ( email ),
        order_items ( id ),
        shipping_address:addresses!orders_shipping_address_id_fkey ( full_name, city_id )
      `)
      .order("created_at", { ascending: false })

    setOrders((data as any) || [])
    setLoading(false)
  }

  const updateStatus = async (orderId: number, status: string) => {
    setUpdating(orderId)
    await supabase.from("orders").update({ status }).eq("id", orderId)
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o))
    setUpdating(null)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/admin/login")
  }

  const getStatus = (val: string) => STATUSES.find(s => s.value === val) || { label: val, color: "#888", bg: "#f5f5f5" }

  const fmt = (p: number) => p.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) + " TL"
  const fmtDate = (d: string) => new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })

  const filtered = orders.filter(o => {
    const matchStatus = filterStatus === "all" || o.status === filterStatus
    const matchSearch = !search ||
      (o.order_number || String(o.id)).toLowerCase().includes(search.toLowerCase()) ||
      (o.user as any)?.email?.toLowerCase().includes(search.toLowerCase()) ||
      (o.shipping_address as any)?.full_name?.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#888" }}>Yukleniyor...</p>
    </div>
  )

  return (
    <div style={{ minHeight: "100vh", background: "#F5F5F5" }}>
      <style>{`
        select.status-select { appearance: none; cursor: pointer; background: transparent; }
      `}</style>

      {/* NAVBAR */}
      <div style={{ background: "#0A0A0A", padding: "1rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Link href="/admin" style={{ color: "#555", display: "flex" }}><ArrowLeft size={20} /></Link>
          <div style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.4rem", fontWeight: 300, color: "#fff" }}>
            Siparisler ({filtered.length})
          </div>
        </div>
        <button onClick={handleLogout} style={{ background: "none", border: "0.5px solid #333", color: "#666", padding: "6px 14px", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", fontFamily: "var(--font-dm-sans)", display: "flex", alignItems: "center", gap: "6px" }}>
          <LogOut size={12} /> Cikis
        </button>
      </div>

      <div style={{ maxWidth: "1300px", margin: "0 auto", padding: "2rem" }}>

        {/* FİLTRELER */}
        <div style={{ background: "#fff", border: "0.5px solid #e0e0e0", padding: "1rem 1.5rem", marginBottom: "1rem", display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
          <input
            type="text"
            placeholder="Siparis no, musteri, isim ara..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: "200px", border: "none", borderBottom: "1px solid #e0e0e0", padding: "6px 0", fontSize: "13px", outline: "none", fontFamily: "var(--font-dm-sans)" }}
          />
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              onClick={() => setFilterStatus("all")}
              style={{ padding: "5px 12px", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", border: "0.5px solid", borderColor: filterStatus === "all" ? "#0A0A0A" : "#e0e0e0", background: filterStatus === "all" ? "#0A0A0A" : "#fff", color: filterStatus === "all" ? "#fff" : "#888", cursor: "pointer", fontFamily: "var(--font-dm-sans)" }}
            >
              Tumu ({orders.length})
            </button>
            {STATUSES.map(s => (
              <button
                key={s.value}
                onClick={() => setFilterStatus(s.value)}
                style={{ padding: "5px 12px", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", border: "0.5px solid", borderColor: filterStatus === s.value ? s.color : "#e0e0e0", background: filterStatus === s.value ? s.bg : "#fff", color: filterStatus === s.value ? s.color : "#888", cursor: "pointer", fontFamily: "var(--font-dm-sans)" }}
              >
                {s.label} ({orders.filter(o => o.status === s.value).length})
              </button>
            ))}
          </div>
        </div>

        {/* TABLO */}
        <div style={{ background: "#fff", border: "0.5px solid #e0e0e0", overflowX: "auto" }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "#888", fontSize: "13px" }}>
              Siparis bulunamadi.
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "0.5px solid #e0e0e0", background: "#FAFAFA" }}>
                  {["Siparis No", "Tarih", "Musteri", "Teslimat", "Urun Sayisi", "Toplam", "Durum", "Guncelle", "Detay"].map(h => (
                    <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#888", fontWeight: 400, whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(order => {
                  const s = getStatus(order.status)
                  const addr = order.shipping_address as any
                  const cityStr = addr?.city_id ? cities[addr.city_id] || "" : ""
                  return (
                    <tr
                       key={order.id}
                       onClick={() => setOpenOrderId(openOrderId === order.id ? null : order.id)
                       }
                      style={{ borderBottom: "0.5px solid #f0f0f0" }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#FAFAFA"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "#fff"}
                    >
                      <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                        <div style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "0.04em" }}>
                          #{order.order_number || order.id}
                        </div>
                      </td>

                      <td style={{ padding: "12px 14px", fontSize: "12px", color: "#888", whiteSpace: "nowrap" }}>
                        {fmtDate(order.created_at)}
                      </td>

                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ fontSize: "12px", color: "#0A0A0A" }}>{addr?.full_name || "—"}</div>
                        <div style={{ fontSize: "11px", color: "#bbb" }}>{(order.user as any)?.email}</div>
                      </td>

                      <td style={{ padding: "12px 14px", fontSize: "12px", color: "#888" }}>
                        {cityStr || "—"}
                      </td>

                      <td style={{ padding: "12px 14px", fontSize: "12px", color: "#888", textAlign: "center" }}>
                        {(order.order_items as any)?.length || 0}
                      </td>

                      <td style={{ padding: "12px 14px", fontSize: "13px", fontWeight: 500, whiteSpace: "nowrap" }}>
                        {fmt(order.total_price)}
                      </td>

                      <td style={{ padding: "12px 14px" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", background: (s as any).bg, color: (s as any).color, padding: "3px 9px", fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", borderRadius: "2px", whiteSpace: "nowrap" }}>
                          {s.label}
                        </span>
                      </td>

                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ position: "relative", display: "inline-block" }}>
                          <select
                            className="status-select"
                            value={order.status}
                            disabled={updating === order.id}
                            onChange={e => updateStatus(order.id, e.target.value)}
                            style={{ border: "0.5px solid #e0e0e0", padding: "5px 28px 5px 10px", fontSize: "11px", fontFamily: "var(--font-dm-sans)", color: "#0A0A0A", outline: "none", borderRadius: "2px", opacity: updating === order.id ? 0.5 : 1 }}
                          >
                            {STATUSES.map(s => (
                              <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                          </select>
                          <ChevronDown size={12} style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#888" }} />
                        </div>
                      </td>  
                    </tr>



                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}