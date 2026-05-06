"use client"
import type React from "react"
import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react"

const BASE = "https://pgtfwwkfabjjipbavkjl.supabase.co/storage/v1/object/public/category-images/"

type Category = {
  id: number
  name: string
  slug: string
  image_url: string | null
  sort_order: number
  parent_id: number | null
}

type Product = {
  id: number
  name: string
  created_at: string
  product_variants: {
    id: number
    price: number
    product_images: { image_url: string; is_primary: boolean }[]
    variant_attributes: { attribute_values: { value: string } }[]
  }[]
}

const slides = [
  {
    eyebrow: "Yeni Sezon 2025",
    title: "Tasidigın sey",
    titleEm: "seni tanimlar.",
    desc: "Her yolculuk icin secilmis, her an icin tasarlanmis koleksiyon.",
    img: BASE + "yeni-sezon.jpg",
    badge: { label: "Yeni Sezon", value: "2025", sub: "Spring / Summer" },
    primary: { label: "Koleksiyonu Gor", href: "/customer/products" },
    secondary: { label: "Kampanyalar", href: "/customer/products?sale=true" },
  },
  {
    eyebrow: "Seyahat Koleksiyonu",
    title: "Her yolculuga",
    titleEm: "hazir valizler.",
    desc: "Kabin boy valizlerden buyuk boy bavullara, guvenilir yol arkadasiniz.",
    img: BASE + "seyahat.jpg",
    badge: { label: "Kampanya", value: "%20", sub: "Secili valizlerde" },
    primary: { label: "Valiz Koleksiyonu", href: "/customer/products?category=luggage" },
    secondary: null,
  },
  {
    eyebrow: "Kadin Cantaları",
    title: "Zarafet her",
    titleEm: "detayda gizli.",
    desc: "Kol cantalarindan sirt cantalarindan, gunluk sikliginiz icin.",
    img: BASE + "kadin-1.jpg",
    badge: null,
    primary: { label: "Kadin Koleksiyonu", href: "/customer/products?category=female" },
    secondary: { label: "Indirimliler", href: "/customer/products?sale=true" },
  },
]

