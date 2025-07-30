import React from 'react';
import { X, Send } from 'lucide-react';

const FeedbackModal = ({
                           showFeedbackModal,
                           setShowFeedbackModal,
                           selectedReservation,
                           isAuthenticated,
                           feedbackForm,
                           setFeedbackForm,
                           handleFeedbackSubmit,
                           loading,
                           getVehicleIcon,
                           formatDate,
                           renderStars,
                           feedbackCategories,
                           commonIssues
                       }) => {
    if (!showFeedbackModal || !selectedReservation || !isAuthenticated) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Share Your Experience</h3>
                        <button
                            onClick={() => setShowFeedbackModal(false)}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Vehicle Info */}
                    <div className="mb-6">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                {getVehicleIcon(selectedReservation.vehicleType)}
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900">{selectedReservation.vehicleModel}</h4>
                                <p className="text-sm text-gray-500">
                                    {formatDate(selectedReservation.startDate)} - {formatDate(selectedReservation.endDate)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Feedback Form */}
                    <div className="space-y-6">
                        {/* Rating */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">Overall Rating</label>
                            <div className="flex items-center space-x-3">
                                {renderStars(feedbackForm.rating, true, (rating) =>
                                    setFeedbackForm({ ...feedbackForm, rating })
                                )}
                                <span className="text-sm text-gray-600">
                  {['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][feedbackForm.rating - 1]}
                </span>
                            </div>
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                            <select
                                value={feedbackForm.category}
                                onChange={(e) => setFeedbackForm({ ...feedbackForm, category: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                            >
                                {feedbackCategories.map((category) => (
                                    <option key={category.value} value={category.value}>
                                        {category.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Subject */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                            <input
                                type="text"
                                value={feedbackForm.subject}
                                onChange={(e) => setFeedbackForm({ ...feedbackForm, subject: e.target.value })}
                                placeholder="Brief summary of your experience..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Message */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Detailed Feedback</label>
                            <textarea
                                value={feedbackForm.message}
                                onChange={(e) => setFeedbackForm({ ...feedbackForm, message: e.target.value })}
                                rows={4}
                                placeholder="Tell us about your experience..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Issues */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Any Issues? (Select all that apply)
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {commonIssues.map((issue) => (
                                    <label key={issue} className="flex items-center space-x-2 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={feedbackForm.issues.includes(issue)}
                                            onChange={() => {
                                                const newIssues = feedbackForm.issues.includes(issue)
                                                    ? feedbackForm.issues.filter((i) => i !== issue)
                                                    : [...feedbackForm.issues, issue];
                                                setFeedbackForm({ ...feedbackForm, issues: newIssues });
                                            }}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-gray-700">{issue}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Recommendation */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Would you recommend this vehicle to others?
                            </label>
                            <div className="flex space-x-4">
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="radio"
                                        name="recommend"
                                        checked={feedbackForm.wouldRecommend === true}
                                        onChange={() => setFeedbackForm({ ...feedbackForm, wouldRecommend: true })}
                                        className="text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">Yes</span>
                                </label>
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="radio"
                                        name="recommend"
                                        checked={feedbackForm.wouldRecommend === false}
                                        onChange={() => setFeedbackForm({ ...feedbackForm, wouldRecommend: false })}
                                        className="text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">No</span>
                                </label>
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex space-x-3 pt-4">
                            <button
                                onClick={() => setShowFeedbackModal(false)}
                                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleFeedbackSubmit}
                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center space-x-2"
                                disabled={loading || !feedbackForm.subject.trim() || !feedbackForm.message.trim()}
                            >
                                <Send className="w-4 h-4" />
                                <span>{loading ? 'Submitting...' : 'Submit Feedback'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FeedbackModal;