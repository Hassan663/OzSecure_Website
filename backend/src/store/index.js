/**
 * Storage adapter. Picks MongoDB when MONGODB_URI is set, otherwise a local
 * JSON-file store — both expose the identical interface, so the rest of the app
 * never knows which is active. Add MONGODB_URI later and it switches with zero
 * code changes.
 */
let impl = null;

export async function initStore() {
  if (process.env.MONGODB_URI) {
    const mod = await import('./mongoStore.js');
    impl = await mod.init();
    console.log('Storage: MongoDB');
  } else {
    const mod = await import('./jsonStore.js');
    impl = await mod.init();
    console.log('Storage: local JSON file (set MONGODB_URI to use MongoDB)');
  }
  return impl;
}

const ensure = () => {
  if (!impl) throw new Error('Store not initialised — call initStore() first.');
  return impl;
};

export const createQuery = (data) => ensure().createQuery(data);
export const listQueries = (opts) => ensure().listQueries(opts);
export const getQuery = (id) => ensure().getQuery(id);
export const updateStatus = (id, status) => ensure().updateStatus(id, status);
export const deleteQuery = (id) => ensure().deleteQuery(id);
export const getStats = () => ensure().getStats();
