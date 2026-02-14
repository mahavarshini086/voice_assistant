// script.js
const micIconContainer = document.getElementById('mic-icon-container'); // The visible click target
const hiddenButton = document.getElementById('mic-button'); // The hidden button (optional, but good for tracking state)
const statusText = document.getElementById('status');
const chatWindow = document.getElementById('chat-window');

// Check for browser compatibility
if (!('webkitSpeechRecognition' in window)) {
    statusText.textContent = "Your browser does not support Speech Recognition. Try Chrome or Edge.";
    micIconContainer.style.pointerEvents = 'none';
} else {
    const recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    let isListening = false;
    
    // --- UI Functions ---
    function addMessage(role, text) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${role}`;
        msgDiv.textContent = text;
        chatWindow.appendChild(msgDiv);
        chatWindow.scrollTop = chatWindow.scrollHeight; // Auto-scroll to latest
    }

    function setStatus(text, isRecording = false, isProcessing = false) {
        statusText.textContent = text;
        
        // Use the CSS class for the pulse effect
        micIconContainer.classList.toggle('recording-pulse', isRecording); 

        // Temporarily disable the microphone icon during processing
        micIconContainer.style.opacity = isProcessing ? '0.5' : '1.0';
        micIconContainer.style.pointerEvents = isProcessing ? 'none' : 'auto';
    }

    // --- Speech-to-Text (STT) Logic ---
    recognition.onstart = function() {
        isListening = true;
        setStatus("Listening for your voice...", true, false);
    }

    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        setStatus("You said: " + transcript, false, true); // Status is now Processing
        addMessage('user', 'You: ' + transcript);
        processUserQuery(transcript);
    }

    recognition.onerror = function(event) {
        console.error('Speech recognition error', event.error);
        setStatus("Error listening. Click to try again.", false, false);
        isListening = false;
    }

    recognition.onend = function() {
        isListening = false;
        // Only set status to 'Ready' if we aren't currently waiting for a Gemini response
        if (micIconContainer.style.pointerEvents !== 'none') {
             setStatus("Click the microphone to start the conversation.", false, false);
        }
    }

    micIconContainer.onclick = function() {
        if (!isListening) {
            recognition.start();
        } else {
            recognition.stop();
        }
    }

    // --- Gemini LLM and Text-to-Speech (TTS) Logic ---
    async function processUserQuery(query) {
        setStatus("Thinking...", false, true);
        
        try {
            // Send query to your secure Node.js backend
            const response = await fetch('http://localhost:3000/ask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: query })
            });

            if (!response.ok) throw new Error('Network response was not ok');

            const data = await response.json();
            const aiResponseText = data.text;
            
            addMessage('ai', 'AI: ' + aiResponseText);
            speakResponse(aiResponseText);
        
        } catch (error) {
            console.error("Error processing query:", error);
            addMessage('ai', 'AI: Sorry, I failed to get a response from the server.');
            speakResponse("Sorry, I failed to get a response from the server.");
            // Ensure mic is re-enabled on error
            micIconContainer.style.pointerEvents = 'auto';
            setStatus("Ready. Click to speak.", false, false);
        }
    }

    function speakResponse(text) {
        const synth = window.speechSynthesis;
        const utterance = new SpeechSynthesisUtterance(text);
        
        utterance.onstart = () => setStatus("AI Speaking...", false, true);
        utterance.onend = () => setStatus("Click the microphone to start the conversation.", false, false); // Ready
        
        // Re-enable microphone after speech is complete
        utterance.onend = () => {
            micIconContainer.style.pointerEvents = 'auto';
            setStatus("Click the microphone to start the conversation.", false, false);
        };

        synth.speak(utterance);
    }
}