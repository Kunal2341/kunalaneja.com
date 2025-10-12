import React from 'react'
import type { Project } from '../data/profile'

export default function ProjectCard({ p }: { p: Project }) {
  return (
    <a href={p.href || '#'} className="group block glass rounded-xl p-4 hover:bg-white/5 transition">
      <div className="flex items-start justify-between gap-4">
        <h3 className="font-semibold">{p.title}</h3>
        <div className="text-xs text-white/50 group-hover:text-white/80 transition">→</div>
      </div>
      <p className="text-white/70 text-sm mt-1">{p.description}</p>
      {p.tags && (
        <div className="mt-3 flex flex-wrap gap-2">
          {p.tags.map((t, i) => (
            <span key={i} className="text-xs px-2 py-1 rounded bg-white/10">{t}</span>
          ))}
        </div>
      )}
    </a>
  )
}
