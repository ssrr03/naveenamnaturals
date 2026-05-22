"use client";

import React, { useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";

interface TestResult {
  endpoint: string;
  method: string;
  status: number | null;
  success: boolean;
  data: any;
  error: string | null;
  timestamp: string;
  requestDetails?: {
    url: string;
    headers: Record<string, string>;
    body?: any;
    params?: any;
  };
  responseHeaders?: Record<string, string>;
  tpcApiDetails?: {
    baseUrl: string;
    endpoint: string;
    method: string;
    params?: any;
    error?: any;
    headers?: Record<string, string>;
  };
}

const ShippingTestPage = () => {
  const { token } = useAuth();
  const router = useRouter();
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [destPincode, setDestPincode] = useState("641666");
  const [originPincode, setOriginPincode] = useState("600010");
  const [weight, setWeight] = useState("0.5");
  const [cod, setCod] = useState(false);
  const [declaredValue, setDeclaredValue] = useState("1000");
  const [orderId, setOrderId] = useState("ORD-001");
  const [awbNumber, setAwbNumber] = useState("");

  const API_BASE_URL = "http://localhost:5005/api";

  const runTest = async (
    endpoint: string,
    method: string = "POST",
    body: any = null,
    requiresAuth: boolean = false
  ) => {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (requiresAuth && token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      const result: TestResult = {
        endpoint,
        method,
        status: response.status,
        success: response.ok,
        data,
        error: !response.ok ? data.message || "Request failed" : null,
        timestamp: new Date().toLocaleTimeString(),
      };

      setResults((prev) => [result, ...prev]);
      return result;
    } catch (error: any) {
      const result: TestResult = {
        endpoint,
        method,
        status: null,
        success: false,
        data: null,
        error: error.message,
        timestamp: new Date().toLocaleTimeString(),
      };

      setResults((prev) => [result, ...prev]);
      return result;
    }
  };

  const testCheckServiceability = async () => {
    setLoading(true);
    const requestBody = {
      originPincode,
      destPincode,
      weight: parseFloat(weight),
      cod,
      declaredValue: parseFloat(declaredValue),
    };

    try {
      const response = await fetch(`${API_BASE_URL}/shipping/check-pincode`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      const result: TestResult = {
        endpoint: "/shipping/check-pincode",
        method: "POST",
        status: response.status,
        success: response.ok,
        data,
        error: !response.ok ? data.message || "Request failed" : null,
        timestamp: new Date().toLocaleTimeString(),
        requestDetails: {
          url: `${API_BASE_URL}/shipping/check-pincode`,
          headers: { "Content-Type": "application/json" },
          body: requestBody,
        },
        tpcApiDetails: data.tpcApiDetails,
      };

      setResults((prev) => [result, ...prev]);

      if (result.success) {
        toast.success("✅ Check Serviceability - Success");
      } else {
        toast.error(`❌ Check Serviceability - ${result.error}`);
      }
    } catch (error: any) {
      const result: TestResult = {
        endpoint: "/shipping/check-pincode",
        method: "POST",
        status: null,
        success: false,
        data: null,
        error: error.message,
        timestamp: new Date().toLocaleTimeString(),
        requestDetails: {
          url: `${API_BASE_URL}/shipping/check-pincode`,
          headers: { "Content-Type": "application/json" },
          body: requestBody,
        },
      };
      setResults((prev) => [result, ...prev]);
      toast.error(`❌ Check Serviceability - ${error.message}`);
    }
    setLoading(false);
  };

  const testDebugInfo = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/shipping/debug`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      const result: TestResult = {
        endpoint: "/shipping/debug",
        method: "GET",
        status: response.status,
        success: response.ok,
        data,
        error: !response.ok ? data.message || "Request failed" : null,
        timestamp: new Date().toLocaleTimeString(),
        requestDetails: {
          url: `${API_BASE_URL}/shipping/debug`,
          headers: { "Content-Type": "application/json" },
        },
      };

      setResults((prev) => [result, ...prev]);

      if (result.success) {
        toast.success("✅ Debug Info Retrieved");
      } else {
        toast.error(`❌ Debug Info Failed - ${result.error}`);
      }
    } catch (error: any) {
      const result: TestResult = {
        endpoint: "/shipping/debug",
        method: "GET",
        status: null,
        success: false,
        data: null,
        error: error.message,
        timestamp: new Date().toLocaleTimeString(),
        requestDetails: {
          url: `${API_BASE_URL}/shipping/debug`,
          headers: { "Content-Type": "application/json" },
        },
      };
      setResults((prev) => [result, ...prev]);
      toast.error(`❌ Debug Info - ${error.message}`);
    }
    setLoading(false);
  };

  const testCreateShipment = async () => {
    setLoading(true);
    const result = await runTest(
      "/shipping/create-shipment",
      "POST",
      {
        order_id: orderId,
        destination_details: {
          name: "Test Customer",
          phone: "9876543210",
          address_line_1: "123 Test Street",
          city: "Chennai",
          state: "Tamil Nadu",
          pincode: destPincode,
          country: "India",
          email: "test@example.com",
        },
      },
      true
    );

    if (result.success) {
      toast.success("✅ Create Shipment - Success");
    } else {
      toast.error(`❌ Create Shipment - ${result.error}`);
    }
    setLoading(false);
  };

  const testTrackShipment = async () => {
    if (!awbNumber.trim()) {
      toast.error("Please enter AWB number");
      return;
    }

    setLoading(true);
    const result = await runTest(
      `/shipping/track-shipment?awbNumber=${awbNumber}`,
      "GET"
    );

    if (result.success) {
      toast.success("✅ Track Shipment - Success");
    } else {
      toast.error(`❌ Track Shipment - ${result.error}`);
    }
    setLoading(false);
  };

  const testGetShippingLabel = async () => {
    if (!awbNumber.trim()) {
      toast.error("Please enter AWB number");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/shipping/label?referenceNumber=${awbNumber}`,
        {
          method: "GET",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      const result: TestResult = {
        endpoint: `/shipping/label?referenceNumber=${awbNumber}`,
        method: "GET",
        status: response.status,
        success: response.ok,
        data: response.ok ? "PDF received" : await response.json(),
        error: !response.ok ? "Failed to get label" : null,
        timestamp: new Date().toLocaleTimeString(),
      };

      setResults((prev) => [result, ...prev]);

      if (result.success) {
        toast.success("✅ Get Shipping Label - Success");
      } else {
        toast.error(`❌ Get Shipping Label - ${result.error}`);
      }
    } catch (error: any) {
      const result: TestResult = {
        endpoint: `/shipping/label?referenceNumber=${awbNumber}`,
        method: "GET",
        status: null,
        success: false,
        data: null,
        error: error.message,
        timestamp: new Date().toLocaleTimeString(),
      };
      setResults((prev) => [result, ...prev]);
      toast.error(`❌ Get Shipping Label - ${error.message}`);
    }
    setLoading(false);
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-primary hover:text-primary/80"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Shipping Portal Test</h1>
          <p className="text-sm text-muted-foreground">
            Test various shipping API endpoints
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Test Controls */}
        <div className="lg:col-span-1 space-y-6">
          {/* Check Serviceability */}
          <div className="bg-card border border-border rounded-lg p-5">
            <h2 className="font-semibold text-foreground mb-4">
              Check Serviceability
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Origin Pincode
                </label>
                <input
                  type="text"
                  value={originPincode}
                  onChange={(e) => setOriginPincode(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Destination Pincode
                </label>
                <input
                  type="text"
                  value={destPincode}
                  onChange={(e) => setDestPincode(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Declared Value (₹)
                </label>
                <input
                  type="number"
                  value={declaredValue}
                  onChange={(e) => setDeclaredValue(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  disabled={loading}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="cod"
                  checked={cod}
                  onChange={(e) => setCod(e.target.checked)}
                  disabled={loading}
                  className="w-4 h-4"
                />
                <label
                  htmlFor="cod"
                  className="text-xs font-medium text-muted-foreground"
                >
                  COD (Cash on Delivery)
                </label>
              </div>

              <button
                onClick={testCheckServiceability}
                disabled={loading}
                className="w-full px-4 py-2 bg-primary text-white rounded-md font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Testing..." : "Test Check Pincode"}
              </button>

              <button
                onClick={testDebugInfo}
                disabled={loading}
                className="w-full px-4 py-2 bg-orange-600 text-white rounded-md font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Loading..." : "View Debug Info"}
              </button>
            </div>
          </div>

          {/* Create Shipment */}
          <div className="bg-card border border-border rounded-lg p-5">
            <h2 className="font-semibold text-foreground mb-4">Create Shipment</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Order ID
                </label>
                <input
                  type="text"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  disabled={loading}
                />
              </div>

              <button
                onClick={testCreateShipment}
                disabled={loading}
                className="w-full px-4 py-2 bg-primary text-white rounded-md font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Testing..." : "Test Create Shipment"}
              </button>
            </div>
          </div>

          {/* Track & Label */}
          <div className="bg-card border border-border rounded-lg p-5">
            <h2 className="font-semibold text-foreground mb-4">Track & Label</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  AWB Number
                </label>
                <input
                  type="text"
                  value={awbNumber}
                  onChange={(e) => setAwbNumber(e.target.value)}
                  placeholder="e.g., TPC12345678"
                  className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  disabled={loading}
                />
              </div>

              <button
                onClick={testTrackShipment}
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Testing..." : "Test Track Shipment"}
              </button>

              <button
                onClick={testGetShippingLabel}
                disabled={loading}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Testing..." : "Test Get Label"}
              </button>
            </div>
          </div>

          {/* Clear Results */}
          {results.length > 0 && (
            <button
              onClick={clearResults}
              className="w-full px-4 py-2 bg-destructive/10 text-destructive rounded-md font-medium hover:bg-destructive/20 transition-colors"
            >
              Clear Results
            </button>
          )}
        </div>

        {/* Results */}
        <div className="lg:col-span-2">
          <div className="bg-card border border-border rounded-lg p-5">
            <h2 className="font-semibold text-foreground mb-4">
              Test Results ({results.length})
            </h2>

            <div className="space-y-3 max-h-[800px] overflow-y-auto">
              {results.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No test results yet. Run a test to see results.
                </p>
              ) : (
                results.map((result, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 ${
                      result.success
                        ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800"
                        : "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                              result.success
                                ? "bg-green-500 text-white"
                                : "bg-red-500 text-white"
                            }`}
                          >
                            {result.status || "ERR"}
                          </span>
                          <code className="text-sm font-mono font-semibold">
                            {result.method} {result.endpoint}
                          </code>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {result.timestamp}
                      </span>
                    </div>

                    {result.requestDetails && (
                      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded p-2 mb-2 text-xs">
                        <p className="font-semibold text-blue-700 dark:text-blue-400 mb-1">
                          📤 Request Details:
                        </p>
                        <div className="space-y-1 text-blue-600 dark:text-blue-300 break-words">
                          <div>
                            <strong>URL:</strong> {result.requestDetails.url}
                          </div>
                          <div>
                            <strong>Method:</strong> {result.requestDetails.headers["Content-Type"]}
                          </div>
                          {result.requestDetails.body && (
                            <div>
                              <strong>Body:</strong>
                              <pre className="bg-blue-100 dark:bg-blue-900 px-1 rounded mt-1 text-xs overflow-x-auto">
                                {JSON.stringify(result.requestDetails.body, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {result.tpcApiDetails && (
                      <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded p-2 text-xs mb-2">
                        <p className="font-semibold text-purple-700 dark:text-purple-400 mb-1">
                          🔌 TPC Globe API Details:
                        </p>
                        <div className="space-y-1 text-purple-600 dark:text-purple-300 break-words">
                          <div>
                            <strong>Base URL:</strong>{" "}
                            <code className="bg-purple-100 dark:bg-purple-900 px-1 rounded">
                              {result.tpcApiDetails.baseUrl}
                            </code>
                          </div>
                          <div>
                            <strong>Endpoint:</strong>{" "}
                            <code className="bg-purple-100 dark:bg-purple-900 px-1 rounded">
                              {result.tpcApiDetails.endpoint}
                            </code>
                          </div>
                          <div>
                            <strong>Method:</strong>{" "}
                            <code className="bg-purple-100 dark:bg-purple-900 px-1 rounded">
                              {result.tpcApiDetails.method}
                            </code>
                          </div>
                          {result.tpcApiDetails.params && (
                            <div>
                              <strong>Params:</strong>
                              <pre className="bg-purple-100 dark:bg-purple-900 px-1 rounded mt-1 text-xs overflow-x-auto">
                                {JSON.stringify(result.tpcApiDetails.params, null, 2)}
                              </pre>
                            </div>
                          )}
                          {result.tpcApiDetails.error && (
                            <div className="text-red-600 dark:text-red-400 mt-1">
                              <strong>API Error:</strong> {result.tpcApiDetails.error}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {result.error && (
                      <div className="bg-white/50 dark:bg-black/20 rounded p-2 mb-2 text-xs">
                        <p className="font-semibold text-red-700 dark:text-red-400 mb-1">
                          Error:
                        </p>
                        <p className="text-red-600 dark:text-red-300 break-words">
                          {result.error}
                        </p>
                      </div>
                    )}

                    {result.data && (
                      <div className="bg-white/50 dark:bg-black/20 rounded p-2 text-xs">
                        <p className="font-semibold text-foreground mb-1">Response:</p>
                        <pre className="text-xs overflow-x-auto text-muted-foreground break-words whitespace-pre-wrap">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShippingTestPage;
