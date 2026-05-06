"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState<any>(null)
const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showLogout, setShowLogout] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [orderCount, setOrderCount] = useState(0)
  const [activeOrderCount, setActiveOrderCount] = useState(0)
  const [addressCount, setAddressCount] = useState(0)
  const [cardCount, setCardCount] = useState(0)
  const [returnCount, setReturnCount] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
         router.push("/customer/login");
         return;
          }
      if (!user) { router.push("/customer/login"); return }
      setUser(user)

      const { data: profileData } = await supabase
        .from("users").select("*").eq("id", user.id).single()
      setProfile(profileData)

      const { count: addrCount } = await supabase
        .from("addresses").select("*", { count: "exact", head: true }).eq("user_id", user.id)
      setAddressCount(addrCount || 0)

      const { count: crdCount } = await supabase
        .from("cards").select("*", { count: "exact", head: true }).eq("user_id", user.id)
      setCardCount(crdCount || 0)

      const { data: orders } = await supabase
        .from("orders").select("id, status").eq("user_id", user.id)
      setOrderCount(orders?.length || 0)
      setActiveOrderCount(orders?.filter(o => ["pending","confirmed","shipped"].includes(o.status)).length || 0)

      setLoading(false)
    }
    fetchData()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/customer/login")
  }

  const handleDelete = async () => {
    const { error } = await supabase.rpc("delete_user")
    if (!error) {
      await supabase.auth.signOut()
      router.push("/customer")
    }
  }

  const getInitials = () => {
    if (!profile) return "?"
    return (profile.first_name?.[0] || "").toUpperCase()
  }

  const menuItems = [
    {
      href: "/customer/profile/personal",
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
      label: "Kisisel Bilgiler",
      sub: "Ad, soyad, dogum tarihi",
      badge: null,
    },
    {
      href: "/customer/profile/addresses",
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
      label: "Adreslerim",
      sub: `${addressCount} kayitli adres`,
      badge: null,
    },
    {
      href: "/customer/profile/cards",
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
      label: "Kartlarim",
      sub: `${cardCount} kayitli kart`,
      badge: null,
    },
    {
      href: "/customer/profile/orders",
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
      label: "Siparislerim",
      sub: `${orderCount} siparis`,
      badge: activeOrderCount > 0 ? `${activeOrderCount} Aktif` : null,
    },
    
  ]

  if (loading) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Yukleniyor...</p>
      </main>
    )
  }

  const sectionLabel = (text: string) => (
    <div style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase" as const, color: "var(--muted)", padding: "16px 24px 8px", borderBottom: "0.5px solid var(--border)" }}>
      {text}
    </div>
  )

  const MenuItem = ({ item }: { item: typeof menuItems[0] }) => (
    <Link
      href={item.href}
      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: "0.5px solid var(--border)", textDecoration: "none", background: "transparent", transition: "background 0.15s" }}
      onMouseEnter={e => (e.currentTarget.style.background = "var(--surface)")}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <div style={{ width: "36px", height: "36px", background: "var(--surface)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "var(--foreground)" }}>
          {item.icon}
        </div>
        <div>
          <div style={{ fontSize: "14px", color: "var(--foreground)", fontWeight: 400 }}>{item.label}</div>
          <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>{item.sub}</div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
        {item.badge && (
          <span style={{ fontSize: "9px", background: "#0A0A0A", color: "#fff", padding: "2px 8px", borderRadius: "10px", whiteSpace: "nowrap" as const }}>
            {item.badge}
          </span>
        )}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5"><polyline points="9 18 15 12 9 6"/></svg>
      </div>
    </Link>
  )

  return (
    <main style={{ minHeight: "100vh", background: "var(--background)" }}>

      {/* HERO — tam genişlik */}
      <div style={{ background: "#0A0A0A", padding: "32px 24px 24px", width: "100%" }}>
        <div style={{ maxWidth: "960px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: "16px" }}>

            {/* Avatar + İsim */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "#2a2a2a", border: "1px solid #3a3a3a", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-cormorant), serif", fontSize: "22px", color: "#fff", fontStyle: "italic", flexShrink: 0 }}>
                {getInitials()}
              </div>
              <div>
                <div style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "22px", fontWeight: 300, color: "#fff", letterSpacing: "0.02em" }}>
                  {profile?.first_name} {profile?.last_name}
                </div>
                <div style={{ fontSize: "12px", color: "#666", marginTop: "3px" }}>{user?.email}</div>
              </div>
            </div>

            {/* Butonlar */}
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => setShowLogout(true)}
                style={{ padding: "10px 20px", fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase" as const, fontFamily: "var(--font-dm-sans)", cursor: "pointer", background: "#fff", border: "none", color: "#0A0A0A", transition: "background 0.2s", whiteSpace: "nowrap" as const }}
                onMouseEnter={e => (e.currentTarget.style.background = "#e0e0e0")}
                onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
              >
                Cikis Yap
              </button>
              <button
                onClick={() => setShowDelete(true)}
                style={{ padding: "10px 20px", fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase" as const, fontFamily: "var(--font-dm-sans)", cursor: "pointer", background: "transparent", border: "1px solid #c0392b", color: "#e74c3c", transition: "background 0.2s", whiteSpace: "nowrap" as const }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(231,76,60,0.08)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                Hesabi Sil
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* İÇERİK */}
      <div style={{ maxWidth: "960px", margin: "0 auto", width: "100%" }}>

        {sectionLabel("Hesabim")}
        {menuItems.map(item => <MenuItem key={item.href} item={item} />)}

        {sectionLabel("Guvenlik")}
        <MenuItem item={{
          href: "/customer/profile/password",
          icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
          label: "Sifre Degistir",
          sub: "Guvenliginizi koruyun",
          badge: null,
        }} />

      </div>

      {/* ÇIKIŞ POP-UP */}
      {showLogout && (
        <div
          onClick={(e: React.MouseEvent<HTMLDivElement>) => { if (e.target === e.currentTarget) setShowLogout(false) }}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 999 }}
        >
          <div style={{ background: "var(--background)", width: "100%", maxWidth: "520px", padding: "32px 24px", borderRadius: "16px 16px 0 0" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "50%", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--foreground)" strokeWidth="1.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </div>
            <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "22px", fontWeight: 300, textAlign: "center", marginBottom: "8px", color: "var(--foreground)" }}>
              Cikis yapmak istiyor musunuz?
            </p>
            <p style={{ fontSize: "13px", color: "var(--muted)", textAlign: "center", lineHeight: 1.7, marginBottom: "24px" }}>
              Oturumunuz kapatilacak. Tekrar giris yapmaniz gerekecek.
            </p>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: "8px" }}>
              <button onClick={handleLogout} style={{ background: "#0A0A0A", color: "#fff", border: "none", padding: "14px", fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase" as const, cursor: "pointer", fontFamily: "var(--font-dm-sans)" }}>
                Evet, Cikis Yap
              </button>
              <button onClick={() => setShowLogout(false)} style={{ background: "transparent", color: "var(--muted)", border: "0.5px solid var(--border)", padding: "14px", fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase" as const, cursor: "pointer", fontFamily: "var(--font-dm-sans)" }}>
                Vazgec
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HESAP SİL POP-UP */}
      {showDelete && (
        <div
          onClick={(e: React.MouseEvent<HTMLDivElement>) => { if (e.target === e.currentTarget) setShowDelete(false) }}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 999 }}
        >
          <div style={{ background: "var(--background)", width: "100%", maxWidth: "520px", padding: "32px 24px", borderRadius: "16px 16px 0 0" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "50%", border: "1px solid #c0392b", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" strokeWidth="1.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            </div>
            <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "22px", fontWeight: 300, textAlign: "center", marginBottom: "8px", color: "var(--foreground)" }}>
              Hesabinizi silmek istiyor musunuz?
            </p>
            <p style={{ fontSize: "13px", color: "var(--muted)", textAlign: "center", lineHeight: 1.7, marginBottom: "24px" }}>
              Bu islem geri alinamaz. Tum verileriniz, siparisleriniz ve kayitli bilgileriniz kalici olarak silinecek.
            </p>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: "8px" }}>
              <button onClick={handleDelete} style={{ background: "#c0392b", color: "#fff", border: "none", padding: "14px", fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase" as const, cursor: "pointer", fontFamily: "var(--font-dm-sans)" }}>
                Evet, Hesabimi Sil
              </button>
              <button onClick={() => setShowDelete(false)} style={{ background: "transparent", color: "var(--muted)", border: "0.5px solid var(--border)", padding: "14px", fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase" as const, cursor: "pointer", fontFamily: "var(--font-dm-sans)" }}>
                Vazgec
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  )
}