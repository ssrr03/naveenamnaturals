const axios = require("axios");

const BASE_URL =
  process.env.PROFESSIONAL_COURIER_API_BASE_URL ||
  "https://api.professionalcourier.com/v1";
const AUTH_URL = `${BASE_URL}/auth/login`;
const SERVICEABILITY_URL = `${BASE_URL}/shipping/serviceability`;
const CREATE_ORDER_URL = `${BASE_URL}/shipments/create`;
const GET_LABEL_URL = `${BASE_URL}/shipments/label`;
const CANCEL_ORDER_URL = `${BASE_URL}/shipments/cancel`;
const TRACK_URL = `${BASE_URL}/shipments/track`;
const PICKUP_LOCATIONS_URL = `${BASE_URL}/settings/pickup-locations`;

const PROVIDER_NAME = "professional_courier";
const PROVIDER_LABEL = "Professional Courier";
const BOOKING_STAGE_NOT_CREATED = "not_created";
const BOOKING_STAGE_ORDER_CREATED = "order_created";
const BOOKING_STAGE_BOOKED = "booked";
const DEFAULT_WEIGHT_KG = 0.5;
const PICKUP_CACHE_TTL_MS = 5 * 60 * 1000;

const PROFESSIONAL_COURIER_STATUS_LABELS = {
  1: "Order Created",
  2: "Pickup Scheduled",
  3: "Picked Up",
  4: "In Transit",
  5: "Out for Delivery",
  6: "Delivered",
  7: "Failed Delivery",
  8: "Cancelled",
  9: "Return Initiated",
  10: "Return in Transit",
  11: "Returned",
  12: "Lost",
  13: "Damaged",
};

const CONFIRMED_STATUS_CODES = new Set([1, 2, 3]);
const SHIPPED_STATUS_CODES = new Set([4, 5, 7, 10]);
const CANCELLED_STATUS_CODES = new Set([8, 9]);
const DELIVERED_STATUS_CODES = new Set([6, 11]);

let authToken = null;
let tokenExpiry = null;
let pickupLocationsCache = null;
let pickupCacheTime = null;

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

const buildProfessionalCourierError = (fallbackMessage, error) => {
  const message = error?.response?.data?.message || error?.message || fallbackMessage;
  return new Error(message);
};

const authenticate = async () => {
  try {
    const email = process.env.PROFESSIONAL_COURIER_EMAIL;
    const password = process.env.PROFESSIONAL_COURIER_PASSWORD;

    if (!email || !password) {
      throw new Error(
        "Professional Courier credentials are missing. Set PROFESSIONAL_COURIER_EMAIL and PROFESSIONAL_COURIER_PASSWORD."
      );
    }

    const response = await axios.post(AUTH_URL, { email, password });
    const token = response.data?.token || response.data?.access_token;

    if (!token) {
      throw new Error("Professional Courier authentication did not return a token.");
    }

    authToken = token;
    tokenExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hour expiry
    return token;
  } catch (error) {
    throw buildProfessionalCourierError("Failed to authenticate with Professional Courier.", error);
  }
};

const ensureAuthenticated = async () => {
  if (!authToken || !tokenExpiry || Date.now() > tokenExpiry) {
    await authenticate();
  }
  return authToken;
};

