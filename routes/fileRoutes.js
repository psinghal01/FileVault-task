const express = require("express");

const router = express.Router();

const upload = require("../middleware/uploadMiddleware");

const {
  uploadFile,
  getFiles,
  deleteFile,
} = require("../controllers/fileController");

router.post(
  "/",
  upload.single("file"),
  uploadFile
);

router.get("/", getFiles);

router.delete("/:id", deleteFile);

module.exports = router;