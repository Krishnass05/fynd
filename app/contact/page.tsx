// Contact Us: customer support. OWNER: Krishna.
// There is no support inbox or email address yet, so the form checks what you typed and then says plainly that
// nothing was sent. The help assistant (bottom left) does work and answers questions about using Crewmate.
import SimpleHeader from '@/components/footer/SimpleHeader';
import HelpBot from '@/components/help/HelpBot';
import s from '@/components/footer/info.module.css';
import ContactForm from './ContactForm';

export const metadata = { title: 'Contact us · Crewmate' };

export default function Contact() {
  return (
    <main id="main-content" className={s.wrap}>
      <SimpleHeader />
      <section className={s.hero}>
        <p className={s.eyebrow}>Customer support</p>
        <h1>Reach out anytime.</h1>
        <p className={s.lead}>Have a question about your account, need help with a project, or want assistance using Crewmate? Our customer support team is here to help.</p>
      </section>
      <ContactForm />
      <HelpBot />
    </main>
  );
}
