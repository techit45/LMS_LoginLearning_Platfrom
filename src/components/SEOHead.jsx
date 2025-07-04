import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEOHead = ({ 
  title, 
  description, 
  image, 
  url, 
  type = 'website',
  siteName = 'Login Learning',
  locale = 'th_TH',
  twitterCard = 'summary_large_image',
  useProfileImage = false // ใหม่: เลือกใช้ ProfileV3.png แทน Logo.png
}) => {
  const baseUrl = 'https://login-platform.netlify.app';
  const defaultImage = useProfileImage ? '/images/ProfileV3.png' : '/Logo.png';
  
  const fullUrl = url ? `${baseUrl}${url}` : baseUrl;
  const ogImage = image ? `${baseUrl}${image}` : `${baseUrl}${defaultImage}`;
  
  const fullTitle = title ? `${title} - ${siteName}` : siteName;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      
      {/* OpenGraph Tags */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content={locale} />
      
      {/* Twitter Card Tags */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      
      {/* Additional SEO Tags */}
      <meta name="robots" content="index, follow" />
      <meta name="author" content="Login Learning" />
      <link rel="canonical" href={fullUrl} />
      
      {/* Open Graph Image Dimensions */}
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:type" content="image/jpeg" />
      
      {/* Additional Twitter Tags */}
      <meta name="twitter:site" content="@loginlearning" />
      <meta name="twitter:creator" content="@loginlearning" />
    </Helmet>
  );
};

export default SEOHead;