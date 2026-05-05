"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Check, X, Eye } from "lucide-react"

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  beklemede: { label: "Beklemede", color: "#854F0B", bg: "#FEF3CD" },
  onaylandi: { label: "Onaylandi", color: "#3B6D11", bg: "#EAF3DE" },
  reddedildi: { label: "Reddedildi", color: "#A32D2D", bg: "#FCEBEB" },
}

export default function AdminReturnsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [returns, setReturns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [adminNote, setAdminNote] = useState("")
  const [processing, setProcessing] = useState(false)
  const [filterStatus, setFilterStatus] = useState("all")

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/admin/login"); return }
      const { data: admin } = await supabase.from("admins").select("id").eq("user_id", user.id).single()
      if (!admin) { router.push("/admin/login"); return }
      fetchReturns()
    }
    init()
  }, [])

  const fetchReturns = async () => {
    const { data, error } = await supabase
      .from("return_requests")
      .select(`
        id, status, reason, note, return_code, admin_note, created_at,
        orders ( id, order_number ),
        order_items (
          quantity, price,
          product_variants (
            products ( name ),
            variant_attributes ( attribute_values ( value ) )
          )
        )
      `)
      .order("created_at", { ascending: false })

    console.log("data:", data)
    console.log("error:", error)
    setReturns(data || [])
    setLoading(false)
  }

  const handleApprove = async (id: number) => {
    setProcessing(true)
    await supabase.from("return_requests").update({ status: "onaylandi", admin_note: adminNote || null }).eq("id", id)
    await fetchReturns()
    setSelectedId(null)
    setAdminNote("")
    setProcessing(false)
  }

  const handleReject = async (id: number) => {
    if (!adminNote.trim()) { alert("Lutfen red nedeni yazin."); return }
    setProcessing(true)
    await supabase.from("return_requests").update({ status: "reddedildi", admin_note: adminNote }).eq("id", id)
    await fetchReturns()
    setSelectedId(null)
    setAdminNote("")
    setProcessing(false)
  }

  const fmtDate = (d: string) => new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })

  const filtered = returns.filter(r => filterStatus === "all" || r.status === filterStatus)
  const selected = returns.find(r => r.id === selectedId)

  if (loading) return (
    <div style={{ padding: "3rem", textAlign: "center" as const, color: "#888" }}>Yukleniyor...</div>
  )

  return (
    <div style={{ minHeight: "100vh", background: "#F5F5F5" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>

        <div style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" as const, gap: "1rem" }}>
          <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.8rem", fontWeight: 300 }}>
            Iade Talepleri ({filtered.length})
          </h1>
          <div style={{ display: "flex", gap: "8px" }}>
            {["all", "beklemede", "onaylandi", "reddedildi"].map(s => {
              const labels: Record<string, string> = { all: "Tumu", beklemede: "Bekleyen", onaylandi: "Onaylanan", reddedildi: "Reddedilen" }
              const count = s === "all" ? returns.length : returns.filter(r => r.status === s).length
              return (
                <button key={s} onClick={() => setFilterStatus(s)} style={{ padding: "5px 12px", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", border: "0.5px solid", borderColor: filterStatus === s ? "#0A0A0A" : "#e0e0e0", background: filterStatus === s ? "#0A0A0A" : "#fff", color: filterStatus === s ? "#fff" : "#888", cursor: "pointer", fontFamily: "var(--font-dm-sans)" }}>
                  {labels[s]} ({count})
                </button>
              )
            })}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: selectedId ? "1fr 360px" : "1fr", gap: "1.5rem" }}>

          {/* LİSTE */}
          <div style={{ background: "#fff", border: "0.5px solid #e0e0e0", overflowX: "auto" as const }}>
            {filtered.length === 0 ? (
              <div style={{ padding: "3rem", textAlign: "center" as const, color: "#888", fontSize: "13px" }}>Iade talebi bulunamadi.</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "0.5px solid #e0e0e0", background: "#FAFAFA" }}>
                    {["Tarih", "Siparis", "Urun", "Musteri", "Neden", "Durum", ""].map(h => (
                      <th key={h} style={{ padding: "10px 14px", textAlign: "left" as const, fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#888", fontWeight: 400 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => {
                    const s = STATUS_CONFIG[r.status] || STATUS_CONFIG.beklemede
                    const variantLabel = r.order_items?.product_variants?.variant_attributes
                      ?.map((va: any) => va.attribute_values?.value).join(" · ") || ""
                    return (
                      <tr key={r.id} style={{ borderBottom: "0.5px solid #f0f0f0", background: selectedId === r.id ? "#FAFAFA" : "#fff" }}>
                        <td style={{ padding: "12px 14px", fontSize: "11px", color: "#888", whiteSpace: "nowrap" as const }}>{fmtDate(r.created_at)}</td>
                        <td style={{ padding: "12px 14px", fontSize: "12px", fontWeight: 600 }}>#{r.orders?.order_number}</td>
                        <td style={{ padding: "12px 14px" }}>
                          <div style={{ fontSize: "12px", fontWeight: 500 }}>{r.order_items?.product_variants?.products?.name}</div>
                          {variantLabel && <div style={{ fontSize: "10px", color: "#888" }}>{variantLabel}</div>}
                        </td>
                        <td style={{ padding: "12px 14px", fontSize: "11px", color: "#888" }}>{r.users?.email}</td>
                        <td style={{ padding: "12px 14px", fontSize: "12px", maxWidth: "160px" }}>
                          <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{r.reason}</div>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{ fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", padding: "2px 8px", background: s.bg, color: s.color }}>
                            {s.label}
                          </span>
                          {r.return_code && <div style={{ fontSize: "10px", color: "#3B6D11", marginTop: "3px", fontWeight: 600 }}>{r.return_code}</div>}
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <button
                            onClick={() => { setSelectedId(selectedId === r.id ? null : r.id); setAdminNote(r.admin_note || "") }}
                            style={{ background: "none", border: "0.5px solid #e0e0e0", cursor: "pointer", width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", color: "#888" }}
                          >
                            <Eye size={12} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* DETAY */}
          {selected && (
            <div style={{ background: "#fff", border: "0.5px solid #e0e0e0", padding: "1.5rem", height: "fit-content", position: "sticky", top: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }}>
                <div style={{ fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 500 }}>Talep Detayi</div>
                <button onClick={() => setSelectedId(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#888" }}><X size={16} /></button>
              </div>

              <div style={{ display: "flex", flexDirection: "column" as const, gap: "1rem" }}>
                <div>
                  <div style={{ fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#888", marginBottom: "4px" }}>Iade Nedeni</div>
                  <div style={{ fontSize: "13px", background: "#F8F8F8", padding: "10px 12px" }}>{selected.reason}</div>
                </div>

                {selected.note && (
                  <div>
                    <div style={{ fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#888", marginBottom: "4px" }}>Musteri Notu</div>
                    <div style={{ fontSize: "13px", background: "#F8F8F8", padding: "10px 12px", color: "#555" }}>{selected.note}</div>
                  </div>
                )}

                {selected.return_code && (
                  <div style={{ background: "#EAF3DE", padding: "1rem", textAlign: "center" as const }}>
                    <div style={{ fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#3B6D11", marginBottom: "4px" }}>Iade Kodu</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#3B6D11", letterSpacing: "0.08em" }}>{selected.return_code}</div>
                  </div>
                )}

                {selected.status === "beklemede" && (
                  <div>
                    <div style={{ fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#888", marginBottom: "6px" }}>Admin Notu</div>
                    <textarea
                      rows={3}
                      value={adminNote}
                      onChange={e => setAdminNote(e.target.value)}
                      placeholder="Onay veya red nedeni..."
                      style={{ width: "100%", border: "0.5px solid #e0e0e0", padding: "10px 12px", fontSize: "13px", outline: "none", fontFamily: "var(--font-dm-sans)", resize: "none" as const, lineHeight: "1.6", marginBottom: "10px" }}
                    />
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => handleApprove(selected.id)}
                        disabled={processing}
                        style={{ flex: 1, background: "#3B6D11", color: "#fff", border: "none", padding: "10px", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", cursor: processing ? "not-allowed" : "pointer", fontFamily: "var(--font-dm-sans)", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", opacity: processing ? 0.6 : 1 }}
                      >
                        <Check size={12} /> Onayla
                      </button>
                      <button
                        onClick={() => handleReject(selected.id)}
                        disabled={processing}
                        style={{ flex: 1, background: "#A32D2D", color: "#fff", border: "none", padding: "10px", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", cursor: processing ? "not-allowed" : "pointer", fontFamily: "var(--font-dm-sans)", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", opacity: processing ? 0.6 : 1 }}
                      >
                        <X size={12} /> Reddet
                      </button>
                    </div>
                  </div>
                )}

                {selected.admin_note && selected.status !== "beklemede" && (
                  <div>
                    <div style={{ fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#888", marginBottom: "4px" }}>Admin Notu</div>
                    <div style={{ fontSize: "13px", background: "#F8F8F8", padding: "10px 12px", color: "#555" }}>{selected.admin_note}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}