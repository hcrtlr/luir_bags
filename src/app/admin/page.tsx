"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Package, Users, ShoppingBag, Tag, LogOut, Plus, Settings, RotateCcw } from "lucide-react"

export default function AdminPage() {
  const router = useRouter()
  const supabase = createClient()
  const [stats, setStats] = useState({ products: 0, users: 0, orders: 0, categories: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/admin/login"); return }
      const { data: adminData } = await supabase.from("admins").select("id").eq("id", user.id).single()
      if (!adminData) { router.push("/admin/login"); return }

      const [
        { count: products },
        { count: users },
        { count: orders },
        { count: categories },
      ] = await Promise.all([
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("users").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("*", { count: "exact", head: true }),
        supabase.from("categories").select("*", { count: "exact", head: true }),
      ])

      setStats({ products: products || 0, users: users || 0, orders: orders || 0, categories: categories || 0 })
      setLoading(false)
    }
    checkAdmin()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/admin/login")
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#888" }}>Yukleniyor...</p>
    </div>
  )

  return (
    <div style={{ minHeight: "100vh", background: "#F5F5F5" }}>


        {/* İSTATİSTİKLER */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
          {[
            { label: "Toplam Urun", value: stats.products, icon: <Package size={20} />, color: "#0A0A0A" },
            { label: "Kullanici", value: stats.users, icon: <Users size={20} />, color: "#185FA5" },
            { label: "Siparis", value: stats.orders, icon: <ShoppingBag size={20} />, color: "#3B6D11" },
            { label: "Kategori", value: stats.categories, icon: <Tag size={20} />, color: "#854F0B" },
          ].map(stat => (
            <div key={stat.label} style={{ background: "#fff", padding: "1.5rem", border: "0.5px solid #e0e0e0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#888", marginBottom: "0.5rem" }}>{stat.label}</div>
                <div style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "2rem", fontWeight: 300, color: stat.color }}>{stat.value}</div>
              </div>
              <div style={{ color: "#ddd" }}>{stat.icon}</div>
            </div>
          ))}
        </div>

        {/* YÖNETİM KARTLARI */}
        <div style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#888", marginBottom: "1rem" }}>
          Yonetim
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>

          {/* ÜRÜN EKLE */}
          <Link href="/admin/products/add" style={{ background: "#0A0A0A", padding: "1.8rem", textDecoration: "none", display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ width: "44px", height: "44px", border: "0.5px solid #222", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0 }}>
              <Plus size={20} />
            </div>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 500, color: "#fff", marginBottom: "3px" }}>Yeni Urun Ekle</div>
              <div style={{ fontSize: "11px", color: "#555" }}>Urun, varyant ve gorsel ekle</div>
            </div>
          </Link>

          {/* ÜRÜNLERİ YÖNET */}
          <Link href="/admin/products" style={{ background: "#fff", padding: "1.8rem", border: "0.5px solid #e0e0e0", textDecoration: "none", display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ width: "44px", height: "44px", border: "0.5px solid #e0e0e0", display: "flex", alignItems: "center", justifyContent: "center", color: "#0A0A0A", flexShrink: 0 }}>
              <Package size={20} />
            </div>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 500, color: "#0A0A0A", marginBottom: "3px" }}>Urunleri Yonet</div>
              <div style={{ fontSize: "11px", color: "#888" }}>Duzenle, sil, aktif/pasif yap</div>
            </div>
          </Link>

          {/* SİPARİŞLERİ YÖNET */}
          <Link href="/admin/orders" style={{ background: "#fff", padding: "1.8rem", border: "0.5px solid #e0e0e0", textDecoration: "none", display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ width: "44px", height: "44px", border: "0.5px solid #e0e0e0", display: "flex", alignItems: "center", justifyContent: "center", color: "#0A0A0A", flexShrink: 0 }}>
              <ShoppingBag size={20} />
            </div>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 500, color: "#0A0A0A", marginBottom: "3px" }}>Siparisleri Yonet</div>
              <div style={{ fontSize: "11px", color: "#888" }}>Durum guncelle, detay gor</div>
            </div>
          </Link>

          {/* KATEGORİLERİ YÖNET */}
          <Link href="/admin/categories" style={{ background: "#fff", padding: "1.8rem", border: "0.5px solid #e0e0e0", textDecoration: "none", display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ width: "44px", height: "44px", border: "0.5px solid #e0e0e0", display: "flex", alignItems: "center", justifyContent: "center", color: "#0A0A0A", flexShrink: 0 }}>
              <Tag size={20} />
            </div>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 500, color: "#0A0A0A", marginBottom: "3px" }}>Kategorileri Yonet</div>
              <div style={{ fontSize: "11px", color: "#888" }}>Ekle, duzenle, gorsel yukle</div>
            </div>
          </Link>

        </div>
      </div>
  )
}
