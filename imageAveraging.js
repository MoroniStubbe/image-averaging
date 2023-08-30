//load images
var imageURLs = [];
var canvasInput = document.getElementById('canvasInput');
var ctxInput = canvasInput.getContext('2d');
var canvasOutput = document.getElementById('canvasOutput');
var ctxOutput = canvasOutput.getContext('2d');
var statusElement = document.getElementById('status');

function onInput(e) {
    imageURLs = [];
    for (var i = 0; i < this.files.length; i++) { imageURLs.push(URL.createObjectURL(this.files[i])); }
}

document.getElementById('input').onchange = onInput;

//generate average image
function draw(imageURL, afterLoad = function (args2) { }, args2 = []) {
    var img = new Image();
    img.onload = function (args, args2 = []) {
        canvasInput.width = this.width;
        canvasInput.height = this.height;
        ctxInput.drawImage(this, 0, 0);
        afterLoad(args2);
    }
    img.src = imageURL;
}

function divideImage(image, imageCount) {
    for (var i = 0; i < image.length; i++) {
        rgba = Math.round(image[i] / imageCount);
        if (rgba > 255) { rgba = 255; }
        image[i] = rgba;
    }
    return image;
}

function imageSum(image1, image2) {
    summedImage = [];
    //for each rgba
    for (var i = 0; i < image1.length; i++) { image1[i] = image1[i] + image2[i]; }
    return image1;
}

function average() {
    console.log("started averaging");
    statusElement.innerHTML = "started averaging";
    var summedImage;
    var image2;
    var imageIndex = 0;
    //get max chunk height
    //max array length = 112813858, /4 = 28203464 pixels
    var maxChunkHeight;
    var lastChunkHeight;
    var chunkCount;
    var h1;
    var h2;

    var chunkIndex = 0;
    function afterLoad(args, args2 = []) {
        if (imageIndex == 0 && chunkIndex == 0) {
            maxChunkHeight = Math.floor(28203464 / canvasInput.width);
            lastChunkHeight = canvasInput.height % maxChunkHeight;
            chunkCount = Math.ceil(canvasInput.height / maxChunkHeight);
        }
        if (imageIndex < imageURLs.length) {
            h1 = chunkIndex * maxChunkHeight;
            if (chunkIndex != (chunkCount - 1)) { h2 = maxChunkHeight; }
            else { h2 = lastChunkHeight; }

            if (imageIndex == 0) {
                var summedImage2 = ctxInput.getImageData(0, h1, canvasInput.width, h2).data;
                summedImage = [];
                //convert to array
                for (var rgbaIndex = 0; rgbaIndex < summedImage2.length; rgbaIndex++) { summedImage[rgbaIndex] = summedImage2[rgbaIndex]; }
            }
            else {
                image2 = ctxInput.getImageData(0, h1, canvasInput.width, h2);
                summedImage = imageSum(summedImage, image2.data);
                console.log("summed image " + imageIndex.toString());
                statusElement.innerHTML = "summed image " + imageIndex.toString();
            }

            imageIndex++;
            if (imageIndex < imageURLs.length) {
                //load next image
                draw(imageURLs[imageIndex], afterLoad, imageIndex);
            }
            else {
                //if all images summed
                //copy summedImage to image2 and put on canvasOutput
                summedImage = divideImage(summedImage, imageURLs.length)
                for (var rgbaIndex = 0; rgbaIndex < summedImage.length; rgbaIndex++) { image2.data[rgbaIndex] = summedImage[rgbaIndex]; }
                if (chunkIndex == 0) {
                    canvasOutput.width = canvasInput.width;
                    canvasOutput.height = canvasInput.height;
                }
                ctxOutput.putImageData(image2, 0, h1);

                //next chunk
                chunkIndex++;
                if (chunkIndex < chunkCount) {
                    console.log("finished chunk " + chunkIndex.toString() + ' of ' + chunkCount.toString());
                    statusElement.innerHTML = "finished chunk " + chunkIndex.toString() + ' of ' + chunkCount.toString();
                    imageIndex = 0;
                    draw(imageURLs[imageIndex], afterLoad);
                }
                else {
                    var dl = document.getElementById('download');
                    dl.href = canvasOutput.toDataURL("image/png");
                    dl.style.visibility = "visible";
                    console.log("finished averaging");
                    statusElement.innerHTML = "finished averaging";
                }
            }
        }
    }
    draw(imageURLs[imageIndex], afterLoad);
}