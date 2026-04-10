import { app } from "./app.js";
import { connectDatabase } from "./config/db.js";
import { env } from "./config/env.js";

const startServer = async () => {
  try {
    await connectDatabase();

    app.listen(env.port, () => {
      console.log(`Backend API listening on http://localhost:${env.port}`);
    });
  } catch (error) {
    console.error("Failed to start backend server.", error);
    process.exit(1);
  }
};

startServer();
