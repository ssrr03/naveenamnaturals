const axios = require("axios");

const BASE_URL =
  process.env.TPC_GLOBE_API_BASE_URL ||
  "https://api-sandbox.tpcglobe.com/v1";

const SERVICEABILITY_URL = `${BASE_URL}/serviceability`;
const CREATE_SHIPMENT_URL = `${BASE_URL}/shipments`;
const TRACK_URL = `${BASE_URL}/tracking`;
const CANCEL_SHIPMENT_URL = `${BASE_URL}/shipments`;
const GET_LABEL_URL = `${BASE_URL}/labels`;

const PROVIDER_NAME = "tpc_globe";
const PROVIDER_LABEL = "TPC Globe";
const BOOKING_STAGE_NOT_CREATED = "not_created";
const BOOKING_STAGE_ORDER_CREATED = "order_created";
const BOOKING_STAGE_BOOKED = "booked";
const DEFAULT_WEIGHT_KG = 0.5;

// TPC Globe Status Codes from tracking response
const TPC_GLOBE_STATUS_LABELS = {
  "Manifested / Booked": "Order Created",
  "Pickup Scheduled": "Pickup Scheduled",
  "Picked Up": "Picked Up",
  "Received at Facility": "In Transit",
  "In Transit": "In Transit",
  "Out for Delivery": "Out for Delivery",
  "Delivered": "Delivered",
  "Failed Delivery": "Failed Delivery",
  "Return Initiated": "Return Initiated",
  "Returned": "Returned",
};

const CONFIRMED_STATUS_CODES = new Set([
  "Manifested / Booked",
  "Pickup Scheduled",
  "Picked Up",
]);
const SHIPPED_STATUS_CODES = new Set([
  "Received at Facility",
  "In Transit",
  "Out for Delivery",
  "Failed Delivery",
]);
const CANCELLED_STATUS_CODES = new Set(["Cancelled"]);
const DELIVERED_STATUS_CODES = new Set(["Delivered", "Returned"]);

let apiKey = null;

const toFiniteNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const cleanString = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const normalizeAddressLine = (value, fallback = "") => {
  const cleaned = cleanString(value);
  return cleaned || fallback;
};

const compactString = (value, fallback = "") => {
  const cleaned = cleanString(value);
  return cleaned ? `${cleaned}` : fallback;
};

const sanitizePhone = (value, fallback = "0000000000") => {
  const cleaned = cleanString(value).replace(/\D/g, "");
  return cleaned && cleaned.length >= 10 ? cleaned.slice(-10) : fallback;
};

const toNumericField = (value, fallback = null) => {
  const num = toFiniteNumber(value);
  return num !== null ? num : fallback;
};

const sanitizeWeight = (value, fallback = DEFAULT_WEIGHT_KG) => {
  const num = toFiniteNumber(value);
  return num && num > 0 ? num : fallback;
};

