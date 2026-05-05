import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function HakkimizdaPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#fff" }}>
      <div style={{ background: "#0A0A0A", padding: "4rem 3rem" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <Link href="/customer" style={{ fontSize: "11px", color: "#555", textDecoration: "none", letterSpacing: "0.1em", textTransform: "uppercase", display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "1.5rem" }}>
            <ArrowLeft size={12} /> Ana Sayfa
          </Link>
          <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "clamp(2.5rem, 5vw, 4rem)", fontWeight: 300, color: "#fff", lineHeight: 1.1 }}>
            Hakkımızda
          </h1>
        </div>
      </div>

      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "4rem 3rem" }}>

        <div style={{ marginBottom: "4rem" }}>
          <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.5rem", fontWeight: 300, lineHeight: 1.6, color: "#0A0A0A", marginBottom: "2rem" }}>
            "Taşıdığın şey seni tanımlar." — Bu cümleyle başladı her şey.
          </p>
          <p style={{ fontSize: "14px", color: "#555", lineHeight: 2, marginBottom: "1.5rem" }}>
            Luir, 2020 yılında İstanbul'da, kaliteli deri aksesuarlara olan tutkuyla kuruldu. Kurucularımız, piyasada fiyat ve kalite dengesini doğru kuran, uzun ömürlü ve estetik ürünler sunan bir markanın eksikliğini hissetti. Bu boşluğu doldurmak için yola çıktılar.
          </p>
          <p style={{ fontSize: "14px", color: "#555", lineHeight: 2 }}>
            Bugün Luir; çanta, valiz ve deri aksesuar kategorilerinde yüzlerce model sunmakta, Türkiye genelinde on binlerce müşteriye hizmet vermektedir.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem", marginBottom: "4rem" }}>
          {[
            { value: "2020", label: "Kuruluş Yılı" },
            { value: "50.000+", label: "Mutlu Müşteri" },
            { value: "300+", label: "Ürün Çeşidi" },
          ].map((stat, i) => (
            <div key={i} style={{ padding: "2rem 1.5rem", border: "0.5px solid #efefef", textAlign: "center" as const }}>
              <div style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "2.5rem", fontWeight: 300, marginBottom: "0.5rem" }}>{stat.value}</div>
              <div style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#888" }}>{stat.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column" as const, gap: "2.5rem" }}>

          <div>
            <h2 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.8rem", fontWeight: 300, marginBottom: "1rem", borderBottom: "0.5px solid #efefef", paddingBottom: "0.8rem" }}>
              Değerlerimiz
            </h2>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: "1.2rem" }}>
              {[
                { title: "Kalite", desc: "Her ürünümüzde en iyi malzemeleri kullanıyor, işçiliğe önem veriyoruz. Ürünlerimiz yıllarca kullanılmak üzere tasarlanmıştır." },
                { title: "Şeffaflık", desc: "Üretim süreçlerimiz, fiyatlandırmamız ve müşteri hizmetlerimizde daima dürüst ve açık bir yaklaşım benimsiyoruz." },
                { title: "Sürdürülebilirlik", desc: "Çevreye duyarlı üretim yöntemleri ve malzemeler tercih ediyor, karbon ayak izimizi minimize etmeye çalışıyoruz." },
              ].map((val, i) => (
                <div key={i} style={{ display: "flex", gap: "1.2rem", padding: "1.2rem", border: "0.5px solid #efefef" }}>
                  <div style={{ width: "3px", background: "#0A0A0A", flexShrink: 0, alignSelf: "stretch" }} />
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 500, marginBottom: "4px" }}>{val.title}</div>
                    <div style={{ fontSize: "13px", color: "#888", lineHeight: 1.7 }}>{val.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.8rem", fontWeight: 300, marginBottom: "1rem", borderBottom: "0.5px solid #efefef", paddingBottom: "0.8rem" }}>
              Üretim Sürecimiz
            </h2>
            <p style={{ fontSize: "14px", color: "#555", lineHeight: 2 }}>
              Ürünlerimiz, Türkiye'nin köklü deri atölyelerinde, deneyimli ustalar tarafından el işçiliğiyle üretilmektedir. Her parçada kullanılan deri, sertifikalı tedarikçilerden temin edilmekte; kalite kontrol süreçleri titizlikle uygulanmaktadır.
            </p>
          </div>

        </div>
      </div>
    </main>
  )
}