import React from 'react'

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="py-10 relative z-10">
      <div 
        className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/40"
        style={{ pointerEvents: 'none' }}
      ></div>
      <div className="container-xl text-white/50 text-sm flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
        <div>© {year} Kunal Aneja</div>
        <div className="flex gap-4">
          <a href="#home" className="hover:text-white">Top</a>
          <a href="#contact" className="hover:text-white">Contact</a>
        </div>
      </div>
    </footer>
  )
}
