import React from 'react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Section from './components/Section'
import PublicationCard from './components/PublicationCard'
import ProjectCard from './components/ProjectCard'
import ExperienceCard from './components/ExperienceCard'
import EducationCard from './components/EducationCard'
import AgentGridRLBackground from './components/AgentGridRLBackground'
import { profile } from './data/profile'

export default function App() {
  return (
    <AgentGridRLBackground>
      <div className="min-h-screen bg-transparent relative">
        <Navbar />

        {/* Hero section */}
        <header id="home" className="relative">
          <div className="container-xl pt-28 md:pt-36 h-screen flex flex-col justify-center" style={{ pointerEvents: "none" }}>
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-6xl font-extrabold leading-[1.05] tracking-tight">
                {profile.name}
              </h1>
              <p className="text-lg md:text-xl text-white/80 mt-3">{profile.tagline}</p>
              <div className="mt-8 flex flex-wrap gap-3" style={{ pointerEvents: "auto" }}>
                <a href="#research" className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition">Explore Research</a>
                <a href="#contact" className="px-4 py-2 rounded-lg border border-white/20 hover:border-white/40 transition">Contact</a>
              </div>
              <div className="mt-6 text-sm text-white/60 max-w-2xl">
                I am an MS student at Georgia Tech studying RL and robotics in the PAIR Lab under Animesh Garg, focused on achieving generalization in sequential decision making agents
              </div>
            </div>
          </div>
        </header>

      <main style={{ pointerEvents: "none" }}>
        <Section id="research" title="Research">
          <div className="grid md:grid-cols-2 gap-6" style={{ pointerEvents: "auto" }}>
            {profile.publications.map((p, i) => <PublicationCard key={i} pub={p} />)}
          </div>
        </Section>

        <Section id="experience" title="Experience">
          <div className="grid md:grid-cols-1 gap-6 max-w-4xl mx-auto" style={{ pointerEvents: "auto" }}>
            {profile.experience.map((exp, i) => <ExperienceCard key={i} experience={exp} />)}
          </div>
        </Section>

        <Section id="about" title="About">
          <div className="grid md:grid-cols-2 gap-8 items-start" style={{ pointerEvents: "auto" }}>
            <div>
              <p className="text-white/80">
                I am an MS student at Georgia Tech studying computer science with a focus on machine learning and robotics. 
                My research interests span reinforcement learning, computer vision, and human-robot interaction.
              </p>
              <p className="text-white/70 mt-4">
                At the PAIR Lab, I work on trajectory modeling and decision-making systems that enable robots to perform 
                tasks without explicit action annotations, advancing toward more autonomous robotic systems.
              </p>
            </div>
            <div className="flex gap-4">
              <div className="glass rounded-xl p-4 flex-2">
                <h3 className="font-semibold mb-3">Research Domains</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((s, i) => (
                    <span key={i} className="text-xs px-2 py-1 rounded bg-white/10">{s}</span>
                  ))}
                </div>
              </div>
              <div className="glass rounded-xl p-4 flex-1">
                <h3 className="font-semibold mb-3 text-center">Resume</h3>
                <a 
                  href="/resume.pdf" 
                  download="Kunal_Aneja_Resume.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download PDF
                </a>
              </div>
            </div>
          </div>
        </Section>

        <Section id="education" title="Education">
          <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto" style={{ pointerEvents: "auto" }}>
            {profile.education.map((edu, i) => <EducationCard key={i} education={edu} />)}
          </div>
        </Section>

        <Section id="projects" title="Projects">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4" style={{ pointerEvents: "auto" }}>
            {profile.projects.map((p, i) => <ProjectCard key={i} p={p} />)}
          </div>
        </Section>

        <Section id="contact" title="Contact">
          <div className="grid md:grid-cols-2 gap-8 items-start" style={{ pointerEvents: "auto" }}>
            <div>
              <h3 className="font-semibold mb-3">Get in Touch</h3>
              <p className="text-white/80">
                Feel free to reach out if you're interested in my research or just want to chat.
              </p>
            </div>
            <div className="glass rounded-xl p-5">
              <p className="text-white/70 mt-2">Email: <a href={`mailto:${profile.email}`} className="underline">kunala &lt;at&gt; gatech &lt;dot&gt; edu</a></p>
              <p className="text-white/70 mt-1">Location: {profile.location}</p>
              <div className="mt-4 flex gap-3">
                <a className="text-sm px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 transition" href={profile.socials.github} target="_blank" rel="noopener noreferrer">GitHub</a>
                <a className="text-sm px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 transition" href={profile.socials.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>
                <a className="text-sm px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 transition" href={profile.socials.scholar} target="_blank" rel="noopener noreferrer">Scholar</a>
              </div>
            </div>
          </div>
        </Section>
      </main>

        <Footer />
      </div>
    </AgentGridRLBackground>
  )
}
