let deviceList = [];
let selectedCameraAddress = '';

// Set camera light status
function setDeviceLightStatus(ip) {
  const lightStatus = {
    white_led: document.getElementById('whiteLightSettingsToggle').checked
      ? 'on'
      : 'off',
    blue_led: document.getElementById('blueLightSettingsToggle').checked
      ? 'on'
      : 'off',
    red_laser: document.getElementById('redLaserSettingsToggle').checked
      ? 'on'
      : 'off',
  };
  window.electronAPI.setLightStatus(ip, lightStatus);
}

document.addEventListener('DOMContentLoaded', async () => {
  deviceList = await window.electronAPI.getDeviceList();
  updateDeviceListUI(deviceList);
});

document
  .getElementById('blueLightSettingsToggle')
  .addEventListener('click', function () {
    setDeviceLightStatus(selectedCameraAddress);
  });

document
  .getElementById('whiteLightSettingsToggle')
  .addEventListener('click', function () {
    setDeviceLightStatus(selectedCameraAddress);
  });

document
  .getElementById('redLaserSettingsToggle')
  .addEventListener('click', function () {
    setDeviceLightStatus(selectedCameraAddress);
  });

function updateDeviceListUI(cameras) {
  deviceList = cameras;

  const deviceListWrapper = document.getElementById('device-list-wrapper');
  deviceListWrapper.innerHTML = ''; // Clear existing entries

  cameras.forEach(cam => {
    const deviceElement = createDeviceElement(cam);
    deviceListWrapper.appendChild(deviceElement);
  });

  // Add click event listeners to all settings buttons
  const settingsButtons = deviceListWrapper.getElementsByClassName(
    'camera-settings-button'
  );
  Array.from(settingsButtons).forEach(button => {
    button.addEventListener('click', function () {
      const cameraAddress = this.getAttribute('data-camera-address');
      selectedCameraAddress = cameraAddress;
      console.log('Selected camera address:', selectedCameraAddress);

      // Get light status from device and set the toggle buttons accordingly
      window.electronAPI
        .getLightStatus(selectedCameraAddress)
        .then(lightStatus => {
          document.getElementById('whiteLightSettingsToggle').checked =
            lightStatus.white_led === 'on';
          document.getElementById('blueLightSettingsToggle').checked =
            lightStatus.blue_led === 'on';
          document.getElementById('redLaserSettingsToggle').checked =
            lightStatus.red_laser === 'on';
        })
        .catch(error => {
          console.error(error);
        });

      // Start preview stream
      window.electronAPI.setStreamingStatus(selectedCameraAddress, true);

      // Wait and show the stream
      const url = `http://${selectedCameraAddress}:8080/camera/preview/video_feed`;
      setTimeout(() => {
        document.getElementById('videoPreview').src =
          url + '?ts=' + new Date().getTime();
        document.getElementById('videoPreview').style.display = 'block';
      }, 200);
    });
  });
}

document
  .getElementById('deviceSetingsModal')
  .addEventListener('hide.bs.modal', function () {
    // Stop preview stream
    document.getElementById('videoPreview').src = '';
    document.getElementById('videoPreview').style.display = 'none';
    window.electronAPI.setStreamingStatus(selectedCameraAddress, false);
  });

function createDeviceElement(camera) {
  // Choose the Ipv4 address if available, otherwise use the first address
  // TODO: even if we choose a capture from specific device, the capture page will still just use the first device.
  // TODO: we should pass the selected device address to the capture page.
  const ipAddress =
    camera.addresses.find(address => address.includes('.')) ||
    camera.addresses[0];
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
                <p class="text-muted mb-0">Address: ${ipAddress || 'N/A'}</p>
              </div>
            </div>
            <span class="badge rounded-pill alert-success">Connected</span>
          </div>
        </div>
        <div class="card-footer border-0 bg-body-tertiary p-2 d-flex justify-content-around">
          <button class="btn btn-link m-0 text-reset camera-settings-button" role="button" data-bs-toggle="modal" data-bs-target="#deviceSetingsModal" data-camera-address="${ipAddress}" data-ripple-color="primary" data-mdb-ripple-init>Settings</button>
          <a class="btn btn-link m-0 text-reset" href="captures.html" role="button" data-ripple-color="primary" data-mdb-ripple-init>Capture</a>
        </div>
      </div>`;

  return div;
}
