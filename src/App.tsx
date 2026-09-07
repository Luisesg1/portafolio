import { Nav } from './components/Nav'
import { Hero } from './components/Hero'
import { Intro } from './components/Intro'
import { Services } from './components/Services'
import { Projects } from './components/Projects'
import { Tech } from './components/Tech'
import { Profile } from './components/Profile'
import { Process } from './components/Process'
import { Contact } from './components/Contact'
import { GlobalCat } from './components/GlobalCat'
import { Footer } from './components/Footer'
import { ScrollProgress } from './components/ScrollProgress'
import { CommandPalette } from './components/CommandPalette'
import { Loader } from './components/Loader'
import { Hud } from './components/Hud'
import './styles/sections.css'

export default function App() {
  return (
    <>
      <a href="#main" className="skip-link">Saltar al contenido</a>
      {/* shared ambient backdrop behind every section — keeps the starfield
          continuous so the hero never "cuts" into a flat section below */}
      <div className="page-stars" aria-hidden />
      <Loader />
      <ScrollProgress />
      <Nav />
      <main id="main">
        <Hero />
        <Intro />
        <Services />
        <Projects />
        <Tech />
        <Profile />
        <Process />
        <Contact />
      </main>
      <Footer />
      <Hud />
      <CommandPalette />
      <GlobalCat />
    </>
  )
}
