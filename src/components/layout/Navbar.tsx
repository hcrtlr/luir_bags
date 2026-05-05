"use client"

import Link from "next/link"
import { useEffect, useRef, useState, useCallback } from "react"
import { Search, User, ShoppingBag, Menu, X, Heart } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const navItems = [
  { label: "Kadin", href: "/customer/products?category=female" },
  { label: "Erkek", href: "/customer/products?category=male" },
  { label: "Unisex", href: "/customer/products?category=unisex" },
  { label: "Cocuk", href: "/customer/products?category=kids" },
  { label: "Luggage", href: "/customer/products?category=luggage" },
  { label: "Sale", href: "/customer/products?sale=true" },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const [isMobile, setIsMobile] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [cartCount, setCartCount] = useState(0)
  const [favCount, setFavCount] = useState(0)
  const searchRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const fetchCounts = useCallback(async (userId: string) => {
    const { data: cart } = await supabase
      .from("carts").select("id").eq("user_id", userId).single()

    if (cart) {
      const { data: items } = await supabase
        .from("cart_items").select("quantity").eq("cart_id", cart.id)
      setCartCount(items?.reduce((s, i) => s + i.quantity, 0) || 0)
    } else {
      setCartCount(0)
    }

    const { count } = await supabase
      .from("favorites")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
    setFavCount(count || 0)
  }, [])

  useEffect(() => {
    const checkScreen = () => setIsMobile(window.innerWidth < 992)
    checkScreen()
    window.addEventListener("resize", checkScreen)
    return () => window.removeEventListener("resize", checkScreen)
  }, [])

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
      if (data.user) fetchCounts(data.user.id)
    }
    init()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchCounts(session.user.id)
      else { setCartCount(0); setFavCount(0) }
    })

    return () => listener.subscription.unsubscribe()
  }, [fetchCounts])

  // Gercek zamanli dinle
  useEffect(() => {
    if (!user) return

    const cartCh = supabase
      .channel("navbar-cart")
      .on("postgres_changes", { event: "*", schema: "public", table: "cart_items" }, () => {
        fetchCounts(user.id)
      })
      .subscribe()

    const favCh = supabase
      .channel("navbar-fav")
      .on("postgres_changes", { event: "*", schema: "public", table: "favorites" }, () => {
        fetchCounts(user.id)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(cartCh)
      supabase.removeChannel(favCh)
    }
  }, [user, fetchCounts])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false)
      }
    }
    if (searchOpen) document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [searchOpen])

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && searchValue.trim()) {
      window.location.href = "/customer/products?search=" + encodeURIComponent(searchValue)
    }
  }

  const CountBadge = ({ count }: { count: number }) => {
    if (count === 0) return null
    return (
      <span style={{ position: "absolute", top: "-6px", right: "-6px", background: "var(--foreground)", color: "#fff", borderRadius: "50%", width: "16px", height: "16px", fontSize: "9px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600 }}>
        {count > 9 ? "9+" : count}
      </span>
    )
  }

  return (
    <header style={{ position: "fixed", top: 0, width: "100%", zIndex: 100, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(8px)", borderBottom: "1px solid var(--border)" }}>

      {/* UST BANNER */}
      <div style={{ background: "var(--foreground)", color: "#fff", textAlign: "center", padding: "0.5rem", fontSize: isMobile ? "0.55rem" : "0.68rem", letterSpacing: "0.2em", textTransform: "uppercase" }}>
        Turkiye geneli ucretsiz kargo | 500 TL uzeri siparislerde
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: isMobile ? "1rem 1.2rem" : "1.2rem 3rem", maxWidth: "1400px", margin: "0 auto", gap: "1rem" }}>

        {isMobile && (
          <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", display: "flex" }}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        )}

        <Link href="/customer" style={{ fontFamily: "var(--font-cormorant), serif", fontSize: isMobile ? "1.5rem" : "1.8rem", fontWeight: 300, letterSpacing: "0.1em", color: "var(--foreground)", textDecoration: "none", flexShrink: 0 }}>
          LUIR
        </Link>

        {!isMobile && (
          <ul style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "2.5rem", listStyle: "none", flex: 1, margin: 0, padding: 0 }}>
            {navItems.map(item => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  style={{ fontSize: "0.74rem", letterSpacing: "0.16em", textTransform: "uppercase", color: item.label === "Sale" ? "var(--foreground)" : "var(--muted)", fontWeight: item.label === "Sale" ? 500 : 400, textDecoration: "none", transition: "color 0.2s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "var(--foreground)")}
                  onMouseLeave={e => (e.currentTarget.style.color = item.label === "Sale" ? "var(--foreground)" : "var(--muted)")}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "0.9rem" : "1.2rem" }}>

          <button onClick={() => setSearchOpen(!searchOpen)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", display: "flex" }}>
            {searchOpen ? <X size={18} /> : <Search size={18} />}
          </button>

          <Link href={user ? "/customer/profile" : "/customer/login"} style={{ color: "var(--muted)", display: "flex" }}>
            <User size={18} />
          </Link>

          {user && (
            <Link href="/customer/profile/favorites" style={{ color: "var(--muted)", display: "flex", position: "relative" }}>
              <Heart size={18} />
              <CountBadge count={favCount} />
            </Link>
          )}

          <Link href="/customer/cart" style={{ color: "var(--muted)", display: "flex", position: "relative" }}>
            <ShoppingBag size={18} />
            <CountBadge count={cartCount} />
          </Link>

        </div>
      </div>

      {/* ARAMA */}
      {searchOpen && (
        <div ref={searchRef} style={{ borderTop: "1px solid var(--border)", padding: isMobile ? "1rem 1.2rem" : "1rem 3rem", background: "#fff" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", maxWidth: "1400px", margin: "0 auto" }}>
            <Search size={14} color="var(--muted)" />
            <input
              autoFocus
              type="text"
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
              onKeyDown={handleSearch}
              placeholder="Urun ara..."
              style={{ flex: 1, border: "none", borderBottom: "1px solid var(--foreground)", padding: "0.5rem 0", fontSize: "0.95rem", fontFamily: "var(--font-dm-sans)", outline: "none", background: "transparent", color: "var(--foreground)" }}
            />
          </div>
        </div>
      )}

      {/* MOBIL MENU */}
      {menuOpen && isMobile && (
        <div style={{ borderTop: "1px solid var(--border)", background: "#fff", padding: "2rem 1.5rem", display: "flex", flexDirection: "column" as const, gap: "1.5rem" }}>
          {navItems.map(item => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              style={{ fontSize: "1.25rem", fontFamily: "var(--font-cormorant), serif", fontWeight: item.label === "Sale" ? 500 : 300, color: item.label === "Sale" ? "var(--foreground)" : "var(--muted)", textDecoration: "none", letterSpacing: "0.05em" }}
            >
              {item.label}
            </Link>
          ))}
          <div style={{ borderTop: "0.5px solid #f0f0f0", paddingTop: "1rem", display: "flex", flexDirection: "column" as const, gap: "1rem" }}>
            <Link href={user ? "/customer/profile" : "/customer/login"} onClick={() => setMenuOpen(false)} style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "0.85rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)", textDecoration: "none" }}>
              {user ? "Profilim" : "Giris Yap"}
            </Link>
            {user && (
              <>
                <Link href="/customer/profile/favorites" onClick={() => setMenuOpen(false)} style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "0.85rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)", textDecoration: "none" }}>
                  Favorilerim {favCount > 0 && "(" + favCount + ")"}
                </Link>
                <Link href="/customer/cart" onClick={() => setMenuOpen(false)} style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "0.85rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)", textDecoration: "none" }}>
                  Sepetim {cartCount > 0 && "(" + cartCount + ")"}
                </Link>
              </>
            )}
          </div>
        </div>
      )}

    </header>
  )
}