import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Privacy = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <main className="mx-auto min-h-screen w-full max-w-md bg-background px-4 py-6 pb-20 pt-4">
      {/* Header with back button */}
      <div className="mb-6 flex items-center gap-3">
        <Link to="/" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">Privacy Policy</h1>
      </div>

      {/* Content */}
      <article className="prose prose-invert max-w-none space-y-6 text-sm text-foreground/90">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">1. Introduction</h2>
          <p>
            Sektion ("we", "us", "our", or "Company") operates the sektion.vercel.app website and related applications
            (collectively, the "Service"). This page informs you of our policies regarding the collection, use, and
            disclosure of personal data when you use our Service.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">2. Information Collection and Use</h2>
          <p className="mb-2">We collect several different types of information for various purposes:</p>
          <ul className="space-y-2 pl-4">
            <li>
              <strong>Account Information:</strong> When you create an account, we collect your email, phone number,
              username, display name, and profile photo.
            </li>
            <li>
              <strong>Authentication Data:</strong> We store secure authentication credentials including OAuth tokens,
              hashed passwords, and session information.
            </li>
            <li>
              <strong>Booking Information:</strong> We collect details about event bookings, table reservations, guest
              counts, and payment references.
            </li>
            <li>
              <strong>User Generated Content:</strong> Photos, videos, and captions you upload to events are stored and
              may be displayed on the platform.
            </li>
            <li>
              <strong>Usage Information:</strong> We may collect information about how you interact with the Service,
              including IP addresses, device information, and browser type.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">3. Use of Data</h2>
          <p>Sektion uses the collected data for various purposes:</p>
          <ul className="space-y-2 pl-4">
            <li>To provide and maintain our Service</li>
            <li>To notify you about changes to our Service</li>
            <li>To allow you to participate in interactive features of our Service</li>
            <li>To provide customer support and respond to your requests</li>
            <li>To gather analysis or valuable information to improve our Service</li>
            <li>To monitor the usage of our Service and detect technical issues</li>
            <li>To provide you with promotional material, updates, and other information</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">4. Security of Data</h2>
          <p>
            The security of your data is important to us but remember that no method of transmission over the Internet
            or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to
            protect your personal data, we cannot guarantee its absolute security.
          </p>
          <ul className="mt-3 space-y-2 pl-4">
            <li>Passwords are hashed using industry-standard algorithms (bcrypt)</li>
            <li>Sensitive data is transmitted over HTTPS encryption</li>
            <li>Authentication tokens expire and refresh tokens are stored securely</li>
            <li>Rate limiting prevents unauthorized access attempts</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">5. Third-Party Services</h2>
          <p>Our Service may contain links to other websites that are not operated by us. This Privacy Policy applies
          only to our Service, and we are not responsible for the privacy practices of third-party services including:</p>
          <ul className="space-y-2 pl-4">
            <li>Google OAuth for authentication</li>
            <li>Twilio for SMS verification (if enabled)</li>
            <li>MongoDB for data storage (as our database provider)</li>
          </ul>
          <p className="mt-3">
            We encourage you to review their privacy policies before providing them with your personal information.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">6. Content Moderation</h2>
          <p>
            User-generated content (photos, videos, captions) may be reviewed by our moderation team for compliance with
            our Terms of Service. We may flag, freeze, or remove content that violates our policies. Flagged content can
            be reviewed and may result in content removal or account restrictions.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">7. User Rights</h2>
          <p>You have the right to:</p>
          <ul className="space-y-2 pl-4">
            <li>Access your personal information by requesting it through your account</li>
            <li>Update or correct your personal information</li>
            <li>Request deletion of your account and associated data</li>
            <li>Opt-out of promotional communications</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">8. Children's Privacy</h2>
          <p>
            Our Service is not directed to individuals under the age of 18. We do not knowingly collect personal
            information from children under 18. If we become aware that a child has provided us with personal
            information, we will take steps to delete such information and terminate the child's account.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">9. Changes to This Privacy Policy</h2>
          <p>
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new
            Privacy Policy on this page and updating the "effective date" at the bottom of this page.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">10. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at privacy@sektion.app or through
            our Service's contact form.
          </p>
        </section>

        <hr className="border-border" />
        <p className="text-xs text-muted-foreground">
          Effective Date: April 22, 2026
          <br />
          Last Updated: April 22, 2026
        </p>
      </article>
    </main>
  );
};

export default Privacy;
