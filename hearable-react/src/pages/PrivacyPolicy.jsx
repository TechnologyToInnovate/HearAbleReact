import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  // Ensures the page loads at the very top of the window,
  // which is especially useful if the user scrolled down on the previous page.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="page-container" style={{ paddingBottom: '64px' }}>
      
      {/* Navigation control to return the user to their previous page */}
      <button className="btn-outline btn-sm mb-24" onClick={() => navigate(-1)}>
        ← Go Back
      </button>

      <div className="card p-32">
        <h1 className="m-0 mb-8" style={{ fontSize: '2rem', color: 'var(--primary-color)' }}>Data Privacy Policy</h1>
        <p className="text-secondary mb-32">Last Updated: July 2026</p>

        {/* --- POLICY SECTIONS --- */}
        <div className="flex-col gap-24" style={{ lineHeight: '1.7' }}>
          <section>
            <h3 className="m-0 mb-12">1. Introduction</h3>
            <p className="m-0 text-secondary">
              Welcome to Hearable. We are committed to protecting your personal information and your right to privacy. This policy explains how we collect, use, and share your information when you use our platform.
            </p>
          </section>

          <section>
            <h3 className="m-0 mb-12">2. Information We Collect</h3>
            <p className="m-0 text-secondary mb-8">We collect personal information that you voluntarily provide to us when you register on the platform, express an interest in obtaining information about us or our products and services, or otherwise contact us. The personal information that we collect depends on the context of your interactions with us and the platform, the choices you make, and the products and features you use. The personal information we collect may include the following:</p>
            <ul className="text-secondary ml-24" style={{ listStyleType: 'disc', paddingLeft: '20px' }}>
              <li><strong>Personal Info Provided by You:</strong> First and last name, email address, phone number, location, education, and skills.</li>
              <li><strong>Professional Info:</strong> Resumes, job history, and application data.</li>
              <li><strong>Company Info:</strong> Company names, representatives, industry, and location data.</li>
            </ul>
          </section>

          <section>
            <h3 className="m-0 mb-12">3. How We Use Your Information</h3>
            <p className="m-0 text-secondary">
              We use personal information collected via our platform for a variety of business purposes described below. We process your personal information for these purposes in reliance on our legitimate business interests, in order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal obligations.
            </p>
            <ul className="text-secondary ml-24 mt-8" style={{ listStyleType: 'disc', paddingLeft: '20px' }}>
              <li>To facilitate account creation and logon process.</li>
              <li>To match job seekers with appropriate job postings.</li>
              <li>To allow employers to view candidate profiles and manage applications.</li>
              <li>To send administrative information to you.</li>
            </ul>
          </section>

          <section>
            <h3 className="m-0 mb-12">4. Sharing Your Information</h3>
            <p className="m-0 text-secondary">
              We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations. Specifically, when you apply for a job, your profile and application details will be shared with the respective company.
            </p>
          </section>

          <section>
            <h3 className="m-0 mb-12">5. Data Retention & Security</h3>
            <p className="m-0 text-secondary">
              We will only keep your personal information for as long as it is necessary for the purposes set out in this privacy notice, unless a longer retention period is required or permitted by law. We have implemented appropriate technical and organizational security measures designed to protect the security of any personal information we process.
            </p>
          </section>

          <section>
            <h3 className="m-0 mb-12">6. Contact Us</h3>
            <p className="m-0 text-secondary">
              If you have questions or comments about this notice, you may email us at privacy@hearable.com.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}