export default function HomePage() {
  const supabase = createClient()
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [currentSlide, setCurrentSlide] = useState(0)
  const timer = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const fetchAll = async () => {
      const { data: cats } = await supabase
        .from("categories")
        .select("id, name, slug, image_url, sort_order, parent_id")
        .is("parent_id", null)
        .order("sort_order")
        .limit(12)
      setCategories(cats || [])

      const { data: prods } = await supabase
        .from("products")
        .select(`
          id, name, created_at,
          product_variants (
            id, price,
            product_images ( image_url, is_primary ),
            variant_attributes ( attribute_values ( value ) )
          )
        `)
        .order("created_at", { ascending: false })
        .limit(6)
      setProducts((prods as any) || [])
      setLoadingProducts(false)
    }
    fetchAll()
  }, [])

  useEffect(() => {
    timer.current = setInterval(() => setCurrentSlide(p => (p + 1) % slides.length), 5000)
    return () => { if (timer.current) clearInterval(timer.current) }
  }, [])

  const goSlide = (n: number) => {
    setCurrentSlide(n)
    if (timer.current) clearInterval(timer.current)
    timer.current = setInterval(() => setCurrentSlide(p => (p + 1) % slides.length), 5000)
  }

  const getImg = (prod: Product) => {
    const imgs = prod.product_variants?.flatMap(v => v.product_images || []) || []
    return imgs.find(i => i.is_primary)?.image_url || imgs[0]?.image_url || null
  }

  const getPrice = (prod: Product) => {
    const prices = prod.product_variants?.map(v => v.price).filter(Boolean) || []
    return prices.length ? Math.min(...prices) : null
  }

  const fmt = (p: number) => p.toLocaleString("tr-TR") + " TL"

  return (
    <main style={{ background: "#fff", minHeight: "100vh" }}>
      <style>{`
        @keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes shimmer { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @media (max-width: 768px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .hero-right { display: none !important; }
          .prod-grid { grid-template-columns: repeat(2,1fr) !important; }
          .camp-grid { grid-template-columns: 1fr !important; }
          .sec { padding: 2rem 1.2rem !important; }
        }
      `}</style>

      {/* HERO */}
<section
  style={{
    position: "relative",
    height: "520px",
    background: "#0A0A0A",
    overflow: "hidden",
  }}
>
  {slides.map((slide, i) => (
    <div
      key={i}
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "row",
        opacity: currentSlide === i ? 1 : 0,
        transition: "opacity 0.7s",
        pointerEvents: currentSlide === i ? "auto" : "none",
      }}
      className="hero-slide"
    >
      {/* TEXT */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "4rem",
          zIndex: 2,
        }}
        className="hero-text"
      >
        <p style={{ fontSize: "10px", letterSpacing: "0.25em", textTransform: "uppercase", color: "#555", marginBottom: "1rem" }}>
          {slide.eyebrow}
        </p>

        <h1
          style={{
            fontFamily: "var(--font-cormorant), serif",
            fontSize: "clamp(2rem, 4vw, 3.5rem)",
            fontWeight: 300,
            color: "#fff",
            lineHeight: 1.08,
            marginBottom: "1.2rem",
          }}
        >
          {slide.title}
          <br />
          <em style={{ fontStyle: "italic", color: "#555" }}>{slide.titleEm}</em>
        </h1>

        <p
          style={{
            fontSize: "13px",
            color: "#777",
            lineHeight: 1.8,
            maxWidth: "340px",
            marginBottom: "2rem",
          }}
        >
          {slide.desc}
        </p>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <Link
            href={slide.primary.href}
            style={{
              background: "#fff",
              color: "#0A0A0A",
              padding: "11px 24px",
              fontSize: "10px",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              fontFamily: "var(--font-dm-sans)",
              textDecoration: "none",
            }}
          >
            {slide.primary.label}
          </Link>

          {slide.secondary && (
            <Link
              href={slide.secondary.href}
              style={{
                background: "transparent",
                color: "#fff",
                border: "1px solid #2a2a2a",
                padding: "11px 24px",
                fontSize: "10px",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                fontFamily: "var(--font-dm-sans)",
                textDecoration: "none",
              }}
            >
              {slide.secondary.label}
            </Link>
          )}
        </div>
      </div>

      {/* IMAGE */}
      <div
        style={{
          flex: 1,
          position: "relative",
          background: "#111",
          overflow: "hidden",
        }}
        className="hero-image"
      >
        <img
          src={slide.img}
          alt=""
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.75,
          }}
        />

        {slide.badge && (
          <div
            style={{
              position: "absolute",
              bottom: "2rem",
              left: "2rem",
              background: "rgba(255,255,255,0.95)",
              padding: "1rem 1.4rem",
            }}
          >
            <span style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#888" }}>
              {slide.badge.label}
            </span>
            <span
              style={{
                fontFamily: "var(--font-cormorant), serif",
                fontSize: "2.2rem",
                fontWeight: 300,
                display: "block",
                lineHeight: 1,
                color: "#0A0A0A",
              }}
            >
              {slide.badge.value}
            </span>
            <span style={{ fontSize: "9px", color: "#888" }}>{slide.badge.sub}</span>
          </div>
        )}
      </div>
    </div>
  ))}


