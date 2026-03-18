const admin = require("firebase-admin");
const serviceAccount = require("../limousine-booking-app-firebase-adminsdk-fbsvc-31bebe3d5c.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Hàm verify token và log số điện thoại
async function verifyFirebaseToken(token) {
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    console.log(decoded.phone_number);
    return decoded;
  } catch (err) {
    console.error("Firebase token invalid", err);
    throw err;
  }
}

module.exports = { admin, verifyFirebaseToken };