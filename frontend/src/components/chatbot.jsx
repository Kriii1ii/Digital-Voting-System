import React, { useEffect, useRef, useState } from 'react';
import './chatbot.css';

export default function Chatbot(){
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesRef = useRef(null);
  const openedOnce = useRef(false);

const qa = new Map([
  // -----------------------------------------
  // Registration
  // -----------------------------------------
  ['how do i register to vote?', 
   'To register, create an account in the app, verify your ID, and complete face registration. Once approved, you can vote in active elections.'],

  ['what documents do i need?', 
   'You need a valid government ID (citizenship, license, or passport) and a working mobile number for OTP verification.'],

  ['who can register to vote?', 
   'Anyone with a valid account and verified identity can register. Age requirements and rules depend on the election settings created by admins.'],

  ['how long does registration take?', 
   'Registration is usually approved within a few minutes unless manual review is required.'],

  ['can i register multiple times?', 
   'No. One account per person is allowed. Duplicate accounts are automatically blocked.'],

  ['can i update my details?', 
   'Yes, you can update your personal information from your profile. Some fields may require verification again.'],

  // -----------------------------------------
  // Face Recognition
  // -----------------------------------------
  ['how does face recognition work?', 
   'The system compares your live camera scan with your registered face template. If it matches, you are allowed to vote.'],

  ['is face recognition mandatory?', 
   'Yes, face verification is required to ensure secure one-person-one-vote access.'],

  ['what if my face is not recognized?', 
   'Try scanning in good lighting and keep your face centered. If it still fails, you can update your face data in the app.'],

  ['can i update my face data?', 
   'Yes, you can re-register your face from your profile if you face recognition issues.'],

  // -----------------------------------------
  // About elections
  // -----------------------------------------
  ['when is the election?', 
   'Election dates are set by the admin. You can view active and upcoming elections inside the app under “Current Elections.”'],

  ['what is the voting period?', 
   'The voting period is decided by the admin. You can vote anytime during the active period. Once it closes, no votes can be cast.'],

  ['can i vote after the election ends?', 
   'No. Votes are accepted only during the active election period.'],

  // -----------------------------------------
  // Winner Prediction
  // -----------------------------------------
  ['when does winner prediction close?', 
   'Winner prediction closes 3 days before the main election begins. After that, predictions cannot be submitted or changed.'],

  ['can i change my prediction?', 
   'Yes, you can change your prediction anytime before the prediction deadline. After it closes, predictions are locked.'],

  // -----------------------------------------
  // Voting Process
  // -----------------------------------------
  ['how do I vote?', 
   'During the election period, open the app, complete face verification, choose your candidate, and submit your vote.'],

  ['is my vote anonymous?', 
   'Yes. Your identity is verified only for eligibility. The final vote is stored anonymously and cannot be linked back to you.'],

  ['can i vote from anywhere?', 
   'Yes. You can vote from any device with internet access unless the admin has set location restrictions.'],

  ['can i change my vote later?', 
   'No. Once submitted, votes cannot be altered.'],

  ['how many times can i vote?', 
   'Only once per election. The system blocks duplicate voting attempts.'],

  // -----------------------------------------
  // Vote Counting & Results
  // -----------------------------------------
  ['how are votes counted?', 
   'Votes are counted automatically by the system when the election ends. Results are calculated instantly.'],

  ['when are results announced?', 
   'Results are visible immediately after the election closes unless the admin has enabled delayed result mode.'],

  ['can i check if my vote was counted?', 
   'Yes. You receive a confirmation token after voting, which you can use to verify that your vote was recorded.'],

  // -----------------------------------------
  // Security
  // -----------------------------------------
  ['is digital voting secure?', 
   'Yes. Our system uses encryption, secure authentication, and biometric verification to protect your vote.'],

  ['how is my data protected?', 
   'All personal data and face templates are encrypted and stored securely. Raw photos are never saved.'],

  ['what if someone tries to vote using my account?', 
   'They cannot vote without completing face verification, which ensures only you can cast your vote.'],

  // -----------------------------------------
  // App & Technical Issues
  // -----------------------------------------
  ['what if the app crashes?', 
   'Restart the app and log in again. If the crash happened before submitting your vote, you can still vote.'],

  ['what if internet fails during voting?', 
   'If your vote was not submitted, you can retry once your connection stabilizes. If it was submitted, it is already counted.'],

  ['why am i not seeing the election?', 
   'You might not be eligible, or the election has not started yet. Check the Elections tab for details.'],

  ['how to report a problem?', 
   'Use the “Help & Support” section in the app to contact support.'],

  // -----------------------------------------
  // Prediction & Extra Features
  // -----------------------------------------
  ['what is winner prediction?', 
   'Winner prediction allows users to guess the winning candidate before the election begins. This feature closes 3 days before voting starts.'],

  ['is prediction required?', 
   'No. It is optional and purely for engagement. It does not affect the real election.'],

  ['can i see other users’ predictions?', 
   'No. Predictions remain private until the election ends.'],

  // -----------------------------------------
  // Eligibility & Rules
  // -----------------------------------------
  ['who is eligible to vote?', 
   'Anyone with a verified account and who is marked eligible by the admin for that specific election.'],

  ['why am i not eligible to vote?', 
   'You may not meet election criteria or your registration is pending approval. Check your profile for status.'],

  ['can i participate in multiple elections?', 
   'Yes, as long as you are eligible for each election.'],

  // -----------------------------------------
  // Misc
  // -----------------------------------------
  ['what is this app for?', 
   'This is a digital voting platform that allows users to register, authenticate using face recognition, predict winners, and vote securely.'],

  ['is this an official government system?', 
   'No. This is a private digital voting system created for projects, demos, or organizational use—not an official government platform.']
]);


  useEffect(()=>{
    // keep scrolled to bottom
    if(messagesRef.current){
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  },[messages, open]);

  function showWelcome(){
    if(!openedOnce.current){
      setMessages(prev => [...prev, {who:'bot', text: "Namaste! I am your voting assistant. You can ask how to register, what documents you need, when the election is, or about voting security."}]);
      openedOnce.current = true;
    }
  }

  function handleSend(){
    const val = input.trim();
    if(!val) return;
    setMessages(prev => [...prev, {who:'user', text: val}]);
    setInput('');
    replyTo(val);
  }

  function replyTo(raw){
    const key = raw.trim().toLowerCase();
    // exact match
    if(qa.has(key)){
      setTimeout(()=> setMessages(prev => [...prev, {who:'bot', text: qa.get(key)}]), 300);
      return;
    }

    // keyword checks
    if(key.includes('register')){
      setTimeout(()=> setMessages(prev => [...prev, {who:'bot', text: qa.get('how do i register to vote')}]), 300);
      return;
    }
    if(key.includes('document') || key.includes('id') || key.includes('paper')){
      setTimeout(()=> setMessages(prev => [...prev, {who:'bot', text: qa.get('what documents do i need')}]), 300);
      return;
    }
    if(key.includes('when') && key.includes('election')){
      setTimeout(()=> setMessages(prev => [...prev, {who:'bot', text: qa.get('when is the election?')}]), 300);
      return;
    }
    if(key.includes('online') && key.includes('vote')){
      setTimeout(()=> setMessages(prev => [...prev, {who:'bot', text: qa.get('how does online voting work?')}]), 300);
      return;
    }
    if(key.includes('secure') || key.includes('safety')){
      setTimeout(()=> setMessages(prev => [...prev, {who:'bot', text: qa.get('is my vote secure?')}]), 300);
      return;
    }

    setTimeout(()=> setMessages(prev => [...prev, {who:'bot', text: "Sorry, I don't have that exact answer yet. Try asking about registration, documents, election dates, online voting, or vote security."}]), 300);
  }

  function toggle(){
    const next = !open;
    setOpen(next);
    if(next) showWelcome();
  }

  return (
    <div className="vchat-theme">
      <button className="vchat-toggle" aria-label="Open chat" onClick={toggle}>
        <span className="vchat-icon" aria-hidden>
          <span className="vchat-bubble" aria-hidden>
            <span className="vchat-dots" aria-hidden>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </span>
        </span>
      </button>

      <aside className={`vchat-window ${open ? 'open' : 'closed'}`} aria-hidden={!open}>
        <header className="vchat-header">
          <div className="vchat-header-left">
            <div className="vchat-avatar">N</div>
            <div>
              <div className="vchat-title">Ask NayaMat</div>
            </div>
          </div>
          <button className="vchat-close" aria-label="Close chat" onClick={() => setOpen(false)}>✕</button>
        </header>

        <div className="vchat-messages" ref={messagesRef} role="log" aria-live="polite">
          {messages.map((m, i) => (
            <div key={i} className={`vchat-message ${m.who === 'user' ? 'vchat-user' : 'vchat-bot'}`}>
              {m.text}
            </div>
          ))}
        </div>

        <div className="vchat-form">
          <button className="vchat-plus" aria-hidden>+</button>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();handleSend();}}} placeholder="Ask away...." />
          <button className="vchat-send" onClick={handleSend} aria-label="Send message">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 21L23 12L2 3V10L17 12L2 14V21Z" fill="currentColor" />
            </svg>
          </button>
        </div>
      </aside>
    </div>
  );
}
