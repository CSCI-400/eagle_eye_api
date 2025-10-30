const { db } = require('../enviroment/firebase/firebase');
const { validateLocation, collectionPath } = require('../models/locationModel');

async function createLocation(data, user) {
  const valid = validateLocation({
    ...data,
    created_by: user?.uid,
  });
  const docRef = await db.collection(collectionPath).add(valid);
  return { id: docRef.id, ...valid };
}

async function getLocationById(id) {
  const doc = await db.collection(collectionPath).doc(id).get();
  if (!doc.exists) throw new Error('Location not found');
  return { id: doc.id, ...doc.data() };
}

async function listLocations({ bbox } = {}) {
  const snapshot = await db.collection(collectionPath).get();
  let locations = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

  if (bbox && bbox.length === 4) {
    const [minLat, minLng, maxLat, maxLng] = bbox.map(Number);
    locations = locations.filter((loc) => {
      const okLat = typeof loc.lat === 'number' && loc.lat >= minLat && loc.lat <= maxLat;
      const okLng = typeof loc.lng === 'number' && loc.lng >= minLng && loc.lng <= maxLng;
      return okLat && okLng;
    });
  }

  return locations;
}

async function updateLocation(id, updates) {
  const existing = await getLocationById(id);
  const merged = validateLocation({
    ...existing,
    ...updates,
    created_at: existing.created_at,
    created_by: existing.created_by,
  });
  await db.collection(collectionPath).doc(id).set(merged, { merge: true });
  return { id, ...merged };
}

async function deleteLocation(id) {
  await db.collection(collectionPath).doc(id).delete();
  return { id, deleted: true };
}

module.exports = {
  createLocation,
  getLocationById,
  listLocations,
  updateLocation,
  deleteLocation,
};
