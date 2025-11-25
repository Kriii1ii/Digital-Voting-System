import React, { useEffect, useRef, useState } from 'react';
import './chatbot.css';

export default function Chatbot(){
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesRef = useRef(null);
  const openedOnce = useRef(false);

const qa = new Map([
  ['how do i register to vote?', 'You can register for digital voting through the Election Commission Nepal website (election.gov.np) or visit your local ward office. For digital voting, you will need to complete both document verification and facial registration.'],
['how do i register to vote', 'You can register for digital voting through the Election Commission Nepal website (election.gov.np) or visit your local ward office. For digital voting, you will need to complete both document verification and facial registration.'],
['what documents do i need?', 'For digital voting in Nepal, you need your Citizenship Certificate and a registered mobile number. During face registration, you will also need to provide biometric data at designated centers.'],
['what documents do i need', 'For digital voting in Nepal, you need your Citizenship Certificate and a registered mobile number. During face registration, you will also need to provide biometric data at designated centers.'],
['when is the election?', 'Election dates in Nepal are announced by the Election Commission. You can check the official schedule at election.gov.np or through the NayaMat voting app. Digital voting periods are the same as traditional voting.'],
['how does online voting work?', 'Nepal\'s digital voting system uses secure authentication with face recognition. After verification, you can cast your vote through authorized digital platforms. The system ensures your vote is encrypted and anonymous.'],
['is my vote secure?', 'Yes! Our digital voting system uses end-to-end encryption, blockchain technology, and facial recognition to ensure complete security. Your vote remains anonymous and cannot be traced back to you.']
  ,
  // Nepal-specific questions (matched format)
  ['where can i register to vote in nepal?', 'You can register at your local Ward Office, Election Commission Nepal offices, or designated voter registration centers. Online pre-registration is also available through the Election Commission of Nepal website.'],
  ['where can i register to vote in nepal', 'You can register at your local Ward Office, Election Commission Nepal offices, or designated voter registration centers. Online pre-registration is also available through the Election Commission of Nepal website.'],
  ['what documents needed for voting in nepal?', 'For Nepal: Citizenship Certificate or valid passport, and recent photo. If using face recognition, you need to complete biometric registration first at your local election office.'],
  ['what documents needed for voting in nepal', 'For Nepal: Citizenship Certificate or valid passport, and recent photo. If using face recognition, you need to complete biometric registration first at your local election office.'],
  ['voting age in nepal?', 'The voting age in Nepal is 18 years. You must be a Nepali citizen and registered in the voter list of your constituency.'],
  ['voting age in nepal', 'The voting age in Nepal is 18 years. You must be a Nepali citizen and registered in the voter list of your constituency.'],
  ['election commission nepal contact?', 'Election Commission Nepal: Phone: 01-4780200, Website: www.election.gov.np, Email: info@election.gov.np. Office located in Kantipath, Kathmandu.'],
  ['election commission nepal contact', 'Election Commission Nepal: Phone: 01-4780200, Website: www.election.gov.np, Email: info@election.gov.np. Office located in Kantipath, Kathmandu.'],
  ['when is next election in nepal?', 'Election dates are announced by the Election Commission. Check www.election.gov.np for the latest schedule. Typically, local elections happen every 5 years.'],
  ['when is next election in nepal', 'Election dates are announced by the Election Commission. Check www.election.gov.np for the latest schedule. Typically, local elections happen every 5 years.'],
  
  // Face recognition specific questions
  ['how does face recognition voting work?', 'Our system uses your registered facial data for secure authentication. During voting, the camera captures your face, matches it with our secure database, and verifies your identity instantly without passwords or IDs.'],
  ['how does face recognition voting work', 'Our system uses your registered facial data for secure authentication. During voting, the camera captures your face, matches it with our secure database, and verifies your identity instantly without passwords or IDs.'],
  ['is face recognition secure for voting?', 'Yes! We use advanced encryption and store only mathematical face templates, not actual photos. The system includes liveness detection to prevent spoofing and all data is protected with multiple security layers.'],
  ['is face recognition secure for voting', 'Yes! We use advanced encryption and store only mathematical face templates, not actual photos. The system includes liveness detection to prevent spoofing and all data is protected with multiple security layers.'],
  ['how to register face for voting?', 'Visit your local election office with your citizenship certificate. Our staff will guide you through the quick face registration process - it takes about 2 minutes and requires looking at the camera from different angles.'],
  ['how to register face for voting', 'Visit your local election office with your citizenship certificate. Our staff will guide you through the quick face registration process - it takes about 2 minutes and requires looking at the camera from different angles.'],
  ['what if face recognition fails?', 'If face recognition fails, you can use alternative verification: show your citizenship certificate and verified mobile OTP. Our staff will assist you and update your facial data if needed.'],
  ['what if face recognition fails', 'If face recognition fails, you can use alternative verification: show your citizenship certificate and verified mobile OTP. Our staff will assist you and update your facial data if needed.'],
  ['can i update my face data?', 'Yes! Visit any election office to update your facial data. This is recommended if you have significant appearance changes, or if you experience recognition issues during voting.'],
  ['can i update my face data', 'Yes! Visit any election office to update your facial data. This is recommended if you have significant appearance changes, or if you experience recognition issues during voting.'],
  ['is face recognition mandatory?', 'No, it is optional but recommended for faster, more secure voting. Traditional methods with citizenship certificate and verification are always available as backup.'],
  ['is face recognition mandatory', 'No, it is optional but recommended for faster, more secure voting. Traditional methods with citizenship certificate and verification are always available as backup.'],
  
  // Digital voting system questions
  ['how to vote online in nepal?', 'Currently, online voting is available through secure designated centers with face authentication. Fully remote online voting is being tested and will be announced by the Election Commission when available.'],
  ['how to vote online in nepal', 'Currently, online voting is available through secure designated centers with face authentication. Fully remote online voting is being tested and will be announced by the Election Commission when available.'],
  ['is digital voting safe in nepal?', 'Yes, our digital voting uses end-to-end encryption, blockchain verification for vote integrity, and multiple authentication layers including face recognition for maximum security.'],
  ['is digital voting safe in nepal', 'Yes, our digital voting uses end-to-end encryption, blockchain verification for vote integrity, and multiple authentication layers including face recognition for maximum security.'],
  ['how are votes counted digitally?', 'Votes are encrypted immediately after casting, stored securely, and counted automatically with real-time verification. The system provides instant results while maintaining voter anonymity.'],
  ['how are votes counted digitally', 'Votes are encrypted immediately after casting, stored securely, and counted automatically with real-time verification. The system provides instant results while maintaining voter anonymity.'],
  ['can i verify my vote was counted?', 'Yes! After voting, you receive a unique encrypted receipt code. You can verify your vote was counted (without seeing how you voted) through the Election Commission verification portal.'],
  ['can i verify my vote was counted', 'Yes! After voting, you receive a unique encrypted receipt code. You can verify your vote was counted (without seeing how you voted) through the Election Commission verification portal.'],
  
  // Registration process
  ['how to check voter registration status?', 'Visit www.election.gov.np/voter-status and enter your citizenship number, or SMS your citizenship number to 980-980-0000 to check your registration status.'],
  ['how to check voter registration status', 'Visit www.election.gov.np/voter-status and enter your citizenship number, or SMS your citizenship number to 980-980-0000 to check your registration status.'],
  ['voter registration deadline nepal?', 'Registration deadlines are announced before each election. Typically, registration closes 35 days before election day. Check the Election Commission website for exact dates.'],
  ['voter registration deadline nepal', 'Registration deadlines are announced before each election. Typically, registration closes 35 days before election day. Check the Election Commission website for exact dates.'],
  ['can i vote from different location?', 'Yes, with prior registration for absentee voting. You must apply for voter transfer at least 15 days before election day at your local election office.'],
  ['can i vote from different location', 'Yes, with prior registration for absentee voting. You must apply for voter transfer at least 15 days before election day at your local election office.'],
  
  // Technical issues
  ['what if internet connection fails during voting?', 'Our systems have offline capability and backup power. Your voting session is saved locally and syncs when connection restores. In case of prolonged outage, extended voting hours are announced.'],
  ['what if internet connection fails during voting', 'Our systems have offline capability and backup power. Your voting session is saved locally and syncs when connection restores. In case of prolonged outage, extended voting hours are announced.'],
  ['how to report voting system problem?', 'Immediately notify polling station staff or call Election Commission helpline: 980-980-0001. Technical support teams are available at all voting centers.'],
  ['how to report voting system problem', 'Immediately notify polling station staff or call Election Commission helpline: 980-980-0001. Technical support teams are available at all voting centers.'],
  
  // Accessibility
  ['voting options for disabled voters?', 'We provide braille ballots, wheelchair access, audio voting assistance, and staff support. Face recognition also helps voters with mobility challenges who cannot handle physical documents.'],
  ['voting options for disabled voters', 'We provide braille ballots, wheelchair access, audio voting assistance, and staff support. Face recognition also helps voters with mobility challenges who cannot handle physical documents.'],
  ['can illiterate people use digital voting?', 'Yes! Our system has audio guidance in Nepali and local languages, pictorial candidate selection, and staff assistance to ensure everyone can vote independently and securely.'],
  ['can illiterate people use digital voting', 'Yes! Our system has audio guidance in Nepali and local languages, pictorial candidate selection, and staff assistance to ensure everyone can vote independently and securely.']
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
