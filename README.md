# 🚀 SyncoraCall — Next-Gen Video Conferencing Platform

**SyncoraCall** is a robust, premium MERN-stack video conferencing application built to provide a seamless, low-latency communication experience. Featuring real-time signaling via Socket.io and high-quality peer-to-peer media streams with WebRTC (Simple-Peer), SyncoraCall is designed for both 1-to-1 and group collaboration.

![SyncoraCall Banner](https://img.shields.io/badge/SyncoraCall-MERN_Stack-blue?style=for-the-badge&logo=react)
![WebRTC](https://img.shields.io/badge/WebRTC-Real--Time-orange?style=for-the-badge&logo=webrtc)
![Socket.io](https://img.shields.io/badge/Socket.io-Signaling-black?style=for-the-badge&logo=socket.io)

---

## ✨ Key Features

- 👤 **Instant 1-to-1 Calls**: Direct calling with high-fidelity audio/video.
- 👥 **Group Meetings**: Seamlessly join room-based meetings for team collaboration.
- 🖥️ **HD Screen Sharing**: Share your entire screen or specific windows with peers in real-time.
- 🔒 **Secure Authentication**: JWT-based login and signup system for private user profiles.
- 📱 **Responsive & Modern UI**: A premium, mobile-first design leveraging **Tailwind CSS**, **Framer Motion**, and **Lottie Animations**.
- 🔔 **Real-Time Signaling**: Instant call notifications and user-online status tracking.
- 🔇 **Media Controls**: Integrated toggles for microphone, camera, and end-call actions.

---

## 🛠️ Technology Stack

### **Frontend**
- **React.js (Vite)** — Fast, component-based UI development.
- **Tailwind CSS** — Modern utility-first styling with Glassmorphism.
- **Simple-Peer** — Lightweight WebRTC wrapper for P2P connections.
- **Socket.io Client** — Real-time event communication.
- **Lucide Icons & React Icons** — Vibrant and consistent iconography.

### **Backend**
- **Node.js & Express.js** — Scalable and high-performance server architecture.
- **Socket.io** — Real-time signaling server.
- **MongoDB & Mongoose** — Document-oriented data storage with robust modeling.
- **JWT (JSON Web Tokens)** — Secure, stateless session management.

---

## 🏗️ Getting Started

### **Prerequisites**
- Node.js (v16+)
- MongoDB Atlas account (or local MongoDB)

### **Installation**

1. **Clone the repository:**
   ```bash
   git clone https://github.com/dharmendra4522/SyncoraCall.git
   cd SyncoraCall
   ```

2. **Backend Setup:**
   ```bash
   cd server
   npm install
   # Create a .env file and add your MONGOOSE_CONNECTION and PORT
   npm start
   ```

3. **Frontend Setup:**
   ```bash
   cd ../client
   npm install
   # Create a .env file and add your VITE_API_BASE_URL
   npm run dev
   ```

---

## 🔒 Environment Variables

To run this project, you will need to add the following environment variables to your `.env` files:

**Server (`/server/.env`):**
- `PORT`: 3000
- `MONGOOSE_CONNECTION`: Your MongoDB URI
- `JWT_SECRET`: A secure random string
- `FRONTEND_URL`: https://syncora-call.vercel.app/

**Client (`/client/.env`):**
- `VITE_API_BASE_URL`: https://syncoracall-backend.onrender.com/api/
- `VITE_API_SOCKET_URL`: https://syncoracall-backend.onrender.com

---

## 💡 System Architecture

SyncoraCall uses a hybrid architecture for maximum performance:
1. **Signaling Server**: An Express/Socket.io server handles the "handshake" between users.
2. **P2P Connection**: Once the handshake is complete, the `Simple-Peer` library establishes a direct WebRTC connection for the media stream, bypassing the server to ensure minimum latency.
3. **Room Logic**: Dynamic room IDs allow users to create and share unique meeting spaces instantly.

---

## 🎨 UI/UX Design

SyncoraCall was designed with a focus on "Premium Aesthetics":
- **Dark Mode by default** for reduced eye strain.
- **Backdrop Blurs and Gradients** for a modern glassmorphism feel.
- **Smooth Micro-animations** for improved user engagement.

---

## 📬 Contact & Support

**Dharmendra Vishwakarma**  
*Full Stack Developer*  
[LinkedIn](https://www.linkedin.com/in/dharmendra-vishvkarma-969a1924a/) | [Email](mailto:dharmendravishwakarma0711@gmail.com) | [Portfolio](https://dharmendra-vishvkarma.vercel.app/)

---

⭐ **Star this repository if you find it useful!**