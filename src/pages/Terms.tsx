import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Terms = () => {
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
        <h1 className="text-2xl font-bold">Terms of Service</h1>
      </div>

      {/* Content */}
      <article className="prose prose-invert max-w-none space-y-6 text-sm text-foreground/90">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">1. Agreement to Terms</h2>
          <p>
            By accessing and using the Sektion website and application (the "Service"), you accept and agree to be bound
            by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use
            this service.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">2. Use License</h2>
          <p>
            Permission is granted to temporarily download one copy of the materials (information or software) on the
            Sektion Service for personal, non-commercial transitory viewing only. This is the grant of a license, not a
            transfer of title, and under this license you may not:
          </p>
          <ul className="space-y-2 pl-4">
            <li>Modify or copy the materials</li>
            <li>Use the materials for any commercial purpose or for any public display</li>
            <li>Attempt to decompile or reverse engineer any software contained on the Service</li>
            <li>Remove any copyright or other proprietary notations from the materials</li>
            <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
            <li>Harass, threaten, or abuse other users</li>
            <li>Post or upload content that violates these terms</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">3. Disclaimer</h2>
          <p>
            The materials on the Sektion Service are provided on an 'as is' basis. Sektion makes no warranties,
            expressed or implied, and hereby disclaims and negates all other warranties including, without limitation,
            implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement
            of intellectual property or other violation of rights.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">4. Limitations</h2>
          <p>
            In no event shall Sektion or its suppliers be liable for any damages (including, without limitation,
            damages for loss of data or profit, or due to business interruption) arising out of the use or inability to
            use the materials on the Sektion Service, even if Sektion or a Sektion authorized representative has been
            notified orally or in writing of the possibility of such damage.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">5. Accuracy of Materials</h2>
          <p>
            The materials appearing on the Sektion Service could include technical, typographical, or photographic
            errors. Sektion does not warrant that any of the materials on its Service are accurate, complete, or
            current. Sektion may make changes to the materials contained on its Service at any time without notice.
            Sektion does not, however, make any commitment to update the materials.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">6. Links</h2>
          <p>
            Sektion has not reviewed all of the sites linked to its website and is not responsible for the contents of
            any such linked site. The inclusion of any link does not imply endorsement by Sektion of the site. Use of
            any such linked website is at the user's own risk.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">7. Modifications</h2>
          <p>
            Sektion may revise these terms of service for its Service at any time without notice. By using this
            Service, you are agreeing to be bound by the then current version of these terms of service.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">8. Governing Law</h2>
          <p>
            The materials appearing on the Sektion Service are governed by and construed in accordance with the laws of
            the jurisdiction where Sektion is located, and you irrevocably submit to the exclusive jurisdiction of the
            courts in that location.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">9. User Accounts</h2>
          <p className="mb-2">When you create an account with Sektion, you are responsible for:</p>
          <ul className="space-y-2 pl-4">
            <li>Maintaining the confidentiality of your account credentials</li>
            <li>All activities that occur under your account</li>
            <li>Notifying us immediately of any unauthorized use of your account</li>
            <li>Providing accurate and complete information during registration</li>
          </ul>
          <p className="mt-3">
            We reserve the right to terminate your account at any time if we believe you have violated these Terms of
            Service.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">10. Prohibited Conduct</h2>
          <p className="mb-2">You agree not to use the Service to:</p>
          <ul className="space-y-2 pl-4">
            <li>Violate any applicable laws or regulations</li>
            <li>Harass, threaten, defame, or abuse other users</li>
            <li>Spam, phish, or attempt to gain unauthorized access to systems</li>
            <li>Upload or share malware, viruses, or other harmful code</li>
            <li>Post false, misleading, or fraudulent information</li>
            <li>Impersonate any person or entity</li>
            <li>Engage in any activity that disrupts the normal functioning of the Service</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">11. User Generated Content</h2>
          <p>
            Any content you upload, post, or transmit through the Service ("User Content") remains your property. By
            uploading User Content, you grant Sektion a non-exclusive, royalty-free license to use, reproduce, modify,
            and distribute such content on the Service and for promotional purposes.
          </p>
          <p className="mt-3">
            You represent and warrant that you own or have the necessary permissions for any User Content you submit,
            and that it does not violate any applicable laws or third-party rights.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">12. Content Moderation & Removal</h2>
          <p>
            Sektion reserves the right to review, remove, or restrict access to any User Content that we determine, in
            our sole discretion, to be inappropriate, harmful, or in violation of these Terms. This includes:
          </p>
          <ul className="space-y-2 pl-4">
            <li>Content that is violent, explicit, or offensive</li>
            <li>Content that violates copyright or intellectual property rights</li>
            <li>Content flagged by multiple users for inappropriate behavior</li>
            <li>Content used for harassment, spam, or fraud</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">13. Bookings and Payments</h2>
          <p className="mb-2">
            When you make a booking through the Service, you agree that you will:
          </p>
          <ul className="space-y-2 pl-4">
            <li>Provide accurate booking information</li>
            <li>Pay applicable fees promptly</li>
            <li>Cancel bookings in accordance with event refund policies</li>
            <li>Comply with venue and event policies</li>
            <li>Honor all confirmed bookings</li>
          </ul>
          <p className="mt-3">
            Sektion is not responsible for disputes between users and venues. Such disputes should be resolved directly
            between the parties.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">14. Account Termination</h2>
          <p>
            Sektion may terminate your account and access to the Service at any time, with or without cause, and with
            or without notice. Upon termination, your right to use the Service will immediately cease.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">15. Contact for Violations</h2>
          <p>
            If you believe a user has violated these Terms of Service or engaged in inappropriate behavior, please
            report it to us at abuse@sektion.app. We will investigate and take appropriate action.
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

export default Terms;
