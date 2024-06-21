// TODO: Firebase API token is not set up proplery. Disable firebase related code for now.

// import app from './firebase.js';
// import { getFirestore, updateDoc, doc, arrayUnion, setDoc, collection } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

// const db = getFirestore(app);

var videoModal = document.getElementById('videoModal');
var confirmModal = document.getElementById('confirmModal');
var cameraPreview = document.getElementById('cameraPreview');
let sourceButton = null;
let sourceImage = null;
let cameraAddress = null;

// Update firebase database to add session ID to patient
async function updateCaptureRecord(patientID, sessionId) {
  const patientDocRef = doc(db, "patients", patientID);
  try {
    // Assuming 'Captures' is an array field in the user's document
    await updateDoc(patientDocRef, {
      Sessions: arrayUnion(sessionId) // Add the sessionId to the Captures array
    });
  } catch (error) {
    console.error("Error updating document: ", error);
  }
}

// Generate a session id based on the current time
function generateSessionId() {
  const now = new Date();

  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0'); // January is 0
  const day = now.getDate().toString().padStart(2, '0');

  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');

  return `${year}${month}${day}-${hours}${minutes}${seconds}`;
}
const sessionId = generateSessionId();

// Event listener for open modal buttons
document.querySelectorAll('.open-capture-modal-btn').forEach(button => {
  button.addEventListener('click', function () {
    sourceButton = this; // Store the clicked button
    sourceImage = this.querySelector('.card-img-top');
  });
});

confirmModal.addEventListener('show.bs.modal', function (event) {
  // Set image to first image in the carousel
  const previewImage = document.getElementById('confirmModalImage');
  previewImage.src = document.getElementById('TongueImage').src;

  // Set the patient name in the modal
  const params = new URLSearchParams(window.location.search);
  let userName = params.get('patientName');
  document.getElementById('confirmPatientName').textContent = userName;

  let userDOB = params.get('patientDOB');
  document.getElementById('confirmPatientDOB').textContent = userDOB;

  // Set the date in the modal
  const today = new Date();
  const dateString = today.toDateString();
  document.getElementById('confirmCaptureDate').textContent = dateString;

  // Set session ID
  document.getElementById('confirmSessionID').textContent = sessionId;

  // Set the number of images captured
  const elements = document.querySelectorAll('.card-img-top.captured-image');
  document.getElementById('confirmNumScans').textContent = `${elements.length} Scans`;

});

document.getElementById('confirmSubmitBtn').addEventListener('click', async function () {
  // Gather all the images and metadata and upload to Google Cloud Storage
  const params = new URLSearchParams(window.location.search);
  const patientID = params.get('patientID');
  const elements = document.querySelectorAll('.card-img-top.captured-image');
  elements.forEach(element => {
    // Upload image
    window.gcAPI.uploadFile(`captures/${sessionId}/${element.alt}.png`).catch(console.error);

    // Add session ID to the firebase database
    updateCaptureRecord(patientID, sessionId);
  });

  // Save metadata and additional notes to firebase database
  const notes = document.getElementById('captureSessionNote').value;
  var sessionMeta = {
    PatientID: patientID,
    notes: notes,
  };

  // Add a new document with the collected data in collection
  const docRef = doc(db, "sessions", sessionId);

  try {
    await setDoc(docRef, sessionMeta);
  } catch (error) {
    console.error('Error creating document:', error);
  }

  const toastElement = document.getElementById('successToast');
  const toast = new bootstrap.Toast(toastElement);

  toast.show();
});

