import { Site, Kicker, Button } from '../home/site';
export const metadata = {
  title: 'Privacy',
  robots: { index: false, follow: false },
};
export default function LegalPage() {
  return (
    <Site>
      <section className="ct-legal-page">
        <Kicker>Publication pending</Kicker>
        <h1>Privacy</h1>
        <p>
          The approved privacy information for this website has not been
          published yet.
        </p>
        <p>
          This page is a placeholder, not a legal policy. Please check back
          before relying on these terms or submitting personal information.
        </p>
        <Button href="/">Back to Hirearchy</Button>
      </section>
    </Site>
  );
}
