declare module 'vanta/dist/vanta.net.min' {
  export default function NET(options: {
    el: string | HTMLElement;
    THREE?: any;
    mouseControls?: boolean;
    touchControls?: boolean;
    gyroControls?: boolean;
    minHeight?: number;
    minWidth?: number;
    scale?: number;
    scaleMobile?: number;
    color?: number;
    backgroundColor?: number;
    points?: number;
    maxDistance?: number;
    spacing?: number;
  }): {
    destroy: () => void;
    resize: () => void;
  };
}
