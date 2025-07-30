import React from 'react';
import { Edit3, Trash2, Battery, DollarSign } from 'lucide-react';

const vehicleTypes = [
    { value: 'anebike', label: 'E-Bike', icon: '🚴' },
    { value: 'gyroscooter', label: 'Gyroscooter', icon: '🛴' },
    { value: 'segway', label: 'Segway', icon: '🛴' }
];

const VehicleList = ({ vehicles, loading, handleEdit, handleDelete, getStatusColor }) => (
    <div className="p-6">
        {loading && vehicles.length === 0 ? (
            <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading vehicles...</p>
            </div>
        ) : vehicles.length === 0 ? (
            <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">🚴</div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No vehicles yet</h3>
                <p className="text-gray-600">Add your first vehicle to get started</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vehicles.map(vehicle => (
                    <div key={vehicle.vehicleId} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">
                    {vehicleTypes.find(t => t.value === vehicle.vehicleType)?.icon}
                  </span>
                                    <h3 className="font-semibold text-gray-900">{vehicle.model}</h3>
                                </div>
                                <p className="text-sm text-gray-600">Code: {vehicle.accessCode}</p>
                                {vehicle.location && (
                                    <p className="text-sm text-gray-500">📍 {vehicle.location}</p>
                                )}
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(vehicle.status)}`}>
                {vehicle.status}
              </span>
                        </div>

                        <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <DollarSign size={16} />
                                <span>${vehicle.hourlyRate}/hour</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Battery size={16} />
                                <span>{vehicle.batteryLife}h battery</span>
                            </div>
                            {vehicle.discountCode && (
                                <div className="flex items-center gap-2 text-sm text-green-600">
                                    <span className="text-green-600">🏷️</span>
                                    <span>{vehicle.discountCode} ({vehicle.discountPercentage}% off)</span>
                                </div>
                            )}
                            {vehicle.totalRides > 0 && (
                                <div className="text-sm text-gray-500">
                                    {vehicle.totalRides} rides • ${vehicle.totalRevenue?.toFixed(2) || '0.00'} revenue
                                </div>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-1 mb-4">
                            {vehicle.features?.heightAdjustment && <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Height Adj.</span>}
                            {vehicle.features?.gpsTracking && <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">GPS</span>}
                            {vehicle.features?.antiTheft && <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">Anti-Theft</span>}
                            {vehicle.features?.ledLights && <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">LED</span>}
                            {vehicle.features?.phoneHolder && <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">Phone Holder</span>}
                            {vehicle.features?.bluetooth && <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded">Bluetooth</span>}
                            {vehicle.features?.speedModes && <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded">Speed Modes</span>}
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => handleEdit(vehicle)}
                                disabled={loading}
                                className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors disabled:opacity-50"
                            >
                                <Edit3 size={16} />
                                Edit
                            </button>
                            <button
                                onClick={() => handleDelete(vehicle.vehicleId)}
                                disabled={loading || vehicle.status === 'rented'}
                                className="flex-1 bg-red-100 text-red-700 px-3 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-red-200 transition-colors disabled:opacity-50"
                            >
                                <Trash2 size={16} />
                                Delete
                            </button>
                        </div>

                        {vehicle.status === 'rented' && (
                            <p className="text-xs text-gray-500 mt-2 text-center">Cannot delete while rented</p>
                        )}
                    </div>
                ))}
            </div>
        )}
    </div>
);

export default VehicleList;