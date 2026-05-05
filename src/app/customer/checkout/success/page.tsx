"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Check, ShoppingBag, Package } from "lucide-react"

export default function OrderSuccessPage() {
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get("order")

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", padding: "2rem", textAlign: "center" }}>

      <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "#EAF3DE", border: "1px solid #639922", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.5rem" }}>
        <Check size={32} color="#3B6D11" />
      </div>

      <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "2.4rem", fontWeight: 300, marginBottom: "0.8rem" }}>
        Siparisıniz Alındı!
      </h1>

      {orderNumber && (
        <div style={{ background: "#F8F8F8", border: "0.5px solid #e0e0e0", padding: "12px 24px", marginBottom: "1rem", display: "inline-block" }}>
          <div style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#888", marginBottom: "4px" }}>Siparis Numarasi</div>
          <div style={{ fontSize: "1.3rem", fontWeight: 600, letterSpacing: "0.08em", fontFamily: "var(--font-dm-sans)" }}>
            #{orderNumber}
          </div>
        </div>
      )}

      <p style={{ fontSize: "13px", color: "var(--muted)", maxWidth: "400px", lineHeight: 1.9, marginBottom: "2rem" }}>
        Siparisıniz basariyla olusturuldu ve hazırlanmaya basladi. Siparis durumunuzu profilinizden takip edebilirsiniz.
      </p>

      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" as const, justifyContent: "center" }}>
        <Link
          href="/customer/profile/orders"
          style={{ background: "#0A0A0A", color: "#fff", padding: "12px 24px", fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", textDecoration: "none", fontFamily: "var(--font-dm-sans)", display: "flex", alignItems: "center", gap: "8px" }}
        >
          <Package size={14} /> Siparisimi Goruntule
        </Link>
        <Link
          href="/customer/products"
          style={{ background: "transparent", color: "#888", border: "0.5px solid #e0e0e0", padding: "12px 24px", fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", textDecoration: "none", fontFamily: "var(--font-dm-sans)" }}
        >
          Alısverise Devam
        </Link>
      </div>

    </main>
  )
}