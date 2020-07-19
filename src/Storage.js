const NAMESPACE = "editor";
const META = {
  version: 0.1
};

// @TODO Add debouncer
export const saveFile = (shapes, meta) => {
  const file = shapes.map(shape => shape._serialize());
  localStorage.setItem(
    NAMESPACE,
    JSON.stringify({
      ...meta,
      file,
      modifiedOn: Date.now()
    })
  );
};

export const loadFile = () => {
  let data = JSON.parse(localStorage.getItem(NAMESPACE));

  if (data && !data.file) {
    deleteFile();
    data = null;
  }

  return (
    data || {
      ...META,
      file: [],
      createdOn: Date.now()
    }
  );
};

export const deleteFile = () => {
  localStorage.removeItem(NAMESPACE);
};
