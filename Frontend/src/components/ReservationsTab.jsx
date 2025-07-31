import React from 'react';
import { Calendar, CheckCircle, Trash2, MessageSquare } from 'lucide-react';

const ReservationsTab = ({
                             isAuthenticated,
                             reservations,
                             loading,
                             loadReservations,
                             getVehicleIcon,
                             getStatusColor,
                             formatDate,
                             completeReservation,
                             cancelReservation,
                             setActiveTab,
                             setShowFeedbackModal,
                             setSelectedReservation,
                             feedback
                         }) => {
    if (!isAuthenticated) {
        return (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <LogIn className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Sign in required</h3>
                <p className="text-gray-600 mb-4">
                    Please sign in to access your reservations.
                </p>
                <button
                    onClick={() => window.location.href = '/auth'}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2 mx-auto"
                >
                    <LogIn className="w-4 h-4" />
                    <span>Sign In</span>
                </button>
            </div>
        );
    }

    if (loading) return null;

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">My Reservations</h2>
                <button
                    onClick={loadReservations}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                    Refresh
                </button>
            </div>

            {reservations.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No reservations yet</h3>
                    <p className="text-gray-600 mb-4">Start by browsing available vehicles and make your first reservation.</p>
                    <button
                        onClick={() => setActiveTab('browse')}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                        Browse Vehicles
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {reservations.map(reservation => (
                        <div key={reservation.reservationId} className="bg-white rounded-lg shadow-sm border p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-4">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        {getVehicleIcon(reservation.vehicleType)}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{reservation.vehicleModel}</h3>
                                        <p className="text-sm text-gray-500 capitalize">
                                            {reservation.vehicleType.replace('anebike', 'E-Bike')}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(reservation.status)}`}>
                    {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                  </span>

                                    {reservation.status === 'confirmed' && (
                                        <>
                                            <button
                                                onClick={async () => {
                                                    if (confirm('Are you sure you want to return this vehicle?')) {
                                                        try {
                                                            await completeReservation(reservation.reservationId);
                                                            loadReservations();
                                                            alert('Vehicle returned successfully!');
                                                        } catch (err) {
                                                            alert('Error returning vehicle: ' + err.message);
                                                        }
                                                    }
                                                }}
                                                className="flex items-center space-x-1 px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                                <span>Return Vehicle</span>
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    if (confirm('Are you sure you want to cancel this reservation?')) {
                                                        try {
                                                            await cancelReservation(reservation.reservationId);
                                                            loadReservations();
                                                            alert('Reservation cancelled successfully');
                                                        } catch (err) {
                                                            alert('Error cancelling reservation: ' + err.message);
                                                        }
                                                    }
                                                }}
                                                className="text-red-600 hover:text-red-800"
                                                title="Cancel Reservation"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </>
                                    )}

                                    {reservation.status === 'completed' && !feedback.some(f => f.reservationId === reservation.reservationId) && (
                                        <button
                                            onClick={() => {
                                                setSelectedReservation(reservation);
                                                setShowFeedbackModal(true);
                                            }}
                                            className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                        >
                                            <MessageSquare className="w-4 h-4" />
                                            <span>Leave Feedback</span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Start Time</label>
                                    <p className="text-sm text-gray-900">{formatDate(reservation.startDate)}</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">End Time</label>
                                    <p className="text-sm text-gray-900">{formatDate(reservation.endDate)}</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Duration</label>
                                    <p className="text-sm text-gray-900">{reservation.durationHours} hours</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                                <div className="flex items-center space-x-4">
                                    <span className="text-sm text-gray-600">${reservation.hourlyRate}/hour</span>
                                    {reservation.discountPercentage > 0 && (
                                        <span className="text-sm text-green-600 font-medium">
                      {reservation.discountPercentage}% discount applied
                    </span>
                                    )}
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-gray-900">${reservation.totalCost}</p>
                                    <p className="text-xs text-gray-500">Total cost</p>
                                </div>
                            </div>

                            {reservation.notes && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                    <p className="text-sm text-gray-600">
                                        <span className="font-medium">Notes:</span> {reservation.notes}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ReservationsTab;