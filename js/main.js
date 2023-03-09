const images = [];
const downloadBtn = document.getElementById("downloadBtn");

async function handleImages(event) {
  try {
    downloadBtn.innerText = 'Processing...';
    downloadBtn.disabled = true;
    downloadBtn.style.display = 'block';

    const files = event.target.files;
    for await (const file of files) {
      const { size, width, height, src } = await imageResolution(file);

      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: width > height ? width : height,
        useWebWorker: true
      };

      const newImage = await imageCompression(file, options);
      const {
        width: newWidth,
        height: newHeight,
        src: newSrc,
        size: newSize
      } = await imageResolution(newImage);

      const imageInfo = {
        src,
        newSrc,
        size,
        newSize,
        width,
        height,
        newWidth,
        newHeight,
        newImage,
        name: newImage.name,
      }

      images.push(imageInfo);
      previewImage(imageInfo);
    }

    downloadBtn.disabled = false;
    downloadBtn.innerText = 'Download Compressed Image(s)';

    if (images.length) {
      document.getElementById("downloadBtn").classList.remove('d-none');
    } else {
      downloadBtn.style.display = 'none';
    }
  } catch (error) {
    console.log(error);
    downloadBtn.disabled = false;
  }
}

function previewImage(imageInfo) {
  const compressedDiv = document.getElementById("compressedBlock");
  const node = document.getElementById("image-item");
  const imageHtml = node.cloneNode(true);
  const percent = (((imageInfo.size - imageInfo.newSize) * 100) / imageInfo.size).toFixed(2);

  imageHtml.children[0].children[0].src = imageInfo.newSrc;
  imageHtml.children[0].children[1].children[0].innerHTML = imageInfo.name;
  imageHtml.children[0].children[1].children[1].innerHTML = `${imageInfo.width} x ${imageInfo.height} px, ${imageInfo.size} MB`;
  imageHtml.children[0].children[1].children[3].innerHTML = `${imageInfo.newWidth} x ${imageInfo.newHeight} px, ${imageInfo.newSize} MB (${percent}%)`;

  imageHtml.classList.remove('d-none');
  compressedDiv.prepend(imageHtml);
}

async function imageResolution(file) {
  return new Promise((resolve, reject) => {
    var img = new Image();
    img.src = window.URL.createObjectURL(file);
    img.onload = function () {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
        src: img.src,
        size: (file.size / 1024 / 1024).toFixed(2)
      });
    };
    img.onerror = function () {
      reject(false);
    };
  });
}

async function downloadImages() {
  if (images.length > 0 && images.length < 2) {
    downloadSingleImage(images[0]);
  } else if (images.length > 1) {
    // code to download zip
    var zip = new JSZip();
    
    for await (const image of images) {
      const res = await fetch(image.newSrc);
      const blob = await res.blob();
      zip.file(image.name, blob, {blob: true});
    }
    
    zip.generateAsync({ type: "blob" }).then(function(content) {
      saveAs(content, "compressed.zip");
    });
  }
}

function downloadSingleImage(image) {
  const a = document.createElement("a");
  a.href = image.newSrc;
  a.target = "_blank";
  a.download = image.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
