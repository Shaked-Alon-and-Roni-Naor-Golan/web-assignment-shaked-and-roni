import * as path from "path";
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import appPromise from "./src/app";
import https from "https";
import fs from "fs";
import http from "http";

// appPromise.then((app) =>
//   app.listen(process.env.PORT, () => {
//     console.log(
//       `Example app listening at http://localhost:${process.env.PORT}`
//     );
//   })
// );

appPromise.then((app) => {
  if (process.env.NODE_ENV !== "production") {
    console.log("development");
    http.createServer(app).listen(process.env.PORT);
  } else {
    console.log("PRODUCTION");
    const option2 = {
      key: fs.readFileSync('../../client-key.pem'),
      cert: fs.readFileSync('../../client-cert.pem'),
    };
    https.createServer(option2, app).listen(process.env.HTTPS_PORT);
  }
});
