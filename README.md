📁 Project Structure Overview

nexabill-data-hub/
│
├── 📁 client/                   # Frontend (Static Website)
│   ├── 📁 css/                  # Stylesheets
│   │   └── styles.css
│   ├── 📁 js/                   # JavaScript logic
│   │   └── main.js
│   ├── 📁 images/               # Static images (optional)
│   └── 📄 index.html            # Main HTML file
│
├── 📁 server/                   # Backend (Node.js + Express)
│   ├── 📁 routes/               # Express routes
│   │   ├── uploadRoutes.js
│   │   └── productRoutes.js
│   ├── 📁 controllers/          # Controllers for routes
│   ├── 📁 middleware/           # Image resize/multer middleware
│   ├── 📁 config/               # MySQL DB config
│   │   └── db.js
│   ├── 📁 uploads/              # Uploaded images
│   └── 📄 index.js              # Entry point for Express app
│
├── 📁 sql/                      # SQL schema & sample data
│   └── schema.sql
│
├── 📄 .env                      # Environment variables
├── 📄 README.md
└── 📄 package.json
