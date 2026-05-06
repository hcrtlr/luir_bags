"use client"
import type React from "react"
import Link from "next/link"

export default function Footer() {
  return (
    <footer style={{ background: "#0A0A0A" }}>

      {/* ÖZELLİKLER */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", borderTop: "0.5px solid #efefef", borderBottom: "0.5px solid #111" }}>
        {[
          {
            icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H1"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
            title: "Hızlı Teslimat",
            desc: "500TL üzeri ücretsiz, 1-5 iş günü"
          },
          {
            icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/></svg>,
            title: "Ücretsiz İade",
            desc: "30 gün koşulsuz iade garantisi"
          },
          {
            icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
            title: "Güvenli Ödeme",
            desc: "iyzico altyapısı, SSL şifreli"
          },
          {
            icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
            title: "Global Garanti",
            desc: "Dünya geneli servis desteği"
          },
        ].map((f, i) => (
          <div key={i} style={{ padding: "2.2rem 1.8rem", borderRight: "0.5px solid #111", textAlign: "center" }}>
            <div style={{ color: "#a2a2a2", display: "flex", justifyContent: "center", marginBottom: "0.8rem" }}>{f.icon}</div>
            <div style={{ fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#fff", marginBottom: "0.4rem" }}>{f.title}</div>
            <div style={{ fontSize: "11px", color: "#a2a2a2", lineHeight: 1.7 }}>{f.desc}</div>
          </div>
        ))}
      </div>

      {/* NEWSLETTER */}
      <div style={{ padding: "4rem 3rem", display: "flex", gap: "4rem", alignItems: "center", justifyContent: "center", borderBottom: "0.5px solid #111", flexWrap: "wrap" as const }}>
        <div style={{ maxWidth: "360px" }}>
          <p style={{ fontSize: "9px", letterSpacing: "0.25em", textTransform: "uppercase", color: "#a2a2a2", marginBottom: "0.8rem" }}>Haberdar Olun</p>
          <h2 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "clamp(1.8rem,3vw,2.5rem)", fontWeight: 300, color: "#fff", lineHeight: 1.1 }}>
            Yeni koleksiyonları<br />
            <em style={{ fontStyle: "italic", color: "#a2a2a2" }}>ilk siz görün.</em>
          </h2>
        </div>
        <div style={{ maxWidth: "400px", flex: 1, minWidth: "260px" }}>
          <p style={{ fontSize: "12px", color: "#a2a2a2", lineHeight: 1.8, marginBottom: "1.2rem" }}>
            Özel teklifler ve yeni koleksiyon duyuruları için bültenimize katılın.
          </p>
          <div style={{ display: "flex", border: "0.5px solid #a2a2a2" }}>
            <input
              type="email"
              placeholder="ornek@email.com"
              style={{ flex: 1, border: "none", padding: "10px 14px", fontSize: "12px", outline: "none", background: "rgba(255,255,255,0.03)", fontFamily: "var(--font-dm-sans)", color: "#fff" }}
            />
            <button style={{ background: "#fff", color: "#0A0A0A", border: "none", padding: "10px 18px", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", fontFamily: "var(--font-dm-sans)", whiteSpace: "nowrap" as const }}>
              Abone Ol
            </button>
          </div>
        </div>
      </div>

      {/* LİNKLER */}
      <div style={{ padding: "3rem", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "3rem" }}>
        <div>
          <Link href="/customer" style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.5rem", fontWeight: 300, color: "#fff", letterSpacing: "0.08em", display: "block", marginBottom: "0.8rem", textDecoration: "none" }}>
            LU<em style={{ fontStyle: "italic", color: "#837d7d" }}>IR</em>
          </Link>
          <p style={{ fontSize: "12px", color: "#837d7d", lineHeight: 1.7, maxWidth: "220px", marginBottom: "1.2rem" }}>
            Özenle seçilmiş çanta ve valizler. Her yolculuk için, her an için.
          </p>
          <div style={{ display: "flex", gap: "8px" }}>
            {[
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>,
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg>,
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.95C18.88 4 12 4 12 4s-6.88 0-8.59.47A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.95C5.12 20 12 20 12 20s6.88 0 8.59-.47a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/></svg>
            ].map((icon, i) => (
              <div key={i} style={{ width: "30px", height: "30px", border: "0.5px solid #a2a2a2", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#837d7d" }}>
                {icon}
              </div>
            ))}
          </div>
        </div>

        {[
          {
            title: "Alışveriş",
            links: [
              { label: "Kadın Çantaları", href: "/customer/products?category=women" },
              { label: "Erkek Çantaları", href: "/customer/products?category=men" },
              { label: "Unisex", href: "/customer/products?category=unisex" },
              { label: "Çocuk", href: "/customer/products?category=kids" },
              { label: "Luggage", href: "/customer/products?category=luggage" },
              { label: "Sale", href: "/customer/products?sale=true" },
            ]
          },
          {
            title: "Yardım",
            links: [
              { label: "Kargo & İade", href: "/customer/kargo-iade" },
              { label: "Boyut Rehberi", href: "/customer/boyut-rehberi" },
              { label: "Bakım Talimatları", href: "/customer/bakim-talimatlari" },
              { label: "Sipariş Takip", href: "/customer/profile/orders" },
              { label: "SSS", href: "/customer/sss" },
            ]
          },
          {
            title: "Kurumsal",
            links: [
              { label: "Hakkımızda", href: "/customer/hakkimizda" },
              { label: "Sürdürülebilirlik", href: "/customer/surdurulebilirlik" },
              { label: "Kariyer", href: "/customer/kariyer" },
              { label: "Basın", href: "/customer/basin" },
              { label: "İletişim", href: "/customer/iletisim" },
            ]
          },
        ].map(col => (
          <div key={col.title}>
            <p style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#837d7d", marginBottom: "0.8rem" }}>{col.title}</p>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {col.links.map(l => (
                <li key={l.label}>
                  <Link href={l.href} style={{ fontSize: "12px", color: "#837d7d", textDecoration: "none" }}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div style={{ gridColumn: "1/-1", borderTop: "0.5px solid #111", paddingTop: "1.5rem", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
          <span style={{ fontSize: "11px", color: "#a2a2a2" }}>© 2025 Luir Bags. Tüm hakları saklıdır.</span>
          <span style={{ fontSize: "11px", color: "#a2a2a2" }}>Gizlilik Politikası · Kullanım Koşulları · Çerez Ayarları</span>
        </div>
      </div>

    </footer>
  )
}