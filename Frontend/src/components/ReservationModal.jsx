import React from 'react';
import { X } from 'lucide-react';

const ReservationModal = ({
                              showReservationModal,
                              setShowReservationModal,
                              selectedVehicle,
                              isAuthenticated,
                              reservationForm,
                              setReservationForm,
                              handleReservationSubmit,
                              loading,
                              getVehicleIcon,
                              calculateCost
                          }) => {
    if (!showReservationModal || !selectedVehicle || !isAuthenticated) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Reserve Vehicle</h3>
                        <button onClick={() => setShowReservationModal(false)} className="text-gray-400 hover:text-gray-600">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="mb-6">
                        <div className="flex items-center space-x-3 mb-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                {getVehicleIcon(selectedVehicle.vehicleType)}
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900">{selectedVehicle.model}</h4>
                                <p className="text-sm text-gray-500">${selectedVehicle.hourlyRate}/hour</p>
                            </div>
                        </div>
                        {selectedVehicle.discountCode && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                <p className="text-sm text-green-800">
                                    Use code "{selectedVehicle.discountCode}" for {selectedVehicle.discountPercentage}% off
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date & Time</label>
                            <input
                                type="datetime-local"
                                value={reservationForm.startDate}
                                onChange={(e) => setReservationForm({ ...reservationForm, startDate: e.target.value })}
                                min={new Date().toISOString().slice(0, 16)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">End Date & Time</label>
                            <input
                                type="datetime-local"
                                value={reservationForm.endDate}
                                onChange={(e) => setReservationForm({ ...reservationForm, endDate: e.target.value })}
                                min={reservationForm.startDate || new Date().toISOString().slice(0, 16)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Discount Code (Optional)</label>
                            <input
                                type="text"
                                value={reservationForm.discountCode}
                                onChange={(e) => setReservationForm({ ...reservationForm, discountCode: e.target.value })}
                                placeholder="Enter discount code..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                            <textarea
                                value={reservationForm.notes}
                                onChange={(e) => setReservationForm({ ...reservationForm, notes: e.target.value })}
                                rows={3}
                                placeholder="Any special requirements..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {reservationForm.startDate && reservationForm.endDate && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-blue-800">Estimated Cost:</span>
                                    <span className="text-lg font-bold text-blue-900">
                    ${calculateCost(selectedVehicle, reservationForm.startDate, reservationForm.endDate, reservationForm.discountCode).total}
                  </span>
                                </div>
                                <p className="text-xs text-blue-600 mt-1">
                                    {calculateCost(selectedVehicle, reservationForm.startDate, reservationForm.endDate, reservationForm.discountCode).hours} hours
                                </p>
                            </div>
                        )}

                        <div className="flex space-x-3 pt-4">
                            <button
                                onClick={() => setShowReservationModal(false)}
                                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReservationSubmit}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                disabled={loading}
                            >
                                {loading ? 'Creating...' : 'Confirm Reservation'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReservationModal;