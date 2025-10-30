// LOCAL SECRETS - DO NOT COMMIT TO GIT
// Add this file to .gitignore to keep secrets local
// Copy this template and fill with your actual values

export const localSecrets = {
  // Google Sheets API Key (read-only) OR Service Account JSON (for add/update)
  googleApiKey: "AIzaSyAozO0DUmODQ-tTnXJB-RIPqlIkmmo6SYY",
  
  // Google Sheets URL
  spreadsheetUrl: "https://docs.google.com/spreadsheets/d/1L0wSffEo4CaP0AGikJDpu_bu5KLuJ1SzlFSS01Pqugg",
  
  // Service Account JSON for write operations (paste entire JSON as string)
  serviceAccountJson: `{
    "type": "service_account",
    "project_id": "YOUR_PROJECT",
    "private_key_id": "YOUR_KEY_ID",
    "private_key": "-----BEGIN PRIVATE KEY-----\\nYOUR_PRIVATE_KEY\\n-----END PRIVATE KEY-----\\n",
    "client_email": "YOUR_SERVICE_ACCOUNT@YOUR_PROJECT.iam.gserviceaccount.com",
    "client_id": "YOUR_CLIENT_ID",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "YOUR_CERT_URL"
  }`,
  
  // Worksheet names in your Google Sheet
  worksheetNames: ["MASTER DATA", "BACKEND SHEET"],
  
  // Column mappings for MASTER DATA (exactly match SheetLead fields)
  columnMappings: {
    tripId: "A",
    date: "B",
    consultant: "C",
    status: "D",
    travellerName: "E",
    leadSource: "F",
    travelDate: "G",
    travelState: "H",
    destination: "I",
    ticketsRequired: "J",
    remarks: "K",
    nights: "L",
    pax: "M",
    hotelCategory: "N",
    mealPlan: "O",
    phone: "P",
    email: "Q",
    whatsappLink: "R",
    departureLocation: "S",
    mentorName: "T",
    remarkByMentor: "U",
    eventType: "V",
    eventDate: "W",
    contactStatus: "X",
    followupStatus: "Y",
    uniqueKey: "Z",
    timeStamp: "AA",
    whatsappNotification: "AB",
    customerReplies: "AC",
    aiResponse: "AD",
    fullConversation: "AE",
    bookingStatus: "AF",
    firstMessageTime: "AG",
    customerLastMessageTime: "AH",
    reminderCount: "AI",
    whatsappItinerary: "AJ",
    whatsappItineraryTiming: "AK",
    priority: "AL"
  },
  
  // Payment links and QR codes
  paymentLinks: [
    {
      name: "Primary Payment",
      url: "https://your-payment-link.com",
      qrCode: "data:image/png;base64,YOUR_QR_CODE_BASE64_HERE"
    }
  ]
};

// Helper to check if secrets are configured
export const areSecretsConfigured = () => {
  return localSecrets.spreadsheetUrl.includes("YOUR_") === false &&
         (localSecrets.googleApiKey.includes("YOUR_") === false || 
          localSecrets.serviceAccountJson.includes("YOUR_") === false);
};