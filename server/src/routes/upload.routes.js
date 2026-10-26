import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { requireAuth } from '../middlewares/auth.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determina o diretório de uploads (suporta container Docker e ambiente de desenvolvimento local)
const uploadDirCandidates = [
  '/public/uploads',
  path.resolve(__dirname, '../../../public/uploads'),
  path.resolve(process.cwd(), 'public/uploads'),
  path.resolve(process.cwd(), '../public/uploads')
];

let uploadDir = uploadDirCandidates.find(d => fs.existsSync(d));
if (!uploadDir) {
  // Se não existir, tenta criar no diretório public/uploads
  uploadDir = path.resolve(__dirname, '../../../public/uploads');
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
  } catch (err) {
    uploadDir = path.resolve(process.cwd(), 'uploads');
    fs.mkdirSync(uploadDir, { recursive: true });
  }
}

// Configuração do Multer com armazenamento em disco e nomes seguros
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const rand = Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    const safeBaseName = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_\-]/g, '_')
      .substring(0, 50);
    cb(null, `${safeBaseName}_${timestamp}_${rand}${ext}`);
  }
});

// Limite por arquivo individual de 30MB
const upload = multer({
  storage,
  limits: {
    fileSize: 30 * 1024 * 1024 // 30MB
  },
  fileFilter: (req, file, cb) => {
    const allowedExts = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.png', '.jpg', '.jpeg', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExts.includes(ext)) {
      return cb(new Error(`Extensão ${ext} não permitida. Envie arquivos PDF, DOCX, XLSX ou Imagens.`));
    }
    cb(null, true);
  }
});

const router = Router();

/**
 * POST /api/uploads
 * Upload unitário de documento (um arquivo por vez)
 */
router.post('/', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'Nenhum arquivo enviado.' });
  }

  const fileUrl = `/uploads/${req.file.filename}`;
  
  res.status(201).json({
    success: true,
    file: {
      id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      name: req.file.originalname,
      fileName: req.file.filename,
      size: req.file.size,
      type: req.file.mimetype,
      url: fileUrl,
      uploadedAt: new Date().toISOString()
    }
  });
});

export default router;
