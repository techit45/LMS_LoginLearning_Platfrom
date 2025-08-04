import React from 'react';
import { Outlet, useParams, Navigate } from 'react-router-dom';
import { useCompany } from '../contexts/CompanyContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const CompanyLayout = () => {
  const { companySlug } = useParams();
  const { currentCompany, switchCompany, companies } = useCompany();

  // Validate company slug
  if (!companies[companySlug]) {
    return <Navigate to="/companies" replace />;
  }

  // Switch to the correct company if not already set
  React.useEffect(() => {
    if (!currentCompany || currentCompany.id !== companySlug) {
      switchCompany(companySlug, window.location.pathname.replace(`/company/${companySlug}`, '') || '/');
    }
  }, [companySlug, currentCompany, switchCompany]);

  if (!currentCompany || currentCompany.id !== companySlug) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-white to-slate-50 text-black">
      <Navbar />
      <main className="flex-grow pt-20">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default CompanyLayout;