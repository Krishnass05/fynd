// The public home page (/): what a first-time visitor sees. Log in and Sign up open the start page
// (/start), where they pick Client or Freelancer. OWNER: Krishna.
import '@/components/landing/landing.css';
import CategoryCarousel from '@/components/landing/CategoryCarousel';
import Hero from '@/components/landing/Hero';
import LandingNav from '@/components/landing/LandingNav';
import { FeaturedTalent, FinalCta, Footer, HowItWorks } from '@/components/landing/Sections';

export default function Home() {
  return (
    <div className="landing">
      <LandingNav />
      <main id="main-content">
        <Hero />
        <CategoryCarousel />
        <HowItWorks />
        <FeaturedTalent />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
