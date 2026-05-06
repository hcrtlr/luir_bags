"use client"

import type React from "react"
import { RotateCcw, } from 'lucide-react';
import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Package, ShoppingBag, Tag, LayoutDashboard, LogOut, Menu, X, Plus } from "lucide-react"


export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const [menuOpen, setMenuOpen] = useState(false)
  const [adminEmail, setAdminEmail] = useState("")

  useEffect(() => {
    const getAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setAdminEmail(user.email || "")
    }
    getAdmin()
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/admin/login")
  }

  // Login sayfasında navbar gösterme
  if (pathname === "/admin/login") return <>{children}</>

  const navLinks = [
    { href: "/admin", label: "Dashboard", icon: <LayoutDashboard size={15} />, exact: true },
    { href: "/admin/products", label: "Urunler", icon: <Package size={15} /> },
    { href: "/admin/orders", label: "Siparisler", icon: <ShoppingBag size={15} /> },
    { href: "/admin/categories", label: "Kategoriler", icon: <Tag size={15} /> },
    { href: "/admin/returns", label: "Iadeler", icon: <RotateCcw size={15} /> },
  ]

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }
  return (
    <html lang="tr">
      <body>
        <div style={{ minHeight: "100vh", background: "#F5F5F5" }}>
      <style>{`
        .admin-nav-link { transition: all 0.15s; }
        .admin-nav-link:hover { background: rgba(255,255,255,0.05) !important; }
        @media (max-width: 768px) {
          .admin-desktop-nav { display: none !important; }
          .admin-mobile-btn { display: flex !important; }
        }
        @media (min-width: 769px) {
          .admin-mobile-menu { display: none !important; }
          .admin-mobile-btn { display: none !important; }
        }
      `}</style>

        {/* NAVBAR */}
        <nav style={{ background: "#0A0A0A", borderBottom: "0.5px solid #1a1a1a", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 2rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: "56px" }}>

          {/* LOGO + LİNKLER */}
          <div style={{ display: "flex", alignItems: "center", gap: "0" }}>
            <Link href="/admin" style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.3rem", fontWeight: 300, color: "#fff", textDecoration: "none", letterSpacing: "0.1em", marginRight: "2rem", flexShrink: 0 }}>
              LU<em style={{ fontStyle: "italic", color: "#959595" }}>IR</em>
              <span style={{ fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#d5d5d5", marginLeft: "8px", verticalAlign: "middle" }}>Admin</span>
            </Link>

            {/* MASAÜSTÜ NAV */}
            <div className="admin-desktop-nav" style={{ display: "flex", alignItems: "center" }}>
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="admin-nav-link"
                  style={{
                    display: "flex", alignItems: "center", gap: "7px",
                    padding: "0 14px", height: "56px",
                    fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase",
                    color: isActive(link.href, link.exact) ? "#fff" : "#a3a3a3",
                    textDecoration: "none",
                    borderBottom: isActive(link.href, link.exact) ? "2px solid #fff" : "2px solid transparent",
                    fontFamily: "var(--font-dm-sans)",
                  }}
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* SAĞ: HIZLI EKLE + KULLANICI */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Link
              href="/admin/products/add"
              style={{ display: "flex", alignItems: "center", gap: "6px", background: "#fff", color: "#0A0A0A", padding: "6px 14px", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", textDecoration: "none", fontFamily: "var(--font-dm-sans)", fontWeight: 500 }}
            >
              <Plus size={12} /> Urun Ekle
            </Link>

            <div className="admin-desktop-nav" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {adminEmail && (
                <span style={{ fontSize: "11px", color: "#979696", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {adminEmail}
                </span>
              )}
              <button
                onClick={handleLogout}
                style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "0.5px solid #2a2a2a", color: "#8f8f8f", padding: "6px 12px", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", fontFamily: "var(--font-dm-sans)" }}
              >
                <LogOut size={11} /> Cikis
              </button>
            </div>

            {/* MOBİL MENÜ BUTONU */}
            <button
              className="admin-mobile-btn"
              onClick={() => setMenuOpen(!menuOpen)}
              style={{ display: "none", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: "#888", width: "36px", height: "36px" }}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* MOBİL MENÜ */}
        {menuOpen && (
          <div className="admin-mobile-menu" style={{ background: "#0A0A0A", borderTop: "0.5px solid #1a1a1a", padding: "0.5rem 0" }}>
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  padding: "12px 2rem",
                  fontSize: "12px", letterSpacing: "0.1em", textTransform: "uppercase",
                  color: isActive(link.href, link.exact) ? "#fff" : "#a5a5a5",
                  textDecoration: "none",
                  background: isActive(link.href, link.exact) ? "rgba(255,255,255,0.05)" : "transparent",
                  fontFamily: "var(--font-dm-sans)",
                  borderLeft: isActive(link.href, link.exact) ? "2px solid #fff" : "2px solid transparent",
                }}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
            <div style={{ borderTop: "0.5px solid #1a1a1a", margin: "8px 0", padding: "12px 2rem" }}>
              {adminEmail && (
                <div style={{ fontSize: "11px", color: "#adadad", marginBottom: "10px" }}>{adminEmail}</div>
              )}
              <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "0.5px solid #2a2a2a", color: "#aaaaaa", padding: "8px 14px", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", fontFamily: "var(--font-dm-sans)" }}>
                <LogOut size={11} /> Cikis
              </button>
            </div>
          </div>
        )}
      </nav>
        <div style={{ paddingTop: "110px" }}>
          {children}
        </div>
       </div>
      </body>
    </html>
  )
}