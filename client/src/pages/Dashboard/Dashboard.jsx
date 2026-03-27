import React, { useEffect, useRef, useState, useCallback } from 'react';
import socketInstance from '../components/socketio/VideoCallSocket';
import { FaPhoneAlt, FaPhoneSlash, FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaBars, FaTimes, FaDesktop, FaShieldAlt } from 'react-icons/fa';
import Lottie from "lottie-react";
import { Howl } from "howler";
import wavingAnimation from "../../assets/waving.json";

import apiClient from "../../apiClient";
import { useUser } from '../../context/UserContextApi';
import { RiLogoutBoxLine } from "react-icons/ri";
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Peer from 'simple-peer';

const VideoParticipant = React.memo((props) => {
  const ref = useRef();
  useEffect(() => {
    if (props.peer) {
      const handleStream = (stream) => {
        if (ref.current) {
          ref.current.srcObject = stream;
        }
      };
      props.peer.on("stream", handleStream);
      
      // If the peer already has streams, use the first one
      if (props.peer.streams && props.peer.streams[0]) {
        handleStream(props.peer.streams[0]);
      }
      
      return () => {
        props.peer.off("stream", handleStream);
      };
    }
  }, [props.peer]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <video 
        playsInline 
        autoPlay 
        ref={ref} 
        className="w-full h-full object-cover rounded-3xl border-2 border-slate-800 bg-slate-900" 
      />
      <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] md:text-xs font-bold text-white z-10">
        {props.username || "Participant"}
      </div>
    </div>
  );
});
VideoParticipant.displayName = 'VideoParticipant';

