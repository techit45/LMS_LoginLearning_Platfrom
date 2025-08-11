import React, { useState, useEffect } from 'react';
import { calcomService } from '../lib/calcomService';

/**
 * Cal.com API Test Component
 * Tests Cal.com API connection and displays service status
 */
const CalComTestComponent = () => {
  const [connectionStatus, setConnectionStatus] = useState('testing');
  const [userInfo, setUserInfo] = useState(null);
  const [error, setError] = useState(null);
  const [eventTypes, setEventTypes] = useState([]);
  const [testResults, setTestResults] = useState({});

  useEffect(() => {
    testCalComConnection();
  }, []);

  const testCalComConnection = async () => {
    try {
      setConnectionStatus('testing');
      setError(null);
      
      console.log('🧪 Starting Cal.com API test...');
      
      // Test 1: Basic connection
      const connectionResult = await calcomService.testConnection();
      console.log('Connection result:', connectionResult);
      
      setTestResults(prev => ({
        ...prev,
        connection: connectionResult
      }));
      
      if (connectionResult.success) {
        setConnectionStatus('connected');
        setUserInfo(connectionResult.data);
        
        // Test 2: Get event types
        try {
          const eventTypesResult = await calcomService.api.getEventTypes();
          console.log('Event types result:', eventTypesResult);
          
          setTestResults(prev => ({
            ...prev,
            eventTypes: eventTypesResult
          }));
          
          if (eventTypesResult.data?.eventTypes) {
            setEventTypes(eventTypesResult.data.eventTypes);
          }
        } catch (eventTypeError) {
          console.error('Event types test failed:', eventTypeError);
          setTestResults(prev => ({
            ...prev,
            eventTypes: { error: eventTypeError.message }
          }));
        }
        
      } else {
        setConnectionStatus('failed');
        setError(connectionResult.error);
      }
    } catch (err) {
      console.error('Cal.com test failed:', err);
      setConnectionStatus('failed');
      setError(err.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'testing': return 'text-yellow-600 bg-yellow-100';
      case 'connected': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'testing': return '⏳';
      case 'connected': return '✅';
      case 'failed': return '❌';
      default: return '⚪';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4">
          <h2 className="text-xl font-bold text-white">
            🔗 Cal.com API Integration Test
          </h2>
          <p className="text-blue-100 mt-1">
            Testing connection to Cal.com scheduling service
          </p>
        </div>

        {/* Connection Status */}
        <div className="p-6 border-b">
          <div className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium ${getStatusColor(connectionStatus)}`}>
            <span className="mr-2">{getStatusIcon(connectionStatus)}</span>
            Connection Status: {connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}
          </div>
          
          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">
                <strong>Error:</strong> {error}
              </p>
            </div>
          )}
        </div>

        {/* User Information */}
        {userInfo && (
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold mb-3">👤 Cal.com Account Info</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Username</label>
                <p className="text-gray-900">{userInfo.username || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="text-gray-900">{userInfo.email || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <p className="text-gray-900">{userInfo.name || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Plan</label>
                <p className="text-gray-900">{userInfo.plan || 'Free'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Event Types */}
        {eventTypes.length > 0 && (
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold mb-3">📅 Existing Event Types</h3>
            <div className="space-y-2">
              {eventTypes.map((eventType, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div>
                    <h4 className="font-medium text-gray-900">{eventType.title}</h4>
                    <p className="text-sm text-gray-600">{eventType.length} minutes</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Slug: {eventType.slug}</p>
                    <p className="text-sm text-gray-500">ID: {eventType.id}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Test Results */}
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-3">🧪 Detailed Test Results</h3>
          <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-x-auto">
            {JSON.stringify(testResults, null, 2)}
          </pre>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t">
          <button
            onClick={testCalComConnection}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md font-medium transition-colors"
            disabled={connectionStatus === 'testing'}
          >
            {connectionStatus === 'testing' ? '⏳ Testing...' : '🔄 Retest Connection'}
          </button>
          
          {connectionStatus === 'connected' && (
            <div className="mt-3 text-sm text-green-600">
              ✅ Cal.com API is ready for integration with teaching schedules
            </div>
          )}
        </div>
      </div>

      {/* Integration Status */}
      <div className="mt-6 bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-3">🔄 Integration Status</h3>
        <div className="space-y-2">
          <div className="flex items-center">
            <span className="w-4 h-4 bg-green-500 rounded-full mr-3"></span>
            <span>Cal.com API service created</span>
          </div>
          <div className="flex items-center">
            <span className="w-4 h-4 bg-yellow-500 rounded-full mr-3"></span>
            <span>API connection testing</span>
          </div>
          <div className="flex items-center">
            <span className="w-4 h-4 bg-gray-400 rounded-full mr-3"></span>
            <span>Event types creation (pending)</span>
          </div>
          <div className="flex items-center">
            <span className="w-4 h-4 bg-gray-400 rounded-full mr-3"></span>
            <span>Drag & drop integration (pending)</span>
          </div>
          <div className="flex items-center">
            <span className="w-4 h-4 bg-gray-400 rounded-full mr-3"></span>
            <span>Real-time sync with existing system (pending)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalComTestComponent;