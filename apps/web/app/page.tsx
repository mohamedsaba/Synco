import { CampaignSection } from './home/campaign-section';
import { ClaritySection } from './home/clarity-section';
import { EvidenceNarrativeSection } from './home/evidence-narrative-section';
import { FinalCtaSection } from './home/final-cta-section';
import { HirearchyHero } from './home/hirearchy-hero';
import { HirearchySoftwareSection } from './home/hirearchy-software-section';
import { ImpressionsSection } from './home/impressions-section';
import { ProductFamilySection } from './home/product-family-section';

const SiteHeader = () => (
  <header className="brand-header">
    <a className="brand-wordmark" href="#top" aria-label="Hirearchy home">
      Hirearchy<span aria-hidden="true">.</span>
    </a>
    <nav aria-label="Homepage">
      <a href="#approach">Approach</a>
      <a href="#software">Software</a>
      <a href="#get-started">Get started</a>
    </nav>
  </header>
);

const HomePage = () => (
  <main className="brand-home" id="top">
    <SiteHeader />
    <HirearchyHero />
    <ImpressionsSection />
    <EvidenceNarrativeSection />
    <ClaritySection />
    <ProductFamilySection />
    <HirearchySoftwareSection />
    <CampaignSection />
    <FinalCtaSection />
  </main>
);

export default HomePage;
