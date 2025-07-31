import React from 'react';
import { Car, LogIn, LogOut } from 'lucide-react';

const Header = ({ activeTab, setActiveTab, isAuthenticated, handleLogin, handleLogout }) => {
    return (
        <header className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center space-x-2">
                        <Car className="w-8 h-8 text-blue-600" />
                        <h1 className="text-xl font-bold text-gray-900">Dalscooter</h1>
                    </div>

                    <nav className="flex space-x-8">
                        <button
                            onClick={() => setActiveTab('browse')}
                            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'browse' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Browse Vehicles
                        </button>

                        {isAuthenticated && (
                            <>
                                <button
                                    onClick={() => setActiveTab('reservations')}
                                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'reservations' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    My Reservations
                                </button>
                                <button
                                    onClick={() => setActiveTab('feedback')}
                                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'feedback' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Feedback
                                </button>
                            </>
                        )}

                        {isAuthenticated ? (
                            <button
                                onClick={handleLogout}
                                className="px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 flex items-center space-x-2"
                            >
                                <LogOut className="w-4 h-4" />
                                <span>Sign Out</span>
                            </button>
                        ) : (
                            <button
                                onClick={handleLogin}
                                className="px-3 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
                            >
                                <LogIn className="w-4 h-4" />
                                <span>Sign In</span>
                            </button>
                        )}
                    </nav>
                </div>
            </div>
        </header>
    );
};

export default Header;