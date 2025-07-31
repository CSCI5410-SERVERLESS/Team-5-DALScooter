import React from 'react';
import {
    Car,
    MapPin,
    Battery,
    Star,
    Filter,
    Eye,
    ChevronUp,
    ChevronDown,
    Users,
    ThumbsUp,
    LogIn,
    AlertCircle
} from 'lucide-react';

const BrowseTab = ({
                       isAuthenticated,
                       filters,
                       setFilters,
                       vehicles,
                       loading,
                       handleReserveClick,
                       handleViewReviewsClick,
                       getVehicleIcon,
                       getBatteryColor,
                       renderReviewSummary,
                       expandedVehicles,
                       setExpandedVehicles,
                   }) => {
    if (loading) return null;

    return (
        <div>
            {/* Auth Prompt for Guests */}
            {!isAuthenticated && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <AlertCircle className="w-5 h-5 text-blue-600" />
                            <span className="text-blue-800">
                <strong>Sign in to book vehicles</strong> - You can browse and read reviews without an account
              </span>
                        </div>
                        <button
                            onClick={() => window.location.href = '/auth'}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm flex items-center space-x-2"
                        >
                            <LogIn className="w-4 h-4" />
                            <span>Sign In</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Find Your Ride</h2>
                    <button
                        onClick={() => setFilters({ ...filters, showFilters: !filters.showFilters })}
                        className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
                    >
                        <Filter className="w-4 h-4" />
                        <span>Filters</span>
                    </button>
                </div>

                {filters.showFilters && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Type</label>
                            <select
                                value={filters.type}
                                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Types</option>
                                <option value="anebike">E-Bike</option>
                                <option value="gyroscooter">Gyro Scooter</option>
                                <option value="segway">Segway</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                            <input
                                type="text"
                                value={filters.location}
                                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                                placeholder="Search location..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Max Rate ($/hour)</label>
                            <input
                                type="number"
                                value={filters.maxRate}
                                onChange={(e) => setFilters({ ...filters, maxRate: e.target.value })}
                                placeholder="Enter max rate..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Vehicle Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vehicles.map(vehicle => (
                    <div key={vehicle.vehicleId} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                        <div className="p-6">
                            {/* Vehicle Header */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        {getVehicleIcon(vehicle.vehicleType)}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{vehicle.model}</h3>
                                        <p className="text-sm text-gray-500 capitalize">
                                            {vehicle.vehicleType.replace('anebike', 'E-Bike')}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-blue-600">${vehicle.hourlyRate}</p>
                                    <p className="text-sm text-gray-500">per hour</p>
                                </div>
                            </div>

                            {/* Vehicle Details */}
                            <div className="space-y-3 mb-4">
                                {vehicle.location && (
                                    <div className="flex items-center space-x-2">
                                        <MapPin className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm text-gray-600">{vehicle.location}</span>
                                    </div>
                                )}
                                <div className="flex items-center space-x-2">
                                    <Battery className={`w-4 h-4 ${getBatteryColor(vehicle.batteryLife)}`} />
                                    <span className="text-sm text-gray-600">{vehicle.batteryLife}% battery</span>
                                </div>
                            </div>

                            {/* Reviews */}
                            {vehicle.reviewSummary && (
                                <div className="mb-4">
                                    {renderReviewSummary(vehicle.reviewSummary)}
                                    {vehicle.reviewSummary.totalReviews > 0 && (
                                        <div className="mt-2 flex justify-between items-center">
                                            <button
                                                onClick={() => handleViewReviewsClick(vehicle)}
                                                className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                                            >
                                                <Eye className="w-4 h-4" />
                                                <span>View Reviews</span>
                                            </button>
                                            <button
                                                onClick={() => setExpandedVehicles({ ...expandedVehicles, [vehicle.vehicleId]: !expandedVehicles[vehicle.vehicleId] })}
                                                className="text-sm text-gray-600 hover:text-gray-700 flex items-center space-x-1"
                                            >
                                                {expandedVehicles[vehicle.vehicleId] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                <span>{expandedVehicles[vehicle.vehicleId] ? 'Less' : 'Details'}</span>
                                            </button>
                                        </div>
                                    )}

                                    {/* Expanded Details */}
                                    {expandedVehicles[vehicle.vehicleId] && vehicle.reviewSummary.totalReviews > 0 && (
                                        <div className="mt-3 pt-3 border-t border-gray-200">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Quick Stats</h4>
                                                    <div className="space-y-1 text-sm text-gray-600">
                                                        <div className="flex items-center space-x-2">
                                                            <Users className="w-4 h-4" />
                                                            <span>{vehicle.reviewSummary.totalReviews} reviews</span>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <ThumbsUp className="w-4 h-4 text-green-500" />
                                                            <span>{vehicle.reviewSummary.recommendationPercentage}% recommend</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Discount */}
                            {vehicle.discountCode && vehicle.discountPercentage > 0 && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                                    <div className="flex items-center space-x-2">
                                        <Star className="w-4 h-4 text-green-600" />
                                        <span className="text-sm font-medium text-green-800">
                      {vehicle.discountPercentage}% off with code "{vehicle.discountCode}"
                    </span>
                                    </div>
                                </div>
                            )}

                            {/* Features */}
                            {vehicle.features && (
                                <div className="grid grid-cols-2 gap-2 mb-4">
                                    {Object.entries(vehicle.features).filter(([_, value]) => value).map(([feature]) => (
                                        <div key={feature} className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                                            {feature.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Reserve Button */}
                            <button
                                onClick={() => handleReserveClick(vehicle)}
                                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
                            >
                                {isAuthenticated ? 'Reserve Now' : 'Sign In to Reserve'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* No Vehicles */}
            {vehicles.length === 0 && !loading && (
                <div className="text-center py-12">
                    <Car className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No vehicles available</h3>
                    <p className="text-gray-600">No vehicles match your current filters, or none are available right now.</p>
                    <button
                        onClick={() => setFilters({ type: '', location: '', maxRate: '', showFilters: false })}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                        Clear Filters
                    </button>
                </div>
            )}
        </div>
    );
};

export default BrowseTab;