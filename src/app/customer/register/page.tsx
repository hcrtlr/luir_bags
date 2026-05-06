"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const rules = [
  { id: "len", label: "En az 8 karakter", test: (pw: string) => pw.length >= 8 },
  { id: "upper", label: "Buyuk harf icermeli", test: (pw: string) => /[A-Z]/.test(pw) },
  { id: "lower", label: "Kucuk harf icermeli", test: (pw: string) => /[a-z]/.test(pw) },
  { id: "num", label: "Sayi icermeli", test: (pw: string) => /[0-9]/.test(pw) },
]

const strengthColors = [
  "var(--strength-1)",
  "var(--strength-2)",
  "var(--strength-3)",
  "var(--strength-4)",
  "var(--strength-5)",
]

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    birthDate: "",
    gender: "",
    password: "",
    confirmPassword: "",
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const passedRules = rules.filter(r => r.test(form.password))
  const strength = form.password ? passedRules.length : 0
  const passwordsMatch = form.confirmPassword
    ? form.password === form.confirmPassword
    : null

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!form.firstName.trim()) { setError("Ad alani zorunludur."); return }
    if (!form.lastName.trim()) { setError("Soyad alani zorunludur."); return }
    if (!form.email.trim()) { setError("E-posta alani zorunludur."); return }
    if (!form.birthDate) { setError("Dogum tarihi alani zorunludur."); return }
    if (!form.gender) { setError("Cinsiyet alani zorunludur."); return }
    if (!form.password) { setError("Sifre alani zorunludur."); return }
    if (strength < 5) { setError("Lutfen tum sifre kurallarini karsılayin."); return }
    if (!form.confirmPassword) { setError("Sifre tekrar alani zorunludur."); return }
    if (form.password !== form.confirmPassword) { setError("Sifreler eslesmiyor."); return }

    setLoading(true)

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            first_name: form.firstName,
            last_name: form.lastName,
            birth_date: form.birthDate,
            gender: form.gender,
          }
        }
      })

      if (signUpError) {
        if (signUpError.message.includes("security purposes")) {
          setError("Lutfen birkac saniye bekleyip tekrar deneyin.")
        } else if (signUpError.message.includes("already registered")) {
          setError("Bu e-posta adresi zaten kayitli.")
        } else if (signUpError.message.includes("rate limit")) {
          setError("Cok fazla deneme yapildi. Lutfen bekleyin.")
        } else {
          setError(signUpError.message)
        }
        return
      }

      setSuccess("Hesabiniz olusturuldu!")
      setTimeout(() => router.push("/customer/login"), 1000)

    } catch (err) {
      setError("Beklenmedik bir hata olustu.")
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: "100%",
    border: "none",
    borderBottom: "1px solid var(--border)",
    padding: "8px 0",
    fontSize: "0.9rem",
    color: "var(--foreground)",
    background: "transparent",
    outline: "none",
    fontFamily: "var(--font-dm-sans)",
  }

  const labelStyle = {
    display: "block",
    fontSize: "0.65rem",
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: "var(--muted)",
    marginBottom: "4px",
  }

  return (
    <main style={{ minHeight: "100vh", background: "var(--background)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ width: "100%", maxWidth: "480px", border: "1px solid var(--border)" }}>

        <div style={{ background: "var(--foreground)", padding: "2rem 2.5rem" }}>
          <Link href="/customer" style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.5rem", fontWeight: 300, color: "var(--background)", textDecoration: "none", letterSpacing: "0.1em", display: "block", marginBottom: "1rem" }}>
            LUIR
          </Link>
          <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "2rem", fontWeight: 300, color: "var(--background)", lineHeight: 1.15 }}>
            Hesap olusturun.
          </h1>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "2rem 2.5rem", display: "flex", flexDirection: "column", gap: "1.2rem" }}>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={labelStyle}>Ad *</label>
              <input style={inputStyle} name="firstName" type="text" placeholder="Adiniz" value={form.firstName} onChange={handleChange} />
            </div>
            <div>
              <label style={labelStyle}>Soyad *</label>
              <input style={inputStyle} name="lastName" type="text" placeholder="Soyadiniz" value={form.lastName} onChange={handleChange} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>E-posta *</label>
            <input style={inputStyle} name="email" type="email" placeholder="ornek@email.com" value={form.email} onChange={handleChange} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={labelStyle}>Dogum Tarihi *</label>
              <input style={inputStyle} name="birthDate" type="date" value={form.birthDate} onChange={handleChange} />
            </div>
            <div>
              <label style={labelStyle}>Cinsiyet *</label>
              <select style={{ ...inputStyle, appearance: "none", cursor: "pointer" }} name="gender" value={form.gender} onChange={handleChange}>
                <option value="" disabled>Seciniz</option>
                <option value="female">Kadin</option>
                <option value="male">Erkek</option>
                <option value="unspecified">Belirtmek istemiyorum</option>
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Sifre *</label>
            <div style={{ position: "relative" }}>
              <input style={{ ...inputStyle, paddingRight: "28px" }} name="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={form.password} onChange={handleChange} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--muted)", display: "flex", padding: 0 }}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {form.password && (
              <div style={{ height: "2px", background: "var(--border)", marginTop: "8px", borderRadius: "2px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: strength * 20 + "%", background: strengthColors[strength - 1], borderRadius: "2px", transition: "width 0.4s, background 0.4s" }} />
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginTop: "10px" }}>
              {rules.map(rule => {
                const passed = rule.test(form.password)
                const idle = !form.password
                return (
                  <div key={rule.id} style={{ display: "flex", alignItems: "center", gap: "7px", fontSize: "0.7rem", color: idle ? "var(--muted-light)" : passed ? "var(--success-dark)" : "var(--error)", transition: "color 0.3s" }}>
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", flexShrink: 0, background: idle ? "var(--border)" : passed ? "var(--success)" : "var(--error)", transition: "background 0.3s" }} />
                    {rule.label}
                  </div>
                )
              })}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Sifre Tekrar *</label>
            <div style={{ position: "relative" }}>
              <input style={{ ...inputStyle, paddingRight: "28px" }} name="confirmPassword" type={showConfirm ? "text" : "password"} placeholder="••••••••" value={form.confirmPassword} onChange={handleChange} />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--muted)", display: "flex", padding: 0 }}>
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {form.confirmPassword && (
              <p style={{ fontSize: "0.7rem", marginTop: "5px", color: passwordsMatch ? "var(--success-dark)" : "var(--error)" }}>
                {passwordsMatch ? "Sifreler eslesiyor" : "Sifreler eslesmiyor"}
              </p>
            )}
          </div>

          {error && (
            <p style={{ fontSize: "0.75rem", color: "var(--error)", padding: "0.6rem 0.8rem", border: "1px solid var(--error)" }}>
              {error}
            </p>
          )}

          {success && (
            <p style={{ fontSize: "0.75rem", color: "var(--success-dark)", padding: "0.6rem 0.8rem", border: "1px solid var(--success)" }}>
              {success}
            </p>
          )}

          <button type="submit" disabled={loading} style={{ background: "var(--foreground)", color: "var(--background)", border: "none", padding: "0.9rem", fontSize: "0.72rem", letterSpacing: "0.18em", textTransform: "uppercase", cursor: loading ? "not-allowed" : "pointer", fontFamily: "var(--font-dm-sans)", opacity: loading ? 0.6 : 1, marginTop: "0.5rem" }}>
            {loading ? "Kaydediliyor..." : "Kayit Ol"}
          </button>

          <p style={{ fontSize: "0.72rem", color: "var(--muted)", textAlign: "center" }}>
            Zaten hesabin var mi?{" "}
            <Link href="/customer/login" style={{ color: "var(--foreground)", textDecoration: "none", borderBottom: "1px solid var(--border)" }}>
              Giris yap
            </Link>
          </p>

        </form>
      </div>
    </main>
  )
}