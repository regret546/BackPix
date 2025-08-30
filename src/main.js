import "./style.css";

// Mobile Menu Functionality
document.addEventListener("DOMContentLoaded", function () {
  const mobileMenuButton = document.getElementById("mobile-menu-button");
  const mobileMenu = document.getElementById("mobile-menu");
  const mobileMenuOverlay = document.getElementById("mobile-menu-overlay");
  const mobileMenuClose = document.getElementById("mobile-menu-close");
  const hamburgerLines = document.querySelectorAll(".hamburger-line");

  // Function to open mobile menu
  function openMobileMenu() {
    mobileMenu.classList.remove("translate-x-full");
    mobileMenuOverlay.classList.remove("hidden");
    document.body.classList.add("menu-open");

    // Animate hamburger to X
    hamburgerLines[0].style.transform = "rotate(45deg) translate(5px, 5px)";
    hamburgerLines[1].style.opacity = "0";
    hamburgerLines[2].style.transform = "rotate(-45deg) translate(7px, -6px)";
  }

  // Function to close mobile menu
  function closeMobileMenu() {
    mobileMenu.classList.add("translate-x-full");
    mobileMenuOverlay.classList.add("hidden");
    document.body.classList.remove("menu-open");

    // Reset hamburger animation
    hamburgerLines[0].style.transform = "none";
    hamburgerLines[1].style.opacity = "1";
    hamburgerLines[2].style.transform = "none";
  }

  // Event listeners
  mobileMenuButton.addEventListener("click", openMobileMenu);
  mobileMenuClose.addEventListener("click", closeMobileMenu);
  mobileMenuOverlay.addEventListener("click", closeMobileMenu);

  // Close menu when clicking on menu links
  const menuLinks = document.querySelectorAll("#mobile-menu a");
  menuLinks.forEach((link) => {
    link.addEventListener("click", closeMobileMenu);
  });

  // Close menu on escape key
  document.addEventListener("keydown", function (e) {
    if (
      e.key === "Escape" &&
      !mobileMenu.classList.contains("translate-x-full")
    ) {
      closeMobileMenu();
    }
  });
});

// Google Login Function (placeholder)
window.handleGoogleLogin = function () {
  console.log("Google login functionality to be implemented");
  alert("Google login functionality to be implemented");
};

