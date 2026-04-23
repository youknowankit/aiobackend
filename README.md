# AIO Backend

A scalable MERN backend application featuring authentication, authorization, session management, OTP password recovery, email verification, profile management, Cloudinary image uploads, cart functionality, and product management.

---

# Tech Stack

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- bcryptjs
- Nodemailer
- Multer
- Cloudinary

---

# Features

## Authentication & Authorization

- User Registration
- User Login & Logout
- JWT-based Authentication
- Access Token Generation
- Refresh Token Generation
- Protected Routes using Middleware
- Role-Based Access Control (Admin/User)
- Authentication Middleware (`isAuthenticated`)
- Admin Authorization Middleware (`isAdmin`)

---

## Email Verification System

- Email Verification after Registration
- Verification Link using JWT Token
- Verification Token Expiry Handling
- Re-send Verification Email

---

## Password Recovery System

- Forgot Password Functionality
- OTP Generation for Password Reset
- OTP Verification
- OTP Expiry Validation
- Password Reset / Change Password Feature

---

## User Management

- Get User by ID
- Get All Users (Admin Only)
- Update User Profile
- User Verification Status Tracking
- Login Status Tracking

---

## Profile Management

- Profile Picture Upload
- Profile Picture Update
- Cloudinary Image Storage Integration
- Previous Image Cleanup from Cloudinary

---

## Product Features

- Product Creation
- Product Fetching
- Product Management APIs

---

## Cart Features

- Add to Cart
- Remove from Cart
- Cart Management APIs

---

## Security Features

- Password Hashing using bcryptjs
- JWT Token Verification
- Protected API Endpoints
- Role Validation
- Session Management using MongoDB
- Invalid Token Handling
- Expired Token Handling

---

## File Upload Features

- Single File Upload Support
- Multiple File Upload Support
- Multer Memory Storage Configuration

---

## Database Features

- MongoDB Integration with Mongoose
- User Schema & Session Schema
- MongoDB Relationships using ObjectId References
- Timestamps for Database Records

---

## Email Services

- HTML Email Templates
- OTP Email Service
- Email Verification Service
- Nodemailer Integration with Gmail SMTP

---

# Folder Structure

```bash
backend/
│
├── controllers/
├── database/
├── email/
├── middleware/
├── models/
├── routes/
├── utils/
├── server.js
└── package.json
```

---

# Environment Variables

Create a `.env` file in the root directory.

```env
PORT=8000

MONGO_URI=your_mongodb_uri

SECRET_KEY=your_jwt_secret

MAIL_USER=your_email
MAIL_PASS=your_email_password

CLIENT_URL=http://localhost:5173

CLOUD_NAME=your_cloudinary_cloud_name
API_KEY=your_cloudinary_api_key
API_SECRET=your_cloudinary_api_secret

APP_NAME=AIO
```

---

# Installation

## Clone Repository

```bash
git clone <repository-url>
```

---

## Install Dependencies

```bash
npm install
```

---

## Start Development Server

```bash
npm run server
```

---

# API Base URL

```bash
http://localhost:8000/api/v1
```

---

# Future Improvements

- HTTP-only Cookie Authentication
- Refresh Token Rotation
- Google OAuth Authentication
- GitHub OAuth Authentication
- Two-Factor Authentication (2FA)
- Device & Session Management
- Rate Limiting
- Account Locking on Multiple Failed Attempts
- Order Management System
- Payment Gateway Integration
- Wishlist Functionality
- Product Reviews & Ratings
- Admin Dashboard

---

# Author

Developed using the MERN Stack.
