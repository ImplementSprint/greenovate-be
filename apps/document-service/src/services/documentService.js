const crypto = require('crypto');
import { createHttpError } from "../lib/http.js";

export const uploadDocument = async (payload) => {
  const { fileName, content, mimeType } = payload;

  if (!fileName || !content) {
    throw createHttpError(400, "Missing required fields: fileName, content");
  }

  console.log(`[DocumentService] Uploading document: ${String(fileName).replace(/[\r\n]/g, '')} (${String(mimeType || "unknown").replace(/[\r\n]/g, '')})...`);

  // Simulation
  await new Promise((resolve) => setTimeout(resolve, 150));

  return {
    documentId: `doc_${crypto.randomBytes(5).toString('hex')}`,
    fileName,
    url: `https://storage.example.com/docs/${fileName}`,
    uploadedAt: new Date().toISOString(),
  };
};

export const getDocumentMetadata = async (documentId) => {
  return {
    documentId,
    fileName: "example.pdf",
    size: 1024 * 50,
    mimeType: "application/pdf",
  };
};
