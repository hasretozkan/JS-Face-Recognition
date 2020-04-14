const video = document.getElementById('video')

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  faceapi.nets.faceExpressionNet.loadFromUri('/models'),
  faceapi.nets.ssdMobilenetv1.loadFromUri('/models')
]).then(startVideo)

async function startVideo() {
  var takelogpic = false;
  const labeledFaceDescriptors = await loadLabeledImages()
  const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6)
  navigator.getUserMedia(
    { video: {} },
    stream => video.srcObject = stream,
    err => console.error(err)
  )

  video.addEventListener('play', () => {
    const canvas = faceapi.createCanvasFromMedia(video)
    document.body.append(canvas)
    const displaySize = { width: video.width, height: video.height }
    faceapi.matchDimensions(canvas, displaySize)
    setInterval(async () => {
      const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions()
      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);

      if (detections && takelogpic != true) {
        takelogpic = true;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        // Other browsers will fall back to image/png
        const img = await faceapi.fetchImage(canvas.toDataURL('image/webp'));
        const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
        const displaySize = { width: canvas.width, height: canvas.height }
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        const results = faceMatcher.findBestMatch(resizedDetections.descriptor)
      }

      if (detections.length != 0) {
        if (detections[0].expressions.happy >= 0.8) {
          document.getElementById("happystatus").innerHTML = 'Happy'
        } else {
          document.getElementById("happystatus").innerHTML = 'Not Happy'
        }
      }

    }, 100)
  })
}

function loadLabeledImages() {
  const labels = ['Hasret Ozkan']
  return Promise.all(
    labels.map(async label => {
      const descriptions = []
      for (let i = 1; i <= 2; i++) {
        const img = await faceapi.fetchImage(`./images/${label}/${i}.png`)
        const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()
        descriptions.push(detections.descriptor)
        console.log('Detection Done!');
      }
      return new faceapi.LabeledFaceDescriptors(label, descriptions)
    })
  )
}
