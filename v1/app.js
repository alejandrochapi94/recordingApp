let mediaRecorder;
let audioChunks = [];
let recordingStartTime;
let finalDurationSeconds = 0;
let audioBlobUrl = null;
let stream = null;

const btnRecord = document.getElementById('btn-record');
const btnListen = document.getElementById('btn-listen');
const btnListenAgain = document.getElementById('btn-listen-again');
const audioPlayer = document.getElementById('audio-player');
const statusText = document.getElementById('status-text');

async function startRecording() {
    try {
        // --- CORRECCIÓN AQUÍ ---
        // Detenemos cualquier audio que esté sonando antes de volver a grabar
        if (!audioPlayer.paused) {
            audioPlayer.pause();
        }
        audioPlayer.currentTime = 0; // Reiniciamos el tiempo por si acaso
        // -----------------------

        // Pedimos acceso al micrófono
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        
        // Vaciamos la memoria al iniciar (Opción 1)
        audioChunks = [];
        finalDurationSeconds = 0;
        
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = playLast30Seconds;

        // Iniciamos la grabación y guardamos la marca de tiempo
        mediaRecorder.start();
        recordingStartTime = Date.now();

        // Actualizamos la Interfaz
        statusText.innerText = "Grabando en tiempo real...";
        btnRecord.disabled = true;
        btnListen.disabled = false;
        btnListenAgain.disabled = true;
        
    } catch (err) {
        console.error("Error al acceder al micrófono:", err);
        alert("Por favor, permite el acceso al micrófono en tu navegador.");
    }
}

function stopAndListen() {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
        // Calculamos la duración total justo antes de detener
        finalDurationSeconds = (Date.now() - recordingStartTime) / 1000;
        mediaRecorder.stop();
        statusText.innerText = "Procesando audio...";
    }
}

function playLast30Seconds() {
    // Creamos el archivo en memoria a partir de los fragmentos (chunks)
    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
    
    // Limpiamos la URL anterior de la memoria si existe
    if (audioBlobUrl) {
        URL.revokeObjectURL(audioBlobUrl);
    }
    audioBlobUrl = URL.createObjectURL(audioBlob);
    
    audioPlayer.src = audioBlobUrl;

    // Calculamos el inicio: total menos 30 segundos (si es menor a 0, empieza en 0)
    const startTime = Math.max(0, finalDurationSeconds - 30);
    audioPlayer.currentTime = startTime;
    audioPlayer.play();

    // Apagamos el micrófono para ahorrar batería
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }

    // Actualizamos la Interfaz
    statusText.innerText = "Reproduciendo últimos 30s";
    btnRecord.disabled = false;
    btnRecord.innerText = "🔴 Reanudar Grabación";
    btnRecord.classList.replace('primary', 'secondary'); 
    btnRecord.style.backgroundColor = "#ff4757"; 
    
    btnListen.disabled = true;
    btnListenAgain.disabled = false;
}

function listenAgain() {
    if (audioPlayer.src) {
        // --- CORRECCIÓN AQUÍ ---
        // Pausamos el audio actual antes de reiniciarlo para evitar que se monte o falle
        audioPlayer.pause();
        // -----------------------

        const startTime = Math.max(0, finalDurationSeconds - 30);
        audioPlayer.currentTime = startTime;
        audioPlayer.play();
        statusText.innerText = "Reproduciendo últimos 30s de nuevo";
    }
}

// Escuchamos cuando el audio termina de reproducirse para cambiar el texto
audioPlayer.onended = () => {
    statusText.innerText = "Reproducción finalizada. Listo para reanudar.";
};

// Asignar eventos a los botones
btnRecord.addEventListener('click', startRecording);
btnListen.addEventListener('click', stopAndListen);
btnListenAgain.addEventListener('click', listenAgain);