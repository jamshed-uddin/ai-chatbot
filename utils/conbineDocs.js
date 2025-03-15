const combineDocs = (docs) => {
  return docs.map((doc) => doc.pageContent).join("\n");
};

export default combineDocs;
