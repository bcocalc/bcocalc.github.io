// LOCAL DRAFT ONLY. One-site Shared Jobs fixture; production access is not connected.
export const MODERN_DESTINATION=Object.freeze({projectId:'tapcalc-afc92',database:'(default)',collection:'tapcalcModernSnapshots'});
export const MODERN_SCHEMA=2;
// Review proposal only. Neither this descriptor nor a window/localStorage flag activates it.
export const PRODUCTION_MODERN_PROPOSAL=Object.freeze({
  id:'tapcalc-standard-public-schema2-v1',kind:'firestore-public',enabled:false,
  endpoint:'https://firestore.googleapis.com',destination:MODERN_DESTINATION,schema:MODERN_SCHEMA
});
export const PRODUCTION_MODERN_BINDING=null;
export const MAX_MODERN_BYTES=700000;
