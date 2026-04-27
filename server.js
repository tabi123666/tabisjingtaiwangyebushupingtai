const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${port}`;

// 静态文件服务
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// 配置multer存储
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const urlPrefix = req.body.urlPrefix;
        const uploadDir = path.join(__dirname, 'uploads', urlPrefix);
        
        // 创建目录
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

// 处理根路径
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 处理文件上传
app.post('/upload', upload.array('files'), (req, res) => {
    const urlPrefix = req.body.urlPrefix;
    
    if (!urlPrefix || !/^[a-zA-Z0-9]+$/.test(urlPrefix)) {
        return res.status(400).json({ error: 'URL前缀只能包含字母和数字' });
    }
    
    // 检查是否有index.html文件
    const uploadDir = path.join(__dirname, 'uploads', urlPrefix);
    const hasIndexHtml = fs.existsSync(path.join(uploadDir, 'index.html'));
    
    if (!hasIndexHtml && req.files.length > 0) {
        // 如果上传的是单个HTML文件且不是index.html，重命名为index.html
        if (req.files.length === 1 && req.files[0].originalname.endsWith('.html')) {
            fs.renameSync(
                path.join(uploadDir, req.files[0].originalname),
                path.join(uploadDir, 'index.html')
            );
        }
    }
    
    const deployedUrl = `${BASE_URL}/uploads/${urlPrefix}/index.html`;
    res.json({ success: true, url: deployedUrl });
});

// 启动服务器
app.listen(port, () => {
    console.log(`服务器运行在 http://localhost:${port}`);
});