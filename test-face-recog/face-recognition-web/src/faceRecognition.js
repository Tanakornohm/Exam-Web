const video = document.getElementById('video')
let obj;
fetch("model.json")
    .then(response => response.json())
    .then(data => obj = data);

Promise.all([
    faceapi.nets.faceRecognitionNet.loadFromUri('../models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('../models'),
    faceapi.nets.ssdMobilenetv1.loadFromUri('../models'),
    faceapi.nets.tinyFaceDetector.loadFromUri('../models'),
    faceapi.nets.faceExpressionNet.loadFromUri('../models')
]).then(startVideo)

function startVideo() {
    navigator.getUserMedia(
        { video: {} },
        stream => video.srcObject = stream,
        err => console.error(err)
    )
}
video.addEventListener('play',async () => {
    const container = document.createElement('div')
    container.style.position = 'relative'
    document.body.append(container)
    const labeledFaceDescriptors = await loadLabeledImages()
    // const members = ['Dorn','Thanapon'];
    // const labeledFaceDescriptors = members.map(
    //     member =>
    //         new faceapi.LabeledFaceDescriptors(
    //             obj[member].name,
    //             obj[member].descriptors.map(
    //                 descriptor => new Float32Array(descriptor)
    //             )
    //         )
    // );
    document.body.append("Loaded")
    const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.5)
    const canvas = faceapi.createCanvasFromMedia(video)
    document.body.append(canvas)
    const displaySize = { width: video.width, height: video.height }
    faceapi.matchDimensions(canvas, displaySize)
    setInterval(async () => {
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions().withFaceDescriptors()
        const resizedDetections = faceapi.resizeResults(detections, displaySize)
        const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor))
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
        results.forEach((result, i) => {
            const box = resizedDetections[i].detection.box
            const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() })
            drawBox.draw(canvas)
        })
    }, 100)
})

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
function loadJson() {

}