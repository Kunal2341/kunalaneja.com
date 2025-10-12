import React from 'react'
import type { Experience } from '../data/profile'

export default function ExperienceCard({ experience }: { experience: Experience }) {
  return (
    <div className="glass rounded-xl p-6 hover:bg-white/5 transition">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-bold text-lg">{experience.position}</h3>
          <div className="text-white/80 text-base font-semibold">{experience.company}</div>
          <div className="text-white/70 text-sm">{experience.description}</div>
        </div>
        <div className="text-white/60 text-sm mt-1 sm:mt-0 sm:text-right">
          {experience.period}
        </div>
      </div>
      
      <div className="text-white/60 text-sm mb-4">{experience.location}</div>
      
      {experience.achievements && experience.achievements.length > 0 && (
        <div className="mb-4">
          <ul className="text-white/70 text-sm space-y-2">
            {experience.achievements.map((achievement, i) => (
              <li key={i} className="flex items-start">
                <span className="text-white/40 mr-2 mt-1">•</span>
                <span>{achievement}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {experience.tags && experience.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {experience.tags.map((tag, i) => (
            <span key={i} className="text-xs px-2 py-1 rounded bg-white/10 text-white/80">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
