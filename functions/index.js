const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

function haversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

exports.assignClosestDriver = functions.firestore
  .document('rideRequests/{rideId}')
  .onWrite(async (change, context) => {
    const ride = change.after.exists ? change.after.data() : null;
    if (!ride || ride.status !== 'waiting') return;

    const pickupLat = ride.pickupLat;
    const pickupLng = ride.pickupLng;
    const declinedDrivers = ride.declinedDrivers || [];

    // Fetch all available drivers
    const driversSnapshot = await admin.firestore().collection('Drivers').where('isOnline', '==', true).get();
    let drivers = [];
    driversSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.latitude && data.longitude && !declinedDrivers.includes(doc.id)) {
        const distance = haversineDistance(pickupLat, pickupLng, data.latitude, data.longitude);
        drivers.push({ id: doc.id, distance });
      }
    });

    // Sort drivers by distance
    drivers.sort((a, b) => a.distance - b.distance);

    if (drivers.length > 0) {
      // Assign to the closest driver
      await admin.firestore().collection('rideRequests').doc(context.params.rideId).update({
        assignedDriver: drivers[0].id,
        status: 'waiting'
      });
    } else {
      // No available drivers, reset after delay
      setTimeout(async () => {
        await admin.firestore().collection('rideRequests').doc(context.params.rideId).update({
          assignedDriver: null,
          status: 'waiting',
          declinedDrivers: []
        });
      }, 10000); // 10 seconds
    }
  }); 