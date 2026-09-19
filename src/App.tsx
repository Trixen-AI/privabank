import { Nav } from "./components/Nav";
import { Hero } from "./components/sections/Hero";
import { Paradigm } from "./components/sections/Paradigm";
import { Network } from "./components/sections/Network";
import { Pillars } from "./components/sections/Pillars";
import { Compliance } from "./components/sections/Compliance";
import { Layers } from "./components/sections/Layers";
import { Papers } from "./components/sections/Papers";
import { Token } from "./components/sections/Token";
import { Roadmap } from "./components/sections/Roadmap";
import { Cta } from "./components/sections/Cta";
import { Faq } from "./components/sections/Faq";
import { Footer } from "./components/sections/Footer";

export default function App() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Paradigm />
        <Network />
        <Pillars />
        <Compliance />
        <Layers />
        <Papers />
        <Token />
        <Roadmap />
        <Cta />
        <Faq />
      </main>
      <Footer />
    </>
  );
}