</section>

      {/* MARQUEE */}
      <div style={{ borderTop: "0.5px solid #efefef", borderBottom: "0.5px solid #efefef", padding: "0.65rem 0", overflow: "hidden" }}>
        <div style={{ display: "flex", gap: "3rem", whiteSpace: "nowrap" as const, animation: "marquee 28s linear infinite" }}>
          {[...Array(3)].map((_, ri) =>
            ["500 TL uzeri ucretsiz kargo", "El isciligi deri urunler", "Yeni sezon koleksiyonu", "Dunya geneli teslimat", "30 gun iade garantisi", "Premium malzemeler"].map((t, i) => (
              <span key={ri + "-" + i} style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#999", display: "inline-flex", alignItems: "center", gap: "1.5rem", flexShrink: 0 }}>
                <span style={{ width: "3px", height: "3px", background: "#ddd", borderRadius: "50%", display: "inline-block" }} />
                {t}
              </span>
            ))
          )}
        </div>
      </div>

      {/* KATEGORİLER */}
      <section className="sec" style={{ padding: "4rem 3rem 2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2rem" }}>
          <h2 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "2rem", fontWeight: 300 }}>Kategoriler</h2>
          <Link href="/customer/products" style={{ fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#bbb", textDecoration: "none", borderBottom: "0.5px solid #e0e0e0", paddingBottom: "2px" }}>Tumunu Gor</Link>
        </div>
        <div style={{ display: "flex", gap: "28px", overflowX: "auto", paddingBottom: "8px", scrollbarWidth: "none" as const }}>
          {categories.map(cat => {
            const imgUrl = cat.image_url || (BASE + cat.slug + ".jpg")
            return (
              <Link key={cat.id} href={"/customer/products?slug=" + cat.slug} style={{ display: "flex", flexDirection: "column" as const, alignItems: "center", gap: "10px", flexShrink: 0, textDecoration: "none" }}>
                <div
                  style={{ width: "80px", height: "80px", borderRadius: "50%", overflow: "hidden", border: "1.5px solid #efefef", transition: "all 0.2s", cursor: "pointer" }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "#0A0A0A"; el.style.transform = "scale(1.05)" }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "#efefef"; el.style.transform = "scale(1)" }}
                >
                  <img
                    src={imgUrl}
                    alt={cat.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={e => { (e.target as HTMLImageElement).style.display = "none" }}
                  />
                </div>
                <span style={{ fontSize: "11px", color: "#666", textAlign: "center" as const, whiteSpace: "nowrap" as const }}>{cat.name}</span>
              </Link>
            )
          })}
        </div>
      </section>

      {/* ÜRÜNLER */}
      <section className="sec" style={{ padding: "2rem 3rem 4rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2rem" }}>
          <div>
            <h2 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "2rem", fontWeight: 300 }}>Yeni Gelenler</h2>
            <p style={{ fontSize: "11px", color: "#bbb", marginTop: "4px" }}>En son eklenen urunler</p>
          </div>
          <Link href="/customer/products" style={{ fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#bbb", textDecoration: "none", borderBottom: "0.5px solid #e0e0e0", paddingBottom: "2px" }}>Tumu Gor</Link>
        </div>

        <div className="prod-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", border: "0.5px solid #efefef" }}>
          {loadingProducts ? (
            [...Array(6)].map((_, i) => (
              <div key={i} style={{ border: "0.5px solid #efefef" }}>
                <div style={{ aspectRatio: "1", background: "#f5f5f5", animation: "shimmer 1.5s infinite" }} />
                <div style={{ padding: "1rem" }}>
                  <div style={{ height: "12px", background: "#f0f0f0", marginBottom: "8px", width: "70%", animation: "shimmer 1.5s infinite" }} />
                  <div style={{ height: "12px", background: "#f0f0f0", width: "40%", animation: "shimmer 1.5s infinite" }} />
                </div>
              </div>
            ))
          ) : products.length === 0 ? (
            <div style={{ gridColumn: "1/-1", padding: "4rem", textAlign: "center" as const, color: "#bbb", fontSize: "13px" }}>
              Henuz urun eklenmemis.
            </div>
          ) : products.map((prod, i) => {
            const img = getImg(prod)
            const price = getPrice(prod)
            return (
              <Link
                key={prod.id}
                href={"/customer/products/" + prod.id}
                style={{ border: "0.5px solid #efefef", textDecoration: "none", color: "inherit", display: "block", background: "#fff", transition: "background 0.2s" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#fafafa"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "#fff"}
              >
                <div style={{ aspectRatio: "1", background: "#f8f8f8", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                  {img ? (
                    <img src={img} alt={prod.name} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s" }} />
                  ) : (
                    <svg width="70" height="70" viewBox="0 0 100 100" fill="none" opacity="0.2">
                      <rect x="20" y="35" width="60" height="50" rx="6" fill="#B8A99A"/>
                      <path d="M35 35 Q35 20 50 20 Q65 20 65 35" fill="none" stroke="#8B6F5E" strokeWidth="4" strokeLinecap="round"/>
                    </svg>
                  )}
                  {i < 2 && (
                    <span style={{ position: "absolute", top: "10px", left: "10px", fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", padding: "3px 8px", background: "#0A0A0A", color: "#fff" }}>
                      Yeni
                    </span>
                  )}
                </div>
                <div style={{ padding: "1rem 1.1rem" }}>
                  <div style={{ fontFamily: "--font-cormorant, serif", fontSize: "1rem", fontWeight: 400, marginBottom: "6px", lineHeight: 1.3 }}>
                    {prod.name}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "13px", fontWeight: 500 }}>{price ? fmt(price) : "—"}</span>
                    <div style={{ width: "30px", height: "30px", border: "0.5px solid #e8e8e8", display: "flex", alignItems: "center", justifyContent: "center", color: "#bbb" }}>
                      <ShoppingBag size={12} />
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* KAMPANYA */}
      <div className="camp-grid sec" style={{ display: "grid", gridTemplateColumns: "5fr 4fr", margin: "0 3rem 4rem", overflow: "hidden", border: "0.5px solid #efefef" }}>
        <div style={{ background: "#0A0A0A", padding: "3.5rem", display: "flex", flexDirection: "column" as const, justifyContent: "center" }}>
          <p style={{ fontSize: "9px", letterSpacing: "0.25em", textTransform: "uppercase", color: "#444", marginBottom: "0.8rem" }}>Ozel Kampanya</p>
          <h2 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "clamp(2rem,3vw,2.8rem)", fontWeight: 300, color: "#fff", lineHeight: 1.1, marginBottom: "0.8rem" }}>
            Secili urunlerde<br /><em style={{ fontStyle: "italic", color: "#666" }}>%20 indirim.</em>
          </h2>
          <p style={{ fontSize: "12px", color: "#555", lineHeight: 1.8, marginBottom: "1.8rem", maxWidth: "300px" }}>
            Bu hafta sonu tum seyahat aksesuarlarinda ozel indirimler. Kacirmayin.
          </p>
          <Link href="/customer/products?sale=true" style={{ background: "#fff", color: "#0A0A0A", padding: "11px 24px", fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "var(--font-dm-sans)", textDecoration: "none", display: "inline-block", alignSelf: "flex-start" }}>
            Alisverise Basla
          </Link>
        </div>
        <div style={{ position: "relative", minHeight: "300px", background: "#111", overflow: "hidden" }}>
          <img
            src={BASE + "ozel-kampanya.jpg"}
            alt="Kampanya"
            style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.75, position: "absolute", inset: 0 }}
            onError={e => { (e.target as HTMLImageElement).style.opacity = "0" }}
          />
          <div style={{ position: "absolute", top: "2rem", right: "2rem", background: "rgba(255,255,255,0.95)", padding: "0.8rem 1.2rem", textAlign: "center" as const, zIndex: 2 }}>
            <span style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "2rem", fontWeight: 300, color: "#0A0A0A", display: "block", lineHeight: 1 }}>%20</span>
            <span style={{ fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#888" }}>indirim</span>
          </div>
        </div>
      </div>

    </main>
  )
}