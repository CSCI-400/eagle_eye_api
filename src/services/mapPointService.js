const { db } = require('../enviroment/firebase/firebase');
const { validateMapPoint, collectionPath } = require('../models/mapPointModel');

async function createMapPoint(data, user) {
  const valid = validateMapPoint({
    ...data,
    createdBy: user?.uid,
  });
  const docRef = await db.collection(collectionPath).add(valid);
  return { id: docRef.id, ...valid };
}

async function getMapPointById(id) {
  const doc = await db.collection(collectionPath).doc(id).get();
  if (!doc.exists) throw new Error('Map point not found');
  return { id: doc.id, ...doc.data() };
}

async function listMapPoints({ bbox, category } = {}) {
  const snapshot = await db.collection(collectionPath).get();
  let points = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

  if (category) {
    points = points.filter((p) => (p.category || 'general') === category);
  }

  if (bbox && bbox.length === 4) {
    const [minLat, minLng, maxLat, maxLng] = bbox.map(Number);
    points = points.filter((p) => {
      const okLat = typeof p.lat === 'number' && p.lat >= minLat && p.lat <= maxLat;
      const okLng = typeof p.lng === 'number' && p.lng >= minLng && p.lng <= maxLng;
      return okLat && okLng;
    });
  }

  return points;
}

async function updateMapPoint(id, updates) {
  const existing = await getMapPointById(id);
  const merged = validateMapPoint({
    ...existing,
    ...updates,
    createdAt: existing.createdAt,
    createdBy: existing.createdBy,
  });
  await db.collection(collectionPath).doc(id).set(merged, { merge: true });
  return { id, ...merged };
}

async function deleteMapPoint(id) {
  await db.collection(collectionPath).doc(id).delete();
  return { id, deleted: true };
}

module.exports = {
  createMapPoint,
  getMapPointById,
  listMapPoints,
  updateMapPoint,
  deleteMapPoint,
};
