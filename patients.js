import app from './firebase.js';
import { getFirestore, collection, addDoc, getDocs, Timestamp } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

const db = getFirestore(app);
let patients = [];

document.getElementById('userSearch').addEventListener('input', function (e) {
  const term = e.target.value.toLowerCase();
  const users = document.querySelectorAll('#userList .list-group-item');

  users.forEach(function (user) {
    const name = user.getAttribute('data-name').toLowerCase();
    const details = user.querySelector('.user-details');
    if (name.includes(term) || term === '') {
      user.style.display = 'block';
      details.classList.add('collapse'); // Collapse the details on search
    } else {
      user.style.display = 'none';
    }
  });
});

async function fetchPatients() {
  const querySnapshot = await getDocs(collection(db, "patients"));
  querySnapshot.forEach((doc) => {
    patients.push([doc.id, doc.data()]);
  });
  return patients;
}

function formatDate(date) {
  if (!date) return '';

  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function addCollapsibleFunction(li) {
  li.addEventListener('click', function () {
    const details = this.querySelector('.user-details');
    if (details.classList.contains('collapse')) {
      details.classList.remove('collapse');
    } else {
      details.classList.add('collapse');
    }
  });
};

function addPatientToList(user) {
  const userList = document.getElementById('userList');
  const liContent = `
        <li class="list-group-item justify-content-between align-items-center patient-item" data-name="${user.Name}">
          <div class="row patient-item-title">
            <div class="col-md-8">
              <strong>${user.Name}</strong>
            </div>
            <div class="col-md-2">
              <span class="dob">${formatDate(new Date(user.DOB.seconds * 1000))}</span>
            </div>
            <div class="col-md-2">
              <button type="button" class="badge rounded-pill bg-primary new-capture-btn">New Session</button>
            </div>
          </div>
          
          <div class="user-details collapse">
            <div class="row">
              <hr class="mt-1">
              <div class="col-md-8">
                <p>Email: ${user.Email}</p>
                <p>Phone: ${user.Phone}</p>
              </div>
              <div class="col-md-4 capture-history-count">
              </div>
            </div>
          </div>
        </li>
    `;

  // Insert the new <li> content
  userList.insertAdjacentHTML('beforeend', liContent);

  // Add the click event listener
  const li = userList.lastElementChild;
  addCollapsibleFunction(li);

  // Add the click event listener to the new capture button
  const newCaptureBtn = li.querySelector('.new-capture-btn');
  newCaptureBtn.addEventListener('click', function (event) {
    // Check the index of this li in the list
    const index = Array.from(userList.children).indexOf(li);

    // Get the patient ID from the patients array
    const patientID = patients[index][0];

    // Navigate to the captures page
    event.stopPropagation();
    window.location.href = 'captures.html?patientID=' + patientID + '&patientName=' + user.Name + '&patientDOB=' + formatDate(new Date(user.DOB.seconds * 1000));
  });

  // Add the number of captures to the patient list item
  const captureHistoryCount = li.querySelector('.capture-history-count');
  if (user.Sessions) {
    const numPastSessions = user.Sessions.length;
    captureHistoryCount.innerHTML = `<a>${numPastSessions} past captures</a>`;
  } else {
    captureHistoryCount.innerHTML = `<p>no past captures</p>`;
  }
}

function populateTable(patients) {
  patients.forEach(patient => {
    addPatientToList(patient[1]);
  });
}

// Fetch and log the data (you would instead use this data to populate a table in your UI)
fetchPatients().then(patients => {
  populateTable(patients);
});


document.querySelectorAll('#userList .list-group-item').forEach(item => {
  addCollapsibleFunction(item);
});


var addPatientModal = document.getElementById('addPatientModal');
addPatientModal.addEventListener('show.bs.modal', function (event) {
});

addPatientModal.addEventListener('hide.bs.modal', function (event) {
});

document.getElementById("submitNewPatient").addEventListener('click', async function(e) {
  // Collect form data
  const dobString = document.getElementById("patientDOB").value; // e.g., "1990-01-01"
  const dobDate = new Date(dobString);
  const dobTimestamp = Timestamp.fromDate(dobDate);
  var userData = {
    Name: document.getElementById("patientName").value,
    DOB: dobTimestamp,
    Email: document.getElementById("patientEmail").value,
    Phone: document.getElementById("patientPhone").value
  };

  try {
    // Add a new document with the collected data in collection
    const docRef = await addDoc(collection(db, "patients"), userData);
    console.log("Document written with ID: ", docRef.id);
    
    // Close the modal after submitting
    let patientModal = bootstrap.Modal.getInstance(addPatientModal);
    patientModal.hide();

    // Add the new patient to the list
    patients.push([docRef.id, userData])
    addPatientToList(userData);

    // Optionally, clear the form fields or provide feedback to the user
  } catch (e) {
    console.error("Error adding document: ", e);
    document.getElementById("addPatientResult").textContent = "Failed to add patient. Please try again.";
    document.getElementById("addPatientResult").display = "block";
  }
});