// Dropzone Functionality
document.addEventListener("DOMContentLoaded", function () {
  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("file-input");
  const browseButton = document.querySelector(".browse-button");
  const uploadProgress = document.getElementById("upload-progress");
  const progressBar = document.getElementById("progress-bar");
  const progressPercentage = document.getElementById("progress-percentage");
  const previewArea = document.getElementById("preview-area");
  const imagePreviews = document.getElementById("image-previews");
  const promptSection = document.getElementById("prompt-section");
  const transformButton = document.getElementById("transform-button");

  let uploadedFiles = [];
  const MAX_FILES = 3;

  // File validation
  function validateFile(file) {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      alert("Please upload only image files (JPG, PNG, GIF, WebP)");
      return false;
    }

    if (file.size > maxSize) {
      alert("File size must be less than 10MB");
      return false;
    }

    return true;
  }

  // Update dropzone state based on file count
  function updateDropzoneState() {
    const dropzoneContent = document.querySelector(".dropzone-content");
    const fileCountInfo = document.getElementById("file-count-info");

    if (uploadedFiles.length >= MAX_FILES) {
      dropzone.classList.add("disabled");
      dropzoneContent.innerHTML = `
        <div class="dropzone-icon">
          <svg class="w-12 h-12 text-neutral-medium-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <h3 class="text-xl font-semibold text-brand-dark-navy mb-2">Maximum images uploaded</h3>
        <p class="text-neutral-medium-gray mb-4">You can upload up to ${MAX_FILES} images</p>
        <p class="text-sm text-neutral-medium-gray">Remove an image to upload more</p>
      `;
    } else {
      dropzone.classList.remove("disabled");
      dropzoneContent.innerHTML = `
        <div class="dropzone-icon">
          <svg class="w-12 h-12 text-neutral-medium-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
          </svg>
        </div>
        <h3 class="text-xl font-semibold text-brand-dark-navy mb-2">Drop your image here</h3>
        <p class="text-neutral-medium-gray mb-4">or click to browse files</p>
        <button class="browse-button">Browse Files</button>
        <p class="text-sm text-neutral-medium-gray mt-3">
          Supports: JPG, PNG, GIF, WebP (Max 10MB) • ${uploadedFiles.length}/${MAX_FILES} images
        </p>
      `;

      // Browse button click will be handled by event delegation below
    }
  }

  // Format file size
  function formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  // Create image preview
  function createImagePreview(file, index) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const previewDiv = document.createElement("div");
      previewDiv.className = "image-preview";
      previewDiv.innerHTML = `
        <img src="${e.target.result}" alt="${file.name}">
        <div class="image-preview-info">
          <div class="image-preview-name">${file.name}</div>
          <div class="image-preview-size">${formatFileSize(file.size)}</div>
        </div>
        <button class="image-preview-remove" onclick="removeImage(${index})" title="Remove image">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      `;
      imagePreviews.appendChild(previewDiv);
    };
    reader.readAsDataURL(file);
  }

  // Remove image
  window.removeImage = function (index) {
    uploadedFiles.splice(index, 1);
    updatePreviews();
    updateDropzoneState();

    if (uploadedFiles.length === 0) {
      previewArea.classList.add("hidden");
      promptSection.classList.add("hidden");
    }
  };

  // Update previews after removal
  function updatePreviews() {
    imagePreviews.innerHTML = "";
    uploadedFiles.forEach((file, index) => {
      createImagePreview(file, index);
    });
  }

  // Handle file selection
  function handleFiles(files) {
    const validFiles = Array.from(files).filter(validateFile);

    if (validFiles.length === 0) return;

    // Check if adding these files would exceed the limit
    const remainingSlots = MAX_FILES - uploadedFiles.length;
    if (remainingSlots === 0) {
      alert(
        `Maximum of ${MAX_FILES} images allowed. Please remove some images first.`
      );
      return;
    }

    // If trying to upload more files than remaining slots, take only what fits
    const filesToUpload = validFiles.slice(0, remainingSlots);

    if (validFiles.length > remainingSlots) {
      alert(
        `You can only upload ${remainingSlots} more image(s). Only the first ${remainingSlots} file(s) will be uploaded.`
      );
    }

    // Simulate upload progress
    uploadProgress.classList.remove("hidden");
    progressBar.style.width = "0%";
    progressPercentage.textContent = "0%";

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);

        // Add files to uploaded files array
        uploadedFiles.push(...filesToUpload);

        // Show previews and prompt section
        previewArea.classList.remove("hidden");
        promptSection.classList.remove("hidden");

        // Update dropzone state
        updateDropzoneState();

        // Create previews
        filesToUpload.forEach((file, index) => {
          createImagePreview(
            file,
            uploadedFiles.length - filesToUpload.length + index
          );
        });

        // Hide progress after a short delay
        setTimeout(() => {
          uploadProgress.classList.add("hidden");
        }, 500);
      }

      progressBar.style.width = `${Math.min(progress, 100)}%`;
      progressPercentage.textContent = `${Math.round(
        Math.min(progress, 100)
      )}%`;
    }, 100);
  }

  // Prevent default drag behaviors on document
  document.addEventListener("dragover", (e) => {
    e.preventDefault();
  });

  document.addEventListener("drop", (e) => {
    e.preventDefault();
  });

  // Drag and drop events for dropzone
  dropzone.addEventListener("dragenter", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (uploadedFiles.length < MAX_FILES) {
      dropzone.classList.add("dragover");
    }
  });

  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (uploadedFiles.length < MAX_FILES) {
      dropzone.classList.add("dragover");
    }
  });

  dropzone.addEventListener("dragleave", (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Only remove dragover if we're leaving the dropzone completely
    if (!dropzone.contains(e.relatedTarget)) {
      dropzone.classList.remove("dragover");
    }
  });

  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.remove("dragover");
    if (uploadedFiles.length < MAX_FILES) {
      const files = e.dataTransfer.files;
      handleFiles(files);
    }
  });

  // Use event delegation for browse button clicks (handles dynamically created buttons)
  dropzone.addEventListener("click", (e) => {
    if (uploadedFiles.length < MAX_FILES) {
      // Handle browse button clicks
      if (e.target.classList.contains("browse-button")) {
        e.preventDefault();
        e.stopPropagation();
        fileInput.click();
        return;
      }

      // Handle general dropzone clicks
      if (e.target === dropzone || e.target.closest(".dropzone-content")) {
        fileInput.click();
      }
    }
  });

  // File input change
  fileInput.addEventListener("change", (e) => {
    handleFiles(e.target.files);
    // Clear the input so the same files can be selected again if needed
    e.target.value = "";
  });

  // Initialize dropzone state
  updateDropzoneState();

  // Transform button functionality
  transformButton.addEventListener("click", () => {
    const prompt = document.getElementById("image-prompt").value.trim();

    if (!prompt) {
      alert("Please enter a description for your image transformation");
      return;
    }

    if (uploadedFiles.length === 0) {
      alert("Please upload at least one image");
      return;
    }

    // Placeholder for transformation logic
    console.log("Transform images with prompt:", prompt);
    console.log("Files to transform:", uploadedFiles);
    alert(
      `Transformation requested!\nPrompt: "${prompt}"\nImages: ${uploadedFiles.length}\n\n(This is a placeholder - actual AI transformation would happen here)`
    );
  });
});
