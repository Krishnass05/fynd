// Plain terms for the demo. OWNER: Krishna.
import Link from 'next/link';

export const metadata = { title: 'Terms of use · Crewmate' };

export default function Terms() {
  return (
    <main id="main-content" className="page" style={{ maxWidth: 720 }}>
      <h1>Terms of use</h1>
      <p className="muted">This is a hackathon demo. By creating an account you agree to the points below.</p>
      <ul>
        <li><strong>Synthetic data.</strong> The people, companies, prices, ratings and reviews on this site are made up. Do not rely on them.</li>
        <li><strong>Not legal advice.</strong> The site is a workflow aid. An approval here is not a signed contract.</li>
        <li><strong>No payments.</strong> No money moves through the site. Milestones and approvals are records only.</li>
        <li><strong>Keep work on the platform.</strong> Chat and calls are checked for phone numbers, email addresses, links and social handles. A message with contact details is hidden and a call that includes them is ended. Where an AI model is switched on, the text of messages and spoken lines is also sent to that provider.</li>
        <li><strong>Your account.</strong> Your password is stored only as a salted hash. Accounts and data are kept in memory for this demo and are erased when the server restarts.</li>
      </ul>
      <p><Link href="/register">Back to sign up</Link></p>
    </main>
  );
}
