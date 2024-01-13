let deviceList = [];
let whiteLightStatus = 'on';
let selectedCameraAddress = '';

// Set camera light status
function setDeviceLightStatus(deviceIp, command, lights) {
    // Constructing the XML data
    let content = '<Message>\n';
    lights.forEach(light => {
        content += `<light>\n<lightName>${light.name}</lightName>\n<lightStatus>${light.status}</lightStatus>\n</light>\n`;
    });
    content += '</Message>';

    // URL
    const url = `http://${deviceIp}:8008/${command}`;

    // Sending POST request
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/xml'
        },
        body: content
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}

document.addEventListener('DOMContentLoaded', async () => {
    deviceList = await window.electronAPI.getDeviceList();
    updateDeviceListUI(deviceList);
});

document.getElementById('blueLightSettingsToggle').addEventListener('click', function () {
    updateDeviceLightStatus();
});

document.getElementById('whiteLightSettingsToggle').addEventListener('click', function () {
    updateDeviceLightStatus();
});

function updateDeviceLightStatus() {
    const whiteLightButton = document.getElementById('whiteLightSettingsToggle');
    const blueLightButton = document.getElementById('blueLightSettingsToggle');

    setDeviceLightStatus(selectedCameraAddress, 'SetLightStatus', [
        { name: 'white', status: whiteLightButton.checked ? 'on' : 'off' },
        { name: 'blue', status: blueLightButton.checked ? 'on' : 'off' }
    ]);

}

function updateDeviceListUI(cameras) {
    deviceList = cameras;

    const deviceListWrapper = document.getElementById('device-list-wrapper');
    deviceListWrapper.innerHTML = ''; // Clear existing entries

    cameras.forEach(cam => {
        const deviceElement = createDeviceElement(cam);
        deviceListWrapper.appendChild(deviceElement);
    });

    // Add click event listeners to all settings buttons
    const settingsButtons = deviceListWrapper.getElementsByClassName('camera-settings-button');
    Array.from(settingsButtons).forEach(button => {
        button.addEventListener('click', function () {
            const cameraAddress = this.getAttribute('data-camera-address');
            selectedCameraAddress = cameraAddress;

            // TODO: Get light status from device and set the toggle buttons accordingly
        });
    });
}

function createDeviceElement(camera) {
    const div = document.createElement('div');
    div.className = 'col-xl-6 mb-4';
    div.innerHTML = `
      <div class="card">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center">
            <div class="d-flex align-items-center">
              <img src="assets/device_icon.webp" alt="" style="width: 45px; height: 45px" class="rounded-circle" />
              <div class="ms-3">
                <p class="fw-bold mb-1">${camera.name}</p>
                <p class="text-muted mb-0">Address: ${camera.addresses[0] || 'N/A'}</p>
              </div>
            </div>
            <span class="badge rounded-pill alert-success">Connected</span>
          </div>
        </div>
        <div class="card-footer border-0 bg-body-tertiary p-2 d-flex justify-content-around">
          <button class="btn btn-link m-0 text-reset camera-settings-button" role="button" data-bs-toggle="modal" data-bs-target="#deviceSetingsModal" data-camera-address="${camera.addresses[0]}" data-ripple-color="primary" data-mdb-ripple-init>Settings</button>
          <button class="btn btn-link m-0 text-reset" href="captures.html" role="button" data-ripple-color="primary" data-mdb-ripple-init>Capture</button>
        </div>
      </div>`;

    return div;
}