// Handle the opening of the modal
videoModal.addEventListener('show.bs.modal', async function (event) {
  const button = document.getElementById('captureBtn');
  button.textContent = 'Capture';
  button.disabled = false;

  if (sourceImage && sourceImage.classList.contains('captured-image')) {
    // Set the preview image to the captured image
    document.getElementById('framePreview').src = sourceImage.src;
    document.getElementById('framePreview').style.display = "block"; // Show the preview image
    document.getElementById("captureBtn").style.display = "none"; // Hide the capture button
    document.getElementById("confirmCaptureBtn").style.display = "block"; // Show the confirm capture button
    document.getElementById("retakeCaptureBtn").style.display = "block"; // Show the cancel capture button
  } else {
    // Clear the preview image
    document.getElementById('framePreview').src = "";
    document.getElementById('framePreview').style.display = "none"; // Hide the preview image
    document.getElementById("captureBtn").style.display = "block"; // Show the capture button
    document.getElementById("confirmCaptureBtn").style.display = "none"; // Hide the confirm capture button
    document.getElementById("retakeCaptureBtn").style.display = "none"; // Hide the cancel capture button
  }

  // TODO: we use the first camera address for now. Should be able to select the camera address from the modal.
  if (cameraAddress === null) {
    const deviceList = await window.electronAPI.getDeviceList();
    cameraAddress = deviceList[0].addresses.find(address => address.includes('.')) || deviceList[0].addresses[0];
  }
  // Start preview
  console.log('Selected camera address:', cameraAddress);
  console.log('Starting preview stream...');
  window.electronAPI.setStreamingStatus(cameraAddress, true);
        
  // Wait and show the stream
  const url = `http://${cameraAddress}:8080/camera/preview/video_feed`;
  setTimeout(() => {
      cameraPreview.src = url + '?ts=' + new Date().getTime();
      cameraPreview.style.display = 'block';
  }, 200);
});

// Handle the closing of the modal
videoModal.addEventListener('hide.bs.modal', function (event) {
  cameraPreview.src = '';
  window.electronAPI.setStreamingStatus(cameraAddress, false);
});

function updateButtonCountdown(button, remaining) {
  if (remaining > 0) {
    button.textContent = `Capture In (${remaining})`;
  }
}

function startButtonCountdown(buttonId, duration) {
  const button = document.getElementById(buttonId);
  let remaining = duration;

  // Update the button immediately without delay
  updateButtonCountdown(button, remaining);

  button.disabled = true; // Disable the button during countdown

  const intervalId = setInterval(() => {
    remaining--;
    updateButtonCountdown(button, remaining);

    if (remaining <= 0) {
      clearInterval(intervalId);
      button.textContent = 'Capturing...';
      window.electronAPI.captureRawImage(cameraAddress).then((imagePath) => {
        button.textContent = 'Capturing';
        button.disabled = false; // Re-enable the button
        button.style.display = "none"; // Hide the capture button
        document.getElementById("confirmCaptureBtn").style.display = "block"; // Show the confirm capture button
        document.getElementById("retakeCaptureBtn").style.display = "block"; // Show the cancel capture button

        const imgElement = document.getElementById('framePreview');
        imgElement.src = imagePath;
        imgElement.style.display = "block"; // Show the preview image
      });
    }
  }, 1000);
}

document.getElementById('captureBtn').addEventListener('click', function () {
  const delayInputValue = document.getElementById('delayInput').value;
  const delayInSeconds = parseInt(delayInputValue, 10); // Convert the value to an integer

  // Check if the input is a number and greater than zero
  if (!isNaN(delayInSeconds) && delayInSeconds > 0) {
    startButtonCountdown('captureBtn', delayInSeconds);
  } else {
    console.log("Invalid delay input: ", delayInputValue);
    startButtonCountdown('captureBtn', 0);
  }
});

function dataURLtoBlob(dataUrl) {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new Blob([u8arr], { type: mime });
}

document.getElementById('confirmCaptureBtn').addEventListener('click', function () {

  const dataUrl = document.getElementById('framePreview').src;
  if (sourceImage) {
    sourceImage.src = dataUrl;
    sourceImage.classList.add('captured-image');
  }
  const altText = sourceImage.alt;
  const filePath = `captures/${sessionId}/${altText}.png`;
  const blob = dataURLtoBlob(dataUrl);
  blob.arrayBuffer().then(arrayBuffer => {
    const myBuffer = window.nodeAPI.createBuffer(arrayBuffer);
    window.electronAPI.saveImage(myBuffer, filePath).then((fullFilePath) => {
      let videoModal = bootstrap.Modal.getInstance(document.getElementById('videoModal'));
      videoModal.hide();
    });
  });
});

document.getElementById('retakeCaptureBtn').addEventListener('click', function () {
  document.getElementById("confirmCaptureBtn").style.display = "none"; // Hide the confirm capture button
  document.getElementById("retakeCaptureBtn").style.display = "none"; // Hide the cancel capture button
  document.getElementById("captureBtn").style.display = "block"; // Show the capture button
  document.getElementById('framePreview').src = ""; // Clear the preview image
  document.getElementById('framePreview').style.display = "none"; // Hide the preview image
});