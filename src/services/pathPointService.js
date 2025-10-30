const { db } = require('../enviroment/firebase/firebase');
const { validatePathPoint, collectionPath } = require('../models/pathPointModel');

async function createPathPoint(data, user) {
  const valid = validatePathPoint({
    ...data,
    Created_by: user?.uid,
  });
  const docRef = await db.collection(collectionPath).add(valid);
  return { id: docRef.id, ...valid };
}

async function getPathPointById(id) {
  const doc = await db.collection(collectionPath).doc(id).get();
  if (!doc.exists) throw new Error('Path point not found');
  return { id: doc.id, ...doc.data() };
}

async function listPathPoints({ bbox } = {}) {
  const snapshot = await db.collection(collectionPath).get();
  let points = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

  if (bbox && bbox.length === 4) {
    const [minLat, minLng, maxLat, maxLng] = bbox.map(Number);
    points = points.filter((p) => {
      const okLat = typeof p.latitude === 'number' && p.latitude >= minLat && p.latitude <= maxLat;
      const okLng = typeof p.longtitude === 'number' && p.longtitude >= minLng && p.longtitude <= maxLng;
      return okLat && okLng;
    });
  }

  return points;
}

async function updatePathPoint(id, updates) {
  const existing = await getPathPointById(id);
  const merged = validatePathPoint({
    ...existing,
    ...updates,
    created_at: existing.created_at,
    Created_by: existing.Created_by,
  });
  await db.collection(collectionPath).doc(id).set(merged, { merge: true });
  return { id, ...merged };
}

async function deletePathPoint(id) {
  await db.collection(collectionPath).doc(id).delete();
  return { id, deleted: true };
}

module.exports = {
  createPathPoint,
  getPathPointById,
  listPathPoints,
  updatePathPoint,
  deletePathPoint,
};
