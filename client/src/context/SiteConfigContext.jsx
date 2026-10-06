import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../services/api';

const SiteConfigContext = createContext();

export const SiteConfigProvider = ({ children }) => {
  const [config, setConfig] = useState({
    salonName: 'The Classic Cut Salon',
    tagline: 'Where Vintage Craftsmanship Meets Modern Luxury',
    aboutStory: 'Founded on the timeless traditions of classic gentleman grooming, The Classic Cut Salon delivers unmatched scissor craftsmanship, soothing hair therapy, and precision straight-razor beard styling in an ambiance of refined sophistication.',
    phone: '+91 93221 88848',
    whatsapp: '+919322188848',
    email: 'sraut7285@gmail.com',
    address: 'At Gevrai jategaon road Rohithal, Tq gevrai dist beed 431127 Maharashtra',
    mapDirectionsUrl: 'https://www.google.com/maps/dir/?api=1&destination=19.2528181,75.8555902',
    mapEmbedUrl: 'https://maps.google.com/maps?q=19.2528181,75.8555902&hl=en&z=15&output=embed',
    openingHours: {
      weekday: 'Tuesday to Friday: 9:30 AM - 9:00 PM',
      weekend: 'Saturday & Sunday: 8:30 AM - 10:00 PM',
      monday: 'CLOSED (Shop is closed on every Monday)',
    },
    heroVideoUrl: '/video/backgroundvideo.mp4',
    defaultOfferTitle: 'Luxury Grooming Offer Coupon',
    defaultOfferDiscount: '30% to 40% OFF',
  });
  const [loading, setLoading] = useState(true);

  const fetchConfig = async () => {
    try {
      const res = await API.get('/cms/config');
      if (res.data && res.data.salonName) {
        setConfig(prev => ({ ...prev, ...res.data }));
      }
    } catch (err) {
      // Quietly use predefined verified defaults when backend server is in offline mode
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = async (newConfigData) => {
    const res = await API.put('/cms/config', newConfigData);
    setConfig(res.data.config);
    return res.data;
  };

  useEffect(() => {
    fetchConfig();
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
