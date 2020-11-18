const imageUpload = document.getElementById('imageUpload')
let obj;
fetch("model.json")
    .then(response => response.json())
    .then(data => obj = data);
Promise.all([
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.ssdMobilenetv1.loadFromUri('/models')
]).then(start)

async function start() {
  const container = document.createElement('div')
  container.style.position = 'relative'
  document.body.append(container)
//   const labeledFaceDescriptors = await loadLabeledImages()
  const labeledFaceDescriptors = await loadLabeledImagesFromModel()
  const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.5)
  let image
  let canvas
  document.body.append('Loaded')
  imageUpload.addEventListener('change', async () => {
    if (image) image.remove()
    if (canvas) canvas.remove()
    image = await faceapi.bufferToImage(imageUpload.files[0])
    container.append(image)
    canvas = faceapi.createCanvasFromMedia(image)
    container.append(canvas)
    const displaySize = { width: image.width, height: image.height }
    faceapi.matchDimensions(canvas, displaySize)
    const detections = await faceapi.detectAllFaces(image).withFaceLandmarks().withFaceDescriptors()
    const resizedDetections = faceapi.resizeResults(detections, displaySize)
    const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor))
    results.forEach((result, i) => {
      const box = resizedDetections[i].detection.box
      const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() })
      drawBox.draw(canvas)
    })
  })
}

function loadLabeledImages() {
    const labels = ['Baipor'];
    return Promise.all(
        labels.map(async label => {
            const descriptions = []
            for (let i = 12; i <= 12; i++) {
                // const img = await faceapi.fetchImage(`https://raw.githubusercontent.com/WebDevSimplified/Face-Recognition-JavaScript/master/labeled_images/${label}/${i}.jpg`)
                // const img = await faceapi.fetchImage(`https://raw.githubusercontent.com/Tanakornohm/Exam-Web/master/test-face-recog/face-recognition-web/img/${label}/${i}.jpg`)
                const img = await faceapi.fetchImage(`${label}/${i}.jpg`)
                const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()
                descriptions.push(detections.descriptor)
            }
            descriptions.map(value => {
                value.map(n => {
                    console.log(n);
                })
            })
            return new faceapi.LabeledFaceDescriptors(label, descriptions)
        })
    )
}

function loadLabeledImagesFromModel() {
    const members = ['Dorn','Thanapon'];
    const labeledFaceDescriptors = members.map(
        member =>
            new faceapi.LabeledFaceDescriptors(
                obj[member].name,
                obj[member].descriptors.map(
                    descriptor => new Float32Array(descriptor)
                )
            )
    );
    console.log('complete')
    return labeledFaceDescriptors
}