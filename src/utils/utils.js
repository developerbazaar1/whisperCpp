const fs = require("node:fs");
const axios = require("axios");




// Function to get the url of back date
function getPreviousDateUrl(url) {
  if (typeof url !== "string" || !url.includes("/")) {
    throw new Error("Invalid URL format.");
  }

  const segments = url.split("/");
  const lastSegment = segments[segments.length - 1];
  const exactDate = lastSegment.split("-")[0];
  const year = exactDate.slice(0, 4);
  const month = exactDate.slice(4, 6);
  const day = exactDate.slice(6, 8);
  const originalDate = new Date(`${year}-${month}-${day}`);

  const datePart = segments[segments.length - 2];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    throw new Error("Invalid date format. Expected format: YYYY-MM-DD.");
  }

  const formattedDate = new Date(datePart);
  if (isNaN(formattedDate.getTime())) {
    throw new Error("Invalid date value.");
  }

  formattedDate.setDate(formattedDate.getDate() - 1);
  const diffInDays = (originalDate - formattedDate) / (1000 * 60 * 60 * 24);
  if (diffInDays > 1) {
    throw new Error(
      "The formatted date is more than one day before the original date."
    );
  }

  return `https://storage.googleapis.com/x5-clients/114543/${formattedDate.getFullYear()}-${String(
    formattedDate.getMonth() + 1
  ).padStart(2, "0")}-${String(formattedDate.getDate()).padStart(
    2,
    "0"
  )}/${lastSegment}`}


// Helper function to download the audio file using Axios
const downloadFile = async (url, dest, maxRetries = 3, currentRetry = 0) => {
  const writer = fs.createWriteStream(dest);

  try {
    const response = await axios({
      method: 'GET',
      url,
      responseType: 'stream',
    });

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(dest));
      writer.on('error', reject);
    });
  } catch (err) {
    // If 403 error occurs and we haven't exceeded max retries
    if (err.response && err.response.status === 403 && currentRetry < maxRetries) {
      console.log(`403 Forbidden error. Attempt ${currentRetry + 1} of ${maxRetries}. Trying previous date URL...`);

      try {
        const newUrl = getPreviousDateUrl(url);  // Get the URL for the previous day
        return downloadFile(newUrl, dest, maxRetries, currentRetry + 1);  // Retry with the new URL
      } catch (urlError) {
        console.log("Error in date calculation:", urlError.message);
        throw new Error("Failed to generate a valid previous date URL.");
      }
    }

    // If retries exhausted or a different error occurs, throw the error
    if (currentRetry >= maxRetries) {
      throw new Error(`Max retries reached. Error downloading the file: ${err.message}`);
    }

    // Other errors (non-403 or max retries reached)
    throw new Error('Error downloading the file: ' + err.message);
  }
};
module.exports = { getPreviousDateUrl ,downloadFile };
