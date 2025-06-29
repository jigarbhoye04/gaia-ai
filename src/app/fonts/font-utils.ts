// Font utility classes for Tailwind CSS
// This file provides easy-to-use class names for all font families

// Font family classes
export const fontClasses = {
  // Display fonts
  display: {
    sf: "font-sf-pro-display",
    switzer: "font-switzer",
    creato: "font-creato",
    inter: "font-inter",
  },
  // Text fonts
  text: {
    sf: "font-sf-pro-text",
    switzer: "font-switzer", // Using the same for display and text since Switzer is a variable font
    creato: "font-creato", // Using the same for display and text until dedicated text variant is available
    inter: "font-inter", // Inter is a variable font that works well for both display and text
  },
};

// Usage examples in components:
//
// 1. Using SF Pro:
// <h1 className={fontClasses.display.sf}>Heading with SF Pro Display</h1>
// <p className={fontClasses.text.sf}>Body text with SF Pro Text</p>
//
// 2. Using Switzer:
// <h1 className={fontClasses.display.switzer}>Heading with Switzer</h1>
// <p className={fontClasses.text.switzer}>Body text with Switzer</p>
//
// 3. Using Creato:
// <h1 className={fontClasses.display.creato}>Heading with Creato</h1>
// <p className={fontClasses.text.creato}>Body text with Creato</p>
