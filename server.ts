import appPromise from "./app";

const port = process.env.PORT || 4000;

appPromise.then((app) => {
  app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });
}).catch(err => {
    console.error("Failed to start server:", err);
});