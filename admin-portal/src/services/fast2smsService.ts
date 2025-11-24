/**
 * Fast2SMS API Service
 * Documentation: https://www.fast2sms.com/dev/quickstart
 */

export interface Fast2SMSResponse {
  return: boolean;
  request_id: string;
  message: string[];
}

export interface Fast2SMSError {
  return: boolean;
  request_id?: string;
  message: string[];
}

/**
 * Send SMS via Fast2SMS API
 * @param apiKey - Fast2SMS API key
 * @param message - Message text to send
 * @param numbers - Array of phone numbers (10 digits, without country code)
 * @returns Promise with response
 */
export async function sendSMS(
  apiKey: string,
  message: string,
  numbers: string[]
): Promise<Fast2SMSResponse> {
  if (!apiKey) {
    throw new Error("Fast2SMS API key is required");
  }

  if (!message || message.trim().length === 0) {
    throw new Error("Message cannot be empty");
  }

  if (!numbers || numbers.length === 0) {
    throw new Error("At least one phone number is required");
  }

  // Clean phone numbers: remove +91, spaces, and ensure 10 digits
  const cleanNumbers = numbers
    .map((num) => {
      // Remove +91, spaces, dashes, and other non-digits
      let cleaned = num.replace(/[\s+\-()]/g, "").replace(/^91/, "");
      // Ensure it's exactly 10 digits
      if (cleaned.length === 10 && /^\d{10}$/.test(cleaned)) {
        return cleaned;
      }
      return null;
    })
    .filter((num): num is string => num !== null);

  if (cleanNumbers.length === 0) {
    throw new Error("No valid phone numbers found. Numbers must be 10 digits.");
  }

  // Use backend proxy server
  // In development: http://localhost:3001/api/fast2sms
  // In production: Use your deployed backend URL or Cloud Function
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
  const url = `${BACKEND_URL}/api/fast2sms`;

  // Prepare request body
  const body = {
    message: message.trim(),
    numbers: cleanNumbers.join(","),
    route: "q" // 'q' for quick route (transactional), 'd' for promotional
  };

  try {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      "x-api-key": apiKey // Send API key via custom header for backend proxy
    };

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body)
    });

    const data = await response.json();

    // Fast2SMS returns { return: true/false, message: [...] }
    if (!response.ok) {
      const error: Fast2SMSError = {
        return: false,
        message: data.message || [`HTTP ${response.status}: ${response.statusText}`]
      };
      throw new Error(error.message.join(", "));
    }

    // Check if Fast2SMS returned an error
    if (data.return === false) {
      const errorMsg = Array.isArray(data.message) ? data.message.join(", ") : "SMS send failed";
      throw new Error(errorMsg);
    }

    return data as Fast2SMSResponse;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to send SMS: Unknown error");
  }
}

/**
 * Send SMS to multiple recipients in batches
 * Fast2SMS allows up to 6 numbers per request in free tier
 * @param apiKey - Fast2SMS API key
 * @param message - Message text
 * @param numbers - Array of phone numbers
 * @param batchSize - Number of recipients per batch (default: 6)
 * @returns Array of responses
 */
export async function sendBulkSMS(
  apiKey: string,
  message: string,
  numbers: string[],
  batchSize: number = 6
): Promise<Fast2SMSResponse[]> {
  const results: Fast2SMSResponse[] = [];
  const batches: string[][] = [];

  // Split numbers into batches
  for (let i = 0; i < numbers.length; i += batchSize) {
    batches.push(numbers.slice(i, i + batchSize));
  }

  // Send each batch with a small delay to avoid rate limiting
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    try {
      const result = await sendSMS(apiKey, message, batch);
      results.push(result);
      
      // Add delay between batches (except for the last one)
      if (i < batches.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 second delay
      }
    } catch (error) {
      // Continue with next batch even if one fails
      console.error(`Failed to send batch ${i + 1}:`, error);
      // Create a failed response for tracking
      results.push({
        return: false,
        request_id: `failed-${Date.now()}`,
        message: [error instanceof Error ? error.message : "Unknown error"]
      });
    }
  }

  return results;
}

