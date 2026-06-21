import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCPOJ75w5cN41mmyhZxuN7URBO-X-hL0qU",
  authDomain: "ai-studio-applet-webapp-d8652.firebaseapp.com",
  projectId: "ai-studio-applet-webapp-d8652",
  storageBucket: "ai-studio-applet-webapp-d8652.firebasestorage.app",
  messagingSenderId: "349783760184",
  appId: "1:349783760184:web:56289f30d4d216fab775cd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Authentication
export const auth = getAuth(app);

// Initialize Firestore connecting it to the specific database ID
export const db = getFirestore(app, "ai-studio-40f6a32a-42e4-4283-89a7-890d8e65cc7e");

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
  errorCode?: string;
  diagnosticSummary?: string;
  remediationSteps?: string[];
  timestamp?: string;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const rawErrorMessage = error instanceof Error ? error.message : String(error);
  const errorCode = (error as any)?.code || "unknown";
  
  // Calculate specific descriptive diagnostics and action plans
  const steps: string[] = [];
  let summary = "An unexpected Firestore operation error was intercepted.";

  const isPermissionError = 
    errorCode === "permission-denied" || 
    rawErrorMessage.toLowerCase().includes("permission") || 
    rawErrorMessage.toLowerCase().includes("insufficient");

  const isNotFoundError = 
    errorCode === "not-found" || 
    rawErrorMessage.toLowerCase().includes("not-found") ||
    rawErrorMessage.toLowerCase().includes("not found");

  const isUnavailableError = 
    errorCode === "unavailable" || 
    rawErrorMessage.toLowerCase().includes("unavailable") ||
    rawErrorMessage.toLowerCase().includes("offline");

  const isInvalidArgumentError = 
    errorCode === "invalid-argument" || 
    rawErrorMessage.toLowerCase().includes("invalid-argument") ||
    rawErrorMessage.toLowerCase().includes("invalid argument");

  if (isPermissionError) {
    summary = `Access was denied while executing ${operationType.toUpperCase()} on '${path}'. This typically indicates a violation of configured Firestore Security Rules ('firestore.rules').`;
    steps.push(
      `Audit the security definitions declared in '/firestore.rules' specifically corresponding to the resource match path: '${path}'.`,
      `Verify user authentication status. Current Authenticated User UID: ${auth.currentUser?.uid || 'NONE (Guest/Unauthenticated)'}.`,
      `Determine if the requested write payload breaks field assertions or schema type requirements checked by rules.`
    );
  } else if (isNotFoundError) {
    summary = `Document or Collection targeted by ${operationType.toUpperCase()} at path '${path}' could not be located.`;
    steps.push(
      `Double-check collection/document path casing and spelling for potential typos in client queries.`,
      `Confirm whether the document was pre-emptively deleted or if it belongs to a non-existent category reference.`
    );
  } else if (isUnavailableError) {
    summary = `The Firestore database instances are currently unavailable or unreachable.`;
    steps.push(
      `Check your overall internet connection and ensure Cloud Run/frontend containers are not blocked by outbound VPC.`,
      `Verify if the active Firestore project db is provisioned and fully healthy in Google Cloud Console.`
    );
  } else if (isInvalidArgumentError) {
    summary = `One or more runtime arguments provided to ${operationType.toUpperCase()} for path '${path}' are invalid or structured improperly.`;
    steps.push(
      `Validate that your Javascript query filters (where/orderBy) do not conflict or fail due to missing Firestore composite index configurations.`,
      `Compare the data payload keys and types against definitions in '/firebase-blueprint.json'.`
    );
  } else {
    summary = `Operation ${operationType.toUpperCase()} on '${path}' failed with server response.`;
    steps.push(
      `Check the runtime browser/server console details and inspect the stack trace below.`,
      `Consult standard Google Cloud Firestore documentation for details regarding error code: '${errorCode}'.`
    );
  }

  const errInfo: FirestoreErrorInfo = {
    error: rawErrorMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path,
    errorCode,
    diagnosticSummary: summary,
    remediationSteps: steps,
    timestamp: new Date().toISOString()
  };

  // Log elegant diagnostic banner report
  console.error(
    `\n%c========================================================================\n` +
    `🔥 FIRESTORE DATABASE DIAGNOSTICS REPORT\n` +
    `========================================================================\n` +
    `[TIMESTAMP]      : ${errInfo.timestamp}\n` +
    `[TARGET PATH]    : ${errInfo.path}\n` +
    `[OPERATION TYPE] : ${errInfo.operationType.toUpperCase()}\n` +
    `[ERROR CODE]     : ${errInfo.errorCode}\n` +
    `[RAW EXCEPTION]  : ${errInfo.error}\n` +
    `------------------------------------------------------------------------\n` +
    `👤 AUTH STATE\n` +
    `  - User ID      : ${errInfo.authInfo.userId || "Not Logged In"}\n` +
    `  - Email        : ${errInfo.authInfo.email || "N/A"}\n` +
    `  - Verified     : ${errInfo.authInfo.emailVerified ?? "N/A"}\n` +
    `------------------------------------------------------------------------\n` +
    `💡 DIAGNOSTIC ANALYSIS:\n` +
    `  ${errInfo.diagnosticSummary}\n` +
    `------------------------------------------------------------------------\n` +
    `🛠️ RECOMMENDED REMEDIATION ACTION STEPS:\n` +
    errInfo.remediationSteps.map((step, idx) => `  ${idx + 1}. ${step}`).join("\n") +
    `\n========================================================================\n`,
    "color: #ef4444; font-weight: bold;"
  );

  throw new Error(JSON.stringify(errInfo));
}

