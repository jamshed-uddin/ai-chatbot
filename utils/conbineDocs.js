const combineDocs = (docs) => {
  return docs.map((doc) => doc.pageContent).join("\n\n");
};

export default combineDocs;
