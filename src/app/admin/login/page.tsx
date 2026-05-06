"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Eye, EyeOff } from "lucide-react"

export default function AdminLoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError("E-posta veya sifre yanlis.")
        setLoading(false)
        return
      }

      // Admin kontrolü
      const { data: adminData, error:adminError } = await supabase
        .from("admins")
        .select("*")
        .eq("user_id", data.user.id)
        .single()

      if (!adminData) {
        await supabase.auth.signOut()
        setError("Bu hesabin admin yetkisi yok.")
        setLoading(false)
        return
      }

      router.push("/admin")

    } catch {
      setError("Beklenmedik bir hata olustu.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ minHeight: "100vh", background: "#0A0A0A", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ width: "100%", maxWidth: "400px", background: "#fff", padding: "2.5rem" }}>
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.5rem", fontWeight: 300, letterSpacing: "0.1em", marginBottom: "0.5rem" }}>
            LU<em style={{ fontStyle: "italic", color: "#888" }}>IR</em>
          </div>
          <div style={{ fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#888" }}>
            Admin Panel
          </div>
        </div>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#888", marginBottom: "4px" }}>E-posta</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@email.com"
              required
              style={{ width: "100%", border: "none", borderBottom: "1px solid #e0e0e0", padding: "8px 0", fontSize: "0.9rem", outline: "none", fontFamily: "var(--font-dm-sans)" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#888", marginBottom: "4px" }}>Şifre</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ width: "100%", border: "none", borderBottom: "1px solid #e0e0e0", padding: "8px 0", fontSize: "0.9rem", outline: "none", fontFamily: "var(--font-dm-sans)", paddingRight: "28px" }}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#888", display: "flex", padding: 0 }}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <p style={{ fontSize: "12px", color: "#E24B4A", padding: "8px 12px", border: "1px solid #E24B4A" }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ background: "#0A0A0A", color: "#fff", border: "none", padding: "12px", fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", cursor: loading ? "not-allowed" : "pointer", fontFamily: "var(--font-dm-sans)", opacity: loading ? 0.6 : 1, marginTop: "0.5rem" }}
          >
            {loading ? "Giris yapiliyor..." : "Giris Yap"}
          </button>
        </form>
      </div>
    </main>
  )
}