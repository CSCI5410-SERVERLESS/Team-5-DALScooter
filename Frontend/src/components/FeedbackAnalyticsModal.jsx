import React from 'react';
import { X, MessageSquare, ThumbsUp, ThumbsDown, AlertCircle } from 'lucide-react';

const FeedbackAnalyticsModal = ({
                                    showFeedbackAnalyticsModal,
                                    setShowFeedbackAnalyticsModal,
                                    analyticsLoading,
                                    analyticsData,
                                    feedbackAnalytics,
                                    analyticsFilters,
                                    setAnalyticsFilters,
                                    getSentimentBadge,
                                    getSeverityBadge
                                }) => {
    if (!showFeedbackAnalyticsModal) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    {/* Compact Header */}
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold text-gray-900">Customer Reviews</h3>
                        <button
                            onClick={() => setShowFeedbackAnalyticsModal(false)}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {analyticsLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <span className="ml-2 text-gray-600">Loading reviews...</span>
                        </div>
                    ) : (
                        <>
                            {/* Quick Stats Bar */}
                            {analyticsData && (
                                <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4 mb-4">
                                    <div className="flex items-center space-x-6">
                                        <div className="text-center">
                                            <p className="text-2xl font-bold text-gray-900">{analyticsData.totalAnalyzed}</p>
                                            <p className="text-xs text-gray-600">Total Reviews</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-2xl font-bold text-green-600">
                                                {analyticsData.sentimentDistribution?.percentages?.POSITIVE || 0}%
                                            </p>
                                            <p className="text-xs text-gray-600">Positive</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-2xl font-bold text-red-600">
                                                {analyticsData.sentimentDistribution?.percentages?.NEGATIVE || 0}%
                                            </p>
                                            <p className="text-xs text-gray-600">Negative</p>
                                        </div>
                                    </div>

                                    {/* Compact Filters */}
                                    <div className="flex items-center space-x-3">
                                        <select
                                            value={analyticsFilters.sentiment}
                                            onChange={(e) => setAnalyticsFilters({ ...analyticsFilters, sentiment: e.target.value })}
                                            className="text-sm border border-gray-300 rounded px-2 py-1"
                                        >
                                            <option value="">All Sentiments</option>
                                            <option value="POSITIVE">Positive</option>
                                            <option value="NEGATIVE">Negative</option>
                                            <option value="NEUTRAL">Neutral</option>
                                        </select>

                                        <select
                                            value={analyticsFilters.rating}
                                            onChange={(e) => setAnalyticsFilters({ ...analyticsFilters, rating: e.target.value })}
                                            className="text-sm border border-gray-300 rounded px-2 py-1"
                                        >
                                            <option value="">All Ratings</option>
                                            <option value="5">5 Stars</option>
                                            <option value="4">4 Stars</option>
                                            <option value="3">3 Stars</option>
                                            <option value="2">2 Stars</option>
                                            <option value="1">1 Star</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* Reviews List - Main Focus */}
                            <div className="space-y-4">
                                {feedbackAnalytics.map((item) => (
                                    <div key={item.feedbackId} className="bg-white border rounded-lg p-5 hover:shadow-md transition-shadow">
                                        {/* Review Header */}
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-gray-900 text-lg mb-1">{item.subject}</h4>
                                                <div className="flex items-center space-x-3 text-sm text-gray-600">
                                                    <span>{item.vehicleType} - {item.vehicleModel}</span>
                                                    <span>•</span>
                                                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <div className="flex text-yellow-400 text-lg">
                                                    {'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}
                                                </div>
                                                <span className="text-sm font-medium text-gray-700">({item.rating}/5)</span>
                                            </div>
                                        </div>

                                        {/* Review Message */}
                                        <div className="mb-4">
                                            <p className="text-gray-800 leading-relaxed">{item.message}</p>
                                        </div>

                                        {/* Compact Sentiment Info */}
                                        <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                                            <div className="flex items-center space-x-4">
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-xs text-gray-500">Sentiment:</span>
                                                    <span className={`px-2 py-1 text-xs font-medium rounded ${getSentimentBadge(item.sentimentAnalysis?.sentiment)}`}>
                            {item.sentimentAnalysis?.sentiment || 'UNKNOWN'}
                          </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-3">
                                                {item.sentimentAnalysis?.severity && (
                                                    <span className={`px-2 py-1 text-xs font-medium rounded ${getSeverityBadge(item.sentimentAnalysis.severity)}`}>
                            {item.sentimentAnalysis.severity} Priority
                          </span>
                                                )}

                                                <div className="flex items-center space-x-1">
                                                    {item.wouldRecommend ? (
                                                        <ThumbsUp className="w-4 h-4 text-green-600" />
                                                    ) : (
                                                        <ThumbsDown className="w-4 h-4 text-red-600" />
                                                    )}
                                                    <span className="text-xs text-gray-600">
                            {item.wouldRecommend ? 'Recommends' : 'Not recommended'}
                          </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Issues (if any) */}
                                        {(item.issues || []).length > 0 && (
                                            <div className="mt-3">
                                                <div className="flex flex-wrap gap-2">
                                                    {item.issues.slice(0, 3).map((issue, idx) => (
                                                        <span key={idx} className="inline-flex items-center px-2 py-1 text-xs bg-red-50 text-red-700 rounded">
                              <AlertCircle className="w-3 h-3 mr-1" />
                                                            {issue}
                            </span>
                                                    ))}
                                                    {item.issues.length > 3 && (
                                                        <span className="text-xs text-gray-500">+{item.issues.length - 3} more</span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {feedbackAnalytics.length === 0 && (
                                    <div className="text-center py-16">
                                        <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                        <h4 className="text-xl text-gray-900 mb-2">No reviews found</h4>
                                        <p className="text-gray-600">Try adjusting your filters or check back later for new reviews.</p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FeedbackAnalyticsModal;