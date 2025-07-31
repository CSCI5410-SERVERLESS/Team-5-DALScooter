import React from 'react';
import { MessageSquare, LogIn, Trash2, ThumbsUp, ThumbsDown } from 'lucide-react';

const FeedbackTab = ({
                         isAuthenticated,
                         feedback,
                         reservations,
                         loading,
                         loadFeedback,
                         getVehicleIcon,
                         formatDate,
                         renderStars,
                         feedbackCategories,
                         setSelectedReservation,
                         setShowFeedbackModal,
                         deleteFeedback,
                         getCompletedReservationsForFeedback
                     }) => {
    if (!isAuthenticated) {
        return (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <LogIn className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Sign in required</h3>
                <p className="text-gray-600 mb-4">
                    Please sign in to access feedback management.
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
                <h2 className="text-2xl font-bold text-gray-900">My Feedback</h2>
                <div className="flex space-x-4">
                    {getCompletedReservationsForFeedback().length > 0 && (
                        <span className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-full">
              {getCompletedReservationsForFeedback().length} rides awaiting feedback
            </span>
                    )}
                    <button onClick={loadFeedback} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">
                        Refresh
                    </button>
                </div>
            </div>

            {/* Pending Feedback */}
            {getCompletedReservationsForFeedback().length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
                    <h3 className="text-lg font-semibold text-green-900 mb-4">
                        <MessageSquare className="w-5 h-5 inline mr-2" />
                        Completed Rides - Share Your Experience
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {getCompletedReservationsForFeedback().map(reservation => (
                            <div key={reservation.reservationId} className="bg-white rounded-lg border p-4">
                                <div className="flex items-center space-x-3 mb-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        {getVehicleIcon(reservation.vehicleType)}
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-gray-900">{reservation.vehicleModel}</h4>
                                        <p className="text-sm text-gray-500">{formatDate(reservation.endDate)}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setSelectedReservation(reservation);
                                        setShowFeedbackModal(true);
                                    }}
                                    className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 text-sm font-medium"
                                >
                                    Leave Feedback
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Submitted Feedback */}
            {feedback.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No feedback submitted yet</h3>
                    <p className="text-gray-600 mb-4">Complete a ride to share your experience and help us improve our service.</p>
                    {getCompletedReservationsForFeedback().length === 0 && (
                        <button
                            onClick={() => setActiveTab('browse')}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                        >
                            Browse Vehicles
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-6">
                    {feedback.map(item => (
                        <div key={item.feedbackId} className="bg-white rounded-lg shadow-sm border p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center space-x-4">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        {getVehicleIcon(item.vehicleType)}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{item.vehicleModel}</h3>
                                        <p className="text-sm text-gray-500 capitalize">
                                            {item.vehicleType.replace('anebike', 'E-Bike')}
                                        </p>
                                        <p className="text-xs text-gray-400">Submitted on {formatDate(item.createdAt)}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center space-x-2 mb-2">
                                        {renderStars(item.rating)}
                                        <span className="text-sm font-medium">{item.rating}/5</span>
                                        <button
                                            onClick={async () => {
                                                if (confirm('Are you sure you want to delete this feedback?')) {
                                                    try {
                                                        await deleteFeedback(item.feedbackId);
                                                        loadFeedback();
                                                        alert('Feedback deleted successfully');
                                                    } catch (err) {
                                                        alert('Error deleting feedback: ' + err.message);
                                                    }
                                                }
                                            }}
                                            className="text-red-600 hover:text-red-800 ml-2"
                                            title="Delete Feedback"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                    {feedbackCategories.find(cat => cat.value === item.category)?.label || item.category}
                  </span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900 mb-1">Subject</h4>
                                    <p className="text-sm text-gray-700">{item.subject}</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900 mb-1">Feedback</h4>
                                    <p className="text-sm text-gray-700">{item.message}</p>
                                </div>

                                {item.issues?.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-900 mb-2">Issues Reported</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {item.issues.map((issue, idx) => (
                                                <span key={idx} className="inline-flex items-center px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                          {issue}
                        </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center space-x-4 pt-2 border-t border-gray-100">
                                    <div className="flex items-center space-x-2">
                                        {item.wouldRecommend ? (
                                            <ThumbsUp className="w-4 h-4 text-green-600" />
                                        ) : (
                                            <ThumbsDown className="w-4 h-4 text-red-600" />
                                        )}
                                        <span className="text-sm text-gray-600">
                      {item.wouldRecommend ? 'Would recommend' : 'Would not recommend'}
                    </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FeedbackTab;