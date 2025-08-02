import React from 'react';

// Define the props for the component
interface StartedButtonProps {
  /**
   * The text to display inside the button.
   */
  buttonText?: string;
  /**
   * The primary color for the button's background and accents.
   * Defaults to a lime green color.
   */
  primaryColor?: string;
  /**
   * The color of the button text.
   * Defaults to white.
   */
  textColor?: string;
  /**
   * The background and border color of the main button frame.
   * Defaults to black.
   */
  frameColor?: string;
  /**
   * Optional click handler for the button.
   */
  onClick?: () => void;
}

/**
 * A reusable button component styled with Tailwind CSS, inspired by the Framer design.
 */
const StartedButton: React.FC<StartedButtonProps> = ({
  buttonText = 'Book a demo',
  primaryColor = 'rgb(210, 255, 76)',
  textColor = 'rgb(255, 255, 255)',
  frameColor = 'rgb(0, 0, 0)',
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      style={{ backgroundColor: frameColor }}
      className="
        relative h-full w-full rounded-lg cursor-pointer 
        overflow-hidden transition-transform duration-150 ease-in-out 
        active:scale-95
      "
    >
      {/* The animated dots background */}
      <div
        style={{ backgroundColor: primaryColor }}
        className="
          absolute inset-0 rounded-md m-1 p-2 flex 
          justify-around transition-filter duration-150 ease-in-out 
          hover:brightness-110
        "
      >
        {/* We'll just create one set of dots and let flexbox space them out */}
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex flex-col justify-between">
            {/* Top Dot */}
            <div className="relative w-2 h-2 rounded-full">
              <div className="absolute inset-0 bg-black/20 rounded-full"></div>
              <div
                style={{ backgroundColor: frameColor }}
                className="absolute inset-0 rounded-full"
              ></div>
            </div>
            {/* Bottom Dot */}
            <div className="relative w-2 h-2 rounded-full">
              <div className="absolute inset-0 bg-black/20 rounded-full"></div>
              <div
                style={{ backgroundColor: frameColor }}
                className="absolute inset-0 rounded-full"
              ></div>
            </div>
          </div>
        ))}
      </div>

      {/* The button text, centered on top */}
      <div className="absolute inset-0 flex justify-center items-center">
        <p style={{ color: textColor }} className="font-semibold text-center">
          {buttonText}
        </p>
      </div>
    </div>
  );
};

export default StartedButton;