import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// Company configurations
export const COMPANIES = {
  login: {
    id: 'login',
    name: 'Login Learning',
    fullName: 'Login Learning Platform',
    description: 'แพลตฟอร์มการศึกษาออนไลน์ที่มุ่งเน้นการเรียนรู้ด้านวิศวกรรม',
    color: 'indigo',
    logo: '/assets/logos/login-logo.png',
    domains: ['login-learning.com', 'localhost'],
    isDefault: true
  },
  meta: {
    id: 'meta',
    name: 'Meta Tech Academy',
    fullName: 'Meta Technology Academy',
    description: 'สถาบันพัฒนาทักษะด้านเทคโนโลยีขั้นสูง',
    color: 'blue',
    logo: '/assets/logos/meta-logo.png',
    domains: ['meta-tech.academy'],
    tracks: ['cyber', 'data', 'webapp', 'ai']
  },
  med: {
    id: 'med',
    name: 'Med Solutions',
    fullName: 'Medical Technology Solutions',
    description: 'ศูนย์พัฒนาเทคโนโลยีการแพทย์และสุขภาพ',
    color: 'green',
    logo: '/assets/logos/med-logo.png',
    domains: ['med-solutions.co.th']
  },
  edtech: {
    id: 'edtech',
    name: 'EdTech Innovation',
    fullName: 'Educational Technology Innovation Center',
    description: 'ศูนย์นวัตกรรมเทคโนโลยีการศึกษา',
    color: 'purple',
    logo: '/assets/logos/edtech-logo.png',
    domains: ['edtech-innovation.org']
  },
  w2d: {
    id: 'w2d',
    name: 'W2D Studio',
    fullName: 'Web to Digital Creative Studio',
    description: 'สตูดิโอสร้างสรรค์ดิจิทัลและเว็บเทคโนโลยี',
    color: 'pink',
    logo: '/assets/logos/w2d-logo.png',
    domains: ['w2d-studio.com']
  }
};

const CompanyContext = createContext();

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};

export const CompanyProvider = ({ children }) => {
  const [currentCompany, setCurrentCompany] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Determine company from URL or domain
  const determineCompanyFromContext = () => {
    // First, check URL path for company slug
    const pathMatch = location.pathname.match(/^\/company\/([^\/]+)/);
    if (pathMatch && pathMatch[1]) {
      const companySlug = pathMatch[1];
      if (COMPANIES[companySlug]) {
        return COMPANIES[companySlug];
      }
    }

    // Then check domain
    const hostname = window.location.hostname;
    for (const [companyId, company] of Object.entries(COMPANIES)) {
      if (company.domains && company.domains.some(domain => hostname.includes(domain))) {
        return company;
      }
    }

    // Default to Login Learning
    return COMPANIES.login;
  };

  // Initialize company context
  useEffect(() => {
    const company = determineCompanyFromContext();
    setCurrentCompany(company);
    setIsLoading(false);
  }, [location.pathname]);

  // Switch company function
  const switchCompany = (companyId, redirectTo = '/') => {
    if (!COMPANIES[companyId]) {
      return;
    }

    const company = COMPANIES[companyId];
    setCurrentCompany(company);

    // Navigate to company-specific route
    if (companyId === 'login' || company.isDefault) {
      // For default company, use regular routes
      navigate(redirectTo);
    } else {
      // For other companies, use company-prefixed routes
      navigate(`/company/${companyId}${redirectTo}`);
    }
  };

  // Get company-aware URL
  const getCompanyUrl = (path = '/') => {
    if (!currentCompany || currentCompany.isDefault) {
      return path;
    }
    return `/company/${currentCompany.id}${path}`;
  };

  // Get company theme colors
  const getCompanyTheme = () => {
    if (!currentCompany) return 'indigo';
    
    const colorMap = {
      indigo: {
        primary: 'bg-indigo-600',
        secondary: 'bg-indigo-100',
        text: 'text-indigo-600',
        border: 'border-indigo-200'
      },
      blue: {
        primary: 'bg-blue-600',
        secondary: 'bg-blue-100',
        text: 'text-blue-600',
        border: 'border-blue-200'
      },
      green: {
        primary: 'bg-green-600',
        secondary: 'bg-green-100',
        text: 'text-green-600',
        border: 'border-green-200'
      },
      purple: {
        primary: 'bg-purple-600',
        secondary: 'bg-purple-100',
        text: 'text-purple-600',
        border: 'border-purple-200'
      },
      orange: {
        primary: 'bg-orange-600',
        secondary: 'bg-orange-100',
        text: 'text-orange-600',
        border: 'border-orange-200'
      },
      pink: {
        primary: 'bg-pink-600',
        secondary: 'bg-pink-100',
        text: 'text-pink-600',
        border: 'border-pink-200'
      }
    };

    return colorMap[currentCompany.color] || colorMap.indigo;
  };

  // Get available companies for selection
  const getAvailableCompanies = () => {
    return Object.values(COMPANIES);
  };

  const value = {
    currentCompany,
    isLoading,
    switchCompany,
    getCompanyUrl,
    getCompanyTheme,
    getAvailableCompanies,
    companies: COMPANIES
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  );
};

export default CompanyProvider;