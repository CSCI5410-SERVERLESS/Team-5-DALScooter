import React, { useState, useEffect } from 'react';
import { Car, Star, Bike } from 'lucide-react';
import { API_BASE_URL, getApiHeaders, feedbackCategories, commonIssues, getBatteryColor, getStatusColor, getSentimentBadge, getSeverityBadge, cognitoConfig } from '../constants/constants';
import Header from '../components/Header';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';
import BrowseTab from '../components/BrowseTab';
import ReservationsTab from '../components/ReservationsTab';
import FeedbackTab from '../components/FeedbackTab';
import FeedbackAnalyticsModal from '../components/FeedbackAnalyticsModal';
import ReservationModal from '../components/ReservationModal';
import FeedbackModal from '../components/FeedbackModal';

const User = () => {
  const [activeTab, setActiveTab] = useState('browse');
  const [vehicles, setVehicles] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [feedbackAnalytics, setFeedbackAnalytics] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsFilters, setAnalyticsFilters] = useState({
    sentiment: '',
    rating: '',
    severity: '',
    vehicleId: ''
  });

  const [showReservationModal, setShowReservationModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showFeedbackAnalyticsModal, setShowFeedbackAnalyticsModal] = useState(false);

  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [expandedVehicles, setExpandedVehicles] = useState({});

  const [filters, setFilters] = useState({
    type: '',
    location: '',
    maxRate: '',
    showFilters: false
  });

  const [reservationForm, setReservationForm] = useState({
    startDate: '',
    endDate: '',
    discountCode: '',
    notes: ''
  });

  const [feedbackForm, setFeedbackForm] = useState({
    rating: 5,
    category: 'overall',
    subject: '',
    message: '',
    wouldRecommend: true,
    issues: []
  });

  useEffect(() => {
    setIsAuthenticated(!!sessionStorage.getItem('jwt'));
  }, []);

  useEffect(() => {
    if (activeTab === 'browse') loadVehicles();
    else if (activeTab === 'reservations' && isAuthenticated) loadReservations();
    else if (activeTab === 'feedback' && isAuthenticated) loadFeedback();
  }, [activeTab, isAuthenticated]);

  useEffect(() => {
    if (activeTab === 'browse') loadVehicles();
  }, [filters.type, filters.location, filters.maxRate]);

  useEffect(() => {
    if (showFeedbackAnalyticsModal) {
      loadFeedbackAnalytics();
    }
  }, [showFeedbackAnalyticsModal, analyticsFilters]);

  const loadVehicles = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.location) params.append('location', filters.location);
      if (filters.maxRate) params.append('maxRate', filters.maxRate);
      params.append('includeReviews', 'true');

      const response = await fetch(`${API_BASE_URL}/guest/vehicles?${params}`, {
        headers: getApiHeaders(false)
      });

      if (!response.ok) throw new Error('Failed to load vehicles');
      const data = await response.json();
      setVehicles(data.vehicles || []);
    } catch (err) {
      setError('Failed to load vehicles. Please try again.');
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  const loadReservations = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/user/reservations`, {
        headers: getApiHeaders(true)
      });
      if (!response.ok) throw new Error('Failed to load reservations');
      const data = await response.json();
      setReservations(data.reservations || []);
    } catch (err) {
      setError('Failed to load reservations');
    } finally {
      setLoading(false);
    }
  };

  const loadFeedback = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/user/feedback`, {
        headers: getApiHeaders(true)
      });
      if (!response.ok) throw new Error('Failed to load feedback');
      const data = await response.json();
      setFeedback(data.feedback || []);
    } catch (err) {
      setError('Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const createReservation = async (reservationData) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/user/reservations`, {
        method: 'POST',
        headers: getApiHeaders(true),
        body: JSON.stringify(reservationData)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create reservation');
      }
      return await response.json();
    } finally {
      setLoading(false);
    }
  };

  const submitFeedback = async (feedbackData) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/user/feedback`, {
        method: 'POST',
        headers: getApiHeaders(true),
        body: JSON.stringify(feedbackData)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit feedback');
      }
      return await response.json();
    } finally {
      setLoading(false);
    }
  };

  const cancelReservation = async (reservationId) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/user/reservations/${reservationId}`, {
        method: 'DELETE',
        headers: getApiHeaders(true)
      });
      if (!response.ok) throw new Error('Failed to cancel reservation');
      return await response.json();
    } finally {
      setLoading(false);
    }
  };

  const completeReservation = async (reservationId) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/user/reservations/${reservationId}`, {
        method: 'PUT',
        headers: getApiHeaders(true),
        body: JSON.stringify({ action: 'complete' })
      });
      if (!response.ok) throw new Error('Failed to complete reservation');
      return await response.json();
    } finally {
      setLoading(false);
    }
  };

  const loadFeedbackAnalytics = async () => {
    try {
      setAnalyticsLoading(true);

      const queryParams = new URLSearchParams();
      Object.entries(analyticsFilters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await fetch(`${API_BASE_URL}/guest/feedback?${queryParams.toString()}`);
      const data = await response.json();
      console.log('Feedback data:', data);
      setFeedbackAnalytics(data.feedback || []);
      setAnalyticsData(data.analytics || null);
    } catch (error) {
      console.error('Error loading feedback analytics:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const deleteFeedback = async (feedbackId) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/user/feedback/${feedbackId}`, {
        method: 'DELETE',
        headers: getApiHeaders(true)
      });
      if (!response.ok) throw new Error('Failed to delete feedback');
      return await response.json();
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => (window.location.href = cognitoConfig.authUrl + '?response_type=code&client_id=' + cognitoConfig.clientId + '&redirect_uri=' + encodeURIComponent(cognitoConfig.redirectUri) + '&scope=' + cognitoConfig.scope);

  const handleLogout = () => {
    sessionStorage.clear();
    localStorage.clear();
    const logoutUrl = `${cognitoConfig.logoutUrl}?client_id=${cognitoConfig.clientId}&logout_uri=${encodeURIComponent(cognitoConfig.redirectUri)}`;
    window.location.href = logoutUrl;
  };

  const handleReserveClick = (vehicle) => {
    if (!isAuthenticated) {
      alert('Please sign in to make a reservation');
      handleLogin();
      return;
    }
    setSelectedVehicle(vehicle);
    setReservationForm({ startDate: '', endDate: '', discountCode: '', notes: '' });
    setShowReservationModal(true);
  };

  const handleViewReviewsClick = async (vehicle) => {
    setAnalyticsFilters({
      sentiment: '',
      rating: '',
      severity: '',
      vehicleId: vehicle.vehicleId
    });
    setShowFeedbackAnalyticsModal(true);
  };

  const handleReservationSubmit = async () => {
    if (!reservationForm.startDate || !reservationForm.endDate) {
      alert('Please select both start and end dates');
      return;
    }

    const startDate = new Date(reservationForm.startDate);
    const endDate = new Date(reservationForm.endDate);

    if (startDate >= endDate) {
      alert('End date must be after start date');
      return;
    }

    if (startDate < new Date()) {
      alert('Start date cannot be in the past');
      return;
    }

    try {
      const result = await createReservation({
        vehicleId: selectedVehicle.vehicleId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        discountCode: reservationForm.discountCode || undefined,
        notes: reservationForm.notes || undefined
      });

      if (result.success) {
        setShowReservationModal(false);
        setActiveTab('reservations');
        alert('Reservation created successfully!');
      }
    } catch (err) {
      alert(`Error creating reservation: ${err.message}`);
    }
  };

  const handleFeedbackSubmit = async () => {
    if (!feedbackForm.subject.trim() || !feedbackForm.message.trim()) {
      alert('Please provide both subject and message');
      return;
    }

    try {
      const result = await submitFeedback({
        reservationId: selectedReservation.reservationId,
        vehicleId: selectedReservation.vehicleId,
        vehicleType: selectedReservation.vehicleType,
        vehicleModel: selectedReservation.vehicleModel,
        rating: feedbackForm.rating,
        category: feedbackForm.category,
        subject: feedbackForm.subject.trim(),
        message: feedbackForm.message.trim(),
        wouldRecommend: feedbackForm.wouldRecommend,
        issues: feedbackForm.issues
      });

      if (result.success) {
        setShowFeedbackModal(false);
        setActiveTab('feedback');
        alert('Feedback submitted successfully!');
        loadFeedback();
      }
    } catch (err) {
      alert(`Error submitting feedback: ${err.message}`);
    }
  };

  const getVehicleIcon = (type) => {
    return type === 'anebike' ? <Bike className="w-6 h-6" /> : <Car className="w-6 h-6" />;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const calculateCost = (vehicle, startDate, endDate, discountCode) => {
    const hours = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60));
    let total = hours * vehicle.hourlyRate;

    if (discountCode?.toUpperCase() === vehicle.discountCode && vehicle.discountPercentage > 0) {
      total -= total * (vehicle.discountPercentage / 100);
    }

    return { hours, total: Math.round(total * 100) / 100 };
  };

  const renderStars = (rating, interactive = false, onChange = null) => {
    return (
        <div className="flex space-x-1">
          {[1, 2, 3, 4, 5].map(star => (
              <Star
                  key={star}
                  className={`w-5 h-5 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'} 
              ${interactive ? 'cursor-pointer hover:text-yellow-400' : ''}`}
                  onClick={interactive ? () => onChange(star) : undefined}
              />
          ))}
        </div>
    );
  };

  const renderReviewSummary = (summary) => {
    if (!summary?.totalReviews) {
      return <div className="bg-gray-50 rounded-lg p-3 text-center text-sm text-gray-500">No reviews yet</div>;
    }

    return (
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {renderStars(Math.round(summary.averageRating))}
              <span className="font-medium">{summary.averageRating}</span>
            </div>
            <div className="text-right text-sm">
              <p className="text-gray-600">{summary.totalReviews} reviews</p>
              <p className="text-green-600">{summary.recommendationPercentage}% recommend</p>
            </div>
          </div>

          {summary.commonIssues?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-700 mb-1">Common mentions:</p>
                <div className="flex flex-wrap gap-1">
                  {summary.commonIssues.slice(0, 3).map((issue, idx) => (
                      <span key={idx} className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                  {issue.issue} ({issue.count})
                </span>
                  ))}
                </div>
              </div>
          )}
        </div>
    );
  };

  const getCompletedReservationsForFeedback = () => {
    const completed = reservations.filter(r => r.status === 'completed');
    const feedbackIds = feedback.map(f => f.reservationId);
    return completed.filter(r => !feedbackIds.includes(r.reservationId));
  };

  return (
      <div className="min-h-screen bg-gray-50">
        <Header
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isAuthenticated={isAuthenticated}
            handleLogin={handleLogin}
            handleLogout={handleLogout}
        />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ErrorMessage error={error} />
          <LoadingSpinner loading={loading} />
          {activeTab === 'browse' && (
              <BrowseTab
                  isAuthenticated={isAuthenticated}
                  filters={filters}
                  setFilters={setFilters}
                  vehicles={vehicles}
                  loading={loading}
                  handleReserveClick={handleReserveClick}
                  handleViewReviewsClick={handleViewReviewsClick}
                  getVehicleIcon={getVehicleIcon}
                  getBatteryColor={getBatteryColor}
                  renderReviewSummary={renderReviewSummary}
                  expandedVehicles={expandedVehicles}
                  setExpandedVehicles={setExpandedVehicles}
                  renderStars={renderStars}
              />
          )}
          {activeTab === 'reservations' && (
              <ReservationsTab
                  isAuthenticated={isAuthenticated}
                  reservations={reservations}
                  loading={loading}
                  loadReservations={loadReservations}
                  getVehicleIcon={getVehicleIcon}
                  getStatusColor={getStatusColor}
                  formatDate={formatDate}
                  completeReservation={completeReservation}
                  cancelReservation={cancelReservation}
                  setActiveTab={setActiveTab}
                  setShowFeedbackModal={setShowFeedbackModal}
                  setSelectedReservation={setSelectedReservation}
                  feedback={feedback}
              />
          )}
          {activeTab === 'feedback' && (
              <FeedbackTab
                  isAuthenticated={isAuthenticated}
                  feedback={feedback}
                  reservations={reservations}
                  loading={loading}
                  loadFeedback={loadFeedback}
                  getVehicleIcon={getVehicleIcon}
                  formatDate={formatDate}
                  renderStars={renderStars}
                  feedbackCategories={feedbackCategories}
                  setSelectedReservation={setSelectedReservation}
                  setShowFeedbackModal={setShowFeedbackModal}
                  deleteFeedback={deleteFeedback}
                  getCompletedReservationsForFeedback={getCompletedReservationsForFeedback}
              />
          )}
          <FeedbackAnalyticsModal
              showFeedbackAnalyticsModal={showFeedbackAnalyticsModal}
              setShowFeedbackAnalyticsModal={setShowFeedbackAnalyticsModal}
              analyticsLoading={analyticsLoading}
              analyticsData={analyticsData}
              feedbackAnalytics={feedbackAnalytics}
              analyticsFilters={analyticsFilters}
              setAnalyticsFilters={setAnalyticsFilters}
              getSentimentBadge={getSentimentBadge}
              getSeverityBadge={getSeverityBadge}
          />
          <ReservationModal
              showReservationModal={showReservationModal}
              setShowReservationModal={setShowReservationModal}
              selectedVehicle={selectedVehicle}
              isAuthenticated={isAuthenticated}
              reservationForm={reservationForm}
              setReservationForm={setReservationForm}
              handleReservationSubmit={handleReservationSubmit}
              loading={loading}
              getVehicleIcon={getVehicleIcon}
              calculateCost={calculateCost}
          />
          <FeedbackModal
              showFeedbackModal={showFeedbackModal}
              setShowFeedbackModal={setShowFeedbackModal}
              selectedReservation={selectedReservation}
              isAuthenticated={isAuthenticated}
              feedbackForm={feedbackForm}
              setFeedbackForm={setFeedbackForm}
              handleFeedbackSubmit={handleFeedbackSubmit}
              loading={loading}
              getVehicleIcon={getVehicleIcon}
              formatDate={formatDate}
              renderStars={renderStars}
              feedbackCategories={feedbackCategories}
              commonIssues={commonIssues}
          />
        </main>
      </div>
  );
};

export default User;