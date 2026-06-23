// src/utils/emailService.ts
import emailjs from "@emailjs/browser";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase"; // adjust path if needed

export type NotificationType = "request" | "complaint" | "donor";

export interface NotificationPayload {
  name: string;
  email: string;
  phone?: string;
  details: string;
  timestamp: string;
}

/** Fetch all admin email addresses from Firestore collection `admins` */
async function fetchAdminEmails(): Promise<string[]> {
  const snapshot = await getDocs(collection(db, "admins"));
  const emails: string[] = [];
  snapshot.forEach((doc) => {
    const data = doc.data();
    if (data?.email) emails.push(data.email);
  });
  return emails;
}

/** Send email using EmailJS. The template must contain a variable `admin_emails` that receives a comma‑separated list. */
export async function sendEmailNotification(
  type: NotificationType,
  payload: NotificationPayload,
): Promise<void> {
  const adminEmails = await fetchAdminEmails();
  const adminList = adminEmails.length
    ? adminEmails.join(",")
    : process.env.REACT_APP_ADMIN_EMAIL || "";

  const templateParams = {
    admin_emails: adminList,
    name: payload.name,
    email: payload.email,
    phone: payload.phone || "",
    details: payload.details,
    timestamp: payload.timestamp,
    type,
  };

  const serviceId = process.env.REACT_APP_EMAILJS_SERVICE_ID as string;
  const templateId = process.env.REACT_APP_EMAILJS_TEMPLATE_ID as string;
  const publicKey = process.env.REACT_APP_EMAILJS_PUBLIC_KEY as string;

  await emailjs.send(serviceId, templateId, templateParams, publicKey);
}
