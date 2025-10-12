import React from 'react'
import { profile } from '../data/profile'

const links = [
  { href: '#research', label: 'Research' },
  { href: '#projects', label: 'Projects' },
  { href: '#education', label: 'Education' },
  { href: '#about', label: 'About' },
  { href: '#contact', label: 'Contact' }
]

export default function Navbar() {
  return (
    <div className="fixed top-0 inset-x-0 z-50">
      <div className="container-xl py-3">
        <div className="glass rounded-xl px-4 py-2 flex items-center justify-between">
          <a href="#home" className="font-bold tracking-tight">
            <span className="text-white/90">Kunal</span>
            <span className="text-white/60">Aneja</span>
          </a>
          <nav className="hidden md:flex gap-6 text-sm text-white/70">
            {links.map(l => (
              <a key={l.href} href={l.href} className="hover:text-white transition">{l.label}</a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <a href={profile.socials.github} target="_blank" className="text-white/70 hover:text-white text-sm">GitHub</a>
            <a href={profile.socials.scholar} target="_blank" className="text-white/70 hover:text-white text-sm">Scholar</a>
          </div>
        </div>
      </div>
    </div>
  )
}
