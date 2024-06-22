// TODO: Firebase API token is not set up proplery. Disable firebase related code for now.

// import app from './firebase.js';
// import { getFirestore, updateDoc, doc, arrayUnion, setDoc, collection } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

// const db = getFirestore(app);

var videoModal = document.getElementById('videoModal');
var confirmModal = document.getElementById('confirmModal');
var cameraPreview = document.getElementById('cameraPreview');
var cameraPreviewContainer = document.getElementById('cameraPreviewContainer');
var galleyPreviewIndex = 0;
let sourceButton = null;
let sourceImage = null;
let previewFrameDisplayHeight = null;
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

  const src = event.relatedTarget;
  sourceImage = src.querySelector('.card-img-top');

  if (sourceImage && sourceImage.classList.contains('captured-image')) {
    // Set the preview image to the captured image
    document.getElementById('framePreview').src = sourceImage.src;
    document.getElementById('framePreview').style.display = "block"; // Show the preview image
    document.getElementById("galleryDots").style.display = "block"; // Show the gallery dots
    document.getElementById("captureBtn").style.display = "none"; // Hide the capture button
    document.getElementById("confirmCaptureBtn").style.display = "block"; // Show the confirm capture button
    document.getElementById("retakeCaptureBtn").style.display = "block"; // Show the cancel capture button
    cameraPreviewContainer.style.display = 'none'; // Hide the camera preview
    
  } else {
    // Clear the preview image
    document.getElementById('framePreview').src = "";
    document.getElementById('framePreview').style.display = "none"; // Hide the preview image
    document.getElementById('galleryDots').style.display = "none"; // Hide the gallery dots
    document.getElementById("captureBtn").style.display = "block"; // Show the capture button
    document.getElementById("confirmCaptureBtn").style.display = "none"; // Hide the confirm capture button
    document.getElementById("retakeCaptureBtn").style.display = "none"; // Hide the cancel capture button
    cameraPreviewContainer.style.display = 'block'; // Show the camera preview
  }

  // TODO: we use the first camera address for now. Should be able to select the camera address from the modal.
  if (cameraAddress === null) {
    const deviceList = await window.electronAPI.getDeviceList();
    if (deviceList.length === 0) {
      // Set the preview to a debug image
      cameraPreview.src = 'assets/capture_sample_1.png';
      return
    }
    cameraAddress = deviceList[0].addresses.find(address => address.includes('.')) || deviceList[0].addresses[0];
  }
  // Start preview stream
  window.electronAPI.setStreamingStatus(cameraAddress, true);
        
  // Wait and show the stream
  const url = `http://${cameraAddress}:8080/camera/preview/video_feed`;
  setTimeout(() => {
      cameraPreview.src = url + '?ts=' + new Date().getTime();
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
        imgElement.style.visibility = "hidden"; // Hide the preview image
        document.getElementById("galleryDots").style.display = "block"; // Show the gallery dots

        // Hide the camera preview
        cameraPreviewContainer.style.display = 'none';
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

document.getElementById('confirmCaptureBtn').addEventListener('click', function () {

  const dataUrl = document.getElementById('framePreview').src;
  if (sourceImage) {
    sourceImage.src = dataUrl;
    sourceImage.classList.add('captured-image');
  }

  sourceImage.style.visibility = "hidden"; // Hide the preview image
  sourceImage.onload = function () {
    const imageHeight = sourceImage.height / 3;
    sourceImage.style.height = `${imageHeight}px`;
    sourceImage.style.visibility = "visible"; // Show the preview image
  }
});

document.getElementById('retakeCaptureBtn').addEventListener('click', function () {
  document.getElementById("confirmCaptureBtn").style.display = "none"; // Hide the confirm capture button
  document.getElementById("retakeCaptureBtn").style.display = "none"; // Hide the cancel capture button
  document.getElementById("captureBtn").style.display = "block"; // Show the capture button
  document.getElementById('framePreview').src = ""; // Clear the preview image
  document.getElementById('framePreview').style.display = "none"; // Hide the preview image
  cameraPreviewContainer.style.display = 'block'; // Show the camera preview
  document.getElementById("galleryDots").style.display = "none"; // Hide the gallery dots
});

function showPreviewImage(index) {
  const imageHeight = document.getElementById('framePreview').height / 3;
  galleyPreviewIndex = index;
  const dots = document.querySelectorAll('.gallery-dot');

  const offset = -imageHeight * index;
  framePreview.style.transform = `translateY(${offset}px)`;
  dots.forEach(dot => dot.classList.remove('active'));
  dots[index].classList.add('active');
}

window.showPreviewImage = showPreviewImage; // expose to html

function setGalleryHeight() {
  // Calculate the height of one section of the image
  if (!previewFrameDisplayHeight) {
    previewFrameDisplayHeight = document.getElementById('framePreview').clientHeight / 3;
  }
  const imageHeight = previewFrameDisplayHeight;
  document.getElementById('framePreviewContainer').style.height = `${imageHeight}px`;
  document.getElementById('videoModalBody').style.minHeight = `${imageHeight}px`;
}

document.getElementById('framePreview').onload = function() {
  setGalleryHeight();
  showPreviewImage(0);
  this.style.visibility = "visible"; // Show the preview image
}

window.onresize = function() {
  previewFrameDisplayHeight = null;
  setGalleryHeight();
}