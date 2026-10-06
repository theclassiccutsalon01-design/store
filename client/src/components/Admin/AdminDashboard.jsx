import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import { useSiteConfig } from '../../context/SiteConfigContext';
import API from '../../services/api';
import jsQR from 'jsqr';
import {
  ShieldCheck,
  Users,
  Settings,
  Plus,
  Search,
  CheckCircle,
  AlertCircle,
  Clock,
  Gift,
  QrCode,
  Save,
  Trash2,
  X,
  RotateCcw,
  AlertTriangle,
  Edit2,
  Lock,
  ChevronLeft,
  ChevronRight,
  Camera,
  Upload,
  Sparkles,
  RefreshCw,
  Crown,
  UserPlus,
  Shield,
  Bell,
  Calendar,
} from 'lucide-react';

const PaginationControl = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  itemLabel = 'items',
}) => {
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  if (totalItems === 0) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const getPageNumbers = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages = [];
    if (currentPage <= 3) {
      pages.push(1, 2, 3, 4, '...', totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
    }
    return pages;
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.85rem',
        marginTop: '1.25rem',
        padding: '0.85rem 0.25rem 0.25rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        fontSize: '0.82rem',
      }}
    >
      {/* Left: Record Range and Rows Per Page Dropdown */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
        <span style={{ color: '#cbd5e1' }}>
          Showing <strong style={{ color: 'var(--gold-primary)' }}>{startItem}–{endItem}</strong> of{' '}
          <strong style={{ color: '#ffffff' }}>{totalItems}</strong> {itemLabel}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--text-muted)' }}>
          <label htmlFor={`pagesize-${itemLabel}`} style={{ fontSize: '0.78rem' }}>
            Rows per page:
          </label>
          <select
            id={`pagesize-${itemLabel}`}
            value={pageSize}
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value));
              onPageChange(1);
            }}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              borderRadius: '8px',
              color: '#ffffff',
              padding: '0.22rem 0.55rem',
              fontSize: '0.78rem',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value={5} style={{ background: '#12151e', color: '#fff' }}>5</option>
            <option value={10} style={{ background: '#12151e', color: '#fff' }}>10</option>
            <option value={20} style={{ background: '#12151e', color: '#fff' }}>20</option>
            <option value={50} style={{ background: '#12151e', color: '#fff' }}>50</option>
          </select>
        </div>
      </div>

      {/* Right: Prev, Page Pills, Next */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className="btn btn-secondary btn-sm"
          style={{
            padding: '0.3rem 0.65rem',
            fontSize: '0.76rem',
            borderRadius: '8px',
            opacity: currentPage <= 1 ? 0.35 : 1,
            cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
          }}
          title="Previous Page"
        >
          <ChevronLeft size={14} />
          <span>Prev</span>
        </button>

        {getPageNumbers().map((p, idx) => {
          if (p === '...') {
            return (
              <span key={`dots-${idx}`} style={{ padding: '0 0.3rem', color: 'var(--text-muted)' }}>
                …
              </span>
            );
          }
          const isActive = p === currentPage;
          return (
            <button
              key={`page-${p}`}
              onClick={() => onPageChange(p)}
              style={{
                minWidth: '32px',
                height: '32px',
                padding: '0 0.35rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: isActive ? 800 : 500,
                border: isActive ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                background: isActive ? 'var(--gold-gradient)' : 'rgba(255, 255, 255, 0.04)',
                color: isActive ? '#0b0c10' : '#cbd5e1',
                boxShadow: isActive ? '0 0 10px rgba(212, 175, 55, 0.35)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {p}
            </button>
          );
        })}

        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          className="btn btn-secondary btn-sm"
          style={{
            padding: '0.3rem 0.65rem',
            fontSize: '0.76rem',
            borderRadius: '8px',
            opacity: currentPage >= totalPages ? 0.35 : 1,
            cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
          }}
          title="Next Page"
        >
          <span>Next</span>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};

export const AdminDashboard = ({ isOpen, onClose }) => {
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const { config, updateConfig, refreshConfig } = useSiteConfig();

  const [activeTab, setActiveTab] = useState('stamps'); // 'stamps' | 'cms' | 'recovery' | 'redeem' | 'staff'
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', msg: '' });

  // Staff Admins State (Super Admin Only)
  const [staffList, setStaffList] = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [newAdminForm, setNewAdminForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [addAdminLoading, setAddAdminLoading] = useState(false);

  // Visit history modal
  const [selectedCustomerHistory, setSelectedCustomerHistory] = useState(null);
  const [historyVisits, setHistoryVisits] = useState([]);

  // Coupon redemption code & QR scanner state
  const [redeemCode, setRedeemCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const [redeemLoading, setRedeemLoading] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanAnimRef = useRef(null);
  const fileInputRef = useRef(null);

  // CMS Form state
  const [cmsForm, setCmsForm] = useState({ ...config });

  // Recovery / Deleted Customers state
  const [deletedCustomers, setDeletedCustomers] = useState([]);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Edit Customer state (Name & Phone only, Email is locked)
  const [customerToEdit, setCustomerToEdit] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', phone: '' });
  const [editLoading, setEditLoading] = useState(false);

  // Customer Management Pagination
  const [customerPage, setCustomerPage] = useState(1);
  const [customerPageSize, setCustomerPageSize] = useState(5);

  // Deleted Accounts Pagination
  const [deletedPage, setDeletedPage] = useState(1);
  const [deletedPageSize, setDeletedPageSize] = useState(5);

  // Paginated active customers calculation
  const totalCustomerPages = Math.ceil(customers.length / customerPageSize) || 1;
  const validCustomerPage = Math.min(Math.max(1, customerPage), totalCustomerPages);
  const paginatedCustomers = customers.slice(
    (validCustomerPage - 1) * customerPageSize,
    validCustomerPage * customerPageSize
  );

  // Paginated deleted customers calculation
  const totalDeletedPages = Math.ceil(deletedCustomers.length / deletedPageSize) || 1;
  const validDeletedPage = Math.min(Math.max(1, deletedPage), totalDeletedPages);
  const paginatedDeleted = deletedCustomers.slice(
    (validDeletedPage - 1) * deletedPageSize,
    validDeletedPage * deletedPageSize
  );

  // Coupon Management & Expiry Extension State
  const [couponsList, setCouponsList] = useState([]);
  const [couponStats, setCouponStats] = useState({ total: 0, active: 0, expiringSoon: 0, expired: 0, redeemed: 0 });
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [couponFilterStatus, setCouponFilterStatus] = useState('all'); // 'all' | 'expiring_soon' | 'active' | 'expired' | 'redeemed'
  const [couponSearchQuery, setCouponSearchQuery] = useState('');
  const [couponToExtend, setCouponToExtend] = useState(null);
  const [extendDays, setExtendDays] = useState(15);
  const [extendCustomDate, setExtendCustomDate] = useState('');
  const [extendLoading, setExtendLoading] = useState(false);
  const [extendMsg, setExtendMsg] = useState('');
  const [extendError, setExtendError] = useState('');
  const [couponPage, setCouponPage] = useState(1);
  const [couponPageSize, setCouponPageSize] = useState(5);

  // Paginated coupons calculation
  const totalCouponPages = Math.ceil(couponsList.length / couponPageSize) || 1;
  const validCouponPage = Math.min(Math.max(1, couponPage), totalCouponPages);
  const paginatedCoupons = couponsList.slice(
    (validCouponPage - 1) * couponPageSize,
    validCouponPage * couponPageSize
  );

  useEffect(() => {
    if (config) {
      setCmsForm({ ...config });
    }
  }, [config]);

  // Load Active Customers
  const fetchCustomers = async (search = '') => {
    setLoading(true);
    try {
      const res = await API.get(`/loyalty/customers?search=${encodeURIComponent(search)}`);
      setCustomers(res.data);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load Deleted Customers in 24h recovery
  const fetchDeletedCustomers = async () => {
    try {
      const res = await API.get('/loyalty/deleted-customers');
      setDeletedCustomers(res.data);
    } catch (err) {
      console.error('Failed to load deleted customers:', err);
    }
  };

  // Load Staff Admins (Super Admin Only)
  const fetchStaffList = async () => {
    if (!isSuperAdmin) return;
    setStaffLoading(true);
    try {
      const res = await API.get('/admin/staff');
      setStaffList(res.data);
    } catch (err) {
      console.error('Failed to load staff list:', err);
    } finally {
      setStaffLoading(false);
    }
  };

  // Load All Offer Coupons (Active, Expiring Soon, Expired, Redeemed)
  const fetchCoupons = async (status = couponFilterStatus, search = couponSearchQuery) => {
    setCouponsLoading(true);
    try {
      const res = await API.get('/loyalty/all-coupons', {
        params: { status, search },
      });
      setCouponsList(res.data.coupons || []);
      setCouponStats(res.data.stats || { total: 0, active: 0, expiringSoon: 0, expired: 0, redeemed: 0 });
    } catch (err) {
      console.error('Failed to load coupons:', err);
    } finally {
      setCouponsLoading(false);
    }
  };

  // Extend or Increase Coupon Expiry Date
  const handleExtendCoupon = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!couponToExtend) return;
    setExtendLoading(true);
    setExtendError('');
    setExtendMsg('');
    try {
      const res = await API.put(`/loyalty/coupons/${couponToExtend._id}/extend`, {
        daysToAdd: extendCustomDate ? undefined : extendDays,
        customDate: extendCustomDate || undefined,
      });
      setExtendMsg(res.data.message || 'Validity extended successfully!');
      setFeedback({ type: 'success', msg: res.data.message });
      await fetchCoupons(couponFilterStatus, couponSearchQuery);
      await fetchCustomers(searchQuery);
      setTimeout(() => {
        setCouponToExtend(null);
        setExtendMsg('');
        setExtendCustomDate('');
      }, 1200);
    } catch (err) {
      setExtendError(err.response?.data?.message || 'Failed to extend coupon validity.');
    } finally {
      setExtendLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && isAdmin) {
      fetchCustomers(searchQuery);
      fetchDeletedCustomers();
      fetchCoupons(couponFilterStatus, couponSearchQuery);
      if (isSuperAdmin) {
        fetchStaffList();
      }
    }
  }, [isOpen, isAdmin, isSuperAdmin, searchQuery, couponFilterStatus, couponSearchQuery]);

  // Zero-Reload Real-time Updates Listener
  useEffect(() => {
    const handleRealtime = (e) => {
      const data = e.detail;
      if (!data) return;

      if (data.type === 'STAMP_AWARDED') {
        fetchCoupons(couponFilterStatus, couponSearchQuery);
        setCustomers((prevCustomers) =>
          prevCustomers.map((c) =>
            c._id === data.userId
              ? {
                  ...c,
                  currentStamps: data.currentStamps,
                  lifetimeVisits: data.lifetimeVisits || (c.lifetimeVisits || 0) + 1,
                  activeCouponsCount: data.offerUnlocked ? (c.activeCouponsCount || 0) + 1 : c.activeCouponsCount,
                  lastServiceName: data.serviceName || c.lastServiceName,
                  lastVisitDate: data.lastStampDate || new Date().toISOString(),
                }
              : c
          )
        );
      } else if (data.type === 'COUPON_REDEEMED' || data.type === 'COUPON_EXTENDED') {
        fetchCoupons(couponFilterStatus, couponSearchQuery);
        setCustomers((prevCustomers) =>
          prevCustomers.map((c) =>
            c._id === data.userId
              ? {
                  ...c,
                  activeCouponsCount: Math.max(0, (c.activeCouponsCount || 1) - 1),
                }
              : c
          )
        );
      } else if (data.type === 'CUSTOMER_UPDATED') {
        setCustomers((prevCustomers) =>
          prevCustomers.map((c) =>
            c._id === data.userId
              ? {
                  ...c,
                  name: data.name || c.name,
                  phone: data.phone || c.phone,
                }
              : c
          )
        );
      } else if (data.type === 'ADMIN_LIST_CHANGED') {
        if (isSuperAdmin) {
          fetchStaffList();
        }
      }
    };

    window.addEventListener('classic_cut_realtime', handleRealtime);
    return () => window.removeEventListener('classic_cut_realtime', handleRealtime);
  }, [isSuperAdmin]);

  if (!isOpen || !isAdmin) return null;

  // 1. Award +1 Stamp to Customer (Fixed Position: updates in place so customer never jumps)
  const handleAwardStamp = async (customer) => {
    try {
      const serviceName = window.prompt(
        `Enter Service Name for ${customer.name} (or leave blank for standard haircut):`,
        'Gentleman Haircut & Styling'
      );
      if (serviceName === null) return; // User cancelled

      const res = await API.post('/loyalty/add-stamp', {
        userId: customer._id,
        serviceName: serviceName || 'Salon Grooming & Haircut',
        notes: 'Awarded at salon counter by admin',
      });

      setFeedback({
        type: 'success',
        msg: res.data.message,
      });

      // Update customer in place in local state so their position remains 100% stable!
      setCustomers((prevCustomers) =>
        prevCustomers.map((c) =>
          c._id === customer._id
            ? {
                ...c,
                currentStamps: res.data.currentStamps,
                activeCouponsCount: res.data.offerUnlocked ? (c.activeCouponsCount || 0) + 1 : c.activeCouponsCount,
                lastServiceName: serviceName || 'Salon Grooming & Haircut',
                lastVisitDate: new Date().toISOString(),
              }
            : c
        )
      );
    } catch (err) {
      setFeedback({
        type: 'error',
        msg: err.response?.data?.message || 'Failed to award stamp',
      });
    }
  };

  // 2. View Customer Visit History
  const handleViewHistory = async (customer) => {
    try {
      const res = await API.get(`/loyalty/visits/${customer._id}`);
      setSelectedCustomerHistory(customer);
      setHistoryVisits(res.data);
    } catch (err) {
      alert('Could not fetch visit history');
    }
  };

  // 3. Redeem Coupon Code (Direct string or form submit)
  const executeRedeem = async (codeToRedeem) => {
    const targetCode = (codeToRedeem || redeemCode).trim().toUpperCase();
    if (!targetCode) return;
    setRedeemLoading(true);
    try {
      const res = await API.post('/loyalty/redeem-coupon', { code: targetCode });
      setFeedback({ type: 'success', msg: res.data.message });
      setRedeemCode('');
      // Refresh customer list to update coupon counts
      fetchCustomers(searchQuery);
    } catch (err) {
      setFeedback({
        type: 'error',
        msg: err.response?.data?.message || 'Failed to redeem coupon',
      });
    } finally {
      setRedeemLoading(false);
    }
  };

  const handleRedeemCoupon = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    executeRedeem();
  };

  // Camera QR Scanner Functions
  const stopCameraScanner = () => {
    setIsScanning(false);
    if (scanAnimRef.current) {
      cancelAnimationFrame(scanAnimRef.current);
      scanAnimRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setScannerError('');
  };

  const scanQrFrame = () => {
    if (!videoRef.current || !streamRef.current) return;
    const video = videoRef.current;
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const decoded = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });
      if (decoded && decoded.data) {
        let code = decoded.data.trim().toUpperCase();
        const match = code.match(/CUT-[A-Z0-9]{6}/);
        if (match) {
          code = match[0];
        }
        stopCameraScanner();
        setRedeemCode(code);
        executeRedeem(code);
        return;
      }
    }
    scanAnimRef.current = requestAnimationFrame(scanQrFrame);
  };

  const startCameraScanner = async () => {
    setScannerError('');
    setIsScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        scanAnimRef.current = requestAnimationFrame(scanQrFrame);
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setScannerError('Could not access camera. Please allow camera permissions or enter coupon code manually.');
    }
  };

  // Image Upload QR Decode Fallback
  const handleFileUploadQr = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const decoded = jsQR(imgData.data, imgData.width, imgData.height);
        if (decoded && decoded.data) {
          let foundCode = decoded.data.trim().toUpperCase();
          const match = foundCode.match(/CUT-[A-Z0-9]{6}/);
          if (match) foundCode = match[0];
          setRedeemCode(foundCode);
          stopCameraScanner();
          executeRedeem(foundCode);
        } else {
          setScannerError('No valid salon coupon QR detected in this image. Please try another or type the code.');
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Auto clean-up camera on tab switch or close
  useEffect(() => {
    if (!isOpen || activeTab !== 'redeem') {
      stopCameraScanner();
    }
  }, [isOpen, activeTab]);

  // 4. Save CMS Configuration
  const handleSaveCms = async (e) => {
    e.preventDefault();
    try {
      await updateConfig(cmsForm);
      setFeedback({ type: 'success', msg: 'Salon website configuration updated live!' });
      refreshConfig();
    } catch (err) {
      setFeedback({ type: 'error', msg: 'Failed to update CMS' });
    }
  };

  // 5. Delete Customer (Soft-delete to 24h recovery)
  const handleConfirmDeleteCustomer = async () => {
    if (!customerToDelete) return;
    setDeleteLoading(true);
    try {
      const res = await API.delete(`/loyalty/customers/${customerToDelete._id}`);
      setFeedback({ type: 'success', msg: res.data.message });
      setCustomerToDelete(null);
      fetchCustomers(searchQuery);
      fetchDeletedCustomers();
    } catch (err) {
      setFeedback({
        type: 'error',
        msg: err.response?.data?.message || 'Failed to delete customer',
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  // 6. Restore Customer within 24 Hours
  const handleRestoreCustomer = async (id) => {
    try {
      const res = await API.post(`/loyalty/customers/${id}/restore`);
      setFeedback({ type: 'success', msg: res.data.message });
      fetchCustomers(searchQuery);
      fetchDeletedCustomers();
    } catch (err) {
      setFeedback({
        type: 'error',
        msg: err.response?.data?.message || 'Failed to restore customer',
      });
    }
  };

  // 7. Permanent Purge Immediately
  const handlePermanentDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to permanently erase ${name || 'this customer'} from MongoDB? This action cannot be undone.`)) {
      return;
    }
    try {
      const res = await API.delete(`/loyalty/customers/${id}/permanent`);
      setFeedback({ type: 'success', msg: res.data.message });
      fetchDeletedCustomers();
    } catch (err) {
      setFeedback({
        type: 'error',
        msg: err.response?.data?.message || 'Failed to permanently delete customer',
      });
    }
  };

  // 8. Open Edit Customer Modal (Name & Phone only)
  const handleOpenEditCustomer = (customer) => {
    setCustomerToEdit(customer);
    const rawDigits = (customer.phone || '').replace(/[^0-9]/g, '');
    const displayPhone = rawDigits.length === 12 && rawDigits.startsWith('91') ? rawDigits.slice(2) : rawDigits;
    setEditForm({
      name: customer.name || '',
      phone: displayPhone || '',
    });
  };

  // 9. Save Edit Customer
  const handleSaveEditCustomer = async (e) => {
    e.preventDefault();
    if (!customerToEdit) return;
    if (!editForm.name.trim()) {
      setFeedback({ type: 'error', msg: 'Customer name is required' });
      return;
    }
    setEditLoading(true);
    try {
      const res = await API.put(`/loyalty/customers/${customerToEdit._id}`, {
        name: editForm.name,
        phone: editForm.phone,
      });
      setFeedback({ type: 'success', msg: res.data.message });
      setCustomerToEdit(null);
      fetchCustomers(searchQuery);
    } catch (err) {
      setFeedback({
        type: 'error',
        msg: err.response?.data?.message || 'Failed to update customer',
      });
    } finally {
      setEditLoading(false);
    }
  };

  // 10. Super Admin: Promote existing user to staff admin
  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    if (!newAdminForm.email.trim()) {
      setFeedback({ type: 'error', msg: 'Registered customer email is required.' });
      return;
    }
    setAddAdminLoading(true);
    try {
      const res = await API.post('/admin/staff', { email: newAdminForm.email.trim() });
      setFeedback({ type: 'success', msg: res.data.message });
      setShowAddAdminModal(false);
      setNewAdminForm({ name: '', email: '', phone: '', password: '' });
      fetchStaffList();
    } catch (err) {
      setFeedback({
        type: 'error',
        msg: err.response?.data?.message || 'Failed to promote user to admin',
      });
    } finally {
      setAddAdminLoading(false);
    }
  };

  // 11. Super Admin: Delete staff admin
  const handleDeleteAdmin = async (adminId, adminName) => {
    if (!window.confirm(`Are you sure you want to remove ${adminName} from Admin Staff? This action cannot be undone.`)) {
      return;
    }
    try {
      const res = await API.delete(`/admin/staff/${adminId}`);
      setFeedback({ type: 'success', msg: res.data.message });
      fetchStaffList();
    } catch (err) {
      setFeedback({
        type: 'error',
        msg: err.response?.data?.message || 'Failed to remove staff admin',
      });
    }
  };

  return (
    <div
      className="modal-overlay"
      data-lenis-prevent="true"
      onClick={onClose}
      onTouchMove={(e) => {
        if (e.target === e.currentTarget) {
          e.preventDefault();
        }
      }}
    >
      <div
        className="modal-content admin-modal-content"
        data-lenis-prevent="true"
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
        style={{
          maxWidth: '920px',
          width: '96%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 'clamp(0.85rem, 3vw, 1.75rem)',
          background: '#11131a',
          border: '1px solid var(--border-glow)',
          overscrollBehavior: 'contain',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: 'rgba(197, 34, 34, 0.2)',
                color: 'var(--crimson-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(197, 34, 34, 0.4)',
                flexShrink: 0,
              }}
            >
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: 'clamp(1.05rem, 3.5vw, 1.35rem)', color: '#ffffff', lineHeight: 1.25, margin: 0 }}>
                Admin Central Command
              </h3>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
                Full control over Customer Accounts, Visits & Live Website CMS
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '0.35rem',
            }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback.msg && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '1rem',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: feedback.type === 'success' ? 'rgba(46, 204, 113, 0.15)' : 'rgba(197, 34, 34, 0.15)',
              border: feedback.type === 'success' ? '1px solid rgba(46, 204, 113, 0.4)' : '1px solid rgba(197, 34, 34, 0.4)',
              color: feedback.type === 'success' ? '#2ecc71' : '#ff8080',
            }}
          >
            <span>{feedback.msg}</span>
            <button
              onClick={() => setFeedback({ type: '', msg: '' })}
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Nav Tabs (Responsive 2x2 Grid on Mobile, No Horizontal Scrollbar) */}
        <div className="admin-nav-tabs">
          <button
            onClick={() => setActiveTab('stamps')}
            className={`btn btn-sm ${activeTab === 'stamps' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'center', textAlign: 'center', whiteSpace: 'normal', height: 'auto', padding: '0.5rem 0.5rem' }}
          >
            <Users size={14} />
            <span style={{ fontSize: '0.78rem' }}>Customers ({customers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('redeem')}
            className={`btn btn-sm ${activeTab === 'redeem' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'center', textAlign: 'center', whiteSpace: 'normal', height: 'auto', padding: '0.5rem 0.5rem' }}
          >
            <QrCode size={14} />
            <span style={{ fontSize: '0.78rem' }}>Redeem Coupon</span>
          </button>

          <button
            onClick={() => setActiveTab('cms')}
            className={`btn btn-sm ${activeTab === 'cms' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'center', textAlign: 'center', whiteSpace: 'normal', height: 'auto', padding: '0.5rem 0.5rem' }}
          >
            <Settings size={14} />
            <span style={{ fontSize: '0.78rem' }}>Website CMS</span>
          </button>

          <button
            onClick={() => setActiveTab('recovery')}
            className={`btn btn-sm ${activeTab === 'recovery' ? 'btn-primary' : 'btn-secondary'}`}
            style={{
              justifyContent: 'center',
              textAlign: 'center',
              whiteSpace: 'normal',
              height: 'auto',
              padding: '0.5rem 0.5rem',
              ...(activeTab === 'recovery' ? { background: '#c52222', borderColor: '#ff4d4d' } : {}),
            }}
          >
            <RotateCcw size={14} />
            <span style={{ fontSize: '0.78rem' }}>Deleted ({deletedCustomers.length})</span>
          </button>

          {isSuperAdmin && (
            <button
              onClick={() => {
                setActiveTab('staff');
                fetchStaffList();
              }}
              className={`btn btn-sm ${activeTab === 'staff' ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                justifyContent: 'center',
                textAlign: 'center',
                whiteSpace: 'normal',
                height: 'auto',
                padding: '0.5rem 0.5rem',
                ...(activeTab === 'staff'
                  ? { background: 'linear-gradient(135deg, #d4af37 0%, #aa820a 100%)', color: '#0b0c10', fontWeight: 700 }
                  : {}),
              }}
            >
              <Crown size={14} />
              <span style={{ fontSize: '0.78rem' }}>👑 Staff Admins ({staffList.length})</span>
            </button>
          )}
        </div>

        {/* Tab Content Container */}
        <div
          data-lenis-prevent="true"
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            touchAction: 'pan-y',
            paddingRight: '0.5rem',
          }}
        >
          {/* ========================================================================= */}
          {/* TAB 1: CUSTOMER STAMPS & VISITS */}
          {/* ========================================================================= */}
          {activeTab === 'stamps' && (
            <div>
              {/* Search Bar */}
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input
                    type="text"
                    placeholder="Search by customer name, mobile or email..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCustomerPage(1);
                      fetchCustomers(e.target.value);
                    }}
                    className="input-field"
                    style={{ paddingLeft: '2.5rem' }}
                  />
                  <Search
                    size={18}
                    style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                  />
                </div>
              </div>

              {/* Desktop Customers Table */}
              <div className="admin-desktop-table">
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '0.85rem',
                    textAlign: 'left',
                  }}
                >
                  <thead>
                    <tr style={{ background: 'rgba(255, 255, 255, 0.04)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>Customer</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Contact</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Coupon Stamps</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Last Visit Date</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Active Rewards</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                          {searchQuery ? `No customers found matching "${searchQuery}".` : 'No customers registered yet.'}
                        </td>
                      </tr>
                    ) : (
                      paginatedCustomers.map((c) => (
                      <tr
                        key={c._id}
                        style={{
                          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                          transition: 'background 0.2s ease',
                        }}
                      >
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#ffffff' }}>
                          {c.name}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>
                          <div>{c.phone || 'No phone'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.email}</div>
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span
                            style={{
                              padding: '0.25rem 0.65rem',
                              borderRadius: 'var(--radius-full)',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              background: c.currentStamps === 4 ? 'rgba(197, 34, 34, 0.25)' : 'rgba(212, 175, 55, 0.15)',
                              color: c.currentStamps === 4 ? '#ff8080' : 'var(--gold-primary)',
                              border: '1px solid currentColor',
                            }}
                          >
                            ✂️ {c.currentStamps}/5 Stamps
                          </span>
                          {c.currentStamps > 0 && c.daysUntilStampDecay !== undefined && (
                            <div style={{ fontSize: '0.68rem', color: '#fca5a5', marginTop: '0.2rem', fontWeight: 600 }}>
                              ⏳ Due in {c.daysUntilStampDecay}m (Test)
                            </div>
                          )}
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                            Lifetime: {c.lifetimeVisits}
                          </div>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', color: '#cbd5e1' }}>
                          {c.lastVisitDate ? (
                            <div>
                              <div>{new Date(c.lastVisitDate).toLocaleDateString()}</div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                {new Date(c.lastVisitDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>First visit pending</span>
                          )}
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          {c.activeCouponsCount > 0 ? (
                            <span className="badge badge-green">
                              🎁 {c.activeCouponsCount} Available
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>None</span>
                          )}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                            <button
                              onClick={() => handleAwardStamp(c)}
                              className="btn btn-primary btn-sm"
                              title="Award 1 Coupon Stamp for this visit"
                              style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                            >
                              +1 Coupon Stamp
                            </button>
                            <button
                              onClick={() => handleViewHistory(c)}
                              className="btn btn-secondary btn-sm"
                              title="View Visit Dates History"
                              style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                            >
                              <Clock size={14} />
                            </button>
                            <button
                              onClick={() => handleOpenEditCustomer(c)}
                              className="btn btn-secondary btn-sm"
                              title="Edit Customer Name & Mobile"
                              style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', color: 'var(--gold-primary)' }}
                            >
                              <Edit2 size={14} />
                            </button>
                            {c.role !== 'admin' && c.role !== 'superadmin' && (
                              <button
                                onClick={() => setCustomerToDelete(c)}
                                className="btn btn-sm"
                                title="Delete Customer (24h Recovery Window)"
                                style={{
                                  padding: '0.35rem 0.6rem',
                                  fontSize: '0.75rem',
                                  background: 'rgba(239, 68, 68, 0.15)',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                  color: '#ff6b6b',
                                }}
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Customer Cards (Zero Horizontal Scroll) */}
              <div className="admin-mobile-cards">
                {customers.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                    {searchQuery ? `No customers found matching "${searchQuery}".` : 'No customers registered yet.'}
                  </div>
                ) : (
                  paginatedCustomers.map((c) => (
                    <div
                      key={`mob-${c._id}`}
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.85rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.6rem',
                      }}
                    >
                      {/* Name & Stamp Badge */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#ffffff' }}>{c.name}</div>
                        <span
                          style={{
                            padding: '0.2rem 0.6rem',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background: c.currentStamps === 4 ? 'rgba(197, 34, 34, 0.25)' : 'rgba(212, 175, 55, 0.15)',
                            color: c.currentStamps === 4 ? '#ff8080' : 'var(--gold-primary)',
                            border: '1px solid currentColor',
                          }}
                        >
                          ✂️ {c.currentStamps}/5 Stamps
                        </span>
                      </div>

                      {/* Contact & Visit Meta */}
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        {c.phone && <div>📞 {c.phone}</div>}
                        <div style={{ color: 'var(--text-muted)' }}>✉️ {c.email}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem', fontSize: '0.72rem', flexWrap: 'wrap', gap: '0.25rem' }}>
                          <span style={{ color: '#cbd5e1' }}>
                            Last Visit: {c.lastVisitDate ? new Date(c.lastVisitDate).toLocaleDateString() : 'First visit pending'}
                          </span>
                          {c.activeCouponsCount > 0 ? (
                            <span className="badge badge-green" style={{ fontSize: '0.65rem' }}>
                              🎁 {c.activeCouponsCount} Active
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>Lifetime: {c.lifetimeVisits}</span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.2rem' }}>
                        <button
                          onClick={() => handleAwardStamp(c)}
                          className="btn btn-primary btn-sm"
                          style={{ flex: 1, padding: '0.45rem', fontSize: '0.75rem', justifyContent: 'center' }}
                        >
                          +1 Coupon Stamp
                        </button>
                        <button
                          onClick={() => handleViewHistory(c)}
                          className="btn btn-secondary btn-sm"
                          title="View Visit History"
                          style={{ padding: '0.45rem 0.65rem' }}
                        >
                          <Clock size={14} />
                        </button>
                        <button
                          onClick={() => handleOpenEditCustomer(c)}
                          className="btn btn-secondary btn-sm"
                          title="Edit Customer"
                          style={{ padding: '0.45rem 0.65rem', color: 'var(--gold-primary)' }}
                        >
                          <Edit2 size={14} />
                        </button>
                        {c.role !== 'admin' && c.role !== 'superadmin' && (
                          <button
                            onClick={() => setCustomerToDelete(c)}
                            className="btn btn-sm"
                            title="Delete Customer"
                            style={{
                              padding: '0.45rem 0.65rem',
                              background: 'rgba(239, 68, 68, 0.15)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              color: '#ff6b6b',
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Customer Pagination Controls */}
              <PaginationControl
                currentPage={validCustomerPage}
                totalItems={customers.length}
                pageSize={customerPageSize}
                onPageChange={setCustomerPage}
                onPageSizeChange={setCustomerPageSize}
                itemLabel="customers"
              />
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: REDEEM COUPON AT COUNTER */}
          {/* ========================================================================= */}
          {activeTab === 'redeem' && (
            <div>
              <div style={{ maxWidth: '560px', margin: '1rem auto 2rem', textAlign: 'center' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(212, 175, 55, 0.15)',
                  border: '1px solid rgba(212, 175, 55, 0.4)',
                  color: 'var(--gold-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem',
                  boxShadow: '0 0 20px rgba(212, 175, 55, 0.25)',
                }}
              >
                <QrCode size={32} />
              </div>

              <h4 style={{ fontSize: '1.35rem', marginBottom: '0.45rem', color: '#ffffff' }}>
                Counter Offer Coupon Redemption
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                Scan the customer's QR code using your camera or enter their 6-character coupon code below to verify and redeem their 30% to 40% OFF grooming reward coupon.
              </p>

              {/* QR Scanner Controls */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(212, 175, 55, 0.25)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  marginBottom: '1.75rem',
                }}
              >
                {!isScanning ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <button
                      type="button"
                      onClick={startCameraScanner}
                      className="btn btn-primary"
                      style={{
                        padding: '0.85rem 1.25rem',
                        fontSize: '0.92rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        width: '100%',
                      }}
                    >
                      <Camera size={18} />
                      <span>📷 Open Camera & Scan QR Code</span>
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleFileUploadQr}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="btn btn-secondary btn-sm"
                        style={{
                          padding: '0.45rem 1rem',
                          fontSize: '0.78rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                        }}
                      >
                        <Upload size={14} />
                        <span>Upload QR Screenshot</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {/* Live Video Viewfinder with Gold Target Frame */}
                    <div
                      style={{
                        position: 'relative',
                        width: '100%',
                        maxWidth: '340px',
                        aspectRatio: '1 / 1',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        border: '2px solid var(--gold-primary)',
                        boxShadow: '0 0 25px rgba(212, 175, 55, 0.4)',
                        background: '#07090e',
                      }}
                    >
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />

                      {/* Viewfinder Target Frame Corners */}
                      <div
                        style={{
                          position: 'absolute',
                          inset: '24px',
                          border: '2px dashed rgba(212, 175, 55, 0.8)',
                          borderRadius: '12px',
                          pointerEvents: 'none',
                        }}
                      />

                      {/* Animated Laser Scanning Beam */}
                      <div
                        style={{
                          position: 'absolute',
                          left: '10%',
                          right: '10%',
                          height: '3px',
                          background: 'linear-gradient(90deg, transparent, #ffd700, #ffffff, #ffd700, transparent)',
                          boxShadow: '0 0 12px #ffd700',
                          animation: 'laserScan 2.4s ease-in-out infinite',
                          pointerEvents: 'none',
                        }}
                      />
                    </div>

                    <p style={{ fontSize: '0.78rem', color: '#cbd5e1', marginTop: '0.75rem', marginBottom: '0.75rem' }}>
                      Point camera directly at the customer's coupon QR code...
                    </p>

                    <button
                      type="button"
                      onClick={stopCameraScanner}
                      className="btn btn-secondary btn-sm"
                      style={{
                        padding: '0.45rem 1.25rem',
                        fontSize: '0.8rem',
                        borderColor: 'rgba(239, 68, 68, 0.4)',
                        color: '#ff8080',
                      }}
                    >
                      <X size={14} />
                      <span>Close Camera Scanner</span>
                    </button>
                  </div>
                )}

                {scannerError && (
                  <div
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#ff8080',
                      padding: '0.6rem 0.8rem',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      textAlign: 'left',
                    }}
                  >
                    <AlertCircle size={15} style={{ flexShrink: 0 }} />
                    <span>{scannerError}</span>
                  </div>
                )}
              </div>

              {/* Manual Code Entry Form */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', letterSpacing: '0.08em', fontWeight: 600 }}>
                  OR ENTER CODE MANUALLY
                </span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
              </div>

              <form onSubmit={handleRedeemCoupon}>
                <div className="input-group" style={{ marginBottom: '1rem' }}>
                  <input
                    type="text"
                    required
                    placeholder="Enter Coupon Code (e.g. CUT-7K9W2X)"
                    value={redeemCode}
                    onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                    className="input-field"
                    style={{
                      textAlign: 'center',
                      fontFamily: 'monospace',
                      fontSize: '1.3rem',
                      letterSpacing: '0.12em',
                      fontWeight: 700,
                      color: 'var(--gold-primary)',
                      border: '1.5px solid rgba(212, 175, 55, 0.5)',
                      background: 'rgba(0, 0, 0, 0.4)',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={redeemLoading || !redeemCode.trim()}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    opacity: redeemLoading || !redeemCode.trim() ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.45rem',
                  }}
                >
                  {redeemLoading ? (
                    <>
                      <RefreshCw size={16} className="spin" />
                      <span>Verifying & Redeeming...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      <span>Verify & Redeem Offer Coupon</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Gold Divider */}
            <div
              style={{
                height: '1px',
                background: 'radial-gradient(ellipse at center, rgba(212, 175, 55, 0.4) 0%, transparent 75%)',
                margin: '2.5rem 0 1.5rem',
              }}
            />

            {/* Offer Coupon Expiry Control Center & Validity Extension */}
            <div style={{ marginTop: '1rem' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  marginBottom: '1rem',
                }}
              >
                <div>
                  <h3 style={{ fontSize: '1.25rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                    <Gift size={20} color="var(--gold-primary)" />
                    <span>Offer Coupons & Expiry Control Center</span>
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
                    Track 35-day duration deadlines, 5-day advance warnings, and extend validity dates directly.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => fetchCoupons(couponFilterStatus, couponSearchQuery)}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <RefreshCw size={13} className={couponsLoading ? 'spin' : ''} />
                  <span>Refresh List</span>
                </button>
              </div>

              {/* Filter Status Pills */}
              <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                {[
                  { id: 'all', label: `All Coupons (${couponStats.total})` },
                  { id: 'expiring_soon', label: `⚠️ Expiring in ≤5 Days (${couponStats.expiringSoon})`, urgent: couponStats.expiringSoon > 0 },
                  { id: 'active', label: `Active (${couponStats.active})` },
                  { id: 'expired', label: `Expired / Removed (${couponStats.expired})` },
                  { id: 'redeemed', label: `Redeemed (${couponStats.redeemed})` },
                ].map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => {
                      setCouponFilterStatus(filter.id);
                      setCouponPage(1);
                    }}
                    className={`btn btn-sm ${couponFilterStatus === filter.id ? 'btn-primary' : 'btn-secondary'}`}
                    style={{
                      fontSize: '0.76rem',
                      padding: '0.35rem 0.75rem',
                      ...(filter.urgent && couponFilterStatus !== filter.id
                        ? { borderColor: '#f59e0b', color: '#fbbf24', background: 'rgba(245, 158, 11, 0.1)' }
                        : {}),
                    }}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
                <Search size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search by coupon code, customer name, email, or mobile..."
                  value={couponSearchQuery}
                  onChange={(e) => {
                    setCouponSearchQuery(e.target.value);
                    setCouponPage(1);
                  }}
                  className="input-field"
                  style={{ paddingLeft: '2.4rem', fontSize: '0.86rem' }}
                />
              </div>

              {/* Coupons List */}
              {couponsLoading ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <RefreshCw size={22} className="spin" style={{ margin: '0 auto 0.5rem' }} />
                  <div>Loading coupons and validity status...</div>
                </div>
              ) : couponsList.length === 0 ? (
                <div
                  style={{
                    padding: '2rem',
                    textAlign: 'center',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px dashed rgba(255, 255, 255, 0.1)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-muted)',
                    fontSize: '0.86rem',
                  }}
                >
                  No coupons found matching your current filter.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {paginatedCoupons.map((coupon) => (
                    <div
                      key={coupon._id}
                      style={{
                        background: coupon.status === 'expired'
                          ? 'rgba(239, 68, 68, 0.04)'
                          : coupon.isExpiringSoon
                          ? 'rgba(245, 158, 11, 0.05)'
                          : 'rgba(255, 255, 255, 0.03)',
                        border: coupon.status === 'expired'
                          ? '1px dashed rgba(239, 68, 68, 0.35)'
                          : coupon.isExpiringSoon
                          ? '1.5px solid rgba(245, 158, 11, 0.5)'
                          : '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.65rem',
                      }}
                    >
                      {/* Top bar: Code, Badges, & Action */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontWeight: 800,
                              fontSize: '1.05rem',
                              color: coupon.status === 'expired' ? '#f87171' : 'var(--gold-primary)',
                              background: 'rgba(0, 0, 0, 0.5)',
                              padding: '0.2rem 0.6rem',
                              borderRadius: '6px',
                              border: '1px solid currentColor',
                              letterSpacing: '0.08em',
                            }}
                          >
                            {coupon.code}
                          </span>

                          {coupon.status === 'expired' ? (
                            <span
                              style={{
                                background: 'rgba(239, 68, 68, 0.2)',
                                color: '#fca5a5',
                                border: '1px solid #ef4444',
                                padding: '0.15rem 0.5rem',
                                borderRadius: '4px',
                                fontSize: '0.68rem',
                                fontWeight: 700,
                              }}
                            >
                              EXPIRED
                            </span>
                          ) : coupon.status === 'redeemed' ? (
                            <span
                              style={{
                                background: 'rgba(59, 130, 246, 0.15)',
                                color: '#93c5fd',
                                border: '1px solid #3b82f6',
                                padding: '0.15rem 0.5rem',
                                borderRadius: '4px',
                                fontSize: '0.68rem',
                                fontWeight: 700,
                              }}
                            >
                              REDEEMED
                            </span>
                          ) : coupon.isExpiringSoon ? (
                            <span
                              style={{
                                background: 'rgba(245, 158, 11, 0.2)',
                                color: '#fbbf24',
                                border: '1px solid #f59e0b',
                                padding: '0.15rem 0.5rem',
                                borderRadius: '4px',
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                              }}
                            >
                              <Bell size={11} /> EXPIRES IN {coupon.daysRemaining} DAY{coupon.daysRemaining === 1 ? '' : 'S'}
                            </span>
                          ) : (
                            <span
                              style={{
                                background: 'rgba(46, 204, 113, 0.15)',
                                color: '#2ecc71',
                                border: '1px solid #2ecc71',
                                padding: '0.15rem 0.5rem',
                                borderRadius: '4px',
                                fontSize: '0.68rem',
                                fontWeight: 700,
                              }}
                            >
                              ACTIVE
                            </span>
                          )}
                        </div>

                        {/* Quick Extend Expiry Date Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setCouponToExtend(coupon);
                            setExtendDays(15);
                            setExtendCustomDate('');
                            setExtendMsg('');
                            setExtendError('');
                          }}
                          className="btn btn-secondary btn-sm"
                          style={{
                            borderColor: 'var(--gold-primary)',
                            color: 'var(--gold-primary)',
                            fontSize: '0.78rem',
                            padding: '0.35rem 0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                          }}
                        >
                          <Calendar size={13} />
                          <span>{coupon.status === 'expired' ? 'Reactivate & Extend Expiry' : 'Increase Expiry Date'}</span>
                        </button>
                      </div>

                      {/* Customer & Offer Meta */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem', fontSize: '0.78rem', marginTop: '0.2rem' }}>
                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>Customer: </span>
                          <strong style={{ color: '#ffffff' }}>{coupon.user?.name || 'Customer'}</strong>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '0.74rem' }}>
                            {coupon.user?.phone || 'No phone'} • {coupon.user?.email || 'N/A'}
                          </div>
                        </div>

                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>Reward Offer: </span>
                          <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{coupon.title}</span>
                          <div style={{ color: 'var(--gold-primary)', fontWeight: 700, fontSize: '0.74rem' }}>
                            {coupon.discountType}
                          </div>
                        </div>

                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>Validity Deadline: </span>
                          <div style={{ color: coupon.status === 'expired' ? '#f87171' : coupon.isExpiringSoon ? '#fbbf24' : '#ffffff', fontWeight: 600 }}>
                            {new Date(coupon.expiresAt).toLocaleDateString()}
                            {coupon.status === 'active' && ` (${coupon.daysRemaining} days remaining)`}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            Issued: {new Date(coupon.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      {/* If Expired: Prominent Reason Display */}
                      {coupon.status === 'expired' && (
                        <div
                          style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            borderLeft: '3px solid #ef4444',
                            borderRadius: '4px',
                            padding: '0.5rem 0.75rem',
                            fontSize: '0.76rem',
                            color: '#fca5a5',
                            lineHeight: 1.45,
                          }}
                        >
                          <strong>❌ Reason for Expiry / Removal:</strong>{' '}
                          {coupon.expiredReason || 'Validity duration of 35 days expired without salon counter redemption.'}
                          <div style={{ fontSize: '0.7rem', color: '#cbd5e1', marginTop: '0.2rem' }}>
                            💡 <em>You can click "Reactivate & Extend Expiry" above to restore this coupon to active status.</em>
                          </div>
                        </div>
                      )}

                      {/* Extension History Audit Trail */}
                      {coupon.extendedCount > 0 && (
                        <div style={{ fontSize: '0.72rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Clock size={12} />
                          <span>
                            Extended {coupon.extendedCount} time(s). Last extended on {new Date(coupon.lastExtendedAt).toLocaleDateString()}
                            {coupon.extendedBy?.name ? ` by ${coupon.extendedBy.name}` : ''}.
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              <PaginationControl
                currentPage={validCouponPage}
                totalItems={couponsList.length}
                pageSize={couponPageSize}
                onPageChange={setCouponPage}
                onPageSizeChange={setCouponPageSize}
                itemLabel="coupons"
              />
            </div>
          </div>
        )}

          {/* ========================================================================= */}
          {/* TAB 3: LIVE WEBSITE CMS */}
          {/* ========================================================================= */}
          {activeTab === 'cms' && (
            <form onSubmit={handleSaveCms}>
              <div className="cms-form-grid">
                {/* Salon Name */}
                <div className="input-group">
                  <label className="input-label">Salon Name</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={cmsForm.salonName || ''}
                    onChange={(e) => setCmsForm({ ...cmsForm, salonName: e.target.value })}
                  />
                </div>

                {/* Tagline */}
                <div className="input-group">
                  <label className="input-label">Tagline</label>
                  <input
                    type="text"
                    className="input-field"
                    value={cmsForm.tagline || ''}
                    onChange={(e) => setCmsForm({ ...cmsForm, tagline: e.target.value })}
                  />
                </div>

                {/* Phone */}
                <div className="input-group">
                  <label className="input-label">Phone Number (Calling)</label>
                  <input
                    type="text"
                    className="input-field"
                    value={cmsForm.phone || ''}
                    onChange={(e) => setCmsForm({ ...cmsForm, phone: e.target.value })}
                  />
                </div>

                {/* WhatsApp */}
                <div className="input-group">
                  <label className="input-label">WhatsApp Number</label>
                  <input
                    type="text"
                    className="input-field"
                    value={cmsForm.whatsapp || ''}
                    onChange={(e) => setCmsForm({ ...cmsForm, whatsapp: e.target.value })}
                  />
                </div>

                {/* Address */}
                <div className="input-group grid-span-full">
                  <label className="input-label">Salon Physical Address</label>
                  <input
                    type="text"
                    className="input-field"
                    value={cmsForm.address || ''}
                    onChange={(e) => setCmsForm({ ...cmsForm, address: e.target.value })}
                  />
                </div>

                {/* Google Maps Embed URL */}
                <div className="input-group">
                  <label className="input-label">Google Maps Embed URL</label>
                  <input
                    type="text"
                    className="input-field"
                    value={cmsForm.mapEmbedUrl || ''}
                    onChange={(e) => setCmsForm({ ...cmsForm, mapEmbedUrl: e.target.value })}
                  />
                </div>

                {/* Google Maps Directions URL */}
                <div className="input-group">
                  <label className="input-label">Google Maps Directions / Navigation URL</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="https://www.google.com/maps/dir/?api=1&destination=..."
                    value={cmsForm.mapDirectionsUrl || ''}
                    onChange={(e) => setCmsForm({ ...cmsForm, mapDirectionsUrl: e.target.value })}
                  />
                </div>

                {/* Weekday Hours */}
                <div className="input-group">
                  <label className="input-label">Weekday Hours</label>
                  <input
                    type="text"
                    className="input-field"
                    value={cmsForm.openingHours?.weekday || ''}
                    onChange={(e) =>
                      setCmsForm({
                        ...cmsForm,
                        openingHours: { ...cmsForm.openingHours, weekday: e.target.value },
                      })
                    }
                  />
                </div>

                {/* Weekend Hours */}
                <div className="input-group">
                  <label className="input-label">Weekend Hours</label>
                  <input
                    type="text"
                    className="input-field"
                    value={cmsForm.openingHours?.weekend || ''}
                    onChange={(e) =>
                      setCmsForm({
                        ...cmsForm,
                        openingHours: { ...cmsForm.openingHours, weekend: e.target.value },
                      })
                    }
                  />
                </div>

                {/* Default 5-Stamp Reward Title */}
                <div className="input-group">
                  <label className="input-label">Default 5-Stamp Reward Title</label>
                  <input
                    type="text"
                    className="input-field"
                    value={cmsForm.defaultOfferTitle || ''}
                    onChange={(e) => setCmsForm({ ...cmsForm, defaultOfferTitle: e.target.value })}
                  />
                </div>

                {/* Default 5-Stamp Reward Discount */}
                <div className="input-group">
                  <label className="input-label">Default Reward Discount Description</label>
                  <input
                    type="text"
                    className="input-field"
                    value={cmsForm.defaultOfferDiscount || ''}
                    onChange={(e) => setCmsForm({ ...cmsForm, defaultOfferDiscount: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
                <button type="submit" className="btn btn-primary">
                  <Save size={16} />
                  <span>Save Website CMS Changes</span>
                </button>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: 24-HOUR RECOVERY & RECYCLE BIN */}
          {/* ========================================================================= */}
          {activeTab === 'recovery' && (
            <div>
              <div
                style={{
                  background: 'rgba(197, 34, 34, 0.08)',
                  border: '1px solid rgba(197, 34, 34, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  marginBottom: '1.5rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#ff6b6b', marginBottom: '0.4rem', fontWeight: 600 }}>
                  <RotateCcw size={18} />
                  <span>24-Hour Account Recovery Policy</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.5', margin: 0 }}>
                  Deleted accounts remain in this temporary recycle bin for <strong>24 hours</strong>. During this window, you can restore the user and recover their Coupon Stamps. If not restored within 24 hours, MongoDB automatically erases the account and all related visit history permanently.
                </p>
              </div>

              {deletedCustomers.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '3.5rem 1rem',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px dashed rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <div
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.04)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 1rem',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <Trash2 size={24} />
                  </div>
                  <h4 style={{ fontSize: '1.05rem', color: '#ffffff', marginBottom: '0.35rem' }}>
                    Recycle Bin is Empty
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                    No customer accounts are currently scheduled for deletion.
                  </p>
                </div>
              ) : (
                <>
                  {/* Desktop Table for Deleted Accounts */}
                  <div className="admin-desktop-table">
                    <table
                      style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontSize: '0.85rem',
                        textAlign: 'left',
                      }}
                    >
                      <thead>
                        <tr style={{ background: 'rgba(255, 255, 255, 0.04)', color: 'var(--text-secondary)' }}>
                          <th style={{ padding: '0.75rem 1rem' }}>Customer</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Deleted Time</th>
                          <th style={{ padding: '0.75rem 1rem' }}>24h Window Countdown</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Archived Stamps</th>
                          <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedDeleted.map((u) => (
                          <tr
                            key={u._id}
                            style={{
                              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                            }}
                          >
                            <td style={{ padding: '0.85rem 1rem' }}>
                              <div style={{ fontWeight: 600, color: '#ffffff' }}>{u.name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</div>
                              {u.phone && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{u.phone}</div>}
                            </td>
                            <td style={{ padding: '0.85rem 1rem', color: '#cbd5e1' }}>
                              <div>{u.deletedAt ? new Date(u.deletedAt).toLocaleDateString() : 'Recent'}</div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                {u.deletedAt ? new Date(u.deletedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                              </div>
                            </td>
                            <td style={{ padding: '0.85rem 1rem' }}>
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                  padding: '0.3rem 0.65rem',
                                  borderRadius: 'var(--radius-full)',
                                  fontSize: '0.78rem',
                                  fontWeight: 600,
                                  background: 'rgba(239, 68, 68, 0.15)',
                                  color: '#ff8080',
                                  border: '1px solid rgba(239, 68, 68, 0.4)',
                                }}
                              >
                                <Clock size={12} />
                                {u.timeLeftFormatted || 'Less than 24h'}
                              </span>
                            </td>
                            <td style={{ padding: '0.85rem 1rem', color: 'var(--gold-primary)', fontWeight: 600 }}>
                              {u.archivedStamps || 0}/5 Stamps
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                Lifetime: {u.archivedVisits || u.lifetimeVisits || 0}
                              </div>
                            </td>
                            <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                <button
                                  onClick={() => handleRestoreCustomer(u._id)}
                                  className="btn btn-primary btn-sm"
                                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                                  title="Restore user with preserved stamps"
                                >
                                  <RotateCcw size={13} />
                                  <span>Restore</span>
                                </button>
                                <button
                                  onClick={() => handlePermanentDelete(u._id, u.name)}
                                  className="btn btn-sm"
                                  style={{
                                    padding: '0.35rem 0.65rem',
                                    fontSize: '0.75rem',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.15)',
                                    color: '#ff6b6b',
                                  }}
                                  title="Purge immediately from database"
                                >
                                  <Trash2 size={13} />
                                  <span>Purge</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards for Deleted Accounts (Zero Side-Scroll) */}
                  <div className="admin-mobile-cards">
                    {paginatedDeleted.map((u) => (
                      <div
                        key={`mob-del-${u._id}`}
                        style={{
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.85rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.55rem',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#ffffff' }}>{u.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</div>
                            {u.phone && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{u.phone}</div>}
                          </div>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              padding: '0.2rem 0.55rem',
                              borderRadius: 'var(--radius-full)',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              background: 'rgba(239, 68, 68, 0.15)',
                              color: '#ff8080',
                              border: '1px solid rgba(239, 68, 68, 0.4)',
                            }}
                          >
                            <Clock size={11} />
                            {u.timeLeftFormatted || 'Less than 24h'}
                          </span>
                        </div>

                        <div style={{ fontSize: '0.75rem', color: 'var(--gold-primary)', display: 'flex', justifyContent: 'space-between' }}>
                          <span>Preserved: {u.archivedStamps || 0}/5 Stamps</span>
                          <span style={{ color: 'var(--text-muted)' }}>Lifetime: {u.archivedVisits || u.lifetimeVisits || 0}</span>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.2rem' }}>
                          <button
                            onClick={() => handleRestoreCustomer(u._id)}
                            className="btn btn-primary btn-sm"
                            style={{ flex: 1, padding: '0.45rem', fontSize: '0.75rem', justifyContent: 'center' }}
                          >
                            <RotateCcw size={13} />
                            <span>Restore Account</span>
                          </button>
                          <button
                            onClick={() => handlePermanentDelete(u._id, u.name)}
                            className="btn btn-sm"
                            style={{
                              padding: '0.45rem 0.75rem',
                              fontSize: '0.75rem',
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid rgba(255, 255, 255, 0.15)',
                              color: '#ff6b6b',
                              justifyContent: 'center',
                            }}
                          >
                            <Trash2 size={13} />
                            <span>Purge</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Deleted Accounts Pagination Controls */}
                  <PaginationControl
                    currentPage={validDeletedPage}
                    totalItems={deletedCustomers.length}
                    pageSize={deletedPageSize}
                    onPageChange={setDeletedPage}
                    onPageSizeChange={setDeletedPageSize}
                    itemLabel="deleted accounts"
                  />
                </>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: STAFF & ADMINS (SUPER ADMIN EXCLUSIVE) */}
          {/* ========================================================================= */}
          {isSuperAdmin && activeTab === 'staff' && (
            <div>
              {/* Tab Header & Add Staff Admin Button */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.25rem',
                  gap: '0.75rem',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <h4 style={{ fontSize: '1.1rem', color: '#ffffff', margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Crown size={18} color="var(--gold-primary)" />
                    <span>Staff Admins Management</span>
                  </h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                    As Super Admin, you can add new salon admins or remove existing staff. Standard admins cannot access this area.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddAdminModal(true)}
                  className="btn btn-primary btn-sm"
                  style={{
                    padding: '0.55rem 1.1rem',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <UserPlus size={16} />
                  <span>Promote Existing User</span>
                </button>
              </div>

              {/* Staff List Table */}
              {staffLoading ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                  <RefreshCw size={24} className="spin" style={{ margin: '0 auto 0.5rem', display: 'block' }} />
                  <span>Loading salon staff admins...</span>
                </div>
              ) : staffList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                  No other admins registered yet.
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="admin-desktop-table" style={{ border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ background: 'rgba(255, 255, 255, 0.04)', color: 'var(--text-secondary)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                          <th style={{ padding: '0.85rem 1rem' }}>Staff Member</th>
                          <th style={{ padding: '0.85rem 1rem' }}>Email Address</th>
                          <th style={{ padding: '0.85rem 1rem' }}>Phone</th>
                          <th style={{ padding: '0.85rem 1rem' }}>Access Role</th>
                          <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {staffList.map((st) => {
                          const isTargetSuper = st.role === 'superadmin';
                          const isSelf = user?._id === st._id;
                          return (
                            <tr
                              key={st._id}
                              style={{
                                borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                                background: isTargetSuper ? 'rgba(212, 175, 55, 0.04)' : 'transparent',
                              }}
                            >
                              <td style={{ padding: '0.85rem 1rem' }}>
                                <div style={{ fontWeight: 600, color: '#ffffff' }}>{st.name}</div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                  Added {new Date(st.createdAt || Date.now()).toLocaleDateString()}
                                </div>
                              </td>
                              <td style={{ padding: '0.85rem 1rem', color: '#cbd5e1' }}>{st.email}</td>
                              <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>
                                {st.phone ? `+91 ${st.phone.replace(/[^0-9]/g, '').slice(-10)}` : '—'}
                              </td>
                              <td style={{ padding: '0.85rem 1rem' }}>
                                {isTargetSuper ? (
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.3rem',
                                      background: 'rgba(212, 175, 55, 0.2)',
                                      color: 'var(--gold-primary)',
                                      border: '1px solid rgba(212, 175, 55, 0.4)',
                                      padding: '0.2rem 0.6rem',
                                      borderRadius: '999px',
                                      fontSize: '0.72rem',
                                      fontWeight: 700,
                                    }}
                                  >
                                    <Crown size={12} /> Super Admin
                                  </span>
                                ) : (
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.3rem',
                                      background: 'rgba(59, 130, 246, 0.15)',
                                      color: '#93c5fd',
                                      border: '1px solid rgba(59, 130, 246, 0.3)',
                                      padding: '0.2rem 0.6rem',
                                      borderRadius: '999px',
                                      fontSize: '0.72rem',
                                      fontWeight: 600,
                                    }}
                                  >
                                    <Shield size={12} /> Staff Admin
                                  </span>
                                )}
                              </td>
                              <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                                {isTargetSuper ? (
                                  <span style={{ fontSize: '0.74rem', color: 'var(--gold-primary)', fontStyle: 'italic', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <Lock size={12} /> Protected Owner
                                  </span>
                                ) : isSelf ? (
                                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                                    Current Session
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteAdmin(st._id, st.name)}
                                    className="btn btn-sm"
                                    style={{
                                      padding: '0.35rem 0.75rem',
                                      fontSize: '0.75rem',
                                      background: 'rgba(239, 68, 68, 0.15)',
                                      border: '1px solid rgba(239, 68, 68, 0.35)',
                                      color: '#ff8080',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.3rem',
                                    }}
                                  >
                                    <Trash2 size={13} />
                                    <span>Remove</span>
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards for Staff Admins */}
                  <div className="admin-mobile-cards">
                    {staffList.map((st) => {
                      const isTargetSuper = st.role === 'superadmin';
                      const isSelf = user?._id === st._id;
                      return (
                        <div
                          key={st._id}
                          style={{
                            background: isTargetSuper ? 'rgba(212, 175, 55, 0.05)' : 'rgba(255, 255, 255, 0.04)',
                            border: isTargetSuper ? '1px solid rgba(212, 175, 55, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: 'var(--radius-md)',
                            padding: '0.85rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.45rem',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.95rem' }}>{st.name}</div>
                              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{st.email}</div>
                              {st.phone && (
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                                  +91 {st.phone.replace(/[^0-9]/g, '').slice(-10)}
                                </div>
                              )}
                            </div>
                            {isTargetSuper ? (
                              <span style={{ fontSize: '0.68rem', background: 'rgba(212, 175, 55, 0.2)', color: 'var(--gold-primary)', padding: '0.15rem 0.5rem', borderRadius: '999px', fontWeight: 700 }}>
                                👑 Super Admin
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.68rem', background: 'rgba(59, 130, 246, 0.15)', color: '#93c5fd', padding: '0.15rem 0.5rem', borderRadius: '999px', fontWeight: 600 }}>
                                🛡️ Staff Admin
                              </span>
                            )}
                          </div>
                          {!isTargetSuper && !isSelf && (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.35rem' }}>
                              <button
                                type="button"
                                onClick={() => handleDeleteAdmin(st._id, st.name)}
                                className="btn btn-sm"
                                style={{
                                  padding: '0.35rem 0.75rem',
                                  fontSize: '0.74rem',
                                  background: 'rgba(239, 68, 68, 0.15)',
                                  border: '1px solid rgba(239, 68, 68, 0.35)',
                                  color: '#ff8080',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                }}
                              >
                                <Trash2 size={13} />
                                <span>Remove Admin</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Customer Delete Confirmation Modal */}
        {customerToDelete && typeof document !== 'undefined' && createPortal(
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.85)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              zIndex: 999999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'clamp(0.5rem, 3vw, 1.25rem)',
              boxSizing: 'border-box',
            }}
            onClick={() => !deleteLoading && setCustomerToDelete(null)}
          >
            <div
              style={{
                background: '#14171f',
                border: '1px solid rgba(197, 34, 34, 0.4)',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(197, 34, 34, 0.2)',
                borderRadius: 'var(--radius-lg)',
                maxWidth: '440px',
                width: '100%',
                maxHeight: '92vh',
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
                padding: 'clamp(1.1rem, 4vw, 1.75rem)',
                boxSizing: 'border-box',
                color: '#ffffff',
                position: 'relative',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'rgba(197, 34, 34, 0.15)',
                  border: '1px solid rgba(197, 34, 34, 0.4)',
                  color: '#ff6b6b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                }}
              >
                <AlertTriangle size={28} />
              </div>

              <h3 style={{ textAlign: 'center', fontSize: 'clamp(1.1rem, 3.6vw, 1.25rem)', marginBottom: '0.6rem', color: '#ffffff', fontWeight: 700 }}>
                Delete Customer Account?
              </h3>

              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  padding: '0.9rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1.25rem',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '1rem', color: '#ffffff' }}>
                  {customerToDelete.name}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--gold-primary)', marginTop: '0.2rem' }}>
                  {customerToDelete.email}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Current Stamps: {customerToDelete.currentStamps}/5
                </div>
              </div>

              <div style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: '1.5', marginBottom: '1.25rem' }}>
                <p style={{ margin: '0 0 0.5rem 0' }}>
                  ⚠️ This user will be moved to the <strong>24-Hour Recovery Bin</strong>.
                </p>
                <p style={{ margin: '0 0 0.5rem 0' }}>
                  🔄 You can restore this account anytime within 24 hours with their {customerToDelete.currentStamps}/5 stamps intact.
                </p>
                <p style={{ margin: 0 }}>
                  ⏳ If not restored within 24 hours, the account and all visit records will be permanently erased from MongoDB.
                </p>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  marginTop: '1rem',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              >
                <button
                  type="button"
                  disabled={deleteLoading}
                  onClick={() => setCustomerToDelete(null)}
                  className="btn btn-secondary"
                  style={{
                    flex: '1 1 0',
                    padding: '0.75rem 1rem',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-full)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    touchAction: 'manipulation',
                    boxSizing: 'border-box',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleteLoading}
                  onClick={handleConfirmDeleteCustomer}
                  className="btn"
                  style={{
                    flex: '1.4 1 0',
                    background: '#c52222',
                    borderColor: '#ff4d4d',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    padding: '0.75rem 1rem',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    borderRadius: 'var(--radius-full)',
                    touchAction: 'manipulation',
                    boxSizing: 'border-box',
                  }}
                >
                  {deleteLoading ? (
                    'Moving...'
                  ) : (
                    <>
                      <Trash2 size={16} />
                      <span>Delete (24h Bin)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* Customer Edit Modal (Name & Mobile Number Only - Email Locked) */}
        {customerToEdit && typeof document !== 'undefined' && createPortal(
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.85)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              zIndex: 999999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'clamp(0.6rem, 3vw, 1.25rem)',
              boxSizing: 'border-box',
            }}
            onClick={() => !editLoading && setCustomerToEdit(null)}
          >
            <div
              style={{
                background: '#14171f',
                border: '1px solid rgba(212, 175, 55, 0.4)',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(212, 175, 55, 0.2)',
                borderRadius: 'var(--radius-lg)',
                maxWidth: '440px',
                width: '100%',
                maxHeight: '92vh',
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
                padding: 'clamp(1.1rem, 4vw, 1.75rem)',
                boxSizing: 'border-box',
                color: '#ffffff',
                position: 'relative',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      background: 'rgba(212, 175, 55, 0.15)',
                      border: '1px solid rgba(212, 175, 55, 0.3)',
                      color: 'var(--gold-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Edit2 size={20} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <h3
                      style={{
                        fontSize: 'clamp(1.1rem, 3.6vw, 1.25rem)',
                        fontWeight: 700,
                        color: '#ffffff',
                        margin: 0,
                        lineHeight: 1.2,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Edit Customer
                    </h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--gold-primary)', margin: '0.2rem 0 0 0' }}>
                      Update Name & Mobile Number
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={editLoading}
                  onClick={() => setCustomerToEdit(null)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    cursor: 'pointer',
                    flexShrink: 0,
                    transition: 'all 0.2s ease',
                  }}
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveEditCustomer} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Email (Locked / Read-only) */}
                <div className="input-group">
                  <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)' }}>
                    <Lock size={12} color="var(--gold-primary)" />
                    <span>Email Address (Permanent / Non-Editable)</span>
                  </label>
                  <input
                    type="email"
                    disabled
                    value={customerToEdit.email}
                    className="input-field"
                    style={{
                      opacity: 0.7,
                      cursor: 'not-allowed',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px dashed rgba(255, 255, 255, 0.15)',
                      color: '#94a3b8',
                    }}
                  />
                </div>

                {/* Customer Full Name */}
                <div className="input-group">
                  <label className="input-label">Customer Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="input-field"
                    placeholder="e.g. John Doe"
                  />
                </div>

                {/* Mobile Number */}
                <div className="input-group">
                  <label className="input-label">Mobile Number (10 Digits)</label>
                  <div style={{ position: 'relative' }}>
                    <span
                      style={{
                        position: 'absolute',
                        left: '0.85rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--gold-primary)',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                      }}
                    >
                      +91
                    </span>
                    <input
                      type="tel"
                      maxLength="10"
                      value={editForm.phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setEditForm({ ...editForm, phone: val });
                      }}
                      className="input-field"
                      style={{ paddingLeft: '3.2rem' }}
                      placeholder="9876543210"
                    />
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                    Must be 10 numeric digits without country code.
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: '0.75rem',
                    marginTop: '0.85rem',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                >
                  <button
                    type="button"
                    disabled={editLoading}
                    onClick={() => setCustomerToEdit(null)}
                    className="btn btn-secondary"
                    style={{
                      flex: '1 1 0',
                      padding: '0.75rem 1rem',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      borderRadius: 'var(--radius-full)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      touchAction: 'manipulation',
                      boxSizing: 'border-box',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="btn btn-primary"
                    style={{
                      flex: '1.4 1 0',
                      padding: '0.75rem 1rem',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      borderRadius: 'var(--radius-full)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      touchAction: 'manipulation',
                      boxSizing: 'border-box',
                    }}
                  >
                    {editLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

        {/* Customer Visit History Submodal */}
        {selectedCustomerHistory && typeof document !== 'undefined' && createPortal(
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.85)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              zIndex: 999999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'clamp(0.5rem, 3vw, 1.25rem)',
              boxSizing: 'border-box',
            }}
            onClick={() => setSelectedCustomerHistory(null)}
          >
            <div
              style={{
                background: '#14171f',
                border: '1px solid rgba(212, 175, 55, 0.4)',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(212, 175, 55, 0.2)',
                borderRadius: 'var(--radius-lg)',
                maxWidth: '560px',
                width: '100%',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                padding: 'clamp(1.1rem, 4vw, 1.75rem)',
                boxSizing: 'border-box',
                color: '#ffffff',
                position: 'relative',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', gap: '0.75rem' }}>
                <div style={{ minWidth: 0 }}>
                  <h4 style={{ fontSize: 'clamp(1.1rem, 3.6vw, 1.3rem)', color: '#ffffff', margin: 0, fontWeight: 700 }}>
                    Visit Logs: {selectedCustomerHistory.name}
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--gold-primary)', margin: '0.2rem 0 0 0' }}>
                    Active Stamps: {selectedCustomerHistory.currentStamps}/5 • Lifetime: {selectedCustomerHistory.lifetimeVisits}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedCustomerHistory(null)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
                {historyVisits.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No visit history recorded yet for this customer.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {historyVisits.map((v) => (
                      <div
                        key={v._id}
                        style={{
                          padding: '0.85rem 1rem',
                          background: 'rgba(255, 255, 255, 0.04)',
                          borderRadius: 'var(--radius-sm)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '0.5rem',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, color: '#ffffff' }}>{v.serviceName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{v.notes}</div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ color: 'var(--gold-primary)', fontWeight: 500, fontSize: '0.85rem' }}>
                            {new Date(v.visitedAt).toLocaleDateString()}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {new Date(v.visitedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* Super Admin: Add New Staff Admin Modal */}
        {showAddAdminModal && typeof document !== 'undefined' && createPortal(
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.85)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              zIndex: 999999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'clamp(0.5rem, 3vw, 1.25rem)',
              boxSizing: 'border-box',
            }}
            onClick={() => !addAdminLoading && setShowAddAdminModal(false)}
          >
            <div
              style={{
                background: '#14171f',
                border: '1px solid rgba(212, 175, 55, 0.4)',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(212, 175, 55, 0.2)',
                borderRadius: 'var(--radius-lg)',
                maxWidth: '440px',
                width: '100%',
                maxHeight: '92vh',
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
                padding: 'clamp(1.1rem, 4vw, 1.75rem)',
                boxSizing: 'border-box',
                color: '#ffffff',
                position: 'relative',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      background: 'rgba(212, 175, 55, 0.15)',
                      border: '1px solid rgba(212, 175, 55, 0.3)',
                      color: 'var(--gold-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <UserPlus size={20} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <h3
                      style={{
                        fontSize: 'clamp(1.1rem, 3.6vw, 1.25rem)',
                        fontWeight: 700,
                        color: '#ffffff',
                        margin: 0,
                        lineHeight: 1.2,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Promote to Admin
                    </h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--gold-primary)', margin: '0.2rem 0 0 0' }}>
                      Grant Salon Admin Privileges
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={addAdminLoading}
                  onClick={() => setShowAddAdminModal(false)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    cursor: 'pointer',
                    flexShrink: 0,
                    transition: 'all 0.2s ease',
                  }}
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Requirement Notice */}
              <div
                style={{
                  background: 'rgba(212, 175, 55, 0.08)',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  padding: '0.75rem 0.9rem',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  fontSize: '0.78rem',
                  color: '#cbd5e1',
                  lineHeight: 1.5,
                }}
              >
                <strong style={{ color: 'var(--gold-primary)', display: 'block', marginBottom: '0.2rem' }}>
                  👑 Super Admin Security Rule:
                </strong>
                The person must be an <strong>existing registered user</strong>. You do not set their password — <strong>the user decides their own password</strong>. If they registered using Google, they will receive a prompt on their screen to choose their password.
              </div>

              <form onSubmit={handleCreateAdmin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="input-group">
                  <label className="input-label">Select or Enter Registered User Email *</label>
                  <input
                    type="email"
                    required
                    list="registered-customers-list"
                    value={newAdminForm.email}
                    onChange={(e) => setNewAdminForm({ ...newAdminForm, email: e.target.value })}
                    className="input-field"
                    placeholder="Search customer email (e.g. user@gmail.com)"
                  />
                  <datalist id="registered-customers-list">
                    {customers
                      ?.filter((c) => c.role !== 'admin' && c.role !== 'superadmin' && !c.isDeleted)
                      ?.map((c) => (
                        <option key={c._id} value={c.email}>
                          {c.name} {c.phone ? `(${c.phone})` : ''}
                        </option>
                      ))}
                  </datalist>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.35rem' }}>
                    Type or pick from registered customers. Only existing users can be promoted.
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: '0.75rem',
                    marginTop: '0.85rem',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                >
                  <button
                    type="button"
                    disabled={addAdminLoading}
                    onClick={() => setShowAddAdminModal(false)}
                    className="btn btn-secondary"
                    style={{
                      flex: '1 1 0',
                      padding: '0.75rem 1rem',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      borderRadius: 'var(--radius-full)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      touchAction: 'manipulation',
                      boxSizing: 'border-box',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addAdminLoading}
                    className="btn btn-primary"
                    style={{
                      flex: '1.4 1 0',
                      padding: '0.75rem 1rem',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      borderRadius: 'var(--radius-full)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      touchAction: 'manipulation',
                      boxSizing: 'border-box',
                    }}
                  >
                    {addAdminLoading ? 'Promoting...' : 'Promote to Admin'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

        {/* ========================================================================= */}
        {/* MODAL 5: EXTEND / INCREASE COUPON EXPIRY DATE (PORTALIZED) */}
        {/* ========================================================================= */}
        {couponToExtend && createPortal(
          <div
            className="modal-overlay"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 99999,
              background: 'rgba(0, 0, 0, 0.85)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
            }}
            onClick={() => setCouponToExtend(null)}
          >
            <div
              className="modal-content"
              style={{
                width: '100%',
                maxWidth: '480px',
                background: '#12141c',
                border: '1.5px solid var(--gold-primary)',
                borderRadius: 'var(--radius-md)',
                padding: '1.5rem',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9)',
                color: '#ffffff',
                boxSizing: 'border-box',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.15rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.45rem', margin: 0 }}>
                  <Calendar size={18} color="var(--gold-primary)" />
                  <span>Extend Coupon Validity Date</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setCouponToExtend(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '0.25rem',
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Status & Coupon Preview */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.85rem',
                  marginBottom: '1.25rem',
                  fontSize: '0.82rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Coupon Code:</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--gold-primary)', fontSize: '0.96rem' }}>
                    {couponToExtend.code}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Customer:</span>
                  <span style={{ fontWeight: 600, color: '#ffffff' }}>
                    {couponToExtend.user?.name || 'Customer'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Current Status:</span>
                  <span
                    style={{
                      fontWeight: 700,
                      color: couponToExtend.status === 'expired' ? '#f87171' : '#2ecc71',
                      fontSize: '0.74rem',
                    }}
                  >
                    {couponToExtend.status.toUpperCase()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Current Expiry:</span>
                  <span style={{ color: '#cbd5e1' }}>
                    {new Date(couponToExtend.expiresAt).toLocaleDateString()}
                  </span>
                </div>

                {couponToExtend.status === 'expired' && (
                  <div
                    style={{
                      marginTop: '0.65rem',
                      padding: '0.45rem 0.65rem',
                      background: 'rgba(212, 175, 55, 0.1)',
                      border: '1px solid rgba(212, 175, 55, 0.3)',
                      borderRadius: '4px',
                      fontSize: '0.74rem',
                      color: '#fef08a',
                    }}
                  >
                    ✨ <strong>Auto-Reactivation:</strong> Increasing the date will automatically clear the expired status and restore this coupon to <strong>ACTIVE</strong>!
                  </div>
                )}
              </div>

              {/* Extension Options Form */}
              <form onSubmit={handleExtendCoupon}>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label className="input-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
                    Quick Extension Presets
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                    {[
                      { days: 7, label: '+7 Days' },
                      { days: 15, label: '+15 Days' },
                      { days: 30, label: '+30 Days (1 Month)' },
                    ].map((opt) => (
                      <button
                        key={opt.days}
                        type="button"
                        onClick={() => {
                          setExtendDays(opt.days);
                          setExtendCustomDate('');
                        }}
                        className={`btn btn-sm ${extendDays === opt.days && !extendCustomDate ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ fontSize: '0.78rem', padding: '0.5rem 0.35rem', textAlign: 'center' }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Date Input */}
                <div className="input-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="input-label">Or Pick Specific Custom Expiry Date</label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={extendCustomDate}
                    onChange={(e) => {
                      setExtendCustomDate(e.target.value);
                    }}
                    className="input-field"
                    style={{ fontSize: '0.9rem', color: '#ffffff' }}
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                    Leave empty to use the quick preset (+{extendDays} days) above.
                  </span>
                </div>

                {/* Preview Calculated New Expiry */}
                <div
                  style={{
                    background: 'rgba(46, 204, 113, 0.08)',
                    border: '1px solid rgba(46, 204, 113, 0.3)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.65rem 0.85rem',
                    marginBottom: '1.25rem',
                    fontSize: '0.8rem',
                    color: '#86efac',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span>New Expiry Date:</span>
                  <strong style={{ fontSize: '0.92rem', color: '#2ecc71' }}>
                    {(() => {
                      if (extendCustomDate) {
                        const d = new Date(extendCustomDate);
                        return isNaN(d.getTime()) ? 'Invalid date' : d.toLocaleDateString();
                      }
                      const base = couponToExtend.expiresAt && new Date(couponToExtend.expiresAt).getTime() > Date.now()
                        ? new Date(couponToExtend.expiresAt).getTime()
                        : Date.now();
                      const d = new Date(base + extendDays * 24 * 60 * 60 * 1000);
                      return d.toLocaleDateString();
                    })()}
                  </strong>
                </div>

                {extendMsg && (
                  <div style={{ color: '#2ecc71', fontSize: '0.82rem', marginBottom: '0.75rem', textAlign: 'center' }}>
                    {extendMsg}
                  </div>
                )}
                {extendError && (
                  <div style={{ color: '#ef4444', fontSize: '0.82rem', marginBottom: '0.75rem', textAlign: 'center' }}>
                    {extendError}
                  </div>
                )}

                {/* Buttons */}
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    disabled={extendLoading}
                    onClick={() => setCouponToExtend(null)}
                    className="btn btn-secondary"
                    style={{ flex: 1, padding: '0.65rem', justifyContent: 'center' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={extendLoading}
                    className="btn btn-primary"
                    style={{ flex: 1.5, padding: '0.65rem', justifyContent: 'center', fontWeight: 700 }}
                  >
                    {extendLoading ? 'Saving...' : 'Confirm & Increase Expiry'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
      </div>
    </div>
  );
};
