interface CameraOption {
  name: string;
  description: string;
  previewUrl: string;
  tags: string[];
}

export const CAMERA_OPTIONS: CameraOption[] = [
  {
    name: "100mm Lens",
    description: "A telephoto lens for capturing portraits and distant subjects with stunning background blur.",
    previewUrl: "https://imiprompt.com/_filters/100mm.png",
    tags: ["telephoto", "portrait", "sharp focus"]
  },
  {
    name: "14mm Lens",
    description: "A wide-angle lens ideal for capturing expansive landscapes and architectural shots.",
    previewUrl: "https://imiprompt.com/_filters/14mm.png",
    tags: ["wide-angle", "landscape", "distortion"]
  },
  {
    name: "16k Resolution",
    description: "Ultra-high resolution option for creating highly detailed and crisp images.",
    previewUrl: "https://imiprompt.com/_filters/16k.png",
    tags: ["high resolution", "detail", "ultra-HD"]
  },
  {
    name: "24mm Lens",
    description: "A versatile wide-angle lens suitable for capturing immersive scenes.",
    previewUrl: "https://imiprompt.com/_filters/24mm.png",
    tags: ["wide-angle", "immersive", "landscape"]
  },
  {
    name: "300mm Lens",
    description: "A super-telephoto lens perfect for wildlife and sports photography.",
    previewUrl: "https://imiprompt.com/_filters/300mm.png",
    tags: ["telephoto", "wildlife", "sports"]
  },
  {
    name: "32k Resolution",
    description: "Maximum resolution for capturing immense detail.",
    previewUrl: "https://imiprompt.com/_filters/32k.png",
    tags: ["ultra-HD", "large print", "detailed"]
  },
  {
    name: "35mm Lens",
    description: "A classic lens for street and documentary photography.",
    previewUrl: "https://imiprompt.com/_filters/35mm.png",
    tags: ["natural perspective", "street", "documentary"]
  },
  {
    name: "400mm Lens",
    description: "An ultra-telephoto lens for sports and wildlife photography.",
    previewUrl: "https://imiprompt.com/_filters/400mm.png",
    tags: ["ultra-telephoto", "wildlife", "sports"]
  },
  {
    name: "4k Resolution",
    description: "High-definition resolution for clear images.",
    previewUrl: "https://imiprompt.com/_filters/4k.png",
    tags: ["HD", "clarity", "digital"]
  },
  {
    name: "500mm Lens",
    description: "A super-telephoto lens for distant subjects.",
    previewUrl: "https://imiprompt.com/_filters/500mm.png",
    tags: ["telephoto", "distant", "wildlife"]
  },
  {
    name: "600mm Lens",
    description: "A powerful lens ideal for wildlife photography.",
    previewUrl: "https://imiprompt.com/_filters/600mm.png",
    tags: ["wildlife", "sports", "telephoto"]
  },
  {
    name: "85mm Lens",
    description: "A portrait lens known for beautiful bokeh.",
    previewUrl: "https://imiprompt.com/_filters/85mm.png",
    tags: ["portrait", "bokeh", "sharp focus"]
  },
  {
    name: "8k Resolution",
    description: "High-resolution option for detailed imagery.",
    previewUrl: "https://imiprompt.com/_filters/8k.png",
    tags: ["high resolution", "clarity", "detailed"]
  },
  {
    name: "Aerial Photography",
    description: "Capturing images from aerial perspectives.",
    previewUrl: "https://imiprompt.com/_filters/aerial-photography.png",
    tags: ["drone", "landscape", "elevated"]
  },
  {
    name: "Closeup Photography",
    description: "Detailed shots focusing on small subjects.",
    previewUrl: "https://imiprompt.com/_filters/closeup.png",
    tags: ["macro", "detailed", "sharp"]
  },
  {
    name: "Drone Photography",
    description: "Aerial photography using drones.",
    previewUrl: "https://imiprompt.com/_filters/drone-photography.png",
    tags: ["aerial", "landscape", "modern"]
  },
  {
    name: "Far Shot",
    description: "Capturing distant subjects in the frame.",
    previewUrl: "https://imiprompt.com/_filters/far-shot.png",
    tags: ["landscape", "distance", "scenery"]
  },
  {
    name: "Portrait Photography",
    description: "Capturing the subject's essence and personality.",
    previewUrl: "https://imiprompt.com/_filters/portrait-photography.png",
    tags: ["portrait", "personality", "sharp focus"]
  },
  {
    name: "Tilt-Shift",
    description: "Creates a miniature effect by tilting focus.",
    previewUrl: "https://imiprompt.com/_filters/tiltshift.png",
    tags: ["creative", "blur", "miniature"]
  },
  {
    name: "Top Down Shot",
    description: "Images taken from directly above.",
    previewUrl: "https://imiprompt.com/_filters/top-down-shot.png",
    tags: ["overhead", "flat lay", "bird's eye"]
  },
  {
    name: "Focal Blur",
    description: "A technique used to blur specific areas while keeping the subject sharp.",
    previewUrl: "https://imiprompt.com/_filters/focal-blur.png",
    tags: ["blur", "focus", "depth"]
  },
  {
    name: "Full Body Shot",
    description: "Capturing the subject's entire body, providing context and environment.",
    previewUrl: "https://imiprompt.com/_filters/full-body-shot.png",
    tags: ["portrait", "fashion", "context"]
  }
]; 