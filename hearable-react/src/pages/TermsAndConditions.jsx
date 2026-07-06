import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function TermsAndConditions() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="page-container" style={{ paddingBottom: '64px' }}>
      <button className="btn-outline btn-sm mb-24" onClick={() => navigate(-1)}>
        ← Go Back
      </button>

      <div className="card p-32">
        <h1 className="m-0 mb-8" style={{ fontSize: '2rem', color: 'var(--primary-color)' }}>Terms and Conditions</h1>
        <p className="text-secondary mb-32">Last Updated: July 2026</p>

        <div className="flex-col gap-24" style={{ lineHeight: '1.7' }}>
          <section>
            <h3 className="m-0 mb-12">1. Agreement to Terms</h3>
            <p className="m-0 text-secondary">
              These Terms of Use constitute a legally binding agreement made between you, whether personally or on behalf of an entity (“you”) and Hearable ("Company," "we," "us," or "our"), concerning your access to and use of the platform. You agree that by accessing the site, you have read, understood, and agreed to be bound by all of these Terms of Use.
            </p>
          </section>

          <section>
            <h3 className="m-0 mb-12">2. User Accounts</h3>
            <p className="m-0 text-secondary">
              When you create an account with us, you must provide us with information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our service. You are responsible for safeguarding the password that you use to access the service and for any activities or actions under your password.
            </p>
          </section>

          <section>
            <h3 className="m-0 mb-12">3. Platform Usage Rules</h3>
            <p className="m-0 text-secondary mb-8">You agree not to use the platform to:</p>
            <ul className="text-secondary ml-24" style={{ listStyleType: 'disc', paddingLeft: '20px' }}>
              <li>Post false, inaccurate, misleading, defamatory, or libelous content.</li>
              <li>Distribute viruses or any other technologies that may harm the platform or the interests or property of users.</li>
              <li>Scrape, duplicate, or systematically extract data from the platform without our express written permission.</li>
              <li>Create duplicate accounts or misrepresent your identity or affiliation with a person or entity.</li>
            </ul>
          </section>

          <section>
            <h3 className="m-0 mb-12">4. Employer and Job Posting Guidelines</h3>
            <p className="m-0 text-secondary">
              Employers utilizing the platform to post job opportunities must ensure that all postings are accurate, non-discriminatory, and comply with all applicable labor laws. We reserve the right to remove any job posting or suspend any company account that violates these guidelines, pending admin review.
            </p>
          </section>

          <section>
            <h3 className="m-0 mb-12">5. Limitation of Liability</h3>
            <p className="m-0 text-secondary">
              In no event will we or our directors, employees, or agents be liable to you or any third party for any direct, indirect, consequential, exemplary, incidental, special, or punitive damages, including lost profit, lost revenue, loss of data, or other damages arising from your use of the platform.
            </p>
          </section>

          <section>
            <h3 className="m-0 mb-12">6. Modifications and Interruptions</h3>
            <p className="m-0 text-secondary">
              We reserve the right to change, modify, or remove the contents of the platform at any time or for any reason at our sole discretion without notice. We will not be liable to you or any third party for any modification, price change, suspension, or discontinuance of the platform.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}