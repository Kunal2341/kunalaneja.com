import React from 'react'

export default function Section({ id, title, children }: { id: string, title: string, children: React.ReactNode }) {
  return (
    <section id={id} className="py-20 md:py-28 relative z-20" style={{ pointerEvents: "none" }}>
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/60" style={{ pointerEvents: "none" }}></div>
      <div className="container-xl relative z-10" style={{ pointerEvents: "auto" }}>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-8">{title}</h2>
        {children}
      </div>
    </section>
  )
}
