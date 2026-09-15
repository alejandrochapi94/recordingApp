let mediaRecorder;
let audioChunks = [];
let recordingStartTime;
let finalDurationSeconds = 0;
let audioBlobUrl = null;
let stream = null;

const btnRecord = document.getElementById('btn-record');
const recordText = document.getElementById('record-text'); // Solo cambiamos el texto, no el ícono
const btnListen = document.getElementById('btn-listen');
const btnListenAgain = document.getElementById('btn-listen-again');
const audioPlayer = document.getElementById('audio-player');
const statusBar = document.getElementById('status-bar');

async function startRecording() {
    try {
        if (!audioPlayer.paused) {
            audioPlayer.pause();
        }
        audioPlayer.currentTime = 0;

        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        
        audioChunks = [];
        finalDurationSeconds = 0;
        
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = playLast30Seconds;

        mediaRecorder.start();
        recordingStartTime = Date.now();

        // Actualizamos la Interfaz con textos grandes y cortos
        statusBar.innerText = "GRABANDO...";
        recordText.innerText = "GRABANDO"; 
        
        btnRecord.disabled = true;
        btnListen.disabled = false;
        btnListenAgain.disabled = true;
        
    } catch (err) {
        console.error("Error:", err);
        alert("Permite el micrófono.");
    }
}

function stopAndListen() {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
        finalDurationSeconds = (Date.now() - recordingStartTime) / 1000;
        mediaRecorder.stop();
        statusBar.innerText = "CARGANDO...";
    }
}

function playLast30Seconds() {
    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
    
    if (audioBlobUrl) {
        URL.revokeObjectURL(audioBlobUrl);
    }
    audioBlobUrl = URL.createObjectURL(audioBlob);
    
    audioPlayer.src = audioBlobUrl;

    const startTime = Math.max(0, finalDurationSeconds - 30);
    audioPlayer.currentTime = startTime;
    audioPlayer.play();

    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }

    // Interfaz para cuando puede reanudar
    statusBar.innerText = "REPRODUCIENDO";
    recordText.innerText = "REANUDAR"; 
    
    btnRecord.disabled = false;
    btnListen.disabled = true;
    btnListenAgain.disabled = false;
}

function listenAgain() {
    if (audioPlayer.src) {
        audioPlayer.pause();

        const startTime = Math.max(0, finalDurationSeconds - 30);
        audioPlayer.currentTime = startTime;
        audioPlayer.play();
        
        statusBar.innerText = "REPITIENDO";
    }
}

audioPlayer.onended = () => {
    statusBar.innerText = "ESPERANDO";
};

// Eventos
btnRecord.addEventListener('click', startRecording);
btnListen.addEventListener('click', stopAndListen);
btnListenAgain.addEventListener('click', listenAgain);