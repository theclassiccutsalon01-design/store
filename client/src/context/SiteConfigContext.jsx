import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../services/api';

const SiteConfigContext = createContext();

export const SiteConfigProvider = ({ children }) => {
  const [config, setConfig] = useState(() => {
    try {
      const cached = localStorage.getItem('classic_cut_site_config');
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {}
    return {
      salonName: 'The Classic Cut Salon',
      tagline: 'Where Vintage Craftsmanship Meets Modern Luxury',
      aboutStory: 'Founded on the timeless traditions of classic gentleman grooming, The Classic Cut Salon delivers unmatched scissor craftsmanship, soothing hair therapy, and precision straight-razor beard styling in an ambiance of refined sophistication.',
      phone: '+91 93221 88848',
      whatsapp: '+919322188848',
      email: 'theclassiccutsalon01@gmail.com',
      address: 'At Gevrai jategaon road Rohithal, Tq gevrai dist beed 431127 Maharashtra',
      mapDirectionsUrl: 'https://www.google.com/maps/dir/?api=1&destination=19.2528181,75.8555902',
      mapEmbedUrl: 'https://maps.google.com/maps?q=19.2528181,75.8555902&hl=en&z=15&output=embed',
      openingHours: {
        weekday: 'Tuesday to Friday: 9:30 AM - 9:00 PM',
        weekend: 'Saturday & Sunday: 8:30 AM - 10:00 PM',
        monday: 'CLOSED (Shop is closed on every Monday)',
      },
      heroVideoUrl: '/video/salon-hero-video.mp4?v=20261010',
      defaultOfferTitle: 'Luxury Grooming Offer Coupon',
      defaultOfferDiscount: '25% to 50% OFF',
    };
  });
  const [loading, setLoading] = useState(false);

  const fetchConfig = async () => {
    try {
      const res = await API.get('/cms/config');
      if (res.data && res.data.salonName) {
        setConfig((prev) => {
          const merged = { ...prev, ...res.data };
          try {
            localStorage.setItem('classic_cut_site_config', JSON.stringify(merged));
          } catch (e) {}
          return merged;
        });
      }
    } catch (err) {
      // Quietly use cached/predefined verified defaults when backend server is in offline mode
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = async (newConfigData) => {
    const res = await API.put('/cms/config', newConfigData);
    if (res.data && res.data.config) {
      setConfig(res.data.config);
      try {
        localStorage.setItem('classic_cut_site_config', JSON.stringify(res.data.config));
      } catch (e) {}
      window.dispatchEvent(
        new CustomEvent('classic_cut_realtime', {
          detail: { type: 'SITE_CONFIG_UPDATED', config: res.data.config },
        })
      );
    }
    return res.data;
  };

  useEffect(() => {
    fetchConfig();

    const handleRealtime = (e) => {
      const data = e.detail;
      if (data && data.type === 'SITE_CONFIG_UPDATED' && data.config) {
        setConfig(data.config);
        try {
          localStorage.setItem('classic_cut_site_config', JSON.stringify(data.config));
        } catch (e) {}
      }
    };
    window.addEventListener('classic_cut_realtime', handleRealtime);
    return () => window.removeEventListener('classic_cut_realtime', handleRealtime);
  }, []);

  return (
    <SiteConfigContext.Provider
      value={{
        config,
        loading,
        updateConfig,
        refreshConfig: fetchConfig,
      }}
    >
      {children}
    </SiteConfigContext.Provider>
  );
};

export const useSiteConfig = () => useContext(SiteConfigContext);
