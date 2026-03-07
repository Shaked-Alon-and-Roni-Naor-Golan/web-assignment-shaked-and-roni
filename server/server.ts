import * as path from "path";
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import appPromise from "./src/app";

appPromise.then((app) =>
  app.listen(process.env.PORT, () => {
    console.log(
      `Example app listening at http://localhost:${process.env.PORT}`
    );
  })
);
