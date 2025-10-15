import React from 'react'
import type { Publication } from '../data/profile'

export default function PublicationCard({ pub }: { pub: Publication }) {
  // Check if this is a class project (less prominent styling)
  const isClassProject = pub.title.includes('CS 4644') || pub.title.includes('Deep Learning Research Project');
  
  // Function to make "Kunal Aneja" bold in author strings
  const formatAuthors = (authors: string) => {
    return authors.split(',').map((author, index) => {
      const trimmedAuthor = author.trim();
      if (trimmedAuthor.includes('Kunal Aneja')) {
        const parts = trimmedAuthor.split('Kunal Aneja');
        return (
          <span key={index}>
            {parts[0]}
            <strong className="text-white font-semibold">Kunal Aneja</strong>
            {parts[1]}
            {index < authors.split(',').length - 1 && ', '}
          </span>
        );
      }
      return (
        <span key={index}>
          {trimmedAuthor}
          {index < authors.split(',').length - 1 && ', '}
        </span>
      );
    });
  };

  return (
    <div className={`glass rounded-xl ${isClassProject ? 'p-4' : 'p-6'} ${isClassProject ? 'bg-white/5 hover:bg-white/8' : 'hover:bg-white/5'} transition`}>
      {/* Image/Video */}
      {pub.image ? (
        <div className={`w-full rounded-lg mb-4 overflow-hidden ${pub.title.includes('AMPLIFY') ? 'h-40' : 'h-48'}`}>
          {pub.image.endsWith('.mp4') || pub.image.endsWith('.webm') || pub.image.endsWith('.mov') ? (
            <video 
              src={pub.image} 
              className="w-full h-full object-cover object-center"
              autoPlay
              loop
              muted
              playsInline
              onError={(e) => {
                // Fallback to placeholder if video fails to load
                const target = e.target as HTMLVideoElement;
                target.style.display = 'none';
                target.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : (
            <img 
              src={pub.image} 
              alt={`${pub.title} diagram`}
              className="w-full h-full object-cover object-center"
              onError={(e) => {
                // Fallback to placeholder if image fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.nextElementSibling?.classList.remove('hidden');
              }}
            />
          )}
          <div className="w-full h-full bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-lg flex items-center justify-center hidden">
            <div className="text-white/40 text-sm">Paper Image</div>
          </div>
        </div>
      ) : (
        <div className={`w-full ${isClassProject ? 'h-32' : 'h-48'} bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-lg mb-4 flex items-center justify-center`}>
          <div className="text-white/40 text-sm">Paper Image</div>
        </div>
      )}
      
      <h3 className={`${isClassProject ? 'font-semibold text-base' : 'font-bold text-lg'} leading-tight mb-2`}>{pub.title}</h3>
      <div className={`${isClassProject ? 'text-white/70 text-sm' : 'text-white/80 text-base'} mb-2`}>{formatAuthors(pub.authors)}</div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
        <div className={`${isClassProject ? 'text-white/50 text-sm' : 'text-white/60 text-base'}`}>
          {pub.venue.includes('*') ? (
            <span dangerouslySetInnerHTML={{ 
              __html: pub.venue.replace(/\*(.*?)\*/g, '<em>$1</em>') 
            }} />
          ) : pub.venue} {pub.year}
        </div>
        {pub.lab && (
          <div className="mt-1 sm:mt-0">
            <a 
              href={pub.labUrl || "#"} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs px-2 py-1 rounded bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-400/30 text-purple-300 hover:bg-purple-500/30 transition"
            >
              {pub.lab}
            </a>
          </div>
        )}
      </div>
      {pub.links && pub.links.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {pub.links.map((l, i) => (
            <a key={i} href={l.href} target="_blank" rel="noopener noreferrer" className={`${isClassProject ? 'text-sm px-3 py-2' : 'text-base px-4 py-2.5'} rounded-lg bg-white/10 hover:bg-white/20 transition font-medium`}>
              {l.label}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
