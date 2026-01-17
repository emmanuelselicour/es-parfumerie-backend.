require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors({
  origin: "https://es-parfumerie.netlify.app"
}));

app.use(express.json());

app.use("/api/auth", require("./routes/auth"));

app.get("/", (_, res) => {
  res.send("ES Parfumerie API running 🚀");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("API running on port", PORT));
