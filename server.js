const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });
const app = require("./app");
const mongoose = require("mongoose");

const db = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(db)
  .then(() => {
    console.log("Successfully connected to the database");
  })
  .catch((err) => {
    console.log(err);
    console.log("Error connecting to the database");
  });

const port = 3333;
app.listen(port, "127.0.0.1", () => {
  console.log(`server is running on port ${port}`);
});

