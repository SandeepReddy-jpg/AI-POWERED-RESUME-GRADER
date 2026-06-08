# Deployment Checklist & Guide

## Pre-Deployment Checklist

Before deploying the AI-Powered Resume Grader application, ensure all items are completed:

### ✅ Backend Configuration
- [ ] Node.js v18+ installed
- [ ] MongoDB instance running (local or cloud)
- [ ] All `.env` variables properly configured (copy from `.env.example` and fill with real values)
- [ ] Cloudinary account created with valid API credentials
- [ ] OpenAI API key obtained for resume analysis
- [ ] JWT_SECRET set to a strong random string (min 32 characters)
- [ ] CORS origins configured for your frontend URL
- [ ] All dependencies installed: `npm install`
- [ ] Backend syntax check passed: `node -c server.js`

### ✅ Frontend Configuration
- [ ] Node.js v18+ installed
- [ ] API base URL correctly points to backend (currently `http://localhost:4000/api`)
- [ ] All dependencies installed: `npm install`
- [ ] Build process works: `npm run build`

### ✅ Database Setup
- [ ] MongoDB is accessible and running
- [ ] Database exists and is ready for schema creation
- [ ] Mongoose models are properly created

### ✅ File Upload Configuration
- [ ] Cloudinary account verified and functional
- [ ] File upload middleware (multer) properly configured
- [ ] Upload file size limits are acceptable

### ✅ Security Review
- [ ] JWT_SECRET is strong and secure
- [ ] CORS is properly configured for production domain
- [ ] Environment variables are NOT committed to git
- [ ] .env file is in .gitignore
- [ ] HTTPS is enabled for production
- [ ] API keys are stored securely (not in code)

---

## Environment Variables Setup

### Backend (.env file)

Required variables:
```
PORT=4000
MONGO_URI=<your_mongodb_connection_string>
JWT_SECRET=<your_strong_random_secret_key>
CLOUDINARY_CLOUD_NAME=<your_cloudinary_cloud_name>
CLOUDINARY_API_KEY=<your_cloudinary_api_key>
CLOUDINARY_API_SECRET=<your_cloudinary_api_secret>
OPENAI_API_KEY=<your_openai_api_key>
```

### Frontend API Configuration

Update API base URL in the following files if needed:
- `src/components/AnalysisResult.jsx`
- `src/components/EditSkills.jsx`
- `src/components/MyResumes.jsx`
- `src/components/ResumeDetail.jsx`
- `src/components/UploadResume.jsx`
- `src/store/authStore.js`

Change from:
```javascript
const BASE_URL = "http://localhost:4000/api";
```

To production URL:
```javascript
const BASE_URL = "https://your-backend-url.com/api";
```

---

## Database Setup Instructions

### Local MongoDB
1. Install MongoDB Community Edition
2. Start MongoDB service
3. Connect using: `mongodb://localhost:27017`

### MongoDB Atlas (Cloud - Recommended for Production)
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Create database credentials
4. Get connection string
5. Update `MONGO_URI` in `.env`:
```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/resume_grader?retryWrites=true&w=majority
```

---

## Deployment Steps

### Local Development

1. **Start Backend**
   ```bash
   cd backend
   npm install
   npm run dev
   ```
   Backend runs on: `http://localhost:4000`

2. **Start Frontend** (in another terminal)
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Frontend runs on: `http://localhost:5173`

3. Open browser and navigate to `http://localhost:5173`

### Production Deployment (Using Render, Vercel, or Similar)

**Backend Deployment:**

1. Choose a backend hosting service (Render, Railway, Heroku, AWS, etc.)
2. Push code to GitHub
3. Connect your GitHub repo to hosting service
4. Set environment variables in hosting dashboard
5. Deploy

**Frontend Deployment:**

1. Build the frontend:
   ```bash
   npm run build
   ```

2. Deploy to frontend hosting (Vercel, Netlify, GitHub Pages, etc.)
3. Update API URL to point to production backend
4. Deploy

---

## Post-Deployment Testing

### Essential Tests

- [ ] User registration works
- [ ] User login works
- [ ] Resume upload successful
- [ ] AI analysis generates results
- [ ] Skill editing works
- [ ] Resume history displays correctly
- [ ] User profile updates work
- [ ] Logout functionality works
- [ ] Protected routes prevent unauthorized access

### Performance Testing

- [ ] Page load times are acceptable
- [ ] API responses are fast
- [ ] No console errors in browser
- [ ] No server errors in logs
- [ ] File uploads complete successfully
- [ ] Large file uploads handled properly

### Security Testing

- [ ] CORS is working correctly
- [ ] JWT tokens are properly validated
- [ ] Unauthorized users cannot access protected routes
- [ ] Sensitive data is not exposed in logs

---

## Common Issues & Solutions

### MongoDB Connection Error
**Error**: `DB Connection Error: connect ECONNREFUSED`
- Ensure MongoDB is running
- Check MONGO_URI is correct
- For Atlas, ensure IP is whitelisted

### Cloudinary Upload Fails
**Error**: `Cloudinary upload failed`
- Verify API credentials in .env
- Check file size limits
- Ensure Cloudinary account is active

### CORS Error in Browser
**Error**: `Access to XMLHttpRequest blocked by CORS policy`
- Verify CORS origins in `server.js`
- Ensure frontend URL matches CORS origin
- Check if credentials:true is needed

### Port Already in Use
**Error**: `Error: listen EADDRINUSE: address already in use :::4000`
- Change PORT in .env
- Kill process using that port: `lsof -i :4000` (Linux/Mac) or `netstat -ano | findstr :4000` (Windows)

---

## Performance Optimization Tips

1. **Database Indexing**: Add indexes to frequently queried fields
2. **API Response Caching**: Implement caching for resume analysis results
3. **File Compression**: Compress uploaded resume files
4. **Frontend Optimization**: Use code splitting and lazy loading
5. **CDN**: Use CDN for static assets
6. **Database Optimization**: Limit results with pagination

---

## Monitoring & Maintenance

1. **Error Logging**: Implement error logging service (Sentry, LogRocket)
2. **Performance Monitoring**: Use APM tools (New Relic, DataDog)
3. **Uptime Monitoring**: Monitor API uptime (UptimeRobot, Pingdom)
4. **Regular Backups**: Backup MongoDB database regularly
5. **Security Updates**: Keep dependencies updated

---

## Support & Additional Resources

- MongoDB Documentation: https://docs.mongodb.com/
- Express.js Documentation: https://expressjs.com/
- React Documentation: https://react.dev/
- Cloudinary Documentation: https://cloudinary.com/documentation
- OpenAI API Documentation: https://platform.openai.com/docs/

---

**Last Updated**: 2026-06-08
**Project Version**: 1.0.0
