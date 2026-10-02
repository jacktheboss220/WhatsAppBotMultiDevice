import NodeCache from "node-cache";

// Fed to Baileys as cachedGroupMetadata so sendMessage() doesn't re-fetch the full
// participant list from WhatsApp on every group send (slow for big groups).
// Filled by core/messages.js, cleared by core/groupEvent.js on participant changes.
const groupMetaStore = new NodeCache({ stdTTL: 60 * 60, checkperiod: 300, useClones: false });

export default groupMetaStore;
