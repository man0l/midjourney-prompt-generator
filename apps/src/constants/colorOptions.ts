interface ColorOption {
  name: string;
  previewUrl: string;
  category: 'basic' | 'extended';
}

export const COLOR_OPTIONS: ColorOption[] = [
  // Basic Colors
  {
    name: "White",
    previewUrl: "https://raw.githubusercontent.com/willwulfken/MidJourney-Styles-and-Keywords-Reference/main/Images/MJ_V5/V5_Alpha_1/Midjourney_Styles/Colors/White/White.webp",
    category: "basic"
  },
  {
    name: "Black",
    previewUrl: "https://raw.githubusercontent.com/willwulfken/MidJourney-Styles-and-Keywords-Reference/main/Images/MJ_V5/V5_Alpha_1/Midjourney_Styles/Colors/Black/Black.webp",
    category: "basic"
  },
  {
    name: "Brown",
    previewUrl: "https://raw.githubusercontent.com/willwulfken/MidJourney-Styles-and-Keywords-Reference/main/Images/MJ_V5/V5_Alpha_1/Midjourney_Styles/Colors/Brown/Brown.webp",
    category: "basic"
  },
  {
    name: "Light Gray",
    previewUrl: "https://raw.githubusercontent.com/willwulfken/MidJourney-Styles-and-Keywords-Reference/main/Images/MJ_V5/V5_Alpha_1/Midjourney_Styles/Colors/Gray/Light-Gray.webp",
    category: "basic"
  },
  {
    name: "Gray",
    previewUrl: "https://raw.githubusercontent.com/willwulfken/MidJourney-Styles-and-Keywords-Reference/main/Images/MJ_V5/V5_Alpha_1/Midjourney_Styles/Colors/Gray/Gray.webp",
    category: "basic"
  },
  {
    name: "Dark Gray",
    previewUrl: "https://raw.githubusercontent.com/willwulfken/MidJourney-Styles-and-Keywords-Reference/main/Images/MJ_V5/V5_Alpha_1/Midjourney_Styles/Colors/Gray/Dark-Gray.webp",
    category: "basic"
  },
  {
    name: "Maroon",
    previewUrl: "https://raw.githubusercontent.com/willwulfken/MidJourney-Styles-and-Keywords-Reference/main/Images/MJ_V5/V5_Alpha_1/Midjourney_Styles/Colors/Red/Maroon/Maroon.webp",
    category: "basic"
  },
  {
    name: "Red",
    previewUrl: "https://raw.githubusercontent.com/willwulfken/MidJourney-Styles-and-Keywords-Reference/main/Images/MJ_V5/V5_Alpha_1/Midjourney_Styles/Colors/Red/Red.webp",
    category: "basic"
  },
  {
    name: "Orange",
    previewUrl: "https://raw.githubusercontent.com/willwulfken/MidJourney-Styles-and-Keywords-Reference/main/Images/MJ_V5/V5_Alpha_1/Midjourney_Styles/Colors/Orange/Orange.webp",
    category: "basic"
  },
  {
    name: "Yellow",
    previewUrl: "https://raw.githubusercontent.com/willwulfken/MidJourney-Styles-and-Keywords-Reference/main/Images/MJ_V5/V5_Alpha_1/Midjourney_Styles/Colors/Yellow/Yellow.webp",
    category: "basic"
  },
  {
    name: "Lime",
    previewUrl: "https://raw.githubusercontent.com/willwulfken/MidJourney-Styles-and-Keywords-Reference/main/Images/MJ_V5/V5_Alpha_1/Midjourney_Styles/Colors/Green/Lime/Lime.webp",
    category: "basic"
  },
  {
    name: "Green",
    previewUrl: "https://raw.githubusercontent.com/willwulfken/MidJourney-Styles-and-Keywords-Reference/main/Images/MJ_V5/V5_Alpha_1/Midjourney_Styles/Colors/Green/Green.webp",
    category: "basic"
  },
  {
    name: "Cyan",
    previewUrl: "https://raw.githubusercontent.com/willwulfken/MidJourney-Styles-and-Keywords-Reference/main/Images/MJ_V5/V5_Alpha_1/Midjourney_Styles/Colors/Blue/Cyan/Cyan.webp",
    category: "basic"
  },
  {
    name: "Teal",
    previewUrl: "https://raw.githubusercontent.com/willwulfken/MidJourney-Styles-and-Keywords-Reference/main/Images/MJ_V5/V5_Alpha_1/Midjourney_Styles/Colors/Teal/Teal.webp",
    category: "basic"
  },
  {
    name: "Blue",
    previewUrl: "https://raw.githubusercontent.com/willwulfken/MidJourney-Styles-and-Keywords-Reference/main/Images/MJ_V5/V5_Alpha_1/Midjourney_Styles/Colors/Blue/Blue.webp",
    category: "basic"
  },
  {
    name: "Indigo",
    previewUrl: "https://raw.githubusercontent.com/willwulfken/MidJourney-Styles-and-Keywords-Reference/main/Images/MJ_V5/V5_Alpha_1/Midjourney_Styles/Colors/Blue/Indigo/Indigo.webp",
    category: "basic"
  },
  {
    name: "Purple",
    previewUrl: "https://raw.githubusercontent.com/willwulfken/MidJourney-Styles-and-Keywords-Reference/main/Images/MJ_V5/V5_Alpha_1/Midjourney_Styles/Colors/Purple/Purple.webp",
    category: "basic"
  },
  {
    name: "Violet",
    previewUrl: "https://raw.githubusercontent.com/willwulfken/MidJourney-Styles-and-Keywords-Reference/main/Images/MJ_V5/V5_Alpha_1/Midjourney_Styles/Colors/Violet/Violet.webp",
    category: "basic"
  },
  {
    name: "Fuchsia",
    previewUrl: "https://raw.githubusercontent.com/willwulfken/MidJourney-Styles-and-Keywords-Reference/main/Images/MJ_V5/V5_Alpha_1/Midjourney_Styles/Colors/Pink/Fuchsia/Fuchsia.webp",
    category: "basic"
  },
  {
    name: "Magenta",
    previewUrl: "https://raw.githubusercontent.com/willwulfken/MidJourney-Styles-and-Keywords-Reference/main/Images/MJ_V5/V5_Alpha_1/Midjourney_Styles/Colors/Magenta/Magenta.webp",
    category: "basic"
  },
  {
    name: "Pink",
    previewUrl: "https://raw.githubusercontent.com/willwulfken/MidJourney-Styles-and-Keywords-Reference/main/Images/MJ_V5/V5_Alpha_1/Midjourney_Styles/Colors/Pink/Pink.webp",
    category: "basic"
  },

  // Extended Colors
  {
    name: "Tan",
    previewUrl: "https://raw.githubusercontent.com/willwulfken/MidJourney-Styles-and-Keywords-Reference/main/Images/MJ_V5/V5_Alpha_1/Midjourney_Styles/Colors/Brown/Tan/Tan.webp",
    category: "extended"
  },
  {
    name: "Beige",
    previewUrl: "https://raw.githubusercontent.com/willwulfken/MidJourney-Styles-and-Keywords-Reference/main/Images/MJ_V5/V5_Alpha_1/Midjourney_Styles/Colors/Brown/Beige/Beige.webp",
    category: "extended"
  },
  {
    name: "Blush",
    previewUrl: "https://raw.githubusercontent.com/willwulfken/MidJourney-Styles-and-Keywords-Reference/main/Images/MJ_V5/V5_Alpha_1/Midjourney_Styles/Colors/Pink/Blush/Blush.webp",
    category: "extended"
  },
  {
    name: "Scarlet",
    previewUrl: "https://raw.githubusercontent.com/willwulfken/MidJourney-Styles-and-Keywords-Reference/main/Images/MJ_V5/V5_Alpha_1/Midjourney_Styles/Colors/Red/Scarlet.webp",
    category: "extended"
  },
  {
    name: "Olive Green",
    previewUrl: "https://raw.githubusercontent.com/willwulfken/MidJourney-Styles-and-Keywords-Reference/main/Images/MJ_V5/V5_Alpha_1/Midjourney_Styles/Colors/Green/Olive/Olive-Green.webp",
    category: "extended"
  },
  {
    name: "Chartreuse",
    previewUrl: "https://raw.githubusercontent.com/willwulfken/MidJourney-Styles-and-Keywords-Reference/main/Images/MJ_V5/V5_Alpha_1/Midjourney_Styles/Colors/Green/Chartreuse.webp",
    category: "extended"
  },
  {
    name: "Turquoise",
    previewUrl: "https://raw.githubusercontent.com/willwulfken/MidJourney-Styles-and-Keywords-Reference/main/Images/MJ_V5/V5_Alpha_1/Midjourney_Styles/Colors/Teal/Turquoise/Turquoise.webp",
    category: "extended"
  },
  {
    name: "Aqua",
    previewUrl: "https://raw.githubusercontent.com/willwulfken/MidJourney-Styles-and-Keywords-Reference/main/Images/MJ_V5/V5_Alpha_1/Midjourney_Styles/Colors/Blue/Aqua/Aqua.webp",
    category: "extended"
  },
  {
    name: "Azure",
    previewUrl: "https://raw.githubusercontent.com/willwulfken/MidJourney-Styles-and-Keywords-Reference/main/Images/MJ_V5/V5_Alpha_1/Midjourney_Styles/Colors/Blue/Azure/Azure.webp",
    category: "extended"
  }
]; 