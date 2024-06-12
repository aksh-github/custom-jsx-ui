// import CryptoJS from "crypto-js";

// const kp = "84cfeb6";
const kp = "30269de";

export const encryptText = (plainData, key) => {
  return CryptoJS.AES.encrypt(plainData, key).toString();
};

export const decryptText = (ciphertext, key) => {
  const bytes = CryptoJS.AES.decrypt(ciphertext, key);
  return bytes.toString(CryptoJS.enc.Utf8);
};

export function generateCaptcha() {
  let uniquechar = "";

  const randomchar =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  // Generate captcha for length of
  // 5 with random character
  for (let i = 1; i < 6; i++) {
    uniquechar += randomchar.charAt(Math.random() * randomchar.length);
  }

  return uniquechar;
}

export function saveBase64AsFile(base64, fileName) {
  var link = document.createElement("a");

  document.body.appendChild(link); // for Firefox

  link.setAttribute("href", base64);
  link.setAttribute("download", fileName);
  link.click();
}

// file utils
// https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file#unique_file_type_specifiers
const fileTypes = [
  "image/apng",
  "image/bmp",
  "image/gif",
  "image/jpeg",
  "image/pjpeg",
  "image/png",
  "image/svg+xml",
  "image/tiff",
  "image/webp",
  "image/x-icon",
];

export function validFileType(file) {
  return fileTypes.includes(file.type);
}

export function getFileSize(number) {
  if (number < 1024) {
    return number + "bytes";
  } else if (number >= 1024 && number < 1048576) {
    return (number / 1024).toFixed(1) + "KB";
  } else if (number >= 1048576) {
    return (number / 1048576).toFixed(1) + "MB";
  }
}

export function getImageDimensions(image) {
  return new Promise((resolve, reject) => {
    image.onload = function () {
      const width = this.width;
      const height = this.height;
      resolve({ height, width });
    };
  });
}

export function compressImage(image, scale, initalWidth, initalHeight) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");

    canvas.width = scale * initalWidth;
    canvas.height = scale * initalHeight;

    const ctx = canvas.getContext("2d");
    ctx?.drawImage(image, 0, 0, canvas.width, canvas.height);

    ctx?.canvas.toBlob((blob) => {
      resolve(blob);
    }, "image/png");
  });
}

// file utils end
