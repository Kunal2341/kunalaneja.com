import React from 'react'
import type { Education } from '../data/profile'

export default function EducationCard({ education }: { education: Education }) {
  return (
    <div className="glass rounded-xl p-6 hover:bg-white/5 transition">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
        <div>
          <h3 className="font-bold text-lg">{education.institution}</h3>
          <div className="text-white/80 text-base">
            <strong>{education.degree}</strong> in {education.field}
          </div>
        </div>
        <div className="text-white/60 text-sm mt-1 sm:mt-0">
          {education.period}
        </div>
      </div>
      
      {education.gpa && (
        <div className="text-white/70 text-sm mb-3">
          GPA: {education.gpa}
        </div>
      )}
      
      {education.coursework && education.coursework.length > 0 && (
        <div className="mb-3">
          <div className="text-white/60 text-sm mb-2">Coursework:</div>
          <div className="flex flex-wrap gap-1">
            {education.coursework.map((course, i) => (
              <span key={i} className="text-xs px-2 py-1 rounded bg-white/10 text-white/80">
                {course}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {education.achievements && education.achievements.length > 0 && (
        <div className="mb-3">
          <div className="text-white/60 text-sm mb-2">Achievements:</div>
          <ul className="text-white/70 text-sm space-y-1">
            {education.achievements.map((achievement, i) => (
              <li key={i} className="flex items-start">
                <span className="text-white/40 mr-2">•</span>
                {achievement}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {education.links && education.links.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {education.links.map((link, i) => (
            <a 
              key={i} 
              href={link.href} 
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 transition"
            >
              {link.label}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
