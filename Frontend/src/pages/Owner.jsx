import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import axios from 'axios';
import { redirectBaseUri } from '../constants/constants';
import VehicleList from '../components/VehicleList';
import VehicleForm from '../components/VehicleForm';
import Notification from '../components/Notification';

const VehicleManagement = () => {
  const [vehicles, setVehicles] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const API_BASE_URL = `${redirectBaseUri}/dev/owner`;

  const [formData, setFormData] = useState({
    vehicleType: 'anebike',
    model: '',
    accessCode: '',
    hourlyRate: '',
    batteryLife: '',
    heightAdjustment: false,
    gpsTracking: true,
    antiTheft: true,
    ledLights: false,
    phoneHolder: false,
    bluetooth: false,
    speedModes: false,
    discountCode: '',
    discountPercentage: '',
    status: 'available',
    location: ''
  });

  const vehicleTypes = [
    { value: 'anebike', label: 'E-Bike', icon: '🚴' },
    { value: 'gyroscooter', label: 'Gyroscooter', icon: '🛴' },
    { value: 'segway', label: 'Segway', icon: '🛴' }
  ];

  const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
  });

  apiClient.interceptors.request.use(
      (config) => {
        const token = sessionStorage.getItem('jwt');

        console.log('Making API request:', {
          url: config.url,
          method: config.method,
          baseURL: config.baseURL,
          token: token ? `${token.substring(0, 20)}...` : 'No token'
        });

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        } else {
          console.warn('No JWT token found in sessionStorage');
          showNotification('Please log in to continue', 'error');
          throw new axios.Cancel('No authentication token available');
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
  );

  apiClient.interceptors.response.use(
      (response) => {
        console.log('API Success:', {
          status: response.status,
          url: response.config.url,
          data: response.data
        });
        return response;
      },
      (error) => {
        console.error('API Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          url: error.config?.url,
          data: error.response?.data,
          headers: error.response?.headers
        });

        if (error.response?.status === 401) {
          console.log('401 Unauthorized - clearing session');
          sessionStorage.removeItem('jwt');
          sessionStorage.removeItem('user');
          showNotification('Session expired. Please log in again.', 'error');
        }

        return Promise.reject(error);
      }
  );

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/vehicles');
      setVehicles(response.data.vehicles || []);
    } catch (error) {
      console.error('Error loading vehicles:', error);

      if (axios.isCancel(error)) {
        console.log('Request cancelled:', error.message);
        return;
      }

      let errorMessage = 'Failed to load vehicles';
      if (error.response?.data?.message) {
        errorMessage += ': ' + error.response.data.message;
      } else if (error.message) {
        errorMessage += ': ' + error.message;
      }

      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = sessionStorage.getItem('jwt');
    console.log('Component mounted. Token check:', {
      hasToken: !!token,
      tokenStart: token?.substring(0, 20) + '...' || 'No token'
    });

    if (token) {
      loadVehicles();
    } else {
      showNotification('Please log in to access vehicle management', 'error');
    }
  }, []);

  const resetForm = () => {
    setFormData({
      vehicleType: 'anebike',
      model: '',
      accessCode: '',
      hourlyRate: '',
      batteryLife: '',
      heightAdjustment: false,
      gpsTracking: true,
      antiTheft: true,
      ledLights: false,
      phoneHolder: false,
      bluetooth: false,
      speedModes: false,
      discountCode: '',
      discountPercentage: '',
      status: 'available',
      location: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.model || !formData.accessCode || !formData.hourlyRate || !formData.batteryLife) {
        throw new Error('Please fill in all required fields');
      }

      const vehicleData = {
        vehicleType: formData.vehicleType,
        model: formData.model.trim(),
        accessCode: formData.accessCode.trim().toUpperCase(),
        hourlyRate: parseFloat(formData.hourlyRate),
        batteryLife: parseInt(formData.batteryLife),
        discountCode: formData.discountCode ? formData.discountCode.trim().toUpperCase() : null,
        discountPercentage: formData.discountPercentage ? parseInt(formData.discountPercentage) : 0,
        status: formData.status,
        location: formData.location ? formData.location.trim() : null,
        features: {
          heightAdjustment: formData.heightAdjustment,
          gpsTracking: formData.gpsTracking,
          antiTheft: formData.antiTheft,
          ledLights: formData.ledLights,
          phoneHolder: formData.phoneHolder,
          bluetooth: formData.bluetooth,
          speedModes: formData.speedModes
        }
      };

      console.log('Submitting vehicle data:', vehicleData);

      let response;
      if (editingVehicle) {
        response = await apiClient.put(`/vehicles/${editingVehicle.vehicleId}`, vehicleData);
        showNotification('Vehicle updated successfully!');
      } else {
        response = await apiClient.post('/vehicles', vehicleData);
        showNotification('Vehicle created successfully!');
      }

      resetForm();
      setShowAddForm(false);
      setEditingVehicle(null);
      await loadVehicles();
    } catch (error) {
      console.error('Error saving vehicle:', error);

      if (axios.isCancel(error)) {
        return;
      }

      let errorMessage = 'Error saving vehicle';
      if (error.response?.data?.message) {
        errorMessage += ': ' + error.response.data.message;
      } else if (error.message) {
        errorMessage += ': ' + error.message;
      }

      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (vehicle) => {
    setFormData({
      vehicleType: vehicle.vehicleType,
      model: vehicle.model,
      accessCode: vehicle.accessCode,
      hourlyRate: vehicle.hourlyRate.toString(),
      batteryLife: vehicle.batteryLife.toString(),
      heightAdjustment: vehicle.features?.heightAdjustment || false,
      gpsTracking: vehicle.features?.gpsTracking !== false,
      antiTheft: vehicle.features?.antiTheft !== false,
      ledLights: vehicle.features?.ledLights || false,
      phoneHolder: vehicle.features?.phoneHolder || false,
      bluetooth: vehicle.features?.bluetooth || false,
      speedModes: vehicle.features?.speedModes || false,
      discountCode: vehicle.discountCode || '',
      discountPercentage: vehicle.discountPercentage ? vehicle.discountPercentage.toString() : '',
      status: vehicle.status,
      location: vehicle.location || ''
    });
    setEditingVehicle(vehicle);
    setShowAddForm(true);
  };

  const handleDelete = async (vehicleId) => {
    if (window.confirm('Are you sure you want to delete this vehicle?')) {
      setLoading(true);
      try {
        await apiClient.delete(`/vehicles/${vehicleId}`);
        showNotification('Vehicle deleted successfully!');
        await loadVehicles();
      } catch (error) {
        console.error('Error deleting vehicle:', error);

        let errorMessage = 'Error deleting vehicle';
        if (error.response?.data?.message) {
          errorMessage += ': ' + error.response.data.message;
        } else if (error.message) {
          errorMessage += ': ' + error.message;
        }

        showNotification(errorMessage, 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'rented': return 'bg-blue-100 text-blue-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'offline': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  window.debugAuth = () => {
    const token = sessionStorage.getItem('jwt');
    const user = sessionStorage.getItem('user');
    console.log('Auth Debug:', {
      token,
      user,
      apiBaseUrl: API_BASE_URL
    });
  };

  return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <Notification notification={notification} />
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Franchise Vehicle Management</h1>
                  <p className="text-gray-600 mt-1">Manage your e-bikes, gyroscooters, and segways</p>
                </div>
                <button
                    onClick={() => {
                      resetForm();
                      setEditingVehicle(null);
                      setShowAddForm(true);
                    }}
                    disabled={loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <Plus size={20} />
                  Add Vehicle
                </button>
              </div>
            </div>
            {showAddForm && (
                <VehicleForm
                    formData={formData}
                    setFormData={setFormData}
                    vehicleTypes={vehicleTypes}
                    editingVehicle={editingVehicle}
                    loading={loading}
                    handleSubmit={handleSubmit}
                    resetForm={resetForm}
                    setShowAddForm={setShowAddForm}
                    setEditingVehicle={setEditingVehicle}
                />
            )}
            <VehicleList
                vehicles={vehicles}
                loading={loading}
                handleEdit={handleEdit}
                handleDelete={handleDelete}
                getStatusColor={getStatusColor}
            />
          </div>
        </div>
      </div>
  );
};

export default VehicleManagement;