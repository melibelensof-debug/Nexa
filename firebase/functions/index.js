const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Cloud Function: Crear nuevo perfil de PYME
exports.createPymeProfile = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'El usuario debe estar autenticado');
  }

  const userId = context.auth.uid;
  const { businessName, sector, region, description, website } = data;

  try {
    await admin.firestore().collection('pymes').doc(userId).set({
      businessName,
      sector,
      region,
      description,
      website,
      userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      ratings: 0,
      reviews: [],
    });

    return { success: true, message: 'Perfil creado exitosamente' };
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Cloud Function: Buscar PYMEs por región
exports.searchPymesByRegion = functions.https.onCall(async (data, context) => {
  const { region, sector } = data;

  try {
    let query = admin.firestore().collection('pymes').where('region', '==', region);

    if (sector) {
      query = query.where('sector', '==', sector);
    }

    const snapshot = await query.get();
    const pymes = [];

    snapshot.forEach((doc) => {
      pymes.push({ id: doc.id, ...doc.data() });
    });

    return { success: true, pymes };
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});
