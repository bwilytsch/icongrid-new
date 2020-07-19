// Test DB
// Use localStorage or IndexedDB?

export default () => {
  const map = new Map();
  return Object.freeze({
    findById: async id => map.get(id),
    insert: async item => map.set(item.id, item),
    list: async () => Array.from(map.values()),
    remove: async id => map.delete(id),
    update: async item => {
      if (!map.has(item.id)) {
        throw Error("No such item found.");
      }

      return map.set(item.id, { ...map.get(item.id), ...item });
    }
  });
};
