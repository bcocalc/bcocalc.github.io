// Test-branch source activation. Publication and production record writes require separate approval.
export const MODERN_DESTINATION=Object.freeze({projectId:'tapcalc-afc92',database:'(default)',collection:'tapcalcModernSnapshots'});
export const MODERN_SCHEMA=2;
// Fixed reviewed descriptor; only the source binding below activates it.
export const PRODUCTION_MODERN_PROPOSAL=Object.freeze({
  id:'tapcalc-standard-public-schema2-v1',kind:'firestore-public',enabled:true,
  endpoint:'https://firestore.googleapis.com',destination:MODERN_DESTINATION,schema:MODERN_SCHEMA
});
export const PRODUCTION_MODERN_BINDING=PRODUCTION_MODERN_PROPOSAL;
export const MAX_MODERN_BYTES=700000;