const formatOrderDate = (input = new Date()) => {
  const date = input instanceof Date ? input : new Date(input);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const extractResponsePayload = (payload) => payload?.data || payload || {};

const normalizeOrderId = (value) => compactString(value, "");

const buildTPCGlobeError = (fallbackMessage, error) => {
  const message = error?.response?.data?.message || error?.message || fallbackMessage;
  return new Error(message);
};

const ensureAuthenticated = async () => {
  try {
    apiKey = process.env.TPC_GLOBE_API_KEY;

    if (!apiKey) {
      throw new Error(
        "TPC Globe API Key is missing. Set TPC_GLOBE_API_KEY in environment variables."
      );
    }

    return apiKey;
  } catch (error) {
    throw buildTPCGlobeError("Failed to authenticate with TPC Globe.", error);
  }
};

const tpcGlobeRequest = async (config, allowRetry = true) => {
  try {
    const token = await ensureAuthenticated();

    const fullConfig = {
      ...config,
      headers: {
        ...config.headers,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };

    console.log("TPC Globe Request:", {
      url: fullConfig.url,
      method: fullConfig.method,
      params: fullConfig.params,
      hasBody: !!fullConfig.data,
    });

    const response = await axios(fullConfig);

    // TPC Globe API might return data directly without a success field
    // Check if response.data exists and is an object
    const responseData = response.data;
    
    console.log("TPC Globe Response:", {
      status: response.status,
      hasData: !!responseData,
      dataType: typeof responseData,
      dataKeys: responseData ? Object.keys(responseData).slice(0, 5) : [],
    });

    return extractResponsePayload(responseData);
  } catch (error) {
    console.error("TPC Globe Request Error:", {
      url: config.url,
      method: config.method,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      message: error?.message,
      data: error?.response?.data,
    });

    if (allowRetry && error?.response?.status === 401) {
      apiKey = null;
      return tpcGlobeRequest(config, false);
    }
    throw error;
  }
};

const checkServiceability = async (origin = {}, destinationPincode = "", consignmentData = {}) => {
  try {
    const weight = sanitizeWeight(consignmentData.weight);

    const requestConfig = {
      method: "GET",
      url: SERVICEABILITY_URL,
      params: {
        origin_pin: origin.pincode || "600010",
        dest_pin: destinationPincode,
        order_weight: weight,
      },
    };

    console.log("Checking TPC Globe Serviceability:", requestConfig);

    const response = await tpcGlobeRequest(requestConfig);

    console.log("TPC Serviceability Response:", response);

    // Handle different response formats - the response might be the data directly
    const serviceabilityData = response.data || response;
    
    if (!serviceabilityData?.serviceable) {
      console.warn("Service not available:", serviceabilityData);
      throw new Error("TPC Globe does not service this destination pincode.");
    }

    return {
      serviceable: true,
      edd: serviceabilityData?.edd,
      available_services: serviceabilityData?.available_services || ["PRO_PREMIUM"],
      recommended_service: process.env.TPC_GLOBE_SERVICE_TYPE || "PRO_PREMIUM",
      tpcApiDetails: {
        baseUrl: BASE_URL,
        endpoint: "/serviceability",
        method: "GET",
        params: requestConfig.params,
      },
    };
  } catch (error) {
    console.error("TPC Globe Serviceability Check Failed:", error.message);
    const err = buildTPCGlobeError("Failed to check TPC Globe serviceability.", error);
    err.tpcApiDetails = {
      baseUrl: BASE_URL,
      endpoint: "/serviceability",
      method: "GET",
      params: {
        origin_pin: origin.pincode || "600010",
        dest_pin: destinationPincode,
        order_weight: sanitizeWeight(consignmentData.weight),
      },
      error: error?.response?.status ? `HTTP ${error.response.status}: ${error.response.statusText || error.message}` : error?.message,
    };
    throw err;
  }
};

const createShipment = async (consignmentData = {}) => {
  try {
    const serviceType = process.env.TPC_GLOBE_SERVICE_TYPE || "PRO_PREMIUM";
    const paymentMode = process.env.TPC_GLOBE_PAYMENT_MODE || "PREPAID";

    const payload = {
      order_id: normalizeOrderId(consignmentData.order_id),
      service_type: serviceType,
      payment_mode: paymentMode,
      shipper: {
        name: "Naveen AM Naturals",
        phone: sanitizePhone(consignmentData.origin?.phone || "9000000000"),
        address: normalizeAddressLine(consignmentData.origin?.address || ""),
        city: cleanString(consignmentData.origin?.city || "Chennai"),
        pin: cleanString(consignmentData.origin?.pincode || "600010"),
      },
      consignee: {
        name: normalizeAddressLine(consignmentData.recipient_name),
        phone: sanitizePhone(consignmentData.recipient_phone),
        address: normalizeAddressLine(consignmentData.recipient_address),
        city: cleanString(consignmentData.recipient_city),
        pin: cleanString(consignmentData.recipient_pincode),
      },
      parcel: {
        weight_kg: sanitizeWeight(consignmentData.weight),
        length_cm: toNumericField(consignmentData.length, 20),
        width_cm: toNumericField(consignmentData.width, 15),
        height_cm: toNumericField(consignmentData.height, 10),
        content_desc: cleanString(consignmentData.content_description || "Electronics"),
      },
    };

    console.log("[TPC Globe Create Shipment]", JSON.stringify(payload, null, 2));

    const response = await tpcGlobeRequest({
      method: "POST",
      url: CREATE_SHIPMENT_URL,
      data: payload,
    });

    const awbNumber = response.data?.awb_number;
    if (!awbNumber) {
      throw new Error("TPC Globe shipment was created without an AWB number.");
    }

    return {
      success: true,
      awbNumber,
      shipmentId: awbNumber,
      orderId: response.data?.order_id,
      routingCode: response.data?.routing_code,
      labelUrl: response.data?.label_url,
      status: "booked",
      latestStatusLabel: "TPC Globe Shipment Booked",
    };
  } catch (error) {
    throw buildTPCGlobeError("Failed to create TPC Globe shipment.", error);
  }
};

const trackShipment = async (awbNumber) => {
  try {
    const response = await tpcGlobeRequest({
      method: "GET",
      url: `${TRACK_URL}/${awbNumber}`,
    });

    const scans = response.data?.scans || [];
    const currentStatus = response.data?.current_status || "IN_TRANSIT";

    // Map TPC Globe tracking data to normalized format
    const events = scans.map((scan) => ({
      timestamp: scan.timestamp,
      location: scan.location,
      status: scan.status,
      remarks: scan.remarks,
    }));

    return {
      awbNumber,
      status: currentStatus,
      carrier: PROVIDER_LABEL,
      events,
      delivered: DELIVERED_STATUS_CODES.has(currentStatus),
      cancelled: CANCELLED_STATUS_CODES.has(currentStatus),
    };
  } catch (error) {
    throw buildTPCGlobeError("Failed to track TPC Globe shipment.", error);
  }
};

const cancelShipment = async (awbNumber) => {
  try {
    const response = await tpcGlobeRequest({
      method: "POST",
      url: `${CANCEL_SHIPMENT_URL}/${awbNumber}/cancel`,
      data: {},
    });

    return {
      success: true,
      awbNumber,
      message: response.message || "TPC Globe shipment cancelled successfully",
    };
  } catch (error) {
    throw buildTPCGlobeError("Failed to cancel TPC Globe shipment.", error);
  }
};

const getShippingLabel = async (awbNumber) => {
  try {
    const response = await tpcGlobeRequest({
      method: "GET",
      url: `${GET_LABEL_URL}/${awbNumber}`,
      responseType: "arraybuffer",
    });

    return response;
  } catch (error) {
    throw buildTPCGlobeError("Failed to get TPC Globe shipping label.", error);
  }
};

const buildOriginDetails = () => {
  return {
    name: "Naveen AM Naturals",
    address: cleanString(process.env.WAREHOUSE_ADDRESS || ""),
    city: cleanString(process.env.WAREHOUSE_CITY || "Chennai"),
    state: cleanString(process.env.WAREHOUSE_STATE || "Tamil Nadu"),
    pincode: cleanString(process.env.WAREHOUSE_PINCODE || "600010"),
    phone: "9000000000",
  };
};

const buildOrderItemsPayload = (consignmentData = {}) => {
  const items = consignmentData.items || [];
  return Array.isArray(items)
    ? items.map((item) => ({
        name: cleanString(item.product_name || item.name || ""),
        sku: cleanString(item.sku || ""),
        units: toNumericField(item.quantity || 1, 1),
        unit_price: toNumericField(item.price || 0, 0),
        product_description: cleanString(item.description || ""),
      }))
    : [];
};

const buildShippingStateUpdateData = (providerResponse, overrides = {}) => {
  return {
    provider: PROVIDER_NAME,
    providerOrderId: providerResponse.orderId || overrides.providerOrderId || null,
    shipmentId: providerResponse.awbNumber || overrides.shipmentId || null,
    latestStatus: providerResponse.status || BOOKING_STAGE_BOOKED,
    latestStatusLabel:
      overrides.latestStatusLabel || TPC_GLOBE_STATUS_LABELS[providerResponse.status] || "TPC Globe Shipment Booked",
    shippingBookingStage: BOOKING_STAGE_BOOKED,
  };
};

module.exports = {
  PROVIDER_NAME,
  PROVIDER_LABEL,
  BOOKING_STAGE_NOT_CREATED,
  BOOKING_STAGE_ORDER_CREATED,
  BOOKING_STAGE_BOOKED,
  DEFAULT_WEIGHT_KG,
  TPC_GLOBE_STATUS_LABELS,
  CONFIRMED_STATUS_CODES,
  SHIPPED_STATUS_CODES,
  CANCELLED_STATUS_CODES,
  DELIVERED_STATUS_CODES,
  checkServiceability,
  createShipment,
  trackShipment,
  cancelShipment,
  getShippingLabel,
  buildOriginDetails,
  buildOrderItemsPayload,
  buildShippingStateUpdateData,
};
