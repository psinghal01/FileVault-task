const File = require("../models/File");
const fs = require("fs");
const crypto = require("crypto");
const path = require("path");

const uploadFile = async (req, res) => {
  try {
    let fileBuffer;
    let originalname;
    let mimetype;
    let size;

    if (req.file) {
      fileBuffer = req.file.buffer;
      originalname = req.file.originalname;
      mimetype = req.file.mimetype;
      size = req.file.size;
    } else if (req.body.base64) {
      let base64Data = req.body.base64;
      if (base64Data.startsWith('data:')) {
        const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          mimetype = matches[1];
          base64Data = matches[2];
        }
      }
      
      if (!mimetype) {
         mimetype = req.body.type || "application/octet-stream";
      }

      fileBuffer = Buffer.from(base64Data, "base64");
      originalname = req.body.name || `upload_${Date.now()}`;
      size = fileBuffer.length;
    } else if (req.body.url) {
      try {
        const response = await fetch(req.body.url);
        if (!response.ok) {
           return res.status(400).json({ message: "Failed to fetch file from URL" });
        }
        const arrayBuffer = await response.arrayBuffer();
        fileBuffer = Buffer.from(arrayBuffer);
        
        mimetype = response.headers.get("content-type") || req.body.type || "application/octet-stream";
        
        const urlObj = new URL(req.body.url);
        const urlFilename = path.basename(urlObj.pathname);
        originalname = req.body.name || (urlFilename ? urlFilename : `upload_${Date.now()}`);
        size = fileBuffer.length;
      } catch (err) {
         return res.status(400).json({ message: "Invalid URL provided or failed to fetch" });
      }
    } else {
      return res.status(400).json({
        message: "No file, base64 data, or URL provided",
      });
    }

    const hashSum = crypto.createHash("sha256");
    hashSum.update(fileBuffer);
    const sha256 = hashSum.digest("hex");
    const existingFile = await File.findOne({ sha256 });

    if (existingFile) {
      existingFile.occurrenceCount += 1;
      await existingFile.save();

      return res.status(200).json({
        message: "Duplicate file detected. Occurrence count incremented.",
        file: existingFile,
      });
    }

    const uniqueName = Date.now() + "-" + originalname;
    const savePath = path.join("uploads", uniqueName);
    
    if (!fs.existsSync("uploads")) {
      fs.mkdirSync("uploads", { recursive: true });
    }
    
    await fs.promises.writeFile(savePath, fileBuffer);

    const newFile = await File.create({
      name: originalname,
      type: mimetype,
      size: size,
      sha256: sha256,
      occurrenceCount: 1,
      path: savePath,
    });

    res.status(201).json({
      message: "File uploaded successfully",
      file: newFile,
    });
  } catch (error) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        message: "File too large. Maximum size is 10MB",
      });
    }

    console.error(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

const getFiles = async (req, res) => {
  try {
    const files = await File.find().sort({
      createdAt: -1,
    });

    const totalOccupiedSize = files.reduce((total, file) => total + file.size, 0);

    res.status(200).json({
      files,
      totalOccupiedSize
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

const deleteFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({
        message: "File not found",
      });
    }

    if (file.occurrenceCount > 1) {
      file.occurrenceCount -= 1;
      await file.save();

      return res.status(200).json({
        message: "File occurrence decremented",
        file,
      });
    }

    try {
      await fs.promises.unlink(file.path);
    } catch (unlinkErr) {
      if (unlinkErr.code !== "ENOENT") console.error("Error deleting file:", unlinkErr);
    }

    await File.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: "File deleted successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

module.exports = {
  uploadFile,
  getFiles,
  deleteFile,
};