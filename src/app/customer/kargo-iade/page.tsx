import Link from "next/link"
import { ArrowLeft, Truck, RotateCcw, Clock, Package } from "lucide-react"

export default function KargoIadePage() {
  return (
    <main style={{ minHeight: "100vh", background: "#fff" }}>

      <div style={{ background: "#0A0A0A", padding: "4rem 3rem" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <Link href="/customer" style={{ fontSize: "11px", color: "#555", textDecoration: "none", letterSpacing: "0.1em", textTransform: "uppercase", display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "1.5rem" }}>
            <ArrowLeft size={12} /> Ana Sayfa
          </Link>
          <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "clamp(2.5rem, 5vw, 4rem)", fontWeight: 300, color: "#fff", lineHeight: 1.1 }}>
            Kargo &amp; İade
          </h1>
          <p style={{ fontSize: "14px", color: "#666", marginTop: "1rem", lineHeight: 1.8 }}>
            Siparişlerinizin güvenli ve hızlı teslimi için çalışıyoruz.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "4rem 3rem" }}>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem", marginBottom: "4rem" }}>
          {[
            { icon: <Truck size={24} />, title: "Ücretsiz Kargo", desc: "500 TL ve üzeri siparişlerde Türkiye geneli ücretsiz kargo." },
            { icon: <Clock size={24} />, title: "1-3 İş Günü", desc: "Siparişleriniz onaylandıktan sonra 1-3 iş günü içinde teslim edilir." },
            { icon: <RotateCcw size={24} />, title: "30 Gün İade", desc: "Teslim tarihinden itibaren 30 gün içinde iade hakkı." },
            { icon: <Package size={24} />, title: "Özenli Paketleme", desc: "Ürünleriniz özel koruyucu ambalajla gönderilir." },
          ].map((item, i) => (
            <div key={i} style={{ padding: "1.5rem", border: "0.5px solid #efefef", textAlign: "center" as const }}>
              <div style={{ color: "#0A0A0A", marginBottom: "1rem", display: "flex", justifyContent: "center" }}>{item.icon}</div>
              <div style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.2rem", fontWeight: 300, marginBottom: "0.5rem" }}>{item.title}</div>
              <div style={{ fontSize: "12px", color: "#888", lineHeight: 1.7 }}>{item.desc}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column" as const, gap: "2.5rem" }}>

          <div>
            <h2 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.8rem", fontWeight: 300, marginBottom: "1rem", borderBottom: "0.5px solid #efefef", paddingBottom: "0.8rem" }}>
              Kargo Bilgileri
            </h2>
            <div style={{ fontSize: "14px", color: "#555", lineHeight: 2, display: "flex", flexDirection: "column" as const, gap: "0.8rem" }}>
              <p>Tüm siparişlerimiz <strong>Yurtiçi Kargo</strong> veya <strong>MNG Kargo</strong> aracılığıyla gönderilmektedir.</p>
              <p><strong>Standart Kargo:</strong> 129 TL — 1-3 iş günü teslimat</p>
              <p><strong>Ücretsiz Kargo:</strong> 500 TL ve üzeri siparişlerde geçerlidir</p>
              <p>Siparişiniz onaylandıktan sonra kargo takip numarası e-posta adresinize iletilir.</p>
              <p>Hafta sonu ve resmi tatillerde kargo kabul edilmemektedir.</p>
            </div>
          </div>

          <div>
            <h2 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.8rem", fontWeight: 300, marginBottom: "1rem", borderBottom: "0.5px solid #efefef", paddingBottom: "0.8rem" }}>
              İade Koşulları
            </h2>
            <div style={{ fontSize: "14px", color: "#555", lineHeight: 2, display: "flex", flexDirection: "column" as const, gap: "0.8rem" }}>
              <p>Teslim tarihinden itibaren <strong>30 gün</strong> içinde iade talebinde bulunabilirsiniz.</p>
              <p>İade edilecek ürünlerin <strong>kullanılmamış, etiketi sökülmemiş ve orijinal ambalajında</strong> olması gerekmektedir.</p>
              <p>İade kargo ücreti müşteriye aittir. Hatalı veya hasarlı ürünlerde kargo ücreti tarafımızca karşılanır.</p>
              <p>İade onaylandıktan sonra ödemeniz <strong>5-10 iş günü</strong> içinde iade edilir.</p>
            </div>
          </div>

          <div>
            <h2 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.8rem", fontWeight: 300, marginBottom: "1rem", borderBottom: "0.5px solid #efefef", paddingBottom: "0.8rem" }}>
              İade Nasıl Yapılır?
            </h2>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: "1rem" }}>
              {[
                { step: "01", title: "İade Talebi Oluşturun", desc: "Hesabınıza giriş yapın, siparişlerim bölümünden iade etmek istediğiniz ürünü seçin." },
                { step: "02", title: "Onay Bekleyin", desc: "İade talebiniz 1-3 iş günü içinde incelenir ve onay e-postası gönderilir." },
                { step: "03", title: "Kargoya Verin", desc: "İade kodunuzu kargo paketine ekleyerek anlaşmalı kargo şubelerimize teslim edin." },
                { step: "04", title: "İade Alın", desc: "Ürün bize ulaştıktan sonra 5-10 iş günü içinde ödemeniz iade edilir." },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", gap: "1.2rem", padding: "1.2rem", border: "0.5px solid #efefef" }}>
                  <div style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.8rem", fontWeight: 300, color: "#e0e0e0", flexShrink: 0, lineHeight: 1 }}>{item.step}</div>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 500, marginBottom: "4px" }}>{item.title}</div>
                    <div style={{ fontSize: "13px", color: "#888", lineHeight: 1.7 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "#F8F8F8", padding: "2rem", borderLeft: "3px solid #0A0A0A" }}>
            <p style={{ fontSize: "13px", color: "#555", lineHeight: 1.8 }}>
              Sorularınız için <strong>destek@luir.com</strong> adresine yazabilir veya <strong>0212 000 00 00</strong> numaralı hattımızı arayabilirsiniz.
              Hafta içi 09:00 - 18:00 saatleri arasında hizmet vermekteyiz.
            </p>
          </div>

        </div>
      </div>
    </main>
  )
}