const Dashboard = () => {
  const { user, updateUser } = useUser();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [userOnline, setUserOnline] = useState([]);
  const [stream, setStream] = useState(null);
  const [showUserDetailModal, setShowUserDetailModal] = useState(false);
  const [modalUser, setModalUser] = useState(null);
  const myVideo = useRef(null);
  const receiverVideo = useRef(null);
  const connectionRef = useRef(null);
  const hasJoined = useRef(false);
  const ringtoneRef = useRef(null);
  const screenStreamRef = useRef(null);
  const peersRef = useRef([]);

  const [callAccepted, setCallAccepted] = useState(false);
  const [reciveCall, setReciveCall] = useState(false);
  const [caller, setCaller] = useState(null);
  const [callerName, setCallerName] = useState("");
  const [callerWaiting, setCallerWaiting] = useState(false);

  // 🔹 State to track microphone & video status
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [peers, setPeers] = useState([]);
  const [roomID, setRoomID] = useState("");

  const socket = socketInstance.getSocket();

  // 🔥 Load ringtone
  useEffect(() => {
    ringtoneRef.current = new Howl({
      src: ["/ringtone.mp3"],
      loop: false,
      volume: 1.0,
    });
    return () => {
      ringtoneRef.current?.stop();
    };
  }, []);

  const allusers = useCallback(async () => {
    if (user?.isGuest) {
      setUsers([]);
      return;
    }
    setLoading(true);
    try {
      const response = await apiClient.get('user');
      if (response.data.success !== false) {
        const sanitizedUsers = response.data.users.map(u => ({
          ...u,
          profilepic: (!u.profilepic || u.profilepic.includes("liara"))
            ? `https://api.dicebear.com/7.x/adventurer/svg?seed=${u.username || 'user'}`
            : u.profilepic
        }));
        setUsers(sanitizedUsers);
      }
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setLoading(false);
    }
  }, [user?.isGuest]);

  const endCallCleanup = useCallback(() => {
    console.log("🔴 Cleaning up call...");
    // Release tracks
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
        screenStreamRef.current = null;
    }
    setIsScreenSharing(false);
    
    // Clear refs
    if (receiverVideo.current) receiverVideo.current.srcObject = null;
    if (myVideo.current) myVideo.current.srcObject = null;
    
    connectionRef.current?.destroy();
    connectionRef.current = null;
    
    peersRef.current.forEach(({ peer }) => {
        if (peer.destroy) peer.destroy();
    });
    peersRef.current = [];
    
    // Reset states
    ringtoneRef.current?.stop();
    setCallerWaiting(false);
    setStream(null); 
    setReciveCall(false); 
    setCallAccepted(false); 
    setSelectedUser(null); 
    setCaller("");
    setCallerName("");
    setPeers([]);
    setRoomID("");
  }, [stream]);

  // 🛡 STUN/TURN Configuration for better connectivity
  const peerConfig = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
      { urls: "stun:stun3.l.google.com:19302" },
      { urls: "stun:stun4.l.google.com:19302" },
    ],
  };

  const createPeer = useCallback((userToSignal, callerID, currentStream) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      config: peerConfig,
      stream: currentStream,
    });

    peer.on("signal", (signal) => {
      socket.emit("sending-signal", {
        userToSignal,
        callerID,
        signal,
        username: user?.username,
        profilepic: user?.profilepic
      });
    });

    return peer;
  }, [socket, user?.username, user?.profilepic]);

  const addPeer = useCallback((incomingSignal, callerID, currentStream) => {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      config: peerConfig,
      stream: currentStream,
    });

    peer.on("signal", (signal) => {
      socket.emit("returning-signal", { signal, callerID });
    });

    peer.signal(incomingSignal);

    return peer;
  }, [socket]);

  // 🎥 Sync local video stream to the video element
  useEffect(() => {
    if (stream && myVideo.current) {
      myVideo.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    if (user && socket && !hasJoined.current) {
      socket.emit("join", { id: user._id, name: user.username, profilepic: user.profilepic });
      hasJoined.current = true;
    }

    if (socket) {
        socket.on("me", () => { /* Ignore for now */ });
      if (socket.id) { /* Ignore for now */ }

      socket.on("all-users", (roomUsers) => {
        console.log("Joined room, users present:", roomUsers);
        const newPeers = [];
        roomUsers.forEach((userData) => {
          // 🛡 Filter out own socket ID just in case
          if (userData.id === socket.id) return;
          
          const peer = createPeer(userData.id, socket.id, stream);
          peersRef.current.push({ peerID: userData.id, peer });
          newPeers.push({
            peerID: userData.id,
            peer,
            username: userData.username,
            profilepic: userData.profilepic
          });
        });
        setPeers(newPeers);
      });

      socket.on("user-joined", (payload) => {
        console.log("New user joining our room:", payload.callerID);
        // 🛡 Avoid self-connection
        if (payload.callerID === socket.id) return;

        const peer = addPeer(payload.signal, payload.callerID, stream);
        peersRef.current.push({ peerID: payload.callerID, peer });
        const newPeerObj = {
          peerID: payload.callerID,
          peer,
          username: payload.username,
          profilepic: payload.profilepic
        };
        setPeers(prev => [...prev, newPeerObj]);
      });

      socket.on("receiving-returned-signal", (payload) => {
        const item = peersRef.current.find(p => p.peerID === payload.id);
        if (item) item.peer.signal(payload.signal);
      });

      socket.on("online-users", (onlineUsers) => setUserOnline(onlineUsers));
      
      socket.on("callToUser", (data) => {
        setReciveCall(true);
        setCaller(data);
        setCallerName(data.name);
        ringtoneRef.current?.play();
      });

      socket.on("callEnded", () => {
        toast.info("Call ended");
        endCallCleanup();
      });

      socket.on("callRejected", (data) => {
        setCallerWaiting(false);
        toast.error(`${data.name} rejected the call`);
        endCallCleanup();
      });

      socket.on("room-full", () => {
        toast.error("Room is full!");
      });
    }

    return () => {
      if (socket) {
        socket.off("me");
        socket.off("all-users");
        socket.off("user-joined");
        socket.off("receiving-returned-signal");
        socket.off("online-users");
        socket.off("callToUser");
        socket.off("callEnded");
        socket.off("callRejected");
        socket.off("room-full");
      }
    };
  }, [user, socket, stream, endCallCleanup, createPeer, addPeer]);

  const joinMeeting = async (customRoomID = null) => {
    if (stream) {
        // If already in a meeting or stream exists, don't re-init stream to avoid abort error
        socket.emit("join-room", customRoomID || roomID);
        setCallAccepted(true);
        return;
    }
    try {
      const roomToJoin = customRoomID || roomID || Math.random().toString(36).substring(7);
      
      // 📱 Constrain video resolution for better mobile performance
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const videoConstraints = isMobile 
        ? { 
            width: { ideal: 480 }, 
            height: { ideal: 360 }, 
            frameRate: { max: 24 },
            facingMode: "user"
          } 
        : { 
            width: { ideal: 1280 }, 
            height: { ideal: 720 },
            facingMode: "user"
          };

      const currentStream = await navigator.mediaDevices.getUserMedia({ 
        video: videoConstraints, 
        audio: true 
      });

      setStream(currentStream);
      setCallAccepted(true);
      setRoomID(roomToJoin);
      setIsSidebarOpen(false);
      socket.emit("join-room", roomToJoin);
      toast.success("Joined Meeting: " + roomToJoin);
    } catch (err) {
      console.error("Media access error:", err);
      toast.error("Could not access camera/microphone. Please ensure permissions are granted.");
    }
  };

  const handleAcceptCall = () => {
    ringtoneRef.current?.stop();
    joinMeeting(caller.from);
  };

  const handleRejectCall = () => {
    ringtoneRef.current?.stop();
    setReciveCall(false);
    socket.emit("reject-call", { to: caller?.from, name: user.username });
  };

  const handleEndCall = () => {
    ringtoneRef.current?.stop();
    socket.emit("call-ended", { to: caller?.from || selectedUser, name: user.username });
    endCallCleanup();
  };

  const toggleMic = () => {
    if (stream) {
      const track = stream.getAudioTracks()[0];
      if (track) {
        track.enabled = !isMicOn;
        setIsMicOn(track.enabled);
      }
    }
  };
  
  // Wait, I used getFocus(0) by accident in my thought. Corrected below.

  const toggleCam = () => {
    if (stream) {
      const track = stream.getVideoTracks()[0];
      if (track) {
        track.enabled = !isCamOn;
        setIsCamOn(track.enabled);
      }
    }
  };

  const toggleScreenShare = () => {
    if (!navigator.mediaDevices.getDisplayMedia) {
      toast.error("Screen sharing is not supported on this device/browser");
      return;
    }
    if (!isScreenSharing) {
      navigator.mediaDevices.getDisplayMedia({ cursor: true }).then((screenStream) => {
        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getTracks()[0];

        // Update local video to show what I'm sharing
        if (myVideo.current) {
          myVideo.current.srcObject = screenStream;
        }

        peersRef.current.forEach(({ peer }) => {
            const videoTrack = stream?.getVideoTracks()[0];
            if (videoTrack && screenTrack) {
                peer.replaceTrack(videoTrack, screenTrack, stream);
            }
        });
        screenTrack.onended = () => stopScreenShare();
        setIsScreenSharing(true);
        toast.success("Screen Sharing Started");
      }).catch(() => toast.error("Screen sharing failed"));
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    setIsScreenSharing(false);
    if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
        screenStreamRef.current = null;
    }
    if (myVideo.current && stream) {
        myVideo.current.srcObject = stream;
    }

    if (stream) {
        const camTrack = stream.getVideoTracks()[0];
        peersRef.current.forEach(({ peer }) => {
            const currentTrack = peer.streams[0]?.getVideoTracks()[0];
            if (currentTrack && camTrack) {
                peer.replaceTrack(currentTrack, camTrack, stream);
            }
        });
    }
  };

  useEffect(() => { allusers(); }, [allusers]);

  const isOnlineUser = (userId) => userOnline.some((u) => u.userId === userId);

  const handleSelectedUser = (userId) => {
    if (callAccepted || reciveCall) {
      toast.error("Please end the current call first.");
      return;
    }
    const selected = users.find(u => u._id === userId);
    setModalUser(selected);
    setShowUserDetailModal(true);
  };

  const filteredUsers = (users || []).filter((u) =>
    (u?.username || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u?.email || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLogout = async () => {
    try {
      await apiClient.post('auth/logout');
      socket?.disconnect();
      socketInstance.setSocket();
      updateUser(null);
      localStorage.removeItem("userData");
      navigate('/login');
    } catch (error) { console.error(error); }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-white font-sans">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-10 md:hidden bg-black/50 backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`bg-slate-900 border-r border-slate-800 w-72 h-screen p-6 flex flex-col fixed z-20 transition-transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-black bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">Syncora<span className="text-white">Call</span></h1>
          <button
            type="button"
            className="text-white hover:text-red-500 transition-colors"
            onClick={() => setIsSidebarOpen(false)}
          >
            <FaTimes />
          </button>
        </div>

        {/* 🎬 Meeting Actions */}
        <div className="space-y-4 mb-8">
           <button 
             onClick={() => joinMeeting()}
             className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-black text-sm transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-2"
           >
             <FaVideo /> New Meeting
           </button>
           <div className="flex gap-2">
             <input 
               type="text" 
               placeholder="Enter Meeting ID" 
               value={roomID}
               onChange={(e) => setRoomID(e.target.value)}
               className="bg-slate-800 border-slate-700 border rounded-xl p-3 text-xs flex-1 focus:ring-1 focus:ring-blue-500 outline-none placeholder:text-slate-500"
             />
             <button 
               onClick={() => joinMeeting()}
               className="bg-slate-800 hover:bg-slate-700 px-4 rounded-xl text-xs font-bold border border-slate-700 transition-colors"
             >
               Join
             </button>
           </div>
        </div>

        {!user?.isGuest && (
          <>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Contacts</div>
            
            {/* Search */}
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 text-white border border-slate-700 focus:border-blue-500 outline-none text-sm"
              />
            </div>

            {/* User List */}
            <ul className="flex-1 space-y-2 overflow-y-auto custom-scrollbar">
              {loading && <p className="text-center text-sm text-gray-500 animate-pulse">Loading...</p>}
              {!loading && filteredUsers.length === 0 && <p className="text-center text-sm text-gray-500">No contacts</p>}
              {filteredUsers.map((userItem) => (
                <li
                  key={userItem._id}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${selectedUser === userItem._id
                    ? "bg-blue-600 shadow-lg shadow-blue-600/20"
                    : "bg-slate-800/50 hover:bg-slate-800 border border-transparent hover:border-slate-700"
                    }`}
                  onClick={() => handleSelectedUser(userItem._id)}
                >
                  <div className="relative">
                    <img
                      src={userItem.profilepic || "https://api.dicebear.com/7.x/adventurer/svg?seed=user"}
                      alt="Avatar"
                      className="w-10 h-10 rounded-full border-2 border-slate-900"
                    />
                    {isOnlineUser(userItem._id) && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full shadow-lg"></span>
                    )}
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-bold text-sm truncate">{userItem.username}</span>
                    <span className="text-[10px] text-slate-500 truncate">{userItem.email}</span>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
        
        {user?.isGuest && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="bg-blue-600/10 p-6 rounded-3xl mb-4">
              <FaShieldAlt className="text-blue-500 text-3xl mx-auto" />
            </div>
            <p className="text-slate-400 text-sm font-medium">Guest Mode</p>
            <p className="text-slate-600 text-[10px] mt-2 leading-relaxed">Login to save contacts and use direct calling features.</p>
          </div>
        )}

        {/* Logout */}
        {user && <button
          onClick={handleLogout}
          className="mt-4 flex items-center justify-center gap-2 bg-slate-800 hover:bg-red-900/40 hover:text-red-400 hover:border-red-900/50 border border-slate-700 px-4 py-3 cursor-pointer rounded-xl transition-all font-bold text-sm"
        >
          <RiLogoutBoxLine />
          Sign Out
        </button>}
      </aside>

      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300 ${isSidebarOpen ? "md:ml-72" : "ml-0"}`}>
        {selectedUser || reciveCall || callAccepted ? (
          <div className="relative flex-1 bg-slate-950 p-4 overflow-hidden">
            {/* Participant Grid */}
            <div className={`grid gap-4 w-full h-full ${
                peers.length === 0 ? "grid-cols-1" :
                peers.length === 1 ? "grid-cols-1" :
                peers.length === 2 ? "grid-cols-1 md:grid-cols-2" :
                peers.length <= 4 ? "grid-cols-2" : "grid-cols-2 md:grid-cols-3"
            }`}>
              {/* Local Participant (Responsive PiP) */}
              <div className={`${
                peers.length === 1 
                ? "fixed bottom-32 right-6 w-32 h-44 md:w-64 md:h-80 z-[80] shadow-3xl transform transition-all duration-500" 
                : "relative w-full h-full"
              } group`}>
                <video 
                  playsInline 
                  ref={myVideo} 
                  autoPlay 
                  muted 
                  className="w-full h-full object-cover rounded-3xl border-2 border-blue-600 shadow-2xl" 
                  style={{ transform: 'scaleX(-1)' }}
                />
                <div className="absolute bottom-4 left-4 bg-blue-600 px-3 py-1 rounded-full text-[10px] font-black shadow-lg">You</div>
              </div>

              {/* Remote Participants */}
              {peers.map((peerObj) => (
                <div key={peerObj.peerID} className="w-full h-full peer-video-container">
                    <VideoParticipant peer={peerObj.peer} username={peerObj.username} />
                </div>
              ))}
              
              {/* Waiting UI for Direct Calls */}
              {callerWaiting && peers.length === 0 && (
                 <div className="flex flex-col items-center justify-center space-y-6">
                    <div className="p-1 rounded-full border-4 border-dashed border-blue-500 animate-spin-slow">
                        <img src={modalUser?.profilepic} className="w-32 h-32 rounded-full" />
                    </div>
                    <div className="text-center">
                        <h2 className="text-2xl font-black">Calling {modalUser?.username}...</h2>
                        <p className="text-slate-500">Wait for them to join the meeting</p>
                    </div>
                 </div>
              )}
            </div>

            {/* Floating Top Controls (Sidebar Toggle & Meeting ID) */}
            <div className="absolute top-6 left-6 flex items-center gap-4 z-[60]">
               <button onClick={() => setIsSidebarOpen(true)} className={`bg-slate-800 p-3 rounded-xl shadow-xl hover:bg-slate-700 transition-all ${isSidebarOpen ? "hidden" : "flex"}`}>
                  <FaBars />
               </button>
               {roomID && <div className="bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-bold border border-slate-700 text-blue-400 shadow-xl">Meeting ID: {roomID}</div>}
            </div>

            {/* Bottom Floating Toolbar */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-slate-900/90 backdrop-blur-2xl px-8 py-5 rounded-[2.5rem] border border-slate-800 shadow-2xl z-[100] min-w-max">
              <button onClick={toggleMic} className={`p-4 rounded-2xl transition-all active:scale-95 ${isMicOn ? "bg-slate-800 hover:bg-slate-700 text-white" : "bg-red-600 text-white shadow-lg shadow-red-600/30"}`}>
                {isMicOn ? <FaMicrophone size={22} /> : <FaMicrophoneSlash size={22} />}
              </button>
              
              <button onClick={toggleCam} className={`p-4 rounded-2xl transition-all active:scale-95 ${isCamOn ? "bg-slate-800 hover:bg-slate-700 text-white" : "bg-red-600 text-white shadow-lg shadow-red-600/30"}`}>
                {isCamOn ? <FaVideo size={22} /> : <FaVideoSlash size={22} />}
              </button>
 
              <button onClick={toggleScreenShare} className={`p-4 rounded-2xl transition-all active:scale-95 ${isScreenSharing ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30" : "bg-slate-800 hover:bg-slate-700 text-slate-400"}`}>
                <FaDesktop size={22} />
              </button>
 
              <div className="w-[1px] h-10 bg-slate-800 mx-2"></div>
 
              <button onClick={handleEndCall} className="bg-red-600 hover:bg-red-500 p-4 rounded-2xl text-white shadow-lg shadow-red-600/30 transition-all active:scale-95">
                <FaPhoneSlash size={22} />
              </button>
            </div>
          </div>
        ) : (
          /* Empty Dashboard State (Welcome Interface) */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-950 relative">
             <button onClick={() => setIsSidebarOpen(true)} className={`absolute top-6 left-6 bg-slate-800 p-3 rounded-xl shadow-xl hover:bg-slate-700 transition-all ${isSidebarOpen ? "hidden" : "flex"}`}>
                <FaBars />
             </button>
             <div className="w-64 h-64 mb-10 transform scale-125">
                <Lottie animationData={wavingAnimation} />
             </div>
             <h1 className="text-6xl font-black mb-4 tracking-tighter">
                Hello, <span className="bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text italic text-wrap">{user?.username}</span>
                {user?.isGuest && <span className="ml-4 text-xs bg-slate-800 text-slate-400 px-3 py-1 rounded-full align-middle font-bold tracking-widest border border-slate-700">GUEST</span>}
             </h1>
             <p className="text-xl text-slate-500 max-w-lg leading-relaxed">
                Connect with anyone instantly. Use the sidebar to find a contact or start a new group meeting.
             </p>
             
             <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl hover:border-blue-500/30 transition-all text-left group">
                   <div className="bg-blue-600/20 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 text-blue-500 group-hover:scale-110 transition-transform"><FaVideo size={24} /></div>
                   <h3 className="text-xl font-bold mb-2">Instant Meetings</h3>
                   <p className="text-slate-500 text-sm">Create a secure room and share the ID with your team for a quick sync-up.</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl hover:border-purple-500/30 transition-all text-left group">
                   <div className="bg-purple-600/20 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 text-purple-500 group-hover:scale-110 transition-transform"><FaShieldAlt size={24} /></div>
                   <h3 className="text-xl font-bold mb-2">Secure Connection</h3>
                   <p className="text-slate-500 text-sm">Every meeting is unique and private. Your data is always protected.</p>
                </div>
             </div>
          </div>
        )}
      </main>

      {/* Single User Detail & Calling Modal */}
      {showUserDetailModal && modalUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-3xl max-w-sm w-full p-8 text-center overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-blue-600/20 to-transparent"></div>
            <img
                src={modalUser.profilepic || "https://api.dicebear.com/7.x/adventurer/svg?seed=user"}
                alt="Profile"
                className="w-32 h-32 rounded-[2rem] border-4 border-slate-900 shadow-2xl relative mx-auto mb-6"
            />
            <h3 className="text-2xl font-black mb-1">{modalUser.username}</h3>
            <p className="text-slate-500 text-sm mb-8">{modalUser.email}</p>

            <div className="grid grid-cols-2 gap-4">
                <button
                    onClick={() => {
                        setSelectedUser(modalUser._id);
                        joinMeeting(modalUser._id); // Joins a private room with user ID
                        setShowUserDetailModal(false);
                    }}
                    className="bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-600/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                    <FaPhoneAlt /> Call
                </button>
                <button
                    onClick={() => setShowUserDetailModal(false)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-4 rounded-2xl font-bold transition-all border border-slate-700"
                >
                    Cancel
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Incoming Call Overlay */}
      {reciveCall && !callAccepted && (
        <div className="fixed inset-0 bg-blue-950/80 backdrop-blur-xl flex items-center justify-center z-[100] p-4 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent animate-pulse"></div>
          <div className="bg-slate-900 border border-slate-800 rounded-[3rem] shadow-4xl max-w-md w-full p-10 text-center relative pointer-events-auto">
            <div className="inline-block relative mb-8">
                <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-25"></div>
                <img
                    src={caller?.profilepic || "https://api.dicebear.com/7.x/adventurer/svg?seed=user"}
                    alt="Caller"
                    className="w-40 h-40 rounded-full border-4 border-blue-500 shadow-2xl relative z-10"
                />
            </div>
            <h2 className="text-4xl font-black mb-2">{callerName}</h2>
            <p className="text-blue-400 font-bold uppercase tracking-widest text-xs mb-10 animate-pulse">Incoming Video Call...</p>
            
            <div className="flex gap-6">
                <button
                    type="button"
                    onClick={handleAcceptCall}
                    className="flex-1 bg-green-600 hover:bg-green-500 text-white py-5 rounded-[2rem] font-black text-lg shadow-xl shadow-green-600/30 transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                    <div className="bg-white/20 p-2 rounded-full"><FaPhoneAlt size={18} /></div> Accept
                </button>
                <button
                    type="button"
                    onClick={handleRejectCall}
                    className="flex-1 bg-red-600 hover:bg-red-500 text-white py-5 rounded-[2rem] font-black text-lg shadow-xl shadow-red-600/30 transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                    <div className="bg-white/20 p-2 rounded-full"><FaPhoneSlash size={18} /></div> Reject
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;