const professionalCourierRequest = async (config, allowRetry = true) => {
  try {
    const token = await ensureAuthenticated();

    const response = await axios({
      ...config,
      headers: {
        ...config.headers,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    return extractResponsePayload(response.data);
  } catch (error) {
    if (allowRetry && error?.response?.status === 401) {
      authToken = null;
      tokenExpiry = null;
      return professionalCourierRequest(config, false);
    }
    throw error;
  }
};

const pickCheapestCourier = (couriers) =>
  couriers.reduce((min, current) => (current.rate < min.rate ? current : min));

const sortCouriersByRate = (couriers = []) =>
  [...couriers].sort((a, b) => toFiniteNumber(a.rate) - toFiniteNumber(b.rate));

const getCourierPreferenceScore = (courier = {}) => {
  let score = 0;
  if (courier.is_preferred) score += 100;
  if (courier.is_cod_supported) score += 50;
  if (courier.is_rtc_supported) score += 25;
  return score;
};

const sortCouriersForAssignment = (couriers = []) =>
  [...couriers]
    .sort((a, b) => {
      const scoreA = getCourierPreferenceScore(a);
      const scoreB = getCourierPreferenceScore(b);
      if (scoreA !== scoreB) return scoreB - scoreA;
      return toFiniteNumber(a.rate) - toFiniteNumber(b.rate);
    })
    .slice(0, 5);

const getPickupLocationId = async (originDetails = {}) => {
  try {
    const configuredLocation = process.env.PROFESSIONAL_COURIER_PICKUP_LOCATION;

    if (!pickupLocationsCache || !pickupCacheTime || Date.now() - pickupCacheTime > PICKUP_CACHE_TTL_MS) {
      const response = await professionalCourierRequest({
        method: "GET",
        url: PICKUP_LOCATIONS_URL,
      });

      pickupLocationsCache = response.locations || response;
      pickupCacheTime = Date.now();
    }

    const locations = Array.isArray(pickupLocationsCache)
      ? pickupLocationsCache
      : pickupLocationsCache?.locations || [];

    if (configuredLocation) {
      const matchedLocation = locations.find(
        (loc) =>
          cleanString(loc.name).toLowerCase() === configuredLocation.toLowerCase() ||
          cleanString(loc.code).toLowerCase() === configuredLocation.toLowerCase()
      );

      if (matchedLocation) {
        return matchedLocation.id || matchedLocation.code;
      }

      const availableLocations = locations.map((loc) => cleanString(loc.name)).join(", ");
      throw new Error(
        `Configured PROFESSIONAL_COURIER_PICKUP_LOCATION "${configuredLocation}" does not match any Professional Courier pickup location. Available locations: ${availableLocations || "none"}`
      );
    }

    const primaryLocation = locations[0];
    if (primaryLocation) {
      return primaryLocation.id || primaryLocation.code;
    }

    throw new Error(
      "No Professional Courier pickup location found. Configure PROFESSIONAL_COURIER_PICKUP_LOCATION or add a pickup location in Professional Courier."
    );
  } catch (error) {
    throw buildProfessionalCourierError("Failed to get pickup location.", error);
  }
};

const normalizeLineItem = (item, index = 0) => ({
  name: cleanString(item.product_name || item.name || `Item ${index + 1}`),
  sku: cleanString(item.sku || item.code || ""),
  units: toNumericField(item.quantity || item.units || 1, 1),
  unit_price: toNumericField(item.price || item.unit_price || 0, 0),
  product_description: cleanString(item.description || ""),
  hsn_code: cleanString(item.hsn_code || ""),
});

const buildOrderItems = (consignmentData = {}) => {
  const items = consignmentData.items || [];
  return Array.isArray(items)
    ? items.map((item, idx) => normalizeLineItem(item, idx))
    : [];
};

const validateOrderPayload = (payload = {}) => {
  const missingFields = [];
  if (!payload.recipient_name) missingFields.push("recipient_name");
  if (!payload.recipient_email) missingFields.push("recipient_email");
  if (!payload.recipient_phone) missingFields.push("recipient_phone");
  if (!payload.recipient_address) missingFields.push("recipient_address");
  if (!payload.recipient_city) missingFields.push("recipient_city");
  if (!payload.recipient_state) missingFields.push("recipient_state");
  if (!payload.recipient_pincode) missingFields.push("recipient_pincode");

  if (missingFields.length > 0) {
    throw new Error(
      `Professional Courier address validation failed. Missing required fields: ${missingFields.join(", ")}`
    );
  }
};

const logOrderAddressPayload = (payload, contextLabel = "Professional Courier order") => {
  const sanitized = {
    ...payload,
    recipient_email: payload.recipient_email ? `***@${payload.recipient_email.split("@")[1]}` : "***",
    recipient_phone: payload.recipient_phone ? `***${payload.recipient_phone.slice(-4)}` : "***",
  };
  console.log(`[${contextLabel}]`, JSON.stringify(sanitized, null, 2));
};

const normalizeTrackingEvent = (event) => ({
  status: event.status || event.state,
  timestamp: event.timestamp || event.date,
  location: event.location || event.city,
  description: event.description || event.remarks,
});

const normalizeShiprocketTracking = (payload, awbNumber) => {
  const trackingData = payload.tracking || payload;
  const events = Array.isArray(trackingData.events) ? trackingData.events : [];

  return {
    awbNumber,
    status: trackingData.status || "Unknown",
    carrier: trackingData.courier_name || "Professional Courier",
    events: events.map(normalizeTrackingEvent),
    delivered: DELIVERED_STATUS_CODES.has(trackingData.status_code),
    cancelled: CANCELLED_STATUS_CODES.has(trackingData.status_code),
  };
};

const mapTrackingToOrderStatus = (trackingData = {}) => {
  const statusCode = toNumericField(trackingData.status_code);
  if (!statusCode) return "processing";

  if (DELIVERED_STATUS_CODES.has(statusCode)) return "delivered";
  if (CANCELLED_STATUS_CODES.has(statusCode)) return "cancelled";
  if (SHIPPED_STATUS_CODES.has(statusCode)) return "shipped";
  return "processing";
};

const checkServiceability = async (origin = {}, destinationPincode = "", consignmentData = {}) => {
  try {
    const weight = sanitizeWeight(consignmentData.weight);
    const amount = toNumericField(consignmentData.amount || consignmentData.order_value || 0, 0);

    const response = await professionalCourierRequest({
      method: "POST",
      url: SERVICEABILITY_URL,
      data: {
        origin_pincode: origin.pincode || "600010",
        destination_pincode: destinationPincode,
        weight: weight,
        cod_amount: amount,
      },
    });

    const couriers = response.couriers || [];
    if (couriers.length === 0) {
      throw new Error("Professional Courier does not service this destination pincode.");
    }

    const cheapest = pickCheapestCourier(couriers);

    return {
      serviceable: true,
      couriers: sortCouriersByRate(couriers),
      recommended_courier: cheapest,
      shipping_cost: cheapest.rate,
      courier_name: cheapest.name,
    };
  } catch (error) {
    throw buildProfessionalCourierError("Failed to check Professional Courier serviceability.", error);
  }
};

const createProviderOrder = async (consignmentData = {}) => {
  try {
    const pickupLocationId = await getPickupLocationId(consignmentData.origin || {});
    const items = buildOrderItems(consignmentData);

    const payload = {
      shipment_reference: consignmentData.order_id || "",
      recipient_name: normalizeAddressLine(consignmentData.recipient_name),
      recipient_email: cleanString(consignmentData.recipient_email),
      recipient_phone: sanitizePhone(consignmentData.recipient_phone),
      recipient_address: normalizeAddressLine(consignmentData.recipient_address),
      recipient_city: cleanString(consignmentData.recipient_city),
      recipient_state: cleanString(consignmentData.recipient_state),
      recipient_pincode: cleanString(consignmentData.recipient_pincode),
      weight: sanitizeWeight(consignmentData.weight),
      order_value: toNumericField(consignmentData.order_value, 0),
      shipping_charges: toNumericField(consignmentData.shipping_charges, 0),
      items: items,
      pickup_location_id: pickupLocationId,
      notes: cleanString(consignmentData.notes || ""),
    };

    validateOrderPayload(payload);
    logOrderAddressPayload(payload, "Professional Courier createProviderOrder");

    const response = await professionalCourierRequest({
      method: "POST",
      url: CREATE_ORDER_URL,
      data: payload,
    });

    const shipmentId = response.shipment_id || response.id;
    if (!shipmentId) {
      throw new Error("Professional Courier order was created without a shipment ID.");
    }

    return {
      success: true,
      shipmentId,
      orderId: response.order_id,
      status: "order_created",
      latestStatusLabel: "Professional Courier Order Created",
      trackingUrl: response.tracking_url || "",
    };
  } catch (error) {
    throw buildProfessionalCourierError("Failed to create Professional Courier order.", error);
  }
};

const bookProviderShipment = async (consignmentData = {}) => {
  try {
    const shipmentId = consignmentData.shipment_id || consignmentData.id;
    if (!shipmentId) {
      throw new Error("Professional Courier shipment ID is required before booking.");
    }

    const response = await professionalCourierRequest({
      method: "POST",
      url: `${CREATE_ORDER_URL}/${shipmentId}/confirm`,
      data: {
        is_cod: consignmentData.payment_method === "cod" || false,
      },
    });

    return {
      success: true,
      shipmentId,
      awbNumber: response.awb_number || response.tracking_number,
      courierName: response.courier_name,
      status: "booked",
      latestStatusLabel: PROFESSIONAL_COURIER_STATUS_LABELS[2] || "Pickup Scheduled",
    };
  } catch (error) {
    throw buildProfessionalCourierError("Failed to book Professional Courier shipment.", error);
  }
};

const createShipment = async (consignmentData = {}) =>
  bookProviderShipment(consignmentData);

const getShippingLabel = async (shipmentId) => {
  try {
    if (!shipmentId) {
      throw new Error("Shipment ID is required to generate a label.");
    }

    const response = await professionalCourierRequest({
      method: "GET",
      url: `${GET_LABEL_URL}/${shipmentId}`,
      responseType: "arraybuffer",
    });

    if (!response) {
      throw new Error("Professional Courier did not return a label.");
    }

    return response;
  } catch (error) {
    throw buildProfessionalCourierError("Failed to fetch Professional Courier shipping label.", error);
  }
};

const cancelOrders = async (orderIds = []) => {
  try {
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      throw new Error("At least one Professional Courier order id is required.");
    }

    const response = await professionalCourierRequest({
      method: "POST",
      url: `${CANCEL_ORDER_URL}/batch`,
      data: {
        shipment_ids: orderIds,
      },
    });

    return {
      success: true,
      cancelled_count: response.cancelled_count || orderIds.length,
      failed_count: response.failed_count || 0,
    };
  } catch (error) {
    throw buildProfessionalCourierError("Failed to cancel Professional Courier order.", error);
  }
};

const trackShipment = async (awbNumber) => {
  try {
    if (!awbNumber) {
      throw new Error("AWB Number is required for tracking.");
    }

    const response = await professionalCourierRequest({
      method: "GET",
      url: `${TRACK_URL}/${awbNumber}`,
    });

    return normalizeShiprocketTracking(response, awbNumber);
  } catch (error) {
    if (error.response?.status === 404) {
      return {
        awbNumber,
        status: "unknown",
        carrier: "Professional Courier",
        events: [],
        delivered: false,
        cancelled: false,
        latestStatusLabel: PROFESSIONAL_COURIER_STATUS_LABELS[1] || "Order Created",
      };
    }
    throw buildProfessionalCourierError("Failed to fetch Professional Courier tracking details.", error);
  }
};

module.exports = {
  PROVIDER_NAME,
  PROVIDER_LABEL,
  BOOKING_STAGE_NOT_CREATED,
  BOOKING_STAGE_ORDER_CREATED,
  BOOKING_STAGE_BOOKED,
  PROFESSIONAL_COURIER_STATUS_LABELS,
  mapTrackingToOrderStatus,
  checkServiceability,
  createProviderOrder,
  bookProviderShipment,
  createShipment,
  getShippingLabel,
  cancelOrders,
  trackShipment,
};
